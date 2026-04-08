---
description: Edit mode behaviors — drag, resize, selection chrome, floating toolbars, overlap resolution, state model, and DOM transform patterns. Load when the Liveboard prototype needs edit mode.
globs: ["src/prototypes/*Liveboard*/**", "src/prototypes/*liveboard*/**", "src/prototypes/_liveboard-template/**", "src/prototypes/_shared/tiles/**", "src/prototypes/*Dashboard*/**", "src/prototypes/*dashboard*/**"]
---

# Liveboard Canvas — Edit Mode

> **Prerequisite:** `liveboard-canvas-core.md` must also be loaded.
> For groups, multi-select, or inline editing, also load `liveboard-canvas-advanced.md`.

---

## 1. Edit Mode Entry/Exit

Entered via the Edit button (or LiveboardHeader's edit callback). Exited via Done / Cancel.

On edit mode enter:
- Clear selection state
- Clear inner tile selection
- Tiles become draggable and resizable via `.tile-drag-handle` class

---

## 2. Drag Behavior

- Drag handle: element with class `tile-drag-handle` (chart area for AnswerTile, content div for NoteTile, header div for GroupTile)
- Tile follows cursor **pixel-accurately** during drag via CSS `transform: translate()`
- Other tiles push aside **live** using DOM transforms (no React re-render)
- On `mouseup`: snap to nearest grid cell, run `compactLayout`, call `setLayout`
- A **blue shadow** (`rgba(39,112,239,0.08)` bg, `1.5px solid rgba(39,112,239,0.35)` border, `border-radius: 16px`) shows the snapped destination

**handleDragStart pattern:**
```typescript
const handleDragStart = useCallback((tileId: string, e: React.MouseEvent) => {
  if (modeRef.current !== 'edit') return;
  const canvasEl = containerRef.current;
  if (!canvasEl) return;
  const item = layoutRef.current.find(l => l.i === tileId);
  if (!item) return;

  const cr = canvasEl.getBoundingClientRect();  // always use getBCR, never offsetWidth
  const px = tilePixels(item, cuRef.current);

  dragRef.current = {
    tileId,
    grabOffsetX: (e.clientX - cr.left) - px.left,
    grabOffsetY: (e.clientY - cr.top)  - px.top,
    canvasLeft: cr.left, canvasTop: cr.top,
    initScrollX: window.pageXOffset, initScrollY: window.pageYOffset,
  };
  // Show shadow, raise tile z-index
}, []);
```

Wire on the tile wrapper's `onMouseDown`: only initiate drag if `e.target.closest('.tile-drag-handle')`.

---

## 3. Resize Behavior

- **8 handles**: corners (`nw`, `ne`, `sw`, `se`) and edge pills (`n`, `s`, `e`, `w`)
- Corner handles: `6x6px` white squares, `0.75px solid #2770EF`, positioned `-3px` outside tile boundary
- Edge pill handles: `6x32px` (vertical) or `32x6px` (horizontal), same style
- Tile edge follows cursor pixel-accurately; a **snapped shadow** shows where the tile will land
- On `mouseup`: commit to nearest grid unit, resolve overlaps, call `setLayout`
- Handles are rendered by `AnswerTile`, `NoteTile`, `GroupTile` when `selected && mode === 'edit'`
- Pass `onResizeHandleMouseDown={(dir, e) => handleResizeStart(item.i, dir, e)}` to each tile

### Snap functions

```typescript
function snapX(px: number, w: number, cu: number) {
  return Math.max(0, Math.min(COLUMNS - w, Math.round(px / (cu + GUTTER))));
}
function snapY(px: number) {
  return Math.max(0, Math.round(px / ROW_UNIT));
}
```

---

## 4. Overlap Resolution — compactLayout

Run after every mutation: drag drop, resize commit, delete, duplicate, group, ungroup.
Also run in a `useEffect` safety net on layout state change.

```typescript
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

function tilesCollide(a: TileItem, b: TileItem): boolean {
  if (a.i === b.i) return false;
  if (a.x + a.w <= b.x || b.x + b.w <= a.x) return false;
  if (a.y + a.h <= b.y || b.y + b.h <= a.y) return false;
  return true;
}
```

---

## 5. Selection Chrome — Single Select

Triggered by clicking a tile in edit mode.

- **Border**: `1.5px solid #2770EF`, `border-radius: 0` (square)
- **8 resize handles**: rendered inside tile components (see AnswerTile, NoteTile, GroupTile)
- **Floating toolbar**: positioned `top: -48px, left: -8px` relative to tile — see section 7

---

## 6. State Management Model

```typescript
// Layout & definitions
const [layout,      setLayout]      = useState<TileItem[]>(INITIAL_LAYOUT);
const [tileDefs,    setTileDefs]    = useState<TileDef[]>(TILE_DEFS);

// Selection
const [selectedTiles,    setSelectedTiles]    = useState<string[]>([]);
const [selectedInnerTile, setSelectedInnerTile] = useState<{ groupId: string; tileId: string } | null>(null);

// Per-tile overrides (edit mode mutations)
const [chartTypes,    setChartTypes]    = useState<Record<string, ChartType>>({});
const [tileTitles,    setTileTitles]    = useState<Record<string, string>>({});
const [tileDescs,     setTileDescs]     = useState<Record<string, string>>({});

// Group data
const [groupLayouts,    setGroupLayouts]    = useState<Record<string, GroupInnerTile[]>>(INITIAL_GROUP_LAYOUTS);
const [groupChartTypes, setGroupChartTypes] = useState<Record<string, Record<string, ChartType>>>({});

// View mode
const [hoveredTile, setHoveredTile] = useState<string | null>(null);

// Canvas
const [containerWidth, setContainerWidth] = useState(1200);

// Refs (never trigger re-renders)
const containerRef      = useRef<HTMLDivElement>(null);
const layoutRef         = useRef(layout);     // layoutRef.current = layout on every render
const cuRef             = useRef(0);          // cached colUnit
const modeRef           = useRef(mode);       // cached mode
const dragRef           = useRef<DragState | null>(null);
const resizeRef         = useRef<ResizeState | null>(null);
const dragShadowRef     = useRef<HTMLDivElement>(null);
const resizeShadowRef   = useRef<HTMLDivElement>(null);
const shiftRef          = useRef(false);
const lastShiftTileRef  = useRef<string | null>(null);
```

---

## 7. Floating Toolbars

All toolbars share this visual spec:
- Background: `#1D232F` (AnswerTile/NoteTile) or `#212326` (GroupTile — slightly lighter)
- Border: **AnswerTile/NoteTile**: `1px solid #4A515E`; **GroupTile**: `1px solid #303136`
- `border-radius: 4px`, `gap: 8px`, `padding: 4px 8px`
- Shadow: `0 0 4px rgba(25,35,49,0.1), 0 24px 32px rgba(25,35,49,0.16)`
- Buttons: `24x24px` icon-only, white (`#ffffff`) icons, transparent background
- Divider: `1px solid rgba(255,255,255,0.15)`, height `20px`
- Position: `top: -48px, left: -8px` relative to tile

### Answer tile toolbar
`Edit` | divider | `Scale+chevron` | `Sort+chevron` | divider | `Chart type+chevron` | divider | `Duplicate` | divider | `Delete`

- **Chart type picker**: dropdown below the toolbar button listing all 12 chart types
- **Duplicate**: place copy to the right if `x + w*2 <= 12`, otherwise below
- **Delete**: removes tile from `layout` + `tileDefs`, runs `compactLayout`

### Note tile toolbar
`Edit` | divider | `Duplicate` | divider | `Delete`

### Group tile toolbar
`Edit` | divider | `Duplicate` | divider | `Ungroup` | divider | `Delete`

SVG icon assets are defined inline in `_shared/tiles/AnswerTile.tsx`, `NoteTile.tsx`, and `GroupTile.tsx`. Use those directly; do not recreate.

---

## 8. Critical Implementation Notes

### Always use `getBoundingClientRect()` for pixel dimensions
Never use `offsetWidth`/`offsetHeight` — they are not zoom-safe. Always use `el.getBoundingClientRect()` when measuring tile dimensions during drag/resize.

### DOM-direct transforms during drag (no React re-renders)
```typescript
// During drag — update dragged tile position directly
el.style.transform = `translate(${curL - px.left}px, ${curT - px.top}px)`;

// Live displacement of other tiles
el.style.transform = delta ? `translateY(${delta}px)` : '';

// On drop — commit positions before React re-render to prevent flash
for (const item of finalLayout) {
  const el = document.querySelector(`[data-tile-id="${item.i}"]`) as HTMLElement;
  if (!el) continue;
  const p = tilePixels(item, cu);
  el.style.left = `${p.left}px`; el.style.top = `${p.top}px`;
  el.style.width = `${p.width}px`; el.style.height = `${p.height}px`;
  el.style.transform = ''; el.style.zIndex = '';
}
setLayout(finalLayout);
```

### Add `class="tile-is-resizing"` during resize
```css
.tile-is-resizing { transition: none !important; }
```
Remove the class on `mouseup`.

### compactLayout after EVERY mutation
Run after: drag drop, resize commit, delete, duplicate, group, ungroup, add.
Safety net `useEffect` also catches any overlap left in state.

### Title/desc area is never a drag handle
The `.tile-drag-handle` class belongs on chart/content area only. Title and description wrappers must have `onMouseDown={e => e.stopPropagation()}` to prevent drag conflicts.

### Canvas click deselects
```typescript
// On canvas background click (not on a tile):
if (!e.target.closest('[data-tile-id]')) {
  setSelectedTiles([]);
  setSelectedInnerTile(null);
}
```

### Shift key ref must be a ref, not state
Using `useState` for shift key causes stale closure issues in `onSelect` handlers. Always use `useRef`.
