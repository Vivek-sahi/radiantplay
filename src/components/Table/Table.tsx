import React, { forwardRef, useState, useMemo, ReactNode } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { Avatar, AvatarSize } from '../Avatar';
import { Chip } from '../Chip';
import type { ChipType } from '../Chip';
import { Checkbox } from '../Checkbox';
import { Token } from '../Token';
import type { TokenType } from '../Token';
import { Button } from '../Button';
import type { ButtonVariant } from '../Button';
import { useRadiantLook } from '../../context/RadiantLookContext';
import styles from './Table.module.css';

/**
 * Table Column Definition
 */
export interface TableColumn<T = Record<string, unknown>> {
  /** Unique column key */
  key: string;
  /** Column header label */
  label: string;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum width */
  minWidth?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function */
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

/**
 * Table Props
 */
export interface TableProps<T = Record<string, unknown>> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Table data rows */
  data: T[];
  /** Key extractor for row */
  rowKey?: string | ((row: T, index: number) => string);
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Whether rows are selectable */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: string[]) => void;
  /** Callback when row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Whether to show hover state on rows */
  hoverable?: boolean;
  /** Whether table has borders */
  bordered?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Compact size */
  compact?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
}

/**
 * Table
 * 
 * A flexible data table component for displaying tabular data.
 * 
 * **Features:**
 * - Column definitions with custom renderers
 * - Sortable columns
 * - Row selection
 * - Loading and empty states
 * - Hover and striped styles
 * 
 * @example
 * ```tsx
 * <Table
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     { key: 'email', label: 'Email' },
 *     { key: 'status', label: 'Status', render: (val) => <Chip label={val} /> },
 *   ]}
 *   data={users}
 *   rowKey="id"
 *   hoverable
 * />
 * ```
 */
