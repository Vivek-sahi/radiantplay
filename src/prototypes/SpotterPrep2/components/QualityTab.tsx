import React, { useState, useEffect } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { MODEL, QUALITY_SCORE, GRADE_META, ISSUES, COLUMNS, COLUMNS_CLEAN, RULES_CHAIN, ISSUE_META } from '../data/mockData';
import type { ColumnProfile } from '../data/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QualityState =
  | 'not-cached'
  | 'scanning'
  | 'scanned'
  | 'wip'
  | 'saved'
  | 'published'
  | 'refresh-issues';

interface QualityTabProps {
  qualityState: QualityState;
  onSetupCache: () => void;
  onStartQuality: () => void;
  onRescan?: () => void;
  modelId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

// ── Not-cached state ──────────────────────────────────────────────────────────

const NotCachedState: React.FC<{ onSetupCache: () => void }> = ({ onSetupCache }) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: sp.D, padding: sp.J,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 14,
      backgroundColor: c['background-subtle'],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, color: c['content-secondary'],
    }}>⊟</div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>
        Caching required
      </div>
      <div style={{ fontSize: fs.md, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 400 }}>
        Quality checks run on cached data. Set up caching to get a quality score and start fixing issues.
      </div>
    </div>
    <button
      onClick={onSetupCache}
      style={{
        padding: `${sp.C}px ${sp.E}px`,
        border: 'none', borderRadius: 6,
        backgroundColor: c['background-brand'],
        color: '#fff', fontSize: fs.md, fontWeight: fw.medium,
        cursor: 'pointer', fontFamily: ff.primary,
      }}
    >
      Set up caching
    </button>
  </div>
);

// ── Scanning state ────────────────────────────────────────────────────────────

const SCAN_STEPS = [
  { label: 'Profiling employees table',           duration: 700 },
  { label: 'Profiling payroll table',             duration: 600 },
  { label: 'Profiling performance_reviews table', duration: 500 },
  { label: 'Detecting quality issues',            duration: 900 },
  { label: 'Calculating quality score',           duration: 800 },
];

