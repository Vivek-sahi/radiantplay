# Demo state evaluation — script → agent → source

_Requirement-first walk of the run-of-show, state by state. For each: what the script needs, what the agent has to do, what we already have, and what (if anything) to cherry-pick from `surajboro-ts/spotter-readiness-vision`._

**Verdicts:** `HAVE` = works, may need re-pointing · `REPOINT` = exists, wrong scenario · `PORT` = take from his repo · `BUILD` = new · `VERIFY` = believed present, not confirmed end-to-end

---

## Two findings that reframe the work

**1. We already have an agent-script engine.** `runFromScratchSteps` (`AgentPanel.tsx:2253`) plays a `SCRIPTS[key]` entry as timed steps with `running`/`done` states, a duration, a step delay, and an abort ref. Four flows exist: `scan_multi_source`, `scratch_parse_use_case`, `scratch_generate_plan`, `execute_pendo_fetch`.

So hardcoding the demo conversation means **adding SCRIPTS entries**, not building an engine. That's a much smaller job than it looked.

**2. What we lack is rendering vocabulary, not sequencing.** Our scripted step renders as a `working` message with a label/detail list. His `_agentic` library renders reasoning blocks, tool calls, and *typed suggestion payloads* (`TableSuggestion`, `JoinSuggestion`, `FormulaSuggestion`, `ColumnGroup`). That gap is exactly where the demo's credibility lives.

Rule of thumb for cherry-picking: **keep our sequencing spine, take his rendering vocabulary, take his readiness content.**

---

## Beat 1 — The stakes (0:00–0:30)

| State | Script needs | Agent does | We have | Pick | Verdict |
|---|---|---|---|---|---|
| **S1** | Empty canvas, centred prompt, cursor. Type-on animation, then Enter — *no fake button* | Nothing yet — accepts input | Overview hero prompt. Starting screen becomes Data Workspace's empty screen, renamed Data Studio | — | `BUILD` (small) |

---

## Beat 2 — The agent reads her connections (0:30–1:40)

| State | Script needs | Agent does | We have | Pick | Verdict |
|---|---|---|---|---|---|
| **S2** | Agent asks *"Which of your connections should I look at?"* + lists Snowflake, Databricks, Salesforce, Postgres | Clarifying question with selectable options | `ConnectionsPage`, `ConnectionPill`. No clarify-with-options pattern in the agent thread | `NextActionChips`, `clarify` suggType, `StopClarifyCard` | `PORT` |
| **S3** | Ranked tables w/ confidence + **hover reasoning**. `contracts` 96 · `arr_snapshot` 94 · `accounts` 91 · `billing_events` 38 *left unchecked* | Reads a scoped connection, ranks, explains | **Built** — `AgentPanel.tsx:242–244` has `confidence` + `reasoning` per table. Wrong scenario (orders/campaigns/users, marketing_db) | `ConfidenceBadge`, `SuggestionCard(TableSuggestion)` for fidelity | `REPOINT` (+ optional `PORT`) |
| **S4** | **Auto-advance to Databricks, no new prompt.** `usage_events` 95 · `feature_adoption` 88 | Sequences to the next source unprompted — script calls the auto-advance "itself the point" | SCRIPTS engine can sequence steps; no multi-source auto-advance | `PlanStepsCard` (goal + done/active/pending, per-step reasoning) | `BUILD` on ported card |
| **S5** | CSV drag-drop, columns parsed and typed on the fly | Asks for the sheet, parses | CSV upload + caching | — | `REPOINT` |
| **S6** | *"I'll need to cache them… you can carry on."* Progress → background chip. She navigates away | Declares a long job, releases the user | Caching modal + cache flow | — | `BUILD` (background chip + navigate-away) |
| **S7** | Toast *"cached and ready"*. Canvas opens, agent **has already proposed joins**. Lines draw. SQL icon | Acts while she's away; proposes on return | Join edges, drag-to-connect — but user-initiated | `JoinDiagram`, `SuggestionCard(JoinSuggestion)` | `PORT` + `BUILD` |

---

## Beat 3 — The data that was never a data source (1:40–2:40)

