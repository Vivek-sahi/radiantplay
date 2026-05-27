import React from 'react';
import styles from './Modal.module.css';

export interface ModalFooterProps {
  /** Tertiary actions (left side) - typically a link-style button */
  tertiaryAction?: React.ReactNode;
  /** Secondary action button (right side, before primary) */
  secondaryAction?: React.ReactNode;
  /** Primary action button (right side, last) */
  primaryAction?: React.ReactNode;
  /** Custom children - overrides action slots */
  children?: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ModalFooter Component
 * 
 * Reusable footer component for modals with action button slots.
 * Follows Figma spec: tertiary on left, secondary + primary on right.
 * 
 * @example With action slots
 * ```tsx
 * <ModalFooter
 *   tertiaryAction={<Button variant="tertiary">Learn More</Button>}
 *   secondaryAction={<Button variant="secondary">Cancel</Button>}
 *   primaryAction={<Button variant="primary">Submit</Button>}
 * />
 * ```
 * 
 * @example With custom children
 * ```tsx
 * <ModalFooter>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="primary">Submit</Button>
 * </ModalFooter>
 * ```
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  tertiaryAction,
  secondaryAction,
  primaryAction,
  children,
  className,
}) => {
  // If children provided, use them directly (right-aligned by default)
  if (children) {
    return (
      <div className={[styles.primaryActions, className].filter(Boolean).join(' ')}>
        {children}
      </div>
    );
  }

  return (
    <>
      {/* Tertiary actions on left - only render if provided */}
      {tertiaryAction && (
        <div className={styles.tertiaryActions}>
          {tertiaryAction}
        </div>
      )}

      {/* Primary actions on right - always right-aligned via margin-left: auto */}
      <div className={[styles.primaryActions, className].filter(Boolean).join(' ')}>
        {secondaryAction}
        {primaryAction}
      </div>
    </>
  );
};

export default ModalFooter;
