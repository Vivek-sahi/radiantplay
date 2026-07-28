# Data Freshness Indicators Across BI & Data Tools — Prior Art for Near Store

*Research date: 2026-07-28 · Design reference for the Near Store data-freshness indicator*

## Executive summary

Across BI and adjacent data tools, **data freshness is surfaced almost universally as secondary, low-prominence metadata rather than a first-class visual**, and the dominant form is a plain **absolute timestamp** ("last refreshed" / "data update time") shown at the **report level**. The **live-vs-cached distinction — the crux of our Near Store problem — is handled at the connection/storage-mode/config layer and is almost never labeled per result.** The richest precedents come from tools that already have an explicit extract/import/cache layer: **Tableau** (a "Data Update Time" title field whose meaning silently flips between extract-refresh and live-source-refresh), **Power BI** (storage mode is the live-vs-cached axis; staleness shown via a warning icon → Refresh history), **Looker Studio** (report-level bottom-left timestamp + threshold-based in-memory cache), and **Hex** (a per-cell "query age indicator" that doubles as the cache-bypass control). **dbt** is the standout for a *discrete named-state vocabulary* (fresh / delayed / stale / …) delivered as a tile designed to be *embedded into the BI consumption surface*. The clearest cautionary anti-pattern is **Omni**, which caches by default (6h) but exposes no badge, timestamp, or staleness label at all.

> **Confidence note.** Findings for Tableau, Power BI, Looker Studio, Omni, Hex, and dbt rest on primary vendor docs and were adversarially verified (unanimous 3-0). Sigma, Metabase, and Atlan detail was **extracted from primary docs but did not survive the final verification budget** — treated here as lower-confidence ("per one source"). Several in-scope platforms (Looker core, Domo, Mode, Superset, Lightdash, Count, GoodData, Qlik, Monte Carlo, Metaplane, Collibra, DataHub, and the AI/agent surfaces) produced **no surviving claims** and are marked "not found."

---

## 1. Per-platform comparison matrix

Lenses: **(1) Placement & grain · (2) Visual form & exact wording · (3) Live-vs-cached handling · (4) Staleness / failure signaling · (5) Prominence & progressive disclosure · (6) Relative vs absolute time + cadence.**

