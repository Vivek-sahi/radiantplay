import React, { useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Button } from '../../../components/Button';
import { OVERVIEW_PROJECTS, OVERVIEW_ALERTS, RECENT_TABLES, OverviewAlert } from '../data/mockData';
import WorkflowDirectory from './WorkflowDirectory';

interface OverviewProps {
  onNewProject: () => void;
  onOpenProject: (id: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALERT_TYPE_LABELS: Record<OverviewAlert['type'], string> = {
  schema_change:     'Schema change',
  sync_failure:      'Sync failure',
  negative_feedback: 'Negative feedback',
  query_failed:      'Query failed',
  high_cost:         'High cost',
};

const SectionLabel: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
    <span style={{
      fontSize: 11, fontWeight: fw.semibold,
      color: c['content-secondary'],
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
    }}>
      {title}
    </span>
    {action}
  </div>
);

const Divider: React.FC = () => (
  <div style={{ height: 1, backgroundColor: c['border-divider'] }} />
);

// ── Alert card ────────────────────────────────────────────────────────────────

const AlertCard: React.FC<{ alert: OverviewAlert }> = ({ alert }) => {
  const isCritical = alert.severity === 'critical';
  return (
    <button style={{
      textAlign: 'left' as const,
      padding: sp.D,
      backgroundColor: c['background-base'],
      border: `1px solid ${isCritical ? '#fca5a5' : c['border-divider']}`,
      borderTop: `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
      borderRadius: 8,
      cursor: 'pointer',
      fontFamily: ff.primary,
      display: 'flex', flexDirection: 'column', gap: sp.B,
      width: '100%',
    }}>
      {/* Type + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.B }}>
        <span style={{
          fontSize: 11, fontWeight: fw.medium,
          padding: '2px 7px', borderRadius: 4,
          color:           isCritical ? '#b91c1c' : '#92400e',
          backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
          flexShrink: 0,
        }}>
          {ALERT_TYPE_LABELS[alert.type]}
        </span>
        <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{alert.time}</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.4 }}>{alert.title}</div>

      {/* Project + connection */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{alert.project}</div>
        <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>{alert.source}</div>
      </div>
    </button>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────

const Overview: React.FC<OverviewProps> = ({ onNewProject, onOpenProject }) => {
  const [showWorkflows, setShowWorkflows] = useState(false);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'] }}>
        <div style={{ padding: `${sp.H}px` }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.H }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>
              Overview
            </h1>
            <Button variant="primary" size="basic" onClick={onNewProject}>New project</Button>
          </div>

          {/* ── Alerts ──────────────────────────────────────────────────── */}
          <div style={{ marginBottom: sp.H }}>
            <SectionLabel
              title="Alerts"
              action={
                <button style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary, padding: 0,
                }}>
                  View all →
                </button>
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.C }}>
              {OVERVIEW_ALERTS.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>

          {/* ── Recent projects ─────────────────────────────────────────── */}
          <div style={{ marginBottom: sp.H }}>
            <SectionLabel title="Recent projects" />
            <div style={{
              backgroundColor: c['background-base'],
              border: `1px solid ${c['border-divider']}`,
              borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
                gap: sp.C,
                padding: `${sp.B}px ${sp.D}px`,
                borderBottom: `1px solid ${c['border-divider']}`,
                backgroundColor: c['background-subtle'],
              }}>
                {['Project', 'Status', 'Conversations', 'Last edited', 'Author'].map(h => (
                  <div key={h} style={{
                    fontSize: 11, fontWeight: fw.medium,
                    color: c['content-secondary'],
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.04em',
                  }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {OVERVIEW_PROJECTS.map((project, i) => (
                <React.Fragment key={project.id}>
                  {i > 0 && <Divider />}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
                      gap: sp.C,
                      padding: `${sp.C}px ${sp.D}px`,
                      cursor: 'pointer',
                      alignItems: 'center',
                    }}
                    onClick={() => onOpenProject(project.id)}
                  >
                    {/* Name — blue to signal clickability */}
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>
                      {project.name}
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: fw.medium,
                        padding: '2px 7px', borderRadius: 4,
                        color:           project.status === 'published' ? '#16a34a' : c['content-secondary'],
                        backgroundColor: project.status === 'published' ? '#dcfce7' : c['background-subtle'],
                      }}>
                        {project.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {/* Conversations */}
                    <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
                      {project.conversations ? project.conversations.toLocaleString() : '—'}
                    </div>

                    {/* Last edited */}
                    <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
                      {project.lastModified}
                    </div>

                    {/* Author */}
                    <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
                      {project.author}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── Data ────────────────────────────────────────────────────── */}
          <div style={{ marginBottom: sp.H }}>
            <SectionLabel title="Data" />
            <div style={{
              backgroundColor: c['background-base'],
              border: `1px solid ${c['border-divider']}`,
              borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 2fr 1fr 1fr',
                gap: sp.C,
                padding: `${sp.B}px ${sp.D}px`,
                borderBottom: `1px solid ${c['border-divider']}`,
                backgroundColor: c['background-subtle'],
              }}>
                {['Table', 'Source', 'Rows', 'Columns'].map(h => (
                  <div key={h} style={{
                    fontSize: 11, fontWeight: fw.medium,
                    color: c['content-secondary'],
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.04em',
                  }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {RECENT_TABLES.map((table, i) => (
                <React.Fragment key={table.id}>
                  {i > 0 && <Divider />}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 2fr 1fr 1fr',
                      gap: sp.C,
                      padding: `${sp.C}px ${sp.D}px`,
                      cursor: 'pointer',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'monospace', fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>
                      {table.name}
                    </div>
                    <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{table.connection}</div>
                    <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{table.rowCount}</div>
                    <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{table.columns}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Workflow directory FAB */}
      <button
        onClick={() => setShowWorkflows(true)}
        style={{
          position: 'absolute', bottom: 24, left: 24,
          display: 'flex', alignItems: 'center', gap: sp.B,
          padding: `${sp.B + 1}px ${sp.D}px`,
          backgroundColor: c['content-brand'],
          color: '#ffffff',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          fontSize: fs.sm, fontWeight: fw.medium,
          fontFamily: ff.primary,
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 14 }}>⊞</span> Workflows
      </button>

      {showWorkflows && <WorkflowDirectory onClose={() => setShowWorkflows(false)} />}
    </div>
  );
};

export default Overview;
