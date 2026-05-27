import React, { useEffect, useCallback } from 'react';
import styles from './Modal.module.css';

/** Modal size variants matching Figma specifications */
export type ModalSize = 'M1' | 'M2' | 'M3' | 'M4' | 'small' | 'medium' | 'large';

/** Modal type variants */
export type ModalType = 'simple' | 'wizard' | 'subnavigation' | 'splashscreen';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Eyebrow text above title (for wizard type) */
  eyebrow?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (typically buttons) */
  footer?: React.ReactNode;
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Whether to close on Escape key */
  closeOnEscape?: boolean;
  /** 
   * Modal size - Figma naming convention
   * - M1: 394px (compact dialogs, confirmations)
   * - M2: 788px (standard forms, settings)
   * - M3: 1182px (complex layouts, data tables)
   * - M4: Full screen (immersive experiences)
   * - small/medium/large: Legacy sizes for backward compatibility
   */
  size?: ModalSize;
  /** 
   * Modal type variant
   * - simple: Header + Content + Footer (default)
   * - wizard: With progress bar and step indicator
   * - subnavigation: With left navigation panel
   * - splashscreen: Feature announcement/onboarding
   */
  type?: ModalType;
  /** Current step (for wizard type, 1-indexed) */
  currentStep?: number;
  /** Total number of steps (for wizard type, 2-4) */
  totalSteps?: number;
  /** Navigation panel content (for subnavigation type) */
  navigation?: React.ReactNode;
  /** Media content (for splashscreen type) */
  mediaContent?: React.ReactNode;
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Additional CSS class name for the modal content */
  className?: string;
}

/**
 * Modal Component
 * 
 * An overlay modal dialog for displaying content on top of the page.
 * Supports multiple sizes (M1-M4) and types (simple, wizard, subnavigation, splashscreen)
 * based on the Radiant 3.0 Design System specifications.
 * 
 * @example Simple Modal
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="M2"
 *   title="Form Title"
 *   footer={
 *     <>
 *       <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="primary" onClick={handleSubmit}>Submit</Button>
 *     </>
 *   }
 * >
 *   <TextInput label="Name" />
 * </Modal>
 * ```
 * 
 * @example Wizard Modal
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="M2"
 *   type="wizard"
 *   title="Create New Group"
 *   eyebrow="Step 1 of 3"
 *   currentStep={1}
 *   totalSteps={3}
 *   footer={
 *     <>
 *       <Button variant="tertiary">Cancel</Button>
 *       <Button variant="secondary">Back</Button>
 *       <Button variant="primary">Next</Button>
 *     </>
 *   }
 * >
 *   <StepContent />
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'M2',
  type = 'simple',
  currentStep,
  totalSteps,
  navigation,
  mediaContent,
  showCloseButton = true,
  className,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Build modal classes
  const modalClasses = [
    styles.modal,
    styles[size],
    styles[type],
    className,
  ].filter(Boolean).join(' ');

  // Determine if we should show wizard progress bar (wizard or multi-step splash screen)
  const showWizardProgress =
    (type === 'wizard' || type === 'splashscreen') &&
    currentStep !== undefined &&
    totalSteps &&
    totalSteps >= 2;

  // For M4 full screen, use text close button
  const isFullScreen = size === 'M4';

  return (
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={modalClasses}>
        {/* Sub-navigation panel (left side) */}
        {type === 'subnavigation' && navigation && (
          <div className={styles.navPanel}>
            {navigation}
          </div>
        )}

        {/* Main content area */}
        <div className={styles.mainArea}>
          {/* Splash screen media area */}
          {type === 'splashscreen' && mediaContent && (
            <div className={styles.mediaArea}>
              {mediaContent}
            </div>
          )}

          {/* Header — splash screen has no header (title lives in the body) */}
          {type !== 'splashscreen' && (title || eyebrow) && (
            <div className={styles.header}>
              <div className={styles.headerContent}>
                {eyebrow && (
                  <span className={styles.eyebrow}>{eyebrow}</span>
                )}
                {title && (
                  <h2 id="modal-title" className={styles.title}>{title}</h2>
                )}
              </div>
              {showCloseButton && isFullScreen && (
                <button
                  type="button"
                  className={styles.closeButtonText}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  Close
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={styles.content}>
            {children}
          </div>

          {/* Footer */}
          {footer && !isFullScreen && (
            <div className={styles.footer}>
              {footer}
            </div>
          )}

          {/* Wizard Progress Bar */}
          {showWizardProgress && (
            <div className={styles.wizardProgress}>
              {Array.from({ length: totalSteps! }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.wizardStep} ${i < currentStep! ? styles.wizardStepActive : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
