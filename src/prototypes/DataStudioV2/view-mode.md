# Model View Mode — Exploration

_Active design exploration. Not resolved. Updated as we learn._

---

## The problem

When a user clicks on a published model, what do they see?

The current tab view (Info / Cache / Monitoring) has three problems:
- Monitoring is buried on the third tab — the most important signal is least visible
- The view is visually disconnected from the workspace used to build the model
- No agent is accessible — to fix anything you have to leave the view entirely

The core question: **do we even need a separate view mode, or can the workspace itself serve as the view?**

---

## What brings users into a model (manual triggers)

These are non-alert, user-initiated triggers — the user comes in knowing something needs attention:

1. **Stakeholder feedback** — "Spotter keeps giving wrong revenue numbers" — someone tagged you
2. **Noticed during use** — you tested Spotter yourself and it can't answer "revenue by region"; you know the region column is missing a description
3. **Requirements changed** — finance redefined gross margin for Q2; the formula needs updating
4. **Phrasing mismatch** — column descriptions read like SQL comments; Spotter is misinterpreting them
5. **Scope expansion** — marketing wants to add campaign data to a model that only covers sales

All five mean the user arrives knowing roughly what to fix — which argues for fast navigation to the right thing, not a broad health overview.

---

## Research: how other platforms handle editing AI-generated artifacts

Researched: OpenAI Canvas, Cursor, Hex, dbt Copilot, Databricks Genie, Lovable, Replit, v0, Notion AI, GitHub Copilot Workspace.

**Three patterns converged:**

1. **Dual-mode is the default.** Every mature platform offers both direct inline editing and conversational re-editing. Users self-select based on scope. Platforms that started chat-only (Replit, v0, early Lovable) have all added direct edit surfaces.

2. **Diff-and-accept for AI-proposed changes.** The agent never silently overwrites. It proposes, shows a diff, user accepts or rejects per chunk. Critical for live models.

3. **Selection-triggered edits (the inpainting pattern).** Select a specific thing — a column description, a formula — and the agent works only on that. Not the whole model. This is the most ergonomic post-creation editing primitive across all platforms.

For a data model specifically: Hex and dbt Copilot are the closest references. The model is the artifact, individual fields are the chunks. Each chunk can be directly edited or have a scoped agent prompt applied to it.

---

## Three options explored

**Option 1 — Workspace always open (agent + artifact)**
- Agent left panel (collapsible), artifact canvas right
- No separate view mode — model always editable
- Problem: no monitoring signal; heavy UI for casual viewers

**Option 2 — View mode with "Edit with Agent" expansion**
- Artifact tabs (columns, joins, preview, notebook) are the default view
- Agent slides in when you click "Edit with Agent"
- Problem: monitoring still missing; requires a mode switch to edit

**Option 3 — Purpose-built viewer (current tabs)**
- Info / Cache / Monitoring tabs
- Problem: visually disconnected from the build experience; no editing path

**Where we are:** Options 1 and 2 both lack monitoring. Option 3 is too disconnected from the build experience. None of the three are complete answers.

---

## Direction emerging: Answer Health

Instead of separate monitoring, AI readiness, and data quality tabs, collapse everything into one signal: **how good are the answers from this model?**

All the sub-signals (sync health, AIRS score, data quality, semantic gaps) ultimately affect answer quality. A sync failure affects answer quality. A missing description affects answer quality. They're the same question expressed differently.

If Answer Health is a persistent signal on the artifact — not a tab — then monitoring doesn't need its own surface. You drill in when something is flagged. The agent helps you understand and fix the specific gap.

**This also resolves the tabs question.** If health is embedded in the artifact as a signal, and the artifact is the primary surface, you may not need tabs at all. One surface, health and content together.

---

## What's been built for comparison

- **Marketing Campaign Attribution** → opens in current tab view (Info / Cache / Monitoring)
- **Sales Performance** → opens directly in workspace view (agent collapsed by default, artifact fills screen)

To compare: open both models in separate browser tabs and evaluate which feels more natural as a landing experience.

---

## Open questions

- Does the workspace (even with agent collapsed) feel right as a "view" for a published model?
- What does Answer Health actually show — a score, a status, a count of gaps?
- When you tap into Answer Health, what do you see?
- Is the audience always the builder + their team, or do we need to account for read-only consumers?
- Does the artifact need to be explicitly read-only before you choose to edit, or is always-editable fine?
- Where do cache settings and sync schedule live if tabs go away?
