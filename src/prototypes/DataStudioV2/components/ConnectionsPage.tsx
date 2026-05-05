import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { TextInput } from '../../../components/TextInput';
import { Select } from '../../../components/Select';
import { Tabs } from '../../../components/Tabs';
import { Modal } from '../../../components/Modal';
import { Checkbox } from '../../../components/Checkbox';
import { Icon } from '../../../components/icons';
import { CONNECTIONS, Connection, ConnectionType } from '../data/mockData';

// ── Connection type visual (icon + brand accent color) ───────────────────────

const CONN_COLOR: Record<string, string> = {
  snowflake:  '#29B5E8',
  bigquery:   '#4285F4',
  databricks: '#FF3621',
  redshift:   '#8C4FFF',
  postgres:   '#336791',
  dbt:        '#FF694A',
};

const CONN_LABEL: Record<string, string> = {
  snowflake:  'Snowflake',
  bigquery:   'BigQuery',
  databricks: 'Databricks',
  redshift:   'Redshift',
  postgres:   'Postgres',
  dbt:        'dbt',
};

const ConnIcon: React.FC<{ type: string; size?: 's' | 'm' | 'l' }> = ({ type, size = 'm' }) => (
  <Icon name="database" size={size} color={CONN_COLOR[type] ?? c['content-secondary']} />
);

// ── Status indicator ─────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: Connection['status'] }> = ({ status }) => {
  const color = status === 'connected' ? c['content-success']
              : status === 'auth-needed' ? c['content-warning']
              : c['content-danger'];
  const label = status === 'connected' ? 'Connected'
              : status === 'auth-needed' ? 'Auth needed'
              : 'Error';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: fs.xs, color, fontWeight: fw.medium, fontFamily: ff.primary }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, flexShrink: 0 }} />
      {label}
    </span>
  );
};

// ── Page header (title + optional back + right actions) ──────────────────────

