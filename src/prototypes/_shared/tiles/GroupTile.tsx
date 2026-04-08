import React, { forwardRef, useRef, useEffect, useState } from 'react';
import styles from './GroupTile.module.css';
import type { ChartType, TileMode } from './AnswerTile';
import { AnswerTile } from './AnswerTile';
import { NoteTile } from './NoteTile';
import type { NoteVariant } from './noteContent';
import { NOTE_VARIATIONS } from './noteContent';

// ─── Spacing constants (Figma node 8740:362406) ───────────────────────────────

const G_PAD    = 8;   // header top+sides, body bottom+sides
const G_PAD_I  = 4;   // header bottom, body top
const G_GUTTER = 8;   // gap between inner tiles
const G_COLS   = 12;  // inner 12-column grid

// ─── Inner grid constants ─────────────────────────────────────────────────────
// INNER_ROW_H is FIXED — inner tiles never change height because the group is
// resized. The group container's height is auto-computed from its content.
// This mirrors the main liveboard which also has a fixed ROW_H = 120.

export const INNER_ROW_H = 80;

// ─── Types ────────────────────────────────────────────────────────────────────

export type GroupInnerTile = {
  i: string;
  x: number; y: number;
  w: number; h: number;
  minW?: number;
} & (
  | { tileType: 'answer'; chartType: ChartType; title?: string; description?: string }
  | { tileType: 'note'; noteVariant: NoteVariant }
);

export interface GroupTileProps extends React.HTMLAttributes<HTMLDivElement> {
  groupId: string;
  title: string;
  description?: string;
  innerTiles: GroupInnerTile[];
  mode?: TileMode;
  selected?: boolean;
  selectedInnerTileId?: string | null;
  onSelect?: () => void;
  onResizeHandleMouseDown?: (dir: string, e: React.MouseEvent) => void;
  onInnerTileSelect?: (tileId: string | null) => void;
  onInnerLayoutChange?: (newLayout: GroupInnerTile[]) => void;
  innerChartTypes?: Record<string, ChartType>;
  onInnerChartTypeChange?: (tileId: string, type: ChartType) => void;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onDuplicate?: () => void;
  onUngroup?: () => void;
  onDelete?: () => void;
}

// ─── Inner grid math ─────────────────────────────────────────────────────────

const MIN_INNER_ROW_H = 40; // px — prevents inner tiles becoming unreadable

/** Inner column unit — scales with the group body width. */
function innerCU(bodyW: number): number {
  return (bodyW - 2 * G_PAD - G_GUTTER * (G_COLS - 1)) / G_COLS;
}

/** Inner row height — scales proportionally with the group body height. */
function innerRH(bodyH: number, rows: number): number {
  const usable = bodyH - G_PAD_I - G_PAD - G_GUTTER * Math.max(0, rows - 1);
  return Math.max(MIN_INNER_ROW_H, usable / Math.max(1, rows));
}

/** Pixel rect for an inner tile given the current column unit and row height. */
function innerPx(tile: GroupInnerTile, cu: number, rh: number) {
  return {
    left:   G_PAD   + tile.x * (cu + G_GUTTER),
    top:    G_PAD_I + tile.y * (rh + G_GUTTER),
    width:  tile.w * cu + (tile.w - 1) * G_GUTTER,
    height: tile.h * rh + (tile.h - 1) * G_GUTTER,
  };
}

/** Total number of row units occupied by the inner tile set. */
function innerMaxRows(tiles: GroupInnerTile[]): number {
  return tiles.reduce((m, t) => Math.max(m, t.y + t.h), 1);
}

/**
 * Body pixel height — explicit, derived purely from the inner tile layout.
 * The group tile's h on the main grid is kept in sync with this via LiveboardNext.
 */
export function groupBodyHeight(tiles: GroupInnerTile[]): number {
  const n = innerMaxRows(tiles);
  return G_PAD_I + n * INNER_ROW_H + Math.max(0, n - 1) * G_GUTTER + G_PAD;
}

// ─── Collision / compact (scoped to inner grid, same rules as main liveboard) ─

