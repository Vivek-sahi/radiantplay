import React, { useState } from 'react';
import styles from './SuggestionCard.module.css';
import { ConfidenceBadge } from './ConfidenceBadge';
import { JoinDiagram } from './JoinDiagram';

export interface TableSuggestion   { id: string; name: string; desc: string; pct: number; checked: boolean }
export interface JoinSuggestion    { id: string; name: string; desc: string; leftTable: string; leftCol: string; cardinality: string; rightTable: string; rightCol: string; checked: boolean }
export interface ColumnGroup       { table: string; columns: string[] }
export interface FormulaSuggestion { id: string; name: string; code: string }

export type SuggType = 'tables' | 'joins' | 'columns' | 'formulas';

interface SuggestionCardProps {
  suggType: SuggType;
  tables?: TableSuggestion[];
  joins?: JoinSuggestion[];
  columnGroups?: ColumnGroup[];
  formulas?: FormulaSuggestion[];
  isAdding?: boolean;
  isReadOnly?: boolean;
  onAdd: (suggType: SuggType, checkedItems: unknown[]) => void;
  onRefine?: (suggType: SuggType) => void;
}

const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className={styles.checkIcon}>
    <path d="M1 3.5L3.5 7L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefineIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={styles.refineIcon}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12.4308 6.6111H14L11.6667 8.94443L9.33333 6.6111H10.8698C10.7734 5.63222 10.3169 4.76117 9.63457 4.13188C8.94614 3.49693 8.03113 3.1111 7.02539 3.1111C6.01965 3.1111 5.10463 3.49693 4.4162 4.13188L3.36157 2.98842C4.32517 2.09968 5.61263 1.55554 7.02539 1.55554C8.43814 1.55554 9.7256 2.09968 10.6892 2.98842C11.6788 3.90111 12.3302 5.1804 12.4308 6.6111ZM2.33333 4.66665L0 6.99999H1.59746C1.75663 8.4673 2.36106 9.78852 3.26838 10.7648C4.22184 11.7908 5.52186 12.4444 6.97461 12.4444C8.42737 12.4444 9.72738 11.7908 10.6808 10.7648L9.54138 9.70588C8.84281 10.4576 7.94035 10.8889 6.97461 10.8889C6.00887 10.8889 5.10641 10.4576 4.40784 9.70588C3.77184 9.02152 3.315 8.07889 3.16466 6.99999H4.66667L2.33333 4.66665Z" fill="currentColor"/>
  </svg>
);

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggType, tables = [], joins = [], columnGroups = [], formulas = [],
  isAdding, isReadOnly, onAdd,
}) => {
  const [tableChecked, setTableChecked] = useState<Set<string>>(
    () => new Set(tables.filter(t => t.checked).map(t => t.id))
  );
  const [joinChecked, setJoinChecked] = useState<Set<string>>(
    () => new Set(joins.filter(j => j.checked).map(j => j.id))
  );

  const handleAdd = () => {
    if (suggType === 'tables') {
      onAdd('tables', tables.filter(t => tableChecked.has(t.id)));
    } else if (suggType === 'joins') {
      onAdd('joins', joins.filter(j => joinChecked.has(j.id)));
    } else if (suggType === 'columns') {
      onAdd('columns', columnGroups);
    } else if (suggType === 'formulas') {
      onAdd('formulas', formulas);
    }
  };

  const addLabel = suggType === 'formulas' ? 'Add all to model' : 'Add to model';

  return (
    <>
      <div className={styles.card}>
        {suggType === 'tables' && (
          <div className={`${styles.list} ${isReadOnly ? styles.readOnly : ''}`}>
            {tables.map(t => (
              <div
                key={t.id}
                className={styles.row}
                onClick={() => {
                  if (isReadOnly) return;
                  setTableChecked(prev => {
                    const next = new Set(prev);
                    next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                    return next;
                  });
                }}
              >
                <div className={`${styles.checkbox} ${!tableChecked.has(t.id) ? styles.unchecked : ''}`}>
                  <CheckIcon />
                </div>
                <div className={styles.rowText}>
                  <span className={styles.rowName}>{t.name}</span>
                  <span className={styles.rowDesc}>{t.desc}</span>
                </div>
                <ConfidenceBadge pct={t.pct} />
              </div>
            ))}
          </div>
        )}

        {suggType === 'joins' && (
          <div className={`${styles.joinList} ${isReadOnly ? styles.readOnly : ''}`}>
            {joins.map(j => (
              <div key={j.id} className={styles.joinRow}>
                <div className={styles.joinRowTop}>
                  <div
                    className={`${styles.checkbox} ${!joinChecked.has(j.id) ? styles.unchecked : ''}`}
                    onClick={() => {
                      if (isReadOnly) return;
                      setJoinChecked(prev => {
                        const next = new Set(prev);
                        next.has(j.id) ? next.delete(j.id) : next.add(j.id);
                        return next;
                      });
                    }}
                  >
                    <CheckIcon />
                  </div>
                  <div className={styles.joinRowText}>
                    <span className={styles.joinName}>{j.name}</span>
                    <span className={styles.joinDesc}>{j.desc}</span>
                  </div>
                </div>
                <JoinDiagram
                  leftTable={j.leftTable} leftCol={j.leftCol}
                  cardinality={j.cardinality}
                  rightTable={j.rightTable} rightCol={j.rightCol}
                />
              </div>
            ))}
          </div>
        )}

        {suggType === 'columns' && (
          <div className={`${styles.colList} ${isReadOnly ? styles.readOnly : ''}`}>
            {columnGroups.map(g => (
              <React.Fragment key={g.table}>
                <div className={styles.colGroupHeader}>{g.table}</div>
                {g.columns.map(col => (
                  <div key={col} className={styles.colRow}>
                    <div className={styles.checkbox}>
                      <CheckIcon />
                    </div>
                    <span className={styles.colName}>{col}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}

        {suggType === 'formulas' && (
          <div className={`${styles.formulaList} ${isReadOnly ? styles.readOnly : ''}`}>
            {formulas.map((f, i) => (
              <div key={f.id} className={styles.formulaRow}>
                <span className={styles.formulaNum}>{i + 1}.</span>
                <div className={styles.formulaBody}>
                  <span className={styles.formulaName}>{f.name}</span>
                  <span className={styles.formulaCodeWrap}>
                    <span className={styles.formulaCode}>
                      {f.code.length > 80 ? f.code.slice(0, 80) + '...' : f.code}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && (
          <div className={styles.footer}>
            <button className={styles.addBtn} onClick={handleAdd} disabled={isAdding}>
              {isAdding ? 'Adding...' : addLabel}
            </button>
          </div>
        )}
      </div>

      {!isReadOnly && (
        <button className={styles.refineBtn} style={{ pointerEvents: 'none', cursor: 'default' }}>
          <RefineIcon />
          Refine suggestions
        </button>
      )}
    </>
  );
};
