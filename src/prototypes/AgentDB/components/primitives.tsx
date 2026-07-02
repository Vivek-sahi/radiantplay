import React from 'react';
import { Icon, Typography, Horizontal, Vertical } from '../../../components';
import { c, radius, spacing, fontSize, fontWeight, fontFamily, lineHeight } from '../styles';
import type { RunStatus } from '../types';

// ── StatusPill ────────────────────────────────────────────────────────────────
export type PillKind = 'success' | 'failure' | 'warning' | 'info' | 'neutral';

const PILL: Record<PillKind, { bg: string; fg: string }> = {
  success: { bg: c['background-success'], fg: c['content-success'] },
  failure: { bg: c['background-failure'], fg: c['content-failure'] },
  warning: { bg: c['background-warning'], fg: c['content-primary'] },
  info: { bg: c['background-information'], fg: c['content-information'] },
  neutral: { bg: c['background-subtle'], fg: c['content-secondary'] },
};

export const StatusPill: React.FC<{ kind: PillKind; label: string }> = ({ kind, label }) => {
  const { bg, fg } = PILL[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: bg,
        color: fg,
        borderRadius: `${radius.badge}px`,
        padding: `2px ${spacing.B}px`,
        fontFamily: fontFamily.primary,
        fontSize: `${fontSize.xs}px`,
        lineHeight: `${lineHeight.sm}px`,
        fontWeight: fontWeight.medium,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export function runStatusPillKind(status: RunStatus): PillKind {
  if (status === 'Success') return 'success';
  if (status === 'Failure') return 'failure';
  return 'neutral'; // In progress
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <Vertical
    gap={spacing.A}
    style={{
      backgroundColor: c['background-base'],
      border: `1px solid ${c['border-divider']}`,
      borderRadius: `${radius.card}px`,
      padding: `${spacing.D}px ${spacing.E}px`,
      minWidth: '160px',
      flex: 1,
    }}
  >
    <Typography variant="overline" color="gray" noMargin>
      {label}
    </Typography>
    <Typography variant="page-title" color="base" noMargin>
      {value}
    </Typography>
    {sub && (
      <Typography variant="footnote" color="gray" noMargin>
        {sub}
      </Typography>
    )}
  </Vertical>
);

// ── KeyValue (label → value grid rows) ─────────────────────────────────────────
export const KeyValue: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Horizontal align="start" gap={spacing.D} style={{ padding: `${spacing.A}px 0` }}>
    <div style={{ width: '180px', flexShrink: 0 }}>
      <Typography variant="body-normal" color="gray" noMargin>
        {label}
      </Typography>
    </div>
    <div style={{ fontFamily: fontFamily.primary, fontSize: `${fontSize.sm}px`, lineHeight: `${lineHeight.md}px`, color: c['content-primary'] }}>
      {children}
    </div>
  </Horizontal>
);

// ── SectionHeader ──────────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; actions?: React.ReactNode }> = ({ title, actions }) => (
  <Horizontal justify="space-between" align="center" style={{ width: '100%' }}>
    <Typography variant="section-label" color="base" noMargin>
      {title}
    </Typography>
    {actions && <Horizontal gap={spacing.E}>{actions}</Horizontal>}
  </Horizontal>
);

// ── SourceCacheIcon ─────────────────────────────────────────────────────────────
/**
 * Data-source indicator in a fixed 18×18 box so lists stay aligned. Not cached →
 * just the Snowflake logo. Cached → Snowflake with a small link badge in the corner:
 * "source is Snowflake, data is also linked/cached in ThoughtSpot".
 */
export const SourceCacheIcon: React.FC<{ cached: boolean }> = ({ cached }) => (
  <span
    style={{ position: 'relative', display: 'inline-flex', width: '18px', height: '18px', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
    aria-label={cached ? 'Snowflake source, cached in ThoughtSpot' : 'Snowflake'}
  >
    <img src="/logos/snowflake.svg" width={18} height={18} alt="" style={{ display: 'block' }} />
    {cached && (
      <span
        style={{
          position: 'absolute',
          right: '-4px',
          bottom: '-4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c['background-base'],
          borderRadius: `${radius.full}px`,
        }}
      >
        <Icon name="copy-link" size="xs" color={c['content-brand']} />
      </span>
    )}
  </span>
);
