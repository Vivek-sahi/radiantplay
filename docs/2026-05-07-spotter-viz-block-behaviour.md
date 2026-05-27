# Spotter VizBlock behaviour (2026-05-07)

How `VizBlock` is built, how the slot model works, and how to modify it
later. Lives at `src/spotter/chat/blocks/VizBlock.tsx`.

**Source:** Figma `RzKUZMdJsNVdoVhkYmXvlI`, node `146:37670`.

## Anatomy

```
┌─ VizBlock ──────────────────────────────────────────────────┐
│  Title (bold heading, optional)                             │
│  ┌─ card ────────────────────────────────────────────────┐  │
│  │  ┌─ header ────────────────────────────────────────┐  │  │
│  │  │ [token][token][token][token]   [📊 ▥] [⤢ exp]   │  │  │
│  │  │   wraps to multi-row             toggle  expand │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─ body ──────────────────────────────────────────┐  │  │
│  │  │                                                 │  │  │
│  │  │   SLOT  (chart / iframe / data sketch / ph.)    │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─ footer ────────────────────────────────────────┐  │  │
│  │  │ 📌 Pin  💾 Save  ⬇ Download  ✏ Edit  +Add to..│  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Schema (`src/spotter/runtime/schema.ts`)

```ts
export interface VizBlockData {
  kind: 'viz';
  id: string;
  title?: string;                  // bold heading above the card
  tokens: VizToken[];              // search-token chips in the header
  source: VizSource;               // what fills the slot
  tableData?: VizTableData;        // optional, used by the table view
}

export type VizSource =
  | { type: 'iframe'; url: string; sandbox?: string; title?: string }
  | { type: 'data'; chartKind: VizChartKind; data: VizData }
  | { type: 'placeholder'; message?: string };
```

`VizSource` is a discriminated union. Future chart engines can add new
`type` values (e.g. `vegaSpec`, `plotlyFigure`) without changing the
component API — add a case to the slot dispatcher.

## Slot model — priority order

The chart-area slot resolves in this order. **First match wins**.

1. **`chartSlot` prop** (React node) — passed by the prototype. Use this
   when the consumer has a chart instance to embed directly.
2. **`source.type === 'iframe'`** — render an `<iframe>` with the URL.
3. **`source.type === 'data'`** — render the built-in SVG sketch from the
   inline data + a side legend. This is the canned-mode default.
4. **`source.type === 'placeholder'`** — show the placeholder message.

This means the consumer always wins. The wire format (data / iframe /
placeholder) is the fallback when no consumer override is provided.

### Adding a new chart engine

To support a new engine, e.g. Muze:

1. Add a new union arm to `VizSource` in `schema.ts`:
   ```ts
   | { type: 'muze'; spec: MuzeSpec; data: unknown[] }
   ```
2. Add a case to the slot dispatcher in `VizBlock.tsx` (the `Slot`
   component). It mirrors the existing `iframe` and `data` branches.
3. Update the canned fixture at `src/spotter/runtime/cannedResponses.ts`
   if you want to test in canned mode.

The system prompt at `src/spotter/runtime/systemPrompt.ts` may also need
updating so live responses can produce the new source type.

## Header

### Tokens

`block.tokens: VizToken[]` renders as colored chips with `flex-wrap`.

| Token kind  | Background colour                       | Optional icon       |
| ----------- | --------------------------------------- | ------------------- |
| `measure`   | `background-success` (green)            | none                |
| `keyword`   | `background-information` (blue)         | none                |
| `filter`    | `background-subtle` (gray)              | `funnel` (leading)  |
| `formula`   | `background-subtle` (gray)              | none (extend later) |

To add a new token kind, extend `VizTokenKind` in the schema and add a
`[data-kind='...']` rule in `VizBlock.module.css`.

### Header actions

- **Chart/Table toggle** (segmented control). Visual-only by default.
  When `tableData` is provided, toggling to "table" shows a real
  `<table>`. Otherwise the chart view stays.
- **Expand button** (`fullscreen` icon). Default behavior opens an
  internal fullscreen modal showing the same slot content. Override
  with the `onExpand` prop.

The toggle is **uncontrolled by default** — `VizBlock` keeps its own
`view` state. Pass `view` + `onViewChange` to control it externally.

## Body

```
┌─ cardBody ────────────────────────────────┐
│ ┌─ slot ──────────────────────┐ ┌ legend ┐│
│ │  [chart / iframe / sketch]  │ │ ● Bags ││
│ │                             │ │ ● Dr.. ││
│ └─────────────────────────────┘ └────────┘│
└───────────────────────────────────────────┘
```

The legend renders only when `source.type === 'data'` and the body is in
chart view. iframe / placeholder modes hide the legend (the embedded
chart renders its own legend).

## Footer — defaults + overrides

Default actions (left → right):

| Slot       | Action            | Icon       | Style       |
| ---------- | ----------------- | ---------- | ----------- |
| Left       | Pin               | `pin`      | secondary   |
| Left       | Save              | `save`     | secondary   |
| Left       | Download          | `download` | secondary   |
| Left       | Edit              | `pencil`   | secondary   |
| Right      | Add to coaching   | `plus`     | brand-blue  |

### Customizing the footer

Three patterns:

```tsx
// 1. Default footer with handlers wired
<VizBlock
  block={block}
  onPin={...}
  onSave={...}
  onDownload={...}
  onEdit={...}
  onAddToCoaching={...}
