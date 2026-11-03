import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Typography } from '@components/Typography';
import { Horizontal } from '@components/Layout';
import { Icon } from '@components/icons';
import { useIsDarkMode } from '@/context/ThemeContext';
import { Grid, type Aggregates, type GridHandle } from './grid/Grid';
import { Footer } from './grid/Footer';
import { themeVars } from './grid/theme';
import type { CellEdit, Column, MenuEntry, Row } from './grid/types';
import type { Sheet } from './grid/sheet';
import { DataSheetToolbar } from './toolbar/DataSheetToolbar';
import { blankColumns, blankRows, modelColumns, modelRows } from '../data/sheetData';
import './grid/grid.css';
import styles from './WorkbookLive.module.css';

// The live workbook (Vivek, 3 Nov 2026), in Google Sheets' order:
//   title · action toolbar (Komal's, from SearchDataOnDataModelFinal) · formula bar ·
//   grid (Pratheek's Klimt-Grid prototype: select, drag-select, edit, column menus, keyboard) ·
//   footer with sheet tabs, the sheet list and Sum / Average / Count of the selection.
// Edits are applied straight to the sheet; saving and write-back come later.

interface SheetState {
  columns: Column[];
  rows: Row[];
}

const COLUMN_MENU: MenuEntry[] = [
  { id: 'sort-asc', label: 'Sort ascending', icon: 'sort-asc' },
  { id: 'sort-desc', label: 'Sort descending', icon: 'sort-desc' },
];

// Stable empties: fresh Maps on every render made the grid re-report its selection in a loop.
const NO_EDITS = new Map();
const NO_ERRORS = new Map();
const NO_NOTICES: never[] = [];
const noop = () => undefined;

const ADD_COLUMN: MenuEntry[] = [
  { id: 'input', label: 'Input column' },
  { id: 'formula', label: 'Formula column' },
];

const sortRows = (rows: Row[], colId: string, dir: 1 | -1) =>
  [...rows].sort((a, b) => {
    const x = a[colId];
    const y = b[colId];
    if (x === y) return 0;
    if (x === null || x === undefined || x === '') return 1;
    if (y === null || y === undefined || y === '') return -1;
    return (x > y ? 1 : -1) * dir;
  });

export interface WorkbookLiveProps {
  name: string;
  blank?: boolean;
}

