import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@components/Button';
import { Checkbox } from '@components/Checkbox';
import { Radio } from '@components/Radio';
import { Icon } from '@components/icons';
import styles from './ClarifyCard.module.css';

// The clarifying question card, ported from the Spotter Refresh package.
//
// One card for the whole run: it pages between questions rather than being
// replaced by the next one. The frame, the question and the footer hold still
// while only the rows move, so it reads as one object changing its choices.
//
// What is ours rather than theirs, by decision:
//   • the counter sits in the header, right, per Figma 301:4441
//   • the footer's left slot carries "See all"
//   • a step can replace its rows with a body of its own — the style step is
//     three template cards, not a list, and every other picker is a row that
//     carries more than a label
//
// What is theirs, unchanged: the 40px row and its derived padding, the single
// tab stop with a roving cursor, the ⏎ hint and its mask, the row stagger, the
// page turn, the press dip, the empty-Next wiggle, and auto-advance.

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClarifyMode = 'single' | 'multi';

export interface ClarifyRow {
  id: string;
  label: string;
  /** Between the control and the label: a connector's logo, a format's drawing. */
  leading?: React.ReactNode;
  /** At the end of the row: a match pill, a Connected badge, a Connect button. */
  trailing?: React.ReactNode;
  /** The trailing content takes its own clicks — Connect connects rather than
   *  selecting the row it sits on. */
  trailingInteractive?: boolean;
  /** The leading mark is a picture rather than a glyph, so the row sizes to it
   *  instead of to a line of text. */
  tallLeading?: boolean;
}

export interface ClarifyStepView {
  id: string;
  question: string;
  mode: ClarifyMode;
  /** The rows to choose from. Omitted where the step brings its own body. */
  rows?: ClarifyRow[];
  /** Replaces the rows entirely. The step still owns the card's chrome. */
  body?: React.ReactNode;
  /** Appends the freeform row. Off where the answers are a closed set. */
  somethingElse?: boolean;
  /** Disables the primary action until something is chosen. */
  requireAnswer?: boolean;
}

export interface ClarifyAnswer {
  selected: string[];
  other?: string;
}

export interface ClarifyCardProps {
  steps: ClarifyStepView[];
  stepIndex: number;
  onStepIndex: (next: number) => void;
  answers: Record<string, ClarifyAnswer>;
  onAnswer: (stepId: string, answer: ClarifyAnswer) => void;
  /** Discards this step's answer. The card does the paging itself. */
  onSkip: (stepId: string) => void;
  /** The last step's primary action: the run is over. */
  onFinish: () => void;
  /** Footer left. "See all" everywhere it appears. */
  tertiaryLabel?: string;
  onTertiary?: () => void;
  /** Play the exit transition. The host keeps the card mounted for
   *  CLARIFY_EXIT_MS after setting this, then unmounts it. */
  leaving?: boolean;
}

// Row identity for the freeform option — kept out of the label namespace so a
// real option called "Something else…" could never collide with it.
const OTHER = ' other';
const OTHER_LABEL = 'Something else…';

// ── Motion ────────────────────────────────────────────────────────────────────
// Durations live here as well as in CSS because the host has to keep the card
// mounted for the exit before it unmounts it.

export const CLARIFY_EXIT_MS = 180;

const ROW_DELAY_BASE_MS = 100;
const ROW_DELAY_STEP_MS = 50;

const PAGE_OUT_MS = 80;
const PAGE_IN_MS = 150;
const PAGE_ROW_STEP_MS = 34;
const ROW_ANIM_MS = 180;

const PRESS_MS = 200;
const PRESS_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const PRESS_SCALE = 0.99;

const WIGGLE_MS = 360;
const WIGGLE_EASING = 'cubic-bezier(0.36, 0.07, 0.19, 0.97)';
const WIGGLE_KEYFRAMES: Keyframe[] = [
  { offset: 0, transform: 'translateX(0)' },
  { offset: 0.15, transform: 'translateX(-6px)' },
  { offset: 0.3, transform: 'translateX(5px)' },
  { offset: 0.45, transform: 'translateX(-4px)' },
  { offset: 0.6, transform: 'translateX(3px)' },
  { offset: 0.75, transform: 'translateX(-2px)' },
  { offset: 1, transform: 'translateX(0)' },
];

