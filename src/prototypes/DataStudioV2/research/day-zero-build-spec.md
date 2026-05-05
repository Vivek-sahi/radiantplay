# Day Zero — Agent Connection Flow: Build Spec

_Build-ready. This is the implementation contract for the Day Zero agentic path._
_Companion to `day-zero-journey.md` (narrative) and `day-zero-build-spec.md` (this file, implementation)._

---

## What we're building

The agentic flow that fires when a user enters from DayZeroOverview and lands in the
Workspace. From the moment they hit Enter on the overview, the agent guides them through:
connecting a warehouse → validating it → selecting schemas → stating their use case →
answering 2 clarifying questions → confirming the model → build fires.

Everything after "build fires" is the existing `build_project` script. No changes to that.

---

## Entry: How we get here

1. User is on `DayZeroOverview`. They click the Snowflake card — the PromptBar
   pre-fills with a prompt (e.g. "Build a model to track campaign ROI").
2. User hits Enter.
3. `handleOverviewPromptSubmit` in `index.tsx` creates a new project and navigates
   to the `'workspace'` view with `journeyContext: 'day_zero'` and
   `warehouseTarget: 'snowflake'` passed as part of ProjectState or a new prop.
4. AgentPanel receives `isDayZero: true` prop.
5. On mount, AgentPanel **auto-fires** the Day Zero sequence (does not wait for user input).
6. The user's prompt from step 2 appears immediately in the chat as a user message,
   then the agent starts working.

**Left canvas during the entire Day Zero pre-build sequence:** unchanged from today's
empty project state. Do not modify it. A placeholder update is deferred.

**Project name during the sequence:** "Untitled Project" (existing behavior, unchanged).

---

## Architecture: Day Zero state machine

Add a `dayZeroPhase` state to AgentPanel:

```typescript
type DayZeroPhase =
  | 'discover'          // auto-fires on mount: working steps for discovery
  | 'connection_prompt' // agent asks "connect Snowflake?" — user sees chips
  | 'credential_form'   // inline credential form rendered in chat
  | 'validating'        // agent works: verify → fetch schemas → established
  | 'schema_select'     // agent lists schemas, user picks one
  | 'use_case_prompt'   // agent asks "what would you like to build?"
  | 'clarify_q1'        // first clarifying question with chip answers
  | 'clarify_q2'        // second clarifying question with chip answers
  | 'confirm_build'     // agent synthesises + asks "should I build?"
  | 'done'              // build_project script has fired — back to normal flow
```

When `isDayZero: true` prop is set and `dayZeroPhase !== 'done'`, `processText` routes
all user input through `handleDayZeroInput(phase, userText)` instead of the normal
`matchScript` path. After phase `'done'`, normal `matchScript` routing resumes.

---

## Phase-by-phase spec

### Phase 1 — Discover (auto-fires on mount)

**Trigger:** `useEffect` on mount when `isDayZero === true`.

**Agent working steps** (existing shimmer pattern, `stepDelay: 800`):
```
1. "Reading your request…"
   detail: <user's prompt text, truncated to 120 chars>

2. "Checking for warehouse connections…"
   detail: "Querying your ThoughtSpot account for configured connections."

3. "No connections found"
   detail: "Your account has no active warehouse connections."
```

After steps collapse, agent shows a **response message** and **interactive chips**
(new field on AgentMessage: `interactiveChips`):

> **Agent message:**
> "I couldn't find any warehouse connections in your account.
> Since you're working with Snowflake, let me help you set that up — it should only
> take a minute."

> **Chips (interactive):**
> `[Yes, connect Snowflake]` `[Skip for now]`

Clicking "Yes, connect Snowflake" → advances to phase `credential_form`.
Clicking "Skip for now" → dismisses Day Zero mode (sets `dayZeroPhase: 'done'`),
shows: "No problem — you can connect a warehouse anytime from the Connections tab."

---

### Phase 2 — Credential form

**Trigger:** user clicked "Yes, connect Snowflake" chip.

User's chip click appears as a user message: "Yes, connect Snowflake"

Agent shows a **response message** immediately (no working steps for this phase):

> **Agent message:**
> "Here are the credentials I'll need for Snowflake. I've defaulted to
> Username / Password — the most common setup."

