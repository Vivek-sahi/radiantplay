import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { SearchInput } from '../../../../components/SearchInput';
import Shell from '../Shell';
import { SubStateBar } from './ExplorationFrame';

type SubState = 'browse' | 'table-selected';

const SUBTABS = [
  { id: 'browse',         label: 'Browse — schema selected' },
  { id: 'table-selected', label: 'Browse — table selected' },
];

// ── Data model for the tree ──────────────────────────────────────────────────

interface SchemaNode { name: string; tables: TableNode[]; }
interface TableNode  { name: string; rows: string; cols: number; sync: string; isDbt?: boolean; tests?: string; }
interface ConnNode   { id: string; name: string; type: string; schemas: SchemaNode[]; expanded?: boolean; }

const TREE: ConnNode[] = [
  {
    id: 'snow', name: 'snowflake-prod', type: 'Snowflake', expanded: true,
    schemas: [
      { name: 'ANALYTICS', tables: [
        { name: 'orders',         rows: '12.4M', cols: 22, sync: '2h ago' },
        { name: 'campaigns',      rows: '8.2K',  cols: 18, sync: '2h ago' },
        { name: 'users',          rows: '142K',  cols: 24, sync: '2h ago' },
        { name: 'sessions',       rows: '88M',   cols: 14, sync: '2h ago' },
        { name: 'fct_revenue',    rows: '4.6M',  cols: 12, sync: '2h ago', isDbt: true, tests: '8 / 8 ✓' },
        { name: 'dim_customers',  rows: '142K',  cols: 16, sync: '2h ago', isDbt: true, tests: '5 / 5 ✓' },
      ] },
      { name: 'FINANCE', tables: [
        { name: 'transactions',   rows: '4.4M', cols: 18, sync: '6h ago' },
        { name: 'budget_targets', rows: '50',   cols: 7,  sync: '6h ago' },
      ] },
    ],
  },
  {
    id: 'bq', name: 'bigquery-marketing', type: 'BigQuery', expanded: false,
    schemas: [{ name: 'mkt_warehouse', tables: [] }],
  },
  {
    id: 'files', name: 'uploaded files', type: 'File', expanded: false,
    schemas: [{ name: 'uploads', tables: [] }],
  },
];

const Logo: React.FC<{ kind: string; size?: number }> = ({ kind, size = 18 }) => {
  const palette: Record<string, string> = {
    Snowflake: '#29B5E8', BigQuery: '#4285F4', File: '#6B7280', dbt: '#FF694A',
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: 3,
      backgroundColor: palette[kind] ?? c['background-subtle'],
      color: 'white', fontSize: size * 0.55, fontWeight: fw.bold,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{kind[0]}</div>
  );
};

// ── Left tree ────────────────────────────────────────────────────────────────

interface Selection { connId: string; schema?: string; table?: string; }

