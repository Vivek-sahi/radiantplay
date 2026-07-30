import React from 'react';
import { ff } from '../styles';
import { AnchoredMenu } from './AnchoredMenu';

// ── Spreadsheet component ─────────────────────────────────────────────────────
// The data grid extracted from ModelCanvas. All new spreadsheet UI (toolbar,
// column menu, footer, styling) is built here going forward. Stage 1: the grid.

const BORDER = `1px solid #EAEDF2`;
const NUMERIC_TYPES = ['INT', 'FLOAT', 'DECIMAL', 'NUMERIC', 'INTEGER', 'BIGINT'];

type Row = (string | number | boolean | null)[];
type Sort = { col: string; dir: 'asc' | 'desc' } | null;
type ColMenu = { col: string; x: number; y: number } | null;

export interface SpreadsheetGridProps {
  tableCols: [string, string][];
  isInput: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  rows: Row[];
  outputRows: Row[];
  previewSort: Sort;
  previewColMenu: ColMenu;
  setPreviewColMenu: React.Dispatch<React.SetStateAction<ColMenu>>;
  hiddenPreviewCols: Set<string>;
  highlightedCol: string | null;
  derivedCols: Record<string, (string | number | null)[]>;
  /** Columns still computing — cells render a shimmer instead of a value. */
  loadingCols?: Set<string>;
  inputFixes: Record<string, string>;
  outputFixes: Record<string, string>;
}

