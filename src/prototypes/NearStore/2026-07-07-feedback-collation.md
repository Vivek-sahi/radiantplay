# Agent DB — feedback collation (2026-07-07)
Collated from the Slack thread (harviish.rao's summary + replies) and the Loom review comments. Purpose: single triage list to walk through when syncing with @harviish.rao on the final use-case list, then drive the UX update Rahul asked for.

**Sources**

- **[Loom]** = inline comments on the walkthrough video (Rahul, Abhinav, Harviish).
  
- **[Slack]** = the design thread (Dmitrii, Bharath, ashok.anand, Abhinav, tushar, Kaushik, Harviish).
  

**Status legend** — 🟢 agreed / has consensus · 🟡 open, needs a decision · 🔵 dependency / owned elsewhere

**Buckets** (per Vivek's split): **A. UI improvements** to the current model-cache prototype · **B. New use-cases** to add to the caching product · **C. Open design debates** · **D. CDW / connection-cache** — a separate product surface, not the current cache prototype.

* * *
## Current workflow (as built) — the screens each fix maps to
| ID | Screen / step | Component | Notes |
|----|---------------|-----------|-------|
| **W1** | Data objects (landing list) | `DataObjectsView.tsx` | Model · Source (Snowflake) · **Query = Cached\|Live pill** · Tables · Rows. Row click → W2. |
| **W2** | Model → **Caching** sub-tab | `CachingTab.tsx` | Sub-tabs Columns/Joins/Data samples/Dependents/**Caching**. |
| **W2a** | · Not-cached state | `CachingTab.tsx:156` | Centered "Cache {model}" CTA + learn-more. |
| **W2b** | · Caching-in-progress state | `CachingTab.tsx:138` | `LoadingIndicator` ~6s spinner. |
| **W2c** | · Cached state | `CachingTab.tsx:199` | Cache Settings block + Edit + More (Refresh/Purge/Disable) + per-table table + View run history. |
| **W2d** | · Failed state | `CachingTab.tsx:203` | Full-width page `Alert` + View details. |
| **W3** | Caching Settings modal | `CachingSettingsModal.tsx` | Shared enable+edit. Scope (Full\|Custom) · per-table windows · refresh frequency · footer. |
| **W4** | Run history modal | `RunHistoryModal.tsx` | Run list ↔ per-table detail. |
| **W5** | Data store view | `DataStoreView.tsx` | Capacity (Purchased/Used/Available + bar) + Cached-models table. Left-nav, Governance. |

* * *
## A. UI improvements (current model-cache prototype)
### A1 — Caching progress: drop the spinner, route to Run history 🟢
Don't show a loading circle / lock the screen while caching — it's async and can take minutes+. Instead set status to "Caching" and take the user to **Run history**, where the in-progress run is shown; add a refresh-status button.

- **Where:** **W2b** (replace the `LoadingIndicator` state, `CachingTab.tsx:138-153`) → open **W4** with an in-progress run row. Trigger is `scheduleRebuild`/`handleSaveConfig` (`CachingTab.tsx:123-135`); also fires from the Refresh action in W2c.
  
- [Loom] Rahul (2:06, +1) · [Slack] Bharath (Fri, ACK + +1) · [Loom] Harviish: "agree"
  
- **Consensus item.**
  
### A2 — Caching Settings modal: footer layout + "Also cache now" 🟡
Cancel button is misplaced — put it next to Save. Replace the grey banner message with a **checkbox at the bottom-left of the footer: "Also cache now"**. Unchecked = save settings and run only on schedule.

- **Where:** **W3** footer (`CachingSettingsModal.tsx:124-133`) + the info/warning banner it replaces (`:331-350`).
  
- [Loom] Abhinav (1:52)
  
### A3 — Table list scrollable 🟢
The per-table list should scroll when it gets long.

- **Where:** **W3** Custom per-table list (`CachingSettingsModal.tsx:184-250`). Note the whole modal body already scrolls (`:135`); this asks for the table region to scroll independently.
  
- [Loom] Rahul (5:56, +1)
  
### A4 — Query column (Cached | Live): flip prominence + live dot 🟡
Flip the colour prominence — **more on "Live", less on "Cached"**. For Live, add a **dot** to signal the connection is actively updating. - **this needs exploration.**

- **Where:** **W1** Query column, the `StatusPill` (`DataObjectsView.tsx:25-34`). Reconcile with A5 (same column).
  
- [Loom] Abhinav (0:39)
  
### A5 — "Cached" tag: last-refresh affordance + column rename 🟡
Show the **last refresh date on hover** over the Cached tag. Open question: tooltip vs. always-exposed? Consider **renaming the column** — e.g. "Last cached" with values like "Live query" / "5 days ago" instead of a Cached|Live pill.

- **Where:** **W1** Query column header + pill (`DataObjectsView.tsx:26-34`, label at `:27`). Design A4 + A5 together — they touch the same cell.
  
- [Loom] Harviish (0:52, +1) · Abhinav (reply, ✅)
  
### A6 — Data store capacity: de-dupe + reorder cards 🟡
Purchased / Used / Available values **plus** the green bar may be duplicate info. Counter-view: the values + bar are good status indicators — instead **reorder the cards to Used → Available → Total (purchased)** so they map to the bar graphic.

- **Where:** **W5** capacity overview — StatCards (`DataStoreView.tsx:89-93`) + ProgressBar (`:95-102`, which already prints "X of Y · Z%").
  
- [Loom] Rahul (11:10, +1 — "duplicate?") · Abhinav (reply — keep, reorder)
  
### A7 — Rename "Data store" → "Agent DB" 🟢
Rename the surface to **Agent DB** (per Ketan). Rahul's variant: "Agent DB near cache".

- **Where:** **W5** SectionHeader title (`DataStoreView.tsx:67`) + left-nav label (`Shell.tsx`) + page copy.
  
- [Slack] Dmitrii (ACK) · [Loom] Rahul
  
### A8 — Model tabs: caching-as-a-tab may not scale 🟡
The model already has many tabs (Columns/Joins/Data samples/Dependents + Column security, Custom actions, Spotter optimization, Instructions in the product). Adding a "Caching" tab may not fit. Explore an alternative — e.g. a **UI chip that enables the caching workflow**. Also: what happens when a model is **not** cached — does the tab still show?

- **Where:** **W2** the Caching sub-tab / IA itself, and **W2a** (not-cached entry). IA rethink, bigger than a tweak.
  
- [Loom] Abhinav (1:09)
  

* * *
## B. New use-cases to add (caching product)
### B1 — Model change → cache invalidation flow 🟡 (design owed by Vivek)
On any model change after caching:

1. Immediately stop serving from cache.
  
2. Classify change: **non-destructive** (description, synonyms) → no rebuild; **destructive** → needs re-cache.
  
3. For destructive changes: wait for an explicit user re-cache action (so we know they're done with N edits) **or** the next scheduled refresh.
  
4. **Design needed:** a notice like _"The detected schema change will reflect in cache after the next scheduled refresh, or you can [Refresh now]."_
  

- **Likely lands in:** W2c (Cached state banner) + W1 pill state.
  
- [Slack] Harviish summary
  
### B2 — Serving indicator in Spotter & Liveboards 🟡
Surface to the end-user whether data was served **Live or Cached**; if cached, show "Last updated on". (Outside the current prototype's surfaces — Spotter/Liveboard screens.)

- [Slack] Harviish summary
  
### B3 — Let the user choose LIVE over cached ("this is big") 🟡
Allow a user to force a **live query over the cached dataset**. Dmitrii likes it but flags it touches many layers. Backup plans: (a) just let the user disable cache; (b) power-user URL that disregards cache.

- [Slack] Harviish summary · Dmitrii · Harviish (backup)
  
### B4 — Purge in MVP + purge/update events in Run history 🟢
Purge **is** in MVP v1 (PII right-to-be-purged). Run history should log **purges and model-update (data-editing) events** alongside scheduled/ad-hoc runs.

- **Where:** W4 Run history (add event types) — purge already exists in W2c's More menu.
  
- [Slack] tushar (Q) · Harviish ("Yes to both") · Kaushik (confirm)
  
### B5 — Cache hit / analytics (hit-miss rate) 🟡 (bring back for MVP?)
Show whether the cache is actually being used: **hit-miss rate**, categorization (liveboard vs. spotter queries), and miss examples (filter on order date but queries hit another date col; a 13-month window but queries reach beyond it). V1 had an **Analytics section** (Total queries 12,000 · cached 75%/9,000 · live 25%/3,000) that was dropped for MVP over complexity (Rahul) — not removed from the product. ashok: "queries on cached data is good to keep."

- **Where:** W2c Cached state (re-add Analytics block). **Decision pending:** MVP-critical?
  
- [Slack] ashok.anand · Abhinav · Harviish
  
### B6 — Custom calendar caching 🔵 (dependency)
A custom calendar isn't a table in the model but is assigned to columns; its underlying table also needs to be cached. Solutioning not done yet — @tushar.marda is working on it.

- [Slack] Bharath · Rahul
  

* * *
## C. Open design debate — resolve before building
### C1 — Time window: model-level vs. table-level 🟡
- **Rahul:** keep the time window at **model level only**, not per-table (may add later).
  
- **Harviish:** since models aren't denormalized, the filter has to be applied **per table** — so what would a "model-level" filter even look like?
  
- **Vivek's case:** a dimension table wanted for all history vs. fact tables wanted for 13 months ⇒ needs table-level windows.
  
- **Rahul:** a common window could apply to all tables where "all history" isn't selected.
  
- **Vivek:** unclear how "all history" coexists with individual per-table selection.
  
- **Current build:** W3 Custom scope already does **per-table** windows (`CachingSettingsModal.tsx:184-250`). Feedback trends toward the _simpler_ model-level model. Needs a call — directly reshapes W3.
  

* * *
## D. CDW / connection-cache — separate product (confirm bucket)
> These are about **Agent DB as a Data Store / warehouse**, distinct from the model-cache prototype. Flagging as CDW / connection-cache territory — Vivek to confirm what belongs here.
### D1 — "Agent DB as Data Store" use case 🟡
Beyond the Near Store (model cache), customers use Agent DB as a **data warehouse**: ELT jobs populate Agent DB tables and liveboards run off them. Dmitrii: both use cases should be represented (unlikely together, but not mutually exclusive). Open threads:

- Reuse **DataFlow (DF) UI** for the store demo? It's Angular / needs a rewrite; Rahul warns the old UI "sets wrong expectations on readiness". Option: present the **store demo via APIs**.
  
- Productionalization Qs (Bharath): same DF instance as cache? which sources? data isolation? user management? publishing / table visibility in TS?
  
- ashok: "all 3 use cases should land"; do we need **Data objects and Data store separate** in the left nav? If Data store is primarily the ELT store use case, don't mix the two.
  
- **Status:** product scoping, not yet UX-actionable. Needs the use-case sync.
  
- [Slack] Dmitrii · Bharath · ashok.anand · Abhinav · Rahul
  

* * *
## Quick apply-map (UI improvements → screen)
| Fix | Screen | Action |
| --- | --- | --- |
| A1  | W2b → W4 | Replace spinner with "Caching" status + in-progress run in Run history |
| A2  | W3 footer | Cancel by Save; add "Also cache now" checkbox (unchecked = schedule only) |
| A3  | W3 custom list | Make per-table list scrollable |
| A4 + A5 | W1 Query column | Flip prominence to Live, Live dot, hover last-refresh, maybe rename "Last cached" |
| A6  | W5 capacity | De-dupe / reorder cards (Used → Available → Total) |
| A7  | W5 + Shell nav | Rename "Data store" → "Agent DB" |
| A8  | W2 IA | Rethink Caching tab vs. chip; define not-cached case |
| C1  | W3 scope | **Contested** — per-table vs. model-level window |
| B4  | W4  | Add purge + model-update events |
| B5  | W2c | Re-add Analytics block (pending MVP decision) |
## Next steps
1. Sync with @harviish.rao on the **final use-case list** (Vivek is blocked on this per the thread).
  
2. Lock **C1** (time-window scope) and **B5** (analytics in MVP?) — both change the current screens.
  
3. Confirm the **D / CDW** bucket assignment.
  
4. Then apply the 🟢 UI improvements and share updated UX (Rahul's ask).
