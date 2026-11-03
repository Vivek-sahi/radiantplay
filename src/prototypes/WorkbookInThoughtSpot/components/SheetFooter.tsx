import React, { useState } from 'react';
import { Button } from '@components/Button';
import { Tooltip } from '@components/Tooltip';
import type { Sheet, SheetKind } from '../engine/workbook';
import styles from './SheetFooter.module.css';

// The bottom of the workbook, Google Sheets style: add a sheet, the list of all sheets, one tab per
// sheet, and on the right the selection's Sum / Average / Count, which you click through. Each tab
// says where its data lives: Live (from the data model), Input (typed, written back), Local (only in
// this workbook).

const KIND_LABEL: Record<SheetKind, string> = { live: 'Live', input: 'Input', local: 'Local' };
const KIND_HELP: Record<SheetKind, string> = {
  live: 'Rows come from the data model and stay live',
  input: 'Typed values, saved back to your warehouse',
  local: 'Lives only in this workbook',
};

export interface Aggregate { sum: number; count: number; numbers: number }

export interface SheetFooterProps {
  sheets: Sheet[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  agg: Aggregate;
  status: React.ReactNode;
}

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const SheetFooter: React.FC<SheetFooterProps> = ({ sheets, activeId, onSelect, onAdd, agg, status }) => {
  const [listOpen, setListOpen] = useState(false);
  const [aggPick, setAggPick] = useState<'sum' | 'avg' | 'count'>('sum');
  const aggText =
    agg.numbers === 0 ? null :
    aggPick === 'sum' ? `Sum: ${fmt.format(agg.sum)}` :
    aggPick === 'avg' ? `Average: ${fmt.format(agg.sum / agg.numbers)}` :
    `Count: ${fmt.format(agg.count)}`;

  return (
    <div className={styles.footer}>
      <Tooltip content="Add sheet" showDelay={400} hideDelay={0}>
        <Button className={styles.tool} variant="tertiary" size="small" iconOnly icon="plus" iconPosition="leading" onClick={onAdd}>Add sheet</Button>
      </Tooltip>
      <div className={styles.listWrap}>
        <Tooltip content="All sheets" showDelay={400} hideDelay={0}>
          <Button className={styles.tool} variant="tertiary" size="small" iconOnly icon="hamburger" iconPosition="leading" onClick={() => setListOpen((o) => !o)}>All sheets</Button>
        </Tooltip>
        {listOpen && (
          <div className={styles.list} role="menu">
            {sheets.map((s) => (
              <button key={s.id} role="menuitem" className={`${styles.listItem} ${s.id === activeId ? styles.listItemOn : ''}`} onClick={() => { onSelect(s.id); setListOpen(false); }}>
                <span className={`${styles.dot} ${styles[s.kind]}`} />
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.tabs} role="tablist">
        {sheets.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === activeId} title={KIND_HELP[s.kind]} className={`${styles.tab} ${s.id === activeId ? styles.tabOn : ''}`} onClick={() => onSelect(s.id)}>
            <span className={`${styles.dot} ${styles[s.kind]}`} />
            <span className={styles.tabName}>{s.name}</span>
            <span className={styles.kind}>{KIND_LABEL[s.kind]}</span>
          </button>
        ))}
      </div>
      <div className={styles.status}>{status}</div>
      {aggText && (
        <button className={styles.agg} title="Click to switch between Sum, Average and Count" onClick={() => setAggPick((a) => (a === 'sum' ? 'avg' : a === 'avg' ? 'count' : 'sum'))}>
          {aggText}
        </button>
      )}
    </div>
  );
};

export default SheetFooter;
