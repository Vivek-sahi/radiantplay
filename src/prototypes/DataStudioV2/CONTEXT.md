# Data Studio — Build State

_Updated at the end of every session. For product context see `product.md`. For session history see `SESSION_LOG.md`._

---

## Current state (session 119, 2026-06-09)

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
| Notebook — Phase 1: cell states, output panels, Run all, per-cell run, pre-failed cell, Edit and retry | ✅ |
| Test mode — inline Spotter Q&A + coaching flow | ✅ |
| Data quality — DQ chip, quality plan, prep transforms, Transformations section in LeftPanel | ✅ |
| AI readiness (AIRS) — chip, panel, score, action items | ✅ |
| Cache — configure + enable from model tab bar | ✅ |
| Model view — Info / Cache / Monitoring tabs | ✅ |
| Pulse monitoring — 6 flows wired (ins-d1/d2/d3/d6/o3/o4); object-click → read-only artifact in FullChatView | ✅ |
| Data browser — warehouse explorer + dbt import wizard | ✅ |
| Connections — connection management | ✅ |
| dbt import — full flow with broken/degraded column indicators + fix scripts | ✅ |
| Multi-source model flow — scan → Pendo notebook → CSV upload → staging table → model build | ✅ |

---

## Next session

**Primary task:** Fix DE review gaps in multi-source flow. Full findings at `research/2026-06-09-de-review-multi-source.md`.

Suggested order (start here):
1. **Critical #5 (code):** CSV added to Created before consent — move `multiSourceCreated` csv-dataset push from `handleFileUpload` to `awaiting_csv_write_consent` confirm path in `AgentPanel.tsx`
2. **Critical #1 (mockData):** Join SQL drives from wrong table — change `ms_build_project` join SQL to drive from `dim_accounts`, not `customer_health_external`
3. **Critical #2 (mockData):** `p1_cases_open` and `open_defects` don't exist as columns — add derivation comments in formula collapsible
4. **Critical #3 (copy):** "All checks passed" contradicts visible DQ flag in SUPPORT_CASES
5. **Critical #4 (copy):** Silent `account_tier` shadowing — add one sentence during build
6. **Quick wins sweep (copy):** 6 copy changes in `AgentPanel.tsx` scripts — see research doc for exact text

---

## Multi-source model flow — details (session 118b, 2026-06-09)

Full spec at `2026-06-08-multi-source-flow.md`.

All 13 steps built. The flow is fully interactive end-to-end.

**What works:**
- "Multi-source model" pill on Overview triggers the flow
- Phase 1: env scan → 4 Snowflake table cards in context panel, **each with DQ score** (94, 81, 88, 91)
- Phase 2: user specifies Pendo + CSV → **consent gate**: agent proposes notebook, user confirms before creation
- Phase 3: Pendo notebook created → **inline API key input** with "Use saved Pendo credentials" as primary CTA + manual entry fallback
- After API key: agent confirms nps_comments column → **consent gate**: agent asks before writing to Spotstore
- Phase 4: Pendo fetch → **artifact cards** in message (notebook + pendo_nps_enriched, both clickable). **inline file drop zone** in next message
- After file drop: CSV shown as artifact card → **consent gate**: agent asks before writing CSV to Spotstore
- Phase 5: CSV staged → **csm_account_mapping artifact card** in message · **consent gate** before compiling staging table. Agent explicitly says CDW tables are NOT in staging (federated query)
- Phase 5b: staging compiled → **customer_health_external artifact card** in message
- Phase 6: "Build the model" → existing Workspace flow + **validation step** in ms_build_project (row counts, join key coverage, all checks)
- **Source tables sub-section inside Context** (not a separate top-level section) — CDW refs with CDW badge + "Federated query — not copied to staging" note
- **Created section** now shows: notebook, pendo_nps_enriched (spotstore-table), CSV file, csm_account_mapping (spotstore-table), staging table
- Staging table preview panel: **federated query note** + **expandable SQL** with Copy button
- CDW and Spotstore table previews: Schema tab (columns, type, null %, KEY badge), Sample data tab (5 mock rows), metadata strip (owner, last synced, DQ score, description)
- pendo_nps_enriched and csm_account_mapping now have sample rows in mockData
- process_csv_upload: 2 steps only (read + write — join key detection moved to staging compile)
- ColumnsView in Workspace shows `sourceColumn` column only when any column has that field populated

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
