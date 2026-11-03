import React, { useCallback, useId } from 'react';
import { sysVar } from '../../tokens/colors';
import styles from './Checkbox.module.css';

export type CheckboxState = 'unchecked' | 'checked' | 'indeterminate';

export interface CheckboxProps {
  /** The checked state of the checkbox */
  checked?: boolean;
  /** Whether the checkbox is in indeterminate state */
  indeterminate?: boolean;
  /** Label text */
  label?: string;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Whether the checkbox has an error */
  error?: boolean;
  /** Name attribute for form submission */
  name?: string;
  /** Value attribute for form submission */
  value?: string;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Checkbox Component
 * 
 * A form control for boolean or indeterminate selections.
 * 
 * @example
 * ```tsx
 * <Checkbox label="Accept terms" checked={accepted} onChange={setAccepted} />
 * <Checkbox label="Select all" indeterminate={someSelected && !allSelected} />
 * <Checkbox label="Disabled option" disabled />
 * <Checkbox label="Error state" error />
 * ```
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  label,
  showLabel = true,
  disabled = false,
  error = false,
  name,
  value,
  onChange,
  className,
}) => {
  const id = useId();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  }, [disabled, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled && onChange) {
        onChange(!checked);
      }
    }
  }, [disabled, onChange, checked]);

  // Determine the visual state
  const getCheckboxState = (): CheckboxState => {
    if (indeterminate) return 'indeterminate';
    if (checked) return 'checked';
    return 'unchecked';
  };

  const state = getCheckboxState();

  const getIconColor = () => {
    if (error) return sysVar('content-failure');
    return sysVar('content-brand');
  };

  const containerClasses = [
    styles.checkbox,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <label 
      className={containerClasses}
      htmlFor={id}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={styles.input}
        aria-checked={indeterminate ? 'mixed' : checked}
      />
      <span
        className={[
          styles.box,
          error ? styles.boxError : state !== 'unchecked' && styles.boxSelected,
        ].filter(Boolean).join(' ')}
      >
        {state === 'checked' && (
          <svg 
            width="10" 
            height="8" 
            viewBox="0 0 10 8" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={styles.checkIcon}
          >
            <path 
              d="M1 4L3.5 6.5L9 1" 
              stroke={getIconColor()} 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        )}
        {state === 'indeterminate' && (
          <svg 
            width="8" 
            height="2" 
            viewBox="0 0 8 2" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={styles.indeterminateIcon}
          >
            <path 
              d="M1 1H7" 
              stroke={getIconColor()} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      {showLabel && label && (
        <span className={styles.label}>{label}</span>
      )}
    </label>
  );
};

export default Checkbox;

