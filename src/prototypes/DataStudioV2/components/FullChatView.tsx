import React, { useState } from 'react';
import { c, ff, fs } from '../styles';
import AgentPanel, { AgentMessage } from './AgentPanel';
import ChatContextPanel from './ChatContextPanel';
import { ProjectState } from '../index';

interface FullChatViewProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  initialFlow: string;
  initialMessage?: string;
  onBack: () => void;
  onInsightResolved?: (id: string) => void;
}

const CHAT_WIDTH = 860;

const FLOW_SKILLS: Record<string, string> = {
  dbt_connection_repair:    'Repair dbt connection',
  schema_drift_repair:      'Resolve schema drift',
  schema_drift_multi_repair:'Resolve schema drift',
  null_rate_investigation:  'Investigate data quality',
  enable_cache:             'Enable query caching',
};

const FullChatView: React.FC<FullChatViewProps> = ({ project, setProject, initialFlow, initialMessage, onBack, onInsightResolved }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);

  const skill = FLOW_SKILLS[initialFlow];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', backgroundColor: c['background-base'], fontFamily: ff.primary,
    }}>

      {/* 48px header */}
      <div style={{
        height: 48, flexShrink: 0, display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${c['border-divider']}`, padding: '0 16px',
      }}>
        <div style={{ flex: 1 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, borderRadius: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
            onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {project.name || 'Overview'}
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setContextPanelOpen(o => !o)}
            title={contextPanelOpen ? 'Hide context panel' : 'Show context panel'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center',
              color: contextPanelOpen ? c['content-primary'] : c['content-secondary'], borderRadius: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="1.5" x2="12" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Chat column */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ width: CHAT_WIDTH, height: '100%', display: 'flex', overflow: 'hidden' }}>
            <AgentPanel
              project={project}
              setProject={setProject}
              messages={messages}
              setMessages={setMessages}
              initialFlow={initialFlow}
              initialMessage={initialMessage}
              width={CHAT_WIDTH}
              onBack={onBack}
              onInsightResolved={onInsightResolved}
            />
          </div>
        </div>

        {/* Context panel */}
        {contextPanelOpen && (
          <ChatContextPanel
            model={{ name: project.name }}
            created={[]}
            tables={project.addedTables ?? []}
            skills={skill ? [skill] : []}
          />
        )}

      </div>
    </div>
  );
};

export default FullChatView;
