import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { ExplorationFrame, Card, PrimaryButton, GhostButton, Pill } from './ExplorationFrame';

type SubState = 'empty' | 'list' | 'new' | 'detail' | 'dbt-setup';

const SUBTABS = [
  { id: 'empty',     label: 'Empty (Day Zero)' },
  { id: 'list',      label: 'List (populated)' },
  { id: 'new',       label: 'New connection — Snowflake' },
  { id: 'detail',    label: 'Connection detail' },
  { id: 'dbt-setup', label: 'dbt — set up integration' },
];

// ── Connection logos / icons (text-based to avoid asset deps) ────────────────

const Logo: React.FC<{ kind: string }> = ({ kind }) => {
  const palette: Record<string, string> = {
    Snowflake:  '#29B5E8',
    BigQuery:   '#4285F4',
    Databricks: '#FF3621',
    Redshift:   '#8C4FFF',
    Postgres:   '#336791',
    dbt:        '#FF694A',
  };
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 6,
      backgroundColor: palette[kind] ?? c['background-subtle'],
      color: 'white', fontSize: 12, fontWeight: fw.bold,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {kind[0]}
    </div>
  );
};

// ── Empty state (Day Zero) ───────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div style={{ padding: `${sp.J}px ${sp.H}px`, maxWidth: 720, margin: '0 auto' }}>
    <h1 style={{ margin: 0, fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'] }}>
      Connect your data
    </h1>
    <p style={{ marginTop: sp.B, marginBottom: sp.G, fontSize: fs.sm, color: c['content-secondary'] }}>
      Authenticate to your warehouse to start. ThoughtSpot will only show data you have access to.
    </p>

    {/* Warehouse picker grid */}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: sp.C,
    }}>
      {['Snowflake', 'BigQuery', 'Databricks', 'Redshift', 'Postgres'].map(k => (
        <Card key={k} style={{ padding: sp.D, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp.C }}>
          <Logo kind={k} />
          <div>
            <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{k}</div>
            <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>Warehouse</div>
          </div>
        </Card>
      ))}
      <Card style={{ padding: sp.D, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp.C, borderStyle: 'dashed' }}>
        <Logo kind="dbt" />
        <div>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>dbt <Pill tone="info">Integration</Pill></div>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>Bring your dbt models</div>
        </div>
      </Card>
    </div>

    <div style={{ marginTop: sp.G, fontSize: fs.xs, color: c['content-tertiary'], textAlign: 'center' }}>
      Already have a connection? Ask your admin to add you.
    </div>
  </div>
);

// ── List state (populated) ───────────────────────────────────────────────────

const CONN_LIST = [
  { id: 'snow-prod', name: 'snowflake-prod',     type: 'Snowflake',  status: 'connected',  user: 'You authenticated · 2 days ago', tables: 184, dbt: false },
  { id: 'bq-mkt',    name: 'bigquery-marketing', type: 'BigQuery',   status: 'connected',  user: 'You authenticated · last week',   tables: 42,  dbt: false },
  { id: 'dbt-mkt',   name: 'marketing-models',   type: 'dbt',        status: 'connected',  user: 'depends on bigquery-marketing',   tables: 18,  dbt: true  },
  { id: 'snow-fin',  name: 'snowflake-finance',  type: 'Snowflake',  status: 'auth-needed', user: 'Authenticate to access',         tables: 0,   dbt: false },
];

const ListState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.D, maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'] }}>Connections</h1>
      <PrimaryButton size="sm">+ New connection</PrimaryButton>
    </div>

    <Card style={{ maxWidth: 1080, margin: '0 auto', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 80px', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
        {['', 'Name', 'Type', 'Status', 'Tables', ''].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
        ))}
      </div>
      {CONN_LIST.map((conn, i) => (
        <div key={conn.id} style={{
          display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 80px', gap: sp.C,
          padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
          borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
        }}>
          <Logo kind={conn.type} />
          <div>
            <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{conn.name}</div>
            <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{conn.user}</div>
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conn.type}</div>
          <div>
            {conn.status === 'connected'   && <Pill tone="good">● Connected</Pill>}
            {conn.status === 'auth-needed' && <Pill tone="warn">● Auth needed</Pill>}
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conn.tables}</div>
          <div style={{ fontSize: 18, color: c['content-tertiary'] }}>···</div>
        </div>
      ))}
    </Card>
  </div>
);

// ── New connection form (Snowflake) ──────────────────────────────────────────

