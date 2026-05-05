# Data Studio — Second-Pass Review
_After reading the full codebase and running the build. Follows up on `persona-panel-field-notes.md`._

**Researcher:** Claude, 2026-04-24
**Inputs:** Full read of DataStudioV2 components, `api/agent.ts`, `data/mockData.ts`, `index.tsx`; focused dive on `CenterPanel.tsx` (NotebookView + NotebookCell), `Workspace.tsx`, `ModelView.tsx`, `AgentPanel.tsx` (SCRIPTS). `npm run build` verified green (3.16s, exit 0).
**Mode:** Code review, not live click-through — I can't render a browser. Where the UI behavior is non-obvious from code (animations, visual flow) I flag it.

---

## 0. TL;DR — updated takeaways

1. **The Notebook is a facade, not an artifact.** Cells are hardcoded conditionals on `buildStep`, not agent output. This is the single most load-bearing finding in this pass — it contradicts the mental model you carried into the first-pass discussion ("whatever the agent does is in the notebook; all the code is there"). The Notebook *pretends to be* the code trace. Making it real is a roadmap item, not a design-only task.
2. **Several JTBDs I flagged as missing are actually partially built.** ModelView has Info / Usage / Cache / Quality tabs. Publish/Republish is wired with a real state machine and dependents warning. Share is a real modal with permission levels. The first-pass review under-credited ModelView.
3. **Other "I assumed built" things aren't.** Click-column-to-inspect is a no-op. Inline edits to ColumnsView cells don't persist to ProjectState. Test mode answers are hardcoded strings. No real LLM call exists anywhere — "one real moment per situation" from product.md is aspirational, not wired.
4. **`hasUnpublishedChanges` has a real UX bug.** It only flips on `buildStep` or `addedTables` changes (`Workspace.tsx:74-81`), not on `columnOverrides` — so coaching edits (descriptions, synonyms) silently drift from the published version without re-enabling Publish. For a tool whose main value prop is coaching, this is a load-bearing bug.
5. **The positioning you landed on — enrichment overlay over dbt/Looker — resolves the dbt gravity problem from the first review.** But the SCRIPT still starts from raw warehouse tables. The pitch and the demo are out of sync. The demo needs a dbt-rooted path as the *default*, with raw-warehouse as a secondary entry.
6. **The debug flow has three design options, and you can ship all three in stages.** Symptom-based (what the prototype has today), agent-led autonomous, and user-anchored ("here's what the answer *should* be, work backward"). Each solves a different debug job. Details in §5.
7. **The post-publish learning system is the single biggest unbuilt idea with the highest moat potential.** Not just schema-drift monitoring — the compounding feedback loop between Spotter usage, correct/incorrect marks, coaching actions, and warehouse changes. System diagram in §4.

---

## 1. Calibration — what the code taught me

**Corrections to the first-pass review, grouped by direction of error.**

### I under-credited what's built

| Item | First pass said | Code shows |
|---|---|---|
| ModelView / published state | "implied but not designed" | Real component (`ModelView.tsx`) with 4 tabs, author metadata, share, edit-model button, dependent model list, lineage placeholder |
| Publish flow | "destructive state change, no design" | Real: `PublishModal` (first publish) and `RepublishWizard` (with dependents warning). Publishing is **non-destructive**, workspace stays editable, `publishedVersion` increments |
| Sharing | "just a share button" | Real `ShareModal` with users/groups, three permission levels (view/edit/manage), notification toggle, custom message |
| Agent working-steps animation | "working steps" | Actually quite sophisticated — typewriter text, per-step delays, gradient-text on active step, collapse-to-summary, chained followUpProposals with 500ms delay |
| Unpublished-changes tracking | "no version history" | Partially — `hasUnpublishedChanges` boolean + orange dot on version badge. Not a diff, but a signal that something moved |

### I over-credited what's built

