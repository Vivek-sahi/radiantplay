import React, { useCallback, useId } from 'react';
import { sysVar } from '../../tokens/colors';
import styles from './Radio.module.css';

export interface RadioProps {
  /** Whether the radio is selected */
  checked?: boolean;
  /** Label text */
  label?: string;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Whether the radio has an error */
  error?: boolean;
  /** Name attribute for form submission (groups radios together) */
  name?: string;
  /** Value attribute for form submission */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Radio Component
 * 
 * A form control for single selection from a group of options.
 * 
 * @example
 * ```tsx
 * <Radio name="size" value="small" label="Small" checked={size === 'small'} onChange={setSize} />
 * <Radio name="size" value="medium" label="Medium" checked={size === 'medium'} onChange={setSize} />
 * <Radio name="size" value="large" label="Large" checked={size === 'large'} onChange={setSize} />
 * ```
 */
export const Radio: React.FC<RadioProps> = ({
  checked = false,
  label,
  showLabel = true,
  disabled = false,
  error = false,
  name,
  value = '',
  onChange,
  className,
}) => {
  const id = useId();

  const handleChange = useCallback(() => {
    if (!disabled && onChange) {
      onChange(value);
    }
  }, [disabled, onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  }, [handleChange]);

  const getDotColor = () => {
    if (error) return sysVar('content-failure');
    return sysVar('content-brand');
  };

  const containerClasses = [
    styles.radio,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <label 
      className={containerClasses}
      htmlFor={id}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={styles.input}
      />
      <span
        className={[
          styles.circle,
          error ? styles.circleError : checked && styles.circleSelected,
        ].filter(Boolean).join(' ')}
      >
        {checked && (
          <span 
            className={styles.dot}
            style={{ backgroundColor: getDotColor() }}
          />
        )}
      </span>
      {showLabel && label && (
        <span className={styles.label}>{label}</span>
      )}
    </label>
  );
};

export default Radio;

