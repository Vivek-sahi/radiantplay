import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@components/Button';
import { Checkbox } from '@components/Checkbox';
import { Radio } from '@components/Radio';
import { Icon } from '@components/icons';
import styles from './ClarifyingQuestion.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClarifySelectMode = 'multi' | 'single';

export interface ClarifyStep {
  question: string;
  /** Option labels. The freeform row is appended separately. */
  options: string[];
  /** Overrides the component-level mode for this step alone. */
  mode?: ClarifySelectMode;
}

export interface ClarifyAnswer {
  question: string;
  /** Chosen option labels, in the order they appear. */
  selected: string[];
  /** Whatever the user typed into "Something else…", if anything. */
  other?: string;
}

export interface ClarifyingQuestionProps {
  /** Default control per step — checkboxes (multi) or radio buttons (single).
   *  A step's own `mode` wins over this. */
  mode?: ClarifySelectMode;
  steps: ClarifyStep[];
  /** Append a freeform "Something else…" row to every step. */
  somethingElse?: boolean;
  /** Fired on the last step's primary action, with every step's answer. */
  onSubmit?: (answers: ClarifyAnswer[]) => void;
  /** Fired by Escape, and by the host's own Stop control. */
  onCancel?: () => void;
  /** Take keyboard focus on mount. */
  autoFocus?: boolean;
  /** Play the exit transition. The host keeps the card mounted for
   *  CLARIFY_EXIT_MS after setting this, then unmounts it. */
  leaving?: boolean;
  /** What nudges when the primary action is pressed with nothing selected. */
  wiggleTarget?: 'button' | 'options' | 'card';
  /** What dips on a selection: the whole row (highlight and glyph included), just
   *  the control, or nothing. */
  pressTarget?: 'row' | 'control' | 'none';
  /** How far the press dips, centred. 0.99 is a light touch; 0.96 is pronounced. */
  pressScale?: number;
}

// Row identity for the freeform option — kept out of the label namespace so a
// real option called "Something else…" could never collide with it.
const OTHER = '__other__';
const OTHER_LABEL = 'Something else…';

interface StepState {
  selected: string[];
  other: string;
  otherOn: boolean;
}

const emptyStep = (): StepState => ({ selected: [], other: '', otherOn: false });

// ── Motion ────────────────────────────────────────────────────────────────────
// Durations live here rather than only in CSS because the host has to keep the
// card mounted for the exit before it unmounts it.

/** How long the card takes to fade + slide out. Exported so the host can time it. */
export const CLARIFY_EXIT_MS = 180;
// Row stagger, matching the home page's starter prompts: first row lands while the
// card is still settling, then a 50ms step per row.
const ROW_DELAY_BASE_MS = 100;
const ROW_DELAY_STEP_MS = 50;

// Page change — rows leave together, then arrive staggered from the incoming side.
// Must stay in step with the cqRowsOut / cqRowsIn keyframe durations.
const PAGE_OUT_MS = 80;
const PAGE_IN_MS = 150;
const PAGE_ROW_STEP_MS = 34;
// Matches the cqRowEnter keyframe duration.
const ROW_ANIM_MS = 180;

// Press feedback. Mirrors --duration-normal / --easing-standard; the compress
// reaching its minimum at 40% is what reads as a press rather than a bounce.
const PRESS_MS = 200;
const PRESS_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

// Empty-next nudge, lifted from the home page's empty-send behaviour.
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

// The CSS media query can't gate a scripted animation, so check it here.
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Single select advances on its own once an option is picked. The beat lets the
// selection register visually before the page turns — just long enough to read the
// press feedback, which runs alongside it.
const AUTO_ADVANCE_MS = 110;

// ── Sample content ────────────────────────────────────────────────────────────
// The control rig picks how many steps and how many options each one shows, so
// every question here carries enough options to be trimmed down to two.

