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
import NewConnectionPage from './NewConnectionPage';

// ── Connection type meta ─────────────────────────────────────────────────────

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
  const color = status === 'connected'   ? c['content-success']
              : status === 'auth-needed' ? c['content-warning']
              : c['content-danger'];
  const label = status === 'connected'   ? 'Connected'
              : status === 'auth-needed' ? 'Auth needed'
              : 'Error';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.A, fontSize: fs.xs, color, fontWeight: fw.medium, fontFamily: ff.primary }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, flexShrink: 0 }} />
      {label}
    </span>
  );
};

// ── Shared page header ───────────────────────────────────────────────────────

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
      {back && <Button variant="ghost" size="small" onClick={back}>←</Button>}
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>{title}</h1>
        {subtitle && <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: sp.A, fontFamily: ff.primary }}>{subtitle}</div>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: sp.B, alignItems: 'center' }}>{actions}</div>}
  </div>
);

// ── List view ────────────────────────────────────────────────────────────────

const COL_TEMPLATE = '2fr 1fr 1fr 80px 40px';

const ListView: React.FC<{
  connections: Connection[];
  onNew:       () => void;
  onDetail:    (conn: Connection) => void;
}> = ({ connections, onNew, onDetail }) => (
  <>
    <PageHeader
      title="Connections"
      subtitle="Authenticated sources for your warehouse and integrations"
      actions={<Button variant="primary" size="basic" onClick={onNew}>New connection</Button>}
    />
    <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.E}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
      <Card>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: COL_TEMPLATE,
          gap: sp.C, padding: `${sp.B}px ${sp.D}px`,
          backgroundColor: c['background-subtle'],
          borderBottom: `1px solid ${c['border-divider']}`,
        }}>
          {['Name', 'Source', 'Status', 'Tables', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 12, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: ff.primary }}>
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {connections.map((conn, i) => (
          <div
            key={conn.id}
            onClick={() => onDetail(conn)}
            style={{
              display: 'grid', gridTemplateColumns: COL_TEMPLATE,
              gap: sp.C, padding: `${sp.C}px ${sp.D}px`,
              alignItems: 'center', cursor: 'pointer',
              borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
            }}
          >
            {/* Name + icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, minWidth: 0 }}>
              <ConnIcon type={conn.type} size="s" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conn.name}
                </div>
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conn.status === 'auth-needed' ? 'Authenticate to access' : `You · last sync ${conn.lastSync}`}
                </div>
              </div>
            </div>

            {/* Source */}
            <div style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary }}>
              {CONN_LABEL[conn.type]}
            </div>

            {/* Status */}
            <StatusDot status={conn.status} />

            {/* Tables */}
            <div style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary }}>
              {conn.tables || '—'}
            </div>

            {/* Actions */}
            <Button variant="ghost" size="small" icon="more" iconOnly onClick={(e) => e.stopPropagation()} />
          </div>
        ))}
      </Card>
    </div>
  </>
);


// ── Connection detail ────────────────────────────────────────────────────────

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview'        },
  { id: 'schemas',  label: 'Schemas'         },
  { id: 'dbt',      label: 'dbt integration' },
];

const SCHEMA_FILTER_ITEMS = [
  { name: 'ANALYTICS', visible: true,  count: 84,  denied: false },
  { name: 'FINANCE',   visible: true,  count: 32,  denied: false },
  { name: 'MARKETING', visible: false, count: 28,  denied: false },
  { name: 'PRODUCT',   visible: false, count: 22,  denied: false },
  { name: 'STAGING',   visible: false, count: 18,  denied: false },
  { name: 'RAW',       visible: false, count: 0,   denied: true  },
];

