# Agent DB — what to do (2026-07-07)
Concise action list from the Slack + Loom feedback. Full detail/attribution lives in `2026-07-07-feedback-collation.md`. Screens: W1 Data objects · W2 Caching tab · W3 Settings modal · W4 Run history · W5 Data store.

| #   | What to do | Screen | Status |
| --- | --- | --- | --- |
| A1  | Drop the caching spinner — show "Caching" status and add an entry in run history "in progress" | W2 → W4 | 🟢 Build |
| A3  | Make the table list scrollable in custom view to show scroll behaviour | W3  | 🟢 Build |
| A7  | Rename "Data store" → "Agent DB" | W5 + nav | 🟡 Wait for alignment |
| B4  | Add Purge + Model-update events to Run history | W4  | 🟢  |
| A2  | Move Cancel next to Save; add "Also cache now" footer checkbox | W3  | 🟡 Build |
| A4 + A5 | Explore how to show cache and live on Model list | W1  | 🟡 Explore |
| A6  | Reorder capacity cards → Used / Available / Total. Move the visualization above the data points. | W5  | 🟡 Build |
| B1  | **Decide** "Schema changed" banner + [Refresh now]; "Stale" pill | W2 + W1 | 🟡 Design |
| C1  | **Decide** time-window scope: model-level vs per-table vs hybrid - no change | W3  | 🟡 Decide first |
| A8  | If a table is already cached - separate copies | W2  | 🟡 Decide |
| B5  | **Decide** if hit/miss analytics is in MVP (minimal stat vs full block) - keep it | W2  | 🟡 Decide |
| B2  | Live/Cached indicator in Spotter & Liveboards | outside | 🟡 Later |
| B3  | "Run live" toggle to bypass cache | query | 🟡 Later |
| B6  | Custom-calendar caching | engine | 🔵 Blocked |
| D1  | Agent DB as Data Store — separate CDW track | separate | 🟡 Separate |

**Build now (consensus):** A1, A3, A7, B4. **Decide before building:** C1 (biggest — reshapes W3), A8, B5. **Then build:** A2, A4+A5, A6, B1.

* * *
## Built this session (2026-07-08)
- **A1** — caching no longer blocks the screen: on Cache/Refresh we add an "In progress" run to run history + a toast, then flip it to Success (no spinner). `CachingTab.tsx`
  
- **A2** — modal footer now uses the DS `ModalFooter` (Cancel + Save grouped right), with an "Also cache now" checkbox on the left (enable only; unchecked = schedule-only → "Pending first run"). `CachingSettingsModal.tsx`
  
- **A3** — the custom per-table list scrolls (~5 rows, then scroll); HR Headcount seeded with 10 tables to demo it. `CachingSettingsModal.tsx`, `data.ts`
  
- **A6** — Data store capacity: bar moved above the cards, cards reordered → Used / Available / Total. `DataStoreView.tsx`
  
- **B4** — run history shows an event-type icon; Purge + Model-update events added. `RunHistoryModal.tsx`, `data.ts`
  
- **B5** — full analytics block back on the Caching tab (total · % cached · % live). `CachingTab.tsx`, `types.ts`, `data.ts`
  
- **A4/A5 (visual only)** — added a "Cache paused" pill (reusing the existing pill pattern) + a **warning** banner on the tab (distinct from the failure pattern), demoed on "Supply Chain Inventory". Detection/classification workflow parked.
  

**A8** — decided: caching stays a **tab** (no chip). **Parked (open question for Harviish/eng):** B1 detection & classification workflow (the cache holds only table snapshots, no model metadata, so it can't classify breaking vs non-breaking on its own). Also parked: C1, B2, B3, B6, D1, A7 (awaiting naming alignment).
