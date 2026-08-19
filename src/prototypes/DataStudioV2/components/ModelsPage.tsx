import React from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { OVERVIEW_PROJECTS, OverviewProject } from '../data/mockData';
import { Button } from '../../../components/Button';

interface ModelsPageProps {
  onOpenProject: (project: OverviewProject) => void;
  onNewProject: () => void;
}

type ProjectHealth = 'healthy' | 'needs-attention' | 'broken';

const getProjectHealth = (project: OverviewProject): ProjectHealth => {
  if (!project.issues || project.issues.length === 0) return 'healthy';
  if (project.issues.some(i => i.severity === 'critical')) return 'broken';
  return 'needs-attention';
};

const HEALTH_COLOR: Record<ProjectHealth, string> = {
  healthy:           '#16a34a',
  'needs-attention': '#d97706',
  broken:            '#dc2626',
};
const HEALTH_LABEL: Record<ProjectHealth, string> = {
  healthy:           'Healthy',
  'needs-attention': 'Needs attention',
  broken:            'Broken',
};

const HealthBadge: React.FC<{ project: OverviewProject }> = ({ project }) => {
  const health = getProjectHealth(project);
  const color  = HEALTH_COLOR[health];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.A, fontSize: fs.sm, fontWeight: fw.medium, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0, display: 'inline-block' }} />
      {HEALTH_LABEL[health]}
    </span>
  );
};

const COLS = '3fr 1fr 1fr 1fr 1fr';

const ModelsPage: React.FC<ModelsPageProps> = ({ onOpenProject, onNewProject }) => (
  <div style={{ flex: 1, overflow: 'auto', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>
    <div style={{ padding: `${sp.H}px` }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.F }}>
        <h1 style={{ margin: 0, fontSize: fs.xl, fontWeight: fw.semibold, color: c['content-primary'] }}>Models</h1>
        <Button variant="primary" icon="plus" iconPosition="leading" onClick={onNewProject}>New model</Button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>

        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS,
          gap: sp.C, padding: `${sp.B}px ${sp.D}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          backgroundColor: c['background-subtle'],
        }}>
          {['Model', 'Status', 'Queries', 'Health', 'Last modified'].map(h => (
            <div key={h} style={{ fontSize: 12, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {OVERVIEW_PROJECTS.map((project, i) => (
          <React.Fragment key={project.id}>
            {i > 0 && <div style={{ height: 1, backgroundColor: c['border-divider'] }} />}
            <div
              style={{ display: 'grid', gridTemplateColumns: COLS, gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', alignItems: 'center' }}
              onClick={() => onOpenProject(project)}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{project.name}</div>
              <div><span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.status === 'published' ? 'Published' : 'Draft'}</span></div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.conversations ? project.conversations.toLocaleString() : '—'}</div>
              <div><HealthBadge project={project} /></div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.lastModified}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

    </div>
  </div>
);

export default ModelsPage;