export function SpreadsheetGrid({
  tableCols, isInput, scrollRef, rows, outputRows, previewSort,
  previewColMenu, setPreviewColMenu, hiddenPreviewCols, highlightedCol,
  derivedCols, loadingCols, inputFixes, outputFixes,
}: SpreadsheetGridProps) {
  const numericTypes = NUMERIC_TYPES;
  return (
    <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
      <style>{`@keyframes colFade { 0%{background:rgba(39,112,239,0.18)} 70%{background:rgba(39,112,239,0.10)} 100%{background:transparent} }
        @keyframes cellShimmer { 0%{background-position:-180px 0} 100%{background-position:180px 0} }`}</style>
      <table style={{ borderCollapse: 'collapse', fontSize: 11.5, tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
        <thead>
          <tr style={{ background: '#F6F8FA', position: 'sticky', top: 0, zIndex: 2 }}>
            <th style={{ width: 36, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontWeight: 600, fontSize: 10, textAlign: 'center' }}>#</th>
            {tableCols.map(([col, type]) => {
              if (hiddenPreviewCols.has(col)) return null;
              const isNew = !isInput && col === highlightedCol;
              return (
                <th key={col} data-col={col} style={{
                  padding: '5px 12px', borderRight: BORDER, borderBottom: BORDER,
                  textAlign: numericTypes.includes(type) ? 'right' : 'left',
                  whiteSpace: 'nowrap', fontWeight: 600, color: isNew ? '#2770EF' : '#1D232F',
                  minWidth: numericTypes.includes(type) ? 72 : 100,
                  background: previewColMenu?.col === col ? '#EAF1FE' : undefined,
                  animation: isNew ? 'colFade 2.4s ease forwards' : 'none',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: numericTypes.includes(type) ? 'flex-end' : 'flex-start' }}>
                    {col}
                    {isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#2770EF', color: '#fff', letterSpacing: '0.02em' }}>NEW</span>}
                    {previewSort?.col === col && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ color: '#2770EF', flexShrink: 0 }}><path d={previewSort.dir === 'asc' ? 'M6 9V3M3.5 5.5L6 3l2.5 2.5' : 'M6 3v6M3.5 6.5L6 9l2.5-2.5'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPreviewColMenu(prev => prev?.col === col ? null : { col, x: Math.min(r.left, window.innerWidth - 226), y: r.bottom + 4 }); }}
                      title="Column options"
                      style={{ width: 16, height: 16, marginLeft: 'auto', flexShrink: 0, border: 'none', background: previewColMenu?.col === col ? '#E7EEFB' : 'transparent', borderRadius: 3, color: previewColMenu?.col === col ? '#2770EF' : '#A5ACB9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E7EEFB'; (e.currentTarget as HTMLElement).style.color = '#2770EF'; }}
                      onMouseLeave={e => { const active = previewColMenu?.col === col; (e.currentTarget as HTMLElement).style.background = active ? '#E7EEFB' : 'transparent'; (e.currentTarget as HTMLElement).style.color = active ? '#2770EF' : '#A5ACB9'; }}
                    >
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const baseRows = isInput ? rows : outputRows;
            const indexed = baseRows.map((r, i) => [r, i] as [Row, number]);
            if (previewSort) {
              const sci = tableCols.findIndex(c => c[0] === previewSort.col);
              if (sci >= 0) {
                indexed.sort(([a], [b]) => {
                  const av = a[sci], bv = b[sci];
                  if (av === null || av === undefined) return 1;
                  if (bv === null || bv === undefined) return -1;
                  if (typeof av === 'number' && typeof bv === 'number') return av - bv;
                  return String(av).localeCompare(String(bv));
                });
                if (previewSort.dir === 'desc') indexed.reverse();
              }
            }
            if (indexed.length === 0) return (
              <tr><td colSpan={tableCols.length + 1} style={{ padding: '20px', textAlign: 'center', color: '#A5ACB9', fontSize: 12 }}>No rows</td></tr>
            );
            return indexed.map(([row, origIdx], ri) => (
            <tr key={ri} style={{ background: ri % 2 === 1 ? '#FAFBFC' : '#fff' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EEF2FF'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ri % 2 === 1 ? '#FAFBFC' : '#fff'}
            >
              <td style={{ padding: '4px 8px', borderRight: BORDER, color: '#C0C6CF', fontSize: 10, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{ri + 1}</td>
              {tableCols.map(([col, type], ci) => {
                if (hiddenPreviewCols.has(col)) return null;
                const val = row[ci];
                const isNum = numericTypes.includes(type);
                const isNew = !isInput && col === highlightedCol;
                // Column added but not computed yet — shimmer in place of a value.
                if (loadingCols?.has(col)) {
                  return (
                    <td key={col} style={{ padding: '4px 12px', borderRight: BORDER, whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'block', height: 9, width: `${44 + ((ri * 17) % 26)}%`, borderRadius: 3,
                        background: 'linear-gradient(90deg,#EDF1F6 0%,#F7F9FC 50%,#EDF1F6 100%)',
                        backgroundSize: '360px 100%',
                        animation: 'cellShimmer 1.1s ease-in-out infinite',
                      }} />
                    </td>
                  );
                }
                const activeFixes = isInput ? inputFixes : outputFixes;
                // A code transform (e.g. Python sentiment) supplies values for its new column.
                const derivedVal = derivedCols[col]?.[origIdx];
                const baseVal = (val === null || val === undefined) ? derivedVal : val;
                const fixVal = (baseVal === null || baseVal === undefined) ? activeFixes[col] : undefined;
                const display = (baseVal !== null && baseVal !== undefined)
                  ? (isNew ? <span style={{ color: '#2770EF', fontWeight: 500 }}>{String(baseVal)}</span> : String(baseVal))
                  : isNew
                    ? <span style={{ color: '#2770EF', fontStyle: 'italic' }}>—</span>
                    : fixVal !== undefined
                      ? <span style={{ color: '#06BF7F', fontWeight: 600 }}>{fixVal}</span>
                      : <span style={{ color: '#C0C6CF' }}>null</span>;
                return (
                  <td key={col} style={{
                    padding: '4px 12px', borderRight: BORDER,
                    textAlign: isNum ? 'right' : 'left',
                    color: '#1D232F', fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap', maxWidth: 200,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    background: previewColMenu?.col === col ? 'rgba(39,112,239,0.06)' : fixVal !== undefined ? 'rgba(22,163,74,0.08)' : undefined,
                    animation: isNew ? 'colFade 2.4s ease forwards' : 'none',
                  }}>{display}</td>
                );
              })}
            </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  );
}

// ── Spreadsheet-level toolbar (Filter · Formula · Clean) ────
// Preview-header keeps: Data|Semantic · Limit · Expand.
// Hide/show columns lives in the column ▾ menu.
export interface SpreadsheetToolbarProps {
  onFilter: () => void;
  onFormula: () => void;
  cleanOptions: { op: string; label: string; icon: React.ReactNode }[];
  onClean: (op: string) => void;
}

export function SpreadsheetToolbar({ onFilter, onFormula, cleanOptions, onClean }: SpreadsheetToolbarProps) {
  const [prepOpen, setPrepOpen] = React.useState(false);
  const prepBtnRef = React.useRef<HTMLDivElement>(null);
  const iconBtn = (title: string, svg: React.ReactNode, onClick: () => void) => (
    <button onClick={onClick} title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 24, padding: 0, borderRadius: 5, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontFamily: ff.primary }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
    >{svg}</button>
  );
  const menuBtn = (label: string | null, svg: React.ReactNode, open: boolean, toggle: () => void) => (
    <button onClick={toggle} title={label ?? 'Show / hide columns'}
      style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: label ? '0 7px' : '0 7px', borderRadius: 5, border: 'none', background: open ? '#F6F8FA' : 'transparent', color: open ? '#1D232F' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff.primary }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
      onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; } }}
    >{svg}{label}{label && <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 1 }}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}</button>
  );
  const menuItem = (label: string, onClick: () => void) => (
    <button key={label} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12, fontWeight: 500, color: '#1D232F' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
      {iconBtn('Filter', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12l-4.5 5.5v3.5l-3-1.5v-2L2 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>, onFilter)}
      {iconBtn('Formula', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, onFormula)}
      <div ref={prepBtnRef} style={{ position: 'relative' }}>
        {menuBtn(null, <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M3.26665 4.13194H10.7333L10.3933 6.26547C10.3752 6.3502 10.3353 6.43034 10.2764 6.49997C10.2176 6.56959 10.1413 6.62692 10.0533 6.66771L8.26664 7.50093C8.15398 7.55241 8.06082 7.63066 7.99819 7.72639C7.93557 7.82213 7.90611 7.93134 7.91331 8.04107L8.29331 13.3909C8.29877 13.4692 8.28557 13.5476 8.25452 13.6214C8.22347 13.6951 8.17523 13.7626 8.11277 13.8197C8.05031 13.8767 7.97496 13.9222 7.89136 13.9532C7.80775 13.9842 7.71766 14.0001 7.62664 14H6.36665C6.27622 14.0001 6.18672 13.9843 6.10358 13.9536C6.02045 13.923 5.94542 13.8781 5.88306 13.8216C5.82069 13.7652 5.7723 13.6984 5.74083 13.6253C5.70936 13.5523 5.69546 13.4745 5.69998 13.3966L6.03331 8.03533C6.04049 7.92773 6.01241 7.82057 5.95229 7.72607C5.89217 7.63157 5.80243 7.55356 5.69332 7.50093L3.95332 6.67921C3.86495 6.63659 3.78901 6.57719 3.73126 6.5055C3.6735 6.43381 3.63545 6.35173 3.61999 6.26547L3.26665 4.13194ZM2.33332 0H4.01999L5.13332 0.826387L6.06665 0H11.6666L10.7333 3.30555H3.26665L2.33332 0Z" fill="currentColor"/></svg>, prepOpen, () => setPrepOpen(o => !o))}
        {prepOpen && (
          <AnchoredMenu open={prepOpen} anchorRef={prepBtnRef} onClose={() => setPrepOpen(false)} placement="bottom-start" style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', width: 168, maxHeight: 280, overflowY: 'auto', padding: '4px 0' }}>
            {cleanOptions.map(({ op, label }) => menuItem(label, () => { setPrepOpen(false); onClean(op); }))}
          </AnchoredMenu>
        )}
      </div>
    </div>
  );
}

// ── Data-tab toolbar — Google-Sheets-style chrome for the full "Data" tab ──────
// Sort/Filter/Formula/Download/Expand are real (Download builds a CSV; Expand
// toggles the browser-panel width). Undo/Redo/format-paint/Align/Wrap/$/%/
// decimals/number-format/Fill-color are present and clickable for visual parity
// with a real spreadsheet toolbar, but don't persist any formatting state —
// this is a data-modeling prototype, not a spreadsheet engine.
export interface DataSheetToolbarProps {
  onDownloadCsv: () => void;
  onToggleExpand: () => void;
  expanded: boolean;
  // Filter/Formula open the shared properties panel (via a "which table?" picker
  // in the parent, since the Data sheet merges every table).
  onFilter?: () => void;
  onFormula?: () => void;
}

const NUMBER_FORMATS = ['Automatic', 'Number', 'Currency', 'Percent', 'Date'];

export function DataSheetToolbar({ onDownloadCsv, onToggleExpand, expanded, onFilter, onFormula }: DataSheetToolbarProps) {
  const [formatOpen, setFormatOpen] = React.useState(false);
  const formatBtnRef = React.useRef<HTMLDivElement>(null);

  const iconBtn = (title: string, svg: React.ReactNode, onClick?: () => void) => (
    <button onClick={onClick} title={title}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, padding: 0, borderRadius: 5, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontFamily: ff.primary }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
    >{svg}</button>
  );
  // Same icon-button shape, plus a small trailing dropdown caret — matches the
  // reference toolbar's Sort/Align/Wrap/Download buttons, which each show one.
  const iconCaretBtn = (title: string, svg: React.ReactNode, onClick?: () => void) => (
    <button onClick={onClick} title={title}
      style={{ display: 'flex', alignItems: 'center', gap: 1, height: 24, padding: '0 3px 0 6px', borderRadius: 5, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontFamily: ff.primary }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
    >{svg}<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
  );
  const divider = <div style={{ width: 1, height: 16, background: '#E2E6EC', margin: '0 3px', flexShrink: 0 }} />;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '4px 10px', borderBottom: BORDER, background: '#fff', flexShrink: 0, overflowX: 'auto' }}>
      {iconBtn('Undo', <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 14 4 9l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
      {iconBtn('Redo', <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M15 14l5-5-5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
      {divider}
      {iconCaretBtn('Sort range', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4.5 12.5V3.5M4.5 3.5 2 6M4.5 3.5 7 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M11.5 3.5v9M11.5 12.5 9 10M11.5 12.5 14 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
      {divider}
      {iconBtn('Format paint', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2h8v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 7v2H4a1 1 0 0 0-1 1v3h6v-3a1 1 0 0 0-1-1h-2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11 9.5h2a1 1 0 0 1 1 1V14h-3v-4.5z" fill="currentColor"/></svg>)}
      {divider}
      {iconCaretBtn('Align', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M2.5 7.5h7M2.5 11h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>)}
      {iconCaretBtn('Wrap text', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M2.5 7.5h7.5a2 2 0 0 1 0 4H8M8 11.5l1.8-1.8L8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.5 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>)}
      {divider}
      {iconBtn('Format as currency', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2.5v11M10.5 5c0-1.1-1.1-2-2.5-2s-2.5.7-2.5 1.8c0 2.4 5 1.1 5 3.5 0 1.1-1.1 1.8-2.5 1.8S5.5 11.3 5.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>)}
      {iconBtn('Format as percent', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="4.5" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/><circle cx="11.5" cy="11.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/><path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>)}
      {iconBtn('Decrease decimal places', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 8h4M4 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><text x="7.5" y="10.5" fontSize="6.5" fontWeight="700" fill="currentColor">.0</text></svg>)}
      {iconBtn('Increase decimal places', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 8h-4M11 6l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><text x="1.5" y="10.5" fontSize="6.5" fontWeight="700" fill="currentColor">.00</text></svg>)}
      <div ref={formatBtnRef} style={{ position: 'relative' }}>
        <button onClick={() => setFormatOpen(o => !o)} title="Number format"
          style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24, padding: '0 6px', borderRadius: 5, border: 'none', background: formatOpen ? '#F6F8FA' : 'transparent', color: formatOpen ? '#1D232F' : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; }}
          onMouseLeave={e => { if (!formatOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >123<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        {formatOpen && (
          <AnchoredMenu open={formatOpen} anchorRef={formatBtnRef} onClose={() => setFormatOpen(false)} placement="bottom-start" style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', width: 150, padding: '4px 0' }}>
            {NUMBER_FORMATS.map(f => (
              <button key={f} onClick={() => setFormatOpen(false)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12, fontWeight: 500, color: '#1D232F' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >{f}</button>
            ))}
          </AnchoredMenu>
        )}
      </div>
      {divider}
      {iconBtn('Fill color', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8.5 8.5 4l4.5 4.5-4.5 4.5L4 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 11c-.6.6-1 1.2-1 1.8C2 13.7 2.9 14 3.5 14s1.5-.3 1.5-1.2c0-.6-.4-1.2-1-1.8" fill="currentColor"/></svg>)}
      {iconBtn('Filter', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12l-4.5 5.5v3.5l-3-1.5v-2L2 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>, onFilter)}
      {iconBtn('Formula', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, onFormula)}
      {divider}
      {iconCaretBtn('Download', <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12.5v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, onDownloadCsv)}
      <div style={{ flex: 1 }} />
      {iconBtn(expanded ? 'Exit full width' : 'Full width', expanded ? (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2v2.5a1.5 1.5 0 0 1-1.5 1.5H2M14 6h-2.5A1.5 1.5 0 0 1 10 4.5V2M10 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H14M2 10h2.5A1.5 1.5 0 0 1 6 11.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 6V3.5A1.5 1.5 0 0 1 3.5 2H6M14 6V3.5A1.5 1.5 0 0 0 12.5 2H10M2 10v2.5A1.5 1.5 0 0 0 3.5 14H6M14 10v2.5a1.5 1.5 0 0 1-1.5 1.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      ), onToggleExpand)}
    </div>
  );
}

// ── Column ▾ menu ─────────────────────────────────────────────────────────────
export interface SpreadsheetColumnMenuProps {
  menu: ColMenu;
  onClose: () => void;
  sort: Sort;
  onSort: (s: Sort) => void;
  onHide: (col: string) => void;
  onAddFormula: () => void;
  onFilter: () => void;
  onClean: (op: string) => void;
  cleanOptions: { op: string; label: string; icon: React.ReactNode }[];
  cleanSubOpen: boolean;
  setCleanSubOpen: (v: boolean) => void;
  // Data-tab (full spreadsheet) variant: the richer Google-Sheets-style menu
  // (calculated field · filter · sort · duplicate · hide · conditional formatting ·
  // format · rename · text wrapping). The added formatting/rename items are visual
  // only — no persistence — consistent with the Data toolbar's chrome.
  extended?: boolean;
}

export function SpreadsheetColumnMenu({ menu, onClose, sort, onSort, onHide, onAddFormula, onFilter, onClean, cleanOptions, cleanSubOpen, setCleanSubOpen, extended }: SpreadsheetColumnMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [clampedPos, setClampedPos] = React.useState<{ left: number; top: number } | null>(null);
  const [sortSubOpen, setSortSubOpen] = React.useState(false);
  const [wrapSubOpen, setWrapSubOpen] = React.useState(false);
  // Clamp the fixed-positioned menu into the viewport once it's measured, so a
  // column menu opened near the bottom/right edge never runs off-screen.
  React.useLayoutEffect(() => {
    if (!menu) { setClampedPos(null); return; }
    const rect = menuRef.current?.getBoundingClientRect();
    const mw = rect?.width ?? 214;
    const mh = rect?.height ?? 0;
    const pad = 8;
    let left = menu.x;
    let top = menu.y;
    if (left + mw + pad > window.innerWidth) left = window.innerWidth - mw - pad;
    if (top + mh + pad > window.innerHeight) top = window.innerHeight - mh - pad;
    setClampedPos({ left: Math.max(pad, left), top: Math.max(pad, top) });
  }, [menu]);
  if (!menu) return null;
  const col = menu.col;
  const close = () => { onClose(); setCleanSubOpen(false); };
  const sortedThis = sort?.col === col;
  const item = (icon: React.ReactNode, label: string, onClick: () => void) => (
    <button
      onClick={() => { close(); onClick(); }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ width: 14, height: 14, flexShrink: 0, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      {label}
    </button>
  );
  const divider = <div style={{ height: 1, background: '#F0F2F6', margin: '4px 0' }} />;
  return (
    <>
      <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 400 }} />
      <div ref={menuRef} style={{ position: 'fixed', left: clampedPos?.left ?? menu.x, top: clampedPos?.top ?? menu.y, visibility: clampedPos ? 'visible' : 'hidden', zIndex: 401, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', width: extended ? 240 : 214, padding: '4px 0', fontFamily: ff.primary }}>
        {extended ? (
          <>
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, 'New calculated field', onAddFormula)}
            {divider}
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12l-4.5 5.5v3.5l-3-1.5v-2L2 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>, 'Filter', onFilter)}
            {/* Sort — hover submenu */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setSortSubOpen(true)} onMouseLeave={() => setSortSubOpen(false)}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', border: 'none', background: sortSubOpen ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}>
                <span style={{ width: 14, height: 14, flexShrink: 0, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5 12.5V3.5M5 3.5 3 5.5M5 3.5 7 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 3.5v9M11 12.5 9 10.5M11 12.5 13 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                Sort
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0, color: '#A5ACB9' }}><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {sortSubOpen && (
                <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', width: 176, padding: '4px 0', fontFamily: ff.primary }}>
                  {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, 'Sort ascending', () => onSort({ col, dir: 'asc' }))}
                  {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M5 9l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, 'Sort descending', () => onSort({ col, dir: 'desc' }))}
                </div>
              )}
            </div>
            {sortedThis
              ? item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, 'Clear sort', () => onSort(null))
              : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#C0C6CF', cursor: 'default' }}>
                  <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg></span>
                  Clear sort
                </div>
              )}
            {divider}
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 5.5V3.7A1.2 1.2 0 0 0 9.3 2.5H3.7A1.2 1.2 0 0 0 2.5 3.7v5.6a1.2 1.2 0 0 0 1.2 1.2h1.8" stroke="currentColor" strokeWidth="1.3"/></svg>, 'Duplicate column', close)}
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.4-4.3 6-4.3S14 8 14 8s-2.4 4.3-6 4.3S2 8 2 8z" stroke="currentColor" strokeWidth="1.2"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, 'Hide column', () => onHide(col))}
            {divider}
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h5M2.5 8h8M2.5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="11.5" y="3" width="2.5" height="2.5" rx="0.5" fill="currentColor"/></svg>, 'Conditional formatting', close)}
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4h8M8 4v9M6.5 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, 'Format', close)}
            {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, 'Rename', close)}
            {/* Text wrapping — hover submenu (visual) */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setWrapSubOpen(true)} onMouseLeave={() => setWrapSubOpen(false)}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', border: 'none', background: wrapSubOpen ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}>
                <span style={{ width: 14, height: 14, flexShrink: 0, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M2.5 8h8a2 2 0 0 1 0 4H8.5M8.5 12l1.5-1.5M8.5 12l1.5 1.5M2.5 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                Text wrapping
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0, color: '#A5ACB9' }}><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {wrapSubOpen && (
                <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', width: 140, padding: '4px 0', fontFamily: ff.primary }}>
                  {['Overflow', 'Wrap', 'Clip'].map(w => (
                    <button key={w} onClick={close} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }} onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{w}</button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (<>
        {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, 'Add formula', onAddFormula)}
        {divider}
        {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12l-4.5 5.5v3.5l-3-1.5v-2L2 4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>, 'Filter', onFilter)}
        {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, 'Sort ascending', () => onSort({ col, dir: 'asc' }))}
        {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 4v8M5 9l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, 'Sort descending', () => onSort({ col, dir: 'desc' }))}
        {sortedThis && item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, 'Clear sort', () => onSort(null))}
        {divider}
        {item(<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.4-4.3 6-4.3S14 8 14 8s-2.4 4.3-6 4.3S2 8 2 8z" stroke="currentColor" strokeWidth="1.2"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, 'Hide column', () => onHide(col))}
        {divider}
        <div style={{ position: 'relative' }} onMouseEnter={() => setCleanSubOpen(true)} onMouseLeave={() => setCleanSubOpen(false)}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', border: 'none', background: cleanSubOpen ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}>
            <span style={{ width: 14, height: 14, flexShrink: 0, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M3.26665 4.13194H10.7333L10.3933 6.26547C10.3752 6.3502 10.3353 6.43034 10.2764 6.49997C10.2176 6.56959 10.1413 6.62692 10.0533 6.66771L8.26664 7.50093C8.15398 7.55241 8.06082 7.63066 7.99819 7.72639C7.93557 7.82213 7.90611 7.93134 7.91331 8.04107L8.29331 13.3909C8.29877 13.4692 8.28557 13.5476 8.25452 13.6214C8.22347 13.6951 8.17523 13.7626 8.11277 13.8197C8.05031 13.8767 7.97496 13.9222 7.89136 13.9532C7.80775 13.9842 7.71766 14.0001 7.62664 14H6.36665C6.27622 14.0001 6.18672 13.9843 6.10358 13.9536C6.02045 13.923 5.94542 13.8781 5.88306 13.8216C5.82069 13.7652 5.7723 13.6984 5.74083 13.6253C5.70936 13.5523 5.69546 13.4745 5.69998 13.3966L6.03331 8.03533C6.04049 7.92773 6.01241 7.82057 5.95229 7.72607C5.89217 7.63157 5.80243 7.55356 5.69332 7.50093L3.95332 6.67921C3.86495 6.63659 3.78901 6.57719 3.73126 6.5055C3.6735 6.43381 3.63545 6.35173 3.61999 6.26547L3.26665 4.13194ZM2.33332 0H4.01999L5.13332 0.826387L6.06665 0H11.6666L10.7333 3.30555H3.26665L2.33332 0Z" fill="currentColor"/></svg></span>
            Clean
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0, color: '#A5ACB9' }}><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {cleanSubOpen && (
            <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', width: 172, padding: '4px 0', fontFamily: ff.primary }}>
              {cleanOptions.map(({ op, label }) => (
                <button key={label}
                  onClick={() => { close(); onClean(op); }}
                  style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '7px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        </>)}
      </div>
    </>
  );
}

// ── Loading skeleton — shown while a table/CSV loads or a code block runs ──────
export function SpreadsheetSkeleton() {
  return (
    <div style={{ flex: 1, borderTop: BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <style>{`@keyframes dsShimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}`}</style>
      <div style={{ height: 28, display: 'flex', alignItems: 'center', borderBottom: BORDER, background: '#F6F8FA', padding: '0 8px', flexShrink: 0 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ flex: 1, padding: '0 8px' }}><div style={{ height: 8, width: '55%', borderRadius: 3, background: '#DBE0E8', animation: 'dsShimmer 1.1s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} /></div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {Array.from({ length: 14 }).map((_, r) => (
          <div key={r} style={{ display: 'flex', height: 25, alignItems: 'center', borderBottom: '1px solid #F3F5F8', padding: '0 8px' }}>
            {Array.from({ length: 7 }).map((_, c) => (
              <div key={c} style={{ flex: 1, padding: '0 8px' }}><div style={{ height: 8, width: `${38 + ((r * 7 + c * 13) % 46)}%`, borderRadius: 3, background: '#E9ECF1', animation: 'dsShimmer 1.1s ease-in-out infinite', animationDelay: `${((r * 7 + c) % 10) * 0.05}s` }} /></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
