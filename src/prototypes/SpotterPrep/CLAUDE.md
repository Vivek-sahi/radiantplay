# SpotterPrep — Claude Code Project Brief

## Problem We Are Solving

Data quality issues are discovered **late** — after models are built and business users are already getting wrong answers. A VP of Sales messages a data analyst on Slack that revenue numbers are wrong. Trust erodes. This is the moment SpotterPrep is designed to prevent.

**How it happens today (broken):**
1. **At ingestion** — Data engineers run automated checks at the warehouse layer, but these have no business context and are generic (not column- or model-specific).
2. **After a complaint** — Analyst gets a Slack message, manually traces the issue across dashboards → data refresh logs → warehouse → source. No dedicated tool. Entirely manual. Extremely tedious.

**The gap:** Prep tools (Snowflake, Databricks) have no BI context. BI tools (ThoughtSpot) have full context but no prep tools. SpotterPrep closes this gap — prep at the BI layer, with column-level semantic context, usage data, and downstream impact already known.

---

## Two Core Use Cases

### 1. Reactive — Problem-led
Triggered by a complaint (e.g., VP flags wrong revenue on a dashboard).

Analyst workflow:
1. Tests the insight themselves → confirms it's wrong
2. Checks: when was data last refreshed? Did the last sync have errors?
3. If no upstream failure → goes into the data model, runs quality checks on the specific column
4. Finds the issue, fixes the data, publishes, re-tests, informs business users

### 2. Proactive — System-led
Triggered before data reaches business users. Analyst built a model but isn't sure about quality.

Analyst workflow:
1. Opens ThoughtSpot → system automatically scans the model for baseline issues (nulls, duplicates, blanks, type mismatches, anomalies)
2. Scan uses column-level context to make checks specific, not generic
3. System generates a quality score + issue list + recommended fixes
4. Analyst reviews, applies some or all fixes, views before/after, publishes
5. Going forward: prep jobs run automatically on every cache refresh. Logs track pass/fail per run.

---

## Figma Files

| Artifact | Link |
|---|---|
| Workflows & Diagrams (FigJam) | https://www.figma.com/board/jIA8zRWTVhVkWNYwLjTGZP |
| Screen Designs (Figma) | https://www.figma.com/design/JhNsRars6ZRWPLDQy1fvei |

---

## Screens Built

| Screen | Component | State / Notes |
|---|---|---|
| Story / narrative intro | `StorySection.tsx` | Entry before prototype |
| Data models list | `DataModelsPage.tsx` | Quality column with grade badge per model |
| Model detail + tab bar | `ModelDetail.tsx` | Tabs: Columns, Joins, Caching, Quality |
| Quality tab | `QualityTab.tsx` | 3 states: `not-cached`, `ready`, `post-prep` |
| Full-screen prep session | `PrepSession.tsx` | Data table (left) + agent panel (right) |
| Fix plan modal | `PlanModal.tsx` | Shows all proposed fixes before applying |
| Cache settings modal | `CacheSettingsModal.tsx` | Frequency selector (daily/weekly/monthly) |
| Job history modal | `PrepHistoryModal.tsx` | Logs per run: pass/fail |
| Left nav shell | `Shell.tsx` | ThoughtSpot chrome |

`SpotterPrepTab.tsx` and `PrepWizard.tsx` are legacy/unused files from v1.

---

## State Machine

### Quality tab (`QualityState`)
- `not-cached` → shows "Set up caching" CTA, triggers `CacheSettingsModal`
- `ready` → quality score + column profile table + "Prep with agent" CTA
- `post-prep` → same card layout as `ready` but with updated score, 0 issues, 0 objects affected + "Prep with agent" CTA still present

### Prep session (`AgentPhase` in `PrepSession.tsx`)
- `choosing` → user picks a journey path (3 cards shown)
- `chatting` → script running, chips shown, agent responding
- `fixing` → applying fixes animation (2.8s)
- `done` → fixes applied; input stays active (user can keep asking); Publish button activates

