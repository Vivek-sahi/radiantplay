---
description: Core canvas grid system, tile types, view mode, chart palette, and shared tile imports for all Liveboard prototypes. Always loaded for any Liveboard work.
globs: ["src/prototypes/*Liveboard*/**", "src/prototypes/*liveboard*/**", "src/prototypes/_liveboard-template/**", "src/prototypes/_shared/tiles/**", "src/prototypes/*Dashboard*/**", "src/prototypes/*dashboard*/**"]
---

# Liveboard Canvas — Core

> **Template:** `src/prototypes/_liveboard-template/` — full working reference implementation
> **Shared tile components:** `src/prototypes/_shared/tiles/` — import all tile types from here

---

## 0. When to Read This File

Read this file for ANY Liveboard work. For edit mode (drag/resize/selection), also load `liveboard-canvas-edit.md`. For groups, multi-select, or inline editing, also load `liveboard-canvas-advanced.md`.

Do NOT use `react-grid-layout`. All Liveboard prototypes use the **custom canvas** described here.

---

## 1. Canvas Engine

The canvas is a custom absolute-positioning grid. No external library. Key features:

- Tiles are absolutely positioned on a 12-column grid
- In **view mode**: tiles are static (no drag/resize); hover shows action palette
- In **edit mode**: tiles are draggable/resizable via mouse events on `document` (see `liveboard-canvas-edit.md`)
- On drop/release: position snaps to nearest grid cell, `compactLayout` runs, React state updates

---

## 2. Grid System

```typescript
const COLUMNS  = 12;
const GUTTER   = 16;   // px — gap between all tiles
const ROW_H    = 80;   // px — height of one grid row
const ROW_UNIT = 96;   // px — ROW_H + GUTTER (one row unit including its trailing gap)
const PAD      = 24;   // px — canvas padding on all sides
```

### Column unit (scales with container width)

```typescript
function colUnit(containerWidth: number): number {
  return (containerWidth - PAD * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;
}
```

Measure container with `ResizeObserver` on a `containerRef`. Cache result in a `cuRef` so event handlers always have the current value.

### Tile pixel position

```typescript
function tilePixels(item: TileItem, cu: number) {
  return {
    left:   PAD + item.x * (cu + GUTTER),
    top:    PAD + item.y * ROW_UNIT,
    width:  item.w * cu + (item.w - 1) * GUTTER,
    height: item.h * ROW_H + (item.h - 1) * GUTTER,
  };
}
```

### Canvas total height

```typescript
const maxBottom  = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
const canvasHeight = PAD + maxBottom * ROW_UNIT - GUTTER + PAD;
```

---

## 3. Tile Types and Default Sizes

| Type | Cols | Rows | Min Cols | Notes |
|------|------|------|----------|-------|
| KPI (`kpi`, `kpi-simple`) | 3 | 3 | 2 | Four fill one row |
| Answer (charts) | 6 | 3 | 2 | Two per row |
| Note | 4 | 3 | 2 | Three per row |
| Group | variable | variable | 2 | Height computed from inner tiles |

**Type definitions:**

```typescript
type TileItem = { i: string; x: number; y: number; w: number; h: number; minW: number };

type TileDef =
  | { id: string; tileType: 'answer'; title: string; description?: string; chartType: ChartType }
  | { id: string; tileType: 'note'; noteVariant: NoteVariant }
  | { id: string; tileType: 'group'; title: string; description?: string };
```

---

## 4. View Mode

### Layout
Tiles are static — no drag, no resize, no selection. The canvas renders tiles at their absolute grid positions. Column-grid alignment is enforced by `compactLayout` on initialization.

### Hover state
On tile hover in view mode, show a **1px solid `#C0C6CF`** border on the tile wrapper. This is a CSS hover rule, not JS state.

### View mode action palette
On hover, show a floating action palette at the **top-right of the tile** (8px inset).

| Tile type | Actions shown |
|-----------|--------------|
| Answer tile | Ask Spotter · Expand · More actions |
| Group tile | Ask Spotter · Expand · More actions |
| Note tile | More actions only |

**Implementation pattern (canvas level, not inside tile components):**

```tsx
// Track hovered tile in view mode
const [hoveredTile, setHoveredTile] = useState<string | null>(null);

// On tile wrapper div:
onMouseEnter={!isEdit ? () => setHoveredTile(item.i) : undefined}
onMouseLeave={!isEdit ? () => setHoveredTile(null) : undefined}

// Action palette overlay (inside the tile wrapper div):
{!isEdit && hoveredTile === item.i && (
  <div style={{
    position: 'absolute', top: 8, right: 8,
    display: 'flex', alignItems: 'center', gap: 4,
    zIndex: 5, pointerEvents: 'auto',
  }}>
    {def.tileType !== 'note' && (
      <>
        <button style={viewActionBtnStyle} title="Ask Spotter" onClick={...}><IconSpotter /></button>
        <button style={viewActionBtnStyle} title="Expand" onClick={...}><IconExpand /></button>
      </>
    )}
    <button style={viewActionBtnStyle} title="More actions" onClick={...}><IconMore /></button>
  </div>
)}
```

