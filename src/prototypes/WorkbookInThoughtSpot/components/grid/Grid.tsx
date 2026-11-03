import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { announce, bus, narrate } from './bus';
import { alignOf, display, editText, isNumeric, parse, tabularOf } from './format';
import type { CellEdit, CellError, Column, EditSource, MenuEntry, Notice, Row, RowHeight, Value } from './types';
import { isOn, reasonOf } from './types';
import { Bubble, DatePicker, DropdownList, Icon, Menu, Pill } from './ui';

export interface Edit {
  value: Value;
  valid: boolean;
  text?: string;
  error?: string;
}
export interface Aggregates {
  cells: number;
  numbers: number;
  sum: number;
}
export interface GridHandle {
  jumpTo(rowId: string, colId: string, keyboard?: boolean): void;
  focus(): void;
  selectCell(rowIndex: number, colId: string): void;
}
export interface GridProps {
  ariaLabel: string;
  columns: Column[];
  rows: Row[];
  rowHeight: RowHeight;
  showLetters: boolean;
  frozenCols: number;
  edits: Map<string, Edit>; // the host's unsaved edits, keyed rowId|colId
  cellErrors: Map<string, CellError>;
  notices: Notice[]; // the host's notices
  onNoticeDismiss: (id: string) => void;
  busy: boolean;
  onEdit: (edits: CellEdit[], source: EditSource) => void;
  menuFor: (col: Column) => MenuEntry[];
  onMenuAction: (col: Column, entry: MenuEntry) => Promise<void>;
  addColumn: { items: MenuEntry[]; onPick: (entry: MenuEntry) => Promise<string | void> };
  onRename: (colId: string, title: string) => Promise<void>;
  onSelectionChange: (a: Aggregates) => void;
  statusRight: ReactNode;
  /** Workbook in ThoughtSpot: the active cell, for the formula bar. */
  onActiveCell?: (a: { ref: string; text: string }) => void;
  /** Changing it clears the grid's own state (its messages, open popups, edits in progress). */
  resetKey?: number;
}

const ROW_H: Record<RowHeight, number> = { compact: 24, standard: 32, open: 40 };
const HEAD_H: Record<RowHeight, number> = { compact: 28, standard: 36, open: 44 };
const LETTERS_H = 20;
const GUT = 48;
const TONES = { error: 0, warning: 1, info: 2 } as const;

