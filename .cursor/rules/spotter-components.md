---
description: Component inventory for the Spotter DS — chat surface, page shell, runtime schema. Loads when working on Spotter files.
globs: ["src/spotter/**/*.tsx", "src/spotter/**/*.ts", "src/spotter/**/*.css", "src/prototypes/Spotter*/**/*"]
alwaysApply: false
---

# Spotter DS — Component inventory

The Spotter DS is a peer to the Radiant DS. It lives at `src/spotter/`
and is consumed via `@spotter/*` aliases. It builds on top of `@components`
(Radiant primitives) and `@tokens` (design tokens).

**Two-layer model:** Radiant DS = product-agnostic primitives (Button, Modal,
Table). Spotter DS = AI/agentic-domain blocks built using those primitives.

```
@components (Radiant)  ← primitives, no domain knowledge
   ↑
@spotter/* (Spotter)   ← chat / answer / page / runtime / icons / tokens
   ↑
src/prototypes/Spotter*  ← consumers
```

## Top-level layout

```
src/spotter/
├── tokens.ts              ← Spotter-local tokens (radial glow, chart bgs)
├── icons.tsx              ← glyphs missing from Radiant: PanelToggle, Bell,
│                            ThoughtSpotMark, ChartSearch, Orbits
├── chat/                  ← agentic conversation
├── page/                  ← full-page shell + collapsible nav
├── answer/                ← reserved for AnswerCard (spec, not built yet)
├── viz/                   ← reserved for future drill / advanced viz
└── runtime/               ← schema + service + system prompt
```

## chat/ — conversation surface

Use these when building or modifying anything chat-flavoured.

| Component | Role |
|---|---|
| `SpotterChatProvider` | React Context + useReducer. Owns conversation state, exposes `{ state, send, abort, clear }` via `useSpotterChat()`. |
| `useSpotterChat` | Hook with the must-be-inside-provider guard. |
| `ChatThread` | Scrollable list of messages. Auto-scrolls on append + on streaming updates (tracks block count + text length fingerprint). |
| `MessageRow` | Role dispatcher → `UserBubble` for user, `AgentMessage` for agent. **Renamed from ChatMessage to avoid colliding with the schema type.** |
| `UserBubble` | Two-part layout: (1) a row with avatar + text inside a soft-gray rounded container, (2) timestamp rendered **below** the row, right-aligned (`align-self: flex-end`). Timestamp is never inside the bubble row. |
| `AgentMessage` | Avatar (icon-based, default `ai`) + reasoning + response blocks + feedback row when `stage === 'done'`. |
| `TypingIndicator` | Spinner ring + "Analysing…" — shown only between submit and the first reasoning chunk. |
| `ReasoningBlock` | Collapsible "Show work ⌄" trigger. Auto-expands during streaming, auto-collapses 600ms after done. Renders steps with title + description + optional ToolcallCard + "Worked for X seconds" footer. Done dots are gray (`content-tertiary`). |
| `AgentResponseBlock` | Block dispatcher. Iterates `content.blocks` and calls the right renderer per `kind`. |
| `SpotterPrompt` | Controlled prompt with auto-resize textarea, mode toggle (ChartSearch / Orbits icons), model picker, controls icon, blue submit. **Gets a purple→blue gradient border on `:focus-within`.** |
| `QuickAction`, `QuickActionRow` | Pill buttons used in the welcome state. Interaction rules: (1) `:active` state applies `scale(0.97)` press feedback. (2) Once any button is clicked, all others become `disabled` (opacity 0.5, no pointer events) to prevent double-fire. (3) `QuickActionRow` pre-fills `promptValue` for one frame so the user sees the text before it's sent. Never remove the disabled state or skip the pre-fill flash. |

### blocks/ — block renderers

One renderer per `AnswerBlock.kind`. Wired into `AgentResponseBlock` via a
switch on `kind`.

| Block | Renders |
|---|---|
| `TextBlock` | Streamed paragraph (markdown rendering deferred). |
| `VizBlock` | Slot card. Header (tokens + chart/table toggle + expand) → body slot → footer (Pin/Save/Download/Edit + Add to coaching). **Slot priority: chartSlot prop > iframe > inline data SVG sketch > placeholder.** See `docs/2026-05-07-spotter-viz-block-behaviour.md`. |
| `SourcesBlock` | Citation pills with answer-icon + label. |
| `FollowUpsBlock` | Clickable chips. **On click, calls `useSpotterChat().send()`** — disabled while streaming. |
| `RefineBlock` | Inset card with prompt + radio-row options. Click sends the question. |
| `ErrorBlock` | Failure-tinted alert with exclamation icon. |

To add a new block kind:
1. Add a discriminated arm to `AnswerBlock` in `src/spotter/runtime/schema.ts` (use a `Data` suffix on the type name to avoid collision with the component).
2. Create `src/spotter/chat/blocks/MyBlock.tsx`.
3. Add a case to `AgentResponseBlock`'s `BlockRenderer` switch.
4. Re-export from `blocks/index.ts`.
5. Update `cannedResponses.ts` if you want to test it in canned mode.

