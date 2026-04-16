import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { c, sp, fs, fw, ff } from '../styles';
import { COLUMNS, ISSUES, QUALITY_SCORE, GRADE_META, MODEL, PREP_HISTORY } from '../data/mockData';
import CacheSettingsModal from './CacheSettingsModal';
import PrepHistoryModal from './PrepHistoryModal';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QualityState = 'not-cached' | 'ready' | 'post-prep';

interface QualityTabProps {
  qualityState: QualityState;
  onSetupCache: () => void;
  onStartPrep: (path?: string) => void;
  modelId?: string;
  requiresCacheForPrep?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNumber = (n: number) => n.toLocaleString();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

// ── Tooltip ───────────────────────────────────────────────────────────────────

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, cursor: 'default' }}
      onMouseEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect();
          setPos({ x: r.left + r.width / 2, y: r.top });
        }
      }}
      onMouseLeave={() => setPos(null)}
    >
      <span style={{ fontSize: 10, color: c['content-tertiary'] }}>ⓘ</span>
      {pos && createPortal(
        <span style={{
          position: 'fixed', left: pos.x, top: pos.y - 6,
          transform: 'translate(-50%, -100%)',
          backgroundColor: c['background-base-inverse'], color: c['content-primary-inverse'],
          borderRadius: 4, padding: '4px 8px',
          fontSize: 11, whiteSpace: 'nowrap', zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)', pointerEvents: 'none',
        }}>{text}</span>,
        document.body
      )}
    </span>
  );
};

// ── Metrics strip ─────────────────────────────────────────────────────────────

