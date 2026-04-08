import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import styles from './Popover.module.css';

/**
 * Popover Placement
 */
export type PopoverPlacement = 
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

/**
 * Popover Trigger Type
 */
export type PopoverTrigger = 'click' | 'hover';

/**
 * Popover Props
 */
interface TriggerProps {
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

export interface PopoverProps {
  /** Popover content */
  content: React.ReactNode;
  /** Element that triggers the popover */
  children: React.ReactElement<TriggerProps>;
  /** Placement of the popover */
  placement?: PopoverPlacement;
  /** How to trigger the popover */
  trigger?: PopoverTrigger;
  /** Controlled open state */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Whether to close on click outside */
  closeOnClickOutside?: boolean;
  /** Whether to close on escape key */
  closeOnEscape?: boolean;
  /** Offset from trigger element (px) */
  offset?: number;
  /** Whether popover is disabled */
  disabled?: boolean;
  /** Custom className for popover */
  className?: string;
}

/**
 * Popover
 * 
 * An interactive overlay component for displaying content in a floating container.
 * 
 * **Features:**
 * - Click or hover trigger
 * - Multiple placement options
 * - Controlled and uncontrolled modes
 * - Click outside and escape to close
 * 
 * @example
 * ```tsx
 * <Popover
 *   content={
 *     <div>
 *       <Button variant="tertiary">Edit</Button>
 *       <Button variant="tertiary">Delete</Button>
 *     </div>
 *   }
 *   placement="bottom-end"
 * >
 *   <Button icon="more" iconPosition="leading" />
 * </Popover>
 * ```
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(({
  content,
  children,
  placement = 'bottom',
  trigger = 'click',
  isOpen: controlledIsOpen,
  onOpenChange,
  closeOnClickOutside = true,
  closeOnEscape = true,
  offset = 8,
  disabled = false,
  className,
}, ref) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  // Update open state
  const setIsOpen = useCallback((value: boolean) => {
    if (disabled && value) return;
    
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setUncontrolledIsOpen(value);
      onOpenChange?.(value);
    }
  }, [disabled, isControlled, onOpenChange]);

  // Calculate position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const gap = offset;

    let top = 0;
    let left = 0;

    // Primary axis (top/bottom/left/right)
    const primaryPlacement = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
    const alignment = placement.split('-')[1] as 'start' | 'end' | undefined;

    switch (primaryPlacement) {
      case 'top':
        top = triggerRect.top - popoverRect.height - gap;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        break;
      case 'left':
        left = triggerRect.left - popoverRect.width - gap;
        break;
      case 'right':
        left = triggerRect.right + gap;
        break;
    }

    // Alignment
    if (primaryPlacement === 'top' || primaryPlacement === 'bottom') {
      switch (alignment) {
        case 'start':
          left = triggerRect.left;
          break;
        case 'end':
          left = triggerRect.right - popoverRect.width;
          break;
        default:
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
      }
    } else {
      switch (alignment) {
        case 'start':
          top = triggerRect.top;
          break;
        case 'end':
          top = triggerRect.bottom - popoverRect.height;
          break;
        default:
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
      }
    }

    // Keep within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding));

    setPosition({ top, left });
  }, [placement, offset]);

  // Handle click trigger
  const handleClick = useCallback(() => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  }, [trigger, isOpen, setIsOpen]);

  // Handle hover trigger
  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover') {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsOpen(true);
    }
  }, [trigger, setIsOpen]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover') {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  }, [trigger, setIsOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside, setIsOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, setIsOpen]);

  // Update position when visible
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Clone child with event handlers
  const child = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      handleClick();
      children.props.onClick?.(e);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      children.props.onMouseLeave?.(e);
    },
  });

  const popoverClasses = [
    styles.popover,
    className,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div ref={triggerRef} className={styles.trigger}>
        {child}
      </div>

      {isOpen && (
        <div
          ref={(node) => {
            popoverRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={popoverClasses}
          style={{
            top: position.top,
            left: position.left,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>
      )}
    </>
  );
});

Popover.displayName = 'Popover';
export default Popover;
