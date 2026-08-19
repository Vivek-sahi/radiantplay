// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  DATA QUALITY DISCOVERABILITY — Playground explorations                  ║
// ║                                                                          ║
// ║  Parallel to CacheDiscoverability. Five model-level quality indicators,  ║
// ║  one shared modal that opens the existing plan-view pattern.             ║
// ║                                                                          ║
// ║  Premise: column-level quality already shows in ColumnsView (null %,     ║
// ║  duplicates, etc.). What's missing is a *model-level* surface that       ║
// ║  tells Sara whether this model has unresolved problems before she        ║
// ║  publishes / shares / cuts a question. Click → review plan.              ║
// ║                                                                          ║
// ║  Modal echoes review_data_quality plan view: agent intro + per-issue     ║
// ║  proposed fix + apply / review with agent. Same orthogonality            ║
// ║  principle as cache (not a pipeline step, an attribute of the model).   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import React, { useState } from 'react';
import { c, sp, ff, fs, fw, ts, HEADER_HEIGHT } from './styles';

// ── Quality plan config ──────────────────────────────────────────────────────

type Severity = 'high' | 'medium' | 'low';

interface QualityIssue {
  id: string;
  column: string;
  table: string;
  issue: string;
  fix: string;
  severity: Severity;
  selected: boolean;
}

const ISSUES: QualityIssue[] = [
  { id: '1', column: 'campaign_id',   table: 'campaigns', issue: '18% null values',                    fix: 'Drop rows where campaign_id is null',           severity: 'high',   selected: true },
  { id: '2', column: 'amount',        table: 'orders',    issue: 'Mixed currencies (USD, EUR, INR)',   fix: 'Normalize to USD using daily FX rates',          severity: 'high',   selected: true },
  { id: '3', column: 'user_id',       table: 'users',     issue: '2.4% duplicate IDs',                  fix: 'Keep first occurrence by signup_date',          severity: 'high',   selected: true },
  { id: '4', column: 'channel',       table: 'campaigns', issue: 'Inconsistent casing (Email/email)',  fix: 'Lowercase all values',                          severity: 'medium', selected: true },
  { id: '5', column: 'segment',       table: 'users',     issue: 'Free-text values (12 distinct)',      fix: 'Map to 4 canonical segments',                    severity: 'medium', selected: true },
  { id: '6', column: 'order_date',    table: 'orders',    issue: 'Mixed formats (ISO, US, "yesterday")', fix: 'Parse all to ISO 8601',                          severity: 'medium', selected: true },
  { id: '7', column: 'spend',         table: 'campaigns', issue: '0.4% anomalies (>$1M outliers)',      fix: 'Flag rows for review; do not drop',              severity: 'medium', selected: true },
  { id: '8', column: 'budget',        table: 'campaigns', issue: 'Missing description',                 fix: 'Add: "Allocated budget for the campaign in USD"', severity: 'low',    selected: true },
  { id: '9', column: 'lifetime_value', table: 'users',     issue: 'Missing description',                 fix: 'Add: "Sum of all order amounts to date"',         severity: 'low',    selected: true },
];

// ── Severity styling ─────────────────────────────────────────────────────────

// Mirrors DataQualityPlanModal's palette so the two modals read as siblings.
const SEV_COLORS: Record<Severity, { bg: string; fg: string; chip: string }> = {
  high:   { bg: '#FEF2F2', fg: '#DC2626', chip: '#DC2626' },
  medium: { bg: '#FFFBEB', fg: '#D97706', chip: '#D97706' },
  low:    { bg: '#F0FDF4', fg: '#16A34A', chip: '#16A34A' },
};

const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => (
  <span style={{
    fontSize: 12, fontWeight: fw.medium,
    padding: '2px 7px', borderRadius: 3,
    backgroundColor: SEV_COLORS[severity].bg,
    color: SEV_COLORS[severity].fg,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }}>
    {severity}
  </span>
);

// ── Shared quality plan modal ────────────────────────────────────────────────

