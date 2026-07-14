# Near Store — caching scope: decision memo

**Date:** 2026-07-02 · **Status:** for review · **Owner:** Vivek Sahi
**Audience:** product + eng leadership (scope sign-off)

---

## TL;DR

Near Store caches a model's Snowflake data into the ThoughtSpot data store to cut live
query cost and speed up loads. For the MVP we support **two caching modes — Full Model and
Custom per-table time windows — on a single model-level refresh schedule.** We deliberately
defer table selection, per-table refresh, and row filters.

**The reason is one principle: correctness / model integrity.** We only cache along a
boundary the query engine can reason about deterministically — a **time window on a date
column**. Every control we ship preserves that boundary; every control we defer would blur
it and risk wrong results.

---

## Background

Customers query models live from Snowflake. On large models — especially deep history —
that's expensive and slow. Caching a snapshot in ThoughtSpot fixes both, *if* the system can
reliably decide which rows come from the cache and which fall back to live Snowflake.

That "cache vs. live" decision is the whole game. If it's ambiguous, users get results that
are wrong, stale, or inconsistent — worse than no cache, because they won't know.

---

## Guiding principle: cache along a boundary we can guarantee

A **time window on a date column** is a clean cut:

- It's monotonic along one axis (time). The engine knows exactly: *rows newer than the
  window → cache; older → live Snowflake.* No ambiguity, no overlap.
- It's applied **uniformly across the whole model**, so every table is cached "as of" the
  same refresh, and joins stay internally consistent.

This is why time-windowing is the *only* row-reducing lever in the MVP. It shrinks cost on
the expensive part (historical fact tables) **without** compromising correctness.

---

## Use-cases we support — and why each is safe

| Use-case | Why it's in the MVP |
|---|---|
| **Full Model** — cache all tables, all history | The whole model is one consistent snapshot; every query is answerable from cache. Zero ambiguity. |
| **Custom** — per-table time windows (1/3/6/13 mo) + reference date column | Shrinks cost on big tables while keeping the clean time boundary. Older rows fall back live, deterministically. |
| **One model-level schedule** (freq / time / weekends / tz) | Guarantees the entire snapshot is consistent "as of" a single refresh time. |
| **Operate** — refresh / purge / disable / edit | Lifecycle control without changing the caching boundary. |
| **Data store capacity view** | Admins see spend; caching stays a cost decision, not a surprise. |
| **Run history + per-table breakdown** | Observability so failures/space are debuggable. |

---

## Default in Custom mode: every table starts at "All history"

When a user switches a model to **Custom**, every table defaults to **All history**; they then
opt *specific* tables into a time window. Why this default (not a window):

1. **Safe by default — no silent correctness change.** "All history" behaves exactly like Full
   Model: nothing falls back to live, no older rows silently disappear. Narrowing a table is a
   deliberate, informed choice — never inherited.
2. **It's the only universally-valid default.** A time window *requires* a reference date column.
   Many tables (dimensions like `products`, `accounts`) have no date column, or several — so a
   windowed default can't be chosen unambiguously. "All history" is always valid.
3. **Right mental model.** Custom = "start from the full model, then trim the big/expensive
   tables you choose." Defaulting to a window would invert that and surprise users.
4. **Forces the boundary to be explicit.** Choosing a window makes the user pick the reference
   column — an affirmative acknowledgement of the cache-vs-live cut, consistent with our
   correctness principle.

*(This is what the prototype does today.)*

---

## What we're deferring — and why (all correctness-driven)

| Deferred feature | Why not yet |
|---|---|
| **Table selection** (cache only some tables) | A model is a graph of **joined** tables. Cache only some, and any join to an uncached table must either fall back entirely to live (negating the benefit) or run a hybrid cache+live join — complex, and prone to mixing sources at different freshness. Caching the **whole** model keeps every join answerable from one consistent snapshot. Time-windowing is the safe way to cut size; dropping tables is not. |
| **Per-table refresh frequency** | Different cadences mean tables in the same model sit at **different freshness** at the same moment. A join would silently mix (e.g.) today's orders with last-week's customers — wrong analytics with no error. One schedule → the whole snapshot is consistent as of one time, and users can reason about it simply. |
| **Row-level filters** (e.g. `region = 'US'`) | A filtered cache is a **biased subset**. Queries outside the filter, or aggregates expecting all rows, would be wrong — and there's no clean fallback boundary to detect it. A time window is the one filter that's safe: it's monotonic in time, so "older → live" is always well-defined. Arbitrary predicates aren't. |
| **Column selection** (open) | Same failure mode: a query referencing an uncached column breaks or forces a full live fallback. Under review. |

**One-line version:** we ship the caching cuts that keep the cache a *faithful, consistent
projection* of the model. We defer the cuts that make it a *partial, ambiguous* one.

---

## Trade-offs & risks

- **Some models have one very large table + small dimensions.** Caching "all tables" is
  still cheap (dims are tiny) and the time window handles the big table — so little downside.
- **A customer may genuinely want a filtered/partial cache.** Real, but we'd rather say "not
  yet" than ship a cache that can return wrong answers. Deferring protects trust in the feature.
- **Risk of under-serving power users.** Mitigated by shipping the two highest-value modes
  first and revisiting with data.

---

## Revisit triggers (when a deferred feature earns its way in)

- **Table selection:** repeated demand *and* a correctness-preserving design (e.g. only allow
  dropping tables with no inbound joins, or full live-fallback with clear UX).
- **Per-table refresh:** demand for isolated tables that don't join into the same queries.
- **Filters:** a design where the filter can't span a join or bias an aggregate — or explicit
  "partial cache" semantics surfaced to the user.

---

## Appendix — settings tree

```
Model
├─ Cache scope .......... Full Model | Custom .................... ✅ MVP
└─ Refresh schedule ..... freq / time / weekends / timezone ...... ✅ MVP
Table (Custom only)
├─ Time window ......... All history | last 1/3/6/13 months ...... ✅ MVP
├─ Reference column .... required when windowed .................. ✅ MVP
├─ Table selection ..... cache a subset ......................... 🚫 deferred (integrity)
├─ Per-table refresh ... own cadence per table .................. 🚫 deferred (consistency)
└─ Row filter .......... e.g. region = 'US' ..................... 🚫 deferred (correctness)
```

See `USE-CASES.md` for the full tree and `near-store-overview.html` for the visual walkthrough.