const k = (rowId: string, colId: string) => rowId + '|' + colId;
const letter = (n: number) => {
  let s = '';
  n += 1;
  while (n) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
let measureCtx: CanvasRenderingContext2D | null = null;
const measure = (text: string, font: string) => {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
};
const FONT_HEAD = "600 12px Geist, -apple-system, sans-serif";
const FONT_CELL = "400 13px Geist, -apple-system, sans-serif";

interface Sel {
  ar: number;
  ac: number;
  fr: number;
  fc: number;
  kind: 'cells' | 'rows' | 'cols';
}
type Pop =
  | { type: 'menu'; c: number; keyboard: boolean }
  | { type: 'add' }
  | { type: 'dropdown'; r: number; c: number; seed: string }
  | { type: 'date'; r: number; c: number }
  | { type: 'notices' }
  | { type: 'help' }
  | null;
interface Editing {
  r: number;
  c: number;
  text: string;
  how: 'type' | 'f2' | 'mouse';
  error: string | null;
}

let noticeSeq = 0;

export const Grid = forwardRef<GridHandle, GridProps>(function Grid(p, ref) {
  const cols = p.columns;
  const rows = p.rows;
  const rowH = ROW_H[p.rowHeight];
  const headH = HEAD_H[p.rowHeight];
  const lettersH = p.showLetters ? LETTERS_H : 0;
  const top = lettersH + headH;

  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [sel, setSelRaw] = useState<Sel>({ ar: 0, ac: 0, fr: 0, fc: 0, kind: 'cells' });
  // mirrors `sel` synchronously, so a key pressed right after a click acts on the clicked cell
  const selRef = useRef(sel);
  const setSelState = useCallback((v: Sel | ((s: Sel) => Sel)) => {
    setSelRaw(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      selRef.current = next;
      return next;
    });
    if (typeof v !== 'function') selRef.current = v;
  }, []);
  const [editing, setEditingState] = useState<Editing | null>(null);
  // mirrors `editing` synchronously, so keys pressed before the editor mounts append instead of restarting the edit
  const editRef = useRef<Editing | null>(null);
  const setEdit = useCallback((v: Editing | null | ((e: Editing | null) => Editing | null)) => {
    setEditingState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      editRef.current = next;
      return next;
    });
    if (typeof v !== 'function') editRef.current = v;
  }, []);
  const [pop, setPop] = useState<Pop>(null);
  const [hint, setHint] = useState<{ r: number; c: number; title: string; body: string } | null>(null);
  const [gridNotices, setGridNotices] = useState<Notice[]>([]);
  const [menuBusy, setMenuBusy] = useState<{ colId: string; label: string } | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [renaming, setRenaming] = useState<{ colId: string; text: string; error: string | null; saving: boolean } | null>(null);
  const [pendingRename, setPendingRename] = useState<string | null>(null);
  const [loader, setLoader] = useState(false);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<{ r0: number; r1: number; c0: number; c1: number } | null>(null);
  const dragging = useRef<null | 'cells' | 'rows' | 'cols'>(null);
  // rows are memoised: they get stable handler proxies that call the latest handlers
  const rowHandlers = useRef<{
    onCellDown: (e: React.MouseEvent, r: number, c: number) => void;
    onCellEnter: (r: number, c: number) => void;
    selectRow: (e: React.MouseEvent, r: number) => void;
    onDbl: (r: number, c: number) => void;
  }>(null!);
  const stable = useMemo(
    () => ({
      onDown: (e: React.MouseEvent, r: number, c: number) => rowHandlers.current.onCellDown(e, r, c),
      onEnter: (r: number, c: number) => rowHandlers.current.onCellEnter(r, c),
      onRowDown: (e: React.MouseEvent, r: number) => rowHandlers.current.selectRow(e, r),
      onDbl: (r: number, c: number) => rowHandlers.current.onDbl(r, c),
    }),
    [],
  );
  const viaKeyboard = useRef(false);

  useEffect(() => {
    setGridNotices([]);
    setPop(null);
    setEdit(null);
    setHint(null);
    setCopied(null);
    setRenaming(null);
  }, [p.resetKey, setEdit]);

  const widthOf = useCallback((c: Column) => widths[c.id] ?? c.width ?? 120, [widths]);
  const lefts = useMemo(() => {
    const out = [GUT];
    cols.forEach((c, i) => out.push(out[i] + widthOf(c)));
    return out;
  }, [cols, widthOf]);
  const frozen = Math.min(p.frozenCols, cols.length);
  const frozenW = lefts[frozen] - GUT;

  // ------------------------------------------------------------------ values

  const value = useCallback(
    (r: number, c: number): Value => {
      const row = rows[r];
      const col = cols[c];
      if (!row || !col) return null;
      const e = p.edits.get(k(row.__id, col.id));
      return e && e.valid ? e.value : (row[col.id] ?? null);
    },
    [rows, cols, p.edits],
  );

  const range = useMemo(() => {
    if (sel.kind === 'rows') return { r0: Math.min(sel.ar, sel.fr), r1: Math.max(sel.ar, sel.fr), c0: 0, c1: cols.length - 1 };
    if (sel.kind === 'cols') return { r0: 0, r1: rows.length - 1, c0: Math.min(sel.ac, sel.fc), c1: Math.max(sel.ac, sel.fc) };
    return { r0: Math.min(sel.ar, sel.fr), r1: Math.max(sel.ar, sel.fr), c0: Math.min(sel.ac, sel.fc), c1: Math.max(sel.ac, sel.fc) };
  }, [sel, cols.length, rows.length]);

  // keep the selection inside the sheet when rows or columns change
  useEffect(() => {
    setSelState(s => {
      const R = Math.max(0, rows.length - 1);
      const C = Math.max(0, cols.length - 1);
      const n = { ...s, ar: clamp(s.ar, 0, R), fr: clamp(s.fr, 0, R), ac: clamp(s.ac, 0, C), fc: clamp(s.fc, 0, C) };
      return n.ar === s.ar && n.fr === s.fr && n.ac === s.ac && n.fc === s.fc ? s : n;
    });
  }, [rows.length, cols.length]);

  // selection aggregates for the footer (Sum / Average / Count)
  const onSel = p.onSelectionChange;
  useEffect(() => {
    let cells = 0;
    let numbers = 0;
    let sum = 0;
    for (let r = range.r0; r <= range.r1 && cells < 20000; r++)
      for (let c = range.c0; c <= range.c1; c++) {
        cells++;
        const v = value(r, c);
        if (typeof v === 'number' && isNumeric(cols[c])) {
          numbers++;
          sum += v;
        }
      }
    onSel({ cells, numbers, sum });
  }, [range, value, cols, onSel]);

  // Workbook in ThoughtSpot: report the active cell, so the formula bar can show it.
  const onActive = p.onActiveCell;
  useEffect(() => {
    if (!onActive) return;
    const col = cols[sel.ac];
    onActive({ ref: `${letter(sel.ac)}${sel.ar + 1}`, text: col ? display(col, value(sel.ar, sel.ac)) : '' });
  }, [sel.ar, sel.ac, cols, value, onActive]);

  // ------------------------------------------------------------------ loader: only after 300 ms of waiting

  const waiting = p.busy || !!menuBusy || addBusy || !!renaming?.saving;
  useEffect(() => {
    if (!waiting) {
      setLoader(false);
      return;
    }
    const t = setTimeout(() => {
      setLoader(true);
      bus.emit({ type: 'loader', on: true });
    }, 300);
    return () => clearTimeout(t);
  }, [waiting]);

  // ------------------------------------------------------------------ scrolling and focus

  const reveal = useCallback(
    (r: number, c: number) => {
      const s = scroller.current;
      if (!s) return;
      const bodyH = s.clientHeight - top;
      const y = r * rowH;
      if (y < s.scrollTop) s.scrollTop = y;
      else if (y + rowH > s.scrollTop + bodyH) s.scrollTop = y + rowH - bodyH;
      if (c >= frozen && c < cols.length) {
        const x = lefts[c] - GUT - frozenW;
        const right = lefts[c + 1] - GUT - frozenW;
        const visW = s.clientWidth - GUT - frozenW;
        if (x < s.scrollLeft) s.scrollLeft = x;
        else if (right > s.scrollLeft + visW) s.scrollLeft = right - visW;
      }
    },
    [top, rowH, frozen, cols.length, lefts, frozenW],
  );

  const focusGrid = () => root.current?.focus({ preventScroll: true });

  const setSel = useCallback(
    (s: Sel, opts: { reveal?: boolean; mouse?: boolean } = {}) => {
      setSelState(s);
      if (opts.reveal !== false) reveal(s.fr, s.fc);
      const col = cols[s.fc];
      if (col) {
        const cells = s.kind === 'cells' ? (Math.abs(s.ar - s.fr) + 1) * (Math.abs(s.ac - s.fc) + 1) : 0;
        bus.emit({ type: 'select', colId: col.id, rowIndex: s.fr, kind: s.kind, cells, mouse: !!opts.mouse });
      }
    },
    [cols, reveal],
  );

  const cellEl = (r: number, c: number) => document.getElementById(`kc-${r}-${c}`);
  const headEl = (c: number) => document.getElementById(`kh-${c}`);

  // ------------------------------------------------------------------ notices

  const pushNotice = useCallback((n: Omit<Notice, 'id' | 'owner'>) => {
    const notice: Notice = { ...n, id: `g${++noticeSeq}`, owner: 'grid' };
    setGridNotices(list => [notice, ...list].slice(0, 20));
    announce(`${n.title}. ${n.detail ?? ''}`, n.tone === 'error');
  }, []);
  const allNotices = useMemo(
    () => [...gridNotices, ...p.notices].sort((a, b) => TONES[a.tone] - TONES[b.tone]),
    [gridNotices, p.notices],
  );

  const jumpTo = useCallback(
    (rowId: string, colId: string, keyboard = false) => {
      const r = rows.findIndex(x => x.__id === rowId);
      const c = cols.findIndex(x => x.id === colId);
      if (r < 0 || c < 0) return;
      setPop(null);
      setSel({ ar: r, ac: c, fr: r, fc: c, kind: 'cells' });
      setTimeout(() => {
        focusGrid();
        const el = cellEl(r, c);
        el?.classList.add('flash');
        setTimeout(() => el?.classList.remove('flash'), 1400);
      }, 60);
      const err = p.cellErrors.get(k(rowId, colId)) ?? null;
      announce(`${cols[c].title}, row ${r + 1}${err ? `. ${err.reason}` : ''}`);
      bus.emit({ type: 'jump', colId, keyboard });
    },
    [rows, cols, setSel, p.cellErrors],
  );

  useImperativeHandle(ref, () => ({
    jumpTo,
    focus: focusGrid,
    selectCell: (r, colId) => {
      const c = cols.findIndex(x => x.id === colId);
      if (c >= 0) setSel({ ar: r, ac: c, fr: r, fc: c, kind: 'cells' });
      setTimeout(focusGrid, 30);
    },
  }));

  // ------------------------------------------------------------------ editing: one commit pipeline (HLD §5.5)

  const showReadOnly = (r: number, c: number) => {
    const col = cols[c];
    const reason = reasonOf(col.editable) ?? `${col.title} can't be edited.`;
    const [title, ...rest] = reason.split('. ');
    setHint({ r, c, title: title.endsWith('.') ? title : title + (rest.length ? '' : ''), body: rest.join('. ') });
    announce(reason, true);
    bus.emit({ type: 'readonly-hint', colId: col.id });
  };
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), 4500);
    return () => clearTimeout(t);
  }, [hint]);

  const startEdit = (r: number, c: number, how: Editing['how'], seed?: string) => {
    const col = cols[c];
    if (!col || !rows[r]) return;
    if (!isOn(col.editable)) {
      showReadOnly(r, c);
      return;
    }
    setHint(null);
    reveal(r, c);
    if (col.dataType === 'dropdown' || col.dataType === 'boolean') {
      setPop({ type: 'dropdown', r, c, seed: seed ?? '' });
      bus.emit({ type: 'dropdown-open', colId: col.id });
      return;
    }
    if (col.dataType === 'date' && seed === undefined) {
      setPop({ type: 'date', r, c });
      bus.emit({ type: 'date-open', colId: col.id });
      return;
    }
    const row = rows[r];
    const kept = p.edits.get(k(row.__id, col.id));
    setEdit({ r, c, how, error: null, text: seed ?? (kept && !kept.valid ? kept.text ?? '' : editText(col, value(r, c))) });
    bus.emit({ type: 'edit-start', colId: col.id, how });
  };

  const emitEdits = (edits: CellEdit[], source: EditSource, keyboard: boolean) => {
    if (!edits.length) return;
    p.onEdit(edits, source);
    bus.emit({ type: 'edit-commit', colId: edits[0].colId, source, count: edits.length, keyboard });
  };

  /** Parse, then validate; `reject` keeps the editor open with the reason, `keep` sends it marked invalid. */
  const commit = (move: [number, number] | null, keyboard: boolean): boolean => {
    if (!editing) return true;
    const { r, c, text } = editing;
    const col = cols[c];
    const row = rows[r];
    const old = value(r, c);
    const parsed = parse(col, text);
    const reason = !parsed.ok ? parsed.reason : (col.validate?.(parsed.value, row) ?? null);
    if (reason) {
      if (col.invalidInput === 'keep') {
        emitEdits([{ rowId: row.__id, colId: col.id, oldValue: old, value: null, valid: false, text, error: reason }], 'type', keyboard);
        bus.emit({ type: 'edit-kept', colId: col.id });
        announce(`Kept, but invalid: ${reason}`, true);
      } else {
        setEdit({ ...editing, error: reason });
        bus.emit({ type: 'edit-reject', colId: col.id, reason });
        announce(`Not accepted. ${reason}. Press Escape to cancel.`, true);
        return false;
      }
    } else if (parsed.ok && parsed.value !== old && !(parsed.value === null && old === null)) {
      emitEdits([{ rowId: row.__id, colId: col.id, oldValue: old, value: parsed.value, valid: true }], 'type', keyboard);
      announce(`${col.title} set to ${display(col, parsed.value) || 'empty'}`);
    }
    setEdit(null);
    focusGrid();
    if (move) {
      const nr = clamp(r + move[0], 0, rows.length - 1);
      const nc = clamp(c + move[1], 0, cols.length - 1);
      setSel({ ar: nr, ac: nc, fr: nr, fc: nc, kind: 'cells' });
    }
    setTimeout(focusGrid, 0);
    return true;
  };
  const cancelEdit = () => {
    if (!editing) return;
    bus.emit({ type: 'edit-cancel', colId: cols[editing.c].id });
    announce('Edit cancelled');
    setEdit(null);
    focusGrid();
  };

  const pick = (r: number, c: number, v: Value, searched: boolean) => {
    const col = cols[c];
    const row = rows[r];
    const old = value(r, c);
    setPop(null);
    if (v !== old) emitEdits([{ rowId: row.__id, colId: col.id, oldValue: old, value: v, valid: true }], 'pick', true);
    bus.emit({ type: col.dataType === 'date' ? 'date-pick' : 'dropdown-pick', colId: col.id, search: searched } as never);
    announce(`${col.title} set to ${display(col, v)}`);
    setTimeout(focusGrid, 0);
  };

  // ------------------------------------------------------------------ clear, copy, paste

  const clearRange = () => {
    const edits: CellEdit[] = [];
    let skipped = 0;
    for (let r = range.r0; r <= range.r1; r++)
      for (let c = range.c0; c <= range.c1; c++) {
        const col = cols[c];
        if (!isOn(col.editable)) {
          skipped++;
          continue;
        }
        const old = value(r, c);
        if (old !== null) edits.push({ rowId: rows[r].__id, colId: col.id, oldValue: old, value: null, valid: true });
      }
    emitEdits(edits, 'clear', true);
    if (skipped && edits.length === 0 && range.r0 === range.r1 && range.c0 === range.c1) showReadOnly(range.r0, range.c0);
    else if (skipped) pushNotice({ tone: 'info', title: `${skipped} read-only ${skipped === 1 ? 'cell was' : 'cells were'} skipped`, detail: 'Only columns marked ✎ take input', dismissible: true });
  };

  const onCopy = (e: React.ClipboardEvent, cut = false) => {
    if (editing || pop) return;
    const lines: string[] = [];
    for (let r = range.r0; r <= range.r1; r++) {
      const cells: string[] = [];
      for (let c = range.c0; c <= range.c1; c++) cells.push(editText(cols[c], value(r, c)));
      lines.push(cells.join('\t'));
    }
    e.clipboardData.setData('text/plain', lines.join('\n'));
    e.preventDefault();
    setCopied(range);
    const n = (range.r1 - range.r0 + 1) * (range.c1 - range.c0 + 1);
    announce(`${cut ? 'Cut' : 'Copied'} ${n} ${n === 1 ? 'cell' : 'cells'}`);
    bus.emit({ type: 'copy', count: n });
    if (cut) clearRange();
  };

  /** Excel's paste: the clipboard sets the size, or tiles to fill a larger selection; bad values are skipped. */
  const onPaste = (e: React.ClipboardEvent) => {
    if (editing || pop) return;
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    const grid = text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').map(l => l.split('\t'));
    const h = grid.length;
    const w = Math.max(...grid.map(r => r.length));
    const tile = range.r1 - range.r0 + 1 >= h && range.c1 - range.c0 + 1 >= w && (range.r1 - range.r0 + 1) * (range.c1 - range.c0 + 1) > h * w;
    const r1 = tile ? range.r1 : Math.min(rows.length - 1, range.r0 + h - 1);
    const c1 = tile ? range.c1 : Math.min(cols.length - 1, range.c0 + w - 1);
    const edits: CellEdit[] = [];
    let readOnly = 0;
    let invalid = 0;
    let firstReason = '';
    const badCols = new Set<string>();
    for (let r = range.r0; r <= r1; r++)
      for (let c = range.c0; c <= c1; c++) {
        const col = cols[c];
        const raw = grid[(r - range.r0) % h][(c - range.c0) % w] ?? '';
        if (!isOn(col.editable)) {
          readOnly++;
          continue;
        }
        const parsed = parse(col, raw);
        const reason = !parsed.ok ? parsed.reason : (col.validate?.(parsed.value, rows[r]) ?? null);
        const old = value(r, c);
        if (reason) {
          if (col.invalidInput === 'keep') edits.push({ rowId: rows[r].__id, colId: col.id, oldValue: old, value: null, valid: false, text: raw, error: reason });
          else {
            invalid++;
            firstReason ||= reason;
            badCols.add(col.title);
          }
          continue;
        }
        if (parsed.ok && parsed.value !== old) edits.push({ rowId: rows[r].__id, colId: col.id, oldValue: old, value: parsed.value, valid: true });
      }
    emitEdits(edits, 'paste', true);
    setSel({ ar: range.r0, ac: range.c0, fr: r1, fc: c1, kind: 'cells' });
    setCopied(null);
    if (invalid)
      pushNotice({
        tone: 'warning',
        title: `${invalid} ${invalid === 1 ? 'value' : 'values'} skipped`,
        detail: badCols.size === 1 ? `They don't fit the ${[...badCols][0]} column: ${firstReason}` : `They don't fit their columns: ${[...badCols].join(', ')}`,
        dismissible: true,
      });
    if (readOnly) pushNotice({ tone: 'info', title: `${readOnly} read-only ${readOnly === 1 ? 'cell' : 'cells'} skipped`, detail: 'Only columns marked ✎ take input', dismissible: true });
    announce(`Pasted ${edits.length} ${edits.length === 1 ? 'value' : 'values'}${invalid ? `, ${invalid} skipped` : ''}`);
    bus.emit({ type: 'paste', count: edits.length, skipped: invalid });
  };

  // ------------------------------------------------------------------ column menu, add column, rename

  const runMenu = async (c: number, entry: MenuEntry) => {
    const col = cols[c];
    setPop(null);
    focusGrid();
    if (entry.id === 'rename') {
      setRenaming({ colId: col.id, text: col.title, error: null, saving: false });
      return;
    }
    setMenuBusy({ colId: col.id, label: entry.label });
    bus.emit({ type: 'menu-action', colId: col.id, id: entry.id });
    try {
      await p.onMenuAction(col, entry);
      announce(`${entry.label}: done`);
      bus.emit({ type: 'menu-done', colId: col.id, id: entry.id, ok: true });
    } catch (err) {
      const msg = (err as { userMessage?: string }).userMessage ?? `Couldn't complete “${entry.label}”`;
      pushNotice({ tone: 'error', title: `Couldn't complete “${entry.label}”`, detail: msg, dismissible: true });
      bus.emit({ type: 'menu-done', colId: col.id, id: entry.id, ok: false });
    } finally {
      setMenuBusy(null);
    }
  };
  const openMenu = (c: number, keyboard: boolean) => {
    if (menuBusy) {
      announce(`Wait for “${menuBusy.label}” to finish`);
      return;
    }
    setEdit(null);
    setPop({ type: 'menu', c, keyboard });
    narrate(`${cols[c].title} column menu, ${p.menuFor(cols[c]).filter(m => !m.divider).length} items`);
    bus.emit({ type: 'menu-open', colId: cols[c].id, keyboard });
  };

  const pickAdd = async (entry: MenuEntry) => {
    setPop(null);
    setAddBusy(true);
    try {
      const id = await p.addColumn.onPick(entry);
      if (id) setPendingRename(id);
    } catch (err) {
      pushNotice({ tone: 'error', title: "Couldn't add the column", detail: (err as { userMessage?: string }).userMessage, dismissible: true });
    } finally {
      setAddBusy(false);
    }
  };
  // a newly added column opens straight into rename, once the host has passed it in
  useEffect(() => {
    if (!pendingRename) return;
    const c = cols.findIndex(x => x.id === pendingRename);
    if (c < 0) return;
    setPendingRename(null);
    setSel({ ar: 0, ac: c, fr: rows.length - 1, fc: c, kind: 'cols' });
    setRenaming({ colId: cols[c].id, text: cols[c].title, error: null, saving: false });
    bus.emit({ type: 'col-added', colId: cols[c].id });
  }, [pendingRename, cols, rows.length, setSel]);

  const commitRename = async () => {
    if (!renaming) return;
    const title = renaming.text.trim();
    const col = cols.find(x => x.id === renaming.colId)!;
    if (!title) {
      setRenaming({ ...renaming, error: 'Enter a column name' });
      return;
    }
    if (title === col.title) {
      setRenaming(null);
      focusGrid();
      return;
    }
    if (cols.some(x => x.id !== col.id && x.title.toLowerCase() === title.toLowerCase())) {
      setRenaming({ ...renaming, error: `A column named “${title}” already exists` });
      bus.emit({ type: 'rename-error' });
      announce(`A column named ${title} already exists`, true);
      return;
    }
    setRenaming({ ...renaming, saving: true, error: null });
    try {
      await p.onRename(col.id, title);
      setRenaming(null);
      announce(`Renamed to ${title}`);
      bus.emit({ type: 'rename-done', colId: col.id, title });
      focusGrid();
    } catch (err) {
      setRenaming({ ...renaming, saving: false, error: (err as { userMessage?: string }).userMessage ?? "Couldn't rename" });
    }
  };

  // ------------------------------------------------------------------ keyboard (the Excel model)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== root.current) return;
    viaKeyboard.current = true;
    const mod = e.metaKey || e.ctrlKey;
    const sel = selRef.current;
    if (editRef.current) {
      if (e.key.length === 1 && !mod && !e.altKey) {
        setEdit(ed => (ed ? { ...ed, text: ed.text + e.key } : ed));
        e.preventDefault();
      }
      return;
    }
    const { fr, fc } = sel;
    const R = rows.length - 1;
    const C = cols.length - 1;
    const move = (r: number, c: number, extend: boolean) => {
      r = clamp(r, 0, R);
      c = clamp(c, 0, C);
      setSel(extend ? { ...sel, fr: r, fc: c } : { ar: r, ac: c, fr: r, fc: c, kind: 'cells' });
      setHint(null);
      const col = cols[c];
      const text = display(col, value(r, c)) || 'blank';
      const err = p.cellErrors.get(k(rows[r].__id, col.id));
      narrate(`${col.title}, row ${r + 1}: ${text}${isOn(col.editable) ? '' : ', read-only'}${err ? `, invalid: ${err.reason}` : ''}${extend ? ', selection extended' : ''}`);
    };
    const jumpEdge = (dr: number, dc: number): [number, number] => {
      const filled = (r: number, c: number) => value(r, c) !== null && value(r, c) !== '';
      let r = fr;
      let c = fc;
      const inside = (a: number, b: number) => a >= 0 && a <= R && b >= 0 && b <= C;
      if (filled(r, c) && inside(r + dr, c + dc) && filled(r + dr, c + dc)) {
        while (inside(r + dr, c + dc) && filled(r + dr, c + dc)) {
          r += dr;
          c += dc;
        }
        return [r, c];
      }
      while (inside(r + dr, c + dc)) {
        r += dr;
        c += dc;
        if (filled(r, c)) break;
      }
      return [r, c];
    };
    const page = Math.max(1, Math.floor(((scroller.current?.clientHeight ?? 400) - top) / rowH) - 1);
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrows[e.key] && e.altKey && e.key === 'ArrowDown') {
      startEdit(fr, fc, 'f2');
    } else if (arrows[e.key]) {
      const [dr, dc] = arrows[e.key];
      if (mod) {
        const [r, c] = jumpEdge(dr, dc);
        move(r, c, e.shiftKey);
      } else move(fr + dr, fc + dc, e.shiftKey);
    } else if (e.key === 'Home') move(mod ? 0 : fr, 0, e.shiftKey);
    else if (e.key === 'End') move(mod ? R : fr, C, e.shiftKey);
    else if (e.key === 'PageDown') move(fr + page, fc, e.shiftKey);
    else if (e.key === 'PageUp') move(fr - page, fc, e.shiftKey);
    else if (e.key === 'Tab') move(fr, fc + (e.shiftKey ? -1 : 1), false);
    else if (e.key === 'Enter' && !mod) startEdit(fr, fc, 'f2');
    else if (e.key === 'F2') startEdit(fr, fc, 'f2');
    else if (e.key === 'F10' && e.shiftKey) openMenu(fc, true);
    else if (e.key === 'ContextMenu') openMenu(fc, true);
    else if (e.key === 'F6') {
      const bar = root.current?.querySelector<HTMLElement>('.kg-status');
      const target = bar?.querySelector<HTMLElement>('button') ?? bar;
      if (target && bar) {
        target.focus();
        narrate(`Status bar: ${bar.innerText.replace(/\n/g, ', ')}`);
        bus.emit({ type: 'focus-status' });
      }
    } else if (e.key === 'a' && mod) setSel({ ar: 0, ac: 0, fr: R, fc: C, kind: 'cells' }, { reveal: false });
    else if (e.key === ' ' && e.shiftKey) setSel({ ar: fr, ac: 0, fr, fc: C, kind: 'rows' }, { reveal: false });
    else if (e.key === ' ' && mod) setSel({ ar: 0, ac: fc, fr: R, fc, kind: 'cols' }, { reveal: false });
    else if (e.key === ' ' && cols[fc].dataType === 'boolean') {
      if (!isOn(cols[fc].editable)) showReadOnly(fr, fc);
      else pick(fr, fc, !value(fr, fc), false);
    } else if (e.key === 'Delete' || e.key === 'Backspace') clearRange();
    else if (e.key === 'Escape') {
      setCopied(null);
      setHint(null);
      if (sel.ar !== sel.fr || sel.ac !== sel.fc || sel.kind !== 'cells') move(fr, fc, false);
    } else if (e.key === '?' && !mod) {
      setPop({ type: 'help' });
      bus.emit({ type: 'shortcuts' });
    } else if (e.key.length === 1 && !mod && !e.altKey) startEdit(fr, fc, 'type', e.key);
    else return;
    e.preventDefault();
  };

  // ------------------------------------------------------------------ mouse

  const onCellDown = (e: React.MouseEvent, r: number, c: number) => {
    if (e.button !== 0) return;
    viaKeyboard.current = false;
    if (editing && (editing.r !== r || editing.c !== c)) {
      if (!commit(null, false)) {
        e.preventDefault();
        return;
      }
    }
    if (editing && editing.r === r && editing.c === c) return;
    setHint(null);
    const col = cols[c];
    const pillHit = (e.target as HTMLElement).closest('.pill, .dateic');
    if (pillHit && sel.fr === r && sel.fc === c && isOn(col.editable)) {
      e.preventDefault();
      startEdit(r, c, 'mouse');
      return;
    }
    if (e.shiftKey) setSel({ ...sel, fr: r, fc: c, kind: 'cells' }, { mouse: true });
    else setSel({ ar: r, ac: c, fr: r, fc: c, kind: 'cells' }, { mouse: true });
    dragging.current = 'cells';
    focusGrid();
    e.preventDefault();
  };
  const onCellEnter = (r: number, c: number) => {
    if (dragging.current === 'cells') setSelState(s => ({ ...s, fr: r, fc: c }));
    else if (dragging.current === 'rows') setSelState(s => ({ ...s, fr: r }));
  };
  const onHeadEnter = (c: number) => {
    if (dragging.current === 'cols') setSelState(s => ({ ...s, fc: c }));
  };
  useEffect(() => {
    const up = () => (dragging.current = null);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const selectCol = (e: React.MouseEvent, c: number) => {
    if (editing && !commit(null, false)) return;
    if ((e.target as HTMLElement).closest('.chev, .rz, .ren')) return;
    setSel(e.shiftKey ? { ...sel, fc: c, kind: 'cols' } : { ar: 0, ac: c, fr: 0, fc: c, kind: 'cols' }, { reveal: false, mouse: true });
    setSelState(s => ({ ...s, fr: s.kind === 'cols' ? s.fr : 0 }));
    dragging.current = 'cols';
    focusGrid();
    e.preventDefault();
  };
  const selectRow = (e: React.MouseEvent, r: number) => {
    if (editing && !commit(null, false)) return;
    setSel(e.shiftKey ? { ...sel, fr: r, kind: 'rows' } : { ar: r, ac: 0, fr: r, fc: sel.fc, kind: 'rows' }, { reveal: false, mouse: true });
    dragging.current = 'rows';
    focusGrid();
    e.preventDefault();
  };

  const startResize = (e: React.MouseEvent, col: Column) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const w0 = widthOf(col);
    const move = (ev: MouseEvent) => setWidths(w => ({ ...w, [col.id]: Math.max(48, Math.round(w0 + ev.clientX - x0)) }));
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const autofit = (col: Column, c: number) => {
    let w = measure(col.title, FONT_HEAD) + 16 + (col.badges?.length ?? 0) * 16 + 30;
    for (let r = 0; r < rows.length; r++) w = Math.max(w, measure(display(col, value(r, c)), FONT_CELL) + 18 + (col.dataType === 'dropdown' ? 40 : 0));
    setWidths(x => ({ ...x, [col.id]: Math.min(420, Math.ceil(w)) }));
  };

  // ------------------------------------------------------------------ per-column and per-row signals

  const colErrors = useMemo(() => {
    const s = new Set<string>();
    p.cellErrors.forEach(e => s.add(e.colId));
    p.edits.forEach((e, key) => !e.valid && s.add(key.split('|')[1]));
    return s;
  }, [p.cellErrors, p.edits]);
  const rowSignals = useMemo(() => {
    const m = new Map<string, { unsaved: boolean; problem: boolean }>();
    p.edits.forEach((e, key) => {
      const id = key.split('|')[0];
      const cur = m.get(id) ?? { unsaved: false, problem: false };
      m.set(id, { unsaved: true, problem: cur.problem || !e.valid });
    });
    p.cellErrors.forEach(e => {
      const cur = m.get(e.rowId) ?? { unsaved: false, problem: false };
      m.set(e.rowId, { unsaved: true, problem: true });
      void cur;
    });
    return m;
  }, [p.edits, p.cellErrors]);

  // ------------------------------------------------------------------ render

  const editingCell = editing ? k(rows[editing.r]?.__id ?? '', cols[editing.c]?.id ?? '') : null;
  const editor = editing ? (
    <input
      className={`ed${editing.error ? ' bad' : ''}${tabularOf(cols[editing.c]) ? ' tnum' : ''}`}
      style={{ textAlign: alignOf(cols[editing.c]) }}
      autoFocus
      aria-label={`Edit ${cols[editing.c].title}, row ${editing.r + 1}`}
      aria-invalid={!!editing.error}
      aria-describedby={editing.error ? 'kg-ed-err' : undefined}
      value={editing.text}
      onChange={e => setEdit({ ...editing, text: e.target.value, error: null })}
      onKeyDown={e => {
        e.stopPropagation();
        const arrowMove: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (e.key === 'Enter') commit(e.shiftKey ? [-1, 0] : [1, 0], true);
        else if (e.key === 'Tab') commit(e.shiftKey ? [0, -1] : [0, 1], true);
        else if (e.key === 'Escape') cancelEdit();
        else if (arrowMove[e.key] && editing.how === 'type') commit(arrowMove[e.key], true);
        else return;
        e.preventDefault();
      }}
      onBlur={() => {
        // focus leaving the grid commits (HLD edit lifecycle); a rejected value keeps the editor
        setTimeout(() => {
          if (document.activeElement && root.current?.contains(document.activeElement)) return;
          if (editing && !editing.error) commit(null, false);
        }, 0);
      }}
    />
  ) : null;

  rowHandlers.current = { onCellDown, onCellEnter, selectRow, onDbl: (r: number, c: number) => startEdit(r, c, 'mouse') };

  const activeId = editing || pop ? undefined : `kc-${sel.fr}-${sel.fc}`;
  const top1 = allNotices[0];
  const more = allNotices.length - 1;

  return (
    <div
      ref={root}
      className={`kg rh-${p.rowHeight}`}
      role="grid"
      aria-label={p.ariaLabel}
      aria-rowcount={rows.length + 1}
      aria-colcount={cols.length + 1}
      aria-multiselectable
      aria-activedescendant={activeId}
      aria-busy={waiting}
      tabIndex={0}
      style={{ ['--rh' as string]: `${rowH}px`, ['--hh' as string]: `${headH}px`, ['--lh' as string]: `${lettersH}px` }}
      onKeyDown={onKeyDown}
      onCopy={e => onCopy(e)}
      onCut={e => onCopy(e, true)}
      onPaste={onPaste}
    >
      {loader && (
        <div className="kg-loader" role="progressbar" aria-label={menuBusy ? `${menuBusy.label}, working` : 'Saving'}>
          <i />
        </div>
      )}
      <div className="kg-scroll" ref={scroller} onScroll={() => (pop?.type === 'menu' || pop?.type === 'add' ? null : null)}>
        <div className="kg-sheet" style={{ width: lefts[cols.length] + 40 }}>
          {p.showLetters && (
            <div className="kg-row letters" role="presentation">
              <div className="kc corner" />
              {cols.map((col, c) => (
                <div
                  key={col.id}
                  className={`kc lt${c < frozen ? ' fz' : ''}${c === frozen - 1 ? ' fz-last' : ''}${c >= range.c0 && c <= range.c1 ? ' sel' : ''}`}
                  style={{ width: widthOf(col), left: c < frozen ? lefts[c] : undefined }}
                  onMouseDown={e => selectCol(e, c)}
                  onMouseEnter={() => onHeadEnter(c)}
                >
                  {letter(c)}
                </div>
              ))}
              <div className="kc lt add-sp" />
            </div>
          )}
          <div className="kg-row head" role="row" aria-rowindex={1}>
            <div className="kc corner" role="columnheader" aria-colindex={1} onMouseDown={e => { setSel({ ar: 0, ac: 0, fr: rows.length - 1, fc: cols.length - 1, kind: 'cells' }, { reveal: false, mouse: true }); focusGrid(); e.preventDefault(); }}>
              <span className="sr">Row number</span>
            </div>
            {cols.map((col, c) => (
              <HeaderCell
                key={col.id}
                col={col}
                c={c}
                width={widthOf(col)}
                left={c < frozen ? lefts[c] : undefined}
                frozen={c < frozen}
                frozenLast={c === frozen - 1}
                selected={c >= range.c0 && c <= range.c1 && (sel.kind === 'cols' || sel.kind === 'cells')}
                hasError={colErrors.has(col.id)}
                busy={menuBusy?.colId === col.id}
                menuLocked={!!menuBusy && menuBusy.colId !== col.id}
                lockedLabel={menuBusy?.label}
                open={pop?.type === 'menu' && pop.c === c}
                renaming={renaming?.colId === col.id ? renaming : null}
                onRenameChange={t => renaming && setRenaming({ ...renaming, text: t, error: null })}
                onRenameCommit={commitRename}
                onRenameCancel={() => {
                  setRenaming(null);
                  focusGrid();
                }}
                onDown={e => selectCol(e, c)}
                onEnter={() => onHeadEnter(c)}
                onChevron={() => openMenu(c, false)}
                onResize={e => startResize(e, col)}
                onAutofit={() => autofit(col, c)}
              />
            ))}
            <div className="kc hc addc">
              <button
                id="kg-add"
                className={`addbtn${pop?.type === 'add' ? ' open' : ''}`}
                aria-label="Add a column"
                title="Add a column (Alt+N)"
                aria-haspopup="menu"
                aria-expanded={pop?.type === 'add'}
                disabled={addBusy}
                onClick={() => {
                  setPop({ type: 'add' });
                  bus.emit({ type: 'add-menu' });
                }}
              >
                {addBusy ? <Icon name="spin" className="spin" /> : <Icon name="plus" />}
              </button>
            </div>
          </div>
          {rows.map((row, r) => {
            const inRange = r >= range.r0 && r <= range.r1;
            const sig = inRange ? `${range.c0}:${range.c1}:${r === range.r0 ? 1 : 0}${r === range.r1 ? 1 : 0}` : '';
            const isCur = sel.fr === r;
            return (
              <RowView
                key={row.__id}
                r={r}
                row={row}
                cols={cols}
                lefts={lefts}
                frozen={frozen}
                edits={p.edits}
                errors={p.cellErrors}
                sig={sig}
                activeCol={isCur ? sel.fc : -1}
                current={isCur}
                editor={editing && editing.r === r ? editor : null}
                editingCol={editing && editing.r === r ? editing.c : -1}
                signals={rowSignals.get(row.__id)}
                copied={copied && r >= copied.r0 && r <= copied.r1 ? `${copied.c0}:${copied.c1}:${r === copied.r0 ? 1 : 0}${r === copied.r1 ? 1 : 0}` : ''}
                rowSelected={(sel.kind === 'rows' || sel.kind === 'cells') && inRange}
                widthOf={widthOf}
                onDown={stable.onDown}
                onEnter={stable.onEnter}
                onRowDown={stable.onRowDown}
                onDbl={stable.onDbl}
              />
            );
          })}
        </div>
      </div>

      <StatusBar
        top={top1}
        more={more}
        open={pop?.type === 'notices'}
        right={p.statusRight}
        cols={cols}
        rows={rows}
        onMore={() => {
          setPop(pop?.type === 'notices' ? null : { type: 'notices' });
          bus.emit({ type: 'notices-open' });
        }}
        onJump={jumpTo}
        onDismiss={n => (n.owner === 'grid' ? setGridNotices(l => l.filter(x => x.id !== n.id)) : p.onNoticeDismiss(n.id))}
      />
      {pop?.type === 'notices' && (
        <NoticeList
          notices={allNotices}
          cols={cols}
          rows={rows}
          onJump={jumpTo}
          onClose={() => {
            setPop(null);
            focusGrid();
          }}
          onDismiss={n => (n.owner === 'grid' ? setGridNotices(l => l.filter(x => x.id !== n.id)) : p.onNoticeDismiss(n.id))}
        />
      )}

      {editing?.error && (
        <Bubble id="kg-ed-err" anchor={() => cellEl(editing.r, editing.c)} tone="error" title={editing.error} body="Fix it, or press Esc to cancel" deps={[editing.r, editing.c, editing.error]} />
      )}
      {hint && <Bubble anchor={() => cellEl(hint.r, hint.c)} tone="dark" title={hint.title} body={hint.body} deps={[hint.r, hint.c]} />}
      {renaming?.error && <Bubble anchor={() => headEl(cols.findIndex(x => x.id === renaming.colId))} tone="error" title={renaming.error} body="Press Esc to cancel" deps={[renaming.colId, renaming.error]} />}

      {pop?.type === 'menu' && (
        <Menu
          entries={p.menuFor(cols[pop.c])}
          anchor={() => document.getElementById(`kchev-${pop.c}`)}
          label={`${cols[pop.c].title} column menu`}
          deps={[pop.c]}
          onPick={entry => runMenu(pop.c, entry)}
          onClose={refocus => {
            setPop(null);
            if (refocus) focusGrid();
          }}
        />
      )}
      {pop?.type === 'add' && (
        <Menu
          entries={p.addColumn.items}
          anchor={() => document.getElementById('kg-add')}
          label="Add a column"
          deps={[]}
          onPick={pickAdd}
          onClose={refocus => {
            setPop(null);
            if (refocus) focusGrid();
          }}
        />
      )}
      {pop?.type === 'dropdown' && (
        <DropdownList
          options={cols[pop.c].dataType === 'boolean' ? [{ value: 'true', label: 'Yes', tone: 'green' }, { value: 'false', label: 'No', tone: 'neutral' }] : cols[pop.c].options ?? []}
          value={cols[pop.c].dataType === 'boolean' ? (value(pop.r, pop.c) === null ? null : String(value(pop.r, pop.c))) : (value(pop.r, pop.c) as string | null)}
          seed={pop.seed}
          anchor={() => cellEl(pop.r, pop.c)}
          deps={[pop.r, pop.c]}
          onPick={(o, searched) => pick(pop.r, pop.c, cols[pop.c].dataType === 'boolean' ? o.value === 'true' : o.value, searched)}
          onClose={() => {
            setPop(null);
            focusGrid();
          }}
        />
      )}
      {pop?.type === 'date' && (
        <DatePicker
          value={value(pop.r, pop.c) as string | null}
          anchor={() => cellEl(pop.r, pop.c)}
          deps={[pop.r, pop.c]}
          onPick={iso => pick(pop.r, pop.c, iso, false)}
          onClose={() => {
            setPop(null);
            focusGrid();
          }}
        />
      )}
      {pop?.type === 'help' && (
        <Shortcuts
          onClose={() => {
            setPop(null);
            focusGrid();
          }}
        />
      )}
      <div id="kg-status-live" className="sr" aria-live="polite" />
      <div id="kg-alert" className="sr" role="alert" />
      {editingCell && <span className="sr">{editingCell}</span>}
    </div>
  );
});

