# Near Store — session context (read at session start)

Radiant Play prototype. Read this first, then `DECISION-MEMO.md` and `USE-CASES.md` for
product rationale/scope. `PLAN.md` = original build plan; `CACHING-UI-FIXES.md` = a fix
batch that has since been applied.

## What it is
ThoughtSpot's data caching offering. Customers cache model data they query live from
**Snowflake** into the ThoughtSpot **data store** to cut live query cost + speed up loads.
Lives inside the Data workspace.

## Naming
Renamed **Agent DB → Near Store** (2026-07-14). "Near Store" is the name everywhere now: user-facing
copy (nav, titles, tooltips, overview page), registry id `NearStore`, route `/playground/NearStore`,
the folder `src/prototypes/NearStore/`, and the component symbol `NearStore`. No `AgentDB` left in
this prototype. (The `agentdb` connection label inside DataStudioV2 is a separate prototype — unrelated.)

## Where it lives / how to run
- Code: `src/prototypes/AgentDB/`. Registered in `src/prototypes/registry-mine.ts` (id `NearStore`).
- Route: `/playground/NearStore`. Standalone explainer page: `/near-store-overview.html` (in `public/`).
- Run: the combined `npm run dev` dies if the feedback server's port 3737 is already taken
  (`--kill-others`). Run **`npx vite`** directly instead. Ports 5173–5179 were busy last
  session so it landed on **5180** — the port varies; check the vite output.
- Verify: `npx tsc --noEmit` (whole repo has pre-existing DataStudioV2/SpotterPrep errors —
  filter to `AgentDB`) and `npm run build` (Vite, passes).

## Surfaces
- **Data objects** (default landing) — model list: object icon (`table`) + `Source` (Snowflake)
  + **`Query` column: Cached | Live** (Cached = has a live snapshot; purged/not-cached = Live)
  + Tables + Rows. Click a model → its Caching tab.
- **Data store** (left-nav, Governance) — admin capacity: Purchased / Used / Available + bar,
  and a Cached-models table (Model · Tables · Cache size · Cache scope · View details).
- **Model → Caching tab** (sub-tabs: Columns/Joins/Data samples/Dependents/**Caching**; only
  Caching is real). States:
  - Not cached → centered "Cache {model}" CTA + learn-more (opens overview page).
  - Cached → Cache Settings block (Cache scope, Refresh frequency + detail line, Cache size,
    Next scheduled run) + **Edit** + **More (Refresh / Purge current cache / Disable)** +
    **View run history** button.
  - Failed → **full-width** failure `Alert` (`variant="page"`) with a **View details** button
    that opens the run-history modal.
  - Loading state (LoadingIndicator, ~6s) on enable/refresh; **success + purge = toasts**.

## Caching model (the core)
- **Caching Settings modal** (M3 width; shared by enable + edit):
  - **Cache scope**: Full Model | Custom.
  - Full Model → all tables, all history; only refresh frequency editable.
  - Custom → per-table rows (`All history | Time window`). A windowed table defaults to its
    **first date column** (editable). Tables with **no date column** can't be windowed (segment
    disabled + note). No multi-date "flag/require" flow, no apply-to-all, no table selection.
  - **Refresh frequency** is frequency-aware: **Daily** → Exclude weekends; **Weekly** →
    day-of-week chips (M T W Th F Sa S); **Monthly** → comma day-of-month input (`1,10,20`).
  - Info ⓘ tooltip on the "Cache setting" header explains time-window behaviour.
- **Run history modal**: two states — run list ↔ per-table run detail (back button).

## Key decisions (see DECISION-MEMO.md for full rationale)
Everything is scoped by **correctness / model integrity**. We only cache along a boundary the
engine can guarantee — a **time window on a date column**. Deferred (NOT in MVP), all for
correctness: **table selection** (breaks joins), **per-table refresh** (freshness skew across
joins), **row filters** (biased subset), **column selection** (open question). In Custom, every
table defaults to **All history**; windowing is a deliberate per-table opt-in.

## Design-system gotchas
- **Typography `color="gray"` resolves to `content-primary` (black)** in this DS — a naming
  quirk. Use **`color="gray-light"`** for secondary/grey text. All AgentDB text uses gray-light.
- Tokens only (no hardcoded hex/spacing). Text via `Typography`; a few bespoke bits use tokens
  from `styles.ts`. Object/source icons use Radiant `Icon` (`table`), not fake logos.

## File map
`index.tsx` (shell + view state) · `types.ts` · `data.ts` (mock models) · `utils.ts` (format +
schedule helpers) · `styles.ts` (token refs + dark-shell). `components/`: `Shell.tsx` (top bar +
sidebar) · `DataObjectsView` · `DataStoreView` · `ModelView` · `CachingTab` ·
`CachingSettingsModal` · `RunHistoryModal` · `primitives.tsx` (StatusPill, StatCard, KeyValue,
SectionHeader).

## Git / status
Branch `prototype/data-studio` (designer fork → push `origin` only; NOT pushed yet). Commits:
`e769afa` (prototype) → `e10511b` (overview + docs) → `f966abf` (caching UX refinement) →
this session's commit (full-width failure banner + Product Telemetry removed from mock data).

## Possible next steps
- Push to `origin` if desired.
- Column-level caching is the open scope question (see DECISION-MEMO §open questions).
- The overview page (`/agentdb-overview.html`) could gain a "why this scope" section.
