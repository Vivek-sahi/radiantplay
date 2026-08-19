# Caching strategy — POC V2

_2026-08-12. The strategy for item #6. Structure follows the reasoning: why we cache at
all, what we're therefore building, how the slice is chosen, and the one open question
about background caching. Evidence in `2026-08-12-caching-research.md`._

---

## 1. Why we cache

**Because you cannot join tables across warehouses.** Caching brings each table into
ThoughtSpot's own store, which is what makes a multi-source model possible at all. It
isn't a performance optimisation here — it's the precondition for the product's core
promise.

⚠️ **Worth stating honestly:** this is *our* architectural constraint, not a law of the
domain. Trino federates cross-source joins in memory with no materialisation; Sigma
declines cross-warehouse joins entirely. So the caching step is a cost we impose. That
matters because it means the UX job is to make an imposed cost feel purposeful, and it's
worth asking the modeling team whether in-memory federation is on any roadmap.

### Why it needs solving

Caching takes seconds to hours depending on size. Grounded in Tableau Hyper benchmarks
(60-column table):

| Rows | Time |
|---|---|
| 1M | ~4 sec |
| 10M | ~37 sec |
| 100M | ~7 min |
| 500M (~25 GB) | ~44 min |

**Under ~10M rows this isn't a problem at all** — nobody needs a strategy for 37 seconds.
The problem is real above roughly 50M rows, and severe above 500M. So everything below
is about the large-fact-table case, and the first design consequence is that **most
tables should never trigger any of it.**

---

## 2. A real e-commerce model, end to end

Our own mock data is an e-commerce warehouse. Take the question *"which products drive
repeat purchases from paid-search customers?"* — it needs five tables across two
warehouses:

| Table | Role | Rows | Warehouse | Date column | Cache decision | Est. |
|---|---|---|---|---|---|---|
| `users` | Dimension | 52K | Snowflake | `signup_date` | **Full** — small | <1s |
| `products` | Dimension | 18K | Snowflake | — | **Full** — small, no date column needed | <1s |
| `campaigns` | Dimension | 84K | Snowflake | — | **Full** — small | <1s |
| `orders` | Fact | 1.2M | Snowflake | `order_date` | **Full** — still fast | ~5s |
| `ad_impressions` | Fact | 22M | **BigQuery** | `impression_date` | **Window** — last 7 days ≈ 500K rows | ~2s vs ~80s full |

**Full cache of everything: ~90 seconds. With the one window: ~10 seconds.**

Three things this makes concrete:

1. **Only one table of five needed a decision.** Four are small enough to cache whole
   without asking. That's the shape of the design — ask about the exception.
2. **`products` and `campaigns` have no date column at all**, and it doesn't matter,
   because dimensions are never windowed. The "user must pick a reference column" friction
   only ever applies to big fact tables.
3. **Even here, the honest answer is "just cache it."** 90 seconds is tolerable. You need
   a 200M+ row fact table before fast-cache genuinely earns its complexity.

---

## 3. The three slicing approaches — evaluation and POV

| Approach | Expressible as a predicate? | Join-safe? | Verdict |
|---|---|---|---|
| **N GB** | No — resolves to an arbitrary row cut | ❌ No | **Not an input.** But it's the unit users think in for cost, so use it as *displayed consequence* |
| **N rows** | Yes (`LIMIT n`) | ❌ Only if the other side is complete | **Narrow fallback**, for a big fact table with no usable date column |
| **Last N hours/days** | Yes (`WHERE date > …`) | ✅ Yes | **Primary.** The only one that's semantically meaningful |

**POV: hours/days is the primary lever. Rows is a fallback. GB is a readout, not a control.**

**Why days is join-safe and rows isn't.** A time window is a predicate *both* tables can
share meaningfully — an order and its shipment both fall in the last 7 days. A row limit
is arbitrary: the first 500 rows of `orders` and the first 500 of `ad_impressions` have no
reason to share keys, so a join can return near-zero matches even with perfect referential
integrity. That failure is silent, which makes it the worst of the three.

**Why rows survives as a fallback.** The row-limit danger only exists when **both** sides
are limited. Limit one fact table while everything it joins to is cached full, and every
retained row's parents are present — the join is sound. So for a big table with no date
column, a row limit is safe *in that configuration specifically*.

**What the user picks, and what they see:**

> `ad_impressions` — 22M rows
> Cache **last 7 days** ▾ by **`impression_date`** ▾
> ≈ 500K rows · 0.4 GB · est. 2 sec

Window options in hours and days: last 6h, 24h, 3d, 7d, 14d, 30d. GB and rows are
computed and shown, never chosen.

