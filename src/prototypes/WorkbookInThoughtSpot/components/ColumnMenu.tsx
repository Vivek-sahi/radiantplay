import React, { useEffect, useRef } from 'react';
import { ActionMenu } from '@components/ActionMenu';
import { Icon } from '@components/icons';
import { colLetter } from '../engine/formula';
import type { Sheet } from '../engine/workbook';
import { AdvancedSortingIcon, CurrencyIcon, PercentIcon, TextWrapIcon } from './toolbar/SpreadsheetIcons';
import styles from './ColumnMenu.module.css';

// The column header menu (Vivek, 4 Nov: "there is no column level menu which is standard in
// spreadsheets"). A chevron on the hovered header, or right-click on any header, opens it.
// Items follow ThoughtSpot's own Spreadsheet on live data header menu (docs, 26.10), minus the
// Answer-only ones (Aggregate, Time bucket), plus Sheets' Insert column left / right.
// Every item runs an action the workbook already has, so it behaves the same as the toolbar.

export type ColumnAction =
  | 'insert-left' | 'insert-right' | 'calculated'
  | 'sort-asc' | 'sort-desc' | 'filter'
  | 'fmt-number' | 'fmt-currency' | 'fmt-percent' | 'fmt-auto'
  | 'cf-scale' | 'cf-negative' | 'wrap'
  | 'rename' | 'duplicate' | 'remove'
  | 'input-type' | 'input-key' | 'input-required' | 'input-allowed' | 'input-default';

export interface ColumnMenuProps {
  sheet: Sheet;
  /** The column and where its header is on screen; n reopens the menu for a new click. */
  at: { c: number; x: number; y: number; w: number; h: number; n: number };
  onAction: (c: number, action: ColumnAction) => void;
  onClose: () => void;
}

export const ColumnMenu: React.FC<ColumnMenuProps> = ({ sheet, at, onAction, onClose }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { trigger.current?.click(); }, []);

  const col = sheet.columns[at.c];
  const name = col?.title || sheet.cells[`${at.c},1`] || `Column ${colLetter(at.c)}`;
  const hasRows = !!col && sheet.rows.length > 0;
  const numeric = !col || col.type !== 'text';
  const run = (a: ColumnAction) => () => onAction(at.c, a);

  return (
    <div className={styles.host} style={{ left: at.x, top: at.y, width: at.w, height: at.h }}>
      <ActionMenu
        placement="bottom-end"
        onClose={onClose}
        trigger={<button ref={trigger} className={styles.trigger} aria-label={`${name} column actions`} />}
      >
        <ActionMenu.Group>
          <ActionMenu.Item label="Insert 1 column left" icon={<Icon name="arrow-left" size="s" />} onClick={run('insert-left')} />
          <ActionMenu.Item label="Insert 1 column right" icon={<Icon name="arrow-right" size="s" />} onClick={run('insert-right')} />
          <ActionMenu.Item label="New calculated field" icon={<Icon name="formula" size="s" />} onClick={run('calculated')} />
        </ActionMenu.Group>
        {hasRows && (
          <ActionMenu.Group>
            <ActionMenu.Item label="Sort A to Z" icon={<AdvancedSortingIcon />} onClick={run('sort-asc')} />
            <ActionMenu.Item label="Sort Z to A" icon={<AdvancedSortingIcon />} onClick={run('sort-desc')} />
            <ActionMenu.Item label="Filter" icon={<Icon name="funnel" size="s" />} onClick={run('filter')} />
          </ActionMenu.Group>
        )}
        {numeric && (
          <ActionMenu.Group label="Format">
            <ActionMenu.Item label="Number" icon={<Icon name="number-format" size="s" />} onClick={run('fmt-number')} />
            <ActionMenu.Item label="Currency" icon={<CurrencyIcon />} onClick={run('fmt-currency')} />
            <ActionMenu.Item label="Percent" icon={<PercentIcon />} onClick={run('fmt-percent')} />
            <ActionMenu.Item label="Automatic" onClick={run('fmt-auto')} />
          </ActionMenu.Group>
        )}
        <ActionMenu.Group label="Conditional formatting">
          {numeric && <ActionMenu.Item label="Colour scale: red to green" icon={<Icon name="conditional-format" size="s" />} onClick={run('cf-scale')} />}
          {numeric && <ActionMenu.Item label="Highlight values below zero" icon={<Icon name="conditional-format" size="s" />} onClick={run('cf-negative')} />}
          <ActionMenu.Item label={sheet.formats?.[at.c]?.wrap ? 'Turn off text wrapping' : 'Wrap text'} icon={<TextWrapIcon />} onClick={run('wrap')} />
        </ActionMenu.Group>
        {/* Input column options (Vivek, 4 Nov): shown now, they work in a later pass. */}
        {sheet.kind === 'input' && col?.input && (
          <ActionMenu.Group label="Input column">
            <ActionMenu.Item label="Change column type" onClick={run('input-type')} />
            <ActionMenu.Item label="Set as key" onClick={run('input-key')} />
            <ActionMenu.Item label="Required" onClick={run('input-required')} />
            <ActionMenu.Item label="Allowed values" onClick={run('input-allowed')} />
            <ActionMenu.Item label="Default value" onClick={run('input-default')} />
          </ActionMenu.Group>
        )}
        <ActionMenu.Group>
          <ActionMenu.Item label="Rename" icon={<Icon name="edit-text" size="s" />} onClick={run('rename')} />
          <ActionMenu.Item label="Duplicate column" icon={<Icon name="copy" size="s" />} onClick={run('duplicate')} />
        </ActionMenu.Group>
        <ActionMenu.Group>
          <ActionMenu.Item label="Remove column" icon={<Icon name="delete" size="s" />} destructive onClick={run('remove')} />
        </ActionMenu.Group>
      </ActionMenu>
    </div>
  );
};

export default ColumnMenu;

// The thin + column on an Input tab: pick the new column's type.
export type NewColumnType = 'text' | 'number' | 'currency' | 'percent' | 'date';

export const AddColumnMenu: React.FC<{ at: { x: number; y: number; w: number; h: number; n: number }; onPick: (t: NewColumnType) => void; onClose: () => void }> = ({ at, onPick, onClose }) => {
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { trigger.current?.click(); }, []);
  return (
    <div className={styles.host} style={{ left: at.x, top: at.y, width: at.w, height: at.h }}>
      <ActionMenu placement="bottom-end" onClose={onClose} trigger={<button ref={trigger} className={styles.trigger} aria-label="Add a column" />}>
        <ActionMenu.Group label="Add a column">
          <ActionMenu.Item label="Text" icon={<Icon name="text" size="s" />} onClick={() => onPick('text')} />
          <ActionMenu.Item label="Number" icon={<Icon name="number-format" size="s" />} onClick={() => onPick('number')} />
          <ActionMenu.Item label="Currency" icon={<CurrencyIcon />} onClick={() => onPick('currency')} />
          <ActionMenu.Item label="Percent" icon={<PercentIcon />} onClick={() => onPick('percent')} />
          <ActionMenu.Item label="Date" icon={<Icon name="calendar-cleaned" size="s" />} onClick={() => onPick('date')} />
        </ActionMenu.Group>
      </ActionMenu>
    </div>
  );
};
