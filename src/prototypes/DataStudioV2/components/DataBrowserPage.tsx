import React, { useMemo, useState } from 'react';
import { c, sp, fs, fw, ff, ts } from '../styles';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { SearchInput } from '../../../components/SearchInput';
import { Tabs } from '../../../components/Tabs';
import {
  WAREHOUSE_TREE,
  WarehouseConnection,
  WarehouseTable,
  WarehouseTableType,
} from '../data/mockData';

// ── Brand colors (no design-system tokens for source-system identity) ────────
// Keep narrow + named so any future re-use is intentional.
const BRAND = {
  snowflake: '#29B5E8',
  dbt:       '#FF694A',
} as const;

const TYPE_LABEL: Record<WarehouseConnection['type'], string> = {
  snowflake: 'Snowflake',
  dbt:       'dbt',
};

// Each (db, schema) pair becomes a single browser node — our canonical mock has
// one schema per database, so flattening keeps the drill-down to 3 levels.
interface FlatSchema {
  key:        string;   // `${dbId}/${schemaId}` — selection key
  dbId:       string;
  dbName:     string;
  schemaId:   string;
  schemaName: string;
  label:      string;   // `${dbName} · ${schemaName}`
  tables:     WarehouseTable[];
}

function flattenSchemas(conn: WarehouseConnection): FlatSchema[] {
  return conn.databases.flatMap(db =>
    db.schemas.map(s => ({
      key:        `${db.id}/${s.id}`,
      dbId:       db.id,
      dbName:     db.name,
      schemaId:   s.id,
      schemaName: s.name,
      label:      `${db.name} · ${s.name}`,
      tables:     s.tables,
    }))
  );
}

// ── Selection model ──────────────────────────────────────────────────────────

type Selection =
  | { kind: 'warehouse'; connId: string }
  | { kind: 'schema';    connId: string; schemaKey: string }
  | { kind: 'table';     connId: string; schemaKey: string; tableId: string };

const isDbt = (t: WarehouseTable) => t.type === 'dbt_model';

// ── Logo ─────────────────────────────────────────────────────────────────────

