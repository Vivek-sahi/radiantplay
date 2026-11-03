import React, { useState, useCallback } from 'react';
import { Icon, isValidIconName } from '../icons';
import type { IconName } from '../icons';
import { compVar, sysVar } from '../../tokens/colors';
import styles from './Chip.module.css';

export type ChipType = 'attribute' | 'measure' | 'filter' | 'skeleton';
export type ChipState = 'default' | 'hover' | 'pressed' | 'disabled';

export interface ChipProps {
  /** The type/variant of chip */
  type?: ChipType;
  /** The label text to display */
  label: string;
  /** For filter type: the filter value */
  filterValue?: string;
  /** Optional leading icon - can be an icon name or ReactNode */
  icon?: IconName | React.ReactNode;
  /** Whether to show the trailing chevron icon */
  showChevron?: boolean;
  /** Whether to show delete button on hover */
  deletable?: boolean;
  /** Whether the chip is disabled */
  disabled?: boolean;
  /** Click handler for the chip */
  onClick?: () => void;
  /** Handler when delete button is clicked */
  onDelete?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Maximum width of the chip */
  maxWidth?: number;
}

/** Color configuration for each chip type - using semantic tokens */
const chipColors = {
  attribute: {
    default: compVar('chip-attribute-default'),
    hover: compVar('chip-attribute-hover'),
    pressed: compVar('chip-attribute-pressed'),
    icon: compVar('chip-attribute-icon'),
    activeBorder: compVar('chip-attribute-active-border'),
  },
  measure: {
    default: compVar('chip-measure-default'),
    hover: compVar('chip-measure-hover'),
    pressed: compVar('chip-measure-pressed'),
    icon: compVar('chip-measure-icon'),
    activeBorder: compVar('chip-measure-active-border'),
  },
  filter: {
    default: compVar('chip-filter-default'),
    hover: compVar('chip-filter-hover'),
    pressed: compVar('chip-filter-pressed'),
    icon: compVar('chip-filter-icon'),
    activeBorder: compVar('chip-filter-active-border'),
  },
  skeleton: {
    default: 'transparent',
    hover: 'transparent',
    pressed: 'transparent',
  },
} as const;

/**
 * Chip Component
 * 
 * A pill-shaped component used for displaying attributes, measures, filters,
 * or placeholder skeleton states. Commonly used in data visualization contexts.
 * 
 * @example
 * ```tsx
 * <Chip type="attribute" label="Country" />
 * <Chip type="measure" label="Revenue" showChevron />
 * <Chip type="filter" label="Status" filterValue="Active" deletable />
 * <Chip type="skeleton" label="Drag a column" />
 * ```
 */
export const Chip: React.FC<ChipProps> = ({
  type = 'attribute',
  label,
  filterValue,
  icon,
  showChevron = true,
  deletable = false,
  disabled = false,
  onClick,
  onDelete,
  className,
  maxWidth = 320,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (!disabled) setIsPressed(true);
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onDelete) {
      onDelete();
    }
  }, [disabled, onDelete]);

  // Determine the current visual state
  const getBackgroundColor = () => {
    if (type === 'skeleton') return 'transparent';
    const colors = chipColors[type];
    if (isPressed) return colors.pressed;
    if (isHovered) return colors.hover;
    return colors.default;
  };

  const isSkeleton = type === 'skeleton';
  const showDeleteButton = deletable && isHovered && !disabled && !isSkeleton;

  // Render leading icon - supports both icon name strings and ReactNode
  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a string, use the Icon component with xs size for chips
    if (typeof icon === 'string' && isValidIconName(icon)) {
      return (
        <span className={styles.leadingIcon}>
          <Icon name={icon as IconName} size="xs" />
        </span>
      );
    }
    
    // Otherwise, render as ReactNode
    return <span className={styles.leadingIcon}>{icon}</span>;
  };

  // Build class names
  const chipClasses = [
    styles.chip,
    styles[type],
    disabled && styles.disabled,
    isSkeleton && styles.skeleton,
    className,
  ].filter(Boolean).join(' ');

  const bodyClasses = [
    styles.body,
    onClick && styles.clickable,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={chipClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={bodyClasses}
        style={{
          backgroundColor: getBackgroundColor(),
          maxWidth,
          cursor: onClick && !disabled ? 'pointer' : 'default',
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        aria-disabled={disabled}
      >
        {renderIcon()}
        
        {type === 'filter' && filterValue ? (
          <div className={styles.filterContent}>
            <span className={styles.filterLabel}>{label}</span>
            <span className={styles.filterValue}>{filterValue}</span>
          </div>
        ) : (
          <span className={styles.label}>{label}</span>
        )}
        
        {showChevron && !isSkeleton && (
          <Icon 
            name="chevron-right"
            size="s"
            color={sysVar('content-primary')}
            className={styles.chevron}
          />
        )}
      </div>

      {showDeleteButton && (
        <button
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          aria-label={`Remove ${label}`}
          type="button"
        >
          <Icon name="cross" size="xs" />
        </button>
      )}
    </div>
  );
};

export default Chip;

