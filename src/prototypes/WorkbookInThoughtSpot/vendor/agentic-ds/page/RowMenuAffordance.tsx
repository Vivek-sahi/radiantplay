import React, { forwardRef, useCallback, useState } from 'react';
import { Button } from '@components/Button';
import styles from './RowMenuAffordance.module.css';

/**
 * Internal helper shared by `ChatRowMenu` and `AnalystRowMenu`.
 *
 * Provides the consistent hover-affordance pattern:
 * - Row content sits inside a `position: relative` wrapper.
 * - A trailing slot (the menu trigger) is absolutely positioned at the
 *   right edge.
 * - The trailing slot is invisible by default and becomes visible when:
 *     - the wrapper is hovered,
 *     - keyboard focus is inside the wrapper,
 *     - the menu is open (caller passes `isOpen`).
 *
 * This is an implementation detail — co-located, not re-exported from
 * `@spotter/page`.
 */
export interface RowMenuAffordanceProps {
  /** Row content (typically a `SpotterPanelItem`). */
  children: React.ReactNode;
  /**
   * The trailing slot — typically the `ActionMenu` (trigger + dropdown).
   * Positioned absolutely at the right edge of the row.
   */
  trailing: React.ReactNode;
  /**
   * Whether the menu is open. When true, the trailing affordance stays
   * visible even after the cursor leaves the row.
   */
  isOpen?: boolean;
  /** Optional extra className for the outer wrapper. */
  className?: string;
}

export const RowMenuAffordance = forwardRef<HTMLDivElement, RowMenuAffordanceProps>(
  ({ children, trailing, isOpen = false, className }, ref) => {
    const classes = [
      styles.wrapper,
      isOpen && styles.wrapperOpen,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} data-open={isOpen || undefined}>
        {children}
        <span className={styles.trailing}>{trailing}</span>
      </div>
    );
  },
);

RowMenuAffordance.displayName = 'RowMenuAffordance';

/**
 * Kebab (more-horizontal) trigger button used by the row menus.
 * Passed into `ActionMenu`'s `trigger` slot; `ActionMenu` clones it with
 * the right click handler and aria attributes.
 */
export interface RowMenuTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  /** Accessible label, e.g. "Chat actions" or "Analyst actions". */
  ariaLabel: string;
}

export const RowMenuTrigger = forwardRef<HTMLButtonElement, RowMenuTriggerProps>(
  ({ ariaLabel, className, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        variant="tertiary"
        size="small"
        iconOnly
        icon="more"
        aria-label={ariaLabel}
        className={[styles.trigger, className].filter(Boolean).join(' ')}
        {...rest}
      >
        {/* iconOnly hides the label visually; Button requires children */}
        {ariaLabel}
      </Button>
    );
  },
);

RowMenuTrigger.displayName = 'RowMenuTrigger';

/**
 * Tiny helper for managing the open state from a row menu component.
 * Returns `[isOpen, onOpen, onClose]` to pass into `ActionMenu`.
 */
export const useRowMenuOpen = (): [boolean, () => void, () => void] => {
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  return [open, onOpen, onClose];
};
