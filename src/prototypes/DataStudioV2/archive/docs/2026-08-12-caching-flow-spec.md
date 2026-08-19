# Caching flow — spec for POC V2 item #6

_2026-08-12. The buildable flow. Supersedes the flow sections of
`2026-08-12-caching-proposal.html` and `2026-08-12-caching-strategy.md`, which stay as the
argument and the evidence. Research and sources: `2026-08-12-caching-research.md`._

---

## 1. What caching is

**Bringing tables from other warehouses into ThoughtSpot's warehouse, and refreshing them
on a frequency.** It is required because we do not support federated query — two tables in
two warehouses cannot be joined where they sit, so one copy of each has to exist in one
place, and that place is ours.

So: **every table in a cross-warehouse join is cached into our store.** There is no
majority-warehouse targeting, no "cache the outlier only" — the destination is fixed by the
architecture.

### It is a benefit, not only a cost

Caching stops live queries against the source warehouse, which **saves money** and removes
per-query latency. This is the more important half of the story and the flow should not
apologise for the step. Earlier framing treated caching as an imposed tax to be minimised
or hidden; that led to designs that defaulted the user's choices away from them. Wrong
instinct.

### The two controls are use-case properties

| Control | Answers | Driven by |
|---|---|---|
| **Time period** (window) | How much history does this model cover? | What the insight needs — a 7-day funnel vs a 3-year trend |
| **Refresh frequency** | How fresh must it be? | Whether the use case needs current data or tolerates stale |

Both belong to the user, and both belong in the modal. Neither is an operations detail to
be deferred: a model's period and its freshness *are* what the model is for. We educate
rather than hide — the choice is the point.

---

## 2. Table residency

"Cached" is not a boolean, and it is not the same fact for every table on the canvas.

| State | Source of truth | Window? | Refresh | Example |
|---|---|---|---|---|
| **Live** | The source warehouse | — | Always current | Snowflake `dim_accounts`, queried on demand |
| **Cached** | The warehouse; we hold a copy in our store | Yes | On a schedule | `pendo_nps_enriched`, last 24h |

⚠️ **Corrected 2026-08-12.** This section previously described a third state — "native", for
CSV uploads and Python outputs, whose home *is* our store — and built the join-target rule on
top of it. **CSV, SQL and Python are all out of POC V2 scope** (`2026-08-06-poc-scope.md` §2:
"What is not — Add data via CSV, Clean data function, Code blocks for SQL and Python"), and
with no browser Add button and `nearStoreConnection: false` there is **no reachable native
table in POC V2 at all**. The concept was imported from Vision's concept model in `CONTEXT.md`
and does not belong here.

What survives, and matters: **anything already in our store anchors the model there.** That is
what makes the join rule work for a *cached* table — see §3 step 2. `isInThoughtSpot` in
`tableConnections.ts` still carries it, which is why the mechanism is kept in code even though
its CSV and Python cases are unreachable.

### Table cache ≠ model cache

Two different caches share one boolean in the prototype today, which is why a CSV upload
currently flips the whole model to cached and stamps a `Cached` badge on every card
(`ModelCanvas.tsx:6309` feeds the per-card badge from the model-level `dataMode`).

| | **Table cache** | **Model cache** |
|---|---|---|
| Purpose | Feasibility — makes the join possible | Performance — pre-built answers, lower compute |
| Optional? | No, when a join needs it | Yes, always |
| When | During build | After save |
| Scope | Per table, windowed | Whole model |
| Surface | The canvas — this spec | The model's **Caching** tab, ported from Near Store — §9 |

This spec is the **table** cache. The model cache is a separate, existing surface.

---

## 3. The flow

### Step 1 — Drop tables. Nothing caches

Tables from any number of warehouses land on the canvas freely. Preview queries the source
**live**. No caching, no wait, no decision. Dropping is not a caching touchpoint.

### Step 2 — Attempt a cross-warehouse join → info, not error

Drawing a join between tables in different warehouses is what raises caching for the first
time.

- **Info, never error.** The user did nothing wrong, and this is the moment our
  differentiating capability introduces itself. "Cannot be joined" is a dead end; *"joining
  across warehouses needs both tables in ThoughtSpot — cache them to continue"* is the same
  fact pointed forward.
