import React from 'react';
import { c, sp, GLOBAL_NAV_HEIGHT } from '../styles';
import { ordersData, campaignsData, usersData } from '../data/mockData';
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
  if (type === 'snowflake') return <span style={{ fontSize: 14 }}>❄</span>;
  if (type === 'sap') return <span style={{ fontSize: 12, fontWeight: 700, color: c['content-brand'] }}>TS</span>;
  return <span style={{ fontSize: 12, fontWeight: 700, color: c['content-brand'] }}>TS</span>;
};

const StatusCell: React.FC<{ project: Project }> = ({ project }) => {
  if (project.status === 'draft') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, color: c['content-secondary'], fontSize: 13 }}>
        <span>✏</span> Draft
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, fontSize: 13, color: c['content-primary'] }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block', flexShrink: 0 }} />
      {project.audience}
    </div>
  );
};

const HealthCell: React.FC<{ project: Project }> = ({ project }) => {
  if (project.health === 'none') return <span style={{ color: c['content-secondary'], fontSize: 13 }}>—</span>;
  if (project.health === 'good') {
    return <span style={{ color: '#22C55E', fontSize: 13 }}>♥ Good</span>;
  }
  return (
    <span style={{ color: '#F59E0B', fontSize: 13 }}>
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
  const totalRows = ordersData.length + campaignsData.length + usersData.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Global header */}
      <div style={{ height: GLOBAL_NAV_HEIGHT, backgroundColor: '#1D232F', display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C, flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="4" fill="#4A90E2"/>
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">TS</text>
        </svg>

        {/* Product tabs */}
        {[{ icon: '📊', label: 'Analytics' }, { icon: '⊞', label: 'Data Studio', active: true }, { icon: '<>', label: 'Developer' }].map(tab => (
          <div key={tab.label} style={{ display: 'flex', alignItems: 'center', gap: sp.A, padding: `${sp.A}px ${sp.C}px`, borderRadius: 6, backgroundColor: tab.active ? 'rgba(255,255,255,0.12)' : 'transparent', cursor: 'pointer' }}>
            <span style={{ fontSize: 13, color: tab.active ? '#fff' : 'rgba(255,255,255,0.55)' }}>{tab.icon}</span>
            <span style={{ fontSize: 13, color: tab.active ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: tab.active ? 500 : 400 }}>{tab.label}</span>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: `${sp.A}px ${sp.C}px`, width: 200 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>🔍</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Search your library</span>
        </div>

        {/* Icons */}
        {['🔔', '?'].map(icon => (
          <div key={icon} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{icon}</span>
          </div>
        ))}
        <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#4A90E2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>V</span>
        </div>
      </div>

      {/* App body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left sidebar */}
        <div style={{ width: 220, backgroundColor: '#1D232F', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: `${sp.D}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp.D}px ${sp.D}px` }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Data Studio</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>+</span>
          </div>

          {[
            { label: 'Projects', active: true },
            { label: 'Data',     active: false },
            { label: 'Connections', active: false },
          ].map(item => (
            <div key={item.label} style={{ padding: `${sp.B}px ${sp.D}px`, borderRadius: 6, margin: `0 ${sp.B}px`, backgroundColor: item.active ? 'rgba(255,255,255,0.12)' : 'transparent', cursor: 'pointer' }}>
              <span style={{ color: item.active ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13 }}>{item.label}</span>
            </div>
          ))}

          {/* Data count badge */}
          <div style={{ marginTop: 'auto', padding: sp.D }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: sp.C, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {totalRows.toLocaleString()} rows across 3 tables
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, backgroundColor: '#fff', overflow: 'auto' }}>
          <div style={{ padding: `${sp.F}px ${sp.H}px` }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.F }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: c['content-primary'], margin: 0 }}>Projects</h1>
              <button
                onClick={() => onOpen()}
                style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.D}px`, backgroundColor: '#4A90E2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New project
              </button>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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
                    <th key={col.label} style={{ width: col.w, padding: `${sp.C}px ${sp.B}px`, textAlign: 'left', fontSize: 12, fontWeight: 500, color: c['content-secondary'], whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showDraft && (
                  <tr
                    style={{ borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: '#F0F4FF', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E8EFFF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F0F4FF')}
                    onClick={onResume}
                  >
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                        <span style={{ color: '#4A90E2', fontWeight: 500 }}>{currentProject!.name}</span>
                        {STEP_LABEL[currentProject!.buildStep] && (
                          <span style={{ fontSize: 11, backgroundColor: currentProject!.buildStep === 'healthy' ? '#F0FDF4' : '#EEF4FF', color: currentProject!.buildStep === 'healthy' ? '#22C55E' : '#4A90E2', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                            {STEP_LABEL[currentProject!.buildStep]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, color: c['content-secondary'], fontSize: 13 }}>
                        <span>✏</span> Draft
                      </div>
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: c['content-secondary'] }}>—</td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: sp.B, color: c['content-primary'], fontSize: 13 }}>
                        <span>❄</span> Snowflake
                      </span>
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      {currentProject!.buildStep === 'healthy'
                        ? <span style={{ color: '#22C55E', fontSize: 13 }}>♥ Good</span>
                        : <span style={{ color: c['content-secondary'], fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: c['content-secondary'], fontSize: 13 }}>Just now</td>
                  </tr>
                )}
                {projects.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: i % 2 === 0 ? '#fff' : '#FAFBFC', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F4FF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#FAFBFC')}
                    onClick={() => onOpen(p.name)}
                  >
                    {/* Name */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: '#4A90E2', fontWeight: 500 }}>{p.name}</td>

                    {/* Status */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px` }}>
                      <StatusCell project={p} />
                    </td>

                    {/* Spotter conversations */}
                    <td style={{ padding: `${sp.C}px ${sp.B}px`, color: p.spotterConversations ? c['content-primary'] : c['content-secondary'] }}>
                      {p.spotterConversations ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
                          {p.spotterConversations.toLocaleString()}
                          <span style={{ fontSize: 11, color: c['content-brand'] }}>↗</span>
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