Action button style: `28x28px`, white background, `1px solid #EAEDF2` border, `border-radius: 6px`, icon color `#1D232F`.

In the template, these callbacks can be no-ops (`() => {}`) or `console.log` stubs — prototypes do not need working action implementations.

---

## 5. Chart Color Palette

Import from `src/prototypes/_shared/tiles/chartPalette.ts`. Do NOT use raw hex values.

```typescript
import { chartColors, chartPalette, chartUi, chartFont, chartFontSize } from '../_shared/tiles/chartPalette';

// Sequential series: chartColors[0], chartColors[1], ...
// Order: blue -> amber -> cyan -> salmon -> purple -> red -> grey -> green
export const chartPalette = {
  blue:   '#004B9B',
  amber:  '#FFA600',
  cyan:   '#369FAA',
  salmon: '#EB7D57',
  purple: '#7D51F0',
  red:    '#D3341D',
  grey:   '#555555',
  green:  '#006A13',
};

// Chart UI (axis, grid, labels) — maps to Radiant system tokens
export const chartUi = {
  axis:       '#EAEDF2',  // border-divider
  gridLine:   '#F6F8FA',  // background-sunken
  labelColor: '#777E8B',  // content-secondary
  valueColor: '#1D232F',  // content-primary
};
```

**No runtime color picker** — chart colors are always assigned sequentially from `chartColors[]`.

---

## 6. Using `_shared/tiles`

All shared tile components live in `src/prototypes/_shared/tiles/`. Import from the index:

```typescript
import {
  AnswerTile, NoteTile, GroupTile,
  ChartType, TileMode, NoteVariant,
  GroupInnerTile, INNER_ROW_H, groupBodyHeight,
  NOTE_VARIATIONS,
  chartColors, chartPalette, chartUi,
} from '../_shared/tiles';
```

### AnswerTile props (key ones for canvas use)
| Prop | Type | Purpose |
|------|------|---------|
| `chartType` | `ChartType` | Which chart to render |
| `title` | `string` | Tile title |
| `description` | `string?` | Subtitle |
| `mode` | `'view'\|'edit'` | Controls chrome |
| `selected` | `boolean` | Shows resize handles + toolbar |
| `onSelect` | `() => void` | Called on click in edit mode |
| `onResizeHandleMouseDown` | `(dir, e) => void` | Initiates resize |
| `onChartTypeChange` | `(type) => void` | From chart type picker |
| `onDuplicate` | `() => void` | Duplicate action |
| `onDelete` | `() => void` | Delete action |
| `onTitleChange` | `(title) => void` | Inline edit commit |
| `onDescriptionChange` | `(desc) => void` | Inline edit commit |

### NoteTile props
Same selection/resize/toolbar props as AnswerTile, but no `chartType` — takes `content: NoteContent` instead.
Use `NOTE_VARIATIONS[noteVariant]` to get pre-built content.

### GroupTile props
Same selection/resize props, plus `groupId`, `innerTiles: GroupInnerTile[]`, `onInnerTileSelect`, `onInnerLayoutChange`, `onUngroup`, etc.

### Adding a new tile type

1. Add the tile type variant to `TileDef` union
2. Add default size constants
3. Render the new tile in the canvas render map (the `layout.map(...)` section)
4. Pass `mode`, `selected`, `onSelect`, `onResizeHandleMouseDown` (same as other tiles)
5. Add toolbar contents for edit mode (inside the tile component or as a prop)
6. Add view mode action palette logic (same `hoveredTile` pattern)
7. Add delete/duplicate handlers
8. Document default size in the tile types table above

---

## 7. Template Reference

The `_liveboard-template/` demonstrates all of the above with this layout:

```
Row 1 (y=0): 4 KPI tiles       — kpi-simple x 4, each 3 cols x 3 rows
Row 2 (y=3): 2 chart tiles      — line chart (6x3) + bar chart (6x3)
Row 3 (y=6): note + group       — note tile (4x4) + group tile (8x4)
                                    group contains: donut chart + table chart (inner)
```

Use `npm run new-prototype MyDashboard -- --liveboard` to scaffold from this template.
Replace `TILE_DEFS`, `INITIAL_LAYOUT`, and `INITIAL_GROUP_LAYOUTS` with your prototype's data.
