import React, { useEffect, useRef } from 'react';
import type { TablePositionData, JoinInfo } from '../../_datamodel/index';
import { SegmentedControl } from '@components/SegmentedControl';
import { SearchDataExplorations } from '../SearchDataExplorations';

// Kept local (not imported from SearchDataOnDataModelexplorations.tsx) to avoid a circular
// module dependency, since that file imports this component.
type ColRow = { col: string; table: string; desc: string; aiCtx: string };

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 600;
// 3.2's vertical panel only — its open dimension is width, not height.
const MIN_WIDTH = 360;
const MAX_WIDTH = 800;
const COLLAPSED_HEIGHT = 38;
// Optimized only — its collapsed state is a floating illustrated card
// (absolutely positioned over the canvas, see PreviewPanel3Optimized) instead
// of the plain 34px in-flow tab header the other branches use.
const PREVIEW_BAR_HEIGHT = 80;
const PREVIEW_BAR_MARGIN = 12;

export interface PreviewPanelProps {
  tables: TablePositionData[];
  columnRows: ColRow[];
  dataSourceTables: { name: string; columns: string[] }[];
  open: boolean;
  setOpen: (v: boolean) => void;
  full: boolean;
  setFull: (v: boolean) => void;
  height: number;
  setHeight: (v: number) => void;
  // 3.2's vertical panel only — the other branches size by height alone.
  width: number;
  setWidth: (v: number) => void;
  panelTab: 'preview' | 'query';
  setPanelTab: (v: 'preview' | 'query') => void;
  scope: 'table' | 'join' | 'model';
  setScope: (v: 'table' | 'join' | 'model') => void;
  selectedTable: string;
  setSelectedTable: (v: string) => void;
  join: JoinInfo | null;
  setJoin: (v: JoinInfo | null) => void;
  joins: JoinInfo[];
  // Picks which fully independent branch below renders — see the note above
  // PreviewPanel3Optimized/PreviewPanel3AsIs/PreviewPanel3Vertical.
  embedMode: 'asis' | 'optimized' | 'v32';
}

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 2.5H2.5V6M10 13.5h3.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.5 6V2.5H10M2.5 10v3.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(180deg)' }}><path d="M4 6.5L8 10.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6.5L8 10.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

type BranchProps = {
  open: boolean; setOpen: (v: boolean) => void;
  full: boolean; setFull: (v: boolean) => void;
  height: number; setHeight: (v: number) => void;
  panelTab: 'preview' | 'query'; setPanelTab: (v: 'preview' | 'query') => void;
};

// Extra canvas-tied fields — Optimized only, per "we will only work on
// option 3, optimized version" — PreviewPanel3AsIs's own props stay as
// plain BranchProps so nothing new can leak into that frozen branch.
type OptimizedProps = BranchProps & {
  tables: TablePositionData[];
  dataSourceTables: { name: string; columns: string[] }[];
  scope: 'table' | 'join' | 'model';
  setScope: (v: 'table' | 'join' | 'model') => void;
  selectedTable: string;
  setSelectedTable: (v: string) => void;
  join: JoinInfo | null;
  setJoin: (v: JoinInfo | null) => void;
  joins: JoinInfo[];
};

