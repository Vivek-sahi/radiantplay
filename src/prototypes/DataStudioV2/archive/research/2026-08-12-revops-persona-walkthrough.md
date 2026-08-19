# RevOps analyst walkthrough — five scenarios against the POC V2 build

_2026-08-12. Five simulated data analysts building a revenue-operations model, each walked
through what the prototype actually does today. Every product verdict below traces to a real
capability or gap in the build, not to a guess about what we might ship._

⚠️ **These are archetypes, not research.** They are reasoned from each company's publicly
understood business model and scale. Nothing here is insider knowledge of anyone's actual
warehouse, table names or row counts, and no scenario should be quoted as though a real analyst
said it. Treat this as a structured way to pressure-test the flow, not as evidence.

---

## The test each persona is put through

The MVP statement is: *bring tables from multiple warehouses, preview, join, create formulas,
build a model for a use case, save it.* So each scenario ends with the same four-part verdict:

| Step | What has to work |
|---|---|
| **Bring data** | Get their sources onto the canvas |
| **Join** | Relate them correctly |
| **Formulas** | Express their revenue metric |
| **Save** | Land a usable model |

---

## 1. Uber — two-sided marketplace, Mobility + Delivery

**The model.** Gross bookings → trips → driver/courier earnings and incentives → net revenue,
at city granularity across many currencies. The defining feature of the domain: **gross bookings
are not revenue.** Take rate is the whole business question, and it is a computed relationship
between two large fact tables.

**Use cases.** Take rate by city and product line · incentive-spend efficiency · rider and eater
cohort retention · contribution margin per trip.

**Pain points.**
- "Revenue" has a different definition per market because of how promotions, tolls, tips and
  local regulation net out. Definitions live in analysts' heads and in SQL.
- Currency conversion needs a rate **as of the transaction date**, not today's rate.
- City-level org hierarchy is reorganised constantly, so last quarter's territory rollup is not
  this quarter's.
- Event-level trip data is enormous.

**What they expect from a solution.** One agreed definition of net revenue that every downstream
question inherits; joins that respect *when* something was true; and the ability to work with a
sample without waiting on the full history.

**Walking the product.**

| Step | Verdict |
|---|---|
| Bring data | ✅ Warehouse tables land fine, and cross-warehouse is the differentiator |
| Join | ⚠️ Joins on keys and cardinality only. **No as-of / temporal join**, so "the driver's tier at the time of the trip" is inexpressible. `CanvasJoin` carries `joinType` and `cardinality`, nothing about validity ranges |
| Formulas | ✅ Take rate is writable — free-text expression, lands in the metric list and Spreadsheet. Friction only: a card must be selected first, and the formula is then filed under it |
| Save | ✅ |

**Their three improvements.**
1. **As-of joins.** A slowly-changing dimension is not an edge case in RevOps, it is the normal
   case. Without it every historical number silently uses today's hierarchy.
2. **Show the cache estimate or don't ask for a window.** At trip-table scale the size and time
   readout is the most important number in the modal, and we omit it whenever pre-cache column
   statistics are unavailable. Omitting is right — but then the window choice is blind.
3. **Currency as a first-class modelling concept**, not a formula each analyst rewrites.

---

## 2. Meta — advertising revenue, self-serve plus managed

**The model.** Advertiser hierarchy (agency → advertiser → ad account) → campaign spend → billed
revenue → credits and collections. Two motions in one model: millions of self-serve accounts and
a managed book with reps and quotas.

**Use cases.** Revenue by vertical and region · account penetration and whitespace · quota
attainment for the managed book · advertiser churn and reactivation.

**Pain points.**
- **Spend, billed and recognised revenue are three different numbers**, and stakeholders use
  "revenue" for all three.
- Credits, refunds and make-goods net backwards into closed periods.
- The agency-to-account hierarchy is many-to-many and changes.
- Quota and territory data live in spreadsheets owned by Sales Finance.