Below the message text, the agent renders an **inline CredentialFormCard**
(new component — see Component spec below). The card is part of the same agent
message bubble, not a separate card.

After the form appears, `dayZeroPhase` advances to `'credential_form'`.
PromptBar behavior is unchanged — no locking, no modifications.

---

### Phase 3 — Validation (auto-fires on form submit)

**Trigger:** user clicks "Connect to Snowflake" button in the CredentialFormCard.
Form submission is mocked — always succeeds after a 2-second delay.

User's action does NOT appear as a chat message (it's a form submit, not text).
A brief "Connecting…" spinner inside the form button confirms the click was registered.

**Agent working steps** (`stepDelay: 800`, `autoComplete: true`):
```
1. "Verifying credentials…"
   detail: "Authenticating with Snowflake using the provided credentials."

2. "Fetching available schemas…"
   detail: "Reading schema metadata from your Snowflake account."

3. "Connection established"
   detail: "Successfully connected to Snowflake. Found 3 schemas."
```

After steps collapse, agent shows **outcomeCard** (existing pattern):
```
title: "Connected to Snowflake"
note:  "3 schemas available · Latency ~120ms"
chips: ["View connection →"]   ← links to Connections page (existing nav)
```

Then immediately (no user input), agent shows a second **response message**
with **schema list** (inline, not a new card type):

> **Agent message:**
> "Here are the schemas I found in your Snowflake account. Select the one
> that contains the data you want to work with:"

> **Schema chips (interactive, single-select):**
> `[analytics]` `[marketing]` `[raw_data]`

`dayZeroPhase` advances to `'schema_select'`.

---

### Phase 4 — Schema selected

**Trigger:** user clicks a schema chip (demo: "marketing").

User's chip click appears as a user message: "marketing"

Agent shows response message immediately:

> **Agent message:**
> "Got it — importing the `marketing` schema. You'll be able to browse all its
> tables and columns in the **Data Browser** at any time."

Then immediately:

> **Agent follow-up message:**
> "Now, what would you like to build? What's the business question you're trying
> to answer?"

`dayZeroPhase` advances to `'use_case_prompt'`.
PromptBar re-enables (user can type their use case).

---

### Phase 5 — Use case entered

**Trigger:** user types their use case and hits Enter.
(Demo input: "Build a model to track campaign ROI by channel and region")

Note: the initial prompt from DayZeroOverview was a generic warehouse intent
("I want to build a data model from Snowflake") — not a specific use case.
This is the first time the user states their actual business question.

User's message appears in chat as normal.

Agent shows **working steps** (short, 3 steps, `stepDelay: 600`):
```
1. "Parsing your use case…"
   detail: <user's typed use case>

2. "Identifying relevant metrics and dimensions…"
   detail: "ROI, spend, channel, region — cross-referencing the marketing schema."

3. "Preparing clarifying questions…"
   detail: "Two quick questions before I start."
```

After steps collapse, agent shows **first clarifying question**:

> **Agent message:**
> "A couple of quick questions before I start building:"
>
> **Q1: "Who is the primary audience for this model?"**

> **Answer chips (interactive):**
> `[Marketing team]` `[Leadership / execs]` `[Whole org]`

`dayZeroPhase` advances to `'clarify_q1'`.

---

### Phase 6 — Q1 answered

**Trigger:** user clicks a Q1 chip (demo: "Marketing team").

User's chip click appears as a user message: "Marketing team"

Agent shows **second clarifying question** immediately:

> **Agent message:**
> "Should I include ad spend data alongside ROI, or just the ROI metrics?"

> **Answer chips (interactive):**
> `[ROI + spend]` `[ROI only]`

`dayZeroPhase` advances to `'clarify_q2'`.

---

### Phase 7 — Q2 answered + build confirmation

**Trigger:** user clicks a Q2 chip (demo: "ROI + spend").

User's chip click appears as a user message: "ROI + spend"

Agent shows **synthesis message** with **single confirmation chip**:

> **Agent message:**
> "Got it. Here's what I'll build:"
>
> **Campaign ROI Model** — from the `marketing` schema, tracking return on ad spend
> by channel and region, including spend data alongside ROI metrics. Built for the
> marketing team. Will answer questions like: *"Which channels drove the highest ROI
> last quarter?"* and *"How does spend efficiency vary by region?"*

