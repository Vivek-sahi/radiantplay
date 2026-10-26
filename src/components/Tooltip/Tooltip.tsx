import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

/**
 * Tooltip Placement
 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TriggerProps {
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
}

/**
 * Tooltip Props
 */
export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement<TriggerProps>;
  /** Placement of the tooltip */
  placement?: TooltipPlacement;
  /** Delay before showing (ms) */
  showDelay?: number;
  /** Delay before hiding (ms) */
  hideDelay?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Maximum width of tooltip */
  maxWidth?: number;
  /** Custom className for tooltip */
  className?: string;
}

/**
 * Tooltip
 * 
 * A lightweight tooltip component for displaying contextual information.
 * 
 * **Features:**
 * - Multiple placement options
 * - Configurable delay
 * - Auto-positioning within viewport
 * 
 * @example
 * ```tsx
 * <Tooltip content="This is a helpful tip" placement="top">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({
  content,
  children,
  placement = 'top',
  showDelay = 200,
  hideDelay = 0,
  disabled = false,
  maxWidth = 250,
  className,
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  // Calculate position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + gap;
        break;
    }

    // Keep within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    setPosition({ top, left });
  }, [placement]);

  // Show tooltip
  const handleShow = useCallback(() => {
    if (disabled) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    showTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, showDelay);
  }, [disabled, showDelay]);

  // Hide tooltip
  const handleHide = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  }, [hideDelay]);

  // Update position when visible
  useEffect(() => {
    if (isVisible) {
      updatePosition();
      // The first measure happens on the frame the tooltip mounts, while the
      // fade-in transform still scales it: that reads a smaller box and can
      // land a "top" tooltip over its own trigger. Measure again once the
      // browser has laid it out at full size.
      const raf = requestAnimationFrame(updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Clone child with event handlers
  const child = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      handleShow();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleHide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleShow();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleHide();
      children.props.onBlur?.(e);
    },
  });

  const tooltipClasses = [
    styles.tooltip,
    styles[placement],
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div ref={triggerRef} className={styles.trigger}>
        {child}
      </div>

      {isVisible && createPortal(
        <div
          ref={(node) => {
            tooltipRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          role="tooltip"
          className={tooltipClasses}
          style={{
            top: position.top,
            left: position.left,
            maxWidth,
          }}
        >
          {content}
          <div className={`${styles.arrow} ${styles[`arrow${placement.charAt(0).toUpperCase() + placement.slice(1)}`]}`} />
        </div>,
        // Rendered on the body, not in place: the tooltip is position: fixed,
        // and any ancestor carrying a transform, filter or will-change would
        // become its containing block and shift it off the trigger. Consumers
        // animate their layouts, so in-place rendering cannot be relied on.
        document.body,
      )}
    </>
  );
});

Tooltip.displayName = 'Tooltip';
export default Tooltip;
