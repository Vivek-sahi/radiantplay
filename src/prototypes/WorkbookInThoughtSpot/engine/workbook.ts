// The workbook model: several typed tabs, each a grid of cells (Google Sheets style addressing:
// row 1 is the header row, data starts on row 2). A Live tab's rows come from the data model; a
// formula typed beside them becomes one column formula for every row. Input tabs take typed
// values that write back; Local tabs live only in the workbook.
import { colIndex, colLetter, evaluate, FormulaError, parseRef, refsIn, type EvalContext, type Ref, type Result } from './formula';

/** app: an App tab Spotter builds from the workbook (Vivek, 3 Nov), rendered as an app, not a grid. */
export type SheetKind = 'live' | 'input' | 'local' | 'app';
export type ColType = 'text' | 'number' | 'currency' | 'percent' | 'date';

export interface Column {
  title: string;
  type: ColType;
  width: number;
  /** Comes from the data model: read-only on a Live tab. */
  fromModel?: boolean;
  /** A column formula anchored at row 2; relative rows shift for every row. */
  formula?: string;
  /** Typed values on an Input tab. */
  input?: boolean;
  /** An input table's key: its values say what each row stands for (Region, Month). Read-only. */
  key?: boolean;
  /** The tab a key column was brought from. */
  keyFrom?: string;
}

export interface Sheet {
  id: string;
  name: string;
  kind: SheetKind;
  columns: Column[];
  /** Data rows (row 2 onwards). Each row is one value per column. */
  rows: (string | number | null)[][];
  /** Free cells keyed "col,row": a typed value or a formula. */
  cells: Record<string, string>;
  /** Where the data comes from, for Workbook details. */
  source?: string;
  /** Formatting set from the toolbar, per column (Klimt and the product spreadsheet format by column). */
  formats?: Record<number, ColFormat>;
  /** Conditional formatting rules over ranges (sheet rows). */
  rules?: CondRule[];
  /** A pivot tab: its table is computed from another tab. */
  pivot?: PivotConfig;
  /** An App tab: what the app is for and who uses it. */
  app?: AppSpec;
  /** An input table: the warehouse table it saves to. */
  writesTo?: string;
  /** An input table: the rows as last saved to the warehouse, to count and discard unsaved changes. */
  savedRows?: (string | number | null)[][];
  /** An input table whose columns are joined onto another tab (by the keys). */
  joinedTo?: string;
}

export interface AppSpec {
  title: string;
  audience: string;
  /** The input tab the app writes to. */
  writesTo: string;
  /** Table style, named like Excel's: light, banded (Medium) or dark header (Dark). */
  style?: 'light' | 'banded' | 'dark';
}

export interface ColFormat {
  type?: ColType;
  decimals?: number;
  align?: 'left' | 'center' | 'right';
  wrap?: boolean;
}

export interface CondRule {
  c1: number; c2: number; r1: number; r2: number;
  /** scale: red–white–green colour scale; negative: red fill below zero. */
  kind: 'scale' | 'negative';
}

export function setFormat(wb: Workbook, sheetId: string, cols: number[], patch: (f: ColFormat, c: number) => ColFormat): Workbook {
  return {
    ...wb,
    sheets: wb.sheets.map((s) => {
      if (s.id !== sheetId) return s;
      const formats = { ...(s.formats ?? {}) };
      for (const c of cols) formats[c] = patch(formats[c] ?? {}, c);
      return { ...s, formats };
    }),
  };
}

export function addRule(wb: Workbook, sheetId: string, rule: CondRule | null): Workbook {
  return {
    ...wb,
    sheets: wb.sheets.map((s) => (s.id === sheetId ? { ...s, rules: rule ? [...(s.rules ?? []), rule] : [] } : s)),
  };
}

/** The type a column displays as: what the toolbar set, else what the column is. */
export const typeOf = (s: Sheet, c: number): ColType | undefined => s.formats?.[c]?.type ?? s.columns[c]?.type;

export interface Workbook {
  name: string;
  model: string;
  sheets: Sheet[];
  /** Named cells and ranges: name → reference text, e.g. growth_rate → Assumptions!$B$1. */
  names: Record<string, string>;
}

export const EXTRA_ROWS = 40;
export const EXTRA_COLS = 6;

export const key = (c: number, r: number) => `${c},${r}`;
export const lastDataRow = (s: Sheet) => s.rows.length + 1;
export const rowCount = (s: Sheet) => Math.max(s.rows.length + EXTRA_ROWS, 60);
/** Columns in use: the defined ones, and any free cell typed past them. */
export const usedCols = (s: Sheet) => Math.max(s.columns.length, ...Object.keys(s.cells).map((k) => Number(k.split(',')[0]) + 1));
/** Live and Input tabs are tables: only the columns there are, then a thin + to add one (Vivek, 4 Nov).
 *  Local tabs stay an open grid, as in Sheets. */
export const colCount = (s: Sheet) => usedCols(s) + (s.kind === 'local' ? EXTRA_COLS : 0);

/** The raw text the user would edit in a cell: a formula, a typed value or a model value. */
export function rawOf(s: Sheet, c: number, r: number): string {
  if (r === 1) return s.columns[c]?.title ?? s.cells[key(c, 1)] ?? '';
  const free = s.cells[key(c, r)];
  if (free !== undefined) return free;
  const col = s.columns[c];
  const di = r - 2;
  if (col && di < s.rows.length) {
    if (col.formula) return shiftFormula(col.formula, di);
    const v = s.rows[di]?.[c];
    return v === null || v === undefined ? '' : String(v);
  }
  return '';
}