function collide(a: GroupInnerTile, b: GroupInnerTile): boolean {
  if (a.i === b.i) return false;
  if (a.x + a.w <= b.x || b.x + b.w <= a.x) return false;
  if (a.y + a.h <= b.y || b.y + b.h <= a.y) return false;
  return true;
}
function compact(tiles: GroupInnerTile[]): GroupInnerTile[] {
  const sorted = [...tiles].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
  const placed: GroupInnerTile[] = [];
  for (const t of sorted) {
    const w = Math.min(t.w, G_COLS);
    const x = Math.max(0, Math.min(t.x, G_COLS - w));
    let y = 0;
    while (placed.some(p => collide(p, { ...t, w, x, y }))) y++;
    placed.push({ ...t, w, x, y });
  }
  return placed;
}

// ─── Live DOM displacement — no React re-renders ──────────────────────────────

function applyInnerDisplacement(
  base: GroupInnerTile[], active: GroupInnerTile,
  _cu: number, rh: number, bodyEl: HTMLElement
) {
  const resolved = compact(base.map(t => t.i === active.i ? active : t));
  for (const orig of base) {
    if (orig.i === active.i) continue;
    const r = resolved.find(t => t.i === orig.i);
    if (!r) continue;
    const delta = (r.y - orig.y) * (rh + G_GUTTER);
    const el = bodyEl.querySelector(`[data-inner-tile-id="${orig.i}"]`) as HTMLElement | null;
    if (el) el.style.transform = delta ? `translateY(${delta}px)` : '';
  }
}

function commitInnerPositions(tiles: GroupInnerTile[], cu: number, rh: number, bodyEl: HTMLElement) {
  for (const t of tiles) {
    const el = bodyEl.querySelector(`[data-inner-tile-id="${t.i}"]`) as HTMLElement | null;
    if (!el) continue;
    const p = innerPx(t, cu, rh);
    el.style.left      = `${p.left}px`;
    el.style.top       = `${p.top}px`;
    el.style.width     = `${p.width}px`;
    el.style.height    = `${p.height}px`;
    el.style.transform = '';
    el.style.zIndex    = '';
  }
}

// ─── Drag / resize state shapes ───────────────────────────────────────────────

interface InnerDragState {
  tileId: string;
  grabOffsetX: number; grabOffsetY: number;
  bodyLeft: number; bodyTop: number;
  initScrollX: number; initScrollY: number;
}
interface InnerResizeState {
  tileId: string; dir: string;
  startX: number; startY: number;
  origX: number; origY: number; origW: number; origH: number; minW: number;
  origPixelW: number; origPixelH: number;
  currentPixelW: number; currentPixelH: number;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 14.6017 14.7436" fill="none">
    <path d="M1.35166 10.7197L11.2301 0.732767C11.406 0.554895 11.6933 0.554895 11.8692 0.732767L13.8724 2.75794C14.0456 2.93308 14.0456 3.21503 13.8724 3.39018L3.98709 13.3841L0.784184 14.1397C0.6761 14.1652 0.578805 14.0683 0.603779 13.9601L1.35166 10.7197Z" stroke="currentColor" strokeWidth="1.19873"/>
    <line x1="9.06479" y1="3.13251" x2="11.6121" y2="5.6798" stroke="currentColor" strokeWidth="1.19873"/>
  </svg>
);
const IconDuplicate = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <g transform="translate(0.9,0.9)">
      <rect x="4.046" y="0.599" width="9.44" height="9.44" rx="0.6" stroke="currentColor" strokeWidth="1.199"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M3.545 4.126H1.198C0.537 4.126 0 4.662 0 5.324V12.886C0 13.507 0.472 14.017 1.076 14.079L1.198 14.086H8.761L8.884 14.079C9.448 14.021 9.896 13.573 9.953 13.009L9.96 12.886V10.54H8.761V12.886H1.198V5.324H3.545V4.126Z" fill="currentColor"/>
    </g>
  </svg>
);
const IconUngroup = () => (
  /* Two overlapping squares with a dashed break — represents ungroup */
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="8" y="8" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="8.5" y1="1.5" x2="8.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>
    <line x1="1.5" y1="8.5" x2="7.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>
  </svg>
);
const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 13.7854 14.8342" fill="none">
    <path d="M4.94492 11.2364V5.99197H6.14364V11.2364H4.94492Z" fill="currentColor"/>
    <path d="M7.64205 5.99197V11.2364H8.84078V5.99197H7.64205Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M3.74615 1.79809V2.39745L0 2.39819V3.59692H1.10149L2.99694 14.8342H11.0883L12.713 3.59692H13.7854V2.39819L10.1893 2.39745V1.79809C10.1893 0.805033 9.38427 0 8.39121 0H5.54423C4.55118 0 3.74615 0.805032 3.74615 1.79809ZM5.54423 1.19873C5.21322 1.19873 4.94487 1.46707 4.94487 1.79809V2.39745H8.99057V1.79809C8.99057 1.46707 8.72223 1.19873 8.39121 1.19873H5.54423ZM2.31715 3.59692H11.5018L10.0505 13.6355H4.01041L2.31715 3.59692Z" fill="currentColor"/>
  </svg>
);