## page/ — full-page shell

| Component | Role |
|---|---|
| `SpotterShell` | Top-level layout: full-width header + body (left side + canvas). |
| `SpotterLeftSide` | Owns the **smooth 64↔260 width animation** between rail and panel modes (cubic-bezier, 280ms). Renders rail or panel content based on `mode`. |
| `SpotterLeftToggle` | Default toggle button (uses the custom `PanelToggleIcon`). |
| `SpotterRail` | Collapsed 64-wide column. Slots for `top` (icon items) and `bottom`. |
| `SpotterRailItem` | Icon-only entry with `Tooltip` on hover. |
| `SpotterPanel` | Expanded 260-wide column. Slots for `top`, `primaryAction`, body (sections), `footer`. The `footer` slot has zero padding — its child is expected to be full-width. |
| `SpotterPanelAction` | Action button in the panel. `variant='pill'` (default): rounded pill with subtle background — for "New chat". `variant='flat'`: transparent, full-width, centered, 48px height — for "Settings". Always use `variant='flat'` for the Settings button at the bottom of the panel. |
| `SpotterPanelSection` | Section with optional uppercase label. **Top divider for full-width line breaks.** |
| `SpotterPanelItem` | Full-width row with optional leading icon + label + optional trailing icon. **Selected state uses `background-information` + `content-brand`, no border-radius.** |
| `SpotterWelcome` | Default-analyst landing canvas. Spotter `spotter` icon (48px, brand color) above the greeting. Greeting with brand-blue accent + radial glow + slot for prompt + slot for quick actions. |

## runtime/ — wire format + service

| File | Role |
|---|---|
| `schema.ts` | `AnswerBlock` (discriminated union), `AnswerContent`, `AnswerChunk` streaming protocol, `ChatMessage`, `ReasoningTrace`, `VizSource` (iframe / data / placeholder). |
| `chatService.ts` | `askSpotter()` async generator. Two modes: `canned` (default — emits fixture chunks with setTimeout), `live` (stub for `/api/chat`). |
| `cannedResponses.ts` | 4 fixtures with rich reasoning steps (descriptions + optional toolcalls + duration). Naive keyword routing — viz is the default fallback. |
| `systemPrompt.ts` | Placeholder. Replace with the canonical Spotter prompt when it lands. |

## tokens / icons

| File | What it has |
|---|---|
| `src/spotter/tokens.ts` | `spotterGlow` (brand glow alpha for the welcome state) + `spotterChartBg` (aliases over Radiant system tokens). |
| `src/spotter/icons.tsx` | `PanelToggleIcon` (sidebar layout, custom SVG), `BellIcon` (notifications), `ThoughtSpotMark` (brand asset), `ChartSearchIcon` + `OrbitsIcon` (prompt mode toggle). All match Radiant's `BaseIconProps` API so they accept `size="m"` exactly like `<Icon name="..." />`. |

## Conventions to follow when modifying Spotter

- **Token-only** — colors/spacing/typography come from `@tokens` or
  CSS variables. No hardcoded hex outside `tokens.ts` and the brand
  asset SVG.
- **Use Radiant primitives** — Button, Modal, Tooltip, etc. from
  `@components`. Don't duplicate.
- **Layout primitives** — `Vertical`, `Horizontal`, `View` from
  `@components/Layout`. Don't reach for inline flex unless inside a
  module CSS that's already styled.
- **Sentence case** — all user-facing strings.
- **Data-type names** end in `Data` (e.g. `VizBlockData`,
  `TextBlockData`) to avoid colliding with React components of the same
  name.
- **Block components** live in `blocks/`. New block kinds need schema
  arm + dispatcher case + canned fixture.

## Where consumers live

- **Prototype**: `src/prototypes/Spotter/` — wraps `<SpotterChatProvider>`. Right pane derived from `(selectedAnalyst, selectedChat, rightPaneOverride)` state — see `spotter-ia.md` for exact derivation.
- **`ChatCanvas`** (prototype-local at `src/prototypes/Spotter/components/`) — chat-active layout: scrollable `<ChatThread>` + sticky `<SpotterPrompt>` + disclaimer.
- **`AnalystLandingPage`** (prototype-local at `src/prototypes/Spotter/components/`) — right-pane view when a named analyst is selected and no chat is active. Full-height centered: radial glow + 80px avatar circle (brand gradient, white initial) + "Hi, I'm {name}" heading + `SpotterPrompt` with analyst-specific placeholder.
- **`AnalystListPage`** (prototype-local at `src/prototypes/Spotter/components/`) — right-pane view when `rightPaneOverride === 'analyst-list'`. Full-width page: header ("Analysts" + "+ Create new") + search bar + All/Yours/Shared tabs + 3-column responsive grid of analyst cards (avatar, name, description, author, integration chips).

When you change a Spotter DS component, that change ripples to every
consumer. When you change a prototype-local component (like
`ChatCanvas`), only the Spotter prototype is affected.

---

## Planned components (not yet in code)

Components that need to exist for Spotter prototypes but aren't built yet. Figma-first workflow: spec in Figma → add a Code Connect mapping → implement.

