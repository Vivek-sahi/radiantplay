import React from 'react';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  label: string;
}

export const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ label }, ref) => (
    <div className={styles.row} ref={ref}>
      <div className={styles.avatar}>
        <img src="/spotter-assets/SpotterModel avatar.svg" width="20" height="20" alt="" />
      </div>
      <div className={styles.content}>
        <img src="/spotter-assets/Contextual spinner.svg" className={styles.spinnerArc} width="20" height="20" alt="" />
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  )
);
TypingIndicator.displayName = 'TypingIndicator';