- Actions: **Dismiss** · **Proceed to caching**
- ⚠️ **Dismiss must not discard the join.** The attempt persists as a **pending (dashed)
  edge** carrying the cache action, so Dismiss means "not now," not "undo." Without this the
  user loses the gesture and has to remember what they were doing — and the modal re-fires
  on every retry, which gets naggy.

### Step 3 — The caching modal

Subject is **the model's cache scope**, with the tables in the join listed underneath. It
reads as a model-level decision because that is what makes it inheritable (step 6).

Primary choice, and it should state its own future:

| Choice | Per-table config | Applies to future tables? |
|---|---|---|
| **Cache full model** | None | ✅ **Silently.** One decision, ever |
| **Cache a time period** | Window + reference column per fact table | ⚠️ Partly — see §4 |

Per-table rows carry:

- **Time period** — the shared list (§9): `24h · 3d · 7d · 1mo · 3mo · 6mo · 13mo · All
  history`, defaulting to the **smallest (24h)** so the first cache is fast and the choice is
  not weighty
- **Reference column** — pre-filled from an auto-detected event date, editable. Only shown
  where applicable: **dimensions cache full, so they never need one**
- **Refresh frequency** — defaults daily, editable. This is the freshness decision, not an
  ops afterthought

Actions: **Cancel** · **Confirm**

