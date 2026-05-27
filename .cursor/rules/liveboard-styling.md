---
description: Complete specification for the Liveboard Styling Panel — density system, color themes, CSS variables, tile override model, drawer states, and integration guide. Read this file when a user asks to add a styling panel to a Liveboard's edit mode.
globs: ["src/prototypes/StylingPanel/**", "src/prototypes/*Liveboard*/**", "src/prototypes/*liveboard*/**"]
---

# Liveboard Styling Panel — Complete Specification

> **Reference implementation:** `src/prototypes/StylingPanel/`
> **Canvas:** `src/prototypes/StylingPanel/StylingPanel.tsx`
> **Drawer:** `src/prototypes/StylingPanel/components/StylingPanelDrawer.tsx`
> **Shared tiles:** `src/prototypes/_shared/tiles/`

---

## 0. When to Read This File

Read this file when a user asks to **add a styling panel to a Liveboard's edit mode** — for example:

- "Add a Style button to the edit toolbar" ← most common trigger
- "Add a styling panel to the edit mode"
- "Add a style drawer when a tile is selected"
- "Let users control density / color theme / tile highlights"
- "Let users change corner style or spacing mode"
- Any request involving per-tile color overrides, highlight toggles, or dark palette on a Liveboard

The **Style button** lives in the edit toolbar (top of the page, right side). Clicking it opens the `StylingPanelDrawer` — a 336px fixed panel that slides in from the right. The button toggles the drawer open/closed.

Do NOT read this file for general Liveboard canvas questions — use `liveboard-canvas.md` or `liveboard-tiles-rules.md` instead.

---

## 1. What the Styling Panel Is

The Styling Panel is a **fixed right-side drawer** that slides in during Liveboard edit mode. It has two states:

- **Nothing selected (canvas clicked):** Shows Liveboard-level controls — color theme, density, corner style, spacing mode, plus global defaults for groups and tiles.
- **Tile selected:** Shows per-tile overrides for that tile type, with a linked/unlinked toggle that controls whether the tile inherits liveboard defaults or has custom properties.

The drawer width is **336px**, positioned `top: 60px` (below the edit sub-header), `right: 0`.

---

## 2. State Shape

### StylingSettings (liveboard-level)

```ts
interface StylingSettings {
  color: string;                          // theme key — one of 8 values
  density: 'compact' | 'medium' | 'spacious';
  cornerStyle: 'rounded' | 'sharp';
  spacing: 'guttered' | 'no-gutter';
  groupTitle: boolean;                    // show group tile title by default
  groupDescription: boolean;             // show group tile description by default
  groupTileDescription: boolean;         // show inner tile descriptions inside groups
  tileDescription: boolean;              // show answer tile description by default
  kpiDescription: boolean;
  kpiView: string;                        // 'default-all' | 'compact' | etc.
  kpiSize: string;                        // 'S' | 'M' | 'L'
  noteRemovePadding: boolean;
  noteRemoveBackground: boolean;
}
```

**Default values:**
```ts
{
  color: 'gray', density: 'medium', cornerStyle: 'rounded', spacing: 'guttered',
  groupTitle: true, groupDescription: true, groupTileDescription: false, tileDescription: false,
  kpiDescription: false, kpiView: 'default-all', kpiSize: 'M',
  noteRemovePadding: false, noteRemoveBackground: false,
}
```

### TileOverride (per-tile)

```ts
interface TileOverride {
  linked: boolean;           // true = inherit liveboard defaults
  description?: boolean;
  highlight?: boolean;       // always per-tile — visible in both linked and unlinked states
  color?: string;            // hex — tile background override
  kpiView?: string;
  kpiSize?: string;
  kpiColor?: string;
  groupTitle?: boolean;
  groupDescription?: boolean;
  groupTileDescription?: boolean;
  groupColor?: string;
  removePadding?: boolean;
  removeBackground?: boolean;
}
```

Store as `Record<string, TileOverride>` keyed by tile ID. Start all tiles with `{ linked: true }`.

### SelectedTileType

```ts
type SelectedTileType = 'answer' | 'kpi' | 'note' | 'group' | 'answer-in-group' | null;
```

`null` = canvas selected (no tile). Determines which drawer state to show.

---

## 3. Density System

Three levels: **Compact / Medium / Spacious** (labelled in UI as Compact / Regular / Loose).

| Property | Compact | Medium | Spacious |
|---|---|---|---|
| Inner content padding (`--tile-content-padding`) | 0px | 4px | 8px |
| Header→chart gap (same var) | 0px | 4px | 8px |
| Corner radius (rounded mode) | 12px | 16px | 20px |
| Corner radius (sharp mode) | 0px | 0px | 0px |
| Group header textBlock padding | 0px | 4px | 8px |
| Group inner tile gutter | 4px | 8px | 8px |
| Group header divider | hidden | visible | visible |
| Tile title size | 16px | 16px | 18px |
| Tile title weight | 400 | 600 | 600 |
| Tile title line-height | 24px | 24px | 28px |
| KPI value weight | 400 | 500 | 500 |
| Toolbar button size | 24px | 24px | 32px |

