# Pulse (AgentDB) — session context (read at session start)

> ## ⚠️ FROZEN — do not change this prototype
>
> This has been **handed to engineering and built from**. It is a shipped SKU, not a live
> sketch. The code here must stay as the developers received it.
>
> - **No new features, no refactors, no "improvements" — nothing without Vivek saying so.**
> - **No other prototype may import from `src/prototypes/NearStore/`.** If something else needs
>   this caching UI, it takes its **own copy**. Data Studio has one at
>   `DataStudioMVP/components/cache/nearstore/` (and the same in `DataStudioV2`).
> - This rule exists because it was broken once. On 2026-08-12 the cache window list was moved
>   into a shared folder so Data Studio's canvas could use it, and Data Studio's short windows
>   (24h / 3d / 7d) appeared in **AgentDB's** dialog, which only ever offered months. Undone on
>   2026-08-26: AgentDB restored byte-for-byte to the handoff commit `06c51de`, Data Studio given
>   its own copy, the shared folder deleted.

## What it is
ThoughtSpot's data caching offering. A customer caches a model they'd otherwise query live from
the source into ThoughtSpot's own data store — cutting live query cost and speeding up loads.
Lives inside the Data workspace.

**This is the first of two offerings on the data store.** The second — caching **connections and
tables** (a separate, ELT-style journey starting from a new store-compatible connection type) — is
a different product and is **not** built here. Do not grow this prototype into it.

## Naming — three names, all in use
| Name | What it means | Where it appears |
|---|---|---|
| **Pulse** | the product | user-facing copy: nav, tab, dashboard title |
| **AgentDB** | the store itself | user-facing: "cached in AgentDB", the "Powered by AgentDB" chip |
| **NearStore** | code only | route `/playground/NearStore`, folder, registry id, component symbol |

"Near Store" is a **retired product name** — it should appear in no user-facing copy. The code ids
were deliberately left alone; renaming them is the risky part and buys nothing.

## Where it lives / how to run
- Code: `src/prototypes/NearStore/`. Registered in `registry-mine.ts` (id `NearStore`).
- Route: `/playground/NearStore`. Explainer page: `/near-store-overview.html` (in `public/`).
- Run: **`npx vite`** — the combined `npm run dev` dies if the feedback server's port 3737 is
  taken. The port varies (5173+ are often busy); read it from the vite output.
- Verify: `npx tsc --noEmit` (repo-wide baseline is ~510 errors from other prototypes — NearStore's
  own count must be **0**) and `npm run build`.
- Deployed at **radiantplay-nine.vercel.app/playground/NearStore**, from branch
  `github prototype/data-studio`. That is the link the team and engineering use.

## Surfaces — the data-person side (this is the built product)
- **Data objects** (landing) — the model list. Checkbox rows; Name / Source / Type / Tags /
  Author / Last modified. Cached models carry the `database-zap` glyph in brand blue. Click a
  model → its Caching tab.
- **Pulse** (left nav, under Governance) — the admin dashboard. Title + "Powered by AgentDB" chip.
  Three tiles: **Usage** (a meter — "62.4 GB of 100 GB used" + bar + "37.6 GB left", *not* a big
  number, which misread as available), **Models cached**, **Rows cached**. Table below:
  Model (clickable) · Rows · Size · Status · Refreshed. Lists **only cached models**.
- **Model → Caching tab** — sub-tabs Columns / Joins / Data samples / Dependents / Instructions /
  **Caching**; only Caching is real. States:
  - **Cacheable, not cached** → grey `NoData` box, database-stack illustration, **"Cache Model"**
    CTA + Learn more.
  - **Not cacheable** → same layout, **no button** (reason-forward). Reasons come from the
    Cacheability API: `CACHING_DISABLED_ON_ORG` / `UNSUPPORTED_CONNECTOR` /
    `MISSING_CUSTOM_CALENDAR`. One sample: **"CSAT Survey Uploads"** (a CSV upload) — reachable
    from **Data objects, not Pulse**.
  - **Cached** → Cache settings block (scope, refresh frequency + detail, size, next run, last run
    with status pill) + Edit + More (Refresh / Purge / Disable) + View run history.
  - **Failed** → the `Error` pill on the Last run row + a **View details** link into run history.
    There is deliberately **no red page banner**.

## The caching model
- **Caching Settings modal** (shared by create + edit):
  - **Cache scope**: Full Model | Custom. Full = every table, all history.
  - Custom → per-table `All history | Time window`. A windowed table defaults to its first date
    column. Tables with no date column can't be windowed.
  - **Window durations: months only — 1 · 3 · 6 · 13.** ⚠️ Hours and days are Data Studio's
    requirement and must not be added here. See the frozen notice.
  - **Refresh frequency** is frequency-aware: Daily → exclude weekends; Weekly → day chips;
    Monthly → comma day-of-month input.
  - The "all columns are cached" disclaimer sits **below** "Also cache now" and shows on
    **create only**.
  - **"Also cache now" is create-only.** Edit just saves; the cache updates on schedule or via
    Refresh cache.
