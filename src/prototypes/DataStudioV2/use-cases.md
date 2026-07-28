# Data Studio — Use Cases

_Each use case will have: Trigger, Goal, Behavior contract, Autonomy model, Agentic path (Tool → Output → Decision point), Manual path, Status._

---

## Setup

### 1. Connect to a warehouse

### 2. Integrate with dbt

---

## Build & Prepare

### 3. Build a model from warehouse tables

### 4. Test and improve AI readiness _(pre-publish)_

### 5. Improve data quality of a model

### 6. Cache a model

### 7. Publish a model

### 8. Share a model

### 9. Enable / convert a dbt model in ThoughtSpot

---

## Maintain

### 10. View and monitor a published model

**Trigger**
- User-initiated: user opens a published model to review its structure or health
- System-initiated: Pulse surfaces an issue, user clicks through to investigate

**Goal:** Understand the current state of a published model — its structure, columns, AI readiness, and health — and take action on any issues.

**Behavior contract**
- Agent SHOULD proactively surface monitoring issues via Pulse without being asked
- Agent MUST NOT auto-fix any issue without user approval
- Agent MAY suggest optimizations (caching, AI readiness improvements) based on monitoring signals
- Agent MUST surface sync failures and schema changes immediately

**Autonomy model**
- Decides independently: detecting issues, calculating pillar health, ranking Pulse insights
- Requires approval: accepting schema changes, retrying sync, triggering fixes, editing model content

**Agentic path**

Step 1 — Surface issue (system-initiated)
- Tool: monitoring scanner
- Output: Pulse insight (sync failure, quality degradation, semantic gap, optimization opportunity)
- Decision point: user clicks insight → lands in model at relevant tab

Step 2 — Investigate
- Tool: model health analyzer
- Output: detailed issue context in monitoring tab (which pillar, root cause, affected queries)
- Decision point: user decides to act, dismiss, or dig further

Step 3 — Act
- Hands off to another use case depending on issue type: fix AI accuracy, improve data quality, retry sync, enable cache
- Decision point: user selects action

**Manual path**
- User opens model from overview or recent models list
- Reviews Info tab: source connection, tables/joins, columns, AI context gaps
- Reviews Cache tab: cache status, run history, schedule
- Reviews Monitoring tab: 4 pillars, cost/efficiency, semantic coverage
- Takes direct action on issues: retry sync, fix column description, enable caching

**Status**

| Path | Status | Notes |
|---|---|---|
| Agentic | Partial | Pulse → model → monitoring tab wired; agent not accessible from within ModelView; Fix/action buttons are no-ops |
| Manual | Partial | Info, Cache, Monitoring tabs built; action buttons not wired; AI readiness score missing from Info tab; agent panel absent from view mode |

### 11. Monitor for drift / quality issues

### 12. Improve a model's AI accuracy _(post-publish)_
