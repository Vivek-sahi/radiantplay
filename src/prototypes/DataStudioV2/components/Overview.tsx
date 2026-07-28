import React, { useRef, useState } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Icon } from '../../../components/icons';
import { iconSize } from '../../../tokens/icons';
import Tabs from '../../../components/Tabs';
import { OVERVIEW_PROJECTS, OverviewProject, ACTIVE_INSIGHTS, ActiveInsight, CONNECTIONS } from '../data/mockData';
import PromptBar, { PromptBarRef } from './PromptBar';
import ConnectionPill from './ConnectionPill';
import { useVariant } from '../variant';

// Radiance top-wash — the exact multi-colour gradient from the SpotterX Figma
// (node 1985:211988), exported as a single composited image (blobs + wash + grain).
import radianceComposite from '../assets/radiance-wash-composite.png';


interface OverviewProps {
  onNewProject: () => void;
  onOpenProject: (project: OverviewProject) => void;
  onPromptSubmit: (prompt: string) => void;
  onMultiSourceClick?: () => void;
  onNotebookFlowClick?: () => void;
  onOpenProjectAtMonitoring: (project: OverviewProject) => void;
  onFixWithAgent: (insight: ActiveInsight, project: OverviewProject) => void;
  resolvedInsightIds?: string[];
  onOpenSpotterX?: () => void;
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
    icon: 'doc' as const, label: 'Build a model with MRD',
    base: 'I want to build a model using an MRD',
    suffixes: [
      ' — I have the requirements doc ready to share',
      ' for our new customer analytics initiative',
    ],
  },
  {
    icon: 'schema' as const, label: 'Start with a DBT model',
    base: 'I want to start with an existing DBT model',
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
    icon: 'database' as const, label: 'Create a connection',
    base: 'I want to create a new data connection',
    suffixes: [
      ' to our Snowflake warehouse for the marketing team',
      ' to BigQuery where our product analytics data lives',
    ],
  },
  {
    icon: 'cord' as const, label: 'Connect Snowflake',
    base: 'Connect Snowflake',
    suffixes: [
      ' to my workspace',
      ' and import schemas for the analytics team',
    ],
  },
  {
    icon: 'save-worksheet' as const, label: 'Cache a model',
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
    <Icon name={icon} size="xs" />
    {label}
  </button>
);

// ── Pulse icons ───────────────────────────────────────────────────────────────

const WarningIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color }}>
    <path d="M8 2.5L14 13.5H2L8 2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 7V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
  </svg>
);

const AISparkleIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color }}>
    <path
      d="M8 1.5C8.4 4.8 11.2 7.6 14.5 8C11.2 8.4 8.4 11.2 8 14.5C7.6 11.2 4.8 8.4 1.5 8C4.8 7.6 7.6 4.8 8 1.5Z"
      fill="currentColor" fillOpacity="0.9"
    />
    <path
      d="M12.5 2.5C12.65 3.3 13.2 3.85 14 4C13.2 4.15 12.65 4.7 12.5 5.5C12.35 4.7 11.8 4.15 11 4C11.8 3.85 12.35 3.3 12.5 2.5Z"
      fill="currentColor" fillOpacity="0.6"
    />
  </svg>
);

