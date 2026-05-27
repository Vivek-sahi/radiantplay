import React, { useState } from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import type { ChatMessage } from '../runtime/schema';
import { ReasoningBlock } from './ReasoningBlock';
import { TypingIndicator } from './TypingIndicator';
import { AgentResponseBlock } from './AgentResponseBlock';
import styles from './AgentMessage.module.css';

export interface AgentMessageProps {
  message: ChatMessage;
  /**
   * Avatar glyph for the agent. Defaults to the Spotter brand icon.
   * Pass a Radiant icon name for built-in glyphs, or a ReactNode for custom.
   */
  avatarIcon?: IconName | React.ReactNode;
  /**
   * Legacy prop — initial letter for the avatar. When provided overrides
   * the icon. Kept for forward-compat with the Custom Spotter "B" pattern.
   */
  initial?: string;
}

const renderAvatar = (
  initial: string | undefined,
  icon: AgentMessageProps['avatarIcon'],
): React.ReactNode => {
  if (initial) return <span>{initial}</span>;
  if (typeof icon === 'string') return <Icon name={icon as IconName} size="m" />;
  if (icon) return icon;
  return <Icon name="ai" size="m" />;
};

export const AgentMessage: React.FC<AgentMessageProps> = ({
  message,
  avatarIcon,
  initial,
}) => {
  // Pre-reasoning: show a typing indicator until the first chunk arrives.
  const showTyping = message.stage === 'thinking' && !message.reasoning;

  return (
    <div className={styles.row}>
      <span className={styles.avatar} aria-hidden="true">
        {renderAvatar(initial, avatarIcon)}
      </span>
      <div className={styles.body}>
        {showTyping && <TypingIndicator />}
        <ReasoningBlock reasoning={message.reasoning} stage={message.stage} />
        <AgentResponseBlock content={message.content} />
        {message.stage === 'error' && message.error && (
          <div className={styles.error} role="alert">
            {message.error}
          </div>
        )}
        {message.stage === 'done' &&
          message.content &&
          message.content.blocks.length > 0 && <FeedbackRow />}
      </div>
    </div>
  );
};

AgentMessage.displayName = 'AgentMessage';

const FeedbackRow: React.FC = () => {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  return (
    <div className={styles.feedback}>
      <span className={styles.feedbackLabel}>Is this useful?</span>
      <button
        type="button"
        className={styles.feedbackBtn}
        data-active={vote === 'up'}
        onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}
        aria-label="Useful"
        aria-pressed={vote === 'up'}
      >
        <Icon name="thumb-up" size="s" />
      </button>
      <button
        type="button"
        className={styles.feedbackBtn}
        data-active={vote === 'down'}
        onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}
        aria-label="Not useful"
        aria-pressed={vote === 'down'}
      >
        <Icon name="thumb-down" size="s" />
      </button>
    </div>
  );
};

export default AgentMessage;
