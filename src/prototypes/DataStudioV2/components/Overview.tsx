import React, { useRef } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Button } from '../../../components/Button';
import { OVERVIEW_PROJECTS, RECENT_TABLES, OverviewAlert, OverviewProject } from '../data/mockData';
import PromptBar, { PromptBarRef } from './PromptBar';


interface OverviewProps {
  onNewProject: () => void;
  onOpenProject: (project: OverviewProject) => void;
  onPromptSubmit: (prompt: string) => void;
  onStartDbt: () => void;
}

// ── Hero suggestions (mirror NewProjectPrompt) ───────────────────────────────

const HERO_SUGGESTIONS = [
  { text: 'Analyze campaign performance by channel and region',  dbt: false },
  { text: 'Measure campaign ROI across channels and segments',   dbt: true  },
  { text: 'Track P&L by department using finance data',          dbt: false },
];

const AIIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
    <circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9" />
    <line x1="10" y1="3" x2="10" y2="6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="13.5" x2="10" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3" y1="10" x2="6.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="13.5" y1="10" x2="17" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const HeroChip: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: `${sp.A + 1}px ${sp.C}px`,
      borderRadius: 20,
      border: `1px solid ${c['border-default']}`,
      backgroundColor: 'transparent',
      color: c['content-secondary'],
      fontSize: fs.xs,
      cursor: 'pointer',
      fontFamily: ff.primary,
      lineHeight: '1.4',
      transition: 'all 0.12s',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = c['content-brand'];
      e.currentTarget.style.color = c['content-brand'];
      e.currentTarget.style.backgroundColor = c['background-information'];
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = c['border-default'];
      e.currentTarget.style.color = c['content-secondary'];
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {text}
  </button>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const ISSUE_LABELS: Record<OverviewAlert['type'], string> = {
  schema_change:  'Schema change',
  sync_failure:   'Sync failure',
  cache_failed:   'Cache failed',
  prep_job_failed:'Prep job failed',
  data_freshness: 'Data freshness',
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

const ViewAllLink: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ marginTop: sp.C }}>
    <button style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: fs.sm, color: c['content-brand'],
      fontFamily: ff.primary, padding: 0,
    }}>
      {label} →
    </button>
  </div>
);

// ── Issues badge ──────────────────────────────────────────────────────────────

const IssuesBadge: React.FC<{ issues: OverviewAlert[] }> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return <span style={{ fontSize: fs.sm, color: c['content-tertiary'] }}>—</span>;
  }

  const hasCritical = issues.some(i => i.severity === 'critical');
  const color = hasCritical ? '#b91c1c' : '#92400e';
  const label = issues.length === 1
    ? ISSUE_LABELS[issues[0].type]
    : `${issues.length} issues`;

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

// ── Overview ──────────────────────────────────────────────────────────────────

const Overview: React.FC<OverviewProps> = ({ onNewProject, onOpenProject, onPromptSubmit, onStartDbt }) => {
  const promptBarRef = useRef<PromptBarRef>(null);

  const handleHeroSuggestion = (text: string, isDbt: boolean) => {
    if (isDbt) onStartDbt();
    promptBarRef.current?.setValue(text);
    promptBarRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-sunken'] }}>

        {/* ── Hero — agent prompt ───────────────────────────────────────── */}
        <div style={{
          backgroundColor: c['background-base'],
          borderBottom: `1px solid ${c['border-divider']}`,
          padding: `${sp.J}px ${sp.H}px ${sp.G}px`,
        }}>
          <div style={{
            maxWidth: 720,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: sp.E,
            fontFamily: ff.primary,
          }}>
            {/* Heading */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.B }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2770ef 0%, #5b9ef4 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AIIcon />
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  What would you like to build?
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'] }}>
                Describe your goal and the agent will connect, model, and prep your data.
              </p>
            </div>

            {/* Prompt bar */}
            <div style={{ width: '100%' }}>
              <PromptBar
                ref={promptBarRef}
                onSubmit={(text) => onPromptSubmit(text)}
                placeholder="Describe your use case and the questions you'd like to answer…"
                dropDirection="down"
                compact={false}
                landingPage
              />
            </div>

            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, justifyContent: 'center' }}>
              {HERO_SUGGESTIONS.map(s => (
                <HeroChip
                  key={s.text}
                  text={s.text}
                  onClick={() => handleHeroSuggestion(s.text, s.dbt)}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: `${sp.H}px` }}>

          {/* ── Recent projects ─────────────────────────────────────────── */}
          <div style={{ marginBottom: sp.H }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
              <span style={{
                fontSize: 11, fontWeight: fw.semibold,
                color: c['content-secondary'],
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
              }}>
                Recent models
              </span>
              <Button variant="primary" size="basic" onClick={onNewProject}>New model</Button>
            </div>
            <div style={{
              backgroundColor: c['background-base'],
              border: `1px solid ${c['border-divider']}`,
              borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
                gap: sp.C,
                padding: `${sp.B}px ${sp.D}px`,
                borderBottom: `1px solid ${c['border-divider']}`,
                backgroundColor: c['background-subtle'],
              }}>
                {['Model', 'Issues', 'Status', 'Conversations', 'Last edited', 'Author'].map(h => (
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
                      gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr',
                      gap: sp.C,
                      padding: `${sp.C}px ${sp.D}px`,
                      cursor: 'pointer',
                      alignItems: 'center',
                    }}
                    onClick={() => onOpenProject(project)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Name */}
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-brand'] }}>
                      {project.name}
                    </div>

                    {/* Issues */}
                    <div>
                      <IssuesBadge issues={project.issues ?? []} />
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>
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
            <ViewAllLink label="View all models" />
          </div>

          {/* ── Explore data ────────────────────────────────────────────── */}
          <div style={{ marginBottom: sp.H }}>
            <SectionLabel title="Explore data" />
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
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
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
            <ViewAllLink label="View all data" />
          </div>

        </div>
      </div>

    </div>
  );
};

export default Overview;
