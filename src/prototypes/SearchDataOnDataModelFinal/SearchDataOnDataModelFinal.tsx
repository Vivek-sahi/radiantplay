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
import { List } from '@components/List';
import { Link } from '@components/Link';
import { Popover } from '@components/Popover';
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
import TablePickerV2 from './components/TablePickerV2';
import FormulaEditorModal from './components/FormulaEditorModal';
import type { FormulaDraft } from './components/FormulaEditorModal';
import EditJoinModal from './components/EditJoinModal';
import type { EditJoinResult } from './components/EditJoinModal';
import { SearchDataExplorations } from './SearchDataExplorations';

// Formula/Filters/Parameters dock (ported exactly from DataStudioV2 MVP's left
// browser panel) — fixed to the bottom of the Tables pane, table list scrolls
// in the remaining space above.
const FORMULA_ICON = <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const FILTER_ICON = <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11L8 8.5v3.5L6 11V8.5L1.5 3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>;

// count/children are optional so a row can be a plain entry (e.g. Settings)
// rather than a counted collection with an expandable body.
// `onAdd` puts the section's "+" in the header, left of the chevron — Komal:
// "the plus button should always be available on all headers". The count now
// sits alongside it rather than being replaced by it: a panel read as a model
// inventory has to show quantities.
//
// The border and ground moved out of inline styles into .dock-row /
// .dock-row-header in dme.css, so the tint/box treatments below can restyle
// them from a parent class instead of fighting inline styles with !important.
// Radiant has no badge component — Chip is the lavender column chip, which
// would read as data rather than chrome — so the count in both treatments is
// a token-styled span around a Radiant Typography. Tokens only, no
// hardcoded values.
const CountBadge: React.FC<{ count: number }> = ({ count }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, minWidth: 18, padding: '0 var(--spacing-1)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--rd-sys-color-background-subtle)',
  }}>
    <Typography variant="footnote" as="span" color="gray-light" noMargin>{count}</Typography>
  </span>
);

// `fill` is the Tables section: it collapses like every other section, but
// while open its body takes the pane's remaining height rather than animating
// to a 220px drawer, so the table list scrolls in the space that's left.
const DockRow: React.FC<{ balance: PaneBalance; icon: React.ReactNode; label: string; count?: number; open: boolean; onToggle?: () => void; onAdd?: () => void; addLabel?: string; fill?: boolean; children?: React.ReactNode }> = ({ balance, icon, label, count, open, onToggle, onAdd, addLabel, fill, children }) => {
  // The chevron leads the row in both treatments. Tint otherwise follows the
  // product's column browser — no type icon, a sentence-case label, a taller
  // row, the count plain on the right. Box stays compact: its icon, an
  // uppercase overline label, and the count as a badge beside it.
  const tint = balance === 'tint';
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: tint ? 12 : 7, width: '100%', padding: tint ? '14px 16px' : '9px 14px', border: 'none', textAlign: 'left' };
  const headerContent = (
    <>
      <span style={{ display: 'flex', flexShrink: 0, transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)', transform: open ? 'rotate(90deg)' : 'none' }}>
        <Icon name="chevron-right" size={tint ? 's' : 'xs'} color={tint ? 'var(--rd-sys-color-content-primary)' : 'var(--rd-sys-color-content-secondary)'} />
      </span>
      {!tint && icon}
      {/* Section chrome, not content: in box, Radiant's 'overline' (12px / 500 /
          uppercase / 0.02em) in content-secondary keeps the weight on the rows
          underneath. Tint instead matches the reference's sentence-case
          14px/500 label in content-primary. The count itself — CountBadge — is
          now the same pill in both treatments, next to the title (Komal:
          "in tint, use badges... placed next to the section title similar to
          box"); only the label's own type/case still tells the two apart. */}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Typography variant={tint ? 'content-label-subhead' : 'overline'} as="span" color={tint ? 'base' : 'gray-light'} noMargin style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</Typography>
        {typeof count === 'number' && <CountBadge count={count} />}
      </span>
      {onAdd && (
        <span
          style={{ display: 'flex' }}
          role="presentation"
          onClick={e => { e.stopPropagation(); onAdd(); }}
        >
          <Button variant="tertiary" size="small" iconOnly icon="plus" aria-label={addLabel ?? `Add to ${label}`}>
            {addLabel ?? `Add to ${label}`}
          </Button>
        </span>
      )}
    </>
  );

  return (
    <div className="dock-row" data-open={open} data-fill={fill ? 'true' : undefined}>
      <button type="button" className="dock-row-header" onClick={onToggle} style={{ ...headerStyle, cursor: 'pointer' }}>
        {headerContent}
      </button>
      <div style={fill && open
        ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
        : { maxHeight: open ? 220 : 0, overflowY: open ? 'auto' : 'hidden', transition: 'max-height 220ms cubic-bezier(0.4,0,0.2,1)' }}>
        {children}
      </div>
    </div>
  );
};

