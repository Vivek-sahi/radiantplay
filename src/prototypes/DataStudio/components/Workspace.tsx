import React, { useState } from 'react';
import { c, sp, GLOBAL_NAV_HEIGHT, HEADER_HEIGHT } from '../styles';
import { ProjectState } from '../index';
import { AgentMessage } from './AgentPanel';
import AgentPanel from './AgentPanel';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';

interface WorkspaceProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  onBack: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ project, setProject, onBack }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Global header */}
      <div style={{ height: GLOBAL_NAV_HEIGHT, backgroundColor: '#1D232F', display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#4A90E2"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">TS</text>
        </svg>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: `${sp.A}px ${sp.C}px`, width: 200 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>🔍</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Search your library</span>
        </div>
        {['🔔', '?'].map(icon => (
          <div key={icon} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{icon}</span>
          </div>
        ))}
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#4A90E2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>V</span>
        </div>
      </div>

      {/* Project header */}
      <div style={{ height: HEADER_HEIGHT, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>

        {/* Left: back + project name */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 18, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}>←</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: c['content-primary'] }}>{project.name}</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 14, padding: 0 }}>ⓘ</button>

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
                    fontSize: 13, fontWeight: project.activeTab === tab.id ? 500 : 400,
                    backgroundColor: project.activeTab === tab.id ? '#fff' : 'transparent',
                    color: project.activeTab === tab.id ? '#4A90E2' : c['content-secondary'],
                    boxShadow: project.activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{tab.icon}</span>
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
                <button key={t} style={{ padding: `${sp.A}px ${sp.C}px`, borderRadius: 6, border: i === 0 ? '2px solid #4A90E2' : `1px solid ${c['border-default']}`, backgroundColor: i === 0 ? '#EEF4FF' : 'transparent', color: i === 0 ? '#4A90E2' : c['content-secondary'], fontSize: 13, cursor: 'pointer', fontWeight: i === 0 ? 500 : 400 }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginLeft: 'auto' }}>

          {/* Test button */}
          {!project.testMode ? (
            <HeaderBtn icon="▶" label="Test" onClick={enterTestMode} primary />
          ) : (
            <HeaderBtn icon="←" label="Build" onClick={exitTestMode} />
          )}

          {/* Warehouse dropdown */}
          <div style={{ position: 'relative' }}>
            <HeaderBtn icon="🗄" label="Warehouse" chevron onClick={() => setWarehouseOpen(o => !o)} />
            {warehouseOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: '#fff', border: `1px solid ${c['border-default']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 220, overflow: 'hidden' }}>
                <div
                  onClick={() => setWarehouseOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', backgroundColor: '#EEF4FF', fontSize: 13, color: '#4A90E2' }}
                >
                  <span>❄</span>
                  <span>Live query · Snowflake</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>
                </div>
                <div
                  onClick={() => { setWarehouseOpen(false); setCacheModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', fontSize: 13, color: c['content-primary'] }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>⚡</span>
                  <span>Enable caching in ThoughtSpot</span>
                </div>
              </div>
            )}
          </div>

          <HeaderBtn icon="⚙" label="Settings" />
          {hasShared
            ? <HeaderBtn icon="✓" label="Shared" onClick={() => setShareOpen(true)} success />
            : <HeaderBtn icon="↗" label="Share" onClick={() => setShareOpen(true)} />}
        </div>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} onShared={() => setHasShared(true)} />}
      {cacheModalOpen && <CacheModal onClose={() => setCacheModalOpen(false)} />}

      {/* Body */}
      {project.testMode ? (
        <TestModePanel onExit={exitTestMode} project={project} />
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <LeftPanel project={project} setProject={setProject} />
          <CenterPanel project={project} />
          <AgentPanel project={project} setProject={setProject} messages={messages} setMessages={setMessages} />
        </div>
      )}
    </div>
  );
};

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
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, width: 580, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: c['content-primary'] }}>Enable caching in ThoughtSpot</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px ${sp.F}px`, display: 'flex', flexDirection: 'column', gap: sp.F }}>

          {/* Refresh frequency */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Caching refresh frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}
              style={{ width: '100%', height: 38, border: `1px solid ${c['border-default']}`, borderRadius: 8, padding: `0 ${sp.C}px`, fontSize: 13, fontFamily: 'inherit', color: c['content-primary'], backgroundColor: '#fff', cursor: 'pointer' }}>
              {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Filters */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: c['content-primary'] }}>Filters</label>
              <button onClick={addFilter} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4A90E2', fontFamily: 'inherit', padding: 0 }}>+ Add filter</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {filters.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: sp.B, alignItems: 'center' }}>
                  <select value={f.col} onChange={e => updateFilter(i, 'col', e.target.value)}
                    style={{ flex: 2, height: 34, border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: `0 ${sp.B}px`, fontSize: 12, fontFamily: 'inherit', color: c['content-primary'], backgroundColor: '#fff' }}>
                    {colOptions.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <select value={f.op} onChange={e => updateFilter(i, 'op', e.target.value)}
                    style={{ flex: 1, height: 34, border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: `0 ${sp.B}px`, fontSize: 12, fontFamily: 'inherit', color: c['content-primary'], backgroundColor: '#fff' }}>
                    {['=', '!=', 'contains', 'starts with'].map(op => <option key={op}>{op}</option>)}
                  </select>
                  <input value={f.val} onChange={e => updateFilter(i, 'val', e.target.value)} placeholder="Value"
                    style={{ flex: 2, height: 34, border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: `0 ${sp.B}px`, fontSize: 12, fontFamily: 'inherit', color: c['content-primary'], outline: 'none' }} />
                  <button onClick={() => removeFilter(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 16, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Column scope */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: c['content-primary'], display: 'block', marginBottom: sp.B }}>Column scope</label>
            <div style={{ border: `1px solid ${c['border-default']}`, borderRadius: 8, overflow: 'hidden' }}>
              {(Object.entries(CACHE_COLUMNS) as [string, string[]][]).map(([table, cols], ti) => {
                const allSel = cols.every(col => selectedCols[col]);
                const someSel = cols.some(col => selectedCols[col]);
                return (
                  <div key={table} style={{ borderBottom: ti < 2 ? `1px solid ${c['border-divider']}` : 'none' }}>
                    {/* Table row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], cursor: 'pointer' }}
                      onClick={() => toggleTable(table)}>
                      <input type="checkbox" checked={allSel} ref={el => { if (el) el.indeterminate = someSel && !allSel; }}
                        onChange={() => toggleTable_allCols(table)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 14, height: 14, accentColor: '#4A90E2', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: c['content-primary'], flex: 1 }}>⊞ {table}</span>
                      <span style={{ fontSize: 11, color: c['content-secondary'] }}>{expandedTables[table] ? '▾' : '▶'}</span>
                    </div>
                    {/* Column rows */}
                    {expandedTables[table] && (
                      <div style={{ paddingLeft: sp.H }}>
                        {cols.map(col => (
                          <label key={col} style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.A}px ${sp.C}px`, cursor: 'pointer', fontSize: 12, color: c['content-primary'] }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <input type="checkbox" checked={!!selectedCols[col]} onChange={() => toggleCol(col)}
                              style={{ width: 13, height: 13, accentColor: '#4A90E2', cursor: 'pointer', flexShrink: 0 }} />
                            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{col}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: c['content-secondary'], margin: `${sp.B}px 0 0` }}>
              {Object.values(selectedCols).filter(Boolean).length} of {allColumns.length} columns included in cache
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
          <button onClick={onClose}
            style={{ padding: `${sp.B}px ${sp.F}px`, border: `1px solid ${c['border-default']}`, borderRadius: 20, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14, color: c['content-primary'], fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={onClose}
            style={{ padding: `${sp.B}px ${sp.F}px`, border: 'none', borderRadius: 20, backgroundColor: '#4A90E2', cursor: 'pointer', fontSize: 14, color: '#fff', fontFamily: 'inherit', fontWeight: 500 }}>
            Enable caching
          </button>
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

  const AVATAR_COLORS = ['#4A90E2', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'];

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
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#fff', borderRadius: 12, width: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: c['content-primary'] }}>Share</h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px ${sp.F}px` }}>

          {/* Input row */}
          <label style={{ fontSize: 13, fontWeight: 500, color: c['content-primary'], display: 'flex', alignItems: 'center', gap: sp.A, marginBottom: sp.B }}>
            Enter user name or group name
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: c['content-secondary'], cursor: 'default' }}>i</span>
          </label>
          <div style={{ display: 'flex', gap: sp.B, marginBottom: sp.C }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addUser()}
              placeholder="User name or group name"
              style={{ flex: 1, height: 38, border: `1px solid ${c['border-default']}`, borderRadius: 8, padding: `0 ${sp.C}px`, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: c['content-primary'] }}
            />
            <button
              onClick={addUser}
              style={{ width: 38, height: 38, border: `1px solid ${c['border-default']}`, borderRadius: 8, backgroundColor: '#fff', cursor: 'pointer', fontSize: 18, color: c['content-secondary'], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >+</button>
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
              <p style={{ fontSize: 13, fontWeight: 600, color: c['content-primary'], margin: `0 0 ${sp.C}px` }}>Shared with:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                {sharedUsers.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{user.initials}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: c['content-primary'] }}>{user.name}</span>

                    {/* Permission dropdown */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenPermission(openPermission === user.id ? null : user.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: sp.A, padding: `${sp.A}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: c['content-primary'], fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                      >
                        {user.permission} <span style={{ fontSize: 10 }}>▾</span>
                      </button>
                      {openPermission === user.id && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: '#fff', border: `1px solid ${c['border-default']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden', minWidth: 130 }}>
                          {(['Can view', 'Can edit', 'Can manage'] as const).map(perm => (
                            <div
                              key={perm}
                              onClick={() => setPermission(user.id, perm)}
                              style={{ padding: `${sp.B}px ${sp.C}px`, fontSize: 13, cursor: 'pointer', color: user.permission === perm ? '#4A90E2' : c['content-primary'], backgroundColor: user.permission === perm ? '#EEF4FF' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => { if (user.permission !== perm) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                              onMouseLeave={e => { if (user.permission !== perm) e.currentTarget.style.backgroundColor = '#fff'; }}
                            >
                              {perm}
                              {user.permission === perm && <span style={{ fontSize: 11 }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeUser(user.id)}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${c['border-default']}`, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: c['content-secondary'], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >×</button>
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
            <span style={{ fontSize: 12, color: c['content-secondary'], lineHeight: 1.5 }}>
              Anyone with access can use this link to view the data model
            </span>
            <button
              onClick={handleCopy}
              style={{ flexShrink: 0, marginLeft: sp.D, padding: `${sp.A}px ${sp.D}px`, border: `1px solid ${c['border-default']}`, borderRadius: 20, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: c['content-primary'], fontFamily: 'inherit' }}
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: submitted ? 'flex-start' : 'flex-end', gap: sp.B, minHeight: 56 }}>
          {submitted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, color: '#22C55E', fontSize: 14, fontWeight: 500 }}>
              <span style={{ fontSize: 18 }}>✓</span>
              Shared with {sharedUsers.length} {sharedUsers.length === 1 ? 'person' : 'people'}
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                style={{ padding: `${sp.B}px ${sp.F}px`, border: `1px solid ${c['border-default']}`, borderRadius: 20, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14, color: c['content-primary'], fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (sharedUsers.length > 0) {
                    setSubmitted(true);
                    onShared?.();
                    setTimeout(onClose, 1800);
                  } else {
                    onClose();
                  }
                }}
                style={{ padding: `${sp.B}px ${sp.F}px`, border: 'none', borderRadius: 20, backgroundColor: '#4A90E2', cursor: 'pointer', fontSize: 14, color: '#fff', fontFamily: 'inherit', fontWeight: 500 }}
              >
                Share
              </button>
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
  <label style={{ display: 'flex', alignItems: 'center', gap: sp.A, cursor: 'pointer', fontSize: 13, color: c['content-primary'], userSelect: 'none' }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      style={{ width: 15, height: 15, accentColor: '#4A90E2', cursor: 'pointer', flexShrink: 0 }}
    />
    {label}
    {children}
  </label>
);

// ── Header button ─────────────────────────────────────────────────────────────

const HeaderBtn: React.FC<{
  icon: string;
  label: string;
  onClick?: () => void;
  primary?: boolean;
  success?: boolean;
  chevron?: boolean;
}> = ({ icon, label, onClick, primary, success, chevron }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: sp.A,
      padding: `${sp.A}px ${sp.C}px`,
      border: primary ? 'none' : success ? `1px solid #22C55E` : `1px solid ${c['border-default']}`,
      borderRadius: 6, cursor: 'pointer', fontSize: 13,
      backgroundColor: primary ? '#4A90E2' : success ? '#F0FDF4' : 'transparent',
      color: primary ? '#fff' : success ? '#22C55E' : c['content-secondary'],
      fontFamily: 'inherit', fontWeight: 400,
      transition: 'background-color 0.15s',
    }}
    onMouseEnter={e => { if (!primary && !success) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
    onMouseLeave={e => { if (!primary && !success) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <span style={{ fontSize: 12 }}>{icon}</span>
    {label}
    {chevron && <span style={{ fontSize: 10 }}>▾</span>}
  </button>
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

const TestModePanel: React.FC<{ onExit: () => void; project: ProjectState }> = ({ project }) => {
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
          <div style={{ fontSize: 40, marginBottom: sp.D }}>🎯</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: c['content-primary'], margin: `0 0 ${sp.C}px` }}>No model ready yet</h2>
          <p style={{ fontSize: 14, color: c['content-secondary'], lineHeight: 1.6, margin: `0 0 ${sp.F}px` }}>
            Build your model first — add data, create joins, and add calculated columns. Then come back here to test it with real questions.
          </p>
          <button
            onClick={onExit}
            style={{ padding: `${sp.B}px ${sp.F}px`, border: `1px solid ${c['border-default']}`, borderRadius: 8, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14, color: c['content-primary'], fontFamily: 'inherit' }}
          >
            Back to build
          </button>
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
            <div style={{ fontSize: 32, marginBottom: sp.C }}>🎯</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: c['content-primary'], marginBottom: sp.C }}>Test your model</h2>
            <p style={{ fontSize: 14, color: c['content-secondary'], lineHeight: 1.6, marginBottom: sp.H }}>
              Ask questions the way your business users will. Verify that your model returns accurate answers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B, textAlign: 'left' }}>
              {[
                'Which campaign drove the most orders last month?',
                'What is the return on spend by campaign channel?',
                'Which region has the highest order volume?',
              ].map(q => (
                <button key={q} onClick={() => setTestInput(q)} style={{ padding: `${sp.C}px ${sp.D}px`, borderRadius: 8, border: `1px solid ${c['border-default']}`, backgroundColor: '#fff', color: c['content-primary'], fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {testMessages.map((msg, i) => (
          <div key={i} style={{ maxWidth: 720, margin: '0 auto', marginBottom: sp.F }}>
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: sp.D }}>
                <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: `${sp.C}px ${sp.D}px`, fontSize: 14, color: c['content-primary'], maxWidth: '75%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: sp.D, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.C }}>
                  <span style={{ fontSize: 16 }}>✨</span>
                  <span style={{ fontSize: 12, color: c['content-secondary'] }}>Work done in 15 seconds ▾</span>
                </div>
                <div style={{ fontSize: 14, color: c['content-primary'], lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  <FormattedMsg content={msg.content} />
                </div>
                {msg.chart && (
                  <div style={{ marginTop: sp.D, border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], display: 'flex', gap: sp.B }}>
                      {['top 1', 'region', 'sales', '↑ sort by sales'].map(chip => (
                        <span key={chip} style={{ fontSize: 11, backgroundColor: '#fff', border: `1px solid ${c['border-default']}`, borderRadius: 4, padding: '2px 6px', color: c['content-secondary'] }}>{chip}</span>
                      ))}
                    </div>
                    <div style={{ height: 120, backgroundColor: '#FFF8F0', display: 'flex', alignItems: 'flex-end', padding: `${sp.C}px ${sp.D}px ${sp.D}px` }}>
                      <div style={{ width: '100%', height: 80, backgroundColor: '#F97316', borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <div style={{ padding: `${sp.A}px ${sp.D}px`, fontSize: 11, color: c['content-secondary'] }}>West · 335.89M</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test input */}
      <div style={{ padding: `${sp.D}px ${sp.H}px ${sp.F}px`, flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', border: `1px solid ${c['border-default']}`, borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <input
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendTest()}
            placeholder="Ask me a question. Use '@' to search for columns or values"
            style={{ width: '100%', border: 'none', outline: 'none', padding: `${sp.C}px ${sp.D}px`, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', color: c['content-primary'] }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.A}px ${sp.D}px ${sp.B}px` }}>
            <div style={{ display: 'flex', gap: sp.B }}>
              <span style={{ fontSize: 16, cursor: 'pointer' }}>📊</span>
              <span style={{ fontSize: 14, cursor: 'pointer', color: c['content-secondary'] }}>🔍</span>
              <span style={{ fontSize: 11, backgroundColor: c['background-subtle'], padding: '2px 8px', borderRadius: 4, color: c['content-secondary'] }}>{project.name}</span>
            </div>
            <button onClick={sendTest} disabled={!testInput.trim()} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: testInput.trim() ? '#4A90E2' : c['background-subtle'], border: 'none', cursor: testInput.trim() ? 'pointer' : 'default', color: testInput.trim() ? '#fff' : c['content-secondary'], fontSize: 14 }}>↑</button>
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