| Platform | 1 · Placement & grain | 2 · Visual form & wording | 3 · Live-vs-cached | 4 · Staleness / failure | 5 · Prominence & disclosure | 6 · Relative vs absolute + cadence |
|---|---|---|---|---|---|---|
| **Tableau** | Worksheet **title** (sheet level), via built-in "Data Update Time" field. Not per-viz badge. [1] | Plain **text in the title**; label **"Data Update Time"**; no badge/icon. [1] | **Live** (default) vs **Extract** (.hyper snapshot). *Same field carries two meanings*: extract → last extract refresh; live → last source refresh in Tableau. Even "live" caches recent results (~12h server default). [1][2][3][4] | Extract is **silently stale between refreshes**; the field itself gives no explicit warning. A "Data Freshness Policy" exists precisely to avoid serving stale cache. [2][4] | Author must insert it into the title; always-on once added, but minimal disclosure (no expand). [1] | **Absolute** timestamp. Field does **not** show cadence/schedule (that lives in admin). [1] |
| **Power BI** | Live-vs-cached lives in **storage mode** (model level). Native freshness in **service/admin** (model settings, workspace list, Refresh history). On-canvas = author-built **Card** at report level. [5][6][7] | Service: small **warning icon**. Canvas: Card bound to a **"Refresh Date" / "Last Refresh Date"** field; tutorials label it **"Last Refreshed Date:"** *(per one vendor blog)* [7] or a DAX `MEASURE_LAST_REFRESHED` with caption "Semantic Model Last Refreshed" *(per one blog)* [10]. Absolute. | **Storage mode is the axis**: Import = cached point-in-time copy (needs refresh); DirectQuery / Direct Lake / Live = query on interaction. Even in DirectQuery, **dashboard tiles serve last-scheduled-refresh cached results**. **Hybrid tables mix both** in one table (recent = live, historical = import cache). [5][6] | **Warning icon** on errored semantic models in the workspace list → click for detail. **Refresh history** page shows past success/failure and when a broken refresh recovered. [5] | **Strong progressive disclosure**: subtle icon in a list → click → history + cadence. Weakness: separated from where the insight is consumed. [5] | **Absolute**. **Shows cadence** — the model settings page surfaces the **next scheduled refresh** (forward-looking). [5] |
| **Looker Studio** | **Report-level** timestamp in the **bottom-left corner**. Freshness configured **per data source**. [8] | Plain "last data refresh" **date + time**. No badge. [8] | Serves charts from an **in-memory cache** while within the source's **freshness threshold**; re-queries once threshold expires. A refresh time **earlier than your last edit** signals the chart is being served **from memory (cache)**. [8] | Staleness is **inferable from the timestamp** (earlier than edits ⇒ cached). No dedicated staleness badge found. [8] | Always-on report-level timestamp. Config: Edit data source → **Data freshness → Check for fresh data → Set Data Freshness**. [8] | **Absolute**. Cadence = threshold configurable per source (not shown as "next refresh"). [8] |
| **Looker (core)** | not found | not found | not found | not found | not found | not found |
| **Omni** ⚠️ | **None** — no indicator at any grain. [9] | **No badge / timestamp / cache-vs-live label at all.** [9] | Caches **6h by default**, shared across permitted users; warehouse-native — but the cache is **unlabeled**. [9] | **None surfaced.** Freshness is only a **manual action**: `Tab > Run w/o Cache` (workbook), `View > Refresh Data` (dashboard). [9] | **Not disclosed** — the cautionary anti-pattern: silent cache, no recency disclosure. [9] | Not found (no time shown). Cache duration configurable. [9] |
| **Sigma** | not found (display grain) | not found (no documented badge in surviving material) | Live-on-warehouse; **per-workbook cache duration (TTL)** governs how long Sigma serves cache before re-querying — cached ≠ live in its model. *Reportedly a multi-tier execution model (browser cache → query-ID/TTL cache → universal result cache → fresh query), per one source.* [11] | not found | not found | not found. Cadence = TTL configurable per workbook. *(per one source)* [11] |
| **Hex** | **Finest grain**: per query unit (SQL **cell**) in Notebook; **app-level "Age of results"** in published apps. [12] | **"query age indicator"** (cell) / **"Age of results"** (app). **Relative age**. Doubles as the **cache-bypass control**. [12] | Cached results **indicated on the cell**; click the indicator → **"Run without cached results"** to force warehouse re-exec. Default **60-min** cache. [12] | When multiple cached results feed one app, it shows the **maximum (oldest) age** among them — a conservative staleness rule. [12] | On the cell, **clickable** to bypass cache; app-level roll-up. [12] | **Relative** age (rare among peers). Cadence = 60-min default cache. [12] |
| **Domo** | not found | not found | not found | not found | not found | not found |
| **Metabase** | Caching config at **multiple grains** — Question, Dashboard, Database, site-wide Default (this is cache *config* grain, not a display indicator). *(per one source)* [13] | not found (display indicator) | Cache policy per grain with **override precedence: Question → Dashboard → Database → Default**. *(per one source)* [13] | not found | not found | not found. Cadence = per-grain cache policy configurable. *(per one source)* [13] |
| **Mode** | not found | not found | not found | not found | not found | not found |
| **Apache Superset** | not found | not found | not found | not found | not found | not found |
| **Lightdash** | not found | not found | not found | not found | not found | not found |
| **Count** | not found | not found | not found | not found | not found | not found |
| **GoodData** | not found | not found | not found | not found | not found | not found |
| **Qlik Sense** | not found | not found | not found | not found | not found | not found |
| **dbt** (observability) | **Embeddable "data health tile"** designed to sit **inside BI dashboards** (Tableau, Power BI, Sigma, Omni, iFrame). Freshness at **source grain**. dbt Cloud also has a dedicated **"Data Sources" UI**. *(latter per one source)* [14][15] | **Discrete named states** (not a raw timestamp): summary **"Data is fresh"** + upstream Sources — **fresh, delayed, stale, skipped, outdated, unconfigured** — rolled up to **Healthy / Caution / Degraded / Unknown**. [14] | N/A (observability layer, not a BI cache). Source freshness = `loaded_at_field` vs `now()`. [15][16] | Named states (**delayed / stale / outdated**) + two thresholds: **`warn_after`** and **`error_after`** (two staleness levels). [16] | **Best-in-class placement**: embedded *into the consumption surface* rather than hidden in admin. Also a dedicated Data Sources UI. [14][15] | **State words** (sidesteps raw time). Cadence = thresholds (`warn_after` / `error_after`). [16] |
| **Monte Carlo** | not found | not found | not found | not found | not found | not found |
| **Metaplane** | not found | not found | not found | not found | not found | not found |
| **Atlan** (catalog) | **Data-product Overview**; a **"Freshness"** component. Grain = data product. *(per one source)* [17] | **"Freshness" = timestamp** for when the data product was last updated in Atlan. Absolute. *(per one source)* [17] | N/A. **Caution**: reflects **only metadata updates** on the data product, not the underlying data. *(per one source)* [17] | not found | Shown in the Overview. *(per one source)* [17] | **Absolute** timestamp. Cadence not found. *(per one source)* [17] |
| **Collibra** | not found | not found | not found | not found | not found | not found |
| **DataHub** | not found | not found | not found | not found | not found | not found |
| **Perplexity / ChatGPT / RAG (AI surfaces)** | not found | not found | not found | not found | not found | not found |
| **ThoughtSpot (own baseline)** | not found (not captured in this research — document internally) | not found | not found | not found | not found | not found |

