import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import {
  DataEditor, GridCellKind, CompactSelection,
  type DataEditorRef, type EditableGridCell, type EditListItem, type FillPatternEventArgs, type GridCell,
  type GridColumn, type GridSelection, type Highlight, type Item, type Theme,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { useIsDarkMode } from '@/context/ThemeContext';
import { FormulaError, colLetter, type Result } from '../engine/formula';
import { colCount, rawOf, readOnlyReason, rowCount, shiftFormula, typeOf, valueOf, type ColType, type Workbook } from '../engine/workbook';

// The workbook's grid, drawn on a canvas (Glide Data Grid) so it stays sharp and fast at any size:
// smooth scrolling, instant selection, drag to select, fill handle, copy and paste, Excel keys.
// Google Sheets addressing: column letters above the titles, row 1 is the title row (the column
// header), data starts on row 2. Colours come from Radiant tokens, read at draw time.

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const tok = (n: string) => css(`--rd-sys-color-${n}`);

/** Canvas can't read CSS colour mixing, so tints are blended here from the token values. */
function rgb(c: string): [number, number, number, number] {
  const h = c.replace('#', '');
  if (/^[0-9a-f]{6,8}$/i.test(h)) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  const m = /rgba?\(([^)]+)\)/.exec(c);
  if (m) { const [r, g, b, a = '1'] = m[1].split(/[ ,/]+/); return [+r, +g, +b, +a]; }
  return [0, 0, 0, 1];
}
function mix(a: string, pct: number, b?: string): string {
  const [r1, g1, b1] = rgb(a);
  if (!b) return `rgba(${r1}, ${g1}, ${b1}, ${pct / 100})`;
  const [r2, g2, b2] = rgb(b);
  const f = pct / 100;
  return `rgb(${Math.round(r1 * f + r2 * (1 - f))}, ${Math.round(g1 * f + g2 * (1 - f))}, ${Math.round(b1 * f + b2 * (1 - f))})`;
}

function radiantTheme(): Partial<Theme> {
  const t = (n: string) => css(`--rd-sys-color-${n}`);
  return {
    accentColor: t('content-brand'),
    accentFg: t('background-base'),
    accentLight: mix(t('content-brand'), 12),
    textDark: t('content-primary'),
    textMedium: t('content-secondary'),
    textLight: t('content-tertiary'),
    textHeader: t('content-secondary'),
    textHeaderSelected: t('content-primary'),
    textGroupHeader: t('content-tertiary'),
    bgCell: t('background-base'),
    bgCellMedium: t('background-sunken'),
    bgHeader: t('background-base'),
    bgHeaderHasFocus: mix(t('content-brand'), 14, t('background-base')),
    bgHeaderHovered: t('background-sunken'),
    bgGroupHeader: t('background-base'),
    bgGroupHeaderHovered: t('background-sunken'),
    bgIconHeader: t('content-tertiary'),
    fgIconHeader: t('background-base'),
    bgBubble: t('background-sunken'),
    bgBubbleSelected: t('background-base'),
    bgSearchResult: mix(t('content-warning'), 30),
    borderColor: t('border-subtle'),
    horizontalBorderColor: t('border-subtle'),
    headerBottomBorderColor: t('border-default'),
    drilldownBorder: t('border-default'),
    linkColor: t('content-brand'),
    fontFamily: css('--font-family-primary'),
    baseFontStyle: '13px',
    headerFontStyle: '600 12px',
    markerFontStyle: '11px',
    editorFontSize: '13px',
    cellHorizontalPadding: 8,
    cellVerticalPadding: 3,
  };
}

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const general = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function display(v: Result, type: ColType | undefined, decimals?: number): string {
  if (v instanceof FormulaError) return v.detail === 'Not found' ? 'Not found' : v.code;
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') {
    const fixed = decimals === undefined ? null : new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (type === 'currency') return `${v < 0 ? '-' : ''}$${(fixed ?? money).format(Math.abs(v))}`;
    if (type === 'percent') return `${(v * 100).toFixed(decimals ?? 1)}%`;
    return (fixed ?? general).format(v);
  }
  return String(v);
}

/** A colour per referenced range while a formula is being edited, Google Sheets style. */
export const REF_COLORS = ['content-brand', 'content-failure', 'content-success', 'background-accent-purple-bold', 'content-warning'];

export interface SheetGridHandle {
  focus(): void;
  select(c: number, r: number): void;
}