const ScanningState: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (activeStep >= SCAN_STEPS.length) return;
    const timer = setTimeout(() => setActiveStep(prev => prev + 1), SCAN_STEPS[activeStep].duration);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: sp.D, padding: sp.J,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 380, backgroundColor: c['background-base'],
        border: `1px solid ${c['border-default']}`, borderRadius: 12,
        padding: sp.F, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.D, textAlign: 'center' }}>
          Scanning hr-analytics
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
          {SCAN_STEPS.map((step, i) => {
            const isDone   = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
                <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone ? (
                    <span style={{ fontSize: 14, color: '#15803d' }}>✓</span>
                  ) : isActive ? (
                    <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${c['border-divider']}`, borderTopColor: c['background-brand'], display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c['border-default'], display: 'inline-block' }} />
                  )}
                </div>
                <div style={{ fontSize: fs.sm, color: isDone ? '#15803d' : isActive ? c['content-primary'] : c['content-tertiary'], fontWeight: isActive ? fw.medium : fw.regular, transition: 'color 0.2s' }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], textAlign: 'center', marginTop: sp.D }}>
          Quality checks run on cached data
        </div>
      </div>
    </div>
  );
};

// ── Quality metric tiles ──────────────────────────────────────────────────────

const QualityMetricTiles: React.FC<{
  grade: string;
  projected?: boolean;
}> = ({ grade, projected }) => {
  const gradeMeta = GRADE_META[grade as keyof typeof GRADE_META] ?? { color: '#6b7280', bg: '#f9fafb' };

  return (
    <div style={{ display: 'flex', gap: sp.D, marginBottom: sp.D }}>
      {/* Quality grade */}
      <div style={{ flex: 1, border: `1px solid ${c['border-default']}`, borderRadius: 8, padding: sp.D }}>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginBottom: sp.B }}>Quality grade</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <span style={{ fontSize: fs['2xl'], fontWeight: fw.semibold, color: gradeMeta.color, lineHeight: 1 }}>
            {projected ? `~${grade}` : grade}
          </span>
          {projected && (
            <span style={{ fontSize: 10, fontWeight: fw.medium, color: '#0369a1', backgroundColor: '#e0f2fe', borderRadius: 4, padding: '2px 6px' }}>
              projected
            </span>
          )}
        </div>
      </div>

      {/* Last checked */}
      <div style={{ flex: 1, border: `1px solid ${c['border-default']}`, borderRadius: 8, padding: sp.D }}>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginBottom: sp.B }}>Last checked</div>
        <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
          {fmtDate(MODEL.lastCached)}
        </div>
      </div>
    </div>
  );
};

// ── Column profile table ──────────────────────────────────────────────────────

const OTHER_ISSUE_TYPES = new Set([
  'negative_values', 'float_precision', 'date_format',
  'orphaned_fk', 'impossible_sequence', 'outliers',
]);

const ColumnProfileTable: React.FC<{ columns: ColumnProfile[] }> = ({ columns }) => {
  const issueByColumnId = new Map(ISSUES.map(i => [i.columnId, i]));

  const thStyle: React.CSSProperties = {
    padding: `${sp.C}px ${sp.D}px`,
    textAlign: 'left', fontSize: fs.sm, fontWeight: fw.medium,
    color: c['content-secondary'],
    borderBottom: `1px solid ${c['border-divider']}`,
    whiteSpace: 'nowrap',
    backgroundColor: c['background-subtle'],
  };

  const tdBase: React.CSSProperties = {
    padding: `${sp.C}px ${sp.D}px`,
    borderBottom: `1px solid ${c['border-divider']}`,
    fontSize: fs.sm,
    verticalAlign: 'middle',
  };

  return (
    <div style={{ marginBottom: sp.F }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: sp.C, marginBottom: sp.C }}>
        <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
          Column profile
        </div>
        <div style={{ fontSize: fs.sm, color: c['content-tertiary'] }}>
          {MODEL.totalRows.toLocaleString()} rows · Phase 1 checks
        </div>
      </div>

      <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
          <thead>
            <tr>
              <th style={thStyle}>Column</th>
              <th style={thStyle}>Column type</th>
              <th style={thStyle}>Fill rate</th>
              <th style={thStyle}>Distinct</th>
              <th style={thStyle}>Nulls</th>
              <th style={thStyle}>Duplicates</th>
              <th style={thStyle}>Other issues</th>
            </tr>
          </thead>
          <tbody>
            {columns.map(col => {
              const issue       = issueByColumnId.get(col.id);
              const fillRate    = 100 - col.nullPct;
              const issueMeta   = col.issueType ? ISSUE_META[col.issueType] : null;

              const nullCell = col.issueType === 'null_rate' && issue
                ? `${issue.affectedRows.toLocaleString()} rows`
                : null;

              const dupCell = col.issueType === 'duplicates' && issue
                ? `${issue.affectedRows.toLocaleString()} rows`
                : null;

              const otherCell = col.issueType && OTHER_ISSUE_TYPES.has(col.issueType) && issueMeta && issue
                ? { meta: issueMeta, scope: issue.affectedPct >= 1 ? `${issue.affectedPct}%` : `${issue.affectedRows.toLocaleString()} rows` }
                : null;

              return (
                <tr key={col.id}>
                  {/* Column name + table */}
                  <td style={{ ...tdBase, color: c['content-primary'] }}>
                    <div style={{ fontWeight: fw.medium, fontFamily: ff.mono, fontSize: fs.sm }}>{col.name}</div>
                    <div style={{ fontSize: 10, color: c['content-tertiary'], fontFamily: ff.mono, marginTop: 1 }}>{col.table}</div>
                  </td>

                  {/* Column type */}
                  <td style={tdBase}>
                    <span style={{ fontSize: 10, fontFamily: ff.mono, fontWeight: fw.medium, color: '#7c3aed', backgroundColor: '#f5f3ff', borderRadius: 3, padding: '1px 5px' }}>
                      {col.dataType}
                    </span>
                  </td>

                  {/* Fill rate */}
                  <td style={{ ...tdBase, color: fillRate === 100 ? c['content-tertiary'] : c['content-secondary'] }}>
                    {fillRate === 100 ? '100%' : `${fillRate.toFixed(1)}%`}
                  </td>

                  {/* Distinct */}
                  <td style={{ ...tdBase, color: c['content-secondary'] }}>
                    {col.uniqueCount.toLocaleString()}
                  </td>

                  {/* Nulls */}
                  <td style={{ ...tdBase, color: nullCell ? '#c2410c' : c['content-tertiary'] }}>
                    {nullCell ?? '—'}
                  </td>

                  {/* Duplicates */}
                  <td style={{ ...tdBase, color: dupCell ? '#be185d' : c['content-tertiary'] }}>
                    {dupCell ?? '—'}
                  </td>

                  {/* Other issues */}
                  <td style={tdBase}>
                    {otherCell ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: sp.B }}>
                        <span style={{ fontSize: 10, fontWeight: fw.medium, color: otherCell.meta.color, backgroundColor: otherCell.meta.bg, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {otherCell.meta.label}
                        </span>
                        <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{otherCell.scope}</span>
                      </div>
                    ) : (
                      <span style={{ color: c['content-tertiary'] }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Rules chain section (used in saved state) ─────────────────────────────────

const RulesChainSection: React.FC = () => {
  const thStyle: React.CSSProperties = {
    padding: `${sp.C}px ${sp.D}px`,
    textAlign: 'left', fontSize: fs.sm, fontWeight: fw.medium,
    color: c['content-secondary'],
    borderBottom: `1px solid ${c['border-divider']}`,
    whiteSpace: 'nowrap',
    backgroundColor: c['background-subtle'],
  };
  const tdStyle: React.CSSProperties = {
    padding: `${sp.C}px ${sp.D}px`,
    borderBottom: `1px solid ${c['border-divider']}`,
    fontSize: fs.sm,
    verticalAlign: 'middle',
  };
  return (
    <div style={{ marginBottom: sp.F }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: sp.C, marginBottom: sp.C }}>
        <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Rules chain</div>
        <div style={{ fontSize: fs.sm, color: c['content-tertiary'] }}>7 rules · Runs on next cache refresh</div>
      </div>
      <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Column</th>
              <th style={thStyle}>Rule</th>
              <th style={thStyle}>Type</th>
            </tr>
          </thead>
          <tbody>
            {RULES_CHAIN.map(rule => {
              const meta = ISSUE_META[rule.issueType];
              return (
                <tr key={rule.id}>
                  <td style={{ ...tdStyle, color: c['content-primary'] }}>
                    <div style={{ fontWeight: fw.medium, fontFamily: ff.mono, fontSize: fs.sm }}>{rule.column}</div>
                    <div style={{ fontSize: 10, color: c['content-tertiary'], fontFamily: ff.mono, marginTop: 1 }}>{rule.table}</div>
                  </td>
                  <td style={{ ...tdStyle, color: c['content-secondary'] }}>{rule.rule}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 10, fontWeight: fw.medium, color: meta.color, backgroundColor: meta.bg, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Saved / published state ───────────────────────────────────────────────────

const SavedState: React.FC<{
  onStartQuality: () => void;
  onRescan?: () => void;
}> = ({ onStartQuality, onRescan }) => {
  const grade = QUALITY_SCORE.after.grade;

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes quality-fadein { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ flex: 1, overflowY: 'auto', animation: 'quality-fadein 0.4s ease both' }}>
        <div style={{ padding: `${sp.D}px ${sp.F}px ${sp.C}px` }}>

          {/* Saved banner */}
          <div style={{ marginBottom: sp.D, padding: `${sp.C}px ${sp.D}px`, backgroundColor: '#f0fdf4', border: `1px solid #86efac`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: sp.C, fontSize: fs.sm, color: '#15803d', fontWeight: fw.medium }}>
            <span>✓</span> Rules saved — 7 rules will apply on next cache refresh
          </div>

          {/* Section header with actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: sp.D }}>
            <div>
              <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Quality</div>
              <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2 }}>
                Scanned {fmtDate(MODEL.lastCached)} · {MODEL.totalRows.toLocaleString()} rows
              </div>
            </div>
            <div style={{ display: 'flex', gap: sp.B, flexShrink: 0 }}>
              <button
                onClick={() => onRescan?.()}
                style={{ padding: `${sp.B}px ${sp.D}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.sm, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: sp.A }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M10 6a4 4 0 1 1-1.17-2.83" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rescan
              </button>
              <button
                onClick={onStartQuality}
                style={{ padding: `${sp.B}px ${sp.D}px`, border: 'none', borderRadius: 6, backgroundColor: c['background-brand'], color: '#fff', fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d5fd4')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-brand'])}
              >
                Prep model
              </button>
            </div>
          </div>

          {/* Metric tiles */}
          <QualityMetricTiles grade={grade} projected />

          {/* Column profile — clean data */}
          <ColumnProfileTable columns={COLUMNS_CLEAN} />

          {/* Rules chain */}
          <RulesChainSection />
        </div>
      </div>
    </div>
  );
};

// ── Refresh-issues state ──────────────────────────────────────────────────────

const RefreshIssuesState: React.FC<{ onStartQuality: () => void }> = ({ onStartQuality }) => (
  <div style={{ flex: 1, overflowY: 'auto' }}>
    <div style={{ margin: sp.F, marginBottom: 0, padding: `${sp.C}px ${sp.D}px`, backgroundColor: '#fff7ed', border: `1px solid #fed7aa`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: sp.C, fontSize: fs.sm, color: '#c2410c', fontWeight: fw.medium }}>
      <span>⚠</span>
      3 new issues found since your last session — your existing rules don't cover these.
    </div>
    <div style={{ margin: sp.F, backgroundColor: c['background-base'], borderRadius: 10, border: `1px solid ${c['border-default']}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ flex: 1, padding: `${sp.D}px ${sp.F}px` }}>
          <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quality grade</div>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginBottom: sp.A }}>
            <span style={{ fontSize: 22, fontWeight: fw.semibold, color: '#b45309', lineHeight: 1 }}>B</span>
          </div>
          <div style={{ fontSize: fs.sm, color: '#dc2626' }}>↓ −17 since last session (was A)</div>
        </div>
        <div style={{ width: 1, backgroundColor: c['border-divider'], flexShrink: 0 }} />
        <div style={{ flex: 1, padding: `${sp.D}px ${sp.F}px` }}>
          <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Issues</div>
          <div style={{ fontSize: 22, fontWeight: fw.semibold, color: '#dc2626', lineHeight: 1, marginBottom: sp.A }}>3 new</div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>9 previously resolved</div>
        </div>
        <div style={{ width: 1, backgroundColor: c['border-divider'], flexShrink: 0 }} />
        <div style={{ flex: 1, padding: `${sp.D}px ${sp.F}px` }}>
          <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rules chain</div>
          <div style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1, marginBottom: sp.A }}>7 rules</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: fs.sm, color: '#15803d' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#15803d', display: 'inline-block', flexShrink: 0 }} />
            Active · Last run: May 19, 2026
          </div>
        </div>
        <div style={{ width: 1, backgroundColor: c['border-divider'], flexShrink: 0 }} />
        <div style={{ padding: `${sp.D}px ${sp.F}px`, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onStartQuality}
            style={{ padding: `${sp.C}px ${sp.E}px`, border: 'none', borderRadius: 6, backgroundColor: c['background-brand'], color: '#fff', fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}
          >
            Fix issues with agent
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── QualityTab ────────────────────────────────────────────────────────────────

const QualityTab: React.FC<QualityTabProps> = ({ qualityState, onSetupCache, onStartQuality, onRescan }) => {
  if (qualityState === 'not-cached') {
    return <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><NotCachedState onSetupCache={onSetupCache} /></div>;
  }

  if (qualityState === 'scanning') {
    return <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><ScanningState /></div>;
  }

  if (qualityState === 'scanned' || qualityState === 'wip') {
    const isWip = qualityState === 'wip';
    const grade = isWip ? QUALITY_SCORE.after.grade : QUALITY_SCORE.before.grade;

    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes quality-fadein { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div style={{ flex: 1, overflowY: 'auto', animation: 'quality-fadein 0.4s ease both' }}>
          {isWip && (
            <div style={{ margin: sp.F, marginBottom: 0, padding: `${sp.C}px ${sp.D}px`, backgroundColor: '#eff6ff', border: `1px solid #93c5fd`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: sp.C, fontSize: fs.sm, color: '#1d4ed8', fontWeight: fw.medium }}>
              <span>●</span> Session in progress — unsaved changes
            </div>
          )}

          <div style={{ padding: `${sp.D}px ${sp.F}px ${sp.C}px` }}>
            {/* Section header with actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: sp.D }}>
              <div>
                <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Quality</div>
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2 }}>
                  Scanned {fmtDate(MODEL.lastCached)} · {MODEL.totalRows.toLocaleString()} rows
                </div>
              </div>
              <div style={{ display: 'flex', gap: sp.B, flexShrink: 0 }}>
                <button
                  onClick={() => onRescan?.()}
                  style={{ padding: `${sp.B}px ${sp.D}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.sm, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: sp.A }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path d="M10 6a4 4 0 1 1-1.17-2.83" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Rescan
                </button>
                <button
                  onClick={onStartQuality}
                  style={{ padding: `${sp.B}px ${sp.D}px`, border: 'none', borderRadius: 6, backgroundColor: c['background-brand'], color: '#fff', fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d5fd4')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-brand'])}
                >
                  Prep model
                </button>
              </div>
            </div>

            {/* Metric tiles */}
            <QualityMetricTiles grade={grade} projected={isWip} />

            {/* Column profile */}
            <ColumnProfileTable columns={COLUMNS} />
          </div>
        </div>
      </div>
    );
  }

  if (qualityState === 'saved' || qualityState === 'published') {
    return <SavedState onStartQuality={onStartQuality} onRescan={onRescan} />;
  }

  if (qualityState === 'refresh-issues') {
    return <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><RefreshIssuesState onStartQuality={onStartQuality} /></div>;
  }

  return null;
};

export default QualityTab;
