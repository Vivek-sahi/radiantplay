import React, { useState } from 'react';
import { c, sp, fs, fw, ff, HEADER_HEIGHT } from '../styles';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { Tabs } from '../../../components/Tabs';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Radio } from '../../../components/Radio';
import { ProgressBar } from '../../../components/ProgressBar';
import { radius } from '../../../tokens/radius';
import { OverviewProject, OverviewAlert, MODEL_DETAILS, MODEL_CONVERSATIONS, ModelColumn } from '../data/mockData';
import ShareModal from './ShareModal';

interface ModelViewProps {
  project: OverviewProject;
  alert?: OverviewAlert | null;
  onBack: () => void;
  onEdit: () => void;
}

type TabId = 'info' | 'usage' | 'cache' | 'quality';

const ModelView: React.FC<ModelViewProps> = ({ project, alert, onBack, onEdit }) => {
  const [tab, setTab]               = useState<TabId>('info');
  const [moreOpen, setMoreOpen]     = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [cacheEnabled, setCacheEnabled]         = useState(false);
  const [showCacheModal, setShowCacheModal]     = useState(false);
  const [retryState, setRetryState]             = useState<'idle' | 'retrying' | 'success'>('idle');
  const [logModalOpen, setLogModalOpen]         = useState(false);

  const handleRetry = () => {
    setRetryState('retrying');
    setTimeout(() => setRetryState('success'), 3000);
  };

  const isPublished = project.status === 'published';
  const details     = MODEL_DETAILS[project.id] ?? null;
  const convos      = MODEL_CONVERSATIONS[project.id] ?? [];

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
            { id: 'info',    label: 'Info' },
            { id: 'usage',   label: 'Usage' },
            { id: 'cache',   label: 'Cache' },
            { id: 'quality', label: 'Data quality' },
          ]}
          activeTab={tab}
          onTabChange={id => setTab(id as TabId)}
        />
      </div>

{/* Tab body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.H, display: 'flex', flexDirection: 'column' }}>

        {tab === 'info' && <InfoTab details={details} project={project} alert={alert} retryState={retryState} onRetry={handleRetry} onViewLog={() => setLogModalOpen(true)} />}
        {tab === 'usage' && <UsageTab convos={convos} project={project} onCacheNow={() => setShowCacheModal(true)} />}
        {tab === 'cache' && <CacheTab defaultEnabled={cacheEnabled} />}
        {tab === 'quality' && <QualityTab />}

      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {showCacheModal && (
        <CacheSetupModal
          onClose={() => setShowCacheModal(false)}
          onEnable={(s) => { setCacheEnabled(true); setShowCacheModal(false); setTab('cache'); }}
        />
      )}
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

// ── Usage tab ─────────────────────────────────────────────────────────────────

const UsageTab: React.FC<{ convos: ReturnType<typeof MODEL_CONVERSATIONS[string]>; project: OverviewProject; onCacheNow: () => void }> = ({ convos, project, onCacheNow }) => {
  const negCount  = convos.filter(c => c.feedback === 'negative').length;
  const failCount = convos.filter(c => c.failed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.H }}>

      {/* Cache promotion banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: sp.D,
        padding: `${sp.C}px ${sp.D}px`,
        backgroundColor: c['background-information'],
        border: `1px solid ${c['border-information'] ?? c['border-divider']}`,
        borderRadius: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={c['content-brand']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M3.75 9a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0zM9 6.75v2.25M9 11.25h.008"/>
        </svg>
        <span style={{ flex: 1, fontSize: fs.sm, color: c['content-brand'] }}>
          Caching this model can increase Spotter's response speed and reduce querying costs.
        </span>
        <button
          onClick={onCacheNow}
          style={{ flexShrink: 0, height: 26, padding: '0 12px', border: 'none', borderRadius: 6, backgroundColor: '#2563EB', color: 'white', fontSize: 12, fontWeight: 500, fontFamily: ff.primary, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2563EB')}
        >
          Cache now
        </button>
        <button
          style={{ flexShrink: 0, height: 26, padding: '0 10px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-brand'], fontSize: 12, fontWeight: 500, fontFamily: ff.primary, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Learn more
        </button>
      </div>

      {/* Headline stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp.D }}>
        {[
          { label: 'Total conversations', value: (project.conversations ?? 0).toLocaleString() },
          { label: 'Negative feedback',   value: String(negCount) },
          { label: 'Failed queries',       value: String(failCount) },
          { label: 'Last updated',         value: project.lastModified },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: radius.card, padding: sp.D }}>
            <div style={{ fontSize: fs['2xl'], fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.A }}>{value}</div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Conversations list */}
      <Section title="Recent conversations">
        <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
            {['Question', 'User', 'Time', 'Status'].map(h => (
              <div key={h} style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
            ))}
          </div>
          {convos.map((conv, i) => (
            <div key={conv.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, borderBottom: i < convos.length - 1 ? `1px solid ${c['border-divider']}` : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: fs.sm, color: c['content-primary'] }}>{conv.question}</div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conv.user}</div>
              <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{conv.timestamp}</div>
              <div>
                {conv.failed ? (
                  <span style={{ fontSize: fs.xs, padding: '2px 6px', borderRadius: radius.badge, backgroundColor: c['background-failure'], color: c['content-failure'] }}>Failed</span>
                ) : conv.feedback === 'negative' ? (
                  <span style={{ fontSize: fs.xs, padding: '2px 6px', borderRadius: radius.badge, backgroundColor: c['background-warning'], color: c['content-warning'] }}>👎 Negative</span>
                ) : conv.feedback === 'positive' ? (
                  <span style={{ fontSize: fs.xs, padding: '2px 6px', borderRadius: radius.badge, backgroundColor: c['background-success'], color: c['content-success'] }}>👍 Positive</span>
                ) : (
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

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

const CacheTab: React.FC<{ defaultEnabled?: boolean }> = ({ defaultEnabled = false }) => {
  const [enabled, setEnabled]       = useState(defaultEnabled);
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

// ── Data quality tab ──────────────────────────────────────────────────────────

const QualityTab: React.FC = () => (
  <div style={{ maxWidth: 560 }}>
    <Section title="Data quality">
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.F, marginBottom: sp.F }}>
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontSize: fs['3xl'], fontWeight: fw.semibold, color: c['content-success'] }}>82</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>/ 100</div>
          <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-success'], marginTop: 2 }}>Good</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: sp.C }}>
          {[
            { label: 'No descriptions', note: 'Resolved', pct: 0,  barColor: 'green'  as const },
            { label: 'Null values',     note: 'Orders',   pct: 18, barColor: 'yellow' as const },
            { label: 'Duplicates',      note: 'Resolved', pct: 0,  barColor: 'green'  as const },
            { label: 'Anomalies',       note: 'Resolved', pct: 0,  barColor: 'green'  as const },
          ].map(({ label, note, pct, barColor }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], width: 120, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={pct} size="small" color={barColor} />
              </div>
              <span style={{ fontSize: fs.xs, color: pct === 0 ? c['content-success'] : c['content-warning'], width: 60, flexShrink: 0 }}>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  </div>
);

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
