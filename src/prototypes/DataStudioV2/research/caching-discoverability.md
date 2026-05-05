# Research: Caching discoverability in the modeling canvas

_Started 2026-05-05. Informs Phase 2 task #4 ("Show caching as a step in the building flow") and the broader open question from `patterns.md`: "Where does caching surface in the workspace?" Prep affordance is a parallel problem and deliberately out of scope here — same patterns will be reused later._

---

## The question

When a user is modeling in the canvas, how do we make caching discoverable — without adding a "Cache" button that violates the orthogonality principle? Specifically, how do we surface whether the model is **Live** (every read hits the warehouse) or **Cached** (queries hit ThoughtSpot's store, refreshed on schedule from the warehouse) so the user always knows the cost and freshness posture they're working in.

---

## Who is affected

Sara (data team primary persona — see `knowledge/users.md`). Touches situations:

- **1 (Build)** — first model. No reason to cache yet, but the affordance has to exist without nagging.
- **2 (Test)** — every Spotter question is a live warehouse hit today. This is the loudest discoverability gap.
- **4 (Expand)** — re-entering a published model. Cache state should already be answered, not re-asked.
- **5 (Cache it)** — already built (Cache tab in Model View). This research is about the *bridge* from 1/2/4 into 5, not the destination.

---

## Current state

**Platform (from `knowledge/platform.md`):**
- ThoughtSpot has **no caching today.** Every Spotter query goes live to the warehouse.
- The new caching feature is opt-in, with refresh frequency, lookback window, and a cost story (billed per GB).
- Locked: caching is one of the three moments requiring explicit confirmation (alongside publish and monitor-and-fix). Not a toggle — a decision with consequences.

**Data Studio V2 today:**
- Cache tab lives inside Model View. Reachable only from situation 5 entry path.
- Modeling canvas chrome shows Publish and Share. **No data-source state indicator. No cache surface. No "you are live-querying" signal.**
- Canvas has four views over shared state: **Columns · Tables · Data Preview · Notebook.** All four read the same underlying model. Notebook is our Hex-equivalent — agent steps execute as cells.
- Open question already on the books in `patterns.md`: *"Where does caching surface in the workspace? — TBD."*
- Locked principle in `patterns.md`: *"DataStudio's capabilities are orthogonal, not a pipeline. Prep is optional. Caching is optional. Testing is optional. The UI can't imply otherwise."*

**The user's complaint, plainly:** I'm modeling. Publish and Share are visible. Cache isn't. Nothing tells me data is being live-queried, nothing tells me caching is an option, nothing tells me what state my data is in. So I never think about it.

---

## Reframing the problem

The right question isn't "how do we make a Cache button discoverable" — that re-creates the pipeline implication we already rejected.

The right question is **"what is the data state of the canvas at any moment, and how do we surface it?"** Caching becomes one option in a state-aware menu. Prep affordance later reuses the same surface.

This splits cleanly into two sub-questions:
1. What states *can* the canvas be in?
2. Where does that state live in the UI?

---

## Two states: Live vs Cached

| State | What it means | Freshness | Cost |
|---|---|---|---|
| **Live** | Every read goes through to the warehouse | Always fresh | Slow, $$ per query |
| **Cached** | Queries hit ThoughtSpot's store, populated from the warehouse on a refresh schedule | Refresh-bound (hourly, daily, etc.) | Fast, $ for storage, no per-query warehouse cost |

**The source never changes.** Both states are "data from Snowflake/BigQuery/etc." Caching doesn't move ownership of the data — it just changes the query path and adds a refresh cadence. The chip should reflect this: source identity is constant, what varies is *whether queries are direct or via cache*.

### Session snapshot — deliberately deferred

An earlier draft considered a third state — a session-scoped snapshot that would freeze data while the user works in the canvas (Hex-like). Pulling it out:

- It's a canvas-level *setting* (or platform behavior), not a user-facing state alongside Live/Cached.
- The platform doesn't have it today; introducing the concept now adds complexity for unclear benefit.
- If it's added later, it can hang off the same chip as a sub-mode of Live ("Live · paused on snapshot from 14:32"), without reshaping IA.

So: **start with Live and Cached only.** Revisit snapshot if and when the platform supports it.

---

## The shared-state insight

The canvas's four views (Columns / Tables / Data Preview / Notebook) all read the same underlying model. The Notebook is our Hex-equivalent and is where agent-executed steps land as cells.

**Implication: state is shared, so the indicator is shared.** One state chip in the canvas chrome, not one per view, not one per table view, not one per notebook cell.

This is a deliberate divergence from Hex. Hex projects are sequences of independent computations; per-cell cache makes sense there. Our canvas is one logical model with multiple lenses. A per-cell cache toggle in our Notebook would imply cells can have *different* data states, which they can't — the Notebook is a transcript of the agent acting on the same canvas state, not separate queries.

---

## When does the user actually think about caching?

Caching is a *post-modeling* concept. Sara won't reach for it while she's still figuring out joins. The realistic moments:

1. **Sharing the model with people for testing.** Sara has a working model and wants colleagues to try it. She doesn't want every colleague's question to ring up warehouse cost. Caching here is about controlling cost during a high-traffic phase.
2. **Cost optimization on a heavy model.** Some weeks in, Sara sees the model is queried often and is expensive. She caches to reduce per-query cost.
3. **Performance on slow warehouses.** Live query latency is bad enough that experience suffers. Caching turns it into a fast read.

In all three: **the model already works.** The decision is "should this stay live or should I cache it?" — not "do I need a cache before I start?"

This shapes the chip's behavior:
- Default state on a new model: **Live.** Always.
- Caching is offered, not pushed, when the user reaches a moment where it matters (sharing, cost, performance).
- The chip stays out of the way during build; it earns its keep during testing/sharing/post-publish.

---

## Model-level trigger, table-level intelligence

**Decision (locked 2026-05-05):** the user-facing trigger is **model-level.** Sara clicks "Cache this model" — one decision, one mental unit. Per-table considerations (refresh cadence by fact vs dim, "don't cache streaming," cost concentration on the big fact) are handled *inside the workflow* as smart defaults the agent proposes.

The mental model: **"What questions would Claude Code ask if you said 'cache this model'? Those questions are the workflow."**

Per-table caching is acknowledged as a real production need (fact tables refresh hourly, dim tables weekly, some tables shouldn't be cached). But it's the wrong *entry point* for a feature whose primary problem is discoverability. We meet Sara at the unit she thinks in (the model), and let intelligence resolve the rest.

### What the workflow looks like

When Sara clicks the chip → "Cache this model," an in-canvas agentic flow runs. No tab switch, no modal-out-of-context. The agent walks through the decisions a smart colleague would walk through:

1. **Scope.** "I'll cache all 15 tables. The streaming `live_inventory` table I'd skip — caching defeats the purpose. OK, or do you want to include it?" (Default: cache all cacheable; surface skips.)
2. **Refresh cadence.** Agent proposes per-table based on what it can read:
   - Fact tables (`orders`, `events`) → hourly
   - Dimension tables (`products`, `customers`) → weekly
   - Static lookups (`countries`, `currencies`) → never (cache once)
   Sara sees a small per-table list with proposed cadences. She can accept all, or click any row to adjust.
3. **Lookback window.** "Cache last 6 months of fact tables. Older queries stay live." Proposed default; one click to change.
4. **Cost preview.** "~85 GB of storage. Estimated $X/month." Shown before commit.
5. **Confirm.** Single explicit confirm — matches the locked pattern (Publish / cache = explicit confirm).

After confirm: chip flips to `Cached · mixed schedule · Snowflake`. Click anytime to reopen the workflow and adjust.

### Why this matters

This is not "click chip → settings panel." It's "click chip → guided agentic decision." The difference is the difference between *present* and *useful*.

It also fits the existing agent patterns table in CONTEXT.md — "Publish / cache: Explain → propose → confirm." Caching now reads as one cohesive moment instead of being scattered between "find the Cache tab" and "fill out the form."

---

## Competitive / inspiration references

### Hex — per-cell cache, project-level mode
- Each cell shows last-run timestamp + refresh button. Cells implicitly snapshot until refreshed; downstream invalidates when upstream re-runs.
- Project setting: "always run fresh" vs "use cached results."
- **Borrow:** the inversion of caching being the *default state*, not a button.
- **Don't borrow:** per-cell granularity. Doesn't fit our shared-state canvas.

### dbt Cloud — materialization as code
- Cache is a property of the model (table / view / incremental), declared in YAML/SQL.
- No runtime UI — compile-time decision.
- **Borrow:** the *declarative* posture. Cache is an attribute of the model, not an action you take. Pairs well with Publish: at publish time, you commit to a cache state.
- **Don't borrow:** code-first authoring is the wrong layer for Sara.

### Snowsight result cache
- 24-hour invisible cache. Users only notice when "queries are sometimes faster."
- **Lesson:** fully invisible caching breaks trust when users debug performance. Some legibility is necessary.

### Looker PDTs / Sigma materializations
- Looker: persistent derived tables declared in LookML; admin-configured refresh.
- Sigma: workbook materialization toggle, shows cost estimate at decision time.
- **Borrow:** show cost implication *at the moment of decision*, not buried in admin.

### ThoughtSpot Falcon (legacy, internal)
- Tables imported into Falcon (TS columnar engine) — historically the only path. Sara may carry the mental model.
- Worth asking eng whether the new caching feature reuses Falcon's posture or is genuinely new. Affects naming and analogy.

---

## Options considered

### Option A — Data-state chip in canvas chrome → opens in-canvas agentic workflow
Persistent chip in the canvas header near Publish/Share. Reads `Live · Snowflake` by default; switches to `Cached · mixed schedule · Snowflake` once cached. Click opens the **in-canvas caching workflow** (see "What the workflow looks like" above) — agent proposes per-table cadences, scope, lookback, cost preview, single confirm. No tab switch, no leaving the canvas.

- **Pro:** state is always legible. Caching is one cohesive moment, not a stranded button.
- **Pro:** reusable for prep affordance later (same chip, sub-state for transforms applied).
- **Pro:** matches orthogonality — not a pipeline step, an attribute of the canvas.
- **Pro:** source identity (Snowflake / BigQuery / etc.) stays visible in both states, so the user understands cache is just a query path change, not a data move.
- **Pro:** smart defaults make the experience *useful*, not just present. User isn't asked to think per-table; agent reasons per-table on their behalf.
- **Con:** chip language needs care — terms, hover behavior, what changes between hover and click.
- **Con:** Cache tab in Model View becomes redundant or shifts role (configuration management of an existing cache, not the entry point). Affects situation 5 demo path — flagged below.

### Option B — Cache lives in Model View only; small live-query badge in canvas
Keep Cache tab as the home. Add a "Live · Snowflake" badge in the canvas chrome that links to Model View → Cache tab. No session-snapshot concept introduced.

- **Pro:** smaller surface. No new platform concept.
- **Pro:** preserves situation 5 entry path.
- **Con:** doesn't solve the snapshot problem — every test still pounds Snowflake.
- **Con:** discoverability fix is shallow. Still a "go elsewhere to cache."

### Option C — Caching as a visible step in the build flow
`build_project` agent flow surfaces caching as a step in the working ladder. Phase 2 task #4 reads this way literally.

- **Pro:** discoverable inside the flow Sara is already in.
- **Pro:** addresses Phase 2 task #4.
- **Con:** only catches users on the build path. Test mode and post-build editing still have nothing.
- **Con:** as a *step* in the ladder, it implies a pipeline. Violates orthogonality principle. (A step that's optional is still presented as a step.)

### Option D — Synthesis: A as the always-on surface, C as the first-time moment
Chip in canvas chrome (A) for ongoing legibility. Build flow (C) introduces caching as a *moment* the first time the user reaches a sensible point — but the moment opens the chip's menu, not a separate modal. The chip is the canonical surface; the build flow is a teaching opportunity that points to it.

---

## Recommendation

**Option D, but design A first.** The chip is the unlock. Once we know what states exist and how they're surfaced, Phase 2 task #4 (caching in build flow) becomes "the build flow opens the chip's menu at the right moment" — a much smaller decision.

If we build C without A, we re-create the discoverability problem two months from now: the build flow surfaces caching once, then disappears, and a returning user has nowhere to find it.

---

## Open questions before this can ship

1. **Default on canvas open.** Live for new models — confirmed. For returning to a published-and-cached model, the chip should reflect the cached state automatically. Confirm with eng that cache state is queryable per model.
2. **Smart defaults — how smart?** What signals can the agent use to propose per-table cadences? Table size? Last-updated metadata? Query patterns? dbt model materialization tags? The quality of the proposed defaults is what makes this experience useful vs. dressed-up form-filling.
3. **Per-table override depth.** Inside the workflow, how deep does table-level control go? Refresh cadence per table — yes. Different lookback windows per table — probably overkill. Skipping individual tables — yes (especially for streaming). Need to draw the line.
4. **What happens to the Cache tab in Model View?** If the chip's workflow handles entry + configuration, the Cache tab becomes (a) redundant, (b) a management view for an *existing* cache (refresh now, view history, edit cadence), or (c) absorbed entirely. Affects situation 5 demo path.
5. **Chip language.** Resting state: `Live · Snowflake` vs `Cached · mixed schedule · Snowflake`? Or per-cadence summary ("Cached · refreshes hourly")? What about when the cache is mid-refresh, stale, or failed?
6. **Cost cue.** Should the chip ever proactively flag "This model is heavy this week — consider caching"? Or is that a monitoring concern, not a chip concern?
7. **Notebook cells.** Inherit canvas state — confirmed direction. Verify nothing in the Notebook implementation today implies per-cell cache state that would conflict.
8. **Cache + prep storage interaction.** Already open in `patterns.md`. Out of scope here. Workflow design must not foreclose the answer.

**Deferred (revisit later, not blocking):** session snapshot as a third state. Ergonomic for prep/profiling but not on platform today; can hang off the chip later as a sub-mode of Live without reshaping IA.

---

## Out of scope

- **Prep affordance.** Same problem shape, separate research doc. Chip pattern should be reusable.
- **Session snapshot.** Pulled out as deferred — not a state, not on the platform today.
- **Cache configuration UI.** Refresh cadence, lookback window, cost meter, billing — all already in Cache tab (situation 5). This research is about the *entry point*, not the destination.
- **Notebook cell-level features beyond inheritance.** Per-cell freshness opt-outs deferred until shared canvas state is solid.

---

## Explorations needed before building?

**Yes.** Playground.tsx should try at least three directions before locking IA:

1. **C1 — Chip + agentic workflow.** Single chip in canvas chrome. Resting: `Live · Snowflake`. Click → in-canvas workflow (scope → cadence → lookback → cost → confirm) with smart per-table defaults. Tests whether the workflow feels like a useful agentic moment vs. a settings panel.
2. **C2 — Workflow shape.** Two variants of the same workflow: (a) one-shot agent ladder ("here's my proposal, accept all or adjust") vs (b) step-by-step Q&A ("scope?" → "cadence?" → "lookback?"). Tests how much agency Sara wants when caching for the first time.
3. **C3 — Build-flow integration moment.** Phase 2 task #4 wants caching as a step in the build flow. Test *when* the moment first appears: at build complete? At first share? At first heavy query? Whichever surface is right, the moment opens the same chip workflow — not a separate modal.

Three directions, converge to one before touching production canvas code.

**What's not on the list:** per-table-as-entry-point (locked out — model-level only), separate Cache tab UI (likely absorbed or repurposed — needs decision in Q4 above first).
