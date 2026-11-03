# Radiant Play — Backlog Tasks (Todo)
*Last updated: 2026-05-19 (RdModal deprecation queued; full plan at docs/2026-05-19-rdmodal-deprecation-plan.md)*

---

## 🗂 Cmdk Prototype — Local Only (Gitignored)

**Status:** Gitignored as of 2026-04-06. Folder exists at `src/prototypes/Cmdk/` on your local machine only.
**Reason:** 11 MB Figma Make export (mostly PNGs) — too heavy for designer forks.

### To restore to the repo when needed:
1. Remove the gitignore entry in `.gitignore` — delete this line:
   ```
   src/prototypes/Cmdk/
   ```
2. Stage and commit the folder:
   ```bash
   git add src/prototypes/Cmdk/
   git commit -m "feat: restore Cmdk prototype"
   ```
3. Re-add the registry entry in `src/prototypes/registry.ts` if removed.
4. Push to staging, then main when ready.

### If folder is lost (new machine / re-clone):
- The last committed version is in git history — find it with:
  ```bash
  git log --all --full-history -- src/prototypes/Cmdk/
  git checkout <commit-hash> -- src/prototypes/Cmdk/
  ```

---

## Ongoing

Current active work tracked by owner:

- [ ] **Orchestrator refactor** — further reduce token usage beyond current 81% reduction; test tier classification accuracy
- [ ] **Token refactor** — Phases 1–5 (primitives, light semantic, typography, shadows, layout) shipped 2026-04-28. Phase 6 (dark mode remap), Phase 7 (motion), Phase 8 (deprecations) remain. See `plans/2026-04-07-token-system-implementation.md`
- [ ] **Dark mode** — enable dark mode across all 74+ components, fix token mismatches, QA templates (now blocked on token Phase 6)
- [ ] **Spec writing exploration** *(Aditya)* — explore spec writing workflow back into Figma
- [ ] **Liveboard tiles** *(Aditya)* — tile behavior logic and component pattern refactor
- [ ] **Spotter viz** *(Devanashi)* — Spotter visualisation work
- [~] **Spotter model IA** *(Komal)* — model editing flows largely covered by `DataModelEditor` (Suraj, 378-line full editor with 6 tabs and AI-assisted suggestions), `_agentic/` (12 chat components), `_datamodel/` (TableCanvas / ColumnTree / JoinConnector / TableCard), `SpotterMemory` and `MiniSpotters` prototypes. **Remaining:** discovery/catalog, lifecycle (draft → published, versioning), sharing/permissions, source-side IA, cross-flow anchoring (search/answer/Liveboard tied to the model).

---

## Design System & Components

- [ ] Cleanup components — audit and remove unused/stale shared components; fix components currently broken or half-done
- [ ] Design system refactor with dark mode — foundational token and component updates
- [ ] Dark mode enable for all components — ensure all 74+ components support dark mode
- [ ] **Test dark mode UI** — visual QA pass across all components and prototype templates in dark mode
- [ ] Update dark mode templates — apply dark mode to existing prototype templates
- [ ] **#2 Dark mode token mismatch** — some atomic tokens not rendering correctly for dark mode states across components
- [ ] Icon usage guidelines — document when/how to use icons across components
- [ ] Avatar icons change — update avatar icon set
- [ ] Individual component update — targeted updates per component (add to list as identified)
- [ ] **Left nav and header shell** — reusable AppShell with left nav and header as a global repeatable component
- [ ] **Repeatable chat interface component** — shared chat UI component usable across prototypes
- [ ] **Homepage quick access** — homepage to surface recently worked on prototypes for fast access
- [ ] **Deprecate `RdModal`** — migrate the one remaining consumer (`DataModelEditor`) to `@components/Modal`, delete the `RdModalDemo` page + route, remove the `src/components/RdModal/` folder, drop the entry from `componentRegistry.ts` (component count goes 76 → 75). Plan with all 8 touchpoints + migration order at `docs/2026-05-19-rdmodal-deprecation-plan.md`. **Blocker check first:** confirm Modal has header/footer fixed-height parity (memory note flagged this as pending).

---

## Liveboard

- [ ] Liveboard interactions logic — define and implement interaction patterns
- [ ] Liveboard tiles logic + pattern refactor — tile behavior rules and component refactor
- [ ] **#3 Liveboard template + IA for all components** — add Liveboard template and full context IA for all Liveboard components

---

## Engineering & Infrastructure

- [ ] Orchestrator refactor for less token usage — further reduce context cost beyond current 81% reduction
- [ ] **Test new orchestrator layer** — validate tier classification accuracy and measure actual token consumption across representative tasks
- [ ] **#6 Optimise context load in instructions** — audit all rule files and CLAUDE.md for redundancy, tighten what gets loaded per tier
- [ ] Galaxy deployment and permission management — streamline fork deployment and access control
- [ ] **#8 Easily find branches and worktrees** — surface active branches, worktrees, and recommendations directly in the workflow
- [ ] Statusline + update repo messages — improve statusline output and repo-level messaging

---

## Design Specs & Figma

- [ ] Spec writing — back to Figma — write component/pattern specs back into Figma files
- [ ] Bring templates back into Figma — sync current prototype templates into Figma
- [ ] Spec write skill to Figma — build a Claude skill that writes specs directly to Figma

---

## Documentation & Guides

