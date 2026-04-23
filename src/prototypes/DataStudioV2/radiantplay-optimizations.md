# RadiantPlay × DataStudio — Agent Optimizations

_Written 2026-04-23. Author: Vivek Sahi._

This documents a full audit and optimization pass on how RadiantPlay works as an AI agent setup, done in the context of DataStudio prototype work. Two audiences:

- **Faris** — some of these patterns could be generalized into RadiantPlay's shared structure. Notes on what's transferable are marked.
- **Vivek** — the status column tracks what's working, what needs iteration, and what to change. Update this as sessions progress.

---

## What problem was being solved

RadiantPlay's rule system was designed for Cursor (frontmatter-based auto-injection). In Claude Code, files are only read when explicitly requested — so the tier/orchestration system only works if Claude proactively follows it, which is fragile. Additionally, working on a specific prototype (DataStudio) was pulling in context intended for other prototypes (Liveboard rules, etc.), and there was no design process encoded — Claude would default to building without researching or exploring first.

Goal: make the AI agent work like a junior designer who has a design process, domain knowledge, and enough judgment to know when to build vs. research vs. explore.

---

## Changes made

### 1. Figma MCP — turned off by default

**What:** Set `"figma@claude-plugins-official": false` in `~/.claude/settings.json`.

**Why:** Figma MCP adds ~4,000 tokens per message even when idle — no Figma work happening. On a 20-message session that's 80,000 tokens of overhead.

**How to re-enable:** Set back to `true` in `~/.claude/settings.json`, or use `/config` in Claude Code.

**Transferable to RadiantPlay?** Yes — add a note to the orchestration guide: disconnect Figma MCP when not doing Figma work. The token overhead is real and constant.

| Status | Notes |
|--------|-------|
| ✅ Done | Needs to be re-enabled when doing Figma sessions |

---

### 2. DataStudio CLAUDE.md — split into session file + reference file

**What:** `CLAUDE.md` was 184 lines, mixing session rules with heavy reference content (mock data schema, routing pipeline, ProjectState shape, key files). Split into:
- `CLAUDE.md` (74 lines) — session rules only: protocol, intake, hard rules
- `reference.md` — reference content, read only when touching agent/routing/data

**Why:** Every session was loading mock data schema and routing pipeline even for pure UI work. ~1,700 tokens saved per session; more importantly, CLAUDE.md now stays lean as the project grows.

**Transferable to RadiantPlay?** Yes — the pattern of keeping CLAUDE.md lean (session rules only) and extracting reference material into a separate file is worth recommending in `prototype-structure.md`. Any prototype's CLAUDE.md that grows beyond ~100 lines is probably mixing session rules with reference material.

| Status | Notes |
|--------|-------|
| ✅ Done | |

---

### 3. Skip list for irrelevant rule files

**What:** Added a skip block to DataStudio CLAUDE.md listing 7 rule files to never load during DataStudio sessions: all 5 liveboard files, `prototype-generation.md`, `prototype-structure.md`.

**Why:** These files exist for other prototypes and contexts. They contribute nothing to DataStudio work but could be loaded by mistake during orchestration.

**Transferable to RadiantPlay?** Pattern yes — each prototype's CLAUDE.md should have a skip list of rule files irrelevant to that prototype's domain. Reduces accidental loading and clarifies intent.

| Status | Notes |
|--------|-------|
| ✅ Done | |

---

### 4. design-system.md — per-prototype component cheat sheet

**What:** Created `DataStudio/design-system.md` (~100 lines) listing only the Radiant components actually used in DataStudio, with key props, token shortcuts, layout primitives, and a compliance gap table.

**Why:** Loading the full `component-inventory.md` (477 lines), `layout-patterns.md` (727 lines), and `token-usage.md` (335 lines) for routine Tier 1 work is ~20,000+ tokens. The cheat sheet is ~1,500 tokens and covers 80% of sessions.

**How it was built:** Grepped all actual component imports across DataStudio files. Only documented what's genuinely used, plus what should be adopted (compliance gaps).

**Transferable to RadiantPlay?** Strongly yes — `prototype-structure.md` could recommend that every prototype create a `design-system.md` cheat sheet scoped to the components it uses. This would replace the current pattern of loading the full component-inventory on every Tier 1 task.

