# AgentDB — build spec (prototype, not Figma)

For AgentDB, **use this prototype as the source of truth instead of Figma.** It's built in
Radiant Play on the real Radiant design system, so the components, tokens, and layouts you see in
the code are the ones to ship. Read the code as the spec — not just the visuals.

## Run it

- Repo: `github.com/Vivek-sahi/radiantplay` · branch `prototype/data-studio`
- `npm install` → `npx vite` → open **`/playground/AgentDB`**
- Code lives in `src/prototypes/AgentDB/`

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
| **AgentDB** capacity/admin view | `components/DataStoreView.tsx` |
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
  pagination are static / visual-only.**
- Only the **Caching** tab is real; the other model tabs (Columns/Joins/Data samples/Dependents/
  Instructions) are placeholders shown for context.

## Components not in Radiant yet

These live in `components/` because Radiant has no equivalent — decide with the DS team whether to
upstream them or keep local. **Everything else is standard Radiant.**

- `DatabaseZapIcon` — the "cached in AgentDB" icon
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
