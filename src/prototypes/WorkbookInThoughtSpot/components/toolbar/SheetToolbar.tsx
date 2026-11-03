import React from 'react';
import { Button } from '@components/Button';
import { Tooltip } from '@components/Tooltip';
import type { IconName } from '@components/icons';
import {
  AdvancedSortingIcon, AlignLeftIcon, ColumnSizeIcon, CurrencyIcon, IncreaseDecimalIcon,
  PercentIcon, ReduceDecimalIcon, StyleIcon, TextFormatIcon, TextWrapIcon,
} from './SpreadsheetIcons';
import styles from './SheetToolbar.module.css';

// The spreadsheet toolbar as ThoughtSpot specifies it (Figma "Spreadsheet — Search Data
// Improvements", 5LFnxv5fom9nu64N48aJzl: "Tool bar" spec 731:277380 and the "Spreadsheets icon
// list" 1863:164897). One 40px row, Google-Sheets-like: small ghost icon buttons (24px) in groups
// aligned left, Expand on the right. Groups follow the spec's 2 · 2 · 2 · 6 · 4 · 2 · 1 layout,
// filled in the icon list's order. Glyphs Radiant lacks come from that icon list (SpreadsheetIcons).

type Glyph = IconName | React.ReactNode;
interface Tool { id: string; label: string; icon: Glyph }

const GROUPS: Tool[][] = [
  [{ id: 'undo', label: 'Undo', icon: 'undo' }, { id: 'redo', label: 'Redo', icon: 'redo' }],
  [{ id: 'sort', label: 'Advanced sorting', icon: <AdvancedSortingIcon /> }, { id: 'conditional', label: 'Conditional formatting', icon: 'conditional-format' }],
  [{ id: 'align', label: 'Alignment', icon: <AlignLeftIcon /> }, { id: 'wrap', label: 'Wrap text', icon: <TextWrapIcon /> }],
  [
    { id: 'currency', label: 'Currency', icon: <CurrencyIcon /> },
    { id: 'percent', label: 'Percentage', icon: <PercentIcon /> },
    { id: 'dec-down', label: 'Reduce decimal', icon: <ReduceDecimalIcon /> },
    { id: 'dec-up', label: 'Increase decimal', icon: <IncreaseDecimalIcon /> },
    { id: 'number', label: 'Change number format', icon: 'number-format' },
    { id: 'format', label: 'Format', icon: <TextFormatIcon /> },
  ],
  [
    { id: 'size', label: 'Column sizing', icon: <ColumnSizeIcon /> },
    { id: 'style', label: 'Style', icon: <StyleIcon /> },
    { id: 'filter', label: 'Filter columns', icon: 'funnel' },
    { id: 'clear-filter', label: 'Clear filter', icon: 'cross' },
  ],
  [{ id: 'formula', label: 'Insert formula', icon: 'formula' }, { id: 'upload', label: 'Upload', icon: 'upload' }],
  [{ id: 'export', label: 'Export to CSV', icon: 'download' }],
];

export interface SheetToolbarProps {
  onAction?: (id: string) => void;
}

export const SheetToolbar: React.FC<SheetToolbarProps> = ({ onAction }) => {
  const tool = (t: Tool) => (
    <Tooltip key={t.id} content={t.label}>
      <Button variant="tertiary" size="small" iconOnly icon={t.icon} iconPosition="leading" onClick={() => onAction?.(t.id)}>
        {t.label}
      </Button>
    </Tooltip>
  );
  return (
    <div className={styles.bar} role="toolbar" aria-label="Spreadsheet tools">
      <div className={styles.groups}>
        {GROUPS.map((g, i) => (
          <div key={i} className={styles.group}>{g.map(tool)}</div>
        ))}
      </div>
      {tool({ id: 'expand', label: 'Expand', icon: 'expand' })}
    </div>
  );
};

export default SheetToolbar;
