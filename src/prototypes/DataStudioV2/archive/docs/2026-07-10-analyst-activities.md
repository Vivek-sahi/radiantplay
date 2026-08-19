# Data analyst activities — messy data → reliable, tested dataset

_Catalog of the day-to-day things a data analyst does to take **messy source data → transform → join → a reliable dataset → test it**. This is the activity surface the agent's **modeling skill set** must cover. We'll scope a subset of these for the agentic prototype._

**Explicitly out of scope here:** the AI-readiness / semantic layer (synonyms, descriptions, metrics-for-Spotter, certification). That's the *endpoint* this hands off to — not what we're designing. The finish line for this doc is a **reliable, tested dataset**.

---

## How to read the columns

- **Action** — the lifecycle verb: `Create` · `Edit` (change params of an existing step) · `Modify` (reorder / enable / disable) · `Remove` · `Read` (inspect, no change). Everything here should be create-**and**-edit-able, not create-only.
- **Scope** — `Table` (one source) · `Model` (across the joined model / multiple tables) · `Either`.
- **Built** — rough state today: `✅` built · `◑` partial · `○` not built. _From CONTEXT/memory — verify against code before building any single item._
- **Tier** — **proposed** demo scope, for us to decide together: `P1` core demo · `P2` next · `—` later/out. Nothing here is locked.

---

## 1. Bring in data (ingest)

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 1 | Fetch warehouse tables by name | Create | Table | ✅ | P1 | "fetch dim_accounts, support_cases, call_metrics" |
| 2 | Drop / upload a file (CSV/Excel/Parquet/JSON) | Create | Table | ✅ | P1 | drag csm_account_mapping.csv onto canvas |
| 3 | Pull fresh data from an app/API via Python | Create | Table | ◑ | P1 | Pendo NPS via a Python block + API key |
| 4 | Connect cloud storage (Drive / SharePoint) | Create | Table | ◑ | — | qbr_notes from Drive |
| 5 | Union / append same-schema tables | Create | Table | ○ | — | stack 12 monthly export files |

## 2. Understand / profile (the "look first" step)

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 6 | Profile a column (type, null %, distinct, min/max) | Read | Table | ◑ | P1 | "are these tables clean?" → agent samples all 5 |
| 7 | Detect candidate keys + cardinality | Read | Either | ◑ | P1 | account_id is the key, 1:many to support_cases |
| 8 | Check join-key coverage / overlap | Read | Model | ◑ | P1 | "NPS only covers 24% of accounts" |
| 9 | Find duplicates | Read | Table | ○ | P1 | duplicate account rows |
| 10 | Find outliers / invalid values | Read | Table | ○ | P1 | negative resolution_time_hours |

## 3. Clean / fix quality

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 11 | Fix nulls (fill / drop / default) | Create | Table | ✅ | P1 | fill null resolution_time_hours |
| 12 | Change / cast type | Create | Table | ✅ | P1 | text → date, text → number |
| 13 | Deduplicate (drop / keep latest) | Create | Table | ◑ | P2 | keep latest row per account |
| 14 | Trim whitespace / fix casing | Create | Table | ✅ | P2 | standardize region text |
| 15 | Replace / map values | Create | Table | ✅ | P2 | "US" → "United States" |
| 16 | Parse / standardize dates & timezones | Create | Table | ○ | P2 | normalize created_at |
| 17 | Split / merge columns | Create | Table | ○ | — | full name → first/last |
| 18 | Flag / remove invalid rows | Create | Table | ○ | — | drop rows with future dates |

## 4. Transform / shape (per table)

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 19 | Filter rows (condition / category) | Create | Table | ✅ | P1 | tier = "Enterprise" |
| 20 | Filter by date range (relative / absolute) | Create | Table | ◑ | P1 | last 1 year of cases |
| 21 | Add computed column / formula | Create | Table | ✅ | P1 | p1_cases_open |
| 22 | Remove / hide columns | Remove | Table | ✅ | P1 | drop internal_id |
| 23 | Rename columns | Edit | Table | ✅ | P2 | acct_nm → account_name |
| 24 | Sort | Read | Table | ✅ | P2 | by health score desc |
| 25 | Sentiment / NLP on text (Python) | Create | Table | ✅ | P1 | nps_sentiment from comment |
| 26 | Aggregate / group-by | Create | Table | ○ | P2 | cases per account |
| 27 | Window function (latest / rank / running) | Create | Table | ◑ | P2 | latest case per account (SQL) |
| 28 | Bucket / bin | Create | Table | ○ | — | score → tier |
| 29 | Pivot / unpivot | Create | Table | ○ | — | wide ↔ long |
| 30 | Arbitrary SQL / Python transform | Create | Either | ✅ | P1 | custom SQL step |

