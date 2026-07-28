# Agentic workflow — design doc

_The next build: everything the user can do manually on the canvas, doable through the agent — with approvals. This doc maps the scoped use-cases onto our existing agentic design patterns, names the new patterns we must design, and lists the mock scripts to hardcode. Grounded in `2026-07-10-analyst-activities.md` (the P1 set) and `2026-07-10-data-agents-in-the-wild.md` (competitive research)._

**Why this build is the differentiator (research, one line):** every competitor agent is consume-side; the uncontested white space is source-data prep, evidence-backed modeling, agent-driven testing, and decay — this prototype demonstrates the first three.

---

## 1. Principles (locked in conversation, session 142)

1. **Two layers.** Intent/semantics (what is "customer health"?) = converge by conversation. Mechanics (fetch, coerce, join) = determinate execution once intent is clear.
2. **The plan artifact is crystallized shared understanding**, not a checkpoint. Its sample questions become the test suite.
3. **Joins never auto on first build.** Agent profiles first → evidence-backed proposal (key, coverage %, cardinality, preview rows) → user clears it.
4. **Approve decisions, not instructions.** Named tables → just do it. Judgment (join key, fill strategy, cache, publish) → gate. Gate count tracks judgment, not action count.
5. **The canvas is shared context.** The agent sees and acts on the same canvas the user does; prompt bar = steering, canvas = shared surface.
6. **The agent summons the real UI.** Cache modal, Python properties panel, secret input — never chat-replicas of panels we already built.
7. **One agent, multiple skills.** Modeling (mutates → gated) + Spotter/query (read-only → never gated). Testing is not a mode — it's the same agent using its query skill mid-conversation.
8. **Show evidence, not just output.** Every proposal carries its "why" (profiling data) and "what it looks like" (preview) inline. Approving is never an act of faith.

---

## 2. Use-cases = the P1 set (27 items → 8 demo beats)

From `2026-07-10-analyst-activities.md`. Beat order = the demo story.

| Beat | P1 items | What the user says | What the agent does |
|---|---|---|---|
| B1 Fetch by name | 1 | "fetch dim_accounts, support_cases, call_metrics" | named tables = no gate; nodes land on canvas, narrated in chat |
| B2 CSV + context | 2 | *drops CSV* "this is my CSM data, it'll join with the others" | picks it up, node lands, **cache consent** surfaced by agent (real modal) |
| B3 API via Python | 3 | "I want NPS from Pendo — how?" | proposes Python block → creates it → **opens its properties panel** → asks for creds (secret store or chat) |
| B4 Profile on demand | 6,7,8,9,10 | "are all of these tables clean?" | samples all 5 → **profile report card**: 3 clean, CSV + NPS have issues (nulls, dupes, outliers, 24% coverage) |
| B5 Fix with approval | 11,12 | "fix them" | per issue: proposed fix → **ghosted chip** → approve → chip lands |
| B6 Transforms by ask | 19,20,21,22,25,30,36,37 | "make the model last-12-months" / "drop internal_id everywhere" | model-scope fan-out: one instruction → chips across every affected table (the agentic advantage beat) |
| B7 Join → model | 31,32,33,35 | "join all of these into a model" | per join: **evidence proposal card** (key, coverage, cardinality, 10 preview rows) → approve → edge lands. **Fan-out warning** if 1:many would double-count. Plan artifact for the batch variant |
| B8 Test it | 40,41,42 | "is it right?" / auto after build | agent runs the plan's sample questions with its query skill → **test-run card** (answers + pass/flag) + reconciliation counts |

Manage/edit (45,48,49,50) is cross-cutting: every chip the agent created is editable/removable/undoable exactly like a manual one — same chip, no special agent-chip.

**One-click variant:** same plan artifact from B7, generated up front from whatever is on the canvas; approve → B7+B8 run as a batch (reuse `runLiveBuildMultiSource` pacing).

---

## 2b. Agent behaviors — the feedback surface (Vivek's list, session 142)

The loom's Part 2 is organized around these behaviors, not the flow. Reference tools for patterns: **Cortex, Databricks Genie, Claude Code, Hex, Omni.**

| # | Behavior | Best reference pattern | Our translation |
|---|---|---|---|
| A1 | **Empty state / agent intro** | Genie's curated sample questions; Claude Code banner+tips | Canvas-aware intro: empty canvas → "I can fetch tables, ingest files, pull from an API…" + starters. Extends our existing subtitle+prompts (s139) |
| A2 | **Skills discovery ("what can you do?")** | Claude Code `/help` + slash menu; Genie "what data do you have?" | Make the composer's `/` real (menu of modeling skills) + conversational answer grounded in current canvas state |
| A3 | **`@` references** | Claude Code `@` fuzzy picker → token in prompt | `@` opens a tree popover (connection → db → schema → table, mirrors data browser); pick → chip-token in prompt. Genie/Cortex pre-scope data at setup — this beats that |
| A4 | **Point-and-select referencing** | Claude Code IDE selection-as-context; Hex cell-scoped prompts | Composer's point/select icon (exists, s139) → canvas pick mode → node/chip/column becomes a token. No canvas competitor does this — ours to define |
| A5 | **Multi-step flow + review** | Claude Code plan mode + visible steps; **Omni bundle-review** (accept set or individually) | Working steps + plan card (built) + ghosted proposals (new). Adopt bundle review for batch actions — not N sequential modals |
| A6 | **Autonomy mode** | Omni Sandbox/Review/Auto; Claude Code permission modes + **"always allow" per action type** | Review ↔ Auto + always-gated irreversibles + per-action-type "always allow" (trust accrues) |
| A7 | ~~Testing (ask a question)~~ | — | **Out of scope** (Vivek) — B8/N6 deferred; verbal teaser at most |
| A8 | ~~AI-readiness~~ | — | **Out of scope** (Vivek) — endpoint, exists |