---

## 2. Mental model

### Common patterns
- **Freshness is metadata, not the insight.** In every tool that surfaces it, freshness is quiet, secondary chrome (a corner timestamp, a title line, a small icon) — it never competes with the number/chart. This validates our "data property" framing.
- **The dominant form is a plain absolute timestamp** ("last refreshed / data update time"), placed at the **report/workbook level** (Looker Studio bottom-left [8]; Tableau title [1]; Power BI author-built card [7]).
- **Live-vs-cached is resolved in configuration/architecture, not in the viewer's face.** Tableau live/extract [2], Power BI storage mode [5][6], Looker Studio / Omni / Hex / Sigma / Metabase caches [8][9][11][12][13] — the mechanism is a connection/storage/TTL setting, and *the result almost never carries a "cached" label*. This is exactly the gap Near Store intends to close.
- **"Live" is rarely truly live.** Tableau caches recent query results even on live connections (~12h server default) [4]; Power BI DirectQuery *dashboard tiles* still serve the last scheduled refresh [5][6]. Useful framing: the honest axis isn't "live vs cached," it's *how recent*.

### Axes of variation
- **Grain:** report/workbook (Looker Studio, Tableau title, Power BI card) → per-tile (Power BI dashboard tiles) → **per-unit / per-answer** (Hex cells & apps; dbt sources). Per-answer is rare and is the closest to our target grain.
- **Form:** absolute timestamp (most) → **relative "age"** (Hex, rare) → **discrete named states** (dbt, rarest but arguably best for a fast glance).
- **Live-vs-cached labeling:** unlabeled config (most) → inferable from a timestamp (Looker Studio: refresh-time earlier than your last edit ⇒ cached) [8] → **explicit per-unit affordance** (Hex indicates "cached" on the cell) [12].
- **Staleness signaling:** richest in **Power BI** (warning icon → Refresh history, + next-refresh) [5] and **dbt** (named states + warn/error thresholds) [16]; inferable in Looker Studio [8]; **absent in Omni** [9].
- **Cadence:** mostly hidden. Power BI is notable for surfacing **next scheduled refresh** (forward-looking) [5]; dbt encodes cadence as `warn_after`/`error_after` thresholds [16].

