import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnswerTile, ChartType, NoteTile, GroupTile, NOTE_VARIATIONS, GroupInnerTile } from '../_shared/tiles';
import { StylingPanelDrawer, StylingSettings, SelectedTileType, TileOverride, TILE_SWATCHES_DARK } from './components/StylingPanelDrawer';
import { EditToolbar } from '@components/LiveboardHeader/EditToolbar';
import { EditSubHeader } from '@components/LiveboardHeader/EditSubHeader';

// ─── Grid constants ───────────────────────────────────────────────────────────

const COLUMNS  = 12;
const GUTTER   = 16;
const ROW_H    = 80;
const ROW_UNIT = ROW_H + GUTTER;
const PAD      = 24;

// ─── Separator helpers ────────────────────────────────────────────────────────

/** Find overlapping segments between two sets of [start, end) intervals */
function intersectIntervals(a: [number, number][], b: [number, number][]): [number, number][] {
  const result: [number, number][] = [];
  for (const [a0, a1] of a) {
    for (const [b0, b1] of b) {
      const s = Math.max(a0, b0);
      const e = Math.min(a1, b1);
      if (s < e) result.push([s, e]);
    }
  }
  return result;
}

// ─── Grid math ────────────────────────────────────────────────────────────────

function colUnit(w: number) {
  return (w - PAD * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;
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

function tilesCollide(a: TileItem, b: TileItem) {
  if (a.i === b.i) return false;
  if (a.x + a.w <= b.x || b.x + b.w <= a.x) return false;
  if (a.y + a.h <= b.y || b.y + b.h <= a.y) return false;
  return true;
}

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

// ─── Live displacement ────────────────────────────────────────────────────────

function applyLiveDisplacement(base: TileItem[], active: TileItem) {
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

function clearDisplacement(base: TileItem[]) {
  for (const item of base) {
    const el = document.querySelector(`[data-tile-id="${item.i}"]`) as HTMLElement | null;
    if (el) { el.style.transform = ''; }
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TileItem = { i: string; x: number; y: number; w: number; h: number; minW: number };
type TileDef  =
  | { id: string; tileType: 'answer'; title: string; description?: string; chartType: ChartType }
  | { id: string; tileType: 'note';   noteVariant: 'weekly-update' | 'key-metrics' | 'announcement' }
  | { id: string; tileType: 'group';  title: string; description?: string };

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

// ─── Tile definitions ─────────────────────────────────────────────────────────

const TILE_DEFS: TileDef[] = [
  { id: 'kpi-1',   tileType: 'answer', title: 'Total customers',   chartType: 'kpi'   },
  { id: 'kpi-2',   tileType: 'answer', title: 'Total products',    chartType: 'kpi'   },
  { id: 'kpi-3',   tileType: 'answer', title: 'Sales',             chartType: 'kpi'   },
  { id: 'kpi-4',   tileType: 'answer', title: 'Average sales',     chartType: 'kpi'   },
  { id: 'bar-1',   tileType: 'answer', title: 'Sales by location', description: 'Top countries by revenue', chartType: 'bar'   },
  { id: 'tbl-1',   tileType: 'answer', title: 'Top products',      description: 'By revenue, last 30d',     chartType: 'table' },
  { id: 'area-1',  tileType: 'answer', title: 'Daily sales trend', chartType: 'area'  },
  { id: 'note-1',  tileType: 'note',   noteVariant: 'weekly-update' },
  { id: 'group-1', tileType: 'group',  title: 'Breakdown by pricing type', description: 'By year and quarter' },
  { id: 'group-2', tileType: 'group',  title: 'Regional performance',      description: 'Q1 2025 vs Q1 2024' },
];

const INITIAL_LAYOUT: TileItem[] = [
  { i: 'kpi-1',   x: 0,  y: 0,  w: 3,  h: 3, minW: 2 },
  { i: 'kpi-2',   x: 3,  y: 0,  w: 3,  h: 3, minW: 2 },
  { i: 'kpi-3',   x: 6,  y: 0,  w: 3,  h: 3, minW: 2 },
  { i: 'kpi-4',   x: 9,  y: 0,  w: 3,  h: 3, minW: 2 },
  { i: 'bar-1',   x: 0,  y: 3,  w: 6,  h: 3, minW: 2 },
  { i: 'tbl-1',   x: 6,  y: 3,  w: 6,  h: 3, minW: 2 },
  { i: 'note-1',  x: 0,  y: 6,  w: 4,  h: 2, minW: 2 },
  { i: 'area-1',  x: 4,  y: 6,  w: 8,  h: 2, minW: 3 },
  { i: 'group-1', x: 0,  y: 8,  w: 12, h: 6, minW: 3 },
  { i: 'group-2', x: 0,  y: 14, w: 12, h: 6, minW: 3 },
];

// ─── Corner radius per density ────────────────────────────────────────────────
const CORNER_RADIUS: Record<string, number> = { spacious: 20, medium: 16, compact: 12 };

// ─── Inner content padding per density ────────────────────────────────────────
const DENSITY_PADDING: Record<string, number> = { compact: 0, medium: 4, spacious: 8 };

// ─── Group inner tile gutter per density ──────────────────────────────────────
const GROUP_GUTTER: Record<string, number> = { compact: 4, medium: 8, spacious: 8 };

// ─── Highlight color map (from Liveboard-Styling Figma 3556:451388) ──────────

const HIGHLIGHT_COLORS: Record<string, { bg: string; border: string }> = {
  gray:   { bg: '#323946', border: '#4A515E' },
  purple: { bg: '#422E75', border: '#6A4ABA' },
  blue:   { bg: '#163772', border: '#2359B6' },
  teal:   { bg: '#22636B', border: '#369FAA' },
  green:  { bg: '#005D39', border: '#049160' },
  yellow: { bg: '#785F1A', border: '#BF982A' },
  orange: { bg: '#7A3D1F', border: '#C26232' },
  red:    { bg: '#721F27', border: '#B6313E' },
  dark:   { bg: '#FFFFFF', border: '#4A515E' },
};

// ─── Liveboard background map ─────────────────────────────────────────────────
const LIVEBOARD_BG: Record<string, string> = {
  gray:   '#F6F8FA',
  purple: '#f0ebff',
  blue:   '#dee8fa',
  teal:   '#e1f7fa',
  green:  '#e0f8ef',
  yellow: '#fff8e5',
  orange: '#ffeee5',
  red:    '#ffebec',
};

// ─── Tile border color per theme (image spec: theme/40 for colored, Gray/20 for gray) ──
const TILE_BORDER: Record<string, string> = {
  gray:   '#EAEDF2', // Gray/20
  purple: '#D1C0FB', // Purple/40
  blue:   '#ABC7F9', // Blue/40
  teal:   '#B5ECF2', // Teal/40
  green:  '#9BE5CB', // Green/40
  yellow: '#FDE9AF', // Yellow/40
  orange: '#FFCCB3', // Orange/40
  red:    '#F9B3B9', // Red/40
};

// ─── Header data ──────────────────────────────────────────────────────────────

const tabs    = [{ label: 'Overview', id: 'overview' }, { label: 'Revenue', id: 'revenue' }];
const filters = [{ label: 'Region', value: 'North America' }, { label: 'Period', value: 'Last 90 days' }];

// ─── Shadow style ─────────────────────────────────────────────────────────────

const shadowStyle: React.CSSProperties = {
  display: 'none', position: 'absolute',
  background: 'rgba(39,112,239,0.08)', border: '1.5px solid rgba(39,112,239,0.35)',
  borderRadius: 16, pointerEvents: 'none', zIndex: 4, boxSizing: 'border-box',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const StylingPanel: React.FC = () => {
  const [activeTab, setActiveTab]       = useState('overview');
  const [spotterOpen, setSpotterOpen]   = useState(false);
  const [stylingOpen, setStylingOpen]   = useState(false);
  const [layout, setLayout]             = useState<TileItem[]>(INITIAL_LAYOUT);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [chartTypes, setChartTypes]     = useState<Record<string, ChartType>>({});
  const [tileOverrides, setTileOverrides] = useState<Record<string, TileOverride>>({});
  const [groupLayouts, setGroupLayouts] = useState<Record<string, GroupInnerTile[]>>({
    'group-1': [
      { i: 'g1-kpi1',  x: 0, y: 0, w: 6, h: 1, minW: 1, tileType: 'answer', chartType: 'kpi',   title: 'Avg price / unit' },
      { i: 'g1-kpi2',  x: 6, y: 0, w: 6, h: 1, minW: 1, tileType: 'answer', chartType: 'kpi',   title: 'Revenue mix'      },
      { i: 'g1-line',  x: 0, y: 1, w: 8, h: 2, minW: 1, tileType: 'answer', chartType: 'line',  title: 'Price trend'      },
      { i: 'g1-donut', x: 8, y: 1, w: 4, h: 2, minW: 1, tileType: 'answer', chartType: 'donut', title: 'Pricing split'   },
    ],
    'group-2': [
      { i: 'g2-col',    x: 0, y: 0, w: 7, h: 2, minW: 1, tileType: 'answer', chartType: 'column',  title: 'Sales by region'     },
      { i: 'g2-donut',  x: 7, y: 0, w: 5, h: 2, minW: 1, tileType: 'answer', chartType: 'donut',   title: 'Revenue share'       },
      { i: 'g2-note',   x: 0, y: 2, w: 12, h: 1, minW: 1, tileType: 'note',  noteVariant: 'key-metrics' },
    ],
  });
  const [selectedInnerTile, setSelectedInnerTile] = useState<{ groupId: string; tileId: string } | null>(null);
  // Preview state for color hover previews (null = use committed value)
  const [previewLiveboardColor, setPreviewLiveboardColor]       = useState<string | null>(null);
  const [previewTileColor, setPreviewTileColor]                 = useState<string | null>(null);
  const [previewInnerTileColor, setPreviewInnerTileColor]       = useState<string | null>(null);

  const [stylingSettings, setStylingSettings] = useState<StylingSettings>({
    color: 'gray', density: 'medium', cornerStyle: 'rounded', spacing: 'guttered',
    groupTitle: true, groupDescription: true, groupTileDescription: false, tileDescription: false,
    kpiDescription: false, kpiView: 'default-all', kpiSize: 'M',
    noteRemovePadding: false, noteRemoveBackground: false,
  });

  const handleTileOverrideChange = (tileId: string, override: Partial<TileOverride>) => {
    setTileOverrides(prev => ({ ...prev, [tileId]: { ...{ linked: true }, ...prev[tileId], ...override } }));
  };

  // Derive selected tile type from id prefix
  const activeSelectedTile = selectedInnerTile?.tileId ?? selectedTile;
  const selectedTileType: SelectedTileType = (() => {
    if (selectedInnerTile) return 'answer-in-group';
    if (!selectedTile) return null;
    if (selectedTile.startsWith('kpi')) return 'kpi';
    if (selectedTile.startsWith('note')) return 'note';
    if (selectedTile.startsWith('group')) return 'group';
    return 'answer';
  })();

  const containerRef    = useRef<HTMLDivElement>(null);
  const layoutRef       = useRef(layout); layoutRef.current = layout;
  const cuRef           = useRef(0);
  const dragRef         = useRef<DragState | null>(null);
  const resizeRef       = useRef<ResizeState | null>(null);
  const dragShadowRef   = useRef<HTMLDivElement>(null);
  const resizeShadowRef = useRef<HTMLDivElement>(null);

  const cu = colUnit(containerWidth);
  cuRef.current = cu;

  // Measure container width
  useEffect(() => {
    const measure = () => { if (containerRef.current) setContainerWidth(containerRef.current.clientWidth); };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fix overlaps
  useEffect(() => {
    const hasOverlap = layout.some((a, i) => layout.some((b, j) => i < j && tilesCollide(a, b)));
    if (hasOverlap) setLayout(compactLayout(layout));
  }, [layout]);

  // Drag start
  const handleDragStart = useCallback((tileId: string, e: React.MouseEvent) => {
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
    if (sh) { sh.style.display = 'block'; sh.style.left = `${px.left}px`; sh.style.top = `${px.top}px`; sh.style.width = `${px.width}px`; sh.style.height = `${px.height}px`; }
    const el = document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement | null;
    if (el) el.style.zIndex = '10';
  }, []);

  // Resize start
  const handleResizeStart = useCallback((tileId: string, dir: string, e: React.MouseEvent) => {
    e.preventDefault();
    const item = layoutRef.current.find(l => l.i === tileId);
    if (!item) return;
    const el   = document.querySelector(`[data-tile-id="${tileId}"]`) as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    const c    = cuRef.current;
    const pw   = rect?.width  ?? (item.w * c + (item.w - 1) * GUTTER);
    const ph   = rect?.height ?? (item.h * ROW_H + (item.h - 1) * GUTTER);
    resizeRef.current = { tileId, dir, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y, origW: item.w, origH: item.h, minW: item.minW ?? 2, origPixelW: pw, origPixelH: ph, currentPixelW: pw, currentPixelH: ph };
    if (el) { el.classList.add('tile-is-resizing'); el.style.zIndex = '10'; }
    const canvasEl = containerRef.current;
    if (el && canvasEl) {
      const cr = canvasEl.getBoundingClientRect();
      const tr = el.getBoundingClientRect();
      const sh = resizeShadowRef.current;
      if (sh) { sh.style.display = 'block'; sh.style.left = `${tr.left - cr.left}px`; sh.style.top = `${tr.top - cr.top}px`; sh.style.width = `${tr.width}px`; sh.style.height = `${tr.height}px`; }
    }
  }, []);

  // Mouse move + up
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const c    = cuRef.current;
      const base = layoutRef.current;
      const dr   = dragRef.current;
      if (dr) {
        const sdx = window.pageXOffset - dr.initScrollX;
        const sdy = window.pageYOffset - dr.initScrollY;
        const al  = dr.canvasLeft - sdx;
        const at  = dr.canvasTop  - sdy;
        const item = base.find(l => l.i === dr.tileId);
        if (item) {
          const px   = tilePixels(item, c);
          const curL = e.clientX - al - dr.grabOffsetX;
          const curT = e.clientY - at - dr.grabOffsetY;
          const el = document.querySelector(`[data-tile-id="${dr.tileId}"]`) as HTMLElement | null;
          if (el) el.style.transform = `translate(${curL - px.left}px,${curT - px.top}px)`;
          const sx = snapX(curL - PAD, item.w, c);
          const sy = snapY(curT - PAD);
          const sh = dragShadowRef.current;
          if (sh) { sh.style.left = `${PAD + sx * (c + GUTTER)}px`; sh.style.top = `${PAD + sy * ROW_UNIT}px`; }
          applyLiveDisplacement(base, { ...item, x: sx, y: sy });
        }
        return;
      }
      const r = resizeRef.current;
      if (!r) return;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      const { dir, origPixelW, origPixelH, minW, origX, origY, origW, origH } = r;
      const minPxW = minW * c + (minW - 1) * GUTTER;
      let newPxW = r.currentPixelW, newPxH = r.currentPixelH;
      const el = document.querySelector(`[data-tile-id="${r.tileId}"]`) as HTMLElement | null;
      if (dir.includes('e')) { newPxW = Math.max(minPxW, origPixelW + dx); if (el) el.style.width  = `${newPxW}px`; }
      if (dir.includes('w')) { newPxW = Math.max(minPxW, origPixelW - dx); if (el) el.style.width  = `${newPxW}px`; }
      if (dir.includes('s')) { newPxH = Math.max(ROW_H,  origPixelH + dy); if (el) el.style.height = `${newPxH}px`; }
      if (dir.includes('n')) { newPxH = Math.max(ROW_H,  origPixelH - dy); if (el) el.style.height = `${newPxH}px`; }
      if (dir.includes('w') && el) el.style.left = `${PAD + origX * (c + GUTTER) + origPixelW - newPxW}px`;
      if (dir.includes('n') && el) el.style.top  = `${PAD + origY * ROW_UNIT + origPixelH - newPxH}px`;
      r.currentPixelW = newPxW; r.currentPixelH = newPxH;
      const sw = Math.min(COLUMNS, Math.max(minW, Math.round((newPxW + GUTTER) / (c + GUTTER))));
      const sh_h = Math.max(1, Math.round((newPxH + GUTTER) / ROW_UNIT));
      let sx = origX, sy = origY;
      if (dir.includes('w')) sx = Math.max(0, origX + origW - sw);
      if (dir.includes('n')) sy = Math.max(0, origY + origH - sh_h);
      sx = Math.max(0, Math.min(COLUMNS - sw, sx));
      const ph_el = resizeShadowRef.current;
      if (ph_el) { ph_el.style.left = `${PAD + sx * (c + GUTTER)}px`; ph_el.style.top = `${PAD + sy * ROW_UNIT}px`; ph_el.style.width = `${sw * c + (sw - 1) * GUTTER}px`; ph_el.style.height = `${sh_h * ROW_H + (sh_h - 1) * GUTTER}px`; }
      const item = base.find(l => l.i === r.tileId);
      if (item) applyLiveDisplacement(base, { ...item, x: sx, y: sy, w: sw, h: sh_h });
    };

    const onUp = (e: MouseEvent) => {
      const c    = cuRef.current;
      const base = layoutRef.current;
      const dr   = dragRef.current;
      if (dr) {
        dragRef.current = null;
        if (dragShadowRef.current) dragShadowRef.current.style.display = 'none';
        const item = base.find(l => l.i === dr.tileId);
        if (item) {
          const sdx  = window.pageXOffset - dr.initScrollX;
          const sdy  = window.pageYOffset - dr.initScrollY;
          const curL = e.clientX - (dr.canvasLeft - sdx) - dr.grabOffsetX - PAD;
          const curT = e.clientY - (dr.canvasTop  - sdy) - dr.grabOffsetY - PAD;
          const sx   = snapX(curL, item.w, c);
          const sy   = snapY(curT);
          const final = compactLayout(base.map(l => l.i === dr.tileId ? { ...l, x: sx, y: sy } : l));
          commitPositions(final, c);
          setLayout(final);
        } else {
          clearDisplacement(base);
          const el = document.querySelector(`[data-tile-id="${dr.tileId}"]`) as HTMLElement | null;
          if (el) { el.style.transform = ''; el.style.zIndex = ''; }
        }
        return;
      }
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

  const tileDefMap = Object.fromEntries(TILE_DEFS.map(t => [t.id, t]));
  const maxBottom  = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  const canvasH    = PAD + maxBottom * ROW_UNIT - GUTTER + PAD;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: stylingSettings.spacing === 'no-gutter' ? '#FFFFFF' : (LIVEBOARD_BG[previewLiveboardColor ?? stylingSettings.color] ?? '#F6F8FA'), fontFamily: "'Plain', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Edit toolbar — sticky, never covered by the panel */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
        <EditToolbar
          onSave={() => {}}
          onCancel={() => {}}
          onToggleSpotter={() => setSpotterOpen(s => !s)}
          spotterOpen={spotterOpen}
          onToggleStyling={() => setStylingOpen(s => !s)}
          stylingOpen={stylingOpen}
        />
      </div>

      {/* Sub-header + canvas — panel overlays this entire area */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <EditSubHeader
          title="Online retail sales"
          activeTab={activeTab}
          tabs={tabs}
          filters={filters}
          onTabChange={setActiveTab}
        />

        {/* Grid canvas */}
        <div
          ref={containerRef}
          style={{
            position: 'relative', height: canvasH,
            '--rd-sys-color-border-divider':  TILE_BORDER[previewLiveboardColor ?? stylingSettings.color] ?? '#EAEDF2',
            '--tile-outer-border-color':      stylingSettings.spacing === 'no-gutter' ? 'transparent' : (TILE_BORDER[previewLiveboardColor ?? stylingSettings.color] ?? '#EAEDF2'),
            '--group-header-divider':         stylingSettings.spacing === 'no-gutter' ? 'transparent' : (TILE_BORDER[previewLiveboardColor ?? stylingSettings.color] ?? '#EAEDF2'),
            '--tile-title-size':              stylingSettings.density === 'spacious' ? '18px' : '16px',
            '--tile-title-weight':            stylingSettings.density === 'compact'  ? '400' : '600',
            '--tile-title-lh':                stylingSettings.density === 'spacious' ? '28px' : '24px',
            '--tile-toolbar-btn-size':        stylingSettings.density === 'spacious' ? '32px' : '24px',
            '--tile-kpi-weight':              stylingSettings.density === 'compact'  ? '400' : '500',
          } as React.CSSProperties}
          onClick={e => { if (!(e.target as HTMLElement).closest('[data-tile-id]')) { setSelectedTile(null); setSelectedInnerTile(null); } }}
        >
          <style>{`.tile-is-resizing { transition: none !important; }`}</style>
          <div ref={dragShadowRef}   style={shadowStyle} />
          <div ref={resizeShadowRef} style={shadowStyle} />

          {/* Canvas separators — only in gutterless mode, only where tiles exist on both sides */}
          {stylingSettings.spacing === 'no-gutter' && (() => {
            const sepColor = '#DBDFE7';
            const colBreaks = [...new Set(layout.map(t => t.x + t.w))].filter(x => x > 0 && x < COLUMNS);
            const rowBreaks = [...new Set(layout.map(t => t.y + t.h))].filter(y => y < maxBottom);
            return (
              <>
                {/* Left and right canvas edge lines */}
                <div style={{ position: 'absolute', left: PAD - GUTTER / 2, top: 0, bottom: 0, width: 1, background: sepColor, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: PAD + COLUMNS * (cu + GUTTER) - GUTTER / 2, top: 0, bottom: 0, width: 1, background: sepColor, pointerEvents: 'none' }} />
                {colBreaks.flatMap(x => {
                  const rightSegs = layout.filter(t => t.x + t.w === x).map(t => [t.y, t.y + t.h] as [number, number]);
                  const leftSegs  = layout.filter(t => t.x === x).map(t => [t.y, t.y + t.h] as [number, number]);
                  return intersectIntervals(rightSegs, leftSegs).map(([y0, y1]) => {
                    const segTop = y0 === 0 ? 0 : PAD + y0 * ROW_UNIT - GUTTER / 2;
                    const segBottom = PAD + y1 * ROW_UNIT - GUTTER / 2;
                    return (
                      <div key={`sep-v-${x}-${y0}`} style={{
                        position: 'absolute',
                        left:   PAD + x * (cu + GUTTER) - GUTTER / 2,
                        top:    segTop,
                        width:  1,
                        height: segBottom - segTop,
                        background: sepColor,
                        pointerEvents: 'none',
                      }} />
                    );
                  });
                })}
                {rowBreaks.flatMap(y => {
                  const aboveSegs = layout.filter(t => t.y + t.h === y).map(t => [t.x, t.x + t.w] as [number, number]);
                  const belowSegs = layout.filter(t => t.y === y).map(t => [t.x, t.x + t.w] as [number, number]);
                  return intersectIntervals(aboveSegs, belowSegs).map(([x0, x1]) => (
                    <div key={`sep-h-${y}-${x0}`} style={{
                      position: 'absolute',
                      top:   PAD + y * ROW_UNIT - GUTTER / 2,
                      left:  PAD + x0 * (cu + GUTTER) - GUTTER / 2,
                      height: 1,
                      width: (x1 - x0) * (cu + GUTTER),
                      background: sepColor,
                      pointerEvents: 'none',
                    }} />
                  ));
                })}
              </>
            );
          })()}

          {layout.map(item => {
            const p   = tilePixels(item, cu);
            const def = tileDefMap[item.i];
            if (!def) return null;

            // Compute effective settings: linked → liveboard defaults, unlinked → tile overrides
            const override = tileOverrides[item.i];
            const linked = !override || override.linked;
            const effectiveShowDesc  = linked ? stylingSettings.tileDescription : (override?.description ?? false);
            // Highlight is always per-tile for all answer tiles (toggle visible in linked state)
            const effectiveHighlight = override?.highlight ?? false;
            const effectiveBorderRadius = stylingSettings.cornerStyle === 'sharp' ? 0 : (CORNER_RADIUS[stylingSettings.density] ?? 16);
            const densityPadding = DENSITY_PADDING[stylingSettings.density] ?? 4;
            const groupGutter    = GROUP_GUTTER[stylingSettings.density] ?? 8;

            // Tile color: from override.color (with preview), or white default
            const committedColor = (!linked && override?.color) ? override.color : '#FFFFFF';
            const effectiveTileColor = (previewTileColor && selectedTile === item.i) ? previewTileColor : committedColor;
            // Dark appearance: highlight toggle OR dark swatch selected
            const isDarkColor = TILE_SWATCHES_DARK.includes(effectiveTileColor as typeof TILE_SWATCHES_DARK[number]);
            const isInverted  = effectiveHighlight || isDarkColor;

            // Resolved background color
            const highlightColors = effectiveHighlight
              ? (HIGHLIGHT_COLORS[stylingSettings.color] ?? HIGHLIGHT_COLORS.gray)
              : null;
            const resolvedBg = highlightColors
              ? highlightColors.bg
              : (effectiveTileColor !== '#FFFFFF' ? effectiveTileColor : undefined);

            // Group-specific effective settings
            const effectiveGroupDivider = stylingSettings.density !== 'compact';
            const effectiveGroupTitle = linked ? stylingSettings.groupTitle : (override?.groupTitle ?? true);
            const effectiveGroupDesc = linked
              ? stylingSettings.groupDescription
              : (override?.groupDescription ?? false);
            const effectiveGroupTileDesc = linked
              ? stylingSettings.groupTileDescription
              : (override?.groupTileDescription ?? false);
            // Note-specific
            const effectiveRemoveBg = !linked && (override?.removeBackground ?? false);

            const commonProps = {
              mode: 'edit' as const,
              selected: selectedTile === item.i,
              onSelect: () => { setSelectedTile(p => p === item.i ? null : item.i); setSelectedInnerTile(null); },
              onResizeHandleMouseDown: (dir: string, e: React.MouseEvent) => handleResizeStart(item.i, dir, e),
              style: {
                width: '100%', height: '100%',
                borderRadius: effectiveBorderRadius,
                ...(resolvedBg ? { background: resolvedBg } : {}),
                ...(effectiveRemoveBg ? { background: 'transparent', border: 'none' } : {}),
              } as React.CSSProperties,
            };

            return (
              <div
                key={item.i}
                data-tile-id={item.i}
                style={{ position: 'absolute', left: p.left, top: p.top, width: p.width, height: p.height, boxSizing: 'border-box', overflow: 'visible' }}
                onMouseDown={e => {
                  if ((e.target as HTMLElement).closest('.tile-drag-handle')) handleDragStart(item.i, e);
                }}
              >
                {def.tileType === 'note' ? (
                  <NoteTile
                    content={NOTE_VARIATIONS[def.noteVariant]}
                    densityPadding={densityPadding}
                    {...commonProps}
                    style={{
                      ...commonProps.style,
                      ...(isInverted ? {
                        '--rd-sys-color-content-primary':   '#DBDFE7',
                        '--rd-sys-color-content-secondary':  '#A5ACB9',
                        '--rd-sys-color-border-divider':     'rgba(255,255,255,0.12)',
                        '--rd-sys-color-background-sunken':  'rgba(0,0,0,0.2)',
                        '--rd-sys-color-content-brand':      '#71A1F4',
                        '--rd-sys-color-background-base':    resolvedBg ?? '#323946',
                      } as React.CSSProperties : {}),
                    }}
                  />
                ) : def.tileType === 'group' ? (
                  <GroupTile
                    groupId={item.i}
                    title={effectiveGroupTitle ? def.title : ''}
                    description={effectiveGroupDesc ? def.description : undefined}
                    showDivider={effectiveGroupDivider}
                    densityPadding={densityPadding}
                    innerTileShowDescription={effectiveGroupTileDesc}
                    innerTileDensityPadding={densityPadding}
                    innerTileGutter={groupGutter}
                    innerTileOverrides={Object.fromEntries(
                      (groupLayouts[item.i] ?? []).map(inner => {
                        const ov = tileOverrides[inner.i];
                        const innerHighlight = ov?.highlight ?? false;
                        const committedColor = (!ov?.linked && ov?.color) ? ov.color : undefined;
                        const isInnerSelected = selectedInnerTile?.tileId === inner.i;
                        const innerColor = (isInnerSelected && previewInnerTileColor) ? previewInnerTileColor : committedColor;
                        const innerIsDark = innerHighlight || (innerColor ? TILE_SWATCHES_DARK.includes(innerColor as typeof TILE_SWATCHES_DARK[number]) : false);
                        const innerHighlightColors = innerHighlight ? (HIGHLIGHT_COLORS[stylingSettings.color] ?? HIGHLIGHT_COLORS.gray) : null;
                        const innerResolvedBg = innerHighlightColors ? innerHighlightColors.bg : innerColor;
                        return [inner.i, { highlighted: innerHighlight, dark: innerIsDark, resolvedBg: innerResolvedBg }];
                      })
                    )}
                    onInnerPreviewTileColor={setPreviewInnerTileColor}
                    innerTiles={groupLayouts[item.i] ?? []}
                    selectedInnerTileId={selectedInnerTile?.groupId === item.i ? selectedInnerTile.tileId : null}
                    onInnerTileSelect={tileId => {
                      setSelectedTile(null);
                      setSelectedInnerTile(tileId ? { groupId: item.i, tileId } : null);
                    }}
                    onInnerLayoutChange={newLayout => setGroupLayouts(prev => ({ ...prev, [item.i]: newLayout }))}
                    {...commonProps}
                  />
                ) : (
                  <AnswerTile
                    chartType={chartTypes[item.i] ?? def.chartType}
                    title={def.title}
                    description={def.description}
                    showDescription={effectiveShowDesc}
                    highlighted={isInverted}
                    densityPadding={densityPadding}
                    onChartTypeChange={type => setChartTypes(prev => ({ ...prev, [item.i]: type }))}
                    {...commonProps}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Styling panel — slides over sub-header + canvas, not the edit toolbar */}
        <StylingPanelDrawer
          isOpen={stylingOpen}
          onClose={() => setStylingOpen(false)}
          selectedTileId={activeSelectedTile}
          selectedTileType={selectedTileType}
          tileOverrides={tileOverrides}
          onTileOverrideChange={handleTileOverrideChange}
          settings={stylingSettings}
          onSettingsChange={s => setStylingSettings(prev => ({ ...prev, ...s }))}
          onPreviewLiveboardColor={setPreviewLiveboardColor}
          onPreviewTileColor={setPreviewTileColor}
          onPreviewInnerTileColor={setPreviewInnerTileColor}
        />
      </div>
    </div>
  );
};

export default StylingPanel;
