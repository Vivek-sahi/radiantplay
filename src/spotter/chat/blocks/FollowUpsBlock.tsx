import React from 'react';
import { Icon } from '@components/icons';
import type { FollowUpsBlockData } from '../../runtime/schema';
import { useSpotterChat } from '../useSpotterChat';
import styles from './FollowUpsBlock.module.css';

export interface FollowUpsBlockProps {
  block: FollowUpsBlockData;
}

export const FollowUpsBlock: React.FC<FollowUpsBlockProps> = ({ block }) => {
  const { send, state } = useSpotterChat();
  const disabled = state.isStreaming;

  return (
    <div className={styles.followups}>
      <div className={styles.label}>Follow up</div>
      <div className={styles.list}>
        {block.suggestions.map((suggestion, idx) => (
          <button
            key={`${block.id}-${idx}`}
            type="button"
            className={styles.chip}
            disabled={disabled}
            onClick={() => send(suggestion)}
          >
            <Icon name="follow-up" size="s" />
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

FollowUpsBlock.displayName = 'FollowUpsBlock';

export default FollowUpsBlock;