// ─── Shadow style ─────────────────────────────────────────────────────────────

const innerShadow: React.CSSProperties = {
  display: 'none', position: 'absolute',
  background: 'rgba(39,112,239,0.08)', border: '1.5px solid rgba(39,112,239,0.35)',
  borderRadius: 6, pointerEvents: 'none', zIndex: 4, boxSizing: 'border-box',
  transition: 'none',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const GroupTile = forwardRef<HTMLDivElement, GroupTileProps>(
  ({
    groupId, title, description, innerTiles,
    mode = 'view', selected = false, selectedInnerTileId,
    onSelect, onResizeHandleMouseDown,
    onInnerTileSelect, onInnerLayoutChange,
    innerChartTypes, onInnerChartTypeChange,
    onTitleChange, onDescriptionChange,
    onDuplicate, onUngroup, onDelete,
    style, className, onClick, ...rest
  }, ref) => {
    const isEdit     = mode === 'edit';
    const isSelected = isEdit && selected;

    // ── Inline title / description editing (same pattern as AnswerTile) ────
    const [localTitle, setLocalTitle] = useState(title ?? '');
    const [localDesc,  setLocalDesc]  = useState(description ?? '');
    useEffect(() => { setLocalTitle(title ?? ''); }, [title]);
    useEffect(() => { setLocalDesc(description ?? ''); }, [description]);

    const [titleHovered, setTitleHovered] = useState(false);
    const [titleFocused, setTitleFocused] = useState(false);
    const [descHovered,  setDescHovered]  = useState(false);
    const [descFocused,  setDescFocused]  = useState(false);

    const titleInputRef = useRef<HTMLInputElement>(null);
    const descInputRef  = useRef<HTMLInputElement>(null);

    const titleBorder = titleFocused ? '1px solid #2770EF' : titleHovered ? '1px solid #C0C6CF' : '1px solid transparent';
    const descBorder  = descFocused  ? '1px solid #2770EF' : descHovered  ? '1px solid #C0C6CF' : '1px solid transparent';

    // Body ref — ResizeObserver watches width changes to update innerCU
    const bodyRef = useRef<HTMLDivElement>(null);

    // Cached inner grid dims — updated by ResizeObserver whenever body resizes.
    // cuRef: column unit (scales with body width)
    // rhRef: row height (scales proportionally with body height)
    const cuRef = useRef(0);
    const rhRef = useRef(INNER_ROW_H);

    // Stable refs to live values used in event handlers
    const innerTilesRef   = useRef(innerTiles);     innerTilesRef.current = innerTiles;
    const layoutChangeRef = useRef(onInnerLayoutChange); layoutChangeRef.current = onInnerLayoutChange;

    // Drag / resize state
    const innerDragRef   = useRef<InnerDragState | null>(null);
    const innerResizeRef = useRef<InnerResizeState | null>(null);

    // Shadow refs
    const dragShadowRef   = useRef<HTMLDivElement>(null);
    const resizeShadowRef = useRef<HTMLDivElement>(null);

    // ── ResizeObserver — tracks body WIDTH and HEIGHT ───────────────────────
    // When the group is resized in either direction, inner tile positions and
    // sizes update proportionally (no React re-renders during the drag).
    useEffect(() => {
      const update = () => {
        const bodyEl = bodyRef.current;
        if (!bodyEl) return;
        const tiles = innerTilesRef.current;
        const cu    = innerCU(bodyEl.offsetWidth);
        const rh    = innerRH(bodyEl.offsetHeight, innerMaxRows(tiles));
        cuRef.current = cu;
        rhRef.current = rh;
        for (const t of tiles) {
          if (innerDragRef.current?.tileId   === t.i) continue;
          if (innerResizeRef.current?.tileId === t.i) continue;
          const el = bodyEl.querySelector(`[data-inner-tile-id="${t.i}"]`) as HTMLElement | null;
          if (!el) continue;
          const p = innerPx(t, cu, rh);
          el.style.left   = `${p.left}px`;
          el.style.top    = `${p.top}px`;
          el.style.width  = `${p.width}px`;
          el.style.height = `${p.height}px`;
        }
      };
      const ro = new ResizeObserver(update);
      if (bodyRef.current) ro.observe(bodyRef.current);
      return () => ro.disconnect();
    }, []);

    // ── Inner drag start ───────────────────────────────────────────────────
    const handleInnerDragStart = (tileId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const tile   = innerTilesRef.current.find(t => t.i === tileId);
      const bodyEl = bodyRef.current;
      if (!tile || !bodyEl) return;

      const br = bodyEl.getBoundingClientRect();
      const cu = cuRef.current;
      const rh = rhRef.current;
      const px = innerPx(tile, cu, rh);

      innerDragRef.current = {
        tileId,
        grabOffsetX: (e.clientX - br.left) - px.left,
        grabOffsetY: (e.clientY - br.top)  - px.top,
        bodyLeft: br.left, bodyTop: br.top,
        initScrollX: window.pageXOffset, initScrollY: window.pageYOffset,
      };

      const sh = dragShadowRef.current;
      if (sh) {
        sh.style.display = 'block';
        sh.style.left    = `${px.left}px`;
        sh.style.top     = `${px.top}px`;
        sh.style.width   = `${px.width}px`;
        sh.style.height  = `${px.height}px`;
      }
      const el = bodyEl.querySelector(`[data-inner-tile-id="${tileId}"]`) as HTMLElement | null;
      if (el) el.style.zIndex = '10';
    };

    // ── Inner resize start ─────────────────────────────────────────────────
    const handleInnerResizeStart = (tileId: string, dir: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const tile   = innerTilesRef.current.find(t => t.i === tileId);
      const bodyEl = bodyRef.current;
      if (!tile || !bodyEl) return;

      const el   = bodyEl.querySelector(`[data-inner-tile-id="${tileId}"]`) as HTMLElement | null;
      const rect = el?.getBoundingClientRect();
      const cu   = cuRef.current;
      const pw   = rect?.width  ?? (tile.w * cu + (tile.w - 1) * G_GUTTER);
      const ph   = rect?.height ?? (tile.h * rh + (tile.h - 1) * G_GUTTER);

      innerResizeRef.current = {
        tileId, dir,
        startX: e.clientX, startY: e.clientY,
        origX: tile.x, origY: tile.y, origW: tile.w, origH: tile.h,
        minW: tile.minW ?? 1,
        origPixelW: pw, origPixelH: ph,
        currentPixelW: pw, currentPixelH: ph,
      };

      el?.classList.add('tile-is-resizing');
      if (el) el.style.zIndex = '10';

      const bodyRect = bodyEl.getBoundingClientRect();
      if (el) {
        const tr = el.getBoundingClientRect();
        const sh = resizeShadowRef.current;
        if (sh) {
          sh.style.display = 'block';
          sh.style.left    = `${tr.left - bodyRect.left}px`;
          sh.style.top     = `${tr.top  - bodyRect.top}px`;
          sh.style.width   = `${tr.width}px`;
          sh.style.height  = `${tr.height}px`;
        }
      }
    };

    // ── Document mouse events — inner grid (same pattern as LiveboardNext) ──
    useEffect(() => {
      const onMove = (e: MouseEvent) => {
        const cu = cuRef.current;
        const rh = rhRef.current;
        const bodyEl = bodyRef.current;

        // ── Drag ────────────────────────────────────────────────────────
        const dr = innerDragRef.current;
        if (dr && bodyEl) {
          const sdx  = window.pageXOffset - dr.initScrollX;
          const sdy  = window.pageYOffset - dr.initScrollY;
          const al   = dr.bodyLeft - sdx;
          const at   = dr.bodyTop  - sdy;
          const tile = innerTilesRef.current.find(t => t.i === dr.tileId);
          if (!tile) return;

          const px   = innerPx(tile, cu, rh);
          const curL = e.clientX - al - dr.grabOffsetX;
          const curT = e.clientY - at - dr.grabOffsetY;

          const el = bodyEl.querySelector(`[data-inner-tile-id="${dr.tileId}"]`) as HTMLElement | null;
          if (el) el.style.transform = `translate(${curL - px.left}px,${curT - px.top}px)`;

          // Snap for shadow + live displacement
          const sx = Math.max(0, Math.min(G_COLS - tile.w,
            Math.round((curL - G_PAD)   / (cu + G_GUTTER))));
          const sy = Math.max(0,
            Math.round((curT - G_PAD_I) / (rh + G_GUTTER)));

          const sh = dragShadowRef.current;
          if (sh) {
            sh.style.left   = `${G_PAD   + sx * (cu + G_GUTTER)}px`;
            sh.style.top    = `${G_PAD_I + sy * (rh + G_GUTTER)}px`;
            sh.style.width  = `${tile.w * cu + (tile.w - 1) * G_GUTTER}px`;
            sh.style.height = `${tile.h * rh + (tile.h - 1) * G_GUTTER}px`;
          }
          applyInnerDisplacement(innerTilesRef.current, { ...tile, x: sx, y: sy }, cu, rh, bodyEl);
          return;
        }

        // ── Resize ──────────────────────────────────────────────────────
        const r = innerResizeRef.current;
        if (!r || !bodyEl) return;

        const dx  = e.clientX - r.startX;
        const dy  = e.clientY - r.startY;
        const { dir, origPixelW, origPixelH, minW, origX, origY, origW, origH } = r;
        const minPxW = minW * cu + (minW - 1) * G_GUTTER;
        const minPxH = INNER_ROW_H; // minimum 1 row

        let newPxW = r.currentPixelW;
        let newPxH = r.currentPixelH;

        const el = bodyEl.querySelector(`[data-inner-tile-id="${r.tileId}"]`) as HTMLElement | null;

        if (dir.includes('e')) { newPxW = Math.max(minPxW, origPixelW + dx); if (el) el.style.width  = `${newPxW}px`; }
        if (dir.includes('w')) { newPxW = Math.max(minPxW, origPixelW - dx); if (el) el.style.width  = `${newPxW}px`; }
        if (dir.includes('s')) { newPxH = Math.max(minPxH, origPixelH + dy); if (el) el.style.height = `${newPxH}px`; }
        if (dir.includes('n')) { newPxH = Math.max(minPxH, origPixelH - dy); if (el) el.style.height = `${newPxH}px`; }

        if (dir.includes('w') && el) {
          el.style.left = `${G_PAD + origX * (cu + G_GUTTER) + origPixelW - newPxW}px`;
        }
        if (dir.includes('n') && el) {
          el.style.top = `${G_PAD_I + origY * (rh + G_GUTTER) + origPixelH - newPxH}px`;
        }

        r.currentPixelW = newPxW;
        r.currentPixelH = newPxH;

        // Snap for shadow + live displacement
        const sw = Math.min(G_COLS, Math.max(minW,
          Math.round((newPxW + G_GUTTER) / (cu + G_GUTTER))));
        const sh = Math.max(1,
          Math.round((newPxH + G_GUTTER) / (rh + G_GUTTER)));
        let sx = origX, sy = origY;
        if (dir.includes('w')) sx = Math.max(0, origX + origW - sw);
        if (dir.includes('n')) sy = Math.max(0, origY + origH - sh);
        sx = Math.max(0, Math.min(G_COLS - sw, sx));

        const ph_el = resizeShadowRef.current;
        if (ph_el) {
          ph_el.style.left   = `${G_PAD   + sx * (cu + G_GUTTER)}px`;
          ph_el.style.top    = `${G_PAD_I + sy * (rh + G_GUTTER)}px`;
          ph_el.style.width  = `${sw * cu + (sw - 1) * G_GUTTER}px`;
          ph_el.style.height = `${sh * rh + (sh - 1) * G_GUTTER}px`;
        }

        const tile = innerTilesRef.current.find(t => t.i === r.tileId);
        if (tile) {
          applyInnerDisplacement(
            innerTilesRef.current, { ...tile, x: sx, y: sy, w: sw, h: sh }, cu, rh, bodyEl
          );
        }
      };

      const onUp = (e: MouseEvent) => {
        const cu = cuRef.current;
        const rh = rhRef.current;
        const bodyEl = bodyRef.current;

        // ── Drag up ──────────────────────────────────────────────────────
        const dr = innerDragRef.current;
        if (dr && bodyEl) {
          innerDragRef.current = null;
          if (dragShadowRef.current) dragShadowRef.current.style.display = 'none';

          const tile = innerTilesRef.current.find(t => t.i === dr.tileId);
          if (tile) {
            const sdx  = window.pageXOffset - dr.initScrollX;
            const sdy  = window.pageYOffset - dr.initScrollY;
            const curL = e.clientX - (dr.bodyLeft - sdx) - dr.grabOffsetX;
            const curT = e.clientY - (dr.bodyTop  - sdy) - dr.grabOffsetY;
            const sx   = Math.max(0, Math.min(G_COLS - tile.w,
              Math.round((curL - G_PAD)   / (cu + G_GUTTER))));
            const sy   = Math.max(0,
              Math.round((curT - G_PAD_I) / (rh + G_GUTTER)));

            const final = compact(
              innerTilesRef.current.map(t => t.i === dr.tileId ? { ...t, x: sx, y: sy } : t)
            );
            commitInnerPositions(final, cu, rh, bodyEl);
            layoutChangeRef.current?.(final);
          }
          return;
        }

        // ── Resize up ────────────────────────────────────────────────────
        const r = innerResizeRef.current;
        if (!r || !bodyEl) return;
        innerResizeRef.current = null;
        if (resizeShadowRef.current) resizeShadowRef.current.style.display = 'none';

        const el = bodyEl.querySelector(`[data-inner-tile-id="${r.tileId}"]`) as HTMLElement | null;
        el?.classList.remove('tile-is-resizing');

        const newW = Math.min(G_COLS, Math.max(r.minW,
          Math.round((r.currentPixelW + G_GUTTER) / (cu + G_GUTTER))));
        const newH = Math.max(1,
          Math.round((r.currentPixelH + G_GUTTER) / (rh + G_GUTTER)));
        let x = r.origX, y = r.origY, w = newW, h = newH;
        if (r.dir.includes('w')) x = Math.max(0, r.origX + r.origW - w);
        if (r.dir.includes('n')) y = Math.max(0, r.origY + r.origH - h);
        x = Math.max(0, Math.min(G_COLS - w, x));

        const final = compact(
          innerTilesRef.current.map(t => t.i === r.tileId ? { ...t, x, y, w, h } : t)
        );
        commitInnerPositions(final, cu, rh, bodyEl);
        layoutChangeRef.current?.(final);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
      return () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      };
    }, []);

    // ── Render ─────────────────────────────────────────────────────────────

    const tileClass = [
      styles.tile,
      isEdit     && styles.tileEdit,
      isSelected && styles.tileSelected,
      className,
    ].filter(Boolean).join(' ');

    // Body pixel height — explicit, computed from inner tile layout.
    // Absolute positioning of inner tiles relies on the body having a definite height.
    const bodyH = groupBodyHeight(innerTiles);

    // Initial grid dims for first render (ResizeObserver corrects after mount)
    const bodyEl = bodyRef.current;
    const cu = innerCU(bodyEl?.offsetWidth ?? 400);
    const rh = bodyEl
      ? innerRH(bodyEl.offsetHeight, innerMaxRows(innerTiles))
      : INNER_ROW_H;
    if (bodyEl) { cuRef.current = cu; rhRef.current = rh; }

    // Resize handle helper
    const hd = (dir: string, cls: string, cursor: string) => (
      <div
        key={dir} className={`${cls} tile-resize-handle`} style={{ cursor }}
        onMouseDown={e => { e.stopPropagation(); onResizeHandleMouseDown?.(dir, e); }}
      />
    );

    return (
      <div ref={ref} className={tileClass} style={style} onClick={onClick} {...rest}>

        {/* ── Group selection chrome ── */}
        {isSelected && (
          <div className={styles.selectionOverlay}>
            {hd('nw', `${styles.handle} ${styles.handleTopLeft}`,     'nw-resize')}
            {hd('ne', `${styles.handle} ${styles.handleTopRight}`,    'ne-resize')}
            {hd('sw', `${styles.handle} ${styles.handleBottomLeft}`,  'sw-resize')}
            {hd('se', `${styles.handle} ${styles.handleBottomRight}`, 'se-resize')}
            {hd('w',  `${styles.handlePill}  ${styles.handleMidLeft}`,   'w-resize')}
            {hd('e',  `${styles.handlePill}  ${styles.handleMidRight}`,  'e-resize')}
            {hd('n',  `${styles.handlePillH} ${styles.handleMidTop}`,    'n-resize')}
            {hd('s',  `${styles.handlePillH} ${styles.handleMidBottom}`, 's-resize')}
          </div>
        )}

        {isSelected && (
          <div className={styles.toolbar} onMouseDown={e => e.stopPropagation()}>
            <button className={styles.toolbarBtn} title="Edit"><IconEdit /></button>
            <div className={styles.toolbarDivider} />
            <button className={styles.toolbarBtn} title="Duplicate" onClick={onDuplicate}><IconDuplicate /></button>
            <div className={styles.toolbarDivider} />
            <button className={styles.toolbarBtn} title="Ungroup" onClick={onUngroup}><IconUngroup /></button>
            <div className={styles.toolbarDivider} />
            <button className={styles.toolbarBtn} title="Delete" onClick={onDelete}><IconDelete /></button>
          </div>
        )}

        {/* ── Header — drag handle on the padding area; text fields are NOT drag handles ── */}
        <div
          className={`${styles.header} ${isEdit ? 'tile-drag-handle' : ''}`}
          onClick={isEdit ? (e) => { e.stopPropagation(); onSelect?.(); } : undefined}
        >
          <div className={styles.textBlock}>
            {/* Title — editable wrapper (same pattern as AnswerTile) */}
            <div
              className={styles.title}
              style={isEdit ? { border: titleBorder, borderRadius: 4, padding: '2px 4px', cursor: 'text', boxSizing: 'border-box' } : undefined}
              onPointerEnter={isEdit ? () => setTitleHovered(true)  : undefined}
              onPointerLeave={isEdit ? () => setTitleHovered(false) : undefined}
              onMouseDown={isEdit ? e => e.stopPropagation()        : undefined}
              onClick={isEdit ? e => { e.stopPropagation(); onSelect?.(); titleInputRef.current?.focus(); } : undefined}
            >
              {isEdit ? (
                <input
                  ref={titleInputRef}
                  style={{ display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', cursor: 'text' }}
                  value={localTitle}
                  onChange={e => setLocalTitle(e.target.value)}
                  onFocus={() => { setTitleFocused(true); setTitleHovered(false); }}
                  onBlur={() => { setTitleFocused(false); onTitleChange?.(localTitle); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  { onTitleChange?.(localTitle); e.currentTarget.blur(); }
                    if (e.key === 'Escape') { setLocalTitle(title ?? ''); e.currentTarget.blur(); }
                  }}
                />
              ) : localTitle}
            </div>

            {/* Description — editable wrapper */}
            {(localDesc || isEdit) && (
              <div
                className={styles.description}
                style={isEdit ? { border: descBorder, borderRadius: 4, padding: '0 4px', cursor: 'text', boxSizing: 'border-box' } : undefined}
                onPointerEnter={isEdit ? () => setDescHovered(true)  : undefined}
                onPointerLeave={isEdit ? () => setDescHovered(false) : undefined}
                onMouseDown={isEdit ? e => e.stopPropagation()       : undefined}
                onClick={isEdit ? e => { e.stopPropagation(); onSelect?.(); descInputRef.current?.focus(); } : undefined}
              >
                {isEdit ? (
                  <input
                    ref={descInputRef}
                    style={{ display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', padding: 0, font: 'inherit', color: 'inherit', cursor: 'text' }}
                    placeholder={isEdit ? 'Add description…' : ''}
                    value={localDesc}
                    onChange={e => setLocalDesc(e.target.value)}
                    onFocus={() => { setDescFocused(true); setDescHovered(false); }}
                    onBlur={() => { setDescFocused(false); onDescriptionChange?.(localDesc); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  { onDescriptionChange?.(localDesc); e.currentTarget.blur(); }
                      if (e.key === 'Escape') { setLocalDesc(description ?? ''); e.currentTarget.blur(); }
                    }}
                  />
                ) : localDesc}
              </div>
            )}
          </div>
        </div>

        {/* ── Body — mini-liveboard with absolute-positioned inner tiles ── */}
        <div
          ref={bodyRef}
          className={styles.body}
          style={{ height: bodyH }}
        >
          <div ref={dragShadowRef}   style={innerShadow} />
          <div ref={resizeShadowRef} style={innerShadow} />

          {innerTiles.map(tile => {
            const p = innerPx(tile, cu, rh);
            return (
              <div
                key={tile.i}
                data-inner-tile-id={tile.i}
                style={{
                  position: 'absolute',
                  left: p.left, top: p.top,
                  width: p.width, height: p.height,
                  boxSizing: 'border-box',
                  overflow: 'visible',
                  borderRadius: 6,
                }}
                onMouseDown={e => {
                  if (!isEdit) return;
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('.tile-drag-handle') &&
                    !target.closest('.tile-resize-handle')
                  ) {
                    handleInnerDragStart(tile.i, e);
                  }
                }}
              >
                {tile.tileType === 'answer' ? (
                  <AnswerTile
                    chartType={innerChartTypes?.[tile.i] ?? tile.chartType}
                    title={tile.title}
                    description={tile.description}
                    mode={mode}
                    selected={selectedInnerTileId === tile.i}
                    onSelect={() => onInnerTileSelect?.(tile.i)}
                    onResizeHandleMouseDown={(dir, e) => handleInnerResizeStart(tile.i, dir, e)}
                    onChartTypeChange={type => onInnerChartTypeChange?.(tile.i, type)}
                    onDelete={() => {
                      const final = compact(innerTilesRef.current.filter(t => t.i !== tile.i));
                      commitInnerPositions(final, cuRef.current, rhRef.current, bodyRef.current!);
                      layoutChangeRef.current?.(final);
                      onInnerTileSelect?.(null);
                    }}
                    onDuplicate={() => {
                      const newId = `${tile.i}-copy-${Date.now()}`;
                      const canRight = tile.x + tile.w * 2 <= G_COLS;
                      const newTile = {
                        ...tile, i: newId,
                        x: canRight ? tile.x + tile.w : tile.x,
                        y: canRight ? tile.y : tile.y + tile.h,
                      };
                      const final = compact([...innerTilesRef.current, newTile]);
                      commitInnerPositions(final, cuRef.current, rhRef.current, bodyRef.current!);
                      layoutChangeRef.current?.(final);
                    }}
                    className={styles.innerTileFrame}
                    style={{
                      width: '100%', height: '100%',
                      '--tile-title-size':   '14px',
                      '--tile-title-weight': '500',
                      '--tile-title-lh':     '20px',
                      '--tile-title-ls':     '0',
                    } as React.CSSProperties}
                  />
                ) : (
                  <NoteTile
                    content={NOTE_VARIATIONS[tile.noteVariant]}
                    mode={mode}
                    selected={selectedInnerTileId === tile.i}
                    onSelect={() => onInnerTileSelect?.(tile.i)}
                    onResizeHandleMouseDown={(dir, e) => handleInnerResizeStart(tile.i, dir, e)}
                    onDelete={() => {
                      const final = compact(innerTilesRef.current.filter(t => t.i !== tile.i));
                      commitInnerPositions(final, cuRef.current, rhRef.current, bodyRef.current!);
                      layoutChangeRef.current?.(final);
                      onInnerTileSelect?.(null);
                    }}
                    onDuplicate={() => {
                      const newId = `${tile.i}-copy-${Date.now()}`;
                      const canRight = tile.x + tile.w * 2 <= G_COLS;
                      const newTile = {
                        ...tile, i: newId,
                        x: canRight ? tile.x + tile.w : tile.x,
                        y: canRight ? tile.y : tile.y + tile.h,
                      };
                      const final = compact([...innerTilesRef.current, newTile]);
                      commitInnerPositions(final, cuRef.current, rhRef.current, bodyRef.current!);
                      layoutChangeRef.current?.(final);
                    }}
                    className={styles.innerTileFrame}
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

GroupTile.displayName = 'GroupTile';
