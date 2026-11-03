import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './StarterChips.module.css';

/**
 * Icons live in the Radiance Home bundle under `public/`, so they are served
 * from that path rather than duplicated — one copy, and the chips can't drift
 * from the page they were taken from.
 */
const ICON_BASE = '/radiance-spotter-home/assets';

/** The card's expanded size. Fixed, not measured: the card centres on the
 *  prompt bar, so its width is a property of the layout, not of its content. */
const EXPANDED_WIDTH = 660;
const EXPANDED_MAX_HEIGHT = 320;

/** Breathing room kept between the card and the viewport edge. */
const EDGE = 8;

export interface StarterChip {
  id: string;
  label: string;
  /** Masked to currentColor, so it must be a single-colour glyph. */
  icon: string;
  /**
   * Rendered in place of the masked `icon` when the mark has to keep its own
   * colours — a connector's brand logo, say, which monochrome would destroy.
   * The chip and the card header share it, so the morph stays continuous.
   */
  iconNode?: React.ReactNode;
  /**
   * Suggestions this chip expands into. A chip with none is a plain button —
   * it reports the click and nothing morphs.
   */
  prompts?: string[];
}

export const STARTER_CHIPS: StarterChip[] = [
  {
    id: 'quick-search',
    label: 'Quick search',
    icon: `${ICON_BASE}/icon-quick-search.svg`,
    prompts: [
      'What was total revenue last month?',
      'Show me top 10 products by sales this quarter.',
      'How do sales this year compare to last year?',
      'Which region had the highest growth last quarter?',
    ],
  },
  {
    id: 'deep-analysis',
    label: 'Deep analysis',
    icon: `${ICON_BASE}/icon-deep-analysis.svg`,
    prompts: [
      'Generate report on sales trends last year',
      'Product categories that drove maximum growth',
      'Find out anomalies in my sales and suggest recommendations',
      'Compare my sales to market trends and identify trends',
    ],
  },
  // No card — there is nothing to suggest, the mode is the answer.
  { id: 'know-your-data', label: 'Know your data', icon: `${ICON_BASE}/icon-know-your-data.svg` },
];

export interface StarterChipsProps {
  chips?: StarterChip[];
  /** A suggestion inside an expanded card was picked. */
  onSelect?: (prompt: string, chipId: string) => void;
  /** A chip with no suggestions was clicked. */
  onChipSelect?: (chipId: string) => void;
  /**
   * An element the expanded card centres itself on — the prompt bar. Without
   * one the card expands from the chip's own left edge, which is the fallback
   * rather than the intent.
   */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Fired when a card opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Optional content rendered at the *end* of each suggestion row — used to
   * show which connectors a suggestion would draw on. Trailing rather than
   * leading so every row's text starts on the same left edge, whether or not
   * it has any. Returning nothing leaves the row as plain text.
   */
  renderPromptTrailing?: (prompt: string, chipId: string) => React.ReactNode;
}

/**
 * The starter chips under the prompt bar, and the card two of them expand into.
 *
 * The expansion is a measured-rect morph, ported from the Radiance Home bundle
 * (`app.js`, openStarterCard/closeStarterCard). It is not a height animation
 * and not a FLIP transform: the card is stamped with the chip's own rect, made
 * visible while the real chip is hidden in place — so the card visually *is*
 * the chip — and then, a committed frame later, given its expanded geometry and
 * left to transition there. Rows stagger in behind it.
 *
 * The card portals to the body because it is `position: fixed` and would
 * otherwise be trapped by any `overflow: hidden` or transformed ancestor.
 */
