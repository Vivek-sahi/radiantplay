import React, { forwardRef } from 'react';
import styles from './LeftPanel.module.css';

export interface PanelIconButtonProps {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}

/** 32px ghost icon button — used in the header and along the collapsed rail. */
export const PanelIconButton = forwardRef<HTMLButtonElement, PanelIconButtonProps>(
  ({ label, onClick, children }, ref) => (
    <button
      ref={ref}
      type="button"
      className={styles.iconButton}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
);

PanelIconButton.displayName = 'PanelIconButton';

export default PanelIconButton;