// ---------------------------------------------------------------------- header cell

function HeaderCell(props: {
  col: Column;
  c: number;
  width: number;
  left?: number;
  frozen: boolean;
  frozenLast: boolean;
  selected: boolean;
  hasError: boolean;
  busy: boolean;
  menuLocked: boolean;
  lockedLabel?: string;
  open: boolean;
  renaming: { text: string; saving: boolean; error: string | null } | null;
  onRenameChange: (t: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onDown: (e: React.MouseEvent) => void;
  onEnter: () => void;
  onChevron: () => void;
  onResize: (e: React.MouseEvent) => void;
  onAutofit: () => void;
}) {
  const { col, c, width } = props;
  // give-way order (edge case 2): the title shrinks to 3 letters first, then trailing badges hide from the end
  const badges = (col.badges ?? []).slice();
  const hidden: string[] = [];
  const avail = width - 16 - (props.hasError ? 18 : 0) - 24;
  const minTitle = Math.min(measure(col.title, FONT_HEAD), measure(col.title.slice(0, 3) + '…', FONT_HEAD));
  const bw = (n: number) => (n ? 6 + n * 12 + (n - 1) * 4 : 0);
  while (badges.length && avail - bw(badges.length) < minTitle) hidden.unshift(badges.pop()!.label);
  const sort = col.badges?.find(b => b.icon === 'sort-asc' || b.icon === 'sort-desc');
  const tip = [col.title, ...(col.badges ?? []).map(b => b.label)].join(' · ');
  return (
    <div
      id={`kh-${c}`}
      role="columnheader"
      aria-colindex={c + 2}
      aria-sort={sort ? (sort.icon === 'sort-asc' ? 'ascending' : 'descending') : undefined}
      aria-label={`${col.title}${props.hasError ? ', has errors' : ''}${(col.badges ?? []).map(b => ', ' + b.label).join('')}`}
      className={`kc hc${props.frozen ? ' fz' : ''}${props.frozenLast ? ' fz-last' : ''}${props.selected ? ' sel' : ''}${props.open || props.busy ? ' showchev' : ''}`}
      style={{ width, left: props.left }}
      onMouseDown={props.onDown}
      onMouseEnter={props.onEnter}
      title={hidden.length ? `${tip}` : undefined}
    >
      {props.hasError && <Icon name="error" size={12} className="err" />}
      {props.renaming ? (
        <input
          className="ren"
          autoFocus
          aria-label="Column name"
          readOnly={props.renaming.saving}
          value={props.renaming.text}
          onFocus={e => e.target.select()}
          onChange={e => props.onRenameChange(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === 'Enter') props.onRenameCommit();
            else if (e.key === 'Escape') props.onRenameCancel();
          }}
        />
      ) : (
        <span className="ht">{col.title}</span>
      )}
      {!props.renaming &&
        badges.map(b => (
          <span key={b.icon} className={`badge${b.active ? ' act' : ''}`} title={b.label}>
            <Icon name={b.icon} size={12} />
          </span>
        ))}
      <button
        id={`kchev-${c}`}
        className={`chev${props.busy ? ' working' : ''}`}
        tabIndex={-1}
        aria-label={props.busy ? 'Working…' : `${col.title} column menu`}
        aria-haspopup="menu"
        aria-expanded={props.open}
        title={props.busy ? 'Working…' : props.menuLocked ? `Wait for “${props.lockedLabel}” to finish` : 'Column menu (Shift+F10)'}
        disabled={props.menuLocked}
        onMouseDown={e => e.stopPropagation()}
        onClick={props.onChevron}
      >
        <Icon name={props.busy ? 'spin' : 'chev'} className={props.busy ? 'spin' : ''} />
      </button>
      <span className="rz" onMouseDown={props.onResize} onDoubleClick={props.onAutofit} title="Drag to resize · double-click to fit" />
    </div>
  );
}

