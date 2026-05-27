import React, { forwardRef } from 'react';
import { ActionMenu } from '@components/ActionMenu';
import { Icon } from '@components/icons';
import {
  RowMenuAffordance,
  RowMenuTrigger,
  useRowMenuOpen,
} from './RowMenuAffordance';
import styles from './AnalystRowMenu.module.css';

export interface AnalystRowMenuProps {
  /** Row content — typically an `AnalystCard` / `SpotterPanelItem` row. */
  children: React.ReactNode;
  /**
   * Whether the current user has edit privilege on this analyst.
   * When false, the Edit item is omitted from the menu entirely.
   */
  canEdit: boolean;
  /** Edit the analyst. Only invoked when `canEdit` is true. */
  onEdit?: () => void;
  /** Share the analyst. */
  onShare: () => void;
  /** Duplicate the analyst. */
  onMakeCopy: () => void;
  /** Delete the analyst. Renders with destructive style. */
  onDelete: () => void;
  /** Optional className passthrough on the wrapper. */
  className?: string;
}

/**
 * AnalystRowMenu
 *
 * Hover-triggered context menu attached to an analyst row in the Spotter
 * left panel. Renders the row's children plus a kebab affordance at the
 * trailing edge. The affordance appears on row hover, keyboard focus, or
 * while the menu is open.
 *
 * Items (in order): Edit (privilege-gated) · Share · Make a copy · Delete (destructive).
 *
 * Uses Radiant `ActionMenu` for the dropdown — keyboard nav, click-outside,
 * and escape handling come for free.
 */
export const AnalystRowMenu = forwardRef<HTMLDivElement, AnalystRowMenuProps>(
  (
    {
      children,
      canEdit,
      onEdit,
      onShare,
      onMakeCopy,
      onDelete,
      className,
    },
    ref,
  ) => {
    const [isOpen, onOpen, onClose] = useRowMenuOpen();

    return (
      <RowMenuAffordance
        ref={ref}
        isOpen={isOpen}
        className={[styles.row, className].filter(Boolean).join(' ')}
        trailing={
          <ActionMenu
            trigger={<RowMenuTrigger ariaLabel="Analyst actions" />}
            placement="bottom-end"
            onOpen={onOpen}
            onClose={onClose}
          >
            {canEdit && (
              <ActionMenu.Item
                label="Edit"
                icon={<Icon name="pencil" size="s" />}
                onClick={onEdit}
              />
            )}
            <ActionMenu.Item
              label="Share"
              icon={<Icon name="share" size="s" />}
              onClick={onShare}
            />
            <ActionMenu.Item
              label="Make a copy"
              icon={<Icon name="copy" size="s" />}
              onClick={onMakeCopy}
            />
            <ActionMenu.Item
              label="Delete"
              icon={<Icon name="trash-can" size="s" />}
              destructive
              onClick={onDelete}
            />
          </ActionMenu>
        }
      >
        {children}
      </RowMenuAffordance>
    );
  },
);

AnalystRowMenu.displayName = 'AnalystRowMenu';

export default AnalystRowMenu;
