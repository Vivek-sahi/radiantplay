---
description: Component map for Data Model Editor prototypes — shared _agentic/ and _datamodel/ components, their props, and wiring notes. Load when building or modifying any DME component.
alwaysApply: false
---

# Data Model Editor — Component Reference

> For IA tree and window bridge API, see `data-model-editor-ia.md`.
> For interaction behaviours, see `data-model-editor-interactions.md`.

---

## Before You Start

**Never build custom equivalents** of the components listed here. Both `_agentic/` and `_datamodel/` are purpose-built for this prototype family and must be reused.

When a Figma link or screenshot is provided, use these components as the **structural foundation** and drive the **visual output** from the reference.

Reference implementation:
- `src/prototypes/DataModelEditor/DataModelEditor.tsx` — unified component (owns canvas/model state; renders `<AgentPanel>` when `spotterModelEnabled`)

---

## Shared Agentic Components (`src/prototypes/_agentic/`)

Import from `'../_agentic'` (relative from any sibling prototype folder).

---

### `AgentPanel`

Full right-panel composite component. Owns `messages` state, `chatStarted` state, and all `window.*` chat callbacks. Renders the welcome view (variant-specific), message stream, and bottom prompt bar.

```typescript
interface AgentPanelProps {
  welcomeVariant: 'blank' | 'existing';
  onAddToModel: (suggType: SuggType, items: unknown[]) => void;
  onRefine: (suggType: SuggType) => void;
  onChipClick: (text: string) => void;
  onRestoreVersion: (num: number) => void;
}
```

**Welcome variants:**
- `'blank'` — mascot + "Let's build your model" headline + central welcome textarea + bullet list. Bottom prompt bar hidden until first message sent (`chatStarted`).
- `'existing'` — mascot + "Welcome back" + "Check for AI readiness" button. Bottom prompt bar always visible.

**Wiring:** `DataModelEditor.tsx` renders `<AgentPanel welcomeVariant={welcomeVariant} ...callbacks />` when `spotterModelEnabled`. All `window.*` callback registrations live inside `AgentPanel`'s `useEffect`.

---

### `UserBubble`

Right-aligned user message bubble.

```typescript
interface UserBubbleProps {
  text: string;
}
```

**Wiring:** rendered when `message.kind === 'user'` in the messages array. Fired by `window._appendMsg({ kind: 'user', id, text })`.

---

### `TypingIndicator`

Agent "thinking" row — avatar + animated arc + label text.

```typescript
interface TypingIndicatorProps {
  label: string;
}
```

**Wiring:** `window._appendMsg({ kind: 'typing', id, label })` to show; `window._removeMsg(id)` to hide. Always removed before the agent response is added.

---

### `AgentMessage`

Layout wrapper for any agent-originated content — provides avatar + left-aligned content slot.

```typescript
interface AgentMessageProps {
  children: React.ReactNode;
}
```

**Wiring:** wraps `<ReasoningBlock>` and `<AgentResponseBlock>` when `message.kind === 'agent'`.

---

### `ReasoningBlock`

Animated multi-step thinking display. Steps build up progressively; collapses to summary when done.

```typescript
interface ReasoningBlockProps {
  header: string;
  steps: ReasoningStep[];
  isDone: boolean;
}
type ReasoningStep = { name: string; text: string; toolcall?: ToolcallData };
```

**Wiring:** `window._updateReasoning(id, { steps, isDone })` patches the `reasoning` field on a `kind:'agent'` message. Each update adds a step; `isDone: true` collapses the block.

---

### `ToolcallCard`

Expandable card for a tool invocation (INPUT → OUTPUT). Embedded inside ReasoningBlock steps.

```typescript
interface ToolcallCardProps {
  title: string;
  input: string;
  output: string;
  status: 'loading' | 'done' | 'error';
}
```

**Wiring:** passed as `toolcall` inside a `ReasoningStep`. Manages its own expand/collapse state.

---

### `AgentResponseBlock`

Composite block rendered for each `kind:'agent'` message response. Composes text, clarify questions, SuggestionCard, NextActionChips, and VersionCard.

