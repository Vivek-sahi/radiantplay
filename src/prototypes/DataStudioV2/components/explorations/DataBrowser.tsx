import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { ExplorationFrame, Card, PrimaryButton, GhostButton, Pill } from './ExplorationFrame';

type SubState = 'all' | 'connection' | 'schema' | 'table-actions';

const SUBTABS = [
  { id: 'all',           label: 'Landing — all data' },
  { id: 'connection',    label: 'Single connection drilled in' },
  { id: 'schema',        label: 'Schema view' },
  { id: 'table-actions', label: 'Table click — actions' },
];

const Logo: React.FC<{ kind: string }> = ({ kind }) => {
  const palette: Record<string, string> = {
    Snowflake: '#29B5E8', BigQuery: '#4285F4', Databricks: '#FF3621', Postgres: '#336791', dbt: '#FF694A', File: '#6B7280',
  };
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 4,
      backgroundColor: palette[kind] ?? c['background-subtle'],
      color: 'white', fontSize: 10, fontWeight: fw.bold,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{kind[0]}</div>
  );
};

// ── Landing state — all data across connections ──────────────────────────────

const ALL_DATA = [
  { conn: 'snowflake-prod',     type: 'Snowflake',  schemas: 6, tables: 184, dbt: false },
  { conn: 'bigquery-marketing', type: 'BigQuery',   schemas: 3, tables: 42,  dbt: false },
  { conn: 'marketing-models',   type: 'dbt',        schemas: 1, tables: 18,  dbt: true  },
  { conn: 'uploaded files',     type: 'File',       schemas: 0, tables: 6,   dbt: false },
];