// ---------------------------------------------------------------------- body row

const RowView = memo(function RowView(props: {
  r: number;
  row: Row;
  cols: Column[];
  lefts: number[];
  frozen: number;
  edits: Map<string, Edit>;
  errors: Map<string, CellError>;
  sig: string;
  activeCol: number;
  current: boolean;
  editor: ReactNode;
  editingCol: number;
  signals?: { unsaved: boolean; problem: boolean };
  copied: string;
  rowSelected: boolean;
  widthOf: (c: Column) => number;
  onDown: (e: React.MouseEvent, r: number, c: number) => void;
  onEnter: (r: number, c: number) => void;
  onRowDown: (e: React.MouseEvent, r: number) => void;
  onDbl: (r: number, c: number) => void;
}) {
  const { r, row, cols } = props;
  const [c0, c1, edges] = props.sig ? props.sig.split(':') : ['-1', '-1', '00'];
  const [k0, k1, kedges] = props.copied ? props.copied.split(':') : ['-1', '-1', '00'];
  const s0 = Number(c0);
  const s1 = Number(c1);
  return (
    <div className={`kg-row body${r % 2 ? ' odd' : ''}${props.current ? ' cur' : ''}`} role="row" aria-rowindex={r + 2}>
      <div
        className={`kc gut${props.rowSelected ? ' sel' : ''}`}
        role="rowheader"
        aria-colindex={1}
        onMouseDown={e => props.onRowDown(e, r)}
        onMouseEnter={() => props.onEnter(r, -1)}
      >
        {props.signals?.unsaved && <i className="m-edit" title="Unsaved changes in this row" />}
        {props.signals?.problem && <i className="m-prob" title="This row has a problem" />}
        {r + 1}
      </div>
      {cols.map((col, c) => {
        const key = k(row.__id, col.id);
        const edit = props.edits.get(key);
        const err = props.errors.get(key);
        const v = edit && edit.valid ? edit.value : (row[col.id] ?? null);
        const editable = isOn(col.editable);
        const inSel = c >= s0 && c <= s1;
        const active = c === props.activeCol;
        const isEditing = c === props.editingCol;
        const shadows: string[] = [];
        if (inSel && !(s0 === s1 && edges === '11')) {
          if (edges[0] === '1') shadows.push('inset 0 1px 0 var(--kg-selection-color)');
          if (edges[1] === '1') shadows.push('inset 0 -1px 0 var(--kg-selection-color)');
          if (c === s0) shadows.push('inset 1px 0 0 var(--kg-selection-color)');
          if (c === s1) shadows.push('inset -1px 0 0 var(--kg-selection-color)');
        }
        const inCopy = props.copied && c >= Number(k0) && c <= Number(k1);
        const cls = [
          'kc',
          'cell',
          alignOf(col) === 'right' ? 'num' : '',
          tabularOf(col) ? 'tnum' : '',
          c < props.frozen ? 'fz' : '',
          c === props.frozen - 1 ? 'fz-last' : '',
          inSel && !active ? 'in' : '',
          active ? 'active' : '',
          err || (edit && !edit.valid) ? 'err' : '',
          edit ? 'unsaved' : '',
          inCopy ? `copied${kedges[0] === '1' ? ' ct' : ''}${kedges[1] === '1' ? ' cb' : ''}${c === Number(k0) ? ' cl' : ''}${c === Number(k1) ? ' cr' : ''}` : '',
          isEditing ? 'editing' : '',
        ].join(' ');
        const reason = err?.reason ?? (edit && !edit.valid ? edit.error : undefined);
        let content: ReactNode;
        if (edit && !edit.valid) content = <span className="v">{edit.text}</span>;
        else if (v === null || v === '') {
          content = editable ? <span className="ph">{col.placeholder ?? (col.dataType === 'dropdown' ? 'Pick a value' : col.dataType === 'number' ? 'Enter a number' : col.dataType === 'boolean' ? 'Yes or No' : 'Type here')}</span> : null;
        } else if (col.dataType === 'dropdown') {
          const o = col.options?.find(x => x.value === v);
          content = o ? <Pill option={o} chevron={editable} /> : <span className="v">{String(v)}</span>;
        } else if (col.dataType === 'boolean') {
          content = <Pill option={{ value: String(v), label: v ? 'Yes' : 'No', tone: v ? 'green' : 'neutral' }} chevron={editable} />;
        } else content = <span className="v">{display(col, v)}</span>;
        return (
          <div
            key={col.id}
            id={`kc-${r}-${c}`}
            role="gridcell"
            aria-colindex={c + 2}
            aria-selected={inSel || active}
            aria-readonly={!editable}
            aria-invalid={!!reason}
            className={cls}
            style={{ width: props.widthOf(col), left: c < props.frozen ? props.lefts[c] : undefined, boxShadow: !active && !err && shadows.length ? shadows.join(',') : undefined }}
            title={reason ?? undefined}
            onMouseDown={e => props.onDown(e, r, c)}
            onMouseEnter={() => props.onEnter(r, c)}
            onDoubleClick={() => props.onDbl(r, c)}
          >
            {isEditing ? props.editor : content}
            {col.dataType === 'date' && editable && !isEditing && <span className="dateic" aria-hidden><Icon name="calendar" size={12} /></span>}
            {reason && <span className="sr">. {err?.kind === 'notSaved' ? 'Not saved. ' : ''}{reason}</span>}
            {edit && !reason && <span className="sr">. Unsaved change</span>}
          </div>
        );
      })}
    </div>
  );
});

