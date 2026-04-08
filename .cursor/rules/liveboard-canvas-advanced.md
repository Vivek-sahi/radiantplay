---
description: Advanced canvas features — group tiles, multi-select, inline title/description editing. Load only when the prototype needs groups, multi-select, or inline editing.
globs: ["src/prototypes/*Liveboard*/**", "src/prototypes/*liveboard*/**", "src/prototypes/_liveboard-template/**", "src/prototypes/_shared/tiles/**", "src/prototypes/*Dashboard*/**", "src/prototypes/*dashboard*/**"]
---

# Liveboard Canvas — Advanced Features

> **Prerequisites:** `liveboard-canvas-core.md` + `liveboard-canvas-edit.md` must also be loaded.

---

## 1. Multi-Select (Shift+Click)

Track Shift key with a `shiftRef` (keydown/keyup on `window`).

```typescript
const shiftRef = useRef(false);
useEffect(() => {
  const dn = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftRef.current = true; };
  const up = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftRef.current = false; };
  window.addEventListener('keydown', dn);
  window.addEventListener('keyup',   up);
  return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
}, []);
```

State: `selectedTiles: string[]` — empty = none, length 1 = single, length 2+ = multi.

Multi-select chrome on the WRAPPER div (not inside tile component):
- `outline: '2px dashed #7B61FF'`
- `outlineOffset: '1px'`
- `borderRadius: 16`
- `background: 'rgba(123,97,255,0.04)'`

Pass `selected={false}` to the tile component when multi-select is active — individual tile chrome is hidden; wrapper outline handles the visual.

### Multi-select toolbar
Appears at `top: -48px` of the **last shift-clicked tile** (`lastShiftTileRef`). Actions: **Group** and **Delete**.

---

## 2. Group Tile

### Structure

```
GroupTile
  Header (drag handle — title + description; text fields are NOT drag handles)
  Body (mini-liveboard with absolute-positioned inner tiles)
```

### Header spacing
`pt: 8px, px: 8px, pb: 4px`. Inner text padding `4px`. Title: `16px/600/24px lh/-0.4px tracking`. Description: `14px/375/20px lh`.

### Inner grid (same 12-column system)
```typescript
const G_PAD    = 8;   // body sides + bottom
const G_PAD_I  = 4;   // body top
const G_GUTTER = 8;   // inner gap
const G_COLS   = 12;  // inner columns

innerColUnit = (bodyWidth - 2*8 - 11*8) / 12
innerRowH    = max(40, (bodyH - 4 - 8 - (rows-1)*8) / rows)   // scales proportionally
```

Group height is **user-controlled** (resize from edit mode). Inner tiles scale proportionally when group is resized.

### Ungroup
Each inner tile becomes a top-level tile:
```typescript
mainX = Math.max(0, Math.min(COLUMNS - mainW, group.x + Math.round(inner.x * group.w / 12)));
mainW = Math.max(2, Math.round(inner.w * group.w / 12));
mainY = group.y + inner.y;
mainH = Math.max(1, inner.h);
```
Run `compactLayout` after ungrouping.

### Group from multi-select
Compute bounding box of selected tiles -> create group at bounding box position:
```typescript
innerX = Math.max(0, Math.round((tile.x - minX) / groupW * 12));
innerW = Math.max(1, Math.round(tile.w / groupW * 12));
innerY = tile.y - minY;
innerH = tile.h;
```

---

## 3. Inline Title/Description Editing (Edit Mode)

Both `AnswerTile` and `GroupTile` render title/description as `<input>` fields in edit mode.

- Title height: `28px` (`padding: 2px 4px`, `line-height: 24px`)
- Description height: `20px` (`padding: 0 4px`, `line-height: 20px`)
- **Hover**: `1px solid #C0C6CF` border on the WRAPPER div (not the `<input>`)
- **Focus**: `1px solid #2770EF` border on wrapper
- `Enter` -> commit; `Escape` -> revert; `blur` -> commit
- Use `onPointerEnter/Leave` on wrapper (more reliable than `onMouseEnter/Leave` on inputs)
- Wrapper `onClick` -> `e.stopPropagation()` + `onSelect?.()` + `inputRef.current?.focus()`
- Title/desc wrapper is **NOT a drag handle** — clicking it must not initiate drag
