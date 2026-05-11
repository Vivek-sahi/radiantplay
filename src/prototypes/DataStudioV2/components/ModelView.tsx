import React, { useState } from 'react';
import { c, sp, fs, fw, ff, HEADER_HEIGHT } from '../styles';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { Tabs } from '../../../components/Tabs';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Radio } from '../../../components/Radio';
import { ProgressBar, ProgressBarColor } from '../../../components/ProgressBar/ProgressBar';
import { radius } from '../../../tokens/radius';
import {
  OverviewProject, OverviewAlert, MODEL_DETAILS, ModelColumn,
  WORKSPACE_QUERIES, WORKSPACE_QUALITY, CACHE_STATS, SEMANTIC_GAPS,
  MONITORING_TRENDS, MONITORING_STATS, SEMANTIC_COVERAGE,
} from '../data/mockData';
import ShareModal from './ShareModal';

interface ModelViewProps {
  project: OverviewProject;
  alert?: OverviewAlert | null;
  initialTab?: TabId;
  onBack: () => void;
  onEdit: () => void;
}

type TabId = 'info' | 'cache' | 'monitoring';

const ModelView: React.FC<ModelViewProps> = ({ project, alert, initialTab, onBack, onEdit }) => {
  const [tab, setTab]               = useState<TabId>(initialTab ?? 'info');
  const [moreOpen, setMoreOpen]     = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [retryState, setRetryState]             = useState<'idle' | 'retrying' | 'success'>('idle');
  const [logModalOpen, setLogModalOpen]         = useState(false);

  const handleRetry = () => {
    setRetryState('retrying');
    setTimeout(() => setRetryState('success'), 3000);
  };

  const isPublished = project.status === 'published';
  const details     = MODEL_DETAILS[project.id] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: ff.primary, backgroundColor: c['background-sunken'] }}>

      {/* Header */}
      <div style={{ backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        {/* Top row — name + actions */}
        <div style={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C }}>
          <Button variant="tertiary" size="small" onClick={onBack}>←</Button>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{project.name}</span>
          <span style={{
            fontSize: fs.xs, fontWeight: fw.medium, padding: '2px 7px', borderRadius: radius.badge,
            color:           isPublished ? c['content-success'] : c['content-secondary'],
            backgroundColor: isPublished ? c['background-success'] : c['background-subtle'],
          }}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: sp.C }}>
            {/* Author + last updated */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, paddingRight: sp.C, borderRight: `1px solid ${c['border-divider']}` }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: fw.semibold, color: 'white', lineHeight: 1 }}>
                  {project.author.charAt(0)}
                </span>
              </div>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{project.author}</span>
              <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>·</span>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Last updated on {project.lastModified}</span>
            </div>

            {/* Triple-dot menu */}
            <div style={{ position: 'relative' }}>
              <Button variant="tertiary" size="small" onClick={() => setMoreOpen(o => !o)}>···</Button>
              {moreOpen && (
                <div
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}
                  onClick={() => setMoreOpen(false)}
                >
                  {[
                    { label: '⚡ Manage cache', action: () => {} },
                    { label: '🗃 Archive model', action: () => {} },
                  ].map(item => (
                    <div
                      key={item.label}
                      onClick={item.action}
                      style={{ padding: `${sp.B}px ${sp.D}px`, fontSize: fs.sm, color: c['content-primary'], cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Share */}
            <button
              title="Share"
              onClick={() => setShareOpen(true)}
              style={{ width: 26, height: 26, padding: 4, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="3.75" r="2.25"/><circle cx="4.5" cy="9" r="2.25"/><circle cx="13.5" cy="14.25" r="2.25"/>
                <line x1="6.44" y1="10.13" x2="11.56" y2="13.12"/><line x1="11.56" y1="4.88" x2="6.44" y2="7.87"/>
              </svg>
            </button>
            {/* Edit model */}
            <button
              onClick={onEdit}
              style={{ height: 26, padding: '0 14px', border: 'none', borderRadius: 6, backgroundColor: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, fontFamily: ff.primary, color: 'white', boxSizing: 'border-box', transition: 'background-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <span style={{ fontSize: 12, lineHeight: 1 }}>✦</span>
              Edit model
            </button>
          </div>
        </div>

        {/* Description row */}
        {details && (
          <div style={{ padding: `0 ${sp.D}px ${sp.C}px` }}>
            <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {details.description}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ flexShrink: 0 }}>
        <Tabs
          tabs={[
            { id: 'info',       label: 'Info' },
            { id: 'cache',      label: 'Cache' },
            { id: 'monitoring', label: 'Monitoring' },
          ]}
          activeTab={tab}
          onTabChange={id => setTab(id as TabId)}
        />
      </div>

{/* Tab body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.H, display: 'flex', flexDirection: 'column' }}>

        {tab === 'info'       && <InfoTab details={details} project={project} alert={alert} retryState={retryState} onRetry={handleRetry} onViewLog={() => setLogModalOpen(true)} />}
        {tab === 'cache'      && <CacheTab />}
        {tab === 'monitoring' && <MonitoringTab modelId={project.id} />}

      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {logModalOpen && alert?.errorLog && (
        <LogModal log={alert.errorLog} onClose={() => setLogModalOpen(false)} />
      )}
    </div>
  );
};

// ── Alert banner ─────────────────────────────────────────────────────────────

const ALERT_BANNER_LABELS: Record<OverviewAlert['type'], string> = {
  sync_failure:   'Sync failure',
  schema_change:  'Schema change',
  cache_failed:   'Cache failed',
  prep_job_failed:'Prep job failed',
  data_freshness: 'Data freshness',
};

const AlertBanner: React.FC<{ alert: OverviewAlert; retryState: 'idle' | 'retrying' | 'success'; onRetry: () => void }> = ({ alert, retryState, onRetry }) => {
  if (retryState === 'success') {
    return (
      <div style={{ backgroundColor: c['background-success'], borderBottom: `1px solid ${c['content-success']}`, padding: `${sp.C}px ${sp.H}px`, display: 'flex', alignItems: 'center', gap: sp.C, flexShrink: 0 }}>
        <span style={{ fontSize: fs.sm }}>✓</span>
        <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-success'] }}>Sync successful — model is up to date</span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: c['background-warning'], borderBottom: `1px solid ${c['border-warning']}`, flexShrink: 0 }}>
      <div style={{ padding: `${sp.C}px ${sp.H}px`, display: 'flex', alignItems: 'center', gap: sp.C }}>
        <span style={{ fontSize: fs.sm, flexShrink: 0 }}>⚠️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: fs.xs, fontWeight: fw.medium, padding: '1px 6px', borderRadius: radius.badge, backgroundColor: c['background-warning'], color: c['content-warning'], marginRight: sp.B, border: `1px solid ${c['border-warning']}` }}>
            {ALERT_BANNER_LABELS[alert.type]}
          </span>
          <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{alert.title}</span>
        </div>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'], flexShrink: 0 }}>{alert.time}</span>
        <Button variant="secondary" size="small" onClick={onRetry} disabled={retryState === 'retrying'}>
          {retryState === 'retrying' ? '⟳ Retrying…' : 'Retry sync'}
        </Button>
      </div>
    </div>
  );
};

// ── Info tab helpers ──────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ModelColumn['type'], string> = {
  metric:    'measure',
  measure:   'measure',
  attribute: 'attribute',
};

const ColumnCard: React.FC<{ col: ModelColumn; isLast: boolean }> = ({ col, isLast }) => {
  const typeLabel = col.table === 'computed' ? 'formula' : TYPE_LABEL[col.type];

  return (
    <div style={{
      padding: `10px ${sp.D}px`,
      borderBottom: isLast ? 'none' : `1px solid ${c['border-divider']}`,
      backgroundColor: c['background-base'],
    }}>
      {/* Row 1: name + type */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.C }}>
        <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>
          {col.name}
        </span>
        <span style={{ fontSize: 10, fontWeight: fw.medium, color: c['content-secondary'], flexShrink: 0 }}>
          {typeLabel}
        </span>
      </div>
      {/* Row 2: source table · description */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
        <span style={{ fontSize: fs.xs, color: c['content-tertiary'], flexShrink: 0, fontFamily: 'monospace' }}>
          {col.table === 'computed' ? 'computed' : col.table}
        </span>
        {col.description && (
          <>
            <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>·</span>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px' }}>
              {col.description}
            </span>
          </>
        )}
        {!col.aiContextSet && (
          <span style={{ fontSize: fs.xs, color: c['content-secondary'], flexShrink: 0, marginLeft: sp.A }}>
            ⚠ No AI context
          </span>
        )}
      </div>
    </div>
  );
};

// ── Info tab ──────────────────────────────────────────────────────────────────

const SourceBlock: React.FC<{
  details: typeof MODEL_DETAILS[string];
  alert?: OverviewAlert | null;
  retryState: 'idle' | 'retrying' | 'success';
  onRetry: () => void;
  onViewLog: () => void;
}> = ({ details, alert, retryState, onRetry, onViewLog }) => {
  const hasSyncFailure = alert?.type === 'sync_failure' && retryState !== 'success';

  let rows: { label: string; value: React.ReactNode }[] = [];

  if (details.source === 'dbt' && details.syncInfo) {
    const si = details.syncInfo;

    const lastSyncValue = hasSyncFailure ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: c['content-primary'] }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="8" cy="8" r="6.5" stroke="#b91c1c" strokeWidth="1.5"/>
            <line x1="8" y1="5" x2="8" y2="9" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="11.5" r="0.75" fill="#b91c1c"/>
          </svg>
          Apr 20 · 02:14 AM — Failed
        </span>
        <button
          onClick={onViewLog}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary }}
        >
          View log
        </button>
        <button
          onClick={onRetry}
          disabled={retryState === 'retrying'}
          style={{ height: 22, padding: '0 10px', border: `1px solid ${c['border-default']}`, borderRadius: 5, backgroundColor: 'transparent', cursor: retryState === 'retrying' ? 'default' : 'pointer', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-primary'] }}
        >
          {retryState === 'retrying' ? '⟳ Retrying…' : 'Retry now'}
        </button>
      </div>
    ) : (
      <span>{retryState === 'success' ? 'Apr 20 · 02:18 AM — Successful' : `${si.lastSuccessfulSync} — Successful`}</span>
    );

    rows = [
      { label: 'Type',          value: si.connection },
      { label: 'Project',       value: si.project },
      { label: 'Sync schedule', value: si.schedule },
      { label: 'Last sync',     value: lastSyncValue },
    ];
  } else if (details.source === 'warehouse' && details.warehouseInfo) {
    const wi = details.warehouseInfo;
    rows = [
      { label: 'Type',     value: wi.type },
      { label: 'Database', value: wi.database },
    ];
  }

  const isWarehouse = details.source === 'warehouse';

  return (
    <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', backgroundColor: c['background-base'] }}>
      {rows.map(({ label, value }, i) => (
        <div
          key={label}
          style={{
            display: 'grid', gridTemplateColumns: '160px 1fr',
            padding: `10px ${sp.D}px`,
            borderBottom: `1px solid ${c['border-divider']}`,
          }}
        >
          <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{label}</span>
          <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>{value}</span>
        </div>
      ))}

      {/* Tables — warehouse only */}
      {isWarehouse && details.tables.length > 0 && (() => {
        const MAX = 3;
        const names = details.tables.map(t => t.name);
        const visible = names.slice(0, MAX);
        const truncated = names.length > MAX;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: `10px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
            <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>Tables</span>
            <span style={{ fontSize: fs.sm, color: c['content-primary'], display: 'flex', alignItems: 'baseline', gap: sp.B, minWidth: 0 }}>
              <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {visible.join(', ')}{truncated ? ', …' : ''}
              </span>
              {truncated && (
                <button style={{ flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary }}>
                  View all
                </button>
              )}
            </span>
          </div>
        );
      })()}

      {/* Joins — warehouse only */}
      {isWarehouse && details.joins.length > 0 && (() => {
        const MAX = 3;
        const labels = details.joins.map(j => `${j.left} → ${j.right}`);
        const visible = labels.slice(0, MAX);
        const truncated = labels.length > MAX;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: `10px ${sp.D}px`, borderBottom: 'none' }}>
            <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>Joins</span>
            <span style={{ fontSize: fs.sm, color: c['content-primary'], display: 'flex', alignItems: 'baseline', gap: sp.B, minWidth: 0 }}>
              <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {visible.join(', ')}{truncated ? ', …' : ''}
              </span>
              {truncated && (
                <button style={{ flexShrink: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary }}>
                  View all
                </button>
              )}
            </span>
          </div>
        );
      })()}
    </div>
  );
};

const InfoTab: React.FC<{ details: typeof MODEL_DETAILS[string] | null; project: OverviewProject; alert?: OverviewAlert | null; retryState: 'idle' | 'retrying' | 'success'; onRetry: () => void; onViewLog: () => void }> = ({ details, project, alert, retryState, onRetry, onViewLog }) => {
  const [colSearch, setColSearch] = useState('');

  if (!details) return (
    <div style={{ maxWidth: 720, color: c['content-secondary'], fontSize: fs.sm }}>
      No details available for this model.
    </div>
  );

  const cols      = details.columns.filter(col => !col.hidden);
  const missingAI = cols.filter(col => !col.aiContextSet);
  const query     = colSearch.trim().toLowerCase();
  const filtered  = query ? cols.filter(col => col.name.toLowerCase().includes(query) || col.description?.toLowerCase().includes(query)) : cols;
  const formulas   = filtered.filter(col => col.table === 'computed');
  const sourceCols = filtered.filter(col => col.table !== 'computed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.H }}>


      {/* Source */}
      <Section title="Source">
        <SourceBlock details={details} alert={alert} retryState={retryState} onRetry={onRetry} onViewLog={onViewLog} />
      </Section>

      {/* Columns */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
            <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              Columns · {cols.length}
            </span>
            {missingAI.length > 0 && !query && (
              <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'] }}>
                · ⚠ {missingAI.length} missing AI context
              </span>
            )}
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: c['content-secondary'] }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={colSearch}
              onChange={e => setColSearch(e.target.value)}
              placeholder="Search columns…"
              style={{ paddingLeft: 26, paddingRight: colSearch ? 24 : sp.C, paddingTop: 5, paddingBottom: 5, fontSize: fs.xs, fontFamily: ff.primary, color: c['content-primary'], backgroundColor: c['background-subtle'], border: `1px solid ${c['border-default']}`, borderRadius: 6, outline: 'none', width: 180, boxSizing: 'border-box' as const }}
              onFocus={e => (e.target.style.borderColor = c['content-brand'])}
              onBlur={e => (e.target.style.borderColor = c['border-default'])}
            />
            {colSearch && (
              <button onClick={() => setColSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>
        </div>
        <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
          {filtered.length === 0 && (
            <div style={{ padding: `${sp.F}px ${sp.D}px`, textAlign: 'center', color: c['content-secondary'], fontSize: fs.xs }}>
              No columns match "{colSearch}"
            </div>
          )}
          {formulas.length > 0 && (
            <>
              <div style={{ padding: `6px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
                <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'] }}>Formulas · {formulas.length}</span>
              </div>
              {formulas.map((col, i) => (
                <ColumnCard key={col.name} col={col} isLast={i === formulas.length - 1 && sourceCols.length === 0} />
              ))}
            </>
          )}
          {sourceCols.length > 0 && (
            <>
              {formulas.length > 0 && (
                <div style={{ padding: `6px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}`, borderTop: `1px solid ${c['border-divider']}` }}>
                  <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'] }}>Source columns · {sourceCols.length}</span>
                </div>
              )}
              {sourceCols.map((col, i) => (
                <ColumnCard key={col.name} col={col} isLast={i === sourceCols.length - 1} />
              ))}
            </>
          )}
        </div>
      </div>


    </div>
  );
};

// ── Cache tab ─────────────────────────────────────────────────────────────────

interface CacheSettings {
  schedule: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  lookback: '30days' | '6months' | '1year' | 'all';
}

const LOOKBACK_LABELS: Record<CacheSettings['lookback'], string> = {
  '30days':  'Last 30 days',
  '6months': 'Last 6 months',
  '1year':   'Last 1 year',
  'all':     'All time',
};

const SCHEDULE_LABELS: Record<CacheSettings['schedule'], string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
};

const MOCK_RUN_HISTORY = [
  { date: 'Apr 19 · 2:00 AM',  status: 'failed',    duration: '—',      rows: '—' },
  { date: 'Apr 18 · 2:00 AM',  status: 'completed', duration: '2m 03s', rows: '284,200' },
  { date: 'Apr 17 · 2:00 AM',  status: 'completed', duration: '1m 57s', rows: '283,800' },
];

const CacheTab: React.FC = () => {
  const [enabled, setEnabled]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [runStatus, setRunStatus]   = useState<'idle' | 'running' | 'complete'>('idle');
  const [settings, setSettings]     = useState<CacheSettings>({
    schedule: 'daily', time: '2:00 AM', timezone: 'UTC', lookback: '6months',
  });

  const handleEnable = (s: CacheSettings) => {
    setSettings(s);
    setEnabled(true);
    setModalOpen(false);
    setRunStatus('running');
    setTimeout(() => setRunStatus('complete'), 3000);
  };

  if (!enabled) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes ds-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 480, border: `1px solid ${c['border-divider']}`, borderRadius: radius.xl, padding: `${sp.H}px ${sp.F}px`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' as const, gap: sp.D }}>
          <div style={{ fontSize: 32 }}>⚡</div>
          <div style={{ fontSize: fs.lg, fontWeight: fw.semibold, color: c['content-primary'] }}>Not cached</div>
          <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'], lineHeight: '20px', maxWidth: 360 }}>
            Every Spotter query runs live against Snowflake. Enable caching to pre-build answers — faster responses and lower compute costs.
          </p>
          <Button variant="primary" size="small" onClick={() => setModalOpen(true)}>Cache this model</Button>
        </div>
        {modalOpen && (
          <CacheSetupModal onClose={() => setModalOpen(false)} onEnable={handleEnable} />
        )}
      </div>
    );
  }

  const currentRun = runStatus === 'running'
    ? { date: 'Apr 20 · Just now', status: 'running' as const, duration: '—', rows: '—' }
    : { date: 'Apr 20 · 10:14 AM', status: 'completed' as const, duration: '1m 48s', rows: '285,000' };

  const allRuns = [currentRun, ...MOCK_RUN_HISTORY];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.H }}>
      {modalOpen && (
        <CacheSetupModal onClose={() => setModalOpen(false)} onEnable={handleEnable} initialSettings={settings} />
      )}

      {/* Settings */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
          <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Cache settings</span>
          <Button variant="secondary" size="small" onClick={() => setModalOpen(true)}>Edit settings</Button>
        </div>
        <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: radius.card, overflow: 'hidden' }}>
          {([
            { label: 'Status',     value: '● Active',                                                         color: '#16a34a' },
            { label: 'Schedule',   value: `${SCHEDULE_LABELS[settings.schedule]} at ${settings.time} ${settings.timezone}` },
            { label: 'Data range', value: LOOKBACK_LABELS[settings.lookback] },
            { label: 'Next run',   value: `Tomorrow · Apr 21 at ${settings.time} ${settings.timezone}` },
          ] as { label: string; value: string; color?: string }[]).map(({ label, value, color }, i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${sp.C}px ${sp.D}px`, borderBottom: i < arr.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
              <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{label}</span>
              <span style={{ fontSize: fs.sm, color: color ?? c['content-primary'], fontWeight: fw.medium }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Run log */}
      <Section title="Run history">
        <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: radius.card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
            {['Started', 'Status', 'Duration', 'Rows cached', ''].map(h => (
              <div key={h} style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>
          {allRuns.map((run, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, borderBottom: i < allRuns.length - 1 ? `1px solid ${c['border-divider']}` : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{run.date}</div>
              <div>
                {run.status === 'running' && (
                  <span style={{ fontSize: fs.sm, color: c['content-brand'], display: 'flex', alignItems: 'center', gap: sp.A }}>
                    <span style={{ display: 'inline-block', animation: 'ds-spin 1s linear infinite', fontSize: 13 }}>⟳</span>
                    In progress
                  </span>
                )}
                {run.status === 'completed' && (
                  <span style={{ fontSize: fs.xs, padding: '2px 7px', borderRadius: radius.badge, backgroundColor: c['background-success'], color: c['content-success'] }}>✓ Completed</span>
                )}
                {run.status === 'failed' && (
                  <span style={{ fontSize: fs.xs, padding: '2px 7px', borderRadius: radius.badge, backgroundColor: c['background-failure'], color: c['content-failure'] }}>✕ Failed</span>
                )}
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{run.duration}</div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{run.rows}</div>
              <div>
                {run.status === 'failed' && (
                  <Button variant="secondary" size="small">Run now</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

// ── Cache setup modal ─────────────────────────────────────────────────────────

const CacheSetupModal: React.FC<{
  onClose: () => void;
  onEnable: (settings: CacheSettings) => void;
  initialSettings?: CacheSettings;
}> = ({ onClose, onEnable, initialSettings }) => {
  const [schedule, setSchedule] = useState<CacheSettings['schedule']>(initialSettings?.schedule ?? 'daily');
  const [time, setTime]         = useState(initialSettings?.time ?? '2:00 AM');
  const [timezone, setTimezone] = useState(initialSettings?.timezone ?? 'UTC');
  const [lookback, setLookback] = useState<CacheSettings['lookback']>(initialSettings?.lookback ?? '6months');

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: c['background-overlay'], zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: radius.xl, width: 480, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: fs.lg, fontWeight: fw.semibold, color: c['content-primary'] }}>
            {initialSettings ? 'Edit cache settings' : 'Cache this model'}
          </h2>
          <Button variant="tertiary" size="small" onClick={onClose}>×</Button>
        </div>

        {/* Body */}
        <div style={{ padding: `${sp.F}px`, display: 'flex', flexDirection: 'column', gap: sp.F }}>

          {/* Refresh schedule */}
          <div>
            <label style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Refresh schedule</label>
            <SegmentedControl
              options={[
                { id: 'daily',   label: 'Daily' },
                { id: 'weekly',  label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
              ]}
              value={schedule}
              onChange={v => setSchedule(v as CacheSettings['schedule'])}
              fullWidth
            />
          </div>

          {/* Time + Timezone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
            <div>
              <label style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Time</label>
              <Select
                options={['12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '6:00 AM', '12:00 PM', '6:00 PM'].map(t => ({ id: t, label: t }))}
                value={time}
                onChange={setTime}
                fullWidth
              />
            </div>
            <div>
              <label style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Timezone</label>
              <Select
                options={[
                  { id: 'UTC',          label: 'UTC' },
                  { id: 'US/Pacific',   label: 'US Pacific (PST)' },
                  { id: 'US/Eastern',   label: 'US Eastern (EST)' },
                  { id: 'Asia/Kolkata', label: 'India (IST)' },
                ]}
                value={timezone}
                onChange={setTimezone}
                fullWidth
              />
            </div>
          </div>

          {/* Data range */}
          <div>
            <label style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'block', marginBottom: sp.A }}>Data range</label>
            <p style={{ margin: `0 0 ${sp.B}px`, fontSize: fs.xs, color: c['content-secondary'] }}>How far back to pull data from the warehouse on each run.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {([
                { value: '30days',  label: 'Last 30 days' },
                { value: '6months', label: 'Last 6 months' },
                { value: '1year',   label: 'Last 1 year' },
                { value: 'all',     label: 'All time' },
              ] as const).map(({ value, label }) => (
                <Radio
                  key={value}
                  name="lookback"
                  value={value}
                  label={label}
                  checked={lookback === value}
                  onChange={v => setLookback(v as CacheSettings['lookback'])}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onEnable({ schedule, time, timezone, lookback })}>
            {initialSettings ? 'Save changes' : 'Enable caching'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Monitoring tab ────────────────────────────────────────────────────────────

type PillarStatus = 'healthy' | 'degraded' | 'critical';
type PillarId     = 'sync-health' | 'spotter-quality' | 'data-quality' | 'performance';
type TrendDir     = 'up' | 'down' | 'flat';

const PILLAR_LABEL: Record<PillarId, string> = {
  'sync-health': 'Sync health', 'spotter-quality': 'Spotter quality',
  'data-quality': 'Data quality', 'performance': 'Performance',
};
const STATUS_COLOR: Record<PillarStatus, string> = { healthy: '#16a34a', degraded: '#d97706', critical: '#dc2626' };
const STATUS_LABEL: Record<PillarStatus, string> = { healthy: 'Healthy', degraded: 'Degraded', critical: 'Critical' };
const BADGE_BG: Record<PillarStatus, string>     = { healthy: '#dcfce7', degraded: '#fef3c7', critical: '#fee2e2' };
const CARD_TOP: Record<PillarStatus, string>     = { healthy: '#16a34a', degraded: '#d97706', critical: '#dc2626' };

const calcTrend = (current: number, prev: number): TrendDir => {
  if (prev === 0 && current === 0) return 'flat';
  if (prev === 0) return 'up';
  const pct = (current - prev) / prev;
  return pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat';
};

const TrendBadge: React.FC<{ dir: TrendDir; good: 'up' | 'down' }> = ({ dir, good }) => {
  if (dir === 'flat') return null;
  return <span style={{ fontSize: 10, fontWeight: fw.semibold, color: dir === good ? '#16a34a' : '#dc2626', lineHeight: 1, marginLeft: 2 }}>{dir === 'up' ? '↑' : '↓'}</span>;
};

interface PillarIssue { text: string; sub?: string; action?: string; }
interface StatChip { label: string; value: string; trendDir?: TrendDir; trendGood?: 'up' | 'down'; }
interface PillarData { id: PillarId; status: PillarStatus; headline: string; stats: StatChip[]; issues?: PillarIssue[]; ctaLabel?: string; }

const buildPillars = (modelId: string): PillarData[] => {
  const queries      = WORKSPACE_QUERIES.filter(q => q.modelId === modelId);
  const quality      = WORKSPACE_QUALITY.find(q => q.modelId === modelId);
  const cacheStats   = CACHE_STATS.filter(cs => cs.modelId === modelId);
  const trend        = MONITORING_TRENDS.find(t => t.modelId === modelId);
  const semanticGaps = SEMANTIC_GAPS.filter(g => g.modelId === modelId);

  const errorQueries   = queries.filter(q => q.status === 'error');
  const successQueries = queries.filter(q => q.status === 'success' && q.latencyMs > 0);
  const schemaChanges  = quality?.schemaChanges ?? [];
  const avgLatency     = successQueries.length > 0 ? Math.round(successQueries.reduce((s, q) => s + q.latencyMs, 0) / successQueries.length) : null;
  const maxLatency     = successQueries.length > 0 ? Math.max(...successQueries.map(q => q.latencyMs)) : null;
  const totalWeeklyRuns = cacheStats.reduce((s, cs) => s + cs.runCount, 0);

  const syncStatus: PillarStatus =
    quality?.freshnessStatus === 'critical' || schemaChanges.length > 0 ? 'critical' :
    quality?.freshnessStatus === 'stale'    || errorQueries.length > 0  ? 'degraded' : 'healthy';
  const spotterRate    = trend?.spotterSuccessRateThisWeek ?? null;
  const spotterStatus: PillarStatus = spotterRate !== null && spotterRate < 65 ? 'critical' : spotterRate !== null && spotterRate < 82 ? 'degraded' : 'healthy';
  const qualityStatus: PillarStatus = (quality?.nullRate ?? 0) > 15 || (quality?.anomalies ?? 0) > 5 ? 'critical' : (quality?.nullRate ?? 0) > 5 || (quality?.anomalies ?? 0) > 0 ? 'degraded' : 'healthy';
  const performanceStatus: PillarStatus = avgLatency !== null && avgLatency > 3000 ? 'critical' : avgLatency !== null && avgLatency > 800 ? 'degraded' : 'healthy';

  return [
    {
      id: 'sync-health', status: syncStatus,
      headline: quality?.freshnessStatus === 'critical' ? 'Sync failed' : quality ? `Last sync ${quality.lastUpdated}` : '—',
      stats: [
        { label: 'Sync failures', value: trend ? `${trend.syncFailuresThisWeek} this wk` : `${errorQueries.length}`, trendDir: trend ? calcTrend(trend.syncFailuresThisWeek, trend.syncFailuresLastWeek) : undefined, trendGood: 'down' },
        { label: 'Schema changes', value: schemaChanges.length > 0 ? `${schemaChanges.length} detected` : 'None' },
        { label: 'Query errors', value: `${errorQueries.length} today` },
      ],
      issues: [
        ...schemaChanges.map(sc => ({ text: `${sc.column} ${sc.type} — ${sc.table}`, sub: sc.timestamp, action: 'Accept change' })),
        ...errorQueries.map(q => ({ text: q.errorMessage ?? 'Unknown error', sub: `${q.query} · ${q.timestamp}`, action: 'Retry sync' })),
      ],
    },
    {
      id: 'spotter-quality', status: spotterStatus,
      headline: spotterRate !== null ? `${spotterRate}% answer rate` : 'No Spotter data',
      stats: [
        { label: 'Answer rate', value: trend ? `${trend.spotterSuccessRateThisWeek}%` : '—', trendDir: trend ? calcTrend(trend.spotterSuccessRateThisWeek, trend.spotterSuccessRateLastWeek) : undefined, trendGood: 'up' },
        { label: 'Failed queries', value: trend ? `${trend.spotterFailedQueriesThisWeek}` : '—', trendDir: trend ? calcTrend(trend.spotterFailedQueriesThisWeek, trend.spotterFailedQueriesLastWeek) : undefined, trendGood: 'down' },
        { label: 'Semantic gaps', value: `${semanticGaps.length}` },
      ],
      issues: semanticGaps.slice(0, 3).map(gap => ({ text: `"${gap.column}" — ${gap.issue}`, sub: `${gap.queryCount} queries affected`, action: 'Fix description' })),
    },
    {
      id: 'data-quality', status: qualityStatus,
      headline: quality ? (qualityStatus === 'healthy' ? 'Clean data' : `${quality.nullRate}% null rate`) : 'No quality data',
      stats: [
        { label: 'Null rate', value: `${quality?.nullRate ?? 0}%` },
        { label: 'Anomalies', value: `${quality?.anomalies ?? 0} detected` },
        { label: 'Schema changes', value: `${schemaChanges.length}` },
      ],
      issues: quality?.anomalies ? [{ text: `${quality.anomalies} statistical outliers in source data`, sub: `Last checked ${quality.lastUpdated}`, action: 'Run data profile' }] : [],
    },
    {
      id: 'performance', status: performanceStatus,
      headline: avgLatency !== null ? `${(avgLatency / 1000).toFixed(1)}s avg response` : 'No query data',
      stats: [
        { label: 'Avg response', value: avgLatency !== null ? `${(avgLatency / 1000).toFixed(1)}s` : '—', trendDir: trend ? calcTrend(trend.avgLatencyMsThisWeek, trend.avgLatencyMsLastWeek) : undefined, trendGood: 'down' },
        { label: 'Slowest query', value: maxLatency !== null ? `${(maxLatency / 1000).toFixed(1)}s` : '—' },
        { label: 'Queries / week', value: totalWeeklyRuns > 0 ? `${totalWeeklyRuns}` : `${queries.length}`, trendDir: trend ? calcTrend(trend.queriesThisWeek, trend.queriesLastWeek) : undefined, trendGood: 'up' },
      ],
      issues: cacheStats.map(cs => ({ text: `"${cs.query}" — ${(cs.avgLatencyMs / 1000).toFixed(1)}s live · ${cs.runCount}× this week`, sub: `~${(cs.potentialSavingMs / 1000).toFixed(1)}s faster per query with caching` })),
      ctaLabel: cacheStats.length > 0 ? 'Enable caching for this model' : undefined,
    },
  ];
};

const PillarCard: React.FC<{ pillar: PillarData }> = ({ pillar }) => {
  const isHealthy = pillar.status === 'healthy';
  return (
    <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderTop: `3px solid ${CARD_TOP[pillar.status]}`, borderRadius: 8, padding: `${sp.C}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.B }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{PILLAR_LABEL[pillar.id]}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 12, backgroundColor: BADGE_BG[pillar.status], fontSize: fs.xs, fontWeight: fw.medium, color: STATUS_COLOR[pillar.status] }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: STATUS_COLOR[pillar.status], flexShrink: 0 }} />
          {STATUS_LABEL[pillar.status]}
        </span>
      </div>
      <div style={{ fontSize: 17, fontWeight: fw.semibold, lineHeight: 1.2, letterSpacing: '-0.2px', color: isHealthy ? c['content-secondary'] : c['content-primary'] }}>{pillar.headline}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
        {pillar.stats.map((s, si) => (
          <div key={si} style={{ padding: '3px 8px', borderRadius: 5, backgroundColor: c['background-sunken'], border: `1px solid ${c['border-divider']}` }}>
            <div style={{ fontSize: 10, color: c['content-tertiary'], marginBottom: 1 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: isHealthy ? c['content-secondary'] : c['content-primary'] }}>{s.value}</span>
              {s.trendDir && s.trendGood && <TrendBadge dir={s.trendDir} good={s.trendGood} />}
            </div>
          </div>
        ))}
      </div>
      {!isHealthy && pillar.issues && pillar.issues.length > 0 && (
        <div style={{ borderTop: `1px solid ${c['border-divider']}`, paddingTop: sp.B, display: 'flex', flexDirection: 'column', gap: sp.B }}>
          {pillar.issues.map((issue, ii) => (
            <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: STATUS_COLOR[pillar.status], marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: fs.xs, color: c['content-primary'], lineHeight: 1.4 }}>{issue.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginTop: 2, flexWrap: 'wrap' as const }}>
                  {issue.sub && <span style={{ fontSize: 11, color: c['content-tertiary'] }}>{issue.sub}</span>}
                  {issue.action && (
                    <button onClick={() => {}} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, fontWeight: fw.semibold, color: c['content-brand'], fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: 2, lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >{issue.action} →</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isHealthy && pillar.ctaLabel && (
        <div style={{ paddingTop: sp.A, borderTop: `1px solid ${c['border-divider']}`, marginTop: sp.A }}>
          <Button variant="primary" size="small" onClick={() => {}}>{pillar.ctaLabel}</Button>
        </div>
      )}
    </div>
  );
};

const ROI_COLOR: Record<'positive' | 'neutral' | 'negative', string> = { positive: '#16a34a', neutral: '#d97706', negative: '#dc2626' };
const ROI_BG:    Record<'positive' | 'neutral' | 'negative', string> = { positive: '#dcfce7', neutral: '#fef3c7', negative: '#fee2e2' };
const ROI_LABEL: Record<'positive' | 'neutral' | 'negative', string> = { positive: 'Positive ROI', neutral: 'Review usage', negative: 'Low ROI' };

const CostRoiSection: React.FC<{ modelId: string }> = ({ modelId }) => {
  const stats = MONITORING_STATS.find(s => s.modelId === modelId);
  if (!stats) return null;
  const cells = [
    { label: 'Est. weekly cost', value: `$${stats.estimatedWeeklyCostUsd}` },
    { label: 'Cost per query',   value: `$${stats.costPerQuery.toFixed(2)}` },
    { label: 'Cost per user',    value: `$${stats.costPerUser.toFixed(2)}` },
  ];
  return (
    <div style={{ marginTop: sp.H }}>
      <div style={{ fontSize: 11, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: sp.C }}>Cost & efficiency</div>
      <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {cells.map((cell, i) => (
          <div key={i} style={{ padding: `${sp.C}px ${sp.D}px`, borderRight: `1px solid ${c['border-divider']}` }}>
            <div style={{ fontSize: 11, color: c['content-tertiary'], marginBottom: 4 }}>{cell.label}</div>
            <div style={{ fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.3px', lineHeight: 1 }}>{cell.value}</div>
          </div>
        ))}
        <div style={{ padding: `${sp.C}px ${sp.D}px`, backgroundColor: ROI_BG[stats.roiFlag], display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: ROI_COLOR[stats.roiFlag] }}>{ROI_LABEL[stats.roiFlag]}</div>
          <div style={{ fontSize: 11, color: ROI_COLOR[stats.roiFlag], marginTop: 3 }}>{stats.weeklyQueryVolume} queries · {stats.uniqueUsersThisWeek} users this week</div>
        </div>
      </div>
    </div>
  );
};

const SemanticCoverageSection: React.FC<{ modelId: string }> = ({ modelId }) => {
  const coverage = SEMANTIC_COVERAGE.find(s => s.modelId === modelId);
  const gaps     = SEMANTIC_GAPS.filter(g => g.modelId === modelId).slice(0, 5);
  if (!coverage && gaps.length === 0) return null;

  const pct = coverage ? Math.round((coverage.coveredIntents / coverage.totalIntentsSampled) * 100) : null;
  const barColor: ProgressBarColor = pct !== null ? (pct < 60 ? 'red' : pct < 80 ? 'yellow' : 'green') : 'green';

  return (
    <div style={{ marginTop: sp.H }}>
      <div style={{ fontSize: 11, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: sp.C }}>Semantic coverage</div>
      <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, padding: `${sp.C}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
        {coverage && pct !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
            <div style={{ flex: 1 }}><ProgressBar value={pct} max={100} color={barColor} size="small" /></div>
            <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], flexShrink: 0 }}>{pct}%</span>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], flexShrink: 0 }}>{coverage.coveredIntents} of {coverage.totalIntentsSampled} user intents answered</span>
          </div>
        )}
        {gaps.length > 0 && (
          <div style={{ borderTop: coverage ? `1px solid ${c['border-divider']}` : 'none', paddingTop: coverage ? sp.C : 0 }}>
            <div style={{ fontSize: 11, color: c['content-tertiary'], marginBottom: sp.B }}>Top gaps — questions users asked that Spotter couldn't answer</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
              {gaps.map((gap, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: sp.C }}>
                  <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], minWidth: 130, flexShrink: 0 }}>{gap.column}</span>
                  <span style={{ fontSize: 11, color: c['content-tertiary'], flexShrink: 0 }}>{gap.queryCount}× asked</span>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'], flex: 1, minWidth: 0 }}>{gap.issue}</span>
                  <button onClick={() => {}} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, fontWeight: fw.semibold, color: c['content-brand'], fontFamily: ff.primary, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >Fix →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MonitoringTab: React.FC<{ modelId: string }> = ({ modelId }) => {
  const pillars = buildPillars(modelId);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
        {pillars.map(p => <PillarCard key={p.id} pillar={p} />)}
      </div>
      <CostRoiSection modelId={modelId} />
      <SemanticCoverageSection modelId={modelId} />
    </div>
  );
};

// ── Log modal ─────────────────────────────────────────────────────────────────

const LogModal: React.FC<{ log: string; onClose: () => void }> = ({ log, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
    <div
      style={{ width: 640, maxHeight: '60vh', display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'], borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Sync error log</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c['content-secondary'], lineHeight: 1, padding: 0 }}>×</button>
      </div>
      {/* Log body */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1E1E1E', padding: `${sp.C}px ${sp.D}px` }}>
        <pre style={{ margin: 0, fontSize: 11, color: '#D4D4D4', fontFamily: 'monospace', lineHeight: '18px', whiteSpace: 'pre-wrap' as const }}>
          {log}
        </pre>
      </div>
    </div>
  </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: sp.C }}>{title}</div>
    {children}
  </div>
);

export default ModelView;
