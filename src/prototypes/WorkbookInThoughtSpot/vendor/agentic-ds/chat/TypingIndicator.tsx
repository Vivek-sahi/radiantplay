import React from 'react';
import styles from './TypingIndicator.module.css';

export interface TypingIndicatorProps {
  /** Override the default "Analysing…" label. */
  label?: string;
  className?: string;
}

const DEFAULT_LABEL = 'Analysing…';

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  label = DEFAULT_LABEL,
  className,
}) => {
  const classes = [styles.indicator, className].filter(Boolean).join(' ');
  return (
    <div className={classes} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