const Tree: React.FC<{ selection: Selection; onSelect: (s: Selection) => void }> = ({ selection, onSelect }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ snow: true, 'snow:ANALYTICS': true });
  const toggle = (k: string) => setExpanded(e => ({ ...e, [k]: !e[k] }));

  return (
    <div style={{ width: 280, borderRight: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], overflowY: 'auto', flexShrink: 0 }}>
      <div style={{ padding: sp.C, borderBottom: `1px solid ${c['border-divider']}` }}>
        <SearchInput placeholder="Search tables, columns, models..." />
      </div>
      <div style={{ padding: `${sp.B}px 0` }}>
        {TREE.map(conn => {
          const connOpen = expanded[conn.id];
          const connSelected = selection.connId === conn.id && !selection.schema;
          return (
            <div key={conn.id}>
              <button onClick={() => { toggle(conn.id); onSelect({ connId: conn.id }); }} style={{
                width: '100%', textAlign: 'left' as const,
                padding: `${sp.A + 2}px ${sp.C}px`, border: 'none',
                backgroundColor: connSelected ? c['background-information'] : 'transparent',
                color: connSelected ? c['content-brand'] : c['content-primary'],
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp.A, fontFamily: ff.primary,
                fontSize: fs.sm, fontWeight: fw.medium,
              }}>
                <span style={{ fontSize: 9, color: c['content-tertiary'], width: 10 }}>{connOpen ? '▾' : '▸'}</span>
                <Logo kind={conn.type} />
                <span>{conn.name}</span>
              </button>
              {connOpen && conn.schemas.map(s => {
                const schemaKey = `${conn.id}:${s.name}`;
                const schemaOpen = expanded[schemaKey];
                const schemaSelected = selection.connId === conn.id && selection.schema === s.name && !selection.table;
                return (
                  <div key={s.name}>
                    <button onClick={() => { toggle(schemaKey); onSelect({ connId: conn.id, schema: s.name }); }} style={{
                      width: '100%', textAlign: 'left' as const,
                      padding: `${sp.A + 1}px ${sp.C}px ${sp.A + 1}px ${sp.E}px`, border: 'none',
                      backgroundColor: schemaSelected ? c['background-information'] : 'transparent',
                      color: schemaSelected ? c['content-brand'] : c['content-primary'],
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp.A, fontFamily: ff.mono,
                      fontSize: fs.xs,
                    }}>
                      <span style={{ fontSize: 9, color: c['content-tertiary'], width: 10 }}>{schemaOpen ? '▾' : '▸'}</span>
                      <span>{s.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: c['content-tertiary'], fontFamily: ff.primary }}>{s.tables.length}</span>
                    </button>
                    {schemaOpen && s.tables.map(t => {
                      const tableSelected = selection.connId === conn.id && selection.schema === s.name && selection.table === t.name;
                      return (
                        <button key={t.name} onClick={() => onSelect({ connId: conn.id, schema: s.name, table: t.name })} style={{
                          width: '100%', textAlign: 'left' as const,
                          padding: `${sp.A}px ${sp.C}px ${sp.A}px ${sp.G}px`, border: 'none',
                          backgroundColor: tableSelected ? c['background-information'] : 'transparent',
                          color: tableSelected ? c['content-brand'] : c['content-primary'],
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp.A, fontFamily: ff.mono,
                          fontSize: fs.xs,
                        }}>
                          <span style={{ fontSize: 10, color: t.isDbt ? '#FF694A' : c['content-tertiary'] }}>{t.isDbt ? '◆' : '▦'}</span>
                          <span>{t.name}</span>
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

// ── Right pane ───────────────────────────────────────────────────────────────

const SchemaPane: React.FC<{ conn: ConnNode; schema: SchemaNode; onSelectTable: (t: string) => void }> = ({ conn, schema, onSelectTable }) => (
  <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.B, fontFamily: ff.primary }}>
      <span>{conn.name}</span> <span style={{ margin: '0 6px' }}>›</span> <strong style={{ color: c['content-primary'], fontFamily: ff.mono }}>{schema.name}</strong>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.E }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>{schema.name}</h1>
      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
        {schema.tables.length} tables · {schema.tables.filter(t => t.isDbt).length} dbt models
      </div>
    </div>

    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
        {['', 'Name', 'Type', 'Rows', 'Tests', 'Last sync'].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: ff.primary }}>{h}</div>
        ))}
      </div>
      {schema.tables.map((t, i) => (
        <div key={t.name} onClick={() => onSelectTable(t.name)} style={{
          display: 'grid', gridTemplateColumns: '24px 2fr 1fr 1fr 1fr 1fr', gap: sp.C,
          padding: `${sp.B + 1}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
          borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontSize: fs.sm, fontFamily: ff.primary,
        }}>
          <span style={{ color: t.isDbt ? '#FF694A' : c['content-tertiary'] }}>{t.isDbt ? '◆' : '▦'}</span>
          <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{t.name}</code>
          <div style={{ color: c['content-secondary'] }}>{t.isDbt ? 'dbt model' : 'Table'}</div>
          <div style={{ color: c['content-secondary'] }}>{t.rows}</div>
          <div style={{ color: t.tests ? c['content-success'] : c['content-tertiary'] }}>{t.tests ?? '—'}</div>
          <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{t.sync}</div>
        </div>
      ))}
    </Card>
  </div>
);

const TablePane: React.FC<{ conn: ConnNode; schema: SchemaNode; table: TableNode }> = ({ conn, schema, table }) => (
  <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.G}px` }}>
    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.B, fontFamily: ff.primary }}>
      {conn.name} <span style={{ margin: '0 6px' }}>›</span> <span style={{ fontFamily: ff.mono }}>{schema.name}</span> <span style={{ margin: '0 6px' }}>›</span> <strong style={{ color: c['content-primary'], fontFamily: ff.mono }}>{table.name}</strong>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.E, gap: sp.D }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
        <span style={{ color: table.isDbt ? '#FF694A' : c['content-tertiary'], fontSize: 16 }}>{table.isDbt ? '◆' : '▦'}</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>{table.name}</h1>
        <span style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>{table.rows} rows · {table.cols} cols · synced {table.sync}</span>
      </div>
      <div style={{ display: 'flex', gap: sp.B }}>
        <Button variant="secondary" size="basic">Preview rows</Button>
        <Button variant="secondary" size="basic">Ask Spotter</Button>
        <Button variant="primary"   size="basic">Build a model</Button>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp.E }}>
      <Card>
        <div style={{ padding: sp.D }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B, fontFamily: ff.primary }}>Schema</div>
          {[
            ['order_id',        'varchar', 'PK'],
            ['user_id',         'varchar', 'FK'],
            ['campaign_id',     'varchar', 'FK · 18% null'],
            ['order_date',      'date',    ''],
            ['amount',          'number',  ''],
            ['product_category','varchar', ''],
            ['region',          'varchar', ''],
            ['status',          'varchar', ''],
          ].map(([n, t, h], i, arr) => (
            <div key={n} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: sp.C,
              padding: `${sp.A + 2}px 0`, fontSize: fs.xs,
              borderBottom: i < arr.length - 1 ? `1px solid ${c['background-subtle']}` : 'none',
            }}>
              <code style={{ fontFamily: ff.mono, color: c['content-primary'] }}>{n}</code>
              <span style={{ color: c['content-tertiary'], fontFamily: ff.primary }}>{t}</span>
              <span style={{ color: c['content-secondary'], fontFamily: ff.primary }}>{h}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ padding: sp.D }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B, fontFamily: ff.primary }}>About</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5, fontFamily: ff.primary }}>
            All customer orders placed via the platform. {table.isDbt ? 'Built from raw orders + returns join, deduplicated.' : 'Source table from Snowflake.'}
          </div>
          <div style={{ marginTop: sp.D, fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
            <div style={{ marginBottom: sp.A }}>Last synced · {table.sync}</div>
            <div style={{ marginBottom: sp.A }}>Lineage · 4 upstream sources</div>
            <div>Used by · 12 ThoughtSpot Models</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// ── Top-level ────────────────────────────────────────────────────────────────

export const DataBrowserExploration: React.FC = () => {
  const [substate, setSubstate] = useState<SubState>('browse');
  const initial: Selection = substate === 'browse'
    ? { connId: 'snow', schema: 'ANALYTICS' }
    : { connId: 'snow', schema: 'ANALYTICS', table: 'orders' };
  const [selection, setSelection] = useState<Selection>(initial);

  // sync substate → selection
  React.useEffect(() => {
    setSelection(substate === 'browse'
      ? { connId: 'snow', schema: 'ANALYTICS' }
      : { connId: 'snow', schema: 'ANALYTICS', table: 'orders' }
    );
  }, [substate]);

  const conn = TREE.find(t => t.id === selection.connId)!;
  const schema = conn.schemas.find(s => s.name === selection.schema);
  const table = schema?.tables.find(t => t.name === selection.table);

  return (
    <Shell activeNav="data" onNavChange={() => {}}>
      <SubStateBar subtabs={SUBTABS} active={substate} onChange={(id) => setSubstate(id as SubState)} />

      {/* Page header */}
      <div style={{ flexShrink: 0, padding: `${sp.D}px ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>Data Browser</h1>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
            Catalog of warehouse, dbt views, and uploaded files. <strong style={{ color: c['content-secondary'] }}>Models</strong> tab has your TS Models.
          </div>
        </div>
      </div>

      {/* Split-pane body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Tree selection={selection} onSelect={setSelection} />
        {schema && !table && <SchemaPane conn={conn} schema={schema} onSelectTable={(name) => setSelection({ ...selection, table: name })} />}
        {schema &&  table && <TablePane  conn={conn} schema={schema} table={table} />}
        {!schema && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c['background-sunken'], color: c['content-tertiary'], fontSize: fs.sm, fontFamily: ff.primary }}>
            Pick a schema or table to view details
          </div>
        )}
      </div>
    </Shell>
  );
};