```typescript
interface AgentResponseBlockProps {
  data: ResponseData;
  onAddToModel: (suggType: SuggType, items: unknown[]) => void;
  onRefine: (suggType: SuggType) => void;
  onChipClick: (text: string) => void;
  onRestoreVersion: (num: number) => void;
}
```

**Wiring:** rendered for `message.kind === 'agent'`. Props connected to `window._handleAddToModel`, `window._handleSuggestionRefine`, `window._handleChipClick`, `window._restoreVersion` in the TSX `useEffect`.

---

### `SuggestionCard`

Polymorphic checkbox-list card for tables, joins, columns, or formulas.

```typescript
interface SuggestionCardProps {
  suggType: 'tables' | 'joins' | 'columns' | 'formulas';
  tables?: TableSuggestion[];
  joins?: JoinSuggestion[];
  columnGroups?: ColumnGroup[];
  formulas?: FormulaSuggestion[];
  isAdding?: boolean;
  onAdd: (suggType: SuggType, checkedItems: unknown[]) => void;
  onRefine: (suggType: SuggType) => void;
}
```

**Row anatomy:**
- Tables rows: checkbox + name + description + `<ConfidenceBadge pct={t.pct} />`
- Joins rows: checkbox + name + description + `<JoinDiagram>`
- Columns rows: grouped by table header + checkbox + column name
- Formulas rows: numbered + name + truncated code

**Wiring:** rendered by `<AgentResponseBlock>` when `data.suggType` is set.

---

### `ConfidenceBadge`

Colored pill showing AI confidence percentage. Used inside SuggestionCard table rows.

```typescript
interface ConfidenceBadgeProps {
  pct: number;  // ≥80 = green, 55–79 = amber, <55 = red
}
```

**Wiring:** no direct callback. Child of SuggestionCard.

---

### `JoinDiagram`

Purely presentational inline SVG: `leftTable → cardinality → rightTable`. Embedded inside SuggestionCard join rows.

```typescript
interface JoinDiagramProps {
  leftTable: string;
  leftCol: string;
  cardinality: string;  // "Many : 1" | "1 : Many" | "1 : 1"
  rightTable: string;
  rightCol: string;
}
```

**Wiring:** no callback. Child of SuggestionCard.

---

### `NextActionChips`

Vertical column of quick-reply pill buttons at end of agent response. The `enrich` variant has a rotating-gradient border.

```typescript
interface NextActionChipsProps {
  chips: ChipItem[];
  onChipClick: (text: string) => void;
}
type ChipItem = { text: string; variant?: 'default' | 'enrich' };
```

**Wiring:** `onChipClick` → `window._handleChipClick(text)` → `startChat(text)`.

---

### `VersionCard`

Single entry in model version history with optional restore menu. Latest version has no restore option.

```typescript
interface VersionCardProps {
  versionNum: number;
  label: string;
  isLatest: boolean;
  isDisabled?: boolean;
  onRestore?: (num: number) => void;
}
```

**Wiring:** `onRestore` → `window._restoreVersion(num)`. `window._demoteVersionCards()` sets `isLatest: false` on all existing version cards before a new one is appended.

---

## Shared Data Model Components (`src/prototypes/_datamodel/`)

Import from `'../_datamodel'`.

---

### `TableCanvas`

Outer canvas container. Composes `<TableCard>` instances and `<JoinConnector>`. Owns `positions` state and `cardRects` memo.

```typescript
interface TableCanvasProps {
  tables: TablePositionData[];
  joins: JoinInfo[];
  onTableDragEnd: (name: string, x: number, y: number) => void;
}
type TablePositionData = { name: string; x: number; y: number; totalColumns: number; addedColumns: number };
```

**Wiring:** `window._setTableCanvasData({ tables, joins })` → React state → re-renders. `onTableDragEnd` → `window._handleTableDrag?.(name, x, y)`.

**Behaviour:** `positions` state (local) updates on every drag frame via `onDrag` for smooth join line tracking. `onDragEnd` syncs final position back to init.js.

---

