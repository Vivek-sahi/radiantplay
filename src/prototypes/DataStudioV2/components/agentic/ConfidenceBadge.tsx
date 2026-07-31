import React from 'react';
import { fs, ff, fw } from '../../styles';

interface ConfidenceBadgeProps {
  pct: number;
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

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ pct }) => {
  const tier = TIER.find(t => pct >= t.min) ?? TIER[TIER.length - 1];
  return (
    <span style={{
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
      {pct}% match
    </span>
  );
};