/** A column formula shown for row r: relative rows moved down by `by`, as fill down would. */
export function shiftFormula(f: string, by: number): string {
  if (!by) return f;
  return f.replace(/((?:'[^']+'|[A-Za-z_][\w.]*)!)?(\$?[A-Za-z]{1,3})(\$?)(\d+)/g, (m, sh = '', c, d, r) =>
    d ? m : `${sh}${c}${parseInt(r, 10) + by}`,
  );
}

export function makeContext(wb: Workbook, sheetName: string, seen = new Set<string>()): EvalContext {
  const byName = (n: string) => wb.sheets.find((s) => s.name.toLowerCase() === n.toLowerCase());
  return {
    sheet: sheetName,
    lastRow: (n) => { const s = byName(n); return s ? lastDataRow(s) : 1; },
    name: (n) => { const t = wb.names[n] ?? wb.names[Object.keys(wb.names).find((k) => k.toLowerCase() === n.toLowerCase()) ?? '']; return t ? parseRef(t) : null; },
    get: (n, c, r) => valueOf(wb, n, c, r, seen),
  };
}

/** The computed value of a cell. */
export function valueOf(wb: Workbook, sheetName: string, c: number, r: number, seen = new Set<string>()): Result {
  const s = wb.sheets.find((x) => x.name.toLowerCase() === sheetName.toLowerCase());
  if (!s) return new FormulaError('#REF!');
  const id = `${s.name}!${c},${r}`;
  if (seen.has(id)) return new FormulaError('#CYCLE!');
  if (r === 1) return s.columns[c]?.title ?? literal(s.cells[key(c, 1)]);
  const free = s.cells[key(c, r)];
  const col = s.columns[c];
  const di = r - 2;
  let f: string | undefined;
  let rowShift = 0;
  if (free !== undefined) {
    if (!free.startsWith('=')) return literal(free);
    f = free;
  } else if (col && di < s.rows.length) {
    if (!col.formula) return s.rows[di]?.[c] ?? null;
    f = col.formula;
    rowShift = di;
  } else return null;
  const next = new Set(seen);
  next.add(id);
  return evaluate(f, { ...makeContext(wb, s.name, next), rowShift });
}

export function literal(v: string | undefined): Result {
  if (v === undefined || v === '') return null;
  const t = v.trim();
  if (/^-?\$?[\d,]*\.?\d+%?$/.test(t)) {
    const n = Number(t.replace(/[$,%]/g, ''));
    if (!Number.isNaN(n)) return t.endsWith('%') ? n / 100 : n;
  }
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
  return v;
}

export function refFor(sheet: Sheet | undefined, c: number, r: number, current?: string): Ref & { text: string } {
  const ref: Ref = { sheet: sheet && sheet.name !== current ? sheet.name : undefined, c1: c, r1: r, c2: c, r2: r };
  const sh = ref.sheet ? `${/\s/.test(ref.sheet) ? `'${ref.sheet}'` : ref.sheet}!` : '';
  let letters = '';
  let n = c + 1;
  while (n > 0) { const m = (n - 1) % 26; letters = String.fromCharCode(65 + m) + letters; n = Math.floor((n - 1) / 26); }
  return { ...ref, text: `${sh}${letters}${r}` };
}

// ── Edits, all immutable so undo is a stack of workbooks ─────────────────────

export interface EditOutcome {
  wb: Workbook;
  /** What the workbook did with the edit, said once in the formula bar. */
  note?: string;
  /** The value didn't go in (wrong type for the column). */
  rejected?: boolean;
}

const updateSheet = (wb: Workbook, id: string, fn: (s: Sheet) => Sheet): Workbook => ({
  ...wb,
  sheets: wb.sheets.map((s) => (s.id === id ? fn(s) : s)),
});

export function setCell(wb: Workbook, sheetId: string, c: number, r: number, text: string): EditOutcome {
  const s = wb.sheets.find((x) => x.id === sheetId)!;
  const di = r - 2;
  const col = s.columns[c];

  // Header row: renames a column, or types a header for a free column.
  if (r === 1) {
    if (col) return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, columns: x.columns.map((k, i) => (i === c ? { ...k, title: text } : k)) })) };
    return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, cells: { ...x.cells, [key(c, 1)]: text } })) };
  }

  // On a Live tab, a same-row formula typed beside the data becomes one column formula.
  if (s.kind === 'live' && di >= 0 && di < s.rows.length && text.startsWith('=')) {
    const anchored = shiftFormula(text, -di);
    // An empty column (past the data, or one inserted from the column menu) takes the formula for every row.
    const blank = !col || (!col.fromModel && !col.formula && !col.input && s.rows.every((row) => row[c] === null || row[c] === undefined));
    if (blank) {
      const n = s.columns.filter((k) => k.formula).length + 1;
      const columns = [...s.columns];
      while (columns.length < c) columns.push({ title: '', type: 'text', width: 120 });
      // Formatting follows the columns it uses: revenue − cost stays currency; a ratio becomes a percent.
      const used = (anchored.match(/\b([A-Z]{1,3})\d+/g) ?? []).map((m) => s.columns[colIndex(m.replace(/\d+/g, ''))]?.type);
      const type: ColType = /\//.test(anchored) && used.every((t) => t === 'currency') && used.length >= 2 ? 'percent' : used.includes('currency') ? 'currency' : 'number';
      columns[c] = { title: col?.title || `Formula ${n}`, type, width: 128, formula: anchored };
      const rows = s.rows.map((row) => { const x = [...row]; while (x.length <= c) x.push(null); return x; });
      return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, columns, rows })), note: `Saved as one column formula for all ${s.rows.length.toLocaleString()} rows` };
    }
    if (col?.formula) {
      return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, columns: x.columns.map((k, i) => (i === c ? { ...k, formula: anchored } : k)) })), note: `Column formula updated for all ${s.rows.length.toLocaleString()} rows` };
    }
  }

  // An input column checks what's typed against its type, and typing below the last row adds rows.
  if (s.kind === 'input' && col?.input && di >= 0) {
    const v = literal(text);
    if (text.trim() !== '' && col.type !== 'text' && col.type !== 'date' && typeof v !== 'number')
      return { wb, note: `${col.title} takes ${col.type === 'percent' ? 'percentages' : 'numbers'}. “${text}” wasn't added (row ${r}).`, rejected: true };
    return {
      wb: updateSheet(wb, sheetId, (x) => {
        const rows = x.rows.map((row) => [...row]);
        while (rows.length <= di) rows.push(x.columns.map(() => null));
        rows[di][c] = v as string | number | null;
        return { ...x, rows };
      }),
    };
  }

  // Typed values in an Input column or anywhere on Input / Local tabs, and below the data.
  if (col && di >= 0 && di < s.rows.length && !col.formula && (col.input || s.kind !== 'live')) {
    return {
      wb: updateSheet(wb, sheetId, (x) => ({
        ...x,
        rows: x.rows.map((row, i) => (i === di ? row.map((v, j) => (j === c ? (literal(text) as string | number | null) : v)) : row)),
      })),
    };
  }

  const note = s.kind === 'live' && text.startsWith('=') && /\b[A-Z]{1,3}:[A-Z]{1,3}\b/i.test(text) ? 'Whole-column total, computed in the warehouse' : undefined;
  return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, cells: { ...x.cells, [key(c, r)]: text } })), note };
}

