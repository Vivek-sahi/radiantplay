---
description: Information architecture for Data Model Editor prototypes — layout variants, IA trees, and window bridge API. Load for any DME work.
alwaysApply: false
---

# Data Model Editor — Information Architecture

> For component props and import paths, see `data-model-editor-components.md`.
> For interaction behaviours and event wiring, see `data-model-editor-interactions.md`.

---

## Overview

The Data Model Editor is a unified prototype (`DataModelEditor/`) controlled by `window.__DME_CONFIG__`:

| `welcomeVariant` | Starting state | Agent panel welcome |
|-----------------|---------------|---------------------|
| `'blank'` (default) | Empty canvas, central welcome textarea | "Let's build your model" |
| `'existing'` | Pre-populated tables, joins, columns | "Welcome back" + "Check for AI readiness" |

And a SpotterModel flag that controls the right panel:

| SpotterModel | Right panel | Layout |
|-------------|-------------|--------|
| **On** (default) | Agent panel with AI chat | 3-column: left pane + canvas + agent |
| **Off** | Hidden | 2-column: left pane + canvas (full width) |

This gives 4 layout variants in total. Rule: `welcomeVariant` always follows data state — blank canvas → `'blank'`, pre-loaded schema → `'existing'`.

---

## Layout Shell

```
.sm-root
├── .app-header                        ← title + SegmentedControl tabs
├── .body-row
│   ├── .left-and-main
│   │   ├── .sub-header                ← model name/desc + toolbar actions
│   │   └── .content-row
│   │       ├── <OverlayLoading>       ← dots spinner during model updates
│   │       ├── .left-pane             ← collapsible; hidden on Formulas/Filters/etc.
│   │       └── .tab-content panels   ← Tables / Columns / Formulas / Filters / ...
│   └── .agent-panel                   ← RIGHT: conditional on spotterModelEnabled
```

---

## Information Architecture — `welcomeVariant: 'blank'` (SpotterModel On)

```
Data Model Editor — blank variant
├── App Header
│   ├── Title: "Data model editor"
│   └── SegmentedControl: Tables | Columns | Formulas | Filters | Parameters | Settings
│
├── Sub-header (Tables tab)
│   ├── Model name placeholder + description placeholder
│   └── Toolbar: Find button · Join options Select · Zoom Select
│
├── Left Pane (visible on Tables + Columns tabs)
│   ├── Tables tab section (#pane-tables-section)
│   │   ├── Connection row (Snowflake icon + connection name)
│   │   ├── Pane title "Tables" + layout toggle icon
│   │   ├── SearchInput (filter table list)
│   │   ├── Add filters button + Sort Select
│   │   └── Table list (DATASOURCE_TABLES, each row: name + columns accordion)
│   │       └── Column chip rows → draggable to canvas
│   └── Columns tab section (#pane-columns-section)
│       └── <ColumnTree> component (expand tables → see columns, added vs. unadded)
│
├── Main Canvas (Tables tab: #content-tables)
│   ├── Empty state: "Your model will appear here" (when no tables added)
│   └── .model-canvas (when tables exist)
│       ├── <TableCanvas> — positions + drag for all tables
│       │   ├── <TableCard> per table (name, column count badge, 3-dot menu)
│       │   └── <JoinConnector> SVG overlay (drawn between joined tables)
│       └── <OverlayLoading variant="dots"> (model update animation)
│
├── Columns tab (#content-columns)
│   └── <Table> component — columns with name, source table, desc, AI context
│
├── Formulas tab (#content-formulas)
│   └── Formula table with search + rows (name, type)
│       └── Formulas toolbar (Add formula button, separate fade-in)
│
├── Filters / Parameters / Settings tabs
│   └── Empty placeholder content
│
└── Agent Panel (right, .agent-panel) ← conditional on spotterModelEnabled
    ├── Panel header (.agent-panel-header)
    │   ├── Panel title
    │   └── Context chip button (inline, driven by window._contextData)
    │
    ├── Welcome view (#welcome-view) — shown until first chat message
    │   ├── Mascot image
    │   ├── Headline ("Let's build your model")
    │   ├── Suggestion links (inline onclick → startChat())
    │   └── Prompt textarea + Send button
    │
    └── Chat view (#chat-view) — shown after first message
        ├── Message stream (.chat-msgs, ref: chatMsgsRef)
        │   ├── <UserBubble> — user message right-aligned
        │   ├── <TypingIndicator> — "Analysing..." while API call runs
        │   ├── <AgentMessage> — wraps agent content with avatar
        │   │   ├── <ReasoningBlock> — thinking steps + optional ToolcallCards
        │   │   └── <AgentResponseBlock> — text + clarify questions + SuggestionCard + chips
        │   │       ├── <SuggestionCard> (tables / joins / columns / formulas)
        │   │       │   └── <ConfidenceBadge> per table row (pct %)
        │   │       │   └── <JoinDiagram> per join row
        │   │       ├── <NextActionChips> — post-response quick-reply chips
        │   │       └── <VersionCard> — after model update (restore button)
        │   └── (auto-scrolls on new message via window._scrollMsgs)
        └── Chat prompt area
            ├── Chat textarea (#chat-textarea)
            └── Send button
```

---

## Information Architecture — `welcomeVariant: 'blank'` (SpotterModel Off)

```
Data Model Editor — blank variant (canvas only)
├── App Header  (same)
├── Sub-header  (same)
├── Left Pane   (same)
├── Canvas      (same — full width, no agent panel column)
└── (no agent panel)
```