export const CLARIFY_SAMPLES: ClarifyStep[] = [
  {
    question: 'What should revenue mean in this model?',
    options: [
      'Booked order value and cash collected',
      'Booked order value only',
      'Cash collected only',
      'Recognised revenue',
      'Net of refunds and credits',
      'Gross bookings including tax',
    ],
  },
  {
    question: 'How much detail do you want?',
    options: [
      'Quick headlines',
      'Detailed summary',
      'Full breakdown with drivers',
      'Just the numbers, no commentary',
      'A chart per region',
      'Everything, including the query',
    ],
  },
  {
    question: 'Which period should I compare against?',
    options: [
      'Same quarter last year',
      'Previous quarter',
      'Trailing twelve months',
      'Year to date',
      'Same period two years ago',
      'No comparison',
    ],
  },
  {
    question: 'How should returns be handled?',
    options: [
      'Exclude returns entirely',
      'Include returns as negatives',
      'Show returns alongside sales',
      'Only returns',
      'Net returns against the same order',
      'Split by return reason',
    ],
  },
  {
    question: 'Which stores count as the east region?',
    options: [
      'The nine stores tagged East',
      'East plus the two new Boston stores',
      'Everything east of Chicago',
      'Only stores open all twelve months',
      'East and North-East combined',
      'Use the region field as-is',
    ],
  },
];

