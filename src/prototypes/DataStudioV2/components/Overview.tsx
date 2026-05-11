import React, { useRef, useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Icon } from '../../../components/icons';
import { iconSize } from '../../../tokens/icons';
import Tabs from '../../../components/Tabs';
import { OVERVIEW_PROJECTS, OverviewProject, ACTIVE_INSIGHTS, ActiveInsight, CONNECTIONS } from '../data/mockData';
import PromptBar, { PromptBarRef } from './PromptBar';
import ConnectionPill from './ConnectionPill';


interface OverviewProps {
  onNewProject: () => void;
  onOpenProject: (project: OverviewProject) => void;
  onPromptSubmit: (prompt: string) => void;
  onOpenProjectAtMonitoring: (project: OverviewProject) => void;
  onFixWithAgent: (insight: ActiveInsight, project: OverviewProject) => void;
  resolvedInsightIds?: string[];
}

// ── Capability chips ─────────────────────────────────────────────────────────

const CAPABILITY_CHIPS = [
  {
    icon: 'table' as const, label: 'Build a model',
    base: 'I want to build a new data model',
    suffixes: [
      ' that tracks marketing attribution across channels and regions',
      ' to analyze P&L by department for our finance team',
    ],
  },
  {
    icon: 'schema' as const, label: 'Start with a dbt model',
    base: 'I want to start with an existing dbt model',
    suffixes: [
      ' and publish it to ThoughtSpot with AI enrichment',
      ' for our revenue metrics and fix any translation issues',
    ],
  },
  {
    icon: 'ai' as const, label: 'Improve AI readiness',
    base: 'I want to improve the AI readiness of a model',
    suffixes: [
      ' so Spotter can answer questions about sales performance',
      ' by adding synonyms and sample questions for my team',
    ],
  },
  {
    icon: 'cord' as const, label: 'Create a connection',
    base: 'I want to create a new data connection',
    suffixes: [
      ' to our Snowflake warehouse for the marketing team',
      ' to BigQuery where our product analytics data lives',
    ],
  },
  {
    icon: 'sync' as const, label: 'Cache a model',
    base: 'I want to cache a model',
    suffixes: [
      ' to speed up Spotter queries on our executive dashboard',
      ' so the finance team gets faster results on P&L data',
    ],
  },
];


const HeroChip: React.FC<{ icon: React.ComponentProps<typeof Icon>['name']; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
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
    <Icon name={icon} size={iconSize.xs} />
    {label}
  </button>
);

// ── Pulse helpers ─────────────────────────────────────────────────────────────

type ProjectHealth = 'healthy' | 'needs-attention' | 'broken';

const getProjectHealth = (project: OverviewProject): ProjectHealth => {
  if (!project.issues || project.issues.length === 0) return 'healthy';
  if (project.issues.some(i => i.severity === 'critical')) return 'broken';
  return 'needs-attention';
};

const HEALTH_DOT: Record<ProjectHealth, string> = {
  healthy:           '#16a34a',
  'needs-attention': '#d97706',
  broken:            '#dc2626',
};

const HEALTH_LABEL: Record<ProjectHealth, string> = {
  healthy:           'Healthy',
  'needs-attention': 'Needs attention',
  broken:            'Broken',
};

const getSeverityColor = (priority: number, category: 'debugging' | 'optimization'): string => {
  if (category === 'optimization') return '#4f46e5';
  if (priority === 1) return '#dc2626';
  if (priority === 2) return '#ea580c';
  if (priority === 3) return '#d97706';
  if (priority === 4) return '#ca8a04';
  return '#a16207';
};