export const QualityModal: React.FC<{ onClose: () => void; onReviewWithAgent: () => void; triggeredBy?: string }> = ({ onClose, onReviewWithAgent, triggeredBy }) => {
  const issues = ISSUES;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const medCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, fontFamily: ff.primary }}>
      <div style={{ width: 720, maxHeight: '88vh', backgroundColor: c['background-base'], borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ height: 56, padding: `0 ${sp.E}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Review data quality</div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>
              Campaign Performance · v1{triggeredBy && <span style={{ marginLeft: sp.B, color: c['content-tertiary'] }}>· opened from {triggeredBy}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: c['content-secondary'], fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: sp.E }}>

          {/* Summary intro — plain explainer (matches review-plan modal style) */}
          <div style={{ marginBottom: sp.E }}>
            <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-secondary'], lineHeight: '20px' }}>
              Found <strong style={{ color: c['content-primary'] }}>9 quality issues across 4 columns</strong>. This is a summary of what was detected — null values, duplicates, mixed formats, and missing descriptions that could affect how Spotter answers questions. To get a fix plan with proposed transforms, review with the agent.
            </p>
            <div style={{ display: 'flex', gap: sp.C }}>
              <StatPill label="High"   count={highCount} color={SEV_COLORS.high.fg}   bg={SEV_COLORS.high.bg} />
              <StatPill label="Medium" count={medCount}  color={SEV_COLORS.medium.fg} bg={SEV_COLORS.medium.bg} />
              <StatPill label="Low"    count={lowCount}  color={SEV_COLORS.low.fg}    bg={SEV_COLORS.low.bg} />
              <StatPill label="total"  count={issues.length} color={c['content-secondary']} bg={c['background-sunken']} />
            </div>
          </div>

          {/* Issue summary list — no fixes, just what was found */}
          <ModalSection title="What we found" subtitle="Grouped by severity. Review with agent for proposed fixes.">
            {(['high', 'medium', 'low'] as Severity[]).map(sev => {
              const subset = issues.filter(i => i.severity === sev);
              if (!subset.length) return null;
              return (
                <div key={sev} style={{ marginBottom: sp.D }}>
                  {subset.map(issue => (
                    <div key={issue.id} style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C, padding: `${sp.C}px 0`, borderBottom: `1px solid ${c['border-divider']}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A }}>
                          <code style={{ fontSize: fs.xs, fontFamily: ff.mono, color: c['content-primary'], backgroundColor: c['background-subtle'], padding: '1px 6px', borderRadius: 4 }}>{issue.table}.{issue.column}</code>
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        <div style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: 1.45 }}>
                          {issue.issue}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </ModalSection>
        </div>

        {/* Footer */}
        <div style={{ height: 64, padding: `0 ${sp.E}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: sp.B, flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: 32, padding: '0 14px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-primary'] }}>
            Cancel
          </button>
          <button onClick={onReviewWithAgent} style={{ height: 32, padding: '0 16px', border: 'none', borderRadius: 6, backgroundColor: '#2563EB', color: 'white', cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: sp.B }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
            Review with agent
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal sub-components ─────────────────────────────────────────────────────

const ModalSection: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={{ marginBottom: sp.E }}>
    <div style={{ marginBottom: sp.C }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{title}</div>
      {subtitle && <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

const StatPill: React.FC<{ label: string; count: number; color: string; bg: string }> = ({ label, count, color, bg }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: sp.B, padding: '4px 10px', borderRadius: 12, backgroundColor: bg, color, fontSize: fs.xs, fontFamily: ff.primary, fontWeight: fw.medium }}>
    <span style={{ fontWeight: fw.semibold }}>{count}</span>
    <span style={{ opacity: 0.85 }}>{label}</span>
  </div>
);

// ── Header building blocks (shared with Publish/Share group) ────────────────

const ProjectIdentity: React.FC = () => (
  <>
    <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>Campaign Performance</span>
    <span style={{ fontSize: 12, fontWeight: fw.regular, color: c['content-secondary'] }}>v1</span>
  </>
);

const StandardActions: React.FC = () => (
  <>
    <button title="More" style={iconBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="1.5" fill={c['content-secondary']}/>
        <circle cx="3.75" cy="9" r="1.5" fill={c['content-secondary']}/>
        <circle cx="14.25" cy="9" r="1.5" fill={c['content-secondary']}/>
      </svg>
    </button>
    <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0 }} />
    <button title="Share" style={iconBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="3.75" r="2.25"/><circle cx="4.5" cy="9" r="2.25"/><circle cx="13.5" cy="14.25" r="2.25"/>
        <line x1="6.44" y1="10.13" x2="11.56" y2="13.12"/><line x1="11.56" y1="4.88" x2="6.44" y2="7.87"/>
      </svg>
    </button>
    <button style={publishBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
    >
      <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/>
        <line x1="3" y1="15.75" x2="15" y2="15.75"/>
      </svg>
      Publish
    </button>
  </>
);

// ── Five header variants ─────────────────────────────────────────────────────

// DQ1 — Issue count near identity (subtlest)
// Frames quality as a model property, like Draft/v1. Easy to miss but doesn't
// nag a user who's deep in the work.
const HeaderDQ1: React.FC<{ onQualityClick: () => void }> = ({ onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <button onClick={onQualityClick}
      style={{ height: 22, padding: '0 8px', border: 'none', borderRadius: 11, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: sp.B, fontSize: 12, fontFamily: ff.primary, color: SEV_COLORS.high.fg }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = SEV_COLORS.high.bg}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke={SEV_COLORS.high.fg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 1.5L1.5 15.75H16.5L9 1.5Z"/>
        <line x1="9" y1="7" x2="9" y2="10.5"/>
        <circle cx="9" cy="13" r="0.5" fill={SEV_COLORS.high.fg}/>
      </svg>
      9 quality issues
    </button>
    <div style={rightActionsStyle}>
      <StandardActions />
    </div>
  </div>
);

// DQ2 — Action chip "Review quality" (loud CTA)
// Reads as a CTA in the action group. Direct and explicit. Risk: feels pushy
// when a user is mid-build and not ready to review.
const HeaderDQ2: React.FC<{ onQualityClick: () => void }> = ({ onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <div style={rightActionsStyle}>
      <button onClick={onQualityClick}
        style={{ height: 26, padding: '0 12px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: sp.B, fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-primary'] }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = c['background-base']}
      >
        <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="9" r="6.5"/>
          <path d="M6 9l2 2 4-4"/>
        </svg>
        Review quality
      </button>
      <StandardActions />
    </div>
  </div>
);

// DQ3 — Split state + action
// Always-visible state ("9 issues · 3 high") + dedicated Review button. Most
// explicit. Tradeoff: takes more horizontal space; severity is cued only via
// secondary text.
const HeaderDQ3: React.FC<{ onQualityClick: () => void }> = ({ onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <div style={rightActionsStyle}>
      <span style={{ fontSize: 12, color: c['content-secondary'], fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: sp.B, marginRight: sp.A }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: SEV_COLORS.high.chip }} />
        9 issues · 3 high
      </span>
      <button onClick={onQualityClick} style={secondaryBtn}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = c['background-base']}
      >
        Review
      </button>
      <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0 }} />
      <StandardActions />
    </div>
  </div>
);

// DQ4 — Health score (single-number, code-coverage style)
// Quality as a percentage. Easy to skim. Risk: percentages imply a denominator
// that doesn't exist for semantic quality, so the number may mislead. Color is
// derived from the score band.
const HeaderDQ4: React.FC<{ onQualityClick: () => void }> = ({ onQualityClick }) => {
  const score = 76;
  const tone = score >= 90 ? { bg: '#D1FAE5', fg: '#065F46', dot: '#10B981' }
             : score >= 70 ? { bg: '#FEF3C7', fg: '#92400E', dot: '#D97706' }
             : { bg: '#FEE2E2', fg: '#991B1B', dot: '#DC2626' };
  return (
    <div style={mainHeaderStyle}>
      <ProjectIdentity />
      <div style={rightActionsStyle}>
        <button onClick={onQualityClick}
          style={{ height: 26, padding: '0 10px', border: `1px solid ${tone.fg}33`, borderRadius: 6, backgroundColor: tone.bg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: sp.B, fontSize: 12, fontFamily: ff.primary, color: tone.fg }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: tone.dot }} />
          Quality {score}%
          <span style={{ fontSize: 12, opacity: 0.85 }}>· 9 issues</span>
        </button>
        <StandardActions />
      </div>
    </div>
  );
};

// DQ5 — Severity-colored chip (loudest)
// Surfaces severity directly in the chip. Color matches the high-severity tone.
// Most urgent-feeling. Risk: stays loud even when issues are mostly cosmetic
// (low severity), creating fatigue.
const HeaderDQ5: React.FC<{ onQualityClick: () => void }> = ({ onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <div style={rightActionsStyle}>
      <button onClick={onQualityClick}
        style={{ height: 26, padding: '0 10px', border: `1px solid ${SEV_COLORS.high.chip}55`, borderRadius: 6, backgroundColor: SEV_COLORS.high.bg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: sp.B, fontSize: 12, fontFamily: ff.primary, color: SEV_COLORS.high.fg, fontWeight: fw.medium }}
      >
        <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke={SEV_COLORS.high.fg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 1.5L1.5 15.75H16.5L9 1.5Z"/>
          <line x1="9" y1="7" x2="9" y2="10.5"/>
          <circle cx="9" cy="13" r="0.5" fill={SEV_COLORS.high.fg}/>
        </svg>
        3 high · 6 medium
      </button>
      <StandardActions />
    </div>
  </div>
);

// ── Single comparison page ───────────────────────────────────────────────────

interface VariantSpec {
  id: string;
  label: string;
  blurb: string;
  Header: React.FC<{ onQualityClick: () => void }>;
}

const VARIANTS: VariantSpec[] = [
  { id: 'DQ1', label: 'Issue count near identity', blurb: 'Subtle red text chip next to the version. Quality framed as a model property. Quietest. May be missed when scanning the header.', Header: HeaderDQ1 },
  { id: 'DQ2', label: 'Action chip "Review quality"', blurb: 'Generic review CTA next to Share / Publish. Doesn\'t leak severity until you click. Risks feeling pushy mid-build.', Header: HeaderDQ2 },
  { id: 'DQ3', label: 'Split state + action', blurb: '"9 issues · 3 high" label + dedicated Review button. State always visible, action always one click away. Most explicit.', Header: HeaderDQ3 },
  { id: 'DQ4', label: 'Health score', blurb: 'Code-coverage-style percentage. Skimmable. Tests whether a single quality score number actually means anything for semantic quality — my hunch is it doesn\'t.', Header: HeaderDQ4 },
  { id: 'DQ5', label: 'Severity-colored chip', blurb: 'Amber/red chip showing high + medium counts. Loudest. Risk: stays loud even when issues are cosmetic, creating fatigue.', Header: HeaderDQ5 },
];

export const DataQualityDiscoverabilityCompare: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary, overflow: 'auto' }}>

      {/* Page header */}
      <div style={{ padding: '40px 48px 24px', maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 12, fontWeight: fw.medium, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: sp.B }}>Playground · Data quality discoverability</div>
        <div style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.C }}>Five header variants for surfacing data quality at the model level</div>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 780 }}>
          Column-level quality already shows in ColumnsView (null %, duplicates, anomalies). What's missing is a model-level surface that tells Sara whether the model has unresolved problems before publish or share. All five variants click through to the same plan modal — the existing <code style={{ fontSize: fs.xs, padding: '1px 6px', backgroundColor: c['background-subtle'], borderRadius: 4 }}>review_data_quality</code> output as a standalone surface, with a "Review with agent" alternative in the footer.
        </div>
      </div>

      {/* Variant stack */}
      <div style={{ padding: '0 48px 80px', display: 'flex', flexDirection: 'column', gap: 36, maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        {VARIANTS.map(v => (
          <div key={v.id}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: sp.C, marginBottom: sp.B }}>
              <span style={{ fontSize: 12, fontFamily: ff.mono, fontWeight: fw.medium, color: c['content-tertiary'], letterSpacing: '0.06em', backgroundColor: c['background-subtle'], padding: '3px 7px', borderRadius: 4 }}>
                {v.id}
              </span>
              <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>{v.label}</span>
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.55, marginBottom: sp.D, maxWidth: 780 }}>{v.blurb}</div>
            <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <v.Header onQualityClick={() => { setActiveVariant(v.id); setModalOpen(true); }} />
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <QualityModal
          onClose={() => { setModalOpen(false); setActiveVariant(null); }}
          onReviewWithAgent={() => { setModalOpen(false); setActiveVariant(null); }}
          triggeredBy={activeVariant ?? undefined}
        />
      )}
    </div>
  );
};

// ── Style helpers ────────────────────────────────────────────────────────────

const mainHeaderStyle: React.CSSProperties = {
  height: HEADER_HEIGHT,
  backgroundColor: c['background-base'],
  borderBottom: `1px solid ${c['border-divider']}`,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${sp.D}px`,
  gap: sp.C,
  flexShrink: 0,
};

const rightActionsStyle: React.CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: sp.B,
};

const iconBtn: React.CSSProperties = {
  width: 26, height: 26, padding: sp.A,
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  backgroundColor: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxSizing: 'border-box',
};

const secondaryBtn: React.CSSProperties = {
  height: 26, padding: '0 12px',
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  backgroundColor: c['background-base'], cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: sp.B,
  fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary,
  color: c['content-primary'], boxSizing: 'border-box',
};

const publishBtn: React.CSSProperties = {
  height: 26, padding: '0 14px',
  border: 'none', borderRadius: 6,
  backgroundColor: '#2563EB', color: 'white',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: sp.B,
  fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary,
  boxSizing: 'border-box',
  transition: 'background-color 0.15s',
};