## 5. Join / combine into a model

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 31 | Join two tables (choose key + type) | Create | Model | ✅ | P1 | left join on account_id |
| 32 | Set cardinality (1:1, 1:many, many:1) | Edit | Model | ✅ | P1 | accounts 1:many cases |
| 33 | Handle fan-out / double-count after join | Modify | Model | ○ | P1 | de-dupe before aggregate — the canonical "plausible-but-wrong" failure (research) |
| 34 | Define the model's grain | Edit | Model | ○ | P2 | one row per account |
| 35 | Review the joined result before commit | Read | Model | ◑ | P1 | preview 10 joined rows |

## 6. Model-scope operations (across all/multiple tables)

_The class your examples pointed at — one instruction that fans out. A human does these table-by-table; the agent does them in one shot._

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 36 | Filter the whole model by a date range | Create | Model | ○ | P1 | "make the model last-12-months" → every dated table |
| 37 | Remove a column from the model | Remove | Model | ◑ | P1 | drop a column everywhere it appears |
| 38 | Formula across tables (cross-table) | Create | Model | ○ | P2 | health score from cases + NPS + defects |
| 39 | Apply a clean rule model-wide | Create | Model | ○ | — | trim text on all string cols |

## 7. Test / validate for reliability

_The agent's Spotter/query skill, used to prove the dataset is trustworthy — not the AI-readiness layer._

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 40 | Ask questions of the model (query it) | Read | Model | ✅ | P1 | "which accounts are at-risk?" |
| 41 | Run the plan's sample questions as a test suite | Read | Model | ◑ | P1 | the questions from the plan artifact |
| 42 | Reconciliation / row-count checks | Read | Model | ◑ | P1 | joined total matches source |
| 43 | Spot-check known records | Read | Model | ○ | P2 | "does account 123 show correctly?" |
| 44 | Re-test after a change (regression) | Read | Model | ○ | P2 | re-run after editing a join |

## 8. Manage / edit existing work (applies to everything above)

_Agents tend to only **create**. These make the surface truly editable — day-to-day reality._

| # | Activity | Action | Scope | Built | Tier | Example |
|---|----------|--------|-------|-------|------|---------|
| 45 | Edit an existing step's parameters | Edit | Either | ◑ | P1 | change a filter's threshold |
| 46 | Reorder transform steps | Modify | Table | ○ | P2 | move clean before filter |
| 47 | Disable / re-enable a step | Modify | Either | ○ | P2 | toggle a chip off |
| 48 | Remove a step / chip | Remove | Either | ◑ | P1 | delete a formula |
| 49 | Change an existing join | Edit | Model | ✅ | P1 | swap key or join type |
| 50 | Undo / roll back | Modify | Either | ✅ | P1 | undo last agent action |
| 51 | Re-run a step after upstream change (stale) | Modify | Either | ○ | P2 | source refreshed → recompute |

---

## Endpoint (out of scope, noted for the handoff)

Once the dataset is **reliable + tested**, it's handed to the AI-readiness layer (semantics, descriptions, certification). We are **not** designing that here — this doc stops at a trustworthy dataset.

---

## Next: scoping pass

Mark each row's **Tier** (P1 / P2 / —). The proposed P1 set traces the demo story: ingest (1,2,3) → profile (6,7,8,**9,10**) → clean the flagged issues (11,12) → transform incl. sentiment + date filter (19,20,21,22,25,30) → join + review (31,32,**33**,35) → model-wide date filter + column removal (36,37) → test (40,41,42) → edit/undo (45,48,49,50). Everything else is P2 or later.

**Research-informed upgrades (2026-07-11, from `2026-07-10-data-agents-in-the-wild.md`):** #9 dupes + #10 outliers → P1 (profiling depth = uncontested white space; Genie scored 0% on messy schemas precisely because no agent profiles/cleans) · #33 fan-out → P1 (the canonical plausible-but-wrong failure — "a 3-item order silently triples its revenue"; an agent that *detects* fan-out after a join is a demo moment no competitor can show). The already-P1 spine (profile → clean → evidence-backed joins → test) is validated as uncontested; the consume/Q&A end stays lean because that side is crowded.

Related: UI-treatment backlog in `2026-07-09-transformations-worklist.md`; competitive research in `2026-07-10-data-agents-in-the-wild.md`; agentic interaction patterns still to be written up (`research/2026-07-10-agentic-workflow.md`).
