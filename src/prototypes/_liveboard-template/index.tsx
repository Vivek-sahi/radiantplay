import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveboardHeader } from '@components/LiveboardHeader';
import {
  AnswerTile, NoteTile, GroupTile,
  ChartType, TileMode,
  GroupInnerTile,
  NOTE_VARIATIONS, NoteVariant,
} from '../_shared/tiles';
import { SpotterVizPanel } from './components/SpotterVizPanel';
import { tabsData, filterData, liveboardName } from './data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type TileItem = { i: string; x: number; y: number; w: number; h: number; minW: number };
type TileDef =
  | { id: string; tileType: 'answer'; title: string; description?: string; chartType: ChartType }
  | { id: string; tileType: 'note';   noteVariant: NoteVariant }
  | { id: string; tileType: 'group';  title: string; description?: string };

// ─── Grid constants ───────────────────────────────────────────────────────────

const COLUMNS  = 12;
const GUTTER   = 16;  // px — gap between tiles
const ROW_H    = 80;  // px — height of one grid row
const ROW_UNIT = 96;  // px — ROW_H + GUTTER
const PAD      = 24;  // px — canvas padding on all sides

// ─── Grid math ────────────────────────────────────────────────────────────────

function colUnit(containerWidth: number): number {
  return (containerWidth - PAD * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;
}

function tilePixels(item: TileItem, cu: number) {
  return {
    left:   PAD + item.x * (cu + GUTTER),
    top:    PAD + item.y * ROW_UNIT,
    width:  item.w * cu + (item.w - 1) * GUTTER,
    height: item.h * ROW_H + (item.h - 1) * GUTTER,
  };
}

function snapX(px: number, w: number, cu: number) {
  return Math.max(0, Math.min(COLUMNS - w, Math.round(px / (cu + GUTTER))));
}
function snapY(px: number) {
  return Math.max(0, Math.round(px / ROW_UNIT));
}

// ─── Collision + compaction ───────────────────────────────────────────────────

function tilesCollide(a: TileItem, b: TileItem): boolean {
  if (a.i === b.i) return false;
  if (a.x + a.w <= b.x || b.x + b.w <= a.x) return false;
  if (a.y + a.h <= b.y || b.y + b.h <= a.y) return false;
  return true;
}

/** Compact layout vertically — tiles float up, filling empty rows above them. */
function compactLayout(layout: TileItem[]): TileItem[] {
  const sorted = [...layout].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
  const placed: TileItem[] = [];
  for (const item of sorted) {
    const w = Math.min(item.w, COLUMNS);
    const x = Math.max(0, Math.min(item.x, COLUMNS - w));
    let y = 0;
    while (placed.some(p => tilesCollide(p, { ...item, w, x, y }))) y++;
    placed.push({ ...item, w, x, y });
  }
  return placed;
}

// ─── Live DOM helpers — no React re-renders during drag ───────────────────────

function applyLiveDisplacement(base: TileItem[], active: TileItem, _cu: number) {
  const resolved = compactLayout(base.map(l => l.i === active.i ? active : l));
  for (const orig of base) {
    if (orig.i === active.i) continue;
    const r = resolved.find(l => l.i === orig.i);
    if (!r) continue;
    const delta = (r.y - orig.y) * ROW_UNIT;
    const el = document.querySelector(`[data-tile-id="${orig.i}"]`) as HTMLElement | null;
    if (el) el.style.transform = delta ? `translateY(${delta}px)` : '';
  }
}

function commitPositions(layout: TileItem[], cu: number) {
  for (const item of layout) {
    const el = document.querySelector(`[data-tile-id="${item.i}"]`) as HTMLElement | null;
    if (!el) continue;
    const p = tilePixels(item, cu);
    el.style.left      = `${p.left}px`;
    el.style.top       = `${p.top}px`;
    el.style.width     = `${p.width}px`;
    el.style.height    = `${p.height}px`;
    el.style.transform = '';
    el.style.zIndex    = '';
  }
}

// ─── Sample data ──────────────────────────────────────────────────────────────
// Replace with your prototype's tile definitions and layout.

const TILE_DEFS: TileDef[] = [
  // KPI row
  { id: 'kpi-revenue',    tileType: 'answer', title: 'Total revenue',       chartType: 'kpi-simple' },
  { id: 'kpi-customers',  tileType: 'answer', title: 'Active customers',    chartType: 'kpi-simple' },
  { id: 'kpi-orders',     tileType: 'answer', title: 'Orders this quarter', chartType: 'kpi-simple' },
  { id: 'kpi-nps',        tileType: 'answer', title: 'NPS score',           chartType: 'kpi-simple' },
  // Chart row
  { id: 'chart-revenue',  tileType: 'answer', title: 'Revenue over time',   description: 'Monthly vs prior year', chartType: 'line' },
  { id: 'chart-segment',  tileType: 'answer', title: 'Revenue by segment',                                        chartType: 'bar'  },
  // Note + group row
  { id: 'note-summary',   tileType: 'note',   noteVariant: 'weekly-update'  },
  { id: 'group-products', tileType: 'group',  title: 'Product performance', description: 'By category and region' },
];

const INITIAL_LAYOUT: TileItem[] = [
  // Row 1: 4 KPI tiles (3 cols × 3 rows each)
  { i: 'kpi-revenue',    x: 0, y: 0, w: 3, h: 3, minW: 2 },
  { i: 'kpi-customers',  x: 3, y: 0, w: 3, h: 3, minW: 2 },
  { i: 'kpi-orders',     x: 6, y: 0, w: 3, h: 3, minW: 2 },
  { i: 'kpi-nps',        x: 9, y: 0, w: 3, h: 3, minW: 2 },
  // Row 2: 2 chart tiles (6 cols × 3 rows each)
  { i: 'chart-revenue',  x: 0, y: 3, w: 6, h: 3, minW: 2 },
  { i: 'chart-segment',  x: 6, y: 3, w: 6, h: 3, minW: 2 },
  // Row 3: note (4 cols × 4 rows) + group (8 cols × 4 rows)
  { i: 'note-summary',   x: 0, y: 6, w: 4, h: 4, minW: 2 },
  { i: 'group-products', x: 4, y: 6, w: 8, h: 4, minW: 2 },
];

const INITIAL_GROUP_LAYOUTS: Record<string, GroupInnerTile[]> = {
  'group-products': [
    { i: 'gp-donut', x: 0, y: 0, w: 6, h: 3, minW: 1, tileType: 'answer', chartType: 'donut', title: 'Category mix'  },
    { i: 'gp-table', x: 6, y: 0, w: 6, h: 3, minW: 1, tileType: 'answer', chartType: 'table', title: 'Top products'  },
  ],
};

// ─── Drag / resize state shapes ───────────────────────────────────────────────

interface DragState {
  tileId: string;
  grabOffsetX: number; grabOffsetY: number;
  canvasLeft: number;  canvasTop: number;
  initScrollX: number; initScrollY: number;
}

interface ResizeState {
  tileId: string; dir: string;
  startX: number; startY: number;
  origX: number; origY: number; origW: number; origH: number; minW: number;
  origPixelW: number; origPixelH: number;
  currentPixelW: number; currentPixelH: number;
}

// ─── Icons (view mode action palette) ────────────────────────────────────────

const IconSpotter = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 1L9.5 6H14.5L10.5 9L12 14L8 11L4 14L5.5 9L1.5 6H6.5L8 1Z" fill="currentColor"/>
  </svg>
);
const IconExpand = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M9 2H14V7M14 2L9 7M7 14H2V9M2 14L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMore = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="4"  r="1.2" fill="currentColor"/>
    <circle cx="8" cy="8"  r="1.2" fill="currentColor"/>
    <circle cx="8" cy="12" r="1.2" fill="currentColor"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const LiveboardTemplate: React.FC = () => {
  const [mode,           setMode]           = useState<TileMode>('view');
  const [layout,         setLayout]         = useState<TileItem[]>(INITIAL_LAYOUT);
  const [tileDefs,       setTileDefs]       = useState<TileDef[]>(TILE_DEFS);
  const [selectedTiles,  setSelectedTiles]  = useState<string[]>([]);
  const [chartTypes,     setChartTypes]     = useState<Record<string, ChartType>>({});
  const [tileTitles,     setTileTitles]     = useState<Record<string, string>>({});
  const [tileDescs,      setTileDescs]      = useState<Record<string, string>>({});
  const [groupLayouts,   setGroupLayouts]   = useState<Record<string, GroupInnerTile[]>>(INITIAL_GROUP_LAYOUTS);
  const [groupChartTypes, setGroupChartTypes] = useState<Record<string, Record<string, ChartType>>>({});
  const [selectedInnerTile, setSelectedInnerTile] = useState<{ groupId: string; tileId: string } | null>(null);
  const [hoveredTile,    setHoveredTile]    = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [activeTab,      setActiveTab]      = useState(tabsData[0].id);
  const [spotterOpen,    setSpotterOpen]    = useState(false);

  // Refs
  const containerRef     = useRef<HTMLDivElement>(null);
  const layoutRef        = useRef(layout);     layoutRef.current = layout;
  const cuRef            = useRef(0);
  const modeRef          = useRef(mode);       modeRef.current = mode;
  const dragRef          = useRef<DragState | null>(null);
  const resizeRef        = useRef<ResizeState | null>(null);
  const dragShadowRef    = useRef<HTMLDivElement>(null);
  const resizeShadowRef  = useRef<HTMLDivElement>(null);
  const shiftRef         = useRef(false);
  const lastShiftTileRef = useRef<string | null>(null);

  const cu = colUnit(containerWidth);
  cuRef.current = cu;

  const isEdit = mode === 'edit';
  const tileDefMap = Object.fromEntries(tileDefs.map(t => [t.id, t])) as Record<string, TileDef>;
  const maxBottom  = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  const canvasHeight = PAD + maxBottom * ROW_UNIT - GUTTER + PAD;

  // ─── Measure container ─────────────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ─── Safety net: compact any overlap left in state ─────────────────────────
  useEffect(() => {
    const hasOverlap = layout.some((a, i) => layout.some((b, j) => i < j && tilesCollide(a, b)));
    if (hasOverlap) setLayout(compactLayout(layout));
  }, [layout]);

  // ─── Shift key tracker ─────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftRef.current = true; };
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftRef.current = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // ─── Drag start ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((tileId: string, e: React.MouseEvent) => {
    if (modeRef.current !== 'edit') return;
    const canvasEl = containerRef.current;
    if (!canvasEl) return;
    const item = layoutRef.current.find(l => l.i === tileId);
    if (!item) return;

    const cr = canvasEl.getBoundingClientRect();
    const px = tilePixels(item, cuRef.current);

    dragRef.current = {
      tileId,
      grabOffsetX: (e.clientX - cr.left) - px.left,
      grabOffsetY: (e.clientY - cr.top)  - px.top,
      canvasLeft: cr.left, canvasTop: cr.top,
      initScrollX: window.pageXOffset, initScrollY: window.pageYOffset,
    };

    const sh = dragShadowRef.current;
    if (sh) {
      sh.style.display = 'block';
      sh.style.left = `${px.left}px`; sh.style.top  = `${px.top}px`;
      sh.style.width = `${px.width}px`; sh.style.height = `${px.height}px`;
    }
    const el = document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement | null;
    if (el) el.style.zIndex = '10';
  }, []);

  // ─── Resize start ──────────────────────────────────────────────────────────
  const handleResizeStart = useCallback((tileId: string, dir: string, e: React.MouseEvent) => {
    e.preventDefault();
    const item = layoutRef.current.find(l => l.i === tileId);
    if (!item) return;

    const el   = document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    const c    = cuRef.current;
    const pw   = rect?.width  ?? (item.w * c + (item.w - 1) * GUTTER);
    const ph   = rect?.height ?? (item.h * ROW_H + (item.h - 1) * GUTTER);

    resizeRef.current = {
      tileId, dir,
      startX: e.clientX, startY: e.clientY,
      origX: item.x, origY: item.y, origW: item.w, origH: item.h,
      minW: item.minW ?? 2,
      origPixelW: pw, origPixelH: ph,
      currentPixelW: pw, currentPixelH: ph,
    };

    if (el) { el.classList.add('tile-is-resizing'); el.style.zIndex = '10'; }

    const canvasEl = containerRef.current;
    if (el && canvasEl) {
      const cr = canvasEl.getBoundingClientRect();
      const tr = el.getBoundingClientRect();
      const sh = resizeShadowRef.current;
      if (sh) {
        sh.style.display = 'block';
        sh.style.left = `${tr.left - cr.left}px`; sh.style.top = `${tr.top - cr.top}px`;
        sh.style.width = `${tr.width}px`; sh.style.height = `${tr.height}px`;
      }
    }
  }, []);

  // ─── Document mouse events ─────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const c    = cuRef.current;
      const base = layoutRef.current;

      // ── Drag ──────────────────────────────────────────────────────────────
      const dr = dragRef.current;
      if (dr) {
        const sdx = window.pageXOffset - dr.initScrollX;
        const sdy = window.pageYOffset - dr.initScrollY;
        const item = base.find(l => l.i === dr.tileId);
        if (item) {
          const px   = tilePixels(item, c);
          const curL = e.clientX - (dr.canvasLeft - sdx) - dr.grabOffsetX;
          const curT = e.clientY - (dr.canvasTop  - sdy) - dr.grabOffsetY;
          const el = document.querySelector(`[data-tile-id="${dr.tileId}"]`) as HTMLElement | null;
          if (el) el.style.transform = `translate(${curL - px.left}px,${curT - px.top}px)`;

          const sx = snapX(curL - PAD, item.w, c);
          const sy = snapY(curT - PAD);
          const sh = dragShadowRef.current;
          if (sh) {
            sh.style.left = `${PAD + sx * (c + GUTTER)}px`;
            sh.style.top  = `${PAD + sy * ROW_UNIT}px`;
          }
          applyLiveDisplacement(base, { ...item, x: sx, y: sy }, c);
        }
        return;
      }

      // ── Resize ────────────────────────────────────────────────────────────
      const r = resizeRef.current;
      if (!r) return;

      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      const { dir, origPixelW, origPixelH, minW, origX, origY, origW, origH } = r;
      const minPxW = minW * c + (minW - 1) * GUTTER;
      const el = document.querySelector(`[data-tile-id="${r.tileId}"]`) as HTMLElement | null;

      let newPxW = r.currentPixelW;
      let newPxH = r.currentPixelH;

      if (dir.includes('e')) { newPxW = Math.max(minPxW, origPixelW + dx); if (el) el.style.width  = `${newPxW}px`; }
      if (dir.includes('w')) { newPxW = Math.max(minPxW, origPixelW - dx); if (el) el.style.width  = `${newPxW}px`; }
      if (dir.includes('s')) { newPxH = Math.max(ROW_H,  origPixelH + dy); if (el) el.style.height = `${newPxH}px`; }
      if (dir.includes('n')) { newPxH = Math.max(ROW_H,  origPixelH - dy); if (el) el.style.height = `${newPxH}px`; }

      if (dir.includes('w') && el) el.style.left = `${PAD + origX * (c + GUTTER) + origPixelW - newPxW}px`;
      if (dir.includes('n') && el) el.style.top  = `${PAD + origY * ROW_UNIT     + origPixelH - newPxH}px`;

      r.currentPixelW = newPxW;
      r.currentPixelH = newPxH;

      const sw = Math.min(COLUMNS, Math.max(minW, Math.round((newPxW + GUTTER) / (c + GUTTER))));
      const sh = Math.max(1, Math.round((newPxH + GUTTER) / ROW_UNIT));
      let sx = origX, sy = origY;
      if (dir.includes('w')) sx = Math.max(0, origX + origW - sw);
      if (dir.includes('n')) sy = Math.max(0, origY + origH - sh);
      sx = Math.max(0, Math.min(COLUMNS - sw, sx));

      const ph_el = resizeShadowRef.current;
      if (ph_el) {
        ph_el.style.left   = `${PAD + sx * (c + GUTTER)}px`;
        ph_el.style.top    = `${PAD + sy * ROW_UNIT}px`;
        ph_el.style.width  = `${sw * c + (sw - 1) * GUTTER}px`;
        ph_el.style.height = `${sh * ROW_H + (sh - 1) * GUTTER}px`;
      }
      const item = base.find(l => l.i === r.tileId);
      if (item) applyLiveDisplacement(base, { ...item, x: sx, y: sy, w: sw, h: sh }, c);
    };

    const onUp = (e: MouseEvent) => {
      const c    = cuRef.current;
      const base = layoutRef.current;

      // ── Drag up ───────────────────────────────────────────────────────────
      const dr = dragRef.current;
      if (dr) {
        dragRef.current = null;
        if (dragShadowRef.current) dragShadowRef.current.style.display = 'none';
        const item = base.find(l => l.i === dr.tileId);
        if (item) {
          const sdx  = window.pageXOffset - dr.initScrollX;
          const sdy  = window.pageYOffset - dr.initScrollY;
          const curL = e.clientX - (dr.canvasLeft - sdx) - dr.grabOffsetX - PAD;
          const curT = e.clientY - (dr.canvasTop  - sdy) - dr.grabOffsetY - PAD;
          const final = compactLayout(base.map(l => l.i === dr.tileId ? { ...l, x: snapX(curL, item.w, c), y: snapY(curT) } : l));
          commitPositions(final, c);
          setLayout(final);
        }
        return;
      }

      // ── Resize up ─────────────────────────────────────────────────────────
      const r = resizeRef.current;
      if (!r) return;
      resizeRef.current = null;
      if (resizeShadowRef.current) resizeShadowRef.current.style.display = 'none';
      const el = document.querySelector(`[data-tile-id="${r.tileId}"]`) as HTMLElement | null;
      el?.classList.remove('tile-is-resizing');

      const newW = Math.min(COLUMNS, Math.max(r.minW, Math.round((r.currentPixelW + GUTTER) / (c + GUTTER))));
      const newH = Math.max(1, Math.round((r.currentPixelH + GUTTER) / ROW_UNIT));
      let x = r.origX, y = r.origY, w = newW, h = newH;
      if (r.dir.includes('w')) x = Math.max(0, r.origX + r.origW - w);
      if (r.dir.includes('n')) y = Math.max(0, r.origY + r.origH - h);
      x = Math.max(0, Math.min(COLUMNS - w, x));
      const final = compactLayout(base.map(l => l.i === r.tileId ? { ...l, x, y, w, h } : l));
      commitPositions(final, c);
      setLayout(final);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const isMultiSelect = selectedTiles.length > 1;

  const buildCommonTileProps = (item: TileItem) => ({
    mode,
    selected: isMultiSelect ? false : selectedTiles.includes(item.i),
    onSelect: () => {
      if (shiftRef.current) {
        setSelectedTiles(prev =>
          prev.includes(item.i) ? prev.filter(id => id !== item.i) : [...prev, item.i]
        );
        lastShiftTileRef.current = item.i;
      } else {
        setSelectedTiles([item.i]);
        lastShiftTileRef.current = null;
      }
      setSelectedInnerTile(null);
    },
    onResizeHandleMouseDown: (dir: string, e: React.MouseEvent) => handleResizeStart(item.i, dir, e),
    style: { width: '100%', height: '100%' } as React.CSSProperties,
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* Sticky header */}
      <div style={s.stickyNav}>
        <LiveboardHeader
          mode={mode}
          title={liveboardName}
          activeTab={activeTab}
          tabs={tabsData}
          filters={filterData}
          onTabChange={setActiveTab}
          onEdit={() => { setMode('edit'); setHoveredTile(null); }}
          onSave={() => { setMode('view'); setSelectedTiles([]); setSelectedInnerTile(null); setSpotterOpen(false); }}
          onCancel={() => { setMode('view'); setSelectedTiles([]); setSelectedInnerTile(null); setSpotterOpen(false); }}
          onToggleSpotter={() => setSpotterOpen(o => !o)}
          spotterOpen={spotterOpen}
        />
      </div>

      {/* Body + optional SpotterViz panel */}
      <div style={s.bodyWrapper}>
        <div
          ref={containerRef}
          style={{ ...s.canvas, height: canvasHeight }}
          onClick={e => {
            const t = e.target as HTMLElement;
            if (!t.closest('[data-tile-id]')) {
              setSelectedTiles([]);
              setSelectedInnerTile(null);
            }
            if (!t.closest('[data-inner-tile-id]')) setSelectedInnerTile(null);
          }}
        >
          {/* CSS for resize suppression */}
          <style>{`.tile-is-resizing { transition: none !important; }`}</style>

          {/* Drag shadow */}
          <div ref={dragShadowRef}   style={shadowStyle} />
          {/* Resize shadow */}
          <div ref={resizeShadowRef} style={shadowStyle} />

          {/* Tiles */}
          {layout.map(item => {
            const p   = tilePixels(item, cu);
            const def = tileDefMap[item.i];
            if (!def) return null;

            const multiSelectedStyle: React.CSSProperties = isMultiSelect && selectedTiles.includes(item.i)
              ? { outline: '2px dashed #7B61FF', outlineOffset: '1px', borderRadius: 16, background: 'rgba(123,97,255,0.04)' }
              : {};

            const commonProps = buildCommonTileProps(item);

            return (
              <div
                key={item.i}
                data-tile-id={item.i}
                style={{
                  position: 'absolute',
                  left: p.left, top: p.top,
                  width: p.width, height: p.height,
                  boxSizing: 'border-box',
                  overflow: 'visible',
                  ...multiSelectedStyle,
                }}
                onMouseEnter={!isEdit ? () => setHoveredTile(item.i) : undefined}
                onMouseLeave={!isEdit ? () => setHoveredTile(null) : undefined}
                onMouseDown={e => {
                  if (!isEdit) return;
                  const target = e.target as HTMLElement;
                  if (target.closest('.tile-drag-handle') && !target.closest('.tile-resize-handle')) {
                    handleDragStart(item.i, e);
                  }
                }}
              >
                {/* ── View mode: hover action palette ── */}
                {!isEdit && (
                  <div style={{
                    ...s.viewPalette,
                    opacity: hoveredTile === item.i ? 1 : 0,
                    pointerEvents: hoveredTile === item.i ? 'auto' : 'none',
                  }}>
                    {def.tileType !== 'note' && (
                      <>
                        <button style={s.viewActionBtn} title="Ask Spotter" onClick={() => {}}>
                          <IconSpotter />
                        </button>
                        <button style={s.viewActionBtn} title="Expand" onClick={() => {}}>
                          <IconExpand />
                        </button>
                      </>
                    )}
                    <button style={s.viewActionBtn} title="More actions" onClick={() => {}}>
                      <IconMore />
                    </button>
                  </div>
                )}

                {/* ── Tile component ── */}
                {def.tileType === 'note' ? (
                  <NoteTile
                    content={NOTE_VARIATIONS[(def as { noteVariant: NoteVariant }).noteVariant]}
                    onDelete={() => {
                      setLayout(prev => compactLayout(prev.filter(l => l.i !== item.i)));
                      setTileDefs(prev => prev.filter(t => t.id !== item.i));
                      setSelectedTiles([]);
                    }}
                    onDuplicate={() => {
                      const newId = `${item.i}-copy-${Date.now()}`;
                      const canRight = item.x + item.w * 2 <= COLUMNS;
                      setTileDefs(prev => [...prev, { ...(def as TileDef), id: newId }]);
                      setLayout(prev => compactLayout([...prev, { ...item, i: newId, x: canRight ? item.x + item.w : item.x, y: canRight ? item.y : item.y + item.h }]));
                    }}
                    {...commonProps}
                  />
                ) : def.tileType === 'group' ? (
                  <GroupTile
                    groupId={item.i}
                    title={(def as { title: string }).title}
                    description={(def as { description?: string }).description}
                    innerTiles={groupLayouts[item.i] ?? []}
                    innerChartTypes={groupChartTypes[item.i]}
                    selectedInnerTileId={selectedInnerTile?.groupId === item.i ? selectedInnerTile.tileId : null}
                    onInnerTileSelect={tileId => {
                      setSelectedTiles([]);
                      setSelectedInnerTile(tileId ? { groupId: item.i, tileId } : null);
                    }}
                    onInnerLayoutChange={nl => setGroupLayouts(prev => ({ ...prev, [item.i]: nl }))}
                    onInnerChartTypeChange={(tid, t) => setGroupChartTypes(prev => ({ ...prev, [item.i]: { ...(prev[item.i] ?? {}), [tid]: t } }))}
                    onTitleChange={t => setTileTitles(prev => ({ ...prev, [item.i]: t }))}
                    onDescriptionChange={d => setTileDescs(prev => ({ ...prev, [item.i]: d }))}
                    onDuplicate={() => {
                      const newId = `${item.i}-copy-${Date.now()}`;
                      const canRight = item.x + item.w * 2 <= COLUMNS;
                      setTileDefs(prev => [...prev, { ...(def as TileDef), id: newId }]);
                      setGroupLayouts(prev => ({ ...prev, [newId]: groupLayouts[item.i] ?? [] }));
                      setLayout(prev => compactLayout([...prev, { ...item, i: newId, x: canRight ? item.x + item.w : item.x, y: canRight ? item.y : item.y + item.h }]));
                    }}
                    onUngroup={() => {
                      const innerLayout = groupLayouts[item.i] ?? [];
                      const newDefs: TileDef[] = [];
                      const newItems: TileItem[] = [];
                      innerLayout.forEach(inner => {
                        const newId = `${inner.i}-ug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                        const mainW = Math.max(2, Math.round(inner.w * item.w / 12));
                        const mainX = Math.max(0, Math.min(COLUMNS - mainW, item.x + Math.round(inner.x * item.w / 12)));
                        newItems.push({ i: newId, x: mainX, y: item.y + inner.y, w: mainW, h: Math.max(1, inner.h), minW: 2 });
                        newDefs.push(inner.tileType === 'note'
                          ? { id: newId, tileType: 'note', noteVariant: inner.noteVariant }
                          : { id: newId, tileType: 'answer', chartType: inner.chartType ?? 'bar', title: inner.title ?? '', description: inner.description }
                        );
                      });
                      setTileDefs(prev => [...prev.filter(t => t.id !== item.i), ...newDefs]);
                      setLayout(prev => compactLayout([...prev.filter(l => l.i !== item.i), ...newItems]));
                      setGroupLayouts(prev => { const n = { ...prev }; delete n[item.i]; return n; });
                      setSelectedTiles([]);
                    }}
                    onDelete={() => {
                      setLayout(prev => compactLayout(prev.filter(l => l.i !== item.i)));
                      setTileDefs(prev => prev.filter(t => t.id !== item.i));
                      setGroupLayouts(prev => { const n = { ...prev }; delete n[item.i]; return n; });
                      setSelectedTiles([]);
                    }}
                    {...commonProps}
                  />
                ) : (
                  <AnswerTile
                    chartType={chartTypes[item.i] ?? (def as { chartType: ChartType }).chartType}
                    title={tileTitles[item.i] ?? (def as { title: string }).title}
                    description={tileDescs[item.i] ?? (def as { description?: string }).description}
                    onTitleChange={t => setTileTitles(prev => ({ ...prev, [item.i]: t }))}
                    onDescriptionChange={d => setTileDescs(prev => ({ ...prev, [item.i]: d }))}
                    onChartTypeChange={t => setChartTypes(prev => ({ ...prev, [item.i]: t }))}
                    onDuplicate={() => {
                      const newId = `${item.i}-copy-${Date.now()}`;
                      const canRight = item.x + item.w * 2 <= COLUMNS;
                      setTileDefs(prev => [...prev, { ...(def as TileDef), id: newId }]);
                      setLayout(prev => compactLayout([...prev, { ...item, i: newId, x: canRight ? item.x + item.w : item.x, y: canRight ? item.y : item.y + item.h }]));
                    }}
                    onDelete={() => {
                      setLayout(prev => compactLayout(prev.filter(l => l.i !== item.i)));
                      setTileDefs(prev => prev.filter(t => t.id !== item.i));
                      setSelectedTiles([]);
                    }}
                    {...commonProps}
                  />
                )}
              </div>
            );
          })}

          {/* ── Multi-select toolbar ── */}
          {isEdit && selectedTiles.length > 1 && lastShiftTileRef.current && (() => {
            const anchor = layout.find(l => l.i === lastShiftTileRef.current);
            if (!anchor) return null;
            return (
              <div style={{
                position: 'absolute',
                left: PAD + anchor.x * (cu + GUTTER),
                top:  PAD + anchor.y * ROW_UNIT - 48,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px',
                background: '#212326', border: '1px solid #303136',
                borderRadius: 4, boxShadow: '0 0 4px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 200,
              }}>
                <button
                  style={s.multiToolbarBtn}
                  title={`Group ${selectedTiles.length} tiles`}
                  onClick={() => {
                    const sel = layout.filter(l => selectedTiles.includes(l.i));
                    if (sel.length < 2) return;
                    const minX = Math.min(...sel.map(l => l.x));
                    const minY = Math.min(...sel.map(l => l.y));
                    const maxX = Math.max(...sel.map(l => l.x + l.w));
                    const maxY = Math.max(...sel.map(l => l.y + l.h));
                    const gW = maxX - minX, gH = maxY - minY;
                    const newGroupId = `group-${Date.now()}`;
                    const innerTiles: GroupInnerTile[] = sel.map(s => {
                      const d = tileDefMap[s.i];
                      const innerX = Math.max(0, Math.round((s.x - minX) / gW * 12));
                      const innerW = Math.max(1, Math.round(s.w / gW * 12));
                      if (d?.tileType === 'note') return { i: `${s.i}-inner`, x: innerX, y: s.y - minY, w: innerW, h: s.h, minW: 1, tileType: 'note' as const, noteVariant: (d as { noteVariant: NoteVariant }).noteVariant };
                      return { i: `${s.i}-inner`, x: innerX, y: s.y - minY, w: innerW, h: s.h, minW: 1, tileType: 'answer' as const, chartType: (chartTypes[s.i] ?? (d as { chartType?: ChartType })?.chartType ?? 'bar') as ChartType, title: (tileTitles[s.i] ?? (d as { title?: string })?.title) ?? '' };
                    });
                    setTileDefs(prev => [...prev.filter(t => !selectedTiles.includes(t.id)), { id: newGroupId, tileType: 'group', title: 'Group' }]);
                    setGroupLayouts(prev => ({ ...prev, [newGroupId]: innerTiles }));
                    setLayout(prev => compactLayout([...prev.filter(l => !selectedTiles.includes(l.i)), { i: newGroupId, x: minX, y: minY, w: Math.max(2, gW), h: Math.max(2, gH), minW: 2 }]));
                    setSelectedTiles([]);
                    lastShiftTileRef.current = null;
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                </button>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
                <button
                  style={s.multiToolbarBtn}
                  title="Delete selected"
                  onClick={() => {
                    setLayout(prev => compactLayout(prev.filter(l => !selectedTiles.includes(l.i))));
                    setTileDefs(prev => prev.filter(t => !selectedTiles.includes(t.id)));
                    setSelectedTiles([]);
                    lastShiftTileRef.current = null;
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 13.7854 14.8342" fill="none">
                    <path d="M4.94492 11.2364V5.99197H6.14364V11.2364H4.94492Z" fill="currentColor"/>
                    <path d="M7.64205 5.99197V11.2364H8.84078V5.99197H7.64205Z" fill="currentColor"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.74615 1.79809V2.39745L0 2.39819V3.59692H1.10149L2.99694 14.8342H11.0883L12.713 3.59692H13.7854V2.39819L10.1893 2.39745V1.79809C10.1893 0.805033 9.38427 0 8.39121 0H5.54423C4.55118 0 3.74615 0.805032 3.74615 1.79809ZM5.54423 1.19873C5.21322 1.19873 4.94487 1.46707 4.94487 1.79809V2.39745H8.99057V1.79809C8.99057 1.46707 8.72223 1.19873 8.39121 1.19873H5.54423ZM2.31715 3.59692H11.5018L10.0505 13.6355H4.01041L2.31715 3.59692Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            );
          })()}
        </div>

        {/* SpotterViz side panel (edit mode only) */}
        {isEdit && spotterOpen && (
          <SpotterVizPanel onClose={() => setSpotterOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default LiveboardTemplate;

// ─── Shadow style (drag + resize) ─────────────────────────────────────────────

const shadowStyle: React.CSSProperties = {
  display: 'none', position: 'absolute',
  background: 'rgba(39,112,239,0.08)', border: '1.5px solid rgba(39,112,239,0.35)',
  borderRadius: 16, pointerEvents: 'none', zIndex: 4, boxSizing: 'border-box', transition: 'none',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#F6F8FA',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  stickyNav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  bodyWrapper: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    position: 'relative',
    overflowY: 'auto',
    background: '#F6F8FA',
  },
  viewPalette: {
    position: 'absolute',
    top: 8,
    right: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    zIndex: 5,
    transition: 'opacity 0.12s',
  },
  viewActionBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    border: '1px solid #EAEDF2',
    borderRadius: 6,
    cursor: 'pointer',
    color: '#1D232F',
    padding: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  multiToolbarBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    background: 'transparent',
    border: 'none',
    borderRadius: 2,
    cursor: 'pointer',
    color: '#ffffff',
    padding: 0,
  },
};
