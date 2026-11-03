import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompactSelection, type GridSelection } from '@glideapps/glide-data-grid';
import { SheetGrid, type SheetGridHandle } from './SheetGrid';
import { FormulaBar, type FormulaBarHandle } from './FormulaBar';
import { SheetFooter, type Aggregate } from './SheetFooter';
import { SheetToolbar } from './toolbar/SheetToolbar';
import { WorkbookHeader } from './WorkbookHeader';
import { colLetter, parseRef, refsIn } from '../engine/formula';
import {
  addSheet, defineName, lastDataRow, rawOf, readOnlyReason, refFor, setCell, shiftFormula, valueOf, type Workbook,
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

export interface WorkbookLiveProps {
  initial: Workbook;
  /** An existing workbook that's already been published (the edit scenario). */
  publishedAlready?: boolean;
}

export const WorkbookLive: React.FC<WorkbookLiveProps> = ({ initial, publishedAlready }) => {
  const [wb, setWb] = useState(initial);
  const [publishCount, setPublishCount] = useState(publishedAlready ? 1 : 0);
  const [dirty, setDirty] = useState(false);
  const past = useRef<Workbook[]>([]);
  const future = useRef<Workbook[]>([]);
  const [activeId, setActiveId] = useState(initial.sheets[0].id);
  const [sel, setSel] = useState<GridSelection>(() => cellSel(0, 0));
  const [editing, setEditing] = useState<Editing | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [showFormulas, setShowFormulas] = useState(false);
  const [search, setSearch] = useState(false);
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
    for (const e of edits) {
      if (readOnlyReason(next, sheetId, e.c, e.r)) continue;
      const out = setCell(next, sheetId, e.c, e.r, e.text);
      next = out.wb;
      lastNote = out.note ?? lastNote;
    }
    if (next !== wb) { commitWb(next); setNote(lastNote ?? null); }
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
      {sheet.kind === 'input' && <span>Input · {sheet.rows.length.toLocaleString()} rows · saves back to the warehouse</span>}
      {sheet.kind === 'local' && <span>Local · lives in this workbook</span>}
    </>
  );

  return (
    <div className={styles.frame}>
      <WorkbookHeader
        wb={wb}
        onRename={(name) => commitWb({ ...wb, name })}
        publishCount={publishCount}
        dirty={dirty}
        unsavedInputs={0}
        onPublish={() => {
          setPublishCount((n) => n + 1);
          setDirty(false);
          setNote(publishCount === 0 ? 'Published. Share it now: people you share with see this version.' : 'Changes published. Everyone now sees this version.');
        }}
      />

      <div className={styles.toolbar}>
        <SheetToolbar onAction={(id) => {
          if (id === 'undo') undo();
          else if (id === 'redo') redo();
          else if (id === 'formula') startEdit('=');
        }} />
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

      <div className={styles.gridArea}>
        <SheetGrid
          key={activeId}
          ref={grid}
          wb={wb}
          sheetId={activeId}
          selection={sel}
          onSelection={(s) => { setSel(s); if (!editing) setNote(null); }}
          onEdits={(edits) => applyEdits(edits)}
          onPointCell={pointCell}
          onPointColumn={pointColumn}
          refHighlights={editingHere || editing ? refHighlights : undefined}
          onBlocked={(reason) => setNote(reason)}
          showFormulas={showFormulas}
          onKey={onKey}
          editingCell={editingHere ? { c: editingHere.c, r: editingHere.r, text: editingHere.draft } : undefined}
          showSearch={search}
          onSearchClose={() => setSearch(false)}
        />
      </div>

      <SheetFooter
        sheets={wb.sheets}
        activeId={activeId}
        onSelect={(id) => { setActiveId(id); if (!editing) setSel(cellSel(0, 0)); }}
        onAdd={() => { const out = addSheet(wb, 'local'); commitWb(out.wb); setActiveId(out.id); setSel(cellSel(0, 0)); }}
        agg={agg}
        status={status}
      />
      {/* The canvas grid opens its cell editor in this layer. */}
      <div id="portal" className={styles.portal} />
    </div>
  );
};

export default WorkbookLive;