const PulseRow: React.FC<{
  insight: ActiveInsight;
  onAction: () => void;
  onDismiss: () => void;
  isLast: boolean;
}> = ({ insight, onAction, onDismiss, isLast }) => {
  const [hovered, setHovered] = useState(false);
  const dotColor = getSeverityColor(insight.priority, insight.category);
  const isUrgent = insight.category === 'debugging' && insight.priority <= 2;

  return (
    <div
      onClick={onAction}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
        backgroundColor: hovered ? 'rgba(0,0,0,0.018)' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.12s',
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, alignSelf: 'flex-start', marginTop: 5,
        backgroundColor: dotColor,
        boxShadow: hovered ? `0 0 0 4px ${dotColor}20` : `0 0 0 0px ${dotColor}00`,
        transition: 'box-shadow 0.15s',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.45, display: 'flex', alignItems: 'baseline', overflow: 'hidden' }}>
          <span
            title={insight.metric ? `${insight.title} · ${insight.metric}` : insight.title}
            style={{
              fontWeight: isUrgent ? fw.semibold : fw.medium,
              color: c['content-primary'],
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flexShrink: 1, minWidth: 0,
            }}
          >
            {insight.title}
          </span>
          {insight.metric && (
            <>
              <span style={{ color: '#d1d5db', flexShrink: 0, margin: '0 5px' }}>·</span>
              <span style={{ fontWeight: fw.medium, color: dotColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {insight.metric}
              </span>
            </>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {insight.context}
          <span style={{ color: '#c4c9d4' }}> · {insight.timestamp}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onAction(); }}
          style={{ fontSize: 11, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-brand'], background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}
        >
          {insight.primaryAction.label}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          title="Dismiss"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 18, borderRadius: 4,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: '#c4c9d4',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#9ca3af'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#c4c9d4'; }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};


const PulsePanel: React.FC<{
  bodyHeight?: number;
  children: React.ReactNode;
  tabBar?: React.ReactNode;
}> = ({ bodyHeight = 340, children, tabBar }) => (
  <div style={{
    flex: 1,
    display: 'flex', flexDirection: 'column' as const,
    backgroundColor: c['background-base'],
    borderRadius: 12,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  }}>
    {tabBar && <div style={{ flexShrink: 0 }}>{tabBar}</div>}
    <div style={{ overflowY: 'auto' as const, height: bodyHeight }}>{children}</div>
  </div>
);

const RecentPanel: React.FC<{
  bodyHeight?: number;
  children: React.ReactNode;
  right?: React.ReactNode;
}> = ({ bodyHeight = 340, children, right }) => (
  <div style={{
    flex: 1,
    display: 'flex', flexDirection: 'column' as const,
    backgroundColor: c['background-base'],
    borderRadius: 12,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  }}>
    <div style={{
      height: 48,
      padding: '0 20px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: 8,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.1px' }}>Recent models</span>
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
    <div style={{ overflowY: 'auto' as const, height: bodyHeight }}>{children}</div>
  </div>
);

// ── Recent Models row ─────────────────────────────────────────────────────────

const ModelIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color }}>
    <path d="M8 1.5L14 5L8 8.5L2 5Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"/>
    <path d="M2 5L2 11L8 14.5L8 8.5Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" fill="currentColor" fillOpacity="0.06"/>
    <path d="M14 5L14 11L8 14.5L8 8.5Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" fill="currentColor" fillOpacity="0.04"/>
  </svg>
);

const RecentRow: React.FC<{
  project: OverviewProject;
  onClick: () => void;
  isLast: boolean;
}> = ({ project, onClick, isLast }) => {
  const [hovered, setHovered] = useState(false);
  const health      = getProjectHealth(project);
  const healthColor = HEALTH_DOT[health];
  const healthLabel = HEALTH_LABEL[health];
  const iconColor   = project.status === 'published' ? '#2563eb' : '#9ca3af';
  const iconBg      = project.status === 'published' ? '#eff6ff' : '#f9fafb';
  const iconBorder  = project.status === 'published' ? '#bfdbfe' : c['border-default'];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '11px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
        backgroundColor: hovered ? 'rgba(0,0,0,0.018)' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.12s',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: `1px solid ${iconBorder}`, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ModelIcon color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: fw.medium,
          color: hovered ? c['content-brand'] : c['content-primary'],
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.12s', lineHeight: 1.45,
        }}>
          {project.name}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, lineHeight: 1.4 }}>
          {project.status === 'published' ? 'Published' : 'Draft'}
          {project.conversations ? ` · ${project.conversations.toLocaleString()} queries` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: healthColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: fw.medium, color: healthColor, whiteSpace: 'nowrap' }}>{healthLabel}</span>
      </div>
      <span style={{ fontSize: 11, color: '#c4c9d4', flexShrink: 0, minWidth: 52, textAlign: 'right' as const }}>{project.lastModified}</span>
    </div>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────