| Item | First pass implied | Code shows |
|---|---|---|
| Test mode diagnostic (Situation 2) | "3-dimension confidence working" | Answers are hardcoded strings in `AgentPanel.tsx`. The 🟢🟡 colors and the Data quality / Context / Structure decomposition are static mock — not computed from the model. |
| Coaching loop (Situation 3) | "agent scans the whole class of issues" | The "scan 18 columns and fix all" result is a scripted outcome of the `build_project` or targeted coaching scripts. The agent is not actually scanning — it's following a hardcoded working-step sequence that writes a predetermined `columnOverridesUpdate`. |
| Inspect / click-to-trace | "working-ish" | Click handlers on columns exist but don't open anything. Inspect panel is not built. |
| Cache (Situation 5) | "Cache tab built; cost story needs reframe" | The Cache tab exists as a tab, but its content is a stub. The $340/mo savings framing isn't even committed yet — it's in the SCRIPT, not the UI. |
| Monitor & alerts (Situation 6) | "alerts on overview card; route back works" | Alert cards exist on Overview; clicking routes to ModelView with `alert` prop threaded through. But the "agent explains what changed and proposes a fix" flow is scripted text in the SCRIPT.md, not wired in AgentPanel. |

### I was correctly skeptical

| Item | First pass said | Code confirms |
|---|---|---|
| Governance / permissions / lineage | "biggest unaddressed gap" | Correct — no role-based authoring, no audit trail surface, no lineage beyond a static diagram placeholder in ModelView |
| Real LLM integration | "one real moment aspirational" | Correct — `api/agent.ts` has infrastructure but no SCRIPT path actually calls it; everything demo-visible is scripted |
| Scale of warehouse | "toy, 3 tables, 150 rows" | Correct — `mockData.ts` is hardcoded to these three tables; no schema picker, no scale affordance |

---

## 2. The Notebook finding

This deserves its own section because it reshapes the "where does the code live?" conversation meaningfully.

### What the Notebook is today

`CenterPanel.tsx:716-789`. The `NotebookView` component builds a cells array that is **fully deterministic on `buildStep`**:

- Cells 1–3 always exist (three `SELECT * FROM <table>` statements)
- Cells 4–5 appear if `buildStep` is `joined`, `transformed`, or `healthy` (two JOIN statements with hardcoded columns)
- Cell 6 appears if `transformed` or `healthy` (the Return-on-Spend metric SQL)
- Cells 7–8 appear if `healthy` (Python date normalization + SQL dedup)

The code text is string literals. There is no onChange. The "Edit" icon, "Run" icon, and "…" icon are UI stubs. The "Add cell" button at the top does nothing. Syntax highlighting is real (regex-based keyword coloring in `ColorizedLine`).

**So the Notebook is currently a mock of a notebook — a documentary rendering of "here's what this state would look like if someone had actually written it as SQL/Python."**

### Why this matters

During our discussion you said:

> *"whatever the agent does it's ultimately being run in a notebook right so all that code will be there in the notebook the user can actually go there and even like maybe modify things"*

That's a really strong idea. It's also **not what the prototype does today**. If the roadmap is to make the Notebook the real artifact — where the agent's work actually lives, editable, re-runnable, the thing you point at when asked "show me the code" — then:

- The agent needs to produce actual SQL/Python **as its output**, not just mutate state.
- The Notebook needs to render what the agent produced, in the order it produced it, with a link to which user turn generated which cell.
- Cells need to be editable (and on edit, propagate back to state — e.g., editing a join cell changes `includedColumns` or the derived SQL).
- Cells need a "run" path, even if it's scripted (execute against the mock data for now, warehouse later).
- The rest of the canvas (Columns, Tables, Preview) becomes a *view* of the notebook's effect, not a sibling surface.

This is a real architectural choice, not a polish task.

### Three futures for the Notebook

Pick one deliberately; the design implications are very different.

**Future A: Notebook stays decorative.**
What it is now. Useful for "show me the technical artifact" as reassurance; not useful as an edit surface. Pro: low cost. Con: it's lying to the user, and you said yourself this is where you want people to see what happened. This conflicts with the durable-state-readout job from the first-pass review.