| Status | Notes |
|--------|-------|
| ✅ Done | Will need updating as DataStudio uses more components |

---

### 5. Task intake protocol — classify before acting

**What:** Added a "classify before acting" section to CLAUDE.md. Every task gets classified on two axes before any code is written:
- **Novelty:** Known territory (extends existing) vs. New territory (first time)
- **Scale:** Small / Medium / Large

The combination determines the required process:

| | Known | New |
|---|---|---|
| Small | Build | Scan knowledge/ first |
| Medium | Check research/, then build | Research doc first |
| Large | Research + explorations | Full design process |

**Why:** Without this, Claude defaults to building everything immediately. This encodes the junior-designer judgment: "do I understand this well enough to design it?"

**Transferable to RadiantPlay?** Yes — this pattern could go in the shared `_orchestration.md`. The current orchestration classifies by complexity (Tier 0–3), but not by novelty. Adding novelty as a dimension would catch "simple but new territory" tasks that shouldn't be built without research.

| Status | Notes |
|--------|-------|
| ✅ Done | First real test will be the next medium+ new territory task |

---

### 6. Session type starters

**What:** Three named session modes in CLAUDE.md:
- `"next up"` → reads CONTEXT.md, works on first open item
- `"sidequest: [name]"` → reads `sidequests/[name].md`, works in Playground.tsx only
- `"research: [topic]"` → uses `research/_template.md`, produces a doc, no code

**Why:** Sessions were starting without a declared mode — agent would read CONTEXT.md and start building regardless of whether the task needed research first or was exploratory. Named modes make the intent explicit and constrain what the agent touches.

**Transferable to RadiantPlay?** The concept yes — a `getting-started` guide or `prototype-structure.md` could recommend this pattern for any prototype with ongoing work. The specific phrases are per-prototype.

| Status | Notes |
|--------|-------|
| ✅ Done | Need to test that "sidequest: [name]" actually stays isolated from main code |

---

### 7. Sidequests workflow

**What:** Created `sidequests/` folder with:
- `_template.md` — lightweight template (question, constraints, options, current state, how to close)
- `workspace-canvas.md` — active sidequest moved from `research/` where it lived awkwardly

**Why:** Playground.tsx was being used for explorations but there was no structure around it. A sidequest doc makes the exploration question explicit, tracks what's been tried, and defines a closing condition so the exploration doesn't drift.

**Relationship to research/:** Research docs capture decisions after they're made. Sidequests are active explorations before a decision. When a sidequest closes, the decision goes into `knowledge/patterns.md` and the sidequest file is deleted.

**Transferable to RadiantPlay?** Yes — the sidequest pattern (lightweight exploration doc + Playground.tsx as the canvas) could be documented in `prototyping-guide.md` as a recommended workflow for visual explorations.

| Status | Notes |
|--------|-------|
| ✅ Done | First real test: workspace-canvas sidequest continuing in Playground |

---

### 8. Research template

**What:** Created `research/_template.md` — consistent format for every research doc: question, who's affected, current state, competitive references, options considered, decision, what's deferred, explorations needed.

**Why:** Existing research docs (data-prep-workflow.md, agent-work-display.md etc.) had different structures. Future Claude can't reliably navigate inconsistent docs — it has to re-read everything to find the relevant part.

**Transferable to RadiantPlay?** Yes — a research template could be added to the shared repo and referenced in `prototyping-guide.md`. Low effort, high payoff for teams doing serious design research.

| Status | Notes |
|--------|-------|
| ✅ Done | |

---

### 9. Knowledge base — users, platform, patterns

**What:** Created `knowledge/` folder with three files:
- `users.md` — who the primary user is, their workflow, pain points, the AHA moment
- `platform.md` — what ThoughtSpot currently does (modeling, caching, Spotter failures, dbt integration), what DataStudio adds
- `patterns.md` — confirmed design patterns, anti-patterns (tried and walked back), competitive intelligence, open design questions

**Why:** Without domain knowledge, Claude restarts from zero on every new feature. The knowledge base means Claude can make product-aware suggestions, not just pixel-level suggestions. Anti-patterns are especially valuable — they prevent re-exploring dead ends.

