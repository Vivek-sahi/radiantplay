import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/Button';
import { SearchInput } from '@components/SearchInput';
import { Toggle } from '@components/Toggle';
import { Radio } from '@components/Radio';
import { Checkbox } from '@components/Checkbox';
import { Typography } from '@components/Typography';
import { Divider } from '@components/Divider';
import { SegmentedControl } from '@components/SegmentedControl';
import { Select } from '@components/Select';
import { Menu } from '@components/Menu';
import { Tooltip } from '@components/Tooltip';
import { AnchoredMenu } from './components/AnchoredMenu';
import { RdModal } from '@components/RdModal';
import { Table } from '@components/Table';
import './dme.css';
// @ts-expect-error -- init-dme.js is a plain JS module without a .d.ts declaration
import { initDME } from './init-dme.js';
import { AgentPanel } from '../_agentic/index';
import { TableCanvas, ColumnTree, joinKey } from '../_datamodel/index';
import type { TablePositionData, JoinInfo, ColumnTreeData } from '../_datamodel/index';
import { OverlayLoading } from '@components/OverlayLoading';
import { Icon } from '@components/icons';
import PreviewPanel from './components/PreviewPanel';
import PreviewPanel3 from './components/PreviewPanel3';
import { SearchDataExplorations } from './SearchDataExplorations';

// Formula/Filters/Parameters dock (ported exactly from DataStudioV2 MVP's left
// browser panel) — fixed to the bottom of the Tables pane, table list scrolls
// in the remaining space above.
const FORMULA_ICON = <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;

// 3.2 only: the SpotterModel header's collapse control — same panel-with-left-
// arrow glyph the sheet's column-panel toggle uses, replacing the default ✕
// (which reads as "dismiss", not "collapse", for a docked panel).
const COLLAPSE_LEFT_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.3333 1.14279H2.66663C1.82506 1.14279 1.14282 1.82502 1.14282 2.6666V13.3333C1.14282 14.1748 1.82506 14.8571 2.66663 14.8571H13.3333C14.1749 14.8571 14.8571 14.1748 14.8571 13.3333V2.6666C14.8571 1.82502 14.1749 1.14279 13.3333 1.14279Z" stroke="#1D232F" strokeWidth="1.5"/>
    <path d="M5.71436 1.14279V14.8571" stroke="#1D232F" strokeWidth="1.5"/>
    <path d="M11.0477 10.2858L8.76196 8.00013L11.0477 5.71442" stroke="#1D232F" strokeWidth="1.5"/>
  </svg>
);
const FILTER_ICON = <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11L8 8.5v3.5L6 11V8.5L1.5 3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>;

// count/children are optional so a row can be a plain entry (e.g. Settings)
// rather than a counted collection with an expandable body.
const DockRow: React.FC<{ icon: React.ReactNode; label: string; count?: number; open: boolean; onToggle: () => void; children?: React.ReactNode }> = ({ icon, label, count, open, onToggle, children }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '9px 14px', border: 'none', borderTop: '1px solid var(--rd-sys-color-border-divider)', background: open ? 'var(--rd-sys-color-background-subtle)' : 'var(--rd-sys-color-background-base)', cursor: 'pointer', textAlign: 'left' }}
    >
      {icon}
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--rd-sys-color-content-primary)', flex: 1 }}>{label}</span>
      {typeof count === 'number' && (
        <span style={{ fontSize: 11, color: 'var(--rd-sys-color-content-secondary)', fontWeight: 500 }}>{count}</span>
      )}
      <span style={{ display: 'flex', transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)', transform: open ? 'rotate(-90deg)' : 'none' }}>
        <Icon name="chevron-right" size="xs" color="var(--rd-sys-color-content-secondary)" />
      </span>
    </button>
    <div style={{ maxHeight: open ? 220 : 0, overflowY: open ? 'auto' : 'hidden', transition: 'max-height 220ms cubic-bezier(0.4,0,0.2,1)' }}>
      {children}
    </div>
  </div>
);

const DockEmpty: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '18px 20px 20px', textAlign: 'center' }}>
    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--rd-sys-color-background-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rd-sys-color-content-secondary)', flexShrink: 0 }}>{icon}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rd-sys-color-content-primary)' }}>{title}</div>
    <div style={{ fontSize: 11, color: 'var(--rd-sys-color-content-secondary)', lineHeight: 1.4, maxWidth: 200 }}>{subtitle}</div>
  </div>
);

// `center` is Option 3 "optimized"-only (see call sites) — centers the CTA
// instead of the default left-aligned-with-24px-indent look Option 3 "as
// is" keeps.
const DockAddLink: React.FC<{ label: string; center?: boolean }> = ({ label, center = false }) => (
  <button
    type="button"
    style={{
      display: 'flex', alignItems: 'center', justifyContent: center ? 'center' : 'flex-start',
      gap: 6, width: '100%', padding: center ? '7px 14px' : '7px 14px 7px 24px',
      border: 'none', background: 'transparent', cursor: 'pointer',
      textAlign: center ? 'center' : 'left', fontSize: 12, fontWeight: 500, color: 'var(--rd-sys-color-content-brand)',
    }}
  >
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    {label}
  </button>
);

// Option 1 adds a Query tab next to Parameters (content built later); Option 2
// is the unmodified original tab set — a review-only comparison, see
// .option-switcher in the header. Option 3 is Option 2 plus the Formula/
// Filters/Parameters dock moved into the Tables left pane (see DockRow
// above), so those tabs drop out of ITS tab set only — Options 1 and 2 keep
// the original full tab list untouched.
const TAB_OPTIONS_BASE = [
  { id: 'tables',     label: 'Tables' },
  { id: 'columns',    label: 'Columns' },
  { id: 'formulas',   label: 'Formulas' },
  { id: 'filters',    label: 'Filters' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'settings',   label: 'Settings' },
];
const TAB_OPTIONS_WITH_QUERY = [
  { id: 'tables',     label: 'Tables' },
  { id: 'columns',    label: 'Columns' },
  { id: 'formulas',   label: 'Formulas' },
  { id: 'filters',    label: 'Filters' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'query',      label: 'Query' },
  { id: 'settings',   label: 'Settings' },
];
const TAB_OPTIONS_OPTION3 = [
  { id: 'tables',     label: 'Tables' },
  { id: 'columns',    label: 'Columns' },
];
// Optimized only — same ids ('tables'/'columns', so the tab-switch wiring is
// untouched), renamed display labels for this branch's sub-header switcher.
const TAB_OPTIONS_OPTION3_OPTIMIZED = [
  { id: 'tables',  label: 'Builder' },
  { id: 'columns', label: 'Semantics' },
];

const JOIN_OPTIONS = [
  { id: 'inner', label: 'Inner join' },
  { id: 'left',  label: 'Left join' },
  { id: 'right', label: 'Right join' },
  { id: 'cross', label: 'Cross join' },
];

