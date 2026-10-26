import React from 'react';
import { Icon } from '../components/icons';
import type { IconName } from '../components/icons/Icon.types';
import styles from './GalleryNote.module.css';

interface GalleryNoteProps {
  icon?: IconName;
  children: React.ReactNode;
  /** The one thing the note offers, such as "Group them" */
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

/**
 * A quiet one-line note above the gallery, in the same style as the Sort pill and
 * the Help menu: text, one pill action and a close button. For gallery hints
 * (group suggestions, missing thumbnails), not for warnings.
 */
export const GalleryNote: React.FC<GalleryNoteProps> = ({ icon = 'info-circle', children, actionLabel, onAction, onDismiss }) => (
  <div className={styles.note} role="status">
    <span className={styles.icon} aria-hidden><Icon name={icon} size="s" /></span>
    <span className={styles.text}>{children}</span>
    {actionLabel && onAction && (
      <button type="button" className={styles.action} onClick={onAction}>{actionLabel}</button>
    )}
    {onDismiss && (
      <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        <Icon name="cross" size="s" />
      </button>
    )}
  </div>
);
