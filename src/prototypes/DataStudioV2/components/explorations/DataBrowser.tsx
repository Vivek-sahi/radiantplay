import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { SearchInput } from '../../../../components/SearchInput';
import Shell from '../Shell';
import { SubStateBar } from './ExplorationFrame';

// ── Mock data ────────────────────────────────────────────────────────────────

interface TableNode  { name: string; rows: string; cols: number; sync: string; isDbt?: boolean; tests?: string; description?: string; }
interface SchemaNode { name: string; tables: TableNode[]; }
interface ConnNode   { id: string; name: string; type: string; schemas: SchemaNode[]; }

const TREE: ConnNode[] = [
  {
    id: 'snow', name: 'snowflake-prod', type: 'Snowflake',
    schemas: [
      { name: 'ANALYTICS', tables: [
        { name: 'orders',         rows: '12.4M', cols: 22, sync: '2h ago', description: 'All customer orders placed via the platform.' },
        { name: 'campaigns',      rows: '8.2K',  cols: 18, sync: '2h ago', description: 'Marketing campaigns by channel and budget.' },
        { name: 'users',          rows: '142K',  cols: 24, sync: '2h ago', description: 'Registered platform users.' },
        { name: 'sessions',       rows: '88M',   cols: 14, sync: '2h ago' },
        { name: 'fct_revenue',    rows: '4.6M',  cols: 12, sync: '2h ago', isDbt: true, tests: '8 / 8 passing', description: 'dbt model · revenue fact built from orders + returns.' },
        { name: 'dim_customers',  rows: '142K',  cols: 16, sync: '2h ago', isDbt: true, tests: '5 / 5 passing', description: 'dbt model · customer dimension.' },
      ] },
      { name: 'FINANCE', tables: [
        { name: 'transactions',   rows: '4.4M', cols: 18, sync: '6h ago' },
        { name: 'budget_targets', rows: '50',   cols: 7,  sync: '6h ago' },
      ] },
    ],
  },
  {
    id: 'bq', name: 'bigquery-marketing', type: 'BigQuery',
    schemas: [{ name: 'mkt_warehouse', tables: [
      { name: 'leads',     rows: '320K', cols: 12, sync: '1h ago' },
      { name: 'campaigns', rows: '4.4K', cols: 16, sync: '1h ago' },
    ] }],
  },
  {
    id: 'files', name: 'uploaded files', type: 'File',
    schemas: [{ name: 'uploads', tables: [
      { name: 'q4_targets.csv', rows: '186', cols: 5, sync: '3 days ago' },
    ] }],
  },
];

// ── Selection model ──────────────────────────────────────────────────────────

type Selection =
  | { kind: 'warehouse'; connId: string }
  | { kind: 'schema';    connId: string; schema: string }
  | { kind: 'table';     connId: string; schema: string; table: string };

const SUBTABS = [
  { id: 'warehouse', label: 'Warehouse view' },
  { id: 'schema',    label: 'Schema view' },
  { id: 'table',     label: 'Table view' },
];

