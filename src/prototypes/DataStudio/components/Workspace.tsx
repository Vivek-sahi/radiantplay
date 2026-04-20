import React, { useState } from 'react';
import { c, sp, ff, fs, fw, ts, HEADER_HEIGHT } from '../styles';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { Select } from '../../../components/Select';
import { Checkbox } from '../../../components/Checkbox';
import { ProjectState } from '../index';
import { AgentMessage } from './AgentPanel';
import AgentPanel from './AgentPanel';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';

interface WorkspaceProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  onBack: () => void;
  initialPrompt?: string;
}

const Workspace: React.FC<WorkspaceProps> = ({ project, setProject, onBack, initialPrompt }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isBuilding, setIsBuilding] = useState(!!initialPrompt);
  const [externalAgentMessage, setExternalAgentMessage] = useState<string | null>(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [cacheModalOpen, setCacheModalOpen] = useState(false);

  const setTab = (tab: ProjectState['activeTab']) =>
    setProject(p => ({ ...p, activeTab: tab }));

  const enterTestMode = () =>
    setProject(p => ({ ...p, testMode: true }));

  const exitTestMode = () =>
    setProject(p => ({ ...p, testMode: false }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: ff.primary }}>

      {/* Project header */}
      <div style={{ height: HEADER_HEIGHT, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>

        {/* Left: back + project name */}
        <Button variant="tertiary" size="small" onClick={onBack}>←</Button>
        <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{project.name}</span>
        <Button variant="tertiary" size="small">ⓘ</Button>

        {/* Center: tabs */}
        {!project.testMode && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', backgroundColor: c['background-subtle'], borderRadius: 8, padding: 3, gap: 2 }}>
              {([
                { id: 'visualizer', label: 'Visualizer', icon: '📊' },
                { id: 'preview',   label: 'Data Preview', icon: '📄' },
                { id: 'notebook',  label: 'Notebook',    icon: '</>' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.A,
                    padding: `${sp.A}px ${sp.C}px`,
                    borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: fs.sm, fontWeight: project.activeTab === tab.id ? 500 : 400,
                    backgroundColor: project.activeTab === tab.id ? c['background-base'] : 'transparent',
                    color: project.activeTab === tab.id ? c['content-brand'] : c['content-secondary'],
                    boxShadow: project.activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: fs.xs }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {project.testMode && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: sp.B }}>
              {['Spotter', 'Search Data'].map((t, i) => (
                <Button key={t} variant={i === 0 ? 'primary' : 'secondary'} size="small">{t}</Button>
              ))}
            </div>
          </div>
        )}

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginLeft: 'auto' }}>

          {/* Test button */}
          {!project.testMode ? (
            <Button variant="primary" size="small" onClick={enterTestMode}>▶ Test</Button>
          ) : (
            <Button variant="secondary" size="small" onClick={exitTestMode}>← Build</Button>
          )}

          {/* Warehouse dropdown */}
          <div style={{ position: 'relative' }}>
            <Button variant="secondary" size="small" onClick={() => setWarehouseOpen(o => !o)}>🗄 Warehouse ▾</Button>
            {warehouseOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 220, overflow: 'hidden' }}>
                <div
                  onClick={() => setWarehouseOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', backgroundColor: c['background-information'], fontSize: fs.sm, color: c['content-brand'] }}
                >
                  <span>❄</span>
                  <span>Live query · Snowflake</span>
                  <span style={{ marginLeft: 'auto', fontSize: fs.xs }}>✓</span>
                </div>
                <div
                  onClick={() => { setWarehouseOpen(false); setCacheModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', fontSize: fs.sm, color: c['content-primary'] }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>⚡</span>
                  <span>Enable caching in ThoughtSpot</span>
                </div>
              </div>
            )}
          </div>

          <Button variant="secondary" size="small">⚙ Settings</Button>
          {hasShared
            ? <Button variant="secondary" size="small" onClick={() => setShareOpen(true)} style={{ color: c['content-success'], borderColor: c['content-success'] }}>✓ Shared</Button>
            : <Button variant="secondary" size="small" onClick={() => setShareOpen(true)}>↗ Share</Button>}
        </div>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} onShared={() => setHasShared(true)} />}
      {cacheModalOpen && <CacheModal onClose={() => setCacheModalOpen(false)} />}

      {/* Body */}
      {project.testMode ? (
        <TestModePanel onExit={exitTestMode} project={project} />
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {isBuilding ? (
            <BuildingSkeleton />
          ) : (
            <>
              <LeftPanel project={project} setProject={setProject} onSendToAgent={setExternalAgentMessage} />
              <CenterPanel project={project} />
            </>
          )}
          <AgentPanel
            project={project}
            setProject={setProject}
            messages={messages}
            setMessages={setMessages}
            initialPrompt={initialPrompt}
            onBuildComplete={() => setIsBuilding(false)}
            externalMessage={externalAgentMessage}
            onExternalMessageHandled={() => setExternalAgentMessage(null)}
          />
        </div>
      )}
    </div>
  );
};