const NewConnectionState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 640, margin: '0 auto' }}>
    <button style={{ background: 'none', border: 'none', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', padding: 0, marginBottom: sp.D }}>← Back</button>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.D }}>
      <Logo kind="Snowflake" />
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'] }}>Connect to Snowflake</h1>
    </div>

    <Card style={{ padding: sp.F, display: 'flex', flexDirection: 'column', gap: sp.D }}>
      {[
        { label: 'Connection name', value: 'snowflake-finance', hint: 'How this shows in your connection list' },
        { label: 'Account',         value: 'mycompany.us-east-1', hint: 'Your Snowflake account identifier' },
        { label: 'Auth method',     value: 'OAuth (recommended)', hint: 'You will sign in with your warehouse credentials', isSelect: true },
        { label: 'Default warehouse', value: 'COMPUTE_WH', hint: 'Used for queries unless overridden' },
        { label: 'Default role',     value: 'ANALYST_ROLE', hint: 'Determines what data you can see' },
      ].map(f => (
        <div key={f.label}>
          <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>{f.label}</label>
          <div style={{
            padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 4,
            backgroundColor: c['background-base'], fontSize: fs.sm, color: c['content-primary'],
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {f.value} {f.isSelect && <span style={{ color: c['content-tertiary'] }}>▾</span>}
          </div>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 3 }}>{f.hint}</div>
        </div>
      ))}

      {/* Soft schema filter */}
      <div style={{ borderTop: `1px solid ${c['border-divider']}`, paddingTop: sp.D, marginTop: sp.B }}>
        <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.A }}>Schemas to bring in <Pill tone="info">Optional</Pill></div>
        <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.B }}>Start small for trust, expand later. You can change this anytime.</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.A }}>
          {['ANALYTICS', 'FINANCE', 'MARKETING', 'PRODUCT', 'STAGING (dbt)', 'RAW'].map((s, i) => {
            const checked = i < 2;
            return (
              <span key={s} style={{
                padding: `${sp.A}px ${sp.B + 2}px`, borderRadius: 12,
                border: `1px solid ${checked ? c['content-brand'] : c['border-default']}`,
                backgroundColor: checked ? c['background-information'] : 'transparent',
                color: checked ? c['content-brand'] : c['content-secondary'],
                fontSize: fs.xs, fontWeight: fw.medium, cursor: 'pointer',
              }}>{checked && '✓ '}{s}</span>
            );
          })}
        </div>
      </div>
    </Card>

    <div style={{ marginTop: sp.D, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
      <GhostButton size="sm">Cancel</GhostButton>
      <PrimaryButton size="sm">Sign in & connect</PrimaryButton>
    </div>
  </div>
);

// ── Connection detail (clicked into a connection) ────────────────────────────

const DetailState: React.FC = () => {
  const [tab, setTab] = useState<'overview' | 'schemas' | 'dbt' | 'settings'>('overview');
  return (
    <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 1080, margin: '0 auto' }}>
      <button style={{ background: 'none', border: 'none', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', padding: 0, marginBottom: sp.D }}>← Connections</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.B }}>
        <Logo kind="Snowflake" />
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'] }}>snowflake-prod</h1>
        <Pill tone="good">● Connected</Pill>
      </div>
      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.E }}>
        You authenticated as <code>vivek@example.com</code> · 2 days ago · 184 tables visible
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${c['border-divider']}`, marginBottom: sp.E }}>
        {(['overview', 'schemas', 'dbt', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: `${sp.B}px ${sp.D}px`, border: 'none', backgroundColor: 'transparent',
            borderBottom: tab === t ? `2px solid ${c['content-brand']}` : '2px solid transparent',
            color: tab === t ? c['content-primary'] : c['content-secondary'],
            fontSize: fs.sm, fontWeight: tab === t ? fw.semibold : fw.regular,
            cursor: 'pointer', marginBottom: -1,
            textTransform: 'capitalize' as const,
          }}>
            {t === 'dbt' ? 'dbt integration' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card style={{ padding: sp.E }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.C, color: c['content-primary'] }}>Connection info</div>
          {[
            ['Account',     'mycompany.us-east-1'],
            ['Warehouse',   'COMPUTE_WH'],
            ['Role',        'ANALYST_ROLE'],
            ['Auth method', 'OAuth · token expires in 84 days'],
            ['Schemas',     'ANALYTICS, FINANCE (+ 4 hidden)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: `${sp.A + 1}px 0`, fontSize: fs.sm }}>
              <div style={{ color: c['content-secondary'] }}>{k}</div>
              <div style={{ color: c['content-primary'] }}>{v}</div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'schemas' && (
        <Card style={{ padding: sp.E }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.B, color: c['content-primary'] }}>Schemas in this connection</div>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.C }}>
            Pick the schemas you want to see. You can change this anytime — it doesn't affect your warehouse permissions.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
            {[
              { name: 'ANALYTICS',     visible: true,  count: 84 },
              { name: 'FINANCE',       visible: true,  count: 32 },
              { name: 'MARKETING',     visible: false, count: 28 },
              { name: 'PRODUCT',       visible: false, count: 22 },
              { name: 'STAGING (dbt)', visible: false, count: 18 },
              { name: 'RAW',           visible: false, count: 0,  note: 'no permission' },
            ].map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-divider']}`, borderRadius: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: `1px solid ${s.visible ? c['content-brand'] : c['border-default']}`,
                    backgroundColor: s.visible ? c['content-brand'] : 'transparent',
                    color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{s.visible && '✓'}</span>
                  <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{s.name}</span>
                  <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>· {s.count} tables</span>
                  {s.note && <Pill tone="warn">{s.note}</Pill>}
                </div>
                <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{s.visible ? 'Visible' : 'Hidden'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'dbt' && (
        <Card style={{ padding: sp.E }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.A, color: c['content-primary'] }}>dbt integration <Pill tone="good">Connected</Pill></div>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.D }}>
            Source: dbt Cloud · project <code>analytics</code> · last sync 2h ago
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.B }}>
            {[
              ['Models imported', '18'],
              ['Sources tracked', '12'],
              ['Tests passing',   '156 / 162'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: sp.C, border: `1px solid ${c['border-divider']}`, borderRadius: 6 }}>
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: sp.D, display: 'flex', gap: sp.B }}>
            <GhostButton size="sm">Refresh now</GhostButton>
            <GhostButton size="sm">View imported models →</GhostButton>
          </div>
        </Card>
      )}

      {tab === 'settings' && (
        <Card style={{ padding: sp.E }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, marginBottom: sp.C, color: c['content-primary'] }}>Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <GhostButton size="sm">Re-authenticate</GhostButton>
            <GhostButton size="sm">Test connection</GhostButton>
            <GhostButton size="sm">Edit connection details</GhostButton>
            <button style={{ padding: `${sp.B}px ${sp.D}px`, border: `1px solid ${c['content-danger']}`, borderRadius: 6, backgroundColor: c['background-base'], color: c['content-danger'], fontSize: fs.sm, fontFamily: ff.primary, fontWeight: fw.medium, cursor: 'pointer' }}>Disconnect</button>
          </div>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: sp.C }}>
            Disconnecting removes your authentication. Models built on this connection stay as drafts but won't refresh.
          </div>
        </Card>
      )}
    </div>
  );
};

