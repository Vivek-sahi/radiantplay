import React, { useState, useRef, useEffect } from 'react';
import { c, sp, ff, fs, fw, ts, HEADER_HEIGHT } from './styles';
import { Button } from '../../components/Button';
import { ProjectState, emptyContext } from './index';
import { AgentMessage } from './components/AgentPanel';
import AgentPanel from './components/AgentPanel';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';


// ── Seeded project state ──────────────────────────────────────────────────────

const seedProject = (): ProjectState => ({
  id: 'pg-001',
  name: 'Campaign Performance',
  buildStep: 'healthy',
  activeTab: 'columns',
  testMode: false,
  publishedVersion: 1,
  hasUnpublishedChanges: false,
  projectSource: 'warehouse',
  context: emptyContext,
  addedTables: ['orders', 'campaigns', 'users'],
  columnsSelected: true,
  includedColumns: {
    orders:    ['order_date', 'amount', 'region'],
    campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region'],
    users:     ['user_id', 'segment', 'lifetime_value', 'signup_date'],
  },
  columnOverrides: {},
});

// ── Types ─────────────────────────────────────────────────────────────────────

type DrawerTab = 'preview' | 'notebook' | 'lineage' | 'test';

const DRAWER_TABS: { id: DrawerTab; label: string }[] = [
  { id: 'preview',  label: 'Data Preview' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'lineage',  label: 'Lineage' },
  { id: 'test',     label: 'Test' },
];

const DRAWER_MIN = 140;
const DRAWER_MAX = 560;
const DRAWER_DEFAULT = 260;

// ── Test placeholder ──────────────────────────────────────────────────────────

