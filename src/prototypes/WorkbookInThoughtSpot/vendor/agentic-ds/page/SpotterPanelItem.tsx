import React, { forwardRef } from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import styles from './SpotterPanelItem.module.css';

export interface SpotterPanelItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string;
  icon?: IconName | React.ReactNode;
  trailingIcon?: IconName | React.ReactNode;
  selected?: boolean;
}

const renderIcon = (icon: SpotterPanelItemProps['icon']): React.ReactNode => {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <Icon name={icon as IconName} size="s" />;
  }
  return icon;
};

export const SpotterPanelItem = forwardRef<HTMLButtonElement, SpotterPanelItemProps>(
  ({ label, icon, trailingIcon, selected = false, className, ...props }, ref) => {
    const classes = [styles.item, className].filter(Boolean).join(' ');
    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        data-selected={selected}
        {...props}
      >
        {icon && <span className={styles.leadingIcon}>{renderIcon(icon)}</span>}
        <span className={styles.label}>{label}</span>
        {trailingIcon && <span className={styles.trailingIcon}>{renderIcon(trailingIcon)}</span>}
      </button>
    );
  },
);

SpotterPanelItem.displayName = 'SpotterPanelItem';

export default SpotterPanelItem;