/** Can the user type here? A reason when not. */
export function readOnlyReason(wb: Workbook, sheetId: string, c: number, r: number): string | null {
  const s = wb.sheets.find((x) => x.id === sheetId)!;
  const col = s.columns[c];
  const di = r - 2;
  if (s.pivot && col && di >= 0 && di < s.rows.length) return 'Pivot values update from the field panel on the right.';
  if (s.kind === 'input' && col?.key && di >= 0 && di < s.rows.length)
    return `${col.title} is a key${col.keyFrom ? ` from ${col.keyFrom}` : ''}: it says what each row stands for. Type in the other columns.`;
  if (s.kind === 'live' && col?.fromModel && di >= 0 && di < s.rows.length)
    return `${col.title} comes from the ${wb.model} model. Type in an empty column, or on an Input or Local tab.`;
  return null;
}

export function addSheet(wb: Workbook, kind: SheetKind): { wb: Workbook; id: string } {
  const n = wb.sheets.length + 1;
  const id = `s${Date.now()}`;
  // Sheets numbers new sheets by count; input tables are numbered among themselves.
  let name = kind === 'local' ? `Sheet ${n}` : `Input table ${wb.sheets.filter((s) => s.kind === 'input').length + 1}`;
  let k = 2;
  while (wb.sheets.some((s) => s.name === name)) name = `${name.replace(/ \(\d+\)$/, '')} (${k++})`;
  return { wb: { ...wb, sheets: [...wb.sheets, { id, name, kind, columns: [], rows: [], cells: {} }] }, id };
}

/** Adds an App tab after the last sheet. */
export function addAppSheet(wb: Workbook, app: AppSpec): { wb: Workbook; id: string } {
  const id = `a${Date.now()}`;
  return { wb: { ...wb, sheets: [...wb.sheets, { id, name: app.title, kind: 'app', columns: [], rows: [], cells: {}, app, source: `App · writes to ${app.writesTo}` }] }, id };
}

/** A local tab becomes an input table: its values save to the warehouse and pin live. */
export function makeInputSheet(wb: Workbook, sheetId: string, source: string): Workbook {
  return { ...wb, sheets: wb.sheets.map((s) => (s.id === sheetId ? { ...s, kind: 'input', source } : s)) };
}

export function defineName(wb: Workbook, name: string, refText: string): Workbook {
  return { ...wb, names: { ...wb.names, [name]: refText } };
}

// ── Sheet-level operations (the tab ▾ menu) ───────────────────────────────────

