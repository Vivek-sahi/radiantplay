# Near Store (AgentDB) — feedback action items

*Consolidated from the team call, 2026-08-04. All items decided and ready to build.*

## Empty state
1. Caching tab appears on **every** model; cacheability varies — the empty state carries that message.
2. *Cacheable, not-yet-cached* state: CTA labelled **"Cache Model"** (no model name), a **Radiant illustration**, and a "Learn more" link.
3. *Not-cacheable* state: build **one sample** — "Caching isn't available on this model" + the Cacheability API's **reason text** (one representative sample, not all reason variants).

## Caching Settings modal
4. Move the "all columns" **disclaimer to the bottom**, below "Also cache now" (create flow); **reword** to a clearer, user-first POV (final wording from team).
5. **Edit flow hides the disclaimer** entirely (edit ≠ create); "Also cache now" stays.
6. Replace **"Snowflake" → "directly from source"** across all copy and tooltips.

## Statuses & run feedback
7. Standardize status labels to **In progress / Success / Error**. "Scheduled" is internal only — **not** shown on the UI. "Fail/Failure" → "Error" everywhere.
8. Failure surfaces at **two levels**: run-status level and per-table level; the table-level run-history **"note" column holds the failure reason**.
9. Add a clickable **refresh icon next to the status value** to re-check run status without a page reload.
10. Run-history **note stays single-line** (truncated) but the **full text is copyable**.

## Purge / Disable
11. Rebuild the **Purge** and **Disable** confirmation dialogs on the **standard left-aligned Radiant `Modal`** (replacing the centred `ConfirmDialog` alert pattern).
12. **Clean up the purge success toast** copy.

## Cache size field
13. Purged model shows **"—"** in the Cache size field **plus a "Purged" chip**, so the empty value reads clearly as purged (distinct from the "Pending first run" state).
