import React from 'react';
import { c, sp, ff, fs, fw, ts, GLOBAL_NAV_HEIGHT } from '../styles';
import { Button } from '../../../components/Button';
import { ProjectState } from '../index';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'draft' | 'published';
export type HealthStatus = 'good' | 'alert' | 'none';
export type ConnectionType = 'snowflake' | 'thoughtspot' | 'sap';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  audience?: string;
  spotterConversations?: number;
  connection: ConnectionType;
  connectionName: string;
  health: HealthStatus;
  alertCount?: number;
  lastModified: string;
  lastModifiedBy?: string;
}

// ── Mock projects data ────────────────────────────────────────────────────────

const projects: Project[] = [
  { id: 'p1',  name: 'Marketing Campaign Attribution',  status: 'draft',     connection: 'snowflake',    connectionName: 'Snowflake',    health: 'none',  lastModified: 'Yesterday',   lastModifiedBy: 'You'   },
  { id: 'p2',  name: 'Marketing GEO model',             status: 'draft',     connection: 'snowflake',    connectionName: 'Snowflake',    health: 'none',  lastModified: 'Thursday',    lastModifiedBy: 'You'   },
  { id: 'p3',  name: 'Marketing budget forecasting',    status: 'published', audience: 'Entire org',     spotterConversations: 235,  connection: 'thoughtspot', connectionName: 'ThoughtSpot', health: 'good',  lastModified: '3 days ago',  lastModifiedBy: 'Jane'  },
  { id: 'p4',  name: 'APAC campaign trends',            status: 'published', audience: 'APAC group',     spotterConversations: 1839, connection: 'thoughtspot', connectionName: 'ThoughtSpot', health: 'good',  lastModified: '21 days ago'                          },
  { id: 'p5',  name: 'Q3 sales report',                 status: 'published', audience: 'Sales group',    spotterConversations: 512,  connection: 'thoughtspot', connectionName: 'ThoughtSpot', health: 'good',  lastModified: '1 week ago',  lastModifiedBy: 'Mike'  },
  { id: 'p6',  name: 'Customer feedback analysis',      status: 'published', audience: 'Entire org',     spotterConversations: 1020, connection: 'thoughtspot', connectionName: 'ThoughtSpot', health: 'good',  lastModified: '2 weeks ago'                          },
  { id: 'p7',  name: 'Website performance metrics',     status: 'published', audience: 'Marketing',      spotterConversations: 890,  connection: 'snowflake',    connectionName: 'Snowflake',    health: 'good',  lastModified: '5 days ago',  lastModifiedBy: 'Lisa'  },
  { id: 'p8',  name: 'Social media engagement report',  status: 'published', audience: 'Social group',   spotterConversations: 1500, connection: 'snowflake',    connectionName: 'Snowflake',    health: 'alert', alertCount: 1, lastModified: '10 days ago'                  },
  { id: 'p9',  name: 'New product launch timeline',     status: 'published', audience: 'Product group',  spotterConversations: 300,  connection: 'snowflake',    connectionName: 'Snowflake',    health: 'alert', alertCount: 2, lastModified: '2 days ago',  lastModifiedBy: 'Sarah' },
  { id: 'p10', name: 'Employee satisfaction survey',    status: 'published', audience: 'Entire org',     spotterConversations: 2300, connection: 'snowflake',    connectionName: 'Snowflake',    health: 'good',  lastModified: '1 month ago'                          },
  { id: 'p11', name: 'Annual budget review',            status: 'published', audience: 'Finance group',  spotterConversations: 4200, connection: 'sap',          connectionName: 'SAP',          health: 'good',  lastModified: '3 weeks ago', lastModifiedBy: 'Tom'   },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const ConnectionIcon: React.FC<{ type: ConnectionType }> = ({ type }) => {
  if (type === 'snowflake') return <span style={{ fontSize: fs.sm }}>❄</span>;
  if (type === 'sap') return <span style={{ fontSize: fs.xs, fontWeight: 700, color: c['content-brand'] }}>TS</span>;
  return <span style={{ fontSize: fs.xs, fontWeight: 700, color: c['content-brand'] }}>TS</span>;
};

const StatusCell: React.FC<{ project: Project }> = ({ project }) => {
  if (project.status === 'draft') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, color: c['content-secondary'], fontSize: fs.sm }}>
        <span>✏</span> Draft
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, fontSize: fs.sm, color: c['content-primary'] }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c['content-success'], display: 'inline-block', flexShrink: 0 }} />
      {project.audience}
    </div>
  );
};

