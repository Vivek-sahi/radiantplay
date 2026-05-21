---
description: Information architecture for the standalone Spotter prototype — the full-page agentic chat surface. Covers welcome states, chat thread, sticky prompt, left panel, header. Pairs with spotter-components.md, spotter-logic.md, spotter-response-style.md.
globs: ["src/prototypes/Spotter/**/*", "src/prototypes/Spotter*/**/*"]
alwaysApply: false
---

# Spotter — Information Architecture (standalone)

> Standalone Spotter is the **full-page agentic chat** at `src/prototypes/Spotter/`. For the embedded agentic chat used inside Spotter Model / Spotter Viz / Spotter Code, see `spotter-agentic-chat-ia.md`. For the component inventory, see `spotter-components.md`.

Last updated: 2026-05-19 (Standalone IA rewrite — left panel structure, right-pane states, Settings menu, hover menus, exact widths).

---

## Page layout

```
GlobalHeader (light theme — used by Spotter)
SpotterShell
├── SpotterLeftSide   ← collapsible: 64px rail ↔ 260px panel
│   └── (see "Left panel" below for full structure)
└── Right pane        ← multi-state (see "Right-pane states" below)
    └── content container        ← 936px wide, centered
        └── text content          ← 844px wide (inset, narrower for readability)
        └── SpotterPrompt         ← sticky bottom, 936px wide, gradient on focus
```

**Widths (locked):**

| Region | Width |
|---|---|
| Left pane (panel mode) | **260px** |
| Left pane (rail mode) | 64px |
| Right pane content container (scrollable) | **936px** |
| Right pane text content (inside the container) | **844px** |
| Sticky prompt bar | 936px |

Tokens: `spotterLayout.chatMaxWidth = 936`, `spotterLayout.textMaxWidth = 844` (see `src/spotter/tokens.ts`).

The shell is built once. The right pane has multiple **states** (see next section). The most common state — chat — swaps between **welcome** (empty thread) and **chat-active** based on `state.messages.length === 0`.

---

## Right-pane states

The right pane is not always the chat thread. Four primary states + modal overlays:

| State | When | Renders |
|---|---|---|
| **Chat — welcome** | `state.messages.length === 0` | Hero + sticky prompt — see "Welcome states" below |
| **Chat — active** | `state.messages.length > 0` | Scrollable `ChatThread` + sticky prompt — see "Chat-active state" below |
| **Analyst landing** | User clicks an analyst row in the left panel | Landing page for that analyst (about, recent activity, recent chats with this analyst, action to start a new chat). Component: planned `AnalystLandingPage` |
| **Analyst list** | User clicks "View all >" in the Analysts section | Full list of analysts with search / filter / sort. Component: planned `AnalystListPage` |

**Modal overlays** (over any state):
- **Spotter instructions** (from Settings)
- **Spotter best practices** (from Settings)

State transitions are driven by left-pane navigation. The chat state is owned by `SpotterChatProvider`; the analyst-landing and analyst-list states are owned by prototype-local state (route or `useState`).

---

## Welcome states

A "welcome state" is what the canvas shows before any user prompt is submitted. Spotter currently has one production variant — others are catalogued here as design lands. Add a new sub-section when you bring a new variant from Figma; include a short description, key elements, and a screenshot link.

### 1. Blank (default — current production)

The "first prompt" hero. No history, no model preselected, full attention on the prompt.

**Elements:**
- Centred hero copy — "Welcome to Spotter" / "Ask anything about your data"
- Radial brand glow behind the hero (`spotterGlow` token)
- Sticky `SpotterPrompt` at bottom (chat input)
- Optional `QuickActionRow` with 2–4 starter prompts (e.g., "Show me total sales by month")

**When to use:** First-time user, after `clear()`, anonymous session.

### 2. Returning (planned)

Shows recent chats + prompt. Designed for users who have prior sessions.

**Elements (planned):**
- "Welcome back, <name>"
- Recent chats list (clickable to resume)
- Sticky prompt at bottom

**Status:** Design pending. Add Figma reference here when available.

### 3. Topical (planned)

Pre-seeded with a topic / dataset context. Used when a user arrives via a deep link or model selection.

**Elements (planned):**
- "Welcome to <model name>" header
- Suggested questions specific to that model
- Sticky prompt

**Status:** Design pending.

### 4. Guided / starter questions (planned)

Hero with pre-suggested questions as chips. Variation of Blank with stronger prompting.

**Status:** Design pending.

> When a new welcome variant is brought from Figma, add a section above with: name, when-to-use, elements, screenshot link, and any data dependencies.

---

## Chat-active state

When `state.messages.length > 0`, the canvas swaps to the thread view.

```
ChatThread (scrolls)
├── MessageRow (per message — dispatches role)
│   ├── UserBubble    (role: 'user')
│   └── AgentMessage  (role: 'agent')
│       ├── ReasoningBlock      ← collapsible "Show work ⌄"
│       ├── AgentResponseBlock  ← iterates content.blocks
│       └── Feedback row        ← only when stage === 'done'
└── TypingIndicator  ← between submit and first reasoning chunk
```

Auto-scroll on append + streaming. See `spotter-logic.md` for state machine and chunk protocol.

---

## Sticky prompt

`SpotterPrompt` lives at the bottom of the canvas in BOTH welcome and chat-active states. Its sticky position keeps it aligned with the chat thread. Width matches the content container: `spotterLayout.chatMaxWidth = 936px`. Text content inside chat messages is the narrower `spotterLayout.textMaxWidth = 844px`.