**Future B: Notebook is the canonical trace.**
Every agent action produces cells; cells are the source of truth for the model; the visual Columns/Tables views are derived from cell execution. Closest analog: a deeply integrated Jupyter / Hex experience with an agent on top. Pro: "where does the code live" has an unambiguous answer. Pro: editable, re-runnable, branchable. Con: high engineering cost. Con: changes the feel of the product from agentic-workspace to notebook-with-agent — different product.

**Future C: Notebook is a second-class trace derived from state.**
State (current model) stays canonical; Notebook is auto-regenerated from state + a log of agent actions. Cells are editable, and edits feed back into state via a parser. The code is always in sync but state is what's stored. Pro: keeps the agentic-first feel. Pro: makes the code real without making it primary. Con: the sync logic is hairy (cell edit → state update → Notebook regenerates → may not match the user's edit exactly).

**My take:** Future C is the right medium-term move. Future B is too big a product pivot. Future A is OK for the current demo but has to change before ship.

---

## 3. Where the "code" actually lives today — running inventory

A concrete map of the nine jobs-to-be-done from the previous discussion, mapped to today's surfaces. Honest status: **built** / **partial** / **absent**.

| # | Job | Today's surface | Status |
|---|---|---|---|
| 1 | Show what the agent just decided | Agent summary bubble + ColumnsView update | **Built** |
| 2 | Show what the agent has *ever* decided (durable log) | Chat transcript (session-scoped) | **Absent** — transcript is ephemeral and doesn't summarize accumulated state |
| 3 | What changed since last Tuesday | Orange dot + version number on header | **Partial** — signal exists, diff does not |
| 4 | Go back to before the agent broke it | — | **Absent** — no rollback |
| 5 | Try a variant without wrecking current | — | **Absent** — no duplication, no branching |
| 6 | Share a link to the model | ShareModal with users + permissions | **Built** |
| 7 | Round-trip with source of truth | `projectSource: 'dbt'` flag and `import_dbt` script | **Partial** — import path exists, sync/reconcile does not |
| 8 | Why did Spotter say X (lineage) | Inspect panel (stubbed) | **Absent** in code; the SCRIPT implies it |
| 9 | Who changed this, when | — | **Absent** |

**The inventory reveals something useful:** the prototype is strong on *the present state of the model* (1, 6) and weak on *the history of how it got here* (2, 3, 4, 5, 9). For an agent-first tool, history is arguably more important than state — because the only way the user trusts what the agent did is by being able to replay it.

---

## 4. The post-publish learning system

You asked for a flow/system diagram. Here it is as an ASCII sketch, then annotated.