const HealthCell: React.FC<{ project: Project }> = ({ project }) => {
  if (project.health === 'none') return <span style={{ color: c['content-secondary'], fontSize: fs.sm }}>—</span>;
  if (project.health === 'good') {
    return <span style={{ color: c['content-success'], fontSize: fs.sm }}>♥ Good</span>;
  }
  return (
    <span style={{ color: c['content-warning'], fontSize: fs.sm }}>
      △ {project.alertCount} {project.alertCount === 1 ? 'alert' : 'alerts'}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface ProjectsListProps {
  onOpen: (name?: string) => void;
  currentProject?: ProjectState;
  onResume?: () => void;
}

const STEP_LABEL: Record<ProjectState['buildStep'], string> = {
  empty: '',
  tables: '3 tables added',
  joined: 'Joins created',
  transformed: 'Metrics added',
  healthy: 'AI-ready ✓',
};

const COL_WIDTHS = { name: '32%', status: '13%', spotter: '16%', connection: '14%', health: '12%', modified: '13%' };

const ProjectsList: React.FC<ProjectsListProps> = ({ onOpen, currentProject, onResume }) => {
  const showDraft = currentProject && currentProject.buildStep !== 'empty';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: ff.primary }}>

      {/* Global header */}
      <div style={{ height: GLOBAL_NAV_HEIGHT, backgroundColor: c['background-base-inverse'], display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21.0234 18.0469C22.6674 18.0469 24.0008 19.3795 24.001 21.0234C24.001 22.6675 22.6675 24.001 21.0234 24.001C19.3795 24.0008 18.0469 22.6674 18.0469 21.0234C18.047 19.3796 19.3796 18.047 21.0234 18.0469ZM23.8135 7.44141H15.627V23.8125H14.1387V7.44141H12.6514V23.8125H11.1631V7.44141H9.6748V23.8125H8.18652V7.44141H0V5.95312H23.8135V7.44141ZM23.8135 4.46484H0V2.97656H23.8135V4.46484ZM23.8135 1.48828H0V0H23.8135V1.48828Z" fill="white" />
        </svg>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: `${sp.A}px ${sp.C}px`, width: 200 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: fs.sm }}>🔍</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: fs.xs }}>Search your library</span>
        </div>

        {/* Icons */}
        {['🔔', '?'].map(icon => (
          <div key={icon} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: fs.sm }}>{icon}</span>
          </div>
        ))}
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: c['content-brand'], display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ color: '#fff', fontSize: fs.sm, fontWeight: fw.semibold }}>V</span>
        </div>
      </div>

      {/* App body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar */}
        <div style={{ width: 220, backgroundColor: c['background-base-inverse'], flexShrink: 0, display: 'flex', flexDirection: 'column', padding: `${sp.D}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp.D}px ${sp.D}px` }}>
            <span style={{ color: '#fff', fontSize: fs.sm, fontWeight: fw.semibold }}>Data Studio</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: fs.lg, cursor: 'pointer', lineHeight: 1 }}>+</span>
          </div>

          {[
            { label: 'Models', active: true },
            { label: 'Data',     active: false },
            { label: 'Connections', active: false },
          ].map(item => (
            <div key={item.label} style={{ padding: `${sp.B}px ${sp.D}px`, borderRadius: 6, margin: `0 ${sp.B}px`, backgroundColor: item.active ? 'rgba(255,255,255,0.12)' : 'transparent', cursor: 'pointer' }}>
              <span style={{ color: item.active ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: fs.sm }}>{item.label}</span>
            </div>
          ))}

        </div>

        {/* Main content */}
        <div style={{ flex: 1, backgroundColor: c['background-base'], overflow: 'auto' }}>
          <div style={{ padding: `${sp.F}px ${sp.H}px` }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.F }}>
              <h1 style={{ ...ts.modalTitle, color: c['content-primary'], margin: 0 }}>Models</h1>
              <Button variant="primary" icon="plus" iconPosition="leading" onClick={() => onOpen()}>New model</Button>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
                  {[
                    { label: 'Name',                 w: COL_WIDTHS.name       },
                    { label: 'Status',               w: COL_WIDTHS.status     },
                    { label: 'Spotter conversations',w: COL_WIDTHS.spotter    },
                    { label: 'Connection',           w: COL_WIDTHS.connection },
                    { label: 'Health',               w: COL_WIDTHS.health     },
                    { label: 'Last modified',        w: COL_WIDTHS.modified   },
                  ].map(col => (
                    <th key={col.label} style={{ width: col.w, padding: `${sp.C}px ${sp.B}px`, textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showDraft && (
                  <tr
                    style={{ borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-information'], cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-information'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-information'])}
                    onClick={onResume}
                  >
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                        <span style={{ color: c['content-brand'], fontWeight: fw.medium }}>{currentProject!.name}</span>
                        {STEP_LABEL[currentProject!.buildStep] && (
                          <span style={{ fontSize: fs.xs, backgroundColor: currentProject!.buildStep === 'healthy' ? c['background-success'] : c['background-information'], color: currentProject!.buildStep === 'healthy' ? c['content-success'] : c['content-brand'], padding: '1px 6px', borderRadius: 4, fontWeight: fw.medium }}>
                            {STEP_LABEL[currentProject!.buildStep]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, color: c['content-secondary'], fontSize: fs.sm }}>
                        <span>✏</span> Draft
                      </div>
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: c['content-secondary'] }}>—</td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: sp.B, color: c['content-primary'], fontSize: fs.sm }}>
                        <span>❄</span> Snowflake
                      </span>
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      {currentProject!.buildStep === 'healthy'
                        ? <span style={{ color: c['content-success'], fontSize: fs.sm }}>♥ Good</span>
                        : <span style={{ color: c['content-secondary'], fontSize: fs.sm }}>—</span>}
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: c['content-secondary'], fontSize: fs.sm }}>Just now</td>
                  </tr>
                )}
                {projects.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-subtle'], cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-information'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? c['background-base'] : c['background-subtle'])}
                    onClick={() => onOpen(p.name)}
                  >
                    {/* Name */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: c['content-brand'], fontWeight: fw.medium }}>{p.name}</td>

                    {/* Status */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <StatusCell project={p} />
                    </td>

                    {/* Spotter conversations */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: p.spotterConversations ? c['content-primary'] : c['content-secondary'] }}>
                      {p.spotterConversations ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                          {p.spotterConversations.toLocaleString()}
                          <span style={{ fontSize: fs.xs, color: c['content-brand'] }}>↗</span>
                        </span>
                      ) : '—'}
                    </td>

                    {/* Connection */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: sp.B, color: c['content-primary'] }}>
                        <ConnectionIcon type={p.connection} />
                        {p.connectionName}
                      </span>
                    </td>

                    {/* Health */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <HealthCell project={p} />
                    </td>

                    {/* Last modified */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: c['content-secondary'] }}>
                      {p.lastModified}{p.lastModifiedBy ? ` by ${p.lastModifiedBy}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsList;
