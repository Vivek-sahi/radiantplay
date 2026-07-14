# Near Store — build spec (prototype, not Figma)

For Near Store, **use this prototype as the source of truth instead of Figma.** It's built in Radiant
Play on the real Radiant design system, so the components, tokens, and layouts you see in the code
are the ones to ship. Read the code as the spec — not just the visuals.

## Run it

- Repo: `github.com/Vivek-sahi/radiantplay` · branch `prototype/data-studio`
- `npm install` → `npx vite` → open **`/playground/NearStore`**
- Code lives in `src/prototypes/NearStore/`
- Live demo: `https://radiantplay-nine.vercel.app/playground/NearStore`

## Demo scenarios — what to open to see each state

Each seed model is deliberately in a different caching state, so you can see every state without
setup. Open a model from the Data objects list → **Caching** tab.

| To see… | Open | What it demonstrates |
|---|---|---|
| **Healthy full-model cache** | **Dunder Mifflin Sales** | Full-model cache, hit/miss analytics (75% / 25%), an in-progress scheduled run, and full run history (scheduled / purge / model-update events) |
| **Custom per-table caching** | **Marketing Attribution** → also click **Edit** | Custom scope with time windows: `web_sessions` last 13 mo, `touchpoints` last 6 mo, `campaigns` all history |
| **Failed cache run (errors)** | **Financial Ledger** | Full-width failure alert → **View details** → per-table failure with a Snowflake timeout note |
| **Caching an uncached model (enable flow)** | **HR Headcount** | "Cache HR Headcount" CTA → settings modal (10-table scrollable list) → ~6s loading → cached + success toast |
| **Model changed → caching paused** | **Supply Chain Inventory** | Warning alert ("model changed, serving live from Snowflake") → **Refresh now** |
| **Capacity / admin view** | Left nav → **Near Store** (Governance) | Storage-utilisation bar + cached-models table |

**Workflows reached via actions** (on any cached model):
- **Edit** cache settings; **More →** Refresh / Purge (toast) / Disable (confirm dialog); **View run history** (list ↔ per-table detail).
- In the settings modal, switch **Refresh frequency** to see: Daily (exclude-weekends), Weekly (day chips), Monthly (days-of-month input); and toggle **"Also cache now"** (cache immediately vs. wait for the next scheduled run).

> State is in-memory — **reload the page to reset** every model to its seed state (e.g. to re-run the HR Headcount enable flow).

## Build coverage checklist

Everything the prototype demonstrates — tick each off while building so nothing's missed:

- [ ] Not-cached **empty state** + "learn more" link
- [ ] Settings modal — **Full** vs **Custom** scope
- [ ] Custom scope — per-table **All history / Time window**, window length, reference **date column**, and the **no-date-column** disabled case
- [ ] **Refresh frequency** — Daily (exclude weekends) / Weekly (day chips) / Monthly (days input) + timezone
- [ ] **"Also cache now"** checked vs unchecked (cache now vs schedule-only)
- [ ] **Loading** state on enable / refresh
- [ ] **Cached-healthy** — settings summary + analytics (hit/miss)
- [ ] **Failure** — page-level alert + run-history failure detail
- [ ] **Paused** (model changed) — warning alert + Refresh now
- [ ] **Purge** (toast) and **Disable** (confirm dialog)
- [ ] **Run history** — event types, run list + per-table detail view
- [ ] **Data objects** list — cached-indicator icon, filter tabs, pagination
- [ ] **Data store / Near Store** — capacity bar + cached-models table
- [ ] Cross-cutting — toasts (success/info), status pills

## How to read it as the spec

- Every screen is composed from **Radiant components + design tokens**. Mirror these patterns:
  imports go through `@/components` and `@tokens`; styling is in **CSS Modules** using token
  CSS-vars (`var(--rd-sys-color-*)`, `var(--spacing-*)`).
- There are **no hardcoded colors/px and no inline styles** — if you're copying a screen, keep it
  that way.
- The app shell is the real `AppShell` / `GlobalHeader` / `AppSidebar`.

## Surfaces & file map

| Surface | Files |
|---|---|
| Data workspace **landing** (object list) | `components/DataObjectsView.tsx` |
| **Near Store** capacity/admin view | `components/DataStoreView.tsx` |
| Model page → **Caching** tab (the feature) | `components/ModelView.tsx`, `components/CachingTab.tsx`, `components/CachingSettingsModal.tsx`, `components/RunHistoryModal.tsx` |
| App shell / nav | `components/Shell.tsx` |
| Shell state + view routing | `index.tsx` |
| Local UI primitives | `components/primitives.tsx`, `components/DatabaseZapIcon.tsx` |
| Per-component styles | `components/*.module.css` |
| Tokens re-export | `styles.ts` |
| Mock data / types / formatters | `data.ts`, `types.ts`, `utils.ts` |

## What's mock — wire these to real data/behavior

- Data is mock (`data.ts`); the cache build is **simulated with `setTimeout`**.
- On the landing, the **recently-opened carousel, filter pills, Tags/Authors dropdowns, and
  pagination are static / visual-only**.
- Only the **Caching** tab is real; the other model tabs (Columns/Joins/Data samples/Dependents/
  Instructions) are placeholders shown for context.

## Components not in Radiant yet

These live in `components/` because Radiant has no equivalent — decide with the DS team whether to
upstream them or keep local. **Everything else is standard Radiant.**

- `DatabaseZapIcon` — the "cached in Near Store" icon
- `StatusPill` — semantic status badge (success/failure/warning/info/neutral)
- `KeyValue` — label → value detail rows
- `FloatingToast` — positions the **real** Radiant `Toast` (Radiant's `Toast` has no positioning /
  provider of its own)
- pill `FilterTabs` — the All/Models/Tables/… filter
- weekday day-toggle chips (weekly schedule, in `CachingSettingsModal`)

Also note one existing DS inconsistency: `SegmentedControl` and `Select` don't match heights at
`size="small"` (24px vs ~26px).

## One caveat

`styles.ts` exports a local `c` alias — `c['content-secondary']` just means
`systemColors.light['content-secondary']` (used in a few `Icon color=` props). There's also a
leftover unused `shell` object you can ignore.
