# Spotter prototype shell plan (2026-05-07)

Plan for the first Spotter prototype: a full-screen shell with collapsible left panel, header, and a canvas that renders the welcome state. Builds the reusable shell pieces directly into Spotter DS so future Spotter surfaces can pick them up. Builds in one pass after this plan is approved.

**Sources.**

- Spotter home page (welcome state): Figma `BEArfoxAWu64w0JrujDcIk`, node `862:84897`.
- Spotter left nav (expanded): Figma `kK7hKArnQ6hxdW7ffxWPRK`, node `649:160735`.

**Sibling docs.**

- `docs/2026-05-07-spotter-ds-plan.md` — parent plan, two-layer DS model.
- `docs/2026-05-07-spotter-answer-card.md` — answer card plan, deferred.

## Combined anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ Header (60h) — logo  │  Search library     ?  🔔  avatar          │
├──────┬───────────────────────────────────────────────────────────┤
│      │                                                            │
│ Left │                                                            │
│ rail │                Canvas area                                 │
│  or  │                                                            │
│ Left │       (welcome state shown initially)                      │
│ panel│                                                            │
│      │                                                            │
└──────┴───────────────────────────────────────────────────────────┘
```

**Header (60h, full width).** Logo + library search + help + notifications + avatar. The home design shows a single-line top bar.

**Left side, two states.**

- **Collapsed rail** (64w). Icon-only column. Shows: panel toggle, new chat (+) icon, settings at bottom. This is the default seen on the home page screen.
- **Expanded panel** (260w). Same column wider, with sections. Shows: panel toggle, "New chat" pill button, "Spotter (Default)" entry, "Custom Spotters" section with items, "Chats" section with recent items, "Settings" pill button at bottom.

The toggle button at the top-left flips between the two states.

**Canvas area (fills remaining width).** White surface. Holds the welcome state initially. In future states, will hold chat thread, answer cards, pinned viz, and runtime-rendered blocks.

**Welcome state (canvas content for now).**

- Vertical center.
- Greeting: "Lets make sense of your data together." with "make sense" in brand accent.
- Subtle radial glow behind the prompt area.
- Prompt bar: rounded card, multi-line input, placeholder "Ask me a question. Use '@' to select columns and values", actions row with mode toggle, "All data models" picker, plus action button, settings icon button, primary submit button (blue circle, up arrow).
- Quick actions row below: three pill buttons — "Quick search", "Deep analysis", "Know your data".

## What lives where

Two-layer split:

**Spotter DS** (`src/spotter/`) — reusable shell pieces. Imported via `@spotter`.

| File | Subdomain | Purpose |
|---|---|---|
| `page/SpotterShell.tsx` | page | Full-screen layout. Composes header slot + left side + canvas. Owns the rail/panel collapse state via prop or internal hook. |
| `page/SpotterLeftSide.tsx` | page | Wrapper that switches between rail and panel based on `mode`. |
| `page/SpotterRail.tsx` | page | 64w collapsed view. Icon-only stack. |
| `page/SpotterPanel.tsx` | page | 260w expanded view. Full sections. |
| `page/SpotterPanelSection.tsx` | page | Section header (small caps label) + list. |
| `page/SpotterPanelItem.tsx` | page | Single list item, optional active state, optional trailing icon. |
| `page/SpotterRailItem.tsx` | page | Icon-only rail entry with tooltip. |
| `page/SpotterWelcome.tsx` | page | Canvas welcome state composition. |
| `chat/SpotterPrompt.tsx` | chat | Prompt bar (textarea + actions row). Used in welcome state and future chat states. |
| `chat/QuickActionRow.tsx` | chat | Three-pill row. |
| `chat/QuickAction.tsx` | chat | Single pill button with icon + label. |

**Prototype** (`src/prototypes/Spotter/`) — thin consumer.

| File | Purpose |
|---|---|
| `index.tsx` | Wires SpotterShell with a header, populated left panel (mock chats + custom spotters), and canvas rendering SpotterWelcome. |
| `data/mockData.ts` | Mock custom spotters list, mock chats list, mock data models. |
| `components/.gitkeep` | Reserved. Local components only if a piece is genuinely prototype-specific. |

**Header.** Use the existing Radiant `GlobalHeader` (already part of AppShell) if its API supports the search + avatar + notification layout. If gaps appear, the prototype uses a thin local `SpotterHeader` wrapper. Not committing to a Spotter DS header until it proves reusable.

## Component breakdown details

### SpotterShell

```ts
interface SpotterShellProps {
  header: React.ReactNode;
  leftSide: React.ReactNode;        // SpotterLeftSide instance
  children: React.ReactNode;        // canvas content
  mode: 'rail' | 'panel';           // controlled
  onModeChange?: (mode: 'rail' | 'panel') => void;
}
```

Layout: 60h header on top, then a horizontal flex with leftSide + canvas. No use of AppShell directly because the rail (64) and panel (260) modes share the same column with different content composition, not just a width swap. AppShell's sidebar API does not cover this pattern cleanly.

### SpotterLeftSide

```ts
interface SpotterLeftSideProps {
  mode: 'rail' | 'panel';
  onToggle: () => void;
  // Slots so consumers control content per mode:
  rail: React.ReactNode;            // collapsed contents
  panel: React.ReactNode;           // expanded contents
}
```

Renders rail or panel based on mode. The toggle button lives at the top of either.

### SpotterRail / SpotterPanel

Compose primitives. SpotterRail is mostly `Vertical` with `SpotterRailItem`s. SpotterPanel is `Vertical` with sections.

### SpotterPanelSection

```ts
interface SpotterPanelSectionProps {
  label?: string;                   // e.g. "Custom spotters", optional
  children: React.ReactNode;
}
```

Renders the small-caps label above its children. No label means flush.

### SpotterPanelItem

```ts
interface SpotterPanelItemProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  trailingIcon?: React.ReactNode;   // e.g. chevron for "View library"
  onClick?: () => void;
}
```

Selected state uses `background-information` (light blue) + `content-brand` text + optional chevron. Truncates label with ellipsis at panel width.

### SpotterRailItem

```ts
interface SpotterRailItemProps {
  icon: React.ReactNode;
  label: string;                    // for tooltip + a11y
  selected?: boolean;
  onClick?: () => void;
}
```

Icon button with hover state and tooltip on hover.

### SpotterWelcome

Composes greeting + SpotterPrompt + QuickActionRow. Greeting text is configurable via prop with a sensible default. Prompt is a slot so consumers can swap it out (or we render the default SpotterPrompt internally).

```ts
interface SpotterWelcomeProps {
  greeting?: React.ReactNode;       // default: "Lets make sense of your data together."
  prompt?: React.ReactNode;         // default: <SpotterPrompt />
  quickActions?: React.ReactNode;   // default: <QuickActionRow />
}
```

### SpotterPrompt

The centered prompt card.

```ts
interface SpotterPromptProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;             // default: "Ask me a question. Use '@' to select columns and values"
  dataModelLabel?: string;          // default: "All data models"
  modeOptions?: string[];           // default: chart icon options for the mode toggle
  disabled?: boolean;
  // Slots for consumer overrides on actions if needed
  leftActionsSlot?: React.ReactNode;
  rightActionsSlot?: React.ReactNode;
}
```

Internally wraps Radiant `TextArea`, `Button`, `IconButton`, `SegmentedControl`, `Menu`. No raw HTML elements.

### QuickActionRow / QuickAction

```ts
interface QuickActionRowProps {
  actions?: QuickActionItem[];      // default: built-in three
  onAction?: (id: string) => void;
}

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}
```

Three pill buttons with icon + label. Sentence case labels.

## Radiant primitives in use

Confirmed already in `src/components/`:

- `AppShell` (maybe — see decision below).
- `GlobalHeader` for the top bar.
- `Vertical`, `Horizontal`, `View` for layout.
- `Button`, `IconButton` for actions.
- `TextArea` for the prompt input.
- `SegmentedControl` for the chart/table mode toggle.
- `Menu` / `Popover` for the data model picker dropdown.
- `Tooltip` for rail item hover labels.
- `Card` for the prompt bar surface.
- `SearchInput` (in header).
- `Avatar` (in header).

No new Radiant primitives required.

## Token mapping

| Visual | Token |
|---|---|
| Canvas surface | `background-base` |
| Header surface | `background-base` |
| Header bottom border | `border-divider` |
| Panel surface | `background-sunken` (light gray, matches Figma) |
| Panel item selected bg | `background-information` |
| Panel item selected text | `content-brand` |
| Section header label | `content-secondary`, `v2TextStyles.caption`, uppercase tracking |
| Greeting text | `content-primary`, large heading style |
| Greeting accent ("make sense") | `content-brand` |
| Prompt card bg | `background-base` |
| Prompt card border | `border-default` |
| Prompt card radius | `radius-lg` |
| Prompt placeholder | `content-secondary` |
| Submit button bg | `content-brand` |
| Submit button arrow | white |
| Quick action pill bg | `background-base` |
| Quick action pill border | `border-default` |
| Subtle radial glow | new Spotter-local token (soft brand glow). Add to `src/spotter/tokens.ts`. |

## State and interactions (in this scaffold)

This is shell scaffolding. Wire only what the layout needs. Defer real chat logic.

- **Panel mode toggle**: `useState<'rail' \| 'panel'>('rail')` at the prototype level. Toggle button in SpotterLeftSide flips it. Persist via `useState` only, no localStorage in this round.
- **Prompt input**: controlled state at the prototype level. Submit handler logs to console for now and clears the input. No chat thread yet.
- **Quick action click**: handler logs which action was clicked. No real navigation yet.
- **Panel item click** (chats / custom spotters): selects the item in local state, applies the selected style. No real routing.
- **New chat button**: clears prompt. No-op otherwise.
- **Search in header**: not wired. Visual only.

## File structure to create

```
src/spotter/
├── tokens.ts                                ← (new) Spotter-local tokens. Start with radial glow + chip bg colors stub.
├── page/
│   ├── SpotterShell.tsx
│   ├── SpotterShell.module.css
│   ├── SpotterLeftSide.tsx
│   ├── SpotterLeftSide.module.css
│   ├── SpotterRail.tsx
│   ├── SpotterRail.module.css
│   ├── SpotterRailItem.tsx
│   ├── SpotterPanel.tsx
│   ├── SpotterPanel.module.css
│   ├── SpotterPanelSection.tsx
│   ├── SpotterPanelItem.tsx
│   ├── SpotterPanelItem.module.css
│   ├── SpotterWelcome.tsx
│   ├── SpotterWelcome.module.css
│   └── index.ts                             ← re-exports
├── chat/
│   ├── SpotterPrompt.tsx
│   ├── SpotterPrompt.module.css
│   ├── QuickActionRow.tsx
│   ├── QuickAction.tsx
│   ├── QuickAction.module.css
│   └── index.ts                             ← re-exports

