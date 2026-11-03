import React from 'react';
import styles from './SpotterRail.module.css';

export interface SpotterRailProps {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  className?: string;
}

export const SpotterRail: React.FC<SpotterRailProps> = ({ top, bottom, className }) => {
  const classes = [styles.rail, className].filter(Boolean).join(' ');
  return (
    <aside className={classes} aria-label="Spotter navigation rail">
      <div className={styles.top}>{top}</div>
      <div className={styles.spacer} />
      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </aside>
  );
};

SpotterRail.displayName = 'SpotterRail';

export default SpotterRail;