> **Confirmation chip:**
> `[Yes, build it →]`

`dayZeroPhase` advances to `'confirm_build'`.

---

### Phase 8 — Build fires

**Trigger:** user clicks "Yes, build it →" chip.

User's chip click appears as a user message: "Yes, build it"

`dayZeroPhase` sets to `'done'`. Then immediately calls `runFlow('build_project', ...)`.
The existing `build_project` script takes over with no modifications.

---

## New component: CredentialFormCard

**File:** `components/CredentialFormCard.tsx`

Renders inside an agent message bubble — not a modal, not a separate card.
Visual language: same as `outcomeCard` — `background-subtle` fill, `border-default`
border, `radius-md`, Radiant `TextInput` components throughout.

**Fields:**
```
Auth method:    [Username / Password ▼]  ← static Select, always shows this option,
                "Change method" is decorative — shows the selector but changing it
                has no effect in the prototype. Makes it feel real without wiring variants.

Account ID:     TextInput   placeholder: "xy12345.us-east-1"   required
Username:       TextInput   placeholder: "your_username"        required
Password:       TextInput   type="password"  placeholder: "••••••••"  required
Warehouse:      TextInput   placeholder: "COMPUTE_WH"           required
Database:       TextInput   placeholder: "Optional"             optional (shown greyed)
```

**Submit button:** `Button` variant="primary" label="Connect to Snowflake"
- On click: button shows brief spinner (disable the button, show LoadingIndicator inline)
- After 2000ms: calls `onSubmit()` callback → parent (AgentPanel) fires Phase 3

**Props:**
```typescript
interface CredentialFormCardProps {
  onSubmit: () => void;
}
```

No form validation needed — this is a prototype, always succeeds.

---

## New AgentMessage fields

Add two optional fields to the `AgentMessage` interface:

```typescript
interactiveChips?: { label: string; value: string }[];
// Rendered as clickable Chip components below the message content.
// Clicking a chip calls processText(value) as if the user typed/sent `value`.
// `label` is the display text; `value` is the text sent as input.
// After a chip is clicked, all chips in that message become disabled (greyed out),
// and the clicked chip shows a selected state.

credentialForm?: boolean;
// If true, renders CredentialFormCard below the message content.
// Only one message should ever have credentialForm: true at a time.
```

---

## New SCRIPTS entries

Add these to the `SCRIPTS` map in AgentPanel.tsx. They cover the working-step
phases that use the existing `runFlow` animation pattern.

### `day_zero_discover`
```typescript
day_zero_discover: {
  steps: [
    { label: 'Reading your request…', detail: '' },           // detail overridden by userText
    { label: 'Checking for warehouse connections…', detail: 'Querying your ThoughtSpot account for configured connections.' },
    { label: 'No connections found', detail: 'Your account has no active warehouse connections.' },
  ],
  duration: '~2s',
  proposal: '',       // not used — Day Zero controller shows its own response
  execution: '',      // not used
  nextStep: 'empty',  // no buildStep change
  autoComplete: false,
  stepDelay: 800,
},
```

### `day_zero_validate_connection`
```typescript
day_zero_validate_connection: {
  steps: [
    { label: 'Verifying credentials…', detail: 'Authenticating with Snowflake using the provided credentials.' },
    { label: 'Fetching available schemas…', detail: 'Reading schema metadata from your Snowflake account.' },
    { label: 'Connection established', detail: 'Successfully connected to Snowflake. Found 3 schemas.' },
  ],
  duration: '~3s',
  proposal: '',
  execution: '',
  nextStep: 'empty',
  autoComplete: true,
  stepDelay: 800,
  outcomeCard: {
    title: 'Connected to Snowflake',
    chips: ['View connection →'],
    note: '3 schemas available · Latency ~120ms',
  },
},
```

### `day_zero_parse_use_case`
```typescript
day_zero_parse_use_case: {
  steps: [
    { label: 'Parsing your use case…', detail: '' },          // detail overridden by userText
    { label: 'Identifying relevant metrics and dimensions…', detail: 'ROI, spend, channel, region — cross-referencing the marketing schema.' },
    { label: 'Preparing clarifying questions…', detail: 'Two quick questions before I start.' },
  ],
  duration: '~2s',
  proposal: '',
  execution: '',
  nextStep: 'empty',
  autoComplete: true,
  stepDelay: 600,
},
```