src/prototypes/Spotter/
├── index.tsx                                ← wires everything; controlled mode + mock data
├── data/
│   └── mockData.ts                          ← chats[], customSpotters[], dataModels[]
└── components/
    └── .gitkeep                             ← reserved

src/prototypes/registry-mine.ts              ← register the prototype (section: 'mine')
src/prototypes/thumbnails/Spotter.svg       ← gallery thumbnail
```

## Build sequence

One pass. Files written in this order so each step compiles:

1. **Tokens.** `src/spotter/tokens.ts` with the glow color and a placeholder `chartTokens` map (reuse existing system tokens for everything else).
2. **Chat primitives.** `QuickAction`, `QuickActionRow`, `SpotterPrompt`. These have no dependencies inside Spotter.
3. **Page primitives.** `SpotterPanelItem`, `SpotterPanelSection`, `SpotterRailItem`, then `SpotterRail`, `SpotterPanel`, then `SpotterLeftSide`, then `SpotterShell`, finally `SpotterWelcome`.
4. **Barrel updates.** Update `src/spotter/page/index.ts` and `src/spotter/chat/index.ts`. Top-level `src/spotter/index.ts` is already wired.
5. **Mock data.** `src/prototypes/Spotter/data/mockData.ts` with realistic-sounding chats and custom spotters.
6. **Prototype.** `src/prototypes/Spotter/index.tsx` wiring shell + welcome + mock data.
7. **Registry.** Add Spotter entry to `registry-mine.ts` plus thumbnail SVG.
8. **Build verification.** Run `npm run build` (or `npm run typecheck`) and fix anything Spotter-introduced. Existing pre-existing errors on this branch stay as-is.

## Decisions made

- **Custom SpotterShell**, not AppShell. AppShell's sidebar is one-mode (one width). Spotter shell needs two distinct modes (rail vs panel) with different content composition. Cleaner to build SpotterShell as a peer composition.
- **Header reuses Radiant.** Use `GlobalHeader` directly in the prototype. No Spotter-specific header wrapper unless gaps emerge.
- **Items live in Spotter DS**, not in `src/prototypes/Spotter/components/`. These pieces are the foundation other Spotter surfaces consume. The prototype is intentionally thin.
- **No real chat logic.** Stub everything. Real `/api/chat` integration lands later.
- **Mode is prop-controlled** at the prototype level. SpotterShell does not own the state. Keeps the API testable and lets future surfaces persist mode their own way.

## Open questions (acknowledged, not blocking)

- Selected state in the panel for chats vs. custom spotters — only one selected at a time, or one per section? Plan: one per section for now.
- Does the rail show chat history at all, or only top-level icons? Plan: only top-level (panel toggle, new chat, settings) until we see the rail expanded.
- Where does the data model picker live in the chat-active state? Defer.
- The radial glow behind the prompt — pure CSS gradient or an SVG blob? Plan: CSS radial gradient using a Spotter-local token. No SVG asset needed.

## Out of scope

- Chat thread / answer rendering (Phase 4 of parent plan).
- Real API hookup.
- Custom Spotter creation flow (separate prototype).
- Settings drawer / dialog.
- Pinned viz on canvas.
- Library search panel.
- Mobile / narrow viewport.

## What ships at end of this build

- Full Spotter prototype shell, registered in `registry-mine.ts`, with:
  - Working rail ↔ panel toggle.
  - Populated panel: New chat button, default Spotter entry, Custom Spotters list, Chats list, Settings.
  - Welcome canvas state with greeting, prompt bar (controlled), quick actions row.
  - Subtle radial glow behind the prompt.
- 11 new Spotter DS components in `@spotter/page` and `@spotter/chat`.
- 1 new Spotter tokens file.
- TypeScript and build pass on Spotter-introduced code.

## Status (2026-05-07) — chat extraction integrated

Since this plan was authored, the chat extraction (per
`docs/2026-05-07-spotter-chat-extraction.md`) has shipped on top of
the shell:

- `<SpotterChatProvider>` wraps the prototype tree.
- `<SpotterWelcome>` renders when `state.messages.length === 0`.
- `<ChatCanvas>` (local prototype component) renders when there's a
  conversation — scrollable `<ChatThread>` filling the canvas with a
  sticky `<SpotterPrompt>` at the bottom and a "Spotter responses
  should be reviewed. Learn more" disclaimer.
- The prompt now gets a purple→blue gradient border on focus
  (`:focus-within` state).
- The header swapped to Radiant `<GlobalHeader theme="light">` —
  the previous local `SpotterHeader` was deleted.
- The panel-toggle, "New chat", and "Library" icons match the latest
  Figma spec (panel toggle is a custom SVG in `@spotter/icons`; the
  rest are Radiant icons from the 151-icon registry sync).
- Smooth 64↔260 width animation on the left side via
  `SpotterLeftSide` wrapper.

Out of scope at this point: AnswerCard build (separate plan), real
chart engine in VizBlock, markdown in TextBlock, live `/api/chat`
integration. All tracked in their own docs.