```
                    ┌─────────────── SOURCES ──────────────────┐
                    │                                          │
                    │  ① Spotter Q&A logs                      │
                    │     (every question, matched columns,    │
                    │      time taken, answer returned)        │
                    │                                          │
                    │  ② Explicit feedback                     │
                    │     (✓ Correct / ✗ Incorrect on answers, │
                    │      plus coaching category selected)    │
                    │                                          │
                    │  ③ Author coaching actions               │
                    │     (descriptions edited, synonyms       │
                    │      added, transforms applied, metrics  │
                    │      renamed)                            │
                    │                                          │
                    │  ④ Warehouse schema changes              │
                    │     (columns added/dropped/renamed,      │
                    │      types changed, null% shifted)       │
                    │                                          │
                    │  ⑤ Upstream source-of-truth drift        │
                    │     (dbt model changes, LookML rename,   │
                    │      metric redefinition in source)      │
                    │                                          │
                    │  ⑥ Peer-model signals (later)            │
                    │     (other models in org using similar   │
                    │      columns, established conventions)   │
                    │                                          │
                    └──────────────────┬───────────────────────┘
                                       │
                                       ▼
                    ┌─────────── LEARNING SURFACES ────────────┐
                    │                                          │
                    │  A. Usage analytics                      │
                    │     (top questions, common failures,     │
                    │      column hit rate, answer latency)    │
                    │                                          │
                    │  B. Accuracy scorecard                   │
                    │     (% marked correct over time,         │
                    │      per-column, per-question-class)     │
                    │                                          │
                    │  C. Coaching history                     │
                    │     (what was taught, when, by whom,     │
                    │      and what accuracy change it caused) │
                    │                                          │
                    │  D. Drift detector                       │
                    │     (schema + semantic drift, grouped    │
                    │      by severity and affected answers)   │
                    │                                          │
                    │  E. Version history                      │
                    │     (every change as a named version;    │
                    │      diff on click; rollback available)  │
                    │                                          │
                    │  F. Sync reconciler                      │
                    │     (dbt/LookML changes landing here;    │
                    │      propose how to merge)               │
                    │                                          │
                    └──────────────────┬───────────────────────┘
                                       │
                                       ▼
                    ┌───────── USER TOUCHPOINTS ───────────────┐
                    │                                          │
                    │  • "This model knows X because..."       │
                    │     (state readout in ModelView)         │
                    │                                          │
                    │  • Agent proactive suggestion            │
                    │     ("3 questions failed on segments     │
                    │      this week — coach it?")             │
                    │                                          │
                    │  • Impact reports after coaching         │
                    │     ("After you added 'revenue' as a     │
                    │      synonym, accuracy +14%")            │
                    │                                          │
                    │  • Drift alerts on Overview / ModelView  │
                    │                                          │
                    │  • "Resync with dbt" flow (on sync card) │
                    │                                          │
                    │  • Version list with named milestones    │
                    │                                          │
                    └──────────────────────────────────────────┘
```

### What this implies for the product

- **The model is not a static artifact after publish.** It has its own telemetry. The Usage tab in ModelView is the right place to surface ① and A; today that tab shows a conversation list, which is ① unaggregated. Add aggregation (top questions, failure clusters, hit rate) and you have the real Usage surface.
- **The coaching flow needs an "after" side.** Right now coaching is one-shot: apply fix, done. The learning loop needs (before → after) — what did the accuracy metric look like before coaching vs after. This is how Sara proves her work.
- **Drift detection is two different problems.** Schema drift (⊂ ④) is the easy, mechanical one. Semantic drift (⊂ ⑤ and ⑥) is harder and more valuable — "this column's data still exists, but its business meaning has shifted." You can detect it only by looking at accuracy drops that coincide with no schema change. That requires the accuracy scorecard (B) to be in place.
- **The system compounds.** This is the moat story that first-pass Kenji and Priya both noticed, but couldn't fully articulate. Each coaching action feeds the scorecard feeds the drift detector feeds the next proactive suggestion. A competitor without the full loop gets the first AHA but not the durable one.

---

## 5. The debug flow — design options

You asked: *Can the agent debug a wrong answer on its own? Or does the user give it more info and it debugs?*

Both are viable. They're not alternatives — they're **three distinct design options, each solving a different job.** A mature debug flow ships all three and routes between them.

### Option A — Agent-led autonomous debugging

**Trigger:** User says "that's wrong" or "this number doesn't look right" without further detail.
**What the agent does:** Examines its own recent work — the SQL it ran, columns it matched, joins it took, data quality of affected columns, any recent schema changes. Returns a diagnosis plus a candidate fix.
**Analog:** Cursor diagnosing a failing test. The error message isn't enough; Cursor reads the code around the error and forms a hypothesis.
**Strength:** Low friction. User doesn't need to know what's wrong — just that something is.
**Risk:** Agent can confabulate causes. Needs strong grounding in the actual SQL / state / schema. Requires real LLM integration.

### Option B — User-anchored backward debugging

**Trigger:** User says "The answer should be $52,100, not $48,200 — that's $4K off."
**What the agent does:** Uses the user-provided ground truth as a pin. Works backward through its own reasoning to find where the gap is introduced. "The difference is coming from 27 orders with null campaign_id (unattributed revenue totaling $4,100). My metric excluded them. Should we include them, or is this expected?"
**Analog:** Regression debugging — you know the correct value, and you're finding what changed.
**Strength:** Extremely precise diagnosis. Often one-shot. User gets an answer rather than a taxonomy of possibilities.
**Risk:** Requires the user to know the right answer — which defeats the purpose of the product unless the user has a trusted reference elsewhere.