- **Run history modal**: run list ↔ per-table run detail. Scheduled + Ad-hoc runs only.
- Purge and Disable go through `ConfirmModal` (a left-aligned Radiant `Modal`), not the DS
  `ConfirmDialog`.

## Decisions that are settled — don't reopen without asking
- **Scope is driven by correctness / model integrity.** We only cache along a boundary the engine
  can guarantee: a time window on a date column. Deliberately **deferred**: table selection
  (breaks joins), per-table refresh (freshness skew across joins), row filters (biased subset),
  column selection (open question). In Custom, every table starts at All history.
- **Status vocabulary is `In progress` / `Success` / `Error`. Nothing else.** No "Invalidated",
  no "Purged" status. Decided on the 2026-08-04 team call.
- **Copy:** "directly from source", never "Snowflake", in caching copy. Consumption surfaces say
  "warehouse". Sentence case throughout. "Refresh" is correct (not "Reload"). The CTA is
  **"Cache Model"**.
- A **purged** model shows Cache size "—" plus a `Purged` status pill.

## On hold — no development, will come back
- **The "model changed" state** (internally `paused`). A model edited after it was last cached
  shows a warning banner on the Caching tab — "the cached data is out of date … queries are
  running live directly from source until it's rebuilt". It is **not** a status, so the model
  reads `Success` in the Pulse list. Whether this state should exist at all is open: engineering
  may simply fail the cache instead. **Parked — no new work.**
- **The whole business-user / consumption side.** Freshness markers on Spotter, Search data and
  Liveboard are built as *comparison variants* (4 Spotter, 3 Liveboard) behind the surface
  switcher — nothing has been picked, and nothing should be until this is taken up again. The
  concept: freshness is a property of the data at the answer grain, shown as a clock glyph + dot
  (green = live, blue = cached). **Parked.**
- **Open question for engineering** (unanswered): does the Liveboard's board-level ↻ "get the
  latest data" bypass the AgentDB cache? For a cached model that copy is false — the refresh
  re-runs but still reads the snapshot. Proposed 3-verb split: Reload (view) / Updated-as-of
  (recency) / Get live (bypass).
- Minor, undecided: the `database-zap` glyph is brand blue for cached, "model changed" and
  refreshing alike. Also the design-system gap: SegmentedControl and Select differ in height.

## Design-system gotchas
- **`Typography color="gray"` renders as content-primary (black)** — a naming quirk. Use
  **`color="gray-light"`** for secondary grey.
- **`--rd-sys-color-content-subtle` is undefined** in `src/styles/tokens.css`. The DS
  `Illustration` paints via currentColor and so falls back to near-black. Empty states use a real
  SVG (`public/near-store/empty-state.svg`, from Figma `jysekNm0kYZrMwZ4rQRBcR` node 419:2539)
  rather than DS line art — the DS set has no cache/database illustration, and its lock wrongly
  implied a permission block.
- Toasts are widened to 600px (`.toastWide`, `!important` over the DS 400px cap).
- Tokens only — no hardcoded hex or px. 0 inline styles; 7 CSS modules. Icons come from Radiant
  `Icon`, never drawn glyphs.

## File map
`index.tsx` (shell + view state) · `types.ts` · `data.ts` (mock models) · `utils.ts` · `styles.ts`
· `spotterData.ts`.
`components/`: `Shell` (top bar, sidebar, surface switcher) · `DataObjectsView` · `DataStoreView`
(the Pulse dashboard) · `ModelView` · `CachingTab` · `CachingSettingsModal` · `RunHistoryModal` ·
`primitives` (StatusPill, StatCard, KeyValue, SectionHeader, ConfirmModal, FloatingToast) ·
`DatabaseZapIcon`.
Consumption (parked): `SpotterSurface` · `SearchDataSurface` · `LiveboardSurface` · `CacheMarker` ·
`ModelPickerModal` · `WarehouseIcon` · `SurfacePlaceholder`.

## The rest of the doc set
`DECISION-MEMO.md` (why the scope is what it is) · `USE-CASES.md` · `2026-08-04-team-action-items.md`
(the 13 items from the team call) · `2026-07-28-data-freshness-industry-research.md` ·
`2026-07-27-business-user-requirements.md` + `2026-07-27-session-log.md` (the parked consumption
side) · `2026-07-14-radiant-audit.md` · `PLAN.md`, `CACHING-UI-FIXES.md`, the two 2026-07-07
feedback files (all historical).

## Git
Branch `prototype/data-studio`, remote **`github`** (github.com/Vivek-sahi) — that is the one
Vercel deploys and engineers read. Do **not** push to `upstream` (Faris), `komal`, or `origin`
without being asked. Last commit to touch this prototype's code: `06c51de`.