export const WorkbookLive: React.FC<WorkbookLiveProps> = ({ name, blank }) => {
  const isDark = useIsDarkMode();
  const grid = useRef<GridHandle>(null);
  const [sheets, setSheets] = useState<Sheet[]>([{ name: 'Sheet 1', kind: blank ? 'input' : 'answer', state: '' }]);
  const [active, setActive] = useState(0);
  const [data, setData] = useState<Record<string, SheetState>>(() => ({
    'Sheet 1': blank ? { columns: blankColumns(), rows: blankRows('Sheet 1') } : { columns: modelColumns(), rows: modelRows() },
  }));
  const [agg, setAgg] = useState<Aggregates>({ cells: 1, numbers: 0, sum: 0 });
  const [cell, setCell] = useState({ ref: 'A1', text: '' });

  const onActiveCell = useCallback((a: { ref: string; text: string }) => setCell((c) => (c.ref === a.ref && c.text === a.text ? c : a)), []);
  const onAgg = useCallback((a: Aggregates) => setAgg((p) => (p.cells === a.cells && p.numbers === a.numbers && p.sum === a.sum ? p : a)), []);
  const sheetName = sheets[active].name;
  const sheet = data[sheetName];
  const vars = useMemo(() => themeVars(isDark ? 'dark' : 'light', 'default'), [isDark]);

  const update = (fn: (s: SheetState) => SheetState) => setData((d) => ({ ...d, [sheetName]: fn(d[sheetName]) }));

  const onEdit = useCallback((edits: CellEdit[]) => {
    setData((d) => {
      const s = d[sheetName];
      const byId = new Map(edits.filter((e) => e.valid).map((e) => [`${e.rowId}|${e.colId}`, e.value]));
      const rows = s.rows.map((r) => {
        let next = r;
        for (const col of s.columns) {
          const k = `${r.__id}|${col.id}`;
          if (byId.has(k)) next = { ...next, [col.id]: byId.get(k)! };
        }
        return next;
      });
      return { ...d, [sheetName]: { ...s, rows } };
    });
  }, [sheetName]);

  const addSheet = () => {
    const n = `Sheet ${sheets.length + 1}`;
    setData((d) => ({ ...d, [n]: { columns: blankColumns(), rows: blankRows(n) } }));
    setSheets((s) => [...s, { name: n, kind: 'input', state: '' }]);
    setActive(sheets.length);
  };

  const sortActive = (dir: 1 | -1) => {
    const letter = cell.ref.replace(/\d+$/, '');
    const idx = letter.split('').reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
    const col = sheet.columns[idx];
    if (col) update((s) => ({ ...s, rows: sortRows(s.rows, col.id, dir) }));
  };

  return (
    <div className={styles.frame}>
      <Horizontal gap={8} align="center" className={styles.titleBar}>
        <Icon name="table" size="m" />
        <Typography variant="content-label">{name}</Typography>
        <span className={styles.draft}>Draft</span>
      </Horizontal>

      <div className={styles.toolbar}>
        <DataSheetToolbar
          expanded={false}
          onDownloadCsv={() => undefined}
          onUndo={() => undefined}
          onRedo={() => undefined}
          onSort={(d) => d !== 'clear' && sortActive(d === 'asc' ? 1 : -1)}
        />
      </div>

      <Horizontal gap={8} align="center" className={styles.formulaBar}>
        <span className={styles.cellRef}>{cell.ref}</span>
        <span className={styles.fx}>fx</span>
        <span className={styles.cellText}>{cell.text}</span>
      </Horizontal>

      <div className={`wbk ${styles.gridArea}`} style={vars as React.CSSProperties}>
        <div className={styles.gridWrap}>
          <Grid
            key={sheetName}
            ref={grid}
            ariaLabel={`${name}, ${sheetName}`}
            columns={sheet.columns}
            rows={sheet.rows}
            rowHeight="compact"
            showLetters
            frozenCols={blank ? 0 : 1}
            edits={NO_EDITS}
            cellErrors={NO_ERRORS}
            notices={NO_NOTICES}
            onNoticeDismiss={noop}
            busy={false}
            onEdit={onEdit}
            menuFor={() => COLUMN_MENU}
            onMenuAction={async (col, entry) => {
              if (entry.id === 'sort-asc' || entry.id === 'sort-desc') update((s) => ({ ...s, rows: sortRows(s.rows, col.id, entry.id === 'sort-asc' ? 1 : -1) }));
            }}
            addColumn={{
              items: ADD_COLUMN,
              onPick: async (entry) => {
                const id = `c${Date.now()}`;
                const formula = entry.id === 'formula';
                update((s) => ({
                  ...s,
                  columns: [...s.columns, {
                    id, title: formula ? 'New formula' : 'New input', dataType: formula ? 'number' : 'text', width: 128,
                    editable: formula ? { disabledReason: 'This column is calculated, so it can’t be typed over.' } : true,
                    badges: [formula ? { icon: 'fx', label: 'Formula column' } : { icon: 'input', label: 'Input column' }],
                  }],
                }));
                return id;
              },
            }}
            onRename={async (colId, title) => update((s) => ({ ...s, columns: s.columns.map((c) => (c.id === colId ? { ...c, title } : c)) }))}
            onSelectionChange={onAgg}
            onActiveCell={onActiveCell}
            statusRight={<span>{sheet.rows.length.toLocaleString()} rows</span>}
          />
        </div>
        <Footer sheets={sheets} active={active} agg={agg} onSwitch={(i) => setActive(i)} onAdd={addSheet} />
      </div>
    </div>
  );
};

export default WorkbookLive;
