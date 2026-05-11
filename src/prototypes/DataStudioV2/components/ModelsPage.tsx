import React from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { OVERVIEW_PROJECTS, OverviewAlert, OverviewProject } from '../data/mockData';
import { Button } from '../../../components/Button';

interface ModelsPageProps {
  onOpenProject: (project: OverviewProject) => void;
  onNewProject: () => void;
}

const ISSUE_LABELS: Record<OverviewAlert['type'], string> = {
  schema_change:   'Schema change',
  sync_failure:    'Sync failure',
  cache_failed:    'Cache failed',
  prep_job_failed: 'Prep job failed',
  data_freshness:  'Data freshness',
};

const IssuesBadge: React.FC<{ issues: OverviewAlert[] }> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return <span style={{ fontSize: fs.sm, color: c['content-tertiary'] }}>—</span>;
  }
  const hasCritical = issues.some(i => i.severity === 'critical');
  const color = hasCritical ? '#b91c1c' : '#92400e';
  const label = issues.length === 1 ? ISSUE_LABELS[issues[0].type] : `${issues.length} issues`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color, fontSize: fs.sm, fontWeight: fw.medium }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M8 2.5L13.5 12.5H2.5L8 2.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="8" y1="7" x2="8" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill={color} />
      </svg>
      {label}
    </span>
  );
};

const ModelsPage: React.FC<ModelsPageProps> = ({ onOpenProject, onNewProject }) => (
  <div style={{ flex: 1, overflow: 'auto', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: `${sp.H}px ${sp.H}px` }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.F }}>
        <h1 style={{ margin: 0, fontSize: fs.xl, fontWeight: fw.semibold, color: c['content-primary'] }}>Models</h1>
        <Button variant="primary" icon="plus" iconPosition="leading" onClick={onNewProject}>New model</Button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>

        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
          gap: sp.C, padding: `${sp.B}px ${sp.D}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          backgroundColor: c['background-subtle'],
        }}>
          {['Model', 'Issues', 'Status', 'Conversations', 'Last edited', 'Author'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {OVERVIEW_PROJECTS.map((project, i) => (
          <React.Fragment key={project.id}>
            {i > 0 && <div style={{ height: 1, backgroundColor: c['border-divider'] }} />}
            <div
              style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', alignItems: 'center' }}
              onClick={() => onOpenProject(project)}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>{project.name}</div>
              <div><IssuesBadge issues={project.issues ?? []} /></div>
              <div><span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.status === 'published' ? 'Published' : 'Draft'}</span></div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.conversations ? project.conversations.toLocaleString() : '—'}</div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.lastModified}</div>
              <div style={{ fontSize: fs.sm, color: c['content-secondary'] }}>{project.author}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

    </div>
  </div>
);

export default ModelsPage;