// ── Building skeleton ─────────────────────────────────────────────────────────

const BuildingSkeleton: React.FC = () => (
  <>
    <style>{`
      @keyframes ds-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .ds-skel { animation: ds-pulse 1.6s ease-in-out infinite; border-radius: 6px; background: ${c['background-subtle']}; }
      .ds-skel:nth-child(2) { animation-delay: 0.2s; }
      .ds-skel:nth-child(3) { animation-delay: 0.4s; }
      .ds-skel:nth-child(4) { animation-delay: 0.6s; }
    `}</style>

    {/* Left panel skeleton */}
    <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], padding: sp.D, display: 'flex', flexDirection: 'column', gap: sp.D }}>
      <div className="ds-skel" style={{ height: 14, width: '60%' }} />
      <div className="ds-skel" style={{ height: 10, width: '85%' }} />
      <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `${sp.A}px 0` }} />
      <div className="ds-skel" style={{ height: 14, width: '40%' }} />
      <div className="ds-skel" style={{ height: 10, width: '70%' }} />
      <div className="ds-skel" style={{ height: 10, width: '65%' }} />
      <div className="ds-skel" style={{ height: 10, width: '75%' }} />
      <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `${sp.A}px 0` }} />
      <div className="ds-skel" style={{ height: 14, width: '55%' }} />
      <div className="ds-skel" style={{ height: 10, width: '80%' }} />
      <div className="ds-skel" style={{ height: 10, width: '60%' }} />
    </div>

    {/* Center canvas skeleton */}
    <div style={{ flex: 1, backgroundColor: c['background-sunken'], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.H }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.F, alignItems: 'center' }}>
        <div className="ds-skel" style={{ width: 180, height: 80 }} />
        <div style={{ display: 'flex', gap: sp.H }}>
          <div className="ds-skel" style={{ width: 160, height: 70 }} />
          <div className="ds-skel" style={{ width: 160, height: 70 }} />
        </div>
      </div>
    </div>
  </>
);

// ── Cache modal ───────────────────────────────────────────────────────────────

const CACHE_COLUMNS = {
  Orders:    ['order_id', 'user_id', 'campaign_id', 'order_date', 'amount', 'product_category', 'status', 'region'],
  Campaigns: ['campaign_id', 'campaign_name', 'channel', 'start_date', 'end_date', 'spend', 'impressions', 'target_audience', 'budget'],
  Users:     ['user_id', 'name', 'email', 'segment', 'region', 'age', 'signup_date', 'lifetime_value'],
};

const CacheModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [frequency, setFrequency] = useState('every_monday');
  const [filters, setFilters] = useState([{ col: 'region', op: '=', val: '' }]);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({ Orders: true, Campaigns: true, Users: true });
  const [selectedCols, setSelectedCols] = useState<Record<string, boolean>>(
    Object.values(CACHE_COLUMNS).flat().reduce((acc, col) => ({ ...acc, [col]: true }), {})
  );

  const addFilter = () => setFilters(f => [...f, { col: 'region', op: '=', val: '' }]);
  const removeFilter = (i: number) => setFilters(f => f.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, key: 'col' | 'op' | 'val', value: string) =>
    setFilters(f => f.map((row, idx) => idx === i ? { ...row, [key]: value } : row));

  const toggleTable = (t: string) => setExpandedTables(e => ({ ...e, [t]: !e[t] }));
  const toggleCol = (col: string) => setSelectedCols(s => ({ ...s, [col]: !s[col] }));
  const toggleTable_allCols = (table: string) => {
    const cols = CACHE_COLUMNS[table as keyof typeof CACHE_COLUMNS];
    const allSelected = cols.every(c => selectedCols[c]);
    setSelectedCols(s => ({ ...s, ...Object.fromEntries(cols.map(c => [c, !allSelected])) }));
  };

  const FREQ_OPTIONS = [
    { value: 'every_monday',    label: 'Every Monday' },
    { value: 'every_day',       label: 'Every day at midnight' },
    { value: 'every_6h',        label: 'Every 6 hours' },
    { value: 'every_hour',      label: 'Every hour' },
    { value: 'manual',          label: 'Manual only' },
  ];

  const allColumns = Object.values(CACHE_COLUMNS).flat();
  const colOptions = ['region', 'channel', 'segment', 'status', 'product_category'];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: c['background-overlay'], zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 580, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, ...ts.sectionLabel, color: c['content-primary'] }}>Enable caching in ThoughtSpot</h2>
          <Button variant="tertiary" size="small" onClick={onClose}>×</Button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px ${sp.F}px`, display: 'flex', flexDirection: 'column', gap: sp.F }}>

          {/* Refresh frequency */}
          <div>
            <label style={{ ...ts.contentLabelSubhead, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Caching refresh frequency</label>
            <Select
              options={FREQ_OPTIONS.map(o => ({ id: o.value, label: o.label }))}
              value={frequency}
              onChange={val => setFrequency(val)}
              fullWidth
            />
          </div>

          {/* Filters */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
              <label style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>Filters</label>
              <Button variant="tertiary" size="small" onClick={addFilter}>+ Add filter</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {filters.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: sp.B, alignItems: 'center' }}>
                  <div style={{ flex: 2 }}>
                    <Select
                      options={colOptions.map(col => ({ id: col, label: col }))}
                      value={f.col}
                      onChange={val => updateFilter(i, 'col', val)}
                      fullWidth
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Select
                      options={['=', '!=', 'contains', 'starts with'].map(op => ({ id: op, label: op }))}
                      value={f.op}
                      onChange={val => updateFilter(i, 'op', val)}
                      fullWidth
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <TextInput value={f.val} onChange={e => updateFilter(i, 'val', e.target.value)} placeholder="Value" />
                  </div>
                  <Button variant="tertiary" size="small" onClick={() => removeFilter(i)}>×</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Column scope */}
          <div>
            <label style={{ ...ts.contentLabelSubhead, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Column scope</label>
            <div style={{ border: `1px solid ${c['border-default']}`, borderRadius: 8, overflow: 'hidden' }}>
              {(Object.entries(CACHE_COLUMNS) as [string, string[]][]).map(([table, cols], ti) => {
                const allSel = cols.every(col => selectedCols[col]);
                const someSel = cols.some(col => selectedCols[col]);
                return (
                  <div key={table} style={{ borderBottom: ti < 2 ? `1px solid ${c['border-divider']}` : 'none' }}>
                    {/* Table row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], cursor: 'pointer' }}
                      onClick={() => toggleTable(table)}>
                      <div onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={allSel}
                          indeterminate={someSel && !allSel}
                          onChange={() => toggleTable_allCols(table)}
                        />
                      </div>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'], flex: 1 }}>⊞ {table}</span>
                      <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{expandedTables[table] ? '▾' : '▶'}</span>
                    </div>
                    {/* Column rows */}
                    {expandedTables[table] && (
                      <div style={{ paddingLeft: sp.H }}>
                        {cols.map(col => (
                          <label key={col} style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.A}px ${sp.C}px`, cursor: 'pointer', fontSize: fs.xs, color: c['content-primary'] }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <input type="checkbox" checked={!!selectedCols[col]} onChange={() => toggleCol(col)}
                              style={{ width: 13, height: 13, accentColor: c['content-brand'], cursor: 'pointer', flexShrink: 0 }} />
                            <span style={{ fontFamily: ff.mono, fontSize: fs.xs }}>{col}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: `${sp.B}px 0 0` }}>
              {Object.values(selectedCols).filter(Boolean).length} of {allColumns.length} columns included in cache
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onClose}>Enable caching</Button>
        </div>
      </div>
    </div>
  );
};