`init-dme.js` still runs — all canvas interactions (drag, column tree, formulas) work normally. `startChat()` is never called because the welcome textarea / chat prompt are not rendered.

---

## Information Architecture — `welcomeVariant: 'existing'` (SpotterModel On)

Identical layout to blank variant, with these differences:

| Area | `'blank'` | `'existing'` |
|------|-----------|--------------|
| Canvas initial state | Empty | Pre-populated tables, joins, columns |
| Welcome view | Shown (central textarea, gated bottom bar) | Hidden — chat view shown immediately |
| Agent panel intro | "Let's build your model" | "Welcome back" + "Check for AI readiness" |
| Version history | Starts empty | May have prior versions visible |

`init-dme.js` reads `window.__DME_CONFIG__?.welcomeVariant` at start. When `'existing'`, it pre-loads `window._modelState` with an existing model and fires `_setTableCanvasData` on init with the pre-populated tables.

---

## Window Bridge API

All communication from init.js → React state goes through `window.*` callbacks registered in `useEffect`.

### React state callbacks (init.js writes, React reads)

| Callback | Signature | Drives |
|----------|-----------|--------|
| `_appendMsg` | `(item: MessageItem) => void` | Appends to `messages[]` state |
| `_updateMsg` | `(id, patch) => void` | Merges patch into matching message |
| `_removeMsg` | `(id) => void` | Removes message by id |
| `_scrollMsgs` | `() => void` | Scrolls `.chat-msgs` to bottom |
| `_updateReasoning` | `(id, ReasoningData) => void` | Adds/updates reasoning on `kind:'agent'` message |
| `_demoteVersionCards` | `() => void` | Sets `isLatest: false` on all version cards |
| `_freezeConversation` | `() => void` | Strips `chips` from all agent messages |
| `_setTableCanvasData` | `({ tables, joins }) => void` | Drives `<TableCanvas>` |
| `_setColumnTreeData` | `(ColumnTreeData) => void` | Drives `<ColumnTree>` |
| `_setModelLoading` | `(visible, label?) => void` | Shows/hides `<OverlayLoading>` |
| `_setColumnRows` | `(ColRow[]) => void` | Populates Columns tab `<Table>` |
| `_setFormulaRows` | `(FormulaRow[]) => void` | Populates Formulas tab rows |
| `_openCtxModal` | `(html: string) => void` | Opens context modal with content |
| `_closeCtxModal` | `() => void` | Closes context modal |

### React → init.js callbacks (React fires, init.js handles)

| Callback | When fired | Handler |
|----------|-----------|---------|
| `_onChatStart` | First message sent | Sets `chatStarted`, hides welcome view |
| `_handleTableDrag` | TableCard drag end | Updates `tablePositions` in model state |
| `_handleAddToModel` | SuggestionCard "Add to model" | `applyModelUpdate()` in init.js |
| `_handleSuggestionRefine` | SuggestionCard "Refine suggestions" | Re-prompts Claude for alternatives |
| `_handleChipClick` | NextActionChips chip press | `startChat(text)` |
| `_restoreVersion` | VersionCard restore | Rolls model back to version N |

### Direct init.js globals

| Global | Purpose |
|--------|---------|
| `window.startChat(prompt)` | Programmatic chat trigger |
| `window._modelState` | Full model state object (authoritative source of truth) |
| `window._conversationHistory` | Anthropic messages array (appended each turn) |
| `window.__DME_CONFIG__` | Config object read on init: `{ spotterModel: boolean, welcomeVariant: 'blank' \| 'existing', model?: string }` |

---

## MessageItem Union Type

```typescript
type MessageItem =
  | { kind: 'user';   id: string; text: string }
  | { kind: 'typing'; id: string; label: string }
  | { kind: 'agent';  id: string; response: ResponseData; reasoning?: ReasoningData }
```

`ResponseData` carries: `text`, `suggType`, `tables`, `joins`, `columnGroups`, `formulas`, `clarifyQuestions`, `chips`, `versionCard`, `isVisible`.

---

## SpotterModel Configuration

Read in `DataModelEditor.tsx` on mount:

```typescript
const spotterModelEnabled = (window as any).__DME_CONFIG__?.spotterModel ?? true;
```

Default is `true` — full layout with agent panel. Set `window.__DME_CONFIG__ = { spotterModel: false, welcomeVariant: 'blank' }` in `index.tsx` before mount to get canvas-only layout.

`welcomeVariant` is read inside `initDME()` in `init-dme.js`:

```js
const welcomeVariant = window.__DME_CONFIG__?.welcomeVariant ?? 'blank';
```

The `model` field controls which Claude model is used in `askClaude()` (default: `claude-haiku-4-5-20251001`). Update per the Requirements Gate answer.

---

## LLM Integration

**Already implemented.** The `/api/chat` Vite middleware in `vite.config.ts` proxies POST requests to `https://api.anthropic.com/v1/messages` using `process.env.ANTHROPIC_API_KEY` from `.env.local`.

Without the key: API call returns 500 → `startChat()` catches the error → toast: `"ANTHROPIC_API_KEY not set in .env.local"`.

With the key: full Claude response → parsed JSON → mapped to `window._appendMsg` / `_setTableCanvasData` / etc.

**No changes to init.js are needed to enable real LLM** — only `.env.local` configuration.
