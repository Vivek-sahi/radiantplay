import React from 'react';
import styles from './Stepper.module.css';

export type StepperOrientation = 'horizontal' | 'vertical';

export interface StepItem {
  /**
   * Step title
   */
  title: string;
  /**
   * Optional description
   */
  description?: string;
}

export interface StepperProps {
  /**
   * Array of step items
   */
  steps: StepItem[];
  /**
   * Current active step (0-indexed)
   * @default 0
   */
  currentStep?: number;
  /**
   * Stepper orientation
   * @default 'horizontal'
   */
  orientation?: StepperOrientation;
  /**
   * Whether steps must be completed in order
   * @default true
   */
  sequential?: boolean;
  /**
   * Mark all steps as completed
   * @default false
   */
  allCompleted?: boolean;
  /**
   * Click handler for step items
   */
  onStepClick?: (stepIndex: number) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Check icon for completed steps
 */
const CheckIcon: React.FC = () => (
  <svg
    className={styles.checkIcon}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 8.5L6.5 12L13 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Individual step component
 */
interface StepProps {
  step: StepItem;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick?: () => void;
}

const Step: React.FC<StepProps> = ({
  step,
  index,
  isActive,
  isCompleted,
  isClickable,
  onClick,
}) => {
  const stepClasses = [
    styles.step,
    isActive && styles.stepActive,
    isCompleted && styles.stepCompleted,
    isClickable && styles.stepClickable,
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={stepClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-current={isActive ? 'step' : undefined}
    >
      <div className={styles.stepNumber}>
        {isCompleted ? <CheckIcon /> : index + 1}
      </div>
      <div className={styles.stepContent}>
        <span className={styles.stepTitle}>{step.title}</span>
        {step.description && (
          <span className={styles.stepDescription}>{step.description}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Stepper Component
 * 
 * A progress indicator for multi-step processes.
 * 
 * **Orientations:**
 * - `horizontal` - Steps displayed in a row (default)
 * - `vertical` - Steps displayed in a column
 * 
 * **Behavior:**
 * - `sequential` - Steps must be completed in order (default)
 * - Non-sequential - Any step can be clicked
 * 
 * @example
 * ```tsx
 * // Basic horizontal stepper
 * <Stepper 
 *   steps={[
 *     { title: 'Account' },
 *     { title: 'Profile' },
 *     { title: 'Review' },
 *   ]}
 *   currentStep={1}
 * />
 * 
 * // Vertical stepper with descriptions
 * <Stepper 
 *   orientation="vertical"
 *   steps={[
 *     { title: 'Step 1', description: 'Enter your details' },
 *     { title: 'Step 2', description: 'Verify your email' },
 *     { title: 'Step 3', description: 'Complete setup' },
 *   ]}
 *   currentStep={0}
 *   onStepClick={(index) => setStep(index)}
 * />
 * 
 * // Non-sequential stepper
 * <Stepper 
 *   steps={steps}
 *   currentStep={2}
 *   sequential={false}
 *   onStepClick={(index) => setStep(index)}
 * />
 * ```
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep = 0,
  orientation = 'horizontal',
  sequential = true,
  allCompleted = false,
  onStepClick,
  className = '',
}) => {
  const stepperClasses = [
    styles.stepper,
    styles[orientation],
    !sequential && styles.nonSequential,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={stepperClasses} role="tablist" aria-label="Progress">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isCompleted = allCompleted || index < currentStep;
        const isClickable = !sequential || (sequential && isCompleted);

        return (
          <div key={index} className={styles.stepWrapper}>
            <Step
              step={step}
              index={index}
              isActive={isActive}
              isCompleted={isCompleted}
              isClickable={isClickable && !!onStepClick}
              onClick={() => onStepClick?.(index)}
            />
            {/* Connector line */}
            <div 
              className={`${styles.connector} ${isCompleted ? styles.connectorActive : ''}`}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