export interface SheetGridProps {
  wb: Workbook;
  sheetId: string;
  selection: GridSelection;
  onSelection: (s: GridSelection) => void;
  /** One undo step: a batch of cell edits (col, sheet row, text). */
  onEdits: (edits: { c: number; r: number; text: string }[]) => void;
  /** Point mode: a click while a formula is being edited inserts the cell's reference. */
  onPointCell?: (c: number, r: number) => boolean;
  /** Ranges to outline in colour while a formula is edited. */
  refHighlights?: { c1: number; r1: number; c2: number; r2: number; color: number }[];
  onBlocked?: (reason: string) => void;
  /** Point mode on a column header: inserts a whole-column reference. */
  onPointColumn?: (c: number) => boolean;
  /** Ctrl+`: show formulas instead of values. */
  showFormulas?: boolean;
  /** Keys the workbook handles before the grid (=, Alt+=, Ctrl+D …). Return true to stop the grid. */
  onKey?: (e: { key: string; ctrl: boolean; alt: boolean; shift: boolean }) => boolean;
  showSearch?: boolean;
  onSearchClose?: () => void;
  /** The cell being edited shows the draft as it's typed, as in Sheets. */
  editingCell?: { c: number; r: number; text: string };
  /** Focus cell: shade the active cell's row and column, as Excel's View > Focus cell. */
  focus?: { c: number; r: number };
  /** Double-click a column header to rename it. */
  onRenameColumn?: (c: number) => void;
}

