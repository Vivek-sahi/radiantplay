---
description: Component map for Liveboard prototypes — what components exist and when to use them. For full IA tree and scaffolding, see liveboard-scaffolding.md.
alwaysApply: false
---

# Liveboard Component Reference

> For building a new Liveboard from scratch (IA tree, mode templates, scaffolding commands), see `liveboard-scaffolding.md`.

---

## Before You Start

All Liveboard prototypes MUST use `GlobalHeader` from `@components/GlobalHeader`. Do NOT build a custom header.

When a Figma link or screenshot is provided, use the scaffolding as the **structural foundation** but drive the **visual output** from the reference. The scaffold is for structure; the reference is for look and feel.

Use `npm run new-prototype MyDashboard -- --liveboard` to scaffold from the template. The template includes: full custom canvas, LiveboardHeader, all three tile types (Answer, Note, Group), view mode hover palette, edit mode drag/resize/selection, multi-select, SpotterViz panel, and sample dashboard layout.

**Reference:** `src/prototypes/Liveboard/` for a working example.

### Canvas Engine

All Liveboard prototypes use a **custom absolute-positioning canvas** (not `react-grid-layout`). Canvas spec is split into tiers — load only what's needed:
- **`liveboard-canvas-core.md`** — grid system, tile types, view mode (always load)
- **`liveboard-canvas-edit.md`** — drag, resize, selection, toolbars (if edit mode needed)
- **`liveboard-canvas-advanced.md`** — groups, multi-select, inline editing (if needed)

Key canvas features:
- 12-column grid system with pixel-accurate drag and resize
- View mode hover action palette (Ask Spotter / Expand / More actions per tile type)
- Edit mode: drag, resize, selection chrome, multi-select, group/ungroup
- Tile types: AnswerTile, NoteTile, GroupTile — all from `src/prototypes/_shared/tiles/`
- Chart color palette from `src/prototypes/_shared/tiles/chartPalette.ts`

---

## Component Inventory

### Global Radiant Components (import from `@/components/`)

| Component | Use in Liveboard |
|-----------|-----------------|
| `GlobalHeader` | ThoughtSpot primary nav bar |
| `Button` | Save, Cancel, toolbar actions |
| `Tabs` | Liveboard tabs, tab switching |
| `Table` | Data tables within Answer tiles |
| `Typography` | All text content |
| `Modal` | Add filter modal, add parameter modal |
| `Menu` | 3-dot menu, Add dropdown, Personalised View menu |
| `Tooltip` | Hover hints on toolbar icons |
| `Chip` | Filter chips, tag display |
| `Icon` | All iconography (use `isValidIconName()`) |
| `SearchInput` | Answer search in Add flow |
| `TextInput` | Rename, edit fields |
| `TextArea` | Note tile rich text editing |
| `Select` | Filter value selection, view selection |
| `Alert` | Save confirmation, error states |
| `Toast` | Action feedback (saved, deleted) |
| `LoadingIndicator` | Loading states for tiles, AI responses |
| `Popover` | Personalised view dropdown, filter popover |
| `Accordion` | Styling panel sections |
| `Pagination` | Large data tables within tiles |
| `LiveboardHeader` | Complete header — PrimaryNav + ViewHeader (view) or EditToolbar + EditSubHeader (edit) |

### Dependencies

| Package | Use |
|---------|-----|
| `echarts` + `echarts-for-react` | Chart rendering for AnswerTile (12 chart types) |

### Available in Shared Tiles (`src/prototypes/_shared/tiles/`) — Use in All Liveboard Prototypes

Import from `'../_shared/tiles'` (relative from any sibling prototype folder).

| Component | Description |
|-----------|-------------|
| `AnswerTile` | Chart tile with inline title/desc editing, 8-handle resize, floating toolbar, chart type picker. Supports all 12 chart types. |
| `NoteTile` | Rich text tile with selection chrome and toolbar (Edit / Duplicate / Delete). |
| `GroupTile` | Container tile with inner 12-col grid, drag/resize of inner tiles, ungroup behavior. |
| `ChartRenderer` | Renders any chart type from `chartPalette`. Used inside AnswerTile. |
| `chartColors`, `chartPalette`, `chartUi` | Standard chart color palette — always use these, never hard-code hex. |
| `NOTE_VARIATIONS` | Pre-built note content for 5 variants: `weekly-update`, `key-metrics`, `announcement`, `q3-recap`, `quick`. |

### Liveboard-specific Components (reuse across variants)

| Component | Location | Status |
|-----------|----------|--------|
| `Header` | `Liveboard/components/` | Built |
| `FilterBar` | `Liveboard/components/` | Built |
| `KPICard` | `Liveboard/components/` | Built |
| `AreaChart` | `Liveboard/components/` | Built |
| `DonutChart` | `Liveboard/components/` | Built |
| `StackedBarChart` | `Liveboard/components/` | Built |
| `USMapChart` | `Liveboard/components/` | Built |
| `StylingPanel` | `Liveboard/components/` | Built |
| `NavigationSidebar` | `Liveboard/components/` | Built |
| `OptionButtonGroup` | `Liveboard/components/` | Built |

### Shared Liveboard Components

| Component | Location | Description |
|-----------|----------|-------------|
| `LiveboardHeader` | `src/components/LiveboardHeader/` | Unified header for both modes |
| `EditToolbar` | Inside LiveboardHeader | Dark toolbar for edit mode |
| `EditSubHeader` | Inside LiveboardHeader | Edit mode header with editable name |
| `AnswerTile` | `_shared/tiles/` | Chart tile with mode-aware hover toolbar, 12 chart types |
| `NoteTile` | `_shared/tiles/` | Rich text tile with formatting support |
| `GroupTile` | `_shared/tiles/` | Container tile with inner 12-col grid |
| `TileHoverActions` | Built into AnswerTile | Hover overlay with contextual actions |

### Planned (not yet built)

> **Built:** `AnswerTile`, `NoteTile`, `GroupTile`, and `FloatingToolbar` are all implemented in `src/prototypes/_shared/tiles/`. See the shared tiles section above.

> Create locally in `src/prototypes/<Name>/components/` when needed.

| Component | Priority | Description |
|-----------|----------|-------------|
| `InsightTile` | High | AI-generated summary tile with content templates |
| `SpotterVizPanel` | Medium | AI chat side panel with prompt bar and response display |
| `PersonalisedViewMenu` | Medium | Dropdown for Select/Save/Manage views, Reset Liveboard |
| `AddMenu` | Medium | Dropdown for adding Answer, Note, Filter, Parameter, Tab |
| `FilterModal` | Medium | Modal for adding/editing filters |
| `ParameterModal` | Medium | Modal for adding/editing parameters |