### What best-in-class does
- **Hex** — freshness at the **finest grain (per answer)**, as a **relative age**, that also *is* the cache-bypass control, and shows the **oldest constituent age** when multiple cached results combine. [12] Closest single precedent to our answer-grain problem.
- **dbt data health tile** — a **compact human-readable state vocabulary** instead of a raw timestamp, and the pattern of **embedding the freshness signal directly into the BI consumption surface** rather than burying it in admin settings. [14]
- **Power BI** — **progressive disclosure done right**: a subtle warning icon that expands into detailed refresh history and cadence — but positioned *away* from the report canvas, which is the weakness to avoid. [5]

### Notable divergences & anti-patterns
- **Omni (anti-pattern):** a warehouse-native tool that caches 6h by default with **no badge, timestamp, or staleness label** — freshness only exists as a manual "Run w/o Cache." A silent cache with no recency disclosure is precisely the failure mode Near Store must not reproduce. [9]
- **Tableau's ambiguous label (cautionary):** one "Data Update Time" string means *extract-refresh time* on an extract and *live-source-refresh time* on a live connection — the user can't tell which from the label alone. [1] If we reuse a single label across live and cached answers, we risk the same ambiguity.
- **Atlan's misleading grain (cautionary):** its "Freshness" timestamp reflects *metadata* updates, not the underlying data. *(per one source)* [17] A freshness signal must clearly be *about the data*, not about the object.

---

## 3. Directions for us

Mapped to our three surfaces. **Spotter (AI chat) and Search data (column-picker) = upfront**; **Liveboard (curated dashboards) = discoverable-but-tucked.** Every recommendation is grounded in specific prior art.