Rows and GB are **readouts, never inputs** — GB is the unit users think about cost in, but
it resolves to an arbitrary row cut, and an arbitrary row cut breaks joins silently. The
size/time estimate depends on pre-cache column statistics (blocker #3); **a fake estimate
is worse than none**, so if stats are unavailable the readout is omitted, not invented.

### Step 4 — Caching runs in the background

**Decided: background with a progress indicator on the canvas.** Not a blocking screen.
`CacheProgress.tsx` already exists as an app-level job that survives leaving the canvas, and
blocking would discard that premise.

The card's indicator changes to show the table now lives in ThoughtSpot.

### Step 5 — During the fill

Settled 2026-08-12, per use case rather than per category — the categories hid two cases that
behave differently from their neighbours:

| Action | Allowed | Why |
|---|---|---|
| Add a table (drop) | ✅ | Dropping never caches. Nothing about it depends on a fill |
| Preview a table that isn't filling | ✅ | Unrelated |
| Preview a filling table | ✅ Progressive | Counts marked provisional — they move as rows land |
| Filter | ✅ | A predicate is scope-independent |
| Formula | ✅ Provisional | Numbers move as rows arrive, and nothing re-checks afterwards. Allowed anyway: blocking authoring would make the wait useless, and the same staleness risk already exists sample→full |
| **Join** | ❌ | The one real hazard — two partly-filled tables match on arbitrary prefixes and return near-zero rows *with no signal* |
| ~~Python~~ | **n/a** | Out of POC V2 scope — no Add button, and Clean/Code are hidden from the node menu. A gate was built for it and then removed as unreachable |
| ~~SQL~~ | **n/a** | Same — out of scope |
| Clean | ❌ | Needs full data — null and duplicate detection on a partial table gives a false all-clear. Phase 2 of the product regardless |
| Delete a filling card | ✅ | The fill isn't what the user is committed to |
| Leave the canvas | ✅ | What `CacheProgress` exists for — the job outlives the view |
| **Save** | ✅ | A short-window model is a legitimate model, so Save never waits for data. It records that caching is in progress |

⚠️ **Python and SQL split here**, which is the one place the code-transform category isn't one
thing: SQL is safe because it never sees our copy, Python is unsafe because it only sees our
copy.

Barring join during the fill is what makes progressive use safe **by construction** rather
than by warning: two partially-filled tables joining on arbitrary prefixes can return
near-zero matches with no signal, and that is the one real hazard. Nothing available
mid-fill depends on completeness.

⚠️ **Disable the join handles while filling — do not error on the attempt.** Prevent, don't
scold. A canvas that accepts the gesture and then refuses it is worse than one that visibly
cannot accept it yet.

### Step 6 — Complete → the join resumes automatically

A join needs its property panel filled in (keys, type, cardinality). When the cache
completes, **the flow auto-continues to that step** — the pending edge becomes live and its
property panel opens, so the user picks up exactly where the wall stopped them.

Cache settings afterwards are reachable from the **model-level pill**, per table.

### Where progress lives, and where status lives

**Progress belongs on the table card. Status belongs on the model pill.** Decided
2026-08-12.

The reason progress is per-card rather than per-model: **tables get cached one at a time**, and
they get cached at different times — a third table joining a finished model starts its own
fill weeks later. A single model-level bar can only average that into something that describes
no individual table. The card is where the question "is *this* table here yet" gets asked, so
it's where the answer belongs.

Status is the model-level fact: how many tables are cached, the window they share, the refresh.
That's the pill, and it's also the route into per-table settings.

The existing header chip stays what it already is — the signal that a job is running *at all*,
which survives leaving the canvas. Three surfaces, three different questions; none of them
duplicates another.

⚠️ The pill is currently one model-wide `live | cached` binary with a single Scope and
Refresh in its dropdown. With per-table windows that is untrue. It becomes a **rollup** —
"3 of 5 cached · 6h window" — opening to a per-table list, each row clicking through to its
own settings. The card menu should be a second route, since going up to the pill to change
one table's window is a detour.

---

## 4. Policy inheritance — the asymmetry

**"Full" is portable. A window is only half-portable.**

Full has no parameters, so it means the same thing for any table and can genuinely be a
policy — future tables cache silently, forever. A window is a duration *plus a reference
column*; the duration travels, the column cannot, because it does not exist until the table
does.

So under a windowed policy, each new table needs at most **one** question: which date
column. And because **dimensions cache full and need no reference column**, the question
only fires for fact tables. In the strategy doc's worked e-commerce model that is 1 table
of 5 — the other 4 ask nothing.

That is small enough to sit **inline on the pending join edge**, not in a reopened modal.

| Model policy | New dimension joins | New fact table joins |
|---|---|---|
| Full | Nothing asked | Nothing asked |
| Window of N | Nothing asked | One pre-filled date-column confirm |

### ⚠️ A full policy needs a cost circuit breaker

"Apply to all future tables" is decided when the model is cheap and fires when it may not
be. Five 50K-row dimensions set the policy to full; three weeks later a 300M-row fact table
joins in and silently starts a ~45-minute cache under a policy set when caching took two
seconds.

**If an inherited full cache would exceed a threshold, the policy yields and asks.** This is
the one case where an interruption is earned *against* an explicit user preference. Without
it, "don't ask me again" is a landmine. Threshold is open — the timing bands in
`2026-08-12-caching-research.md` put the severe case at 200M+ rows / tens of minutes.

Note also that full means **full forever**: a 20M-row table on daily refresh is not 20M rows
next year. The initial cache is one-off; the refresh compounds.

### Facts share one window; dimensions are full

If facts carry *different* windows, the model has no single period — and since the window is
what travels with the model to Spotter, "this model covers the last 7 days" becomes
unsayable, which is exactly what a business user asking outside the period needs to be told.

Dimensions being full does not muddy this: dimensions are current-state, not a period. So
**one window across facts, dimensions full** keeps the model's scope stateable while
allowing the per-table divergence the fact/dimension split requires.

**Open:** does changing the policy later apply retroactively or forward only? Windowed → full
is a fill; full → windowed is a trim, and 30d → 6h discards data a formula may have been
built against. Retroactive-with-confirm keeps the scope coherent; forward-only is cheaper
and leaves the model unable to state its period. Recommendation: retroactive, confirmed.

---

## 5. Every touchpoint where a table gets cached

| Trigger | What caches | Notes |
|---|---|---|
| **Attempt a cross-warehouse join** | Both tables in the join | Primary. Steps 2–3 |
| **Agent creates a join** (`agentAddJoins`) | Same | Same trigger, different entry — must not diverge |
| **A later join under a policy** | The new table | Silent, or one date-column confirm (§4) |
| **Save the model** | Whatever is unjoined / uncached | We **ask**, and the user may **reject** |
| **Enable for Spotter** | — | Existing platform feature; carries its own caching settings |
| **Clean chip** | Full, that table | Null/dup detection on a slice gives a false all-clear. Phase 2 |
| **Python chip / source** | Output is native | Materialises in our store — see §2 |
| **CSV upload** | Output is native | No choice, no window |
| **Out-of-period test question** | Offer full | The window is scope, so the honest answer is "not covered" + offer |
| **Sliced → full upgrade** | That table | From the card menu or the pill rollup |

**Not a touchpoint:** dropping a table on the canvas. Preview is live, and caching a table
the user may delete costs a cache for nothing.

⚠️ **What has to change in code:** the cross-connection *add* gate
(`ModelCanvas.tsx:2731`, `poc &&`-scoped) currently fires caching on drop — it moves to the
join for POC V2. And `wireEnd` (`:3339–3375`) creates joins today with **no caching check at
all**, so the primary trigger is currently the one place caching is never mentioned.

---

## 6. Open

### ~~Blocking — modeling team~~ — all three answered 2026-08-12

1. ~~Per-table window predicate supported?~~ ✅ **Yes.** A table cached with "last 7 days" holds
   only those 7 days. The window is a real control, not a filter applied after a full copy — which
   is what the entire slice design rested on
2. ~~Can caching stream / report progress per table?~~ ✅ **Yes.** Cards filling one at a time is
   real behaviour, not a fiction of the prototype
3. ~~Are column statistics available pre-cache?~~ ✅ **Yes, and more than asked.** Row count and
   size arrive as table metadata, visible while exploring in the browser. So the modal's
   `≈ 500K rows · 0.4 GB · est. 2 sec` readout is real rather than omitted, **and** the
   fact-vs-dimension guess becomes real, since it reads row count

⚠️ **One dependency remains, and it is ours:** every table in `tableMetadata` is 45–1,240 rows, so
until the mock data carries realistic counts, the estimate reads as nonsense and every table still
classifies as a dimension. The logic is now correct; the numbers behind it aren't.

_Dropped: "can we target an external warehouse." Answered by the definition in §1 —
caching means into ThoughtSpot's warehouse. Not a modeling-team question._

### Ours to decide

4. **Circuit-breaker threshold** for an inherited full policy (§4)
5. **Retroactive vs forward-only** policy change (§4)
6. **Bridge tables** — big, on the "many" side of one join and the "one" side of another.
   Windowing orphans its children; caching full may be expensive. Classification cannot
   decide; needs a human
7. **Failure.** Cache fails halfway: what does the card show, what happens to the pending
   edge? `ModelView` already carries a `cache_failed` status, so the concept exists in the
   codebase but not in this flow
8. **Formula during the fill** is allowed — built against what data? `POCV2_STATUS.md`
   already flags that sample → full can invalidate a formula and nothing re-checks it;
   authoring mid-fill sharpens that
9. **`Enable for Spotter` carries caching settings**, per this session. `POCV2_STATUS.md`
   has "Enable for Spotter: no separate step — Save makes the model available" as locked.
   Reconcile: platform feature vs. our save flow

### Prototype work, not design

- **Mock data needs updating** — currently 45–150 rows with no realistic date spread, so a
  6h window would return nothing and the first thing after Confirm would be an empty grid.
  Being handled

---

## 7. Build plan — POC V2

_Evaluated against the code on 2026-08-12. Baseline: `ModelCanvas.tsx` is 8,329 lines with
16 pre-existing type errors; DataStudioV2 has 204 in total (most in `Playground.tsx`). Build
passes regardless — Vite doesn't typecheck. **Do not add to those counts.**_

### 7.1 ⚠️ The prerequisite: one table → connection authority

**The canvas cannot currently answer "which warehouse is this table in?"** — and that
question is the trigger for the entire flow. `CanvasGroup` (`:50–61`) has no connection
field; `sourceKind` is only `'warehouse' | 'csv'`. Today's cross-connection check reads
`POC_TABLE_CONN` (`:1795`), a **hardcoded 6-entry map** covering the renewal-risk demo tables
only. Every other table resolves to `undefined`, so no gate fires.

There are **five** partial, disagreeing sources of this fact:

| Source | Coverage | Names used |
|---|---|---|
| `POC_TABLE_CONN` (`ModelCanvas:1795`) | 6 tables | `snowflake-prod`, `databricks` |
| `TABLE_PATH` (`ModelCanvas:4857`) | 16 tables — **`void`ed, dead** | `snowflake-prod`, `bigquery-prod`, `mixpanel`, `pendo` |
| `tableMetadata[t].connection` (`mockData`) | All metadata tables | `Snowflake`, `SF_PROD_CUSTOMER`, `dbt Analytics`, `ThoughtSpot CDW (Spotstore)` |
| `CONNECTIONS` (`mockData`) | The connection list | `snowflake-prod`, `bigquery-marketing`, `databricks-usage`, `postgres-billing`, … |
| The browser tree JSX (`ModelCanvas:4650+`) | Hardcoded in render | `snowflake-prod`, `bigquery-marketing`, … |

`databricks` is not in `CONNECTIONS` (`databricks-usage` is), and `bigquery-prod` is not
either (`bigquery-marketing` is). So the same table can be in a different warehouse depending
on which map you ask.

**Task 0, before any UI:** one exported map keyed by table name → connection id, reconciled
against `CONNECTIONS`, and **`connection` stored on `CanvasGroup` at add time** so the canvas
never re-derives it. Nothing else in this spec can be built correctly first.

✅ **Built** — `data/tableConnections.ts`, 34 tables, plus `NATIVE_TABLES` for the two that
have no source connection (`qbr_sentiment` is a CSV, `jira_cs_tickets` is a script).

⚠️ **Only the dead map was retired.** The plan said to retire `POC_TABLE_CONN` too; that was
wrong. POC is frozen as the reviewed reference, and its on-drop gate reads that 6-entry map —
widening it to a complete one would make the gate fire in cases POC was never reviewed with.
`CONNECTION_BY_TABLE` is left for the same reason (the publish modal and brand marks read its
display strings, in Demo among others). So `tableConnections.ts` is authoritative but **not
yet the only copy**; the file carries the convergence table, and each site converges when
it's next touched for its own reasons.

⚠️ **The trigger predicate is not "both sides of a cross-warehouse join."** Writing
`tablesNeedingCache` made it obvious the rule is *bring over whatever isn't already here*:

- all tables in the same external warehouse → **nothing**, the join pushes down
- otherwise → every table **not already in ThoughtSpot's store**

So a Snowflake table joined to a CSV caches the Snowflake side and leaves the CSV alone —
"both sides" would have cached something that was already home. Tables on the `agentdb`
connection (ThoughtSpot's own store) are exempt for the same reason, which is why
`ConnectionInfo` carries `isThoughtSpot`.

### 7.2 State model

**Per table** — replaces the model-level `dataMode` for cache purposes:

```ts
type Residency =
  | { kind: 'live' }                                   // warehouse, queried on demand
  | { kind: 'caching'; startedAt: number }             // filling
  | { kind: 'cached'; window: CacheWindow | 'full';    // 'full' for dimensions
      refColumn?: string; role: 'fact' | 'dimension' }
  | { kind: 'native' }                                 // CSV / Python output — §2
  | { kind: 'failed'; reason: string };
```

`CanvasGroup` gains `connection: string` and `residency: Residency`. `sourceKind` gains
`'python'` so native is derivable rather than inferred from step types.

**Per model:**

```ts
interface CachePolicy {
  mode: 'full' | 'window';
  window?: CacheWindow;               // '6h' | '24h' | '3d' | '7d' | '14d' | '30d'
  refresh: { freq: 'hourly' | 'daily' | 'weekly'; hour: string };
}
```

`cachePolicy: CachePolicy | null` — null until the first cache sets it. This is what makes
§4's inheritance possible: a policy can only propagate if it belongs to the model.

**Per join:** `CanvasJoin` (`:63–77`) gains `pending?: boolean` and `blockedBy?: string[]`
(group ids awaiting cache), which is what draws the dashed edge and drives auto-resume.

### 7.3 New files

All under `components/` per the project rule — and deliberately **not** inside
`ModelCanvas.tsx`, which is already 8,329 lines.

| File | What |
|---|---|
| `cache/cacheState.ts` | Types above + pure helpers: `isCrossWarehouse(groups, a, b)`, `classifyRole(table)`, `detectRefColumn(table)`, `estimateCache(table, window)`. No React — the only testable part |
| `cache/CacheRequiredNotice.tsx` | Step 2. Info, not error. **Dismiss** / **Proceed to caching** |
| `cache/TableCacheModal.tsx` | Step 3. Policy choice + per-table rows. ⚠️ **Named `Table…` deliberately** — `ModelView.tsx:604` already has a `CacheSetupModal`, which is the *model* cache. Two different caches must not share a component name |
| `cache/CacheStatusPill.tsx` | Step 6 rollup — "3 of 5 cached · 6h" → per-table list → per-table settings. Replaces the data-mode pill in POC V2 |
| `cache/CanvasCacheIndicator.tsx` | Step 4's on-canvas progress |

### 7.4 Modified sites

| Site | Change |
|---|---|
| `ModelCanvas:50–61` `CanvasGroup` | `+ connection`, `+ residency`; `sourceKind` gains `'python'` |
| `ModelCanvas:63–77` `CanvasJoin` | `+ pending`, `+ blockedBy` |
| `ModelCanvas:2697` `addToCanvas` | Store `connection` and initial `residency` |
| `ModelCanvas:2731` on-drop gate | **Off for POC V2**, kept for POC — see 7.5 |
| `ModelCanvas:3339–3375` `wireEnd` | The gate. Cross-warehouse + uncached → pending join + notice, instead of committing |
| `agentAddJoins` (`~:3413`) | Same gate. An agent-created join must not bypass what a hand-drawn one hits |
| `BlockNode` / `CanvasNodeCard` (`~:1315`) | Badge reads `residency`, not `dataMode`. Three states. Join handles disabled while `caching` |
| `ModelCanvas:6309` `cached={dataMode === 'cached'}` | → `residency={g.residency}` |
| Join line layer / `joinGeometry` | Dashed rendering for `pending` |
| `ModelCanvas:3649–3721` data-mode pill | POC V2 renders `CacheStatusPill` instead |
| `CacheProgress.tsx` | Already an app-level job that survives leaving the canvas. Extend to report *which* table, so per-card state and the canvas indicator read from one source |
| Save flow | The askable, rejectable caching prompt (§5) |

### 7.5 Scope flags — `variant.tsx`

Two, per the one-field-per-difference rule:

| Flag | Vision | POC | POC V2 | Demo |
|---|---|---|---|---|
| `tableCaching` — the whole flow in this spec | false | false | **true** | false |
| `cacheOnConnectionAdd` — the legacy on-drop gate | false | **true** | false | false |

⚠️ The on-drop gate at `:2731` is `poc &&`-scoped, and `poc` is `isPocCut(variant)`, which
**includes POC V2** — so POC V2 inherits it today and must explicitly lose it. Demo runs its
own scripted caching beat and is untouched by both flags.

### 7.6 Phases — each one demoable

| # | Phase | Ships | Visible? |
|---|---|---|---|
| 1 | ✅ **Foundation** | 7.1's connection authority, `residency` on groups, `cacheState.ts`, on-drop gate off for POC V2 | No — but dropping a second-warehouse table stops prompting, which is the §3 step 1 behaviour |
| 2 | ✅ **The spine** | gate → notice → modal → confirm → fill → cached, with card badges | ✅ End to end. This is the demo |
| 3 | **Pending edge + auto-resume** | Dashed edge, disabled handles, join property panel opens on completion | ✅ Makes Dismiss non-destructive |
| 4 | **Pill rollup** | Per-table status + settings access | ✅ Closes step 6 |
| 5 | **Policy + inheritance** | Full vs window, silent inheritance, inline date-column confirm on later joins, circuit breaker | ✅ The third-table story |
| 6 | **Edges** | Save prompt, failure state, out-of-period test | ✅ |

Phase 2 is the one that has to be right; 1 is invisible but nothing works without it.

### 7.7 Fidelity — what the mock data has to carry

| Need | Today | Verdict |
|---|---|---|
| Date column per table | `TABLE_COLS` has `DATE` / `TIMESTAMP` on most tables (`order_date`, `created_date`, `call_date`, `response_date`, …) | ✅ **Auto-detection is buildable now** — first date column, preferring event-shaped names |
| Row counts | `tableMetadata.rowCount` is **45–1,240** | ❌ Won't discriminate fact from dimension, and makes every estimate absurd. Needs realistic counts |
| Date spread in rows | Absent | ❌ A 6h window returns nothing → empty grid right after Confirm |
| Fill duration | `CacheProgress` paces `perTableMs: 1600` | ✅ Keep — a 6h window should feel like seconds |
| Size / time estimate | Nothing | 🟡 Derive from `rowCount × window fraction`. Consistent fake, or omitted entirely if blocker #3 says stats aren't available pre-cache |

Fact/dimension classification: `rowCount` threshold plus presence of a natural key, with a
per-table override in the modal. Join-position classification is *theoretically* available at
cache time (the triggering join carries cardinality) but `wireEnd` **defaults** cardinality
to `many_to_one` rather than deriving it, so it isn't trustworthy input yet.

### 7.8 Not in this build

- **Clean / DQ on a cached table** — phase 2 of the product regardless
- **Model cache** — `ModelView` → Cache tab already exists and is a different cache (§2)
- **Scheduling beyond the refresh dropdown** — Agent DB already has frequency, weekday
  exclusions and timezone if it's ever wanted
- **Cached → live reversal per table** — today's model-level rule (no CSV, no prep) has no
  per-table equivalent yet, and no one has asked for one

---

## 8. Phase 2 as built — and the join path that wasn't there

**⚠️ `wireEnd` is not the join path.** §7.4 put the gate on drag-to-connect. Drag-to-connect
does not work: `ModelCanvas` passes `onWireStart` / `onWireMove` / `onWireEnd` into
`BlockNode`, and `BlockNode` never reads them — three of the 16 pre-existing type errors are
exactly that. `CanvasNodeCard`, which the default `dataset2` mode renders, is never given them
at all. A gate placed only there would have been dead code guarding dead code.

The joins that actually get made come from two places:

| Path | Where | Used by |
|---|---|---|
| **Property panel Apply** | `applyJoin` | The manual flow — select a card → Join → configure → Apply |
| **Agent recommendation** | `__dsAgentAddJoin__` | Multi-select → chips → "join these tables" → Add |
| ~~Drag-to-connect~~ | `wireEnd` → `commitJoin` | Dormant. Gated anyway, for when it's revived |

So the gate is a **function all three call**, not a branch inside one of them:

```ts
cacheGate(tableNames, resume): boolean   // true = held, caller must not create the join
```

`pendingJoinRef` holds **the action to replay**, not a table pair — the three paths need
different things done on resume (commit a wire, re-apply a panel config, re-invoke the agent
bridge), and holding a callback makes the resume identical for each. The agent's join passes
the same gate as a hand-made one: an agent that could join across warehouses where the user
can't would be describing a different product.

### What else phase 2 settled

- **Per-card progressive fill.** The effect reads `job.done` from the existing `CacheProgress`
  context and flips *that* table to `cached`, so cards land one at a time instead of all at the
  end. When the last one lands, the held join replays.
- **The badge carries the window** — `Cached · 6h`, because the window is the model's temporal
  scope rather than a detail. Native tables get no badge; their source mark already says it.
- **`residency` supersedes `cached` only where it's passed** (`scope.tableCaching ? … :
  undefined`), so Vision, POC and Demo still read the model-level boolean and cannot move.
- **The modal seeds from the model's existing policy**, which closes the third-table rule: a
  table joining a model that already declares 7 days defaults to 7 days, not back to 6h.
- **Role is editable per table.** Necessary, not optional: every `rowCount` in mock data is
  45–1,240, so `classifyRole` calls everything a dimension and nothing would ever show a
  window. Flipping a row to Fact reveals the window and reference-column controls, which is how
  the flow is demoable before the mock data grows.

### Still open from phase 2

- **Dismiss discards the attempted join.** Phase 3's dashed pending edge is what makes it "not
  now" instead of "undo" — currently the gesture is lost.
- **Nothing is barred during the fill.** The capability matrix (§3 step 5) isn't enforced yet:
  join handles aren't disabled, and the preview doesn't mark counts as provisional.
- **No failure path.** `{ kind: 'failed' }` exists in the type and the badge renders it, but
  nothing sets it.

---

## 9. Consolidating with Near Store — one prototype, two caches

_Decided 2026-08-12. Near Store (`src/prototypes/NearStore/`, formerly Agent DB) already
ships the model-level caching surfaces. They come across rather than being rebuilt._

### Near Store's caching is the *other* cache

Its own tooltip: *"Time window caches only recent data (e.g. the last 13 months) in
ThoughtSpot; anything older is queried live directly from source."* That is a **performance
cache over one warehouse with live fallback** — cache the recent slice, fall back to the source
for older data, to cut query cost.

⚠️ **A multi-source model has no fallback**, because live is exactly what cannot join across
warehouses. So the same control means two different things depending on the model:

| | Single-source model | Multi-source model |
|---|---|---|
| Purpose | Performance — cheaper, faster | Feasibility — the join is impossible otherwise |
| Outside the window | Queried live from source | **Not covered.** The window *is* the model's scope |
| Can it show "Live"? | Yes | **Never** — Live is not a state it can be in |
| Optional? | Yes | No |

This is §2's table-cache / model-cache split showing up in the product rather than the docs, so
the two modals stay separate: Near Store's on the model, `TableCacheModal` at the join.

### Not a fork

Single vs multi-source is **a property of the model, not a variant of the prototype**. Near
Store's `source: string` becomes a list, and the UI branches on how many there are — so one
Caching tab shows the fallback line for a single-source model and omits it for a multi-source
one. A `NearStore V2` fork would duplicate the modal, run history, marker and listing (~90% of
it) to express one boolean, and would leave three prototypes where the goal is one.

Standalone Near Store stays **frozen** as the deployed reference — the same discipline POC has.

### One shared window list, two defaults

Near Store's MVP shipped **months only** (`WindowMonths = 1 | 3 | 6 | 13`, nothing under a
week). The canvas needs hours and days for a first cache to be fast. One list now spans both:

`24h · 3d · 7d · 1mo · 3mo · 6mo · 13mo · All history`

- **`6h` dropped** — 24 hours is the floor.
- **`14d` and `30d` dropped** — `1mo` says what `30d` said, and two names for one duration is
  how a list stops being trusted.
- **Two defaults, one control:** `DEFAULT_JOIN_WINDOW = 24h` (smallest, because the job is to
  unblock a join) and `DEFAULT_MODEL_WINDOW = full` (because there the cache is an optimisation
  over a model that already works, and windowing is a deliberate per-table opt-in — Near
  Store's decision, unchanged).

### Our model is the sample

The multi-source model built on the canvas is what the ported surfaces describe: it appears in
the model listing with its cache state, and its Caching tab shows the windows set at the join.
`residency` and `cachePolicy` already hold everything those surfaces need to read.

### Port order

| # | Step | Why first |
|---|---|---|
| 1 | ✅ Shared window list | Both surfaces read it |
| 2 | ✅ Cache-state bridge — `summariseModelCache` + `ModelCacheProvider` | "Our model is the sample" depends on it |
| 3 | ✅ Listing indicator (`CacheMarker` + `Query` column) | Smallest visible win |
| 4 | ✅ Caching tab (`CachingTab` · `CachingSettingsModal` · `RunHistoryModal`) | Largest piece; reads step 2 |
| 5 | ✅ Source-count branching — no "Live", no fallback copy for multi-source | Needs 3 and 4 in place to differ |

### How the branching landed

**One additive optional prop, no fork.** `CachingTab` and `CachingSettingsModal` take
`canFallBackToLive?: boolean`, defaulting to **true** — Near Store's own behaviour, unchanged, so
its standalone prototype is untouched. Data Studio passes `false` for a model with more than one
source.

It turned out to be **six** pieces of copy, not one:

| Where | Single-source | Multi-source |
|---|---|---|
| Custom-settings intro | "Everything older is queried live directly from source" | "anything older isn't available — the window is what the model covers" |
| Cache-setting tooltip | "anything older is queried live directly from source" | "data outside the window can't be queried live — the window defines what the model covers" |
| Not-cached empty state | "cut live query cost and speed up load times" | "has to be cached in ThoughtSpot before it can be queried" |
| Paused banner | "queries are running live directly from source until it's rebuilt" | "can't fall back to live — rebuild the cache to restore it" |
| Analytics | "Queries on live data" stat | **Omitted** — a permanent 0% invites the reader to wonder what broke |
| Purge/disable confirm | "All queries will run live" | "can't be queried at all until it is cached again" |

Plus the listing marker from step 3: an uncached multi-source model reads *partly cached*, never
*Live*.
