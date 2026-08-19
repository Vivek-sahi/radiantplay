# Agent behavior patterns — detailed design (A1–A6)
_Interaction design for the six agent behaviors (see_ `2026-07-13-agentic-workflow-design.md` _§2b). Grounded in the built surface:_ **_AgentPanel left_** _(messages + composer),_ **_canvas right_** _(blocks, chips, joins, spreadsheet preview). References: Claude Code, Omni, Genie, Cortex, Hex._

**What the composer already has** (`PromptBar.tsx`): `@` fuzzy table search (flat, w/ connection·db·schema path), token chips (table ⊞ blue / column ✦ purple / error red), `leftSlot` (holds Add + Reference icons — Reference is currently a dead affordance), placeholder already promises `/` and `@`. A1–A4 are completions of this composer, not new surfaces.

* * *
## A1 — Empty state / agent intro
**Purpose:** first 5 seconds answer "what is this agent and what can it do here?"

**Anatomy (agent panel, empty-model state):**

1. Greeting block: one line of role ("I build, clean, and join data with you — everything I do lands on the canvas for you to review") — the _review promise_ is part of the intro.
  
2. Three capability groups as compact rows (icon + label + example): **Bring data** · **Clean & transform** · **Join & model**.
  
3. 3–4 **starter prompts** — one-click sends (reuse the s139 sample-prompt rows).
  