/** Trim the sample pool down to the shape the control rig asks for. */
export function buildClarifySteps(
  stepCount: number,
  optionCounts: number[],
  modes: ClarifySelectMode[],
): ClarifyStep[] {
  return CLARIFY_SAMPLES.slice(0, stepCount).map((s, i) => ({
    question: s.question,
    options: s.options.slice(0, optionCounts[i] ?? 3),
    mode: modes[i] ?? 'multi',
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ClarifyingQuestion({
  mode = 'multi',
  steps,
  somethingElse = true,
  onSubmit,
  onCancel,
  autoFocus = true,
  leaving = false,
  wiggleTarget = 'card',
  pressTarget = 'row',
  pressScale = 0.99,
}: ClarifyingQuestionProps) {
  const [rawStepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<StepState[]>(() => steps.map(emptyStep));
  // The keyboard cursor. Starts on the first option, so there is always exactly
  // one row in the hover/active state.
  const [rawCursor, setCursor] = useState(0);
  const [editingOther, setEditingOther] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Row motion. Exactly one animation class is on a row at a time, and NONE once
  // it settles: a finished animation with fill:both keeps holding its transform,
  // which would block the press and make the entrance replay every time the press
  // class came off. 'settled' is therefore a real state, not just an absence.
  const [rowMotion, setRowMotion] = useState<'enter' | 'out' | 'in' | 'settled'>('enter');
  const [pageDir, setPageDir] = useState(1);
  const pagingRef = useRef(false);
  const pageTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const optionsRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLSpanElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(pageTimer.current);
      clearTimeout(autoTimer.current);
      clearTimeout(settleTimer.current);
    },
    [],
  );

  // Re-seed when the step list changes shape (the control rig drives this live).
  useEffect(() => {
    setState(steps.map(emptyStep));
    setStepIndex(0);
    setCursor(0);
    setEditingOther(false);
  }, [steps]);

  useEffect(() => {
    if (autoFocus) cardRef.current?.focus();
  }, [autoFocus]);

  // The entrance is a one-shot: drop the class once the last staggered row lands so
  // nothing is left holding a transform.
  useEffect(() => {
    const total = ROW_DELAY_BASE_MS + (rows.length - 1) * ROW_DELAY_STEP_MS + ROW_ANIM_MS;
    settleAfter(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editingOther) otherInputRef.current?.focus();
  }, [editingOther]);

  // The step and cursor indices are clamped at render time, not just reset in an
  // effect — the control rig can shrink the step list or an option count while a
  // later index is live, and the effect only runs after the render that would
  // already have read past the end.
  const stepIndex = Math.max(0, Math.min(rawStepIndex, steps.length - 1));
  const step = steps[stepIndex] ?? { question: '', options: [] };
  const current = state[stepIndex] ?? emptyStep();
  const isLast = stepIndex === steps.length - 1;
  // Each step picks its own control; the component-level mode is just the default.
  const stepMode = step.mode ?? mode;

  const rows = useMemo(
    () => (somethingElse ? [...step.options, OTHER] : step.options),
    [step.options, somethingElse],
  );
  const cursor = Math.min(rawCursor, rows.length - 1);

  // Hand the rows back to the press once the last staggered row has landed.
  const settleAfter = (ms: number) => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setRowMotion('settled'), ms);
  };

  const patch = (next: Partial<StepState>) =>
    setState((prev) => prev.map((s, i) => (i === stepIndex ? { ...s, ...next } : s)));

  // An open-but-empty freeform row isn't an answer, so it doesn't read as selected
  // and doesn't satisfy the primary action — typing a character is what selects it.
  const otherAnswered = current.otherOn && current.other.trim().length > 0;

  const isChecked = (row: string) =>
    row === OTHER ? otherAnswered : current.selected.includes(row);

  const toggle = (row: string) => {
    if (row === OTHER) {
      const on = !current.otherOn;
      // Single select: choosing the freeform row clears the option answers.
      patch({ otherOn: on, other: on ? current.other : '', ...(stepMode === 'single' ? { selected: [] } : {}) });
      setEditingOther(on);
      return;
    }
    if (stepMode === 'single') {
      patch({ selected: [row], otherOn: false, other: '' });
      setEditingOther(false);
      // One answer per question, so picking it IS the interaction — move on rather
      // than making them confirm with Next. Forward only: the last step still needs
      // an explicit Submit, and the freeform row is excluded above since it has to
      // be typed into first.
      if (stepIndex < steps.length - 1) {
        clearTimeout(autoTimer.current);
        autoTimer.current = setTimeout(() => goToStep(stepIndex + 1), AUTO_ADVANCE_MS);
      }
      return;
    }
    patch({
      selected: current.selected.includes(row)
        ? current.selected.filter((r) => r !== row)
        : [...step.options.filter((o) => o === row || current.selected.includes(o))],
    });
  };

  // Paging runs in two beats: the current rows animate out, then the next step's
  // rows mount already animating in. The step only changes at the halfway point, so
  // the outgoing content is still the old question while it leaves.
  const goToStep = (next: number) => {
    if (next < 0 || next > steps.length - 1) return;
    if (pagingRef.current) return; // ignore input mid-transition
    // Any page move cancels a pending auto-advance, so a Skip or a pager click
    // during that beat can't be followed by a second, stale jump.
    clearTimeout(autoTimer.current);
    pagingRef.current = true;

    setPageDir(next > stepIndex ? 1 : -1);
    setRowMotion('out');
    clearTimeout(settleTimer.current);
    cardRef.current?.focus(); // focus shouldn't wait on the animation

    pageTimer.current = setTimeout(() => {
      setStepIndex(next);
      setCursor(0);
      setEditingOther(false);
      setRowMotion('in');
      pagingRef.current = false;
      // Settle once the last arriving row has landed.
      settleAfter((rows.length - 1) * PAGE_ROW_STEP_MS + PAGE_IN_MS);
    }, PAGE_OUT_MS);
  };

  const submitFrom = (arr: StepState[]) =>
    onSubmit?.(
      steps.map((s, i) => {
        const a = arr[i] ?? emptyStep();
        return {
          question: s.question,
          selected: a.selected,
          ...(a.otherOn && a.other.trim() ? { other: a.other.trim() } : {}),
        };
      }),
    );

  const selectedCount = current.selected.length + (otherAnswered ? 1 : 0);

  // These one-shot pulses run through the Web Animations API rather than a CSS
  // class, because selecting also re-renders the row — and React rewrites
  // className on that render, which would strip an imperatively-added class and
  // kill the animation in the same tick. An Animation lives on the element, so a
  // re-render can't touch it. Re-firing cancels the previous one by id.
  const pulse = (
    el: HTMLElement | null | undefined,
    keyframes: Keyframe[],
    duration: number,
    easing: string,
    id: string,
  ) => {
    if (!el || reducedMotion()) return;
    el.getAnimations().forEach((a) => {
      if (a.id === id) a.cancel();
    });
    const anim = el.animate(keyframes, { duration, easing });
    anim.id = id;
  };

  const nudge = () =>
    pulse(
      wiggleTarget === 'button'
        ? primaryRef.current
        : wiggleTarget === 'card'
          ? cardRef.current
          : optionsRef.current,
      WIGGLE_KEYFRAMES,
      WIGGLE_MS,
      WIGGLE_EASING,
      'cq-wiggle',
    );

  // Selection feedback. Found through the options container rather than by id, so
  // two cards on one page can't collide.
  const pressRow = (i: number) => {
    if (pressTarget === 'none') return;
    // The freeform row opens a field instead of committing a choice, so there's
    // nothing for a press to confirm.
    if (rows[i] === OTHER) return;
    const row = optionsRef.current?.children[i] as HTMLElement | undefined;
    pulse(
      pressTarget === 'row' ? row : row?.querySelector<HTMLElement>('[data-press]'),
      [
        { transform: 'scale(1)' },
        { offset: 0.4, transform: `scale(${pressScale})` },
        { transform: 'scale(1)' },
      ],
      PRESS_MS,
      PRESS_EASING,
      'cq-press',
    );
  };

  const advance = () => {
    // Nothing picked: the primary action nudges the options instead of moving on.
    // Skip is the way past a question you don't want to answer.
    if (selectedCount === 0) {
      nudge();
      return;
    }
    if (!isLast) goToStep(stepIndex + 1);
    else submitFrom(state);
  };

  // Skip discards whatever is selected on this step before moving on — otherwise
  // a skipped answer would still ride along in the submission.
  const skip = () => {
    const cleared = state.map((s, i) => (i === stepIndex ? emptyStep() : s));
    setState(cleared);
    if (!isLast) goToStep(stepIndex + 1);
    else submitFrom(cleared);
  };


  // ── Keyboard ────────────────────────────────────────────────────────────────
  // The card is a single tab stop; the cursor roves with the arrow keys and
  // aria-activedescendant reports it. Enter or Space commits the cursor row,
  // ← / → page between steps, Escape cancels.

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // While typing a freeform answer only Escape and Enter are ours — everything
    // else belongs to the caret. The row is already selected here, so Enter means
    // "move on" like it does anywhere else; Escape drops the row and hands focus
    // back to the card so the arrow keys start roving again.
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
      // Both wrap, and both start from the clamped cursor so a stale index left
      // over from a longer option list can't land somewhere unexpected.
      case 'ArrowDown':
        e.preventDefault();
        setCursor((cursor + 1) % rows.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCursor((cursor - 1 + rows.length) % rows.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToStep(stepIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToStep(stepIndex + 1);
        break;
      // Enter picks the row under the cursor — but if that row is already
      // selected, the user has answered and means "move on", so it advances
      // instead (submitting on the last step). Space only ever toggles, which
      // keeps a way to deselect without leaving the step.
      case 'Enter':
        e.preventDefault();
        if (isChecked(rows[cursor])) {
          advance();
        } else {
          pressRow(cursor);
          toggle(rows[cursor]);
        }
        break;
      case ' ':
        e.preventDefault();
        pressRow(cursor);
        toggle(rows[cursor]);
        break;
      case 'Escape':
        e.preventDefault();
        onCancel?.();
        break;
      default:
        break;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const listId = 'clarify-options';

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${leaving ? styles.cardLeaving : styles.cardEnter}`}
      // The type scale is settled at Body/Large, so the stylesheet owns it. Only
      // the page direction is still decided per render.
      style={{ '--cq-page-dir': pageDir } as React.CSSProperties}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label={step.question}
    >
      {/* No dismiss control by design — the question is deliberate, so getting rid
          of it isn't offered here. Escape still resolves it for keyboard users, and
          the prompt bar's Stop ends the run. */}
      <div className={styles.header}>
        <h3 className={styles.question}>{step.question}</h3>
      </div>

      <div
        ref={optionsRef}
        className={styles.options}
        id={listId}
        role={stepMode === 'multi' ? 'listbox' : 'radiogroup'}
        aria-multiselectable={stepMode === 'multi' || undefined}
        aria-activedescendant={`${listId}-${cursor}`}
      >
        {rows.map((row, i) => {
          const isOther = row === OTHER;
          const checked = isChecked(row);
          const showInput = isOther && current.otherOn;
          return (
            <div
              // The step index is in the key so the rows remount on a page change,
              // which is what replays the arrival animation.
              key={`${stepIndex}-${isOther ? OTHER : row}`}
              id={`${listId}-${i}`}
              className={`${styles.row}${cursor === i ? ` ${styles.rowActive}` : ''}${
                rowMotion === 'out'
                  ? ` ${styles.rowLeaving}`
                  : rowMotion === 'in'
                    ? ` ${styles.rowArriving}`
                    : rowMotion === 'enter'
                      ? ` ${styles.rowEnter}`
                      : '' /* settled — no animation, so the press owns the row */
              }`}
              style={{
                // Both staggers are per-row delays on the animation; rows leave
                // together, so the outgoing beat gets none.
                animationDelay:
                  rowMotion === 'out'
                    ? '0ms'
                    : rowMotion === 'in'
                      ? `${i * PAGE_ROW_STEP_MS}ms`
                      : `${ROW_DELAY_BASE_MS + i * ROW_DELAY_STEP_MS}ms`,
              }}
              role={stepMode === 'multi' ? 'option' : 'radio'}
              aria-selected={stepMode === 'multi' ? checked : undefined}
              aria-checked={stepMode === 'single' ? checked : undefined}
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
                toggle(row);
              }}
            >
              {/* Radiant control, box/circle only — inert keeps its input out of the
                  tab order and out of the click path, so the row owns both.
                  `data-press` marks it for the control-only press variant. */}
              <div
                className={styles.control}
                data-press={pressTarget === 'control' ? '' : undefined}
                inert
              >
                {stepMode === 'multi' ? (
                  <Checkbox checked={checked} showLabel={false} label={isOther ? OTHER_LABEL : row} />
                ) : (
                  <Radio checked={checked} showLabel={false} label={isOther ? OTHER_LABEL : row} />
                )}
              </div>

              {showInput ? (
                <input
                  ref={otherInputRef}
                  className={styles.otherInput}
                  value={current.other}
                  placeholder={OTHER_LABEL}
                  onChange={(e) => patch({ other: e.target.value })}
                  onFocus={() => setEditingOther(true)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`${styles.label}${isOther ? ` ${styles.labelMuted}` : ''}`}>
                  {isOther ? OTHER_LABEL : row}
                </span>
              )}

              {/* Spells out what Enter does, on the row Enter would act on. */}
              {cursor === i && (
                <span className={styles.enterHint} aria-hidden="true">
                  <Icon name="enter" size="xs" color="currentColor" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        {/* Left cluster — pagination only. A running count of selections was here,
            but with this few options it read as clutter rather than information. */}
        <div className={styles.footerLeft}>
          {steps.length > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pagerBtn}
                onClick={() => goToStep(stepIndex - 1)}
                disabled={stepIndex === 0}
                aria-label="Previous question"
              >
                <Icon name="chevron-left" size="xs" color="currentColor" />
              </button>
              <span className={styles.pagerCount}>
                {stepIndex + 1} of {steps.length}
              </span>
              <button
                type="button"
                className={styles.pagerBtn}
                onClick={() => goToStep(stepIndex + 1)}
                disabled={isLast}
                aria-label="Next question"
              >
                <Icon name="chevron-right" size="xs" color="currentColor" />
              </button>
            </div>
          )}
        </div>
        <div className={styles.actionsRight}>
          <Button variant="tertiary" onClick={skip}>
            Skip
          </Button>
          <span ref={primaryRef} className={styles.primaryWrap}>
            <Button variant="primary" onClick={advance}>
              {isLast ? 'Submit' : 'Next'}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

export default ClarifyingQuestion;