### Constants

```ts
const CORNER_RADIUS:   Record<string, number> = { spacious: 20, medium: 16, compact: 12 };
const DENSITY_PADDING: Record<string, number> = { compact: 0,  medium: 4,  spacious: 8  };
const GROUP_GUTTER:    Record<string, number> = { compact: 4,  medium: 8,  spacious: 8  };
```

### CSS variables set on the canvas container element

```ts
'--tile-title-size':       density === 'spacious' ? '18px' : '16px'
'--tile-title-weight':     density === 'compact'  ? '400'  : '600'
'--tile-title-lh':         density === 'spacious' ? '28px' : '24px'
'--tile-toolbar-btn-size': density === 'spacious' ? '32px' : '24px'
'--tile-kpi-weight':       density === 'compact'  ? '400'  : '500'
```

---

## 4. Color Themes

Eight themes: **gray, purple, blue, teal, green, yellow, orange, red**

### Canvas background (`LIVEBOARD_BG`)

```ts
const LIVEBOARD_BG = {
  gray:   '#F6F8FA', purple: '#F0EBFF', blue:   '#DEE8FA', teal:   '#E1F7FA',
  green:  '#E0F8EF', yellow: '#FFF8E5', orange: '#FFEEE5', red:    '#FFEBEC',
};
```

### Tile border color (`TILE_BORDER`)

Used for `--rd-sys-color-border-divider`, `--tile-outer-border-color`, and `--group-header-divider`.

```ts
const TILE_BORDER = {
  gray:   '#EAEDF2', purple: '#D1C0FB', blue:   '#ABC7F9', teal:   '#B5ECF2',
  green:  '#9BE5CB', yellow: '#FDE9AF', orange: '#FFCCB3', red:    '#F9B3B9',
};
```

### Highlight colors (`HIGHLIGHT_COLORS`) — applied when a tile is highlighted

```ts
const HIGHLIGHT_COLORS = {
  gray:   { bg: '#323946', border: '#4A515E' },
  purple: { bg: '#422E75', border: '#6A4ABA' },
  blue:   { bg: '#163772', border: '#2359B6' },
  teal:   { bg: '#22636B', border: '#369FAA' },
  green:  { bg: '#005D39', border: '#049160' },
  yellow: { bg: '#785F1A', border: '#BF982A' },
  orange: { bg: '#7A3D1F', border: '#C26232' },
  red:    { bg: '#721F27', border: '#B6313E' },
};
```

### Dark swatches (`TILE_SWATCHES_DARK`) — tile colors that trigger inverted/dark content

```ts
const TILE_SWATCHES_DARK = [
  '#323946', '#422E75', '#163772', '#22636B',
  '#005D39', '#785F1A', '#7A3D1F', '#721F27',
];
```

---

## 5. CSS Variable System

These variables are set on the **canvas container element** (`style={{ ... }}`). All tile components read them via CSS fallback chains.

| Variable | Set when | Effect |
|---|---|---|
| `--rd-sys-color-border-divider` | Always | Overrides the global token with the theme's tile border color |
| `--tile-outer-border-color` | Always | Tile border color; `transparent` in no-gutter mode |
| `--group-header-divider` | Always | Group tile header bottom border; `transparent` in no-gutter mode |
| `--tile-title-size` | Always | Title font size from density |
| `--tile-title-weight` | Always | Title font weight from density |
| `--tile-title-lh` | Always | Title line-height from density |
| `--tile-toolbar-btn-size` | Always | Toolbar icon button size from density |
| `--tile-kpi-weight` | Always | KPI value font weight from density |
| `--tile-content-padding` | Per tile (inline) | Set on each tile via `densityPadding` prop |
| `--tile-box-shadow` | Per tile (optional) | Reserved for elevation effects |

### Setting them in JSX

```tsx
<div
  ref={containerRef}
  style={{
    position: 'relative', height: canvasH,
    '--rd-sys-color-border-divider': TILE_BORDER[color] ?? '#EAEDF2',
    '--tile-outer-border-color':     spacing === 'no-gutter' ? 'transparent' : (TILE_BORDER[color] ?? '#EAEDF2'),
    '--group-header-divider':        spacing === 'no-gutter' ? 'transparent' : (TILE_BORDER[color] ?? '#EAEDF2'),
    '--tile-title-size':             density === 'spacious' ? '18px' : '16px',
    '--tile-title-weight':           density === 'compact'  ? '400' : '600',
    '--tile-title-lh':               density === 'spacious' ? '28px' : '24px',
    '--tile-toolbar-btn-size':       density === 'spacious' ? '32px' : '24px',
    '--tile-kpi-weight':             density === 'compact'  ? '400' : '500',
  } as React.CSSProperties}
>
```

