# Spotter chat extraction plan (2026-05-07)

Plan for porting the agentic chat behavior from DataModelEditor (DME) into the Spotter prototype, lifting the reusable pieces into the Spotter DS.

**Sibling docs.**

- `docs/2026-05-07-spotter-ds-plan.md` — parent two-layer DS plan.
- `docs/2026-05-07-spotter-prototype-shell.md` — shell scaffolding (already shipped).
- `docs/2026-05-07-spotter-answer-card.md` — AnswerCard spec (used as the VizBlock renderer).

**Visual references.**

- Screen 3 (chat-active state with viz answer): designer-provided screenshot. Locks the layout for user message, agent message frame, "Show work" reasoning, and AnswerCard placement.
- Figma node `122:15399` (AI Design System): the AnswerCard component used inside VizBlock.

## Goal

When the user sends a question in the Spotter prototype, render an in-thread chat conversation with: animated thinking, streamed answer blocks (text / chart / viz inline), tool-call cards if present, follow-up chips. Use canned Spotter-flavored responses for now. No real Anthropic call. Prove the visual + interaction model so the designer can iterate fast.

## Decisions locked

| # | Topic | Choice |
|---|---|---|
| 1 | Scope | Full loop with hardcoded canned responses (real architecture, fake content) |
| 2 | Streaming | SSE-style streaming; renders block-by-block |
| 3 | Reasoning UI | Animated cosmetic steps with Spotter-relevant labels |
| 4 | Canvas integration | In-thread only — canvas content (charts, tables) renders inside the message |
| 5 | System prompt | Placeholder for now, designer will provide real one |
| 6 | Response schema | Start with a workable schema, iterate when canonical contract arrives |
| 7 | State | React Context + useReducer |
| 8 | Multiple chats | One thread for now, panel selection cosmetic |
| 9 | Missing API key | Always-works canned responses |
| 10 | Where code lives | Pure Spotter DS (`src/spotter/chat/`, `src/spotter/runtime/`) |

## Architecture

Three layers, top to bottom:

```
SpotterChatProvider                         ← prototype-level Context + reducer
   ├─ holds messages[], current stream state
   ├─ exposes: send(text), retry(), abort()
   └─ uses askSpotter() service

askSpotter (service)                        ← Spotter DS, runtime/
   ├─ accepts messages[], systemPrompt
   ├─ returns AsyncIterable<AnswerChunk>
   ├─ canned mode (default): emits chunks from fixtures
   └─ live mode (later): POST /api/chat with SSE parsing

ChatThread + message components             ← Spotter DS, chat/
   ├─ pure rendering of state passed via props
   └─ no fetch logic, no DOM globals
```

## Message anatomy (from screen 3)

Visual breakdown of a single agent response in the thread.

```
┌─ Thread row ─ user message ─────────────────────────────────────────┐
│  ╭───╮  ┌──────────────────────────────────────────────────────────┐│
│  │ 🙂 │  │ For the upcoming Fall/Winter season (next 3 months),     ││
│  ╰───╯  │ analyze potential sales                                  ││
│         └──────────────────────────────────────────────────────────┘│
│                                                07:47 PM, 11/21/2023│
└─────────────────────────────────────────────────────────────────────┘

┌─ Thread row ─ agent message ────────────────────────────────────────┐
│  ╭───╮                                                              │
│  │ B │  Show work  ⌄          ← ReasoningBlock (collapsed trigger)  │
│  ╰───╯                                                              │
│                                                                     │
│         Total sales by monthly date and item type                   │
│         ↑ AnswerTitle (bold, optional)                              │
│                                                                     │
│         ┌─ AnswerCard (VizBlock) ─────────────────────────────────┐ │
│         │ [sales] [monthly] [by item type] [▼ date=last year]  ▥▦│ │
│         │ ┌───────────────────────────────────────┬─────────────┐ │ │
│         │ │ chart body                            │ legend      │ │ │
│         │ └───────────────────────────────────────┴─────────────┘ │ │
│         └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

  ╭─────────────────────────────────────────────────────────────╮
  │ Ask me a question. Use '@' to select columns and values.    │  ← Sticky
  │ [▥▦] | [All data models ⌄] [+]              [⇅]    [↑]      │     prompt
  ╰─────────────────────────────────────────────────────────────╯
        Spotter responses should be reviewed. Learn more
```

### Expanded reasoning state

