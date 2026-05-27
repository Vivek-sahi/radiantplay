import React, { useState } from 'react';
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
}

const ColumnTree: React.FC<ColumnTreeProps> = ({ data }) => {
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

        return (
          <React.Fragment key={t.name}>
            <div className={styles.tableRow} onClick={() => toggleTable(t.name)}>
              <div className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
                <img src="/spotter-assets/chevron right.svg" width="10" height="10" alt="" />
              </div>
              <div className={styles.tableChip}>
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
                  return (
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
