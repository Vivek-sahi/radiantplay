import React from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { ProjectState } from '../index';
import { AgentMessage } from './AgentPanel';
import AgentPanel from './AgentPanel';
import { Button } from '../../../components/Button';

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

const ChatView: React.FC<ChatViewProps> = ({
  project, setProject, messages, setMessages,
  initialPrompt, isDayZero, isDbtReview, onBack,
}) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 50,
    backgroundColor: c['background-sunken'],
    display: 'flex', flexDirection: 'column',
    fontFamily: ff.primary,
  }}>

    {/* Header */}
    <div style={{
      height: 64, flexShrink: 0,
      backgroundColor: c['background-base'],
      borderBottom: `1px solid ${c['border-divider']}`,
      display: 'flex', alignItems: 'center',
      padding: `0 ${sp.D}px`, gap: sp.C,
    }}>
      <Button variant="tertiary" size="small" onClick={onBack}>←</Button>
      <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>New model</span>
    </div>

    {/* Centered chat column */}
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: CHAT_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AgentPanel
          project={project}
          setProject={setProject}
          messages={messages}
          setMessages={setMessages}
          initialPrompt={initialPrompt}
          isDayZero={isDayZero}
          isDbtReview={isDbtReview}
          width={CHAT_WIDTH}
        />
      </div>
    </div>

  </div>
);

export default ChatView;
