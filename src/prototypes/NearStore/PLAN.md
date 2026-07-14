# Near Store — Technical Implementation Plan (v2, mock-aligned)

Radiant Play prototype · `src/prototypes/NearStore/` · registered in `registry-mine.ts`

---

## 0. Decisions locked (from your answers) + open reconciliations

**Locked:**
- **Shell:** reproduce ThoughtSpot's real dark shell (icon rail + dark *Data workspace* sidebar + light content), built with Radiant tokens.
- **Data store:** new **left-nav item under GOVERNANCE** (near *Usage*).
- **Custom cache:** handled in the **same Caching Settings modal** — `Cache Window = Custom` reveals per-table settings.

**Please confirm / correct these 3 small reconciliations (mocks are older than your verbal spec):**
1. **Per-table window options.** Mock shows a binary **Full Table | 13 Months** toggle. Your verbal spec said **1 / 3 / 6 / 13 months**. Plan: toggle is **Full Table | Time window**, and when *Time window* is chosen show a small **months Select (1/3/6/13, default 13)** + the **Select column** reference dropdown. → Reject if you want the literal binary Full Table | 13 Months.
2. **Prominent last-run success/failure.** The cached mock doesn't have a big banner; you said the outcome should be **prominent**. Plan: a status indicator (pill + inline `Alert` on failure) at the **top of the cached Caching view**, above Cache Settings — in addition to the Run History Status column.
3. **Run detail / "View Log".** Mock shows a **View Log** link per run; you described **clicking a run to see per-table detail**. Plan: *View Log* (and clicking the row) opens a **per-table run breakdown** (what happened to each table + per-table size), not a raw text log.

---

## 1. Product context

**Near Store** is ThoughtSpot's data caching offering. Customers query models live from
Snowflake; Near Store caches that model data inside ThoughtSpot to cut live query cost and
improve load performance. This prototype covers the **admin capacity view** (Data store)
and the **modeler caching experience** (model → Caching tab), both inside the Data workspace.

---

## 2. Shell & navigation (match the mocks)

Prototype-local chrome, tokens only. No router — in-memory view state.

- **Left icon rail** (dark): charts · **database (active)** · code `</>`.
- **Data workspace sidebar** (dark): title "Data workspace" + ⊕.
  - Group 1: **Data objects** (active/blue), Connections, Analyst Studio ↗, Utilities, Sync
  - **GOVERNANCE**: Data catalog, Usage, **Data store** *(new)*, dbt, Liveboard verification
- **Content (light):**
  - *Data objects* → **model list** (see §6).
  - *Data store* → **capacity admin view** (§4).
  - **Model view** (drill-in): eyebrow "MODEL" + title (e.g. *Dunder Mifflin Sales*) +
    description + right actions *Search on this model* · *Edit model* · ⋯, then sub-tabs
    **Columns · Joins · Data samples · Dependents · Caching**. Only **Caching** is built;
    the rest are inert stubs.

```ts
type View =
  | { kind: 'objects' }
  | { kind: 'datastore' }
  | { kind: 'model'; modelId: string; tab: 'caching'; run?: string };  // run set = run-detail open
```

---

## 3. Data model (types.ts)

```ts
type CacheWindow  = 'full' | 'custom';            // "Full Model" | "Custom"
type CacheStatus  = 'not_cached' | 'cached' | 'refreshing' | 'purged';
type Frequency    = 'hourly' | 'daily' | 'weekly' | 'monthly';
type WindowMonths = 1 | 3 | 6 | 13;
type RunType      = 'Scheduled' | 'Ad-hoc' | 'Config change';
type RunStatus    = 'In progress' | 'Success' | 'Failure';

interface Column { id; name; type: 'string'|'number'|'date'|'boolean'; }

interface TableCacheSetting {          // per-table, only when window === 'custom'
  tableId;
  mode: 'full_table' | 'window';
  windowMonths?: WindowMonths;         // when mode === 'window'
  referenceColumnId?: string;          // required when mode === 'window'
}
interface Schedule {
  frequency: Frequency; hour: number; minute: number;   // Daily at 09:00
  excludeWeekends: boolean; timezone: string;            // 'Asia/Calcutta'
}
interface ModelTable { id; name; rowCount; columns: Column[]; }

interface TableRunResult { tableId; status: RunStatus; rows; sizeMB; durationSec; windowApplied; note?; }
interface CacheRun {
  id; runType: RunType; startTime; endTime?; rows?; status: RunStatus;
  tableResults: TableRunResult[];      // powers the run-detail view (§5c)
}
interface DataModel {
  id; name; description; source: 'Snowflake'; tables: ModelTable[];
  cache?: {                            // undefined = never cached (shows CTA)
    status: CacheStatus;
    window: CacheWindow;
    tableSettings?: TableCacheSetting[];   // when window === 'custom'
    schedule: Schedule;
    cacheSizeMB; rowCount; nextRunAt;
    lastRunStatus: RunStatus;              // drives the prominent banner (§5b)
    runs: CacheRun[];                      // newest first
  };
}
interface Capacity { boughtGB; }        // used = Σ cacheSizeMB of cached models; available = bought − used
```