### Dark/inverted tile overrides

When a tile is inverted (highlighted OR dark color selected), set these on the **tile element** itself:

```ts
const invertedVars = {
  '--rd-sys-color-content-primary':   '#DBDFE7',
  '--rd-sys-color-content-secondary': '#A5ACB9',
  '--rd-sys-color-border-divider':    'rgba(255,255,255,0.12)',
  '--rd-sys-color-background-sunken': 'rgba(0,0,0,0.2)',
  '--rd-sys-color-content-brand':     '#71A1F4',
  // NoteTile only — also override background-base to prevent white bleed:
  '--rd-sys-color-background-base':   resolvedBg ?? '#323946',
};
```

---

## 6. Spacing Modes

### Guttered (default)

- Canvas BG: `LIVEBOARD_BG[color]`
- Tile outer border: `TILE_BORDER[color]` via `--tile-outer-border-color`
- Group header divider: visible

### No-gutter (continuous)

- Canvas BG: `#FFFFFF`
- Tile outer border: `transparent` via `--tile-outer-border-color: transparent`
- Group header divider: `transparent`
- **Canvas separator lines**: 1px `#DBDFE7` lines rendered directly on the canvas (NOT on tiles)
  - Draw where tiles exist on BOTH sides of a column/row boundary
  - Left and right canvas edge lines always drawn
  - Segments that start at `y=0` use `top: 0` (connects to header)

#### Separator line formula

```ts
// Vertical segment at column break x, spanning rows [y0, y1)
left:   PAD + x * (cu + GUTTER) - GUTTER / 2
top:    y0 === 0 ? 0 : PAD + y0 * ROW_UNIT - GUTTER / 2
height: (PAD + y1 * ROW_UNIT - GUTTER / 2) - top

// Horizontal segment at row break y, spanning columns [x0, x1)
top:   PAD + y * ROW_UNIT - GUTTER / 2
left:  PAD + x0 * (cu + GUTTER) - GUTTER / 2
width: (x1 - x0) * (cu + GUTTER)
```

Only draw a separator where tiles exist on BOTH sides (intersection of row/column intervals from the layout).

---

## 7. Effective Settings Logic

How to resolve the value that actually renders for each tile property:

```ts
const linked = !override || override.linked;

effectiveShowDesc        = linked ? settings.tileDescription    : (override.description ?? false)
effectiveHighlight       = override?.highlight ?? false           // NO linked gate — always per-tile
effectiveBorderRadius    = cornerStyle === 'sharp' ? 0 : CORNER_RADIUS[density]
effectiveGroupTitle      = linked ? settings.groupTitle          : (override.groupTitle ?? true)
effectiveGroupDesc       = linked ? settings.groupDescription    : (override.groupDescription ?? false)
effectiveGroupTileDesc   = linked ? settings.groupTileDescription: (override.groupTileDescription ?? false)
effectiveGroupDivider    = density !== 'compact'                  // never visible in compact
effectiveRemoveBg        = !linked && (override.removeBackground ?? false)

// Tile color
committedColor     = (!linked && override?.color) ? override.color : '#FFFFFF'
isDarkColor        = TILE_SWATCHES_DARK.includes(committedColor)
isInverted         = effectiveHighlight || isDarkColor
highlightColors    = effectiveHighlight ? HIGHLIGHT_COLORS[color] : null
resolvedBg         = highlightColors?.bg ?? (committedColor !== '#FFFFFF' ? committedColor : undefined)
```

### Group tile unlink — seed with current values

When unlinking a group tile, seed the override with current liveboard values to avoid visible resets:

```ts
onUnlink = () => onChange({
  linked: false,
  groupTitle: settings.groupTitle,
  groupDescription: settings.groupDescription,
  groupTileDescription: settings.groupTileDescription,
})
```

---

## 8. Drawer Panel States

What the `StylingPanelDrawer` shows based on `selectedTileType`:

| `selectedTileType` | Drawer shows |
|---|---|
| `null` (canvas) | Liveboard color, density, corner style, spacing; Group defaults (title/desc/tile-desc); Tile defaults (description) |
| `'answer'` | Highlight toggle; linked/unlinked toggle with description + color picker when unlinked |
| `'kpi'` | Highlight toggle; linked/unlinked toggle with description + tile color + KPI view/size/color when unlinked |
| `'note'` | Linked/unlinked toggle; unlinked: highlight, remove padding, remove background |
| `'group'` | Linked/unlinked toggle; unlinked: group title, group description, inner tile description |
| `'answer-in-group'` | Highlight toggle; linked to GROUP (not liveboard); unlinked: description + color |