/** One answer per question, so picking it is the interaction. The beat lets the
 *  selection register before the page turns. */
const AUTO_ADVANCE_MS = 110;

/** The CSS media query cannot gate a scripted animation, so check it here. */
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One-shot pulses run through the Web Animations API rather than a CSS class,
 *  because selecting also re-renders the row — React rewrites className on that
 *  render, which would strip an imperatively added class and kill the animation
 *  in the same tick. An Animation lives on the element instead. */
const pulse = (
  el: HTMLElement | null | undefined,
  keyframes: Keyframe[],
  duration: number,
  easing: string,
  id: string,
) => {
  if (!el || reducedMotion()) return;
  el.getAnimations().forEach(a => { if (a.id === id) a.cancel(); });
  const anim = el.animate(keyframes, { duration, easing });
  anim.id = id;
};

const EMPTY: ClarifyAnswer = { selected: [] };

// ── Component ─────────────────────────────────────────────────────────────────

export const ClarifyCard: React.FC<ClarifyCardProps> = ({
  steps, stepIndex, onStepIndex, answers, onAnswer,
  onSkip, onFinish, tertiaryLabel, onTertiary, leaving,
}) => {
  const [rawCursor, setCursor] = useState(0);
  const [editingOther, setEditingOther] = useState(false);
  // Exactly one animation class is on a row at a time, and none once it settles:
  // a finished animation with fill:both keeps holding its transform, which would
  // block the press. 'settled' is a real state, not an absence.
  const [rowMotion, setRowMotion] = useState<'enter' | 'out' | 'in' | 'settled'>('enter');
  const [pageDir, setPageDir] = useState(1);

  const cardRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLSpanElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const pagingRef = useRef(false);
  const pageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => {
    clearTimeout(pageTimer.current);
    clearTimeout(autoTimer.current);
    clearTimeout(settleTimer.current);
  }, []);

  // Clamped at render time rather than reset in an effect: the step list can
  // change shape while a later index is live, and an effect only runs after the
  // render that would already have read past the end.
  const index = Math.max(0, Math.min(stepIndex, steps.length - 1));
  const step = steps[index];
  const answer = answers[step?.id ?? ''] ?? EMPTY;
  const isLast = index === steps.length - 1;

  const rows = useMemo<ClarifyRow[]>(() => {
    const base = step?.rows ?? [];
    return step?.somethingElse ? [...base, { id: OTHER, label: OTHER_LABEL }] : base;
  }, [step]);
  const cursor = Math.min(rawCursor, Math.max(0, rows.length - 1));

  const settleAfter = (ms: number) => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setRowMotion('settled'), ms);
  };

  // The entrance is a one-shot: drop the class once the last staggered row lands
  // so nothing is left holding a transform.
  useEffect(() => {
    settleAfter(ROW_DELAY_BASE_MS + Math.max(0, rows.length - 1) * ROW_DELAY_STEP_MS + ROW_ANIM_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editingOther) otherInputRef.current?.focus();
  }, [editingOther]);

  // An open but empty freeform row is not an answer, so it does not read as
  // selected and does not satisfy the primary action — typing is what selects it.
  const otherAnswered = !!answer.other && answer.other.trim().length > 0;
  const isChecked = (id: string) =>
    id === OTHER ? otherAnswered : answer.selected.includes(id);
  const selectedCount = answer.selected.length + (otherAnswered ? 1 : 0);

  const goToStep = (next: number) => {
    if (next < 0 || next > steps.length - 1) return;
    if (pagingRef.current) return; // ignore input mid-transition
    // Any page move cancels a pending auto-advance, so a Skip or a pager click
    // during that beat cannot be followed by a second, stale jump.
    clearTimeout(autoTimer.current);
    pagingRef.current = true;

    setPageDir(next > index ? 1 : -1);
    setRowMotion('out');
    clearTimeout(settleTimer.current);
    cardRef.current?.focus(); // focus should not wait on the animation

    pageTimer.current = setTimeout(() => {
      onStepIndex(next);
      setCursor(0);
      setEditingOther(false);
      setRowMotion('in');
      pagingRef.current = false;
      settleAfter(Math.max(0, rows.length - 1) * PAGE_ROW_STEP_MS + PAGE_IN_MS);
    }, PAGE_OUT_MS);
  };

  const toggle = (id: string) => {
    if (!step) return;
    if (id === OTHER) {
      const on = !(answer.other !== undefined);
      // Single select: choosing the freeform row clears the option answers.
      onAnswer(step.id, {
        selected: step.mode === 'single' ? [] : answer.selected,
        other: on ? (answer.other ?? '') : undefined,
      });
      setEditingOther(on);
      return;
    }
    if (step.mode === 'single') {
      onAnswer(step.id, { selected: [id] });
      setEditingOther(false);
      // Picking is the whole interaction, so the card turns rather than waiting
      // for Next. Forward only, and never off the last step, which still needs
      // an explicit press.
      if (!isLast) {
        clearTimeout(autoTimer.current);
        autoTimer.current = setTimeout(() => goToStep(index + 1), AUTO_ADVANCE_MS);
      }
      return;
    }
    onAnswer(step.id, {
      ...answer,
      selected: answer.selected.includes(id)
        ? answer.selected.filter(s => s !== id)
        : [...answer.selected, id],
    });
  };

  const pressRow = (i: number) => {
    // The freeform row opens a field instead of committing a choice, so there is
    // nothing for a press to confirm.
    if (rows[i]?.id === OTHER) return;
    const row = optionsRef.current?.children[i] as HTMLElement | undefined;
    pulse(
      row,
      [
        { transform: 'scale(1)' },
        { offset: 0.4, transform: `scale(${PRESS_SCALE})` },
        { transform: 'scale(1)' },
      ],
      PRESS_MS,
      PRESS_EASING,
      'cq-press',
    );
  };

  const nudge = () =>
    pulse(optionsRef.current, WIGGLE_KEYFRAMES, WIGGLE_MS, WIGGLE_EASING, 'cq-wiggle');

  const advance = () => {
    // Nothing picked where an answer is required: the primary action nudges the
    // options instead of moving on. Skip is the way past a question.
    if (step?.requireAnswer && selectedCount === 0) {
      nudge();
      return;
    }
    if (!isLast) goToStep(index + 1);
    else onFinish();
  };

  // Skip discards whatever is selected on this step before moving on, otherwise
  // a skipped answer would still ride along into the plan.
  const skip = () => {
    if (step) onSkip(step.id);
    if (!isLast) goToStep(index + 1);
    else onFinish();
  };

  // ── Keyboard ────────────────────────────────────────────────────────────────
  // The card is a single tab stop; the cursor roves with the arrow keys and
  // aria-activedescendant reports it.

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // While typing a freeform answer only Escape and Enter are ours.
    if (editingOther && e.target === otherInputRef.current) {
      if (e.key === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggle(OTHER);
        setEditingOther(false);
        cardRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        if (!rows.length) return;
        e.preventDefault();
        setCursor((cursor + 1) % rows.length);
        break;
      case 'ArrowUp':
        if (!rows.length) return;
        e.preventDefault();
        setCursor((cursor - 1 + rows.length) % rows.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToStep(index - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToStep(index + 1);
        break;
      case 'Enter':
      case ' ':
        if (!rows.length) return;
        e.preventDefault();
        pressRow(cursor);
        toggle(rows[cursor].id);
        break;
      default:
        break;
    }
  };

  if (!step) return null;
  const listId = 'clarify-options';

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${leaving ? styles.cardLeaving : styles.cardEnter}`}
      style={{ '--cq-page-dir': pageDir } as React.CSSProperties}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label={step.question}
    >
      {/* No dismiss control by design — the question is deliberate. The composer
          below still takes a reply, which abandons the run outright. */}
      <div className={styles.header}>
        <h3 className={styles.question}>{step.question}</h3>

        {steps.length > 1 && (
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pagerBtn}
              onClick={() => goToStep(index - 1)}
              disabled={index === 0}
              aria-label="Previous question"
            >
              <Icon name="chevron-left" size="xs" color="currentColor" />
            </button>
            <span className={styles.pagerCount}>
              {index + 1} of {steps.length}
            </span>
            <button
              type="button"
              className={styles.pagerBtn}
              onClick={() => goToStep(index + 1)}
              disabled={isLast}
              aria-label="Next question"
            >
              <Icon name="chevron-right" size="xs" color="currentColor" />
            </button>
          </div>
        )}
      </div>

      {step.body ? (
        <div className={styles.slot}>{step.body}</div>
      ) : (
        <div
          ref={optionsRef}
          className={styles.options}
          id={listId}
          role={step.mode === 'multi' ? 'listbox' : 'radiogroup'}
          aria-multiselectable={step.mode === 'multi' || undefined}
          aria-activedescendant={`${listId}-${cursor}`}
        >
          {rows.map((row, i) => {
            const isOther = row.id === OTHER;
            const checked = isChecked(row.id);
            const showInput = isOther && answer.other !== undefined;
            return (
              <div
                // The step id is in the key so the rows remount on a page change,
                // which is what replays the arrival animation.
                key={`${step.id}-${row.id}`}
                id={`${listId}-${i}`}
                className={[
                  styles.row,
                  cursor === i ? styles.rowActive : '',
                  row.trailing ? styles.rowHasTrailing : '',
                  row.tallLeading ? styles.rowMedia : '',
                  rowMotion === 'out'
                    ? styles.rowLeaving
                    : rowMotion === 'in'
                      ? styles.rowArriving
                      : rowMotion === 'enter'
                        ? styles.rowEnter
                        : '', /* settled — no animation, so the press owns the row */
                ].filter(Boolean).join(' ')}
                style={{
                  animationDelay:
                    rowMotion === 'out'
                      ? '0ms'
                      : rowMotion === 'in'
                        ? `${i * PAGE_ROW_STEP_MS}ms`
                        : `${ROW_DELAY_BASE_MS + i * ROW_DELAY_STEP_MS}ms`,
                }}
                role={step.mode === 'multi' ? 'option' : 'radio'}
                aria-selected={step.mode === 'multi' ? checked : undefined}
                aria-checked={step.mode === 'single' ? checked : undefined}
                onMouseEnter={() => setCursor(i)}
                onClick={() => {
                  setCursor(i);
                  // Clicking an already-open freeform row should put the caret in
                  // the field, not close it.
                  if (showInput) {
                    otherInputRef.current?.focus();
                    return;
                  }
                  pressRow(i);
                  toggle(row.id);
                }}
              >
                {/* Radiant control, box or circle only — inert keeps its input out
                    of the tab order and out of the click path, so the row owns
                    both. */}
                <div className={styles.control} inert>
                  {step.mode === 'multi' ? (
                    <Checkbox checked={checked} showLabel={false} label={row.label} />
                  ) : (
                    <Radio checked={checked} showLabel={false} label={row.label} />
                  )}
                </div>

                {row.leading && <span className={styles.leading}>{row.leading}</span>}

                {showInput ? (
                  <input
                    ref={otherInputRef}
                    className={styles.otherInput}
                    value={answer.other ?? ''}
                    placeholder={OTHER_LABEL}
                    onChange={e => onAnswer(step.id, { ...answer, other: e.target.value })}
                    onFocus={() => setEditingOther(true)}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className={`${styles.label}${isOther ? ` ${styles.labelMuted}` : ''}`}>
                    {row.label}
                  </span>
                )}

                {row.trailing && (
                  <span
                    className={styles.trailing}
                    onClick={row.trailingInteractive ? e => e.stopPropagation() : undefined}
                  >
                    {row.trailing}
                  </span>
                )}

                {/* Spells out what Enter does, on the row Enter would act on. */}
                {cursor === i && !row.trailing && (
                  <span className={styles.enterHint} aria-hidden="true">
                    <Icon name="enter" size="xs" color="currentColor" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.actions}>
        {tertiaryLabel ? (
          <Button variant="tertiary" size="basic" onClick={onTertiary}>
            {tertiaryLabel}
          </Button>
        ) : <span />}

        <div className={styles.actionsRight}>
          <Button variant="tertiary" size="basic" onClick={skip}>
            Skip
          </Button>
          <span ref={primaryRef} className={styles.primaryWrap}>
            {/* The last step ends the run rather than turning a page, and says
                so: Next promises another question. */}
            <Button variant="primary" size="basic" onClick={advance}>
              {isLast ? 'Submit' : 'Next'}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClarifyCard;
