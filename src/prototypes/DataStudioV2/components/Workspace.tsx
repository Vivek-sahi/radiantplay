import React, { useState, useRef, useEffect, useMemo } from 'react';
import { c, sp, ff, fs, fw, ts, HEADER_HEIGHT } from '../styles';
import { Button } from '../../../components/Button';
import { WizardModal } from '../../../components/WizardModal';
import { ProjectState } from '../index';
import { AgentMessage } from './AgentPanel';
import AgentPanel from './AgentPanel';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import ShareModal from './ShareModal';
import { Checkbox } from '../../../components/Checkbox';
import { tableMetadata } from '../data/mockData';
import { DEFAULT_VISIBLE_COLS, ADVANCED_COLS, COL_LABELS } from './CenterPanel';
import { CacheModal } from '../CacheDiscoverability';
import { QualityModal } from '../DataQualityDiscoverability';

interface WorkspaceProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  onBack: () => void;
  initialPrompt?: string;
}

interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

const Workspace: React.FC<WorkspaceProps> = ({ project, setProject, onBack, initialPrompt }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isBuilding, setIsBuilding] = useState(!!initialPrompt);
  const [externalAgentMessage, setExternalAgentMessage] = useState<string | null>(null);
  const [externalAgentAttachment, setExternalAgentAttachment] = useState<{ type: string; label: string } | null>(null);
  const [externalInputInject, setExternalInputInject] = useState<string | null>(null);
  const [leftPanelOpen,    setLeftPanelOpen]    = useState(false);
  const [agentPanelOpen,   setAgentPanelOpen]   = useState(true);
  const [selectedColumns,  setSelectedColumns]  = useState<string[]>([]);
  const [cacheModalOpen, setCacheModalOpen] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'live' | 'caching' | 'cached'>('live');
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Agent panel drag-to-resize ───────────────────────────────────────────────
  const AGENT_MIN = 340;
  const AGENT_MAX = () => window.innerWidth - 340;
  const [agentPanelWidth, setAgentPanelWidth] = useState(AGENT_MIN);
  const [isDraggingAgent, setIsDraggingAgent] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(AGENT_MIN);

  useEffect(() => {
    if (!isDraggingAgent) return;
    const onMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX; // drag left = wider
      const next = Math.min(Math.max(dragStartWidth.current + delta, AGENT_MIN), AGENT_MAX());
      setAgentPanelWidth(next);
    };
    const onUp = () => {
      setIsDraggingAgent(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDraggingAgent]);

  // Track model changes after publish to re-enable the Publish button
  const prevBuildStep = useRef(project.buildStep);
  const prevAddedTablesLen = useRef(project.addedTables.length);
  useEffect(() => {
    const stepChanged = project.buildStep !== prevBuildStep.current;
    const tablesChanged = project.addedTables.length !== prevAddedTablesLen.current;
    if ((stepChanged || tablesChanged) && project.publishedVersion > 0 && !project.hasUnpublishedChanges) {
      setProject(p => ({ ...p, hasUnpublishedChanges: true }));
    }
    prevBuildStep.current = project.buildStep;
    prevAddedTablesLen.current = project.addedTables.length;
  }, [project.buildStep, project.addedTables.length]);

  const showToast = (message: string, action?: Toast['action']) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // ── Canvas sub-header state (lifted from ColumnsView) ───────────────────────
  const [search,         setSearch]         = useState('');
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [colVisOpen,     setColVisOpen]     = useState(false);
  const [visibleCols,    setVisibleCols]    = useState<Set<string>>(new Set(DEFAULT_VISIBLE_COLS));
  const colVisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(e.target as Node)) setColVisOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalColCount = useMemo(() =>
    Object.values(project.includedColumns).reduce((sum, cols) => sum + cols.length, 0),
    [project.includedColumns]
  );

  const dbtIssueCount = useMemo(() => {
    if (project.projectSource !== 'dbt') return 0;
    let count = 0;
    for (const tableId of project.addedTables) {
      const included = project.includedColumns[tableId] ?? [];
      const meta = tableMetadata[tableId];
      if (!meta) continue;
      for (const colName of included) {
        const col = (meta.columns as any[]).find((c: any) => c.name === colName || c.id === colName);
        if (col && (col.syncStatus === 'broken' || col.syncStatus === 'degraded')) count++;
      }
    }
    return count;
  }, [project.addedTables, project.includedColumns, project.projectSource]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: ff.primary }}>
      <style>{`
        @keyframes ds-skeleton-pulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 0.35; }
        }
        @keyframes ds-cache-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Main header: project identity (with status subtext) + primary actions ── */}
      <div style={{ height: 64, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>

        {/* Left: back + identity-with-status (two-line) */}
        <Button variant="tertiary" size="small" onClick={onBack}>←</Button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.2 }}>
          {/* Top row — name + Draft/v1 badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{project.name}</span>
            {(project.publishedVersion === 0 || project.hasUnpublishedChanges) ? (
              <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '2px 7px', borderRadius: 4, color: c['content-secondary'], backgroundColor: c['background-subtle'] }}>
                Draft
              </span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: fw.regular, color: c['content-secondary'] }}>
                v{project.publishedVersion}
              </span>
            )}
          </div>
          {/* Subtext row — model status (cache · quality). Skeleton when no model yet. */}
          {project.buildStep === 'empty' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 14 }}>
              <div style={{ width: 88, height: 9, borderRadius: 4, backgroundColor: c['background-subtle'], animation: 'ds-skeleton-pulse 1.4s ease-in-out infinite' }} />
              <div style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: c['border-divider'] }} />
              <div style={{ width: 96, height: 9, borderRadius: 4, backgroundColor: c['background-subtle'], animation: 'ds-skeleton-pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c['content-tertiary'] }}>
              <button
                onClick={cacheStatus === 'caching' ? undefined : () => setCacheModalOpen(true)}
                disabled={cacheStatus === 'caching'}
                title={cacheStatus === 'caching' ? 'Caching in progress — cannot be stopped' : undefined}
                style={{
                  padding: 0, border: 'none', background: 'transparent',
                  cursor: cacheStatus === 'caching' ? 'default' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontFamily: ff.primary,
                  color: cacheStatus === 'caching' ? '#A16207' : c['content-primary'],
                  fontWeight: fw.medium,
                }}
                onMouseEnter={e => { if (cacheStatus !== 'caching') e.currentTarget.style.opacity = '0.75'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {cacheStatus === 'caching' ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#A16207" strokeWidth="1.8" strokeLinecap="round" style={{ animation: 'ds-cache-spin 0.9s linear infinite' }}>
                    <path d="M8 1.5a6.5 6.5 0 016.5 6.5"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="8" cy="3.5" rx="5" ry="1.75"/>
                    <path d="M3 3.5v5c0 1 2.24 1.75 5 1.75s5-.75 5-1.75v-5"/>
                    <path d="M3 8.5v4c0 1 2.24 1.75 5 1.75s5-.75 5-1.75v-4"/>
                  </svg>
                )}
                {cacheStatus === 'caching' ? 'Caching in progress…' : cacheStatus === 'cached' ? 'Cached query' : 'Live query'}
              </button>
              <span style={{ color: c['border-divider'] }}>·</span>
              {(project.prepTransforms?.length ?? 0) > 0 ? (
                <button onClick={() => setQualityModalOpen(true)}
                  style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: ff.primary, color: '#15803D', fontWeight: fw.medium }}
                >
                  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.75 9L7.5 12.75L14.25 5.25"/>
                  </svg>
                  9 issues resolved
                </button>
              ) : (
                <button onClick={() => setQualityModalOpen(true)}
                  style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: ff.primary, color: '#991B1B', fontWeight: fw.medium }}
                >
                  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="#991B1B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 1.5L1.5 15.75H16.5L9 1.5Z"/>
                    <line x1="9" y1="7" x2="9" y2="10.5"/>
                    <circle cx="9" cy="13" r="0.5" fill="#991B1B"/>
                  </svg>
                  9 quality issues
                </button>
              )}
            </div>
          )}
        </div>
        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>

              <button
                title="Settings"
                style={{ width: 26, height: 26, padding: 4, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="1.5" fill={c['content-secondary']}/>
                  <circle cx="3.75" cy="9" r="1.5" fill={c['content-secondary']}/>
                  <circle cx="14.25" cy="9" r="1.5" fill={c['content-secondary']}/>
                </svg>
              </button>

              {/* Divider */}
              <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0 }} />

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

              {/* Publish */}
              {(() => {
                const canPublish = project.publishedVersion === 0 || project.hasUnpublishedChanges;
                return (
                  <button
                    onClick={canPublish ? () => setPublishOpen(true) : undefined}
                    disabled={!canPublish}
                    style={{ height: 26, padding: '0 14px', border: 'none', borderRadius: 6, backgroundColor: canPublish ? '#2563EB' : c['background-subtle'], cursor: canPublish ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, fontFamily: ff.primary, color: canPublish ? 'white' : c['content-secondary'], boxSizing: 'border-box', transition: 'background-color 0.15s' }}
                    onMouseEnter={e => { if (canPublish) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                    onMouseLeave={e => { if (canPublish) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke={canPublish ? 'white' : c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/>
                      <line x1="3" y1="15.75" x2="15" y2="15.75"/>
                    </svg>
                    Publish
                  </button>
                );
              })()}
        </div>
      </div>


      {shareOpen && (
        <ShareModal
          onClose={() => setShareOpen(false)}
          onShared={() => {
            showToast('Shared successfully');
          }}
        />
      )}
      {publishOpen && project.publishedVersion > 0 ? (
        <RepublishWizard
          project={project}
          onClose={() => setPublishOpen(false)}
          onPublish={() => {
            const nextVersion = project.publishedVersion + 1;
            setProject(p => ({ ...p, publishedVersion: nextVersion, hasUnpublishedChanges: false }));
            showToast(`Published v${nextVersion}`, { label: 'Share →', onClick: () => setShareOpen(true) });
            setPublishOpen(false);
          }}
        />
      ) : publishOpen ? (
        <PublishModal
          project={project}
          onClose={() => setPublishOpen(false)}
          onPublish={() => {
            const nextVersion = project.publishedVersion + 1;
            setProject(p => ({ ...p, publishedVersion: nextVersion, hasUnpublishedChanges: false }));
            showToast(`Published v${nextVersion}`, { label: 'Share →', onClick: () => setShareOpen(true) });
          }}
        />
      ) : null}

      {cacheModalOpen && (
        <CacheModal
          applied={cacheStatus === 'cached'}
          onClose={() => setCacheModalOpen(false)}
          onConfirm={() => {
            setCacheModalOpen(false);
            if (cacheStatus === 'cached') {
              // Already cached — Save changes path. No re-caching, just persist edits.
              showToast('Cache settings updated');
              return;
            }
            // First-time cache — go through caching phase, then complete.
            setCacheStatus('caching');
            showToast('Caching in progress — this may take a few minutes');
            setTimeout(() => {
              setCacheStatus(s => s === 'caching' ? 'cached' : s);
              showToast('Cached. Queries now run on ThoughtSpot.');
            }, 10000);
          }}
          onDisable={() => {
            setCacheStatus('live');
            setCacheModalOpen(false);
            showToast('Caching disabled');
          }}
        />
      )}
      {qualityModalOpen && (
        <QualityModal
          onClose={() => setQualityModalOpen(false)}
          onReviewWithAgent={() => {
            setQualityModalOpen(false);
            setExternalAgentMessage('Review data quality');
          }}
        />
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: sp.B, alignItems: 'center', zIndex: 9999, pointerEvents: 'none' }}>
          {toasts.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: sp.C, backgroundColor: c['background-base-inverse'] ?? '#1a1d23', color: '#fff', padding: `${sp.B}px ${sp.D}px`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.24)', fontSize: fs.sm, pointerEvents: 'auto', whiteSpace: 'nowrap' }}>
              <span>✓</span>
              <span>{t.message}</span>
              {t.action && (
                <button
                  onClick={t.action.onClick}
                  style={{ marginLeft: sp.A, background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, color: '#fff', fontSize: fs.xs, padding: `2px ${sp.B}px`, cursor: 'pointer', fontFamily: ff.primary }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Center area — full width; LeftPanel floats as overlay */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>

          {/* Sub-header: unified canvas toolbar */}
          {(project.buildStep !== 'empty' || !agentPanelOpen) && (
            <div style={{ height: 40, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', paddingLeft: sp.D, paddingRight: sp.D, gap: sp.B, flexShrink: 0, position: 'relative' }}>

              {/* Data panel toggle — left, unchanged */}
              <button
                title="Data panel"
                onClick={() => setLeftPanelOpen(o => !o)}
                disabled={isBuilding}
                style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${leftPanelOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: leftPanelOpen ? c['background-information'] : 'transparent', cursor: isBuilding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: leftPanelOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box', flexShrink: 0, opacity: isBuilding ? 0.4 : 1 }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="1" width="14" height="14" rx="2" />
                  <line x1="5" y1="1" x2="5" y2="15" />
                </svg>
                Data
              </button>

              {/* View segmented control — absolutely centered so right-side controls don't shift it */}
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', backgroundColor: c['background-subtle'], border: `1px solid ${c['border-default']}`, borderRadius: 8, padding: 2, gap: 1 }}>
                {(['columns', 'tables', 'preview', 'notebook'] as ProjectState['activeTab'][]).map(id => {
                  const label = id === 'columns' ? 'Columns' : id === 'tables' ? 'Tables' : id === 'preview' ? 'Preview' : 'Notebook';
                  const active = project.activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setProject(p => ({ ...p, activeTab: id }))}
                      style={{
                        height: 26,
                        padding: '0 12px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        flexShrink: 0,
                        backgroundColor: active ? c['background-base'] : 'transparent',
                        color: active ? c['content-primary'] : c['content-secondary'],
                        fontFamily: ff.primary,
                        fontSize: fs.xs,
                        fontWeight: fw.medium,
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'background-color 0.1s, color 0.1s',
                        whiteSpace: 'nowrap',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = c['background-sunken']; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Columns-specific controls — only shown when columns view is active */}
              {/* Right-side controls — pushed to the right edge */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: sp.B }}>
              {project.activeTab === 'columns' && (
                <>
                  {/* dbt indicators */}
                  {project.projectSource === 'dbt' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 11, color: '#166534', fontWeight: fw.medium, flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 8a6 6 0 01-9.17 5.08"/>
                          <path d="M2 8a6 6 0 019.17-5.08"/>
                          <polyline points="14,5 14,8 11,8"/>
                          <polyline points="2,11 2,8 5,8"/>
                        </svg>
                        Synced
                      </div>
                      {dbtIssueCount > 0 && (
                        <button
                          onClick={() => setShowIssuesOnly(o => !o)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: showIssuesOnly ? '#FEE2E2' : '#FEF2F2', border: '1px solid #FECACA', fontSize: 11, color: '#B91C1C', fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0 }}
                        >
                          ⚠ {dbtIssueCount} {dbtIssueCount === 1 ? 'issue' : 'issues'}
                        </button>
                      )}
                      <div style={{ width: 1, height: 16, backgroundColor: c['border-divider'], flexShrink: 0 }} />
                    </>
                  )}

                  {/* Column count */}
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'], whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {totalColCount} {totalColCount === 1 ? 'column' : 'columns'}
                  </span>

                  {/* Search — inline expandable */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {searchOpen && (
                      <input
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearch(''); } }}
                        placeholder="Search columns…"
                        style={{ width: 176, height: 26, border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: '0 8px', fontSize: fs.xs, fontFamily: ff.primary, color: c['content-primary'], outline: 'none', backgroundColor: c['background-base'], boxSizing: 'border-box', transition: 'width 0.15s' }}
                        onFocus={e => (e.currentTarget.style.borderColor = c['border-brand'])}
                        onBlur={e => (e.currentTarget.style.borderColor = c['border-default'])}
                      />
                    )}
                    <button
                      title="Search columns"
                      onClick={() => { if (searchOpen) { setSearchOpen(false); setSearch(''); } else setSearchOpen(true); }}
                      style={{ width: 28, height: 28, border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, backgroundColor: searchOpen ? c['background-information'] : 'transparent', color: searchOpen ? c['content-brand'] : c['content-secondary'] }}
                      onMouseEnter={e => { if (!searchOpen) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                      onMouseLeave={e => { if (!searchOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="6.5" cy="6.5" r="4.5"/>
                        <line x1="10.5" y1="10.5" x2="14" y2="14"/>
                      </svg>
                    </button>
                  </div>

                  {/* Properties — column visibility popover */}
                  <div style={{ position: 'relative' }} ref={colVisRef}>
                    <button
                      title="Column properties"
                      onClick={() => setColVisOpen(o => !o)}
                      style={{ width: 28, height: 28, border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, backgroundColor: colVisOpen ? c['background-information'] : 'transparent', color: colVisOpen ? c['content-brand'] : c['content-secondary'] }}
                      onMouseEnter={e => { if (!colVisOpen) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                      onMouseLeave={e => { if (!colVisOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="2" y1="4" x2="14" y2="4"/>
                        <line x1="2" y1="8" x2="14" y2="8"/>
                        <line x1="2" y1="12" x2="14" y2="12"/>
                        <circle cx="5" cy="4" r="1.5" fill="currentColor" stroke="none"/>
                        <circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none"/>
                        <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                      </svg>
                    </button>
                    {colVisOpen && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: sp.C, width: 220, zIndex: 100, maxHeight: 400, overflowY: 'auto' }}>
                        <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: sp.A }}>Default visible</div>
                        {DEFAULT_VISIBLE_COLS.map(key => (
                          <div key={key} style={{ padding: '2px 0' }}>
                            <Checkbox
                              checked={visibleCols.has(key)}
                              label={COL_LABELS[key]}
                              onChange={() => { const s = new Set(visibleCols); s.has(key) ? s.delete(key) : s.add(key); setVisibleCols(s); }}
                            />
                          </div>
                        ))}
                        <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `${sp.B}px 0` }} />
                        <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: sp.A }}>Advanced</div>
                        {ADVANCED_COLS.map(({ key, label }) => (
                          <div key={key} style={{ padding: '2px 0' }}>
                            <Checkbox
                              checked={visibleCols.has(key)}
                              label={label}
                              onChange={() => { const s = new Set(visibleCols); s.has(key) ? s.delete(key) : s.add(key); setVisibleCols(s); }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Agent reopen */}
              {!agentPanelOpen && (
                <button
                  onClick={() => setAgentPanelOpen(true)}
                  style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-secondary'], boxSizing: 'border-box', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/>
                  </svg>
                  Data Agent
                </button>
              )}
              </div>
            </div>
          )}

          {isBuilding ? (
            <BuildingSkeleton />
          ) : (
            <CenterPanel project={project} setProject={setProject} onSendToAgent={(msg) => setExternalAgentMessage(msg)} onInjectToAgent={(text) => { setExternalInputInject(text); setAgentPanelOpen(true); }} selectedColumns={selectedColumns} onToggleColumn={(name) => { setSelectedColumns(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]); setAgentPanelOpen(true); }} onClearColumns={() => setSelectedColumns([])} search={search} visibleCols={visibleCols} showIssuesOnly={showIssuesOnly} />
          )}

          {/* Left panel overlay */}
          {leftPanelOpen && !isBuilding && (
            <>
              <div
                onClick={() => setLeftPanelOpen(false)}
                style={{ position: 'fixed', top: 104, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.04)', zIndex: 40 }}
              />
              <div style={{ position: 'fixed', left: 0, top: 104, bottom: 0, zIndex: 50, boxShadow: '1px 0 4px rgba(29,35,47,0.06)', clipPath: 'inset(0 -20px 0 0)', animation: 'ds-reveal 0.18s ease-out' }}>
                <LeftPanel project={project} setProject={setProject} onSendToAgent={(msg) => { setExternalAgentMessage(msg); setLeftPanelOpen(false); }} />
              </div>
            </>
          )}
        </div>

        {/* Drag handle — hidden when agent panel is closed */}
        <div
          onMouseDown={(e) => {
            if (!agentPanelOpen) return;
            e.preventDefault();
            dragStartX.current = e.clientX;
            dragStartWidth.current = agentPanelWidth;
            setIsDraggingAgent(true);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
          }}
          style={{
            display: agentPanelOpen ? 'block' : 'none',
            width: 5,
            flexShrink: 0,
            cursor: 'col-resize',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Visible line — border-colored normally, blue on hover/active drag */}
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: 2,
            width: 1,
            backgroundColor: isDraggingAgent ? '#2770ef' : c['border-divider'],
            transition: isDraggingAgent ? 'none' : 'background-color 0.15s',
          }}
            onMouseEnter={e => { if (!isDraggingAgent) (e.currentTarget as HTMLElement).style.backgroundColor = '#2770ef'; }}
            onMouseLeave={e => { if (!isDraggingAgent) (e.currentTarget as HTMLElement).style.backgroundColor = c['border-divider']; }}
          />
        </div>

        {/* Agent panel — always mounted so refs survive; hidden via display:none when toggled off */}
        <div style={{ display: agentPanelOpen ? 'flex' : 'none' }}>
          <AgentPanel
            project={project}
            setProject={setProject}
            messages={messages}
            setMessages={setMessages}
            initialPrompt={initialPrompt}
            onBuildComplete={() => setIsBuilding(false)}
            externalMessage={externalAgentMessage}
            onExternalMessageHandled={() => { setExternalAgentMessage(null); setExternalAgentAttachment(null); }}
            externalMessageAttachment={externalAgentAttachment}
            injectInput={externalInputInject}
            onInjectInputHandled={() => setExternalInputInject(null)}
            width={agentPanelWidth}
            onClose={() => setAgentPanelOpen(false)}
            selectedColumns={selectedColumns}
            onColumnRemove={(name) => setSelectedColumns(prev => prev.filter(c => c !== name))}
          />
        </div>
      </div>
    </div>
  );
};

// ── Building skeleton ─────────────────────────────────────────────────────────

const BUILDING_TIPS = [
  'Describe your goal and the agent builds the full model — tables, joins, and columns.',
  'Add a table by name: "Add the orders table from Snowflake"',
  'Create metrics in plain English: "Add Return on Spend"',
  'The agent removes PII, system fields, and low-signal columns automatically.',
  'Expand an existing model: "Add product category breakdowns"',
  'Ask for joins: "Connect orders to campaigns on campaign_id"',
];

const BuildingSkeleton: React.FC = () => {
  const [tipIndex, setTipIndex]   = useState(0);
  const [visible,  setVisible]    = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex(i => (i + 1) % BUILDING_TIPS.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <>
      <style>{`
        @keyframes ds-reveal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ds-step-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ds-spin { to { transform: rotate(360deg); } }
        .ds-gradient-text {
          background: linear-gradient(90deg, #2770EF 0%, #9333EA 60%, #2770EF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ds-gradient-shift 2s linear infinite;
        }
        @keyframes ds-gradient-shift { to { background-position: 200% center; } }
      `}</style>

      {/* Full-width canvas — illustration + rotating tips */}
      <div style={{ flex: 1, backgroundColor: c['background-sunken'], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.D, maxWidth: 420, textAlign: 'center' }}>

          {/* Model-building illustration */}
          <svg width="160" height="160" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: c['content-secondary'], opacity: 0.5 }}>
            {/* Central table node */}
            <rect x="28" y="36" width="40" height="28" rx="5" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="28" y1="46" x2="68" y2="46" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="36" y1="53" x2="60" y2="53" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="36" y1="58" x2="54" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            {/* Left satellite node */}
            <rect x="4" y="14" width="28" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 2"/>
            <line x1="4" y1="22" x2="32" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2"/>
            {/* Right satellite node */}
            <rect x="64" y="14" width="28" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 2"/>
            <line x1="64" y1="22" x2="92" y2="22" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2"/>
            {/* Connector lines */}
            <line x1="28" y1="42" x2="18" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
            <line x1="68" y1="42" x2="78" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
            {/* Bottom node */}
            <rect x="32" y="72" width="32" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 2"/>
            <line x1="48" y1="64" x2="48" y2="72" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>
              Building your model…
            </span>
            <span style={{
              fontSize: fs.sm,
              color: c['content-secondary'],
              lineHeight: 1.55,
              transition: 'opacity 0.35s ease',
              opacity: visible ? 1 : 0,
              minHeight: 36,
            }}>
              {BUILDING_TIPS[tipIndex]}
            </span>
          </div>

        </div>
      </div>
    </>
  );
};


// ── Republish wizard ──────────────────────────────────────────────────────────

const MOCK_DEPENDENTS = [
  { name: 'Campaign ROI by Region',   type: 'Live board', owner: 'Sara Chen', lastViewed: '2 days ago' },
  { name: 'Q1 Campaign Summary',      type: 'Live board', owner: 'Mark T.',   lastViewed: '5 days ago' },
  { name: 'Top performing channels',  type: 'Answer',     owner: 'Sara Chen', lastViewed: '1 day ago'  },
  { name: 'Campaign spend vs orders', type: 'Answer',     owner: 'Priya K.',  lastViewed: '3 days ago' },
];

const RepublishWizard: React.FC<{
  project: ProjectState;
  onClose: () => void;
  onPublish: () => void;
}> = ({ project, onClose, onPublish }) => {
  const [selectedAction, setSelectedAction] = useState<'detach' | 'delete' | null>(null);

  const tableCount    = project.addedTables.length || 3;
  const joinCount     = project.addedTables.length >= 2 ? project.addedTables.length - 1 : 2;
  const metricCount   = (project.buildStep === 'transformed' || project.buildStep === 'healthy') ? 3 : 0;
  const totalCols     = Object.values(project.includedColumns).flat().length || 18;
  const overriddenCols = Object.values(project.columnOverrides ?? {}).filter(v => v.aiContext).length;
  const allDescribed   = overriddenCols >= totalCols;
  const describedCols  = allDescribed ? totalCols : Math.round(totalCols * 0.78);

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    padding: `${sp.B}px 0`,
    borderBottom: `1px solid ${c['border-divider']}`,
    gap: sp.C,
  };
  const labelStyle: React.CSSProperties = { fontSize: fs.sm, color: c['content-secondary'], width: 120, flexShrink: 0 };
  const valueStyle: React.CSSProperties = { fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium, flex: 1 };

  const Badge: React.FC<{ variant: 'green' | 'yellow' | 'gray'; children: React.ReactNode }> = ({ variant, children }) => {
    const bgColor = variant === 'green' ? c['background-success'] : variant === 'yellow' ? c['background-warning'] : c['background-sunken'];
    const textColor = variant === 'green' ? c['content-success'] : variant === 'yellow' ? c['content-warning'] : c['content-secondary'];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: fw.semibold, padding: '2px 8px', borderRadius: 4, backgroundColor: bgColor, color: textColor }}>
        {children}
      </span>
    );
  };

  const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
    <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '2px 7px', borderRadius: 4,
      backgroundColor: type === 'Live board' ? c['background-information'] : c['background-sunken'],
      color: type === 'Live board' ? c['content-brand'] : c['content-secondary'] }}>
      {type}
    </span>
  );

  const step1Content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
      <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'] }}>
        This model has dependents. Choose what to do with them before publishing.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: c['background-sunken'] }}>
            {['Name', 'Type', 'Owner', 'Last viewed'].map(h => (
              <th key={h} style={{ padding: `${sp.B}px ${sp.C}px`, textAlign: 'left', fontSize: 11, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${c['border-divider']}` }}>
                {h}
              </th>
            ))}
            <th style={{ padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}` }} />
          </tr>
        </thead>
        <tbody>
          {MOCK_DEPENDENTS.map(dep => (
            <tr key={dep.name} style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
              <td style={{ padding: `${sp.C}px ${sp.C}px`, fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>{dep.name}</td>
              <td style={{ padding: `${sp.C}px ${sp.C}px` }}><TypeBadge type={dep.type} /></td>
              <td style={{ padding: `${sp.C}px ${sp.C}px`, fontSize: fs.sm, color: c['content-secondary'] }}>{dep.owner}</td>
              <td style={{ padding: `${sp.C}px ${sp.C}px`, fontSize: fs.sm, color: c['content-secondary'] }}>{dep.lastViewed}</td>
              <td style={{ padding: `${sp.C}px ${sp.C}px` }}>
                <button
                  onClick={() => window.open('about:blank', '_blank')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], padding: 0, fontFamily: ff.primary }}
                >
                  View ↗
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
        <p style={{ margin: 0, fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Choose an action
        </p>
        {(['detach', 'delete'] as const).map(action => (
          <label key={action} style={{ display: 'flex', alignItems: 'center', gap: sp.B, cursor: 'pointer' }}>
            <input
              type="radio"
              name="dependent-action"
              value={action}
              checked={selectedAction === action}
              onChange={() => setSelectedAction(action)}
              style={{ accentColor: c['content-brand'], width: 14, height: 14, flexShrink: 0 }}
            />
            <span style={{ fontSize: fs.sm, color: c['content-primary'] }}>
              {action === 'detach' ? 'Detach all — remove model link, keep boards and answers' : 'Delete all — permanently remove dependent boards and answers'}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const step2Content = (
    <div>
      <p style={{ margin: `0 0 ${sp.D}px`, fontSize: fs.sm, color: c['content-secondary'] }}>
        You're about to publish {project.name} with the following changes.
      </p>
      <div style={rowStyle}>
        <span style={labelStyle}>Tables</span>
        <span style={valueStyle}>
          {tableCount}
          <span style={{ color: c['content-secondary'], fontWeight: fw.regular, fontSize: fs.xs, marginLeft: 6 }}>
            ({project.addedTables.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') || 'Orders, Campaigns, Users'})
          </span>
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Joins</span>
        <span style={valueStyle}>{joinCount} relationships</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Metrics</span>
        <span style={valueStyle}>
          {metricCount > 0
            ? `${metricCount} (ROAS, Conversion Rate, Days to Convert)`
            : <span style={{ color: c['content-secondary'], fontWeight: fw.regular }}>None defined</span>
          }
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>AI context</span>
        <span style={valueStyle}>
          {allDescribed
            ? <Badge variant="green">✓ All columns described</Badge>
            : <Badge variant="yellow">⚠ {describedCols} of {totalCols} columns described</Badge>
          }
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Data prep</span>
        <span style={valueStyle}><Badge variant="gray">Not configured</Badge></span>
      </div>
      <div style={{ ...rowStyle, borderBottom: 'none' }}>
        <span style={labelStyle}>Caching</span>
        <span style={valueStyle}><Badge variant="gray">Not configured</Badge></span>
      </div>
    </div>
  );

  return (
    <WizardModal
      isOpen
      onClose={onClose}
      title="Publish model"
      size="medium"
      onComplete={onPublish}
      steps={[
        {
          id: 'dependents',
          title: 'Update dependents',
          content: step1Content,
          validate: () => selectedAction !== null,
          nextButtonText: 'Continue',
          hideBackButton: true,
        },
        {
          id: 'review',
          title: 'Review changes',
          content: step2Content,
          nextButtonText: 'Publish model',
        },
      ]}
    />
  );
};

// ── Publish modal ─────────────────────────────────────────────────────────────

const PublishModal: React.FC<{
  project: ProjectState;
  onClose: () => void;
  onPublish: () => void;
}> = ({ project, onClose, onPublish }) => {
  const tableCount   = project.addedTables.length || 3;
  const joinCount    = project.addedTables.length >= 2 ? project.addedTables.length - 1 : 0;
  const metricCount  = (project.buildStep === 'transformed' || project.buildStep === 'healthy') ? 3 : 0;
  const totalCols    = Object.values(project.includedColumns).flat().length || 18;
  const describedCols = Math.round(totalCols * 0.78); // 78% described — realistic partial state
  const hasPrep      = project.buildStep === 'healthy';
  const nextVersion  = project.publishedVersion + 1;

  const handlePublish = () => { onClose(); onPublish(); };

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    padding: `${sp.B}px 0`,
    borderBottom: `1px solid ${c['border-divider']}`,
    gap: sp.C,
  };
  const labelStyle: React.CSSProperties = { fontSize: fs.sm, color: c['content-secondary'], width: 120, flexShrink: 0 };
  const valueStyle: React.CSSProperties = { fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium, flex: 1 };

  const Badge: React.FC<{ variant: 'green' | 'yellow' | 'gray'; children: React.ReactNode }> = ({ variant, children }) => {
    const styles: Record<string, React.CSSProperties> = {
      green:  { backgroundColor: '#DCFCE7', color: '#15803D' },
      yellow: { backgroundColor: '#FEF9C3', color: '#854D0E' },
      gray:   { backgroundColor: c['background-sunken'], color: c['content-secondary'] },
    };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: fw.semibold, padding: '2px 8px', borderRadius: 4, ...styles[variant] }}>
        {children}
      </span>
    );
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: c['background-overlay'], zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: c['background-base'], borderRadius: 14, width: 480, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.D }}>
          <div>
            <h2 style={{ margin: 0, fontSize: fs.lg, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: -0.2 }}>
              Publish {project.name}
            </h2>
            <p style={{ margin: `${sp.A}px 0 0`, fontSize: fs.sm, color: c['content-secondary'] }}>
              Make this model available to Spotter and your team.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c['content-secondary'], marginTop: 2 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body — summary table */}
        <div style={{ padding: `${sp.D}px ${sp.F}px` }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Tables</span>
            <span style={valueStyle}>
              {tableCount}
              <span style={{ color: c['content-secondary'], fontWeight: fw.regular, fontSize: fs.xs, marginLeft: 6 }}>
                ({project.addedTables.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') || 'Orders, Campaigns, Users'})
              </span>
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Joins</span>
            <span style={valueStyle}>{joinCount || 2} relationships</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Metrics</span>
            <span style={valueStyle}>
              {metricCount > 0
                ? `${metricCount}  (ROAS, Conversion Rate, Days to Convert)`
                : <span style={{ color: c['content-secondary'], fontWeight: fw.regular }}>None defined</span>
              }
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>AI context</span>
            <span style={valueStyle}>
              {describedCols < totalCols
                ? <Badge variant="yellow">⚠ {describedCols} of {totalCols} columns described</Badge>
                : <Badge variant="green">✓ All columns described</Badge>
              }
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Data prep</span>
            <span style={valueStyle}>
              <Badge variant="gray">Not configured</Badge>
            </span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Caching</span>
            <span style={valueStyle}><Badge variant="gray">Not configured</Badge></span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handlePublish}>Publish Model</Button>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
