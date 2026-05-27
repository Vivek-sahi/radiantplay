# Data Studio — Build State

_Updated at the end of every session. For product context see `product.md`. For session history see `SESSION_LOG.md`._

---

## Current state (session 114, 2026-05-27)

**Branch:** `prototype/data-studio` on `origin` (vivek-sahi/radiantplay)  
**Deployed:** https://radiantplay-nine.vercel.app  
**Build:** clean ✓

---

## What's built

| Area | Status |
|------|--------|
| Overview — landing + hero prompt + model cards + Pulse insight cards | ✅ |
| Chat (from scratch) — clarify → plan → build → auto-transition to Workspace | ✅ |
| Workspace — agent + columns/tables/preview/notebook + drag resize | ✅ |
| Test mode — inline Spotter Q&A + coaching flow | ✅ |
| Data quality — DQ chip, quality plan, prep transforms, Transformations section in LeftPanel | ✅ |
| AI readiness (AIRS) — chip, panel, score, action items | ✅ |
| Cache — configure + enable from model tab bar | ✅ |
| Model view — Info / Cache / Monitoring tabs | ✅ |
| Pulse monitoring — 6 flows wired (ins-d1/d2/d3/d6/o3/o4); object-click → read-only artifact in FullChatView | ✅ |
| Data browser — warehouse explorer + dbt import wizard | ✅ |
| Connections — connection management | ✅ |
| dbt import — full flow with broken/degraded column indicators + fix scripts | ✅ |

---

## Partial / deferred

- **Expand model (add table)** — `add_returns` script built; wiring partial
- **"Fix all with agent" DQ chip** — visual only, not wired to agent
- **AIRS Generate / Add buttons** — visual only, not wired to agent
- **Manual workflow paths** — intentionally deferred; agentic paths first
- **WorkflowDirectory** — cosmetic only, do not wire without explicit decision

---

## Naming

- The from-scratch flow was called "Day Zero" until session 112. Now `isFromScratch`, `fromScratchPhase`, `runFromScratchSteps`, etc. throughout the codebase.
- The central object is a **model**. The internal type `ProjectState` is a legacy name — do not rename without caution, it is load-bearing across the routing pipeline.