---

## AgentPanel changes summary

### New state
```typescript
const [dayZeroPhase, setDayZeroPhase] = useState<DayZeroPhase | null>(
  isDayZero ? 'discover' : null
);
const [clarifyAnswers, setClarifyAnswers] = useState<{ q1?: string; q2?: string }>({});
```

### New prop
```typescript
isDayZero?: boolean;
```

### Mount effect
```typescript
useEffect(() => {
  if (!isDayZero) return;
  // Show user's initial prompt as a message, then fire discover sequence
  setMessages([{
    id: `u-${Date.now()}`, type: 'user',
    content: initialPrompt ?? 'Build a model to track campaign ROI',
  }]);
  runDayZeroDiscover();
}, []);
```

### `processText` gating
At the top of `processText`, before `matchScript`:
```typescript
if (dayZeroPhase && dayZeroPhase !== 'done') {
  handleDayZeroInput(input);
  return;
}
```

### `handleDayZeroInput(input: string)`
Routes based on `dayZeroPhase`. Each case:
- Appends user message to chat
- Fires the right agent response / working steps
- Advances `dayZeroPhase`

See Phase-by-phase spec above for exact text and transitions.

### Interactive chip click handler
Add an `onChipClick(value: string)` handler. Calls `processText(value)`.
Disables all chips in that message after click (prevents double-click).

---

## New prop threading: index.tsx → Workspace → AgentPanel

`index.tsx` already passes `journeyContext: 'day_zero'` when navigating from
DayZeroOverview. Thread this through to AgentPanel as `isDayZero`:

```typescript
// In Workspace (or wherever AgentPanel is instantiated):
<AgentPanel
  ...existingProps
  isDayZero={project.context?.journey === 'day_zero' && dayZeroPhase !== 'done'}
  initialPrompt={project.context?.initialPrompt}
/>
```

`initialPrompt` = the text the user typed in DayZeroOverview's PromptBar.
Store it on ProjectState.context when `handleOverviewPromptSubmit` fires.

---

## File change list

| File | What changes |
|------|-------------|
| `components/AgentPanel.tsx` | `isDayZero` prop, `dayZeroPhase` state, `clarifyAnswers` state, `handleDayZeroInput`, `processText` gating, 3 new SCRIPTS, `interactiveChips` + `credentialForm` on `AgentMessage`, chip click handler, mount effect |
| `components/CredentialFormCard.tsx` | **New file** — inline credential form component |
| `index.tsx` | Store `initialPrompt` on ProjectState.context when navigating from DayZeroOverview; thread `isDayZero` + `initialPrompt` to AgentPanel |
| `data/mockData.ts` | No changes needed |
| `Overview.tsx` | **Not touched** |
| `DayZeroOverview.tsx` | Minor: pass prompt text into `handleOverviewPromptSubmit` so it's stored on context |

---

## What is NOT changing

- `build_project` SCRIPT — unchanged, fires identically
- All existing SCRIPTS — no modifications
- Left canvas / canvas loading state — deferred
- Project name — stays "Untitled Project" throughout the connection flow
- `Overview.tsx` — never touched (teammate's file)
- Test mode / coaching flow — unaffected

---

## Build order (recommended)

1. Add `interactiveChips` and `credentialForm` fields to `AgentMessage` type + render them in the message renderer (no logic yet — just visual)
2. Build `CredentialFormCard.tsx` standalone
3. Add `dayZeroPhase` state + `handleDayZeroInput` skeleton (all phases, stubbed)
4. Wire Phase 1 end-to-end: mount → discover working steps → connection prompt message + chips → chip click → Phase 2
5. Wire Phase 2–3: credential form → submit → validate working steps → schema chips
6. Wire Phase 4–5: schema click → use case prompt → user types → parse working steps → Q1
7. Wire Phase 6–7: Q1 chip → Q2 chip → synthesis + confirm chip
8. Wire Phase 8: confirm chip → `runFlow('build_project')`, `dayZeroPhase: 'done'`
9. Thread `initialPrompt` from DayZeroOverview through to AgentPanel
10. Smoke test full sequence start-to-finish; then `npm run build`
