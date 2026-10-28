import React from 'react';
import styles from './ProgressBar.module.css';
import { useRadiantLook } from '../../context/RadiantLookContext';

export type ProgressBarColor = 'green' | 'blue' | 'yellow' | 'red';
export type ProgressBarSize = 'small' | 'default' | 'large';

export interface ProgressBarProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Maximum value
   * @default 100
   */
  max?: number;
  /**
   * Progress bar color
   * @default 'green', or 'blue' under look: 'radiant-3'
   */
  color?: ProgressBarColor;
  /**
   * Progress bar size
   * @default 'default'
   */
  size?: ProgressBarSize;
  /**
   * Show indeterminate loading animation
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Label text
   */
  label?: string;
  /**
   * Show percentage value
   * @default false
   */
  showValue?: boolean;
  /**
   * Custom value formatter
   */
  valueFormatter?: (value: number, max: number) => string;
  /**
   * Hide progress indicator on 0%
   * @default false
   */
  hideOnZero?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * ProgressBar Component
 * 
 * A horizontal bar that shows progress toward a goal.
 * 
 * **Colors:**
 * - `green` - Success/completion (default)
 * - `blue` - Informational
 * - `yellow` - Warning
 * - `red` - Error/danger
 * 
 * **Sizes:**
 * - `small` - 4px height
 * - `default` - 6px height
 * - `large` - 8px height
 * 
 * @example
 * ```tsx
 * // Basic progress bar
 * <ProgressBar value={75} />
 * 
 * // With label and value
 * <ProgressBar value={45} label="Upload Progress" showValue />
 * 
 * // Indeterminate loading
 * <ProgressBar indeterminate color="blue" />
 * 
 * // Custom value formatter
 * <ProgressBar 
 *   value={30} 
 *   max={100} 
 *   showValue 
 *   valueFormatter={(v, m) => `${v} of ${m} items`} 
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color: colorProp,
  size = 'default',
  indeterminate = false,
  label,
  showValue = false,
  valueFormatter,
  hideOnZero = false,
  className = '',
}) => {
  // Radiant 3.0 (Figma 44:5712) fills with Background/Brand by default
  const look = useRadiantLook();
  const color = colorProp ?? (look === 'radiant-3' ? 'blue' : 'green');

  // Clamp value between 0 and max
  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = (clampedValue / max) * 100;

  const defaultFormatter = (v: number, m: number) => 
    m === 100 ? `${v}%` : `${v}/${m}`;

  const displayValue = valueFormatter 
    ? valueFormatter(clampedValue, max)
    : defaultFormatter(clampedValue, max);

  const barClasses = [
    styles.progressBar,
    styles[color],
    size !== 'default' && styles[size],
    indeterminate && styles.indeterminate,
    hideOnZero && styles.hideOnInitial,
    className,
  ].filter(Boolean).join(' ');

  const progressBar = (
    <div 
      className={barClasses}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div 
        className={styles.progressBarInner}
        style={{ width: indeterminate ? undefined : `${percentage}%` }}
      />
    </div>
  );

  // If no label or value, just return the bar
  if (!label && !showValue) {
    return progressBar;
  }

  // Wrap with label and value
  return (
    <div className={styles.wrapper}>
      {(label || showValue) && (
        <div className={styles.labelRow}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && !indeterminate && (
            <span className={styles.value}>{displayValue}</span>
          )}
        </div>
      )}
      {progressBar}
    </div>
  );
};

export default ProgressBar;