export const Table = forwardRef<HTMLDivElement, TableProps>(({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  onRowClick,
  hoverable = true,
  bordered = false,
  striped = false,
  compact = false,
  stickyHeader = false,
  className,
  ...props
}, ref) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Get row key
  const getRowKey = (row: Record<string, unknown>, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return String(row[rowKey] ?? index);
  };

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortConfig.key];
      const bVal = (b as Record<string, unknown>)[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Handle row selection
  const handleSelectAll = () => {
    if (selectedKeys.length === data.length) {
      onSelectionChange?.([]);
    } else {
      const allKeys = data.map((row, index) => 
        getRowKey(row as Record<string, unknown>, index)
      );
      onSelectionChange?.(allKeys);
    }
  };

  const handleSelectRow = (key: string) => {
    if (selectedKeys.includes(key)) {
      onSelectionChange?.(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange?.([...selectedKeys, key]);
    }
  };

  // Build class names
  const containerClasses = [
    styles.container,
    bordered && styles.bordered,
    className,
  ].filter(Boolean).join(' ');

  const tableClasses = [
    styles.table,
    compact && styles.compact,
    striped && styles.striped,
    stickyHeader && styles.stickyHeader,
  ].filter(Boolean).join(' ');

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  // Radiant 3.0 (Figma Object table 17165:22524) uses Radiant checkboxes
  const radiantCheckboxes = useRadiantLook() === 'radiant-3';

  return (
    <div ref={ref} className={containerClasses} {...props}>
      <table className={tableClasses}>
        <thead className={styles.thead}>
          <tr>
            {selectable && (
              <th className={styles.th} style={{ width: '48px' }}>
                {radiantCheckboxes ? (
                  <Checkbox
                    label="Select all rows"
                    showLabel={false}
                    checked={isAllSelected}
                    indeterminate={selectedKeys.length > 0 && !isAllSelected}
                    onChange={handleSelectAll}
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className={styles.checkbox}
                  />
                )}
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.key}
                className={`${styles.th} ${column.sortable ? styles.sortable : ''}`}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  textAlign: column.align || 'left',
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={styles.thContent}>
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className={styles.sortIcon}>
                      {sortConfig?.key === column.key ? (
                        <Icon
                          name={sortConfig.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                          size="xs"
                        />
                      ) : (
                        <Icon name="sort" size="xs" className={styles.sortIconInactive} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className={styles.tbody}>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={styles.loadingCell}
              >
                <div className={styles.loadingContent}>
                  <Icon name="sync" size="l" className={styles.loadingSpinner} />
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className={styles.emptyCell}
              >
                <div className={styles.emptyContent}>
                  <Icon name="folder" size="l" className={styles.emptyIcon} />
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => {
              const key = getRowKey(row as Record<string, unknown>, rowIndex);
              const isSelected = selectedKeys.includes(key);

              const rowClasses = [
                styles.tr,
                hoverable && styles.hoverable,
                isSelected && styles.selected,
                onRowClick && styles.clickable,
              ].filter(Boolean).join(' ');

              return (
                <tr
                  key={key}
                  className={rowClasses}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {selectable && (
                    <td className={styles.td} onClick={radiantCheckboxes ? (e) => e.stopPropagation() : undefined}>
                      {radiantCheckboxes ? (
                        <Checkbox
                          label="Select row"
                          showLabel={false}
                          checked={isSelected}
                          onChange={() => handleSelectRow(key)}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(key);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.checkbox}
                        />
                      )}
                    </td>
                  )}
                  {columns.map(column => {
                    const value = (row as Record<string, unknown>)[column.key];
                    const content = column.render
                      ? column.render(value, row, rowIndex)
                      : String(value ?? '');

                    return (
                      <td
                        key={column.key}
                        className={styles.td}
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

Table.displayName = 'Table';

/**
 * Cell Renderer Utilities
 * 
 * Helper functions for common cell types in tables.
 */
export const TableCellRenderers = {
  /**
   * Render a cell with an avatar and optional text
   */
  avatar: (options: {
    nameKey?: string;
    srcKey?: string;
    size?: AvatarSize;
    showName?: boolean;
  } = {}) => {
    const { nameKey = 'name', srcKey = 'avatar', size = 's', showName = true } = options;
    return (value: unknown, row: Record<string, unknown>): ReactNode => {
      const name = String(row[nameKey] ?? value ?? '');
      const src = row[srcKey] as string | undefined;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar name={name} src={src} size={size} />
          {showName && <span>{name}</span>}
        </div>
      );
    };
  },

  /**
   * Render a cell with a single chip/tag
   */
  chip: (options: {
    variantMap?: Record<string, ChipType>;
    defaultVariant?: ChipType;
  } = {}) => {
    const { variantMap = {}, defaultVariant = 'attribute' } = options;
    return (value: unknown): ReactNode => {
      const label = String(value ?? '');
      const variant = variantMap[label] || defaultVariant;
      return <Chip label={label} type={variant}  />;
    };
  },

  /**
   * Render a cell with multiple chips/tags
   */
  chips: (options: {
    variantMap?: Record<string, ChipType>;
    defaultVariant?: ChipType;
    max?: number;
  } = {}) => {
    const { variantMap = {}, defaultVariant = 'attribute', max = 3 } = options;
    return (value: unknown): ReactNode => {
      if (!Array.isArray(value)) return null;
      const items = value.slice(0, max);
      const overflow = value.length - max;
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {items.map((item, i) => {
            const label = String(item);
            const variant = variantMap[label] || defaultVariant;
            return <Chip key={i} label={label} type={variant}  />;
          })}
          {overflow > 0 && <Chip label={`+${overflow}`} type="attribute"  />}
        </div>
      );
    };
  },

  /**
   * Render a cell with a status indicator
   */
  status: (statusConfig: Record<string, { label: string; type: ChipType }>) => {
    return (value: unknown): ReactNode => {
      const key = String(value ?? '');
      const config = statusConfig[key];
      if (!config) return key;
      return <Chip label={config.label} type={config.type}  />;
    };
  },

  /**
   * Render a cell with formatted date
   */
  date: (options: {
    format?: 'short' | 'medium' | 'long';
    locale?: string;
  } = {}) => {
    const { format = 'medium', locale = 'en-US' } = options;
    const formatOptions: Intl.DateTimeFormatOptions = ({
      short: { month: 'numeric' as const, day: 'numeric' as const, year: '2-digit' as const },
      medium: { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const },
      long: { month: 'long' as const, day: 'numeric' as const, year: 'numeric' as const },
    } as const)[format];
    
    return (value: unknown): ReactNode => {
      if (!value) return '';
      const date = value instanceof Date ? value : new Date(String(value));
      if (isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString(locale, formatOptions);
    };
  },

  /**
   * Render a cell with formatted number/currency
   */
  number: (options: {
    style?: 'decimal' | 'currency' | 'percent';
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}) => {
    const { 
      style = 'decimal', 
      currency = 'USD', 
      locale = 'en-US',
      minimumFractionDigits,
      maximumFractionDigits,
    } = options;
    
    return (value: unknown): ReactNode => {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return num.toLocaleString(locale, { 
        style, 
        currency: style === 'currency' ? currency : undefined,
        minimumFractionDigits,
        maximumFractionDigits,
      });
    };
  },

  /**
   * Render a Figma title cell: the value as a brand link-style title, with an
   * optional icon, a description line and an error line from other row keys
   */
  title: (options: {
    descriptionKey?: string;
    errorKey?: string;
    icon?: IconName;
  } = {}) => {
    const { descriptionKey, errorKey, icon } = options;
    return (value: unknown, row: Record<string, unknown>): ReactNode => {
      const description = descriptionKey ? row[descriptionKey] : undefined;
      const error = errorKey ? row[errorKey] : undefined;
      return (
        <div className={styles.titleCell}>
          {icon && <Icon name={icon} size="m" className={styles.titleIcon} />}
          <div className={styles.titleText}>
            <span className={styles.titleName}>{String(value ?? '')}</span>
            {description ? <span className={styles.titleDescription}>{String(description)}</span> : null}
            {error ? (
              <span className={styles.titleError}>
                <Icon name="exclamation-point-circle" size="xs" aria-hidden />
                {String(error)}
              </span>
            ) : null}
          </div>
        </div>
      );
    };
  },

  /**
   * Render a cell with read-only tokens, for column names, formulas and the like
   */
  tokens: (options: {
    type?: TokenType;
    max?: number;
  } = {}) => {
    const { type = 'attribute', max = 3 } = options;
    return (value: unknown): ReactNode => {
      if (!Array.isArray(value)) return null;
      const overflow = value.length - max;
      return (
        <div className={styles.tokensCell}>
          {value.slice(0, max).map((item, i) => (
            <Token key={i} label={String(item)} type={type} />
          ))}
          {overflow > 0 && <span className={styles.tokensOverflow}>+{overflow}</span>}
        </div>
      );
    };
  },

  /**
   * Render a cell with a button. The click doesn't select or open the row
   */
  button: (options: {
    label: string;
    onClick: (row: Record<string, unknown>) => void;
    variant?: ButtonVariant;
  }) => {
    const { label, onClick, variant = 'secondary' } = options;
    return (_value: unknown, row: Record<string, unknown>): ReactNode => (
      <Button
        variant={variant}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onClick(row);
        }}
      >
        {label}
      </Button>
    );
  },

  /**
   * Render a cell with a round icon button. label is its accessible name
   */
  iconButton: (options: {
    icon: IconName;
    label: string;
    onClick: (row: Record<string, unknown>) => void;
  }) => {
    const { icon, label, onClick } = options;
    return (_value: unknown, row: Record<string, unknown>): ReactNode => (
      <Button
        variant="tertiary"
        iconOnly
        icon={icon}
        onClick={(e) => {
          e.stopPropagation();
          onClick(row);
        }}
      >
        {label}
      </Button>
    );
  },

  /**
   * Render a cell with a boolean indicator
   */
  boolean: (options: {
    trueLabel?: string;
    falseLabel?: string;
    trueVariant?: ChipType;
    falseVariant?: ChipType;
  } = {}) => {
    const { 
      trueLabel = 'Yes', 
      falseLabel = 'No',
      trueVariant = 'attribute',
      falseVariant = 'filter',
    } = options;
    
    return (value: unknown): ReactNode => {
      const isTrue = Boolean(value);
      return (
        <Chip 
          label={isTrue ? trueLabel : falseLabel} 
          type={isTrue ? trueVariant : falseVariant} 
           
        />
      );
    };
  },
};

export default Table;
