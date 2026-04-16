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

### Data models list (`DataModelsPage.tsx`)
- Left nav and header area ("Data Workspace · Data Models" + action buttons) have wrong font sizes — need adjustment only, table itself looks correct

### Quality tab (`QualityTab.tsx`)
- Missing **last data refresh** status — needs to appear on both `ready` and `post-prep` states
- Post-prep state: remove the "+37 pts" delta indicator — just show the updated score, no improvement messaging
- Post-prep state: remove "0 objects affected · 31 dependencies are now healthy" — keep it simple: just score + issues count + column profile
- Column profile table: should show cleaned data after prep (issues gone from affected columns) + add a new column for **issue type** ("What kind of issue") to the profile table
- Post-prep state: the card should not feel different from ready state — same layout, same neutral styling, just updated numbers. No green border, no green tints.

### Prep session — journey entry cards (`PrepSession.tsx`, `AgentPanel`)
- The three journey cards (Fix specific column / Fix all problems / Ask anything) do not match ThoughtSpot design language — should look like buttons or chips, not custom-styled cards
- User will provide the correct UI design reference for the conversational panel

### Prep session — chat input
- Text is overflowing in the chat input text box — fix sizing/overflow
- Chat input disappears during the fixing phase (`phase === 'fixing'`) — it should stay visible at all times, just disabled or showing a status

### Prep session — problem-led journey (reactive path)
- After user selects "Fix a specific column problem", agent asks "Tell me what's happening — which column or report is giving you trouble?" and immediately shows suggestion chips ("VP of Sales flagged blended_cost in Slack", "Help me inspect the blended_cost column")
- **These chips should not appear** — this is the first step of the reactive journey; the user should type their own problem description. Remove suggestion chips from this first wait step only.

### Prep session — publish button
- Publish should activate as soon as any fix is applied (already implemented via `hasFixes` state — verify it works correctly end-to-end)

---

## Entry Point

`index.tsx` — manages `AppSection` (`story` | `prototype`) and `PrototypeView` (`models` | `model-detail` | `prep-session`). `qualityState` lives here and is passed down. `handlePublish` sets `qualityState → post-prep` and returns to `model-detail`.