A1–A4 = composer/entry UX · A5–A6 = execution UX. The workflow beats (§2) are the *content* these behaviors run on.

**Detailed interaction designs: `2026-07-13-agent-behavior-patterns.md`** (anatomy, flows, states, implementation anchors, per-pattern decisions).

---

## 3. Design patterns — reuse (already built)

| # | Pattern | Exists as | Used in beats |
|---|---|---|---|
| R1 | Working steps | AgentPanel step messages | all |
| R2 | Artifact cards (table/DQ/notebook/model, clickable) | multi-source + notebook flows | B1, B4, B7 |
| R3 | Consent gate | cache confirm, Spotstore writes | B2, B5 |
| R4 | Suggestion chips | everywhere | all |
| R5 | Inline in-message inputs | masked API key, file-drop | B2, B3 |
| R6 | Plan card / panel (editable) | PlanCardV2 / PlanPanelV3 / BuiltSummaryCard | B7, one-click |
| R7 | Live animated build | `runLiveBuildMultiSource` | one-click |
| R8 | Error chip → fix → Accept/Reject inline | Python 401 fix loop | B5 (generalize) |
| R9 | genUI cards | readiness + tuning cards (`__air*`) | B8 (base for test-run card) |
| R10 | Agent ↔ canvas window bridges | `__dsRequestPythonFix__` / `__dsApplyPythonFix__` | all (extend) |

## 4. Design patterns — new (the actual design work)

| # | Pattern | What it is | Derived from |
|---|---|---|---|
| N1 | **Evidence-backed proposal card** | Join (or fix) proposal: key + coverage % + cardinality + preview rows + Accept / Edit / Reject | R2 + R8 |
| N2 | **Ghosted pending state on canvas** | Proposed chip/edge renders ghosted until accepted; reject removes cleanly | new canvas state |
| N3 | **Profile report card** | Per-table verdict + issues found ("3 clean, 2 have issues") with drill-in | R2 |
| N4 | **Fan-out warning** | Post-join: "this 1:many join would double-count revenue — de-dupe?" | research's canonical failure; no competitor shows this |
| N5 | **Autonomy control** | Review (gate judgment) ↔ Auto (gate only irreversibles). Where it lives = open decision. Omni ships Sandbox/Review/Auto — we're on-pattern | market-validated |
| N6 | **Test-run card** | Plan questions run against the model; answers + pass/flag + re-run | R9 tuning card (~80% there) |

Gating rule (N5 defaults): reads/profiling → never gated · data-changing transforms → gated in Review, auto in Auto · joins → always gated on first build · cache/publish/write → always gated in both.

---

## 5. Mock scripts to hardcode (AgentPanel phase-machine style)

Same architecture as `NotebookFlowPhase` / `runLiveBuildMultiSource`: a phase type + canned step sequences + window bridges into ModelCanvas. All content from `mockData.ts` — no invented tables.

| Script | Beat | Canned behavior |
|---|---|---|
| `agent_fetch_tables` | B1 | parse names → drop nodes (staggered, ~600ms) → narrate |
| `agent_csv_context` | B2 | attach chip → node → trigger existing cacheConfirm via agent message |
| `agent_python_source` | B3 | propose → create Python block → open properties panel → inline secret input → run → node |
| `agent_profile_all` | B4 | working steps ("sampling 5 tables…") → profile report card w/ canned verdicts (CSV: nulls in region + 3 dupes; NPS: 24% coverage + outlier scores) |
| `agent_fix_issue` | B5 | per issue: proposal → ghosted chip → accept lands it / reject clears |
| `agent_transform` | B6 | parse ask → ghosted chip(s); model-scope asks fan out to every dated table |
| `agent_propose_joins` | B7 | per pair: evidence card (real coverage numbers from mock data) → ghosted edge → accept; 1:many pair triggers fan-out warning |
| `agent_run_tests` | B8 | plan questions → query skill working steps → test-run card (1 flagged answer for the coaching beat) |

New bridges needed (extend R10): `__dsAgentAddNode__`, `__dsAgentProposeChip__` / `__dsAgentResolveChip__(accept|reject)`, `__dsAgentProposeJoin__` / resolve, `__dsAgentOpenPanel__(blockId)`.

---

## 6. Open decisions (need Vivek before/while building)

1. **Hero framing:** incremental co-drive (B1→B8, autopilot as kicker) vs one-click autopilot (plan up front, incremental as steering story). Leaning: incremental hero — it demos the approval patterns, which are the differentiator.
2. **Where the autonomy control lives:** agent-panel header toggle vs per-proposal "always allow this" vs both.
3. **Build scope:** vertical slice first (B4→B7: profile → fix → join — richest in new patterns) vs all 8 beats shallow. Leaning: vertical slice; B1–B3 mostly reuse existing patterns and can follow.
4. **Ghosted-state mechanics:** does a pending proposal block further agent work (serial) or queue (parallel proposals)? Leaning: serial for the demo — simpler and calmer.
5. **Where test results live:** chat (lean) vs pinned to canvas. Leaning: chat with the test-run card; canvas stays a build surface.

---

## 7. Not in this build

AI-readiness/semantic layer (endpoint, exists) · decay/Trust Pulse (the moat, separate build — see research) · manual-path parity (per hard rule: agentic first) · per-step code cells (deferred from s140).
