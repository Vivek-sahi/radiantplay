import React from 'react';
import { Icon } from '@components/icons';
import type { SourcesBlockData } from '../../runtime/schema';
import styles from './SourcesBlock.module.css';

export interface SourcesBlockProps {
  block: SourcesBlockData;
}

export const SourcesBlock: React.FC<SourcesBlockProps> = ({ block }) => {
  return (
    <div className={styles.sources}>
      <div className={styles.label}>Sources</div>
      <div className={styles.list}>
        {block.items.map((item) =>
          item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pill}
            >
              <Icon name="answer" size="s" />
              <span>{item.label}</span>
            </a>
          ) : (
            <button key={item.id} type="button" className={styles.pill}>
              <Icon name="answer" size="s" />
              <span>{item.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
};

SourcesBlock.displayName = 'SourcesBlock';

export default SourcesBlock;