const getPulseIconStyle = (priority: number, category: 'debugging' | 'optimization') => {
  if (category === 'optimization') return { bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' };
  if (priority <= 2) return { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' };
  if (priority === 3) return { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' };
  return { bg: '#fffbeb', border: '#fde68a', color: '#b45309' };
};

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
  const iconStyle = getPulseIconStyle(insight.priority, insight.category);
  const isUrgent  = insight.category === 'debugging' && insight.priority <= 2;

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
      {/* Icon container */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        border: `1px solid ${iconStyle.border}`,
        backgroundColor: iconStyle.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {insight.category === 'optimization'
          ? <AISparkleIcon color={iconStyle.color} />
          : <WarningIcon color={iconStyle.color} />
        }
      </div>

      {/* Two lines: titleShort / impact */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', overflow: 'hidden' }}>
          <span style={{
            fontSize: 13, lineHeight: 1.45,
            fontWeight: isUrgent ? fw.semibold : fw.medium,
            color: c['content-primary'],
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flexShrink: 1, minWidth: 0,
          }}>
            {insight.titleShort ?? insight.title}
          </span>
        </div>
        <div style={{ marginTop: 3 }}>
          <span style={{
            fontSize: 12, color: '#9ca3af', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'block',
          }}>
            {insight.impact}
          </span>
        </div>
      </div>

      {/* Right — action + dismiss, both revealed on hover */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onAction(); }}
          style={{
            fontSize: 11, fontWeight: fw.medium, fontFamily: ff.primary,
            color: c['content-brand'],
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, whiteSpace: 'nowrap',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.12s',
          }}
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
  onNewProject, onOpenProject, onPromptSubmit, onMultiSourceClick, onNotebookFlowClick,
  onOpenProjectAtMonitoring, onFixWithAgent, resolvedInsightIds = [], onOpenSpotterX,
}) => {
  const { variant } = useVariant();
  const promptBarRef = useRef<PromptBarRef>(null);
  const [connFilter, setConnFilter] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const dismissInsight = (id: string) => setDismissedIds(prev => [...prev, id]);

  const activeInsights = [...ACTIVE_INSIGHTS]
    .filter(i => !resolvedInsightIds.includes(i.id) && !dismissedIds.includes(i.id));

  const debuggingInsights    = activeInsights.filter(i => i.category === 'debugging').sort((a, b) => a.priority - b.priority);
  const optimizationInsights = activeInsights.filter(i => i.category === 'optimization').sort((a, b) => a.priority - b.priority);
  const visiblePulseInsights = [...debuggingInsights, ...optimizationInsights];

  const getProjectForInsight = (insight: ActiveInsight) =>
    OVERVIEW_PROJECTS.find(p => p.id === insight.modelId) ?? null;

  const handleInsightAction = (insight: ActiveInsight) => {
    const proj = getProjectForInsight(insight);
    if (!proj) return;
    const isFixWithAgent = insight.primaryAction.label.includes('with agent');
    if (isFixWithAgent) onFixWithAgent(insight, proj);
    else onOpenProjectAtMonitoring(proj);
  };

  const handleChipClick = (base: string, suffixes: string[]) => {
    promptBarRef.current?.startTypewriter(base, suffixes);
  };

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'] }}>

      {/* Radiance top-wash — the exact Figma gradient, pinned to the top of the page.
          Blobs layer behind, wash/glow layer on top; both fade out before the cards. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 544, pointerEvents: 'none',
        backgroundImage: `url("${radianceComposite}")`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        backgroundPosition: 'top center',
      }} />

      {/* Scrollable content */}
      <div style={{ position: 'relative', flex: 1, overflowY: 'auto', backgroundColor: 'transparent' }}>

        {/* ── Hero — agent prompt ───────────────────────────────────────── */}
        <div style={{
          backgroundColor: 'transparent',
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
                Welcome back, Sara.
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
                pocTools={variant === 'poc'}
                leftSlot={
                  <ConnectionPill
                    connections={CONNECTIONS}
                    value={connFilter}
                    onChange={setConnFilter}
                    dropDirection="down"
                    poc={variant === 'poc'}
                  />
                }
              />
            </div>

            {/* Capability chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, justifyContent: 'center' }}>
              {/* POC: connection/cache-setup chips dropped from the home screen — Vision unchanged. */}
              {CAPABILITY_CHIPS.filter(chip => variant !== 'poc' || !['Create a connection', 'Connect Snowflake', 'Cache a model'].includes(chip.label)).map(chip => (
                <HeroChip
                  key={chip.label}
                  icon={chip.icon}
                  label={chip.label}
                  onClick={() => handleChipClick(chip.base, chip.suffixes)}
                />
              ))}
              {onMultiSourceClick && variant !== 'poc' && (
                <HeroChip
                  icon="merge"
                  label="Multi-source model"
                  onClick={() => {
                    onMultiSourceClick();
                    promptBarRef.current?.setValue("I want to generate a customer health score card based on data from multiple sources");
                    promptBarRef.current?.focus();
                  }}
                />
              )}
              {onNotebookFlowClick && variant !== 'poc' && (
                <HeroChip
                  icon="code"
                  label="Multi-source model, single notebook"
                  onClick={() => {
                    onNotebookFlowClick();
                    promptBarRef.current?.setValue("I want to generate a customer health score card based on data from multiple sources");
                    promptBarRef.current?.focus();
                  }}
                />
              )}
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
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 48, borderBottom: '1px solid rgba(0,0,0,0.05)', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.1px' }}>Pulse</span>
                {visiblePulseInsights.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: fw.semibold,
                    lineHeight: '16px', padding: '0 5px', borderRadius: 20,
                    color: '#9ca3af', backgroundColor: 'rgba(0,0,0,0.05)',
                    minWidth: 18, textAlign: 'center' as const,
                  }}>
                    {visiblePulseInsights.length}
                  </span>
                )}
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
                  All clear — no active issues
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
