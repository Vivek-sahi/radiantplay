import React from 'react';
import { ActionMenu } from '@components/ActionMenu';
import { Button } from '@components/Button';
import styles from './MenuBar.module.css';

// The Google Sheets menu bar above the toolbar (Vivek, 3 Nov: a second option behind the gear,
// "we can pick what Google Sheets has"; Tools, Extensions and Help removed). Same menus and item names as Sheets, cut to what a
// workbook on governed data can mean. Each item runs the action the toolbar, the tab menu or the
// header already runs; items the prototype doesn't have yet say so.

const mod = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl+';

export interface MenuItem { id: string; label: string; shortcut?: string; destructive?: boolean }
type Menu = { label: string; groups: MenuItem[][] };

export const MENUS: Menu[] = [
  { label: 'File', groups: [
    [{ id: 'new', label: 'New' }, { id: 'open', label: 'Open', shortcut: `${mod}O` }, { id: 'copy', label: 'Make a copy' }],
    [{ id: 'share', label: 'Share' }, { id: 'publish', label: 'Publish changes' }, { id: 'versions', label: 'Version history' }],
    [{ id: 'download-xlsx', label: 'Download as Excel (.xlsx)' }, { id: 'export', label: 'Download this sheet as CSV' }, { id: 'upload', label: 'Import a file' }],
    [{ id: 'details', label: 'Details' }, { id: 'schedule', label: 'Schedule' }],
    [{ id: 'delete-workbook', label: 'Move to trash', destructive: true }],
  ] },
  { label: 'Edit', groups: [
    [{ id: 'undo', label: 'Undo', shortcut: `${mod}Z` }, { id: 'redo', label: 'Redo', shortcut: `${mod}Y` }],
    [{ id: 'cut', label: 'Cut', shortcut: `${mod}X` }, { id: 'copy-cells', label: 'Copy', shortcut: `${mod}C` }, { id: 'paste', label: 'Paste', shortcut: `${mod}V` }],
    [{ id: 'find', label: 'Find and replace', shortcut: `${mod}F` }],
  ] },
  { label: 'View', groups: [
    [{ id: 'show-formulas', label: 'Show formulas', shortcut: `${mod}\`` }, { id: 'focus', label: 'Focus cell' }],
    [{ id: 'freeze', label: 'Freeze' }, { id: 'gridlines', label: 'Gridlines' }],
    [{ id: 'expand', label: 'Full screen' }],
  ] },
  { label: 'Insert', groups: [
    [{ id: 'sheet', label: 'Sheet' }, { id: 'input-table', label: 'Input table' }],
    [{ id: 'pivot', label: 'Pivot table' }, { id: 'formula', label: 'Function' }],
    [{ id: 'chart', label: 'Chart' }, { id: 'comment', label: 'Comment' }],
  ] },
  { label: 'Format', groups: [
    [{ id: 'fmt-auto', label: 'Number: Automatic' }, { id: 'fmt-number', label: 'Number: Number' }, { id: 'fmt-currency', label: 'Number: Currency' }, { id: 'fmt-percent', label: 'Number: Percent' }, { id: 'fmt-text', label: 'Number: Plain text' }],
    [{ id: 'align-left', label: 'Alignment: Left' }, { id: 'align-center', label: 'Alignment: Center' }, { id: 'align-right', label: 'Alignment: Right' }, { id: 'wrap', label: 'Wrapping' }],
    [{ id: 'cf-scale', label: 'Conditional formatting: Colour scale' }, { id: 'cf-negative', label: 'Conditional formatting: Below zero' }, { id: 'cf-clear', label: 'Clear conditional formatting' }],
  ] },
  { label: 'Data', groups: [
    [{ id: 'sort-asc', label: 'Sort sheet A to Z' }, { id: 'sort-desc', label: 'Sort sheet Z to A' }],
    [{ id: 'filter', label: 'Create a filter' }, { id: 'clear-filter', label: 'Remove filter' }],
    [{ id: 'refresh', label: 'Refresh from the model' }, { id: 'pin', label: 'Pin to a Liveboard' }],
  ] },
];

export const MenuBar: React.FC<{ onItem: (id: string) => void }> = ({ onItem }) => (
  <div className={styles.bar} role="menubar" aria-label="Workbook menus">
    {MENUS.map((m) => (
      <ActionMenu
        key={m.label}
        placement="bottom-start"
        trigger={<Button className={styles.menu} variant="tertiary" size="small">{m.label}</Button>}
      >
        {m.groups.map((g, i) => (
          <ActionMenu.Group key={i}>
            {g.map((it) => (
              <ActionMenu.Item key={it.id} label={it.label} shortcut={it.shortcut} destructive={it.destructive} onClick={() => onItem(it.id)} />
            ))}
          </ActionMenu.Group>
        ))}
      </ActionMenu>
    ))}
  </div>
);

export default MenuBar;