const Overview: React.FC<OverviewProps> = ({
  onNewProject, onOpenProject, onPromptSubmit,
  onOpenProjectAtMonitoring, onFixWithAgent, resolvedInsightIds = [],
}) => {
  const promptBarRef = useRef<PromptBarRef>(null);
  const [connFilter, setConnFilter] = useState<string | null>(null);
  const [pulseTab, setPulseTab] = useState<'debugging' | 'optimization'>('debugging');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const dismissInsight = (id: string) => setDismissedIds(prev => [...prev, id]);

  const sortedInsights = [...ACTIVE_INSIGHTS]
    .filter(i => !resolvedInsightIds.includes(i.id) && !dismissedIds.includes(i.id))
    .sort((a, b) => a.priority - b.priority);

  const debuggingInsights    = sortedInsights.filter(i => i.category === 'debugging');
  const optimizationInsights = sortedInsights.filter(i => i.category === 'optimization');
  const visiblePulseInsights = pulseTab === 'debugging' ? debuggingInsights : optimizationInsights;

  const getProjectForInsight = (insight: ActiveInsight) =>
    OVERVIEW_PROJECTS.find(p => p.id === insight.modelId) ?? null;

  const handleInsightAction = (insight: ActiveInsight) => {
    const proj = getProjectForInsight(insight);
    if (!proj) return;
    const isFixWithAgent = insight.category === 'debugging' ||
      insight.primaryAction.type === 'enable-cache';
    if (isFixWithAgent) onFixWithAgent(insight, proj);
    else onOpenProjectAtMonitoring(proj);
  };

  const handleChipClick = (base: string, suffixes: string[]) => {
    promptBarRef.current?.startTypewriter(base, suffixes);
  };

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c['background-base'] }}>

        {/* ── Hero — agent prompt ───────────────────────────────────────── */}
        <div style={{
          backgroundColor: c['background-base'],
          padding: `72px ${sp.H}px ${sp.G}px`,
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
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                Morning, Sara
              </h1>
            </div>

            {/* Prompt bar */}
            <div style={{ width: '100%' }}>
              <PromptBar
                ref={promptBarRef}
                onSubmit={(text) => onPromptSubmit(text)}
                placeholder="How can I help you today?"
                dropDirection="down"
                landingPage
                leftSlot={
                  <ConnectionPill
                    connections={CONNECTIONS}
                    value={connFilter}
                    onChange={setConnFilter}
                    dropDirection="down"
                  />
                }
              />
            </div>

            {/* Capability chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, justifyContent: 'center' }}>
              {CAPABILITY_CHIPS.map(chip => (
                <HeroChip
                  key={chip.label}
                  icon={chip.icon}
                  label={chip.label}
                  onClick={() => handleChipClick(chip.base, chip.suffixes)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Pulse + Recent panels ────────────────────────────────────── */}
        <div style={{
          padding: sp.H,
          display: 'flex', gap: sp.F, alignItems: 'stretch',
          maxWidth: 1320, margin: '0 auto',
          boxSizing: 'border-box' as const,
        }}>
          <PulsePanel
            bodyHeight={441}
            tabBar={
              <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(0,0,0,0.05)', height: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px 0 20px', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.1px' }}>Pulse</span>
                </div>
                <div style={{ width: 1, alignSelf: 'center', height: 14, backgroundColor: 'rgba(0,0,0,0.08)', flexShrink: 0, margin: '0 4px' }} />
                <Tabs
                  activeTab={pulseTab}
                  onTabChange={id => setPulseTab(id as typeof pulseTab)}
                  tabs={[
                    {
                      id: 'debugging',
                      label: 'Needs attention',
                      icon: (
                        <span style={{
                          fontSize: 11, fontWeight: fw.semibold,
                          lineHeight: '16px', padding: '0 5px', borderRadius: 20,
                          color: pulseTab === 'debugging' ? c['content-brand'] : '#9ca3af',
                          backgroundColor: pulseTab === 'debugging' ? 'rgba(39,112,239,0.1)' : 'rgba(0,0,0,0.05)',
                          minWidth: 18, textAlign: 'center' as const,
                        }}>
                          {debuggingInsights.length}
                        </span>
                      ),
                    },
                    {
                      id: 'optimization',
                      label: 'Opportunities',
                      icon: (
                        <span style={{
                          fontSize: 11, fontWeight: fw.semibold,
                          lineHeight: '16px', padding: '0 5px', borderRadius: 20,
                          color: pulseTab === 'optimization' ? c['content-brand'] : '#9ca3af',
                          backgroundColor: pulseTab === 'optimization' ? 'rgba(39,112,239,0.1)' : 'rgba(0,0,0,0.05)',
                          minWidth: 18, textAlign: 'center' as const,
                        }}>
                          {optimizationInsights.length}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            }
          >
            {visiblePulseInsights.length > 0
              ? visiblePulseInsights.map((insight, i) => (
                  <PulseRow
                    key={insight.id}
                    insight={insight}
                    onAction={() => handleInsightAction(insight)}
                    onDismiss={() => dismissInsight(insight.id)}
                    isLast={i === visiblePulseInsights.length - 1}
                  />
                ))
              : (
                <div style={{ padding: `${sp.H}px ${sp.D}px`, textAlign: 'center' as const, color: c['content-secondary'], fontSize: fs.sm }}>
                  {pulseTab === 'debugging' ? 'All clear — no active issues' : 'No optimization opportunities right now'}
                </div>
              )
            }
          </PulsePanel>

          <RecentPanel
            bodyHeight={441}
            right={
              <button
                onClick={onNewProject}
                style={{ fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-brand'], background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                + New model
              </button>
            }
          >
            {OVERVIEW_PROJECTS.map((project, i) => (
              <RecentRow
                key={project.id}
                project={project}
                onClick={() => onOpenProject(project)}
                isLast={i === OVERVIEW_PROJECTS.length - 1}
              />
            ))}
          </RecentPanel>

        </div>

      </div>

    </div>
  );
};

export default Overview;
