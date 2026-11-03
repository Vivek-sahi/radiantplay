import React from 'react';
import type { ChatMessage } from '../runtime/schema';
import { UserMessage } from './UserMessage';

export interface UserBubbleProps {
  message: ChatMessage;
  /**
   * Kept for API compatibility. The Refresh bubble carries no avatar; the
   * user's identity is implied by the right-aligned placement.
   */
  avatarUrl?: string;
  /** Kept for API compatibility; see `avatarUrl`. */
  initial?: string;
}

const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  const hours12 = d.getHours() % 12 || 12;
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  const time = `${String(hours12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
  const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  return `${time}, ${date}`;
};

/**
 * Renders a runtime ChatMessage with the shared UserMessage bubble.
 *
 * Adapter between the reducer's message model and the bubble's flat props.
 * Consumers that already hold a ChatMessage keep using this; new code that
 * owns its own strings (message, files, highlighted text) should render
 * `UserMessage` directly.
 */
export const UserBubble: React.FC<UserBubbleProps> = ({ message, initial }) => (
  <UserMessage
    message={message.text ?? ''}
    timestamp={formatTimestamp(message.createdAt)}
    avatarInitials={initial}
  />
);

UserBubble.displayName = 'UserBubble';

export default UserBubble;
