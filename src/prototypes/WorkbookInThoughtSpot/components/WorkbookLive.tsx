import React, { useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CompactSelection, type GridSelection } from '@glideapps/glide-data-grid';
import { SheetGrid, type SheetGridHandle } from './SheetGrid';
import { FormulaBar, type FormulaBarHandle } from './FormulaBar';
import { SheetFooter, type Aggregate, type SheetAction } from './SheetFooter';
import { SheetToolbar } from './toolbar/SheetToolbar';
import { PlanApp } from './app/PlanApp';
import { MenuBar } from './MenuBar';
import { VariantContext } from './variant';
import { WorkbookHeader } from './WorkbookHeader';
import { CreatePivotDialog, InsertFunctionDialog, PinDialog } from './WorkbookDialogs';
import { PivotPanel } from './PivotPanel';
import { AddColumnMenu, ColumnMenu, type ColumnAction, type NewColumnType } from './ColumnMenu';
import { NewInputTableDialog, SaveInputDialog } from './InputTableDialogs';
import { Button } from '@components/Button';
import { colLetter, parseRef, refsIn } from '../engine/formula';
import {
  addAppSheet, makeInputSheet, type AppSpec,
  addCsvSheet, addRule, addSheet, createPivot, duplicateColumn, insertColumn, removeColumn, appendColumn, newInputTable, unsavedCount, saveInput, discardInput, joinInput, setPivot, sheetRange, defineName, deleteSheet, duplicateSheet, lastDataRow, moveSheet, pinLiveness, renameSheet, setFormat, sheetCsv, sortRows, typeOf, rawOf, readOnlyReason, refFor, setCell, shiftFormula, valueOf, type ColFormat, type Workbook,
} from '../engine/workbook';
import styles from './WorkbookLive.module.css';

// The live workbook (foundations, 3 Nov 2026), Google Sheets in shape and keys, ThoughtSpot in
// what it knows: title · toolbar (ThoughtSpot's spreadsheet spec) · formula bar · canvas grid ·
// footer with typed tabs and the selection's Sum / Average / Count.
// Every edit is one undo step (Ctrl+Z / Ctrl+Y). Excel keys: = starts a formula, F4 locks a
// reference, Alt+= sums, Ctrl+D / Ctrl+R fill, Ctrl+` shows formulas, Ctrl+F finds.

const cellSel = (c: number, gr: number): GridSelection => ({
  current: { cell: [c, gr], range: { x: c, y: gr, width: 1, height: 1 }, rangeStack: [] },
  columns: CompactSelection.empty(),
  rows: CompactSelection.empty(),
});

interface Editing { sheetId: string; c: number; r: number; draft: string }

/** Lookups match by key, not by position: say so once, as the PM's brief does ("Matched by REGION"). */
function lookupNote(wb: Workbook, edits: { text: string }[]): string | undefined {
  for (const e of edits) {
    const m = /\b(XLOOKUP|SUMIFS|COUNTIFS|SUMIF|VLOOKUP)\(([^)]*)/i.exec(e.text);
    if (!m) continue;
    const args = m[2].split(',').map((a) => a.trim());
    const keyArg = m[1].toUpperCase() === 'VLOOKUP' ? args[1] : m[1].toUpperCase() === 'SUMIF' ? args[0] : args[1];
    const ref = keyArg ? parseRef(keyArg) : null;
    if (!ref) continue;
    const target = wb.sheets.find((x) => x.name.toLowerCase() === (ref.sheet ?? '').toLowerCase());
    const title = target?.columns[ref.c1]?.title;
    if (title) return `Matched by ${title}, so it survives refresh and re-sort`;
  }
  return undefined;
}


export interface WorkbookLiveProps {
  initial: Workbook;
  /** An existing workbook that's already been published (the edit scenario). */
  publishedAlready?: boolean;
  /** Leave the workbook after it's deleted. */
  onDeleted?: () => void;
  /** Lets Spotter edit this workbook through the same engine as the user's own edits. */
  agent?: React.Ref<WorkbookAgent>;
}

/** What Spotter can do to an open workbook (Vivek, 3 Nov: the agent-led edit flow). Each action is one
 *  undo step, makes the draft dirty like a hand edit, and shows the user where it happened. */
export interface WorkbookAgent {
  /** Adds a titled column formula beside a Live tab's data. Returns the column, or null if the sheet is missing. */
  addColumnFormula: (sheetName: string, title: string, formula: string) => { col: number; rows: number } | null;
  /** Types a value into one cell (sheet row r, row 1 = header), then shows it. */
  setValue: (sheetName: string, c: number, r: number, text: string) => void;
  /** Goes to a tab and selects a range (sheet rows), so the user sees what Spotter is talking about. */
  show: (sheetName: string, c1: number, c2: number, r1: number, r2: number) => void;
  /** A red-to-green colour scale over one column's rows. */
  colourScale: (sheetName: string, c: number, r1: number, r2: number) => void;
  /** A new pivot tab: one value summed by rows × columns. Returns the new tab's name. */
  pivot: (sourceName: string, rows: string, columns: string, value: string) => string | null;
  publish: () => void;
  /** Pins a whole tab to a Liveboard. Says whether the tile stays live. */
  pin: (sheetName: string, liveboard: string) => { live: boolean; reason?: string };
  /** A local tab becomes an input table (its values save to the warehouse and pin live). */
  makeInput: (sheetName: string, source: string) => void;
  /** Adds an App tab and opens it. */
  addApp: (app: AppSpec) => void;
  /** A cell's computed value (sheet row r), as a number when it is one. */
  value: (sheetName: string, c: number, r: number) => number | string | null;
}

// Pin needs a published workbook (Vivek, 3 Nov): a Liveboard tile shows the version everyone sees, the
// same reason Share waits for Publish. The PM docs have no publish step; this comes from the Apps model.
const PIN_NEEDS_PUBLISH = 'Publish first. A pinned tile shows the published version, so publish your changes, then pin.';