export const SheetGrid = forwardRef<SheetGridHandle, SheetGridProps>(function SheetGrid(
  { wb, sheetId, selection, onSelection, onEdits, onPointCell, refHighlights, onBlocked, onPointColumn, showFormulas, onKey, showSearch, onSearchClose, editingCell, focus, onRenameColumn },
  ref,
) {
  const isDark = useIsDarkMode();
  const editor = useRef<DataEditorRef>(null);
  const sheet = wb.sheets.find((s) => s.id === sheetId)!;
  const nCols = colCount(sheet);
  const nRows = rowCount(sheet) - 1; // grid rows start at sheet row 2

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const theme = useMemo(() => radiantTheme(), [isDark]);

  const columns = useMemo<GridColumn[]>(
    () =>
      Array.from({ length: nCols }, (_, c) => {
        const col = sheet.columns[c];
        const title = col?.title ?? sheet.cells[`${c},1`] ?? '';
        return { id: String(c), title, width: col?.width ?? 104, group: colLetter(c) };
      }),
    [sheet, nCols],
  );

  // Cell backgrounds, strongest first: conditional rules, typed input values, then focus cell.
  const scales = useMemo(() => (sheet.rules ?? []).filter((x) => x.kind === 'scale').map((rule) => {
    let min = Infinity;
    let max = -Infinity;
    for (let r = rule.r1; r <= rule.r2; r++) for (let c = rule.c1; c <= rule.c2; c++) {
      const v = valueOf(wb, sheet.name, c, r);
      if (typeof v === 'number') { min = Math.min(min, v); max = Math.max(max, v); }
    }
    return { rule, min, max };
  }), [sheet, wb]);

  const cellBackground = (c: number, r: number, v: unknown): Partial<Theme> => {
    const inside = (x: { c1: number; c2: number; r1: number; r2: number }) => c >= x.c1 && c <= x.c2 && r >= x.r1 && r <= x.r2;
    if (typeof v === 'number') {
      for (const { rule, min, max } of scales) {
        if (!inside(rule) || max <= min) continue;
        const t = (v - min) / (max - min);
        const base = tok('background-base');
        return { bgCell: t < 0.5 ? mix(tok('content-failure'), Math.round((0.5 - t) * 56), base) : mix(tok('content-success'), Math.round((t - 0.5) * 56), base) };
      }
      if (v < 0 && (sheet.rules ?? []).some((x) => x.kind === 'negative' && inside(x))) return { bgCell: mix(tok('content-failure'), 14, tok('background-base')) };
    }
    if (sheet.columns[c]?.input && r - 2 < sheet.rows.length) return { bgCell: mix(tok('content-brand'), 6, tok('background-base')) };
    if (focus && (focus.c === c || focus.r === r) && !(focus.c === c && focus.r === r)) return { bgCell: mix(tok('content-brand'), 5, tok('background-base')) };
    return {};
  };

  const getCellContent = useCallback(
    ([c, gr]: Item): GridCell => {
      const r = gr + 2;
      const raw = rawOf(sheet, c, r);
      const v = valueOf(wb, sheet.name, c, r);
      const drafting = editingCell && editingCell.c === c && editingCell.r === r;
      const fmt = sheet.formats?.[c];
      const text = drafting ? editingCell.text : showFormulas && raw.startsWith('=') ? raw : display(v, typeOf(sheet, c), fmt?.decimals);
      const numeric = typeof v === 'number';
      const blocked = readOnlyReason(wb, sheetId, c, r);
      const negative = numeric && (v as number) < 0;
      const error = v instanceof FormulaError;
      return {
        kind: GridCellKind.Text,
        data: raw,
        displayData: text,
        allowOverlay: !blocked,
        readonly: !!blocked,
        contentAlign: fmt?.align ?? (numeric && !drafting ? 'right' : 'left'),
        allowWrapping: fmt?.wrap,
        themeOverride: { ...cellBackground(c, r, v), ...(error || negative ? { textDark: tok('content-failure') } : {}) },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wb, sheet, sheetId, showFormulas, editingCell, focus, scales],
  );

  const onCellEdited = useCallback(([c, gr]: Item, v: EditableGridCell) => {
    if (v.kind !== GridCellKind.Text) return;
    onEdits([{ c, r: gr + 2, text: v.data }]);
  }, [onEdits]);

  const onCellsEdited = useCallback((items: readonly EditListItem[]) => {
    const edits = items
      .filter((it) => it.value.kind === GridCellKind.Text && !readOnlyReason(wb, sheetId, it.location[0], it.location[1] + 2))
      .map((it) => ({ c: it.location[0], r: it.location[1] + 2, text: (it.value as { data: string }).data }));
    if (edits.length) onEdits(edits);
    return true;
  }, [onEdits, wb, sheetId]);

  // Fill handle: formulas move their relative references, as in Sheets and Excel.
  const onFillPattern = useCallback((e: FillPatternEventArgs) => {
    e.preventDefault();
    const { patternSource: p, fillDestination: d } = e;
    const edits: { c: number; r: number; text: string }[] = [];
    for (let y = d.y; y < d.y + d.height; y++)
      for (let x = d.x; x < d.x + d.width; x++) {
        if (y >= p.y && y < p.y + p.height && x >= p.x && x < p.x + p.width) continue;
        const sy = p.y + ((((y - p.y) % p.height) + p.height) % p.height);
        const sx = p.x + ((((x - p.x) % p.width) + p.width) % p.width);
        const src = rawOf(sheet, sx, sy + 2);
        if (readOnlyReason(wb, sheetId, x, y + 2)) continue;
        edits.push({ c: x, r: y + 2, text: src.startsWith('=') ? shiftFormula(src, y - sy) : src });
      }
    if (edits.length) onEdits(edits);
  }, [sheet, wb, sheetId, onEdits]);

  const highlightRegions = useMemo<Highlight[] | undefined>(() =>
    refHighlights?.map((h) => ({
      color: mix(tok(REF_COLORS[h.color % REF_COLORS.length]), 14),
      range: { x: Math.min(h.c1, h.c2), y: Math.max(0, Math.min(h.r1, h.r2) - 2), width: Math.abs(h.c2 - h.c1) + 1, height: Math.abs(h.r2 - h.r1) + 1 },
      style: 'solid-outline' as const,
    })), [refHighlights]);

  useImperativeHandle(ref, () => ({
    focus: () => editor.current?.focus(),
    select: (c, r) => {
      onSelection({ current: { cell: [c, r - 2], range: { x: c, y: r - 2, width: 1, height: 1 }, rangeStack: [] }, columns: CompactSelection.empty(), rows: CompactSelection.empty() });
      editor.current?.scrollTo(c, r - 2);
      editor.current?.focus();
    },
  }), [onSelection]);

  return (
    <DataEditor
      ref={editor}
      width="100%"
      height="100%"
      theme={theme}
      columns={columns}
      rows={nRows}
      getCellContent={getCellContent}
      getGroupDetails={(name) => ({ name })}
      groupHeaderHeight={22}
      headerHeight={30}
      rowHeight={26}
      rowMarkers={{ kind: 'number', startIndex: 2, width: 44 }}
      freezeColumns={sheet.kind === 'live' ? 1 : 0}
      gridSelection={selection}
      onGridSelectionChange={onSelection}
      onCellEdited={onCellEdited}
      onCellsEdited={onCellsEdited}
      onFillPattern={onFillPattern}
      onCellClicked={([c, gr], e) => {
        if (onPointCell?.(c, gr + 2)) e.preventDefault();
        else {
          const reason = readOnlyReason(wb, sheetId, c, gr + 2);
          if (reason && e.isDoubleClick) onBlocked?.(reason);
        }
      }}
      onHeaderClicked={(c, e) => {
        if (onPointColumn?.(c)) { e.preventDefault(); return; }
        if (e.isDoubleClick) onRenameColumn?.(c);
      }}
      onKeyDown={(e) => {
        if (onKey?.({ key: e.key, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey })) e.cancel();
      }}
      showSearch={showSearch}
      onSearchClose={onSearchClose}
      highlightRegions={highlightRegions}
      fillHandle
      rangeSelect="multi-rect"
      columnSelect="multi"
      rowSelect="multi"
      getCellsForSelection
      onPaste
      editOnType
      smoothScrollX
      smoothScrollY
      overscrollX={0}
      overscrollY={0}
    />
  );
});

export default SheetGrid;
