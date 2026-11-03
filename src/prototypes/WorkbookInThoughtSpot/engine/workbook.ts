// The workbook model: several typed tabs, each a grid of cells (Google Sheets style addressing:
// row 1 is the header row, data starts on row 2). A Live tab's rows come from the data model; a
// formula typed beside them becomes one column formula for every row. Input tabs take typed
// values that write back; Local tabs live only in the workbook.
import { colIndex, evaluate, FormulaError, parseRef, type EvalContext, type Ref, type Result } from './formula';

export type SheetKind = 'live' | 'input' | 'local';
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
export const colCount = (s: Sheet) => s.columns.length + EXTRA_COLS;

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
    if (!col) {
      const n = s.columns.filter((k) => k.formula).length + 1;
      const columns = [...s.columns];
      while (columns.length < c) columns.push({ title: '', type: 'text', width: 120 });
      // Formatting follows the columns it uses: revenue − cost stays currency; a ratio becomes a percent.
      const used = (anchored.match(/\b([A-Z]{1,3})\d+/g) ?? []).map((m) => s.columns[colIndex(m.replace(/\d+/g, ''))]?.type);
      const type: ColType = /\//.test(anchored) && used.every((t) => t === 'currency') && used.length >= 2 ? 'percent' : used.includes('currency') ? 'currency' : 'number';
      columns[c] = { title: `Formula ${n}`, type, width: 128, formula: anchored };
      const rows = s.rows.map((row) => { const x = [...row]; while (x.length <= c) x.push(null); return x; });
      return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, columns, rows })), note: `Saved as one column formula for all ${s.rows.length.toLocaleString()} rows` };
    }
    if (col.formula) {
      return { wb: updateSheet(wb, sheetId, (x) => ({ ...x, columns: x.columns.map((k, i) => (i === c ? { ...k, formula: anchored } : k)) })), note: `Column formula updated for all ${s.rows.length.toLocaleString()} rows` };
    }
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
  if (s.kind === 'live' && col?.fromModel && di >= 0 && di < s.rows.length)
    return `${col.title} comes from the ${wb.model} model. Type in an empty column, or on an Input or Local tab.`;
  return null;
}

export function addSheet(wb: Workbook, kind: SheetKind): { wb: Workbook; id: string } {
  const n = wb.sheets.length + 1;
  const id = `s${Date.now()}`;
  const name = kind === 'local' ? `Sheet ${n}` : `Input ${n}`;
  return { wb: { ...wb, sheets: [...wb.sheets, { id, name, kind, columns: [], rows: [], cells: {} }] }, id };
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