export const StarterChips: React.FC<StarterChipsProps> = ({
  chips = STARTER_CHIPS,
  onSelect,
  onChipSelect,
  anchorRef,
  onOpenChange,
  renderPromptTrailing,
}) => {
  // Which chip's card is open. Held here rather than discovered by sweeping the
  // DOM, so only one can ever be open and React owns the truth.
  const [openId, setOpenId] = useState<string | null>(null);
  // Split from openId by one frame: the card mounts at the chip's rect, then
  // expands. Both states in one flag would skip the morph entirely.
  const [expanded, setExpanded] = useState(false);
  // Kept mounted through the closing transition so it can animate back.
  const [mounted, setMounted] = useState<string | null>(null);
  // The card is not shown until it has been placed on its chip — otherwise it
  // would flash at the top-left for a frame before the first measurement.
  const [positioned, setPositioned] = useState(false);

  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const cardRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const mountedChip = mounted ? chips.find((c) => c.id === mounted) : undefined;

  const close = useCallback(() => {
    setOpenId(null);
    setExpanded(false);
  }, []);

  const open = useCallback((id: string) => {
    setMounted(id);
    setOpenId(id);
    setExpanded(false);
    setPositioned(false);
  }, []);

  useEffect(() => {
    onOpenChange?.(openId !== null);
  }, [openId, onOpenChange]);

  // Stamp the card with the chip's rect, then expand a committed frame later.
  //
  // Both measurements are taken inside the first frame rather than when the
  // effect runs. Effects fire before the browser has necessarily laid the page
  // out — under Vite's dev server the CSS module arrives asynchronously, so an
  // effect-time read can catch the chip still at the origin, and the targets
  // computed from it would be wrong for the life of the card. A frame later the
  // layout is settled. The card stays hidden until then so the wait is unseen.
  useEffect(() => {
    if (!openId) return;
    const card = cardRef.current;
    if (!card) return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      const chip = chipRefs.current.get(openId);
      if (!chip) return;

      const chipRect = chip.getBoundingClientRect();
      card.style.left = `${chipRect.left}px`;
      card.style.top = `${chipRect.top}px`;
      card.style.width = `${chipRect.width}px`;
      card.style.maxHeight = `${chipRect.height}px`;
      if (headerRef.current) headerRef.current.style.height = `${chipRect.height}px`;
      setPositioned(true);

      const anchor = anchorRef?.current?.getBoundingClientRect();
      const targetLeft = anchor
        ? anchor.left + (anchor.width - EXPANDED_WIDTH) / 2
        : chipRect.left;

      // The card grows downward from the chip, which only works while there is
      // room below it. Measure what the content actually wants — the rows are
      // already in the DOM, just clipped by max-height — and slide the card up
      // if that would take it past the bottom edge. When it fits, targetTop is
      // the chip's own top and nothing moves, which is the common case.
      const naturalHeight = Math.min(card.scrollHeight, EXPANDED_MAX_HEIGHT);
      const targetTop = Math.max(
        EDGE,
        Math.min(chipRect.top, window.innerHeight - EDGE - naturalHeight)
      );

      // A second frame, so the start values commit before they change. Setting
      // both in one frame lets the browser coalesce the writes, and the card
      // simply appears already expanded.
      inner = requestAnimationFrame(() => {
        setExpanded(true);
        card.style.left = `${targetLeft}px`;
        card.style.top = `${targetTop}px`;
        card.style.width = `${EXPANDED_WIDTH}px`;
        card.style.maxHeight = `${EXPANDED_MAX_HEIGHT}px`;
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [openId, anchorRef]);

  // Closing: put the geometry back on the chip and let the same transition run
  // in reverse. Unmounting happens on transitionend, below.
  useEffect(() => {
    if (openId || !mounted) return;
    const chip = chipRefs.current.get(mounted);
    const card = cardRef.current;
    if (!chip || !card) {
      setMounted(null);
      return;
    }
    const chipRect = chip.getBoundingClientRect();
    card.style.left = `${chipRect.left}px`;
    card.style.top = `${chipRect.top}px`;
    card.style.width = `${chipRect.width}px`;
    card.style.maxHeight = `${chipRect.height}px`;
  }, [openId, mounted]);

  // Dismiss on outside pointerdown and on Escape.
  useEffect(() => {
    if (!openId) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (cardRef.current?.contains(target)) return;
      if (chipRefs.current.get(openId)?.contains(target)) return;
      // The prompt bar keeps the card open — typing a question and picking a
      // suggestion are the same task.
      if (anchorRef?.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // The playground shell also closes on Escape; this one is nearer.
      e.stopPropagation();
      close();
      chipRefs.current.get(openId)?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [openId, close, anchorRef]);

  const handleChipClick = (chip: StarterChip) => {
    if (!chip.prompts?.length) {
      onChipSelect?.(chip.id);
      return;
    }
    if (openId === chip.id) close();
    else open(chip.id);
  };

  return (
    <>
      <div className={styles.chips}>
        {chips.map((chip) => {
          // The open card stands in for its chip, so the real one is hidden in
          // place rather than removed — the row must not reflow mid-morph. Held
          // until the card has actually taken its position, or the chip would
          // blink out for the frame before the first measurement.
          const isStandIn = mounted === chip.id && positioned;
          return (
            <button
              key={chip.id}
              ref={(el) => {
                if (el) chipRefs.current.set(chip.id, el);
                else chipRefs.current.delete(chip.id);
              }}
              type="button"
              className={styles.chip}
              aria-haspopup={chip.prompts?.length ? 'dialog' : undefined}
              aria-expanded={chip.prompts?.length ? openId === chip.id : undefined}
              style={
                isStandIn ? { opacity: 0, pointerEvents: 'none' } : undefined
              }
              onClick={() => handleChipClick(chip)}
            >
              {chip.iconNode ? (
                <span className={styles.chipIconNode} aria-hidden>
                  {chip.iconNode}
                </span>
              ) : (
                <span
                  className={styles.chipIcon}
                  style={{ '--icon': `url("${chip.icon}")` } as React.CSSProperties}
                  aria-hidden
                />
              )}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {mountedChip &&
        createPortal(
          <div
            ref={cardRef}
            className={[styles.card, expanded ? styles.cardExpanded : '']
              .filter(Boolean)
              .join(' ')}
            style={positioned ? undefined : { visibility: 'hidden' }}
            role="dialog"
            aria-label={`${mountedChip.label} suggestions`}
            onTransitionEnd={(e) => {
              // Only the collapse unmounts, and only once the card itself has
              // finished — a child's transition ending must not tear it down.
              if (e.target !== e.currentTarget) return;
              if (e.propertyName !== 'max-height') return;
              if (!openId) setMounted(null);
            }}
          >
            <div ref={headerRef} className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                {mountedChip.iconNode ? (
                  <span className={styles.chipIconNode} aria-hidden>
                    {mountedChip.iconNode}
                  </span>
                ) : (
                  <span
                    className={styles.cardIcon}
                    style={
                      { '--icon': `url("${mountedChip.icon}")` } as React.CSSProperties
                    }
                    aria-hidden
                  />
                )}
                <span className={styles.cardLabel}>{mountedChip.label}</span>
              </div>
              <button
                type="button"
                className={styles.cardClose}
                aria-label={`Close ${mountedChip.label.toLowerCase()}`}
                onClick={close}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.prompts}>
              {mountedChip.prompts?.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.prompt}
                  onClick={() => {
                    onSelect?.(prompt, mountedChip.id);
                    close();
                  }}
                >
                  <span className={styles.promptText}>{prompt}</span>
                  {renderPromptTrailing?.(prompt, mountedChip.id)}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

StarterChips.displayName = 'StarterChips';

export default StarterChips;
