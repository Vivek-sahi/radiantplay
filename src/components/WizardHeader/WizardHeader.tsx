import { forwardRef } from 'react';
import { Button } from '../Button';
import { Divider } from '../Divider';
import styles from './WizardHeader.module.css';

export interface WizardHeaderAction {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface WizardHeaderProps {
  /** Small line above the title, e.g. the flow name */
  eyebrow?: string;
  /** Step title */
  title: string;
  /** Number of steps in the segmented progress bar. 0 or unset hides the bar. */
  totalSteps?: number;
  /** Current step, 1-based. Segments up to and including it are filled. */
  currentStep?: number;
  /** Primary button on the right, e.g. Next */
  primaryAction?: WizardHeaderAction;
  /** Secondary button before the primary button, e.g. Back */
  secondaryAction?: WizardHeaderAction;
  /** Shows a tertiary Exit button after a divider */
  onExit?: () => void;
  /**
   * Exit button label
   * @default 'Exit'
   */
  exitLabel?: string;
  className?: string;
}

/**
 * WizardHeader
 *
 * The Figma wizard (16990:14805 page header, 18235:18556 progress bar) as a
 * full-width page header: eyebrow over a 20/28 title on the left, Secondary
 * and Primary buttons, a divider and a tertiary Exit button on the right,
 * and a 4px segmented progress bar below. Use WizardModal for the modal form.
 *
 * @example
 * ```tsx
 * <WizardHeader
 *   eyebrow="Create a connection"
 *   title="Choose tables"
 *   totalSteps={4}
 *   currentStep={2}
 *   secondaryAction={{ label: 'Back', onClick: back }}
 *   primaryAction={{ label: 'Next', onClick: next }}
 *   onExit={exit}
 * />
 * ```
 */
export const WizardHeader = forwardRef<HTMLElement, WizardHeaderProps>(({
  eyebrow,
  title,
  totalSteps = 0,
  currentStep = 0,
  primaryAction,
  secondaryAction,
  onExit,
  exitLabel = 'Exit',
  className,
}, ref) => {
  const hasButtons = Boolean(primaryAction || secondaryAction);
  const steps = Math.max(0, Math.floor(totalSteps));
  const current = Math.min(Math.max(0, currentStep), steps);

  return (
    <header ref={ref} className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.bar}>
        <div className={styles.titles}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.title}>{title}</h1>
        </div>
        {(hasButtons || onExit) && (
          <div className={styles.actions}>
            {secondaryAction && (
              <Button
                variant="secondary"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant="primary"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </Button>
            )}
            {hasButtons && onExit && <Divider vertical className={styles.divider} />}
            {onExit && (
              <Button variant="tertiary" onClick={onExit}>
                {exitLabel}
              </Button>
            )}
          </div>
        )}
      </div>
      {steps > 0 && (
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="Wizard progress"
          aria-valuemin={0}
          aria-valuemax={steps}
          aria-valuenow={current}
          aria-valuetext={`Step ${current} of ${steps}`}
        >
          {Array.from({ length: steps }, (_, i) => (
            <span
              key={i}
              className={`${styles.segment} ${i < current ? styles.segmentDone : ''}`}
            />
          ))}
        </div>
      )}
    </header>
  );
});

WizardHeader.displayName = 'WizardHeader';

export default WizardHeader;