**What they expect.** A metric layer — define billed revenue once, have every model and every
Spotter answer inherit it. Plus a way to bring the finance team's quota sheet in without asking
data engineering for a pipeline.

**Walking the product.**

| Step | Verdict |
|---|---|
| Bring data | ❌ **Blocked.** Quota and territory are spreadsheets. CSV upload is explicitly out of POC V2 scope (`2026-08-06-poc-scope.md` §2), and there is no browser Add button |
| Join | ✅ For the warehouse side. Many-to-many via a bridge table works, though the fact/dimension classifier has no answer for a bridge (flow spec §6) |
| Formulas | ✅ Writable. But **per-model** — nothing carries the definition to the next model, which is the actual ask |
| Save | ✅ |

**Their three improvements.**
1. **Reusable metric definitions.** A formula that lives in one model is a formula that gets
   reimplemented differently in the next one. This is the difference between a modelling tool and
   a governed semantic layer, and it is what RevOps is actually buying.
2. **File upload for finance-owned data.** Quotas, targets and comp plans are never in the
   warehouse. Without them the model answers volume questions but not attainment questions.
3. **Give filters a home.** Segment and audience filters are how this analyst slices everything,
   and filters are currently model-level by decision, excluded from Metrics by decision, and not
   on a card or join by decision — so nowhere.

---

## 3. Apple — Services and channel, on a fiscal calendar

**The model.** Sell-in to channel partners → sell-through to customers → Services subscriptions
and App Store revenue, reported on a **4-4-5 fiscal calendar** whose year does not end in
December and which has an occasional 53rd week.

**Use cases.** Channel sell-through and inventory weeks-of-supply · subscription cohort retention
· ASP by product and region · revenue by fiscal week and quarter.

**Pain points.**
- **Every period comparison is fiscal, not calendar.** A model that can only express calendar
  months cannot produce the numbers anyone asks for.
- Sell-through arrives from partners as files, on partner schedules, in partner formats.
- Deferred revenue and subscription rev-rec spread a single transaction across periods.

**What they expect.** Fiscal-calendar awareness anywhere a period appears, and a way to land
partner files.

**Walking the product.**

| Step | Verdict |
|---|---|
| Bring data | ❌ **Blocked** on partner files, same as Meta |
| Join | ✅ |
| Formulas | ✅ Writable. Fiscal period arithmetic would be hand-rolled in each model, since there is no calendar to reference |
| Save | ✅ |

⚠️ **The cache window is calendar-only.** Our shared list is `24h · 3d · 7d · 1mo · 3mo · 6mo ·
13mo`. "Last 3 months" is not a fiscal quarter, and "last 13 months" is a deliberate
year-plus-one-month window that happens to be roughly right for YoY on a calendar year and
subtly wrong on a fiscal one. Worth noting the platform **already knows this is a real
constraint** — Near Store's `Cacheability` type carries `MISSING_CUSTOM_CALENDAR` as a reason a
model cannot be cached at all.

**Their three improvements.**
1. **Fiscal calendar support**, in the cache window and in any period comparison. The reason code
   already exists; the modelling concept does not.
2. **File ingestion with a schedule**, because partner data is recurring, not one-off.
3. **Say what the window means for period comparisons.** A 13-month cache silently makes a
   three-year trend unanswerable, and nothing in the flow warns about that at the moment of
   choosing.

---

## 4. Amazon — consumption revenue at extreme scale

**The model.** Metered usage → rated charges → invoiced amounts → collections, under private
pricing agreements, across payer/linked account hierarchies.

**Use cases.** Net new ARR and consumption ramp against commitments · discount and credit program
cost · migration pipeline · revenue per service line.

**Pain points.**
- **Committed, consumed and invoiced are three different revenue numbers**, and the gap between
  them is the business question.
- Usage data is line-item at a volume where a full refresh is never viable.
- Private pricing means the rate card is per-account, so revenue cannot be computed from a public
  price.
- Account hierarchies are deep and mutate.

