import React, { useMemo, useState } from 'react';
import { c, sp, fs, fw, ff, ts } from '../styles';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Tabs } from '../../../components/Tabs';
import { Select } from '../../../components/Select';
import { SearchInput } from '../../../components/SearchInput';
import { Table, type TableColumn } from '../../../components/Table';
import { Icon } from '../../../components/icons';
import {
  WAREHOUSE_TREE,
  WarehouseConnection,
  WarehouseTable,
} from '../data/mockData';

// Brand accent — used only on the dbt model glyph color so dbt rows are
// distinguishable from raw tables in dense lists.
const BRAND = { dbt: '#FF694A' } as const;

const TYPE_LABEL: Record<WarehouseConnection['type'], string> = {
  snowflake: 'Snowflake',
  dbt:       'dbt',
};

// ── Data shaping ─────────────────────────────────────────────────────────────

interface FlatSchema {
  key:        string;   // `${dbId}/${schemaId}` — opaque key for selection
  dbName:     string;
  schemaName: string;
  label:      string;   // `${dbName} · ${schemaName}`
  tables:     WarehouseTable[];
}

function flattenSchemas(conn: WarehouseConnection): FlatSchema[] {
  return conn.databases.flatMap(db =>
    db.schemas.map(s => ({
      key:        `${db.id}/${s.id}`,
      dbName:     db.name,
      schemaName: s.name,
      label:      `${db.name} · ${s.name}`,
      tables:     s.tables,
    }))
  );
}

const isDbt = (t: WarehouseTable) => t.type === 'dbt_model';
const isSemanticView = (t: WarehouseTable) => t.type === 'semantic_view';
const isRawTable = (t: WarehouseTable) => !t.type || t.type === 'table';
const isExternalModel = (t: WarehouseTable) => isDbt(t) || isSemanticView(t);

// Warehouses tab shows only "warehouse" connections (snowflake/bigquery/etc.).
// A dbt connection is dbt-only — its models live in External Models.
const RAW_WAREHOUSES = WAREHOUSE_TREE.filter(w => w.type !== 'dbt');

// All external models across every connection, with the path needed to drill.
interface ExternalEntry {
  ref:        { connId: string; schemaKey: string; tableId: string };
  table:      WarehouseTable;
  connection: WarehouseConnection;
  schema:     FlatSchema;
}

function getAllExternalModels(): ExternalEntry[] {
  const out: ExternalEntry[] = [];
  for (const conn of WAREHOUSE_TREE) {
    for (const s of flattenSchemas(conn)) {
      for (const t of s.tables) {
        if (isExternalModel(t)) {
          out.push({ ref: { connId: conn.id, schemaKey: s.key, tableId: t.id }, table: t, connection: conn, schema: s });
        }
      }
    }
  }
  return out;
}

// ── Icons + glyphs ───────────────────────────────────────────────────────────

const tableIconColor = (t: WarehouseTable): string => {
  if (isDbt(t))          return BRAND.dbt;
  if (isSemanticView(t)) return c['content-brand'];
  return c['content-tertiary'];
};

const TableTypeIcon: React.FC<{ table: WarehouseTable; size?: 'xs' | 's' | 'm' | 'l' }> = ({ table, size = 's' }) => (
  <Icon name="save-worksheet" size={size} color={tableIconColor(table)} />
);

const typeLabelFor = (t: WarehouseTable): string =>
  isDbt(t) ? 'dbt model' : isSemanticView(t) ? 'Semantic view' : 'Table';

// ── Shared chrome ────────────────────────────────────────────────────────────

const PageHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ icon, title, subtitle, actions }) => (
  <div style={{
    flexShrink: 0,
    padding: `${sp.D}px ${sp.G}px`,
    backgroundColor: c['background-base'],
    borderBottom: `1px solid ${c['border-divider']}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.D,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, minWidth: 0 }}>
      {icon}
      <div style={{ minWidth: 0 }}>
        <h1 style={{ ...ts.modalTitle, margin: 0, color: c['content-primary'], fontFamily: ff.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>
        {subtitle && (
          <div style={{ ...ts.footnote, color: c['content-secondary'], marginTop: 2, fontFamily: ff.primary }}>{subtitle}</div>
        )}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B, flexShrink: 0, alignItems: 'center' }}>{actions}</div>}
  </div>
);

const StatCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card>
    <div style={{ padding: sp.D }}>
      <div style={{ ...ts.footnote, color: c['content-tertiary'] }}>{label}</div>
      <div style={{ ...ts.headlineLarge, fontSize: fs.xl, color: c['content-primary'], marginTop: 2 }}>{value}</div>
    </div>
  </Card>
);

// ── Top-tab strip (page level, distinct from in-page Tabs) ───────────────────

type TopTab = 'warehouses' | 'external-models';

const TopTabStrip: React.FC<{ active: TopTab; onChange: (t: TopTab) => void }> = ({ active, onChange }) => {
  const tabs = [
    { id: 'warehouses',      label: 'Warehouses' },
    { id: 'external-models', label: 'External models' },
  ];
  return (
    <div style={{
      flexShrink: 0,
      padding: `0 ${sp.D}px`,
      backgroundColor: c['background-base'],
      borderBottom: `1px solid ${c['border-divider']}`,
    }}>
      <Tabs tabs={tabs} activeTab={active} onTabChange={(id) => onChange(id as TopTab)} />
    </div>
  );
};

// ── Warehouse home (selected warehouse → schema list) ────────────────────────

interface SchemaRow extends Record<string, unknown> {
  id:         string;
  name:       string;
  tableCount: number;
}

const WarehouseHome: React.FC<{
  conn: WarehouseConnection;
  rawSchemas: FlatSchema[];
  onPickSchema: (key: string) => void;
}> = ({ conn, rawSchemas, onPickSchema }) => {
  const tableCount = rawSchemas.reduce((s, fs0) => s + fs0.tables.length, 0);

  const data: SchemaRow[] = rawSchemas.map(fs0 => ({
    id:         fs0.key,
    name:       fs0.label,
    tableCount: fs0.tables.length,
  }));

  const columns: TableColumn<SchemaRow>[] = [
    { key: 'name', label: 'Schema',
      render: (_v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <Icon name="folder" size="s" color={c['content-brand']} />
          <span style={{ fontFamily: ff.primary, color: c['content-primary'], fontWeight: fw.medium }}>{row.name}</span>
        </div>
      ),
    },
    { key: 'tableCount', label: 'Tables', width: '140px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-secondary'] }}>{row.tableCount}</span> },
    { key: 'chevron', label: '', width: '40px', align: 'right',
      render: () => <Icon name="chevron-right" size="s" color={c['content-tertiary']} /> },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, marginBottom: sp.E }}>
        <StatCell label="Schemas"   value={String(rawSchemas.length)} />
        <StatCell label="Tables"    value={String(tableCount)} />
        <StatCell label="Last sync" value="2h ago" />
      </div>
      <Card>
        <Table<SchemaRow>
          columns={columns} data={data} rowKey="id"
          hoverable onRowClick={(row) => onPickSchema(row.id)}
        />
      </Card>
    </div>
  );
};

// ── Schema home (schema → tables list) ───────────────────────────────────────

interface TableRow extends Record<string, unknown> {
  id:           string;
  raw:          WarehouseTable;
  name:         string;
  description?: string;
  rows:         string;
  sync:         string;
}

const SchemaHome: React.FC<{
  schema: FlatSchema;
  onPickTable: (id: string) => void;
}> = ({ schema, onPickTable }) => {
  const rawOnly = useMemo(() => schema.tables.filter(isRawTable), [schema.tables]);

  const data: TableRow[] = rawOnly.map(t => ({
    id:          t.id,
    raw:         t,
    name:        t.name,
    description: t.description,
    rows:        t.rows ?? '—',
    sync:        t.sync ?? '—',
  }));

  const columns: TableColumn<TableRow>[] = [
    { key: 'name', label: 'Table',
      render: (_v, row) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
          <span style={{ paddingTop: 2 }}><TableTypeIcon table={row.raw} size="s" /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: ff.primary, color: c['content-primary'], fontWeight: fw.medium }}>{row.name}</div>
            {row.description && (
              <div style={{ fontFamily: ff.primary, fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2 }}>{row.description}</div>
            )}
          </div>
        </div>
      ),
    },
    { key: 'rows', label: 'Rows', width: '140px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-secondary'] }}>{row.rows}</span> },
    { key: 'sync', label: 'Last sync', width: '160px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, fontSize: fs.xs, color: c['content-tertiary'] }}>{row.sync}</span> },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: sp.C, marginBottom: sp.E }}>
        <StatCell label="Tables"    value={String(rawOnly.length)} />
        <StatCell label="Last sync" value="2h ago" />
      </div>
      <Card>
        <Table<TableRow>
          columns={columns} data={data} rowKey="id"
          hoverable onRowClick={(row) => onPickTable(row.id)}
        />
      </Card>
    </div>
  );
};

// ── External Models list ─────────────────────────────────────────────────────

type ExternalFilter = 'all' | 'dbt' | 'view';

// ── Table detail (shared by warehouse drill + external model drill) ──────────

type TableTab = 'schema' | 'preview' | 'used-by';

const TABLE_TABS = [
  { id: 'schema',  label: 'Schema' },
  { id: 'preview', label: 'Preview' },
  { id: 'used-by', label: 'Used by' },
];

const SAMPLE_COLS = [
  { name: 'order_id',         type: 'varchar', notes: 'Primary key' },
  { name: 'user_id',          type: 'varchar', notes: 'Foreign key → users' },
  { name: 'campaign_id',      type: 'varchar', notes: 'Foreign key · 18% null' },
  { name: 'order_date',       type: 'date',    notes: '' },
  { name: 'amount',           type: 'number',  notes: 'In USD' },
  { name: 'product_category', type: 'varchar', notes: '' },
  { name: 'region',           type: 'varchar', notes: '' },
  { name: 'status',           type: 'varchar', notes: 'completed / returned / pending' },
];

const SAMPLE_ROWS: (string | null)[][] = [
  ['ORD-00231', 'usr_8821',  'cam-014', '2024-04-12', '$ 142.40', 'Electronics', 'AMER', 'completed'],
  ['ORD-00232', 'usr_4419',  'cam-014', '2024-04-12', '$  68.00', 'Apparel',     'EMEA', 'completed'],
  ['ORD-00233', 'usr_1108',  null,      '2024-04-12', '$ 218.00', 'Home',        'AMER', 'completed'],
  ['ORD-00234', 'usr_7762',  'cam-021', '2024-04-12', '$  34.50', 'Beauty',      'APAC', 'returned'],
  ['ORD-00235', 'usr_3380',  'cam-019', '2024-04-12', '$ 990.00', 'Electronics', 'AMER', 'completed'],
];

interface ColumnRow extends Record<string, unknown> { id: string; idx: number; name: string; type: string; notes: string }
interface PreviewRow extends Record<string, unknown> { id: string; [colName: string]: string | null | number }
interface UsedByRow extends Record<string, unknown> { id: string; name: string; kind: string; owner: string; updated: string }

const TableDetail: React.FC<{
  conn:     WarehouseConnection;
  schema:   FlatSchema;
  table:    WarehouseTable;
  ctaLabel?: string;
}> = ({ conn, schema, table, ctaLabel = 'Explore in a project' }) => {
  const [tab, setTab] = useState<TableTab>('schema');
  const subtitle = `${conn.name} · ${schema.label} · ${table.rows ?? '—'} rows · ${table.cols ?? '—'} cols · synced ${table.sync ?? '—'}`;

  const columnRows: ColumnRow[] = SAMPLE_COLS.map((col, i) => ({
    id: col.name, idx: i + 1, name: col.name, type: col.type, notes: col.notes,
  }));
  const columnTableCols: TableColumn<ColumnRow>[] = [
    { key: 'idx',  label: '#', width: '50px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-tertiary'], fontSize: fs.xs }}>{row.idx}</span> },
    { key: 'name', label: 'Name',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-primary'], fontSize: fs.sm, fontWeight: fw.medium }}>{row.name}</span> },
    { key: 'type', label: 'Type', width: '140px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-secondary'], fontSize: fs.sm }}>{row.type}</span> },
    { key: 'notes', label: 'Notes',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-secondary'], fontSize: fs.sm }}>{row.notes}</span> },
  ];

  const previewRows: PreviewRow[] = SAMPLE_ROWS.map((row, i) => {
    const obj: PreviewRow = { id: `r${i}` };
    SAMPLE_COLS.forEach((col, ci) => { obj[col.name] = row[ci]; });
    return obj;
  });
  const previewTableCols: TableColumn<PreviewRow>[] = SAMPLE_COLS.map(col => ({
    key:   col.name,
    label: col.name,
    render: (_v, row) => {
      const v = row[col.name];
      if (v === null || v === undefined) {
        return <em style={{ fontFamily: ff.primary, color: c['content-tertiary'], fontSize: fs.xs }}>NULL</em>;
      }
      return <span style={{ fontFamily: ff.primary, color: c['content-primary'], fontSize: fs.sm }}>{v}</span>;
    },
  }));

  const usedByData: UsedByRow[] = [
    { id: 'm1', name: 'Campaign Attribution Model', kind: 'Model',     owner: 'Alex Kim',  updated: '2 days ago' },
    { id: 'l1', name: 'Q4 Revenue Liveboard',       kind: 'Liveboard', owner: 'Priya M.',  updated: 'last week'  },
    { id: 'm2', name: 'Marketing Performance',      kind: 'Model',     owner: 'Marcus J.', updated: 'last week'  },
    { id: 'm3', name: 'Customer 360',               kind: 'Model',     owner: 'Sarah C.',  updated: '3 weeks ago' },
  ];
  const usedByCols: TableColumn<UsedByRow>[] = [
    { key: 'name', label: 'Name',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-brand'], fontWeight: fw.medium }}>{row.name}</span> },
    { key: 'kind', label: 'Kind', width: '140px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-secondary'] }}>{row.kind}</span> },
    { key: 'owner', label: 'Owner', width: '160px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-secondary'] }}>{row.owner}</span> },
    { key: 'updated', label: 'Updated', width: '180px',
      render: (_v, row) => <span style={{ fontFamily: ff.primary, color: c['content-tertiary'], fontSize: fs.xs }}>Updated {row.updated}</span> },
  ];

  return (
    <>
      <PageHeader
        icon={<TableTypeIcon table={table} size="l" />}
        title={table.name}
        subtitle={subtitle}
        actions={<Button variant="primary" size="basic">Use in project</Button>}
      />

      <div style={{ flexShrink: 0, padding: `0 ${sp.G}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        <Tabs tabs={TABLE_TABS} activeTab={tab} onTabChange={(id) => setTab(id as TableTab)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        {tab === 'schema' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp.E }}>
            <Card>
              <Table<ColumnRow> columns={columnTableCols} data={columnRows} rowKey="id" hoverable />
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
              <Card>
                <div style={{ padding: sp.D }}>
                  <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C }}>About</div>
                  <p style={{ ...ts.bodyNormal, margin: 0, color: c['content-secondary'], fontFamily: ff.primary }}>
                    {table.description ?? `${typeLabelFor(table)} from ${TYPE_LABEL[conn.type]}.`}
                  </p>
                </div>
              </Card>

              <Card>
                <div style={{ padding: sp.D }}>
                  <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C }}>Properties</div>
                  {[
                    ['Type',        typeLabelFor(table)],
                    ['Rows',        table.rows ?? '—'],
                    ['Columns',     table.cols !== undefined ? String(table.cols) : '—'],
                    ['Last synced', table.sync ?? '—'],
                    ...(table.tests ? [['Tests', table.tests]] : []),
                  ].map(([k, v]) => (
                    <div key={k as string} style={{ ...ts.footnote, display: 'grid', gridTemplateColumns: '110px 1fr', padding: `${sp.A + 1}px 0`, fontFamily: ff.primary }}>
                      <div style={{ color: c['content-tertiary'] }}>{k}</div>
                      <div style={{ color: c['content-primary'] }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {isDbt(table) && (
                <>
                  <Card>
                    <div style={{ padding: sp.D }}>
                      <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C }}>dbt</div>
                      {[
                        ['Project',      table.dbtProject ?? '—'],
                        ['Materialized', table.materialization ?? '—'],
                        ['Schedule',     table.dbtSchedule ?? '—'],
                        ['Last build',   table.sync ?? '—'],
                        ['Tests',        table.tests ?? '—'],
                      ].map(([k, v]) => (
                        <div key={k as string} style={{ ...ts.footnote, display: 'grid', gridTemplateColumns: '110px 1fr', padding: `${sp.A + 1}px 0`, fontFamily: ff.primary }}>
                          <div style={{ color: c['content-tertiary'] }}>{k}</div>
                          <div style={{ color: c['content-primary'] }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {table.sources && table.sources.length > 0 && (
                    <Card>
                      <div style={{ padding: sp.D }}>
                        <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C }}>Built from</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                          {table.sources.map(src => (
                            <div key={src} style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                              <Icon name="save-worksheet" size="s" color={c['content-tertiary']} />
                              <span style={{ fontFamily: ff.primary, fontSize: fs.sm, color: c['content-primary'] }}>{src}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'preview' && (
          <Card>
            <div style={{ padding: sp.D }}>
              <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C, fontFamily: ff.primary }}>
                First {SAMPLE_ROWS.length} of {table.rows ?? '—'} rows
              </div>
              <Table<PreviewRow> columns={previewTableCols} data={previewRows} rowKey="id" hoverable={false} />
            </div>
          </Card>
        )}

        {tab === 'used-by' && (
          <Card>
            <div style={{ padding: sp.D }}>
              <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C, fontFamily: ff.primary }}>
                Used by 4 ThoughtSpot Models &amp; Liveboards
              </div>
              <Table<UsedByRow> columns={usedByCols} data={usedByData} rowKey="id" hoverable />
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

// ── Warehouses tab ───────────────────────────────────────────────────────────

type WarehouseSel =
  | { kind: 'warehouse' }
  | { kind: 'schema';   schemaKey: string }
  | { kind: 'table';    schemaKey: string; tableId: string };

// Filter helper for tree search: keeps a schema if its label matches OR any
// table inside it does. Returned tables are filtered to only the matching ones
// (unless the schema name matched, in which case all tables are kept).
function filterSchemasBySearch(schemas: FlatSchema[], query: string): FlatSchema[] {
  const q = query.trim().toLowerCase();
  if (!q) return schemas;
  return schemas
    .map(s => {
      const schemaMatches = s.label.toLowerCase().includes(q) || s.schemaName.toLowerCase().includes(q);
      if (schemaMatches) return s;
      return { ...s, tables: s.tables.filter(t => t.name.toLowerCase().includes(q)) };
    })
    .filter(s => s.tables.length > 0 || s.label.toLowerCase().includes(q));
}

// Left tree — scoped to a single warehouse. Top of the tree carries the
// warehouse switcher (always visible — gives the chevron affordance even when
// only one warehouse exists) and a search field that filters the tree below.
const WarehouseTree: React.FC<{
  conn:       WarehouseConnection;
  warehouses: WarehouseConnection[];
  rawSchemas: FlatSchema[];
  selection:  WarehouseSel;
  onSelect:   (s: WarehouseSel) => void;
  onSwitch:   (id: string) => void;
}> = ({ conn, warehouses, rawSchemas, selection, onSelect, onSwitch }) => {
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    rawSchemas.length > 0 ? { [rawSchemas[0].key]: true } : {}
  );
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  const visibleSchemas = useMemo(() => {
    const filtered = filterSchemasBySearch(rawSchemas, search);
    // While searching, force-expand schemas with matches so the user sees results.
    return filtered;
  }, [rawSchemas, search]);

  const itemBase: React.CSSProperties = {
    width: '100%', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: sp.B,
    fontFamily: ff.primary, textAlign: 'left' as const,
  };

  const isSearchActive = search.trim().length > 0;

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      backgroundColor: c['background-base'],
      borderRight: `1px solid ${c['border-divider']}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Warehouse switcher */}
      <div style={{ padding: sp.C, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <Select
          options={warehouses.map(w => ({ id: w.id, label: w.name }))}
          value={conn.id}
          onChange={onSwitch}
          size="basic"
          fullWidth
        />
        <div style={{ ...ts.footnote, color: c['content-tertiary'], fontFamily: ff.primary, marginTop: sp.A + 2 }}>
          {TYPE_LABEL[conn.type]} · synced 2h ago
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: sp.C, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <SearchInput
          placeholder="Search schemas and tables…"
          value={search}
          onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.B}px 0` }}>
        {visibleSchemas.length === 0 && (
          <div style={{ ...ts.footnote, color: c['content-tertiary'], fontFamily: ff.primary, textAlign: 'center', padding: sp.D }}>
            No matches.
          </div>
        )}
        {visibleSchemas.map(s => {
          const sOpen     = isSearchActive ? true : !!expanded[s.key];
          const sSelected = selection.kind === 'schema' && selection.schemaKey === s.key;
          return (
            <div key={s.key}>
              <button
                onClick={() => { toggle(s.key); onSelect({ kind: 'schema', schemaKey: s.key }); }}
                style={{
                  ...itemBase,
                  padding: `${sp.A + 2}px ${sp.C}px`,
                  backgroundColor: sSelected ? c['background-information'] : 'transparent',
                  color: sSelected ? c['content-brand'] : c['content-primary'],
                  fontSize: fs.sm,
                  fontWeight: sSelected ? fw.medium : fw.regular,
                }}
              >
                <Icon name={sOpen ? 'chevron-down' : 'chevron-right'} size="s" color={c['content-tertiary']} />
                <Icon name="folder" size="s" color={sSelected ? c['content-brand'] : c['content-secondary']} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{s.tables.length}</span>
              </button>
              {sOpen && s.tables.map(t => {
                const tSelected = selection.kind === 'table' && selection.schemaKey === s.key && selection.tableId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelect({ kind: 'table', schemaKey: s.key, tableId: t.id })}
                    style={{
                      ...itemBase,
                      padding: `${sp.A + 1}px ${sp.C}px ${sp.A + 1}px ${sp.G}px`,
                      backgroundColor: tSelected ? c['background-information'] : 'transparent',
                      color: tSelected ? c['content-brand'] : c['content-primary'],
                      fontSize: fs.sm,
                    }}
                  >
                    <TableTypeIcon table={t} size="s" />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Initial / on-switch selection for a warehouse: open on the first schema so
// the tree shows it highlighted and the right pane has tables to look at.
function firstSchemaSelection(conn: WarehouseConnection | undefined): WarehouseSel {
  if (!conn) return { kind: 'warehouse' };
  const schemas = flattenSchemas(conn).map(s => ({ ...s, tables: s.tables.filter(isRawTable) }));
  return schemas.length > 0 ? { kind: 'schema', schemaKey: schemas[0].key } : { kind: 'warehouse' };
}

const WarehousesView: React.FC = () => {
  const [warehouseId, setWarehouseId] = useState(RAW_WAREHOUSES[0]?.id ?? '');
  const [sel, setSel] = useState<WarehouseSel>(() => firstSchemaSelection(RAW_WAREHOUSES[0]));

  const conn = RAW_WAREHOUSES.find(w => w.id === warehouseId) ?? RAW_WAREHOUSES[0];

  const allSchemas = useMemo(() => conn ? flattenSchemas(conn) : [], [conn]);
  const rawSchemas = useMemo(() => allSchemas.map(s => ({ ...s, tables: s.tables.filter(isRawTable) })), [allSchemas]);

  if (!conn) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c['background-sunken'] }}>
        <div style={{ ...ts.bodyNormal, color: c['content-secondary'], fontFamily: ff.primary }}>No warehouses connected.</div>
      </div>
    );
  }

  const schema = sel.kind !== 'warehouse'
    ? rawSchemas.find(s => s.key === sel.schemaKey)
    : undefined;
  const table  = sel.kind === 'table' && schema
    ? schema.tables.find(t => t.id === sel.tableId)
    : undefined;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <WarehouseTree
        key={conn.id}
        conn={conn}
        warehouses={RAW_WAREHOUSES}
        rawSchemas={rawSchemas}
        selection={sel}
        onSelect={setSel}
        onSwitch={(id) => {
          setWarehouseId(id);
          setSel(firstSchemaSelection(RAW_WAREHOUSES.find(w => w.id === id)));
        }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {sel.kind === 'warehouse' && (
          <WarehouseHome
            conn={conn} rawSchemas={rawSchemas}
            onPickSchema={(key) => setSel({ kind: 'schema', schemaKey: key })}
          />
        )}
        {sel.kind === 'schema' && schema && (
          <>
            <PageHeader
              icon={<Icon name="folder" size="l" color={c['content-secondary']} />}
              title={schema.label}
              subtitle={`${conn.name} · ${schema.tables.length} tables`}
            />
            <SchemaHome
              schema={schema}
              onPickTable={(id) => setSel({ kind: 'table', schemaKey: schema.key, tableId: id })}
            />
          </>
        )}
        {sel.kind === 'table' && schema && table && (
          <TableDetail conn={conn} schema={schema} table={table} />
        )}
      </div>
    </div>
  );
};

// ── External Models tab ──────────────────────────────────────────────────────
// Same split-view pattern as Warehouses (list-left, detail-right, no breadcrumb).
// Top toolbar: filter pills on the left, search on the right.

const ExternalModelsView: React.FC<{ entries: ExternalEntry[] }> = ({ entries }) => {
  const [filter, setFilter]         = useState<ExternalFilter>('all');
  const [search, setSearch]         = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dbtCount  = useMemo(() => entries.filter(e => isDbt(e.table)).length, [entries]);
  const viewCount = useMemo(() => entries.filter(e => isSemanticView(e.table)).length, [entries]);

  const visible = useMemo(() => {
    let result = entries;
    if (filter === 'dbt')  result = result.filter(e => isDbt(e.table));
    if (filter === 'view') result = result.filter(e => isSemanticView(e.table));
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(e =>
        e.table.name.toLowerCase().includes(q) ||
        (e.table.description?.toLowerCase().includes(q) ?? false) ||
        e.connection.name.toLowerCase().includes(q) ||
        e.schema.dbName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, filter, search]);

  // Effective selection: keep the user's pick if it's still visible, otherwise
  // fall back to the first visible row so the detail pane is always populated.
  const effectiveId = selectedId && visible.find(e => e.ref.tableId === selectedId)
    ? selectedId
    : visible[0]?.ref.tableId ?? null;
  const selected = visible.find(e => e.ref.tableId === effectiveId);

  const FILTERS: { id: ExternalFilter; label: string }[] = [
    { id: 'all',  label: `All (${entries.length})` },
    { id: 'dbt',  label: `dbt models (${dbtCount})` },
    { id: 'view', label: `Semantic views (${viewCount})` },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top toolbar — filter pills (left) + search (right) */}
      <div style={{
        flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: sp.D,
        padding: `${sp.C}px ${sp.D}px`,
        borderBottom: `1px solid ${c['border-divider']}`,
        backgroundColor: c['background-base'],
      }}>
        <div style={{ display: 'flex', gap: sp.A }}>
          {FILTERS.map(f => {
            const active = f.id === filter;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: `${sp.A + 1}px ${sp.C}px`,
                borderRadius: 14,
                border: `1px solid ${active ? c['content-brand'] : c['border-default']}`,
                backgroundColor: active ? c['background-information'] : 'transparent',
                color: active ? c['content-brand'] : c['content-secondary'],
                fontSize: fs.xs, fontFamily: ff.primary, cursor: 'pointer',
                fontWeight: active ? fw.medium : fw.regular,
              }}>{f.label}</button>
            );
          })}
        </div>
        <div style={{ width: 280 }}>
          <SearchInput
            placeholder="Search external models…"
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Body — list (left) + detail (right) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 280, flexShrink: 0,
          backgroundColor: c['background-base'],
          borderRight: `1px solid ${c['border-divider']}`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.B}px 0` }}>
            {visible.length === 0 && (
              <div style={{ ...ts.footnote, color: c['content-tertiary'], fontFamily: ff.primary, textAlign: 'center', padding: sp.D }}>
                No matches.
              </div>
            )}
            {visible.map(e => {
              const sel = e.ref.tableId === effectiveId;
              return (
                <button
                  key={e.ref.tableId}
                  onClick={() => setSelectedId(e.ref.tableId)}
                  style={{
                    width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' as const,
                    padding: `${sp.B}px ${sp.C}px`,
                    backgroundColor: sel ? c['background-information'] : 'transparent',
                    fontFamily: ff.primary,
                    display: 'flex', alignItems: 'flex-start', gap: sp.B,
                  }}
                >
                  <span style={{ paddingTop: 2 }}><TableTypeIcon table={e.table} size="s" /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: sel ? c['content-brand'] : c['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.table.name}
                    </div>
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1 }}>
                      {typeLabelFor(e.table)} · {e.connection.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selected ? (
            <TableDetail
              conn={selected.connection} schema={selected.schema} table={selected.table}
              ctaLabel="Sync now"
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c['background-sunken'], color: c['content-tertiary'], fontFamily: ff.primary, fontSize: fs.sm }}>
              No external models match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Top-level page ───────────────────────────────────────────────────────────

const DataBrowserPage: React.FC = () => {
  const [topTab, setTopTab] = useState<TopTab>('warehouses');
  const externalEntries = useMemo(() => getAllExternalModels(), []);

  return (
    // Outer wrapper — gray gutter around the framed content.
    <div style={{
      flex: 1,
      backgroundColor: c['background-sunken'],
      padding: sp.D,
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* Framed container — white card with rounded corners and a subtle border. */}
      <div style={{
        flex: 1,
        backgroundColor: c['background-base'],
        borderRadius: 12,
        border: `1px solid ${c['border-divider']}`,
        boxShadow: '0 1px 2px rgba(25, 35, 49, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <TopTabStrip active={topTab} onChange={setTopTab} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {topTab === 'warehouses'      && <WarehousesView />}
          {topTab === 'external-models' && <ExternalModelsView entries={externalEntries} />}
        </div>
      </div>
    </div>
  );
};

export default DataBrowserPage;
