import React, { forwardRef, useCallback } from 'react';
import { Icon, isValidIconName } from '../icons';
import type { IconName } from '../icons';
import styles from './Token.module.css';

export type TokenType = 'measure' | 'attribute' | 'condition' | 'date';
export type TokenStatus = 'default' | 'warning' | 'error';

export interface TokenProps {
  /** Text shown in the token */
  label: string;
  /**
   * Token type. Sets the fill and icon colour (condition uses the filter chip colours).
   * @default 'measure'
   */
  type?: TokenType;
  /**
   * Validation status. Read only: warning and error add a 1px border and swap the
   * icon for an alert icon. Editable: error uses the error fill.
   * @default 'default'
   */
  status?: TokenStatus;
  /**
   * Editable token: no icon, a remove button on hover or focus, and an active
   * (being edited) look.
   * @default false
   */
  editable?: boolean;
  /**
   * Read only only. Shows the leading icon.
   * @default true
   */
  showIcon?: boolean;
  /** Read only only. Overrides the default icon for the type. */
  icon?: IconName | React.ReactNode;
  /** Editable only. Active (being edited) look: no fill, coloured bottom line. */
  active?: boolean;
  /** Disables the token at 40% opacity */
  disabled?: boolean;
  /** Click or Enter/Space on the token, e.g. to start editing */
  onClick?: () => void;
  /** Editable only. Shows the remove button; also fires on Delete or Backspace. */
  onRemove?: () => void;
  /** Maximum width before the label truncates, in px */
  maxWidth?: number;
  className?: string;
}

const defaultIcon: Record<TokenType, IconName> = {
  measure: 'formula',
  attribute: 'formula',
  condition: 'funnel',
  date: 'funnel',
};

/**
 * Token
 *
 * The Figma Token / Read Only (16730:15349) and Token / Editable (16730:19378)
 * sets as one component. A 24px, 4px-radius label in the chip colours for a
 * measure, attribute, condition or date. Read only tokens carry a 14px icon and
 * a warning or error border. Editable tokens drop the icon, show a 16px remove
 * circle on hover and take an active look while being edited.
 *
 * @example
 * ```tsx
 * <Token type="measure" label="Revenue" />
 * <Token type="date" label="Last 30 days" status="warning" />
 * <Token editable type="attribute" label="Region" onRemove={remove} />
 * <Token editable type="condition" label="Status = Active" active />
 * ```
 */
export const Token = forwardRef<HTMLSpanElement, TokenProps>(({
  label,
  type = 'measure',
  status = 'default',
  editable = false,
  showIcon = true,
  icon,
  active = false,
  disabled = false,
  onClick,
  onRemove,
  maxWidth,
  className,
}, ref) => {
  const interactive = Boolean(onClick) && !disabled;
  const removable = editable && Boolean(onRemove) && !disabled;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    } else if (removable && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onRemove?.();
    }
  }, [interactive, removable, onClick, onRemove]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);

  const renderIcon = () => {
    if (editable || !showIcon) return null;
    if (status === 'warning' || status === 'error') {
      return (
        <span className={`${styles.icon} ${status === 'error' ? styles.iconError : styles.iconWarning}`}>
          <Icon name="exclamation-point-circle" size="s" aria-hidden />
        </span>
      );
    }
    if (icon && !(typeof icon === 'string' && isValidIconName(icon))) {
      return <span className={styles.icon}>{icon}</span>;
    }
    const name = (typeof icon === 'string' ? icon : defaultIcon[type]) as IconName;
    return (
      <span className={styles.icon}>
        <Icon name={name} size="s" aria-hidden />
      </span>
    );
  };

  const classes = [
    styles.token,
    styles[type],
    editable ? styles.editable : styles.readOnly,
    status === 'warning' && styles.warning,
    status === 'error' && styles.error,
    editable && active && styles.active,
    interactive && styles.interactive,
    removable && styles.removable,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const focusable = interactive || removable;

  return (
    <span ref={ref} className={classes} style={maxWidth ? { maxWidth } : undefined}>
      <span
        className={styles.body}
        role={interactive ? 'button' : undefined}
        tabIndex={focusable ? 0 : undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={status === 'error' || undefined}
        aria-current={editable && active ? 'true' : undefined}
        aria-keyshortcuts={removable ? 'Delete Backspace' : undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={focusable ? handleKeyDown : undefined}
        title={label}
      >
        {renderIcon()}
        <span className={styles.label}>{label}</span>
      </span>
      {removable && (
        <button
          type="button"
          className={styles.remove}
          onClick={handleRemove}
          aria-label={`Remove ${label}`}
        >
          <Icon name="cross" size="xs" aria-hidden />
        </button>
      )}
    </span>
  );
});

Token.displayName = 'Token';

export default Token;
