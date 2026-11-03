import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from '@components/Menu';
import { Icon } from '@components/icons';
import { useMenuAnchor, useMenuDismiss } from './useMenuAnchor';
import styles from './LeftPanel.module.css';

export interface RowMenuOption {
  label: string;
  /** Red tint for destructive actions. */
  destructive?: boolean;
  onSelect?: () => void;
}

export interface RowMenuProps {
  /** Names the trigger for assistive tech. */
  rowLabel: string;
  options: RowMenuOption[];
}

/** The row's overflow control and its portalled menu. */
export const RowMenu: React.FC<RowMenuProps> = ({ rowLabel, options }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const anchor = useMenuAnchor(open, triggerRef, menuRef, 'bottom', 'right');
  useMenuDismiss(open, close, [triggerRef, menuRef]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.itemAction}
        aria-label={`More options for ${rowLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="more" size="m" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.rowMenu}
            style={{
              top: anchor?.top ?? 0,
              right: anchor?.right ?? 0,
              // Hidden for the one frame before the anchor is measured.
              visibility: anchor ? 'visible' : 'hidden',
            }}
          >
            <Menu show onClose={close}>
              {options.map((option) => (
                <Menu.Item
                  key={option.label}
                  danger={option.destructive}
                  onClick={() => {
                    option.onSelect?.();
                    close();
                  }}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu>
          </div>,
          document.body
        )}
    </>
  );
};

export default RowMenu;
