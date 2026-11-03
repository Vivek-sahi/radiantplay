import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompactSelection, type GridSelection } from '@glideapps/glide-data-grid';
import { SheetGrid, type SheetGridHandle } from './SheetGrid';
import { FormulaBar, type FormulaBarHandle } from './FormulaBar';
import { SheetFooter, type Aggregate, type SheetAction } from './SheetFooter';
import { SheetToolbar } from './toolbar/SheetToolbar';
import { WorkbookHeader } from './WorkbookHeader';
import { CreatePivotDialog, InsertFunctionDialog, PinDialog } from './WorkbookDialogs';
import { PivotPanel } from './PivotPanel';
import { colLetter, parseRef, refsIn } from '../engine/formula';
import {
  addCsvSheet, addRule, addSheet, createPivot, setPivot, sheetRange, defineName, deleteSheet, duplicateSheet, lastDataRow, moveSheet, pinLiveness, renameSheet, setFormat, sheetCsv, sortRows, typeOf, rawOf, readOnlyReason, refFor, setCell, shiftFormula, valueOf, type ColFormat, type Workbook,
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
}

export const WorkbookLive: React.FC<WorkbookLiveProps> = ({ initial, publishedAlready, onDeleted }) => {
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
  const [showFormulas, setShowFormulas] = useState(false);
  const [search, setSearch] = useState(false);
  const [focusCell, setFocusCell] = useState(false);
  const [painter, setPainter] = useState<ColFormat | null>(null);
  const [insertFn, setInsertFn] = useState(false);
  const [pin, setPin] = useState<{ what: string; live: boolean; reason?: string } | null>(null);
  const [pivotFrom, setPivotFrom] = useState<string | null>(null);
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
    if (next !== wb) { commitWb(next); setNote(lastNote ?? lookupNote(next, edits) ?? null); }
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
      case 'pin': setActiveId(id); setPin({ what: `the ${s.name} sheet`, ...pinLiveness(wb, id, { c1: 0, c2: Math.max(0, s.columns.length - 1), r1: 1, r2: s.rows.length ? lastDataRow(s) : 60 }) }); break;
      case 'make-app': setNote('Make an app comes next: it opens as an App tab beside your sheets'); break;
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
        onPublish={() => {
          setVersions((v) => [...v, { n: v.length + 1, at: 'Just now', wb }]);
          setPublishCount((n) => n + 1);
          setDirty(false);
          setNote(publishCount === 0 ? 'Published. Share it now: people you share with see this version.' : 'Changes published. Everyone now sees this version.');
        }}
      />

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
          onRenameColumn={(c) => {
            setEditing({ sheetId: activeId, c, r: 1, draft: sheet.columns[c]?.title ?? sheet.cells[`${c},1`] ?? '' });
            requestAnimationFrame(() => bar.current?.focus());
            setNote(sheet.columns[c]?.fromModel ? 'Renames the column in this workbook only; the model keeps its name' : null);
          }}
          showSearch={search}
          onSearchClose={() => setSearch(false)}
        />
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
        onSelect={(id) => { setActiveId(id); if (!editing) setSel(cellSel(0, 0)); }}
        onAdd={() => { const out = addSheet(wb, 'local'); commitWb(out.wb); setActiveId(out.id); setSel(cellSel(0, 0)); }}
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