const ZOOM_OPTIONS = [
  { id: '50',  label: '50%' },
  { id: '75',  label: '75%' },
  { id: '100', label: '100%' },
  { id: '125', label: '125%' },
  { id: '150', label: '150%' },
];

const SORT_OPTIONS = [
  { id: 'name-asc',  label: 'Name (A→Z)' },
  { id: 'name-desc', label: 'Name (Z→A)' },
  { id: 'type',      label: 'Sort by type' },
];

type ColRow = { col: string; table: string; desc: string; aiCtx: string };
type FormulaRow = { name: string; type: string };

const COL_TABLE_COLUMNS = [
  { key: 'col',    label: 'Column name' },
  { key: 'table',  label: 'Source table name' },
  { key: 'srcCol', label: 'Source column name', render: (_: unknown, row: Record<string, unknown>) => (row as ColRow).col },
  { key: 'desc',   label: 'Description' },
  { key: 'aiCtx',  label: 'AI context' },
];

const SearchDataOnDataModelexplorations: React.FC = () => {
  const navigate = useNavigate();
  const [tablesUnselected, setTablesUnselected] = useState(false);
  const [columnsUnselected, setColumnsUnselected] = useState(false);
  const [activeTab, setActiveTab] = useState('tables');
  // Option 3 Optimized is the default landing state.
  const [tabOption, setTabOption] = useState<1 | 2 | 3>(3);
  const isOption3 = tabOption === 3;
  const tabOptions = tabOption === 1 ? TAB_OPTIONS_WITH_QUERY : isOption3 ? TAB_OPTIONS_OPTION3 : TAB_OPTIONS_BASE;
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxHtml, setCtxHtml] = useState('');
  const [columnRows, setColumnRows] = useState<ColRow[]>([]);
  const [colSearch, setColSearch] = useState('');
  const [selectedColKeys, setSelectedColKeys] = useState<string[]>([]);
  const [formulaRows, setFormulaRows] = useState<FormulaRow[]>([]);
  const [formulaSearch, setFormulaSearch] = useState('');
  // Filters saved to the model from the spreadsheet's "Add filter" flow
  // (checking "Add this filter to this model") — shown in the left-pane
  // Filters dock.
  const [modelFilters, setModelFilters] = useState<{ col: string; val: string }[]>([]);
  const [tableCanvasData, setTableCanvasData] = useState<{ tables: TablePositionData[]; joins: JoinInfo[] }>({ tables: [], joins: [] });
  const [columnTreeData, setColumnTreeData] = useState<ColumnTreeData>({ tables: [], dataSourceTables: [], modelColumns: [] });
  // Data-source selector Option 2 only (see dataSourceSelectorOption below):
  // same ColumnTree component/shape as Semantics uses today, but listing
  // every source table (not just ones already in the model), so Builder and
  // Semantics can show the identical unified list. Derived, not new data —
  // dataSourceTables already holds the full source schema.
  const unifiedTreeData: ColumnTreeData = {
    tables: columnTreeData.dataSourceTables.map(d => ({ name: d.name })),
    dataSourceTables: columnTreeData.dataSourceTables,
    modelColumns: columnTreeData.modelColumns,
  };
  // Which tables are actually on the canvas — drives ColumnTree's
  // addedTableNames prop so added tables look distinct in the unified list.
  const addedTableNames = new Set(tableCanvasData.tables.map(t => t.name));
  // Option 2's checkbox column list — bridges to the legacy manual-edit
  // functions in init-dme.js, which also refresh the canvas card counts.
  const handleToggleColumn = (tableName: string, colName: string, checked: boolean) => {
    (window as any)._toggleColumnManually?.(tableName, colName, checked);
  };
  const [modelLoading, setModelLoading] = useState<{ visible: boolean; label: string }>({ visible: false, label: '' });
  // Formula/Filters/Parameters dock in the Tables left pane — only one open at a time.
  const [browserDockOpen, setBrowserDockOpen] = useState<string | null>(null);
  // Optimized only: left pane collapse/resize (shared by both Tables and
  // Columns sections, since it's one physical panel — see #left-pane below).
  const [leftPaneCollapsed, setLeftPaneCollapsed] = useState(false);
  const [leftPaneWidth, setLeftPaneWidth] = useState(300);
  const [leftPaneResizing, setLeftPaneResizing] = useState(false);
  const LEFT_PANE_MIN_WIDTH = 220;
  const LEFT_PANE_MAX_WIDTH = 480;
  // Settings dock row (Option 3 optimized) — editable inline.
  const [joinRule, setJoinRule] = useState<'progressive' | 'all'>('progressive');
  const [disableRowLevelSecurity, setDisableRowLevelSecurity] = useState(false);
  const [turnOffRecommendations, setTurnOffRecommendations] = useState(false);
  // Zoom dropdown (sub-header, top right) — decorative, same as the Select it
  // replaces (no real canvas zoom is wired up either way).
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const zoomMenuBtnRef = useRef<HTMLButtonElement>(null);

  // Option 2's bottom preview/query panel on the Tables tab (see .option-switcher above).
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(280);
  // Option 3.2 only: the vertical preview panel's width (the bottom-dock
  // branches keep using previewHeight).
  const [previewWidth, setPreviewWidth] = useState(480);
  // Default 'preview' (Option 2). Option 3 defaults to 'query' instead —
  // see the effect below, scoped to tabOption === 3 only.
  const [panelTab, setPanelTab] = useState<'preview' | 'query'>('preview');
  // 'join' is Option 3 only — Option 2 never sets it (its TableCanvas isn't
  // wired with onSelectJoin), so this widening is safe for it.
  const [previewScope, setPreviewScope] = useState<'table' | 'join' | 'model'>('table');
  const [previewTable, setPreviewTable] = useState('');
  const [previewJoin, setPreviewJoin] = useState<JoinInfo | null>(null);
  // Option 3 only: switches PreviewPanel3 between embedding SearchDataExplorations
  // completely as-is vs. optimized for the docked panel (see .option-switcher below).
  // 'v32' is Option 3.2 (2026-09-21): Optimized inherited whole, with exactly two
  // differences — SpotterModel becomes the LEFT panel, and the preview opens as a
  // vertical panel on the RIGHT, overlaying the canvas instead of docking bottom.
  const [option3EmbedMode, setOption3EmbedMode] = useState<'asis' | 'optimized' | 'v32'>('optimized');
  // 3.2 inherits every Optimized behaviour (optimizedLike covers both); the few
  // places that stay Optimized-only, or are 3.2-only, check the exact mode.
  const optimizedLike = option3EmbedMode !== 'asis';
  const isV32 = option3EmbedMode === 'v32';
  // Option 3 "optimized" only: two competing designs for the left panel's
  // Tables/Columns data-source selector. Option 1 = existing pattern (the
  // current SegmentedControl in the sub-header, untouched). Option 2 = new
  // design (2026-09-10), built out only where dataSourceSelectorOption === 2
  // is checked. Unrelated to the outer tabOption 1-4 numbering above — this
  // is its own independent switcher, scoped entirely to Option 3 optimized.
  // Defaults to 2 (2026-09-10) — Option 2 is now the landing-state default.
  const [dataSourceSelectorOption, setDataSourceSelectorOption] = useState<1 | 2>(2);

  const [spotterModelEnabled] = useState<boolean>(() => (window as any).__DME_CONFIG__?.spotterModel ?? true);
  const [welcomeVariant] = useState<'blank' | 'existing'>(() => (window as any).__DME_CONFIG__?.welcomeVariant ?? 'blank');
  const [agentPanelCollapsed, setAgentPanelCollapsed] = useState(false);

  const modelName = welcomeVariant === 'blank' ? 'Add model name' : 'Retail Sales Analytics';
  const modelDesc = welcomeVariant === 'blank' ? 'Add description' : 'Sales performance model for Spotter AI search';

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const pill = document.querySelector<HTMLElement>(`.tab-pill[data-tab="${tabId}"]`);
    pill?.click();
  };

  // Option 3 "As is": Query is the default tab in the preview/query panel.
  // Option 3 Optimized defaults to Preview/Spreadsheet instead (and is first
  // in its own tab order — see PreviewPanel3Optimized). Option 2 keeps
  // defaulting to Preview/Spreadsheet via the initial panelTab state above.
  useEffect(() => {
    if (tabOption === 3) setPanelTab(option3EmbedMode === 'asis' ? 'query' : 'preview');
  }, [tabOption, option3EmbedMode]);

  // Optimized: expanding the preview panel auto-collapses the left
  // tables/columns panel and the SpotterModel panel, so the expanded preview
  // gets the full width. 3.2: its vertical panel overlays the canvas, so the
  // left pane stays put — but SpotterModel still auto-collapses when the
  // preview opens (Vivek, 2026-09-21), reopenable from the sub-header avatar.
  useEffect(() => {
    if (previewOpen && tabOption === 3 && optimizedLike) {
      if (option3EmbedMode === 'optimized') setLeftPaneCollapsed(true);
      setAgentPanelCollapsed(true);
    }
  }, [previewOpen, tabOption, option3EmbedMode, optimizedLike]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    (window as any)._openCtxModal  = (html: string) => { setCtxHtml(html); setCtxOpen(true); };
    (window as any)._closeCtxModal = () => setCtxOpen(false);
    (window as any)._setColumnRows = (rows: ColRow[]) => { setColumnRows(rows); setColSearch(''); setSelectedColKeys([]); };
    (window as any)._setFormulaRows = (rows: FormulaRow[]) => { setFormulaRows(rows); setFormulaSearch(''); };
    (window as any)._addModelFilter = (f: { col: string; val: string }) => setModelFilters(prev => [...prev.filter(x => x.col !== f.col), f]);
    (window as any)._setTableCanvasData = (data: { tables: TablePositionData[]; joins: JoinInfo[] }) => setTableCanvasData(data);
    (window as any)._setColumnTreeData  = (data: ColumnTreeData) => setColumnTreeData(data);
    (window as any)._setModelLoading    = (visible: boolean, label?: string) => setModelLoading({ visible, label: label ?? '' });

    const cleanup = initDME();
    return () => {
      document.body.style.overflow = prev;
      cleanup?.();
      delete (window as any)._openCtxModal;
      delete (window as any)._closeCtxModal;
      delete (window as any)._setColumnRows;
      delete (window as any)._setFormulaRows;
      delete (window as any)._addModelFilter;
      delete (window as any)._setTableCanvasData;
      delete (window as any)._setColumnTreeData;
      delete (window as any)._setModelLoading;
    };
  }, []);

  // Settings dock body — inline-editable join rule + security options.
  // Control labels are rendered as our own <span> (showLabel={false}) because the
  // DS Radio/Checkbox/Toggle label is white-space: nowrap, which truncates in
  // this narrow dock. Typography/Divider/spacing tokens otherwise come from the DS.
  const settingsRowLabel = (text: string, onToggle: () => void) => (
    <Typography variant="footnote" as="span" onClick={onToggle} style={{ cursor: 'pointer' }}>
      {text}
    </Typography>
  );
  const settingsSectionHeading = (text: string) => (
    <Typography variant="content-label-subhead" as="div">{text}</Typography>
  );

  // Review-only toggle between the Query-tab placement options — not part of
  // any option's own design; remove once one is picked. Shared between the
  // app-footer (Options 1/2 and Option 3 "As is") and the Optimized Settings
  // dock (see settingsDockPanel's Review options section below).
  const optionSwitcherControls = (
    <>
      <div className="option-switcher">
        {([1, 2, 3, 3.2] as const).map(opt => {
          // 3.2 sits at THIS level per Vivek (2026-09-21: "put 3.2 in review
          // options 1, 2, 3, 3.2"). Internally it stays tabOption 3 with the
          // 'v32' embed mode — Option 3 Optimized inherited whole, plus the
          // two 3.2 layout changes.
          const active = opt === 3.2 ? tabOption === 3 && isV32 : tabOption === opt && !(opt === 3 && isV32);
          return (
            <button
              key={opt}
              type="button"
              className={`option-switcher-btn${active ? ' active' : ''}`}
              style={opt === 3.2 ? { width: 'auto', padding: '0 10px' } : undefined}
              onClick={() => {
                setTabOption(opt === 3.2 ? 3 : opt);
                if (opt === 3.2) setOption3EmbedMode('v32');
                else if (isV32) setOption3EmbedMode('optimized');
                if (opt !== 1 && activeTab === 'query') handleTabChange('tables');
              }}
              title={opt === 1 ? 'Option 1 — Query next to Parameters' : opt === 2 ? 'Option 2 — original tabs, no Query' : opt === 3 ? 'Option 3 — Option 2 + table select/Data-Semantic under both Preview and Query' : 'Option 3.2 — Option 3 Optimized + SpotterModel on the left + preview as a vertical right panel over the canvas'}
            >{opt === 3.2 ? '3.2' : opt}</button>
          );
        })}
      </div>
      {/* Option 3 only — hidden on 3.2, which is Optimized by definition:
          as-is vs. optimized embedding of SearchDataExplorations in the
          bottom panel — not part of Option 3's own design; remove once one is picked. */}
      {tabOption === 3 && !isV32 && (
        <div className="option-switcher">
          {(['asis', 'optimized'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={`option-switcher-btn${option3EmbedMode === mode ? ' active' : ''}`}
              onClick={() => setOption3EmbedMode(mode)}
              style={{ width: 'auto', padding: '0 10px' }}
              title={mode === 'asis' ? 'As is — SearchDataExplorations embedded unmodified' : 'Optimized — stripped/edge-to-edge for this docked panel'}
            >{mode === 'asis' ? 'As is' : 'Optimized'}</button>
          ))}
        </div>
      )}
    </>
  );

  const settingsDockPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4) var(--spacing-4)' }}>

      {/* ── Join rule ─────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {settingsSectionHeading('Data model join rule')}
        <Typography variant="caption" color="gray" as="div">
          Join rules can be specified in the schema section of this data model
        </Typography>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          {([
            ['progressive', 'Apply joins progressively (recommended for most cases)'],
            ['all', 'Apply all joins'],
          ] as const).map(([value, text]) => (
            <div key={value} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
              <Radio
                name="dm-join-rule"
                value={value}
                checked={joinRule === value}
                onChange={() => setJoinRule(value)}
                showLabel={false}
              />
              {settingsRowLabel(text, () => setJoinRule(value))}
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Join options (moved from the sub-header dropdown) ─────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {settingsSectionHeading('Join options')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-2)' }}>
          {settingsRowLabel('Turn off recommendations', () => setTurnOffRecommendations(v => !v))}
          <Toggle checked={turnOffRecommendations} onChange={setTurnOffRecommendations} showLabel={false} />
        </div>
        {/* Actions, not settings — brand-coloured text buttons, matching the
            dock's own "Add formula"/"Add filter" links. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-1)' }}>
          <Button variant="tertiary" size="small">Clear All Recommendations</Button>
          <Button variant="tertiary" size="small">Accept All Recommendations</Button>
        </div>
      </section>

      <Divider />

      {/* ── Security ──────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {settingsSectionHeading('Security')}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
          <Checkbox
            checked={disableRowLevelSecurity}
            onChange={setDisableRowLevelSecurity}
            showLabel={false}
          />
          {settingsRowLabel('Disable row level security for data model', () => setDisableRowLevelSecurity(v => !v))}
        </div>
      </section>

      <Divider />

      {/* ── Review options (dev-only) ────────────────────────────────
          Tucked under Security rather than its own header-level icon, per
          Komal: keeps the review-only option switcher out of the way of the
          real Optimized design. */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {settingsSectionHeading('Review options')}
        {optionSwitcherControls}
        {/* Data-source selector (Tables/Columns, left panel) — Option 1 is
            the existing sub-header SegmentedControl; Option 2 is a new
            design being built now. Review-only, same pattern as the
            switchers above — not part of Option 3's own design. */}
        <div className="option-switcher">
          {([1, 2] as const).map(opt => (
            <button
              key={opt}
              type="button"
              className={`option-switcher-btn${dataSourceSelectorOption === opt ? ' active' : ''}`}
              onClick={() => setDataSourceSelectorOption(opt)}
              title={opt === 1 ? 'Option 1 — existing Tables/Columns selector' : 'Option 2 — new Tables/Columns selector'}
            >{opt}</button>
          ))}
        </div>
      </section>
    </div>
  );

  // AGENT PANEL — hidden entirely on the Query tab, which needs the width for
  // its own full search/sheet experience. The collapse toggle animates this
  // wrapper's width to 0 (kept mounted, like #left-pane's own collapse), so it
  // visually shrinks away in sync with the left pane and the Optimized preview
  // panel instead of vanishing instantly. Rendered on the RIGHT of the body
  // row in every mode but 3.2, which docks it on the LEFT of the content row —
  // below the model's sub-header, before the workbench — the wrapper class
  // flips .agent-panel's divider border and hides its legacy resize handle,
  // whose drag math assumes a right-side panel (see dme.css).
  const agentPanelEl = spotterModelEnabled && activeTab !== 'query' ? (
    <div
      className={isV32 ? 'agent-panel-left-wrap' : undefined}
      style={{
        width: agentPanelCollapsed ? 0 : undefined,
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width var(--duration-slow) var(--easing-standard)',
      }}
    >
      <AgentPanel
        welcomeVariant={welcomeVariant}
        onClose={() => setAgentPanelCollapsed(true)}
        closeIcon={isV32 ? COLLAPSE_LEFT_ICON : undefined}
      />
    </div>
  ) : null;

  return (
    <div className="sm-root">

      {/* APP HEADER — empty for Option 3 (title + tab switcher both moved
          elsewhere), so it's collapsed entirely rather than left as a blank
          bar; the tab-pill bridge to init-dme.js stays in the DOM either way,
          just hidden, so tab switching still works. Removing it hands its
          60px back to body-row (flex:1), which is the height increase. */}
      <div className="app-header" style={isOption3 ? { display: 'none' } : undefined}>
        {!isOption3 && (
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to playground"
            className="app-title"
            style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
          >
            Data model editor
          </button>
        )}
        {!isOption3 && (
          <SegmentedControl options={tabOptions} value={activeTab} onChange={handleTabChange} size="large" />
        )}
        <div className="tab-group" style={{ display: 'none' }}>
          <div className="tab-pill active" data-tab="tables">Tables</div>
          <div className="tab-pill" data-tab="columns">Columns</div>
          <div className="tab-pill" data-tab="formulas">Formulas</div>
          <div className="tab-pill" data-tab="filters">Filters</div>
          <div className="tab-pill" data-tab="parameters">Parameters</div>
          <div className="tab-pill" data-tab="query">Query</div>
          <div className="tab-pill" data-tab="settings">Settings</div>
        </div>
      </div>

      {/* BODY ROW */}
      <div className="body-row">

        <div className="left-and-main">

          {/* SUB-HEADER */}
          <div
            className={tabOption === 3 && optimizedLike ? 'sub-header sub-header-dense' : 'sub-header'}
            style={tabOption === 3 ? { position: 'relative' } : undefined}
          >
            <div
              className="sub-header-info"
              style={tabOption === 3 && optimizedLike ? { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-1)' } : undefined}
            >
              {/* 3.2 only: the panel lives on the left, so its collapsed
                  re-open control sits on the left too (the other modes keep
                  it with the right-hand actions below). */}
              {isV32 && spotterModelEnabled && agentPanelCollapsed && activeTab !== 'query' && (
                <button
                  type="button"
                  className="agent-panel-collapsed-toggle"
                  onClick={() => setAgentPanelCollapsed(false)}
                  aria-label="Open SpotterModel panel"
                  title="SpotterModel"
                >
                  <img src="/spotter-assets/SpotterModel avatar.svg" width="28" height="28" alt="" />
                </button>
              )}
              {tabOption === 3 && optimizedLike && (
                <button
                  type="button"
                  className="grid-icon-btn"
                  onClick={() => setLeftPaneCollapsed(c => !c)}
                  aria-label={leftPaneCollapsed ? 'Expand tables panel' : 'Collapse tables panel'}
                  title={leftPaneCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                  <Icon name="hamburger" size="s" color="var(--rd-sys-color-content-secondary)" />
                </button>
              )}
              <span className="model-name-placeholder">{modelName}</span>
              {tabOption === 3 && optimizedLike && (
                <Tooltip
                  placement="bottom"
                  content={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                      <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="" />
                      <span>Global sales connection</span>
                    </div>
                  }
                >
                  <span style={{ display: 'flex', cursor: 'pointer' }}>
                    <Icon name="info-circle" size="xs" color="var(--rd-sys-color-content-secondary)" />
                  </span>
                </Tooltip>
              )}
              {!(tabOption === 3 && optimizedLike) && (
                <span className="model-desc-placeholder">{modelDesc}</span>
              )}
            </div>
            {tabOption === 3 && (
              tabOption === 3 && optimizedLike ? (
                <SegmentedControl
                  options={TAB_OPTIONS_OPTION3_OPTIMIZED}
                  value={activeTab}
                  onChange={handleTabChange}
                  size="default"
                />
              ) : (
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <SegmentedControl
                    options={tabOptions}
                    value={activeTab}
                    onChange={handleTabChange}
                    size="large"
                  />
                </div>
              )
            )}
            {tabOption === 3 && optimizedLike ? (
              /* Mirrors sub-header-info's flex:1 so the tab switch above lands
                 at the true center of the header, regardless of the name's or
                 actions' own width. */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <div className="sub-header-actions" id="actions-tables"></div>
                {/* Rendered outside #actions-tables, which the legacy tab-switch
                    script hides on every tab but "tables" — this stays visible
                    across Tables and Columns. 3.2 renders it on the left of the
                    sub-header instead (see sub-header-info above). */}
                {!isV32 && spotterModelEnabled && agentPanelCollapsed && activeTab !== 'query' && (
                  <button
                    type="button"
                    className="agent-panel-collapsed-toggle"
                    onClick={() => setAgentPanelCollapsed(false)}
                    aria-label="Open SpotterModel panel"
                    title="SpotterModel"
                  >
                    <img src="/spotter-assets/SpotterModel avatar.svg" width="28" height="28" alt="" />
                  </button>
                )}
                <Button variant="secondary">Exit</Button>
                <Button variant="primary" onClick={() => (window as any)._showToast?.('Changes saved')}>Save changes</Button>
              </div>
            ) : (
              <>
                <div className="sub-header-actions" id="actions-tables">
                  <Button variant="secondary">Find</Button>
                  <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                    <Select placeholder="Join options" options={JOIN_OPTIONS} className="sub-header-select" />
                  </div>
                  <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                    <Select placeholder="100%" options={ZOOM_OPTIONS} className="sub-header-select" />
                  </div>
                </div>
                {spotterModelEnabled && agentPanelCollapsed && activeTab !== 'query' && (
                  <button
                    type="button"
                    className="agent-panel-collapsed-toggle"
                    onClick={() => setAgentPanelCollapsed(false)}
                    aria-label="Open SpotterModel panel"
                    title="SpotterModel"
                  >
                    <img src="/spotter-assets/SpotterModel avatar.svg" width="28" height="28" alt="" />
                  </button>
                )}
              </>
            )}
            <div className="sub-header-actions" id="actions-default" style={{ display: 'none' }}></div>
          </div>

          {/* Content row */}
          <div className="content-row">
            <OverlayLoading variant="dots" isVisible={modelLoading.visible} label={modelLoading.label} />

            {/* 3.2 only: SpotterModel docks on the left, BELOW the model's
                sub-header — the header is the global frame of the model, the
                agent works within it (2026-09-21 hierarchy call). */}
            {isV32 && agentPanelEl}

            {/* LEFT PANE — Optimized only: collapsible + resizable in width.
                Collapses to a slim icon rail (sibling, below) instead of
                unmounting, so #pane-tables-section/#pane-columns-section stay
                in the DOM for init-dme.js's legacy tab-switch script. */}
            <div
              className="left-pane"
              id="left-pane"
              style={tabOption === 3 && optimizedLike ? {
                width: leftPaneCollapsed ? 0 : leftPaneWidth,
                minWidth: leftPaneCollapsed ? 0 : leftPaneWidth,
                borderRightWidth: leftPaneCollapsed ? 0 : undefined,
                position: 'relative',
                transition: leftPaneResizing ? 'none' : undefined,
              } : undefined}
            >
              {tabOption === 3 && optimizedLike && !leftPaneCollapsed && (
                <div
                  className="left-pane-resize-handle"
                  onPointerDown={e => {
                    e.preventDefault();
                    setLeftPaneResizing(true);
                    const startX = e.clientX;
                    const startW = leftPaneWidth;
                    const onMove = (ev: PointerEvent) => setLeftPaneWidth(Math.max(LEFT_PANE_MIN_WIDTH, Math.min(LEFT_PANE_MAX_WIDTH, startW + (ev.clientX - startX))));
                    const onUp = () => {
                      setLeftPaneResizing(false);
                      window.removeEventListener('pointermove', onMove);
                      window.removeEventListener('pointerup', onUp);
                    };
                    window.addEventListener('pointermove', onMove);
                    window.addEventListener('pointerup', onUp);
                  }}
                />
              )}

              <div id="pane-tables-section" className="pane-section">
                <div className="left-pane-header">
                  {/* Optimized: moved into the info icon next to the model name, to save space. */}
                  {!(tabOption === 3 && optimizedLike) && (
                    <div className="connection-row">
                      <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="connection" />
                      <span className="connection-name">Global sales connection</span>
                    </div>
                  )}
                  <div className="pane-title-row">
                    <span className="pane-title">Tables</span>
                    {!(tabOption === 3 && optimizedLike) && (
                      <div className="grid-icon-btn">
                        <img src="/spotter-assets/Knowledge card button.svg" width="24" height="24" alt="layout" />
                      </div>
                    )}
                  </div>
                  {isOption3 ? (
                    <div className="pane-search-input" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <SearchInput placeholder="Search tables" />
                      </div>
                      <Button variant="secondary" icon="filter" iconOnly title="Filter tables">Filter tables</Button>
                      <Button variant="secondary" icon="sort" iconOnly title="Sort tables">Sort tables</Button>
                    </div>
                  ) : (
                    <>
                      <SearchInput placeholder="Search tables" className="pane-search-input" />
                      <div className="filter-row">
                        <Button variant="secondary">Add filters</Button>
                        <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                          <Select placeholder="Sort by name" options={SORT_OPTIONS} className="sort-select" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {tabOption === 3 && optimizedLike && dataSourceSelectorOption === 2 ? (
                  <ColumnTree data={unifiedTreeData} addedTableNames={addedTableNames} draggableTables checkboxColumns onToggleColumn={handleToggleColumn} />
                ) : (
                  <div className="table-list">
                    {['fact_customer','fact_new_retail_sales','fact_sales','dim_store','dim_product','fact_region','fact_inventory','dim_shipping_method','dim_feedback','dim_date','fact_sales_pipeline','fact_customer_satisfaction'].map(t => (
                      <div key={t} className="table-item">
                        <div className="table-chip">
                          <div className="drag-handle"><img src="/spotter-assets/3 dot vertical.svg" alt="" /></div>
                          {t}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isOption3 ? (
                  <div style={{ flexShrink: 0 }}>
                    <DockRow icon={<span style={{ color: '#047857', display: 'flex' }}>{FORMULA_ICON}</span>} label="Formula" count={0} open={browserDockOpen === 'formula'} onToggle={() => setBrowserDockOpen(o => o === 'formula' ? null : 'formula')}>
                      <DockEmpty icon={<span style={{ color: '#047857', display: 'flex' }}>{FORMULA_ICON}</span>} title="No formulas yet" subtitle="Add a calculated field from a column's ▾ menu — it'll show up here." />
                      <DockAddLink label="Add formula" center={tabOption === 3 && optimizedLike} />
                    </DockRow>
                    <DockRow icon={<span style={{ color: '#92640A', display: 'flex' }}>{FILTER_ICON}</span>} label="Filters" count={modelFilters.length} open={browserDockOpen === 'filters'} onToggle={() => setBrowserDockOpen(o => o === 'filters' ? null : 'filters')}>
                      {modelFilters.length === 0 ? (
                        <DockEmpty icon={<span style={{ color: '#92640A', display: 'flex' }}>{FILTER_ICON}</span>} title="No filters yet" subtitle='Filter a column, then check "Add this filter to this model" to see it here.' />
                      ) : (
                        modelFilters.map(f => (
                          <div key={f.col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '7px 14px', fontSize: 12, color: 'var(--rd-sys-color-content-primary)' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.col} = {f.val}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${f.col} filter`}
                              onClick={() => setModelFilters(prev => prev.filter(x => x.col !== f.col))}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexShrink: 0, color: 'var(--rd-sys-color-content-secondary)' }}
                            >
                              <Icon name="cross" size="xs" />
                            </button>
                          </div>
                        ))
                      )}
                      <DockAddLink label="Add filter" center={tabOption === 3 && optimizedLike} />
                    </DockRow>
                    <DockRow icon={<span style={{ color: '#6B4FBF', display: 'flex', fontWeight: 700, fontSize: 12, width: 13, justifyContent: 'center' }}>@</span>} label="Parameters" count={0} open={browserDockOpen === 'parameters'} onToggle={() => setBrowserDockOpen(o => o === 'parameters' ? null : 'parameters')}>
                      <DockEmpty icon={<span style={{ color: '#6B4FBF', display: 'flex', fontWeight: 700, fontSize: 13 }}>@</span>} title="No parameters yet" subtitle="Add a named value to reuse across formulas and filters." />
                      <DockAddLink label="Add parameter" center={tabOption === 3 && optimizedLike} />
                    </DockRow>
                    {tabOption === 3 && optimizedLike && (
                      <DockRow
                        icon={<span style={{ display: 'flex' }}><Icon name="settings" size="xs" color="var(--rd-sys-color-content-secondary)" /></span>}
                        label="Settings"
                        open={browserDockOpen === 'settings'}
                        onToggle={() => setBrowserDockOpen(o => o === 'settings' ? null : 'settings')}
                      >
                        {settingsDockPanel}
                      </DockRow>
                    )}
                  </div>
                ) : (
                  <div className="left-pane-footer">
                    <Toggle checked={tablesUnselected} onChange={setTablesUnselected} label="Show unselected" labelPosition="right" />
                  </div>
                )}
              </div>

              <div id="pane-columns-section" className="pane-section" style={{ display: 'none' }}>
                <div className="left-pane-header">
                  {/* Optimized: moved into the info icon next to the model name, to save space. */}
                  {!(tabOption === 3 && optimizedLike) && (
                    <div className="connection-row">
                      <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="connection" />
                      <span className="connection-name">Global sales connection</span>
                    </div>
                  )}
                  <div className="pane-title-row">
                    <span className="pane-title">Columns</span>
                    {!(tabOption === 3 && optimizedLike) && (
                      <div className="grid-icon-btn">
                        <img src="/spotter-assets/Knowledge card button.svg" width="24" height="24" alt="layout" />
                      </div>
                    )}
                  </div>
                  <SearchInput placeholder="Search columns" className="pane-search-input" />
                  <div className="filter-row">
                    <Button variant="secondary">Add filters</Button>
                    <div style={{ display: 'contents' }} onClickCapture={e => { e.preventDefault(); e.stopPropagation(); }}>
                      <Select placeholder="Sort by name" options={SORT_OPTIONS} className="sort-select" />
                    </div>
                  </div>
                </div>
                <ColumnTree
                  data={tabOption === 3 && optimizedLike && dataSourceSelectorOption === 2 ? unifiedTreeData : columnTreeData}
                  {...(tabOption === 3 && optimizedLike && dataSourceSelectorOption === 2 ? { addedTableNames, draggableTables: true, checkboxColumns: true, onToggleColumn: handleToggleColumn } : {})}
                />
                {isOption3 ? (
                  <div style={{ flexShrink: 0 }}>
                    <DockRow icon={<span style={{ color: '#047857', display: 'flex' }}>{FORMULA_ICON}</span>} label="Formula" count={0} open={browserDockOpen === 'formula'} onToggle={() => setBrowserDockOpen(o => o === 'formula' ? null : 'formula')}>
                      <DockEmpty icon={<span style={{ color: '#047857', display: 'flex' }}>{FORMULA_ICON}</span>} title="No formulas yet" subtitle="Add a calculated field from a column's ▾ menu — it'll show up here." />
                      <DockAddLink label="Add formula" center={tabOption === 3 && optimizedLike} />
                    </DockRow>
                    <DockRow icon={<span style={{ color: '#92640A', display: 'flex' }}>{FILTER_ICON}</span>} label="Filters" count={modelFilters.length} open={browserDockOpen === 'filters'} onToggle={() => setBrowserDockOpen(o => o === 'filters' ? null : 'filters')}>
                      {modelFilters.length === 0 ? (
                        <DockEmpty icon={<span style={{ color: '#92640A', display: 'flex' }}>{FILTER_ICON}</span>} title="No filters yet" subtitle='Filter a column, then check "Add this filter to this model" to see it here.' />
                      ) : (
                        modelFilters.map(f => (
                          <div key={f.col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '7px 14px', fontSize: 12, color: 'var(--rd-sys-color-content-primary)' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.col} = {f.val}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${f.col} filter`}
                              onClick={() => setModelFilters(prev => prev.filter(x => x.col !== f.col))}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexShrink: 0, color: 'var(--rd-sys-color-content-secondary)' }}
                            >
                              <Icon name="cross" size="xs" />
                            </button>
                          </div>
                        ))
                      )}
                      <DockAddLink label="Add filter" center={tabOption === 3 && optimizedLike} />
                    </DockRow>
                    <DockRow icon={<span style={{ color: '#6B4FBF', display: 'flex', fontWeight: 700, fontSize: 12, width: 13, justifyContent: 'center' }}>@</span>} label="Parameters" count={0} open={browserDockOpen === 'parameters'} onToggle={() => setBrowserDockOpen(o => o === 'parameters' ? null : 'parameters')}>
                      <DockEmpty icon={<span style={{ color: '#6B4FBF', display: 'flex', fontWeight: 700, fontSize: 13 }}>@</span>} title="No parameters yet" subtitle="Add a named value to reuse across formulas and filters." />
                      <DockAddLink label="Add parameter" center={tabOption === 3 && optimizedLike} />
                    </DockRow>
                    {tabOption === 3 && optimizedLike && (
                      <DockRow
                        icon={<span style={{ display: 'flex' }}><Icon name="settings" size="xs" color="var(--rd-sys-color-content-secondary)" /></span>}
                        label="Settings"
                        open={browserDockOpen === 'settings'}
                        onToggle={() => setBrowserDockOpen(o => o === 'settings' ? null : 'settings')}
                      >
                        {settingsDockPanel}
                      </DockRow>
                    )}
                  </div>
                ) : (
                  <div className="left-pane-footer">
                    <Toggle checked={columnsUnselected} onChange={setColumnsUnselected} label="Show unselected" labelPosition="right" />
                  </div>
                )}
              </div>

            </div>{/* /left-pane */}

            {/* MAIN CONTENT */}
            <div className="main-content">

              {/* Tables tab */}
              <div className="tab-content" id="content-tables">
                {tableCanvasData.tables.length === 0 ? (
                  <div className="empty-state" id="tables-empty-state">
                    <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon" />
                    <div className="empty-body">
                      <div className="empty-title">Start with the right tables</div>
                      <div className="empty-desc">Let SpotterModel suggest the best tables and joins for an AI-ready data model</div>
                    </div>
                    <div className="suggestion-row">
                      <a className="suggestion-link" href="#">
                        <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon" />
                        Get table suggestions
                      </a>
                      <img className="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow" />
                    </div>
                    <div className="divider-h"></div>
                    <span className="drag-hint">Or drag and drop from the left pane</span>
                  </div>
                ) : tabOption === 2 || isOption3 ? (
                  <div className="tables-canvas-wrap">
                    {/* Option 3 only (both "as is" and "optimized"): dotted-grid
                        canvas background. Cards/joins themselves are unchanged. */}
                    <div className="model-canvas" id="tables-canvas" style={{
                      position: 'relative',
                      flex: 1,
                      ...(tabOption === 3 ? {
                        backgroundColor: 'var(--rd-sys-color-background-sunken, #F6F8FA)',
                        backgroundImage: 'radial-gradient(circle, var(--rd-sys-color-background-inset, #C0C6CF) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      } : {}),
                    }}
                    onClick={tabOption === 3 && optimizedLike ? e => {
                      // Only the canvas background itself, not a bubbled click
                      // from a table card or join line/badge.
                      if (e.target !== e.currentTarget) return;
                      setPreviewTable('');
                      setPreviewJoin(null);
                      setPreviewScope('model');
                    } : undefined}
                    >
                      <TableCanvas
                        tables={tableCanvasData.tables}
                        joins={tableCanvasData.joins}
                        onTableDragEnd={(name, x, y) => (window as any)._handleTableDrag?.(name, x, y)}
                        selectedTable={tabOption === 3 && previewScope !== 'table' ? '' : previewTable}
                        onSelectTable={name => { setPreviewTable(name); setPreviewJoin(null); setPreviewScope('table'); }}
                        {...(tabOption === 3 ? {
                          selectedJoinKey: previewScope === 'join' && previewJoin ? joinKey(previewJoin) : undefined,
                          onSelectJoin: (j: JoinInfo) => { setPreviewJoin(j); setPreviewScope('join'); },
                          highlightedTables: previewScope === 'join' && previewJoin ? [previewJoin.leftTable, previewJoin.rightTable] : undefined,
                        } : {})}
                      />
                      {tabOption === 3 && optimizedLike && (
                        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <Button variant="secondary" iconOnly icon="search" aria-label="Find">Find</Button>
                          <div style={{ position: 'relative' }}>
                            <Button
                              ref={zoomMenuBtnRef}
                              variant="tertiary"
                              size="basic"
                              iconPosition="trailing"
                              icon={<Icon name={zoomMenuOpen ? 'chevron-up' : 'chevron-down'} size="s" color="var(--rd-sys-color-content-secondary)" />}
                              onClick={() => setZoomMenuOpen(o => !o)}
                              style={{ border: '1px solid var(--rd-sys-color-border-default)', borderRadius: 'var(--radius-lg)', color: 'var(--rd-sys-color-content-primary)', background: 'var(--rd-sys-color-background-base)' }}
                            >
                              100%
                            </Button>
                            <AnchoredMenu
                              open={zoomMenuOpen}
                              anchorRef={zoomMenuBtnRef}
                              onClose={() => setZoomMenuOpen(false)}
                              placement="bottom-start"
                            >
                              <Menu onClose={() => setZoomMenuOpen(false)}>
                                <Menu.Item shortcut="⌘1" onClick={() => setZoomMenuOpen(false)}>Zoom to fit</Menu.Item>
                                <Menu.Item shortcut="⌘+" onClick={() => setZoomMenuOpen(false)}>Zoom in</Menu.Item>
                                <Menu.Item shortcut="⌘-" onClick={() => setZoomMenuOpen(false)}>Zoom out</Menu.Item>
                                <Menu.Item onClick={() => setZoomMenuOpen(false)}>Zoom to 50%</Menu.Item>
                                <Menu.Item shortcut="⌘0" onClick={() => setZoomMenuOpen(false)}>Zoom to 100%</Menu.Item>
                                <Menu.Item onClick={() => setZoomMenuOpen(false)}>Zoom to 200%</Menu.Item>
                              </Menu>
                            </AnchoredMenu>
                          </div>
                        </div>
                      )}
                      {/* 3.2 only, while the vertical preview overlays the
                          canvas: a 1px spacer one panel-width past the
                          rightmost card (cards are 200px wide — TableCanvas's
                          CARD_W) extends the scrollable area, so any card the
                          panel covers can always be scrolled clear of it. */}
                      {isV32 && previewOpen && tableCanvasData.tables.length > 0 && (
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: Math.max(...tableCanvasData.tables.map(t => t.x)) + 200 + previewWidth + 24,
                            width: 1,
                            height: 1,
                          }}
                        />
                      )}
                    </div>
                    {tabOption === 3 ? (
                      <PreviewPanel3
                        tables={tableCanvasData.tables}
                        columnRows={columnRows}
                        dataSourceTables={columnTreeData.dataSourceTables}
                        open={previewOpen} setOpen={setPreviewOpen}
                        full={previewFull} setFull={setPreviewFull}
                        height={previewHeight} setHeight={setPreviewHeight}
                        width={previewWidth} setWidth={setPreviewWidth}
                        panelTab={panelTab} setPanelTab={setPanelTab}
                        scope={previewScope} setScope={setPreviewScope}
                        selectedTable={previewTable} setSelectedTable={setPreviewTable}
                        join={previewJoin} setJoin={setPreviewJoin}
                        joins={tableCanvasData.joins}
                        embedMode={option3EmbedMode}
                      />
                    ) : (
                      <PreviewPanel
                        tables={tableCanvasData.tables}
                        columnRows={columnRows}
                        dataSourceTables={columnTreeData.dataSourceTables}
                        open={previewOpen} setOpen={setPreviewOpen}
                        full={previewFull} setFull={setPreviewFull}
                        height={previewHeight} setHeight={setPreviewHeight}
                        panelTab={panelTab} setPanelTab={setPanelTab}
                        scope={previewScope === 'join' ? 'table' : previewScope} setScope={setPreviewScope}
                        selectedTable={previewTable} setSelectedTable={setPreviewTable}
                      />
                    )}
                  </div>
                ) : (
                  <div className="model-canvas" id="tables-canvas">
                    <TableCanvas
                      tables={tableCanvasData.tables}
                      joins={tableCanvasData.joins}
                      onTableDragEnd={(name, x, y) => (window as any)._handleTableDrag?.(name, x, y)}
                    />
                  </div>
                )}
              </div>

              {/* Columns tab */}
              <div className="tab-content" id="content-columns" style={{ display: 'none' }}>
                <div className="empty-state" id="columns-empty-state">
                  <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon" />
                  <div className="empty-body">
                    <div className="empty-title">Build your foundation first</div>
                    <div className="empty-desc">Add tables so SpotterModel can recommend the right columns for you</div>
                  </div>
                  <div className="suggestion-row">
                    <a className="suggestion-link" href="#">
                      <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon" />
                      Get table suggestions
                    </a>
                    <img className="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow" />
                  </div>
                </div>
                {columnRows.length > 0 && (
                  <div className="col-table-wrap" id="columns-canvas">
                    <div className="col-table-topbar">
                      <SearchInput
                        placeholder="Search"
                        value={colSearch}
                        onChange={(e) => setColSearch(e.target.value)}
                        className="col-table-search-input"
                      />
                      <Button variant="secondary">Model CSV import</Button>
                    </div>
                    <Table
                      columns={COL_TABLE_COLUMNS}
                      data={columnRows.filter(r =>
                        !colSearch ||
                        r.col.toLowerCase().includes(colSearch.toLowerCase()) ||
                        r.table.toLowerCase().includes(colSearch.toLowerCase())
                      )}
                      rowKey={(r) => `${(r as ColRow).table}.${(r as ColRow).col}`}
                      selectable
                      selectedKeys={selectedColKeys}
                      onSelectionChange={setSelectedColKeys}
                      stickyHeader
                    />
                  </div>
                )}
              </div>

              {/* Formulas tab */}
              <div className="tab-content" id="content-formulas" style={{ display: 'none' }}>
                <div className="empty-state" id="formulas-empty-state">
                  <img src="/spotter-assets/Table=l.svg" width="32" height="32" alt="table icon" />
                  <div className="empty-body">
                    <div className="empty-title">Start with a data source</div>
                    <div className="empty-desc">Tables and columns are required before SpotterModel can help you build formulas</div>
                  </div>
                  <div className="suggestion-row">
                    <a className="suggestion-link" href="#">
                      <img src="/spotter-assets/ai icon.svg" width="14" height="14" alt="ai icon" />
                      Get table suggestions
                    </a>
                    <img className="moving-arrow" src="/spotter-assets/Moving arrow.svg" width="14" height="12" alt="arrow" />
                  </div>
                </div>
                {formulaRows.length > 0 && (
                  <div className="formula-table-wrap" id="formulas-canvas">
                    <div className="formula-topbar">
                      <SearchInput
                        placeholder="Search formulas"
                        value={formulaSearch}
                        onChange={(e) => setFormulaSearch(e.target.value)}
                        className="formula-search-input"
                      />
                    </div>
                    <Table
                      columns={[
                        { key: 'name', label: 'Formula name' },
                        { key: 'type', label: 'Data type' },
                        { key: 'actions', label: '', width: '40px', render: (_: unknown, _row: Record<string, unknown>) => (
                          <Button variant="secondary" icon="more" iconOnly title="More options">More options</Button>
                        )},
                      ]}
                      data={formulaRows.filter(r =>
                        !formulaSearch ||
                        r.name.toLowerCase().includes(formulaSearch.toLowerCase())
                      )}
                      rowKey={(r) => (r as FormulaRow).name}
                      stickyHeader
                    />
                  </div>
                )}
              </div>

              {/* Formulas toolbar */}
              <div className="formulas-toolbar" id="formulas-toolbar" style={{ display: 'none' }}>
                <Button variant="secondary" id="formulas-add-btn">Add formula</Button>
              </div>

              {/* Query tab (Option 1) — ported Search + Spreadsheet experience */}
              <div className="tab-content" id="content-query" style={{ display: 'none' }}>
                <SearchDataExplorations showSpotter={false} />
              </div>

            </div>{/* /main-content */}
          </div>{/* /content-row */}
        </div>{/* /left-and-main */}

        {/* Every mode but 3.2: SpotterModel keeps its home on the right
            (see agentPanelEl above). */}
        {!isV32 && agentPanelEl}

      </div>{/* /body-row */}

      {/* APP FOOTER — hidden in Optimized to reclaim canvas height; its
          Discard/Save actions already live in the Optimized sub-header
          (Exit/Save changes), and the review-only option switcher moves to
          a popover off the sub-header's settings icon instead (see below). */}
      {!(tabOption === 3 && optimizedLike) && (
        <div className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <Button variant="secondary" id="discard-btn">Discard changes and close</Button>
            {optionSwitcherControls}
          </div>
          <Button variant="primary" id="save-changes-btn">Save changes</Button>
        </div>
      )}

      {/* CONTEXT MODAL */}
      {ctxOpen && (
        <RdModal
          size="M2"
          title="Context"
          onClose={() => { (window as any)._onCtxModalClose?.(); }}
          confirmLabel="Done"
          onConfirm={() => { (window as any)._onCtxModalClose?.(); }}
        >
          <div id="ctx-modal-body" className="ctx-modal-body" dangerouslySetInnerHTML={{ __html: ctxHtml }} />
        </RdModal>
      )}
    </div>
  );
};

export default SearchDataOnDataModelexplorations;