**What they expect.** Incremental refresh, not full re-cache. Partition awareness. And honest
numbers about how long anything will take before they start it.

**Walking the product.**

| Step | Verdict |
|---|---|
| Bring data | ✅ Warehouse-native, so this is our best-fit persona for ingestion |
| Join | ✅ |
| Formulas | ✅ Writable, per-model as above |
| Save | ✅ |

⚠️ **The caching model does not survive this scale.** Three specific things:
- **Refresh is a frequency, not a strategy.** Daily/weekly/monthly with no incremental or
  partitioned option. Our own research doc found Power BI treats ~1 GB as the point where full
  refresh stops being viable, and cited real 3-hour refreshes dropping under 10 minutes once
  partitioned. We shipped the frequency and not the strategy.
- **The circuit breaker fires constantly.** `CIRCUIT_BREAKER_SECONDS = 120` means anything past
  two minutes interrupts an explicit user policy. At this scale that is every table, so the
  breaker stops being a safety net and becomes a nag.
- **The estimate rests on two invented constants** — 250K rows/sec and an assumed 365-day span.
  Fine as a stand-in, wrong by orders of magnitude here, and the modal presents it with the same
  confidence either way.

**Their three improvements.**
1. **Incremental refresh.** Append the new partition; don't re-cache 10 billion rows nightly.
2. **A cost preview before you commit**, in the units finance uses. GB is a readout today and
   never an input, which is right — but at this scale it is the number that gets the cache
   approved or refused.
3. **Make the circuit breaker a policy, not a constant.** "Ask me above 10 minutes" is a
   decision the analyst should own once, not a threshold we picked.

---

## 5. YouTube — creator monetisation and brand advertising

**The model.** Watch time → monetised playbacks → ad revenue → revenue share to creators → net
revenue, plus an **allocation** of Premium subscription revenue across creators that is modelled,
not measured.

**Use cases.** RPM and CPM by content vertical and geo · creator payout accuracy · brand versus
programmatic mix · Premium revenue allocation.

**Pain points.**
- **Revenue is restated after the fact.** Invalid traffic, policy actions and demonetisation
  change a closed period's numbers retroactively.
- Revenue share is a computed split, and payout accuracy is a compliance concern, not a
  reporting nicety.
- Premium allocation is an assumption set that must be auditable and versioned.
- Event volume is very large and the analytic grain is fine.

**What they expect.** A model that can express "this period's numbers changed", and lineage
showing which assumptions produced a payout figure.

**Walking the product.**

| Step | Verdict |
|---|---|
| Bring data | ✅ |
| Join | ✅ |
| Formulas | ✅ Allocation is cross-table and the expression is free text, so it is writable. It is filed under one card, which for an allocation spanning everything is arbitrary |
| Save | ✅ |

⚠️ **Restatement has no representation in the cache.** A cached window plus a refresh frequency
says "re-read the last N days on a schedule." It cannot express "March was restated, re-read
March." Our refresh model assumes data is append-only, and revenue data is not.

⚠️ **And cleaning is phase 2.** Payout accuracy is a data-quality problem before it is a
modelling problem, and null/duplicate detection is deliberately out — reasonably, but it is the
first thing this persona would look for.

**Their three improvements.**
1. **Backfill / restatement as a first-class refresh action**, separate from the schedule.
2. **Lineage on a computed metric** — which tables, which assumptions, which version produced
   this number.
3. **Cross-table formulas that are auditable**, not just expressible.

---

## What converges

Five different businesses, and the same handful of things break. Ordered by how many personas
they stop:

### 1. ⛔ File ingestion is the hard blocker — 2 of 5 cannot finish at all

Meta and Apple **cannot complete the core task**, and both for the same reason: the data RevOps
runs on — quotas, targets, comp plans, partner sell-through, FX rates — is owned by finance and
sales teams and lives in spreadsheets, never in the warehouse.