- [ ] Update the documentation sites — refresh RadiantPlay docs to reflect current state
- [ ] Publishing components upstream guide — how to promote prototype components to the design system
- [ ] Varying guides on things to work with RP — quick-start guides for different use cases
- [ ] Update the doc with progress — keep docs in sync as work completes
- [ ] **Guide on sharing a prototype and deployment options** — write a designer-facing guide covering per-branch preview URLs, the maintainer's personal-branch isolation model, and how forks publish their own previews. (Infrastructure done 2026-05-18; only the written guide is outstanding.)
- [ ] **Guide on self-improving Cursor/Claude approach** — document how designers can refine their own prompting and rules setup

---

## AI Tooling & Workflow

- [ ] Engineering help on code review — set up AI-assisted code review workflow
- [ ] Explore review instructions — refine `/explore` mode behavior and instructions
- [ ] **#7 External UI freedom (shadcn etc.)** — define how `/explore` mode enables bringing in external UI libraries like shadcn for experimental prototypes
- [ ] Update subagent code for latest repo changes — sync subagent logic with current codebase
- [ ] Claude Code → Cursor rules update — keep Cursor rules in sync with Claude Code conventions
- [ ] Todo list with Claude local → auto rank — auto-prioritize tasks using Claude locally
- [ ] Cursor commands equivalent of Claude shell — map Cursor command palette to Claude skills
- [ ] Identify prompting patterns for token optimization — document high-efficiency prompt patterns

---

## Branding & Website

- [ ] Logo + branding with website — finalize RadiantPlay brand identity and website
- [ ] ThoughtSpot design article on TS website — publish design article on ThoughtSpot.com
- [ ] Best practices as part of RadiantPlay website → gaming → leaderboard — gamify best practice adoption

---

## Content & Communication

- [ ] Focused details around building with and teaching with Claude — create learning content
- [ ] How to create more RadiantPlay tutorial videos — define format and pipeline for video tutorials
- [ ] Visibility into what's happening with RP for the team — internal comms / status updates

---

## Analytics & Research

- [ ] Insights/logs from heavy users — instrument usage tracking for power users
- [ ] **#5 Mock sample retail sales data** — create mock retail sales dataset usable across prototypes for realistic product demos

---

## Spotter (Product)

- [ ] Spotter — IA work — information architecture for Spotter's core flows (search, answer, Liveboard)
- [-] ~~Spotter — agent API for real responses~~ — **Skipped (2026-05-18).** Canned fixtures are sufficient for prototyping needs right now; revisit if a demo requires live AI responses.

---

## Completed (recent)

- [x] **/sync-upstream rewrite (26.5.3b release)** — preview-first, feature-branch safe. Lands upstream on main before forwarding into the designer's branch, stash uses `--include-untracked`, never silently abandons WIP. Fixes the failure mode that lost a designer's work the day before. /check-upstream consolidated into /sync-upstream as a yes/no preview phase. — 2026-05-18
- [x] **Maintainer branch model split** — `personal` and `personal/*` are origin-only; `main`, `staging`, and shared `feat/fix/chore` branches push to both origin and galaxy. Pre-push hook in `scripts/hooks/pre-push` enforces it. Documented in CLAUDE.md. — 2026-05-18
- [x] **Personal preview URL** — `faris-radiantplay.vercel.app` added to the Vercel project, auto-tracks the `personal` branch. — 2026-05-18
- [x] **GitHub default branch flipped to `main`** — fresh clones now land on production state, PRs target main by default. — 2026-05-18
- [x] postcss XSS vulnerability patched (lockfile bump to 8.5.10) — 2026-04-28
- [x] Token system Phases 4 & 5 — shadows + layout aligned with Figma 3.0 — 2026-04-28
- [x] Token system Phase 3 — typography aligned with Figma 3.0 — 2026-04-28
- [x] Token system Phase 2 — light mode semantic colors aligned with Figma 3.0 — 2026-04-28
- [x] Token system Phase 1 — primitive colors aligned with Figma 3.0 — 2026-04-28
- [x] Modal aligned with Figma spec, absorbed RdModal learnings — 2026-04-27
- [x] RdModal shared modal component added — 2026-04-15
- [x] Production password gate via edge middleware (galaxy deployment access) — 2026-04-12
- [x] Changelog grouped by theme in version history page — 2026-04-08
- [x] Registry split into core + mine — eliminates sync conflicts for designer forks — 2026-04-08
- [x] Vite high-severity vulnerabilities patched (7.3.2) — 2026-04-08
- [x] Cmdk gitignored locally (11 MB Figma export, too large for forks) — 2026-04-06
- [x] Lazy-load ECharts bundle (deferred from startup to first chart render) — 2026-04-06
- [x] picomatch vulnerability patched, stale Figma Make package.json removed — 2026-04-06
- [x] Orchestrator v2 — tier-based classification, 81% context reduction — 2026-03-31
- [x] Add iteration loop detection + MCP overhead awareness to orchestrator — 2026-04-02
- [x] Fix font fallback — multi-local() for Plain weight 400 and 600 — 2026-04-02
- [x] 35 new Scaligent-parity components added (38 → 74 total) — 2026-03-02
- [x] Component registry updated with all new entries — 2026-03-02
- [x] AI orchestration layer refreshed (6 rule files updated) — 2026-03-02
- [x] Changelog v2.1.0 entry added — 2026-03-02
- [x] Rollup path traversal vulnerability patched — 2026-03-02
- [x] Add Claude Code support (CLAUDE.md + memory baseline) — 2026-03-04
