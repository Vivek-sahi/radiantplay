import React, { useEffect, useRef } from 'react';
import { Checkbox } from '@components/Checkbox';
import { rdComponentColors } from '@tokens/colors';
import type { ColumnTreeData } from '../../_datamodel/index';
import { isNumericColumn } from './previewMockData';
import styles from './TablePickerV2.module.css';
// The preview panel's own chip class, reused verbatim so a column reads the
// same in both places. Only the chip is borrowed — PanelToken there also opens
// an "Add as filter / Change aggregate / Remove" menu, which has no meaning in
// this picker.
import sheetStyles from '../SearchDataExplorations.module.css';

/**
 * Left-pane table/column picker — selector Option 2.
 *
 * Deliberately a prototype-local component rather than a variant of the shared
 * _datamodel/ColumnTree: Option 1 is that component, and building Option 2
 * separately means Option 1 cannot change.
 *
 * Row shape: [chevron] [plain-text name] … [+ | −]
 *  - the chevron on the left expands/collapses, and works on any table —
 *    expanding is just looking, it doesn't add anything
 *  - only one table is expanded at a time
 *  - "+" adds the table to the canvas; once added it becomes "−", which
 *    removes it again
 *  - dragging a row onto the canvas also adds it (same text/plain contract
 *    Option 1 uses)
 *  - adding by either route auto-expands that table
 *  - the expanded list starts with a "Select all" row, then the columns
 */
export interface TablePickerV2Props {
  data: ColumnTreeData;
  /** Which tables are already on the canvas. */
  addedTableNames: Set<string>;
  onToggleColumn: (tableName: string, colName: string, checked: boolean) => void;
  onAddTable: (tableName: string) => void;
  /**
   * Which table is expanded. Controlled by the parent so the canvas cards'
   * "Add columns" link can open one from outside this component.
   */
  openTable: string | null;
  onOpenTableChange: (tableName: string | null) => void;
  /**
   * Additive, opt-in — Tables-section Option 3's "Available" tab only
   * (2026-09-22). Komal: "the columns shouldn't have column level checkboxes
   * and no selection will happen here" — expanding a table is preview-only,
   * no Select all, no per-column checkbox, just the chip. Omit to keep
   * Option 2's own interactive columns exactly as they were.
   */
  readOnlyColumns?: boolean;
}

// Same measure/attribute fills the preview panel's chips use.
const CHIP_BG = {
  measure:   rdComponentColors.light['chip-measure-default'],
  attribute: rdComponentColors.light['chip-attribute-default'],
} as const;

// Exported so Tables-section Option 2's populated nav list (2026-09-22,
// Komal: "for the columns, use the same UI as option 1") can render the
// identical column chip instead of reimplementing it.
export const ColumnChip: React.FC<{ label: string }> = ({ label }) => (
  <span
    className={sheetStyles.dataToken}
    style={{ backgroundColor: CHIP_BG[isNumericColumn(label) ? 'measure' : 'attribute'], cursor: 'default' }}
  >
    {label}
  </span>
);

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={open ? styles.chevronOpen : undefined}
    width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
  >
    <path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Plus: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 1.5v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M1.5 6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const TablePickerV2: React.FC<TablePickerV2Props> = ({
  data,
  addedTableNames,
  onToggleColumn,
  onAddTable,
  openTable,
  onOpenTableChange,
  readOnlyColumns = false,
}) => {
  const { tables, dataSourceTables, modelColumns } = data;

  // Auto-expand whatever was just added, whichever way it was added. Watching
  // addedTableNames covers the drag route too, which lands in init-dme.js's
  // drop handler and never passes through this component.
  const prevAdded = useRef(addedTableNames);
  useEffect(() => {
    const added = [...addedTableNames].filter(n => !prevAdded.current.has(n));
    if (added.length) onOpenTableChange(added[added.length - 1]);
    prevAdded.current = addedTableNames;
  }, [addedTableNames]);

  if (!tables.length) {
    return (
      <div className={styles.list}>
        <div className={styles.empty}>Add tables to your model to browse columns</div>
      </div>
    );
  }

  const columnsOf = (name: string) =>
    dataSourceTables.find(d => d.name.toLowerCase() === name.toLowerCase())?.columns ?? [];
  const addedColumnsOf = (name: string) =>
    modelColumns.find(g => g.table === name)?.columns ?? [];

  return (
    <div className={styles.list}>
      {tables.map(t => {
        const cols = columnsOf(t.name);
        const added = addedColumnsOf(t.name);
        const onCanvas = addedTableNames.has(t.name);
        const isOpen = openTable === t.name;
        const allChecked = cols.length > 0 && added.length === cols.length;
        const someChecked = added.length > 0 && !allChecked;

        // A column can't be in the model without its table, so ticking one on a
        // table that isn't on the canvas adds the table first.
        const toggleColumn = (col: string, checked: boolean) => {
          if (checked && !onCanvas) onAddTable(t.name);
          onToggleColumn(t.name, col, checked);
        };

        const selectAll = (checked: boolean) => {
          if (checked && !onCanvas) onAddTable(t.name);
          cols.forEach(c => {
            const isIn = added.includes(c);
            if (checked && !isIn) onToggleColumn(t.name, c, true);
            if (!checked && isIn) onToggleColumn(t.name, c, false);
          });
        };

        return (
          <React.Fragment key={t.name}>
            <div
              className={styles.tableRow}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', t.name);
                e.dataTransfer.effectAllowed = 'copy';
                (e.currentTarget as HTMLElement).classList.add(styles.dragging);
              }}
              onDragEnd={e => (e.currentTarget as HTMLElement).classList.remove(styles.dragging)}
            >
              <button
                type="button"
                className={styles.chevron}
                onClick={() => onOpenTableChange(isOpen ? null : t.name)}
                aria-expanded={isOpen}
                aria-label={isOpen ? `Collapse ${t.name}` : `Expand ${t.name}`}
              >
                <Chevron open={isOpen} />
              </button>
              <span className={styles.tableName}>{t.name}</span>
              {/* A table already on the canvas carries no control here — it is
                  removed from that card's own menu instead. */}
              {!onCanvas && (
                <button
                  type="button"
                  className={styles.add}
                  onClick={() => onAddTable(t.name)}
                  aria-label={`Add ${t.name} to the model`}
                >
                  <Plus />
                </button>
              )}
            </div>

            {isOpen && (
              <div className={styles.colList}>
                {!readOnlyColumns && (
                  <div className={styles.selectAllRow}>
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={selectAll}
                      showLabel={false}
                    />
                    <span className={styles.selectAllLabel}>Select all</span>
                  </div>
                )}
                {cols.map(c => (
                  <div key={c} className={styles.colItem}>
                    {!readOnlyColumns && (
                      <Checkbox
                        checked={added.includes(c)}
                        onChange={checked => toggleColumn(c, checked)}
                        showLabel={false}
                      />
                    )}
                    <ColumnChip label={c} />
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TablePickerV2;
