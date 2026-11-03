import React from 'react';
import { Icon } from '@components/icons';
import type { ErrorBlockData } from '../../runtime/schema';
import styles from './ErrorBlock.module.css';

export interface ErrorBlockProps {
  block: ErrorBlockData;
}

export const ErrorBlock: React.FC<ErrorBlockProps> = ({ block }) => {
  return (
    <div className={styles.error} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <Icon name="exclamation-point-circle" size="s" />
      </span>
      <span>{block.message}</span>
    </div>
  );
};

ErrorBlock.displayName = 'ErrorBlock';

export default ErrorBlock;
