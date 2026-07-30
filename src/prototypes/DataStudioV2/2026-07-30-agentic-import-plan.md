# Importing the agentic UX from Suraj's repo — step by step

_Source: `surajboro-ts/spotter-readiness-vision`, `src/prototypes/_agentic` (29 files, ~2,000 lines) and `src/prototypes/Calibration/data.ts`._

**Governing rule:** our canvas is the newer one, his agent panel is. Take his cards and data, keep our canvas, rebuild anything that reaches into a canvas.

**The architecture in one line:** the agent works in the panel; **the canvas visualises the result.** Every agent action ends by committing objects onto our canvas.

---

## Compatibility — checked, and it's good

Both repos are Radiant Play forks, so his components import only:

- relative paths inside `_agentic`
- `@components/Button`, `@tokens/colors`, `@tokens/spacing`, `@tokens/typography` — **all present in ours**
- CSS custom properties (`--font-size-md`, `--duration-fast`, `--easing-standard`, …) — **all defined in our `src/styles/tokens.css`**

**One real dependency to break:** `BuildFeedbackCard`, `AgentPanel` and `StopClarifyCard` import `ClarifyingCard` from his `OneClickModelGeneration*` prototypes. Either port `ClarifyingCard` too, or drop those three on the first pass (we don't need them until the clarify beat).

---

## Step 0 — Mock data first (blocks everything)

The canvas seeder reads `TABLE_COLS[tableName]`. **The agent cannot place a table that doesn't exist there**, so no amount of agentic wiring works until the data lands.

Add to `data/mockData.ts` — `TABLE_COLS` entries *and* `MOCK_DATA` rows:

`contracts` · `arr_snapshot` · `billing_events` · `usage_events` · `feature_adoption`
(`accounts` and `jira_cs_tickets` already exist.)

---

## Step 1 — Copy the component library

Into `src/prototypes/DataStudioV2/components/agentic/` (prototype-local — house rule keeps prototype components out of `src/components/`).

### The filter: take agentic patterns, not product decisions

Zero DOM coupling was the wrong test on its own. Some of his components are technically portable but encode **product decisions we've moved past** — and our canvas concepts are the newer ones. Two tiers:

**Tier 1 — lift as-is. Domain-neutral conversation grammar, encodes nothing about tables or columns, so it cannot be stale:**

| Component | Whole contract |
|---|---|
| `ToolcallCard` | `{ id, title, input, output, status, isVisible }` |
| `ReasoningBlock` | `{ header, steps[{n, name, text, dotState, toolcall?}], isDone, inlineText }` |
| `PlanStepsCard` | `{ goal, steps[{label, caption, state, reasoningData?}] }` |
| `NextActionChips` | `{ chips[{text, variant}], onChipClick }` |
| `ConfidenceBadge` | `{ pct }` |
| `TypingIndicator` | `{ label }` |

Take each with its `.module.css`. **This is the actual import** — the vocabulary for reasoning, tool calls, staged autonomy and follow-ups.

**Tier 2 — take the interaction, rewrite the payload against our types:**

- **`SuggestionCard`** — the *pattern* (checkbox list of proposals → Add / Refine → commit) is what we want. The payload isn't:
  - `ColumnGroup` — **drop entirely.** We add all columns by default; column suggestion is a step the product removed.
  - `FormulaSuggestion` — **drop.** S14's point is that Maya writes the formula herself.
  - `TableSuggestion` / `JoinSuggestion` — keep the shape, but note his table proposal has no notion of a transformation pipeline. Ours does (`CanvasGroup.steps[]`). Fine at proposal stage; the card that *lands* must be ours.
- **`JoinDiagram`** — `{ leftTable, leftCol, cardinality, rightTable, rightCol }`. Portable; our joins also carry `joinType`.

**Skip entirely:** `AgentMessage` / `UserBubble` / `AgentResponseBlock` (we have thread chrome) · `VersionCard` (no versioning beat) · `StopClarifyCard` / `BuildFeedbackCard` (need `ClarifyingCard`) · his `AgentPanel` (8 DOM refs, and ours is wired to our flows).

**Don't take:** his `AgentPanel.tsx` (8 DOM refs, and ours is wired to our flows and our canvas). We keep our panel and render his cards inside it.

**Defer:** `StopClarifyCard`, `BuildFeedbackCard`, `VersionCard` — the first two need `ClarifyingCard`, and none are needed before the clarify/versioning beats.

Gate: `npx tsc --noEmit` shows no *new* errors, and `npm run build` passes.

---

## Step 2 — The canvas commit seam ⚠️ the one real piece of architecture

`SuggestionCard` already exposes the exact callback we need:

```ts
onAdd: (suggType: SuggType, checkedItems: unknown[]) => void
```

And his payloads map almost 1:1 onto ours:

| His `TableSuggestion` | Ours |
|---|---|
| `{ id, name, desc, pct, checked }` | `name` → `initialTables[]`; `pct` → the confidence badge |

| His `JoinSuggestion` | Our `InitialCanvasJoin` |
|---|---|
| `leftTable` / `leftCol` | `table1` / `col1` |
| `rightTable` / `rightCol` | `table2` / `col2` |
| `cardinality` | `cardinality` |
| — | `joinType` (needs a default — `inner`) |

**The problem:** today the only way objects reach the canvas is `initialTables` / `initialJoins`, seeded by a `useEffect` that calls `setGroups(seededGroups)` — a **replace**, keyed on `[initialTables, initialJoins]`. The demo needs tables to land **incrementally**: three from Snowflake, then two from Databricks, then a CSV, then Jira. A replace-seeder wipes the canvas each time.

**So add append-semantics entry points on `ModelCanvas`:**

- `agentAddTables(names: string[])` — append `CanvasGroup`s at the next free `NODE_POSITIONS` slot, reusing the existing seeding logic for `steps` / `cols`
- `agentAddJoins(joins: InitialCanvasJoin[])` — append to `canvasJoins`, resolving `table1Id` by name as the seeder already does

Leave the existing seeder alone — it's load-bearing for the MRD flow.

Then wire `onAdd` → these. **That single wire is "the canvas visualises agent work."**

---

## Step 3 — Extend our message model

Our thread renders `type: 'working'` with a label/detail step list. His model is a discriminated union (`user | typing | agent | plan-steps | …`) where an agent turn carries `reasoning` *and* a typed `response` payload.

Add message kinds to our `AgentMessage` type so a scripted step can emit a **suggestion card**, a **reasoning block**, or a **tool call** — not just a progress line. This is the difference between reading as agentic and reading as a spinner.

Keep our `SCRIPTS` sequencing spine. We are adding vocabulary, not replacing the engine.

---

## Step 4 — Script the flow, beat by beat

Each is a new entry in `SCRIPTS`, played by the existing `runFromScratchSteps`.

**4a · User describes the data → agent responds** (S2)
Agent asks which connections to look at. Render `NextActionChips` with Snowflake / Databricks / Salesforce / Postgres.

**4b · Warehouse 1 — Snowflake** (S3)
`ReasoningBlock` ("scanning connection…") → `SuggestionCard(suggType: 'tables')` with `contracts` 96 · `arr_snapshot` 94 · `accounts` 91 · `billing_events` 38 (unchecked). `ConfidenceBadge` renders `pct`; hover shows the reasoning string.
→ **`onAdd` → `agentAddTables` → three cards appear on canvas.**

**4c · Warehouse 2 — Databricks, auto-advance** (S4)
No new user prompt — the script continues on its own. `PlanStepsCard` carries the multi-source goal with done/active/pending, so the auto-advance is legible rather than mysterious. `usage_events` 95 · `feature_adoption` 88.
→ **two more cards land.**

**4d · CSV upload** (S5)
Agent asks for the QBR sheet; existing CSV upload + parse path.
→ **card lands.**

**4e · Caching + hand-back** (S6–S7)
Agent declares the long job, progress moves to a background chip, user navigates away, toast returns them.

**4f · Agent suggests joins** (S7)
`SuggestionCard(suggType: 'joins')` + `JoinDiagram` — his join pattern shows left/right table, columns and cardinality.
→ **`onAdd` → `agentAddJoins` → join edges draw on our canvas.**

---

## Step 5 — Jira: user instructs, agent responds (S8–S10)

The genuinely new pattern — a source with **no connection**.

1. **Reach it** — agent asks inline for site URL, username, API token (masked, pre-filled for the demo). Render as `ToolcallCard`.
2. **Scope it** — project key, issue types, date range, fields; agent proposes defaults, user accepts.
3. **Write it** — *"I've written a script to pull this"* with two actions: **Review script** / **Run**.
4. Review opens the notebook. `jira_cs_tickets` already has a `priority` column, so the `priority in (P1, P2)` edit has something real to bite on.
   → **fourth table lands, joined.**

⚠️ Verify our notebook genuinely supports edit-and-rerun with a changing row count. The script calls this out: if it isn't real, the "not a black box" claim is unsupported.

---

## Step 6 — Spreadsheet formula (S13–S14)

Canvas → Spreadsheet toggle exists. Two things to get right:

- The **formula bar must read as distinct from the agent prompt bar** — this beat is the human doing it, not the agent.
- Values populate down the column as she finishes.

Optional: `SuggestionCard(suggType: 'formulas')` if we want the agent to offer a starting point — but the script's point is that only Maya can define this, so a bare editor may be truer.

---

## Step 7 — AI readiness (S15–S18)

**Port the data, rebuild the spotlighting.**

- **Take `PILLARS`** — Physical (22 checks) / Semantic (10) / For Spotter (14), each with prereq, cost label, last-run and three plain-language points. This *is* S15's "three layers checking in sequence."
- **Take the `Issue` model + the 12 findings** — including the ones we lack: fan-out (*"Invoices join to orders as one-to-many"*), ambiguous names (*"Two 'amount' columns are ambiguous"*), and metric definition (*"'Average Deal Size' counts rows, not orders"*). Re-point to the churn scenario.
- **Remap `FixTarget`** — his `tab: 'tables' | 'columns' | 'formulas'` → our Canvas/Columns views (we have no formulas tab); his `FACT_SALES_ORDERS.amount`-style names → ours.
- **Do NOT port** `CanvasFixOverlay` (20 DOM refs), `FixWalkthrough` (6), `fixCanvas.ts` (5). They locate rows through CSS classes *his* canvas stamps (`dmecol-…`, `dmeformula-…`). Rebuild spotlighting against our nodes — we already have `data-block-id`.

His "For Spotter" pillar grades `correct | incorrect | oos` — **the same vocabulary our AIRS tuning already uses**, so the grading flow should graft cleanly.

---

## Order of work

| # | Step | Depends on | Parallel-safe |
|---|---|---|---|
| 0 | Mock data | — | ✅ start here |
| 1 | Copy components | — | ✅ |
| 2 | Canvas commit seam | 1 | — |
| 3 | Message model | 1 | — |
| 4 | Scripts 4a–4f | 0, 2, 3 | — |
| 5 | Jira beat | 4 | — |
| 6 | Spreadsheet formula | 0 | ✅ independent |
| 7 | AI readiness | 0 | ✅ independent |

Steps **0, 1, 6 and 7** can run in parallel across people today. Steps **2 → 3 → 4 → 5** are a chain and want one owner.

**Collision warning:** steps 2, 3 and 4 all touch `AgentPanel.tsx` and `ModelCanvas.tsx`. Same owner, or strict sequencing.
