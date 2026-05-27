import React, { useEffect, useRef } from 'react';
import type { IconName } from '@components/icons';
import type { ChatMessage } from '../runtime/schema';
import { MessageRow } from './MessageRow';
import styles from './ChatThread.module.css';

export interface ChatThreadProps {
  messages: ChatMessage[];
  /** Avatar URL passed to every user message. */
  userAvatarUrl?: string;
  userInitial?: string;
  agentInitial?: string;
  agentAvatarIcon?: IconName | React.ReactNode;
  className?: string;
}

/**
 * Scrollable list of chat messages. Auto-scrolls to the bottom when a new
 * message is appended or when the last message updates (streaming).
 */
export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  userAvatarUrl,
  userInitial,
  agentInitial,
  agentAvatarIcon,
  className,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  // Track tokens that change as the last message streams so we re-scroll.
  const streamFingerprint = lastMessage
    ? `${lastMessage.id}-${lastMessage.stage}-${lastMessage.content?.blocks.length ?? 0}-${
        lastMessage.content?.blocks
          .map((b) => (b.kind === 'text' ? b.text.length : b.id))
          .join('|') ?? ''
      }`
    : '';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, streamFingerprint]);

  const classes = [styles.thread, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {messages.map((message) => (
        <MessageRow
          key={message.id}
          message={message}
          userAvatarUrl={userAvatarUrl}
          userInitial={userInitial}
          agentInitial={agentInitial}
          agentAvatarIcon={agentAvatarIcon}
        />
      ))}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
};

ChatThread.displayName = 'ChatThread';

export default ChatThread;
