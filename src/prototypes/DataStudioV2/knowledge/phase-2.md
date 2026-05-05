# Phase 2

The work to do in V2. Eight concrete tasks. The strategy memo at `research/phase-2-manage-iterate.md` is reference background — this doc is the build plan.

---

## 1. Move agent prompt from project to Data Studio overview page

**Today:** The agent panel lives inside `Workspace.tsx` — the user must enter a project to chat with the agent.
**Phase 2:** The agent prompt lives on the Data Studio overview page (`Overview.tsx` / `ProjectsList.tsx`). Workflows are initiated from home, not from inside a project.

Foundational change — gates tasks 3, 5, 6, 7.

---

## 2. Add example tasks on the overview page

**Today:** No discovery surface for what the agent can do.
**Phase 2:** Example task chips on the overview page covering the agent's range — building, debugging, modifying, monitoring — that double as conversation starters.

---

## 3. Add a connection step to the building flow

**Today:** `build_project` script (`AgentPanel.tsx:165`) starts from tables already in mockData; assumes a single hardcoded connection.
**Phase 2:** Insert a connection step at the start of the build flow — pick a connection, scan for tables, then proceed into the model build.

---

## 4. Show caching in the building flow

**Today:** `build_project` doesn't surface caching as a step in the ladder.
**Phase 2:** Caching becomes a visible step in the build flow — show how data is cached for the model so the user understands the tradeoff and what's happening behind the scenes.

---

## 5. Show how dbt models are imported in the dbt build flow

**Today:** `import_dbt` script (`AgentPanel.tsx:264`) translates a dbt model to TML; the import action itself is implicit (no source picker, no lineage).
**Phase 2:** Make the import explicit — show the dbt source picker, the lineage of what's being brought in, and what translates vs. what doesn't.

---

## 6. Trigger editing via an optimization use-case (agentic)

**Today:** No dedicated edit mode. Some scripts modify a project (e.g. `convert_currency`) but there's no optimization-driven entry point.
**Phase 2:** Use an optimization scenario as the entry — a metric is slow, or a join is producing duplicates — and the agent proposes targeted edits the user can review and apply.

---

## 7. Show a debugging + monitoring use-case (agentic)

**Today:** `DataHealthModal` + `Overview.tsx` alert cards show issues statically; `LogModal` shows raw error logs. No agentic diagnosis or fix loop.
**Phase 2:** Agentic flow — the agent reads failing query logs, surfaces the semantic gap, proposes a fix, user approves, the model updates, the health badge resets.

---

## 8. Increase the agent panel's default width

**Today:** Agent panel default width is set inside `Workspace.tsx` / `Shell.tsx`.
**Phase 2:** Widen the default to give the agent more breathing room — better for demos and easier to read multi-step reasoning.

---

## Reference

- `knowledge/skill-map.md` — 28-skill catalog
- `knowledge/agent-architecture.md` — per-skill reasoning chains
- `research/phase-2-manage-iterate.md` — strategy memo (reference, not build plan)
