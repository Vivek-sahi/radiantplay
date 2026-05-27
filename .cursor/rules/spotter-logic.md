---
description: Spotter chat logic — state machine, streaming chunk protocol, reducer behaviour. Loads when working on Spotter chat or runtime files.
globs: ["src/spotter/chat/**/*", "src/spotter/runtime/**/*", "src/prototypes/Spotter*/**/*"]
alwaysApply: false
---

# Spotter chat — logic and protocol

## State

```ts
interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  stage: 'sending' | 'thinking' | 'streaming' | 'done' | 'error';
  text?: string;                 // user role only
  reasoning?: ReasoningTrace;    // agent role only
  content?: AnswerContent;       // agent role only
  error?: string;
  createdAt: number;
}

interface ReasoningTrace {
  steps: ReasoningStep[];
  isDone: boolean;
  durationSeconds?: number;      // for "Worked for X seconds"
}

interface ReasoningStep {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'done';
  description?: string;
  toolcall?: ReasoningToolCall;
}
```

State lives in `<SpotterChatProvider>` via `useReducer`. **No window
globals.** Consumers read state and dispatch via `useSpotterChat()`.

## Streaming protocol — `AnswerChunk`

The wire format between the service and the reducer:

```ts
type AnswerChunk =
  | { kind: 'reasoning_start'; steps: { label: string }[] }
  | { kind: 'reasoning_step'; stepIndex; status: 'current' | 'done';
      description?; toolcall? }
  | { kind: 'reasoning_done'; durationSeconds? }
  | { kind: 'block_start'; block: AnswerBlock }
  | { kind: 'text_delta'; blockId; delta }
  | { kind: 'block_done'; blockId }
  | { kind: 'message_done' }
  | { kind: 'error'; message };
```

The exact same shape is used by **canned mode** (fixture playback) and
will be used by **live mode** (parsing SSE events from `/api/chat`).
Don't add modes that bypass this — keep the protocol single.

## Lifecycle of a turn

```
user types in SpotterPrompt
  └─ onSubmit(text)
     └─ useSpotterChat().send(text)
        ├─ dispatch SEND_USER       → push user message (stage='done')
        ├─ dispatch START_AGENT     → push agent message (stage='thinking', isStreaming=true)
        └─ for await chunk of askSpotter(...)
              └─ dispatch AGENT_CHUNK { chunk }
                    └─ reducer:
                       reasoning_start → reasoning = { steps[], isDone:false }, first step → 'current'
                       reasoning_step  → step status updates, next pending → 'current'
                                         (also folds optional description + toolcall)
                       reasoning_done  → all steps 'done', isDone=true, durationSeconds set;
                                         message stage → 'streaming'
                       block_start     → content.blocks.push(block), stage='streaming'
                       text_delta      → block.text += delta (in place; only for 'text' blocks)
                       block_done      → noop (block already populated)
                       message_done    → stage='done', isStreaming=false
                       error           → stage='error', isStreaming=false
```

`send()` cancels any in-flight stream first (only one agent message
streams at a time). Each call gets a fresh `AbortController`.

## Reducer (`chatReducer.ts`)

Pure function. Takes `ChatState` + `ChatAction` → new `ChatState`.

| Action | Effect |
|---|---|
| `SEND_USER` | Append user message (stage='done'). |
| `START_AGENT` | Append agent message (stage='thinking'), set `isStreaming = true`. |
| `AGENT_CHUNK` | Map the matching message through `mergeChunk(message, chunk)`. Set `isStreaming = false` when chunk is `message_done` or `error`. |
| `AGENT_ERROR` | Mark the matching message as error, set `isStreaming = false`. |
| `CLEAR` | Reset to empty state. |

`mergeChunk` is the per-message folding function — it's the single
place that interprets each chunk kind. Add new chunk kinds there.

## Service modes

```ts
askSpotter({ messages, signal, mode = 'canned' })
  → AsyncGenerator<AnswerChunk>
```

- **canned** (default): yields chunks from `pickCannedResponse(userText)`
  fixtures with `setTimeout` delays. Aborted by `signal.abort()`.
- **live** (stub): currently emits an error chunk. Implement by POSTing
  to `/api/chat` and parsing SSE events into the same `AnswerChunk`
  shape. Keep the chunk yields identical so the reducer doesn't change.

## Picker rules (`pickCannedResponse`)

```
churn|customer|retention|account|source|cite     → sourcesFixture
^(analyze|help me|figure|maybe|not sure)         → refineFixture
^(hi|hello|hey|thanks|thank you)                 → textFixture
default                                          → vizFixture
```

Viz is the **default fallback** so any random prompt produces a viz
answer (the most common case for the prototype).

## Reasoning rendering rules

`<ReasoningBlock>` has three visual states tied to the message lifecycle:

| Lifecycle | Visual state | What renders |
|---|---|---|
| `stage === 'thinking' \|\| 'streaming'` | **Semi-collapsed** | Single row showing the **current step** label (status: `'current'`) upfront. Clicking expands the trace to show all steps completed so far + the current one. The pending steps remain hidden until they activate. |
| `stage === 'done'`, immediately after | **Auto-expanded → collapsing** | Full trace visible briefly, then auto-collapses 600ms after `reasoning.isDone === true`. |
| `stage === 'done'`, settled | **Collapsed** | A single **"Thought for X seconds"** trigger (uses `reasoning.durationSeconds`). Clicking re-expands the full trace. |

Override rule: a user click on the trigger overrides the auto behaviour for the rest of that message's lifetime.

**Visual tokens:**
- Trigger colour is brand-blue when expanded, secondary when collapsed
- Step dot colour: pending = `border-default`, current = `content-brand` (pulsing), done = `content-tertiary` (gray)
- `ToolcallCard` inside a step is **collapsed by default** with a brand-blue "Show details ⌄" link
- "Worked for X seconds" footer appears at the end of the trace when `reasoning.durationSeconds` is set (and matches the final "Thought for X seconds" trigger label)

**Why the semi-collapsed state during streaming:** showing all pending steps upfront commits to a structure that may shift as the agent discovers new steps. Showing only the current step keeps the surface honest and reduces visual jitter as new steps activate.

## Feedback row

`<FeedbackRow>` renders inside `AgentMessage` only when:
- `stage === 'done'`
- `content.blocks.length > 0` (don't show on empty / error messages)

Currently local-only state (clicked thumb stays toggled). No telemetry
yet.

## When you modify the protocol

Always update in this order so canned mode keeps working:

1. `runtime/schema.ts` — add the type / chunk variant.
2. `chat/chatReducer.ts` — handle the new chunk in `mergeChunk`.
3. `runtime/cannedResponses.ts` — emit the new chunk in at least one
   fixture so it's visually testable.
4. `chat/AgentResponseBlock.tsx` (or wherever it surfaces) — render it.
5. Re-run `npm run build && npm run typecheck`.

## Block-data type naming

Block data interfaces use a `Data` suffix to avoid colliding with the
React component of the same name:

| Data interface       | Component (renderer)  |
|----------------------|-----------------------|
| `TextBlockData`      | `TextBlock`           |
| `VizBlockData`       | `VizBlock`            |
| `SourcesBlockData`   | `SourcesBlock`        |
| `FollowUpsBlockData` | `FollowUpsBlock`      |
| `RefineBlockData`    | `RefineBlock`         |
| `ErrorBlockData`     | `ErrorBlock`          |

Same convention for the role dispatcher: schema's `ChatMessage` type
vs. the `MessageRow` component (renamed for the same reason).