CSV is out of POC V2 scope, and that decision is defensible for a cut about multi-source
*warehouse* modelling. But it should be recorded that **it is what stops a RevOps model being
buildable**, rather than treated as a deferred nicety. The gap is not "upload a file", it is
"model against data engineering doesn't own."

### 2. Formulas work — corrected 2026-08-12

⚠️ **This section originally claimed all five personas were blocked on formulas. That was wrong**,
and the error came from reading `POCV2_STATUS.md` item 5b instead of the code.

What is actually built: the Metrics pane's `+` calls `addStep('formula')`, which opens the
property panel — column name, a "describe it in plain language" AI field, and a **free-text
expression**. The saved formula appears in the metric list and in the Spreadsheet with the `fx`
badge. Nothing constrains the expression to one table's columns, so take rate, billed revenue and
revenue share are all writable today.

Two real limitations remain, both narrower than a wall:

- **A card must be selected first** (`if (selectedId)`), even for a formula spanning tables —
  which is the one thing the Metrics pane exists to avoid.
- **The formula is filed under that card** (`step.formulas`), so the metric list reports
  `source: g.tableName`. A cross-table formula reads as belonging to whichever card happened to be
  selected, which is arbitrary.

Item 5b — model-level authoring in the property panel — closes both.

So the honest score on the MVP statement is **bring ✅ · join ✅ · formulas ✅ (with friction) ·
save ✅**. The core task completes.

### 3. Time semantics are missing in three different ways — 4 of 5

Not one gap, three, and each persona hits a different one:

| Missing | Who needs it | Why it matters |
|---|---|---|
| **As-of joins** (validity ranges) | Uber, Meta, Amazon | Hierarchies change; without it every historical number uses today's org chart |
| **Fiscal calendars** | Apple | Every reported period is fiscal. `MISSING_CUSTOM_CALENDAR` already exists as a cacheability reason |
| **Restatement / backfill** | YouTube | Refresh assumes append-only; revenue data isn't |

The cache window is a wall-clock duration. RevOps time is fiscal, versioned and revisable.

### 4. ⚠️ The 24-hour default is wrong for this audience

`DEFAULT_JOIN_WINDOW = '24h'` was chosen so the first cache is fast and the choice isn't
weighty — a *builder's* concern, and correct for the moment a join is blocked.

But every persona here needs **13 months minimum** for year-over-year, and several need multiple
years. So the default is optimal for the ten seconds after a join and wrong for the model's
actual purpose, and nothing in the flow revisits it later. The two-defaults decision (24h at the
join, All history on the Caching tab) partly covers this, but the *canvas* default is the one
that sets the model's scope, and it sets it to a day.

Worth considering: default from the reference column's data span rather than a constant — a table
with three years of history defaulting to 24 hours is a strange first impression.

### 5. A metric layer is what they think they are buying — 5 of 5

Every persona independently asked for reusable metric definitions. Per-model formulas mean the
definition of revenue is reimplemented per model, which is the problem RevOps teams have today
and the reason they are shopping. This is bigger than MVP and probably out of scope — but it is
the single most consistent request, and it is worth knowing that the thing they want most is a
layer above what we are building.

---

## If I had to act on one thing

**The trust problem, not a capability gap.** Once file ingestion arrives in phase 2, all five
personas can complete the task — bring data, join, write their metric, save. What they cannot do
is verify the answer.

Three ways they finish and are wrong, in order of how quietly it happens:

1. **Joins have no sense of time**, so last year's revenue is attributed to this year's
   territories. The model runs; the number looks right.
2. **The 24-hour window silently shortens a year-over-year answer.** The flow's own remedy —
   offering a full cache for an out-of-period question — is step 5 and isn't built.
3. **No data-quality check.** Duplicate transactions and null amounts are the first thing anyone
   verifies on revenue data, and cleaning is phase 2.

An analyst who is blocked complains. An analyst who ships a wrong revenue number to finance
causes a different kind of problem. Of the three, the time-blind join is the one worth taking
first, because the other two at least leave a visible gap.