```
│  ╭───╮                                                              │
│  │ B │  Show work  ⌃                                                │
│  ╰───╯                                                              │
│         ┌──────────────────────────────────────────────────────┐    │
│         │ ●  Understanding your question      ✓ done           │    │
│         │ ●  Searching the data model         ✓ done           │    │
│         │ │     ┌─ ToolcallCard (optional) ───────────────────┐│    │
│         │ │     │ 🔍 Searched columns                          ││    │
│         │ │     └────────────────────────────────────────────┘ │    │
│         │ ●  Generating answer                ✓ done           │    │
│         └──────────────────────────────────────────────────────┘    │
```

### Other block types

Text-only response — no AnswerCard, just paragraph content under "Show work":

```
│  ╭───╮                                                              │
│  │ B │  Show work  ⌄                                                │
│  ╰───╯                                                              │
│         Total Q4 revenue across all regions came in at $12.4M,      │
│         up 8% versus the same period last year…                     │
```

Refine response — Spotter asks back with options:

```
│  ╭───╮                                                              │
│  │ B │  Show work  ⌄                                                │
│  ╰───╯                                                              │
│         I want to make sure I answer the right thing — quick check: │
│         ◯  Sales by item type, summed for the next 3 months         │
│         ◯  Sales forecast trend by month for Fall/Winter            │
│         ◯  Both — first the breakdown, then the forecast            │
```

### Component → block mapping

```
ChatMessage (role='agent')
├─ Avatar           ← colored initial circle (matches active Spotter)
└─ AgentMessage
   ├─ ReasoningBlock                 ← "Show work ⌄" by default
   └─ AgentResponseBlock              ← iterates AnswerContent.blocks
      ├─ AnswerTitle  (only on viz blocks, optional field)
      └─ block dispatcher
         ├─ TextBlock           — paragraph
         ├─ VizBlock            — wraps <AnswerCard> from src/spotter/answer/
         ├─ SourcesBlock        — citation pills
         ├─ FollowUpsBlock      — suggested-next chips
         ├─ RefineBlock         — clarification questions back to user
         └─ ErrorBlock          — typed error
```

### Streaming timeline (canned mode emulates the cadence)

```
t=0ms     User submits prompt              → user message appears
t=200ms   Agent message frame appears      → avatar + Show work placeholder + 3 reasoning dots animating
t=600ms   Reasoning step 1 → done
t=1200ms  Reasoning step 2 → done          (with toolcall card if present)
t=1800ms  Reasoning step 3 → done          → ReasoningBlock auto-collapses to "Show work ⌄"
t=1900ms  AnswerTitle appears (if present)
t=2000ms  First content block appears      (VizBlock skeleton → real, or text starts streaming)
t=2200ms  Subsequent blocks (FollowUps, etc.)
t=2300ms  message_done                     → message marked complete
```

## Visual decisions locked from screen 3

- **User message** is not a chat bubble. It's an avatar (left) + soft gray rounded container (full-width-ish), with a right-aligned timestamp directly underneath.
- **Agent avatar** is a colored initial-circle. The initial = first letter of the active Custom Spotter (e.g. "B" for "Budget review"), color tied to the Spotter. Default Spotter avatar is its own brand color.
- **Reasoning is collapsed by default** as a "Show work ⌄" trigger. It expands on click to show the animated steps. During streaming it auto-expands while running, then auto-collapses on done.
- **AnswerTitle** is a bold heading rendered between the reasoning trigger and the AnswerCard. It's an optional field on the viz block (or top-level on the agent message — final placement decision below).
- **VizBlock = AnswerCard**. The viz block renderer in `src/spotter/chat/blocks/VizBlock.tsx` wraps the `AnswerCard` from `src/spotter/answer/`. Until AnswerCard ships, VizBlock renders a styled placeholder card with the same header tokens + a chart-area stub.
- **Sticky prompt** at the bottom of the canvas during chat-active state. Has a subtle purple→blue gradient border (focused state). Disclaimer "Spotter responses should be reviewed. Learn more" sits below the prompt as caption text.

## In-thread answer model

Critical clarification from the discussion: Spotter answers are *in the chat thread*. There is no separate canvas pane for charts. Each agent message can carry one or more **answer blocks** that render inline.

