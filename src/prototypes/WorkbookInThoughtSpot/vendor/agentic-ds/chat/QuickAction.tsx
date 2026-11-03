import React, { forwardRef } from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import styles from './QuickAction.module.css';

export interface QuickActionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string;
  icon?: IconName | React.ReactNode;
}

const renderIcon = (icon: QuickActionProps['icon']): React.ReactNode => {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <Icon name={icon as IconName} size="s" />;
  }
  return icon;
};

export const QuickAction = forwardRef<HTMLButtonElement, QuickActionProps>(
  ({ label, icon, className, ...props }, ref) => {
    const classes = [styles.quickAction, className].filter(Boolean).join(' ');
    return (
      <button ref={ref} type="button" className={classes} {...props}>
        {icon && <span className={styles.icon}>{renderIcon(icon)}</span>}
        <span>{label}</span>
      </button>
    );
  },
);

QuickAction.displayName = 'QuickAction';

export default QuickAction;
