import React from 'react';
import type { IconName } from '@components/icons';
import type { ChatMessage } from '../runtime/schema';
import { UserBubble } from './UserBubble';
import { AgentMessage } from './AgentMessage';

export interface MessageRowProps {
  message: ChatMessage;
  /** Avatar URL passed through to user messages. */
  userAvatarUrl?: string;
  /** Initial passed through to user messages. */
  userInitial?: string;
  /** Initial passed through to agent messages — overrides avatarIcon. */
  agentInitial?: string;
  /** Avatar icon for agent messages. Defaults to the Spotter brand icon. */
  agentAvatarIcon?: IconName | React.ReactNode;
}

/**
 * Role dispatcher. Renders the right frame based on `message.role`. Named
 * `MessageRow` to avoid collision with the schema's `ChatMessage` type.
 */
export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  userAvatarUrl,
  userInitial,
  agentInitial,
  agentAvatarIcon,
}) => {
  if (message.role === 'user') {
    return (
      <UserBubble
        message={message}
        avatarUrl={userAvatarUrl}
        initial={userInitial}
      />
    );
  }
  return (
    <AgentMessage
      message={message}
      initial={agentInitial}
      avatarIcon={agentAvatarIcon}
    />
  );
};

MessageRow.displayName = 'MessageRow';

export default MessageRow;
