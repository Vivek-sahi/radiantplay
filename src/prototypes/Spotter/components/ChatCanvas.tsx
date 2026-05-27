import React from 'react';
import { ChatThread, SpotterPrompt, type SpotterPromptProps } from '@spotter/chat';
import type { IconName } from '@components/icons';
import type { ChatMessage } from '@spotter/runtime';
import styles from './ChatCanvas.module.css';

export interface ChatCanvasProps {
  messages: ChatMessage[];
  promptProps: SpotterPromptProps;
  /** Avatar URL passed to user messages. */
  userAvatarUrl?: string;
  userInitial?: string;
  agentInitial?: string;
  agentAvatarIcon?: IconName | React.ReactNode;
}

/**
 * Chat-active canvas layout for the Spotter prototype:
 *
 *   ┌────────────────────────────────┐
 *   │  ChatThread (scrollable)       │
 *   ├────────────────────────────────┤
 *   │  SpotterPrompt (sticky)        │
 *   │  Spotter responses ... Learn…  │
 *   └────────────────────────────────┘
 */
export const ChatCanvas: React.FC<ChatCanvasProps> = ({
  messages,
  promptProps,
  userAvatarUrl,
  userInitial,
  agentInitial,
  agentAvatarIcon,
}) => {
  return (
    <div className={styles.canvas}>
      <div className={styles.threadArea}>
        <ChatThread
          messages={messages}
          userAvatarUrl={userAvatarUrl}
          userInitial={userInitial}
          agentInitial={agentInitial}
          agentAvatarIcon={agentAvatarIcon}
        />
      </div>
      <div className={styles.promptArea}>
        <div className={styles.promptWrapper}>
          <SpotterPrompt {...promptProps} />
        </div>
        <p className={styles.disclaimer}>
          Spotter responses should be reviewed.{' '}
          <a className={styles.disclaimerLink} href="#" onClick={(e) => e.preventDefault()}>
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
};

ChatCanvas.displayName = 'ChatCanvas';

export default ChatCanvas;
