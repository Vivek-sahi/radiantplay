import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { TextInput } from '../../../../components/TextInput';
import { Select } from '../../../../components/Select';
import Shell from '../Shell';
import { SubStateBar } from './ExplorationFrame';

type SubState = 'list' | 'new' | 'detail' | 'dbt-setup';

const SUBTABS = [
  { id: 'list',      label: 'List' },
  { id: 'new',       label: 'New connection (wizard)' },
  { id: 'detail',    label: 'Connection detail' },
  { id: 'dbt-setup', label: 'dbt — set up integration' },
];

// ── Logo helper ──────────────────────────────────────────────────────────────

const Logo: React.FC<{ kind: string; size?: number }> = ({ kind, size = 32 }) => {
  const palette: Record<string, string> = {
    Snowflake: '#29B5E8', BigQuery: '#4285F4', Databricks: '#FF3621',
    Redshift: '#8C4FFF', Postgres: '#336791', dbt: '#FF694A',
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      backgroundColor: palette[kind] ?? c['background-subtle'],
      color: 'white', fontSize: size * 0.4, fontWeight: fw.medium,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{kind[0]}</div>
  );
};

const StatusDot: React.FC<{ status: 'connected' | 'auth-needed' | 'error' }> = ({ status }) => {
  const color = status === 'connected' ? c['content-success'] : status === 'auth-needed' ? c['content-warning'] : c['content-danger'];
  const label = status === 'connected' ? 'Connected' : status === 'auth-needed' ? 'Auth needed' : 'Error';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: fs.xs, color, fontWeight: fw.medium }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} /> {label}
    </span>
  );
};

// ── Page header (title + right-side actions) ────────────────────────────────