Block types in the starter schema (we'll iterate):

```ts
type AnswerBlock =
  | { type: 'text';      text: string }
  | { type: 'viz';       title: string; chartKind: 'bar' | 'line' | 'pie' | 'table'; data: VizData }
  | { type: 'sources';   items: Source[] }
  | { type: 'followups'; suggestions: string[] }
  | { type: 'refine';    questions: string[] }   // clarification asked back
  | { type: 'error';     message: string };

interface AnswerContent {
  title?: string;          // optional bold heading above the first block (per screen 3)
  blocks: AnswerBlock[];
}
```

The agent message renders blocks vertically, in order received. Streaming appends blocks (or text within the current text block) as chunks arrive.

## Streaming model

`askSpotter()` returns an async iterable of `AnswerChunk`s:

```ts
type AnswerChunk =
  | { kind: 'reasoning_start';  steps: ReasoningStep[] }
  | { kind: 'reasoning_step';   stepIndex: number; status: 'current' | 'done' }
  | { kind: 'reasoning_done' }
  | { kind: 'block_start';      block: AnswerBlock }     // empties for text, full for viz/sources/etc.
  | { kind: 'text_delta';       blockIndex: number; delta: string }
  | { kind: 'block_done';       blockIndex: number }
  | { kind: 'message_done' }
  | { kind: 'error';             message: string };
```

For canned mode: a fixture is a sequence of these chunks plus delays. The service yields them with `setTimeout` so the UI feels real.

For live mode (later): the same chunk stream comes from parsing SSE events from the API.

## Reasoning visualization

Adopt DME's animated style with a Spotter-flavored shell. Default resting state per screen 3 is **collapsed** — shows only "Show work ⌄" next to the agent avatar. Click expands to reveal the steps.

During streaming the block auto-expands so the user sees progress live. On `message_done` it auto-collapses back to "Show work ⌄" so the answer is the focal point.

Each reasoning sequence is 3 hardcoded cosmetic steps with Spotter labels (final list TBD with the designer). Working defaults:

- "Understanding your question"
- "Searching the data model"
- "Generating answer"

Animation: dot pulse → label fade-in, staggered ~600ms each. Optional `ToolcallCard` can appear under any step. ReasoningBlock is reused from `_agentic/`, retitled with the Spotter labels and the new collapsed/expanded behavior.

## State shape

```ts
type MessageStage = 'sending' | 'thinking' | 'streaming' | 'done' | 'error';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  stage: MessageStage;
  text?: string;                    // user role only
  reasoning?: ReasoningTrace;       // agent role only
  content?: AnswerContent;          // agent role only
  error?: string;
  createdAt: number;
}

interface ReasoningTrace {
  steps: { label: string; status: 'pending' | 'current' | 'done' }[];
  isDone: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;             // any message currently mid-stream
  abortController: AbortController | null;
}
```

Actions: `SEND_USER`, `START_AGENT`, `REASONING_START`, `REASONING_STEP`, `REASONING_DONE`, `BLOCK_START`, `TEXT_DELTA`, `BLOCK_DONE`, `MESSAGE_DONE`, `MESSAGE_ERROR`, `ABORT`.

## File structure

```
src/spotter/
├── chat/
│   ├── ChatThread.tsx                 ← scrollable list, auto-scroll on append
│   ├── ChatThread.module.css
│   ├── ChatMessage.tsx                ← role dispatcher
│   ├── UserBubble.tsx                 ← extracted from _agentic
│   ├── UserBubble.module.css
│   ├── AgentMessage.tsx               ← extracted from _agentic
│   ├── AgentMessage.module.css
│   ├── TypingIndicator.tsx            ← extracted from _agentic
│   ├── ReasoningBlock.tsx             ← extracted, Spotter labels
│   ├── ReasoningBlock.module.css
│   ├── AgentResponseBlock.tsx        ← renders AnswerContent.blocks via dispatcher
│   ├── blocks/
│   │   ├── TextBlock.tsx
│   │   ├── VizBlock.tsx               ← simple chart placeholder; real chart later
│   │   ├── SourcesBlock.tsx
│   │   ├── FollowUpsBlock.tsx
│   │   ├── RefineBlock.tsx
│   │   └── ErrorBlock.tsx
│   ├── SpotterChatProvider.tsx        ← Context + useReducer
│   ├── useSpotterChat.ts              ← hook to read state + dispatch actions
│   ├── chatReducer.ts                 ← reducer, action types
│   ├── SpotterPrompt.tsx              ← already exists, wired to provider
│   ├── QuickActionRow.tsx             ← already exists
│   ├── QuickAction.tsx                ← already exists
│   └── index.ts
├── runtime/
│   ├── schema.ts                      ← AnswerBlock, AnswerContent, AnswerChunk, ReasoningStep
│   ├── chatService.ts                 ← askSpotter() — canned + live (later) modes
│   ├── cannedResponses.ts             ← fixtures: keyword → AnswerChunk sequence
│   ├── systemPrompt.ts                ← placeholder string; designer will replace
│   └── index.ts                       ← re-exports

src/prototypes/Spotter/
├── index.tsx                          ← wraps SpotterChatProvider, switches welcome ↔ chat view
├── components/
│   └── SpotterHeader.tsx              ← already exists
└── data/
    └── mockData.ts                    ← already exists (chat list, custom spotters)
```

## Welcome ↔ chat view transition

Today the prototype renders `<SpotterWelcome>`. After the first user submit, the canvas swaps to `<ChatThread>` with the prompt anchored at the bottom. SpotterWelcome is the empty state.

Logic in prototype:
- If `messages.length === 0`: render `<SpotterWelcome>` (with internal SpotterPrompt)
- Else: render `<Vertical>` with `<ChatThread>` filling space + `<SpotterPrompt>` at bottom (sticky)

## Build sequence

Files written in this order so each step compiles and is testable. Pause for designer feedback after step 3.

1. **Schema + service skeleton.** `runtime/schema.ts`, `runtime/chatService.ts` (canned mode only), `runtime/cannedResponses.ts` (3–5 starter fixtures: a text-only answer, a text + viz, a refine, a follow-ups), `runtime/systemPrompt.ts` (placeholder).
2. **Provider + reducer.** `chatReducer.ts`, `SpotterChatProvider.tsx`, `useSpotterChat.ts`.
3. **Chat layout components.** `ChatThread.tsx`, `ChatMessage.tsx`, `UserBubble.tsx`, `AgentMessage.tsx`, `TypingIndicator.tsx`, `ReasoningBlock.tsx`, `AgentResponseBlock.tsx`. **Pause point.** Designer reviews thinking animation + message frames before block-renderers land.
4. **Block renderers.** `blocks/TextBlock.tsx`, `VizBlock.tsx` (simple stub: title + small SVG placeholder bar/line), `SourcesBlock.tsx`, `FollowUpsBlock.tsx` (clickable chips that call `send`), `RefineBlock.tsx`, `ErrorBlock.tsx`.
5. **Wire SpotterPrompt to provider.** Replace local state in prototype with `useSpotterChat`. Submit calls `send(value)`.
6. **Welcome ↔ chat transition** in `src/prototypes/Spotter/index.tsx`.
7. **Barrel updates.** `src/spotter/chat/index.ts`, `src/spotter/runtime/index.ts`.
8. **Verify.** `npm run typecheck`, `npm run build`, dev-server smoke test.

## What stays out of scope this round

- Real Anthropic call. `chatService` runs canned mode only. Live mode is a switch flip later.
- Real charts — `VizBlock` shows a styled placeholder until the designer specifies chart kit.
- Multi-chat thread switching — panel item selection is cosmetic until needed.
- Persistence — chat resets on remount.
- Voice input, file attachments, slash commands — not in DME, not in Spotter scope yet.
- Conversation history compaction — not needed at canned-fixtures size.

## What the designer will provide next

(Per the in-conversation note before building begins.)

1. **Figma screens** for visual layout and reference of:
   - Chat thread layout (in-thread answer cards, reasoning block design, follow-up chips)
   - Each block type (text, viz, sources, follow-ups, refine)
2. **Tool / response examples** for canned fixtures and to validate the schema shape.

After both arrive, I'll update component sizes, visual styles, and add fixtures matching the real response shapes.

## Open questions to settle later

- Final reasoning step labels (placeholder list above is generic).
- VizBlock chart engine — Muze, Recharts, custom SVG, or just a placeholder forever in the prototype?
- Source citation visual — pill row vs. expandable card.
- Follow-up chip placement — anchored to the answer, or floating above the prompt.
- Whether the prompt stays anchored at the bottom of the thread, or floats inside the welcome glow when the thread is empty. Screen 3 shows it sticky at bottom in chat-active state.
- Error recovery UX — retry button on the failed message vs. system-level toast.
- Avatar color cycling rule — first letter of active Custom Spotter is clear; color assignment per Spotter is TBD (deterministic from name hash, or per-Spotter override?).
- Where AnswerTitle lives — currently planned as a field on `AnswerContent` so any block sequence can carry one; alternative is to make it a property of the viz block specifically. Screen 3 only shows it for viz; need more screens to lock.

## Done criteria for this build

- Typing in the prompt and pressing enter creates a user message.
- An agent message appears with animated reasoning, then streams a canned response block-by-block in real time.
- Different prompt text triggers different canned fixtures (rough keyword routing).
- Welcome state shows when thread is empty; chat state takes over after first message.
- No `window._*` globals. All state is React. All visuals use Spotter DS components.
- TypeScript and build pass.

## Status — what shipped (2026-05-07)

All six build steps complete. Shipped under version `26.5.2a` plus follow-up
work on the same branch.

### Files shipped

```
src/spotter/runtime/
  schema.ts                 ← AnswerBlock union + AnswerChunk + ChatMessage + ReasoningTrace
  chatService.ts            ← askSpotter() async generator (canned + live mode shell)
  cannedResponses.ts        ← 4 fixtures (viz, text, refine, sources) with rich reasoning
  systemPrompt.ts           ← placeholder Spotter system prompt
  index.ts                  ← barrel

src/spotter/chat/
  ChatThread.tsx            ← scrollable list, auto-scroll on streaming updates
  MessageRow.tsx            ← role dispatcher
  UserBubble.tsx            ← single-row: avatar + text + timestamp
  AgentMessage.tsx          ← avatar + reasoning + response + feedback row
  TypingIndicator.tsx       ← spinner ring + "Analysing…"
  ReasoningBlock.tsx        ← collapsible, gray dots, brand-blue trigger when expanded,
                              "Worked for X seconds" suffix, embedded ToolcallCard
  AgentResponseBlock.tsx    ← block dispatcher
  blocks/
    TextBlock.tsx           ← streamed paragraph (markdown rendering deferred)
    VizBlock.tsx            ← slot model: chartSlot > iframe > data > placeholder.
                              Header tokens, chart/table toggle, expand modal,
                              configurable footer (Pin/Save/Download/Edit + Add to coaching).
                              See docs/2026-05-07-spotter-viz-block-behaviour.md
    SourcesBlock.tsx        ← citation pills
    FollowUpsBlock.tsx      ← clickable follow-up chips that call send()
    RefineBlock.tsx         ← clarification options that call send()
    ErrorBlock.tsx          ← typed error alert
  SpotterChatProvider.tsx   ← React Context + useReducer + AbortController
  useSpotterChat.ts         ← hook for { state, send, abort, clear }
  chatReducer.ts            ← AnswerChunk → ChatState reducer
  SpotterPrompt.tsx         ← controlled prompt; gradient border on focus

src/prototypes/Spotter/
  index.tsx                 ← wraps SpotterChatProvider, switches welcome ↔ chat view
  components/ChatCanvas.tsx ← chat-active layout: scrollable thread + sticky prompt + disclaimer
```

### Visual treatments locked

- Reasoning **collapsed by default** as "Show work ⌄" (gray); expands to brand blue.
- Step dots: gray (pending) → brand-blue pulsing (current) → gray (done).
- ToolcallCard collapsed by default with **"Show details ⌄"** brand-blue link on the right.
- "Worked for X seconds" footer appears once reasoning completes.
- Agent message ends with a **feedback row** ("Is this useful?" + thumbs up/down) when stage is done.
- VizBlock matches Figma node `146:37670`: tokens header (multi-row wrap), chart/table toggle, expand fullscreen modal, footer with Pin / Save / Download / Edit / + Add to coaching.
- Prompt gets a purple → blue gradient border on `:focus-within`.

### Schema additions since the original plan

```ts
// schema.ts deltas
export interface ReasoningStep {
  // ...existing fields...
  description?: string;
  toolcall?: ReasoningToolCall;
}
export interface ReasoningToolCall {
  id: string;
  icon?: string;
  title: string;
  input?: string;
  output?: string;
}
export interface ReasoningTrace {
  // ...existing fields...
  durationSeconds?: number;       // for "Worked for X seconds"
}
export type VizSource =
  | { type: 'iframe'; url: string; sandbox?: string; title?: string }
  | { type: 'data'; chartKind: VizChartKind; data: VizData }
  | { type: 'placeholder'; message?: string };
```

The block-data type names were renamed with a `Data` suffix
(`TextBlockData`, `VizBlockData`, etc.) to avoid colliding with the
component exports of the same name.

## Open follow-ups

- **Markdown rendering** in TextBlock — bullets, headings, inline tables, bold (per image 9). Deferred — fixtures still use plain text.
- **Real chart engine** in VizBlock — currently a styled SVG sketch. Real treatment lands with the AnswerCard build (see `docs/2026-05-07-spotter-answer-card.md`).
- **Live mode** in `chatService.ts` — currently a stub. Wire to `/api/chat` once the canonical Spotter system prompt arrives.
- **Multi-chat threads** — chat-history items in the panel are cosmetic. Persist + switch threads when product asks.
- **Per-message timestamp ticks** — UserBubble shows absolute "07:47 PM, 11/21/2023". Could swap to relative ("2m ago") later.
- **Reasoning step labels per fixture** — currently three generic labels per fixture path. Iterate when canonical labels land.
