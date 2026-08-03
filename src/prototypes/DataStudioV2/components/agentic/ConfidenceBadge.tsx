import React from 'react';
import Tooltip from '../../../../components/Tooltip';
import { fs, ff, fw } from '../../styles';

interface ConfidenceBadgeProps {
  pct: number;
  /**
   * Why the agent scored it this way — S3's "hover a score to see the agent's
   * one-line reasoning".
   *
   * The badge owns its own tooltip rather than each card wrapping it in one. Both
   * callers did that, and it nested three inline-flex boxes deep: Tooltip's own
   * trigger div, a caller-supplied wrapper span, then this. The wrapper carried the
   * cloned hover handlers but no flex-shrink, so in a tight row it could collapse to
   * nothing while the badge overflowed on — visible, and not hoverable.
   */
  reasoning?: string;
}

/**
 * Match confidence on a proposal row.
 *
 * Tinted, so a weak suggestion is visible at a glance rather than having to be
 * read — that traffic-light was the useful half of the original. What went is the
 * thumbs-up glyph, which isn't in Radiant and made a score read as a verdict.
 * Colours are Radiant's semantic background/content pairs, not hand-picked.
 */
const TIER = [
  { min: 80, bg: 'var(--rd-sys-color-background-success)', fg: 'var(--rd-sys-color-content-success)' },
  { min: 55, bg: 'var(--rd-sys-color-background-warning)', fg: 'var(--rd-sys-color-content-warning)' },
  { min: 0,  bg: 'var(--rd-sys-color-background-failure)', fg: 'var(--rd-sys-color-content-failure)' },
];

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ pct, reasoning }) => {
  const tier = TIER.find(t => pct >= t.min) ?? TIER[TIER.length - 1];
  const badge = (
    <span
      /* Native title as well as the styled tooltip. Belt and braces on purpose: this
         hover is the only place the agent's reasoning is readable, and the Radiant
         Tooltip positions itself `fixed` without a portal — any transformed ancestor
         between here and the root would silently misplace it. */
      title={reasoning}
      style={{
      flexShrink: 0,
      alignSelf: 'center',
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      background: tier.bg,
      color: tier.fg,
      fontFamily: ff.primary,
      fontSize: fs.xs,
      fontWeight: fw.medium,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      cursor: 'help',
    }}>
      {/* Just the number. "match" was doing no work the column position didn't
          already do, and it made a one-line reason hover behind a two-word label. */}
      {pct}%
    </span>
  );

  if (!reasoning) return badge;
  return (
    <Tooltip content={reasoning} placement="left" maxWidth={260}>
      {badge}
    </Tooltip>
  );
};