### `TableCard`

Single draggable table node on the canvas.

```typescript
interface TableCardProps {
  name: string;
  totalColumns: number;
  addedColumns: number;
  x: number;
  y: number;
  isDragging?: boolean;
  onDrag: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onMenuClick?: () => void;
}
```

**Behaviour:** `onMouseDown` → document `mousemove`/`mouseup` listeners; `currentPos` ref prevents stale closure in `mouseup`. `.dragging` class → shadow + `cursor: grabbing`.

---

### `JoinConnector`

SVG overlay drawing orthogonal paths between table cards with join badge overlays.

```typescript
interface JoinConnectorProps {
  joins: JoinInfo[];
  cardRects: Record<string, { x: number; y: number; w: number; h: number }>;
}
type JoinInfo = { leftTable: string; rightTable: string };
```

**Behaviour:** 3-pass algorithm (resolve → slot → path). Renders as a React fragment: `<svg>` paths + absolutely-positioned `<div>` badges at path midpoints. `overflow: visible` on SVG so paths extend past canvas edges.

---

### `ColumnTree`

Hierarchical accordion in the left pane. Tables expand to reveal column chips; added vs unadded columns visually distinguished.

```typescript
interface ColumnTreeProps {
  data: ColumnTreeData;
}
type ColumnTreeData = {
  tables: Array<{ name: string; desc?: string; pct?: number }>;
  dataSourceTables: Array<{ name: string; columns: string[] }>;
  modelColumns: Array<{ table: string; columns: string[] }>;
};
```

**Behaviour:** `expandedTables: Set<string>` internal state. Columns not in `modelColumns` are draggable (`application/x-spotter-column` data transfer). Added columns shown with check icon; unadded columns shown at lower opacity.

**Wiring:** `window._setColumnTreeData(data)` → React state → re-renders. Drop zone handling stays in init.js.

---

## Radiant Components Used

| Component | Import | Usage in DME |
|-----------|--------|-------------|
| `SegmentedControl` | `@components/SegmentedControl` | Tab bar (Tables/Columns/Formulas/…) |
| `Button` | `@components/Button` | Sub-header toolbar actions, suggestion card footer |
| `SearchInput` | `@components/SearchInput` | Left pane table search, columns/formulas search |
| `Select` | `@components/Select` | Join options, zoom, sort dropdowns |
| `Table` | `@components/Table` | Columns tab grid, formulas tab grid |
| `Toggle` | `@components/Toggle` | Settings tab toggles |
| `RdModal` | `@components/RdModal` | Context modal (opened by window._openCtxModal) |
| `OverlayLoading` | `@components/OverlayLoading` | Model update dots animation (`variant="dots"`) |

---

## Type Exports from `_agentic/types.ts`

```typescript
// Import as needed
import type {
  MessageItem,        // union: 'user' | 'typing' | 'agent'
  ResponseData,       // agent response payload
  ReasoningData,      // { steps, isDone }
  ReasoningStep,      // { name, text, toolcall? }
  ToolcallData,       // { title, input, output, status }
  VersionCardData,    // { versionNum, label, isLatest, isDisabled }
  SuggType,           // 'tables' | 'joins' | 'columns' | 'formulas'
  TableSuggestion,    // { id, name, desc, pct, checked }
  JoinSuggestion,     // { id, name, desc, leftTable, leftCol, cardinality, rightTable, rightCol, checked }
  ColumnGroup,        // { table, columns: string[] }
  FormulaSuggestion,  // { id, name, code }
  ChipItem,           // { text, variant? }
} from '../_agentic/types';
```

---

## Quick Start

To build a new Data Model Editor variant from scratch, run the Requirements Gate in `_orchestration.md` first — it asks `welcomeVariant`, SpotterModel on/off, API key, and dataset. Scaffold by creating a thin `index.tsx` wrapper that sets `window.__DME_CONFIG__` and renders `<DataModelEditor />` imported from `src/prototypes/DataModelEditor/DataModelEditor.tsx`. Update `DATASOURCE_TABLES` in `init-dme.js` if using a custom dataset.
