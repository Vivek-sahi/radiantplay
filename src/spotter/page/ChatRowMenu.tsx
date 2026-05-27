import React, { forwardRef } from 'react';
import { ActionMenu } from '@components/ActionMenu';
import { Icon } from '@components/icons';
import {
  RowMenuAffordance,
  RowMenuTrigger,
  useRowMenuOpen,
} from './RowMenuAffordance';
import styles from './ChatRowMenu.module.css';

export interface ChatRowMenuProps {
  /** Row content — typically a `SpotterPanelItem` for the chat row. */
  children: React.ReactNode;
  /** Current favorite state for the chat. */
  isFavorite: boolean;
  /** Rename the chat. */
  onRename: () => void;
  /** Toggle favorite (star/unstar). */
  onToggleFavorite: () => void;
  /** Share the chat. */
  onShare: () => void;
  /** Delete the chat. Renders with destructive style. */
  onDelete: () => void;
  /** Optional className passthrough on the wrapper. */
  className?: string;
}

/**
 * ChatRowMenu
 *
 * Hover-triggered context menu attached to a chat row in the Spotter left
 * panel. Renders the row's children plus a kebab affordance at the
 * trailing edge. The affordance appears on row hover, keyboard focus, or
 * while the menu is open.
 *
 * Items (in order): Rename · Favorite (toggle) · Share · Delete (destructive).
 *
 * Uses Radiant `ActionMenu` for the dropdown — keyboard nav, click-outside,
 * and escape handling come for free.
 */
export const ChatRowMenu = forwardRef<HTMLDivElement, ChatRowMenuProps>(
  (
    {
      children,
      isFavorite,
      onRename,
      onToggleFavorite,
      onShare,
      onDelete,
      className,
    },
    ref,
  ) => {
    const [isOpen, onOpen, onClose] = useRowMenuOpen();

    const favoriteLabel = isFavorite ? 'Unfavorite' : 'Favorite';
    const favoriteIcon = (
      <Icon name={isFavorite ? 'star-undo' : 'star'} size="s" />
    );

    return (
      <RowMenuAffordance
        ref={ref}
        isOpen={isOpen}
        className={[styles.row, className].filter(Boolean).join(' ')}
        trailing={
          <ActionMenu
            trigger={<RowMenuTrigger ariaLabel="Chat actions" />}
            placement="bottom-end"
            onOpen={onOpen}
            onClose={onClose}
          >
            <ActionMenu.Item
              label="Rename"
              icon={<Icon name="pencil" size="s" />}
              onClick={onRename}
            />
            <ActionMenu.Item
              label={favoriteLabel}
              icon={favoriteIcon}
              onClick={onToggleFavorite}
            />
            <ActionMenu.Item
              label="Share"
              icon={<Icon name="share" size="s" />}
              onClick={onShare}
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

ChatRowMenu.displayName = 'ChatRowMenu';

export default ChatRowMenu;