| State | Script needs | Agent does | We have | Pick | Verdict |
|---|---|---|---|---|---|
| **S8** | Jira site URL, username, API token (masked). **Pre-filled** — no live credential typing | Asks inline for what it needs to reach a system with no connection | `NewConnectionPage` is Snowflake-shaped and assumes a connection exists | `ToolcallCard` framing | `BUILD` (new pattern) |
| **S9** | Scope: project key, issue types, date range, fields. Agent proposes defaults; she accepts | Proposes a sensible scope | — | `SuggestionCard`, `NextActionChips` | `BUILD` |
| **S10** | *"I've written a script to pull this."* Two actions — **Review script** / **Run** | Writes code, offers inspection before execution | Python blocks, code editor, run, Fix-with-AI | `ToolcallCard`, `BuildFeedbackCard` | `PORT` + `BUILD` |
| **S11** | Notebook opens. She edits to `priority in (P1, P2)`, re-runs, **row count drops**. *"Make that line genuinely editable"* | — (human beat) | Notebook Phase 1: cell states, per-cell run, edit-and-retry. `jira_cs_tickets` **has a `priority` column** | — | `VERIFY` end-to-end, then fill gap |
| **S12** | Fourth table lands on canvas, joined | — | Canvas + joins | — | `HAVE` |

**Build-first #2.** If she can't actually change the filter and re-run, "not a black box" is an unsupported claim.

---

## Beat 4 — Her logic, not IT's (2:40–3:15)

| State | Script needs | Agent does | We have | Pick | Verdict |
|---|---|---|---|---|---|
| **S13** | Canvas → Spreadsheet toggle, real rows | — | `SpreadsheetGrid` + view switcher | — | `HAVE` |
| **S14** | Types `Renewal Risk = (Usage Decline 90d × 0.4) + (Open P1 Escalations × 0.35) + (QBR Sentiment Drop × 0.25)` in a **formula bar visually distinct from the agent prompt bar**. Values populate down | — (the beat is that she does it, not the agent) | Formula chip + properties panel | `SuggestionCard(FormulaSuggestion)`, `formula_req` suggType | `HAVE` + polish |

---

## Beat 5 — The differentiator (3:15–4:15)

The longest beat, and the one his repo most directly solves.

| State | Script needs | We have | Pick | Verdict |
|---|---|---|---|---|
| **S15** | Pill on canvas, **three layers checking in sequence** | 7 flat `AIR_ITEMS`, no layering | **`PILLARS`** — Physical (22 checks, heavy/warehouse) · Semantic (10, instant/metadata) · For Spotter (14, moderate/live questions), each with prereq, cost label, last-run, and three plain-language points | `PORT` |
| **S16** | Four **named** findings: 6 columns undescribed · `acct_st` ambiguous · **fan-out on the Jira join** · **`Renewal Risk` has no LLM-reasonable definition** | Coverage counts only. Fan-out lives in `EvalView`, not readiness. **No metric-definition check at all** | **`ISSUES`** — 12 named findings incl. *"Invoices join to orders as one-to-many"* (fan-out), *"Two 'amount' columns are ambiguous"*, *"'arr' uses an unclear abbreviation"*, ***"'Average Deal Size' counts rows, not orders"*** (metric definition). Each carries severity, impact, source, fixability, suggestion, before→after diff | `PORT` |
| **S17** | Agent applies fixes one by one, score climbs to green. *"the only place worth spending a real animation"* | Generate fixes → Spotter ready | `CalFixesDock`, `FixWalkthrough`, `CanvasFixOverlay`, `CompareChangesModal`, impact tiers (`avoid-wrong / unlock / accuracy / polish / faster`) | `HAVE` + `PORT` for fidelity |
| **S18** | Publish | Publish flow | — | `HAVE` |

**Compatibility note:** his "For Spotter" pillar grades `correct | incorrect | oos` — the **same vocabulary** our AIRS tuning already uses. These should graft rather than fight.

---

## Beat 6 — The payoff (4:15–5:00)

| State | Script needs | We have | Verdict |
|---|---|---|---|
| **S19** | Spotter, clean prompt bar, published model named underneath | Test mode inline Spotter Q&A | `HAVE` |
| **S20** | Ranked account list. Risk-weighted ARR total at top. **Jira escalation count as a visible column** — proof the un-ETL'd data made it through | Answer rendering exists (`@spotter` VizBlock / AnswerTile) | `BUILD` (data-driven) |