const AllDataState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 1080, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.D }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'] }}>Data Browser</h1>
      <div style={{ display: 'flex', gap: sp.B }}>
        <div style={{ position: 'relative', width: 280 }}>
          <input style={{
            width: '100%', padding: `${sp.B - 1}px ${sp.C}px ${sp.B - 1}px ${sp.G}px`,
            border: `1px solid ${c['border-default']}`, borderRadius: 6,
            fontSize: fs.sm, fontFamily: ff.primary,
          }} placeholder="Search tables, columns, dbt models..." />
          <span style={{ position: 'absolute', left: sp.C, top: '50%', transform: 'translateY(-50%)', color: c['content-tertiary'], fontSize: 14 }}>⌕</span>
        </div>
      </div>
    </div>

    <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B }}>
      All data sources <span style={{ color: c['content-tertiary'] }}>· {ALL_DATA.length}</span>
    </div>

    <Card style={{ overflow: 'hidden' }}>
      {ALL_DATA.map((d, i) => (
        <div key={d.conn} style={{
          display: 'grid', gridTemplateColumns: '32px 2fr 1fr 1fr 1fr 32px', gap: sp.C,
          padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
          borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
        }}>
          <Logo kind={d.type} />
          <div>
            <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{d.conn}</div>
            <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{d.type}{d.dbt && ' · dbt models with tests + freshness'}</div>
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{d.schemas} {d.schemas === 1 ? 'project' : 'schemas'}</div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{d.tables} tables</div>
          <div>{d.dbt ? <Pill tone="info">dbt</Pill> : <Pill tone="neutral">Warehouse</Pill>}</div>
          <div style={{ fontSize: 14, color: c['content-tertiary'] }}>›</div>
        </div>
      ))}
    </Card>

    <div style={{ marginTop: sp.E, padding: sp.D, borderRadius: 6, backgroundColor: c['background-information'], display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
      <span style={{ fontSize: 18 }}>💡</span>
      <div style={{ fontSize: fs.xs, color: c['content-brand'], lineHeight: 1.5 }}>
        Looking for ThoughtSpot Models you've built or imported from dbt? Find them in the <strong>Models</strong> tab — that's where curated artifacts live.
      </div>
    </div>
  </div>
);

// ── Single connection drilled in ─────────────────────────────────────────────

const ConnectionDrilledState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 1080, margin: '0 auto' }}>
    <button style={{ background: 'none', border: 'none', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', padding: 0, marginBottom: sp.C }}>← Data Browser</button>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.E }}>
      <Logo kind="Snowflake" />
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'] }}>snowflake-prod</h1>
      <Pill tone="good">● Connected</Pill>
      <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>· 6 schemas · 184 tables</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: sp.E }}>
      {/* Schemas list */}
      <div>
        <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.B }}>Schemas</div>
        <Card style={{ overflow: 'hidden' }}>
          {[
            { name: 'ANALYTICS',     count: 84, active: true },
            { name: 'FINANCE',       count: 32 },
            { name: 'MARKETING',     count: 28 },
            { name: 'PRODUCT',       count: 22 },
            { name: 'STAGING',       count: 18 },
          ].map((s, i) => (
            <div key={s.name} style={{
              padding: `${sp.B}px ${sp.C}px`, fontSize: fs.sm,
              backgroundColor: s.active ? c['background-information'] : 'transparent',
              color: s.active ? c['content-brand'] : c['content-primary'],
              fontWeight: s.active ? fw.semibold : fw.regular,
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
              display: 'flex', justifyContent: 'space-between',
              cursor: 'pointer', fontFamily: ff.mono,
            }}>
              <span>{s.name}</span>
              <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{s.count}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Tables in selected schema */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
          <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold }}>Tables in <code style={{ fontFamily: ff.mono, color: c['content-primary'] }}>ANALYTICS</code></div>
          <input style={{ padding: `${sp.A + 1}px ${sp.B}px`, border: `1px solid ${c['border-default']}`, borderRadius: 4, fontSize: fs.xs, fontFamily: ff.primary, width: 160 }} placeholder="Filter tables..." />
        </div>

        <Card style={{ overflow: 'hidden' }}>
          {[
            { name: 'orders',          rows: '12.4M', cols: 22, sync: '2h ago' },
            { name: 'campaigns',       rows: '8.2K',  cols: 18, sync: '2h ago' },
            { name: 'users',           rows: '142K',  cols: 24, sync: '2h ago' },
            { name: 'sessions',        rows: '88M',   cols: 14, sync: '2h ago' },
            { name: 'events',          rows: '1.2B',  cols: 32, sync: '2h ago' },
            { name: 'fct_revenue',     rows: '4.6M',  cols: 12, sync: '2h ago', dbt: true },
            { name: 'dim_customers',   rows: '142K',  cols: 16, sync: '2h ago', dbt: true },
          ].map((t, i) => (
            <div key={t.name} style={{
              display: 'grid', gridTemplateColumns: '20px 2fr 1fr 1fr 1fr', gap: sp.C,
              padding: `${sp.B + 1}px ${sp.C}px`, alignItems: 'center',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', cursor: 'pointer',
              fontSize: fs.sm,
            }}>
              <span style={{ color: c['content-tertiary'] }}>▦</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{t.name}</code>
                {t.dbt && <Pill tone="info">dbt</Pill>}
              </div>
              <div style={{ color: c['content-secondary'] }}>{t.rows} rows</div>
              <div style={{ color: c['content-secondary'] }}>{t.cols} cols</div>
              <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>synced {t.sync}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </div>
);

// ── Schema view ──────────────────────────────────────────────────────────────

const SchemaState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 1080, margin: '0 auto' }}>
    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.B }}>
      Data Browser › snowflake-prod › <strong>ANALYTICS</strong>
    </div>
    <h1 style={{ margin: 0, marginBottom: sp.E, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>ANALYTICS</h1>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C, marginBottom: sp.E }}>
      {[['Tables', '84'], ['Views', '12'], ['dbt models', '18']].map(([k, v]) => (
        <Card key={k} style={{ padding: sp.C }}>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{k}</div>
          <div style={{ fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'] }}>{v}</div>
        </Card>
      ))}
    </div>

    <div style={{ display: 'flex', gap: sp.B, marginBottom: sp.C }}>
      {['All', 'Tables', 'Views', 'dbt models'].map((f, i) => (
        <span key={f} style={{
          padding: `${sp.A + 1}px ${sp.C}px`, borderRadius: 14,
          border: `1px solid ${i === 0 ? c['content-brand'] : c['border-default']}`,
          backgroundColor: i === 0 ? c['background-information'] : 'transparent',
          color: i === 0 ? c['content-brand'] : c['content-secondary'],
          fontSize: fs.xs, cursor: 'pointer',
        }}>{f}</span>
      ))}
    </div>

    <Card style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '24px 2fr 1fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
        {['', 'Name', 'Type', 'Rows', 'Tests', 'Last sync'].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>
      {[
        { name: 'orders',         type: 'Table',     rows: '12.4M', tests: '—',     sync: '2h ago' },
        { name: 'fct_revenue',    type: 'dbt model', rows: '4.6M',  tests: '8 / 8 ✓', sync: '2h ago', dbt: true },
        { name: 'dim_customers',  type: 'dbt model', rows: '142K',  tests: '5 / 5 ✓', sync: '2h ago', dbt: true },
        { name: 'campaigns',      type: 'Table',     rows: '8.2K',  tests: '—',     sync: '2h ago' },
        { name: 'v_active_users', type: 'View',      rows: '38K',   tests: '—',     sync: '2h ago' },
      ].map((t, i) => (
        <div key={t.name} style={{
          display: 'grid', gridTemplateColumns: '24px 2fr 1fr 1fr 1fr 1fr', gap: sp.C,
          padding: `${sp.B + 1}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
          borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none', fontSize: fs.sm,
        }}>
          <span style={{ color: c['content-tertiary'] }}>{t.dbt ? '◆' : '▦'}</span>
          <code style={{ fontFamily: ff.mono, color: c['content-brand'] }}>{t.name}</code>
          <div style={{ color: c['content-secondary'] }}>{t.type}{t.dbt && ' '}{t.dbt && <Pill tone="info">dbt</Pill>}</div>
          <div style={{ color: c['content-secondary'] }}>{t.rows}</div>
          <div style={{ color: t.tests.includes('✓') ? c['content-success'] : c['content-tertiary'] }}>{t.tests}</div>
          <div style={{ color: c['content-tertiary'], fontSize: fs.xs }}>{t.sync}</div>
        </div>
      ))}
    </Card>
  </div>
);

// ── Table click — actions menu ──────────────────────────────────────────────

const TableActionsState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 920, margin: '0 auto' }}>
    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.B }}>
      Data Browser › snowflake-prod › ANALYTICS › <strong>orders</strong>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.D }}>
      <Logo kind="Snowflake" />
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.mono }}>orders</h1>
      <Pill tone="neutral">Table</Pill>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: sp.D }}>
      {/* Left: schema preview */}
      <Card style={{ padding: sp.D }}>
        <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>Schema preview</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['order_id',       'varchar', 'PK'],
            ['user_id',        'varchar', 'FK'],
            ['campaign_id',    'varchar', 'FK · 18% null'],
            ['order_date',     'date',    ''],
            ['amount',         'number',  ''],
            ['product_category','varchar',''],
            ['region',         'varchar', ''],
            ['status',         'varchar', ''],
          ].map(([n, t, h], i) => (
            <div key={n} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr', gap: sp.C,
              padding: `${sp.A + 2}px 0`, fontSize: fs.xs,
              borderBottom: i < 7 ? `1px solid ${c['background-subtle']}` : 'none',
            }}>
              <code style={{ fontFamily: ff.mono, color: c['content-primary'] }}>{n}</code>
              <span style={{ color: c['content-tertiary'] }}>{t}</span>
              <span style={{ color: c['content-secondary'] }}>{h}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: sp.C, fontSize: fs.xs, color: c['content-tertiary'] }}>12.4M rows · synced 2h ago</div>
      </Card>

      {/* Right: actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
        <div style={{ fontSize: 11, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.semibold, marginBottom: sp.A }}>What you can do</div>
        <PrimaryButton size="sm">✦ Build a model with this</PrimaryButton>
        <GhostButton size="sm">+ Add to existing model</GhostButton>
        <GhostButton size="sm">▶ Preview rows</GhostButton>
        <GhostButton size="sm">⌕ Ask Spotter about this</GhostButton>
        <GhostButton size="sm">≡ See lineage</GhostButton>
        <GhostButton size="sm">⎘ Copy fully qualified name</GhostButton>
      </div>
    </div>
  </div>
);

// ── Top-level component ──────────────────────────────────────────────────────

export const DataBrowserExploration: React.FC = () => {
  const [state, setState] = useState<SubState>('all');
  return (
    <ExplorationFrame
      title="Data Browser — explorations"
      subtabs={SUBTABS}
      active={state}
      onChange={(id) => setState(id as SubState)}
    >
      {state === 'all'           && <AllDataState />}
      {state === 'connection'    && <ConnectionDrilledState />}
      {state === 'schema'        && <SchemaState />}
      {state === 'table-actions' && <TableActionsState />}
    </ExplorationFrame>
  );
};
