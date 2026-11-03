import React, { forwardRef } from 'react';
import { Button } from '../Button';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { Illustration } from '../Illustration';
import styles from './NoData.module.css';

export type NoDataLayout = 'stack' | 'horizontal';
export type NoDataType = 'page' | 'section';
export type NoDataStatus = 'empty' | 'warning' | 'success';

export interface NoDataAction {
  label: string;
  onClick?: () => void;
}

export interface NoDataProps {
  title?: string;
  description?: string;
  /** Stack layout: shown above the title. Horizontal page layout: replaces the status illustration. */
  illustration?: React.ReactNode;
  /** Free-form action slot (stack layout) */
  action?: React.ReactNode;
  /**
   * `stack` (default): centred vertical stack.
   * `horizontal`: the Figma Muted layout, icon left and text right.
   * @default 'stack'
   */
  layout?: NoDataLayout;
  /**
   * Horizontal layout only. `section`: 32px status icon, gap 16.
   * `page`: status illustration, gap 48.
   * @default 'section'
   */
  type?: NoDataType;
  /**
   * Horizontal layout only. Picks the status icon or illustration.
   * @default 'empty'
   */
  status?: NoDataStatus;
  /** Horizontal section layout: replaces the status icon */
  icon?: React.ReactNode;
  /** Horizontal layout: small primary button */
  primaryAction?: NoDataAction;
  /** Horizontal layout: small secondary button, before the primary button */
  secondaryAction?: NoDataAction;
  /** Horizontal layout: tertiary link after the buttons */
  link?: NoDataAction;
  className?: string;
}

const statusIcon: Record<NoDataStatus, IconName> = {
  empty: 'info-circle',
  warning: 'exclamation-point-circle',
  success: 'checkmark-circle',
};

const statusIllustration: Record<NoDataStatus, string> = {
  empty: 'no-data',
  warning: 'error',
  success: 'success',
};

export const NoData = forwardRef<HTMLDivElement, NoDataProps>(({
  title = 'No data available',
  description,
  illustration,
  action,
  layout = 'stack',
  type = 'section',
  status = 'empty',
  icon,
  primaryAction,
  secondaryAction,
  link,
  className,
}, ref) => {
  if (layout === 'horizontal') {
    const isPage = type === 'page';
    const classes = [
      styles.horizontal,
      isPage ? styles.horizontalPage : styles.horizontalSection,
      className,
    ].filter(Boolean).join(' ');
    const hasActions = primaryAction || secondaryAction || link || action;

    return (
      <div ref={ref} className={classes} role="status">
        {isPage ? (
          <div className={styles.pageMedia} aria-hidden="true">
            {illustration ?? <Illustration id={statusIllustration[status]} size="md" />}
          </div>
        ) : (
          <div className={`${styles.sectionIcon} ${styles[`status_${status}`]}`} aria-hidden="true">
            {icon ?? <Icon name={statusIcon[status]} size="l" />}
          </div>
        )}
        <div className={styles.horizontalBody}>
          <div className={styles.horizontalText}>
            {title && <p className={styles.horizontalTitle}>{title}</p>}
            {description && <p className={styles.horizontalDescription}>{description}</p>}
          </div>
          {hasActions && (
            <div className={styles.horizontalActions}>
              {secondaryAction && (
                <Button variant="secondary" size="small" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button variant="primary" size="small" onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </Button>
              )}
              {link && (
                <Button variant="tertiary" size="small" onClick={link.onClick}>
                  {link.label}
                </Button>
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    );
  }

  const classes = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes}>
      {illustration && <div className={styles.illustration}>{illustration}</div>}
      {title && <p className={styles.title}>{title}</p>}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
});

NoData.displayName = 'NoData';

export default NoData;
