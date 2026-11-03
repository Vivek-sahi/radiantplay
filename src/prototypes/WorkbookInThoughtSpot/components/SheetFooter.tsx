import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@components/Button';
import { ActionMenu } from '@components/ActionMenu';
import { Tooltip } from '@components/Tooltip';
import { Icon } from '@components/icons';
import type { Sheet, SheetKind } from '../engine/workbook';
import styles from './SheetFooter.module.css';

// The bottom of the workbook, Google Sheets style: add a sheet, the list of all sheets, one tab per
// sheet, and on the right the selection's Sum / Average / Count, which you click through. Each tab
// says where its data lives: Live (from the data model), Input (typed, written back), Local (only in
// this workbook).
//
// Sheet-level actions (Vivek, 3 Nov) sit on the tab, as in Sheets, Excel and Liveboard tabs: a ▾ on
// the active tab, right-click on any tab, double-click to rename.

const KIND_LABEL: Record<SheetKind, string> = { live: 'Live', input: 'Input', local: 'Local' };
const KIND_HELP: Record<SheetKind, string> = {
  live: 'Rows come from the data model and stay live',
  input: 'Typed values, saved back to your warehouse',
  local: 'Lives only in this workbook',
};

export type SheetAction =
  | 'duplicate' | 'copy-link' | 'move-left' | 'move-right' | 'refresh'
  | 'pin' | 'make-app' | 'download-csv' | 'delete' | 'pivot';

export interface Aggregate { sum: number; count: number; numbers: number }

export interface SheetFooterProps {
  sheets: Sheet[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (kind: 'blank' | 'input' | 'app') => void;
  onRename: (id: string, name: string) => void;
  onAction: (id: string, action: SheetAction) => void;
  agg: Aggregate;
  status: React.ReactNode;
}

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const SheetFooter: React.FC<SheetFooterProps> = ({ sheets, activeId, onSelect, onAdd, onRename, onAction, agg, status }) => {
  const [listOpen, setListOpen] = useState(false);
  const [aggPick, setAggPick] = useState<'sum' | 'avg' | 'count'>('sum');
  const [renaming, setRenaming] = useState<{ id: string; text: string } | null>(null);
  const caret = useRef<HTMLButtonElement>(null);
  const openMenuNext = useRef(false);

  // Right-click on a tab: select it, then open its ▾ menu once it's the active tab.
  useEffect(() => {
    if (openMenuNext.current) { openMenuNext.current = false; caret.current?.click(); }
  }, [activeId]);

  const aggText =
    agg.numbers === 0 ? null :
    aggPick === 'sum' ? `Sum: ${fmt.format(agg.sum)}` :
    aggPick === 'avg' ? `Average: ${fmt.format(agg.sum / agg.numbers)}` :
    `Count: ${fmt.format(agg.count)}`;

  const active = sheets.find((s) => s.id === activeId)!;
  const index = sheets.findIndex((s) => s.id === activeId);
  const act = (a: SheetAction) => () => onAction(activeId, a);

  const commitRename = () => {
    if (renaming && renaming.text.trim()) onRename(renaming.id, renaming.text.trim());
    setRenaming(null);
  };

  return (
    <div className={styles.footer}>
      {/* Tab +: what kind of tab to add (Vivek, 3 Nov): a blank sheet, an input table, or an app. */}
      <ActionMenu
        placement="top-start"
        trigger={<Button className={styles.tool} variant="tertiary" size="small" iconOnly icon="plus" iconPosition="leading">Add sheet</Button>}
      >
        <ActionMenu.Item label="Blank sheet" icon={<Icon name="table-stroke" size="s" />} onClick={() => onAdd('blank')} />
        <ActionMenu.Item label="Input table" icon={<Icon name="edit-text" size="s" />} onClick={() => onAdd('input')} />
        <ActionMenu.Item label="App" icon={<Icon name="apps" size="s" />} onClick={() => onAdd('app')} />
      </ActionMenu>
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
        {sheets.map((s) => {
          const on = s.id === activeId;
          return (
            <div
              key={s.id}
              role="tab"
              tabIndex={0}
              aria-selected={on}
              title={KIND_HELP[s.kind]}
              className={`${styles.tab} ${on ? styles.tabOn : ''}`}
              onClick={() => onSelect(s.id)}
              onDoubleClick={() => setRenaming({ id: s.id, text: s.name })}
              onContextMenu={(e) => {
                e.preventDefault();
                if (on) caret.current?.click();
                else { openMenuNext.current = true; onSelect(s.id); }
              }}
            >
              <span className={`${styles.dot} ${styles[s.kind]}`} />
              {renaming?.id === s.id ? (
                <input
                  className={styles.renameInput}
                  aria-label="Sheet name"
                  value={renaming.text}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setRenaming({ id: s.id, text: e.target.value })}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); e.stopPropagation(); }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={styles.tabName}>{s.name}</span>
              )}
              <span className={styles.kind}>{KIND_LABEL[s.kind]}</span>
              {on && (
                // The menu sits inside the tab: stop its clicks from bubbling up and re-selecting the tab.
                <span className={styles.menuHost} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                <ActionMenu
                  placement="top-start"
                  trigger={<button ref={caret} className={styles.caret} aria-label={`${s.name} sheet actions`} onClick={(e) => e.stopPropagation()}><Icon name="caret-down" size="xs" /></button>}
                >
                  <ActionMenu.Group>
                    <ActionMenu.Item label="Rename" icon={<Icon name="edit-text" size="s" />} onClick={() => setRenaming({ id: active.id, text: active.name })} />
                    <ActionMenu.Item label="Duplicate" icon={<Icon name="copy" size="s" />} onClick={act('duplicate')} />
                    <ActionMenu.Item label="Copy link to sheet" icon={<Icon name="copy-link" size="s" />} onClick={act('copy-link')} />
                  </ActionMenu.Group>
                  <ActionMenu.Group>
                    <ActionMenu.Item label="Move left" icon={<Icon name="arrow-left" size="s" />} disabled={index === 0} onClick={act('move-left')} />
                    <ActionMenu.Item label="Move right" icon={<Icon name="arrow-right" size="s" />} disabled={index === sheets.length - 1} onClick={act('move-right')} />
                  </ActionMenu.Group>
                  {active.kind === 'live' && !active.pivot && (
                    <ActionMenu.Group>
                      <ActionMenu.Item label="Refresh data" icon={<Icon name="refresh" size="s" />} onClick={act('refresh')} />
                    </ActionMenu.Group>
                  )}
                  {active.rows.length > 0 && !active.pivot && (
                    <ActionMenu.Group>
                      <ActionMenu.Item label="Create pivot table" icon={<Icon name="table" size="s" />} onClick={act('pivot')} />
                    </ActionMenu.Group>
                  )}
                  <ActionMenu.Group>
                    <ActionMenu.Item label="Pin to a Liveboard" icon={<Icon name="pin" size="s" />} onClick={act('pin')} />
                    <ActionMenu.Item label="Make an app" icon={<Icon name="apps" size="s" />} onClick={act('make-app')} />
                    <ActionMenu.Item label="Download as CSV" icon={<Icon name="download" size="s" />} onClick={act('download-csv')} />
                  </ActionMenu.Group>
                  <ActionMenu.Group>
                    <ActionMenu.Item label="Delete" icon={<Icon name="delete" size="s" />} destructive disabled={sheets.length < 2} onClick={act('delete')} />
                  </ActionMenu.Group>
                </ActionMenu>
                </span>
              )}
            </div>
          );
        })}
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