const PageHeader: React.FC<{ title: string; subtitle?: string; back?: () => void; actions?: React.ReactNode }> = ({ title, subtitle, back, actions }) => (
  <div style={{
    flexShrink: 0,
    padding: `${sp.D}px ${sp.H}px`,
    backgroundColor: c['background-base'],
    borderBottom: `1px solid ${c['border-divider']}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.D,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
      {back && (
        <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: c['content-secondary'], display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>←</span>
        </button>
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>{title}</h1>
        {subtitle && <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>{subtitle}</div>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B }}>{actions}</div>}
  </div>
);

// ── List state — populated ──────────────────────────────────────────────────

const CONN_LIST = [
  { id: 'snow-prod', name: 'snowflake-prod',     type: 'Snowflake',  status: 'connected' as const,    user: 'You · authenticated 2 days ago', tables: 184 },
  { id: 'bq-mkt',    name: 'bigquery-marketing', type: 'BigQuery',   status: 'connected' as const,    user: 'You · authenticated last week',   tables: 42  },
  { id: 'snow-fin',  name: 'snowflake-finance',  type: 'Snowflake',  status: 'auth-needed' as const,  user: 'Authenticate to access',          tables: 0   },
];

const ListView: React.FC<{ onNew: () => void; onDetail: () => void }> = ({ onNew, onDetail }) => (
  <>
    <PageHeader
      title="Connections"
      subtitle="Authenticated sources for your warehouse and integrations"
      actions={<Button variant="primary" size="basic" onClick={onNew}>New connection</Button>}
    />
    <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.E}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2.4fr 1fr 1fr 0.6fr 32px', gap: sp.C, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
            {['', 'Name', 'Type', 'Status', 'Tables', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: ff.primary }}>{h}</div>
            ))}
          </div>
          {CONN_LIST.map((conn, i) => (
            <div key={conn.id} onClick={onDetail} style={{
              display: 'grid', gridTemplateColumns: '40px 2.4fr 1fr 1fr 0.6fr 32px', gap: sp.C,
              padding: `${sp.C}px ${sp.D}px`, alignItems: 'center', cursor: 'pointer',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
              fontFamily: ff.primary,
            }}>
              <Logo kind={conn.type} size={28} />
              <div>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{conn.name}</div>
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1 }}>{conn.user}</div>
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conn.type}</div>
              <StatusDot status={conn.status} />
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conn.tables}</div>
              <button onClick={(e) => { e.stopPropagation(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-tertiary'], fontSize: 16, padding: 4 }}>⋯</button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </>
);

// ── New connection wizard ────────────────────────────────────────────────────

type ConnType = 'Snowflake' | 'BigQuery' | 'Databricks' | 'Redshift' | 'Postgres';

const TYPE_TILES: { kind: ConnType; tagline: string }[] = [
  { kind: 'Snowflake',  tagline: 'Cloud data warehouse' },
  { kind: 'BigQuery',   tagline: "Google's serverless warehouse" },
  { kind: 'Databricks', tagline: 'Lakehouse platform' },
  { kind: 'Redshift',   tagline: 'AWS data warehouse' },
  { kind: 'Postgres',   tagline: 'Relational database' },
];

const NewWizard: React.FC<{ onCancel: () => void; onDone: () => void }> = ({ onCancel, onDone }) => {
  const [step, setStep] = useState<'pick' | 'form' | 'test' | 'done'>('pick');
  const [type, setType] = useState<ConnType | null>(null);

  return (
    <>
      <PageHeader
        title="New connection"
        subtitle={`Step ${step === 'pick' ? 1 : step === 'form' ? 2 : step === 'test' ? 3 : 4} of 4`}
        back={step === 'pick' ? onCancel : () => setStep(step === 'form' ? 'pick' : step === 'test' ? 'form' : 'test')}
      />

      {/* Step indicator */}
      <div style={{ flexShrink: 0, padding: `${sp.B}px ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: sp.B }}>
          {(['pick', 'form', 'test', 'done'] as const).map((s, i) => {
            const labels = ['Choose type', 'Configure', 'Test connection', 'Done'];
            const reached = ['pick', 'form', 'test', 'done'].indexOf(step) >= i;
            const current = step === s;
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: current ? c['content-brand'] : reached ? c['content-success'] : c['background-subtle'],
                    color: 'white', fontSize: 11, fontWeight: fw.medium,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{reached && !current ? '✓' : i + 1}</span>
                  <span style={{ fontSize: fs.xs, color: current ? c['content-primary'] : c['content-tertiary'], fontWeight: current ? fw.medium : fw.regular }}>{labels[i]}</span>
                </div>
                {i < 3 && <span style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.G}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {step === 'pick' && (
            <>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.A }}>Choose what you're connecting to</h2>
              <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, marginBottom: sp.E }}>Pick the type first — fields adjust to that source.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: sp.C }}>
                {TYPE_TILES.map(t => (
                  <div key={t.kind} onClick={() => { setType(t.kind); setStep('form'); }} style={{ cursor: 'pointer' }}>
                    <Card interactive>
                      <div style={{ padding: sp.D, display: 'flex', alignItems: 'center', gap: sp.C }}>
                        <Logo kind={t.kind} />
                        <div>
                          <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>{t.kind}</div>
                          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>{t.tagline}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'form' && type && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.E }}>
                <Logo kind={type} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>Configure {type} connection</h2>
              </div>
              <Card>
                <div style={{ padding: sp.E, display: 'flex', flexDirection: 'column', gap: sp.D }}>
                  <TextInput
                    label="Connection name"
                    placeholder={`${type.toLowerCase()}-prod`}
                    defaultValue={`${type.toLowerCase()}-prod`}
                  />
                  <TextInput
                    label={type === 'BigQuery' ? 'Project ID' : 'Account'}
                    placeholder={type === 'BigQuery' ? 'my-gcp-project' : 'mycompany.us-east-1'}
                    defaultValue="mycompany.us-east-1"
                  />
                  <Select
                    label="Auth method"
                    fullWidth
                    options={[
                      { id: 'oauth',   label: 'OAuth (recommended)' },
                      { id: 'keypair', label: 'Key pair' },
                      { id: 'pat',     label: 'Personal access token' },
                      { id: 'service', label: 'Service account' },
                    ]}
                    value="oauth"
                  />
                  {type === 'Snowflake' && (
                    <>
                      <TextInput
                        label="Default warehouse"
                        placeholder="COMPUTE_WH"
                        defaultValue="COMPUTE_WH"
                      />
                      <TextInput
                        label="Default role"
                        placeholder="ANALYST_ROLE"
                        defaultValue="ANALYST_ROLE"
                      />
                    </>
                  )}
                </div>
              </Card>
              <div style={{ marginTop: sp.D, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
                <Button variant="secondary" size="basic" onClick={onCancel}>Cancel</Button>
                <Button variant="primary"   size="basic" onClick={() => setStep('test')}>Continue</Button>
              </div>
            </>
          )}

          {step === 'test' && type && (
            <>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.D }}>Testing connection</h2>
              <Card>
                <div style={{ padding: sp.E }}>
                  {[
                    'Authenticating with OAuth',
                    'Verifying warehouse access',
                    'Listing accessible schemas (6 found)',
                    'Validating role permissions',
                  ].map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.B}px 0`, borderBottom: i < 3 ? `1px solid ${c['background-subtle']}` : 'none' }}>
                      <span style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: c['content-success'], color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                      <span style={{ fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary }}>{s}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <div style={{ marginTop: sp.D, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
                <Button variant="secondary" size="basic" onClick={() => setStep('form')}>Back</Button>
                <Button variant="primary"   size="basic" onClick={() => setStep('done')}>Connect</Button>
              </div>
            </>
          )}

          {step === 'done' && type && (
            <>
              <Card>
                <div style={{ padding: sp.G, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 28, backgroundColor: c['background-success'], color: c['content-success'], fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                  <h2 style={{ margin: 0, marginTop: sp.D, fontSize: 18, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>Connected</h2>
                  <p style={{ margin: 0, marginTop: sp.B, fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary }}>184 tables visible based on your role permissions.</p>
                  <div style={{ marginTop: sp.E, display: 'flex', justifyContent: 'center', gap: sp.B }}>
                    <Button variant="secondary" size="basic" onClick={onDone}>Back to connections</Button>
                    <Button variant="primary"   size="basic" onClick={onDone}>Open connection</Button>
                  </div>
                </div>
              </Card>
            </>
          )}

        </div>
      </div>
    </>
  );
};

// ── Connection detail ────────────────────────────────────────────────────────

const DetailView: React.FC<{ onBack: () => void; onSetupDbt: () => void }> = ({ onBack, onSetupDbt }) => {
  const [tab, setTab] = useState<'overview' | 'schemas' | 'dbt'>('overview');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="snowflake-prod"
        subtitle="Snowflake · 184 tables · authenticated as vivek@example.com"
        back={onBack}
        actions={<>
          <Button variant="secondary" size="basic">Re-authenticate</Button>
          <Button variant="secondary" size="basic">Test</Button>
          <Button variant="secondary" size="basic">Edit</Button>
          <Button variant="secondary" size="basic">Disconnect</Button>
        </>}
      />

      {/* Tabs */}
      <div style={{ flexShrink: 0, padding: `0 ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex' }}>
        {(['overview', 'schemas', 'dbt'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: `${sp.C}px ${sp.D}px`,
            border: 'none', backgroundColor: 'transparent',
            borderBottom: tab === t ? `2px solid ${c['content-brand']}` : '2px solid transparent',
            color: tab === t ? c['content-primary'] : c['content-secondary'],
            fontSize: fs.sm, fontFamily: ff.primary, fontWeight: tab === t ? fw.medium : fw.regular,
            cursor: 'pointer', marginBottom: -1, textTransform: 'capitalize' as const,
          }}>{t === 'dbt' ? 'dbt integration' : t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.E}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {tab === 'overview' && (
            <Card>
              <div style={{ padding: sp.E }}>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.C, fontFamily: ff.primary }}>Connection details</div>
                {[
                  ['Account',         'mycompany.us-east-1'],
                  ['Warehouse',       'COMPUTE_WH'],
                  ['Role',            'ANALYST_ROLE'],
                  ['Auth method',     'OAuth · token expires in 84 days'],
                  ['Schemas visible', '2 of 6 (filtered)'],
                  ['Last used',       '12 minutes ago'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: `${sp.A + 2}px 0`, fontSize: fs.sm, fontFamily: ff.primary }}>
                    <div style={{ color: c['content-secondary'] }}>{k}</div>
                    <div style={{ color: c['content-primary'] }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'schemas' && (
            <>
              <Card>
                <div style={{ padding: sp.E }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
                    <div>
                      <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>Schemas in scope</div>
                      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>2 of 6 schemas added · {116} tables visible</div>
                    </div>
                    <Button variant="secondary" size="basic" onClick={() => setFilterModalOpen(true)}>Edit filter</Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
                    {[
                      { name: 'ANALYTICS', count: 84 },
                      { name: 'FINANCE',   count: 32 },
                    ].map(s => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-divider']}`, borderRadius: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                          <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{s.name}</span>
                          <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>· {s.count} tables</span>
                        </div>
                        <span style={{ fontSize: fs.xs, color: c['content-success'], fontFamily: ff.primary, fontWeight: fw.medium }}>● Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {filterModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setFilterModalOpen(false)}>
                  <div onClick={(e) => e.stopPropagation()} style={{ width: 480, backgroundColor: c['background-base'], borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: `${sp.D}px ${sp.E}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                      <div style={{ fontSize: fs.md, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>Edit schema filter</div>
                      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>Choose which schemas show up. You can change this anytime.</div>
                    </div>
                    <div style={{ padding: sp.E, maxHeight: 360, overflowY: 'auto' }}>
                      {[
                        { name: 'ANALYTICS', visible: true,  count: 84 },
                        { name: 'FINANCE',   visible: true,  count: 32 },
                        { name: 'MARKETING', visible: false, count: 28 },
                        { name: 'PRODUCT',   visible: false, count: 22 },
                        { name: 'STAGING',   visible: false, count: 18 },
                        { name: 'RAW',       visible: false, count: 0, denied: true },
                      ].map(s => (
                        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.B}px 0`, opacity: s.denied ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                            <input type="checkbox" defaultChecked={s.visible} disabled={s.denied} />
                            <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{s.name}</span>
                            <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>· {s.count} tables {s.denied && '(no permission)'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: `${sp.C}px ${sp.E}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
                      <Button variant="secondary" size="basic" onClick={() => setFilterModalOpen(false)}>Cancel</Button>
                      <Button variant="primary"   size="basic" onClick={() => setFilterModalOpen(false)}>Save filter</Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'dbt' && (
            <Card>
              <div style={{ padding: sp.G, textAlign: 'center' }}>
                <Logo kind="dbt" size={48} />
                <h3 style={{ margin: 0, marginTop: sp.C, fontSize: fs.md, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>No dbt integration yet</h3>
                <p style={{ margin: 0, marginTop: sp.A, fontSize: fs.sm, color: c['content-secondary'], maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', fontFamily: ff.primary }}>
                  Connect your dbt project to bring in models with their tests, freshness, and lineage. Live link — changes flow both ways.
                </p>
                <div style={{ marginTop: sp.E }}>
                  <Button variant="primary" size="basic" onClick={onSetupDbt}>Set up dbt integration</Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </>
  );
};

// ── dbt setup (started from connection detail) ───────────────────────────────

const DbtSetupView: React.FC<{ onCancel: () => void; onDone: () => void }> = ({ onCancel, onDone }) => (
  <>
    <PageHeader
      title="Set up dbt integration"
      subtitle="On snowflake-prod"
      back={onCancel}
    />
    <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.G}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Card>
          <div style={{ padding: sp.E, display: 'flex', flexDirection: 'column', gap: sp.D }}>
            <div>
              <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4, fontFamily: ff.primary }}>dbt source</label>
              <div style={{ display: 'flex', gap: sp.B }}>
                {[
                  { label: 'dbt Cloud',       hint: 'API token + project IDs', selected: true },
                  { label: 'dbt Core (Git)',  hint: 'Git repo + manifest',     selected: false },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, padding: sp.C,
                    border: `1px solid ${s.selected ? c['content-brand'] : c['border-default']}`,
                    borderRadius: 6,
                    backgroundColor: s.selected ? c['background-information'] : c['background-base'],
                    cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: s.selected ? c['content-brand'] : c['content-primary'], fontFamily: ff.primary }}>{s.label}</div>
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>{s.hint}</div>
                  </div>
                ))}
              </div>
            </div>
            <TextInput label="API token" placeholder="dbtc_••••••••••••••••" defaultValue="dbtc_••••••••••••••••" />
            <TextInput label="Account ID" placeholder="12345" defaultValue="12345" />
            <Select
              label="Project"
              fullWidth
              options={[
                { id: 'analytics-prod', label: 'analytics (production)' },
                { id: 'analytics-dev',  label: 'analytics (dev)' },
                { id: 'finance',        label: 'finance' },
              ]}
              value="analytics-prod"
            />
          </div>
        </Card>
        <div style={{ marginTop: sp.D, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" size="basic" onClick={onCancel}>Cancel</Button>
          <Button variant="primary"   size="basic" onClick={onDone}>Connect & import</Button>
        </div>
      </div>
    </div>
  </>
);

// ── Top-level component ──────────────────────────────────────────────────────

export const ConnectionsExploration: React.FC = () => {
  const [state, setState] = useState<SubState>('list');
  return (
    <Shell activeNav="connections" onNavChange={() => {}}>
      <SubStateBar subtabs={SUBTABS} active={state} onChange={(id) => setState(id as SubState)} />
      {state === 'list'      && <ListView   onNew={() => setState('new')} onDetail={() => setState('detail')} />}
      {state === 'new'       && <NewWizard  onCancel={() => setState('list')} onDone={() => setState('list')} />}
      {state === 'detail'    && <DetailView onBack={() => setState('list')} onSetupDbt={() => setState('dbt-setup')} />}
      {state === 'dbt-setup' && <DbtSetupView onCancel={() => setState('detail')} onDone={() => setState('detail')} />}
    </Shell>
  );
};
