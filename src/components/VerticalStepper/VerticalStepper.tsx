import React from 'react';
import styles from './VerticalStepper.module.css';

export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface VerticalStepItem {
  title: string;
  description?: string;
  status?: StepStatus;
  content?: React.ReactNode;
}

export interface VerticalStepperProps {
  steps: VerticalStepItem[];
  currentStep?: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

// Checkmark SVG for completed state
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M3 8.5L6.5 12L13 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// X icon for error state
const ErrorIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M2 2L8 8M8 2L2 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const VerticalStepperStep: React.FC<{
  step: VerticalStepItem;
  index: number;
  isLast: boolean;
  resolvedStatus: StepStatus;
  onStepClick?: (index: number) => void;
}> = ({ step, index, isLast, resolvedStatus, onStepClick }) => {
  const isActive = resolvedStatus === 'active';
  const isCompleted = resolvedStatus === 'completed';
  const isError = resolvedStatus === 'error';
  const isPending = resolvedStatus === 'pending';
  const isClickable = isPending && !!onStepClick;

  const circleClasses = [
    styles.circle,
    styles[resolvedStatus],
  ].filter(Boolean).join(' ');

  const connectorClasses = [
    styles.connector,
    isCompleted ? styles.connectorCompleted : styles.connectorPending,
  ].filter(Boolean).join(' ');

  const stepClasses = [
    styles.step,
    isClickable && styles.clickable,
  ].filter(Boolean).join(' ');

  return (
    <div className={stepClasses}>
      {/* Left column: circle + connector */}
      <div className={styles.leftColumn}>
        <div
          className={circleClasses}
          role={isClickable ? 'button' : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onClick={isClickable ? () => onStepClick(index) : undefined}
          onKeyDown={
            isClickable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') onStepClick(index);
                }
              : undefined
          }
          aria-label={isClickable ? `Go to step ${index + 1}: ${step.title}` : undefined}
        >
          {isCompleted && <CheckIcon />}
          {isError && <ErrorIcon />}
          {(isPending || isActive) && (
            <span className={styles.circleIndex}>{index + 1}</span>
          )}
        </div>
        {!isLast && <div className={connectorClasses} />}
      </div>

      {/* Right column: title + description + content */}
      <div className={styles.rightColumn}>
        <div
          className={[
            styles.stepTitle,
            isActive && styles.titleActive,
            isCompleted && styles.titleCompleted,
          ].filter(Boolean).join(' ')}
        >
          {step.title}
        </div>
        {step.description && (
          <div className={styles.stepDescription}>{step.description}</div>
        )}
        {isActive && step.content && (
          <div className={styles.stepContent}>{step.content}</div>
        )}
      </div>
    </div>
  );
};

export const VerticalStepper = React.forwardRef<HTMLDivElement, VerticalStepperProps>(
  ({ steps, currentStep, onStepClick, className }, ref) => {
    const containerClasses = [styles.stepper, className].filter(Boolean).join(' ');

    const getStatus = (step: VerticalStepItem, index: number): StepStatus => {
      // Explicit status takes priority
      if (step.status) return step.status;
      // Derive from currentStep if provided
      if (currentStep !== undefined) {
        if (index < currentStep) return 'completed';
        if (index === currentStep) return 'active';
        return 'pending';
      }
      return 'pending';
    };

    return (
      <div ref={ref} className={containerClasses} aria-label="Steps">
        {steps.map((step, index) => (
          <VerticalStepperStep
            key={index}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            resolvedStatus={getStatus(step, index)}
            onStepClick={onStepClick}
          />
        ))}
      </div>
    );
  }
);

VerticalStepper.displayName = 'VerticalStepper';

export default VerticalStepper;