const TestPane: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: `${sp.D}px ${sp.E}px`, gap: sp.C, overflow: 'auto' }}>
    <div style={{ display: 'flex', gap: sp.B }}>
      <input
        placeholder="Ask a question about this model…"
        style={{ flex: 1, height: 32, padding: `0 ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, fontSize: fs.sm, fontFamily: ff.primary, color: c['content-primary'], backgroundColor: c['background-base'], outline: 'none' }}
        readOnly
      />
      <button style={{ height: 32, padding: `0 ${sp.C}px`, border: 'none', borderRadius: 6, backgroundColor: c['content-brand'], color: 'white', fontSize: fs.sm, fontFamily: ff.primary, cursor: 'pointer' }}>
        Ask
      </button>
    </div>
    <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, padding: sp.D, display: 'flex', flexDirection: 'column', gap: sp.C }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>Total orders by region</div>
      <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
        North: 3,241 · South: 2,108 · East: 1,890 · West: 2,563
      </div>
      <div style={{ display: 'flex', gap: sp.B, paddingTop: sp.A, borderTop: `1px solid ${c['border-divider']}` }}>
        {[
          { label: 'Data quality', status: 'warning', note: 'campaign_id 18% null' },
          { label: 'Context',      status: 'ok',      note: 'All columns described' },
          { label: 'Structure',    status: 'ok',      note: 'Joins valid' },
        ].map(d => (
          <div key={d.label} style={{ flex: 1, padding: sp.B, borderRadius: 6, backgroundColor: d.status === 'warning' ? '#FFF8E5' : c['background-success'], fontSize: 11 }}>
            <div style={{ fontWeight: fw.medium, color: d.status === 'warning' ? '#92400E' : '#065F46', marginBottom: 2 }}>{d.label}</div>
            <div style={{ color: d.status === 'warning' ? '#78350F' : '#047857' }}>{d.note}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main playground ───────────────────────────────────────────────────────────

const Playground: React.FC = () => {
  const [project, setProject]     = useState<ProjectState>(seedProject);
  const [messages, setMessages]   = useState<AgentMessage[]>([]);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('preview');
  const [drawerOpen, setDrawerOpen]     = useState(true);
  const [drawerHeight, setDrawerHeight] = useState(DRAWER_DEFAULT);

  // Drag-to-resize drawer
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(DRAWER_DEFAULT);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartY.current - e.clientY;
      setDrawerHeight(Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, dragStartH.current + delta)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = drawerHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  // Map drawer tab → CenterPanel activeTab
  const drawerCenterTab: ProjectState['activeTab'] =
    drawerTab === 'preview'  ? 'preview'  :
    drawerTab === 'notebook' ? 'notebook' :
    drawerTab === 'lineage'  ? 'tables'   : 'columns';

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>

      {/* ── Main header ── */}
      <div style={{ height: HEADER_HEIGHT, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
        <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{project.name}</span>
        <span style={{ fontSize: 11, fontWeight: fw.regular, color: c['content-secondary'] }}>v{project.publishedVersion}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {/* Warehouse */}
          <button title="Warehouse" style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5">
              <rect x="3" y="5.25" width="12" height="11.25" rx="1.5"/>
              <path d="M5.25 5.25V3.75C5.25 2.92157 5.92157 2.25 6.75 2.25H11.25C12.0784 2.25 12.75 2.92157 12.75 3.75V5.25"/>
              <line x1="6" y1="9" x2="12" y2="9" strokeLinecap="round"/>
              <line x1="6" y1="12" x2="10.5" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
          {/* More */}
          <button title="More" style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="1.5" fill={c['content-secondary']}/>
              <circle cx="3.75" cy="9" r="1.5" fill={c['content-secondary']}/>
              <circle cx="14.25" cy="9" r="1.5" fill={c['content-secondary']}/>
            </svg>
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'] }} />
          {/* Test */}
          <button style={actionBtn}>
            <svg width="11" height="11" viewBox="0 0 18 18" fill="none"><path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" fill={c['content-secondary']}/></svg>
            Test
          </button>
          {/* Share */}
          <button style={iconBtn} title="Share">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="3.75" r="2.25"/><circle cx="4.5" cy="9" r="2.25"/><circle cx="13.5" cy="14.25" r="2.25"/>
              <line x1="6.44" y1="10.13" x2="11.56" y2="13.12"/><line x1="11.56" y1="4.88" x2="6.44" y2="7.87"/>
            </svg>
          </button>
          {/* Publish */}
          <button style={{ ...actionBtn, backgroundColor: '#2563EB', color: 'white', border: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/><line x1="3" y1="15.75" x2="15" y2="15.75"/>
            </svg>
            Publish
          </button>
        </div>
      </div>

      {/* ── Sub-header ── */}
      <div style={{ height: 40, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, flexShrink: 0 }}>
        <div style={{ width: 120, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setLeftOpen(o => !o)}
            style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${leftOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: leftOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: leftOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="5" y1="1" x2="5" y2="15"/></svg>
            Data
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setAgentOpen(o => !o)}
            style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${agentOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: agentOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: agentOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
            Data Agent
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Left panel */}
        {leftOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LeftPanel project={project} setProject={setProject} onSendToAgent={() => {}} />
          </div>
        )}

        {/* Center: columns (primary) + bottom drawer */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Columns view — always full remaining height */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CenterPanel
              project={{ ...project, activeTab: 'columns' }}
              setProject={setProject}
              onSendToAgent={() => {}}
              onInjectToAgent={() => {}}
            />
          </div>

          {/* Bottom drawer */}
          {drawerOpen && (
            <>
              {/* Drag handle */}
              <div
                onMouseDown={startDrag}
                style={{ height: 4, flexShrink: 0, cursor: 'ns-resize', backgroundColor: 'transparent', borderTop: `1px solid ${c['border-divider']}` }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              />

              <div style={{ height: drawerHeight, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'], borderTop: `1px solid ${c['border-divider']}` }}>
                {/* Drawer tab bar */}
                <div style={{ height: 36, display: 'flex', alignItems: 'center', paddingLeft: sp.D, gap: 2, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
                  {DRAWER_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id)}
                      style={{
                        height: 28, padding: `0 ${sp.C}px`, border: 'none', borderRadius: 6, cursor: 'pointer',
                        fontSize: fs.sm, fontFamily: ff.primary, fontWeight: drawerTab === tab.id ? fw.medium : fw.regular,
                        backgroundColor: drawerTab === tab.id ? c['background-subtle'] : 'transparent',
                        color: drawerTab === tab.id ? c['content-brand'] : c['content-secondary'],
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                  {/* Collapse button */}
                  <button
                    onClick={() => setDrawerOpen(false)}
                    title="Collapse"
                    style={{ marginLeft: 'auto', marginRight: sp.B, width: 24, height: 24, border: 'none', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-tertiary'] }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 4l4 4 4-4"/>
                    </svg>
                  </button>
                </div>

                {/* Drawer content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {drawerTab === 'test' ? (
                    <TestPane />
                  ) : (
                    <CenterPanel
                      project={{ ...project, activeTab: drawerCenterTab }}
                      setProject={setProject}
                      onSendToAgent={() => {}}
                      onInjectToAgent={() => {}}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Expand button when drawer is collapsed */}
          {!drawerOpen && (
            <div style={{ height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: sp.D, gap: 2, borderTop: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'] }}>
              {DRAWER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setDrawerTab(tab.id); setDrawerOpen(true); }}
                  style={{ height: 24, padding: `0 ${sp.B}px`, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: ff.primary, color: c['content-secondary'], backgroundColor: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ marginLeft: 'auto', marginRight: sp.B, width: 24, height: 24, border: 'none', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-tertiary'] }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 8l4-4 4 4"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Agent panel */}
        {agentOpen && (
          <AgentPanel
            project={project}
            setProject={setProject}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </div>
    </div>
  );
};

// ── Button style helpers ──────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 26, height: 26, padding: 4,
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  backgroundColor: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxSizing: 'border-box',
};

const actionBtn: React.CSSProperties = {
  height: 26, padding: '0 12px',
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  backgroundColor: c['background-base'], cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary,
  color: c['content-primary'], boxSizing: 'border-box',
};

export default Playground;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  ITERATION 2 — Console-style bottom pane                                   ║
// ║  Route: /data-studio-v2/playground-v2                                         ║
// ║  Key difference: bottom zone uses a dark terminal aesthetic so columns      ║
// ║  view (white, structured) and data view (dark, monospace) read as           ║
// ║  completely different visual modes — like VS Code editor vs terminal.       ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { ordersData, campaignsData, usersData, relationships } from './data/mockData';

// ── Terminal color palette ────────────────────────────────────────────────────

const K = {
  bg:      c['background-base-inverse'],    // #1D232F — ThoughtSpot dark navy
  bgAlt:   c['background-raised-inverse'],  // #323946 — raised surface
  bgHead:  c['background-raised-inverse'],  // #323946
  border:  c['border-divider-inverse'],     // #4A515E
  text:    c['content-primary-inverse'],    // #FFFFFF
  dim:     c['border-hover-inverse'],       // #777E8B
  mute:    c['border-default-inverse'],     // #4A515E
  blue:    c['content-brand-inverse'],      // #71A1F4
  green:   '#3FB950',
  orange:  '#E3B341',
  red:     '#FF7B72',
  purple:  '#D2A8FF',
} as const;

// ── Console types ─────────────────────────────────────────────────────────────

type ConsoleTab   = 'preview' | 'sql' | 'lineage' | 'test';
type ConsoleTable = 'model' | 'campaigns' | 'orders' | 'users';

const CTABS: { id: ConsoleTab; label: string }[] = [
  { id: 'preview',  label: 'Data' },
  { id: 'sql',      label: 'SQL' },
  { id: 'lineage',  label: 'Lineage' },
  { id: 'test',     label: 'Test' },
];

const CTABLES: { id: ConsoleTable; label: string; rows: number }[] = [
  { id: 'model',     label: 'Campaign Performance', rows: 150 },
  { id: 'campaigns', label: 'campaigns',             rows:  45 },
  { id: 'orders',    label: 'orders',                rows: 150 },
  { id: 'users',     label: 'users',                 rows:  92 },
];

// ── Column configs for each table ─────────────────────────────────────────────

type ColAlign = 'left' | 'right';
interface ColDef { key: string; label: string; align: ColAlign; width: number }

const MODEL_COLS: ColDef[] = [
  { key: 'order_id',       label: 'order_id',       align: 'left',  width: 90  },
  { key: 'order_date',     label: 'order_date',      align: 'left',  width: 100 },
  { key: 'amount',         label: 'amount',          align: 'right', width: 80  },
  { key: 'region',         label: 'region',          align: 'left',  width: 70  },
  { key: 'status',         label: 'status',          align: 'left',  width: 90  },
  { key: 'campaign_name',  label: 'campaign_name',   align: 'left',  width: 200 },
  { key: 'channel',        label: 'channel',         align: 'left',  width: 90  },
  { key: 'spend',          label: 'spend',           align: 'right', width: 80  },
  { key: 'segment',        label: 'segment',         align: 'left',  width: 90  },
  { key: 'lifetime_value', label: 'lifetime_value',  align: 'right', width: 110 },
];

const COLS: Record<Exclude<ConsoleTable, 'model'>, ColDef[]> = {
  orders: [
    { key: 'order_id',         label: 'order_id',         align: 'left',  width: 90  },
    { key: 'user_id',          label: 'user_id',          align: 'left',  width: 80  },
    { key: 'campaign_id',      label: 'campaign_id',      align: 'left',  width: 90  },
    { key: 'order_date',       label: 'order_date',       align: 'left',  width: 100 },
    { key: 'amount',           label: 'amount',           align: 'right', width: 80  },
    { key: 'product_category', label: 'product_category', align: 'left',  width: 130 },
    { key: 'status',           label: 'status',           align: 'left',  width: 90  },
    { key: 'region',           label: 'region',           align: 'left',  width: 70  },
  ],
  campaigns: [
    { key: 'campaign_id',   label: 'campaign_id',   align: 'left',  width: 90  },
    { key: 'campaign_name', label: 'campaign_name', align: 'left',  width: 220 },
    { key: 'channel',       label: 'channel',       align: 'left',  width: 90  },
    { key: 'budget',        label: 'budget',        align: 'right', width: 80  },
    { key: 'spend',         label: 'spend',         align: 'right', width: 80  },
    { key: 'start_date',    label: 'start_date',    align: 'left',  width: 100 },
    { key: 'end_date',      label: 'end_date',      align: 'left',  width: 100 },
    { key: 'status',        label: 'status',        align: 'left',  width: 90  },
  ],
  users: [
    { key: 'user_id',        label: 'user_id',        align: 'left',  width: 80  },
    { key: 'name',           label: 'name',           align: 'left',  width: 140 },
    { key: 'segment',        label: 'segment',        align: 'left',  width: 90  },
    { key: 'age',            label: 'age',            align: 'right', width: 55  },
    { key: 'lifetime_value', label: 'lifetime_value', align: 'right', width: 110 },
    { key: 'signup_date',    label: 'signup_date',    align: 'left',  width: 100 },
    { key: 'region',         label: 'region',         align: 'left',  width: 70  },
  ],
};

const campaignMap = Object.fromEntries(campaignsData.map(c => [c.campaign_id, c]));
const userMap     = Object.fromEntries(usersData.map(u => [u.user_id, u]));

const MODEL_ROWS: Record<string, unknown>[] = ordersData.slice(0, 40).map(row => ({
  order_id:       row.order_id,
  order_date:     row.order_date,
  amount:         row.amount,
  region:         row.region,
  status:         row.status,
  campaign_name:  campaignMap[row.campaign_id as string]?.campaign_name ?? null,
  channel:        campaignMap[row.campaign_id as string]?.channel ?? null,
  spend:          campaignMap[row.campaign_id as string]?.spend ?? null,
  segment:        userMap[row.user_id as string]?.segment ?? null,
  lifetime_value: userMap[row.user_id as string]?.lifetime_value ?? null,
}));

const RAW_DATA: Record<Exclude<ConsoleTable, 'model'>, Record<string, unknown>[]> = {
  orders:    ordersData as unknown as Record<string, unknown>[],
  campaigns: campaignsData as unknown as Record<string, unknown>[],
  users:     usersData as unknown as Record<string, unknown>[],
};

// ── Cell renderer ─────────────────────────────────────────────────────────────

function renderCell(val: unknown, col: ColDef): React.ReactNode {
  if (val === null || val === undefined) {
    return <span style={{ color: K.orange, fontStyle: 'italic' }}>null</span>;
  }
  if (col.align === 'right' && typeof val === 'number') {
    return val.toLocaleString('en-US', { minimumFractionDigits: val % 1 !== 0 ? 2 : 0 });
  }
  return String(val);
}

// ── Preview grid ──────────────────────────────────────────────────────────────

const DataGrid: React.FC<{ cols: ColDef[]; rows: Record<string, unknown>[]; footerNote: string }> = ({ cols, rows, footerNote }) => {
  const RH   = 28;
  const HEAD = 30;
  return (
    <div style={{ flex: 1, overflow: 'auto', fontSize: 12, fontFamily: ff.mono }}>
      <div style={{ display: 'flex', position: 'sticky', top: 0, height: HEAD, backgroundColor: K.bgHead, borderBottom: `1px solid ${K.border}`, zIndex: 1 }}>
        <div style={{ width: 36, flexShrink: 0, borderRight: `1px solid ${K.border}` }} />
        {cols.map(col => (
          <div key={col.key} style={{ width: col.width, flexShrink: 0, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', color: K.dim, letterSpacing: '0.04em', fontSize: 11, borderRight: `1px solid ${K.border}`, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {col.label}
          </div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', height: RH, backgroundColor: i % 2 === 0 ? K.bg : K.bgAlt, borderBottom: `1px solid ${K.mute}` }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2D333B')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? K.bg : K.bgAlt)}>
          <div style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, color: K.mute, borderRight: `1px solid ${K.border}`, fontSize: 11 }}>{i + 1}</div>
          {cols.map(col => (
            <div key={col.key} style={{ width: col.width, flexShrink: 0, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', color: K.text, whiteSpace: 'nowrap', overflow: 'hidden', borderRight: `1px solid ${K.mute}` }}>
              {renderCell(row[col.key], col)}
            </div>
          ))}
        </div>
      ))}
      <div style={{ padding: '10px 44px', color: K.dim, fontSize: 11 }}>{footerNote}</div>
    </div>
  );
};

const PreviewGrid: React.FC<{ table: ConsoleTable }> = ({ table }) => {
  if (table === 'model') {
    return <DataGrid cols={MODEL_COLS} rows={MODEL_ROWS} footerNote={`showing ${MODEL_ROWS.length} of 150 rows · orders × campaigns × users · last synced 14 min ago`} />;
  }
  const meta = CTABLES.find(t => t.id === table)!;
  return <DataGrid cols={COLS[table]} rows={RAW_DATA[table].slice(0, 12)} footerNote={`showing 12 of ${meta.rows} rows · Snowflake · last synced 14 min ago`} />;
};

// ── Notebook pane ─────────────────────────────────────────────────────────────

const NB_CELLS: { id: number; type: 'sql' | 'python'; comment: string; query: string }[] = [
  { id: 1, type: 'sql',    comment: '// Add Orders table into this project',          query: 'SELECT *\nFROM orders;' },
  { id: 2, type: 'sql',    comment: '// Add Campaigns table into this project',       query: 'SELECT *\nFROM campaigns;' },
  { id: 3, type: 'sql',    comment: '// Add Users table into this project',           query: 'SELECT *\nFROM users;' },
  { id: 4, type: 'sql',    comment: '// Join orders with campaigns on campaign_id',   query: 'SELECT o.*, c.campaign_name, c.channel, c.budget, c.spend\nFROM orders o\nLEFT JOIN campaigns c ON o.campaign_id = c.campaign_id;' },
  { id: 5, type: 'sql',    comment: '// Join orders with users on user_id',           query: 'SELECT o.*, u.name, u.segment, u.region AS user_region, u.lifetime_value\nFROM orders o\nINNER JOIN users u ON o.user_id = u.user_id;' },
  { id: 6, type: 'sql',    comment: '// Return on Spend metric',                      query: 'SELECT\n  SUM(o.amount) / NULLIF(c.spend, 0) AS return_on_spend\nFROM orders o\nLEFT JOIN campaigns c ON o.campaign_id = c.campaign_id;' },
  { id: 7, type: 'python', comment: '# Normalize date formats across all tables',    query: "import pandas as pd\n\norders['order_date'] = pd.to_datetime(orders['order_date'], format='%m/%d/%Y')\ncampaigns['start_date'] = pd.to_datetime(campaigns['start_date'])\nusers['signup_date'] = pd.to_datetime(users['signup_date'], format='%Y/%m/%d')" },
  { id: 8, type: 'sql',    comment: '// Remove duplicate orders',                     query: 'SELECT DISTINCT *\nFROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date DESC) AS rn\n  FROM orders\n)\nWHERE rn = 1;' },
];

const SQL_KW = /\b(SELECT|FROM|JOIN|LEFT|INNER|ON|WHERE|AS|DISTINCT|OVER|PARTITION|BY|ORDER|SUM|COUNT|NULLIF|AND|OR|NULL|LIMIT)\b/g;

const DarkColorizedLine: React.FC<{ line: string; lang: 'sql' | 'python' }> = ({ line, lang }) => {
  if (lang === 'sql') {
    const parts = line.split(SQL_KW);
    SQL_KW.lastIndex = 0;
    return (
      <span>
        {parts.map((part, i) =>
          SQL_KW.test(part)
            ? <span key={i} style={{ color: K.blue, fontWeight: fw.semibold }}>{part}</span>
            : part.startsWith("'") && part.endsWith("'")
              ? <span key={i} style={{ color: K.green }}>{part}</span>
              : <span key={i} style={{ color: K.text }}>{part}</span>
        )}
      </span>
    );
  }
  if (lang === 'python') {
    if (line.startsWith('#'))      return <span style={{ color: K.dim }}>{line}</span>;
    if (line.startsWith('import')) return <span style={{ color: K.purple }}>{line}</span>;
    return <span style={{ color: K.text }}>{line}</span>;
  }
  return <span style={{ color: K.text }}>{line}</span>;
};

const DarkNotebookCell: React.FC<{ id: number; type: 'sql' | 'python'; comment: string; query: string }> = ({ id, type, comment, query }) => (
  <div style={{ border: `1px solid ${K.border}`, borderRadius: 6, backgroundColor: K.bgHead, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderBottom: `1px solid ${K.border}`, backgroundColor: K.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, backgroundColor: type === 'sql' ? 'rgba(113,161,244,0.18)' : 'rgba(210,168,255,0.18)', color: type === 'sql' ? K.blue : K.purple, padding: '1px 6px', borderRadius: 3, fontWeight: fw.semibold, textTransform: 'uppercase', fontFamily: ff.mono }}>{type}</span>
        <span style={{ fontSize: 11, color: K.dim, fontFamily: ff.primary }}>Cell {id}</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {['▶', '···'].map(icon => (
          <button key={icon} style={{ height: 22, padding: '0 6px', border: `1px solid ${K.border}`, borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', color: K.dim, fontSize: 11, fontFamily: ff.mono }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = K.text; (e.currentTarget as HTMLButtonElement).style.borderColor = K.dim; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = K.dim; (e.currentTarget as HTMLButtonElement).style.borderColor = K.border; }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
    <div style={{ padding: '10px 12px', fontFamily: ff.mono, fontSize: 12, lineHeight: 1.65 }}>
      <div style={{ color: K.dim, marginBottom: 4 }}>{comment}</div>
      {query.split('\n').map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 14 }}>
          <span style={{ color: K.mute, minWidth: 18, textAlign: 'right', userSelect: 'none', fontSize: 11 }}>{i + 1}</span>
          <DarkColorizedLine line={line} lang={type} />
        </div>
      ))}
    </div>
  </div>
);

const NotebookPane: React.FC = () => (
  <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: K.bg }}>
    {NB_CELLS.map(cell => <DarkNotebookCell key={cell.id} {...cell} />)}
  </div>
);

// ── Lineage pane ──────────────────────────────────────────────────────────────

// ── Lineage diagram ───────────────────────────────────────────────────────────
// Layout: orders (left-center), campaigns (top-right), users (bottom-right)

const LIN_W = 180;
const LIN_H = 72;
const LIN_TABLES = [
  { id: 'orders',    label: 'orders',    cols: 8, accent: K.blue   },
  { id: 'campaigns', label: 'campaigns', cols: 8, accent: K.green  },
  { id: 'users',     label: 'users',     cols: 8, accent: K.purple },
];
const LIN_JOINS = [
  { from: 'orders', to: 'campaigns', fromKey: 'campaign_id', toKey: 'campaign_id', joinType: 'LEFT JOIN' },
  { from: 'orders', to: 'users',     fromKey: 'user_id',     toKey: 'user_id',     joinType: 'INNER JOIN' },
];

const LineagePane: React.FC = () => {
  const SVG_W = 620;
  const SVG_H = 280;
  const pos: Record<string, { x: number; y: number }> = {
    orders:    { x: 60,              y: SVG_H / 2 - LIN_H / 2 },
    campaigns: { x: SVG_W - LIN_W - 60, y: 40 },
    users:     { x: SVG_W - LIN_W - 60, y: SVG_H - LIN_H - 40 },
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: K.bg }}>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxWidth: '100%' }}>
        {/* Join lines */}
        {LIN_JOINS.map(j => {
          const rel = relationships.find(r => r.leftTable === j.from && r.rightTable === j.to);
          if (!rel) return null;
          const from = pos[j.from];
          const to   = pos[j.to];
          const fromX = from.x + LIN_W;
          const fromY = from.y + LIN_H / 2;
          const toX   = to.x;
          const toY   = to.y + LIN_H / 2;
          const midX  = Math.round((fromX + toX) / 2);
          const labelX = midX;
          const labelY = Math.round((fromY + toY) / 2);
          return (
            <g key={j.to}>
              <path d={`M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`} stroke={K.border} strokeWidth="1.5" fill="none" />
              {/* join type badge */}
              <rect x={labelX - 30} y={labelY - 9} width={60} height={18} rx={4} fill={K.bgHead} stroke={K.border} strokeWidth="1" />
              <text x={labelX} y={labelY + 4} textAnchor="middle" fontSize="9" fontFamily={ff.mono} fill={K.dim}>{j.joinType}</text>
              {/* key label at from end */}
              <text x={fromX + 6} y={fromY - 5} fontSize="9" fontFamily={ff.mono} fill={K.dim}>{j.fromKey}</text>
              {/* key label at to end */}
              <text x={toX - 6} y={toY - 5} fontSize="9" fontFamily={ff.mono} fill={K.dim} textAnchor="end">{j.toKey}</text>
            </g>
          );
        })}
        {/* Table cards */}
        {LIN_TABLES.map(t => {
          const p = pos[t.id];
          return (
            <g key={t.id}>
              <rect x={p.x} y={p.y} width={LIN_W} height={LIN_H} rx={6} fill={K.bgHead} stroke={K.border} strokeWidth="1.5" />
              {/* accent bar */}
              <rect x={p.x} y={p.y} width={3} height={LIN_H} rx={1.5} fill={t.accent} />
              <text x={p.x + 14} y={p.y + 18} fontSize="9" fontFamily={ff.primary} fill={K.dim} letterSpacing="0.04em">Table · Snowflake</text>
              <text x={p.x + 14} y={p.y + 36} fontSize="13" fontWeight="600" fontFamily={ff.primary} fill={K.text}>{t.label}</text>
              <text x={p.x + 14} y={p.y + 54} fontSize="10" fontFamily={ff.primary} fill={K.dim}>{t.cols} columns included</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Test pane (dark) ──────────────────────────────────────────────────────────

const DarkTestPane: React.FC = () => (
  <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        placeholder="Ask a question about this model…"
        readOnly
        style={{ flex: 1, height: 32, padding: '0 12px', backgroundColor: K.bgHead, border: `1px solid ${K.border}`, borderRadius: 6, color: K.text, fontFamily: ff.primary, fontSize: 13, outline: 'none' }}
      />
      <button style={{ height: 32, padding: '0 14px', backgroundColor: '#1F6FEB', border: 'none', borderRadius: 6, color: '#fff', fontFamily: ff.primary, fontSize: 13, cursor: 'pointer' }}>
        Ask
      </button>
    </div>
    <div style={{ backgroundColor: K.bgHead, border: `1px solid ${K.border}`, borderRadius: 6, padding: 14 }}>
      <div style={{ color: K.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Total orders by region</div>
      <div style={{ fontFamily: ff.mono, fontSize: 12, color: K.dim, marginBottom: 12 }}>
        North: <span style={{ color: K.text }}>3,241</span> · South: <span style={{ color: K.text }}>2,108</span> · East: <span style={{ color: K.text }}>1,890</span> · West: <span style={{ color: K.text }}>2,563</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Data quality', ok: false, note: 'campaign_id 18% null' },
          { label: 'Context',      ok: true,  note: 'All columns described' },
          { label: 'Structure',    ok: true,  note: 'Joins valid' },
        ].map(d => (
          <div key={d.label} style={{ flex: 1, padding: '8px 10px', borderRadius: 4, backgroundColor: K.bg, border: `1px solid ${d.ok ? '#238636' : '#9E6A03'}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: d.ok ? K.green : K.orange, marginBottom: 2 }}>{d.label}</div>
            <div style={{ fontSize: 11, color: K.dim }}>{d.note}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Console pane ──────────────────────────────────────────────────────────────