---

## 4. Fact vs dimension — classify, don't ask

The safe configuration is **window facts, cache dimensions full.** That isn't a
restriction; dimensions are small, so caching them whole is free. The two rules coincide.

**Auto-classification, in order of reliability:**

1. **Join position** — the "one" side of a `many_to_one` join *is* the dimension, by
   definition. We already carry cardinality on every join, so this is free
2. **Row count** — the gap is clean in practice: 860–84K vs 1.2M–22M
3. **No date column** — usually a dimension anyway

**Auto-pick the date column too.** Prefer an obvious event date (`order_date`,
`event_date`, `created_at`) over other date columns; show which was chosen; let them
change it. A pre-filled dropdown, never a blank required field.

⚠️ **The case classification can't resolve:** a **bridge table** — big, and on the "many"
side of one join while being the "one" side of another. Windowing it orphans its children;
caching it full may be expensive. Rare, but it needs a human decision.

---

## 5. Frequency

Default **daily**. Agent DB already has frequency, hour/minute, weekday exclusions and
timezone; no invention needed. For MVP, daily with the schedule editable is enough — and
arguably MVP needs no recurrence at all, since the model is being built, not operated.
**Open: does POC V2 carry scheduling, or is MVP one-shot caching?**

---

## 6. What requires full data

Earlier framing was that partial caching makes numbers *wrong*. That was overstated, and
correcting it simplifies this section a lot:

**The cache window defines the model's temporal scope.** An aggregate over a 7-day cache
is correct *for a 7-day model*. A filter inside it returns a correct 7-day answer. Nothing
is wrong — it's scoped. So:

| Milestone | Gate on full data? |
|---|---|
| Reviewing data, building joins, writing formulas | **No** — structural work is scope-independent |
| Filters, aggregates | **No** — correct for the declared scope |
| **Save** | **No.** A 7-day model is a legitimate model. Requiring full data would block a valid outcome |
| **Cleaning / DQ scan** | **Yes** — null and duplicate detection on a sample gives a false all-clear. (Parked for phase 2 anyway) |
| **Enable for Spotter / consumption** | **Not a gate — a disclosure.** The window has to travel with the model, so a business user asking a question outside it gets told the model doesn't cover that period, rather than a confidently wrong answer |

**So: no hard gate anywhere in MVP. One requirement instead — the model's window is
visible metadata that travels with it.** That's a smaller, better problem than a gate.

### The one genuine join hazard

Cache boundaries lose rows, and **join type decides whether that loss is visible:**

| Join type | Boundary loss shows as |
|---|---|
| **Inner** | Rows silently dropped. No signal | 🔴 |
| **Left / right outer** | Rows survive with nulls | 🟢 Visible |
| **Full outer** | Everything survives, most nulls | 🟢 Most visible |

Outer joins are *safer* on a windowed cache than inner joins. Worth either warning on
inner joins in a windowed model, or defaulting to outer while a window is active.

---

## 7. The open question: background caching with partial data

**Question: let caching run in the background and show some rows so the user can start —
or rule it out because joins will break?**

**Answer: don't rule it out. It's safe in exactly the configuration we already recommend,
if the cache is ordered.**

The join hazard during a partial fill is the row-limit hazard — arbitrary prefixes on both
sides. But dimensions are *small*, so they finish in seconds. Therefore:

> **Cache dimensions first, then stream facts.**

Once dimensions are complete, every arriving fact row's parents are already present, so
**every fact→dimension join is sound from the first fact row onward.** The user starts
working immediately, and the joins they build are correct — not provisional.

**What's still true during the fill:**

| | During fill |
|---|---|
| Fact → dimension joins | ✅ Sound |
| Fact ↔ fact joins (both filling) | ⚠️ Unsafe — arbitrary prefixes on both sides |
| Row counts, aggregates | 🟡 Correct but moving — they change as data arrives |
| Browse, schema, formula authoring | ✅ Fine |

**Recommendation:** allow it, with three conditions — dimensions cached before facts;
fact↔fact joins either wait or warn until both sides finish; and counts marked provisional
while filling. That turns the wait from a block into a progressive start, which is a
better answer than either "wait for the whole cache" or "rule it out."

---

## Still open

1. **Which duration band the MVP demo targets.** Mock data is 45–150 rows, so every number
   here is unproducible in the prototype — the UI has to *represent* a wait we can't create
2. **Does the modeling team's caching support a per-table window predicate?** The whole
   strategy assumes yes. Unverified
3. **Can it stream / report progress per table?** §7 depends on it
4. **Scheduling in MVP or not** (§5)
5. **Bridge tables** — classification can't decide (§4)
