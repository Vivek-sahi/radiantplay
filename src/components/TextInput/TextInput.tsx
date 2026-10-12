import React, { forwardRef, useId } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input has an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text below the field. Hidden while an error message shows */
  helperText?: string;
  /** Icon or element at the end of the field, such as `<Icon name="info" size="m" />` */
  trailingIcon?: React.ReactNode;
  /** Read-only: the value shows on a filled background with no border and can't be edited */
  readOnly?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * TextInput Component
 * 
 * A text input field with optional label and error states.
 * 
 * @example
 * ```tsx
 * <TextInput label="Name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
 * <TextInput label="Email" error errorMessage="Invalid email" />
 * <TextInput label="Workspace" helperText="Shown to everyone in the org" />
 * <TextInput label="ID" value="ws-0142" readOnly />
 * ```
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
  label,
  showLabel = true,
  placeholder,
  value,
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  helperText,
  trailingIcon,
  readOnly,
  className,
  ...props
}, ref) => {
  const id = useId();
  const showError = error && errorMessage;
  const showHelper = !showError && helperText;

  const containerClasses = [
    styles.container,
    disabled && styles.disabled,
    error && styles.error,
    readOnly && styles.readOnly,
    className,
  ].filter(Boolean).join(' ');

  const input = (
    <input
      ref={ref}
      id={id}
      type="text"
      className={styles.input}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={error}
      aria-describedby={showError ? `${id}-error` : showHelper ? `${id}-helper` : undefined}
      {...props}
    />
  );

  return (
    <div className={containerClasses}>
      {showLabel && label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {trailingIcon ? (
        <div className={styles.field}>
          {input}
          <span className={styles.trailingIcon}>{trailingIcon}</span>
        </div>
      ) : input}
      {showError && (
        <span id={`${id}-error`} className={styles.errorMessage}>
          {errorMessage}
        </span>
      )}
      {showHelper && (
        <span id={`${id}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput;
