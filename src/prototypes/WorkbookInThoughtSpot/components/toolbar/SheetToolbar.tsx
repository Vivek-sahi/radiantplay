import React from 'react';
import { Button } from '@components/Button';
import { ActionMenu } from '@components/ActionMenu';
import { Tooltip } from '@components/Tooltip';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import {
  AdvancedSortingIcon, AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ColumnSizeIcon, CurrencyIcon,
  IncreaseDecimalIcon, PercentIcon, ReduceDecimalIcon, StyleIcon, TextFormatIcon, TextWrapIcon,
} from './SpreadsheetIcons';
import styles from './SheetToolbar.module.css';

// The spreadsheet toolbar as ThoughtSpot specifies it (Figma "Spreadsheet — Search Data
// Improvements", 5LFnxv5fom9nu64N48aJzl: "Tool bar" spec 731:277380 and the "Spreadsheets icon
// list" 1863:164897). One 40px row, Google-Sheets-like: small ghost icon buttons (24px) in groups
// aligned left, Expand on the right. Glyphs Radiant lacks come from that icon list.
// Pin sits in the last group (Vivek, 3 Nov): pinning is a ThoughtSpot-level action, so it earns a
// place on the bar, beside download. Focus cell is a toggle in the column tools group; only Expand is on the right.

type Glyph = IconName | React.ReactNode;

export interface ToolMenuItem { id: string; label: string; icon?: Glyph }
interface Tool { id: string; label: string; icon: Glyph; menu?: ToolMenuItem[] }

const GROUPS: Tool[][] = [
  [{ id: 'undo', label: 'Undo', icon: 'undo' }, { id: 'redo', label: 'Redo', icon: 'redo' }],
  [
    { id: 'sort', label: 'Sort', icon: <AdvancedSortingIcon />, menu: [{ id: 'sort-asc', label: 'Sort A to Z' }, { id: 'sort-desc', label: 'Sort Z to A' }] },
    { id: 'conditional', label: 'Conditional formatting', icon: 'conditional-format', menu: [
      { id: 'cf-scale', label: 'Colour scale: red to green' },
      { id: 'cf-negative', label: 'Highlight values below zero' },
      { id: 'cf-clear', label: 'Clear rules on this sheet' },
    ] },
  ],
  [
    { id: 'align', label: 'Alignment', icon: <AlignLeftIcon />, menu: [
      { id: 'align-left', label: 'Left', icon: <AlignLeftIcon /> },
      { id: 'align-center', label: 'Center', icon: <AlignCenterIcon /> },
      { id: 'align-right', label: 'Right', icon: <AlignRightIcon /> },
    ] },
    { id: 'wrap', label: 'Wrap text', icon: <TextWrapIcon /> },
  ],
  [
    { id: 'currency', label: 'Format as currency', icon: <CurrencyIcon /> },
    { id: 'percent', label: 'Format as percent', icon: <PercentIcon /> },
    { id: 'dec-down', label: 'Decrease decimal places', icon: <ReduceDecimalIcon /> },
    { id: 'dec-up', label: 'Increase decimal places', icon: <IncreaseDecimalIcon /> },
    { id: 'number', label: 'More formats', icon: 'number-format', menu: [
      { id: 'fmt-auto', label: 'Automatic' },
      { id: 'fmt-number', label: 'Number' },
      { id: 'fmt-currency', label: 'Currency' },
      { id: 'fmt-percent', label: 'Percent' },
      { id: 'fmt-text', label: 'Plain text' },
    ] },
    { id: 'format', label: 'Format', icon: <TextFormatIcon /> },
  ],
  [
    { id: 'size', label: 'Column sizing', icon: <ColumnSizeIcon /> },
    { id: 'painter', label: 'Paint format', icon: <StyleIcon /> },
    { id: 'filter', label: 'Filter columns', icon: 'funnel' },
    { id: 'clear-filter', label: 'Clear filter', icon: 'cross' },
    // Focus cell sits with the other tools, not on the right (Vivek, 3 Nov).
    { id: 'focus', label: 'Focus cell: shade the active row and column', icon: 'zoom-area' },
  ],
  [{ id: 'formula', label: 'Insert function', icon: 'formula' }, { id: 'upload', label: 'Upload', icon: 'upload' }],
  [{ id: 'pin', label: 'Pin to a Liveboard', icon: 'pin' }, { id: 'export', label: 'Download', icon: 'download' }],
];

export interface SheetToolbarProps {
  onAction?: (id: string) => void;
  /** Tools shown as on (Focus cell, Paint format). */
  active?: string[];
  /** Sheet-level action shown before the full screen icon (Save to warehouse on an input tab, Vivek 4 Nov). */
  beforeExpand?: React.ReactNode;
}

export const SheetToolbar: React.FC<SheetToolbarProps> = ({ onAction, active = [], beforeExpand }) => {
  const button = (t: Tool, onClick?: () => void) => (
    <Button
      className={`${styles.tool} ${active.includes(t.id) ? styles.on : ''}`}
      variant="tertiary"
      size="small"
      iconOnly
      icon={t.icon}
      iconPosition="leading"
      aria-pressed={active.includes(t.id) || undefined}
      onClick={onClick}
    >
      {t.label}
    </Button>
  );
  const tool = (t: Tool) =>
    t.menu ? (
      <ActionMenu key={t.id} placement="bottom-start" trigger={button(t)}>
        {t.menu.map((m) => (
          <ActionMenu.Item key={m.id} label={m.label} icon={typeof m.icon === 'string' ? <Icon name={m.icon as IconName} size="s" /> : m.icon} onClick={() => onAction?.(m.id)} />
        ))}
      </ActionMenu>
    ) : (
      <Tooltip key={t.id} content={t.label} showDelay={400} hideDelay={0}>
        {button(t, () => onAction?.(t.id))}
      </Tooltip>
    );
  return (
    <div className={styles.bar} role="toolbar" aria-label="Spreadsheet tools">
      <div className={styles.groups}>
        {GROUPS.map((g, i) => (
          <div key={i} className={styles.group}>{g.map(tool)}</div>
        ))}
      </div>
      <div className={styles.group}>
        {beforeExpand}
        {tool({ id: 'expand', label: 'Expand', icon: 'expand' })}
      </div>
    </div>
  );
};

export default SheetToolbar;
