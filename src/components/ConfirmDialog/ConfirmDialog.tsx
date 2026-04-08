import React from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import styles from './ConfirmDialog.module.css';

/**
 * Confirm Dialog Status Types
 */
export type ConfirmDialogStatus = 'info' | 'warning' | 'danger' | 'success';

/**
 * ConfirmDialog Props
 */
export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string | React.ReactNode;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Handler for confirm action */
  onConfirm: () => void;
  /** Handler for cancel action */
  onCancel: () => void;
  /** Status type that affects icon and button color */
  status?: ConfirmDialogStatus;
  /** Whether the confirm button is in loading state */
  isLoading?: boolean;
  /** Whether the confirm button is disabled */
  isConfirmDisabled?: boolean;
  /** Whether to hide the cancel button */
  hideCancelButton?: boolean;
  /** Custom icon name (overrides status icon) */
  icon?: IconName;
}

/**
 * ConfirmDialog Component
 * 
 * A confirmation dialog for user actions that require explicit confirmation.
 * Based on the DialogueAlert pattern from radiant-code.
 * 
 * **Features:**
 * - Status variants (info, warning, danger, success)
 * - Confirm/Cancel buttons with loading state
 * - Accessible modal with keyboard support
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Delete item?"
 *   message="This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   status="danger"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  status = 'info',
  isLoading = false,
  isConfirmDisabled = false,
  hideCancelButton = false,
  icon,
}) => {
  // Get the appropriate icon based on status
  const getStatusIcon = (): IconName => {
    if (icon) return icon;
    switch (status) {
      case 'warning':
        return 'exclamation-point-circle';
      case 'danger':
        return 'cross-circle';
      case 'success':
        return 'checkmark-circle';
      case 'info':
      default:
        return 'info-circle';
    }
  };

  // Get confirm button variant based on status
  const getConfirmButtonVariant = (): 'primary' | 'secondary' => {
    return status === 'danger' ? 'primary' : 'primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="small"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className={styles.container}>
        {/* Icon */}
        <div className={`${styles.iconWrapper} ${styles[status]}`}>
          <Icon name={getStatusIcon()} size="l" />
        </div>

        {/* Title */}
        <h3 className={styles.title}>{title}</h3>

        {/* Message */}
        <div className={styles.message}>
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {!hideCancelButton && (
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={getConfirmButtonVariant()}
            onClick={onConfirm}
            loading={isLoading}
            disabled={isConfirmDisabled || isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