**How it was built:** 20 pointed questions answered by the product owner across three batches (users, platform, patterns). ~45 minutes of conversation → 326 lines of domain knowledge.

**Transferable to RadiantPlay?** Pattern yes — `prototype-structure.md` could recommend a `knowledge/` folder for any prototype with ongoing design work. The specific content is always per-prototype, but the three-file structure (users / platform / patterns) is a useful starting template.

| Status | Notes |
|--------|-------|
| ✅ Done | Open questions in each file — fill in as learned |

---

### 10. product.md — product vertical brain

**What:** Created `DataStudio/product.md` — a durable doc capturing what DataStudio is as a product: the 6 situations, design principles with specificity, key decisions that are locked, and the research library index.

**Why:** CLAUDE.md had a brief description of what the prototype is, but nothing that would let Claude give product-level feedback ("this interaction violates an agentic principle") vs. just code-level feedback. `product.md` gives Claude a target to evaluate against.

**Transferable to RadiantPlay?** Pattern yes — any prototype serious enough to have ongoing work could have a `product.md`. It's different from CLAUDE.md (which is session rules) and CONTEXT.md (which is build state).

| Status | Notes |
|--------|-------|
| ✅ Done | Will need updating when product direction shifts |

---

### 11. Deleted stale / dead-weight files

**What deleted:**

| File | Reason |
|------|--------|
| `notion-radiant-guidelines/` | Broken Notion export — just a ToC with dead links |
| `getting-started/your-first-git-branch.md` | Empty file |
| `getting-started/your-first-prototype.md` | New designer onboarding, not relevant to active work |
| `docs/prd-data-studio-v2.md` (1,761 lines) | Stale PRD superseded by DataStudio CLAUDE.md + CONTEXT.md. Risk: Claude loads it and acts on old decisions |
| `docs/CHANGELOG.md` | Main maintainer tool, not useful in a designer fork |
| `docs/prototyping-guide.md` | Onboarding guide, redundant for active work |

**Note on upstream:** These files may return on `git pull upstream` if upstream modifies them. That's fine — they're not load-bearing, just noise.

**Transferable to RadiantPlay?** The `docs/prd-data-studio-v2.md` deletion is worth noting upstream — stale PRDs in the repo can confuse agents. Maintainers should archive or delete PRDs when they're superseded.

| Status | Notes |
|--------|-------|
| ✅ Done | |

---

## Token impact summary

| Change | Tokens saved per session |
|--------|------------------------|
| Figma MCP off | ~4,000 × message count (was 80,000+ on a 20-msg session) |
| CLAUDE.md split | ~1,700 (reference.md not loaded for UI sessions) |
| design-system.md vs. full rule files | ~20,000–26,000 for Tier 1 work |
| Liveboard rules never loading | ~9,000 (5 files, ~900 lines) |
| Sidequest sessions isolated | Saves full prototype context load |
| **Before (typical heavy session)** | **~120,000 tokens before real work** |
| **After (typical UI session)** | **~8,000–10,000 tokens to start** |

---

## What to watch / still to validate

| Thing to watch | How to know it's working |
|----------------|------------------------|
| Task intake catches new territory | Next medium+ task in new territory: Claude pauses and proposes research before building |
| Sidequest isolation holds | "sidequest: workspace-canvas" session: Claude never touches AgentPanel.tsx or other main files |
| design-system.md is sufficient for Tier 1 | No session needs to fall back to full component-inventory for routine work |
| Knowledge files stay current | After each session that changes product direction, relevant knowledge/ file is updated |
| CONTEXT.md doesn't bloat | Session log section stays within 3 entries (full history in SESSION_LOG.md) |

---

## What I want to add next

_Vivek: add notes here as you work._

- [ ] Add explicit "state classification before starting" step to "next up" mode in CLAUDE.md
- [ ] Add competitive deep-dive to `knowledge/patterns.md` (Sigma, Omni specifics)
- [ ] Fill in open questions in `knowledge/users.md` and `knowledge/platform.md` as they get answered
- [ ] First real test of the full design process on a new territory task