---

## The porting boundary — our canvas is latest, his agent panel is latest

This is the governing constraint. **Keep our canvas. Take his agent panel.** Measured coupling backs it up:

| Layer | DOM refs | Portable? |
|---|---|---|
| `_agentic` presentational components (12 of 13) | **0** | ✅ Lift as-is |
| `_agentic/AgentPanel.tsx` | 8 | ⚠️ Adapt — don't lift wholesale |
| `Calibration/data.ts` (PILLARS, ISSUES, FIX_META) | **0** | ✅ Pure data |
| `CanvasFixOverlay.tsx` | 20 | ❌ Welded to his canvas |
| `FixWalkthrough.tsx` | 6 | ❌ Depends on his DOM tagging |
| `fixCanvas.ts` | 5 | ❌ Same |
| `CalibrationPanel` / `CalibrationModal` | 5 / 4 | ⚠️ Partial |

His fix pipeline finds things via CSS classes his canvas stamps on rows — `fixSel()` exists specifically so the DME can tag `dmecol-…` / `dmeformula-…` and the walkthrough can locate them. **None of that exists on our canvas.** Porting those files would mean either recreating his DOM contract on our nodes or rewriting the lookup — the second is cheaper and cleaner.

**The good news on the data.** `FixTarget` targets *abstractly*, not by selector:

```ts
{ tab: 'tables' | 'columns' | 'formulas',
  tables?: string[], columns?: string[], formula?: string, where?: string }
```

That's a model our canvas can satisfy — we already have a Canvas/Columns view switcher and `data-block-id` on table cards. So the findings port, and only the *spotlighting mechanism* gets rebuilt. Two remaps needed: his tab names → our views (his `formulas` tab has no equivalent), and his table/column names (`FACT_SALES_ORDERS.amount`, `DIM_CUSTOMERS.churn_risk`) → ours.

**Practical rule:** take the **data and the cards**; rebuild anything that reaches into a canvas.

---

## Cherry-pick list

### From `_agentic` (29 files, ~2,000 lines) — take

`ConfidenceBadge` · `SuggestionCard` · `JoinDiagram` · `PlanStepsCard` · `ToolcallCard` · `ReasoningBlock` · `NextActionChips` · `StopClarifyCard` · `TypingIndicator`

Plus the `MessageItem` discriminated union from `types.ts` as the model for richer agent turns.

### From `_agentic` — skip for now

`VersionCard` (no versioning beat) · MRD-specific paths · `BuildFeedbackCard` (unless S10's Review/Run needs it) · `UserBubble`/`AgentMessage` if our thread chrome already works

### From `Calibration` (7,357 lines) — take

`PILLARS` + `CheckPoint` (→ S15) · the `Issue` model + 12 findings (→ S16, re-pointed to churn) · fix pipeline components (→ S17)

### From `Calibration` — skip

`DriftMonitor` / `DriftPanel` / `DRIFT_SIGNALS` (no drift beat in this script) · `GradingChart` unless the score climb needs it · the `Calibration` shell itself — we want the content and cards, not his container

---

## Open decisions

1. **Integration shape** — port components into `DataStudioV2/`, or extract a shared layer both prototypes import? Different repos and different forks, so this is a real call.
2. **Vision or POC** — which cut does the demo run on?
3. **How far do the ported patterns go** — do they replace our agent thread rendering, or sit alongside it?
4. **Does agentic replace direct manipulation, or coexist?** His `StopClarifyCard` ("shown when the user pauses auto-generation") suggests he's already designed for interrupting an autonomous agent — worth reading before we answer this ourselves.

---

## Suggested order

1. **Mock data** (churn tables) — unblocks every beat's strings
2. **Port readiness** (PILLARS + ISSUES) — biggest gap, self-contained, longest beat
3. **Port agentic vocabulary** (ConfidenceBadge, SuggestionCard, PlanStepsCard, ToolcallCard, ReasoningBlock)
4. **Add SCRIPTS entries** for beats 2–3 using the ported cards
5. **Build the genuinely new bits** — starting screen (S1), Jira intake (S8–S9), background caching (S6)
6. **Verify S11** end-to-end