### 3a. Wording — prefer a state + age, not a bare timestamp
- Lead with a **discrete state word** the way dbt does (its states read at a glance where a raw timestamp doesn't) — but collapse dbt's six states to the two our problem actually has: **"Live"** vs **"Cached."** [14]
- Pair the cached state with a **relative age** the way Hex's "Age of results" does: e.g. **`Cached · 2h old`** vs **`Live`**. Relative age communicates recency faster than an absolute timestamp on a low-prominence chip. [12]
- Keep the absolute timestamp (Looker Studio / Tableau / Power BI convention [1][7][8]) for the **expanded/hover** view, not the glance view — "As of Jan 5, 9:00 AM" belongs one level down.
- Avoid a **single label with two meanings** (Tableau's "Data Update Time" trap [1]): make "Live" and "Cached" visually distinct rather than folding both into one neutral "Last updated."

### 3b. Placement & prominence
- **Spotter & Search data (upfront):** put a **subtle per-answer chip at the answer grain**, following Hex's per-cell "query age indicator" — small, adjacent to the answer, non-competing. [12] This is the surface where users are actively exploring and reasoning about recency, so it should be **always-on but quiet**.
- **Liveboard (discoverable-but-tucked):** follow **Power BI's progressive disclosure** [5] and **Looker Studio's quiet corner timestamp** [8] — a small icon / corner element that **expands** to last-refreshed, next-refresh cadence, and source. Don't put per-tile chips on every viz by default; keep it discoverable.
- **Embed it where the insight is consumed**, per dbt's data-health-tile philosophy [14] — not in a separate admin/settings surface (Power BI's structural weakness [5]).

### 3c. The live-vs-cached distinction (our core problem)
- **Label it explicitly at the answer grain** — this is the deliberate improvement over the whole corpus, where live-vs-cached is left to config (Tableau, Power BI, Looker Studio, Sigma, Metabase, Omni [2][5][8][11][13][9]) and rarely shown to the viewer.
- **When an answer blends live + cached inputs, show the oldest constituent's age** — adopt Hex's explicit "maximum (oldest) age" rule so we never over-state freshness. [12]
- Offer a **one-click "run live / bypass cache"** affordance tied to the indicator, exactly as Hex fuses the age indicator with "Run without cached results" [12] and as Omni exposes only via a buried menu [9] — but make ours discoverable *from the chip*.

### 3d. Staleness & failure
- **Reserve color/warning treatment strictly for stale or failed states** — mirror Power BI's warning-icon-only-on-error pattern [5] and dbt's `warn_after` / `error_after` two-tier thresholds [16]. A fresh/live answer should stay neutral and quiet; only degradation earns visual weight.
- For a stale cached answer, **expand to show the recovery/refresh path** the way Power BI's Refresh history shows when a broken refresh recovered [5], and surface **next scheduled refresh (cadence)** on Liveboards [5].
- **Don't be Omni** [9]: never let a cached answer render with zero recency disclosure.

### Suggested defaults (opinionated)
| Surface | Glance state | On expand |
|---|---|---|
| **Spotter** | `Live` · or `Cached · 2h old` chip at answer grain (Hex-style) [12] | Absolute "As of …", source, run-live action |
| **Search data** | Same quiet per-answer chip; upfront [12] | Same |
| **Liveboard** | Tucked corner icon / element (Power BI + Looker Studio) [5][8]; color only if stale | Last refreshed, **next refresh cadence** [5], source, per-tile detail |

*Copy note:* UI strings drift (Looker Studio was "Data Studio"; Power BI "datasets" → "semantic models") — re-verify exact wording against current products before shipping. Also close three internal gaps this research couldn't: **ThoughtSpot's own current baseline**, the **AI/agent "as of" surfaces** most analogous to Spotter (Perplexity/ChatGPT/RAG), and warehouse-native peers **Sigma/Domo** — none produced confirmed evidence here.

---

## 4. Sources

**Primary / verified (high confidence):**
1. Tableau KB — *Adding Data Refresh Time Stamp to a View*: https://kb.tableau.com/articles/howto/adding-data-refresh-time-stamp-to-view
2. The Data School — *Refreshing: Live vs Extract Data Sources in Tableau* (blog, corroborated): https://www.thedataschool.co.uk/erica-hughes/refreshing-live-vs-extract-data-sources-in-tableau/
3. Darwin Apps — *Tableau Live vs Extract* (blog, corroborated): https://www.darwinapps.com/blog/tableau-live-vs-extract/
4. Tableau Help — *Server cache configuration*: https://help.tableau.com/current/server/en-us/config_cache.htm
5. Microsoft Learn — *Data refresh in Power BI*: https://learn.microsoft.com/en-us/power-bi/connect-data/refresh-data
6. Microsoft Learn — *DirectQuery in Power BI*: https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-directquery-about
7. Microsoft Learn — *Add a last refresh time (Power BI)* / Perficient blog on the Card + label pattern: https://learn.microsoft.com/en-us/azure/devops/report/powerbi/add-last-refresh-time?view=azure-devops · https://blogs.perficient.com/how-to-show-last-refresh-date-in-power-bi/
8. Google Cloud — *Manage data freshness (Looker Studio)*: https://cloud.google.com/looker/docs/studio/manage-data-freshness
9. Omni — *Improving query performance with caching*: https://docs.omni.co/analyze-explore/performance/caching
10. John D'Alessandro — *Power BI: dynamic last-refreshed timestamp* (blog, `MEASURE_LAST_REFRESHED`): https://johndalesandro.com/blog/power-bi-create-and-display-a-dynamic-last-refreshed-timestamp/
12. Hex — *Query caching / query age indicator*: https://learn.hex.tech/docs/explore-data/cells/sql-cells/query-caching
14. dbt — *Data health tile*: https://docs.getdbt.com/docs/explore/data-tile
16. dbt — *Source freshness*: https://docs.getdbt.com/docs/deploy/source-freshness

**Extracted from primary docs but not independently verified in this research (lower confidence — "per one source"):**
11. Sigma — *Caching and data freshness*: https://help.sigmacomputing.com/docs/caching-and-data-freshness
13. Metabase — *Caching* (config grain / precedence): https://www.metabase.com/docs/latest/configuring-metabase/caching
15. Datafold — *dbt source freshness* (dbt Cloud "Data Sources" UI): https://www.datafold.com/blog/dbt-source-freshness/
17. Atlan — *What are data products* ("Freshness" component): https://docs.atlan.com/product/capabilities/data-products/concepts/what-are-data-products
