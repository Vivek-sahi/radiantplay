import React, { useState } from 'react';
import { sysVar, shadowVar } from '@tokens/colors/system';

// The plan card, copied from Faris's Apps prototype (AppsInThoughtSpot/apps/chat/PlanSummaryCard.tsx,
// upstream/faris, 3 Nov 2026) because the Agentic DS "Plan" is still pending. Same look and the same
// three states (idle → building → built). Ours: the expanded rows are the workbook's tabs, and the
// labels say workbook instead of app.

const FONT = 'var(--font-family-primary)';
const BRAND = sysVar('content-brand') as string;
const TEXT_PRIMARY = sysVar('content-primary') as string;
const TEXT_SECONDARY = sysVar('content-secondary') as string;

export type BuildState = 'idle' | 'building' | 'built';

export interface PlanCardProps {
  title: string;
  description: string;
  /** The expanded plan: one row per tab (label = tab, value = what it holds). */
  rows: { label: string; value: string }[];
  buildState: BuildState;
  onBuild: () => void;
  onOpen: () => void;
  /** Primary action label, idle and building. Default "Build workbook" / "Building…". */
  actionLabel?: string;
  busyLabel?: string;
  /** The done-state button. Default "Built — open workbook". */
  builtLabel?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  title, description, rows, buildState, onBuild, onOpen, actionLabel = 'Build workbook', busyLabel = 'Building…', builtLabel = 'Built — open workbook',
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      // Full width, matching the collector docks above it. The plan is the last
      // block in the same sequence, so a narrower card made it read as a
      // different kind of thing and broke the column's left-to-right edge.
      background: sysVar('background-base'), border: `1.5px solid ${sysVar('border-subtle')}`, borderRadius: 12,
      boxShadow: shadowVar('surface'), overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <rect x="1.5" y="1.5" width="5.4" height="5.4" rx="1.4" stroke={BRAND} strokeWidth="1.3" />
            <rect x="9.1" y="1.5" width="5.4" height="5.4" rx="1.4" stroke={BRAND} strokeWidth="1.3" />
            <rect x="1.5" y="9.1" width="5.4" height="5.4" rx="1.4" stroke={BRAND} strokeWidth="1.3" />
            <rect x="9.1" y="9.1" width="5.4" height="5.4" rx="2.7" fill={BRAND} />
          </svg>
          <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 'var(--font-weight-emphasis)', lineHeight: '22px', color: TEXT_PRIMARY }}>
            {title}
          </span>
        </div>
        <p style={{ margin: 0, fontFamily: FONT, fontSize: 13.5, lineHeight: '20px', color: TEXT_SECONDARY }}>
          {description}
        </p>

        {/* Expandable plan detail */}
        {expanded && (
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: `1px solid ${sysVar('border-subtle')}`,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {rows.map((r) => <PlanRow key={r.label} label={r.label} value={r.value} />)}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        padding: '10px 16px', borderTop: `1px solid ${sysVar('border-subtle')}`, background: sysVar('background-sunken'),
      }}>
        {rows.length > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px 14px', height: 32, cursor: 'pointer',
            background: sysVar('background-base'), border: `1px solid ${sysVar('border-bold')}`, borderRadius: 16,
            fontFamily: FONT, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-regular)', lineHeight: '20px', color: TEXT_PRIMARY,
          }}
        >
          {expanded ? 'Hide plan' : 'View plan'}
        </button>
        )}
        {buildState === 'built' ? (
          <button
            onClick={onOpen}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '6px 16px', height: 32, border: 'none', cursor: 'pointer',
              background: sysVar('background-success'), borderRadius: 16,
              fontFamily: FONT, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-regular)', lineHeight: '20px', color: sysVar('content-success'),
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.2l2.6 2.6L10 3.4" stroke={sysVar('content-success')} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {builtLabel}
          </button>
        ) : (
          <button
            onClick={onBuild}
            disabled={buildState === 'building'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '6px 16px', height: 32, border: 'none',
              cursor: buildState === 'building' ? 'default' : 'pointer',
              background: buildState === 'building' ? 'color-mix(in srgb, var(--rd-sys-color-background-brand) 30%, transparent)' : sysVar('background-brand'), borderRadius: 16,
              fontFamily: FONT, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-regular)', lineHeight: '20px', color: sysVar('content-inverse'),
            }}
          >
            {buildState === 'building' && (
              <span style={{
                width: 12, height: 12, borderRadius: 6, boxSizing: 'border-box', flexShrink: 0,
                border: '2px solid color-mix(in srgb, var(--rd-sys-color-content-inverse) 40%, transparent)', borderTopColor: sysVar('content-inverse'),
                animation: 'aits-spin 0.7s linear infinite',
              }} />
            )}
            <style>{`@keyframes aits-spin { to { transform: rotate(360deg); } }`}</style>
            {buildState === 'building' ? busyLabel : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

const PlanRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', gap: 12 }}>
    <span style={{ width: 96, flexShrink: 0, fontFamily: FONT, fontSize: 13, lineHeight: '19px', color: TEXT_SECONDARY }}>
      {label}
    </span>
    <span style={{ flex: 1, fontFamily: FONT, fontSize: 13.5, lineHeight: '19px', color: TEXT_PRIMARY, overflowWrap: 'anywhere' }}>
      {value}
    </span>
  </div>
);
