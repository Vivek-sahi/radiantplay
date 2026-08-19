# Caching — how it works elsewhere, how long it takes, and what needs full data

_2026-08-12. Research for POC V2 item #6. Answers four questions: how cross-source
caching actually happens, how long it takes at GB scale, whether other players do it,
and which operations can run on a sample vs. which need everything._

---

## 1. Tableau does exactly what we do — and its mechanism is worth copying

Tableau's cross-database join is the closest precedent in the market, and the mechanism
is nearly identical to ours:

> For each connection, Tableau sends independent queries to the databases in the join.
> The results are stored in a **temporary table in the format of an extract file**. When
> you perform a cross-database join, the temporary tables are joined by Tableau Desktop.

So: query each warehouse separately → materialise each result locally → join the
materialised copies. That's our "bring them into one warehouse first," with the
materialisation target being Tableau's own engine rather than a warehouse.

### ⚠️ The design lesson buried in their history

Tableau originally produced **one flattened extract**. In 2018.3 they changed to storing
extracts as **multiple tables**, because flattening a star schema into a single
physicalised view *lengthened* extract time rather than shortening it — the denormalised
result is larger than the sum of its inputs.

**For us: cache the tables, not the joined result.** Caching the join output means
materialising a fan-out (one-to-many multiplies rows), which is strictly more data than
caching each table once. It also means every join edit re-caches, where caching tables
means a join edit is free. This is a concrete architectural recommendation, not a
preference.

---

## 2. Timing — real numbers

**Tableau Hyper extract creation** (60-column table, laptop-class hardware — i7, 16GB):

| Rows | Time |
|---|---|
| 1M | ~4 sec |
| 10M | ~37 sec |
| 100M | ~7 min |
| 500M (~25 GB) | **~44 min** |

An older Tableau benchmark puts the conservative planning figure at roughly **1M
records/minute**, which would make a 1B-row extract a ~16-hour job.

**Power BI** treats **1 GB** as the threshold where a full refresh stops being viable and
incremental refresh is recommended; real-world reports cite 3-hour refreshes dropping to
under 10 minutes once partitioned.

### What this means for our UX

- **Under ~10M rows: seconds.** A progress chip is fine. The existing ~8-second pattern
  is roughly right for this band.
- **100M+ rows: minutes.** A chip is not fine. This needs a real progress state the user
  can leave and come back to.
- **GB-scale (25GB / 500M rows): tens of minutes.** This is not a "wait for it" flow at
  all — it's a job you start and get notified about.

So the earlier assumption that "extend the header chip with a percentage" covers the long
wait is **only true for the small band.** The honest read is that caching spans three
orders of magnitude of duration, and one UI can't serve all of it.

---

## 3. Do other players do it? Three different answers

| Approach | Who | How cross-source works |
|---|---|---|
| **Materialise, then join** | **Tableau** | Temp extract per connection, joined locally. Same as us |
| **Federate in memory, no materialisation** | **Trino / Starburst** | Coordinator plans, workers fetch from each connector, **join performed in memory**. No extract at all |
| **Never cross sources; push everything down** | **Sigma** | All computation compiles to warehouse SQL, no extracts. Cross-warehouse joins simply aren't offered |
| **Cache as an optimisation, not a requirement** | **Omni** | Intelligent caching layered over the warehouse — for speed, not to enable joins |

**Honest framing of our constraint:** "you can't join across warehouses without caching"
is a **ThoughtSpot architectural constraint, not a law of the domain.** Trino proves
in-memory federation is possible; Sigma proves you can decline the feature entirely. This
doesn't change the MVP — the constraint is real for us — but it matters for the
feasibility conversation with the modeling team, and it means the caching step is a cost
we impose, not an inherent one. Worth knowing before we design UI that presents it as
natural.

---

## 4. Sample vs. full data — per operation

| Operation | Needs | Why |
|---|---|---|
| Schema / column list | **Zero rows** | Structure only. dbt's `--empty` tier |
| Formula *syntax* validity | **Zero rows** | Compiles or doesn't |
| Browse / preview shape | **Sample** | You're checking columns and plausibility |
| Row count | **Full** | Exact by definition; single pass but still a full scan |
| Null count / null rate | **Full** | A sample can miss rare nulls entirely and report clean |
| Aggregations (SUM, AVG) | **Full** | A sample gives a sample's answer, not the answer |
| Distinct count / cardinality | **Full, or approximate** | Needs sort or hash. HyperLogLog approximates; sampled cardinality can be extrapolated statistically but not trusted exactly |
| Duplicate detection | **Full** | Same reason as nulls — rarity hides in samples |
| Cleaning / DQ scan | **Full** | It's null, duplicate and outlier detection, all full-scan operations |
| **Join key match rate** | **Full — see below** | ⚠️ |