// ── dbt setup flow ───────────────────────────────────────────────────────────

const DbtSetupState: React.FC = () => (
  <div style={{ padding: `${sp.G}px ${sp.H}px`, maxWidth: 640, margin: '0 auto' }}>
    <button style={{ background: 'none', border: 'none', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', padding: 0, marginBottom: sp.D }}>← Back</button>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.B }}>
      <Logo kind="dbt" />
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'] }}>Set up dbt</h1>
    </div>
    <p style={{ marginTop: 0, marginBottom: sp.E, fontSize: fs.sm, color: c['content-secondary'] }}>
      dbt is an integration on top of an existing warehouse connection. Pick the warehouse first.
    </p>

    <Card style={{ padding: sp.E, display: 'flex', flexDirection: 'column', gap: sp.D }}>
      <div>
        <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>Warehouse connection</label>
        <div style={{ padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 4, fontSize: fs.sm, display: 'flex', justifyContent: 'space-between' }}>
          <span><Logo kind="Snowflake" /> snowflake-prod</span>
          <span style={{ color: c['content-tertiary'] }}>▾</span>
        </div>
        <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 3 }}>dbt needs a warehouse connection to query data</div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>dbt source</label>
        <div style={{ display: 'flex', gap: sp.B }}>
          {['dbt Cloud', 'dbt Core (Git)'].map((s, i) => (
            <div key={s} style={{
              flex: 1, padding: sp.C, border: `1px solid ${i === 0 ? c['content-brand'] : c['border-default']}`, borderRadius: 6,
              backgroundColor: i === 0 ? c['background-information'] : c['background-base'],
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: i === 0 ? c['content-brand'] : c['content-primary'] }}>{s}</div>
              <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{i === 0 ? 'API token + project IDs' : 'Git repo + manifest'}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>API token</label>
        <div style={{ padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 4, fontSize: fs.sm, color: c['content-tertiary'] }}>•••••••••••••••••••</div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>Project</label>
        <div style={{ padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 4, fontSize: fs.sm, display: 'flex', justifyContent: 'space-between' }}>
          <span>analytics (production env)</span>
          <span style={{ color: c['content-tertiary'] }}>▾</span>
        </div>
      </div>
    </Card>

    <div style={{ marginTop: sp.D, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
      <GhostButton size="sm">Cancel</GhostButton>
      <PrimaryButton size="sm">Connect & import models</PrimaryButton>
    </div>
  </div>
);

// ── Top-level component ──────────────────────────────────────────────────────

export const ConnectionsExploration: React.FC = () => {
  const [state, setState] = useState<SubState>('empty');
  return (
    <ExplorationFrame
      title="Connections — explorations"
      subtabs={SUBTABS}
      active={state}
      onChange={(id) => setState(id as SubState)}
    >
      {state === 'empty'     && <EmptyState />}
      {state === 'list'      && <ListState />}
      {state === 'new'       && <NewConnectionState />}
      {state === 'detail'    && <DetailState />}
      {state === 'dbt-setup' && <DbtSetupState />}
    </ExplorationFrame>
  );
};