const quoteName = (n: string) => (/[\s!']/.test(n) ? `'${n.replace(/'/g, "''")}'` : n);

/** Rename a tab and every formula that points at it, as Sheets and Excel do. */
export function renameSheet(wb: Workbook, id: string, name: string): Workbook {
  const old = wb.sheets.find((s) => s.id === id);
  if (!old || !name || wb.sheets.some((s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) return wb;
  const pattern = new RegExp(`(^|[^\\w'])(?:'${old.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'|${old.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})!`, 'g');
  const fix = (f: string) => (f.startsWith('=') ? f.replace(pattern, (_m, pre) => `${pre}${quoteName(name)}!`) : f);
  return {
    ...wb,
    sheets: wb.sheets.map((s) => ({
      ...(s.id === id ? { ...s, name } : s),
      cells: Object.fromEntries(Object.entries(s.cells).map(([k, v]) => [k, fix(v)])),
      columns: s.columns.map((c) => (c.formula ? { ...c, formula: fix(c.formula) } : c)),
    })),
    names: Object.fromEntries(Object.entries(wb.names).map(([n, r]) => [n, fix(`=${r}`).slice(1)])),
  };
}

export function duplicateSheet(wb: Workbook, id: string): { wb: Workbook; id: string } {
  const i = wb.sheets.findIndex((s) => s.id === id);
  const src = wb.sheets[i];
  let n = 1;
  let name = `Copy of ${src.name}`;
  while (wb.sheets.some((s) => s.name === name)) name = `Copy of ${src.name} (${++n})`;
  const copy: Sheet = { ...src, id: `s${Date.now()}`, name, kind: src.kind === 'input' ? 'local' : src.kind };
  const sheets = [...wb.sheets];
  sheets.splice(i + 1, 0, copy);
  return { wb: { ...wb, sheets }, id: copy.id };
}

export function moveSheet(wb: Workbook, id: string, by: -1 | 1): Workbook {
  const i = wb.sheets.findIndex((s) => s.id === id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= wb.sheets.length) return wb;
  const sheets = [...wb.sheets];
  [sheets[i], sheets[j]] = [sheets[j], sheets[i]];
  return { ...wb, sheets };
}

export function deleteSheet(wb: Workbook, id: string): Workbook {
  if (wb.sheets.length < 2) return wb;
  return { ...wb, sheets: wb.sheets.filter((s) => s.id !== id) };
}

/** A tab as CSV: header row, then the computed values. */
export function sheetCsv(wb: Workbook, id: string): string {
  const s = wb.sheets.find((x) => x.id === id)!;
  let width = s.columns.length;
  let height = s.rows.length + 1;
  for (const k of Object.keys(s.cells)) { const [c, r] = k.split(',').map(Number); width = Math.max(width, c + 1); height = Math.max(height, r); }
  const out: string[] = [];
  for (let r = 1; r <= height; r++) {
    const row: string[] = [];
    for (let c = 0; c < width; c++) {
      const v = valueOf(wb, s.name, c, r);
      const t = v instanceof FormulaError ? v.code : v === null ? '' : String(v);
      row.push(/[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t);
    }
    out.push(row.join(','));
  }
  return out.join('\n');
}

// ── Pinning: live or snapshot ─────────────────────────────────────────────────

/**
 * A pinned range stays live when every value in it can be expressed as a query on the data model:
 * Live and Input tabs, and formulas over them. Anything that reads a Local tab, a named value that
 * lives on one, or a typed number on a Local tab, pins as a snapshot (PM brief, screen 13).
 */
export function pinLiveness(wb: Workbook, sheetId: string, range: { c1: number; c2: number; r1: number; r2: number }): { live: boolean; reason?: string } {
  const s = wb.sheets.find((x) => x.id === sheetId)!;
  const localSheets = new Set(wb.sheets.filter((x) => x.kind === 'local').map((x) => x.name.toLowerCase()));
  const localNames = Object.entries(wb.names).filter(([, t]) => { const r = parseRef(t); return !!r && localSheets.has((r.sheet ?? '').toLowerCase()); }).map(([n]) => n);
  for (let r = range.r1; r <= range.r2; r++) {
    for (let c = range.c1; c <= range.c2; c++) {
      const raw = rawOf(s, c, r);
      if (!raw) continue;
      if (raw.startsWith('=')) {
        const name = localNames.find((n) => new RegExp(`\\b${n}\\b`, 'i').test(raw));
        if (name) return { live: false, reason: `This uses local data (${name}), so it pins as a snapshot. Move ${name} into an input table to pin it live.` };
        const sheetRef = [...raw.matchAll(/(?:'([^']+)'|([A-Za-z_][\w.]*))!/g)].map((m) => (m[1] ?? m[2]).toLowerCase()).find((n) => localSheets.has(n));
        if (sheetRef) return { live: false, reason: `This reads a local tab, so it pins as a snapshot. Move those values into an input table to pin it live.` };
      } else if (s.kind === 'local' && r > 1 && typeof literal(raw) === 'number') {
        return { live: false, reason: 'This has numbers typed on a local tab, so it pins as a snapshot. Put them in an input table to pin it live.' };
      }
    }
  }
  return { live: true };
}

/** Sort a Live or Input tab's rows by one column. Free cells stay where they are. */
export function sortRows(wb: Workbook, sheetId: string, c: number, dir: 1 | -1): Workbook {
  return {
    ...wb,
    sheets: wb.sheets.map((s) => {
      if (s.id !== sheetId || !s.rows.length) return s;
      const rows = [...s.rows].sort((a, b) => {
        const x = a[c]; const y = b[c];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        return (x > y ? 1 : -1) * dir;
      });
      return { ...s, rows };
    }),
  };
}

// ── Pivot tables (Google Sheets' model) ──────────────────────────────────────

export type PivotAgg = 'sum' | 'count' | 'average' | 'min' | 'max';
export type PivotShow = 'default' | 'row' | 'column' | 'total';
export interface PivotGroup { field: string; order: 'asc' | 'desc'; totals: boolean }
export interface PivotValue { field: string; agg: PivotAgg; show: PivotShow }
export interface PivotFilter { field: string; hidden: string[] }
export interface PivotConfig {
  sourceId: string;
  /** The source range as typed in the create dialog, e.g. Finance!A1:H1153. */
  range: string;
  rows: PivotGroup[];
  columns: PivotGroup[];
  values: PivotValue[];
  filters: PivotFilter[];
}

export const AGG_LABEL: Record<PivotAgg, string> = { sum: 'SUM', count: 'COUNT', average: 'AVERAGE', min: 'MIN', max: 'MAX' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Fields a pivot can use: the source's columns, plus Quarter and Year when it has a Month. */
export function pivotFields(src: Sheet): { name: string; numeric: boolean }[] {
  const fields = src.columns.map((c) => ({ name: c.title, numeric: c.type === 'currency' || c.type === 'number' || c.type === 'percent' }));
  if (src.columns.some((c) => c.type === 'date')) fields.push({ name: 'Quarter', numeric: false }, { name: 'Year', numeric: false });
  return fields;
}

export function fieldValue(src: Sheet, row: (string | number | null)[], field: string): string | number | null {
  const i = src.columns.findIndex((c) => c.title === field);
  if (i >= 0) return row[i] ?? null;
  const d = src.columns.findIndex((c) => c.type === 'date');
  const m = d >= 0 ? /^([A-Za-z]{3}) (\d{4})$/.exec(String(row[d] ?? '')) : null;
  if (!m) return null;
  if (field === 'Year') return m[2];
  if (field === 'Quarter') return `Q${Math.floor(MONTHS.indexOf(m[1]) / 3) + 1} ${m[2]}`;
  return null;
}

/** Distinct values of a field, in display order (for filters). */
export function fieldItems(src: Sheet, field: string): string[] {
  return [...new Set(src.rows.map((r) => String(fieldValue(src, r, field) ?? '')))].sort(byOrder);
}

// Time fields sort in date order (Q4 2024 before Q1 2025), everything else alphabetically.
function orderOf(k: string): number | null {
  const q = /^Q(\d) (\d{4})$/.exec(k);
  if (q) return Number(q[2]) * 100 + Number(q[1]);
  const m = /^([A-Za-z]{3}) (\d{4})$/.exec(k);
  if (m && MONTHS.includes(m[1])) return Number(m[2]) * 100 + MONTHS.indexOf(m[1]);
  if (/^\d{4}$/.test(k)) return Number(k) * 100;
  return null;
}
function byOrder(a: string, b: string): number {
  const x = orderOf(a); const y = orderOf(b);
  return x !== null && y !== null ? x - y : a.localeCompare(b);
}

interface Acc { sum: number; n: number; min: number; max: number }
const accOf = (a: Acc | undefined, agg: PivotAgg): number | null => {
  if (!a || !a.n) return null;
  switch (agg) { case 'sum': return a.sum; case 'count': return a.n; case 'average': return a.sum / a.n; case 'min': return a.min; case 'max': return a.max; }
};

/** Compute a pivot into columns and rows (read-only; recomputed whenever the config changes). */
export function buildPivot(wb: Workbook, cfg: PivotConfig): { columns: Column[]; rows: (string | number | null)[][] } {
  const src = wb.sheets.find((s) => s.id === cfg.sourceId);
  if (!src || (!cfg.rows.length && !cfg.columns.length && !cfg.values.length)) return { columns: [], rows: [] };
  const sep = '\u0001';
  const rowsIn = src.rows.filter((r) => cfg.filters.every((f) => !f.hidden.includes(String(fieldValue(src, r, f.field) ?? ''))));
  const keyOf = (r: (string | number | null)[], groups: PivotGroup[]) => groups.map((g) => String(fieldValue(src, r, g.field) ?? '')).join(sep);
  const sortKeys = (keys: string[], groups: PivotGroup[]) => keys.sort((a, b) => {
    const pa = a.split(sep); const pb = b.split(sep);
    for (let i = 0; i < groups.length; i++) { const d = byOrder(pa[i] ?? '', pb[i] ?? ''); if (d) return groups[i].order === 'desc' ? -d : d; }
    return 0;
  });
  const rowKeys = sortKeys([...new Set(rowsIn.map((r) => keyOf(r, cfg.rows)))], cfg.rows);
  const colKeys = cfg.columns.length ? sortKeys([...new Set(rowsIn.map((r) => keyOf(r, cfg.columns)))], cfg.columns) : [];

  // One accumulator per (row key | column key | value), plus row, column and grand totals ('*').
  const acc = new Map<string, Acc>();
  const add = (id: string, x: number) => {
    const a = acc.get(id) ?? { sum: 0, n: 0, min: Infinity, max: -Infinity };
    a.sum += x; a.n += 1; a.min = Math.min(a.min, x); a.max = Math.max(a.max, x);
    acc.set(id, a);
  };
  cfg.values.forEach((v, vi) => {
    const ci = src.columns.findIndex((c) => c.title === v.field);
    for (const r of rowsIn) {
      const x = typeof r[ci] === 'number' ? (r[ci] as number) : 0;
      const rk = keyOf(r, cfg.rows); const ck = keyOf(r, cfg.columns);
      for (const id of [`${rk}|${ck}`, `${rk}|*`, `*|${ck}`, '*|*']) add(`${id}|${vi}`, x);
    }
  });
  const cell = (rk: string, ck: string, vi: number): number | null => {
    const v = cfg.values[vi];
    const x = accOf(acc.get(`${rk}|${ck}|${vi}`), v.agg);
    if (x === null || v.show === 'default') return x;
    const base = v.show === 'row' ? accOf(acc.get(`${rk}|*|${vi}`), v.agg) : v.show === 'column' ? accOf(acc.get(`*|${ck}|${vi}`), v.agg) : accOf(acc.get(`*|*|${vi}`), v.agg);
    return base ? x / base : null;
  };
  const typeFor = (vi: number): ColType => {
    const v = cfg.values[vi];
    if (v.show !== 'default') return 'percent';
    if (v.agg === 'count') return 'number';
    return src.columns.find((c) => c.title === v.field)?.type ?? 'number';
  };
  const valueName = (v: PivotValue) => `${AGG_LABEL[v.agg]} of ${v.field}`;

  const columns: Column[] = cfg.rows.map((g) => ({ title: g.field, type: 'text', width: 140, fromModel: true }));
  const colSpecs: { ck: string; vi: number }[] = [];
  const showColTotals = cfg.columns.length > 0 && (cfg.columns[0]?.totals ?? true);
  for (const ck of colKeys.length ? [...colKeys, ...(showColTotals ? ['*'] : [])] : ['*'])
    cfg.values.forEach((v, vi) => {
      colSpecs.push({ ck, vi });
      const label = ck === '*' ? (colKeys.length ? `Grand total${cfg.values.length > 1 ? ` · ${valueName(v)}` : ''}` : valueName(v)) : `${ck.split(sep).join(' · ')}${cfg.values.length > 1 ? ` · ${valueName(v)}` : ''}`;
      columns.push({ title: label, type: typeFor(vi), width: 150, fromModel: true });
    });

  const body = (cfg.rows.length ? rowKeys : ['']).map((rk) => [
    ...(cfg.rows.length ? rk.split(sep) : []),
    ...colSpecs.map(({ ck, vi }) => cell(cfg.rows.length ? rk : '*', ck, vi)),
  ]);
  const rows = cfg.rows.length ? body : [[...colSpecs.map(({ ck, vi }) => cell('*', ck, vi))]];
  if (cfg.rows.length && (cfg.rows[0]?.totals ?? true)) rows.push([...cfg.rows.map((_, i) => (i === 0 ? 'Grand total' : null)), ...colSpecs.map(({ ck, vi }) => cell('*', ck, vi))]);
  if (!cfg.values.length) return { columns: columns.slice(0, cfg.rows.length), rows: rowKeys.map((rk) => rk.split(sep)) };
  return { columns, rows };
}

export function setPivot(wb: Workbook, sheetId: string, cfg: PivotConfig): Workbook {
  const built = buildPivot(wb, cfg);
  return { ...wb, sheets: wb.sheets.map((s) => (s.id === sheetId ? { ...s, pivot: cfg, columns: built.columns, rows: built.rows, cells: {} } : s)) };
}

/** The create dialog's default data range for a tab: the whole table, header included. */
export function sheetRange(s: Sheet): string {
  let letters = ''; let n = Math.max(1, s.columns.length);
  while (n > 0) { const m = (n - 1) % 26; letters = String.fromCharCode(65 + m) + letters; n = Math.floor((n - 1) / 26); }
  return `${/\s/.test(s.name) ? `'${s.name}'` : s.name}!A1:${letters}${s.rows.length + 1}`;
}

/** Insert > Pivot table: an EMPTY pivot on a new sheet beside the source, or on an existing empty sheet. */
export function createPivot(wb: Workbook, sourceId: string, range: string, targetId?: string): { wb: Workbook; id: string } {
  const src = wb.sheets.find((s) => s.id === sourceId)!;
  const cfg: PivotConfig = { sourceId, range, rows: [], columns: [], values: [], filters: [] };
  if (targetId) {
    return { wb: { ...wb, sheets: wb.sheets.map((s) => (s.id === targetId ? { ...s, kind: 'live', pivot: cfg, columns: [], rows: [], cells: {}, source: `Pivot of ${src.name}` } : s)) }, id: targetId };
  }
  let n = 1;
  while (wb.sheets.some((s) => s.name === `Pivot table ${n}`)) n++;
  const id = `p${Date.now()}`;
  const sheet: Sheet = { id, name: `Pivot table ${n}`, kind: 'live', columns: [], rows: [], cells: {}, source: `Pivot of ${src.name}`, pivot: cfg };
  const i = wb.sheets.findIndex((s) => s.id === sourceId);
  const sheets = [...wb.sheets];
  sheets.splice(i + 1, 0, sheet);
  return { wb: { ...wb, sheets }, id };
}

// ── Upload ────────────────────────────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** A CSV becomes a Local tab: first row is the header, number columns are detected. */
export function addCsvSheet(wb: Workbook, fileName: string, text: string): { wb: Workbook; id: string; rows: number } {
  const [head = [], ...body] = parseCsv(text);
  const width = Math.max(head.length, ...body.map((r) => r.length));
  const columns: Column[] = Array.from({ length: width }, (_, c) => {
    const vals = body.map((r) => r[c]).filter((v) => v !== undefined && v.trim() !== '');
    const numeric = vals.length > 0 && vals.every((v) => typeof literal(v) === 'number');
    return { title: head[c] || `Column ${c + 1}`, type: numeric ? 'number' : 'text', width: 128, input: true };
  });
  const rows = body.map((r) => columns.map((col, c) => { const v = r[c] ?? ''; return col.type === 'number' ? (literal(v) as number) : v; }));
  let name = fileName.replace(/\.[^.]+$/, '');
  let n = 2;
  while (wb.sheets.some((s) => s.name === name)) name = `${fileName.replace(/\.[^.]+$/, '')} (${n++})`;
  const id = `u${Date.now()}`;
  return { wb: { ...wb, sheets: [...wb.sheets, { id, name, kind: 'local', columns, rows, cells: {}, source: `Uploaded from ${fileName}` }] }, id, rows: rows.length };
}

// ── Column operations (the column header ▾ menu, Vivek, 4 Nov) ───────────────
// Insert, remove and duplicate move everything to the right of the change, and every formula,
// name and formatting rule that points there, the way Sheets and Excel do. A reference to a removed
// column becomes #REF!.

const sheetOfPrefix = (p: string | undefined) => (p ? p.slice(0, -1).replace(/^'(.*)'$/, '$1').replace(/''/g, "'") : undefined);

function moveColumnRefs(f: string, formulaSheet: string, target: string, at: number, by: 1 | -1): string {
  if (!f.startsWith('=')) return f;
  let out = '';
  let last = 0;
  for (const r of refsIn(f)) {
    const raw = f.slice(r.start, r.end);
    const m = /^((?:'[^']*(?:''[^']*)*'|[A-Za-z_][\w.]*)!)?(.*)$/.exec(raw)!;
    const onSheet = (sheetOfPrefix(m[1]) ?? formulaSheet).toLowerCase() === target.toLowerCase();
    out += f.slice(last, r.start);
    last = r.end;
    if (!onSheet) { out += raw; continue; }
    const ends = [...m[2].matchAll(/(\$?)([A-Za-z]{1,3})/g)].map((x) => colIndex(x[2]));
    let a = ends[0];
    let b = ends[ends.length - 1];
    if (by === 1) { if (a >= at) a++; if (b >= at) b++; }
    else {
      if (a > at) a--;
      if (b >= at) b--;
      if (b < a || (ends.length === 1 && ends[0] === at)) { out += '#REF!'; continue; }
    }
    let i = 0;
    const body = m[2].replace(/(\$?)([A-Za-z]{1,3})/g, (_x, d) => `${d}${colLetter(i++ === 0 ? a : b)}`);
    out += `${m[1] ?? ''}${body}`;
  }
  return out + f.slice(last);
}

/** Moves column-keyed things on one sheet (cells, formats, rules) and references across the workbook. */
function reshapeColumns(wb: Workbook, sheetId: string, at: number, by: 1 | -1): Workbook {
  const target = wb.sheets.find((s) => s.id === sheetId)!;
  const moveIdx = (c: number) => (by === 1 ? (c >= at ? c + 1 : c) : c > at ? c - 1 : c === at ? null : c);
  const fix = (f: string, sheetName: string) => moveColumnRefs(f, sheetName, target.name, at, by);
  const sheets = wb.sheets.map((s) => {
    let next: Sheet = {
      ...s,
      cells: Object.fromEntries(Object.entries(s.cells).map(([k, v]) => [k, fix(v, s.name)])),
      columns: s.columns.map((c) => (c.formula ? { ...c, formula: fix(c.formula, s.name) } : c)),
    };
    if (s.id !== sheetId) return next;
    const cells: Record<string, string> = {};
    for (const [k, v] of Object.entries(next.cells)) {
      const [c, r] = k.split(',').map(Number);
      const nc = moveIdx(c);
      if (nc !== null) cells[key(nc, r)] = v;
    }
    const formats: Record<number, ColFormat> = {};
    for (const [k, v] of Object.entries(next.formats ?? {})) { const nc = moveIdx(Number(k)); if (nc !== null) formats[nc] = v; }
    const rules = (next.rules ?? []).flatMap((rule) => {
      const c1 = by === 1 ? (rule.c1 >= at ? rule.c1 + 1 : rule.c1) : rule.c1 > at ? rule.c1 - 1 : rule.c1;
      const c2 = by === 1 ? (rule.c2 >= at ? rule.c2 + 1 : rule.c2) : rule.c2 >= at ? rule.c2 - 1 : rule.c2;
      return c2 < c1 ? [] : [{ ...rule, c1, c2 }];
    });
    const columns = [...next.columns];
    let rows = next.rows;
    if (at < columns.length) {
      if (by === 1) {
        columns.splice(at, 0, { title: '', type: 'text', width: 120 });
        rows = rows.map((row) => { const x = [...row]; x.splice(at, 0, null); return x; });
      } else {
        columns.splice(at, 1);
        rows = rows.map((row) => { const x = [...row]; x.splice(at, 1); return x; });
      }
    }
    next = { ...next, cells, formats, rules, columns, rows };
    return next;
  });
  const names = Object.fromEntries(Object.entries(wb.names).map(([n, r]) => [n, moveColumnRefs(`=${r}`, '', target.name, at, by).slice(1)]));
  return { ...wb, sheets, names };
}

export const insertColumn = (wb: Workbook, sheetId: string, at: number): Workbook => reshapeColumns(wb, sheetId, at, 1);
export const removeColumn = (wb: Workbook, sheetId: string, at: number): Workbook => reshapeColumns(wb, sheetId, at, -1);

/** A copy of column c, right beside it: same title (with "copy"), values, formula and format. */
export function duplicateColumn(wb: Workbook, sheetId: string, c: number): Workbook {
  const next = insertColumn(wb, sheetId, c + 1);
  return updateSheet(next, sheetId, (s) => {
    const cells = { ...s.cells };
    for (const [k, v] of Object.entries(s.cells)) {
      const [kc, r] = k.split(',').map(Number);
      if (kc === c) cells[key(c + 1, r)] = r === 1 ? `${v} copy` : v;
    }
    const columns = [...s.columns];
    if (columns[c]) columns[c + 1] = { ...columns[c], title: `${columns[c].title} copy` };
    const rows = s.rows.map((row) => { const x = [...row]; if (c < x.length) x[c + 1] = x[c]; return x; });
    const formats = { ...(s.formats ?? {}) };
    if (formats[c]) formats[c + 1] = formats[c];
    return { ...s, cells, columns, rows, formats };
  });
}

// ── Input tables, end to end (Vivek, 4 Nov) ─────────────────────────────────
// New input table → keys from another tab (one or more; each distinct combination is a row) →
// add typed columns with + → type or paste → Save to warehouse (sheet level) → optionally join the
// saved columns onto the tab the keys came from, matched by the keys.

export const warehouseName = (name: string, model: string) =>
  `${(model || 'WORKBOOK').toUpperCase().replace(/\W+/g, '_')}.PLANNING.${name.toUpperCase().replace(/\W+/g, '_').replace(/^_|_$/g, '')}`;

export interface NewInputSpec { name: string; keysFrom?: { sheetId: string; cols: number[] } }

export function newInputTable(wb: Workbook, spec: NewInputSpec): { wb: Workbook; id: string; rows: number } {
  const id = `i${Date.now()}`;
  let columns: Column[] = [];
  let rows: (string | number | null)[][] = [];
  const src = spec.keysFrom && wb.sheets.find((x) => x.id === spec.keysFrom!.sheetId);
  if (src && spec.keysFrom!.cols.length) {
    const cols = spec.keysFrom!.cols;
    columns = cols.map((c) => ({ title: src.columns[c].title, type: src.columns[c].type, width: src.columns[c].width, key: true, keyFrom: src.name }));
    const seen = new Set<string>();
    for (const row of src.rows) {
      const k = cols.map((c) => row[c]);
      const id2 = JSON.stringify(k);
      if (!seen.has(id2)) { seen.add(id2); rows.push(k); }
    }
  }
  const sheet: Sheet = { id, name: spec.name, kind: 'input', columns, rows, cells: {}, writesTo: warehouseName(spec.name, wb.model), savedRows: rows.map((r) => [...r]), source: src ? `Keys from ${src.name}` : 'Typed in this workbook' };
  return { wb: { ...wb, sheets: [...wb.sheets, sheet] }, id, rows: rows.length };
}

/** A new column at the end of a tab (the thin + column). */
export function appendColumn(wb: Workbook, sheetId: string, col: Column): { wb: Workbook; c: number } {
  const s = wb.sheets.find((x) => x.id === sheetId)!;
  const c = usedCols(s);
  return {
    c,
    wb: updateSheet(wb, sheetId, (x) => {
      const columns = [...x.columns];
      while (columns.length < c) columns.push({ title: '', type: 'text', width: 120 });
      columns[c] = col;
      return { ...x, columns, rows: x.rows.map((row) => { const r = [...row]; while (r.length <= c) r.push(null); return r; }) };
    }),
  };
}

/** Typed values that differ from what was last saved. */
export function unsavedCount(s: Sheet): number {
  if (s.kind !== 'input' || !s.savedRows) return 0;
  let n = 0;
  const len = Math.max(s.rows.length, s.savedRows.length);
  for (let i = 0; i < len; i++)
    for (let c = 0; c < s.columns.length; c++) {
      if (s.columns[c].key) continue;
      const a = s.rows[i]?.[c] ?? null;
      const b = s.savedRows[i]?.[c] ?? null;
      if (a !== b) n++;
    }
  return n;
}

export const saveInput = (wb: Workbook, id: string): Workbook => updateSheet(wb, id, (s) => ({ ...s, savedRows: s.rows.map((r) => [...r]) }));
export const discardInput = (wb: Workbook, id: string): Workbook =>
  updateSheet(wb, id, (s) => ({ ...s, rows: (s.savedRows ?? []).map((r) => s.columns.map((_, c) => r[c] ?? null)) }));

/** The join: each saved number column becomes a column on the keys' tab, matched by the keys. */
export function joinInput(wb: Workbook, inputId: string): { wb: Workbook; added: string[]; target?: string } {
  const inp = wb.sheets.find((x) => x.id === inputId)!;
  const keys = inp.columns.map((k, i) => ({ k, i })).filter((x) => x.k.key);
  const target = wb.sheets.find((x) => x.name === keys[0]?.k.keyFrom);
  if (!target || !keys.length) return { wb, added: [] };
  const tq = quoteName(inp.name);
  const col = (i: number) => `${tq}!${colLetter(i)}:${colLetter(i)}`;
  const tcol = (title: string) => target.columns.findIndex((x) => x.title === title);
  let next = wb;
  const added: string[] = [];
  for (const [i, k] of inp.columns.entries()) {
    if (k.key || !k.input || k.type === 'text' || k.type === 'date') continue;
    const crit = keys.map((x) => `${col(x.i)}, ${colLetter(tcol(x.k.title))}2`).join(', ');
    const formula = keys.length === 1
      ? `=XLOOKUP(${colLetter(tcol(keys[0].k.title))}2, ${col(keys[0].i)}, ${col(i)}, 0)`
      : `=SUMIFS(${col(i)}, ${crit})`;
    const t = next.sheets.find((x) => x.id === target.id)!;
    const title = t.columns.some((x) => x.title === k.title) ? `${k.title} (${inp.name})` : k.title;
    next = appendColumn(next, target.id, { title, type: k.type, width: 140, formula }).wb;
    added.push(title);
  }
  next = updateSheet(next, inputId, (x) => ({ ...x, joinedTo: target.name }));
  return { wb: next, added, target: target.name };
}