const DetailView: React.FC<{
  conn:       Connection;
  onBack:     () => void;
  onSetupDbt: () => void;
}> = ({ conn, onBack, onSetupDbt }) => {
  const [activeTab,       setActiveTab]       = useState('overview');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [schemaFilter,    setSchemaFilter]    = useState(SCHEMA_FILTER_ITEMS.map(s => ({ ...s })));

  return (
    <>
      <PageHeader
        title={conn.name}
        subtitle={`${CONN_LABEL[conn.type]} · ${conn.tables} tables · authenticated as ${conn.ownerEmail ?? 'you'}`}
        back={onBack}
        actions={<>
          <Button variant="secondary" size="basic">Re-authenticate</Button>
          <Button variant="secondary" size="basic">Test</Button>
          <Button variant="secondary" size="basic">Edit</Button>
          <Button variant="secondary" size="basic">Disconnect</Button>
        </>}
      />

      <div style={{
        flexShrink: 0, padding: `0 ${sp.H}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.E}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>

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
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: sp.A, fontFamily: ff.primary }}>
                      2 of 6 schemas added · 116 tables visible
                    </div>
                  </div>
                  <Button variant="secondary" size="basic" onClick={() => setFilterModalOpen(true)}>Edit filter</Button>
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
                      <span style={{ fontSize: fs.xs, color: c['content-success'], fontFamily: ff.primary, fontWeight: fw.medium }}>● Active</span>
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
                    display: 'flex', alignItems: 'center', gap: sp.B,
                    opacity: s.denied ? 0.5 : 1,
                  }}>
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
    </>
  );
};

// ── dbt setup ────────────────────────────────────────────────────────────────

const DbtSetupView: React.FC<{ conn: Connection; onCancel: () => void; onDone: () => void }> = ({ conn, onCancel, onDone }) => (
  <>
    <PageHeader title="Set up dbt integration" subtitle={`On ${conn.name}`} back={onCancel} />
    <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.G}px ${sp.H}px`, backgroundColor: c['background-sunken'] }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Card>
          <div style={{ padding: sp.E, display: 'flex', flexDirection: 'column', gap: sp.D }}>
            <div>
              <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, fontFamily: ff.primary }}>dbt source</div>
              <div style={{ display: 'flex', gap: sp.B }}>
                {[
                  { label: 'dbt Cloud',      hint: 'API token + project IDs', selected: true  },
                  { label: 'dbt Core (Git)', hint: 'Git repo + manifest',     selected: false },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, padding: sp.C, borderRadius: 6, cursor: 'pointer',
                    border:          `1px solid ${s.selected ? c['content-brand'] : c['border-default']}`,
                    backgroundColor: s.selected ? c['background-information'] : c['background-base'],
                  }}>
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: s.selected ? c['content-brand'] : c['content-primary'], fontFamily: ff.primary }}>{s.label}</div>
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: sp.A, fontFamily: ff.primary }}>{s.hint}</div>
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

// ── Top-level page ───────────────────────────────────────────────────────────

type SubView = 'list' | 'detail' | 'dbt-setup';

const ConnectionsPage: React.FC = () => {
  const [view,           setView]           = useState<SubView>('list');
  const [connections,    setConnections]    = useState<Connection[]>(CONNECTIONS);
  const [selectedConn,   setSelectedConn]   = useState<Connection>(CONNECTIONS[0]);
  const [newConnOpen,    setNewConnOpen]    = useState(false);

  const openDetail = (conn: Connection) => {
    setSelectedConn(conn);
    setView('detail');
  };

  const handleNewDone = (conn: Connection) => {
    setConnections(prev => [...prev, conn]);
    // success screen handles closing via onClose
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {view === 'list' && (
        <ListView
          connections={connections}
          onNew={() => setNewConnOpen(true)}
          onDetail={openDetail}
        />
      )}
      {view === 'detail' && (
        <DetailView
          conn={selectedConn}
          onBack={() => setView('list')}
          onSetupDbt={() => setView('dbt-setup')}
        />
      )}
      {view === 'dbt-setup' && (
        <DbtSetupView
          conn={selectedConn}
          onCancel={() => setView('detail')}
          onDone={() => setView('detail')}
        />
      )}

      {newConnOpen && (
        <NewConnectionPage
          onClose={() => { setNewConnOpen(false); setView('list'); }}
          onDone={handleNewDone}
        />
      )}
    </div>
  );
};

export default ConnectionsPage;
