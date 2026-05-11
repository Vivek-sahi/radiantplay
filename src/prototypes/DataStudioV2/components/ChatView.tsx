import React, { useState, useMemo } from 'react';
import { c, ff, fs, fw } from '../styles';
import { ProjectState } from '../index';
import { AgentMessage, PlanData } from './AgentPanel';
import AgentPanel from './AgentPanel';
import PlanPanel from './PlanPanel';
import ChatContextPanel from './ChatContextPanel';

interface ChatViewProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  initialPrompt: string;
  isDayZero?: boolean;
  isDbtReview?: boolean;
  onBack: () => void;
}

const CHAT_WIDTH = 860;
const CHAT_PANEL_PCT = 0.4;

const ChatView: React.FC<ChatViewProps> = ({
  project, setProject, messages, setMessages,
  initialPrompt, isDayZero, isDbtReview, onBack,
}) => {
  const [activePlan, setActivePlan] = useState<PlanData | null>(null);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  const isPlanOpen = activePlan !== null;

  const planMsg = useMemo(() => messages.find(m => m.planData != null), [messages]);
  const created = useMemo(() => [
    ...(planMsg ? [{ type: 'plan' as const, name: 'Build plan' }] : []),
    ...(project.buildStep !== 'empty' ? [{ type: 'model' as const, name: project.name }] : []),
  ], [planMsg, project.buildStep, project.name]);
  const contextTables = useMemo(() => planMsg?.planData?.tables.map(t => t.name) ?? [], [planMsg]);
  const contextSkills = useMemo(() => project.buildStep !== 'empty' ? ['create-data-model'] : [], [project.buildStep]);

  const showContextPanel = contextPanelOpen;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: c['background-base'],
      fontFamily: ff.primary,
    }}>

      {/* 48px header */}
      <div style={{
        height: 48,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${c['border-divider']}`,
        padding: '0 16px',
      }}>
        <div style={{ flex: 1 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary,
              borderRadius: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
            onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Overview
          </button>
        </div>
        <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>
          {project.name || 'New conversation'}
        </span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setContextPanelOpen(o => !o)}
            title={contextPanelOpen ? 'Hide context panel' : 'Show context panel'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              color: contextPanelOpen ? c['content-primary'] : c['content-secondary'],
              borderRadius: 4,
            }}
          >
            {/* Sidebar-right toggle icon (rect outline + vertical line at x=12) */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="1.5" x2="12" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chat column — 40% when plan is open, full-width centered otherwise */}
        <div style={{
          flex: isPlanOpen ? `0 0 ${CHAT_PANEL_PCT * 100}%` : '1',
          display: 'flex',
          justifyContent: isPlanOpen ? 'flex-start' : 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            width: isPlanOpen ? '100%' : CHAT_WIDTH,
            height: '100%',
            display: 'flex',
            overflow: 'hidden',
          }}>
            <AgentPanel
              project={project}
              setProject={setProject}
              messages={messages}
              setMessages={setMessages}
              initialPrompt={initialPrompt}
              isDayZero={isDayZero}
              isDbtReview={isDbtReview}
              width={isPlanOpen ? Math.max(340, Math.round(window.innerWidth * CHAT_PANEL_PCT)) : CHAT_WIDTH}
              onOpenPlan={plan => setActivePlan(plan)}
            />
          </div>
        </div>

        {/* Plan panel */}
        {isPlanOpen && activePlan && (
          <PlanPanel
            plan={activePlan}
            onClose={() => setActivePlan(null)}
          />
        )}

        {/* Context panel */}
        {showContextPanel && (
          <ChatContextPanel
            created={created}
            tables={contextTables}
            skills={contextSkills}
          />
        )}

      </div>
    </div>
  );
};

export default ChatView;