export const WorkbookLive: React.FC<WorkbookLiveProps> = ({ initial, publishedAlready, onDeleted, agent }) => {
  const [wb, setWb] = useState(initial);
  const [publishCount, setPublishCount] = useState(publishedAlready ? 1 : 0);
  const [dirty, setDirty] = useState(false);
  // Published versions and what each one held, so Restore can bring the last one back into the draft.
  const [versions, setVersions] = useState<{ n: number; at: string; wb: Workbook }[]>(() => (publishedAlready ? [{ n: 1, at: 'Yesterday, 4:10 pm', wb: initial }] : []));
  const past = useRef<Workbook[]>([]);
  const future = useRef<Workbook[]>([]);
  const [activeId, setActiveId] = useState(initial.sheets[0].id);
  const [sel, setSel] = useState<GridSelection>(() => cellSel(0, 0));
  const [editing, setEditing] = useState<Editing | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // Notes are passing confirmations: they fade after a few seconds and clear when you change tab (Vivek, 3 Nov).
  // Mode notes (showing formulas, paint format) stay while the mode is on.
  useEffect(() => {
    if (!note || note === 'Showing formulas' || note.startsWith('Paint format')) return;
    const t = window.setTimeout(() => setNote(null), 5000);
    return () => window.clearTimeout(t);
  }, [note]);
  const [showFormulas, setShowFormulas] = useState(false);
  const [search, setSearch] = useState(false);
  const [focusCell, setFocusCell] = useState(false);
  const [painter, setPainter] = useState<ColFormat | null>(null);
  const [insertFn, setInsertFn] = useState(false);
  const [pin, setPin] = useState<{ what: string; live: boolean; reason?: string } | null>(null);
  const [pivotFrom, setPivotFrom] = useState<string | null>(null);
  const [colMenu, setColMenu] = useState<{ c: number; x: number; y: number; w: number; h: number; n: number } | null>(null);
  const [addCol, setAddCol] = useState<{ x: number; y: number; w: number; h: number; n: number } | null>(null);
  const [newInput, setNewInput] = useState(false);
  const [saveFor, setSaveFor] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const grid = useRef<SheetGridHandle>(null);
  const bar = useRef<FormulaBarHandle>(null);

  const sheet = wb.sheets.find((s) => s.id === activeId)!;
  const [ac, agr] = sel.current?.cell ?? [0, 0];
  const ar = agr + 2;

  // ── history ────────────────────────────────────────────────────────────────
  const commitWb = useCallback((next: Workbook) => {
    setWb((prev) => { past.current = [...past.current.slice(-99), prev]; future.current = []; return next; });
    setDirty(true);
  }, []);
  // Spotter's actions read the latest workbook, so two in a row (make an input table, then pin) see
  // each other's changes.
  const latest = useRef(wb);
  latest.current = wb;
  const agentCommit = (next: Workbook) => { latest.current = next; commitWb(next); };
  const showRange = (id: string, c1: number, c2: number, r1: number, r2: number) => {
    setActiveId(id);
    setSel({ current: { cell: [c1, r1 - 2], range: { x: c1, y: r1 - 2, width: c2 - c1 + 1, height: r2 - r1 + 1 }, rangeStack: [] }, columns: CompactSelection.empty(), rows: CompactSelection.empty() });
  };
  const byName = (name: string) => latest.current.sheets.find((x) => x.name === name);
  useImperativeHandle(agent, () => ({
    addColumnFormula: (sheetName, title, formula) => {
      const s = byName(sheetName);
      if (!s) return null;
      const c = s.columns.length;
      let next = setCell(latest.current, s.id, c, 2, formula).wb;
      next = setCell(next, s.id, c, 1, title).wb;
      agentCommit(next);
      setActiveId(s.id);
      // Select the new column so the user sees where Spotter worked.
      setSel({ current: undefined, columns: CompactSelection.fromSingleSelection(c), rows: CompactSelection.empty() });
      setNote(`Spotter added ${title}: one column formula for all ${s.rows.length.toLocaleString()} rows`);
      return { col: c, rows: s.rows.length };
    },
    setValue: (sheetName, c, r, text) => {
      const s = byName(sheetName);
      if (!s) return;
      agentCommit(setCell(latest.current, s.id, c, r, text).wb);
      showRange(s.id, c, c, r, r);
    },
    show: (sheetName, c1, c2, r1, r2) => {
      const s = byName(sheetName);
      if (s) showRange(s.id, c1, c2, r1, r2);
    },
    colourScale: (sheetName, c, r1, r2) => {
      const s = byName(sheetName);
      if (!s) return;
      agentCommit(addRule(latest.current, s.id, { c1: c, c2: c, r1, r2, kind: 'scale' }));
      showRange(s.id, c, c, r1, r2);
      setNote('Spotter added a colour scale: red is lowest, green is highest');
    },
    pivot: (sourceName, rows, columns, value) => {
      const src = byName(sourceName);
      if (!src) return null;
      const out = createPivot(latest.current, src.id, sheetRange(src));
      const cfg = out.wb.sheets.find((x) => x.id === out.id)!.pivot!;
      const next = setPivot(out.wb, out.id, {
        ...cfg,
        rows: [{ field: rows, order: 'asc', totals: true }],
        columns: [{ field: columns, order: 'asc', totals: true }],
        values: [{ field: value, agg: 'sum', show: 'default' }],
      });
      agentCommit(next);
      setActiveId(out.id);
      setSel(cellSel(0, 0));
      return next.sheets.find((x) => x.id === out.id)!.name;
    },
    publish,
    pin: (sheetName, liveboard) => {
      const s = byName(sheetName);
      if (!s) return { live: false };
      const res = pinLiveness(latest.current, s.id, { c1: 0, c2: Math.max(0, s.columns.length - 1), r1: 1, r2: s.rows.length ? lastDataRow(s) : 60 });
      setActiveId(s.id);
      setNote(`Pinned the ${s.name} sheet to “${liveboard}” as a ${res.live ? 'live tile' : 'snapshot'}`);
      return res;
    },
    makeInput: (sheetName, source) => {
      const s = byName(sheetName);
      if (!s) return;
      agentCommit(makeInputSheet(latest.current, s.id, source));
      setNote(`${s.name} is now an input table: ${source}`);
    },
    addApp: (app) => {
      const out = addAppSheet(latest.current, app);
      agentCommit(out.wb);
      setActiveId(out.id);
    },
    value: (sheetName, c, r) => {
      const v = valueOf(latest.current, sheetName, c, r);
      return typeof v === 'number' || typeof v === 'string' ? v : null;
    },
  }), [wb, commitWb, publishCount, dirty]);
  const { menuBar } = useContext(VariantContext);
  const addTab = (kind: 'blank' | 'input' | 'app') => {
    if (kind === 'app') { setNote('Ask Spotter for an app: it builds one as an App tab beside your sheets'); return; }
    if (kind === 'input') { setNewInput(true); return; }
    const out = addSheet(wb, 'local');
    commitWb(out.wb);
    setActiveId(out.id);
    setSel(cellSel(0, 0));
    setNote(null);
  };
  const [headerOpen, setHeaderOpen] = useState<{ what: 'share' | 'versions' | 'details' | 'delete'; n: number }>();
  const publish = () => {
    setVersions((v) => [...v, { n: v.length + 1, at: 'Just now', wb }]);
    setPublishCount((n) => n + 1);
    setDirty(false);
    setNote(publishCount === 0 ? 'Published. Share it now: people you share with see this version.' : 'Changes published. Everyone now sees this version.');
  };
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setWb((cur) => { future.current.push(cur); return prev; });
    setNote('Undone');
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setWb((cur) => { past.current.push(cur); return next; });
    setNote('Redone');
  }, []);

  const applyEdits = useCallback((edits: { c: number; r: number; text: string }[], sheetId = activeId) => {
    let next = wb;
    let lastNote: string | undefined;
    let rejected = 0;
    for (const e of edits) {
      if (readOnlyReason(next, sheetId, e.c, e.r)) continue;
      const out = setCell(next, sheetId, e.c, e.r, e.text);
      next = out.wb;
      if (out.rejected) rejected++;
      lastNote = out.note ?? lastNote;
    }
    // A paste with some wrong-type values: the rest go in, and the note says how many didn't.
    if (rejected > 1) lastNote = `${rejected} values weren't added: they don't match their column's type. ${lastNote ?? ''}`.trim();
    if (next !== wb) { commitWb(next); setNote(lastNote ?? lookupNote(next, edits) ?? null); }
    else if (rejected) setNote(lastNote ?? null);
  }, [wb, activeId, commitWb]);

  // ── editing in the formula bar ─────────────────────────────────────────────
  const startEdit = (text: string) => {
    const reason = readOnlyReason(wb, activeId, ac, ar);
    if (reason) { setNote(reason); return; }
    setEditing({ sheetId: activeId, c: ac, r: ar, draft: text });
    requestAnimationFrame(() => bar.current?.focus());
  };
  const finishEdit = (move: 'down' | 'right' | 'none') => {
    if (!editing) return;
    const { sheetId, c, r, draft } = editing;
    setEditing(null);
    applyEdits([{ c, r, text: draft }], sheetId);
    setActiveId(sheetId);
    const nc = move === 'right' ? c + 1 : c;
    const nr = move === 'down' ? r + 1 : r;
    setSel(cellSel(nc, nr - 2));
    requestAnimationFrame(() => grid.current?.focus());
  };
  const cancelEdit = () => {
    if (!editing) return;
    setActiveId(editing.sheetId);
    setEditing(null);
    requestAnimationFrame(() => grid.current?.focus());
  };

  // Point mode: clicking a cell or a column header while typing a formula inserts its reference.
  const pointCell = (c: number, r: number) => {
    if (!editing || !bar.current?.wantsRef()) return false;
    const target = wb.sheets.find((s) => s.id === activeId);
    bar.current.insert(refFor(target, c, r, wb.sheets.find((s) => s.id === editing.sheetId)?.name).text);
    return true;
  };
  const pointColumn = (c: number) => {
    if (!editing || !bar.current?.wantsRef()) return false;
    const target = wb.sheets.find((s) => s.id === activeId)!;
    const editSheet = wb.sheets.find((s) => s.id === editing.sheetId)!;
    const prefix = target.id !== editSheet.id ? `${/\s/.test(target.name) ? `'${target.name}'` : target.name}!` : '';
    bar.current.insert(`${prefix}${colLetter(c)}:${colLetter(c)}`);
    return true;
  };

  // ── keys the workbook handles before the grid ─────────────────────────────
  const onKey = (k: { key: string; ctrl: boolean; alt: boolean; shift: boolean }) => {
    if (k.key.length === 1 && !k.ctrl && !k.alt) {
      // Every printable key goes to the edit, even while it is still opening, so none are lost.
      if (editing) setEditing((e) => (e ? { ...e, draft: e.draft + k.key } : e));
      else startEdit(k.key);
      return true;
    }
    if (k.alt && (k.key === '=' || k.key === '≠')) { autoSum(); return true; }
    if (k.ctrl && (k.key === 'd' || k.key === 'r')) { fill(k.key === 'd' ? 'down' : 'right'); return true; }
    return false;
  };

  const autoSum = () => {
    const col = sheet.columns[ac];
    if (sheet.kind === 'live' && ar > lastDataRow(sheet)) {
      applyEdits([{ c: ac, r: ar, text: `=SUM(${colLetter(ac)}:${colLetter(ac)})` }]);
      return;
    }
    let top = ar - 1;
    while (top >= 2 && typeof valueOf(wb, sheet.name, ac, top) === 'number') top--;
    if (top < ar - 1 || col) startEdit(`=SUM(${colLetter(ac)}${top + 1}:${colLetter(ac)}${ar - 1})`);
  };

  const fill = (dir: 'down' | 'right') => {
    const range = sel.current?.range;
    if (!range || (dir === 'down' ? range.height : range.width) < 2) return;
    const edits: { c: number; r: number; text: string }[] = [];
    for (let y = range.y; y < range.y + range.height; y++)
      for (let x = range.x; x < range.x + range.width; x++) {
        const sx = dir === 'right' ? range.x : x;
        const sy = dir === 'down' ? range.y : y;
        if (sx === x && sy === y) continue;
        const src = rawOf(sheet, sx, sy + 2);
        edits.push({ c: x, r: y + 2, text: src.startsWith('=') ? shiftFormula(src, y - sy) : src });
      }
    applyEdits(edits);
  };

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const inBar = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (mod && e.key.toLowerCase() === 'z' && !inBar) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (mod && e.key.toLowerCase() === 'y' && !inBar) { e.preventDefault(); redo(); }
      else if (mod && e.key === '`') { e.preventDefault(); setShowFormulas((v) => !v); setNote((v) => (v === 'Showing formulas' ? null : 'Showing formulas')); }
      else if (mod && e.key.toLowerCase() === 'f' && !inBar) { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [undo, redo]);

  // ── toolbar ────────────────────────────────────────────────────────────────
  const selectedCols = (): number[] => {
    const cols = new Set<number>(sel.columns.toArray());
    const rg = sel.current?.range;
    if (rg) for (let x = rg.x; x < rg.x + rg.width; x++) cols.add(x);
    return [...cols];
  };
  const selectedRange = () => {
    const rg = sel.current?.range ?? { x: ac, y: agr, width: 1, height: 1 };
    const single = rg.width === 1 && rg.height === 1;
    // One cell picked: the rule covers that column's data, as Sheets offers.
    return single
      ? { c1: rg.x, c2: rg.x, r1: 2, r2: Math.max(2, sheet.rows.length ? lastDataRow(sheet) : 60) }
      : { c1: rg.x, c2: rg.x + rg.width - 1, r1: rg.y + 2, r2: rg.y + rg.height + 1 };
  };
  const format = (patch: (f: ColFormat, c: number) => ColFormat, said: string) => {
    commitWb(setFormat(wb, activeId, selectedCols(), patch));
    setNote(said);
  };
  const defaultDecimals = (c: number) => { const t = typeOf(sheet, c); return t === 'currency' ? 0 : t === 'percent' ? 1 : 2; };
  const onTool = (id: string) => {
    const cols = selectedCols();
    const label = cols.map(colLetter).join(', ');
    switch (id) {
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'sort-asc': case 'sort-desc':
        if (!sheet.rows.length) { setNote('Sort works on Live and Input tabs'); break; }
        commitWb(sortRows(wb, activeId, ac, id === 'sort-asc' ? 1 : -1));
        setNote(`Sorted by ${sheet.columns[ac]?.title ?? colLetter(ac)}, over all ${sheet.rows.length.toLocaleString()} rows`);
        break;
      case 'cf-scale': commitWb(addRule(wb, activeId, { ...selectedRange(), kind: 'scale' })); setNote('Colour scale added: red is lowest, green is highest'); break;
      case 'cf-negative': commitWb(addRule(wb, activeId, { ...selectedRange(), kind: 'negative' })); setNote('Values below zero are highlighted'); break;
      case 'cf-clear': commitWb(addRule(wb, activeId, null)); setNote('Conditional formatting cleared on this sheet'); break;
      case 'align-left': case 'align-center': case 'align-right': {
        const align = id.slice(6) as ColFormat['align'];
        format((f) => ({ ...f, align }), `Aligned ${label} ${align}`);
        break;
      }
      case 'wrap': format((f) => ({ ...f, wrap: !f.wrap }), `Wrapping turned on or off for ${label}`); break;
      case 'currency': case 'fmt-currency': format((f) => ({ ...f, type: 'currency', decimals: undefined }), `${label} formatted as currency`); break;
      case 'percent': case 'fmt-percent': format((f) => ({ ...f, type: 'percent', decimals: undefined }), `${label} formatted as percent`); break;
      case 'fmt-number': format((f) => ({ ...f, type: 'number', decimals: 2 }), `${label} formatted as number`); break;
      case 'fmt-auto': format(() => ({}), `${label} back to automatic`); break;
      case 'fmt-text': case 'format': format((f) => ({ ...f, type: 'text' }), `${label} shown as plain text`); break;
      case 'dec-down': format((f, c) => ({ ...f, decimals: Math.max(0, (f.decimals ?? defaultDecimals(c)) - 1) }), 'Fewer decimal places'); break;
      case 'dec-up': format((f, c) => ({ ...f, decimals: Math.min(6, (f.decimals ?? defaultDecimals(c)) + 1) }), 'More decimal places'); break;
      case 'painter':
        if (painter) { setPainter(null); setNote(null); break; }
        setPainter(sheet.formats?.[ac] ?? { type: typeOf(sheet, ac) });
        setNote(`Paint format: click a column to give it ${colLetter(ac)}’s format`);
        break;
      case 'formula': setInsertFn(true); break;
      case 'pin': {
        if (publishCount === 0 || dirty) { setNote(PIN_NEEDS_PUBLISH); break; }
        const rg = sel.current?.range;
        const whole = !rg || (rg.width === 1 && rg.height === 1);
        const range = whole ? { c1: 0, c2: Math.max(0, sheet.columns.length - 1), r1: 1, r2: sheet.rows.length ? lastDataRow(sheet) : 60 } : { c1: rg.x, c2: rg.x + rg.width - 1, r1: rg.y + 2, r2: rg.y + rg.height + 1 };
        const what = whole ? `the ${sheet.name} sheet` : `${colLetter(range.c1)}${range.r1}:${colLetter(range.c2)}${range.r2} on ${sheet.name}`;
        setPin({ what, ...pinLiveness(wb, activeId, range) });
        break;
      }
      case 'export': onSheetAction(activeId, 'download-csv'); break;
      case 'focus': setFocusCell((v) => !v); break;
      case 'upload': fileInput.current?.click(); break;
      case 'filter': case 'clear-filter': case 'size': case 'expand':
        setNote('Not in this prototype yet');
        break;
    }
  };

  // ── column actions (the column header ▾ menu) ───────────────────────────────
  const colName = (c: number) => sheet.columns[c]?.title || sheet.cells[`${c},1`] || colLetter(c);
  const selectColumn = (c: number) => setSel({ current: undefined, columns: CompactSelection.fromSingleSelection(c), rows: CompactSelection.empty() });
  const renameColumn = (c: number) => {
    setEditing({ sheetId: activeId, c, r: 1, draft: sheet.columns[c]?.title ?? sheet.cells[`${c},1`] ?? '' });
    requestAnimationFrame(() => bar.current?.focus());
    setNote(sheet.columns[c]?.fromModel ? 'Renames the column in this workbook only; the model keeps its name' : null);
  };
  const onColumnAction = (c: number, a: ColumnAction) => {
    const name = colName(c);
    const colRange = { c1: c, c2: c, r1: 2, r2: Math.max(2, sheet.rows.length ? lastDataRow(sheet) : 60) };
    const formatCol = (patch: (f: ColFormat) => ColFormat, said: string) => { commitWb(setFormat(wb, activeId, [c], patch)); setNote(said); };
    switch (a) {
      case 'insert-left': case 'insert-right': {
        const at = a === 'insert-left' ? c : c + 1;
        commitWb(insertColumn(wb, activeId, at));
        selectColumn(at);
        setNote(`Inserted a column ${a === 'insert-left' ? 'left' : 'right'} of ${name}. Formulas that point past it moved with it.`);
        break;
      }
      case 'calculated': {
        commitWb(insertColumn(wb, activeId, c + 1));
        setSel(cellSel(c + 1, 0));
        setEditing({ sheetId: activeId, c: c + 1, r: 2, draft: '=' });
        requestAnimationFrame(() => bar.current?.focus());
        setNote(sheet.kind === 'live' ? 'Type a formula for row 2, like =C2-D2. It runs for every row.' : 'Type a formula, then fill it down');
        break;
      }
      case 'sort-asc': case 'sort-desc':
        commitWb(sortRows(wb, activeId, c, a === 'sort-asc' ? 1 : -1));
        setNote(`Sorted by ${name}, over all ${sheet.rows.length.toLocaleString()} rows`);
        break;
      case 'filter': case 'input-type': case 'input-key': case 'input-required': case 'input-allowed': case 'input-default':
        setNote('Not in this prototype yet'); break;
      case 'fmt-number': formatCol((f) => ({ ...f, type: 'number', decimals: 2 }), `${name} formatted as number`); break;
      case 'fmt-currency': formatCol((f) => ({ ...f, type: 'currency', decimals: undefined }), `${name} formatted as currency`); break;
      case 'fmt-percent': formatCol((f) => ({ ...f, type: 'percent', decimals: undefined }), `${name} formatted as percent`); break;
      case 'fmt-auto': formatCol(() => ({}), `${name} back to automatic`); break;
      case 'wrap': formatCol((f) => ({ ...f, wrap: !f.wrap }), `Wrapping turned ${sheet.formats?.[c]?.wrap ? 'off' : 'on'} for ${name}`); break;
      case 'cf-scale': commitWb(addRule(wb, activeId, { ...colRange, kind: 'scale' })); setNote('Colour scale added: red is lowest, green is highest'); break;
      case 'cf-negative': commitWb(addRule(wb, activeId, { ...colRange, kind: 'negative' })); setNote('Values below zero are highlighted'); break;
      case 'rename': renameColumn(c); break;
      case 'duplicate':
        commitWb(duplicateColumn(wb, activeId, c));
        selectColumn(c + 1);
        setNote(`Duplicated ${name}`);
        break;
      case 'remove':
        commitWb(removeColumn(wb, activeId, c));
        setSel(cellSel(Math.max(0, c - 1), 0));
        setNote(`Removed ${name}${sheet.columns[c]?.fromModel ? ' from this workbook; the model keeps it' : ''}. Ctrl+Z brings it back.`);
        break;
    }
  };

  // ── sheet-level actions (the tab ▾ menu) ───────────────────────────────────
  const onSheetAction = (id: string, a: SheetAction) => {
    const s = wb.sheets.find((x) => x.id === id)!;
    switch (a) {
      case 'duplicate': { const out = duplicateSheet(wb, id); commitWb(out.wb); setActiveId(out.id); setSel(cellSel(0, 0)); setNote(`Duplicated as “${out.wb.sheets.find((x) => x.id === out.id)?.name}”`); break; }
      case 'copy-link': navigator.clipboard?.writeText(`${window.location.href.split('#')[0]}#sheet=${encodeURIComponent(s.name)}`).catch(() => undefined); setNote(`Link to ${s.name} copied`); break;
      case 'pivot': setPivotFrom(id); break;
      case 'move-left': commitWb(moveSheet(wb, id, -1)); break;
      case 'move-right': commitWb(moveSheet(wb, id, 1)); break;
      case 'refresh': setNote(`${s.name} refreshed from the ${wb.model} model just now`); break;
      case 'pin': if (publishCount === 0 || dirty) { setNote(PIN_NEEDS_PUBLISH); break; } setActiveId(id); setPin({ what: `the ${s.name} sheet`, ...pinLiveness(wb, id, { c1: 0, c2: Math.max(0, s.columns.length - 1), r1: 1, r2: s.rows.length ? lastDataRow(s) : 60 }) }); break;
      case 'make-app': setNote('Make an app comes next: it opens as an App tab beside your sheets'); break;
      case 'save-input':
        if (!unsavedCount(s)) { setNote(`Nothing to save: ${s.name} matches ${s.writesTo ?? 'the warehouse'}`); break; }
        setSaveFor(id);
        break;
      case 'discard-input':
        if (!unsavedCount(s)) { setNote('No unsaved changes'); break; }
        commitWb(discardInput(wb, id));
        setNote(`Discarded ${unsavedCount(s)} unsaved changes. Ctrl+Z brings them back.`);
        break;
      case 'download-csv': {
        const url = URL.createObjectURL(new Blob([sheetCsv(wb, id)], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url; link.download = `${s.name}.csv`; link.click();
        URL.revokeObjectURL(url);
        setNote(`Downloaded ${s.name}.csv`);
        break;
      }
      case 'delete': {
        const i = wb.sheets.findIndex((x) => x.id === id);
        const next = deleteSheet(wb, id);
        commitWb(next);
        setActiveId(next.sheets[Math.max(0, i - 1)].id);
        setSel(cellSel(0, 0));
        setNote(`Deleted ${s.name}. Ctrl+Z brings it back.`);
        break;
      }
    }
  };

  // ── what the formula bar shows ─────────────────────────────────────────────
  const editingHere = editing && editing.sheetId === activeId ? editing : null;
  const barValue = editing ? editing.draft : rawOf(sheet, ac, ar);
  const cellRef = editing
    ? `${editing.sheetId !== activeId ? `${wb.sheets.find((s) => s.id === editing.sheetId)?.name}!` : ''}${colLetter(editing.c)}${editing.r}`
    : Object.entries(wb.names).find(([, t]) => { const p = parseRef(t); return p && p.c1 === ac && p.r1 === ar && (!p.sheet || p.sheet === sheet.name); })?.[0] ?? `${colLetter(ac)}${ar}`;

  // Colour every range the formula refers to on the sheet in view.
  const refHighlights = useMemo(() => {
    if (!editing || !editing.draft.startsWith('=')) return undefined;
    const editSheet = wb.sheets.find((s) => s.id === editing.sheetId)!;
    return refsIn(editing.draft)
      .map((r, i) => ({ ref: parseRef(r.text), color: i }))
      .filter((x) => x.ref && (x.ref.sheet ?? editSheet.name).toLowerCase() === sheet.name.toLowerCase())
      .map(({ ref, color }) => ({ c1: ref!.c1, r1: ref!.r1 ?? 2, c2: ref!.c2, r2: ref!.r2 ?? lastDataRow(sheet), color }));
  }, [editing, wb, sheet]);

  // ── selection totals for the footer ───────────────────────────────────────
  const agg = useMemo<Aggregate>(() => {
    const out = { sum: 0, count: 0, numbers: 0 };
    const ranges = [sel.current?.range, ...(sel.current?.rangeStack ?? [])].filter(Boolean) as { x: number; y: number; width: number; height: number }[];
    if (sel.columns.length) sel.columns.toArray().forEach((c) => ranges.push({ x: c, y: 0, width: 1, height: lastDataRow(sheet) - 1 }));
    for (const rg of ranges)
      for (let y = rg.y; y < rg.y + rg.height && out.count < 50000; y++)
        for (let x = rg.x; x < rg.x + rg.width; x++) {
          const v = valueOf(wb, sheet.name, x, y + 2);
          if (v === null || v === '') continue;
          out.count++;
          if (typeof v === 'number') { out.numbers++; out.sum += v; }
        }
    return out;
  }, [sel, wb, sheet]);

  const pointing = !!editing && editing.draft.startsWith('=');
  const status = (
    <>
      {pointing && <span>Point · click a cell, a column or another tab to insert it</span>}
      {sheet.kind === 'live' && <span>Live · {wb.model} model · {sheet.rows.length.toLocaleString()} rows</span>}
      {sheet.kind === 'input' && (unsavedCount(sheet) ? (
        <>
          <span>Input table · {unsavedCount(sheet).toLocaleString()} unsaved {unsavedCount(sheet) === 1 ? 'change' : 'changes'}</span>
          <Button variant="secondary" size="small" onClick={() => setSaveFor(sheet.id)}>Save input table</Button>
        </>
      ) : (
        <span>Input · {sheet.rows.length.toLocaleString()} rows · {sheet.writesTo ? `saved to ${sheet.writesTo}` : 'saves back to the warehouse'}</span>
      ))}
      {sheet.kind === 'local' && <span>Local · lives in this workbook</span>}
    </>
  );

  // The Google Sheets menu bar (behind the gear): each item runs what the toolbar, the tab menu or the
  // header already does.
  const TOOL_IDS = ['undo', 'redo', 'sort-asc', 'sort-desc', 'cf-scale', 'cf-negative', 'cf-clear', 'align-left', 'align-center', 'align-right', 'wrap', 'fmt-auto', 'fmt-number', 'fmt-currency', 'fmt-percent', 'fmt-text', 'formula', 'upload', 'export', 'focus', 'filter', 'clear-filter', 'expand', 'pin'];
  const key = /Mac/.test(navigator.platform) ? '⌘' : 'Ctrl+';
  const onMenu = (id: string) => {
    if (TOOL_IDS.includes(id)) return onTool(id);
    const open = (what: 'share' | 'versions' | 'details' | 'delete') => setHeaderOpen((o) => ({ what, n: (o?.n ?? 0) + 1 }));
    switch (id) {
      case 'pivot': case 'refresh': return onSheetAction(activeId, id);
      case 'publish': return publish();
      case 'share': case 'versions': case 'details': return open(id);
      case 'delete-workbook': return open('delete');
      case 'copy': return setNote(`Saved a copy, “Copy of ${wb.name}”, to your Workbooks`);
      case 'download-xlsx': return setNote(`Downloading ${wb.name}.xlsx: one tab per sheet, formulas and formats kept`);
      case 'schedule': return setNote('Scheduled delivery opens here: email the workbook as Excel or PDF on a cadence');
      case 'find': return setSearch(true);
      case 'show-formulas': setShowFormulas((v) => !v); return setNote((v) => (v === 'Showing formulas' ? null : 'Showing formulas'));
      case 'sheet': case 'input-table': return addTab(id === 'input-table' ? 'input' : 'blank');
      case 'functions': return setInsertFn(true);
      case 'cut': case 'copy-cells': case 'paste': return setNote(`Use the keyboard: ${key}X cuts, ${key}C copies, ${key}V pastes`);
      case 'spotter': return setNote('Ask Spotter in the panel on the left');
      case 'shortcuts': return setNote(`Excel keys work here: = starts a formula, F4 locks a reference, Alt+= sums, ${key}D fills down, ${key}\` shows formulas, ${key}F finds`);
      default: return setNote('Not in this prototype yet');
    }
  };

  return (
    <div className={styles.frame}>
      <WorkbookHeader
        wb={wb}
        onRename={(name) => commitWb({ ...wb, name })}
        publishCount={publishCount}
        dirty={dirty}
        unsavedInputs={wb.sheets.reduce((n, x) => n + unsavedCount(x), 0)}
        versions={versions}
        onRestore={() => {
          const last = versions[versions.length - 1];
          if (!last) return;
          commitWb(last.wb);
          setDirty(false);
          setNote(`Restored version ${last.n} into your draft`);
        }}
        onCopy={() => setNote(`Saved a copy, “Copy of ${wb.name}”, to your Workbooks`)}
        onDownload={() => setNote(`Downloading ${wb.name}.xlsx: one tab per sheet, formulas and formats kept`)}
        onSchedule={() => setNote('Scheduled delivery opens here: email the workbook as Excel or PDF on a cadence')}
        onDelete={() => onDeleted?.()}
        onPublish={publish}
        open={headerOpen}
      />

      {menuBar && <MenuBar onItem={onMenu} />}
      <div className={styles.toolbar}>
        <SheetToolbar onAction={onTool} active={[...(focusCell ? ['focus'] : []), ...(painter ? ['painter'] : [])]} />
      </div>

      <FormulaBar
        ref={bar}
        cellRef={cellRef}
        value={barValue}
        editing={!!editing}
        onStartEdit={startEdit}
        onChange={(draft) => setEditing((e) => (e ? { ...e, draft } : e))}
        onCommit={finishEdit}
        onCancel={cancelEdit}
        onNameBox={(text) => {
          if (!text) return;
          const ref = parseRef(text);
          if (ref) { setSel(cellSel(ref.c1, (ref.r1 ?? 2) - 2)); grid.current?.select(ref.c1, ref.r1 ?? 2); return; }
          if (/^[A-Za-z_][\w.]*$/.test(text)) {
            const target = wb.names[text];
            if (target) { const p = parseRef(target); if (p) { const s = wb.sheets.find((x) => x.name === p.sheet); if (s) setActiveId(s.id); grid.current?.select(p.c1, p.r1 ?? 2); } return; }
            commitWb(defineName(wb, text, `${/\s/.test(sheet.name) ? `'${sheet.name}'` : sheet.name}!$${colLetter(ac)}$${ar}`));
            setNote(`Named ${colLetter(ac)}${ar} "${text}". Use it in any formula on any tab.`);
          }
        }}
        note={note}
      />

      <div className={styles.gridRow}>
      <div className={styles.gridArea}>
        {sheet.kind === 'app' ? (
          <PlanApp wb={wb} sheet={sheet} onChange={commitWb} onNote={setNote} />
        ) : (
        <SheetGrid
          key={activeId}
          ref={grid}
          wb={wb}
          sheetId={activeId}
          selection={sel}
          onSelection={(s) => {
            if (painter && s.current) {
              const c = s.current.cell[0];
              commitWb(setFormat(wb, activeId, [c], () => painter));
              setPainter(null);
              setNote(`Format painted onto ${colLetter(c)}`);
            } else if (!editing) setNote(null);
            setSel(s);
          }}
          onEdits={(edits) => applyEdits(edits)}
          onPointCell={pointCell}
          onPointColumn={pointColumn}
          refHighlights={editingHere || editing ? refHighlights : undefined}
          onBlocked={(reason) => setNote(reason)}
          showFormulas={showFormulas}
          onKey={onKey}
          editingCell={editingHere ? { c: editingHere.c, r: editingHere.r, text: editingHere.draft } : undefined}
          focus={focusCell ? { c: ac, r: ar } : undefined}
          onRenameColumn={renameColumn}
          onAddColumn={sheet.pivot || sheet.kind === 'local' ? undefined : (b) => {
            if (editing) return;
            if (sheet.kind === 'live') {
              // The formula flow: a new column at the end, with a formula started on row 2.
              const out = appendColumn(wb, activeId, { title: '', type: 'text', width: 120 });
              commitWb(out.wb);
              setSel(cellSel(out.c, 0));
              setEditing({ sheetId: activeId, c: out.c, r: 2, draft: '=' });
              requestAnimationFrame(() => bar.current?.focus());
              setNote('Type a formula for row 2, like =D2-E2. It runs for every row.');
              return;
            }
            setAddCol((m) => ({ x: b.x, y: b.y, w: b.width, h: b.height, n: (m?.n ?? 0) + 1 }));
          }}
          onColumnMenu={sheet.pivot ? undefined : (c, b) => {
            if (editing) return;
            selectColumn(c);
            setColMenu((m) => ({ c, x: b.x, y: b.y, w: b.width, h: b.height, n: (m?.n ?? 0) + 1 }));
          }}
          showSearch={search}
          onSearchClose={() => setSearch(false)}
        />
        )}
      </div>
      {sheet.pivot && (
        <PivotPanel
          cfg={sheet.pivot}
          source={wb.sheets.find((x) => x.id === sheet.pivot!.sourceId) ?? sheet}
          onChange={(cfg) => commitWb(setPivot(wb, activeId, cfg))}
        />
      )}
      </div>

      <SheetFooter
        sheets={wb.sheets}
        activeId={activeId}
        onSelect={(id) => { if (id !== activeId) setNote(null); setColMenu(null); setActiveId(id); if (!editing) setSel(cellSel(0, 0)); }}
        onAdd={addTab}
        onRename={(id, name) => {
          const next = renameSheet(wb, id, name);
          if (next === wb) { setNote(`There's already a sheet called “${name}”`); return; }
          commitWb(next);
          setNote(`Renamed. Formulas that point at this sheet now use “${name}”.`);
        }}
        onAction={onSheetAction}
        agg={agg}
        status={status}
      />
      <InsertFunctionDialog
        isOpen={insertFn}
        onClose={() => setInsertFn(false)}
        onInsert={(name) => { setInsertFn(false); startEdit(`=${name}(`); }}
      />
      {pivotFrom && (
        <CreatePivotDialog
          isOpen
          defaultRange={sheetRange(wb.sheets.find((x) => x.id === pivotFrom)!)}
          emptySheets={wb.sheets.filter((x) => x.kind === 'local' && !x.columns.length && !Object.keys(x.cells).length && !x.pivot).map((x) => ({ id: x.id, name: x.name }))}
          onClose={() => setPivotFrom(null)}
          onCreate={(range, targetId) => {
            const out = createPivot(wb, pivotFrom, range, targetId);
            commitWb(out.wb);
            setPivotFrom(null);
            setActiveId(out.id);
            setSel(cellSel(0, 0));
            setNote('Add a field to Rows, Columns or Values to build the pivot, or pick a suggestion');
          }}
        />
      )}
      {addCol && (
        <AddColumnMenu
          key={addCol.n}
          at={addCol}
          onClose={() => setAddCol(null)}
          onPick={(type: NewColumnType) => {
            const n = sheet.columns.filter((x) => x.input).length + 1;
            const out = appendColumn(wb, activeId, { title: `Column ${n}`, type, width: 140, input: true });
            commitWb(out.wb);
            setSel(cellSel(out.c, 0));
            setEditing({ sheetId: activeId, c: out.c, r: 1, draft: `Column ${n}` });
            requestAnimationFrame(() => bar.current?.focus());
            setNote('Name the column, then type or paste its values');
          }}
        />
      )}
      {newInput && (
        <NewInputTableDialog
          isOpen
          wb={wb}
          defaultName={`Input table ${wb.sheets.filter((x) => x.kind === 'input').length + 1}`}
          onClose={() => setNewInput(false)}
          onCreate={(spec) => {
            setNewInput(false);
            if (wb.sheets.some((x) => x.name.toLowerCase() === spec.name.toLowerCase())) { setNote(`There's already a sheet called “${spec.name}”`); return; }
            const out = newInputTable(wb, spec);
            commitWb(out.wb);
            setActiveId(out.id);
            setSel(cellSel(0, 0));
            const keys = out.wb.sheets.find((x) => x.id === out.id)!.columns.map((k) => k.title).join(' and ');
            setNote(spec.keysFrom ? `${out.rows.toLocaleString()} rows, one for each ${keys}. Add a column with +.` : 'Add a column with +, then type or paste rows');
          }}
        />
      )}
      {saveFor && (() => {
        const s = wb.sheets.find((x) => x.id === saveFor)!;
        return (
          <SaveInputDialog
            isOpen
            sheet={s}
            changes={unsavedCount(s)}
            joined={!!s.joinedTo}
            onClose={() => setSaveFor(null)}
            onSave={(join) => {
              setSaveFor(null);
              let next = saveInput(wb, s.id);
              let said = `Saved ${s.name} to ${s.writesTo}`;
              if (join) {
                const out = joinInput(next, s.id);
                next = out.wb;
                if (out.added.length) said += `. Added ${out.added.join(', ')} to ${out.target}, matched by ${s.columns.filter((k) => k.key).map((k) => k.title).join(' and ')}.`;
              }
              commitWb(next);
              setNote(said);
            }}
          />
        );
      })()}
      {colMenu && sheet.kind !== 'app' && (
        <ColumnMenu key={colMenu.n} sheet={sheet} at={colMenu} onAction={onColumnAction} onClose={() => setColMenu(null)} />
      )}
      {pin && (
        <PinDialog
          isOpen
          what={pin.what}
          live={pin.live}
          reason={pin.reason}
          onClose={() => setPin(null)}
          onPin={(lb) => { setPin(null); setNote(`Pinned ${pin.what} to “${lb}” as a ${pin.live ? 'live tile' : 'snapshot'}`); }}
        />
      )}
      {/* Upload: the toolbar's upload button opens the file browser. A CSV becomes a new Local tab. */}
      <input
        ref={fileInput}
        type="file"
        accept=".csv,.xlsx,.xls"
        className={styles.hiddenFile}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (!/\.csv$/i.test(file.name)) { setNote(`${file.name}: Excel files with formulas come in a later step; this prototype reads CSV`); return; }
          const out = addCsvSheet(wb, file.name, await file.text());
          commitWb(out.wb);
          setActiveId(out.id);
          setSel(cellSel(0, 0));
          setNote(`Uploaded ${file.name}: ${out.rows.toLocaleString()} rows on a new local tab`);
        }}
      />
      {/* The canvas grid opens its cell editor in this layer. */}
      <div id="portal" className={styles.portal} />
    </div>
  );
};

export default WorkbookLive;
