import React, { forwardRef, useCallback, useState } from 'react';
import { Icon, isValidIconName } from '../icons';
import type { IconName, IconSize } from '../icons';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'small' | 'basic' | 'large';
export type ButtonColorway = 'standard' | 'white';
export type IconPosition = 'leading' | 'trailing' | 'none';

/**
 * Maps button sizes to icon sizes for consistent proportions
 */
const buttonSizeToIconSize: Record<ButtonSize, IconSize> = {
  small: 's',
  basic: 'm',
  large: 'm',
};

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** The visual style variant */
  variant?: ButtonVariant;
  /** The size of the button */
  size?: ButtonSize;
  /** The color scheme - standard (light bg) or white (dark bg) */
  colorway?: ButtonColorway;
  /** The button text content */
  children: React.ReactNode;
  /** Optional icon - can be a ReactNode or an icon name from the registry */
  icon?: React.ReactNode | IconName;
  /** Position of the icon */
  iconPosition?: IconPosition;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Whether the button is in active/pressed state */
  active?: boolean;
  /** Whether the button spans full width */
  fullWidth?: boolean;
  /** Icon-only circular button — hides label, applies equal padding and border-radius: 50% */
  iconOnly?: boolean;
  /** HTML button type */
  htmlType?: 'button' | 'submit' | 'reset';
}

/**
 * Button Component
 * 
 * A comprehensive button component supporting multiple variants, sizes, colorways, and states.
 * This is the most used component in the Radiant design system.
 * 
 * **Variants:**
 * - `primary` - Blue filled button for primary actions
 * - `secondary` - Gray filled button for secondary actions
 * - `tertiary` - Text-only button for tertiary actions
 * 
 * **Sizes:**
 * - `small` - 24px height, 12px font
 * - `basic` - 32px height, 14px font (default)
 * - `large` - 32px height, 14px font, full width container
 * 
 * **Colorways:**
 * - `standard` - For use on light backgrounds (default)
 * - `white` - For use on dark backgrounds
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary">Save Changes</Button>
 * 
 * // With icon name (recommended)
 * <Button variant="primary" icon="plus" iconPosition="leading">
 *   Add Item
 * </Button>
 * 
 * // With icon component (legacy support)
 * <Button variant="primary" icon={<PlusIcon size="m" />} iconPosition="leading">
 *   Add Item
 * </Button>
 * 
 * // Secondary small
 * <Button variant="secondary" size="small">Cancel</Button>
 * 
 * // Tertiary with dropdown
 * <Button variant="tertiary" icon="chevron-down" iconPosition="trailing">
 *   Options
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'basic',
  colorway = 'standard',
  children,
  icon,
  iconPosition = 'leading',
  loading = false,
  active = false,
  fullWidth = false,
  iconOnly = false,
  disabled = false,
  htmlType = 'button',
  className,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) setIsPressed(true);
    onMouseDown?.(e);
  }, [disabled, onMouseDown]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    onMouseUp?.(e);
  }, [onMouseUp]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  const isActive = active || isPressed;
  const hasIcon = icon && iconPosition !== 'none';

  // Render icon - supports both icon name strings and ReactNode
  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a string, use the Icon component
    if (typeof icon === 'string' && isValidIconName(icon)) {
      return (
        <Icon 
          name={icon as IconName} 
          size={buttonSizeToIconSize[size]} 
        />
      );
    }
    
    // Otherwise, render as ReactNode (legacy support)
    return icon;
  };

  // Build class names
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    styles[colorway],
    isActive && styles.active,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    hasIcon && styles.hasIcon,
    iconOnly && styles.iconOnly,
    iconPosition === 'leading' && styles.iconLeading,
    iconPosition === 'trailing' && styles.iconTrailing,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={htmlType}
      className={buttonClasses}
      disabled={disabled || loading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading ? (
        <span className={styles.loader} />
      ) : (
        <>
          {hasIcon && iconPosition === 'leading' && (
            <span className={styles.icon}>{renderIcon()}</span>
          )}
          {!iconOnly && <span className={styles.label}>{children}</span>}
          {hasIcon && iconPosition === 'trailing' && (
            <span className={styles.icon}>{renderIcon()}</span>
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

