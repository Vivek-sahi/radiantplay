import React, { forwardRef, useCallback, useState } from 'react';
import { Icon } from '@components/icons';
import { Vertical } from '@components/Layout';
import { Popover, type PopoverPlacement } from '@components/Popover';
import { PersonalMemoryToggle } from './PersonalMemoryToggle';
import styles from './SettingsMenu.module.css';

/**
 * Shape required by Radiant's `Popover` for its trigger element. Kept loose
 * so callers can pass any clickable element (button, Spotter rail item, etc.).
 */
interface TriggerLike {
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

export interface SettingsMenuProps {
  /**
   * The trigger element (e.g. the Settings button). The popover anchors to it.
   */
  children: React.ReactElement<TriggerLike>;
  /**
   * Opens the in-page "Spotter instructions" modal.
   */
  onSpotterInstructions: () => void;
  /**
   * Opens the in-page "Spotter best practices" modal.
   */
  onSpotterBestPractices: () => void;
  /**
   * URL for the Usage monitoring page (opens in a new tab).
   */
  usageMonitoringHref: string;
  /**
   * URL for the Admin settings page (opens in a new tab).
   */
  adminSettingsHref: string;
  /**
   * URL for the Manage memory sources page (opens in a new tab).
   */
  manageMemoryHref: string;
  /**
   * Current state of the Personal memory toggle.
   */
  personalMemoryEnabled: boolean;
  /**
   * Called when the user flips the Personal memory toggle.
   */
  onPersonalMemoryChange: (next: boolean) => void;
  /**
   * Optional popover placement override. Defaults to `top-start` so the menu
   * opens upward from the Settings button at the bottom of the panel.
   */
  placement?: PopoverPlacement;
  /**
   * Optional controlled open state.
   */
  isOpen?: boolean;
  /**
   * Notified when the popover opens or closes.
   */
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

interface MenuRowProps {
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}

/**
 * Single row inside the settings menu. Renders an `<a>` for external links
 * (so middle-click / cmd-click work) and a `<button>` for in-page actions.
 * Visual language matches `SpotterPanelItem`.
 */
const MenuRow = forwardRef<HTMLElement, MenuRowProps>(
  ({ label, onClick, href, external = false }, ref) => {
    const trailing = external ? (
      <span className={styles.trailingIcon} aria-hidden="true">
        <Icon name="expand" size="xs" />
      </span>
    ) : null;

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={styles.row}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          onClick={onClick}
          role="menuitem"
        >
          <span className={styles.label}>{label}</span>
          {trailing}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={styles.row}
        onClick={onClick}
        role="menuitem"
      >
        <span className={styles.label}>{label}</span>
        {trailing}
      </button>
    );
  },
);
MenuRow.displayName = 'SettingsMenu.Row';

/**
 * SettingsMenu
 *
 * Popover menu opened from the Settings button at the bottom of the Spotter
 * left panel. Hosts six items in four dividered groups:
 *
 *   1. Spotter instructions          → in-page modal
 *      ───────────────────────────
 *   2. Usage monitoring              → new tab
 *   3. Admin settings                → new tab
 *      ───────────────────────────
 *   4. Manage memory sources         → new tab
 *   5. Personal memory               → inline toggle
 *      ───────────────────────────
 *   6. Spotter best practices        → in-page modal
 *
 * The trigger is passed as `children`. SettingsMenu owns popover open/close
 * unless you control it via `isOpen` + `onOpenChange`.
 */
export const SettingsMenu = forwardRef<HTMLDivElement, SettingsMenuProps>(
  (
    {
      children,
      onSpotterInstructions,
      onSpotterBestPractices,
      usageMonitoringHref,
      adminSettingsHref,
      manageMemoryHref,
      personalMemoryEnabled,
      onPersonalMemoryChange,
      placement = 'top-start',
      isOpen: controlledIsOpen,
      onOpenChange,
      className,
    },
    ref,
  ) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

    const setOpen = useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setUncontrolledIsOpen(next);
        }
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange],
    );

    const close = useCallback(() => setOpen(false), [setOpen]);

    const handleInstructions = useCallback(() => {
      close();
      onSpotterInstructions();
    }, [close, onSpotterInstructions]);

    const handleBestPractices = useCallback(() => {
      close();
      onSpotterBestPractices();
    }, [close, onSpotterBestPractices]);

    const classes = [styles.menu, className].filter(Boolean).join(' ');

    const content = (
      <div
        ref={ref}
        className={classes}
        role="menu"
        aria-label="Spotter settings"
      >
        <Vertical gap={0}>
          {/* Group 1 — Spotter instructions */}
          <MenuRow label="Spotter instructions" onClick={handleInstructions} />

          <div className={styles.divider} role="separator" />

          {/* Group 2 — Usage monitoring + Admin settings */}
          <MenuRow
            label="Usage monitoring"
            href={usageMonitoringHref}
            external
            onClick={close}
          />
          <MenuRow
            label="Admin settings"
            href={adminSettingsHref}
            external
            onClick={close}
          />

          <div className={styles.divider} role="separator" />

          {/* Group 3 — Manage memory sources + Personal memory */}
          <MenuRow
            label="Manage memory sources"
            href={manageMemoryHref}
            external
            onClick={close}
          />
          <PersonalMemoryToggle
            enabled={personalMemoryEnabled}
            onChange={onPersonalMemoryChange}
          />

          <div className={styles.divider} role="separator" />

          {/* Group 4 — Spotter best practices */}
          <MenuRow label="Spotter best practices" onClick={handleBestPractices} />
        </Vertical>
      </div>
    );

    return (
      <Popover
        content={content}
        placement={placement}
        trigger="click"
        isOpen={isOpen}
        onOpenChange={setOpen}
        className={styles.popover}
      >
        {children}
      </Popover>
    );
  },
);

SettingsMenu.displayName = 'SettingsMenu';

export default SettingsMenu;