const Logo: React.FC<{ kind: string; size?: number }> = ({ kind, size = 20 }) => {
  const palette: Record<string, string> = { Snowflake: '#29B5E8', BigQuery: '#4285F4', File: '#6B7280' };
  return (
    <div style={{
      width: size, height: size, borderRadius: 4,
      backgroundColor: palette[kind] ?? c['background-subtle'],
      color: 'white', fontSize: size * 0.5, fontWeight: fw.bold,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{kind[0]}</div>
  );
};

// ── Tree ─────────────────────────────────────────────────────────────────────

const Tree: React.FC<{ selection: Selection; onSelect: (s: Selection) => void }> = ({ selection, onSelect }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'snow': true, 'snow:ANALYTICS': true,
  });
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  const itemBase: React.CSSProperties = {
    width: '100%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
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
        {TREE.map(conn => {
          const connOpen = expanded[conn.id];
          const connSelected = selection.kind === 'warehouse' && selection.connId === conn.id;
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
                  fontWeight: connSelected ? fw.semibold : fw.medium,
                }}
              >
                <span style={{ fontSize: 9, color: c['content-tertiary'], width: 8 }}>{connOpen ? '▾' : '▸'}</span>
                <Logo kind={conn.type} size={16} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.name}</span>
              </button>
              {connOpen && conn.schemas.map(s => {
                const schemaKey = `${conn.id}:${s.name}`;
                const schemaOpen = expanded[schemaKey];
                const schemaSelected = selection.kind === 'schema' && selection.connId === conn.id && selection.schema === s.name;
                return (
                  <div key={s.name}>
                    <button
                      onClick={() => { toggle(schemaKey); onSelect({ kind: 'schema', connId: conn.id, schema: s.name }); }}
                      style={{
                        ...itemBase,
                        padding: `${sp.A + 1}px ${sp.C}px ${sp.A + 1}px ${sp.E}px`,
                        backgroundColor: schemaSelected ? c['background-information'] : 'transparent',
                        color: schemaSelected ? c['content-brand'] : c['content-primary'],
                        fontSize: fs.xs,
                        fontWeight: schemaSelected ? fw.semibold : fw.regular,
                      }}
                    >
                      <span style={{ fontSize: 9, color: c['content-tertiary'], width: 8 }}>{schemaOpen ? '▾' : '▸'}</span>
                      <span style={{ fontFamily: ff.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      <span style={{ fontSize: 10, color: c['content-tertiary'] }}>{s.tables.length}</span>
                    </button>
                    {schemaOpen && s.tables.map(t => {
                      const tableSelected = selection.kind === 'table' && selection.connId === conn.id && selection.schema === s.name && selection.table === t.name;
                      return (
                        <button
                          key={t.name}
                          onClick={() => onSelect({ kind: 'table', connId: conn.id, schema: s.name, table: t.name })}
                          style={{
                            ...itemBase,
                            padding: `${sp.A}px ${sp.C}px ${sp.A}px ${sp.G}px`,
                            backgroundColor: tableSelected ? c['background-information'] : 'transparent',
                            color: tableSelected ? c['content-brand'] : c['content-primary'],
                            fontSize: fs.xs,
                          }}
                        >
                          <span style={{ fontSize: 10, color: t.isDbt ? '#FF694A' : c['content-tertiary'], width: 12 }}>{t.isDbt ? '◆' : '▦'}</span>
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

// ── Page header (consistent across views) ───────────────────────────────────

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
          margin: 0, fontSize: 20, fontWeight: fw.semibold,
          color: c['content-primary'],
          fontFamily: titleMono ? ff.mono : ff.primary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</h1>
        {subtitle && <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginTop: 2, fontFamily: ff.primary }}>{subtitle}</div>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B, flexShrink: 0 }}>{actions}</div>}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: fw.semibold,
    color: c['content-secondary'],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    fontFamily: ff.primary,
    marginBottom: sp.C,
  }}>{children}</div>
);

const StatCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Card>
    <div style={{ padding: sp.D, fontFamily: ff.primary }}>
      <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'], marginTop: 2 }}>{value}</div>
    </div>
  </Card>
);

// ── Warehouse view ───────────────────────────────────────────────────────────

const WarehouseView: React.FC<{ conn: ConnNode; onPickSchema: (s: string) => void }> = ({ conn, onPickSchema }) => {
  const tableCount = conn.schemas.reduce((s, sc) => s + sc.tables.length, 0);
  const dbtCount   = conn.schemas.reduce((s, sc) => s + sc.tables.filter(t => t.isDbt).length, 0);

  return (
    <>
      <PageHeader
        icon={<Logo kind={conn.type} size={28} />}
        title={conn.name}
        subtitle={`${conn.type} · ${conn.schemas.length} schemas · ${tableCount} tables · synced 2h ago`}
        actions={<>
          <Button variant="secondary" size="basic">Refresh</Button>
          <Button variant="secondary" size="basic">Settings</Button>
        </>}
      />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: sp.C, marginBottom: sp.E }}>
          <StatCell label="Schemas"    value={String(conn.schemas.length)} />
          <StatCell label="Tables"     value={String(tableCount)} />
          <StatCell label="dbt models" value={String(dbtCount)} />
          <StatCell label="Last sync"  value="2h ago" />
        </div>

        <SectionLabel>Schemas</SectionLabel>
        <Card>
          {conn.schemas.map((s, i) => (
            <div key={s.name} onClick={() => onPickSchema(s.name)} style={{
              display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 32px', gap: sp.C,
              padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
              fontFamily: ff.primary, fontSize: fs.sm,
            }}>
              <span style={{ color: c['content-tertiary'] }}>📁</span>
              <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{s.name}</code>
              <div style={{ color: c['content-secondary'] }}>{s.tables.length} tables</div>
              <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{s.tables.filter(t => t.isDbt).length} dbt models</div>
              <div style={{ color: c['content-tertiary'], fontSize: 14 }}>›</div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
};

// ── Schema view ──────────────────────────────────────────────────────────────

const SchemaView: React.FC<{ conn: ConnNode; schema: SchemaNode; onPickTable: (t: string) => void }> = ({ conn, schema, onPickTable }) => {
  const dbtCount  = schema.tables.filter(t => t.isDbt).length;
  const tableCount = schema.tables.length - dbtCount;

  return (
    <>
      <PageHeader
        title={schema.name}
        titleMono
        subtitle={`${conn.name} · ${schema.tables.length} objects · ${dbtCount} dbt models`}
      />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, marginBottom: sp.E }}>
          <StatCell label="Tables"     value={String(tableCount)} />
          <StatCell label="dbt models" value={String(dbtCount)} />
          <StatCell label="Last sync"  value="2h ago" />
        </div>

        {/* Type filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
          <div style={{ display: 'flex', gap: sp.A }}>
            {[`All (${schema.tables.length})`, 'Tables', 'dbt models', 'Views'].map((f, i) => (
              <button key={f} style={{
                padding: `${sp.A + 1}px ${sp.C}px`, borderRadius: 14,
                border: `1px solid ${i === 0 ? c['content-brand'] : c['border-default']}`,
                backgroundColor: i === 0 ? c['background-information'] : 'transparent',
                color: i === 0 ? c['content-brand'] : c['content-secondary'],
                fontSize: fs.xs, fontFamily: ff.primary, cursor: 'pointer',
                fontWeight: i === 0 ? fw.semibold : fw.regular,
              }}>{f}</button>
            ))}
          </div>
        </div>

        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
            {['', 'Name', 'Type', 'Rows', 'Tests', 'Last sync'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontFamily: ff.primary }}>{h}</div>
            ))}
          </div>
          {schema.tables.map((t, i) => (
            <div key={t.name} onClick={() => onPickTable(t.name)} style={{
              display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 1fr 1fr', gap: sp.C,
              padding: `${sp.B + 1}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontSize: fs.sm, fontFamily: ff.primary,
            }}>
              <span style={{ color: t.isDbt ? '#FF694A' : c['content-tertiary'] }}>{t.isDbt ? '◆' : '▦'}</span>
              <div>
                <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{t.name}</code>
                {t.description && <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1, fontFamily: ff.primary }}>{t.description}</div>}
              </div>
              <div style={{ color: c['content-secondary'] }}>{t.isDbt ? 'dbt model' : 'Table'}</div>
              <div style={{ color: c['content-secondary'] }}>{t.rows}</div>
              <div style={{ color: t.tests ? c['content-success'] : c['content-tertiary'] }}>{t.tests ?? '—'}</div>
              <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{t.sync}</div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
};

// ── Table view ───────────────────────────────────────────────────────────────

const TableView: React.FC<{ conn: ConnNode; schema: SchemaNode; table: TableNode }> = ({ conn, schema, table }) => {
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

  return (
    <>
      <PageHeader
        icon={<span style={{ fontSize: 20, color: table.isDbt ? '#FF694A' : c['content-tertiary'] }}>{table.isDbt ? '◆' : '▦'}</span>}
        title={table.name}
        titleMono
        subtitle={`${conn.name} · ${schema.name} · ${table.rows} rows · ${table.cols} cols · synced ${table.sync}`}
        actions={<>
          <Button variant="secondary" size="basic">Preview rows</Button>
          <Button variant="secondary" size="basic">Lineage</Button>
          <Button variant="secondary" size="basic">Ask Spotter</Button>
          <Button variant="primary"   size="basic">Build a model</Button>
        </>}
      />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp.E }}>
          <Card>
            <div style={{ padding: sp.D }}>
              <SectionLabel>Schema</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1.6fr 1fr 2fr', gap: sp.C, padding: `${sp.A}px 0`, borderBottom: `1px solid ${c['background-subtle']}` }}>
                {['', 'Name', 'Type', 'Notes'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: fw.medium, color: c['content-tertiary'], textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontFamily: ff.primary }}>{h}</div>
                ))}
              </div>
              {SAMPLE_COLS.map((col, i) => (
                <div key={col.name} style={{
                  display: 'grid', gridTemplateColumns: '40px 1.6fr 1fr 2fr', gap: sp.C,
                  padding: `${sp.B}px 0`, fontSize: fs.xs, alignItems: 'center',
                  borderBottom: i < SAMPLE_COLS.length - 1 ? `1px solid ${c['background-subtle']}` : 'none',
                }}>
                  <span style={{ color: c['content-tertiary'] }}>{i + 1}</span>
                  <code style={{ fontFamily: ff.mono, color: c['content-primary'] }}>{col.name}</code>
                  <span style={{ color: c['content-tertiary'], fontFamily: ff.primary }}>{col.type}</span>
                  <span style={{ color: c['content-secondary'], fontFamily: ff.primary }}>{col.notes}</span>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
            <Card>
              <div style={{ padding: sp.D }}>
                <SectionLabel>About</SectionLabel>
                <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.5, fontFamily: ff.primary }}>
                  {table.description ?? `${table.isDbt ? 'dbt model' : 'Source table'} from ${conn.type}.`}
                </p>
              </div>
            </Card>

            <Card>
              <div style={{ padding: sp.D }}>
                <SectionLabel>Properties</SectionLabel>
                {[
                  ['Type',        table.isDbt ? 'dbt model' : 'Table'],
                  ['Rows',        table.rows],
                  ['Columns',     String(table.cols)],
                  ['Last synced', table.sync],
                  ...(table.tests ? [['Tests', table.tests]] : []),
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: `${sp.A + 1}px 0`, fontSize: fs.xs, fontFamily: ff.primary }}>
                    <div style={{ color: c['content-tertiary'] }}>{k}</div>
                    <div style={{ color: c['content-primary'] }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>

            {table.isDbt && (
              <Card>
                <div style={{ padding: sp.D }}>
                  <SectionLabel>dbt</SectionLabel>
                  {[
                    ['Project',    'analytics'],
                    ['Materialized', 'table'],
                    ['Last build', '2h ago'],
                  ].map(([k, v]) => (
                    <div key={k as string} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: `${sp.A + 1}px 0`, fontSize: fs.xs, fontFamily: ff.primary }}>
                      <div style={{ color: c['content-tertiary'] }}>{k}</div>
                      <div style={{ color: c['content-primary'] }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <div style={{ padding: sp.D }}>
                <SectionLabel>Used by</SectionLabel>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary, lineHeight: 1.7 }}>
                  <div>• Campaign Attribution Model</div>
                  <div>• Q4 Revenue Liveboard</div>
                  <div>• 10 more...</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Top-level ────────────────────────────────────────────────────────────────

export const DataBrowserExploration: React.FC = () => {
  const [selection, setSelection] = useState<Selection>({ kind: 'warehouse', connId: 'snow' });

  const conn = TREE.find(c => c.id === selection.connId)!;
  const schema = selection.kind !== 'warehouse' ? conn.schemas.find(s => s.name === selection.schema) : undefined;
  const table = selection.kind === 'table' ? schema!.tables.find(t => t.name === selection.table) : undefined;

  // Sub-state mapping (for the explorer chrome only)
  const subState = selection.kind;
  const handleSubStateChange = (id: string) => {
    if (id === 'warehouse') setSelection({ kind: 'warehouse', connId: 'snow' });
    if (id === 'schema')    setSelection({ kind: 'schema',    connId: 'snow', schema: 'ANALYTICS' });
    if (id === 'table')     setSelection({ kind: 'table',     connId: 'snow', schema: 'ANALYTICS', table: 'orders' });
  };

  return (
    <Shell activeNav="data" onNavChange={() => {}}>
      <SubStateBar subtabs={SUBTABS} active={subState} onChange={handleSubStateChange} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Tree selection={selection} onSelect={setSelection} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selection.kind === 'warehouse' && (
            <WarehouseView conn={conn} onPickSchema={(s) => setSelection({ kind: 'schema', connId: conn.id, schema: s })} />
          )}
          {selection.kind === 'schema' && schema && (
            <SchemaView conn={conn} schema={schema} onPickTable={(t) => setSelection({ kind: 'table', connId: conn.id, schema: schema.name, table: t })} />
          )}
          {selection.kind === 'table' && schema && table && (
            <TableView conn={conn} schema={schema} table={table} />
          )}
        </div>
      </div>
    </Shell>
  );
};
