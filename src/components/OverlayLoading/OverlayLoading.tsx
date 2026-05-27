import React from 'react';
import styles from './OverlayLoading.module.css';

export interface OverlayLoadingProps {
  isVisible: boolean;
  text?: string;
  transparent?: boolean;
  className?: string;
  variant?: 'spinner' | 'dots';
  label?: string;
}

export const OverlayLoading: React.FC<OverlayLoadingProps> = ({
  isVisible,
  text,
  transparent = false,
  className,
  variant = 'spinner',
  label,
}) => {
  if (!isVisible) return null;

  const overlayClasses = [
    styles.overlay,
    transparent ? styles.transparent : styles.solid,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={overlayClasses} aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        {variant === 'dots' ? (
          <div className={styles.dots} aria-hidden="true">
            <div className={styles.dot} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
        ) : (
          <svg
            className={styles.spinner}
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className={styles.track}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className={styles.arc}
              d="M12 2C6.47715 2 2 6.47715 2 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
        {(label || text) && <span className={styles.text}>{label ?? text}</span>}
      </div>
    </div>
  );
};

export default OverlayLoading;
