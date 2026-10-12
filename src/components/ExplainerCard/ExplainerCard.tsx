import React, { forwardRef } from 'react';
import { Button } from '../Button';
import styles from './ExplainerCard.module.css';

export type ExplainerCardAppearance = 'bordered' | 'raised';

export interface ExplainerCardAction {
  label: string;
  onClick?: () => void;
}

export interface ExplainerCardProps {
  icon?: React.ReactNode;
  /** Card heading. Leave it out for the title-less layout. */
  title?: string;
  description: React.ReactNode;
  /** Free-form action slot (the original CTA slot) */
  action?: React.ReactNode;
  /** Background style for the bordered appearance */
  variant?: 'default' | 'highlighted';
  /**
   * `bordered` (default): the original card with a 1px border.
   * `raised`: the Figma explainer card, with the menu shadow, no border,
   * radius 6, padding 20, gap 12 and an 18/24 title.
   * @default 'bordered'
   */
  appearance?: ExplainerCardAppearance;
  /** Media shown in the card (Figma 300x170, radius 6), e.g. an image or video */
  media?: React.ReactNode;
  /** Shows a 24px close button that calls this handler */
  onDismiss?: () => void;
  /** Accessible label for the close button */
  dismissLabel?: string;
  /** Small primary button */
  primaryAction?: ExplainerCardAction;
  /** Small tertiary button, placed before the primary button */
  secondaryAction?: ExplainerCardAction;
  className?: string;
}

export const ExplainerCard = forwardRef<HTMLDivElement, ExplainerCardProps>(({
  icon,
  title,
  description,
  action,
  variant = 'default',
  appearance = 'bordered',
  media,
  onDismiss,
  dismissLabel = 'Dismiss',
  primaryAction,
  secondaryAction,
  className,
}, ref) => {
  const dismissButton = onDismiss ? (
    <Button
      variant="tertiary"
      size="small"
      iconOnly
      icon="cross"
      aria-label={dismissLabel}
      onClick={onDismiss}
      className={styles.dismiss}
    >
      {dismissLabel}
    </Button>
  ) : null;

  const buttons = (primaryAction || secondaryAction) ? (
    <div className={styles.buttons}>
      {secondaryAction && (
        <Button variant="tertiary" size="small" onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button variant="primary" size="small" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>
      )}
    </div>
  ) : null;

  const mediaBlock = media ? <div className={styles.media}>{media}</div> : null;

  if (appearance === 'raised') {
    const classes = [styles.raised, className].filter(Boolean).join(' ');
    return (
      <div ref={ref} className={classes}>
        {title ? (
          <div className={styles.raisedHeader}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <p className={styles.raisedTitle}>{title}</p>
            {dismissButton}
          </div>
        ) : null}
        {title ? (
          <div className={styles.raisedBody}>{description}</div>
        ) : (
          <div className={styles.raisedHeader}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <div className={styles.raisedBody}>{description}</div>
            {dismissButton}
          </div>
        )}
        {mediaBlock}
        {action && <div className={styles.raisedAction}>{action}</div>}
        {buttons}
      </div>
    );
  }

  const classes = [
    styles.card,
    variant === 'highlighted' && styles.highlighted,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.description}>{description}</p>
        {mediaBlock}
        {buttons}
      </div>
      {action && <div className={styles.action}>{action}</div>}
      {dismissButton}
    </div>
  );
});

ExplainerCard.displayName = 'ExplainerCard';

export default ExplainerCard;
