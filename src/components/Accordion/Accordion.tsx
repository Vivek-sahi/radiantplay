import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '../icons';
import styles from './Accordion.module.css';

export type AccordionVariant = 'default' | 'minimal' | 'bordered' | 'card' | 'list';

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
  // The list variant also leads with its chevron, like the card
  const leadingChevron = isCard || variant === 'list';
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setHeight(isExpanded ? el.scrollHeight : 0);
    if (!isExpanded || typeof ResizeObserver === 'undefined') return;
    // Follow the content while open, so a nested accordion can grow and shrink
    const observer = new ResizeObserver(() => setHeight(el.scrollHeight));
    observer.observe(el);
    return () => observer.disconnect();
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
        {leadingChevron && (
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
        {!leadingChevron && <ChevronIcon expanded={isExpanded} />}
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

export interface AccordionListItemProps {
  /** Item text */
  label: React.ReactNode;
  /** Selected (single select) or checked (multi select) */
  selected?: boolean;
  /**
   * single: the selected row uses Ghost Highlight with brand text.
   * multi: a checkmark shows on checked rows.
   * @default 'single'
   */
  selectMode?: 'single' | 'multi';
  /** Leading icon */
  icon?: React.ReactNode;
  /** Buttons shown while the row is hovered or focused, like two Ghost icon buttons */
  actions?: React.ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Called when the row is clicked or chosen with Enter or Space */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * A 32px selectable row inside an `Accordion variant="list"` item (Figma
 * Accordion basic, 84:12 to 84:210)
 */
const AccordionListItem: React.FC<AccordionListItemProps> = ({
  label,
  selected = false,
  selectMode = 'single',
  icon,
  actions,
  disabled = false,
  onClick,
  className = '',
}) => {
  const classes = [
    styles.listItem,
    selected && selectMode === 'single' && styles.listItemSelected,
    disabled && styles.listItemDisabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      role={selectMode === 'multi' ? 'menuitemcheckbox' : 'option'}
      aria-selected={selectMode === 'single' ? selected : undefined}
      aria-checked={selectMode === 'multi' ? selected : undefined}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={classes}
      onClick={() => !disabled && onClick?.()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && e.target === e.currentTarget) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {icon && <span className={styles.listItemIcon}>{icon}</span>}
      <span className={styles.listItemLabel}>{label}</span>
      {actions && (
        <span className={styles.listItemActions} onClick={(e) => e.stopPropagation()}>
          {actions}
        </span>
      )}
      {selectMode === 'multi' && selected && (
        <Icon name="checkmark" size="s" className={styles.listItemCheck} />
      )}
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
  ListItem: typeof AccordionListItem;
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
 * - `list` - Figma Accordion basic: 48px parent rows with a leading chevron. Nest a
 *   second `list` inside an item for 32px child rows, and use `Accordion.ListItem`
 *   for selectable 32px items
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
            ...(variant === 'card' || variant === 'list' ? { variant } : {}),
          } as Partial<AccordionItemProps>);
        }
        return child;
      })}
    </div>
  );
};

export const Accordion = AccordionBase as AccordionComponent;
Accordion.Item = AccordionItem;
Accordion.ListItem = AccordionListItem;

export default Accordion;