### Option C — Symptom-based structured debugging (what the prototype has today)

**Trigger:** User clicks "Incorrect" on an answer. Agent offers 5 pre-canned categories: number wrong / time period wrong / wrong columns / join wrong / something else.
**What the agent does:** Runs a targeted debug script for the selected category. Each script has a pre-baked diagnosis and fix path.
**Analog:** Zendesk's "describe your issue" dropdown.
**Strength:** Covers 80% of real-world cases cleanly. Easy to implement. User feels guided.
**Risk:** "Something else" is the escape hatch that most sophisticated users will immediately click, and then the flow falls apart.

### The debug flow in phases

A mature debug interaction has five phases. The current prototype does 1–3 well, 4 OK, 5 not at all.

```
[1. Report]  →  [2. Triage]  →  [3. Diagnose]  →  [4. Fix]  →  [5. Verify]

Click "Incorrect" │ Category or    │ Agent + SQL +  │ Agent       │ Re-run the
or natural-lang   │ free-text      │ data + schema  │ proposes    │ failing Q
                  │                │ → hypothesis   │ edit        │ confirm fixed
```

**What to build next:** Phase 5. Without verification, the coaching flow is faith-based. After a coach/fix, re-run the failing question and show the user a ✓ or ✗ on whether it worked. This is also the input to the accuracy scorecard from §4.

**Recommendation:**
- **Short-term:** Keep Option C (symptom categories) for the main path. Add Phase 5 verification. This is the fastest way to close the current coaching loop.
- **Medium-term:** Add Option A as the "something else" path. If the user can't categorize, let the agent try. Requires real LLM.
- **Long-term:** Add Option B as a power feature. "I know the answer; find the bug." Changes the product for a specific sophisticated user.

---

## 6. Sharing & publishing — refined

You clarified a distinction that matters:

> *"share was access. You can share even before it is published. Two ways: if you share, whoever has access to Data Studio will have access to it in the workspace as well"*

So there are actually two orthogonal axes, not one:

| Axis | Values | Meaning |
|---|---|---|
| **Lifecycle state** | Draft → Published → (Certified?) | Readiness for downstream consumers (Spotter users) |
| **Access** | Private → Shared-with-team → Shared-with-org | Who can see/edit/manage the authoring workspace |

These combine into a matrix, and each cell has different implications:

|  | Private | Shared-team | Shared-org |
|---|---|---|---|
| **Draft** | Sara's workspace | Team can co-edit, stakeholders can see progress | Rare; mostly for platform-owned models |
| **Published** | Odd: Sara ships to Spotter but workspace is private — means nobody can edit but Sara. Probably permission anti-pattern. | Normal: team owns both authoring + consumption | Org-wide canonical models (revenue, active users) |

Implications for the UI:

- **Share and Publish are independent actions.** You can do them in either order. The UI should not imply that Share requires Publish or vice versa.
- **The default for Draft is Private-to-author.** The default for Published might be Shared-team (else the published model is unreachable by anyone who could maintain it).
- **The Share modal needs to say what the user is sharing *into*.** Today it says "share this project" — but what the sharee sees depends on state (draft vs published) and the sharee's own role (team member vs Spotter consumer). This is an existing subtle UX problem.

---

## 7. Versioning, duplication, rollback — the Figma model

You said:

> *"each change should be like a version and you should be able to roll back. Even after publishing you should be able to roll back. Duplicating a particular model and then trying out things there — we'll need this duplication feature."*

This is the **Figma versioning model**, applied to semantic models. I think it's right. Concretely:

| Affordance | How it works | Analog |
|---|---|---|
| **Autosave versions** | Every meaningful state change (buildStep transition, columnOverrides write, transform applied, publish) adds an entry to an append-only version log | Figma's "Version history" sidebar |
| **Named milestones** | On Publish, the version gets a name + description. Users can also manually name a version ("before Q3 rename") | Figma "Save to version history" |
| **Rollback** | Open version history → click any version → "Restore this version." If it's a post-publish rollback, trigger Republish Wizard with the restored state | Figma "Restore this version" |
| **Duplicate** | Creates a new project seeded with the current state. Independent version history. No link back to original. | Figma "Duplicate file" |
| **Branch** (later, optional) | Creates a named sibling that can be merged back. Different from duplicate in that it knows about its parent. | Figma branching |

**Two things to resolve that Figma doesn't have:**

1. **Coaching history as part of the version record.** A version isn't just "what the model looks like" — it's also "what the agent was taught between this version and the previous one." Without that, rollback loses information. Every version should store: state snapshot + log of coaching actions that produced it.
2. **Downstream consumer notification on rollback.** If a published version is rolled back, Spotter consumers should know. In Figma this doesn't matter (nobody downstream). In Data Studio, the business analyst consuming Spotter may have made decisions on the rolled-back version. Notifications are part of the rollback flow.

---

## 8. Build-quality findings surfaced by code review

Real bugs / gaps in the current build, worth fixing before next demo. Not roadmap items — implementation issues.

1. **`hasUnpublishedChanges` only tracks structural changes.** `Workspace.tsx:74-81` flips it on `buildStep` or `addedTables.length` changes. Edits to `columnOverrides` (descriptions, synonyms, AI context — i.e., most coaching) don't trigger it. This means Sara can coach a published model and the Publish button won't re-enable. For a product whose compounding value is coaching, this is a bug. Fix: add `columnOverrides` and `prepTransforms` to the diff check.

2. **ColumnsView inline edits don't persist.** `CenterPanel.tsx` — cell edits in the table are local state only; no call back up to `setProject`. Typing in a description field and tabbing out appears to save, then vanishes on next render. Fix: wire the onBlur back through props to update `columnOverrides`.

3. **Column click doesn't open Inspect.** Click handler exists but does nothing. Users will try this and it will feel broken. Either build the inspect panel (right-side drawer?) or remove the handler/hover cue for now.

4. **Notebook Run/Edit/… buttons are no-ops.** The icons suggest interactivity that isn't there. For the current demo, either make them tooltips ("coming soon") or remove them — visible controls that don't respond make the whole surface feel like a mock, which taints the rest of the demo.

5. **Test mode answers are hardcoded demo strings.** The 🟢🟡 Data quality / Context / Structure confidence diagnostic is static mock text in `AgentPanel.tsx`. Fine for a scripted demo, but easy to accidentally show in a live session and have someone ask a different question — at which point the illusion breaks. Add a guardrail ("only these 3 questions work in test mode today"), or wire one real LLM call as the "one real moment" from product.md.

6. **Chained followUpProposal is great UX but hidden dependency.** `AgentPanel.tsx:1724-1735` — after `profile_data` completes, `debug_context_bulk` auto-proposes. If either script's state assumptions change, this chain breaks silently. Worth a comment or a small diagram somewhere.

7. **"One real moment per situation" (product.md) is 0/6 situations wired.** `api/agent.ts` has infrastructure but no SCRIPT path invokes Claude. This is a deliberate Phase 1 choice, but it's worth flagging — the demo's credibility during live Q&A depends on at least one moment surviving an off-script question.

8. **MockData is hardcoded to 3 tables.** `data/mockData.ts`. No way to demo at realistic warehouse scale. For "try finding the right tables in a 500-table warehouse" (a question every buyer asks), you'd need either a mock 500-table list or a fake schema picker flow.

---

## 9. Revised decision points

Updating the seven decision points from the first review, tightened with code-level grounding.

### DP-1: Who is Sara? — **revised**
The prototype's primary-user statement (member of data staff; senior IC) is correct for the Coach/Monitor/Expand situations. It's weaker for Zero-to-one, where the one-shot build naturally appeals to a lighter-touch persona. **My revised read: design for the senior IC, but don't undersell the junior-analyst appeal — it's your growth story, not your core.**