Research note: progressive-sampling benchmarks suggest reasonable profile accuracy at
5–50% of full-scan cost, so "sample" and "full" aren't strictly binary for profiling —
but none of that helps the trap below.

### ⚠️ The trap: sampling both sides of a join independently

**Two tables sampled independently can produce zero join matches even when the full
datasets join perfectly.** If you take 500 rows of `accounts` and 500 rows of
`usage_events`, the sampled account ids and the sampled event account ids need not
overlap at all. The user sees an empty join result and concludes the join is wrong.

This directly undermines "sample-first, then join," which is the flow we designed. The
sample exists to make exploration fast, but a join is precisely the operation a naive
sample breaks.

**Three ways out, in order of preference:**

1. **Key-aware sampling** — sample the driving table, then fetch *matching* rows from the
   joined table by key rather than sampling it independently. Preserves join integrity at
   sample cost. This is what our own `buildModelMerge` already does structurally (it reads
   the right table up to a higher ceiling and matches by key), so the shape is proven.
2. **Sample after joining, not before** — join on full data, sample the result. Correct,
   but forfeits the speed the sample was for.
3. **Show the match rate honestly** — if a sampled join returns few or no matches, say
   *"low match on sampled data — this may not reflect the full dataset"* rather than
   presenting an empty grid as fact.

(1) plus (3) is the recommendation: sample key-aware, and never let a sampled zero-match
read as a real zero-match.

---

## What this changes for item #6

| Earlier assumption | After research |
|---|---|
| Extend the header chip with %/ETA | **Only valid under ~10M rows.** 100M+ is minutes, GB-scale is tens of minutes — that's a background job with notification, not a chip |
| Sample = ~500 rows | **Sampling must be key-aware for joins**, or the join looks broken. Row count alone is the wrong spec |
| Cache the model | **Cache the tables, not the joined result** — Tableau reversed exactly this decision in 2018.3, and fan-out makes the joined result larger than its inputs |
| Caching is inherent to cross-warehouse joins | **It's our architecture, not the domain.** Trino federates in memory; Sigma declines the feature |
| Sample-first is safe for exploration | Safe for *preview*; unsafe for *joins, nulls, dedup, aggregates, cardinality* — i.e. most of what "check my work" means |

**Still open after this research:**
- Which duration band we actually target for MVP demo data (mock data is 45–150 rows, so all of this is theoretical in the prototype — the UI has to *represent* a long wait we can't produce)
- Whether a zero-row schema-validation tier is worth building
- Whether the modeling team's caching can do key-aware sampling, or only naive row limits — this determines whether option (1) above is even available

## Sources

- [Improve Performance for Cross-Database Joins | Tableau](https://help.tableau.com/current/pro/desktop/en-us/joins_xbd_perf.htm)
- [Improve Tableau Extract Performance | Onebridge](https://www.onebridge.tech/post/improve-tableau-extract-performance)
- [Parquet to Hyper benchmarks | Medium](https://medium.com/@guilhermenoronha2001/parquet-to-hyper-tableau-converting-massive-data-for-higher-performance-20e0b090eabb)
- [Benchmark Results of the Tableau Hyper Data Engine | Data Blends](https://datablends.us/2018/01/31/benchmark-results-of-the-tableau-hyper-data-engine/)
- [Configure incremental refresh | Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-configure)
- [Power BI incremental refresh explained | Webdashboard](https://webdashboard.com/power-bi-incremental-refresh-explained/)
- [What is Trino? | Starburst](https://www.starburst.io/blog/what-is-trino/)
- [Federated Query Engine: Trino | ByteDoodle](https://blog.bytedoodle.com/federated-query-engine-real-time-optimization-with-trino/)
- [Sigma architecture](https://www.sigmacomputing.com/product/architecture)
- [Caching and data freshness | Sigma](https://help.sigmacomputing.com/hc/en-us/articles/10759775226003-Caching-and-data-freshness-)
- [Why Omni over Sigma? | Omni](https://omni.co/omni-vs-sigma)
- [Data Quality Profiling at Scale with Progressive Sampling | arXiv](https://arxiv.org/html/2607.25356v1)
- [A Survey on Sampling and Profiling over Big Data | arXiv](https://arxiv.org/pdf/2005.05079)
- [Cardinality Analysis: Data Profiling Guide | Inference Systems](https://inferensys.com/glossary/data-observability-and-quality-posture/data-profiling-and-discovery/cardinality-analysis)
