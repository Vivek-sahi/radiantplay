import React, { useEffect, useRef, useState } from 'react';
import { UserBubble } from './UserBubble';
import { TypingIndicator } from './TypingIndicator';
import { AgentMessage } from './AgentMessage';
import { ReasoningBlock } from './ReasoningBlock';
import { AgentResponseBlock } from './AgentResponseBlock';
import type { MessageItem, SuggType, ReasoningData } from './types';

export interface AgentPanelProps {
  welcomeVariant: 'blank' | 'existing';
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ welcomeVariant }) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const chatMsgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (welcomeVariant === 'blank') {
      (window as any)._onChatStart = () => setChatStarted(true);
    }

    (window as any)._appendMsg = (item: MessageItem) =>
      setMessages(prev => [...prev, item]);
    (window as any)._updateMsg = (id: string, patch: Partial<MessageItem>) =>
      setMessages(prev => prev.map(m => m.id === id ? { ...m, ...patch } as MessageItem : m));
    (window as any)._removeMsg = (id: string) =>
      setMessages(prev => prev.filter(m => m.id !== id));
    (window as any)._scrollMsgs = () => {
      if (chatMsgsRef.current) chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight;
    };
    (window as any)._updateReasoning = (id: string, reasoning: ReasoningData) =>
      setMessages(prev => prev.map(m =>
        m.id === id && m.kind === 'agent' ? { ...m, reasoning } : m
      ));
    (window as any)._demoteVersionCards = () =>
      setMessages(prev => prev.map(m => {
        if (m.kind === 'agent' && m.response?.versionCard) {
          return { ...m, response: { ...m.response, versionCard: { ...m.response.versionCard, isLatest: false } } };
        }
        return m;
      }));
    (window as any)._freezeConversation = () =>
      setMessages(prev => prev.map(m =>
        m.kind === 'agent' && m.response ? { ...m, response: { ...m.response, chips: undefined } } : m
      ));

    return () => {
      delete (window as any)._onChatStart;
      delete (window as any)._appendMsg;
      delete (window as any)._updateMsg;
      delete (window as any)._removeMsg;
      delete (window as any)._scrollMsgs;
      delete (window as any)._updateReasoning;
      delete (window as any)._demoteVersionCards;
      delete (window as any)._freezeConversation;
    };
  }, [welcomeVariant]);

  return (
    <div className="agent-panel" id="agent-panel">
      <div className="panel-resize-handle" id="panel-resize-handle"></div>

      {/* Header */}
      <div className="agent-panel-header">
        <span className="agent-title">SpotterModel</span>
        <div className="context-chip" id="context-chip-btn">
          <img src="/spotter-assets/Contextual spinner.svg" className="ctx-chip-spinner" width="14" height="14" alt="" />
          <span>Context</span>
        </div>
        <div className="close-btn">
          <img src="/spotter-assets/cross-s.svg" width="14" height="14" alt="close" />
        </div>
      </div>

      {/* Welcome view — variant-driven */}
      {welcomeVariant === 'blank' ? (
        <div className="agent-panel-body" id="welcome-view">
          <div className="agent-content-group">
            <div className="agent-intro">
              <div className="agent-mascot">
                <img src="/spotter-assets/SpotterModel avatar.svg" width="32" height="32" alt="SpotterModel" />
              </div>
              <div className="agent-headline">
                Let's build an <span className="hl-blue">AI-ready</span> model
              </div>
            </div>
            <div className="prompt-bar-wrapper">
              <div className="prompt-bar">
                <textarea className="agent-textarea" id="welcome-textarea" placeholder="What is this model's use case?" autoFocus></textarea>
                <div className="prompt-bar-actions">
                  <button className="send-btn" id="welcome-send" title="Send">
                    <img src="/spotter-assets/Primary buttton/Primary buttton/arrow-up-m.svg" width="16" height="16" alt="send" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <ul className="agent-bullets">
            <li className="bullet-item">Find the right tables for your use case</li>
            <li className="bullet-item">Join tables without errors</li>
            <li className="bullet-item">Add columns with <span className="bullet-emphasis">AI-friendly context</span></li>
            <li className="bullet-item">Generate reliable formulas</li>
          </ul>
        </div>
      ) : (
        <div className="edit-intro-view" id="welcome-view">
          <div className="edit-intro-body">
            <div className="agent-mascot">
              <img src="/spotter-assets/SpotterModel avatar.svg" width="32" height="32" alt="SpotterModel" />
            </div>
            <div className="edit-intro-headline">Welcome back</div>
            <div className="edit-intro-sub">Let's ensure this model is ready for AI search</div>
            <button
              className="check-ai-readiness-btn"
              id="check-ai-btn"
              onClick={() => (window as any).startChat?.('Check for AI readiness')}
            >
              <img src="/spotter-assets/ai icon.svg" width="16" height="16" alt="" className="ai-icon-brand" />
              Check for AI readiness
            </button>
          </div>
        </div>
      )}

      {/* Chat view */}
      <div className="chat-view" id="chat-view">
        <div className="chat-messages" id="chat-messages" ref={chatMsgsRef}>
          {messages.map((msg, idx) => {
            const isReadOnly = idx < messages.length - 1;
            if (msg.kind === 'user') return <UserBubble key={msg.id} text={msg.text} />;
            if (msg.kind === 'typing') return <TypingIndicator key={msg.id} label={msg.label} />;
            if (msg.kind === 'agent') return (
              <AgentMessage key={msg.id}>
                <ReasoningBlock data={msg.reasoning} />
                {msg.response && (
                  <AgentResponseBlock
                    data={msg.response}
                    isReadOnly={isReadOnly}
                    onAddToModel={(st: SuggType, items: unknown[]) => (window as any)._handleAddToModel?.(msg.id, st, items)}
                    onRefine={(st: SuggType) => (window as any)._handleSuggestionRefine?.(st)}
                    onChipClick={(text: string) => (window as any)._handleChipClick?.(text)}
                    onRestoreVersion={(num: number) => (window as any)._restoreVersion?.(num)}
                  />
                )}
              </AgentMessage>
            );
            return null;
          })}
        </div>
      </div>

      {/* Bottom prompt bar */}
      {welcomeVariant === 'blank' ? (
        chatStarted && (
          <div className="chat-input-wrapper">
            <div className="prompt-bar" id="chat-prompt-bar">
              <textarea className="agent-textarea" id="chat-textarea" placeholder="Let me help you build a model"></textarea>
              <div className="prompt-bar-actions">
                <button className="send-btn" id="chat-send-btn" title="Send">
                  <img src="/spotter-assets/Primary buttton/Primary buttton/arrow-up-m.svg" width="16" height="16" alt="send" />
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="chat-input-wrapper">
          <div className="prompt-bar" id="chat-prompt-bar">
            <textarea className="agent-textarea" id="chat-textarea" placeholder="Edit columns, formulas, tables or joins" autoFocus></textarea>
            <div className="prompt-bar-actions">
              <button className="send-btn" id="chat-send-btn" title="Send">
                <img src="/spotter-assets/Primary buttton/Primary buttton/arrow-up-m.svg" width="16" height="16" alt="send" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="agent-footer">
        SpotterModel responses should be reviewed. <a href="#">Learn more</a>
      </div>
    </div>
  );
};

export default AgentPanel;