/>

// 2. Hide a side
<VizBlock block={block} footerLeft={null} />

// 3. Replace a side wholesale
<VizBlock
  block={block}
  footerRight={<MyCustomActions />}
/>
```

`footerLeft={null}` and `footerRight={null}` hide that group. Passing a
React node replaces the entire group. Passing `undefined` (or omitting
the prop) keeps the defaults.

## Expand modal

When the user clicks the expand button:

1. If `onExpand` prop is provided → calls it. Consumer is responsible
   for rendering whatever expanded view they want.
2. Otherwise → opens an internal fullscreen modal (overlay + 80vh
   centered card). Backdrop click and the close button dismiss it.

The modal **reuses the same Slot** so it inherits the slot priority
(chartSlot > iframe > data > placeholder). Tables also work in expanded
view.

## Props reference

```ts
interface VizBlockProps {
  block: VizBlockData;

  // Slot override
  chartSlot?: React.ReactNode;

  // Footer slots
  footerLeft?: React.ReactNode;        // null hides; node replaces
  footerRight?: React.ReactNode;

  // View toggle
  view?: 'chart' | 'table';            // controlled
  onViewChange?: (view) => void;

  // Expand
  onExpand?: () => void;               // overrides internal modal

  // Default footer-action handlers
  onPin?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onAddToCoaching?: () => void;
}
```

## Changing the visual

### Resize the card

The chart slot uses `min-height: 280px`. Adjust in
`VizBlock.module.css` `.cardBody`. The card otherwise grows with its
content.

### Different token palette

Token backgrounds map to `var(--rd-sys-color-background-*)`. To add a
new color, add a new `[data-kind='...']` rule and a new `VizTokenKind`
literal.

### Replace the SVG sketch with a real chart engine

Recommended approach: don't replace the sketch in `VizBlock` — instead
have the prototype pass a `chartSlot` with the real engine's output.
The sketch is meant for canned mode where data is inline and a real
engine is overkill.

If you do want to replace it inline (e.g. in `data` source mode):

1. Find the `ChartSketch` component at the bottom of `VizBlock.tsx`.
2. Swap its body for a real chart engine. The component receives
   `series: VizSeries[]` and renders into a `width: 100%; height: 100%`
   container.
3. The legend is rendered separately in the slot dispatcher — keep it
   as-is, or render the legend inside the new component and remove the
   external one.

### Make the toggle actually swap to table

Provide `block.tableData = { columns, rows }` in the response. Toggling
to table now shows a real `<table>`. No code change needed.

If the table needs richer columns (typed values, formatting, sticky
headers), swap `Slot`'s `<table>` for the Radiant `Table` component and
map the `columns` / `rows` to its props.

## Testing in canned mode

The canned fixture `vizFixture` in `cannedResponses.ts` produces a viz
block with `source.type = 'data'` and a `tableData` for the toggle. Type
"sales by month" or any keyword in `monthly|trend|fall|winter|sale|item|forecast`
to trigger it.

To test the iframe path, add a fixture with:

```ts
source: {
  type: 'iframe',
  url: 'https://example.com/chart',
  sandbox: 'allow-scripts',
}
```

To test the placeholder path, set `source: { type: 'placeholder' }`.

## What stays out of scope here

- Real chart engines (Muze, Recharts, Plotly) — slot accepts them via
  `chartSlot`, but the engine itself is the consumer's choice.
- Token interactions (click → filter the chart) — tokens are visual
  only for now. Add `onTokenClick` later when product asks.
- Drill-down in the expand modal — the modal mirrors the slot, no extra
  drilldown UX.
- Split-screen "chart on canvas, chat on left" pattern — explicitly
  rejected per `docs/2026-05-07-spotter-chat-extraction.md` decisions
  (in-thread answers only).

## Checklist for future modifications

When you change `VizBlock`, run this checklist:

- [ ] Schema change in `schema.ts` reflected in `cannedResponses.ts` fixtures
- [ ] System prompt at `systemPrompt.ts` updated if the wire format changed
- [ ] Slot dispatcher updated if you added a new `VizSource.type`
- [ ] Token kinds match the schema's `VizTokenKind` literal
- [ ] Footer customization still works (default vs `null` vs override)
- [ ] Expand modal still opens and the slot renders inside it
- [ ] Build and typecheck pass: `npm run build && npm run typecheck`
- [ ] Visual review against the Figma frame (node `146:37670`)
