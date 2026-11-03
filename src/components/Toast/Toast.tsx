import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../Button';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'info' | 'warning' | 'error';
export type ToastPosition = 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right';

export interface ToastProps {
  /**
   * Toast message
   */
  message: string;
  /**
   * Toast type
   * @default 'info'
   */
  type?: ToastType;
  /**
   * Auto-dismiss duration in milliseconds (0 to disable)
   * @default 5000
   */
  duration?: number;
  /**
   * Whether the toast is visible
   * @default true
   */
  isVisible?: boolean;
  /**
   * Called when toast is dismissed
   */
  onDismiss?: () => void;
  /**
   * Action button text
   */
  actionText?: string;
  /**
   * Action button click handler
   */
  onAction?: () => void;
  /**
   * Position of the toast
   * @default 'bottom'
   */
  position?: ToastPosition;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Toast icons based on type
 */
const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconProps = { className: styles.icon, viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" };
  
  switch (type) {
    case 'success':
      return (
        <svg {...iconProps}>
          <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'warning':
      return (
        <svg {...iconProps}>
          <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 5V8.5M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'error':
      return (
        <svg {...iconProps}>
          <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'info':
    default:
      return (
        <svg {...iconProps}>
          <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
  }
};

/**
 * Toast Component
 * 
 * A temporary notification that appears to provide feedback about an action.
 * Auto-dismisses after a configurable duration.
 * 
 * @example
 * ```tsx
 * // Basic toast
 * <Toast message="Changes saved successfully" type="success" />
 * 
 * // Toast with action
 * <Toast 
 *   message="Item deleted"
 *   type="info"
 *   actionText="Undo"
 *   onAction={() => undoDelete()}
 * />
 * 
 * // Persistent toast (no auto-dismiss)
 * <Toast 
 *   message="Connection lost"
 *   type="error"
 *   duration={0}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  isVisible = true,
  onDismiss,
  actionText,
  onAction,
  position = 'bottom',
  className = '',
}) => {
  const [visible, setVisible] = useState(isVisible);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 200); // Animation duration
  }, [onDismiss]);

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0 && visible && !isExiting) {
      const timer = setTimeout(handleDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, visible, isExiting, handleDismiss]);

  // Sync with isVisible prop
  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      setIsExiting(false);
    } else {
      handleDismiss();
    }
  }, [isVisible, handleDismiss]);

  if (!visible) return null;

  const toastClasses = [
    styles.toast,
    styles[type],
    styles[`position-${position}`],
    isExiting && styles.exiting,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={toastClasses} role="alert" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.lead}>
          <ToastIcon type={type} />
          <span className={styles.message}>{message}</span>
        </div>
        {actionText && (
          <Button
            variant="primary"
            colorway="white"
            size="small"
            onClick={() => {
              onAction?.();
              handleDismiss();
            }}
          >
            {actionText}
          </Button>
        )}
      </div>
      <Button
        variant="tertiary"
        colorway="white"
        size="small"
        iconOnly
        icon="cross"
        className={styles.dismiss}
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        Dismiss
      </Button>
    </div>
  );
};

export default Toast;