### Key rules

- **Highlight toggle** is always visible for `answer`, `kpi`, and `answer-in-group` — it is NOT gated by the linked/unlinked state
- **Group tiles** unlink seeds from liveboard values (see section 7)
- **Inner tiles** (`answer-in-group`) link to the parent group, not the liveboard

---

## 9. GroupTile Density Props

The `GroupTile` component accepts these props for the styling system — pass them from the canvas:

```tsx
<GroupTile
  groupId={item.i}
  title={effectiveGroupTitle ? def.title : ''}
  description={effectiveGroupDesc ? def.description : undefined}
  showDivider={effectiveGroupDivider}       // false in compact mode
  densityPadding={densityPadding}           // 0/4/8 from DENSITY_PADDING
  innerTileShowDescription={effectiveGroupTileDesc}
  innerTileDensityPadding={densityPadding}
  innerTileGutter={groupGutter}             // 4/8/8 from GROUP_GUTTER
  innerTileOverrides={...}                  // Record<tileId, { highlighted, dark, resolvedBg }>
  onInnerPreviewTileColor={...}
  {...commonProps}
/>
```

### innerTileOverrides shape

```ts
innerTileOverrides = Object.fromEntries(
  groupLayout.map(inner => {
    const ov = tileOverrides[inner.i];
    const innerHighlight  = ov?.highlight ?? false;
    const committedColor  = (!ov?.linked && ov?.color) ? ov.color : undefined;
    const innerIsDark     = innerHighlight || (innerColor ? TILE_SWATCHES_DARK.includes(innerColor) : false);
    const innerHighlightColors = innerHighlight ? HIGHLIGHT_COLORS[settings.color] : null;
    const innerResolvedBg = innerHighlightColors ? innerHighlightColors.bg : innerColor;
    return [inner.i, { highlighted: innerHighlight, dark: innerIsDark, resolvedBg: innerResolvedBg }];
  })
);
```

---

## 10. Integration Guide — Adding to a Liveboard

To add the StylingPanel to an existing Liveboard prototype:

### 1. Import the drawer

```ts
import { StylingPanelDrawer, StylingSettings, SelectedTileType, TileOverride } from '../StylingPanel/components/StylingPanelDrawer';
```

### 2. Add state

```ts
const [stylingOpen,     setStylingOpen]     = useState(false);
const [stylingSettings, setStylingSettings] = useState<StylingSettings>({
  color: 'gray', density: 'medium', cornerStyle: 'rounded', spacing: 'guttered',
  groupTitle: true, groupDescription: true, groupTileDescription: false, tileDescription: false,
  kpiDescription: false, kpiView: 'default-all', kpiSize: 'M',
  noteRemovePadding: false, noteRemoveBackground: false,
});
const [tileOverrides, setTileOverrides]     = useState<Record<string, TileOverride>>({});
const [previewLiveboardColor, setPreviewLiveboardColor] = useState<string | null>(null);
const [previewTileColor, setPreviewTileColor]           = useState<string | null>(null);
```

### 3. Derive `selectedTileType`

```ts
const selectedTileType: SelectedTileType = selectedTile
  ? (tileDefs.find(d => d.id === selectedTile)?.tileType ?? null)
  : null;
```

### 4. Add a "Style" button to the edit toolbar

```tsx
{isEdit && (
  <Button variant="secondary" onClick={() => setStylingOpen(v => !v)}>
    Style
  </Button>
)}
```

### 5. Set CSS variables on the canvas container

See section 5 — pass all vars as inline style on the canvas `<div>`.

### 6. Pass `densityPadding` and color vars down to each tile

```tsx
const densityPadding = DENSITY_PADDING[stylingSettings.density] ?? 4;
// Pass to AnswerTile, NoteTile, GroupTile via their respective props
```

### 7. Render the drawer

```tsx
<StylingPanelDrawer
  isOpen={stylingOpen}
  onClose={() => setStylingOpen(false)}
  selectedTileId={selectedTile}
  selectedTileType={selectedTileType}
  tileOverrides={tileOverrides}
  onTileOverrideChange={(id, p) => setTileOverrides(prev => ({
    ...prev, [id]: { ...(prev[id] ?? { linked: true }), ...p }
  }))}
  settings={stylingSettings}
  onSettingsChange={s => setStylingSettings(prev => ({ ...prev, ...s }))}
  onPreviewLiveboardColor={setPreviewLiveboardColor}
  onPreviewTileColor={setPreviewTileColor}
  onPreviewInnerTileColor={() => {}}
/>
```

### 8. Adjust canvas right margin when drawer is open

```tsx
<div style={{ marginRight: stylingOpen ? 336 : 0, transition: 'margin-right 250ms ease' }}>
  {/* canvas */}
</div>
```