Statuses: `design` (Figma in progress) → `figma-ready` (Figma done, code not started) → `in-progress` (code being written) → `built` (move out of this section into the inventory above).

### AnswerCard
- **Status:** design (Figma spec exists)
- **Purpose:** The answer view that renders inside a chat thread when Spotter responds with a viz-backed answer. VizBlock is the current stand-in.
- **Figma:** node `122:15399` (`Card / Answer`) in the AI Design System & Style Guidelines file
- **Spec doc:** `docs/2026-05-07-spotter-answer-card.md`
- **Will live at:** `src/spotter/answer/AnswerCard.tsx`

### Model picker (full)
- **Status:** design pending
- **Purpose:** Richer data-model selection than the prompt's inline picker — recently used, search, model metadata. The current `SpotterPrompt` has a minimal dropdown. Consolidates the previously-listed "Source picker" (data sources and data models are the same concept here).
- **Will live at:** `src/spotter/chat/ModelPicker.tsx` (tentative)

### AnalystCard
- **Status:** design pending
- **Purpose:** Row item shown in the left-pane **Analysts** section (avatar + name + hover affordance for the row menu). Currently `SpotterPanelItem` is used directly.
- **Note:** Analyst ≠ data model. An analyst is a custom AI agent; a data model is a data source.
- **Will live at:** `src/spotter/page/AnalystCard.tsx` (tentative)

### AnalystRowMenu
- **Status:** built
- **Lives at:** `src/spotter/page/AnalystRowMenu.tsx`
- **Purpose:** Hover menu that appears on each analyst row in the left panel. Items: Edit (only shown when user has edit privilege), Share, Make a copy, Delete.

### AnalystLandingPage
- **Status:** built (prototype-local)
- **Purpose:** Right-pane state when a named analyst is selected and no chat is active.
- **Lives at:** `src/prototypes/Spotter/components/AnalystLandingPage.tsx`
- **Elements:** full-height centered page, radial glow, 80px avatar circle (brand-to-purple gradient, white initial), "Hi, I'm {analystName}" h1, `SpotterPrompt` with `placeholder="Ask {analystName} anything about your data"`.
- **Props:** `analystName: string`, `promptProps?: SpotterPromptProps`

### AnalystListPage
- **Status:** built (prototype-local)
- **Purpose:** Right-pane state when the user clicks "View all >" in the Analysts section (`rightPaneOverride === 'analyst-list'`).
- **Lives at:** `src/prototypes/Spotter/components/AnalystListPage.tsx`
- **Elements:** "Analysts" header + "+ Create new" button, `SearchInput`, All/Yours/Shared `Tabs`, 3-column responsive grid of analyst cards (avatar circle with initial, name, description, author, integration chips). Clicking a card calls `onAnalystClick(id)` which triggers a full analyst-click navigation (sets selectedAnalyst, clears chat, clears rightPaneOverride).
- **Props:** `analysts: Analyst[]`, `onAnalystClick: (id: string) => void`, `onCreateNew: () => void`

### ChatRowMenu
- **Status:** built
- **Lives at:** `src/spotter/page/ChatRowMenu.tsx`
- **Purpose:** Hover menu that appears on each chat row in the left panel. Items: Rename, Favorite / Star, Share, Delete.

### SettingsMenu
- **Status:** built
- **Lives at:** `src/spotter/page/SettingsMenu.tsx`
- **Purpose:** Popover menu opened from the Settings button at the bottom of the left panel. Hosts 6 items in 4 divided groups: Spotter instructions (modal) · Usage monitoring + Admin settings (new tab) · Manage memory sources (new tab) + Personal memory (inline toggle) · Spotter best practices (modal).

### PersonalMemoryToggle
- **Status:** built
- **Lives at:** `src/spotter/page/PersonalMemoryToggle.tsx`
- **Purpose:** Inline toggle row inside `SettingsMenu` — no navigation, just on / off in place. Reads + writes a user preference.

### Spotter topbar variants
- **Status:** design pending
- **Purpose:** Topbar treatments for different surface contexts — with / without breadcrumbs, with model-context chip, embedded mode.
- **Note:** Standalone today uses Radiant `GlobalHeader` (light). These variants might wrap or replace it.

### Spotter Viz components
- **Status:** design pending
- **Purpose:** Components for the Spotter Viz embedded mode (visualization agent for instant dashboards).
- **Likely includes:** viz preview card, refine controls, "commit to Liveboard" affordance, chart-type switcher.
- **See:** `spotter-agentic-chat-ia.md` → Spotter Viz section for open IA questions

### Spotter Code components
- **Status:** design pending
- **Purpose:** Components for the Spotter Code embedded mode (developer-facing code agent).
- **Likely includes:** file tree, code editor wrapper, diff preview, agent-proposed-edit approval row.
- **See:** `spotter-agentic-chat-ia.md` → Spotter Code section for open IA questions

> Adding a new planned component: include status, purpose, Figma reference if any, intended path, and any open questions. When it moves to `built`, cut it from this section and add it to the inventory at the top of this file.
