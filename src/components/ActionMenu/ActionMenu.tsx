import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import styles from './ActionMenu.module.css';

// ─── ActionMenuItem ────────────────────────────────────────────────────────

export interface ActionMenuItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Red tint using --rd-sys-color-content-failure */
  destructive?: boolean;
  /** Keyboard shortcut display */
  shortcut?: string;
  /** Internal — set by ActionMenu root */
  _focused?: boolean;
}

export const ActionMenuItem = React.forwardRef<HTMLButtonElement, ActionMenuItemProps>(
  ({ label, icon, onClick, disabled, destructive, shortcut, _focused }, ref) => {
    const itemClasses = [
      styles.menuItem,
      destructive && styles.destructive,
      disabled && styles.itemDisabled,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        className={itemClasses}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        tabIndex={_focused ? 0 : -1}
        aria-disabled={disabled}
      >
        {icon && <span className={styles.itemIcon}>{icon}</span>}
        <span className={styles.itemLabel}>{label}</span>
        {shortcut && <span className={styles.itemShortcut}>{shortcut}</span>}
      </button>
    );
  }
);
ActionMenuItem.displayName = 'ActionMenuItem';

// ─── ActionMenuItemGroup ───────────────────────────────────────────────────

export interface ActionMenuItemGroupProps {
  label?: string;
  children: React.ReactNode;
}

export const ActionMenuItemGroup: React.FC<ActionMenuItemGroupProps> = ({ label, children }) => {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {label && <div className={styles.groupLabel}>{label}</div>}
      {children}
    </div>
  );
};
ActionMenuItemGroup.displayName = 'ActionMenuItemGroup';

// ─── ActionMenu (root) ────────────────────────────────────────────────────

export interface ActionMenuProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  onOpen?: () => void;
  onClose?: () => void;
}

const ActionMenuBase: React.FC<ActionMenuProps> = ({
  trigger,
  children,
  placement = 'bottom-start',
  onOpen,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const close = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    onClose?.();
  }, [onClose]);

  const open = useCallback(() => {
    setIsOpen(true);
    setFocusedIndex(0);
    onOpen?.();
  }, [onOpen]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  // Click-outside detection
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Collect focusable menu items after open
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
    );
    itemRefs.current = items;
    if (items.length > 0) {
      items[0].focus();
      setFocusedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      // Dismissal is about the menu, not its contents — a menu whose rows are
      // checkboxes or anything else that isn't a `menuitem` still has to close
      // on Escape, so this runs before the item lookup below can bail out.
      if (e.key === 'Escape' || e.key === 'Tab') {
        if (e.key === 'Escape') e.preventDefault();
        close();
        return;
      }

      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = (prev + 1) % items.length;
            items[next]?.focus();
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = (prev - 1 + items.length) % items.length;
            items[next]?.focus();
            return next;
          });
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && items[focusedIndex]) {
            items[focusedIndex].click();
          }
          break;
      }
    },
    [isOpen, close, focusedIndex]
  );

  /**
   * Dismiss once a selection is made.
   *
   * Items arrive as opaque `children`, so their own onClick handlers cannot be
   * wrapped without cloning — and cloning would have to know about Groups and
   * anything else a caller nests in here. Closing on the bubbled click instead
   * means no item has to remember to dismiss the menu, and it covers the
   * Enter/Space path for free, since that dispatches a real click.
   */
  const handleMenuClick = useCallback(
    (e: React.MouseEvent) => {
      const item = (e.target as HTMLElement).closest('[role="menuitem"]');
      if (item) close();
    },
    [close]
  );

  const menuClasses = [styles.menu, styles[placement.replace('-', '_')]].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onKeyDown={handleKeyDown}
    >
      {React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
        onClick: toggle,
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        'aria-controls': menuId,
      })}
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          className={menuClasses}
          role="menu"
          aria-orientation="vertical"
          onClick={handleMenuClick}
        >
          {children}
        </div>
      )}
    </div>
  );
};

ActionMenuBase.displayName = 'ActionMenu';

// ─── Compound type assembly ────────────────────────────────────────────────

type ActionMenuComponent = React.FC<ActionMenuProps> & {
  Item: typeof ActionMenuItem;
  Group: typeof ActionMenuItemGroup;
};

export const ActionMenu = ActionMenuBase as ActionMenuComponent;
ActionMenu.Item = ActionMenuItem;
ActionMenu.Group = ActionMenuItemGroup;

export default ActionMenu;