// ---------------------------------------------------------------------- status bar and notice list

const NOTICE_ICON = { error: 'error', warning: 'warn', info: 'info' } as const;

function where(n: Notice, cols: Column[], rows: Row[]) {
  if (!n.cells?.length) return null;
  const c = n.cells[0];
  const col = cols.find(x => x.id === c.colId);
  const r = rows.findIndex(x => x.__id === c.rowId);
  return col && r >= 0 ? `${col.title} · row ${r + 1}` : null;
}

function StatusBar(props: {
  top?: Notice;
  more: number;
  open: boolean;
  right: ReactNode;
  cols: Column[];
  rows: Row[];
  onMore: () => void;
  onJump: (rowId: string, colId: string, keyboard?: boolean) => void;
  onDismiss: (n: Notice) => void;
}) {
  const n = props.top;
  const loc = n ? where(n, props.cols, props.rows) : null;
  return (
    <div
      className="kg-status"
      role="region"
      aria-label="Sheet status"
      tabIndex={-1}
      onKeyDown={e => {
        if (e.key === 'F6' || e.key === 'Escape') {
          e.preventDefault();
          (e.currentTarget.closest('.kg') as HTMLElement | null)?.focus();
        }
      }}
    >
      {n && (
        <div className={`chip ${n.tone}`}>
          <Icon name={NOTICE_ICON[n.tone]} />
          <b>{n.title}</b>
          {n.detail && <span className="why">{n.detail}</span>}
          {loc && n.cells && (
            <button className="lnk" onClick={e => props.onJump(n.cells![0].rowId, n.cells![0].colId, e.detail === 0)}>
              {loc}
            </button>
          )}
          {n.action && (
            <button className="act" onClick={() => n.action!.run()}>
              {n.action.label}
            </button>
          )}
          {n.dismissible && (
            <button className="x" aria-label="Dismiss" onClick={() => props.onDismiss(n)}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      )}
      {props.more > 0 && (
        <button className="more" aria-expanded={props.open} onClick={props.onMore}>
          +{props.more} more
        </button>
      )}
      <span className="sp" />
      <span className="right">{props.right}</span>
    </div>
  );
}

function NoticeList(props: {
  notices: Notice[];
  cols: Column[];
  rows: Row[];
  onJump: (rowId: string, colId: string, keyboard?: boolean) => void;
  onClose: () => void;
  onDismiss: (n: Notice) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const away = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      if (ref.current && !ref.current.contains(t) && !t.closest('.more')) props.onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', away), 0);
    return () => document.removeEventListener('mousedown', away);
  }, [props]);
  return (
    <div
      ref={ref}
      className="kg-pop nlist"
      role="dialog"
      aria-label={`${props.notices.length} messages`}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          props.onClose();
        }
      }}
    >
      {props.notices.map(n => {
        const loc = where(n, props.cols, props.rows);
        return (
          <div key={n.id} className={`ni ${n.tone}`}>
            <Icon name={NOTICE_ICON[n.tone]} />
            <div>
              <b>{n.title}</b>
              {n.detail && <span>{n.detail}</span>}
            </div>
            <span className="sp" />
            {loc && n.cells && (
              <button className="lnk" onClick={e => props.onJump(n.cells![0].rowId, n.cells![0].colId, e.detail === 0)}>
                {loc}
              </button>
            )}
            {n.action && (
              <button className="act" onClick={() => n.action!.run()}>
                {n.action.label}
              </button>
            )}
            {n.dismissible && (
              <button className="x" aria-label={`Dismiss: ${n.title}`} onClick={() => props.onDismiss(n)}>
                <Icon name="x" size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------- keyboard shortcuts sheet

const SHORTCUTS: [string, string][] = [
  ['Arrows', 'Move'], ['Shift + arrows', 'Extend the selection'], ['Ctrl/⌘ + arrows', 'Jump to the edge of the data'],
  ['Home / End', 'Start or end of the row'], ['Ctrl/⌘ + Home / End', 'First or last cell'], ['Page Up / Down', 'Move a screen'],
  ['Type, Enter or F2', 'Edit the cell'], ['Alt + ↓', 'Open a dropdown or date picker'], ['Space', 'Toggle a Yes/No cell'],
  ['Enter / Tab', 'Save the edit and move'], ['Esc', 'Cancel the edit'], ['Delete', 'Clear editable cells'],
  ['Ctrl/⌘ + C / X / V', 'Copy, cut, paste'], ['Shift + Space', 'Select the row'], ['Ctrl/⌘ + Space', 'Select the column'],
  ['Ctrl/⌘ + A', 'Select everything'], ['Shift + F10', 'Open the column menu'], ['F6', 'Go to the status bar'], ['?', 'This list'],
];

function Shortcuts({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="kg-modal" onMouseDown={onClose}>
      <div
        ref={ref}
        className="kg-pop help"
        role="dialog"
        aria-modal
        aria-label="Keyboard shortcuts"
        tabIndex={-1}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === 'Escape' || e.key === '?') {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <div className="hhead">
          <b>Keyboard shortcuts</b>
          <button aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <dl>
          {SHORTCUTS.map(([keys, what]) => (
            <div key={keys}>
              <dt>{keys}</dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