// ── Share modal ───────────────────────────────────────────────────────────────

interface SharedUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  permission: 'Can view' | 'Can edit' | 'Can manage';
}

const ShareModal: React.FC<{ onClose: () => void; onShared?: () => void }> = ({ onClose, onShared }) => {
  const [inputValue, setInputValue] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [addMessage, setAddMessage] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [copied, setCopied] = useState(false);
  const [openPermission, setOpenPermission] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const AVATAR_COLORS = [c['content-brand'], c['content-success'], c['content-warning'], '#A855F7', c['content-failure'], '#14B8A6'];

  const addUser = () => {
    const name = inputValue.trim();
    if (!name) return;
    const initials = name.split(/[.\s@]/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
    setSharedUsers(prev => [...prev, {
      id: `u-${Date.now()}`,
      name,
      initials: initials || name[0].toUpperCase(),
      color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
      permission: 'Can view',
    }]);
    setInputValue('');
  };

  const removeUser = (id: string) => setSharedUsers(prev => prev.filter(u => u.id !== id));

  const setPermission = (id: string, permission: SharedUser['permission']) => {
    setSharedUsers(prev => prev.map(u => u.id === id ? { ...u, permission } : u));
    setOpenPermission(null);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: c['background-overlay'], zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
          <h2 style={{ margin: 0, ...ts.sectionLabel, color: c['content-primary'] }}>Share</h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px ${sp.F}px` }}>

          {/* Input row */}
          <label style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'flex', alignItems: 'center', gap: sp.A, marginBottom: sp.B }}>
            Enter user name or group name
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: fs.xs, color: c['content-secondary'], cursor: 'default' }}>i</span>
          </label>
          <div style={{ display: 'flex', gap: sp.B, marginBottom: sp.C }}>
            <div style={{ flex: 1 }}>
              <TextInput
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addUser()}
                placeholder="User name or group name"
              />
            </div>
            <Button variant="secondary" size="small" onClick={addUser}>+</Button>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.F, marginBottom: sp.D }}>
            <CheckboxField checked={sendNotification} onChange={setSendNotification} label="Send notification" />
            <CheckboxField checked={addMessage} onChange={setAddMessage} label="Add message (optional)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
              <CheckboxField checked={false} onChange={() => {}} label="Embedded link format" />
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: c['content-secondary'], cursor: 'default', flexShrink: 0 }}>i</span>
            </div>
          </div>

          {/* Shared users list */}
          {sharedUsers.length > 0 && (
            <div style={{ marginBottom: sp.D }}>
              <p style={{ ...ts.contentLabelSubhead, color: c['content-primary'], margin: `0 0 ${sp.C}px` }}>Shared with:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                {sharedUsers.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: '#fff' }}>{user.initials}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'] }}>{user.name}</span>

                    {/* Permission dropdown */}
                    <div style={{ position: 'relative' }}>
                      <Button variant="tertiary" size="small" onClick={() => setOpenPermission(openPermission === user.id ? null : user.id)}>
                        {user.permission} ▾
                      </Button>
                      {openPermission === user.id && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden', minWidth: 130 }}>
                          {(['Can view', 'Can edit', 'Can manage'] as const).map(perm => (
                            <div
                              key={perm}
                              onClick={() => setPermission(user.id, perm)}
                              style={{ padding: `${sp.B}px ${sp.C}px`, fontSize: fs.sm, cursor: 'pointer', color: user.permission === perm ? c['content-brand'] : c['content-primary'], backgroundColor: user.permission === perm ? c['background-information'] : c['background-base'], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => { if (user.permission !== perm) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                              onMouseLeave={e => { if (user.permission !== perm) e.currentTarget.style.backgroundColor = c['background-base']; }}
                            >
                              {perm}
                              {user.permission === perm && <span style={{ fontSize: fs.xs }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button variant="tertiary" size="small" onClick={() => removeUser(user.id)}>×</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${c['border-divider']}`, margin: `${sp.C}px 0` }} />

          {/* Discoverable */}
          <div style={{ marginBottom: sp.C }}>
            <CheckboxField checked={discoverable} onChange={setDiscoverable} label="Make this data model discoverable">
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: c['content-secondary'], cursor: 'default', marginLeft: sp.A }}>i</span>
            </CheckboxField>
          </div>

          {/* Copy link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
              Anyone with access can use this link to view the data model
            </span>
            <Button variant="secondary" size="small" onClick={handleCopy} style={{ flexShrink: 0, marginLeft: sp.D }}>
              {copied ? '✓ Copied' : 'Copy link'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: submitted ? 'flex-start' : 'flex-end', gap: sp.B, minHeight: 56 }}>
          {submitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, color: c['content-success'], fontSize: fs.sm, fontWeight: fw.medium }}>
              <span style={{ fontSize: fs.lg }}>✓</span>
              Shared with {sharedUsers.length} {sharedUsers.length === 1 ? 'person' : 'people'}
            </div>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (sharedUsers.length > 0) {
                    setSubmitted(true);
                    onShared?.();
                    setTimeout(onClose, 1800);
                  } else {
                    onClose();
                  }
                }}
              >Share</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckboxField: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  children?: React.ReactNode;
}> = ({ checked, onChange, label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
    <Checkbox checked={checked} onChange={onChange} label={label} />
    {children}
  </div>
);

// ── Test mode panel ───────────────────────────────────────────────────────────

const TEST_ANSWERS: Record<string, { content: string; chart?: boolean }> = {
  'Which campaign drove the most orders last month?': {
    content: `**Summer Sale 2024** drove the most orders last month.\n\n• Orders: **342**\n• Conversion rate: **4.7%**\n• Channel: Email\n• Spend: $12,400\n• Return on spend: **3.21×**\n• Top region: West (128 orders)`,
    chart: true,
  },
  'What is the return on spend by campaign channel?': {
    content: `**Return on spend by channel**\n\n• Email — **3.2×** avg RoS\n• Social — **2.8×** avg RoS\n• Paid Search — **2.1×** avg RoS\n• Display — **1.4×** avg RoS\n\nEmail campaigns are the highest performing channel at 3.2× return on spend on average.`,
    chart: true,
  },
  'Which region has the highest order volume?': {
    content: `**West** is the region with the highest order volume.\n\n• West — **335.9M** in sales (38% of total)\n• East — 241.3M\n• North — 198.7M\n• South — 156.2M\n\nWest has been the top region for 9 of the last 12 months.`,
    chart: true,
  },
};

const TestModePanel: React.FC<{ onExit: () => void; project: ProjectState }> = ({ onExit, project }) => {
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'ai'; content: string; chart?: boolean }[]>([]);

  const sendTest = () => {
    const text = testInput.trim();
    if (!text) return;
    setTestInput('');
    setTestMessages(prev => [...prev, { role: 'user', content: text }]);

    const answer = TEST_ANSWERS[text] ?? {
      content: `Based on your data model, I found relevant results for **"${text}"**.\n\nThe analysis shows patterns across your Orders, Campaigns, and Users data. Refine your question or explore the suggestions below for more specific insights.`,
      chart: false,
    };

    setTimeout(() => {
      setTestMessages(prev => [...prev, { role: 'ai', ...answer }]);
    }, 1200);
  };

  if (project.buildStep === 'empty') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c['background-sunken'] }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: sp.H }}>
          <div style={{ fontSize: fs['4xl'], marginBottom: sp.D }}>🎯</div>
          <h2 style={{ ...ts.sectionLabel, color: c['content-primary'], margin: `0 0 ${sp.C}px` }}>No model ready yet</h2>
          <p style={{ ...ts.bodyNormal, color: c['content-secondary'], margin: `0 0 ${sp.F}px` }}>
            Build your model first — add data, create joins, and add calculated columns. Then come back here to test it with real questions.
          </p>
          <Button variant="secondary" onClick={onExit}>Back to build</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], overflow: 'hidden' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.H}px ${sp.H}px 0` }}>
        {testMessages.length === 0 && (
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: sp.J }}>
            <div style={{ fontSize: fs['3xl'], marginBottom: sp.C }}>🎯</div>
            <h2 style={{ ...ts.sectionLabel, color: c['content-primary'], marginBottom: sp.C }}>Test your model</h2>
            <p style={{ fontSize: fs.sm, color: c['content-secondary'], marginBottom: sp.H }}>
              Ask questions the way your business users will. Verify that your model returns accurate answers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B, textAlign: 'left' }}>
              {[
                'Which campaign drove the most orders last month?',
                'What is the return on spend by campaign channel?',
                'Which region has the highest order volume?',
              ].map(q => (
                <Button key={q} variant="secondary" size="small" onClick={() => setTestInput(q)}>{q}</Button>
              ))}
            </div>
          </div>
        )}

        {testMessages.map((msg, i) => (
          <div key={i} style={{ maxWidth: 720, margin: '0 auto', marginBottom: sp.F }}>
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: sp.D }}>
                <div style={{ backgroundColor: c['background-base'], borderRadius: 10, padding: `${sp.C}px ${sp.D}px`, fontSize: fs.sm, color: c['content-primary'], maxWidth: '75%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: c['background-base'], borderRadius: 12, padding: sp.D, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.C }}>
                  <span style={{ fontSize: fs.md }}>✨</span>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Work done in 15 seconds ▾</span>
                </div>
                <div style={{ fontSize: fs.sm, color: c['content-primary'], whiteSpace: 'pre-line' }}>
                  <FormattedMsg content={msg.content} />
                </div>
                {msg.chart && (
                  <div style={{ marginTop: sp.D, border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], display: 'flex', gap: sp.B }}>
                      {['top 1', 'region', 'sales', '↑ sort by sales'].map(chip => (
                        <span key={chip} style={{ fontSize: fs.xs, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 4, padding: '2px 6px', color: c['content-secondary'] }}>{chip}</span>
                      ))}
                    </div>
                    <div style={{ height: 120, backgroundColor: c['background-warning'], display: 'flex', alignItems: 'flex-end', padding: `${sp.C}px ${sp.D}px ${sp.D}px` }}>
                      <div style={{ width: '100%', height: 80, backgroundColor: c['content-warning'], borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <div style={{ padding: `${sp.A}px ${sp.D}px`, fontSize: fs.xs, color: c['content-secondary'] }}>West · 335.89M</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test input */}
      <div style={{ padding: `${sp.D}px ${sp.H}px ${sp.F}px`, flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', border: `1px solid ${c['border-default']}`, borderRadius: 12, backgroundColor: c['background-base'], boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <TextInput
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendTest()}
            placeholder="Ask me a question. Use '@' to search for columns or values"
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.A}px ${sp.D}px ${sp.B}px` }}>
            <div style={{ display: 'flex', gap: sp.B }}>
              <span style={{ fontSize: fs.md, cursor: 'pointer' }}>📊</span>
              <span style={{ fontSize: fs.sm, cursor: 'pointer', color: c['content-secondary'] }}>🔍</span>
              <span style={{ fontSize: fs.xs, backgroundColor: c['background-subtle'], padding: '2px 8px', borderRadius: 4, color: c['content-secondary'] }}>{project.name}</span>
            </div>
            <Button variant="primary" size="small" disabled={!testInput.trim()} onClick={sendTest}>↑</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormattedMsg: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : <span key={i}>{p}</span>)}</>;
};

export default Workspace;