**The differentiator — starters are canvas-derived, not static** (vs Genie's curated questions):

- Empty canvas → "Fetch dim_accounts, support_cases and call_metrics" · "Upload a file" · "What data can I access?"
  
- Tables on canvas, no joins → "Are these tables clean?" · "Join these into a model"
  
- Joined model → "Filter everything to the last 12 months" · (test/AI-readiness starters descoped)
  

**Reuse:** sample-prompts block + subtitle (exist); make the prompt list a function of canvas state (groups/joins from ModelCanvas via the existing state bridge).

* * *
## A2 — Skills discovery (`/` + "what can you do?")
**Purpose:** make the promised `/` real; the agent can also answer capability questions conversationally, grounded in the current canvas.

`/` **menu (composer):**

- Trigger: `/` at start of input or after whitespace → popover above the bar (same `dropDirection='up'` machinery as `@`).
  
- Rows: icon + skill name + one-liner + shortcut example. Skills = **Add data** · **Check quality** · **Clean** · **Transform** · **Join** · **Code (SQL/Python)**. (Query/test + AI-readiness excluded — descoped.)
  
- Select → inserts a **skill token** at the head of the prompt (like column chips) and swaps the placeholder to a skill-specific hint: `/clean` → "Clean what? Name a table, @-mention it, or point at it."
  
- Implementation: clone the `@` regex/mention machinery (`/(^|\s)\/(\w*)$/`).
  

**Conversational fallback:** "what can you do?" → response card = same three capability groups as A1, but _state-aware_: "You have 5 tables on the canvas and 1 CSV. I can check their quality, clean issues, join them into a model…" Each row tappable → prefills the composer.

* * *
## A3 — `@` references (hierarchy + search)
**Purpose:** reference anything from connection → database → schema → table without pre-scoping (Genie/Cortex lock scope at setup — this beats that).

**RESOLVED (2026-07-13): v1 ships the flat fuzzy search only.** No competitor has in-prompt hierarchy (Genie/Cortex/Omni pre-scope at setup; Hex lets the agent search; Claude Code is flat fuzzy). Our fuzzy rows already show the full path — the hierarchy is _visible_, just not navigated. "Going up the hierarchy" is served by the data browser (canvas side) and by asking the agent ("what data do I have in snowflake-prod?" → conversational answer, Hex-style). Browse mode + scope tokens below = **v2, only if feedback asks for it**.

**Two modes, one popover:**

- `@` **+ typing → fuzzy search** (exists today, keep): flat matches with path shown.
  
- `@` **alone (no query) → browse mode** (new): drill list starting at connections. Header = breadcrumb (`snowflake-prod / ANALYTICS / …`) with back chevron; rows drill down (connection → databases → schemas → tables). Keyboard: ↑↓ move · → drill in · ← up · Enter select · Esc close.
  

**Non-leaf selection (new capability):** any level is selectable, not just tables. `@PUBLIC` (schema) or `@snowflake-prod` (connection) becomes a **scope token** — "what's in @snowflake-prod?", "profile everything in @PUBLIC". Token icons: connection ⌂ · schema ▤ · table ⊞ · column ✦ (last two exist).

**Reuse:** `WAREHOUSE_TREE` already has the full hierarchy; mention dropdown + chip patterns exist. New: browse-mode list, breadcrumb state, scope-token type.

* * *
## A4 — Point-and-select referencing
**Purpose:** "this one" for canvases. No competitor does spatial referencing — ours to define. (Claude Code's IDE analog: selected lines auto-become context.)

**Flow:**

1. Click the Reference icon in `leftSlot` (exists, currently dead) → **pick mode**.
  
2. Canvas shows a hint pill (top-center): "Click an element to reference it · Esc to cancel". Cursor = crosshair.
  
3. Hover any referenceable element → 2px brand outline + name tooltip. Referenceable: **block cards** (table/code), **chips** (steps), **join edges**, **spreadsheet column headers**.
  
4. Click → token lands in the composer (⊞ dim_accounts · ✦ region · ⧉ Filter on dim_accounts · ⋈ accounts × cases), pick mode exits, composer focuses, placeholder becomes "What should I do with [ref]?"
  

**Granularity:** node · chip · edge · column. Not cells.

**Bidirectional (the delight detail):** when the _agent_ mentions a canvas element in chat, hovering the mention highlights that element on the canvas — same visual language in both directions.

**Implementation anchors:** blocks already carry `data-block-id` (the wire-drag uses `elementFromPoint` hit-testing — same approach); add `data-ref` attrs to chips/edges/column headers; token chips + `setColumns` bridge exist in PromptBar.

* * *
## A5 — Multi-step flow + review (plan-then-execute)
**Purpose:** the agent does several things from one ask; the user reviews _decisions_ without N sequential modals.

**RESOLVED (2026-07-13): one ask at a time (copilot), plan-then-execute.** Approval never scatters — it lives in **one plan-with-evidence card in chat**, always at the end of the agent's turn. The canvas is the _result_ surface, never the approval surface. Ghosted canvas proposals are **deferred to v2** — v1 doesn't need them, which removes the riskiest new canvas work. (Claude Code precedent: plan mode — approve the plan once, execution runs without per-change gates.)

**Flow for a compound ask ("clean up these tables"):**

1. **Reads run first** (profiling, sampling — never gated) so the plan can carry evidence.
  
2. **Plan-with-evidence card in chat:** "Here's what I'll do — 3 changes." Row = op icon + label + target + one-line evidence ("Fill 12 nulls in resolution_time_hours → median 4.2h"); any row can be unticked.
  
3. **One Apply button.** (Decline or redirect by replying — "skip the dedupe, use mean not median".)
  
4. **Execute live:** chips land on the canvas as the agent works (reuse the live-build animation), each with a provenance dot; the card's rows check off in sync.
  

**Canvas ↔ chat linkage:** hovering a plan-card row highlights its landed chip on canvas; clicking pans to it (reuse the existing highlight machinery).

**Rules:** every plan row carries evidence (from the profile pass) — approving is never blind. Joins get the full **evidence proposal card** (N1: key, coverage %, cardinality, preview rows) as their expanded plan row. **One open plan at a time** — a new ask while a plan is pending prompts to resolve it first.

* * *
## A6 — Autonomy mode
**Purpose:** user controls the leash; trust accrues visibly. (Omni: Sandbox/Review/Auto validates the pattern; Claude Code's per-action "always allow" is the differentiating detail.)

**Control (RESOLVED: minimal):** icon-only dropdown in the composer `leftSlot` (documented home for "mode toggles") — small shield icon + caret, **no label**; current mode = subtle dot color + tooltip. Deliberately tiny: this control exists to _start the autonomy discussion_, not to settle it. Menu:

- **Review** (default) — "I propose; you approve every change."
  
- **Auto** — "I apply changes and keep a log. Irreversible actions still need you."
  

**Behavior deltas:**

- _Review:_ all mutating work goes through the plan-with-evidence card (A5) — one Apply per ask.
  
- _Auto:_ the plan card is skipped — chips land applied directly, each with a subtle agent-provenance dot; chat keeps a running **changelog card** (what was applied + per-item Undo). The chip pipeline stays the audit trail.
  
- _Both modes:_ cache, publish, secrets, destructive drops **always gate**. Joins always gate on the first build of a model.
  

**"Always allow" (trust accrual):** every plan card footer: "Always allow [clean fixes]" → that category stops gating this session. The mode menu reflects it ("Review · 2 always-allowed"); click to view/revoke. Categories = the gating tiers (clean fixes · transforms · joins).

* * *
## Cross-cutting
- **Window bridges needed** (extends the `__ds*` set): `__dsAgentAddNode__` · `__dsAgentApplyChip__` (v2: propose/resolve pair for ghosts) · `__dsAgentApplyJoin__` · `__dsAgentHighlight__(refId)` · `__dsAgentOpenPanel__(blockId)` · pick-mode enter/exit + `__dsPickResult__(token)`.
  
- **Token grammar (one vocabulary everywhere):** ⌂ connection · ▤ schema · ⊞ table · ✦ column · ⧉ chip/step · ⋈ join. Same tokens in composer, chat mentions, and plan cards.
  
- **Provenance:** agent-created chips are identical to manual chips (same object, same edit/remove) + a subtle provenance dot. No second-class agent artifacts.
  
## Decisions — RESOLVED with Vivek (2026-07-13)
1. **A4 multi-pick → single-pick per activation.** One reference per click of the icon; multi-pick is v2 at most.
  
2. **A6 placement → minimal icon-only dropdown in the composer leftSlot.** Deliberately small — a discussion-starter, not a settled control.
  
3. **A3 scope → v1 keeps the existing flat fuzzy** `@` **(tables, path visible per row).** Hierarchy browsing served by the data browser + asking the agent. Browse mode + scope tokens = v2 if feedback asks. Grounding: no competitor has in-prompt hierarchy — Genie/Cortex/Omni pre-scope at setup, Hex agent-searches, Claude Code is flat fuzzy.
  
4. **A5 model → one ask at a time (copilot), plan-then-execute.** Reads first → one plan-with-evidence card in chat → one Apply → live execution on canvas. Approval always lives in one chat card; canvas = result surface. Ghost state deferred to v2.
