import React, { useState } from 'react';
import { Checkbox } from '@components/Checkbox';
import styles from './ColumnTree.module.css';

interface DataSourceTable { name: string; columns: string[] }
interface ColumnGroup { table: string; columns: string[] }

export interface ColumnTreeData {
  tables: Array<{ name: string }>;
  dataSourceTables: DataSourceTable[];
  modelColumns: ColumnGroup[];
}

export interface ColumnTreeProps {
  data: ColumnTreeData;
  // Additive, opt-in — used by SearchDataOnDataModelexplorations's data-source-selector
  // Option 2, where `data.tables` lists every source table rather than just
  // ones already in the model. Both default to off, so existing consumers
  // (DataModelEditor, Option 1's Semantics pane) are unaffected.
  //
  // Which of `data.tables` are already part of the model — gives the table
  // chip the same "added" muted look columns already get. Omit to leave
  // every table chip in its current single style.
  addedTableNames?: Set<string>;
  // Makes each table row draggable (drag a whole table onto the canvas,
  // matching the legacy Tables pane's text/plain drag contract) and
  // auto-expands a table the moment its drag starts.
  draggableTables?: boolean;
  // Replaces column rows' drag-to-add behavior with a checkbox to the left
  // of the column name (columns can't be dragged onto the canvas, so drag
  // wasn't a usable affordance there). Checked = column is in the model.
  // Omit to keep the existing column drag-and-drop behavior.
  checkboxColumns?: boolean;
  onToggleColumn?: (tableName: string, colName: string, checked: boolean) => void;
}

const ColumnTree: React.FC<ColumnTreeProps> = ({ data, addedTableNames, draggableTables = false, checkboxColumns = false, onToggleColumn }) => {
  const { tables, dataSourceTables, modelColumns } = data;
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (name: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!tables.length) {
    return (
      <div className={styles.list}>
        <div className={styles.empty}>Add tables to your model to browse columns</div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {tables.map(t => {
        const ds = dataSourceTables.find(d => d.name.toLowerCase() === t.name.toLowerCase());
        const cols = ds ? ds.columns : [];
        const addedGroup = modelColumns.find(g => g.table === t.name);
        const addedCols = addedGroup ? addedGroup.columns : [];
        const isExpanded = expandedTables.has(t.name);
        const isTableAdded = addedTableNames?.has(t.name) ?? false;

        return (
          <React.Fragment key={t.name}>
            <div
              className={styles.tableRow}
              onClick={() => toggleTable(t.name)}
              draggable={draggableTables}
              onDragStart={!draggableTables ? undefined : (e) => {
                e.dataTransfer.setData('text/plain', t.name);
                e.dataTransfer.effectAllowed = 'copy';
                setExpandedTables(prev => new Set(prev).add(t.name));
                (e.currentTarget as HTMLElement).classList.add(styles.tableDragging);
              }}
              onDragEnd={!draggableTables ? undefined : (e) => {
                (e.currentTarget as HTMLElement).classList.remove(styles.tableDragging);
              }}
            >
              <div className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
                <img src="/spotter-assets/chevron right.svg" width="10" height="10" alt="" />
              </div>
              <div className={`${styles.tableChip} ${isTableAdded ? styles.tableChipAdded : ''}`}>
                <div className={styles.dragHandle}>
                  <img src="/spotter-assets/3 dot vertical.svg" alt="" />
                </div>
                <span className={styles.tableName}>{t.name}</span>
              </div>
            </div>
            {isExpanded && (
              <div className={styles.colList}>
                {cols.map(c => {
                  const isAdded = addedCols.includes(c);
                  return checkboxColumns ? (
                    <div
                      key={c}
                      className={`${styles.colItem} ${isAdded ? styles.colAdded : styles.colCheckable}`}
                    >
                      <Checkbox
                        checked={isAdded}
                        onChange={checked => onToggleColumn?.(t.name, c, checked)}
                        showLabel={false}
                      />
                      <span className={styles.colName}>{c}</span>
                    </div>
                  ) : (
                    <div
                      key={c}
                      className={`${styles.colItem} ${isAdded ? styles.colAdded : styles.colDraggable}`}
                      draggable={!isAdded}
                      onDragStart={isAdded ? undefined : (e) => {
                        e.dataTransfer.setData(
                          'application/x-spotter-column',
                          JSON.stringify({ tableName: t.name, colName: c })
                        );
                        e.dataTransfer.effectAllowed = 'copy';
                        (e.currentTarget as HTMLElement).classList.add(styles.colDragging);
                      }}
                      onDragEnd={(e) => {
                        (e.currentTarget as HTMLElement).classList.remove(styles.colDragging);
                      }}
                    >
                      <div className={styles.colDragHandle}>
                        <img src="/spotter-assets/3 dot vertical.svg" alt="" />
                      </div>
                      <span className={styles.colName}>{c}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ColumnTree;