// One row of a dock section's list — formulas, filters and parameters all use
// it, so the three read identically: the name opens the object's editor, and
// the "..." menu carries Edit / Make a copy / Delete. `detail` is the row's
// value (a formula's expression, a filter's `col = val`, a parameter's value),
// shown on hover rather than in the row, so the name is all that competes for
// the eye. Filters and parameters have no editor yet and pass a no-op onEdit,
// the same placeholder convention as the "+" on their headers.
//
// The menu surface is Radiant's <Menu>, but it's positioned by the prototype's
// AnchoredMenu rather than rendered inline — the dock body is a
// `max-height: 220; overflow-y: auto` box, which clips any absolutely
// positioned child, so an inline menu would be cut off on the lower rows.
// Same pairing the canvas zoom menu already uses in this file.
const DockListRow: React.FC<{
  name: string;
  detail?: string;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}> = ({ name, detail, onEdit, onCopy, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const run = (fn: () => void) => () => { setMenuOpen(false); fn(); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Link
          color="black"
          size="small"
          onClick={e => { e.preventDefault(); onEdit(); }}
          title={detail}
        >
          {name}
        </Link>
      </div>
      <Button
        ref={menuBtnRef}
        variant="tertiary"
        size="small"
        iconOnly
        icon="more"
        aria-label={`${name} actions`}
        onClick={() => setMenuOpen(o => !o)}
      >
        {`${name} actions`}
      </Button>
      <AnchoredMenu
        open={menuOpen}
        anchorRef={menuBtnRef}
        onClose={() => setMenuOpen(false)}
        placement="bottom-end"
      >
        <Menu onClose={() => setMenuOpen(false)}>
          <Menu.Item onClick={run(onEdit)}>Edit</Menu.Item>
          <Menu.Item onClick={run(onCopy)}>Make a copy</Menu.Item>
          <Menu.Item onClick={run(onDelete)}>Delete</Menu.Item>
        </Menu>
      </AnchoredMenu>
    </div>
  );
};

// Case-insensitive match for the dock section searches.
const matchesQuery = (text: string, query: string) => text.toLowerCase().includes(query.trim().toLowerCase());

// "Make a copy" for the dock lists: the duplicate lands directly under the row
// it came from rather than at the end, with its name disambiguated.
const withCopy = <T extends { name: string }>(list: T[], item: T): T[] => {
  const taken = new Set(list.map(x => x.name));
  let name = `${item.name} (copy)`;
  for (let n = 2; taken.has(name); n++) name = `${item.name} (copy ${n})`;
  const next = list.slice();
  next.splice(list.findIndex(x => x.name === item.name) + 1, 0, { ...item, name });
  return next;
};

// Prototype-only: candidate treatments for separating the model sections
// (Formula/Filters/Parameters/Settings) from the table list.
//
//   tint  — the sections get their own sunken ground, like the search header
//   box   — each section becomes a bordered, rounded card on the base ground
//
// The sections stack vertically under the table list; tint and box differ
// purely by the dock wrapper's class styling.
type PaneBalance = 'tint' | 'box';

const PaneBody: React.FC<{ mode: PaneBalance; children: React.ReactNode }> = ({ children }) => <>{children}</>;


// The search at the top of a section's body, matching the one Tables carries.
// Tables pairs it with filter/sort buttons; these three are search only.
const DockSearch: React.FC<{ placeholder: string; value: string; onChange: (v: string) => void }> = ({ placeholder, value, onChange }) => (
  <div className="dock-search-row">
    <div style={{ flex: 1, minWidth: 0 }}>
      <SearchInput placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
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

// ── Demo model (prototype-only Empty/Demo switch in the left-pane dock) ──────
// "Empty" is the manually-built starting point the prototype has always opened
// on; "Demo" is a finished model, so the editor can be shown with something in
// it without clicking the whole build out first.
//
// Five tables in a star around fact_new_retail_sales. Every join key below is a
// real column of both tables in init-dme.js's DATASOURCE_TABLES — a join on a
// column that doesn't exist would still draw, but the column pane and preview
// panel read the same schema and would disagree with it.
const DEMO_MODEL = {
  tables: [
    { name: 'fact_new_retail_sales', desc: 'Retail sales transactions' },
    { name: 'fact_customer',         desc: 'Registered customer accounts' },
    { name: 'dim_product',           desc: 'Product catalog with pricing and category' },
    { name: 'dim_store',             desc: 'Store locations and regional metadata' },
    { name: 'dim_date',              desc: 'Calendar dimension' },
  ],
  joins: [
    { name: 'Join 1', desc: 'Links sales to customer profiles',      leftTable: 'fact_new_retail_sales', leftCol: 'customer_id', cardinality: 'Many : 1', rightTable: 'fact_customer', rightCol: 'customer_id' },
    { name: 'Join 2', desc: 'Associates sales with product details', leftTable: 'fact_new_retail_sales', leftCol: 'product_id',  cardinality: 'Many : 1', rightTable: 'dim_product',   rightCol: 'product_id' },
    { name: 'Join 3', desc: 'Connects sales to store locations',     leftTable: 'fact_new_retail_sales', leftCol: 'store_id',    cardinality: 'Many : 1', rightTable: 'dim_store',     rightCol: 'store_id' },
    { name: 'Join 4', desc: 'Puts sales on the calendar',            leftTable: 'fact_new_retail_sales', leftCol: 'sale_date',   cardinality: 'Many : 1', rightTable: 'dim_date',      rightCol: 'full_date' },
  ],
  columns: [
    { table: 'fact_new_retail_sales', columns: ['sale_id', 'customer_id', 'product_id', 'store_id', 'sale_date', 'quantity', 'unit_price', 'discount', 'net_amount'] },
    { table: 'fact_customer',         columns: ['customer_id', 'first_name', 'last_name', 'email', 'region', 'segment', 'lifetime_value'] },
    { table: 'dim_product',           columns: ['product_id', 'product_name', 'category', 'sub_category', 'brand', 'unit_price'] },
    { table: 'dim_store',             columns: ['store_id', 'store_name', 'city', 'state', 'region_id'] },
    { table: 'dim_date',              columns: ['date_id', 'full_date', 'month', 'quarter', 'year', 'is_weekend', 'is_holiday'] },
  ],
};

// A named value reused across formulas and filters. Parameters had no state
// before the Demo switch — the dock was hardcoded to a 0 count and its empty
// state — so this is the shape the dock now renders.
type ModelParameter = { name: string; value: string };

// The three dock lists for the Demo state. Every column referenced below is one
// of DEMO_MODEL's own columns, so the demo reads as one coherent model rather
// than a canvas and three unrelated lists.
const DEMO_FORMULAS: FormulaDraft[] = [
  { name: 'Total revenue',       expression: 'SUM(fact_new_retail_sales.net_amount)' },
  { name: 'Average order value', expression: 'SUM(fact_new_retail_sales.net_amount) / COUNT(DISTINCT fact_new_retail_sales.sale_id)' },
  { name: 'Unique customers',    expression: 'COUNT(DISTINCT fact_new_retail_sales.customer_id)' },
];
// Rendered as `col = val` by the Filters dock.
const DEMO_FILTERS: { col: string; val: string }[] = [
  { col: 'segment',    val: 'Enterprise' },  // fact_customer.segment
  { col: 'region',     val: 'West' },        // fact_customer.region
  { col: 'is_holiday', val: 'false' },       // dim_date.is_holiday
];
const DEMO_PARAMETERS: ModelParameter[] = [
  { name: 'Target margin',      value: '35%' },   // used against unit_price / net_amount
  { name: 'Discount threshold', value: '0.15' },  // fact_new_retail_sales.discount
  { name: 'Reporting year',     value: '2026' },  // dim_date.year
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

const SearchDataOnDataModelFinal: React.FC = () => {
  const navigate = useNavigate();
  const [tablesUnselected, setTablesUnselected] = useState(false);
  const [activeTab, setActiveTab] = useState('tables');
  // Option 3 Optimized is the default landing state.
  // FINAL: locked to the chosen design. Typed as the original union (not a
  // literal) so every existing comparison below still compiles untouched —
  // only the selected branches can ever render.
  const tabOption = 3 as 1 | 2 | 3;
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
  // Competing designs for selecting tables/columns in the left pane.
  // 1 = the existing ColumnTree (chips, chevron, per-column checkboxes) —
  // frozen. 2 = TablePickerV2 (plain text, "+" adds and expands, select-all on
  // the row). Switched from the toggle next to Builder/Semantics.
  const [tableSelectorOption, setTableSelectorOption] = useState<1 | 2>(2);
  // Its switcher is hidden from the UI (2026-09-17, Komal) — Option 2 is the
  // only design now. Everything Option 1 needs (ColumnTree, ColumnTree import,
  // the tableSelectorOption === 1 branch below) is untouched, so bringing it
  // back is just re-adding this SegmentedControl wherever it should live:
  //   <SegmentedControl
  //     options={[{ id: '1', label: 'Option 1' }, { id: '2', label: 'Option 2' }]}
  //     value={String(tableSelectorOption)}
  //     onChange={v => setTableSelectorOption(Number(v) as 1 | 2)}
  //     size="small"
  //   />
  // setTableSelectorOption has no live caller until then; this keeps the
  // setter itself from tripping noUnusedLocals in the meantime.
  void setTableSelectorOption;
  // Selector Option 2's expanded table. Owned here, not in TablePickerV2, so a
  // canvas card's "Add columns" link can expand that table in the left pane.
  const [openTableV2, setOpenTableV2] = useState<string | null>(null);
  // Formulas saved from the Formula Editor. They show in the left pane's
  // Formula dock and as their own category in the preview panel's column
  // selector, on both the Query and Spreadsheet tabs.
  const [modelFormulas, setModelFormulas] = useState<FormulaDraft[]>([]);
  const [formulaEditorOpen, setFormulaEditorOpen] = useState(false);
  // The formula the editor was opened on, and the name it had at that moment —
  // the name is editable, so the save below matches on the original to replace
  // the right row. null = adding a new formula.
  const [editingFormula, setEditingFormula] = useState<FormulaDraft | null>(null);

  const openFormulaEditor = (f: FormulaDraft) => { setEditingFormula(f); setFormulaEditorOpen(true); };
  const deleteFormula = (name: string) => setModelFormulas(prev => prev.filter(x => x.name !== name));
  const copyFormula = (f: FormulaDraft) => setModelFormulas(prev => withCopy(prev, f));
  // Parameters shown in the left pane's Parameters dock. Only the Demo state
  // fills this today — there's no add-parameter flow yet, so the "+" on that
  // dock header is still a no-op like the Filters one.
  const [modelParameters, setModelParameters] = useState<ModelParameter[]>([]);
  const deleteParameter = (name: string) => setModelParameters(prev => prev.filter(x => x.name !== name));
  const copyParameter = (p: ModelParameter) => setModelParameters(prev => withCopy(prev, p));
  // Prototype-only: 'empty' is the manually-built starting point, 'demo' is the
  // finished five-table model. Switched from the dock footer next to the
  // Option 1/2 selector. See DEMO_MODEL above.
  const [modelState, setModelState] = useState<'empty' | 'demo'>('empty');
  // Prototype-only: which of the three candidate treatments the left panel is
  // wearing. See PaneBody.
  const [paneBalance, setPaneBalance] = useState<PaneBalance>('tint');
  const handleAddTable = (tableName: string) => {
    (window as any)._addTableManually?.(tableName);
  };
  const handleRemoveTable = (tableName: string) => {
    (window as any)._removeTableManually?.(tableName);
  };
  // The "..." menu on a canvas card. Anchored to the click point rather than a
  // ref — the button lives inside the shared TableCard, so the ref isn't ours.
  // This is the only way to take a table off the canvas now that the left
  // pane's added rows carry no "−".
  const [tableCardMenu, setTableCardMenu] = useState<{ name: string; x: number; y: number } | null>(null);
  // Edit Join dialog — opened from a card's join handle. `right` is set only
  // when the handle was dragged onto a second card; a plain click leaves it
  // undefined so the dialog asks the user to pick Table 2.
  const [joinDraft, setJoinDraft] = useState<{ left: string; right?: string } | null>(null);
  const [modelLoading, setModelLoading] = useState<{ visible: boolean; label: string }>({ visible: false, label: '' });
  // Formula/Filters/Parameters dock in the Tables left pane — only one open at a time.
  const [browserDockOpen, setBrowserDockOpen] = useState<string | null>('tables');
  // One query per section rather than one shared: the accordion shows a single
  // section at a time, but a filter should survive visiting another and coming
  // back. Matched against the name the row shows, not its hover detail.
  const [formulaQuery, setFormulaQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [parameterQuery, setParameterQuery] = useState('');
  const visibleFormulas = modelFormulas.filter(f => matchesQuery(f.name, formulaQuery));
  const visibleFilters = modelFilters.filter(f => matchesQuery(f.col, filterQuery));
  const visibleParameters = modelParameters.filter(p => matchesQuery(p.name, parameterQuery));
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
  // Default 'preview' (Option 2). Option 3 defaults to 'query' instead —
  // see the effect below, scoped to tabOption === 3 only.
  const [panelTab, setPanelTab] = useState<'preview' | 'query'>('preview');
  // 'join' is Option 3 only — Option 2 never sets it (its TableCanvas isn't
  // wired with onSelectJoin), so this widening is safe for it.
  // Starts at 'model' so opening the panel before anything is selected lists
  // every column on the canvas — 'table' with no selected table scopes to
  // nothing now that both panel tabs respect the scope.
  const [previewScope, setPreviewScope] = useState<'table' | 'join' | 'model'>('model');
  const [previewTable, setPreviewTable] = useState('');
  const [previewJoin, setPreviewJoin] = useState<JoinInfo | null>(null);
  // Option 3 only: switches PreviewPanel3 between embedding SearchDataExplorations
  // completely as-is vs. optimized for the docked panel (see .option-switcher below).
  const option3EmbedMode = 'optimized' as 'asis' | 'optimized';
  // Option 3 "optimized" only: two competing designs for the left panel's
  // Tables/Columns data-source selector. Option 1 = existing pattern (the
  // current SegmentedControl in the sub-header, untouched). Option 2 = new
  // design (2026-09-10), built out only where dataSourceSelectorOption === 2
  // is checked. Unrelated to the outer tabOption 1-4 numbering above — this
  // is its own independent switcher, scoped entirely to Option 3 optimized.
  // Defaults to 2 (2026-09-10) — Option 2 is now the landing-state default.
  const dataSourceSelectorOption = 2 as 1 | 2;

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

  // Optimized only: expanding the preview panel auto-collapses the left
  // tables/columns panel and the SpotterModel panel, so the expanded preview
  // gets the full width.
  useEffect(() => {
    if (previewOpen && tabOption === 3 && option3EmbedMode === 'optimized') {
      setLeftPaneCollapsed(true);
      setAgentPanelCollapsed(true);
    }
  }, [previewOpen, tabOption, option3EmbedMode]);

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

  // Applies the Empty/Demo switch. Runs after the mount effect above (so
  // initDME has installed _loadDemoModel/_resetModel and the React setters the
  // rebuilds call back into), and again on every flip of the switch. The dock
  // lists are React state, the canvas is init-dme.js's — both have to move
  // together or the switch would half-apply.
  useEffect(() => {
    if (modelState === 'demo') {
      (window as any)._loadDemoModel?.({ ...DEMO_MODEL, formulas: DEMO_FORMULAS });
      setModelFormulas(DEMO_FORMULAS);
      setModelFilters(DEMO_FILTERS);
      setModelParameters(DEMO_PARAMETERS);
    } else {
      (window as any)._resetModel?.();
      setModelFormulas([]);
      setModelFilters([]);
      setModelParameters([]);
    }
    // Whichever way it went, the previous model's selections are gone.
    setOpenTableV2(null);
    setPreviewTable('');
    setPreviewJoin(null);
    setPreviewScope('model');
  }, [modelState]);

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

    </div>
  );

  // Tables tab's empty canvas. Extracted so Option 3 can render it *inside*
  // .model-canvas — the preview panel is a sibling of the canvas, so keeping
  // the empty state in the old outer branch would take the whole
  // .tables-canvas-wrap (and with it the preview panel) off the page whenever
  // the canvas had no tables.
  const tablesEmptyState = (
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
  );

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
            className={tabOption === 3 && option3EmbedMode === 'optimized' ? 'sub-header sub-header-dense' : 'sub-header'}
            style={tabOption === 3 ? { position: 'relative' } : undefined}
          >
            <div
              className="sub-header-info"
              style={tabOption === 3 && option3EmbedMode === 'optimized' ? { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 'var(--spacing-1)' } : undefined}
            >
              {tabOption === 3 && option3EmbedMode === 'optimized' && (
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
              {tabOption === 3 && option3EmbedMode === 'optimized' && (
                // Popover, not Tooltip (Komal: "open on click, close on clicking
                // outside") — Radiant's Tooltip is hover/focus-only with no
                // click or click-outside support. Popover already defaults to
                // trigger="click" and closeOnClickOutside=true, so no extra
                // props are needed for the interaction itself. Its default
                // chrome is a plain white bordered card, though, so
                // .model-info-popover (dme.css) restyles it back to the same
                // dark bubble the Tooltip used — same tokens, nothing invented.
                <Popover
                  placement="bottom"
                  className="model-info-popover"
                  content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                        <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="" />
                        <span>Global sales connection</span>
                      </div>
                      <span>{modelDesc}</span>
                    </div>
                  }
                >
                  <span style={{ display: 'flex', cursor: 'pointer' }}>
                    <Icon name="info-circle" size="xs" color="var(--rd-sys-color-content-secondary)" />
                  </span>
                </Popover>
              )}
              {!(tabOption === 3 && option3EmbedMode === 'optimized') && (
                <span className="model-desc-placeholder">{modelDesc}</span>
              )}
            </div>
            {tabOption === 3 && (
              tabOption === 3 && option3EmbedMode === 'optimized' ? (
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
            {tabOption === 3 && option3EmbedMode === 'optimized' ? (
              /* Mirrors sub-header-info's flex:1 so the tab switch above lands
                 at the true center of the header, regardless of the name's or
                 actions' own width. */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <div className="sub-header-actions" id="actions-tables"></div>
                {/* Moved here from the left-pane dock (2026-09-17, Komal) —
                    "move to the top header on the left of the spottermodel
                    icon". Same modelState/paneBalance state as before, just a
                    new render site. */}
                <SegmentedControl
                  options={[{ id: 'empty', label: 'Empty' }, { id: 'demo', label: 'Demo' }]}
                  value={modelState}
                  onChange={v => setModelState(v as 'empty' | 'demo')}
                  size="small"
                />
                <SegmentedControl
                  options={[
                    { id: 'tint', label: 'Tint' },
                    { id: 'box',  label: 'Box' },
                  ]}
                  value={paneBalance}
                  onChange={v => setPaneBalance(v as PaneBalance)}
                  size="small"
                />
                {/* Rendered outside #actions-tables, which the legacy tab-switch
                    script hides on every tab but "tables" — this stays visible
                    across Tables and Columns. */}
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

            {/* LEFT PANE — Optimized only: collapsible + resizable in width.
                Collapses to a slim icon rail (sibling, below) instead of
                unmounting, so #pane-tables-section stays in the DOM for
                init-dme.js's legacy tab-switch script. There is no longer a
                second #pane-columns-section: Builder and Semantics share this
                one pane. */}
            <div
              className="left-pane"
              id="left-pane"
              style={tabOption === 3 && option3EmbedMode === 'optimized' ? {
                width: leftPaneCollapsed ? 0 : leftPaneWidth,
                minWidth: leftPaneCollapsed ? 0 : leftPaneWidth,
                borderRightWidth: leftPaneCollapsed ? 0 : undefined,
                position: 'relative',
                transition: leftPaneResizing ? 'none' : undefined,
              } : undefined}
            >
              {tabOption === 3 && option3EmbedMode === 'optimized' && !leftPaneCollapsed && (
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

              <div id="pane-tables-section" className={`pane-section${tabOption === 3 && option3EmbedMode === 'optimized' ? ' pane-section-docked' : ''}`}>
                {/* Optimized: the pane has no header of its own — label, count
                    and search all sit inside the Tables card below, so Tables is
                    a section like Formula/Filters/Parameters rather than the
                    pane's title with a list under it. */}
                {!(tabOption === 3 && option3EmbedMode === 'optimized') && (
                  <div className="left-pane-header">
                    <div className="connection-row">
                      <img src="/spotter-assets/Snowflake.svg" width="14" height="14" alt="connection" />
                      <span className="connection-name">Global sales connection</span>
                    </div>
                    <div className="pane-title-row">
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                        <Typography variant="content-label" as="span" noMargin>Tables</Typography>
                        <Typography variant="footnote" as="span" color="gray-light" noMargin>{addedTableNames.size}</Typography>
                      </span>
                      <div className="grid-icon-btn">
                        <img src="/spotter-assets/Knowledge card button.svg" width="24" height="24" alt="layout" />
                      </div>
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
                )}
                <PaneBody mode={paneBalance}>
                {tabOption === 3 && option3EmbedMode === 'optimized' && dataSourceSelectorOption === 2 ? (
                  <div className={`dock-${paneBalance} dock-tables`} data-open={browserDockOpen === 'tables'}>
                    {/* The count is tables in the model, matching what the
                        section counts below mean — not the 12 source tables the
                        list shows. */}
                    <DockRow
                      balance={paneBalance}
                      fill
                      open={browserDockOpen === 'tables'}
                      onToggle={() => setBrowserDockOpen(o => o === 'tables' ? null : 'tables')}
                      icon={<span style={{ display: 'flex' }}><Icon name="table" size="xs" color="var(--rd-sys-color-content-secondary)" /></span>}
                      label="Tables"
                      count={addedTableNames.size}
                    >
                      <div className="dock-search-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <SearchInput placeholder="Search tables" />
                        </div>
                        <Button variant="secondary" icon="filter" iconOnly title="Filter tables">Filter tables</Button>
                        <Button variant="secondary" icon="sort" iconOnly title="Sort tables">Sort tables</Button>
                      </div>
                      {tableSelectorOption === 2 ? (
                        <TablePickerV2
                          data={unifiedTreeData}
                          addedTableNames={addedTableNames}
                          onToggleColumn={handleToggleColumn}
                          onAddTable={handleAddTable}
                          openTable={openTableV2}
                          onOpenTableChange={setOpenTableV2}
                        />
                      ) : (
                        <ColumnTree data={unifiedTreeData} addedTableNames={addedTableNames} draggableTables checkboxColumns onToggleColumn={handleToggleColumn} />
                      )}
                    </DockRow>
                  </div>
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
                  <div className={`dock-${paneBalance}`} style={{ flexShrink: 0 }}>
                    <DockRow balance={paneBalance} icon={<span style={{ color: '#047857', display: 'flex' }}>{FORMULA_ICON}</span>} label="Formula" count={modelFormulas.length} open={browserDockOpen === 'formula'} onToggle={() => setBrowserDockOpen(o => o === 'formula' ? null : 'formula')} onAdd={() => { setEditingFormula(null); setFormulaEditorOpen(true); }} addLabel="Add formula">
                      {modelFormulas.length === 0 ? (
                        <DockEmpty icon={<span style={{ color: '#047857', display: 'flex' }}>{FORMULA_ICON}</span>} title="No formulas yet" subtitle="Add a calculated field from a column's ▾ menu — it'll show up here." />
                      ) : (
                        <>
                        <DockSearch placeholder="Search formulas" value={formulaQuery} onChange={setFormulaQuery} />
                        <List
                          className="dock-list"
                          items={visibleFormulas.map(f => ({ id: f.name, formula: f }))}
                          renderItem={item => {
                            const f = item.formula as FormulaDraft;
                            return (
                              <DockListRow
                                name={f.name}
                                detail={f.expression}
                                onEdit={() => openFormulaEditor(f)}
                                onCopy={() => copyFormula(f)}
                                onDelete={() => deleteFormula(f.name)}
                              />
                            );
                          }}
                        />
                        </>
                      )}

                    </DockRow>
                    <DockRow balance={paneBalance} icon={<span style={{ color: '#92640A', display: 'flex' }}>{FILTER_ICON}</span>} label="Filters" count={modelFilters.length} open={browserDockOpen === 'filters'} onToggle={() => setBrowserDockOpen(o => o === 'filters' ? null : 'filters')} onAdd={() => {}} addLabel="Add filter">
                      {modelFilters.length === 0 ? (
                        <DockEmpty icon={<span style={{ color: '#92640A', display: 'flex' }}>{FILTER_ICON}</span>} title="No filters yet" subtitle='Filter a column, then check "Add this filter to this model" to see it here.' />
                      ) : (
                        <>
                        <DockSearch placeholder="Search filters" value={filterQuery} onChange={setFilterQuery} />
                        <List
                          className="dock-list"
                          items={visibleFilters.map(f => ({ id: f.col, filter: f }))}
                          renderItem={item => {
                            const f = item.filter as { col: string; val: string };
                            return (
                              <DockListRow
                                name={f.col}
                                detail={`${f.col} = ${f.val}`}
                                onEdit={() => {}}
                                // A filter is identified by its column, so a
                                // duplicate would collide with the row it came
                                // from — no-op until filters carry their own id.
                                onCopy={() => {}}
                                onDelete={() => setModelFilters(prev => prev.filter(x => x.col !== f.col))}
                              />
                            );
                          }}
                        />
                        </>
                      )}

                    </DockRow>
                    <DockRow balance={paneBalance} icon={<span style={{ color: '#6B4FBF', display: 'flex', fontWeight: 700, fontSize: 12, width: 13, justifyContent: 'center' }}>@</span>} label="Parameters" count={modelParameters.length} open={browserDockOpen === 'parameters'} onToggle={() => setBrowserDockOpen(o => o === 'parameters' ? null : 'parameters')} onAdd={() => {}} addLabel="Add parameter">
                      {modelParameters.length === 0 ? (
                        <DockEmpty icon={<span style={{ color: '#6B4FBF', display: 'flex', fontWeight: 700, fontSize: 13 }}>@</span>} title="No parameters yet" subtitle="Add a named value to reuse across formulas and filters." />
                      ) : (
                        <>
                        <DockSearch placeholder="Search parameters" value={parameterQuery} onChange={setParameterQuery} />
                        <List
                          className="dock-list"
                          items={visibleParameters.map(p => ({ id: p.name, parameter: p }))}
                          renderItem={item => {
                            const p = item.parameter as ModelParameter;
                            return (
                              <DockListRow
                                name={p.name}
                                detail={`${p.name} = ${p.value}`}
                                onEdit={() => {}}
                                onCopy={() => copyParameter(p)}
                                onDelete={() => deleteParameter(p.name)}
                              />
                            );
                          }}
                        />
                        </>
                      )}

                    </DockRow>
                    {tabOption === 3 && option3EmbedMode === 'optimized' && (
                      <DockRow
                        balance={paneBalance}
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
                </PaneBody>
              </div>

            </div>{/* /left-pane */}

            {/* MAIN CONTENT */}
            <div className="main-content">

              {/* Tables tab */}
              <div className="tab-content" id="content-tables">
                {/* Option 3 skips this branch even with an empty canvas — its
                    empty state renders inside .model-canvas instead, so the
                    preview panel stays docked at the bottom either way. */}
                {tableCanvasData.tables.length === 0 && !isOption3 ? (
                  tablesEmptyState
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
                    onClick={tabOption === 3 && option3EmbedMode === 'optimized' ? e => {
                      // Only the canvas background itself, not a bubbled click
                      // from a table card or join line/badge.
                      if (e.target !== e.currentTarget) return;
                      setPreviewTable('');
                      setPreviewJoin(null);
                      setPreviewScope('model');
                    } : undefined}
                    >
                      {/* Empty canvas: same empty state as before, centred in
                          the canvas area the way .tab-content used to centre it. */}
                      {tableCanvasData.tables.length === 0 ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {tablesEmptyState}
                        </div>
                      ) : (
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
                          hoverAffordance: true,
                          onCreateJoin: (from: string, to?: string) => setJoinDraft({ left: from, right: to }),
                          onTableMenu: (name: string, e: React.MouseEvent) => {
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setTableCardMenu({ name, x: r.left, y: r.bottom });
                          },
                          // Option 2 only: a card with no columns yet offers an
                          // "Add columns" link that expands it in the left pane.
                          ...(tableSelectorOption === 2 ? { onAddColumns: (name: string) => setOpenTableV2(name) } : {}),
                        } : {})}
                      />
                      )}
                      {tableCanvasData.tables.length > 0 && tabOption === 3 && option3EmbedMode === 'optimized' && (
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
                    </div>
                    {tabOption === 3 ? (
                      <PreviewPanel3
                        tables={tableCanvasData.tables}
                        columnRows={columnRows}
                        dataSourceTables={columnTreeData.dataSourceTables}
                        modelColumns={columnTreeData.modelColumns}
                        modelFormulas={modelFormulas}
                        open={previewOpen} setOpen={setPreviewOpen}
                        full={previewFull} setFull={setPreviewFull}
                        height={previewHeight} setHeight={setPreviewHeight}
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
            {/* AGENT PANEL — hidden entirely on the Query tab, which needs the
                width for its own full search/sheet experience. The collapse
                toggle instead animates this wrapper's width to 0 (kept
                mounted, like #left-pane's own collapse), so it visually
                shrinks away in sync with the left pane and the Optimized
                preview panel instead of vanishing instantly.

                Sits inside .content-row — not beside .left-and-main — so it
                starts below the sub-header like the left pane does, leaving
                the sub-header full width. position/z-index keep it above
                .content-row's absolutely-positioned model-loading overlay,
                which covered only the canvas before this move. */}
            {spotterModelEnabled && activeTab !== 'query' && (
              <div
                style={{
                  width: agentPanelCollapsed ? 0 : undefined,
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                  // Same shadow the bottom preview panel shows when expanded
                  // (Komal, 2026-09-17: "all the panels... should use the same
                  // shadow"). Applied here, on this wrapper, rather than via
                  // the shared _agentic/AgentPanel.tsx's own .agent-panel
                  // class — that class sits INSIDE this wrapper, and the
                  // wrapper's own overflow:hidden (needed for the width-to-0
                  // collapse animation) would clip a shadow painted by a
                  // descendant. A shadow on the wrapper itself isn't clipped
                  // by its own overflow, so it paints correctly.
                  boxShadow: 'var(--shadow-surface)',
                  transition: 'width var(--duration-slow) var(--easing-standard)',
                }}
              >
                <AgentPanel welcomeVariant={welcomeVariant} onClose={() => setAgentPanelCollapsed(true)} />
              </div>
            )}

          </div>{/* /content-row */}
        </div>{/* /left-and-main */}

      </div>{/* /body-row */}

      {/* APP FOOTER — hidden in Optimized to reclaim canvas height; its
          Discard/Save actions already live in the Optimized sub-header
          (Exit/Save changes), and the review-only option switcher moves to
          a popover off the sub-header's settings icon instead (see below). */}
      {!(tabOption === 3 && option3EmbedMode === 'optimized') && (
        <div className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <Button variant="secondary" id="discard-btn">Discard changes and close</Button>
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

      {/* FORMULA EDITOR — opened from the left pane's "Add formula" link */}
      <AnchoredMenu
        open={!!tableCardMenu}
        anchorPoint={tableCardMenu ? { x: tableCardMenu.x, y: tableCardMenu.y } : null}
        onClose={() => setTableCardMenu(null)}
        placement="bottom-start"
      >
        <Menu onClose={() => setTableCardMenu(null)}>
          <Menu.Item onClick={() => { if (tableCardMenu) handleRemoveTable(tableCardMenu.name); setTableCardMenu(null); }}>
            Remove from model
          </Menu.Item>
        </Menu>
      </AnchoredMenu>

      {formulaEditorOpen && (
        <FormulaEditorModal
          initial={editingFormula ?? undefined}
          onCancel={() => { setFormulaEditorOpen(false); setEditingFormula(null); }}
          onSave={f => {
            setModelFormulas(prev => {
              // Editing keeps the row where it was; adding appends.
              const at = editingFormula ? prev.findIndex(x => x.name === editingFormula.name) : -1;
              if (at === -1) return [...prev.filter(x => x.name !== f.name), f];
              const next = prev.slice();
              next[at] = f;
              return next;
            });
            setFormulaEditorOpen(false);
            setEditingFormula(null);
          }}
        />
      )}

      {/* EDIT JOIN MODAL — opened from a table card's join handle */}
      {joinDraft && (
        <EditJoinModal
          leftTable={joinDraft.left}
          rightTable={joinDraft.right}
          tables={tableCanvasData.tables.map(t => t.name)}
          dataSourceTables={columnTreeData.dataSourceTables}
          onCancel={() => setJoinDraft(null)}
          onSave={(join: EditJoinResult) => {
            (window as any)._addJoinManually?.(join);
            setJoinDraft(null);
          }}
        />
      )}
    </div>
  );
};

export default SearchDataOnDataModelFinal;