### DP-2: Confidence scoring — DS feature vs Spotter feature — **unchanged**
Same call: author-facing 🟢🟡 is fine; consumer-facing needs different treatment (green-or-nothing for many audiences). Code today conflates them because Spotter surface isn't part of this prototype.

### DP-3: Agentic trust — bet-and-proceed vs diff-and-confirm — **revised & sharpened**
With the version-history model from §7, this tension can be resolved cleanly. **Bet-and-proceed stays the interaction pattern. Version history is the safety net.** The user trusts the agent to act because the action is always reversible. This maps to how Cursor works (agent edits; git is the undo). Without version history, bet-and-proceed scares enterprise. With it, it's the product's best feature.

### DP-4: Atomic unit of change — **revised**
Same call — every Publish should produce a named, diffable artifact. Additionally (from §7): every *non-publish* change should also be a version, just unnamed. Publish is a milestone on a continuous history, not a separate event.

### DP-5: Caching reframe — **unchanged**
Swap "save money" for "isolate Spotter workload."

### DP-6: Monitoring scope — **sharpened**
Narrow scope (agent-aware drift only) is the right bet. The learning system diagram in §4 provides the input stream — schema drift is one of 6 sources. Don't try to replace Monte Carlo.

### DP-7: dbt shape — **resolved by your clarification**
You said overlay/enrichment, pull from dbt/Looker, one-way, configurable cadence (24h or manual). That answers DP-7. **But the SCRIPT doesn't reflect it.** Situation 1 starts from raw warehouse tables; it should start from a dbt project. Replace or supplement.

### New: DP-8 — Is the Notebook real?
The question now on the table. Future A / B / C from §2. This didn't exist in the first-pass review because I didn't realize the Notebook was a facade. Pick deliberately; the answer shapes the next 3-6 months of engineering.

### New: DP-9 — Verification as a first-class phase of debug
Phase 5 from §5. Is "did the fix actually work?" part of the product, or is it implicit (user runs the question again manually)? Making it first-class (automatic re-run after a coaching apply, show ✓ or ✗) creates the accuracy scorecard and the before-after impact report. This is the single highest-leverage build for the compounding moat.

---

## 10. What to do next

If I had to prioritize based on this pass:

1. **Fix the `hasUnpublishedChanges` bug and the ColumnsView persistence bug** (§8 items 1, 2). Tiny, high leverage, the demo feels more real.
2. **Decide DP-8.** The Notebook question blocks or unblocks a lot of other design. If Future C, start designing the cell-from-action mapping now.
3. **Build the version history / rollback surface.** §7. Unlocks DP-3 + DP-4 at once, addresses half the enterprise objections in the first-pass review.
4. **Add Phase-5 verification to the debug flow.** §5. Unlocks the accuracy scorecard and the before-after impact pattern.
5. **Add a dbt-rooted Situation 1.** Either replace the current one or insert a 1b. Matches your stated positioning.
6. **Design the ModelView Usage tab against §4's learning sources.** Top questions, failure clusters, hit rate — not just a conversation list.

Everything else (inspect panel, LLM integration, scale affordance, caching reframe, governance/permissions) is important but downstream of these six.

---

## Closing

The first-pass review called out gaps from outside. This pass has read the code and found the prototype is stronger in some places than I credited (publish/share/republish are real; working-steps animation is sophisticated; ModelView exists as a distinct surface) and weaker in others (Notebook is a facade; test-mode is scripted text; several interaction handlers are stubs).

The single sharpest observation: **you've built a really good foundation for the "present state of the model" and haven't yet built the "history of how it got here." In an agent-first tool, the second is more important than the first — because the only way the user trusts what the agent did is by being able to see, name, diff, and reverse its work.** Version history, verification, and a real Notebook are the three artifacts that close that gap.

If those three are in place by the next demo, the enterprise objections from the first-pass panel largely dissolve — and the differentiation from dbt + Cortex hardens into a real moat.