const Logo: React.FC<{ kind: WarehouseConnection['type']; size?: number }> = ({ kind, size = 20 }) => {
  const bg    = kind === 'snowflake' ? BRAND.snowflake : BRAND.dbt;
  const label = kind === 'snowflake' ? 'S' : 'd';
  return (
    <div style={{
      width: size, height: size, borderRadius: 4,
      backgroundColor: bg, color: c['background-base'],
      fontSize: size * 0.5, fontWeight: fw.medium,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{label}</div>
  );
};

const TableGlyph: React.FC<{ table: WarehouseTable; size?: number }> = ({ table, size = 12 }) => {
  if (isDbt(table))                  return <span style={{ fontSize: size, color: BRAND.dbt }}>◆</span>;
  if (table.type === 'semantic_view') return <span style={{ fontSize: size, color: c['content-brand'] }}>◎</span>;
  return <span style={{ fontSize: size, color: c['content-tertiary'] }}>▦</span>;
};

// ── Tree (left pane) ─────────────────────────────────────────────────────────

const Tree: React.FC<{ selection: Selection; onSelect: (s: Selection) => void }> = ({ selection, onSelect }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [WAREHOUSE_TREE[0].id]: true,
    [`${WAREHOUSE_TREE[0].id}:${WAREHOUSE_TREE[0].databases[0].id}/${WAREHOUSE_TREE[0].databases[0].schemas[0].id}`]: true,
  });
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  const itemBase: React.CSSProperties = {
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: sp.A + 2,
    fontFamily: ff.primary,
    textAlign: 'left' as const,
  };

  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      backgroundColor: c['background-base'],
      borderRight: `1px solid ${c['border-divider']}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: sp.C, borderBottom: `1px solid ${c['border-divider']}` }}>
        <SearchInput placeholder="Search data..." />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.B}px 0` }}>
        {WAREHOUSE_TREE.map(conn => {
          const connOpen = expanded[conn.id];
          const connSelected = selection.kind === 'warehouse' && selection.connId === conn.id;
          const flatSchemas = flattenSchemas(conn);
          return (
            <div key={conn.id}>
              <button
                onClick={() => { toggle(conn.id); onSelect({ kind: 'warehouse', connId: conn.id }); }}
                style={{
                  ...itemBase,
                  padding: `${sp.A + 2}px ${sp.C}px`,
                  backgroundColor: connSelected ? c['background-information'] : 'transparent',
                  color: connSelected ? c['content-brand'] : c['content-primary'],
                  fontSize: fs.sm,
                  fontWeight: fw.medium,
                }}
              >
                <span style={{ fontSize: 9, color: c['content-tertiary'], width: 8 }}>{connOpen ? '▾' : '▸'}</span>
                <Logo kind={conn.type} size={16} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.name}</span>
              </button>
              {connOpen && flatSchemas.map(fs0 => {
                const sKey = `${conn.id}:${fs0.key}`;
                const sOpen = expanded[sKey];
                const sSelected = selection.kind === 'schema' && selection.connId === conn.id && selection.schemaKey === fs0.key;
                return (
                  <div key={fs0.key}>
                    <button
                      onClick={() => { toggle(sKey); onSelect({ kind: 'schema', connId: conn.id, schemaKey: fs0.key }); }}
                      style={{
                        ...itemBase,
                        padding: `${sp.A + 1}px ${sp.C}px ${sp.A + 1}px ${sp.E}px`,
                        backgroundColor: sSelected ? c['background-information'] : 'transparent',
                        color: sSelected ? c['content-brand'] : c['content-primary'],
                        fontSize: fs.xs,
                        fontWeight: sSelected ? fw.medium : fw.regular,
                      }}
                    >
                      <span style={{ fontSize: 9, color: c['content-tertiary'], width: 8 }}>{sOpen ? '▾' : '▸'}</span>
                      <span style={{ fontFamily: ff.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fs0.label}</span>
                      <span style={{ fontSize: 10, color: c['content-tertiary'] }}>{fs0.tables.length}</span>
                    </button>
                    {sOpen && fs0.tables.map(t => {
                      const tSelected = selection.kind === 'table' && selection.connId === conn.id && selection.schemaKey === fs0.key && selection.tableId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => onSelect({ kind: 'table', connId: conn.id, schemaKey: fs0.key, tableId: t.id })}
                          style={{
                            ...itemBase,
                            padding: `${sp.A}px ${sp.C}px ${sp.A}px ${sp.G}px`,
                            backgroundColor: tSelected ? c['background-information'] : 'transparent',
                            color: tSelected ? c['content-brand'] : c['content-primary'],
                            fontSize: fs.xs,
                          }}
                        >
                          <TableGlyph table={t} size={10} />
                          <span style={{ fontFamily: ff.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Page header ──────────────────────────────────────────────────────────────

const PageHeader: React.FC<{
  icon?: React.ReactNode;
  title: string; titleMono?: boolean;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ icon, title, titleMono, subtitle, actions }) => (
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
        <h1 style={{
          ...ts.modalTitle,
          margin: 0,
          color: c['content-primary'],
          fontFamily: titleMono ? ff.mono : ff.primary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</h1>
        {subtitle && <div style={{ ...ts.footnote, color: c['content-secondary'], marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B, flexShrink: 0, alignItems: 'center' }}>{actions}</div>}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...ts.overline, color: c['content-secondary'], marginBottom: sp.C }}>{children}</div>
);

const StatCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card>
    <div style={{ padding: sp.D }}>
      <div style={{ ...ts.footnote, color: c['content-tertiary'] }}>{label}</div>
      <div style={{ ...ts.headlineLarge, fontSize: fs.xl, color: c['content-primary'], marginTop: 2 }}>{value}</div>
    </div>
  </Card>
);

// ── Warehouse view ───────────────────────────────────────────────────────────

const WarehouseView: React.FC<{
  conn: WarehouseConnection;
  flatSchemas: FlatSchema[];
  onPickSchema: (key: string) => void;
}> = ({ conn, flatSchemas, onPickSchema }) => {
  const tableCount = flatSchemas.reduce((s, fs0) => s + fs0.tables.length, 0);
  const dbtCount   = flatSchemas.reduce((s, fs0) => s + fs0.tables.filter(isDbt).length, 0);

  return (
    <>
      <PageHeader
        icon={<Logo kind={conn.type} size={28} />}
        title={conn.name}
        subtitle={`${TYPE_LABEL[conn.type]} · ${flatSchemas.length} schemas · ${tableCount} tables · synced 2h ago`}
      />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp.C, marginBottom: sp.E }}>
          <StatCell label="Schemas"    value={String(flatSchemas.length)} />
          <StatCell label="Tables"     value={String(tableCount)} />
          <StatCell label="dbt models" value={String(dbtCount)} />
          <StatCell label="Last sync"  value="2h ago" />
        </div>

        <SectionLabel>Schemas</SectionLabel>
        <Card>
          {flatSchemas.map((fs0, i) => (
            <div key={fs0.key} onClick={() => onPickSchema(fs0.key)} style={{
              display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 32px', gap: sp.C,
              padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
              fontFamily: ff.primary, fontSize: fs.sm,
            }}>
              <span style={{ color: c['content-tertiary'] }}>▤</span>
              <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{fs0.label}</code>
              <div style={{ color: c['content-secondary'] }}>{fs0.tables.length} tables</div>
              <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{fs0.tables.filter(isDbt).length} dbt models</div>
              <div style={{ color: c['content-tertiary'], fontSize: fs.md }}>›</div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
};

// ── Schema view ──────────────────────────────────────────────────────────────

type SchemaFilter = 'all' | 'tables' | 'dbt' | 'views';

const SchemaView: React.FC<{
  conn:    WarehouseConnection;
  schema:  FlatSchema;
  onPickTable: (id: string) => void;
}> = ({ conn, schema, onPickTable }) => {
  const [filter, setFilter] = useState<SchemaFilter>('all');
  const dbtCount    = schema.tables.filter(isDbt).length;
  const viewCount   = schema.tables.filter(t => t.type === 'semantic_view').length;
  const tableCount  = schema.tables.length - dbtCount - viewCount;

  const visible = useMemo(() => {
    if (filter === 'tables') return schema.tables.filter(t => (!t.type || t.type === 'table'));
    if (filter === 'dbt')    return schema.tables.filter(isDbt);
    if (filter === 'views')  return schema.tables.filter(t => t.type === 'semantic_view');
    return schema.tables;
  }, [filter, schema.tables]);

  const FILTERS: { id: SchemaFilter; label: string }[] = [
    { id: 'all',    label: `All (${schema.tables.length})` },
    { id: 'tables', label: 'Tables' },
    { id: 'dbt',    label: 'dbt models' },
    { id: 'views',  label: 'Views' },
  ];

  return (
    <>
      <PageHeader
        title={schema.label}
        titleMono
        subtitle={`${conn.name} · ${schema.tables.length} objects · ${dbtCount} dbt models`}
      />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, marginBottom: sp.E }}>
          <StatCell label="Tables"     value={String(tableCount)} />
          <StatCell label="dbt models" value={String(dbtCount)} />
          <StatCell label="Last sync"  value="2h ago" />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: sp.A, marginBottom: sp.C }}>
          {FILTERS.map(f => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: `${sp.A + 1}px ${sp.C}px`,
                  borderRadius: 14,
                  border: `1px solid ${active ? c['content-brand'] : c['border-default']}`,
                  backgroundColor: active ? c['background-information'] : 'transparent',
                  color: active ? c['content-brand'] : c['content-secondary'],
                  fontSize: fs.xs, fontFamily: ff.primary, cursor: 'pointer',
                  fontWeight: active ? fw.medium : fw.regular,
                }}
              >{f.label}</button>
            );
          })}
        </div>

        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
            {['', 'Name', 'Type', 'Rows', 'Tests', 'Last sync'].map(h => (
              <div key={h} style={{ ...ts.overline, color: c['content-secondary'], fontFamily: ff.primary }}>{h}</div>
            ))}
          </div>
          {visible.map((t, i) => (
            <div key={t.id} onClick={() => onPickTable(t.id)} style={{
              display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 1fr 1fr', gap: sp.C,
              padding: `${sp.B + 1}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontSize: fs.sm, fontFamily: ff.primary,
            }}>
              <TableGlyph table={t} />
              <div>
                <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{t.name}</code>
                {t.description && <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1, fontFamily: ff.primary }}>{t.description}</div>}
              </div>
              <div style={{ color: c['content-secondary'] }}>
                {isDbt(t) ? 'dbt model' : t.type === 'semantic_view' ? 'Semantic view' : 'Table'}
              </div>
              <div style={{ color: c['content-secondary'] }}>{t.rows ?? '—'}</div>
              <div style={{ color: t.tests ? c['content-success'] : c['content-tertiary'] }}>{t.tests ?? '—'}</div>
              <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{t.sync ?? '—'}</div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
};

// ── Table view ───────────────────────────────────────────────────────────────

type TableTab = 'schema' | 'preview' | 'used-by';

const TABLE_TABS = [
  { id: 'schema',  label: 'Schema' },
  { id: 'preview', label: 'Preview' },
  { id: 'used-by', label: 'Used by' },
];

// Sample columns + rows for the Preview tab — illustrative only, not specific
// to any particular table. Plan accepts this as-is for Step 1.
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

const TableView: React.FC<{
  conn:   WarehouseConnection;
  schema: FlatSchema;
  table:  WarehouseTable;
}> = ({ conn, schema, table }) => {
  const [tab, setTab] = useState<TableTab>('schema');
  const subtitle = `${conn.name} · ${schema.label} · ${table.rows ?? '—'} rows · ${table.cols ?? '—'} cols · synced ${table.sync ?? '—'}`;

  return (
    <>
      <PageHeader
        icon={<TableGlyph table={table} size={20} />}
        title={table.name}
        titleMono
        subtitle={subtitle}
        actions={<>
          <Button variant="tertiary" iconOnly icon="refresh" aria-label="Refresh" />
          <Button variant="tertiary" iconOnly icon="more-horizontal" aria-label="More actions" />
          <Button variant="primary"  size="basic">Build a model</Button>
        </>}
      />

      <div style={{ flexShrink: 0, padding: `0 ${sp.G}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        <Tabs tabs={TABLE_TABS} activeTab={tab} onTabChange={(id) => setTab(id as TableTab)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>

        {tab === 'schema' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp.E }}>
            <Card>
              <div style={{ padding: sp.D }}>
                <SectionLabel>Columns ({SAMPLE_COLS.length})</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1.6fr 1fr 2fr', gap: sp.C, padding: `${sp.A}px 0`, borderBottom: `1px solid ${c['background-subtle']}` }}>
                  {['', 'Name', 'Type', 'Notes'].map(h => (
                    <div key={h} style={{ ...ts.overline, color: c['content-tertiary'] }}>{h}</div>
                  ))}
                </div>
                {SAMPLE_COLS.map((col, i) => (
                  <div key={col.name} style={{
                    display: 'grid', gridTemplateColumns: '40px 1.6fr 1fr 2fr', gap: sp.C,
                    padding: `${sp.B}px 0`, alignItems: 'center',
                    borderBottom: i < SAMPLE_COLS.length - 1 ? `1px solid ${c['background-subtle']}` : 'none',
                  }}>
                    <span style={{ ...ts.footnote, color: c['content-tertiary'] }}>{i + 1}</span>
                    <code style={{ fontFamily: ff.mono, fontSize: fs.sm, color: c['content-primary'] }}>{col.name}</code>
                    <span style={{ ...ts.footnote, color: c['content-tertiary'] }}>{col.type}</span>
                    <span style={{ ...ts.footnote, color: c['content-secondary'] }}>{col.notes}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
              <Card>
                <div style={{ padding: sp.D }}>
                  <SectionLabel>About</SectionLabel>
                  <p style={{ ...ts.bodyNormal, margin: 0, color: c['content-secondary'] }}>
                    {table.description ?? `${isDbt(table) ? 'dbt model' : 'Source table'} from ${TYPE_LABEL[conn.type]}.`}
                  </p>
                </div>
              </Card>

              <Card>
                <div style={{ padding: sp.D }}>
                  <SectionLabel>Properties</SectionLabel>
                  {[
                    ['Type',        isDbt(table) ? 'dbt model' : table.type === 'semantic_view' ? 'Semantic view' : 'Table'],
                    ['Rows',        table.rows ?? '—'],
                    ['Columns',     table.cols !== undefined ? String(table.cols) : '—'],
                    ['Last synced', table.sync ?? '—'],
                    ...(table.tests ? [['Tests', table.tests]] : []),
                  ].map(([k, v]) => (
                    <div key={k as string} style={{ ...ts.footnote, display: 'grid', gridTemplateColumns: '110px 1fr', padding: `${sp.A + 1}px 0` }}>
                      <div style={{ color: c['content-tertiary'] }}>{k}</div>
                      <div style={{ color: c['content-primary'] }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {isDbt(table) && (
                <Card>
                  <div style={{ padding: sp.D }}>
                    <SectionLabel>dbt</SectionLabel>
                    {[
                      ['Project',      'analytics'],
                      ['Materialized', 'table'],
                      ['Last build',   '2h ago'],
                    ].map(([k, v]) => (
                      <div key={k as string} style={{ ...ts.footnote, display: 'grid', gridTemplateColumns: '110px 1fr', padding: `${sp.A + 1}px 0` }}>
                        <div style={{ color: c['content-tertiary'] }}>{k}</div>
                        <div style={{ color: c['content-primary'] }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'preview' && (
          <Card>
            <div style={{ padding: sp.D }}>
              <SectionLabel>First 5 of {table.rows ?? '—'} rows</SectionLabel>
              <div style={{ overflowX: 'auto', marginTop: sp.B }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff.primary }}>
                  <thead>
                    <tr>
                      {SAMPLE_COLS.map(col => (
                        <th key={col.name} style={{ ...ts.overline, color: c['content-tertiary'], textAlign: 'left' as const, padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap' }}>
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ROWS.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ ...ts.bodyNormal, color: cell === null ? c['content-tertiary'] : c['content-primary'], padding: `${sp.B}px ${sp.C}px`, borderBottom: ri < SAMPLE_ROWS.length - 1 ? `1px solid ${c['background-subtle']}` : 'none', whiteSpace: 'nowrap', fontFamily: typeof cell === 'string' && /^\d|ORD|usr|cam/.test(cell) ? ff.mono : ff.primary }}>
                            {cell === null ? <em style={{ ...ts.footnote, color: c['content-tertiary'] }}>NULL</em> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ ...ts.footnote, color: c['content-tertiary'], marginTop: sp.D }}>
                Showing 5 sample rows
              </div>
            </div>
          </Card>
        )}

        {tab === 'used-by' && (
          <Card>
            <div style={{ padding: sp.D }}>
              <SectionLabel>Used by 4 ThoughtSpot Models &amp; Liveboards</SectionLabel>
              {[
                { name: 'Campaign Attribution Model', kind: 'Model',     owner: 'Alex Kim',  updated: '2 days ago' },
                { name: 'Q4 Revenue Liveboard',       kind: 'Liveboard', owner: 'Priya M.',  updated: 'last week'  },
                { name: 'Marketing Performance',      kind: 'Model',     owner: 'Marcus J.', updated: 'last week'  },
                { name: 'Customer 360',               kind: 'Model',     owner: 'Sarah C.',  updated: '3 weeks ago' },
              ].map((u, i, arr) => (
                <div key={u.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.C}px 0`, alignItems: 'center', borderBottom: i < arr.length - 1 ? `1px solid ${c['background-subtle']}` : 'none' }}>
                  <div style={{ ...ts.bodyNormal, color: c['content-brand'] }}>{u.name}</div>
                  <div style={{ ...ts.footnote, color: c['content-secondary'] }}>{u.kind}</div>
                  <div style={{ ...ts.footnote, color: c['content-secondary'] }}>{u.owner}</div>
                  <div style={{ ...ts.footnote, color: c['content-tertiary'] }}>Updated {u.updated}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </>
  );
};

// ── Top-level page ───────────────────────────────────────────────────────────

const DataBrowserPage: React.FC = () => {
  const [selection, setSelection] = useState<Selection>({ kind: 'warehouse', connId: WAREHOUSE_TREE[0].id });

  const conn = WAREHOUSE_TREE.find(x => x.id === selection.connId) ?? WAREHOUSE_TREE[0];
  const flatSchemas = useMemo(() => flattenSchemas(conn), [conn]);
  const schema = selection.kind !== 'warehouse'
    ? flatSchemas.find(s => s.key === selection.schemaKey)
    : undefined;
  const table = selection.kind === 'table' && schema
    ? schema.tables.find(t => t.id === selection.tableId)
    : undefined;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <Tree selection={selection} onSelect={setSelection} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selection.kind === 'warehouse' && (
          <WarehouseView
            conn={conn}
            flatSchemas={flatSchemas}
            onPickSchema={(key) => setSelection({ kind: 'schema', connId: conn.id, schemaKey: key })}
          />
        )}
        {selection.kind === 'schema' && schema && (
          <SchemaView
            conn={conn}
            schema={schema}
            onPickTable={(id) => setSelection({ kind: 'table', connId: conn.id, schemaKey: schema.key, tableId: id })}
          />
        )}
        {selection.kind === 'table' && schema && table && (
          <TableView conn={conn} schema={schema} table={table} />
        )}
      </div>
    </div>
  );
};

export default DataBrowserPage;
