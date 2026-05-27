import React from 'react';
import styles from './VersionCard.module.css';

interface VersionCardProps {
  versionNum: number;
  label: string;
  isLatest: boolean;
  isDisabled?: boolean;
  onRestore?: (num: number) => void;
}

export const VersionCard: React.FC<VersionCardProps> = ({
  versionNum, label, isLatest, isDisabled, onRestore,
}) => {
  const cardClass = [
    styles.card,
    isLatest ? styles.latest : styles.prev,
    isDisabled ? styles.disabled : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass} onClick={!isLatest && !isDisabled ? () => onRestore?.(versionNum) : undefined}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.title}>{label}</span>
          <span className={styles.sub}>Version {versionNum}</span>
        </div>
        {!isLatest && (
          <button className={styles.dots} title="Restore this version" onClick={e => { e.stopPropagation(); onRestore?.(versionNum); }}>
            <img src="/spotter-assets/Restore.svg" width="12" height="12" alt="restore" />
          </button>
        )}
      </div>
      {!isLatest && !isDisabled && (
        <div className={styles.tooltip}>Restore this version</div>
      )}
    </div>
  );
};
