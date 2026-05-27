import React from 'react';
import styles from './SpotterPanelSection.module.css';

export interface SpotterPanelSectionProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export const SpotterPanelSection: React.FC<SpotterPanelSectionProps> = ({
  label,
  children,
  className,
}) => {
  const classes = [styles.section, className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {label && <div className={styles.label}>{label}</div>}
      {children}
    </div>
  );
};

SpotterPanelSection.displayName = 'SpotterPanelSection';

export default SpotterPanelSection;
