import React, { forwardRef, useId } from 'react';
import { Icon } from '../icons';
import { useRadiantLook } from '../../context/RadiantLookContext';
import styles from './TextArea.module.css';

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  /**
   * Label text
   */
  label?: string;
  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Current value
   */
  value?: string;
  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /**
   * Whether the textarea is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the textarea has an error
   * @default false
   */
  error?: boolean;
  /**
   * Error message to display. Under look: 'radiant-3' it replaces the label
   * text on the label line, and defaults to Please add “{label}” when unset
   */
  errorMessage?: string;
  /**
   * Helper text beside the label (when not in error state). Under
   * look: 'radiant-3' it stays beside the label on error too
   */
  helperText?: string;
  /**
   * Number of visible text rows
   * @default 4
   */
  rows?: number;
  /**
   * Whether to allow resizing
   * @default 'vertical'
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /**
   * Maximum character count (shows counter when set)
   */
  maxLength?: number;
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * TextArea Component
 * 
 * A multi-line text input field with optional label, helper text, and error states.
 *
 * **Radiant 3.0 look** (`look: 'radiant-3'`, Figma Form 25110:47073): the label
 * line reads "Label (helper text)" and nothing goes under the field except the
 * character counter. On error the label turns red with an icon and reads
 * `errorMessage`, or Please add “{label}” when no message is given; the helper
 * text stays beside it. Without a visible label, helper and error text fall
 * back to the footer under the field.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <TextArea 
 *   label="Description" 
 *   placeholder="Enter description..." 
 *   value={description} 
 *   onChange={(e) => setDescription(e.target.value)} 
 * />
 * 
 * // With character counter
 * <TextArea 
 *   label="Bio" 
 *   maxLength={200}
 *   helperText="Tell us about yourself"
 * />
 * 
 * // With error
 * <TextArea 
 *   label="Comment" 
 *   error 
 *   errorMessage="This field is required" 
 * />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  label,
  showLabel = true,
  placeholder,
  value = '',
  onChange,
  disabled = false,
  error = false,
  errorMessage,
  helperText,
  rows = 4,
  resize = 'vertical',
  maxLength,
  className,
  ...props
}, ref) => {
  const id = useId();

  const containerClasses = [
    styles.container,
    disabled && styles.disabled,
    error && styles.error,
    className,
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    styles.textarea,
    styles[`resize-${resize}`],
  ].filter(Boolean).join(' ');

  const characterCount = typeof value === 'string' ? value.length : 0;
  const showCounter = maxLength !== undefined;
  // Radiant 3.0: helper and error text move onto the label line
  const labelLine = useRadiantLook() === 'radiant-3' && Boolean(showLabel && label);

  return (
    <div className={containerClasses}>
      {labelLine ? (
        <label htmlFor={id} className={styles.label}>
          {error ? (
            <span className={styles.labelError}>
              <Icon name="exclamation-point-circle" size="xs" aria-hidden />
              {errorMessage || `Please add “${label}”`}
            </span>
          ) : label}
          {helperText && <span className={styles.helperInline}>({helperText})</span>}
        </label>
      ) : showLabel && label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {helperText && !error && (
            <span className={styles.helperInline}> ({helperText})</span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={textareaClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error}
        aria-describedby={!labelLine && error && errorMessage ? `${id}-error` : undefined}
        {...props}
      />
      {labelLine ? (
        showCounter && (
          <div className={styles.footer}>
            <span className={styles.counter}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )
      ) : (
        <div className={styles.footer}>
          {error && errorMessage ? (
            <span id={`${id}-error`} className={styles.errorMessage}>
              {errorMessage}
            </span>
          ) : helperText && !showLabel ? (
            <span className={styles.helperText}>{helperText}</span>
          ) : (
            <span />
          )}
          {showCounter && (
            <span className={styles.counter}>
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
