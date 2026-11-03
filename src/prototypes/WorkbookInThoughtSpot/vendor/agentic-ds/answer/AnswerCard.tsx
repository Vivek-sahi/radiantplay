import React, { forwardRef } from 'react';
import { Button } from '@components/Button';
import { LoadingIndicator } from '@components/LoadingIndicator';
import styles from './AnswerCard.module.css';

// ── Spotter answer card ───────────────────────────────────────────────────────
//
// The saved-chat card: a stale Answer, and the offer to reload it for fresh data.
// Not to be confused with the viz answer card in
// docs/2026-05-07-spotter-answer-card.md — that one is the full chart card inside
// a thread. This is the compact 70px row.
//
// Figma — 💾 Spotter · Saved chats, node 4405-9049 (documentation + all states).
//
// Behaviour, from the designer's notes on that frame:
//   • The whole card is the click trigger for reload — clicking the card or the
//     button both reload.
//   • On hover, background-ghost-hover lands on both the card and the thumbnail,
//     the border goes to border-subtle-hover, and the icon animates (rotates -15°).
//   • Loading swaps the text for two shimmer lines: 12px and 10px tall, 8px apart,
//     with 4px above and below. The button is not shown while loading.

/** Forced state, so the canvas can show each one without a real pointer. */
export type AnswerCardState = 'default' | 'hover' | 'hover-button' | 'loading';

export interface AnswerCardProps {
  /** The saved Answer's name. */
  title?: string;
  /** The line under it — why the card is here. */
  description?: string;
  /** Reload label. */
  actionLabel?: string;
  /** Fires from the card and from the button alike. */
  onReload?: () => void;
  /** Left off, the card behaves normally and hover is real. */
  state?: AnswerCardState;
  className?: string;
}

// The answer glyph at the size the thumbnail uses. Exported from Figma
// (node 4404-9010) with the fill swapped for currentColor so tokens drive it.
//
// The export is one path with two subpaths; they are split here so the detached
// slice can lift on its own while the body stays put. The path data is verbatim —
// only the "M" that starts the second subpath became a second element.
const PIE_BODY =
  'M0 10.1368C0.000178442 6.16651 3.12639 2.34969 7.85229 2.34962V10.2554H15.9756C15.9756 14.7502 12.0873 18.0001 8.02441 18.0001V16.3053C10.7124 16.3053 13.236 14.5183 14.0259 11.9503H6.15747V4.26711C3.4195 5.01079 1.69497 7.51869 1.69482 10.1368C1.69482 13.511 4.49614 16.3052 8.02441 16.3053V18.0001C3.59265 18.0001 0 14.4794 0 10.1368Z';
const PIE_SLICE =
  'M10.4561 0.0534671C12.4544 0.293725 14.238 1.19231 15.5662 2.51149C16.8347 3.77142 17.6954 5.42246 17.9333 7.262C17.9774 7.60225 18 7.94829 18 8.29838H14.0222V6.60355H16.0745C15.7704 5.50552 15.1779 4.51495 14.3716 3.71413C13.5948 2.94257 12.6195 2.34853 11.5203 2.00758V2.60743L11.5195 2.6067V6.60355H14.0222V8.29838H9.82397V0.737552H9.82544V0C9.83389 0.000566664 10.2499 0.0286808 10.4561 0.0534671Z';

const AnswerGlyph: React.FC = () => (
  // overflow visible, or the 18×18 viewport clips the top of the lifted slice.
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    overflow="visible"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d={PIE_BODY} fill="currentColor" />
    <path className={styles.slice} d={PIE_SLICE} fill="currentColor" />
  </svg>
);

export const AnswerCard = forwardRef<HTMLDivElement, AnswerCardProps>(function AnswerCard(
  {
    title = 'Sales in east by store',
    description = 'Reload this Answer to see the latest data.',
    actionLabel = 'Reload',
    onReload,
    state = 'default',
    className,
  },
  ref,
) {
  const loading = state === 'loading';
  const forcedHover = state === 'hover' || state === 'hover-button';

  return (
    <div
      ref={ref}
      className={[
        styles.card,
        forcedHover ? styles.stateHover : '',
        state === 'hover-button' ? styles.stateHoverButton : '',
        loading ? styles.stateLoading : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      // The whole card is the click trigger, so it answers to the keyboard too.
      role={loading ? undefined : 'button'}
      tabIndex={loading ? undefined : 0}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onReload}
      onKeyDown={(e) => {
        if (loading) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onReload?.();
        }
      }}
    >
      <div className={styles.thumbnail}>
        <span className={styles.icon}>
          <AnswerGlyph />
        </span>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.shimmerContent}>
            <LoadingIndicator.Skeleton variant="rounded" width={160} height={12} />
            <LoadingIndicator.Skeleton variant="rounded" width={220} height={10} />
          </div>
        ) : (
          <>
            <div className={styles.content}>
              <p className={styles.title}>{title}</p>
              <p className={styles.description}>{description}</p>
            </div>
            <div className={styles.buttons}>
              {/* Clicking the button reloads too — the card's own handler would
                  fire anyway, so this only has to not double-fire. */}
              <Button
                variant="secondary"
                size="basic"
                onClick={(e) => {
                  e.stopPropagation();
                  onReload?.();
                }}
              >
                {actionLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

/** The states the canvas walks, in the order the Figma frame documents them. */
export const ANSWER_CARD_STATES: { state: AnswerCardState; label: string }[] = [
  { state: 'default', label: 'Default' },
  { state: 'hover', label: 'Hover - card' },
  { state: 'hover-button', label: 'Hover - button' },
  { state: 'loading', label: 'Loading' },
];
