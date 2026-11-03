import React, { forwardRef } from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import { Tooltip } from '@components/Tooltip';
import styles from './SpotterRailItem.module.css';

export interface SpotterRailItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon: IconName | React.ReactNode;
  label: string;
  selected?: boolean;
}

const renderIcon = (icon: SpotterRailItemProps['icon']): React.ReactNode => {
  if (typeof icon === 'string') {
    return <Icon name={icon as IconName} size="m" />;
  }
  return icon;
};

export const SpotterRailItem = forwardRef<HTMLButtonElement, SpotterRailItemProps>(
  ({ icon, label, selected = false, className, ...props }, ref) => {
    const classes = [styles.railItem, className].filter(Boolean).join(' ');
    return (
      <Tooltip content={label} placement="right">
        <button
          ref={ref}
          type="button"
          className={classes}
          data-selected={selected}
          aria-label={label}
          {...props}
        >
          {renderIcon(icon)}
        </button>
      </Tooltip>
    );
  },
);

SpotterRailItem.displayName = 'SpotterRailItem';

export default SpotterRailItem;
