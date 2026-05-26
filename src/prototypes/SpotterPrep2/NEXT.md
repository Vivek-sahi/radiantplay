# SpotterPrep2 — Next session build spec

_Updated end of session 19, 2026-05-26. Read this FIRST before any other file._

---

## Current prototype state

All three modes (Interactive / Batch / Autonomous) are fully wired in `QualitySession.tsx`. The session flow is:

1. User lands in a quality session — opening agent message + scan card artifact
2. Agent walks through fixes per the mode's script
3. On completion: fix outcome message + Rules chain artifact appears in right panel
4. User can open Quality scan or Rules chain documents in the center panel

### What each mode does
- **Interactive** — `hr-analytics` · 9 issues · agent shows 1 clarify card per fix
- **Batch** — `customer-orders` · 22 issues · agent confirms 15 in one message, then 5 clarify cards
- **Autonomous** — `ops-warehouse` · 67 issues · agent runs everything and decides inline, no clarify cards

### Key components (all in `QualitySession.tsx`)
- `QualitySessionInner` — main session component, owns all state
- `QualitySession` — wrapper that owns `mode` + `sessionKey`, renders `InlineModePicker`
- `ScanDocumentPanel` — full quality scan document (center panel)
- `RulesChainPanel` — rules chain document (center panel)
- `ClarifyCard` — decision card rendered in agent panel (batch/interactive only)
- `RightContextPanel` — Artifacts panel with scan + rules chain links
- `InlineModePicker` — mode switcher in session header
- `MetricTile` — shared tile for both document panels
- `ScanArtifact` — scan card rendered in agent chat (redesigned session 19)

### Script system
`ScriptStep` union type drives all agent behavior. Steps: `tool-call`, `agent`, `wait`, `fix-partial`, `fix`, `clarify`, `scan-reveal`, `fix-table`. The `playScript` loop in `QualitySessionInner` executes these sequentially, pausing at `wait` and `clarify` until user input.

---

## Changes made in session 19

### Caching tab — full redesign (`CachingTab.tsx`, `CacheSettingsModal.tsx`)
- **Filled state** replaced the old 3-tile strip with:
  - "Cache Settings" section: key-value rows (cache window, date ref column, refresh frequency with "Excluding weekends" secondary, cache size, number of rows, next scheduled run) + "↻ Refresh now" and "✏ Edit settings" text-link actions top-right
  - "Analytics" section: subtitle with last run timestamp + 3 bordered metric tiles (Total queries fired / Queries on cached data / Queries on live data) at `fs['2xl']`
  - "Run History" table: new columns — Run type, Start time ⓘ, End time ⓘ, No. of rows, Status (colored text, no badge), Logs ("View log" link)
- Mock data: added `CACHE_DISPLAY` and `CACHE_ANALYTICS` constants to `mockData.ts`

### Quality tab — redesign (`QualityTab.tsx`)
- **Metric tiles**: replaced the old horizontal score strip with 2 bordered tiles matching caching Analytics style — Quality grade (letter only, in grade color) + Last checked (timestamp). Issues found tile removed. Score number removed.
- **Actions consolidated** to section header: "Rescan" (secondary) + "Prep model" (primary blue). "Fix issues with agent" button removed.
- **Column profile table restructured** to one row per column with 7 columns:
  - Column (name + table subtitle), Column type (badge), Fill rate, Distinct, **Nulls**, **Duplicates**, **Other issues**
  - Nulls column: shows row count if `null_rate` issue, else "—"
  - Duplicates column: shows row count if `duplicates` issue, else "—"
  - Other issues column: issue type chip + scope for all other issue types (format, precision, negative, FK, sequence, outlier), else "—"
  - Confidence tier chip removed from the table (agent concept only)

### Quality session loading state (`index.tsx`)
- Clicking "Prep model" now transitions through a `loading-session` intermediate view (~1.2s) before entering the quality session
- Loading screen: white full-screen, centered blue spinner + "Opening quality session" label, fades in with subtle `translateY` ease

### Scan artifact card redesigned (`QualitySession.tsx` → `ScanArtifact`)
- Removed: grade badge, grey sunken banner, score/100
- New structure:
  - Header: `DocIcon` + "Quality scan" title + `{modelName} · v1 · 2 hours ago` subtitle
  - Body: "{N} issues found" semibold + tier chips + "View details →" CTA

