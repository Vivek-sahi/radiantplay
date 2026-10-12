import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '../icons';
import styles from './Accordion.module.css';

export type AccordionVariant = 'default' | 'minimal' | 'bordered' | 'card';

export interface AccordionItemProps {
  /**
   * Item title
   */
  title: React.ReactNode;
  /**
   * Optional subtitle
   */
  subtitle?: string;
  /**
   * Item content
   */
  children: React.ReactNode;
  /**
   * Whether the item is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Leading icon or element
   */
  icon?: React.ReactNode;
  /**
   * Additional class name
   */
  className?: string;
  // Internal props (managed by Accordion)
  /** @internal */
  isExpanded?: boolean;
  /** @internal */
  onToggle?: () => void;
  /** @internal */
  variant?: AccordionVariant;
}

/**
 * Chevron icon component
 */
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Accordion Item Component
 */
const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  subtitle,
  children,
  disabled = false,
  icon,
  className = '',
  isExpanded = false,
  onToggle,
  variant,
}) => {
  const isCard = variant === 'card';
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, children]);

  const handleClick = () => {
    if (!disabled && onToggle) {
      onToggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div className={`${styles.item} ${className}`}>
      <button
        type="button"
        className={`${styles.header} ${disabled ? styles.headerDisabled : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-disabled={disabled}
        disabled={disabled}
      >
        {isCard && (
          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            size="l"
            className={styles.cardChevron}
          />
        )}
        <div className={styles.headerContent}>
          {icon}
          <div>
            <div className={styles.headerTitle}>{title}</div>
            {subtitle && <div className={styles.headerSubtitle}>{subtitle}</div>}
          </div>
        </div>
        {!isCard && <ChevronIcon expanded={isExpanded} />}
      </button>
      <div 
        className={styles.content}
        style={{ height }}
        aria-hidden={!isExpanded}
      >
        <div ref={contentRef} className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
};

export interface AccordionProps {
  /**
   * Accordion items
   */
  children: React.ReactElement<AccordionItemProps> | React.ReactElement<AccordionItemProps>[];
  /**
   * Allow multiple items to be expanded
   * @default false
   */
  allowMultiple?: boolean;
  /**
   * Index of initially expanded item (or items if allowMultiple)
   */
  defaultExpanded?: number | number[];
  /**
   * Controlled expanded state
   */
  expanded?: number | number[];
  /**
   * Callback when expanded state changes
   */
  onExpandedChange?: (expanded: number[]) => void;
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: AccordionVariant;
  /**
   * Remove default padding
   * @default false
   */
  noPadding?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

type AccordionComponent = React.FC<AccordionProps> & {
  Item: typeof AccordionItem;
};

/**
 * Accordion Component
 * 
 * A collapsible content component for showing/hiding sections.
 * 
 * **Variants:**
 * - `default` - Standard accordion with dividers
 * - `minimal` - No dividers, compact spacing
 * - `bordered` - Each item has a border and rounded corners
 * - `card` - Figma card: each item is a raised card with a leading chevron
 * 
 * @example
 * ```tsx
 * // Basic accordion
 * <Accordion>
 *   <Accordion.Item title="Section 1">
 *     Content for section 1
 *   </Accordion.Item>
 *   <Accordion.Item title="Section 2">
 *     Content for section 2
 *   </Accordion.Item>
 * </Accordion>
 * 
 * // Allow multiple expanded
 * <Accordion allowMultiple defaultExpanded={[0, 1]}>
 *   <Accordion.Item title="FAQ 1">Answer 1</Accordion.Item>
 *   <Accordion.Item title="FAQ 2">Answer 2</Accordion.Item>
 * </Accordion>
 * ```
 */
const AccordionBase: React.FC<AccordionProps> = ({
  children,
  allowMultiple = false,
  defaultExpanded,
  expanded: controlledExpanded,
  onExpandedChange,
  variant = 'default',
  noPadding = false,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState<Set<number>>(() => {
    if (defaultExpanded !== undefined) {
      return new Set(Array.isArray(defaultExpanded) ? defaultExpanded : [defaultExpanded]);
    }
    return new Set();
  });

  const isControlled = controlledExpanded !== undefined;
  const expandedSet = isControlled 
    ? new Set(Array.isArray(controlledExpanded) ? controlledExpanded : [controlledExpanded])
    : internalExpanded;

  const handleToggle = useCallback((index: number) => {
    const newExpanded = new Set(expandedSet);

    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      if (!allowMultiple) {
        newExpanded.clear();
      }
      newExpanded.add(index);
    }

    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }
    onExpandedChange?.(Array.from(newExpanded));
  }, [expandedSet, allowMultiple, isControlled, onExpandedChange]);

  const variantClass = variant !== 'default' ? styles[variant] : '';
  const classes = [
    styles.accordion,
    variantClass,
    noPadding && styles.noPadding,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isExpanded: expandedSet.has(index),
            onToggle: () => handleToggle(index),
            ...(variant === 'card' ? { variant } : {}),
          } as Partial<AccordionItemProps>);
        }
        return child;
      })}
    </div>
  );
};

export const Accordion = AccordionBase as AccordionComponent;
Accordion.Item = AccordionItem;

export default Accordion;