interface ConsolePaneProps {
  height: number;
  onDragStart: (e: React.MouseEvent) => void;
  onClose: () => void;
}

const ConsolePane: React.FC<ConsolePaneProps> = ({ height, onDragStart, onClose }) => {
  const [tab,   setTab]   = useState<ConsoleTab>('preview');
  const [table, setTable] = useState<ConsoleTable>('model');

  return (
    <div style={{ height, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: K.bg }}>
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{ height: 4, flexShrink: 0, cursor: 'ns-resize', borderTop: `1px solid ${K.border}` }}
        onMouseEnter={e => (e.currentTarget.style.borderTopColor = K.blue)}
        onMouseLeave={e => (e.currentTarget.style.borderTopColor = K.border)}
      />

      {/* Tab bar */}
      <div style={{ height: 36, flexShrink: 0, display: 'flex', alignItems: 'stretch', backgroundColor: K.bgHead, borderBottom: `1px solid ${K.border}` }}>

        {/* Console label */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRight: `1px solid ${K.border}`, gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <polyline points="3,5 7,9 3,13" stroke={K.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="9" y1="13" x2="14" y2="13" stroke={K.dim} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 11, color: K.mute, fontFamily: ff.primary, letterSpacing: '0.06em' }}>CONSOLE</span>
        </div>

        {/* Tabs — VS Code style: text + bottom border active indicator */}
        {CTABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              height: '100%', padding: '0 14px',
              border: 'none', borderBottom: tab === t.id ? `2px solid ${K.blue}` : '2px solid transparent',
              backgroundColor: 'transparent', cursor: 'pointer',
              fontSize: 12, fontFamily: ff.primary,
              color: tab === t.id ? K.text : K.dim,
              fontWeight: tab === t.id ? fw.medium : fw.regular,
            }}
          >
            {t.label}
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Table selector (only for preview) */}
        {tab === 'preview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 8, borderRight: `1px solid ${K.border}` }}>
            {CTABLES.map(tbl => (
              <button
                key={tbl.id}
                onClick={() => setTable(tbl.id)}
                style={{
                  height: 22, padding: '0 8px', border: `1px solid ${table === tbl.id ? K.blue : K.border}`,
                  borderRadius: 4, backgroundColor: table === tbl.id ? 'rgba(88,166,255,0.12)' : 'transparent',
                  cursor: 'pointer', fontSize: 11, fontFamily: ff.mono,
                  color: table === tbl.id ? K.blue : K.dim,
                }}
              >
                {tbl.label}
              </button>
            ))}
          </div>
        )}

        {/* Connection badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', borderRight: `1px solid ${K.border}` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: K.green }} />
          <span style={{ fontSize: 11, color: K.dim, fontFamily: ff.primary }}>Snowflake</span>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          title="Collapse"
          style={{ width: 36, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: K.mute }}
          onMouseEnter={e => (e.currentTarget.style.color = K.dim)}
          onMouseLeave={e => (e.currentTarget.style.color = K.mute)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'preview'  && <PreviewGrid table={table} />}
        {tab === 'sql'      && <NotebookPane />}
        {tab === 'lineage'  && <LineagePane />}
        {tab === 'test'     && <DarkTestPane />}
      </div>
    </div>
  );
};

// ── Collapsed console strip ───────────────────────────────────────────────────

const CollapsedConsole: React.FC<{ onExpand: (tab: ConsoleTab) => void }> = ({ onExpand }) => (
  <div style={{ height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', backgroundColor: K.bgHead, borderTop: `1px solid ${K.border}`, paddingLeft: 14, gap: 2 }}>
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <polyline points="3,5 7,9 3,13" stroke={K.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="13" x2="14" y2="13" stroke={K.dim} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
    {CTABS.map(t => (
      <button
        key={t.id}
        onClick={() => onExpand(t.id)}
        style={{ height: 22, padding: '0 10px', border: 'none', borderRadius: 3, backgroundColor: 'transparent', cursor: 'pointer', fontSize: 11, fontFamily: ff.primary, color: K.dim }}
        onMouseEnter={e => (e.currentTarget.style.color = K.text)}
        onMouseLeave={e => (e.currentTarget.style.color = K.dim)}
      >
        {t.label}
      </button>
    ))}
    <button
      onClick={() => onExpand('preview')}
      style={{ marginLeft: 'auto', marginRight: 8, width: 22, height: 22, border: 'none', borderRadius: 3, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: K.mute }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 8l4-4 4 4"/>
      </svg>
    </button>
  </div>
);

// ── Playground V2 ─────────────────────────────────────────────────────────────

export const PlaygroundV2: React.FC = () => {
  const [project, setProject]   = useState<ProjectState>(seedProject);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [leftOpen, setLeftOpen]     = useState(true);
  const [agentOpen, setAgentOpen]   = useState(true);
  const [consoleOpen, setConsoleOpen]       = useState(true);
  const [consoleHeight, setConsoleHeight]   = useState(DRAWER_DEFAULT);
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('preview');

  const dragging    = useRef(false);
  const dragStartY  = useRef(0);
  const dragStartH  = useRef(DRAWER_DEFAULT);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartY.current - e.clientY;
      setConsoleHeight(Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, dragStartH.current + delta)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current  = true;
    dragStartY.current = e.clientY;
    dragStartH.current = consoleHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>

      {/* Header */}
      <div style={{ height: HEADER_HEIGHT, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
        <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{project.name}</span>
        <span style={{ fontSize: 11, color: c['content-secondary'] }}>v{project.publishedVersion}</span>
        {/* Iteration badge */}
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(88,166,255,0.12)', color: K.blue, border: `1px solid rgba(88,166,255,0.3)`, fontWeight: fw.medium }}>
          iteration 2
        </span>
        <a href="/data-studio-v2/playground" style={{ fontSize: 11, color: c['content-secondary'], textDecoration: 'none', marginLeft: 4 }}>
          ← iteration 1
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button title="Warehouse" style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5">
              <rect x="3" y="5.25" width="12" height="11.25" rx="1.5"/>
              <path d="M5.25 5.25V3.75C5.25 2.92157 5.92157 2.25 6.75 2.25H11.25C12.0784 2.25 12.75 2.92157 12.75 3.75V5.25"/>
              <line x1="6" y1="9" x2="12" y2="9" strokeLinecap="round"/>
              <line x1="6" y1="12" x2="10.5" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'] }} />
          <button style={actionBtn}>
            <svg width="11" height="11" viewBox="0 0 18 18" fill="none"><path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" fill={c['content-secondary']}/></svg>
            Test
          </button>
          <button style={{ ...actionBtn, backgroundColor: '#2563EB', color: 'white', border: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/><line x1="3" y1="15.75" x2="15" y2="15.75"/>
            </svg>
            Publish
          </button>
        </div>
      </div>

      {/* Sub-header */}
      <div style={{ height: 40, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, flexShrink: 0 }}>
        <div style={{ width: 120, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setLeftOpen(o => !o)}
            style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${leftOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: leftOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: leftOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="5" y1="1" x2="5" y2="15"/></svg>
            Data
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setAgentOpen(o => !o)}
            style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${agentOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: agentOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: agentOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
            Data Agent
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Left panel */}
        {leftOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LeftPanel project={project} setProject={setProject} onSendToAgent={() => {}} />
          </div>
        )}

        {/* Center: semantic editor (top) + console (bottom) */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Columns view — primary, takes all remaining height */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CenterPanel
              project={{ ...project, activeTab: 'columns' }}
              setProject={setProject}
              onSendToAgent={() => {}}
              onInjectToAgent={() => {}}
            />
          </div>

          {/* Console pane — dark terminal */}
          {consoleOpen ? (
            <ConsolePane
              height={consoleHeight}
              onDragStart={startDrag}
              onClose={() => setConsoleOpen(false)}
            />
          ) : (
            <CollapsedConsole onExpand={(tab) => { setConsoleTab(tab); setConsoleOpen(true); }} />
          )}
          {/* consoleTab state used above when re-expanding */}
          {consoleTab && null}
        </div>

        {/* Agent panel */}
        {agentOpen && (
          <AgentPanel
            project={project}
            setProject={setProject}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </div>
    </div>
  );
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  ITERATIONS 3 + 4 — Icon-triggered secondary panels                        ║
// ║  Shared concept: "Columns" canvas header with 3 icon toggles               ║
// ║  (Data · Lineage · Code). Test folded into Agent.                          ║
// ║  V3 → /data-studio-v2/playground-v3  — panel opens BELOW columns (horizontal) ║
// ║  V4 → /data-studio-v2/playground-v4  — panel opens RIGHT of columns (vertical)║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Shared types & constants ──────────────────────────────────────────────────

type SecPane = 'data' | 'lineage' | 'code';

const SEC_PANE_DEFS: { id: SecPane; label: string; icon: React.ReactNode }[] = [
  {
    id: 'data', label: 'Data',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2"/>
        <line x1="1.5" y1="5.5"  x2="14.5" y2="5.5"/>
        <line x1="1.5" y1="9.5"  x2="14.5" y2="9.5"/>
        <line x1="5.5" y1="1.5"  x2="5.5"  y2="14.5"/>
      </svg>
    ),
  },
  {
    id: 'lineage', label: 'Lineage',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="3"  cy="8"  r="1.8"/>
        <circle cx="13" cy="3"  r="1.8"/>
        <circle cx="13" cy="13" r="1.8"/>
        <path d="M4.7 7.3 C8 7 10 4 11.2 3.8"/>
        <path d="M4.7 8.7 C8 9 10 12 11.2 12.2"/>
      </svg>
    ),
  },
  {
    id: 'code', label: 'Code',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5,3.5 1,8 5,12.5"/>
        <polyline points="11,3.5 15,8 11,12.5"/>
        <line x1="9.5" y1="2" x2="6.5" y2="14"/>
      </svg>
    ),
  },
];

// ── Canvas header: "Columns" title + 3 icon toggles ──────────────────────────

const CanvasHeader: React.FC<{
  activePane: SecPane | null;
  onToggle: (p: SecPane) => void;
  iterLabel: string;
}> = ({ activePane, onToggle, iterLabel }) => (
  <div style={{
    height: 40, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: `0 ${sp.D}px`,
    backgroundColor: c['background-base'],
    borderBottom: `1px solid ${c['border-divider']}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
      <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Columns</span>
      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, backgroundColor: c['background-subtle'], color: c['content-secondary'] }}>{iterLabel}</span>
    </div>
    <div style={{ display: 'flex', gap: 2 }}>
      {SEC_PANE_DEFS.map(p => {
        const active = activePane === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            title={p.label}
            style={{
              width: 28, height: 28,
              border: `1px solid ${active ? c['border-brand'] : 'transparent'}`,
              borderRadius: 6,
              backgroundColor: active ? c['background-information'] : 'transparent',
              color: active ? c['content-brand'] : c['content-tertiary'],
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = c['background-subtle']; (e.currentTarget as HTMLButtonElement).style.color = c['content-secondary']; }}}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = c['content-tertiary']; }}}
          >
            {p.icon}
          </button>
        );
      })}
    </div>
  </div>
);

// ── Secondary panel header (title + table-picker + ×) ────────────────────────

const SecPanelHeader: React.FC<{
  pane: SecPane;
  table: ConsoleTable;
  onTable: (t: ConsoleTable) => void;
  onClose: () => void;
  orientation: 'h' | 'v';
}> = ({ pane, table, onTable, onClose, orientation }) => {
  const def = SEC_PANE_DEFS.find(p => p.id === pane)!;
  return (
    <div style={{
      height: 36, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: sp.B,
      padding: `0 ${sp.C}px 0 ${sp.D}px`,
      backgroundColor: K.bgHead,
      borderBottom: `1px solid ${K.border}`,
      borderTop: orientation === 'h' ? `1px solid ${K.border}` : 'none',
      borderLeft: orientation === 'v' ? `1px solid ${K.border}` : 'none',
    }}>
      <span style={{ color: K.text, fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary }}>{def.label}</span>

      {pane === 'data' && (
        <div style={{ display: 'flex', gap: 3, marginLeft: sp.B }}>
          {CTABLES.map(tbl => (
            <button
              key={tbl.id}
              onClick={() => onTable(tbl.id)}
              style={{
                height: 20, padding: '0 7px',
                border: `1px solid ${table === tbl.id ? K.blue : K.border}`,
                borderRadius: 3,
                backgroundColor: table === tbl.id ? 'rgba(121,192,255,0.12)' : 'transparent',
                color: table === tbl.id ? K.blue : K.dim,
                cursor: 'pointer', fontSize: 11, fontFamily: ff.mono,
              }}
            >{tbl.label}</button>
          ))}
        </div>
      )}

      {pane === 'data' && (
        <span style={{ fontSize: 11, color: K.mute, fontFamily: ff.primary }}>
          {CTABLES.find(t => t.id === table)?.rows} rows
        </span>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={onClose}
        title="Close"
        style={{ width: 24, height: 24, border: 'none', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: K.mute }}
        onMouseEnter={e => (e.currentTarget.style.color = K.text)}
        onMouseLeave={e => (e.currentTarget.style.color = K.mute)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="2" y1="2" x2="10" y2="10"/>
          <line x1="10" y1="2" x2="2" y2="10"/>
        </svg>
      </button>
    </div>
  );
};

const SecPanelContent: React.FC<{ pane: SecPane; table: ConsoleTable }> = ({ pane, table }) => (
  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: K.bg }}>
    {pane === 'data'    && <PreviewGrid table={table} />}
    {pane === 'lineage' && <LineagePane />}
    {pane === 'code'    && <NotebookPane />}
  </div>
);

// ── Shared shell (header + sub-header) ────────────────────────────────────────

const PlaygroundShell: React.FC<{
  project: ProjectState;
  iterLabel: string;
  prevHref: string;
  leftOpen: boolean;
  agentOpen: boolean;
  onToggleLeft: () => void;
  onToggleAgent: () => void;
  children: React.ReactNode;
}> = ({ project, iterLabel, prevHref, leftOpen, agentOpen, onToggleLeft, onToggleAgent, children }) => (
  <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>
    <div style={{ height: HEADER_HEIGHT, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
      <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{project.name}</span>
      <span style={{ fontSize: 11, color: c['content-secondary'] }}>v{project.publishedVersion}</span>
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(88,166,255,0.12)', color: K.blue, border: `1px solid rgba(88,166,255,0.3)`, fontWeight: fw.medium }}>{iterLabel}</span>
      <a href={prevHref} style={{ fontSize: 11, color: c['content-secondary'], textDecoration: 'none' }}>← prev</a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        <button style={actionBtn}>
          <svg width="11" height="11" viewBox="0 0 18 18" fill="none"><path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" fill={c['content-secondary']}/></svg>
          Test
        </button>
        <button style={{ ...actionBtn, backgroundColor: '#2563EB', color: 'white', border: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/><line x1="3" y1="15.75" x2="15" y2="15.75"/>
          </svg>
          Publish
        </button>
      </div>
    </div>
    <div style={{ height: 40, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, flexShrink: 0 }}>
      <div style={{ width: 120, display: 'flex', alignItems: 'center' }}>
        <button onClick={onToggleLeft} style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${leftOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: leftOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: leftOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="5" y1="1" x2="5" y2="15"/></svg>
          Data
        </button>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onToggleAgent} style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${agentOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: agentOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: agentOpen ? c['content-brand'] : c['content-secondary'], boxSizing: 'border-box' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
          Data Agent
        </button>
      </div>
    </div>
    {children}
  </div>
);

// ── V3: horizontal panel (opens below columns) ────────────────────────────────

const H_PANE_MIN = 140;
const H_PANE_MAX = 520;
const H_PANE_DEFAULT = 280;

export const PlaygroundV3: React.FC = () => {
  const [project, setProject]   = useState<ProjectState>(seedProject);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [activePane, setActivePane] = useState<SecPane | null>(null);
  const [paneHeight, setPaneHeight] = useState(H_PANE_DEFAULT);
  const [paneTable, setPaneTable]   = useState<ConsoleTable>('model');

  const dragging   = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(H_PANE_DEFAULT);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartY.current - e.clientY;
      setPaneHeight(Math.min(H_PANE_MAX, Math.max(H_PANE_MIN, dragStartH.current + delta)));
    };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current = true; dragStartY.current = e.clientY; dragStartH.current = paneHeight;
    document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none'; e.preventDefault();
  };

  const togglePane = (p: SecPane) => setActivePane(prev => prev === p ? null : p);

  return (
    <PlaygroundShell project={project} iterLabel="iteration 3 · horizontal" prevHref="/data-studio-v2/playground-v2"
      leftOpen={leftOpen} agentOpen={agentOpen} onToggleLeft={() => setLeftOpen(o => !o)} onToggleAgent={() => setAgentOpen(o => !o)}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {leftOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LeftPanel project={project} setProject={setProject} onSendToAgent={() => {}} />
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CanvasHeader activePane={activePane} onToggle={togglePane} iterLabel="horizontal" />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CenterPanel project={{ ...project, activeTab: 'columns' }} setProject={setProject} onSendToAgent={() => {}} onInjectToAgent={() => {}} />
          </div>

          {activePane && (
            <>
              <div
                onMouseDown={startDrag}
                style={{ height: 5, flexShrink: 0, cursor: 'ns-resize', backgroundColor: K.bgHead, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = K.bgAlt)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = K.bgHead)}
              >
                <div style={{ width: 32, height: 2, borderRadius: 1, backgroundColor: K.mute }} />
              </div>
              <div style={{ height: paneHeight, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <SecPanelHeader pane={activePane} table={paneTable} onTable={setPaneTable} onClose={() => setActivePane(null)} orientation="h" />
                <SecPanelContent pane={activePane} table={paneTable} />
              </div>
            </>
          )}
        </div>

        {agentOpen && <AgentPanel project={project} setProject={setProject} messages={messages} setMessages={setMessages} />}
      </div>
    </PlaygroundShell>
  );
};

// ── V4: vertical panel (opens to the right of columns) ───────────────────────

const V_PANE_MIN = 220;
const V_PANE_MAX = 580;
const V_PANE_DEFAULT = 360;

export const PlaygroundV4: React.FC = () => {
  const [project, setProject]   = useState<ProjectState>(seedProject);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [activePane, setActivePane] = useState<SecPane | null>(null);
  const [paneWidth, setPaneWidth]   = useState(V_PANE_DEFAULT);
  const [paneTable, setPaneTable]   = useState<ConsoleTable>('model');

  const dragging   = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(V_PANE_DEFAULT);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartX.current - e.clientX;
      setPaneWidth(Math.min(V_PANE_MAX, Math.max(V_PANE_MIN, dragStartW.current + delta)));
    };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current = true; dragStartX.current = e.clientX; dragStartW.current = paneWidth;
    document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none'; e.preventDefault();
  };

  const togglePane = (p: SecPane) => setActivePane(prev => prev === p ? null : p);

  return (
    <PlaygroundShell project={project} iterLabel="iteration 4 · vertical" prevHref="/data-studio-v2/playground-v3"
      leftOpen={leftOpen} agentOpen={agentOpen} onToggleLeft={() => setLeftOpen(o => !o)} onToggleAgent={() => setAgentOpen(o => !o)}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {leftOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LeftPanel project={project} setProject={setProject} onSendToAgent={() => {}} />
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
          {/* Columns column */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <CanvasHeader activePane={activePane} onToggle={togglePane} iterLabel="vertical" />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CenterPanel project={{ ...project, activeTab: 'columns' }} setProject={setProject} onSendToAgent={() => {}} onInjectToAgent={() => {}} />
            </div>
          </div>

          {activePane && (
            <>
              {/* Drag handle — vertical strip */}
              <div
                onMouseDown={startDrag}
                style={{ width: 5, flexShrink: 0, cursor: 'ew-resize', backgroundColor: K.bgHead, borderLeft: `1px solid ${K.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = K.bgAlt)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = K.bgHead)}
              >
                <div style={{ width: 2, height: 32, borderRadius: 1, backgroundColor: K.mute }} />
              </div>
              {/* Panel */}
              <div style={{ width: paneWidth, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <SecPanelHeader pane={activePane} table={paneTable} onTable={setPaneTable} onClose={() => setActivePane(null)} orientation="v" />
                <SecPanelContent pane={activePane} table={paneTable} />
              </div>
            </>
          )}
        </div>

        {agentOpen && <AgentPanel project={project} setProject={setProject} messages={messages} setMessages={setMessages} />}
      </div>
    </PlaygroundShell>
  );
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  ITERATIONS 5 + 6 — Light vs Dark panel explorations                       ║
// ║  Both use V3's horizontal layout (icon-triggered, resizable, × close)      ║
// ║  V5 → /data-studio-v2/playground-v5  — all light design system colors         ║
// ║  V6 → /data-studio-v2/playground-v6  — dark, ThoughtSpot-reference matched    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ── Shared horizontal layout (V5 + V6) ───────────────────────────────────────

type SecPaneRenderer = (props: {
  pane: SecPane;
  table: ConsoleTable;
  onTable: (t: ConsoleTable) => void;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  height: number;
}) => React.ReactNode;

const HorizPlayground: React.FC<{
  iterLabel: string;
  prevHref: string;
  renderSecPane: SecPaneRenderer;
  handleColor: string;
}> = ({ iterLabel, prevHref, renderSecPane, handleColor }) => {
  const [project, setProject]   = useState<ProjectState>(seedProject);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [activePane, setActivePane] = useState<SecPane | null>(null);
  const [paneHeight, setPaneHeight] = useState(H_PANE_DEFAULT);
  const [paneTable, setPaneTable]   = useState<ConsoleTable>('model');

  const dragging   = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(H_PANE_DEFAULT);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartY.current - e.clientY;
      setPaneHeight(Math.min(H_PANE_MAX, Math.max(H_PANE_MIN, dragStartH.current + delta)));
    };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current = true; dragStartY.current = e.clientY; dragStartH.current = paneHeight;
    document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none'; e.preventDefault();
  };

  const togglePane = (p: SecPane) => setActivePane(prev => prev === p ? null : p);

  return (
    <PlaygroundShell project={project} iterLabel={iterLabel} prevHref={prevHref}
      leftOpen={leftOpen} agentOpen={agentOpen}
      onToggleLeft={() => setLeftOpen(o => !o)} onToggleAgent={() => setAgentOpen(o => !o)}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {leftOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LeftPanel project={project} setProject={setProject} onSendToAgent={() => {}} />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CanvasHeader activePane={activePane} onToggle={togglePane} iterLabel={iterLabel.split('·')[1]?.trim() ?? ''} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CenterPanel project={{ ...project, activeTab: 'columns' }} setProject={setProject} onSendToAgent={() => {}} onInjectToAgent={() => {}} />
          </div>
          {activePane && renderSecPane({
            pane: activePane, table: paneTable, onTable: setPaneTable,
            onClose: () => setActivePane(null), onDragStart: startDrag, height: paneHeight,
          })}
        </div>
        {agentOpen && <AgentPanel project={project} setProject={setProject} messages={messages} setMessages={setMessages} />}
      </div>
    </PlaygroundShell>
  );
};

// ── V5: light panel content ───────────────────────────────────────────────────

const LightDataGrid: React.FC<{ table: ConsoleTable }> = ({ table }) => {
  const cols = table === 'model' ? MODEL_COLS : COLS[table];
  const rows = table === 'model' ? MODEL_ROWS.slice(0, 12) : RAW_DATA[table].slice(0, 12);
  return (
    <div style={{ flex: 1, overflow: 'auto', fontSize: 12, fontFamily: ff.mono, backgroundColor: c['background-sunken'] }}>
      {/* Header */}
      <div style={{ display: 'flex', position: 'sticky', top: 0, height: 30, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}`, zIndex: 1 }}>
        <div style={{ width: 36, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}` }} />
        {cols.map(col => (
          <div key={col.key} style={{ width: col.width, flexShrink: 0, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', color: c['content-secondary'], fontSize: 11, letterSpacing: '0.04em', borderRight: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {col.label}
          </div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', height: 32, backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'], borderBottom: `1px solid ${c['border-divider']}` }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? c['background-base'] : c['background-sunken'])}>
          <div style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, color: c['content-tertiary'], borderRight: `1px solid ${c['border-divider']}`, fontSize: 11 }}>{i + 1}</div>
          {cols.map(col => {
            const val = row[col.key];
            const isNull = val === null || val === undefined;
            return (
              <div key={col.key} style={{ width: col.width, flexShrink: 0, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', whiteSpace: 'nowrap', overflow: 'hidden', borderRight: `1px solid ${c['border-divider']}`, color: isNull ? '#C2700A' : c['content-primary'] }}>
                {isNull ? <em>null</em> : typeof val === 'number' ? val.toLocaleString('en-US', { minimumFractionDigits: val % 1 !== 0 ? 2 : 0 }) : String(val)}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ padding: '10px 44px', color: c['content-tertiary'], fontSize: 11, fontFamily: ff.primary }}>
        12 of {CTABLES.find(t => t.id === table)?.rows} rows · Snowflake
      </div>
    </div>
  );
};

const LightLineagePan: React.FC = () => (
  <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', fontFamily: ff.primary, fontSize: 13, backgroundColor: c['background-sunken'] }}>
    {[
      { table: 'orders',    cols: ['order_id', 'user_id → users', 'campaign_id → campaigns', 'order_date', 'amount', 'product_category', 'status', 'region'], accent: c['content-brand'] },
      { table: 'campaigns', cols: ['campaign_id', 'campaign_name', 'channel', 'budget', 'spend', 'start_date', 'end_date', 'status'], accent: '#0E7A3E' },
      { table: 'users',     cols: ['user_id', 'name', 'email', 'signup_date', 'region', 'segment', 'age', 'lifetime_value'], accent: '#7C3AED' },
    ].map(({ table, cols, accent }) => (
      <div key={table} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: accent }} />
          <span style={{ fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>{table}</span>
          <span style={{ fontSize: 11, color: c['content-secondary'] }}>Snowflake</span>
        </div>
        <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {cols.map(col => {
            const isFK = col.includes(' → ');
            return (
              <div key={col} style={{ fontSize: 12, color: isFK ? c['content-brand'] : c['content-secondary'], fontFamily: ff.mono, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: isFK ? c['content-brand'] : c['border-default'], flexShrink: 0 }} />
                {col}
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

const LightCodePan: React.FC = () => (
  <div style={{ flex: 1, overflow: 'auto', backgroundColor: c['background-sunken'], padding: '16px 20px' }}>
    <div style={{ backgroundColor: c['background-subtle'], borderRadius: 8, padding: '14px 16px', fontFamily: ff.mono, fontSize: 13, lineHeight: 1.7 }}>
      {SQL_QUERY.split('\n').map((line, i) => {
        const html = line
          .replace(/\b(SELECT|FROM|LEFT JOIN|ON|WHERE|LIMIT|AND|OR|AS)\b/g, `<kw>$1</kw>`)
          .replace(/'([^']*)'/g, `<str>'$1'</str>`)
          .replace(/\b(\d+)\b/g, `<num>$1</num>`);
        return (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            <span style={{ color: c['content-tertiary'], minWidth: 24, textAlign: 'right', userSelect: 'none' }}>{i + 1}</span>
            <span style={{ color: c['content-primary'], whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: html
              .replace(/<kw>(.*?)<\/kw>/g, `<span style="color:${c['content-brand']};font-weight:600">$1</span>`)
              .replace(/<str>(.*?)<\/str>/g, `<span style="color:#0E7A3E">$1</span>`)
              .replace(/<num>(.*?)<\/num>/g, `<span style="color:#C2700A">$1</span>`) }} />
          </div>
        );
      })}
    </div>
  </div>
);

const LightDragHandle: React.FC<{ onDragStart: (e: React.MouseEvent) => void }> = ({ onDragStart }) => (
  <div onMouseDown={onDragStart}
    style={{ height: 5, flexShrink: 0, cursor: 'ns-resize', backgroundColor: c['background-subtle'], borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-inset'])}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}>
    <div style={{ width: 32, height: 2, borderRadius: 1, backgroundColor: c['border-default'] }} />
  </div>
);

const LightPaneHeader: React.FC<{ pane: SecPane; table: ConsoleTable; onTable: (t: ConsoleTable) => void; onClose: () => void }> = ({ pane, table, onTable, onClose }) => {
  const def = SEC_PANE_DEFS.find(p => p.id === pane)!;
  return (
    <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: sp.B, padding: `0 ${sp.C}px 0 ${sp.D}px`, backgroundColor: c['background-base'], borderTop: `2px solid ${c['border-brand']}`, borderBottom: `1px solid ${c['border-divider']}` }}>
      <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{def.label}</span>
      {pane === 'data' && (
        <div style={{ display: 'flex', gap: 3, marginLeft: sp.B }}>
          {CTABLES.map(tbl => (
            <button key={tbl.id} onClick={() => onTable(tbl.id)}
              style={{ height: 22, padding: '0 8px', border: `1px solid ${table === tbl.id ? c['border-brand'] : c['border-default']}`, borderRadius: 4, backgroundColor: table === tbl.id ? c['background-information'] : 'transparent', color: table === tbl.id ? c['content-brand'] : c['content-secondary'], cursor: 'pointer', fontSize: 11, fontFamily: ff.mono }}>
              {tbl.label}
            </button>
          ))}
        </div>
      )}
      {pane === 'data' && <span style={{ fontSize: 11, color: c['content-tertiary'] }}>{CTABLES.find(t => t.id === table)?.rows} rows</span>}
      <div style={{ flex: 1 }} />
      <button onClick={onClose} style={{ width: 24, height: 24, border: 'none', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-tertiary'] }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = c['background-subtle']; (e.currentTarget as HTMLButtonElement).style.color = c['content-primary']; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = c['content-tertiary']; }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
      </button>
    </div>
  );
};

// V5: fully light secondary pane renderer
const renderLightPane: SecPaneRenderer = ({ pane, table, onTable, onClose, onDragStart, height }) => (
  <>
    <LightDragHandle onDragStart={onDragStart} />
    <div style={{ height, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <LightPaneHeader pane={pane} table={table} onTable={onTable} onClose={onClose} />
      {pane === 'data'    && <LightDataGrid table={table} />}
      {pane === 'lineage' && <LightLineagePan />}
      {pane === 'code'    && <LightCodePan />}
    </div>
  </>
);

export const PlaygroundV5: React.FC = () => (
  <HorizPlayground iterLabel="iteration 5 · light" prevHref="/data-studio-v2/playground-v4"
    renderSecPane={renderLightPane} handleColor={c['background-subtle']} />
);

// ── V6: dark panel, ThoughtSpot-reference matched ─────────────────────────────

// Header matches the SpotterViz / Styling panel pattern from the reference screenshots:
// title (white, semibold) + right-side collapse/close — no terminal iconography
const DarkPaneHeader: React.FC<{ pane: SecPane; table: ConsoleTable; onTable: (t: ConsoleTable) => void; onClose: () => void }> = ({ pane, table, onTable, onClose }) => {
  const def = SEC_PANE_DEFS.find(p => p.id === pane)!;
  return (
    <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', gap: sp.B, padding: `0 ${sp.D}px`, backgroundColor: K.bgHead, borderBottom: `1px solid ${K.border}` }}>
      <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: K.text, fontFamily: ff.primary }}>{def.label}</span>
      {pane === 'data' && (
        <div style={{ display: 'flex', gap: 3, marginLeft: sp.B }}>
          {CTABLES.map(tbl => (
            <button key={tbl.id} onClick={() => onTable(tbl.id)}
              style={{ height: 22, padding: '0 8px', border: `1px solid ${table === tbl.id ? K.blue : K.border}`, borderRadius: 4, backgroundColor: table === tbl.id ? 'rgba(113,161,244,0.15)' : 'transparent', color: table === tbl.id ? K.blue : K.dim, cursor: 'pointer', fontSize: 11, fontFamily: ff.mono }}>
              {tbl.label}
            </button>
          ))}
        </div>
      )}
      {pane === 'data' && <span style={{ fontSize: 11, color: K.mute, fontFamily: ff.primary }}>{table === 'model' ? '150 rows · orders × campaigns × users' : `${CTABLES.find(t => t.id === table)?.rows} rows · Snowflake`}</span>}
      <div style={{ flex: 1 }} />
      {/* ">>" style close matching ThoughtSpot dark panel pattern */}
      <button onClick={onClose}
        style={{ height: 28, padding: '0 8px', border: `1px solid ${K.border}`, borderRadius: 6, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: K.dim, fontSize: 11, fontFamily: ff.primary }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = K.text; (e.currentTarget as HTMLButtonElement).style.borderColor = K.dim; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = K.dim; (e.currentTarget as HTMLButtonElement).style.borderColor = K.border; }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,2 7,6 3,10"/><polyline points="7,2 11,6 7,10"/></svg>
        Close
      </button>
    </div>
  );
};

const DarkDragHandle: React.FC<{ onDragStart: (e: React.MouseEvent) => void }> = ({ onDragStart }) => (
  <div onMouseDown={onDragStart}
    style={{ height: 4, flexShrink: 0, cursor: 'ns-resize', backgroundColor: K.bgHead, borderTop: `1px solid ${K.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    onMouseEnter={e => (e.currentTarget.style.borderTopColor = K.blue)}
    onMouseLeave={e => (e.currentTarget.style.borderTopColor = K.border)}>
    <div style={{ width: 32, height: 2, borderRadius: 1, backgroundColor: K.mute }} />
  </div>
);

// V6: dark secondary pane renderer (ThoughtSpot-reference matched)
const renderDarkPane: SecPaneRenderer = ({ pane, table, onTable, onClose, onDragStart, height }) => (
  <>
    <DarkDragHandle onDragStart={onDragStart} />
    <div style={{ height, flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: K.bg }}>
      <DarkPaneHeader pane={pane} table={table} onTable={onTable} onClose={onClose} />
      <SecPanelContent pane={pane} table={table} />
    </div>
  </>
);

export const PlaygroundV6: React.FC = () => {
  const [project, setProject]   = useState<ProjectState>(seedProject);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [agentOpen, setAgentOpen] = useState(true);
  const [activePane, setActivePane] = useState<SecPane | null>(null);
  const [paneHeight, setPaneHeight] = useState(H_PANE_DEFAULT);
  const [paneTable, setPaneTable]   = useState<ConsoleTable>('model');

  const dragging   = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(H_PANE_DEFAULT);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = dragStartY.current - e.clientY;
      setPaneHeight(Math.min(H_PANE_MAX, Math.max(H_PANE_MIN, dragStartH.current + delta)));
    };
    const onUp = () => { dragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current = true; dragStartY.current = e.clientY; dragStartH.current = paneHeight;
    document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none'; e.preventDefault();
  };

  const togglePane = (p: SecPane) => setActivePane(prev => prev === p ? null : p);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>

      {/* Main header — demo-style */}
      <div style={{ height: HEADER_HEIGHT, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
        <a href="/data-studio-v2/playground-v5" style={{ ...actionBtn, textDecoration: 'none' }}>←</a>
        <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{project.name}</span>
        <span style={{ fontSize: 11, color: c['content-secondary'] }}>v{project.publishedVersion}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button title="Warehouse connection" style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5">
              <rect x="3" y="5.25" width="12" height="11.25" rx="1.5"/>
              <path d="M5.25 5.25V3.75C5.25 2.92157 5.92157 2.25 6.75 2.25H11.25C12.0784 2.25 12.75 2.92157 12.75 3.75V5.25"/>
              <line x1="6" y1="9" x2="12" y2="9" strokeLinecap="round"/>
              <line x1="6" y1="12" x2="10.5" y2="12" strokeLinecap="round"/>
            </svg>
          </button>
          <button title="Settings" style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="1.5" fill={c['content-secondary']}/>
              <circle cx="3.75" cy="9" r="1.5" fill={c['content-secondary']}/>
              <circle cx="14.25" cy="9" r="1.5" fill={c['content-secondary']}/>
            </svg>
          </button>
          <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0 }} />
          <button style={actionBtn}>
            <svg width="11" height="11" viewBox="0 0 18 18" fill="none"><path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" fill={c['content-secondary']}/></svg>
            Test
          </button>
          <button title="Share" style={iconBtn}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="3.75" r="2.25"/><circle cx="4.5" cy="9" r="2.25"/><circle cx="13.5" cy="14.25" r="2.25"/>
              <line x1="6.44" y1="10.13" x2="11.56" y2="13.12"/><line x1="11.56" y1="4.88" x2="6.44" y2="7.87"/>
            </svg>
          </button>
          <button style={{ ...actionBtn, backgroundColor: '#2563EB', color: 'white', border: 'none' }}>
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/><line x1="3" y1="15.75" x2="15" y2="15.75"/>
            </svg>
            Publish
          </button>
        </div>
      </div>

      {/* Single consolidated sub-header — Data toggle left, panel icons + Data Agent right */}
      <div style={{ height: 40, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.B, flexShrink: 0 }}>
        <button onClick={() => setLeftOpen(o => !o)} style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${leftOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: leftOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: leftOpen ? c['content-brand'] : c['content-secondary'] }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="5" y1="1" x2="5" y2="15"/></svg>
          Data
        </button>
        <div style={{ flex: 1 }} />
        {SEC_PANE_DEFS.map(p => {
          const isActive = activePane === p.id;
          return (
            <button key={p.id} onClick={() => togglePane(p.id as SecPane)}
              style={{ height: 28, padding: '0 9px', gap: 5, border: `1px solid ${isActive ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: isActive ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: isActive ? c['content-brand'] : c['content-secondary'] }}>
              {p.icon}
              {p.id === 'code' ? 'Notebook' : p.label}
            </button>
          );
        })}
        <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0, margin: `0 ${sp.A}px` }} />
        <button onClick={() => setAgentOpen(o => !o)} style={{ height: 28, padding: '0 10px', gap: 6, border: `1px solid ${agentOpen ? c['border-brand'] : c['border-default']}`, borderRadius: 6, backgroundColor: agentOpen ? c['background-information'] : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary, color: agentOpen ? c['content-brand'] : c['content-secondary'] }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
          Data Agent
        </button>
      </div>

      {/* Body — straight into panels, no intermediate headers */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {leftOpen && (
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LeftPanel project={project} setProject={setProject} onSendToAgent={() => {}} />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CenterPanel project={{ ...project, activeTab: 'columns' }} setProject={setProject} onSendToAgent={() => {}} onInjectToAgent={() => {}} />
          </div>
          {activePane && renderDarkPane({
            pane: activePane, table: paneTable, onTable: setPaneTable,
            onClose: () => setActivePane(null), onDragStart: startDrag, height: paneHeight,
          })}
        </div>
        {agentOpen && <AgentPanel project={project} setProject={setProject} messages={messages} setMessages={setMessages} />}
      </div>
    </div>
  );
};

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  PLAYGROUND NAV — unified left-nav shell for all iterations                ║
// ║  Route: /data-studio-v2/playground                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// TestModeLayouts/ lives as untracked work in worktree #1; stubbed locally so this
// branch's build doesn't depend on it. Replace when the real layouts land in git.
const TmStub: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ padding: sp.G, color: c['content-secondary'], fontFamily: ff.primary, fontSize: fs.sm }}>
    {name} — playground stub. Real layout file is uncommitted in this worktree.
  </div>
);
const Iter1Layout: React.FC = () => <TmStub name="TM1 Always-On" />;
const Iter2Layout: React.FC = () => <TmStub name="TM2 Adaptive Shift" />;
const Iter3Layout: React.FC = () => <TmStub name="TM3 Horizontal Stack" />;
import { CacheDiscoverabilityCompare } from './CacheDiscoverability';
import { DataQualityDiscoverabilityCompare } from './DataQualityDiscoverability';
import { CombinedDiscoverabilityCompare } from './CombinedDiscoverability';
import { DbtExploration } from './components/explorations/Dbt';

type NavId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'tm1' | 'tm2' | 'tm3' | 'p2-dbt';

interface PGNavItem {
  id: NavId;
  label: string;
  meta?: string;
  tag?: string;
}

const PG_NAV: { section: string; items: PGNavItem[] }[] = [
  {
    section: 'Panel + inspection',
    items: [
      { id: 'v1',  label: 'Drawer bottom',   meta: 'light' },
      { id: 'v2',  label: 'Console bottom',  meta: 'dark terminal' },
      { id: 'v3',  label: 'Icon-triggered',  meta: 'horizontal' },
      { id: 'v4',  label: 'Icon-triggered',  meta: 'vertical' },
      { id: 'v5',  label: 'Pane · light' },
      { id: 'v6',  label: 'Pane · dark',     meta: 'TS reference' },
    ],
  },
  {
    section: 'Test mode layout',
    items: [
      { id: 'tm1', label: 'Always-On',        meta: 'Cortex Analyst', tag: '★' },
      { id: 'tm2', label: 'Adaptive Shift',   meta: 'dbt Canvas' },
      { id: 'tm3', label: 'Horizontal Stack', meta: 'dbt IDE' },
    ],
  },
  {
    section: 'Cache discoverability',
    items: [],
  },
  {
    section: 'Data quality discoverability',
    items: [],
  },
  {
    section: 'Combined model status',
    items: [],
  },
  {
    section: 'Phase 2 — explorations',
    items: [
      { id: 'p2-dbt', label: 'dbt workflow', meta: 'empty · import · issues · publish' },
    ],
  },
];

const CACHE_SECTION = 'Cache discoverability';
const QUALITY_SECTION = 'Data quality discoverability';
const COMBINED_SECTION = 'Combined model status';

const renderNavIteration = (id: NavId): React.ReactNode => {
  switch (id) {
    case 'v1':  return <Playground />;
    case 'v2':  return <PlaygroundV2 />;
    case 'v3':  return <PlaygroundV3 />;
    case 'v4':  return <PlaygroundV4 />;
    case 'v5':  return <PlaygroundV5 />;
    case 'v6':  return <PlaygroundV6 />;
    case 'tm1': return <Iter1Layout />;
    case 'tm2': return <Iter2Layout />;
    case 'tm3': return <Iter3Layout />;
    case 'p2-dbt': return <DbtExploration />;
  }
};

export const PlaygroundNav: React.FC = () => {
  const [active, setActive] = useState<NavId | null>(null);
  const [activeGroup, setActiveGroup] = useState(PG_NAV[0].section);

  const currentGroup = PG_NAV.find(g => g.section === activeGroup)!;

  if (active !== null) {
    return (
      <div style={{ position: 'fixed', inset: 0, fontFamily: ff.primary }}>
        {/* Content area — translateZ(0) scopes position:fixed children (v1–v6) */}
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', transform: 'translateZ(0)' }}>
          {renderNavIteration(active)}
        </div>
        {/* Floating back pill — sits above the iteration chrome */}
        <button
          onClick={() => setActive(null)}
          style={{
            position: 'absolute', top: 10, left: 10, zIndex: 9999,
            height: 26, padding: '0 10px',
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: 13,
            color: 'rgba(255,255,255,0.65)',
            fontSize: 11.5, fontFamily: ff.primary, fontWeight: fw.medium,
            cursor: 'pointer', backdropFilter: 'blur(4px)',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.6)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.4)'; }}
        >
          ← Playground
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: c['background-sunken'], fontFamily: ff.primary }}>

      {/* Header */}
      <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 32px', background: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        <span style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data Studio</span>
        <span style={{ margin: '0 8px', color: c['border-default'], fontSize: 14 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'] }}>Playground</span>
      </div>

      {/* Group tabs */}
      <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'flex-end', padding: '0 32px', background: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        {PG_NAV.map(group => {
          const isTab = group.section === activeGroup;
          return (
            <button
              key={group.section}
              onClick={() => setActiveGroup(group.section)}
              style={{
                height: 40, padding: '0 14px',
                border: 'none', borderBottom: isTab ? `2px solid ${c['content-brand']}` : '2px solid transparent',
                background: 'transparent', cursor: 'pointer', marginBottom: -1,
                fontSize: 13, fontFamily: ff.primary,
                fontWeight: isTab ? fw.semibold : fw.regular,
                color: isTab ? c['content-primary'] : c['content-secondary'],
              }}
            >
              {group.section}
            </button>
          );
        })}
      </div>

      {/* Body — comparison views for cache / quality / combined, card grid for others */}
      {activeGroup === CACHE_SECTION ? (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <CacheDiscoverabilityCompare />
        </div>
      ) : activeGroup === QUALITY_SECTION ? (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <DataQualityDiscoverabilityCompare />
        </div>
      ) : activeGroup === COMBINED_SECTION ? (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <CombinedDiscoverabilityCompare />
        </div>
      ) : (
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, maxWidth: 1080 }}>
          {currentGroup.items.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                background: c['background-base'],
                border: `1px solid ${c['border-divider']}`,
                borderRadius: 10, padding: '18px 20px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: 6,
                fontFamily: ff.primary,
                transition: 'border-color 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c['border-brand']; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c['border-divider']; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10.5, fontFamily: ff.mono, color: c['content-tertiary'], letterSpacing: '0.04em' }}>{item.id}</span>
                {item.tag && (
                  <span style={{ fontSize: 9, background: '#7C3AED', color: 'white', borderRadius: 3, padding: '1px 5px', fontWeight: fw.bold, letterSpacing: '0.02em' }}>
                    {item.tag}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1.3 }}>{item.label}</div>
              {item.meta && (
                <div style={{ fontSize: 11.5, color: c['content-secondary'], marginTop: 2 }}>{item.meta}</div>
              )}
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