---

## Product decisions made across sessions

| Decision | Rationale |
|---|---|
| Rules are "staged", not "applied" | Fixes don't materialize until next cache refresh — dbt convention |
| Grade not score | PRD says "grade" — numeric score implies false precision |
| `~` prefix for projected grade | Honest signal that this is a projection, not a measured state |
| Before/after is a sample preview | For deterministic rules only — computed client-side from the scan snapshot |
| No "Run now" button | Sample preview makes it unnecessary; cache refresh is the materialization path |
| Save opens "Save as new model" modal | When Save is hit, ThoughtSpot currently creates a NEW standalone model — not a child |
| Grade removed from quality scan document | Grade belongs on the model artifact header, not the scan document |
| Groups → Structural/Relational fixes | "Group 1/2" is developer language; semantic labels communicate WHY they're grouped |
| Three decision states | Accepted (will change data) / Documented (expected, no change) / Flagged (review needed) |
| Rules chain = decision log | Shows all decisions made during session, not just "will fix" actions |
| Batch execution = single agent message | No tool-call steps for batch apply — agent confirms what was staged in one line |
| Autonomous has no clarify cards | Agent decides bin_location (documented) + unit_cost (flagged) inline |
| Show work collapsed by default | `stepsCollapsed: true` — expand on demand; tool labels in past tense |
| Mode sub-labels are user-facing benefit copy | "Review each fix…" / "Apply safe fixes together…" / "Agent decides…" |
| Column profile = one row per column | Industry standard (Monte Carlo, Ataccama, Informatica) — multiple quality dimensions as separate cells |
| Tier chip not in column profile | Tier is agent confidence for fixing, not a user-facing severity; stays in prep session only |
| Issue type chip kept in column profile | "What's wrong" is as important as scope — dbt/Monte Carlo/Soda all surface type prominently |
| Score removed from Quality tab metrics | Grade (letter) is sufficient; numeric score implies false precision |
| Issues found removed from Quality tab metrics | Moved into the column profile table structure; metrics show grade + last checked only |

---

## PM questions pending (Peeyush)

| # | Question | Why it matters |
|---|---|---|
| 1 | Can ThoughtSpot run a sample preview query in real-time (< 2s) when a rule is approved? | Decides if before/after is a real product feature or prototype-only |
| 2 | When Save is hit — does this create a new model? How are dependents (liveboards, answers) re-pointed? | Core UX question for the save flow — **next session's focus** |
| 3 | Can a user trigger a manual cache refresh from inside the prep session, or only from the Caching tab? | Whether to add a "Trigger refresh" link after Save |
| 4 | If two approved rules conflict — how is that detected and surfaced? | Rules chain validation UX |
| 5 | Does the rules DAG get resolved automatically by the engine, or does the user need to see/manage rule order? | Core rules chain UI question |

---

## Next session — Save flow

**Focus: what happens when the user clicks Save and applies it.**

Questions to resolve before/during build:
- What does the Save modal look like? (currently "Save as new model" — needs design)
- What confirmation/summary is shown after save?
- How does the session end after saving — does the user return to model detail, or stay in session?
- What state does the Quality tab show post-save? (currently `saved` state exists but may need updating)
- Does saving trigger a caching prompt ("Run cache now to apply rules")?

---

## Remaining backlog

- Rules chain section on Quality tab (deferred from session 19 — add in a future session)
- Saved/published/refresh-issues states on Quality tab not yet updated to new tile style

---

## Open questions (ongoing)

1. For Autonomous mode, should the end-of-session summary be an outcome card rather than a plain agent message?
2. The center data table still shows hr-analytics employee rows for all three modes — worth matching mock data to the active model?
3. Should the `×` in the ClarifyCard counter actually be `›` (forward to next, i.e. skip)?

---

## Do NOT do without reading this first

- Do NOT rewrite QualitySession.tsx again without checking if there's a new NEXT.md
- Do NOT touch ModelDetail.tsx, ScenarioSwitcher.tsx
- The DataStudio prototype has pre-existing typecheck errors — they are not from SpotterPrep2