const MetricsStrip: React.FC<{
  qualityState: QualityState;
  onStartPrep: (path?: string) => void;
  onViewDetails: () => void;
  modelId?: string;
}> = ({ qualityState, onStartPrep, onViewDetails, modelId }) => {
  const isPostPrep = qualityState === 'post-prep';
  const isCampaign = modelId === 'campaign-perf';
  const scoreData  = isCampaign
    ? { score: 38, grade: 'F' as const }
    : (isPostPrep ? QUALITY_SCORE.after : QUALITY_SCORE.before);
  const gradeMeta  = GRADE_META[scoreData.grade];
  const lastRun    = PREP_HISTORY[0];
  const [tablesPopover, setTablesPopover] = useState<{ x: number; y: number } | null>(null);

  type Metric = { id: string; label: string; value: React.ReactNode; sub: React.ReactNode };

  const metrics: Metric[] = [
    {
      id: 'refresh',
      label: 'Last refreshed',
      value: fmtDate(MODEL.lastCached),
      sub: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: fs.sm, color: '#15803d' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#15803d', display: 'inline-block', flexShrink: 0 }} />
          Success
        </span>
      ),
    },
    {
      id: 'source',
      label: 'Source',
      value: MODEL.connection,
      sub: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.B, flexWrap: 'wrap' }}>
          <span style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: 'monospace' }}>
            {MODEL.tables[0]} + {MODEL.tables.length - 1} more
          </span>
          <button
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTablesPopover(tablesPopover ? null : { x: rect.left, y: rect.bottom + 4 });
            }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: fs.sm, color: c['content-brand'], fontFamily: ff.primary,
              textDecoration: 'underline', whiteSpace: 'nowrap',
            }}
          >
            View tables
          </button>
        </span>
      ),
    },
    {
      id: 'score',
      label: 'Quality score',
      value: (
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1 }}>
            {scoreData.score}
          </span>
          <span style={{ fontSize: fs.sm, color: c['content-tertiary'] }}>/ 100</span>
          <span style={{
            fontSize: fs.sm, fontWeight: fw.semibold,
            color: gradeMeta.color, backgroundColor: gradeMeta.bg,
            borderRadius: 4, padding: '1px 7px',
          }}>{scoreData.grade}</span>
        </span>
      ),
      sub: (
        <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
          {isPostPrep ? 'Updated after last prep run' : 'Calculated from baseline checks'}
        </span>
      ),
    },
    ...(isPostPrep ? [{
      id: 'prepjob',
      label: 'Last prep job',
      value: fmtDate(lastRun.runAt),
      sub: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.B, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: fs.sm, color: '#b45309' }}>
            <span>⚠</span>
            {lastRun.operationsSucceeded} of {lastRun.operationsRun} passed
          </span>
          <button
            onClick={onViewDetails}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: fs.sm, color: c['content-brand'], fontFamily: ff.primary,
              textDecoration: 'underline', whiteSpace: 'nowrap',
            }}
          >
            View details
          </button>
        </span>
      ),
    }] as Metric[] : []),
  ];

  return (
    <div style={{
      margin: sp.F,
      backgroundColor: c['background-base'],
      borderRadius: 10,
      border: `1px solid ${c['border-default']}`,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {metrics.map((m, i) => (
          <React.Fragment key={m.id}>
            {i > 0 && <div style={{ width: 1, backgroundColor: c['border-divider'], flexShrink: 0 }} />}
            <div style={{ flex: 1, padding: `${sp.D}px ${sp.F}px`, minWidth: 0 }}>
              <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {m.label}
              </div>
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A }}>
                {m.value}
              </div>
              <div>{m.sub}</div>
            </div>
          </React.Fragment>
        ))}
        <div style={{ width: 1, backgroundColor: c['border-divider'], flexShrink: 0 }} />
        <div style={{ padding: `${sp.D}px ${sp.F}px`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => onStartPrep()}
            style={{
              padding: `${sp.B}px ${sp.E}px`,
              border: 'none', borderRadius: 6,
              backgroundColor: c['background-brand'],
              color: '#fff', fontSize: fs.sm, fontWeight: fw.medium,
              cursor: 'pointer', fontFamily: ff.primary,
              whiteSpace: 'nowrap',
            }}
          >
            Prep with agent
          </button>
        </div>
      </div>

      {/* Tables popover */}
      {tablesPopover && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setTablesPopover(null)} />
          <div style={{
            position: 'fixed',
            left: tablesPopover.x,
            top: tablesPopover.y,
            minWidth: 220,
            backgroundColor: c['background-base'],
            border: `1px solid ${c['border-default']}`,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
            fontFamily: ff.primary,
            overflow: 'hidden',
          }}>
            <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
              <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>
                Tables in {MODEL.connection}
              </span>
            </div>
            <div style={{ padding: `${sp.B}px 0` }}>
              {MODEL.tables.map(table => (
                <div key={table} style={{ padding: `${sp.B}px ${sp.D}px`, fontSize: fs.sm, fontFamily: 'monospace', color: c['content-primary'] }}>
                  {table}
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

// ── Column profile table ──────────────────────────────────────────────────────

const ISSUE_COLS: { key: string; label: string; tooltip: string }[] = [
  { key: 'nulls',         label: 'Null %',            tooltip: 'Percentage of rows with NULL values in this column' },
  { key: 'duplicates',    label: 'Duplicates',         tooltip: 'Rows with duplicate values that may indicate data entry errors' },
  { key: 'anomaly',       label: 'Anomalies',          tooltip: 'Values more than 3 standard deviations from the column mean' },
  { key: 'blanks',        label: 'Blanks',             tooltip: 'Rows with empty strings or whitespace-only values' },
  { key: 'type_mismatch', label: 'Inconsistent types', tooltip: 'Rows where the value does not match the declared column data type' },
];

const issuesByColumn = ISSUES.reduce<Record<string, typeof ISSUES[0]>>((acc, issue) => {
  acc[issue.columnId] = issue;
  return acc;
}, {});

const ColumnProfileTable: React.FC<{ qualityState: QualityState }> = ({ qualityState }) => {
  const isPostPrep = qualityState === 'post-prep';
  const [fixPopover, setFixPopover] = useState<{ columnId: string; x: number; y: number } | null>(null);

  const thStyle: React.CSSProperties = {
    padding: `${sp.C}px ${sp.D}px`, textAlign: 'left',
    fontSize: fs.md, fontWeight: fw.medium, color: c['content-secondary'],
    borderBottom: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap',
  };

  const activeIssue = fixPopover
    ? ISSUES.find(iss => iss.columnId === fixPopover.columnId) ?? null
    : null;

  return (
    <div style={{ margin: `0 ${sp.F}px ${sp.F}px` }}>
      <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.C }}>
        Column profile
      </div>
      <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
          <thead>
            <tr style={{ backgroundColor: c['background-subtle'] }}>
              <th style={thStyle}>Column</th>
              <th style={thStyle}>Data type</th>
              {ISSUE_COLS.map(ic => (
                <th key={ic.key} style={thStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {ic.label}<Tooltip text={ic.tooltip} />
                  </span>
                </th>
              ))}
              {isPostPrep && <th style={thStyle}>Applied fix</th>}
            </tr>
          </thead>
          <tbody>
            {COLUMNS.map((col, i) => {
              const issue = issuesByColumn[col.id];
              const rowBg = i % 2 === 0 ? c['background-base'] : c['background-sunken'];
              const dash  = <span style={{ color: c['content-tertiary'] }}>—</span>;

              const fixCell = issue
                ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setFixPopover(fixPopover?.columnId === col.id ? null : {
                        columnId: col.id,
                        x: rect.left,
                        y: rect.bottom + 6,
                      });
                    }}
                    style={{
                      padding: '2px 8px',
                      border: `1px solid #86efac`,
                      borderRadius: 4,
                      backgroundColor: '#f0fdf4',
                      fontSize: 11, fontWeight: fw.medium, color: '#15803d',
                      cursor: 'pointer', fontFamily: ff.primary,
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    ✓ Fix applied <span style={{ fontSize: 10, opacity: 0.7 }}>›</span>
                  </button>
                )
                : dash;

              return (
                <tr key={col.id} style={{ backgroundColor: rowBg }}>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontWeight: fw.medium, color: c['content-primary'], fontSize: fs.md }}>{col.name}</td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: fw.medium, color: '#7c3aed', backgroundColor: '#f5f3ff', borderRadius: 3, padding: '1px 5px' }}>{col.dataType}</span>
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-primary'] }}>
                    {isPostPrep ? dash : col.nullPct === 0 ? dash : `${col.nullPct.toFixed(1)}%`}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-tertiary'] }}>
                    {isPostPrep || issue?.issueType !== 'duplicates' ? dash : fmtNumber(issue.affectedRows)}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-tertiary'] }}>
                    {isPostPrep || issue?.issueType !== 'anomaly' ? dash : fmtNumber(issue.affectedRows)}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-tertiary'] }}>
                    {isPostPrep || issue?.issueType !== 'blanks' ? dash : fmtNumber(issue.affectedRows)}
                  </td>
                  <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: c['content-tertiary'] }}>
                    {isPostPrep || issue?.issueType !== 'type_mismatch' ? dash : fmtNumber(issue.affectedRows)}
                  </td>
                  {isPostPrep && (
                    <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                      {fixCell}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fix detail popover */}
      {fixPopover && activeIssue && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setFixPopover(null)}
          />
          <div style={{
            position: 'fixed',
            left: Math.min(fixPopover.x, window.innerWidth - 300),
            top: fixPopover.y,
            width: 280,
            backgroundColor: c['background-base'],
            border: `1px solid ${c['border-default']}`,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
            fontFamily: ff.primary,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: `${sp.C}px ${sp.D}px`,
              borderBottom: `1px solid ${c['border-divider']}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>
                Applied fix
              </span>
              <button
                onClick={() => setFixPopover(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-tertiary'], fontSize: 16, lineHeight: 1, padding: 2 }}
              >×</button>
            </div>
            <div style={{ padding: `${sp.C}px ${sp.D}px` }}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.B }}>
                {activeIssue.recommendation}
              </div>
              <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5, marginBottom: sp.C }}>
                {activeIssue.recommendationDetail}
              </div>
              <div style={{
                fontSize: 11, fontFamily: 'monospace',
                color: '#7c3aed', backgroundColor: '#f5f3ff',
                borderRadius: 4, padding: `${sp.A}px ${sp.B}px`,
              }}>
                {activeIssue.fixValue}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

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
        Data not cached
      </div>
      <div style={{ fontSize: fs.md, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 380 }}>
        SpotterPrep works on cached data. Cache this model to calculate a quality score and prep with the agent.
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

// ── QualityTab ────────────────────────────────────────────────────────────────

// ── Cache-required modal (shown when campaign-perf clicks Prep with agent) ─────

const CachePrepModal: React.FC<{
  onContinue: () => void;
  onCancel: () => void;
}> = ({ onContinue, onCancel }) => {
  const [freq, setFreq]       = useState('daily');
  const [caching, setCaching] = useState(false);

  useEffect(() => {
    if (!caching) return;
    const t = setTimeout(onContinue, 2500);
    return () => clearTimeout(t);
  }, [caching, onContinue]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.55)',
      zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ff.primary,
    }}>
      <div style={{
        width: 420,
        backgroundColor: c['background-base'],
        borderRadius: 12,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: `${sp.E}px ${sp.F}px ${sp.D}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
              {caching ? 'Caching data…' : 'Cache required'}
            </div>
            <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginTop: 2 }}>
              Campaign Performance
            </div>
          </div>
          {!caching && (
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-tertiary'], fontSize: 20, lineHeight: 1, padding: 2 }}
            >×</button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: `${sp.E}px ${sp.F}px` }}>
          {caching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.D, padding: `${sp.D}px 0` }}>
              {/* Spinner */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `3px solid ${c['border-divider']}`,
                borderTopColor: c['background-brand'],
                animation: 'spin 0.9s linear infinite',
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.A }}>
                  Your data is being cached
                </div>
                <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.5 }}>
                  Taking you to Prep in a moment…
                </div>
              </div>
            </div>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: 1.6, marginBottom: sp.E }}>
                Your data is not cached. Cache it with ThoughtSpot to run SpotterPrep on this model.
              </p>
              <div style={{ marginBottom: sp.D }}>
                <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: sp.B }}>
                  Cache frequency
                </label>
                <select
                  value={freq}
                  onChange={e => setFreq(e.target.value)}
                  style={{
                    width: '100%', padding: `${sp.B}px ${sp.C}px`,
                    border: `1px solid ${c['border-default']}`,
                    borderRadius: 6, fontSize: fs.sm,
                    fontFamily: ff.primary, color: c['content-primary'],
                    backgroundColor: c['background-base'],
                    cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!caching && (
          <div style={{
            padding: `${sp.C}px ${sp.F}px`,
            borderTop: `1px solid ${c['border-divider']}`,
            display: 'flex', justifyContent: 'flex-end', gap: sp.C,
            backgroundColor: c['background-sunken'],
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: `${sp.B}px ${sp.D}px`,
                border: `1px solid ${c['border-default']}`,
                borderRadius: 6, backgroundColor: 'transparent',
                fontSize: fs.sm, color: c['content-secondary'],
                cursor: 'pointer', fontFamily: ff.primary,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setCaching(true)}
              style={{
                padding: `${sp.B}px ${sp.E}px`,
                border: 'none', borderRadius: 6,
                backgroundColor: c['background-brand'],
                color: '#fff', fontSize: fs.sm, fontWeight: fw.medium,
                cursor: 'pointer', fontFamily: ff.primary,
              }}
            >
              Cache and Prep
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── QualityTab ────────────────────────────────────────────────────────────────

const QualityTab: React.FC<QualityTabProps> = ({ qualityState, onSetupCache, onStartPrep, modelId, requiresCacheForPrep }) => {
  const [showCacheModal, setShowCacheModal]       = useState(false);
  const [showJobsModal, setShowJobsModal]         = useState(false);
  const [showCachePrepModal, setShowCachePrepModal] = useState(false);

  const handleSetupCache = () => setShowCacheModal(true);
  const handleCacheConfirm = (_freq: string) => {
    setShowCacheModal(false);
    onSetupCache();
  };

  const handlePrepClick = () => {
    if (requiresCacheForPrep) {
      setShowCachePrepModal(true);
    } else {
      onStartPrep();
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {qualityState === 'not-cached' && (
        <NotCachedState onSetupCache={handleSetupCache} />
      )}

      {(qualityState === 'ready' || qualityState === 'post-prep') && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MetricsStrip qualityState={qualityState} onStartPrep={handlePrepClick} onViewDetails={() => setShowJobsModal(true)} modelId={modelId} />
          <ColumnProfileTable qualityState={qualityState} />
        </div>
      )}

      {showCacheModal && (
        <CacheSettingsModal onConfirm={handleCacheConfirm} onCancel={() => setShowCacheModal(false)} />
      )}
      {showJobsModal && (
        <PrepHistoryModal onClose={() => setShowJobsModal(false)} />
      )}
      {showCachePrepModal && (
        <CachePrepModal
          onContinue={() => { setShowCachePrepModal(false); onStartPrep(); }}
          onCancel={() => setShowCachePrepModal(false)}
        />
      )}
    </div>
  );
};

export default QualityTab;
