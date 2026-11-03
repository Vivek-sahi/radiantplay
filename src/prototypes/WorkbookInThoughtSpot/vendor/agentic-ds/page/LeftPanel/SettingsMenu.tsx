import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from '@components/Menu';
import { Toggle } from '@components/Toggle';
import { Icon } from '@components/icons';
import { ExternalLinkIcon } from './icons';
import { useMenuAnchor, useMenuDismiss } from './useMenuAnchor';
import styles from './LeftPanel.module.css';

interface SettingsRowProps {
  label: string;
  /** Marks the row as leaving the panel — trailing external-link glyph. */
  external?: boolean;
  onSelect: (label: string, external: boolean) => void;
}

/**
 * A settings row.
 *
 * Rows are local rather than `Menu.Item` because two of the shapes here are
 * outside what it renders: a trailing icon (its `shortcut` slot is typed as a
 * string) and a toggle. Keeping every row local means one hover and focus
 * treatment rather than two that have to be kept in sync. `Menu` still supplies
 * the panel chrome, and `role="menuitem"` keeps its arrow-key nav working.
 */
const SettingsRow: React.FC<SettingsRowProps> = ({ label, external = false, onSelect }) => (
  <button
    type="button"
    role="menuitem"
    className={styles.settingsItem}
    onClick={() => onSelect(label, external)}
  >
    <span>{label}</span>
    {external ? (
      <span className={styles.settingsItemIcon}>
        <ExternalLinkIcon size="m" />
      </span>
    ) : null}
  </button>
);

export interface SettingsMenuProps {
  collapsed: boolean;
  /** Fired with the chosen row's label. These destinations sit outside the
   *  analyst/chat hierarchy, so the panel clears its selection. */
  onSelect?: (label: string, external: boolean) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ collapsed, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [personalMemory, setPersonalMemory] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const choose = useCallback(
    (label: string, external: boolean) => {
      onSelect?.(label, external);
      setOpen(false);
    },
    [onSelect]
  );
  // Opens upward — the trigger sits at the bottom of the panel.
  const anchor = useMenuAnchor(open, triggerRef, menuRef, 'top', 'left');
  useMenuDismiss(open, close, [triggerRef, menuRef]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.settingsButton}
        aria-label={collapsed ? 'Settings' : undefined}
        title={collapsed ? 'Settings' : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="cog" size="m" />
        <span className={styles.settingsLabel}>Settings</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={`${styles.rowMenu} ${styles.settingsMenuPanel}`}
            style={{
              top: anchor?.top ?? 0,
              left: anchor?.left ?? 0,
              // Hidden for the one frame before the anchor is measured.
              visibility: anchor ? 'visible' : 'hidden',
            }}
          >
            <Menu show onClose={close}>
              <SettingsRow label="Spotter instructions" onSelect={choose} />
              <Menu.Divider />
              <SettingsRow label="Connectors" onSelect={choose} />
              <SettingsRow label="Usage monitoring" external onSelect={choose} />
              <SettingsRow label="Admin settings" external onSelect={choose} />
              <Menu.Divider />
              <SettingsRow label="Memory sources" external onSelect={choose} />
              <div className={styles.settingsToggleRow}>
                <Toggle
                  label="Personal memory"
                  showLabel
                  labelPosition="left"
                  checked={personalMemory}
                  onChange={setPersonalMemory}
                  className={styles.settingsToggle}
                />
              </div>
              <Menu.Divider />
              <SettingsRow label="Spotter best practices" external onSelect={choose} />
            </Menu>
          </div>,
          document.body
        )}
    </>
  );
};

export default SettingsMenu;
