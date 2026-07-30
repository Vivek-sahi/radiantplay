import React from 'react';
import styles from './ConfidenceBadge.module.css';

interface ConfidenceBadgeProps {
  pct: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ pct }) => {
  const tier = pct >= 80 ? styles.green : pct >= 55 ? styles.amber : styles.red;

  return (
    <span className={`${styles.badge} ${tier}`}>
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.777832 5.4445H3.11117V12.4445H0.777832V5.4445ZM11.6589 4.66672C11.8778 4.66649 12.0942 4.71244 12.2941 4.80157C12.494 4.8907 12.6728 5.02101 12.8189 5.18398C12.965 5.34694 13.075 5.5389 13.1419 5.7473C13.2087 5.9557 13.2308 6.17586 13.2067 6.39339L12.6934 11.0601C12.6512 11.4409 12.47 11.7929 12.1843 12.0484C11.8987 12.3038 11.5288 12.4449 11.1456 12.4445H3.88894V5.45228L5.57672 4.13784L7.21005 1.50895C7.35016 1.28477 7.54509 1.1 7.77644 0.97208C8.00779 0.844159 8.26792 0.777306 8.53228 0.777835H8.71117C9.48894 0.777835 10.1112 1.40006 10.1112 2.17784V4.66672H11.6589ZM11.1456 10.8889L11.6667 6.22228H8.55561V2.33339H8.53228L6.74339 5.19561L5.4445 6.20672V10.8889H11.1456Z"
          fill="currentColor"
        />
      </svg>
      {pct}%
    </span>
  );
};