### Agent journey paths
- `problem` — Reactive: fix a specific column (targets `blended_cost` anomaly in the mock)
- `system` — Proactive: full table scan → 49 of 50 fixes applied
- `freetext` — Open-ended: scan → fix plan → apply all

---

## Data Model (Mock)

Model: `fnops-final` · 3 tables: `billing_accounts`, `line_items`, `subscriptions` · 22 columns · 68,432 rows

Quality score: **54 / D** (before) → **91 / A** (after prep)

Issues: 10 across all types (nulls, blanks, duplicates, anomalies, type mismatches)
Dependents: 31 objects (8 liveboards, 14 saved answers, 9 Spot chats)

---

## Key Design Decisions (Locked)

- Prep session is **full-screen** (like liveboard edit mode) — not a side panel
- Top bar: model name · version selector · score badge · Exit · Publish
- **Publish** activates only after fixes are applied (`hasFixes` state), not before
- **Chat input stays active** after workflow completes — user can keep fixing; Publish is their choice
- After publish → Quality tab returns to the **same card layout** (`QualityCard`) with updated numbers only — no separate "boost" card, no "Prep again" CTA swap
- "Caching" tab is separate from "Quality" tab — cache settings live there
- One recommended fix per issue (no multi-option picker)
- Fixes run as scheduled jobs on every cache refresh
- Prep history is a modal (not inline, not a slide-in panel)

---

## What Needs Work

All items below came from team review (2026-04-20). Each needs design brainstorming before it becomes a buildable task — open questions are noted inline.

### Data model list (`DataModelsPage.tsx`)
- **Source is always Snowflake** — remove ThoughtSpot as a source option; all models connect via Snowflake. Brainstorm: does this affect the "Cache and Prep" modal copy which currently says "Cache it with ThoughtSpot"?
- **Cached model indicator on source** — cached models need a visual indicator (badge, icon, dot) on the source cell/tile. Brainstorm: where exactly does it live — inline with the source name, as a column, or as a row-level state?
- **Quality score only visible for cached models** — Campaign Performance (cached) should show a score; fnops-final (not cached) should show nothing. Brainstorm: does this flip the current demo setup? Need to decide which model is cached vs not in the final story.

### Quality tab (`QualityTab.tsx`)
- **Quality score column — rethink** — team flagged the score column needs more thought. Brainstorm: is it a number, a grade, a bar, a combination? What does it communicate at a glance vs on the detail page?
- **Column profile disclaimer** — add a note below the column profile table: "Column profile is based on sample data." Straightforward copy addition, no brainstorm needed.
- **Issue severity** — each issue should have a severity level (e.g. Critical / High / Medium / Low). Brainstorm: how is severity determined — rule-based, AI-assigned, or user-set? Where does it appear — column profile table, fix plan, agent messages?
- **Filter issues by severity** — column profile table and/or fix plan should support filtering by severity. Depends on severity design above.

### Prep session (`PrepSession.tsx`)
- **Feature rename: "Prep" → "Quality"** — the feature is being renamed. Affects: tab label in ModelDetail, button copy ("Improve Data Quality" CTA is already aligned), panel header ("SpotterPrep"), top bar in prep session, any other "Prep" references. Brainstorm: does the full-screen session also get renamed, or only the entry points?
- **Version selector — remove** — versions will be auto-created on each publish, so the manual version selector in the prep session top bar is not needed. Straightforward removal.
- **Undo / Redo** — within a session, user should be able to revert individual applied fixes. Brainstorm: is this per-fix or global undo stack? Does it affect the data table view (before/after toggle) or only the fix list? What happens to the quality score on undo?
- **SpotterPrep icon** — the feature needs a proper icon (not the "S" gradient square). Brainstorm: ThoughtSpot design system icon, custom SVG, or an emoji-style glyph? Needs asset decision before implementation.

---

## Entry Point

`index.tsx` — manages `PrototypeView` (`models` | `model-detail` | `prep-session`). `qualityState` and `activeModelId` live here and are passed down. `handlePublish` sets `qualityState → post-prep` and returns to `model-detail`.