Properties:
- Auto-resize textarea (grows with content, capped)
- Mode toggle — `ChartSearch` / `Orbits` icons (search vs explore mode)
- Model picker — current model display + dropdown
- Controls icon — more actions (placeholder)
- Submit button (blue, disabled when empty)
- Purple → blue gradient border on `:focus-within`
- Disclaimer beneath: "Spotter responses should be reviewed. Learn more"

---

## Left panel (`SpotterLeftSide`)

Collapsible between **rail** (64px, icons only) and **panel** (260px, with labels and sections).

### Panel structure (top → bottom)

```
SpotterPanel (260px)
├── Spotter title                          ← brand
├── SpotterLeftToggle                      ← collapse/expand icon button
├── SpotterPanelAction "+ New chat"        ← top-level action, calls clear()
├── ─── Analysts section ──────────────────
│   ├── AnalystCard (recent #1)             ← name + hover menu
│   ├── AnalystCard (recent #2)
│   └── "View all >"                        ← navigates right pane to AnalystListPage
├── ─── Chats section ─────────────────────
│   ├── Chat row (recency #1)               ← name + hover menu
│   ├── Chat row (recency #2)
│   └── ... (sorted by recency)
└── Settings button (at the bottom)         ← opens SettingsMenu popover
```

### Analysts section

Shows the **2 most recently used analysts** plus a `"View all >"` row.

- Clicking an **analyst row** sets the right pane to the **Analyst landing** state for that analyst. In the prototype, this clears the active chat thread (`clear()`) and deselects any selected chat so the canvas returns to the welcome/empty state scoped to that analyst.
- Clicking **"View all >"** sets the right pane to **Analyst list**
- **Hover menu** on each analyst row:
  - **Edit** — only shown if the user has edit privilege on that analyst
  - Share
  - Make a copy
  - Delete

Components: planned `AnalystCard` (row) + `AnalystRowMenu` (hover menu).

> Analyst ≠ data model. An analyst is a **custom AI agent** with its own configuration. A data model is a **data source** selected from the prompt's model picker. Both concepts coexist in the same chat session.

### Chats section

All chats, sorted by recency (most recent first).

- Clicking a chat row sets the right pane to **Chat — active** with that chat loaded. In the prototype, this calls `load(chat.messages)` (via `useSpotterChat`) which replaces the active thread with that chat's pre-baked `ChatMessage[]` history. The selected analyst is cleared. Each `ChatEntry` in `mockData.ts` must carry a `messages` array — never leave it empty.
- **Hover menu** on each chat row:
  - Rename
  - Favorite / Star
  - Share
  - Delete

Components: planned `ChatRowMenu` (hover menu).

### Settings (at the bottom of the panel)

A persistent **Settings** button anchored at the bottom of the panel. Clicking it opens a popover menu with 6 items in 4 visual groups (separated by dividers):

| # | Item | Behaviour |
|---|---|---|
| 1 | **Spotter instructions** | Opens an in-page modal |
| — | *divider* | |
| 2 | **Usage monitoring** | Opens in a new browser tab (external link icon) |
| 3 | **Admin settings** | Opens in a new browser tab (external link icon) |
| — | *divider* | |
| 4 | **Manage memory sources** | Opens in a new browser tab (external link icon) |
| 5 | **Personal memory** | Inline toggle (no navigation — flips on/off in place) |
| — | *divider* | |
| 6 | **Spotter best practices** | Opens an in-page modal |

Components: planned `SettingsMenu` (shell) + `PersonalMemoryToggle` (the inline toggle row). All other rows are simple link/menu rows distinguished by the external icon.

### Rail mode

```
SpotterRail (64px)
├── SpotterLeftToggle           ← expand pill at top
├── SpotterRailItem "+"          ← New chat
├── (icon-only collapsed nav)
└── Settings icon at bottom
```

Rail mode shows icons only with tooltip labels on hover. The Analysts and Chats sections collapse to icon-only entries (or hide — design pending). The Settings button stays at the bottom.

Switching modes is animated (smooth 64 ↔ 260 transition). `SpotterLeftToggle` is the pill button that triggers the switch.

---

## Header

Use Radiant's `GlobalHeader` from `@components/GlobalHeader` in **light mode**. Do not build a custom header. Spotter prototypes rely on:
- App switcher
- Search
- Notifications (Bell — Spotter-local icon)
- User avatar

---

## Provider wiring

Standalone Spotter wraps the page in `SpotterChatProvider`:

```tsx
<SpotterChatProvider mode="canned">
  <SpotterInner />
</SpotterChatProvider>
```

`mode="canned"` uses fixtures from `src/spotter/runtime/cannedResponses.ts`. `mode="live"` is reserved for future API wiring.

Inside the provider, use `useSpotterChat()` to read state and call `send` / `abort` / `clear`.

---

## Theme — light mode by default

Standalone Spotter ships in light mode. Dark mode is not blocked, but no current design exists for it. If dark mode is requested, derive system tokens from `systemColors.dark` and verify contrast on every Spotter-local token (especially the brand glow).

---

## Cross-references

- **Components:** `spotter-components.md`
- **State machine / streaming:** `spotter-logic.md`
- **Voice and block usage:** `spotter-response-style.md`
- **Embedded agentic chat (Code/Viz/Model):** `spotter-agentic-chat-ia.md`
- **VizBlock behavior (still relevant):** `docs/2026-05-07-spotter-viz-block-behaviour.md`
- **AnswerCard spec (unbuilt):** `docs/2026-05-07-spotter-answer-card.md`