// ─── "Optimized" branch ─────────────────────────────────────────────────────
// Reverted to an exact copy of PreviewPanel3AsIs (2026-09-08, second time) —
// Komal: "why did you again change the position of the query bar and the
// empty state... DO NOT MAKE CHANGES ON YOUR OWN." Re-applying the prior
// scoped-query implementation reintroduced the exact query bar layout/empty
// state she'd already objected to once. Do not rebuild the Table/Join/Model
// scoping UI (query bar, empty state, column panel, anything) until she
// specifies exactly what it should look like — do not infer it from what
// existed before.
const PreviewPanel3Optimized: React.FC<OptimizedProps> = ({
  open, setOpen, full, setFull, height, setHeight,
  panelTab, setPanelTab,
  tables, dataSourceTables,
  scope, setScope, selectedTable, setSelectedTable,
  join, setJoin, joins,
}) => {
  // Default height = 40% of the canvas area (this panel's parent, which spans
  // canvas + panel). Measured once on mount; after that the user's own drag
  // wins. Clamped to the same MIN/MAX the resize handle enforces so the
  // default always stays within the draggable range.
  const rootRef = useRef<HTMLDivElement>(null);
  const didSetDefaultHeight = useRef(false);
  useEffect(() => {
    if (didSetDefaultHeight.current) return;
    const parentHeight = rootRef.current?.parentElement?.getBoundingClientRect().height ?? 0;
    if (!parentHeight) return;
    didSetDefaultHeight.current = true;
    setHeight(Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, parentHeight * 0.4))));
  }, [setHeight]);

  const containerStyle: React.CSSProperties = full
    ? { position: 'fixed', inset: 0, zIndex: 2000, height: 'auto' }
    : {
        // Always absolutely positioned over the canvas — collapsed AND
        // expanded alike — instead of switching layout strategy between the
        // two (in-flow flex sibling vs. floating overlay). That keeps this a
        // single continuous transition of height rather than an instant jump
        // when toggling. .model-canvas's flex:1 now always fills 100% of
        // .tables-canvas-wrap as a result. left/right/bottom margin and the
        // rounded corners stay constant across both states — only the
        // height (and the background/border/shadow that come with it) change.
        position: 'absolute',
        left: PREVIEW_BAR_MARGIN,
        right: PREVIEW_BAR_MARGIN,
        bottom: PREVIEW_BAR_MARGIN,
        height: open ? height : PREVIEW_BAR_HEIGHT,
        zIndex: 3,
        borderRadius: 10,
        background: open ? 'var(--rd-sys-color-background-base)' : 'transparent',
        border: open ? '1px solid #EAEDF2' : 'none',
        boxShadow: open ? '0 0 4px #1923311a, 0 2px 4px #1923310a' : 'none',
        // Matches #left-pane's own width transition (var(--duration-slow)
        // var(--easing-standard)) so both panels — plus the SpotterModel
        // panel's collapse — move together as one synchronized motion.
        transition: 'height var(--duration-slow) var(--easing-standard), background var(--duration-slow) var(--easing-standard), border-color var(--duration-slow) var(--easing-standard), box-shadow var(--duration-slow) var(--easing-standard)',
      };

  const sheetTab = panelTab === 'preview' ? 'sheet' : 'query';

  return (
    <div ref={rootRef} className="preview-panel" style={containerStyle}>
      {open && !full && (
        <div
          className="preview-resize-handle"
          // .preview-resize-handle's shared default (transparent) sits on
          // .preview-panel's white background here, leaving a sliver of
          // white above the tab bar's grey (#F6F8FA) — filled in to match
          // instead, without touching the shared class (As-is keeps transparent).
          style={{ background: '#F6F8FA' }}
          onPointerDown={e => {
            e.preventDefault();
            const startY = e.clientY;
            const startH = height;
            const onMove = (ev: PointerEvent) => setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startH + (startY - ev.clientY))));
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
        />
      )}

      {!open && !full ? (
          <button type="button" className="preview-bar-collapsed" style={{ height: '100%' }} onClick={() => setOpen(true)}>
            <span style={{ width: 96, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="96" height="56" viewBox="0 0 96 56" fill="none">
                <rect x="4" y="4" width="76" height="48" rx="4" fill="#fff" stroke="#CEDCF5" strokeWidth="1.4"/>
                <path d="M4 15h76" stroke="#CEDCF5" strokeWidth="1.4"/>
                <path d="M28 15v37M52 15v37" stroke="#EBF2FD" strokeWidth="1.4"/>
                <path d="M4 27h76M4 39h76" stroke="#EBF2FD" strokeWidth="1.4"/>
                <rect x="9" y="8" width="13" height="3" rx="1.5" fill="#ABC7F9"/>
                <rect x="33" y="8" width="13" height="3" rx="1.5" fill="#ABC7F9"/>
                <rect x="57" y="8" width="13" height="3" rx="1.5" fill="#ABC7F9"/>
                <rect x="9" y="20" width="12" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="33" y="20" width="14" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="57" y="20" width="10" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="9" y="32" width="14" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="33" y="32" width="9" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="9" y="44" width="11" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="33" y="44" width="13" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="59" y="27" width="34" height="25" rx="4" fill="#fff" stroke="#2770EF" strokeWidth="1.5"/>
                <rect x="65" y="40" width="5" height="7" rx="1.5" fill="#ABC7F9"/>
                <rect x="73" y="35" width="5" height="12" rx="1.5" fill="#71A1F4"/>
                <rect x="81" y="38" width="5" height="9" rx="1.5" fill="#2770EF"/>
              </svg>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, textAlign: 'left' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1D232F', letterSpacing: '-0.3px' }}>Preview and test your data</span>
              <span style={{ fontSize: 13, color: '#777E8B' }}>See the rows behind your model before anyone else does</span>
            </span>
            <span className="preview-bar-chevron" style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 9.5L8 5.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
      ) : (
      <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12, flexShrink: 0, background: '#F6F8FA', borderBottom: '1px solid #EAEDF2' }}>
        {/* Three-region flex: equal flex:1 on both flanks with the control as a
            plain child between them, so it lands at the true centre of the row
            regardless of how wide the right-hand buttons are. Same technique as
            the Builder/Semantics sub-header switch. Optimized only —
            PreviewPanel3AsIs below keeps its original tabs. */}
        <div style={{ flex: 1 }} />
        <SegmentedControl
          options={[{ id: 'preview', label: 'Spreadsheet' }, { id: 'query', label: 'Query' }]}
          value={panelTab}
          onChange={v => setPanelTab(v as 'preview' | 'query')}
          size="default"
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="preview-icon-btn"
            title={full ? 'Exit full screen' : open ? 'Full screen' : 'Expand'}
            onClick={() => {
              if (full) { setFull(false); return; }
              if (!open) { setOpen(true); return; }
              setFull(true);
            }}
          >
            {full || open ? <ExpandIcon /> : <ChevronUpIcon />}
          </button>
          {(open || full) && (
            <button
              type="button"
              className="preview-icon-btn"
              title="Hide"
              onClick={() => { setFull(false); setOpen(false); }}
            >
              <ChevronDownIcon />
            </button>
          )}
        </div>
      </div>
      )}

      {(open || full) && (
        <div className="preview-panel-body" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0, background: 'var(--rd-sys-color-background-sunken, #F6F8FA)' }}>
          <SearchDataExplorations
            showSpotter={false}
            hideSheetToggle
            hideHeaderBar
            edgeToEdge
            hideColumnPanelTabs
            compactPanelSearch
            alignColumnCheckboxes
            lightAnswerTableHeader
            sheetTab={sheetTab}
            onSheetTabChange={t => setPanelTab(t === 'sheet' ? 'preview' : 'query')}
            canvasScope={{
              tables, joins, dataSourceTables,
              scope, selectedTable, selectedJoin: join,
              onScopeChange: setScope,
              onSelectedTableChange: setSelectedTable,
              onSelectedJoinChange: setJoin,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ─── "3.2" branch — Option 3.2 (2026-09-21): Optimized's twin, with the open
// panel standing vertically against the RIGHT edge, overlaying the canvas,
// instead of docking along the bottom. The collapsed state (the floating
// illustrated card) and everything inside the panel are unchanged from
// Optimized. A fully independent component on purpose, like the branches
// around it, so 3.2-only work can't leak into Optimized through a shared
// conditional — Komal's revert note on Optimized above applies there, not here.
const PreviewPanel3Vertical: React.FC<OptimizedProps & { width: number; setWidth: (v: number) => void }> = ({
  open, setOpen, full, setFull, width, setWidth,
  panelTab, setPanelTab,
  tables, dataSourceTables,
  scope, setScope, selectedTable, setSelectedTable,
  join, setJoin, joins,
}) => {
  // Default width = 40% of the canvas area, measured once on mount — the
  // vertical counterpart of Optimized's default-height logic. After that the
  // user's own drag wins. Clamped to the same MIN/MAX the resize handle
  // enforces so the default always stays within the draggable range.
  const rootRef = useRef<HTMLDivElement>(null);
  const didSetDefaultWidth = useRef(false);
  useEffect(() => {
    if (didSetDefaultWidth.current) return;
    const parentWidth = rootRef.current?.parentElement?.getBoundingClientRect().width ?? 0;
    if (!parentWidth) return;
    didSetDefaultWidth.current = true;
    setWidth(Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parentWidth * 0.4))));
  }, [setWidth]);

  const containerStyle: React.CSSProperties = full
    ? { position: 'fixed', inset: 0, zIndex: 2000, height: 'auto' }
    : open
      ? {
          // Open: a vertical panel hugging the right edge, floating over the
          // canvas — the canvas keeps its full size underneath (the spacer in
          // the main file adds the scroll room that brings covered cards back
          // into view).
          position: 'absolute',
          top: PREVIEW_BAR_MARGIN,
          right: PREVIEW_BAR_MARGIN,
          bottom: PREVIEW_BAR_MARGIN,
          width,
          zIndex: 3,
          borderRadius: 10,
          background: 'var(--rd-sys-color-background-base)',
          border: '1px solid #EAEDF2',
          boxShadow: '0 0 4px #1923311a, 0 2px 4px #1923310a',
        }
      : {
          // Collapsed: the same floating illustrated card along the bottom
          // that Optimized uses. Collapsed↔open swaps anchoring (bottom bar vs
          // right column), so unlike Optimized there is no geometry transition
          // — it would morph diagonally.
          position: 'absolute',
          left: PREVIEW_BAR_MARGIN,
          right: PREVIEW_BAR_MARGIN,
          bottom: PREVIEW_BAR_MARGIN,
          height: PREVIEW_BAR_HEIGHT,
          zIndex: 3,
          borderRadius: 10,
          background: 'transparent',
        };

  const sheetTab = panelTab === 'preview' ? 'sheet' : 'query';

  return (
    <div ref={rootRef} className="preview-panel" style={containerStyle}>
      {open && !full && (
        <div
          // Width-resize handle on the panel's left edge — the vertical
          // counterpart of the shared .preview-resize-handle (a top-edge
          // height handle, so it isn't reused here).
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 10 }}
          onPointerDown={e => {
            e.preventDefault();
            const startX = e.clientX;
            const startW = width;
            const onMove = (ev: PointerEvent) => setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW + (startX - ev.clientX))));
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
        />
      )}

      {!open && !full ? (
          <button type="button" className="preview-bar-collapsed" style={{ height: '100%' }} onClick={() => setOpen(true)}>
            <span style={{ width: 96, height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="96" height="56" viewBox="0 0 96 56" fill="none">
                <rect x="4" y="4" width="76" height="48" rx="4" fill="#fff" stroke="#CEDCF5" strokeWidth="1.4"/>
                <path d="M4 15h76" stroke="#CEDCF5" strokeWidth="1.4"/>
                <path d="M28 15v37M52 15v37" stroke="#EBF2FD" strokeWidth="1.4"/>
                <path d="M4 27h76M4 39h76" stroke="#EBF2FD" strokeWidth="1.4"/>
                <rect x="9" y="8" width="13" height="3" rx="1.5" fill="#ABC7F9"/>
                <rect x="33" y="8" width="13" height="3" rx="1.5" fill="#ABC7F9"/>
                <rect x="57" y="8" width="13" height="3" rx="1.5" fill="#ABC7F9"/>
                <rect x="9" y="20" width="12" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="33" y="20" width="14" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="57" y="20" width="10" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="9" y="32" width="14" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="33" y="32" width="9" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="9" y="44" width="11" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="33" y="44" width="13" height="2.5" rx="1.25" fill="#DBDFE7"/>
                <rect x="59" y="27" width="34" height="25" rx="4" fill="#fff" stroke="#2770EF" strokeWidth="1.5"/>
                <rect x="65" y="40" width="5" height="7" rx="1.5" fill="#ABC7F9"/>
                <rect x="73" y="35" width="5" height="12" rx="1.5" fill="#71A1F4"/>
                <rect x="81" y="38" width="5" height="9" rx="1.5" fill="#2770EF"/>
              </svg>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, textAlign: 'left' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1D232F', letterSpacing: '-0.3px' }}>Preview and test your data</span>
              <span style={{ fontSize: 13, color: '#777E8B' }}>See the rows behind your model before anyone else does</span>
            </span>
            <span className="preview-bar-chevron" style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 9.5L8 5.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
      ) : (
      <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12, flexShrink: 0, background: '#F6F8FA', borderBottom: '1px solid #EAEDF2' }}>
        <div style={{ flex: 1 }} />
        <SegmentedControl
          options={[{ id: 'preview', label: 'Spreadsheet' }, { id: 'query', label: 'Query' }]}
          value={panelTab}
          onChange={v => setPanelTab(v as 'preview' | 'query')}
          size="default"
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="preview-icon-btn"
            title={full ? 'Exit full screen' : open ? 'Full screen' : 'Expand'}
            onClick={() => {
              if (full) { setFull(false); return; }
              if (!open) { setOpen(true); return; }
              setFull(true);
            }}
          >
            {full || open ? <ExpandIcon /> : <ChevronUpIcon />}
          </button>
          {(open || full) && (
            <button
              type="button"
              className="preview-icon-btn"
              title="Hide"
              onClick={() => { setFull(false); setOpen(false); }}
            >
              <ChevronDownIcon />
            </button>
          )}
        </div>
      </div>
      )}

      {(open || full) && (
        <div className="preview-panel-body" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0, background: 'var(--rd-sys-color-background-sunken, #F6F8FA)' }}>
          <SearchDataExplorations
            showSpotter={false}
            hideSheetToggle
            hideHeaderBar
            edgeToEdge
            hideColumnPanelTabs
            compactPanelSearch
            alignColumnCheckboxes
            lightAnswerTableHeader
            sheetAllColumns
            sheetTab={sheetTab}
            onSheetTabChange={t => setPanelTab(t === 'sheet' ? 'preview' : 'query')}
            canvasScope={{
              tables, joins, dataSourceTables,
              scope, selectedTable, selectedJoin: join,
              onScopeChange: setScope,
              onSelectedTableChange: setSelectedTable,
              onSelectedJoinChange: setJoin,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ─── "As is" branch — frozen comparison point. Do NOT apply optimized-branch edits here unless
// Komal explicitly asks for this branch by name. Currently an exact copy of
// PreviewPanel3Optimized's pre-scoping state (per Komal: "as is and optimized
// should look exactly the same") — the two are independent components on
// purpose so future "optimized"-only work can't leak in through a shared
// conditional. ───────────────────────────────────────────────────────────
const PreviewPanel3AsIs: React.FC<BranchProps> = ({
  open, setOpen, full, setFull, height, setHeight,
  panelTab, setPanelTab,
}) => {
  const containerStyle: React.CSSProperties = full
    ? { position: 'fixed', inset: 0, zIndex: 2000, height: 'auto' }
    : { height: open ? height : COLLAPSED_HEIGHT, position: 'relative', zIndex: 2, transition: 'height 180ms cubic-bezier(0.4,0,0.2,1)' };

  const sheetTab = panelTab === 'preview' ? 'sheet' : 'query';

  return (
    <div className="preview-panel" style={containerStyle}>
      {open && !full && (
        <div
          className="preview-resize-handle"
          onPointerDown={e => {
            e.preventDefault();
            const startY = e.clientY;
            const startH = height;
            const onMove = (ev: PointerEvent) => setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startH + (startY - ev.clientY))));
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
        />
      )}

      <div style={{ height: 34, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12, flexShrink: 0, background: '#F6F8FA', borderBottom: '1px solid #EAEDF2' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, height: 34, flexShrink: 0 }}>
          {([['query', 'Query'], ['preview', 'Spreadsheet']] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPanelTab(tab)}
              style={{
                height: 34, padding: '0 1px',
                border: 'none', boxShadow: panelTab === tab ? 'inset 0 -2px 0 #2770EF' : 'inset 0 -2px 0 transparent',
                background: 'transparent', cursor: 'pointer',
                fontSize: 14, letterSpacing: '-0.1px', fontWeight: panelTab === tab ? 600 : 500,
                color: panelTab === tab ? '#2770EF' : '#777E8B',
                transition: 'color 150ms cubic-bezier(0.4,0,0.2,1), box-shadow 150ms cubic-bezier(0.4,0,0.2,1)', whiteSpace: 'nowrap',
              }}
            >{label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="preview-icon-btn"
          title={full ? 'Exit full screen' : open ? 'Full screen' : 'Expand'}
          onClick={() => {
            if (full) { setFull(false); return; }
            if (!open) { setOpen(true); return; }
            setFull(true);
          }}
        >
          {full || open ? <ExpandIcon /> : <ChevronUpIcon />}
        </button>
        {(open || full) && (
          <button
            type="button"
            className="preview-icon-btn"
            title="Hide"
            onClick={() => { setFull(false); setOpen(false); }}
          >
            <ChevronDownIcon />
          </button>
        )}
      </div>

      {(open || full) && (
        <div className="preview-panel-body" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0, background: 'var(--rd-sys-color-background-sunken, #F6F8FA)' }}>
          <SearchDataExplorations
            showSpotter={false}
            hideSheetToggle
            hideHeaderBar
            edgeToEdge
            sheetTab={sheetTab}
            onSheetTabChange={t => setPanelTab(t === 'sheet' ? 'preview' : 'query')}
          />
        </div>
      )}
    </div>
  );
};

// Option 3 — dispatches to one of three fully independent branches based on
// embedMode (set via the "as is" / "optimized" / "3.2" switcher next to the
// option switcher). See the notes on each branch above.
const PreviewPanel3: React.FC<PreviewPanelProps> = ({
  open, setOpen, full, setFull, height, setHeight, width, setWidth,
  panelTab, setPanelTab,
  tables, dataSourceTables,
  scope, setScope, selectedTable, setSelectedTable,
  join, setJoin, joins,
  embedMode,
}) => {
  const branchProps: BranchProps = { open, setOpen, full, setFull, height, setHeight, panelTab, setPanelTab };
  if (embedMode === 'asis') return <PreviewPanel3AsIs {...branchProps} />;
  const optimizedProps = {
    ...branchProps,
    tables, dataSourceTables,
    scope, setScope, selectedTable, setSelectedTable,
    join, setJoin, joins,
  };
  return embedMode === 'v32'
    ? <PreviewPanel3Vertical {...optimizedProps} width={width} setWidth={setWidth} />
    : <PreviewPanel3Optimized {...optimizedProps} />;
};

export default PreviewPanel3;
