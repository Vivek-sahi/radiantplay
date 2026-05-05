import React, { useState, useMemo } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { SearchInput } from '../../../../components/SearchInput';
import Shell from '../Shell';
import { SubStateBar } from './ExplorationFrame';

type SubState = 'home' | 'connection' | 'schema' | 'table';

const SUBTABS = [
  { id: 'home',       label: 'Home (all sources)' },
  { id: 'connection', label: 'Inside connection' },
  { id: 'schema',     label: 'Inside schema' },
  { id: 'table',      label: 'Table detail' },
];

// ── Mock data ────────────────────────────────────────────────────────────────

interface TableNode { name: string; rows: string; cols: number; sync: string; isDbt?: boolean; tests?: string; description?: string; }
interface SchemaNode { name: string; tables: TableNode[]; }
interface ConnNode { id: string; name: string; type: string; schemas: SchemaNode[]; }

const TREE: ConnNode[] = [
  {
    id: 'snow', name: 'snowflake-prod', type: 'Snowflake',
    schemas: [
      { name: 'ANALYTICS', tables: [
        { name: 'orders',         rows: '12.4M', cols: 22, sync: '2h ago', description: 'All customer orders placed via the platform' },
        { name: 'campaigns',      rows: '8.2K',  cols: 18, sync: '2h ago', description: 'Marketing campaigns by channel and budget' },
        { name: 'users',          rows: '142K',  cols: 24, sync: '2h ago', description: 'Registered platform users' },
        { name: 'sessions',       rows: '88M',   cols: 14, sync: '2h ago' },
        { name: 'fct_revenue',    rows: '4.6M',  cols: 12, sync: '2h ago', isDbt: true, tests: '8 / 8 ✓', description: 'dbt model · revenue fact built from orders + returns' },
        { name: 'dim_customers',  rows: '142K',  cols: 16, sync: '2h ago', isDbt: true, tests: '5 / 5 ✓', description: 'dbt model · customer dimension' },
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

// ── Page header (search + breadcrumb) ───────────────────────────────────────

const Crumbs: React.FC<{ trail: { label: string; onClick?: () => void }[] }> = ({ trail }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
    {trail.map((seg, i) => (
      <React.Fragment key={i}>
        {seg.onClick ? (
          <button onClick={seg.onClick} style={{ background: 'none', border: 'none', padding: 0, fontSize: fs.xs, color: c['content-secondary'], cursor: 'pointer', fontFamily: ff.primary }}>{seg.label}</button>
        ) : (
          <strong style={{ color: c['content-primary'] }}>{seg.label}</strong>
        )}
        {i < trail.length - 1 && <span>›</span>}
      </React.Fragment>
    ))}
  </div>
);

// ── Sticky page chrome ───────────────────────────────────────────────────────

const PageChrome: React.FC<{ trail: { label: string; onClick?: () => void }[]; children: React.ReactNode }> = ({ trail, children }) => (
  <>
    <div style={{ flexShrink: 0, padding: `${sp.D}px ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.E }}>
        <div>
          <Crumbs trail={trail} />
          <h1 style={{ margin: 0, marginTop: 4, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>
            {trail[trail.length - 1]?.label === 'Data Browser' ? 'Data Browser' : trail[trail.length - 1]?.label}
          </h1>
        </div>
        <div style={{ width: 360 }}>
          <SearchInput placeholder="Search tables, columns, dbt models..." />
        </div>
      </div>
    </div>
    {children}
  </>
);

// ── Home (all sources) ───────────────────────────────────────────────────────

const HomeView: React.FC<{ onPickConnection: (id: string) => void }> = ({ onPickConnection }) => {
  const totals = useMemo(() => {
    const tables = TREE.reduce((sum, c) => sum + c.schemas.reduce((s, sc) => s + sc.tables.length, 0), 0);
    const dbt    = TREE.reduce((sum, c) => sum + c.schemas.reduce((s, sc) => s + sc.tables.filter(t => t.isDbt).length, 0), 0);
    return { connections: TREE.length, tables, dbt };
  }, []);

  return (
    <PageChrome trail={[{ label: 'Data Browser' }]}>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {/* Counts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, marginBottom: sp.E }}>
            {[
              ['Connections', String(totals.connections)],
              ['Tables',      String(totals.tables)],
              ['dbt models',  String(totals.dbt)],
            ].map(([k, v]) => (
              <Card key={k}>
                <div style={{ padding: sp.D, fontFamily: ff.primary }}>
                  <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{k}</div>
                  <div style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], marginTop: 2 }}>{v}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tabs (Recently used / Favorites / All) — Hex 2024 pattern */}
          <div style={{ display: 'flex', gap: sp.A, marginBottom: sp.C }}>
            {['All', 'Recently used', 'Favorites'].map((t, i) => (
              <button key={t} style={{
                padding: `${sp.A + 1}px ${sp.C}px`, borderRadius: 14,
                border: `1px solid ${i === 0 ? c['content-brand'] : c['border-default']}`,
                backgroundColor: i === 0 ? c['background-information'] : 'transparent',
                color: i === 0 ? c['content-brand'] : c['content-secondary'],
                fontSize: fs.xs, fontFamily: ff.primary, cursor: 'pointer',
                fontWeight: i === 0 ? fw.semibold : fw.regular,
              }}>{t}</button>
            ))}
          </div>

          <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B, fontFamily: ff.primary }}>
            All sources
          </div>

          <Card>
            {TREE.map((conn, i) => {
              const tableCount = conn.schemas.reduce((s, sc) => s + sc.tables.length, 0);
              const dbtCount   = conn.schemas.reduce((s, sc) => s + sc.tables.filter(t => t.isDbt).length, 0);
              return (
                <div key={conn.id} onClick={() => onPickConnection(conn.id)} style={{
                  display: 'grid', gridTemplateColumns: '32px 2.4fr 1fr 1fr 1fr 32px', gap: sp.C,
                  padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
                  borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontFamily: ff.primary,
                }}>
                  <Logo kind={conn.type} size={28} />
                  <div>
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{conn.name}</div>
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1 }}>{conn.type}{dbtCount > 0 && ` · ${dbtCount} dbt models`}</div>
                  </div>
                  <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conn.schemas.length} {conn.schemas.length === 1 ? 'schema' : 'schemas'}</div>
                  <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{tableCount} tables</div>
                  <div style={{ fontSize: fs.xs, color: c['content-success'] }}>● Synced</div>
                  <div style={{ fontSize: 14, color: c['content-tertiary'] }}>›</div>
                </div>
              );
            })}
          </Card>

          <div style={{ marginTop: sp.E, padding: sp.D, borderRadius: 6, backgroundColor: c['background-information'], display: 'flex', alignItems: 'flex-start', gap: sp.C, fontFamily: ff.primary }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <div style={{ fontSize: fs.xs, color: c['content-brand'], lineHeight: 1.5 }}>
              Looking for ThoughtSpot Models you've built or imported from dbt? They live in the <strong>Models</strong> tab — this surface is the catalog of raw + dbt-built sources.
            </div>
          </div>
        </div>
      </div>
    </PageChrome>
  );
};

// ── Connection view ──────────────────────────────────────────────────────────

const ConnectionView: React.FC<{ connId: string; onHome: () => void; onPickSchema: (s: string) => void }> = ({ connId, onHome, onPickSchema }) => {
  const conn = TREE.find(c => c.id === connId)!;
  return (
    <PageChrome trail={[{ label: 'Data Browser', onClick: onHome }, { label: conn.name }]}>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.E }}>
            <Logo kind={conn.type} size={32} />
            <div>
              <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>{conn.type}</div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'], marginTop: 2, fontFamily: ff.primary }}>{conn.schemas.length} schemas · {conn.schemas.reduce((s, sc) => s + sc.tables.length, 0)} tables</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B, fontFamily: ff.primary }}>Schemas</div>
          <Card>
            {conn.schemas.map((s, i) => {
              const dbtIn = s.tables.filter(t => t.isDbt).length;
              return (
                <div key={s.name} onClick={() => onPickSchema(s.name)} style={{
                  display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 32px', gap: sp.C,
                  padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
                  borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontFamily: ff.primary,
                }}>
                  <span style={{ color: c['content-tertiary'] }}>📁</span>
                  <code style={{ fontFamily: ff.mono, color: c['content-brand'], fontSize: fs.sm }}>{s.name}</code>
                  <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{s.tables.length} tables</div>
                  <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{dbtIn > 0 ? `${dbtIn} dbt models` : ''}</div>
                  <div style={{ fontSize: 14, color: c['content-tertiary'] }}>›</div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </PageChrome>
  );
};

// ── Schema view (table list — single column with mixed raw + dbt) ────────────

const SchemaView: React.FC<{ connId: string; schemaName: string; onHome: () => void; onConnection: () => void; onPickTable: (t: string) => void }> = ({ connId, schemaName, onHome, onConnection, onPickTable }) => {
  const conn = TREE.find(c => c.id === connId)!;
  const schema = conn.schemas.find(s => s.name === schemaName)!;

  return (
    <PageChrome trail={[
      { label: 'Data Browser', onClick: onHome },
      { label: conn.name, onClick: onConnection },
      { label: schema.name },
    ]}>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {/* Type filter chips */}
          <div style={{ display: 'flex', gap: sp.A, marginBottom: sp.C }}>
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

          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
              {['', 'Name', 'Type', 'Rows', 'Tests', 'Last sync'].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: ff.primary }}>{h}</div>
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
      </div>
    </PageChrome>
  );
};

// ── Table detail ─────────────────────────────────────────────────────────────

const TableView: React.FC<{ connId: string; schemaName: string; tableName: string; onHome: () => void; onConnection: () => void; onSchema: () => void }> = ({ connId, schemaName, tableName, onHome, onConnection, onSchema }) => {
  const conn = TREE.find(c => c.id === connId)!;
  const schema = conn.schemas.find(s => s.name === schemaName)!;
  const table = schema.tables.find(t => t.name === tableName)!;

  return (
    <>
      <div style={{ flexShrink: 0, padding: `${sp.D}px ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.E }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Crumbs trail={[
              { label: 'Data Browser', onClick: onHome },
              { label: conn.name,      onClick: onConnection },
              { label: schema.name,    onClick: onSchema },
              { label: table.name },
            ]} />
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginTop: 4 }}>
              <span style={{ color: table.isDbt ? '#FF694A' : c['content-tertiary'], fontSize: 16 }}>{table.isDbt ? '◆' : '▦'}</span>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>{table.name}</h1>
              <span style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>{table.rows} rows · {table.cols} cols · synced {table.sync}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: sp.B }}>
            <Button variant="secondary" size="basic">Preview rows</Button>
            <Button variant="secondary" size="basic">Ask Spotter</Button>
            <Button variant="primary"   size="basic">Build a model</Button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'], padding: `${sp.E}px ${sp.H}px` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp.E }}>
          <Card>
            <div style={{ padding: sp.D }}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B, fontFamily: ff.primary }}>Schema</div>
              {[
                ['order_id',         'varchar', 'PK'],
                ['user_id',          'varchar', 'FK'],
                ['campaign_id',      'varchar', 'FK · 18% null'],
                ['order_date',       'date',    ''],
                ['amount',           'number',  ''],
                ['product_category', 'varchar', ''],
                ['region',           'varchar', ''],
                ['status',           'varchar', ''],
              ].map(([n, t, h], i, arr) => (
                <div key={n} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: sp.C, padding: `${sp.A + 2}px 0`, fontSize: fs.xs, borderBottom: i < arr.length - 1 ? `1px solid ${c['background-subtle']}` : 'none' }}>
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
                {table.description ?? `${table.isDbt ? 'dbt model' : 'Source table'} from ${conn.type}.`}
              </div>
              <div style={{ marginTop: sp.D, fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
                <div style={{ marginBottom: sp.A }}>Last synced · {table.sync}</div>
                {table.tests && <div style={{ marginBottom: sp.A }}>Tests · {table.tests}</div>}
                <div style={{ marginBottom: sp.A }}>Lineage · 4 upstream sources</div>
                <div>Used by · 12 ThoughtSpot Models</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

// ── Top-level ────────────────────────────────────────────────────────────────

export const DataBrowserExploration: React.FC = () => {
  const [substate, setSubstate] = useState<SubState>('home');
  const [connId, setConnId]     = useState<string>('snow');
  const [schema, setSchema]     = useState<string>('ANALYTICS');
  const [tableName, setTable]   = useState<string>('orders');

  return (
    <Shell activeNav="data" onNavChange={() => {}}>
      <SubStateBar subtabs={SUBTABS} active={substate} onChange={(id) => setSubstate(id as SubState)} />

      {substate === 'home' && (
        <HomeView onPickConnection={(id) => { setConnId(id); setSubstate('connection'); }} />
      )}
      {substate === 'connection' && (
        <ConnectionView
          connId={connId}
          onHome={() => setSubstate('home')}
          onPickSchema={(s) => { setSchema(s); setSubstate('schema'); }}
        />
      )}
      {substate === 'schema' && (
        <SchemaView
          connId={connId}
          schemaName={schema}
          onHome={() => setSubstate('home')}
          onConnection={() => setSubstate('connection')}
          onPickTable={(t) => { setTable(t); setSubstate('table'); }}
        />
      )}
      {substate === 'table' && (
        <TableView
          connId={connId}
          schemaName={schema}
          tableName={tableName}
          onHome={() => setSubstate('home')}
          onConnection={() => setSubstate('connection')}
          onSchema={() => setSubstate('schema')}
        />
      )}
    </Shell>
  );
};
