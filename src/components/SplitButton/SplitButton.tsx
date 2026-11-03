import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { Button } from '../Button';
import { ActionMenu } from '../ActionMenu';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import styles from './SplitButton.module.css';

export type SplitButtonVariant = 'primary' | 'secondary';
export type SplitButtonMenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface SplitButtonItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Red text for a destructive action */
  destructive?: boolean;
}

export interface SplitButtonProps {
  /** Main action text. With `iconOnly` it becomes the accessible name. */
  label: string;
  /** Main action handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Menu items behind the chevron */
  items: SplitButtonItem[];
  /**
   * Primary (blue) or secondary (gray)
   * @default 'primary'
   */
  variant?: SplitButtonVariant;
  /** Icon on the main action, an icon name or a node */
  icon?: React.ReactNode | IconName;
  /** Figma "Primary icon" / "Secondary icon": the main action shows only the icon */
  iconOnly?: boolean;
  /** Disables both halves */
  disabled?: boolean;
  /** Disables only the main action (Figma "Left disabled") */
  mainDisabled?: boolean;
  /** Disables only the chevron (Figma "Right disabled") */
  menuDisabled?: boolean;
  /**
   * Where the menu opens, relative to the chevron
   * @default 'bottom-start'
   */
  menuPlacement?: SplitButtonMenuPlacement;
  /**
   * Accessible name of the chevron
   * @default 'More options'
   */
  menuLabel?: string;
  className?: string;
}

/**
 * SplitButton
 *
 * The Figma Split button (16818:14824): a main action and a chevron that opens
 * an ActionMenu, joined with a 2px gap. Primary and secondary types, each with
 * a text or icon-only main action. Each half hovers, presses and disables on
 * its own; the chevron shows the pressed fill while the menu is open.
 *
 * Keyboard: Enter, Space or Arrow down on the chevron opens the menu and
 * focuses the first item; Arrow up and down move; Enter picks; Escape closes
 * and returns focus to the chevron.
 *
 * @example
 * ```tsx
 * <SplitButton
 *   label="Save"
 *   onClick={save}
 *   items={[{ label: 'Save as copy', onClick: saveCopy }, { label: 'Save as template' }]}
 * />
 * ```
 */
export const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(({
  label,
  onClick,
  items,
  variant = 'primary',
  icon,
  iconOnly = false,
  disabled = false,
  mainDisabled = false,
  menuDisabled = false,
  menuPlacement = 'bottom-start',
  menuLabel = 'More options',
  className,
}, ref) => {
  const [open, setOpen] = useState(false);
  const chevronRef = useRef<HTMLButtonElement>(null);

  // ActionMenu owns its open state and toggles on the trigger's click,
  // so closing after a pick goes through the same click.
  const pick = useCallback((item: SplitButtonItem) => {
    item.onClick?.();
    chevronRef.current?.click();
    chevronRef.current?.focus();
  }, []);

  const handleChevronKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  const handleRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && open) {
      chevronRef.current?.focus();
    }
  };

  const rootClasses = [
    styles.splitButton,
    iconOnly && styles.iconType,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={rootClasses}
      role="group"
      aria-label={label}
      onKeyDown={handleRootKeyDown}
    >
      <Button
        variant={variant}
        size="basic"
        className={styles.main}
        icon={icon}
        iconPosition={icon ? 'leading' : 'none'}
        iconOnly={iconOnly}
        aria-label={iconOnly ? label : undefined}
        disabled={disabled || mainDisabled}
        onClick={onClick}
      >
        {label}
      </Button>
      <ActionMenu
        placement={menuPlacement}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        trigger={
          <Button
            ref={chevronRef}
            variant={variant}
            size="basic"
            className={styles.chevron}
            icon={<Icon name="chevron-down" size="m" />}
            iconOnly
            active={open}
            aria-label={menuLabel}
            disabled={disabled || menuDisabled}
            onKeyDown={handleChevronKeyDown}
          >
            {menuLabel}
          </Button>
        }
      >
        {items.map((item) => (
          <ActionMenu.Item
            key={item.label}
            label={item.label}
            icon={item.icon}
            disabled={item.disabled}
            destructive={item.destructive}
            onClick={() => pick(item)}
          />
        ))}
      </ActionMenu>
    </div>
  );
});

SplitButton.displayName = 'SplitButton';

export default SplitButton;
