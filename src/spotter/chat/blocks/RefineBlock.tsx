import React from 'react';
import type { RefineBlockData } from '../../runtime/schema';
import { useSpotterChat } from '../useSpotterChat';
import styles from './RefineBlock.module.css';

export interface RefineBlockProps {
  block: RefineBlockData;
}

export const RefineBlock: React.FC<RefineBlockProps> = ({ block }) => {
  const { send, state } = useSpotterChat();
  const disabled = state.isStreaming;

  return (
    <div className={styles.refine}>
      <div className={styles.label}>
        I want to make sure I answer the right thing — quick check:
      </div>
      <div className={styles.list}>
        {block.questions.map((question, idx) => (
          <button
            key={`${block.id}-${idx}`}
            type="button"
            className={styles.option}
            disabled={disabled}
            onClick={() => send(question)}
          >
            <span className={styles.radio} aria-hidden="true" />
            <span>{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

RefineBlock.displayName = 'RefineBlock';

export default RefineBlock;