const PageHeader: React.FC<{
  title:     string;
  subtitle?: string;
  back?:     () => void;
  actions?:  React.ReactNode;
}> = ({ title, subtitle, back, actions }) => (
  <div style={{
    flexShrink: 0,
    padding: `${sp.D}px ${sp.H}px`,
    backgroundColor: c['background-base'],
    borderBottom: `1px solid ${c['border-divider']}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.D,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
      {back && (
        <Button variant="ghost" size="basic" onClick={back}>←</Button>
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>{title}</h1>
        {subtitle && <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>{subtitle}</div>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B, alignItems: 'center' }}>{actions}</div>}
  </div>
);

// ── List view ────────────────────────────────────────────────────────────────

const ListView: React.FC<{
  connections: Connection[];
  onNew:       () => void;
  onDetail:    () => void;
}> = ({ connections, onNew, onDetail }) => (
  <>
    <PageHeader
      title="Connections"
      subtitle="Authenticated sources for your warehouse and integrations"
      actions={<Button variant="primary" size="basic" onClick={onNew}>New connection</Button>}
    />
    <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.E}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Card>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 2.4fr 1fr 1fr 0.6fr 32px',
            gap: sp.C,
            padding: `${sp.B}px ${sp.D}px`,
            backgroundColor: c['background-subtle'],
            borderBottom: `1px solid ${c['border-divider']}`,
          }}>
            {['', 'Name', 'Type', 'Status', 'Tables', ''].map((h, i) => (
              <div key={i} style={{
                fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'],
                textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: ff.primary,
              }}>{h}</div>
            ))}
          </div>
          {connections.map((conn, i) => (
            <div
              key={conn.id}
              onClick={onDetail}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 2.4fr 1fr 1fr 0.6fr 32px',
                gap: sp.C,
                padding: `${sp.C}px ${sp.D}px`,
                alignItems: 'center',
                cursor: 'pointer',
                borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
                fontFamily: ff.primary,
              }}
            >
              <ConnIcon type={conn.type} size="m" />
              <div>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{conn.name}</div>
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1 }}>
                  {conn.status === 'auth-needed' ? 'Authenticate to access' : `You · last sync ${conn.lastSync}`}
                </div>
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{CONN_LABEL[conn.type]}</div>
              <StatusDot status={conn.status} />
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{conn.tables || '—'}</div>
              <Button variant="ghost" size="basic" onClick={(e) => e.stopPropagation()}>
                <Icon name="more" size="s" />
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </>
);

// ── New connection wizard ────────────────────────────────────────────────────

type WizardStep = 'pick' | 'form' | 'test' | 'done';

const TYPE_TILES: { kind: ConnectionType; tagline: string }[] = [
  { kind: 'snowflake',  tagline: 'Cloud data warehouse' },
  { kind: 'bigquery',   tagline: "Google's serverless warehouse" },
  { kind: 'databricks', tagline: 'Lakehouse platform' },
  { kind: 'redshift',   tagline: 'AWS data warehouse' },
  { kind: 'postgres',   tagline: 'Relational database' },
];

const STEP_LABELS: WizardStep[] = ['pick', 'form', 'test', 'done'];
const STEP_NAMES  = ['Choose type', 'Configure', 'Test connection', 'Done'];

const NewWizard: React.FC<{
  onCancel: () => void;
  onDone:   (conn: Connection) => void;
}> = ({ onCancel, onDone }) => {
  const [step, setStep]       = useState<WizardStep>('pick');
  const [connType, setConnType] = useState<ConnectionType | null>(null);
  const [connName, setConnName] = useState('');

  const stepIdx = STEP_LABELS.indexOf(step);

  const handleBack = () => {
    if (step === 'pick') { onCancel(); return; }
    const prev = STEP_LABELS[stepIdx - 1];
    if (prev) setStep(prev);
  };

  const handleDone = () => {
    if (!connType) return;
    onDone({
      id:         `conn-${Date.now()}`,
      name:       connName || `${connType}-prod`,
      type:       connType,
      status:     'connected',
      lastSync:   'Just now',
      ownerEmail: 'vivek@example.com',
      tables:     184,
    });
  };

  return (
    <>
      <PageHeader
        title="New connection"
        subtitle={`Step ${stepIdx + 1} of 4`}
        back={handleBack}
      />

      {/* Step indicator */}
      <div style={{
        flexShrink: 0,
        padding: `${sp.B}px ${sp.H}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: sp.B }}>
          {STEP_LABELS.map((s, i) => {
            const reached = stepIdx >= i;
            const current = step === s;
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                    backgroundColor: current ? c['content-brand'] : reached ? c['content-success'] : c['background-subtle'],
                    color: 'white', fontSize: 11, fontWeight: fw.medium,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {reached && !current ? '✓' : i + 1}
                  </span>
                  <span style={{
                    fontSize: fs.xs, fontFamily: ff.primary,
                    color: current ? c['content-primary'] : c['content-tertiary'],
                    fontWeight: current ? fw.medium : fw.regular,
                  }}>
                    {STEP_NAMES[i]}
                  </span>
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
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.A }}>
                Choose what you're connecting to
              </h2>
              <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, marginBottom: sp.E }}>
                Pick the type first — fields adjust to that source.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: sp.C }}>
                {TYPE_TILES.map(t => (
                  <div key={t.kind} onClick={() => { setConnType(t.kind); setConnName(`${t.kind}-prod`); setStep('form'); }} style={{ cursor: 'pointer' }}>
                    <Card interactive>
                      <div style={{ padding: sp.D, display: 'flex', alignItems: 'center', gap: sp.C }}>
                        <ConnIcon type={t.kind} size="l" />
                        <div>
                          <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>{CONN_LABEL[t.kind]}</div>
                          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>{t.tagline}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'form' && connType && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.E }}>
                <ConnIcon type={connType} size="l" />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
                  Configure {CONN_LABEL[connType]} connection
                </h2>
              </div>
              <Card>
                <div style={{ padding: sp.E, display: 'flex', flexDirection: 'column', gap: sp.D }}>
                  <TextInput
                    label="Connection name"
                    placeholder={`${connType}-prod`}
                    value={connName}
                    onChange={(e) => setConnName(e.target.value)}
                  />
                  <TextInput
                    label={connType === 'bigquery' ? 'Project ID' : 'Account'}
                    placeholder={connType === 'bigquery' ? 'my-gcp-project' : 'mycompany.us-east-1'}
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
                  {connType === 'snowflake' && (
                    <>
                      <TextInput label="Default warehouse" placeholder="COMPUTE_WH"  defaultValue="COMPUTE_WH"   />
                      <TextInput label="Default role"      placeholder="ANALYST_ROLE" defaultValue="ANALYST_ROLE" />
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

          {step === 'test' && connType && (
            <>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.D }}>
                Testing connection
              </h2>
              <Card>
                <div style={{ padding: sp.E }}>
                  {[
                    'Authenticating with OAuth',
                    'Verifying warehouse access',
                    'Listing accessible schemas (6 found)',
                    'Validating role permissions',
                  ].map((s, i) => (
                    <div key={s} style={{
                      display: 'flex', alignItems: 'center', gap: sp.C,
                      padding: `${sp.B}px 0`,
                      borderBottom: i < 3 ? `1px solid ${c['background-subtle']}` : 'none',
                    }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 8,
                        backgroundColor: c['content-success'], color: 'white',
                        fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>✓</span>
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

          {step === 'done' && connType && (
            <Card>
              <div style={{ padding: sp.G, textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto', borderRadius: 28,
                  backgroundColor: c['background-success'], color: c['content-success'],
                  fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</div>
                <h2 style={{ margin: 0, marginTop: sp.D, fontSize: 18, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
                  Connected
                </h2>
                <p style={{ margin: 0, marginTop: sp.B, fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary }}>
                  184 tables visible based on your role permissions.
                </p>
                <div style={{ marginTop: sp.E, display: 'flex', justifyContent: 'center', gap: sp.B }}>
                  <Button variant="secondary" size="basic" onClick={handleDone}>Back to connections</Button>
                  <Button variant="primary"   size="basic" onClick={handleDone}>Open connection</Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </>
  );
};

// ── Connection detail ────────────────────────────────────────────────────────

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview'        },
  { id: 'schemas',  label: 'Schemas'         },
  { id: 'dbt',      label: 'dbt integration' },
];

const SCHEMA_FILTER_LIST = [
  { name: 'ANALYTICS', visible: true,  count: 84,  denied: false },
  { name: 'FINANCE',   visible: true,  count: 32,  denied: false },
  { name: 'MARKETING', visible: false, count: 28,  denied: false },
  { name: 'PRODUCT',   visible: false, count: 22,  denied: false },
  { name: 'STAGING',   visible: false, count: 18,  denied: false },
  { name: 'RAW',       visible: false, count: 0,   denied: true  },
];

const DetailView: React.FC<{
  onBack:       () => void;
  onSetupDbt:   () => void;
}> = ({ onBack, onSetupDbt }) => {
  const [activeTab,       setActiveTab]       = useState('overview');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [schemaFilter,    setSchemaFilter]    = useState(
    SCHEMA_FILTER_LIST.map(s => ({ ...s }))
  );

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

      <div style={{
        flexShrink: 0,
        padding: `0 ${sp.H}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.E}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {activeTab === 'overview' && (
            <Card>
              <div style={{ padding: sp.E }}>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: sp.C, fontFamily: ff.primary }}>
                  Connection details
                </div>
                {[
                  ['Account',         'mycompany.us-east-1'],
                  ['Warehouse',       'COMPUTE_WH'],
                  ['Role',            'ANALYST_ROLE'],
                  ['Auth method',     'OAuth · token expires in 84 days'],
                  ['Schemas visible', '2 of 6 (filtered)'],
                  ['Last used',       '12 minutes ago'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'grid', gridTemplateColumns: '180px 1fr',
                    padding: `${sp.A + 2}px 0`, fontSize: fs.sm, fontFamily: ff.primary,
                    borderTop: `1px solid ${c['border-divider']}`,
                  }}>
                    <div style={{ color: c['content-secondary'] }}>{k}</div>
                    <div style={{ color: c['content-primary'] }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'schemas' && (
            <>
              <Card>
                <div style={{ padding: sp.E }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
                    <div>
                      <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
                        Schemas in scope
                      </div>
                      <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>
                        2 of 6 schemas added · 116 tables visible
                      </div>
                    </div>
                    <Button variant="secondary" size="basic" onClick={() => setFilterModalOpen(true)}>
                      Edit filter
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
                    {schemaFilter.filter(s => s.visible).map(s => (
                      <div key={s.name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: `${sp.B}px ${sp.C}px`,
                        border: `1px solid ${c['border-divider']}`, borderRadius: 4,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                          <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{s.name}</span>
                          <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>· {s.count} tables</span>
                        </div>
                        <span style={{ fontSize: fs.xs, color: c['content-success'], fontFamily: ff.primary, fontWeight: fw.medium }}>
                          ● Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Modal
                isOpen={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                title="Edit schema filter"
                size="M2"
                footer={
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
                    <Button variant="secondary" size="basic" onClick={() => setFilterModalOpen(false)}>Cancel</Button>
                    <Button variant="primary"   size="basic" onClick={() => setFilterModalOpen(false)}>Save filter</Button>
                  </div>
                }
              >
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginBottom: sp.D, fontFamily: ff.primary }}>
                  Choose which schemas show up. You can change this anytime.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  {schemaFilter.map((s, i) => (
                    <div key={s.name} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      opacity: s.denied ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                        <Checkbox
                          checked={s.visible}
                          disabled={s.denied}
                          onChange={(checked) => {
                            const next = [...schemaFilter];
                            next[i] = { ...next[i], visible: checked };
                            setSchemaFilter(next);
                          }}
                        />
                        <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{s.name}</span>
                        <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>
                          · {s.count} tables{s.denied ? ' (no permission)' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Modal>
            </>
          )}

          {activeTab === 'dbt' && (
            <Card>
              <div style={{ padding: sp.G, textAlign: 'center' }}>
                <Icon name="database" size="l" color={CONN_COLOR['dbt']} />
                <h3 style={{ margin: 0, marginTop: sp.C, fontSize: fs.md, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
                  No dbt integration yet
                </h3>
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

const DbtSetupView: React.FC<{
  onCancel: () => void;
  onDone:   () => void;
}> = ({ onCancel, onDone }) => (
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
              <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, fontFamily: ff.primary }}>
                dbt source
              </div>
              <div style={{ display: 'flex', gap: sp.B }}>
                {[
                  { label: 'dbt Cloud',      hint: 'API token + project IDs', selected: true  },
                  { label: 'dbt Core (Git)', hint: 'Git repo + manifest',     selected: false },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, padding: sp.C,
                    border:           `1px solid ${s.selected ? c['content-brand'] : c['border-default']}`,
                    borderRadius:     6,
                    backgroundColor:  s.selected ? c['background-information'] : c['background-base'],
                    cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: s.selected ? c['content-brand'] : c['content-primary'], fontFamily: ff.primary }}>{s.label}</div>
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2, fontFamily: ff.primary }}>{s.hint}</div>
                  </div>
                ))}
              </div>
            </div>
            <TextInput label="API token"   placeholder="dbtc_••••••••••••••••" defaultValue="dbtc_••••••••••••••••" />
            <TextInput label="Account ID"  placeholder="12345"                  defaultValue="12345"                />
            <Select
              label="Project"
              fullWidth
              options={[
                { id: 'analytics-prod', label: 'analytics (production)' },
                { id: 'analytics-dev',  label: 'analytics (dev)'        },
                { id: 'finance',        label: 'finance'                 },
              ]}
              value="analytics-prod"
            />
          </div>
        </Card>
        <div style={{ marginTop: sp.D, display: 'flex', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" size="basic" onClick={onCancel}>Cancel</Button>
          <Button variant="primary"   size="basic" onClick={onDone}>Connect &amp; import</Button>
        </div>
      </div>
    </div>
  </>
);

// ── Top-level page component ─────────────────────────────────────────────────

type SubView = 'list' | 'new' | 'detail' | 'dbt-setup';

const ConnectionsPage: React.FC = () => {
  const [view,        setView]        = useState<SubView>('list');
  const [connections, setConnections] = useState<Connection[]>(CONNECTIONS);

  const handleNewDone = (conn: Connection) => {
    setConnections(prev => [...prev, conn]);
    setView('list');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {view === 'list'      && <ListView   connections={connections} onNew={() => setView('new')} onDetail={() => setView('detail')} />}
      {view === 'new'       && <NewWizard  onCancel={() => setView('list')} onDone={handleNewDone} />}
      {view === 'detail'    && <DetailView onBack={() => setView('list')} onSetupDbt={() => setView('dbt-setup')} />}
      {view === 'dbt-setup' && <DbtSetupView onCancel={() => setView('detail')} onDone={() => setView('detail')} />}
    </div>
  );
};

export default ConnectionsPage;
