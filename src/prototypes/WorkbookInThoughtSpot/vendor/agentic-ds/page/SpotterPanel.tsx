import React from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import styles from './SpotterPanel.module.css';

export interface SpotterPanelProps {
  /**
   * Top region — typically the collapse toggle.
   */
  top?: React.ReactNode;
  /**
   * Primary action shown directly under the top region (e.g. New chat).
   */
  primaryAction?: React.ReactNode;
  /**
   * Body content — typically a stack of `SpotterPanelSection`s.
   */
  children?: React.ReactNode;
  /**
   * Footer content — typically the Settings action.
   */
  footer?: React.ReactNode;
  className?: string;
}

export const SpotterPanel: React.FC<SpotterPanelProps> = ({
  top,
  primaryAction,
  children,
  footer,
  className,
}) => {
  const classes = [styles.panel, className].filter(Boolean).join(' ');
  return (
    <aside className={classes} aria-label="Spotter navigation">
      {top && <div className={styles.top}>{top}</div>}
      {primaryAction && (
        <div style={{ padding: '0 12px 12px' }}>{primaryAction}</div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.bottom}>{footer}</div>}
    </aside>
  );
};

SpotterPanel.displayName = 'SpotterPanel';

/**
 * Convenience pill-style button for use in primaryAction / footer slots.
 */
export interface SpotterPanelActionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string;
  icon?: IconName | React.ReactNode;
  variant?: 'pill' | 'flat';
}

export const SpotterPanelAction: React.FC<SpotterPanelActionProps> = ({
  label,
  icon,
  variant = 'pill',
  className,
  ...props
}) => {
  const classes = [
    styles.actionButton,
    variant === 'flat' ? styles.actionButtonFlat : undefined,
    className,
  ].filter(Boolean).join(' ');
  const renderIcon = (): React.ReactNode => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="s" />;
    }
    return icon;
  };
  return (
    <button type="button" className={classes} {...props}>
      {renderIcon()}
      <span>{label}</span>
    </button>
  );
};

SpotterPanelAction.displayName = 'SpotterPanelAction';

export default SpotterPanel;