Mock data (~6 models): full-cached, custom-cached, one with a failed last run, one purged
(config kept, no snapshot), two not cached.

---

## 4. Data store (left-nav, GOVERNANCE) — admin capacity view

- **Capacity overview**: `boughtGB`, used, available as stat cards + a `ProgressBar`
  (used/bought, color shifts toward warning as it fills).
- **Cached models table** (`Table`): Model · Tables cached · Cache size · Window (Full/Custom) ·
  Refresh frequency · Last cached · Status · **View details** → that model's Caching tab.

---

## 5. Model → Caching tab

### 5a. Not cached (img 3)
Centered empty state: primary **"Cache {model name}"** button + caption
"By caching this model, you can reduce your live query cost and improve loading performance."
+ **"Learn more about caching"** link. The button opens the **Caching Settings** modal (5d).

### 5b. Cached (img 5)
- **Prominent last-run status** (reconciliation #2) at the very top: Success pill, or a
  failure `Alert` if `lastRunStatus === 'Failure'`.
- **Cache Settings** block (label → value): Cache window (`Full Model`/`Custom`) ·
  Refresh frequency (`Daily, 9:00 AM` + "Excluding weekends" subtext) · Cache size (`256 MB`) ·
  Number of rows (`1.5 Million`) · Next scheduled run (`20 May 2026`).
  Header-right actions: **✎ Edit** (opens modal 5d) · **⋯ More** → **Refresh Cache · Purge Cache · Disable Cache**.
- **If custom** (reconciliation): a per-table settings summary table (Full table vs Last N months + reference column) — from your "they can see settings they chose per table".
- **Run History** (`Table`): Run type · Start time (ⓘ) · End time (ⓘ) · No. of rows · Status
  (In progress / Success / Failure, color-coded) · Logs → **View Log**.

### 5c. Run detail (reconciliation #3)
`View Log` / row click → per-table breakdown `Table`: Table · Status · Rows · Size · Duration ·
Window applied · Note. Back link returns to 5b. (Rendered in-tab via `view.run`.)

### 5d. Caching Settings modal (imgs 4 & 7) — enable + edit
- **Cache Window** `Select`: **Full Model** | **Custom**. Helper: "How much historical data
  to be included in the cache. Older queries will route to the live warehouse."
- **If Custom → Table cache settings** section ("Which tables you want these settings applied to"):
  one row per table — `SegmentedControl` **Full Table | Time window**; when *Time window*:
  months `Select` (1/3/6/13, default 13) + **Select column** `Select` (date columns only, required).
- **Refresh Frequency**: `Select` (Daily/…) + "at" + hour `Select` + ":" + minute `Select` +
  "hours"; **Exclude weekends** checkbox; timezone link (`Asia/Calcutta`).
- **Info banner**: "First Cache will be done today. Future refreshes will follow the schedule above."
  (Enable context.) When editing an existing cache and settings changed, banner instead warns:
  *"Saving will refresh the cache now and delete the existing snapshot."*
- Footer: **Cancel** · **Save**. Save (enable) → status `cached`, seeds first run. Save (edit w/ change)
  → refresh + drop old snapshot.
- Validation: custom windowed tables must have a reference column before Save enables.

### Actions summary
- **Refresh Cache** — manual run (brief `refreshing` state → new Success run prepended).
- **Purge Cache** — `ConfirmDialog`; removes latest snapshot only, **keeps config** → `purged`
  (Cache size → 0, "Cache now to rebuild").
- **Disable Cache** — destructive `ConfirmDialog`; deletes data **and** config → `not_cached` (back to 5a).
- **Edit** — opens modal 5d prefilled.

---

## 6. Data objects tab — cached indicator

Model list; cache-enabled models get a **source + cache** icon variant (Snowflake source glyph
+ small cache accent) meaning "source is still Snowflake, data also cached in ThoughtSpot."
Local `SourceCacheIcon`. Clicking a model → its Caching tab.

---

## 7. File structure

```
src/prototypes/NearStore/
  index.tsx              # shell (rail + sidebar), view state, all cache mutations
  types.ts · data.ts · styles.ts
  components/
    primitives.tsx       # StatusPill, StatCard, KeyValueRow, SectionHeader (tokens)
    SourceCacheIcon.tsx
    Sidebar.tsx          # dark icon rail + Data workspace nav
    DataStoreView.tsx    # capacity + cached-models table
    DataObjectsView.tsx  # model list w/ cache icon
    ModelView.tsx        # model header + sub-tabs
    CachingTab.tsx       # routes 5a / 5b / 5c
    CachingSettingsModal.tsx   # 5d, shared by enable + edit
    RunHistory.tsx · RunDetail.tsx
```

---

## 8. Design-system compliance

Tokens only (incl. dark-shell surfaces via inverse tokens: `background-base-inverse`,
`content-primary-inverse`, `background-brand` for active nav). Radiant components: `Table`,
`Select`, `SegmentedControl`, `ProgressBar`, `Alert`, `Button`, `Modal`, `ConfirmDialog`,
`Menu`, `Checkbox`, `Icon`, `Typography`, layout primitives. Local status pills (tokens).
Prototype-local components only. `npm run build` must pass.
