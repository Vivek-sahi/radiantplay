import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../icons';
import styles from './NumberInput.module.css';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'size'> {
  /** Label text */
  label?: string;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Current value (controlled). `null` means empty */
  value?: number | null;
  /** Starting value when uncontrolled */
  defaultValue?: number | null;
  /** Called with the new number, or `null` when the field is cleared */
  onChange?: (value: number | null) => void;
  /** Lowest allowed value */
  min?: number;
  /** Highest allowed value */
  max?: number;
  /**
   * Amount the spin buttons and arrow keys add or remove. Shift + arrow uses 10 steps.
   * @default 1
   */
  step?: number;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field has an error */
  error?: boolean;
  /** Error message below the field */
  errorMessage?: string;
  /** Helper text below the field. Hidden while an error message shows */
  helperText?: string;
  /** Read-only: filled background, no border, no spin buttons */
  readOnly?: boolean;
  /**
   * Hide the spin buttons. Arrow keys still step the value.
   * @default false
   */
  hideSpinButtons?: boolean;
  /** Additional CSS class name */
  className?: string;
}

const decimalsOf = (n: number): number => {
  const s = String(n);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
};

const toText = (v: number | null | undefined): string => (v === null || v === undefined || Number.isNaN(v) ? '' : String(v));

/**
 * NumberInput
 *
 * The Figma Number input (370:16728): a number field with up and down spin
 * buttons that appear on hover and focus. It follows TextInput for the label,
 * helper text and error message, and picks up the opt-in `look: 'radiant-3'`
 * sizes (32px field, 6px radius, 12/18 label that turns brand on focus).
 *
 * Keyboard: ArrowUp and ArrowDown step by `step` (Shift for 10 steps),
 * Home and End jump to `min` and `max`. Typed values are clamped on blur.
 *
 * @example
 * ```tsx
 * <NumberInput label="Rows" defaultValue={10} min={1} max={100} />
 * <NumberInput label="Threshold" value={v} onChange={setV} step={0.5} />
 * <NumberInput label="Limit" error errorMessage="Enter a value up to 50" />
 * ```
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  label,
  showLabel = true,
  value,
  defaultValue = null,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  error = false,
  errorMessage,
  helperText,
  readOnly = false,
  hideSpinButtons = false,
  placeholder,
  className,
  onBlur,
  onKeyDown,
  ...props
}, ref) => {
  const id = useId();
  const isControlled = value !== undefined;
  const [inner, setInner] = useState<number | null>(defaultValue);
  const current = isControlled ? value : inner;
  const [text, setText] = useState<string>(toText(current));
  const editing = useRef(false);

  // Keep the text in step with outside value changes while the user is not typing
  useEffect(() => {
    if (!editing.current) setText(toText(current));
  }, [current]);

  const precision = Math.max(decimalsOf(step), decimalsOf(min ?? 0));

  const clamp = useCallback((n: number) => {
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return Number(next.toFixed(Math.max(precision, decimalsOf(n))));
  }, [min, max, precision]);

  const commit = useCallback((next: number | null) => {
    if (!isControlled) setInner(next);
    setText(toText(next));
    if (next !== current) onChange?.(next);
  }, [isControlled, current, onChange]);

  const stepBy = useCallback((dir: 1 | -1, multiplier = 1) => {
    if (disabled || readOnly) return;
    const base = current ?? (dir === 1 ? (min ?? 0) - step : (max ?? 0) + step);
    const raw = base + dir * step * multiplier;
    editing.current = false;
    commit(clamp(Number(raw.toFixed(precision))));
  }, [disabled, readOnly, current, min, max, step, precision, clamp, commit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    // Allow partial input such as "-", "1." or an empty field while typing
    if (!/^-?\d*\.?\d*$/.test(next)) return;
    editing.current = true;
    setText(next);
    if (next === '') {
      if (!isControlled) setInner(null);
      if (current !== null) onChange?.(null);
      return;
    }
    const parsed = Number(next);
    if (!Number.isNaN(parsed) && next !== '-' && !next.endsWith('.')) {
      if (!isControlled) setInner(parsed);
      if (parsed !== current) onChange?.(parsed);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    editing.current = false;
    const parsed = text === '' || text === '-' ? null : Number(text);
    commit(parsed === null || Number.isNaN(parsed) ? null : clamp(parsed));
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      stepBy(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey ? 10 : 1);
    } else if (e.key === 'Home' && min !== undefined && !readOnly) {
      e.preventDefault();
      editing.current = false;
      commit(min);
    } else if (e.key === 'End' && max !== undefined && !readOnly) {
      e.preventDefault();
      editing.current = false;
      commit(max);
    } else if (e.key === 'Enter') {
      editing.current = false;
      const parsed = text === '' ? null : Number(text);
      commit(parsed === null || Number.isNaN(parsed) ? null : clamp(parsed));
    }
    onKeyDown?.(e);
  };

  const showError = error && errorMessage;
  const showHelper = !showError && helperText;
  const showSpin = !hideSpinButtons && !readOnly && !disabled;
  const atMax = max !== undefined && current !== null && current !== undefined && current >= max;
  const atMin = min !== undefined && current !== null && current !== undefined && current <= min;

  const containerClasses = [
    styles.container,
    disabled && styles.disabled,
    error && styles.error,
    readOnly && styles.readOnly,
    showSpin && styles.hasSpin,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {showLabel && label && (
        <div className={styles.labelRow}>
          {error && (
            <span className={styles.errorIcon} aria-hidden>
              <Icon name="exclamation-point-circle" size="xs" />
            </span>
          )}
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        </div>
      )}
      <div className={styles.field}>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode={precision > 0 ? 'decimal' : 'numeric'}
          role="spinbutton"
          autoComplete="off"
          className={styles.input}
          value={text}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={readOnly}
          aria-valuenow={current ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-invalid={error}
          aria-describedby={showError ? `${id}-error` : showHelper ? `${id}-helper` : undefined}
          {...props}
        />
        {showSpin && (
          <span className={styles.spin}>
            {/* Mouse-only shortcuts: keyboard users step with the arrow keys on the input */}
            <button
              type="button"
              tabIndex={-1}
              className={styles.spinButton}
              aria-label="Increase"
              disabled={atMax}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => stepBy(1)}
            >
              <Icon name="chevron-up" size="xs" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              className={styles.spinButton}
              aria-label="Decrease"
              disabled={atMin}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => stepBy(-1)}
            >
              <Icon name="chevron-down" size="xs" />
            </button>
          </span>
        )}
      </div>
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

NumberInput.displayName = 'NumberInput';

export default NumberInput;
