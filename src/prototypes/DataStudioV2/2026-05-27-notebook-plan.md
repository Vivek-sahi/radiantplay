# The code environment — plan
_2026-05-27 · DataStudio V2_

* * *
## The right mental model
Every existing tool — Hex, Omni, Mode, dbt — was designed for users who are the **primary author**. The user writes SQL, the tool helps.

DataStudio is the opposite. The agent writes. The user observes and occasionally intervenes.

That changes the shape of the surface. It's not a notebook where the agent helps you. It's **the agent's work, made inspectable and editable.** Closer to a build log you can reach into than a code editor you occasionally hand to an AI.

The _look_ can stay familiar (cells, SQL, outputs). The framing shifts.

* * *
## Phases
### Phase 1 — The build log (this session)
Make the existing Notebook tab feel like a real surface. Every cell the agent created has a state, a result, and is inspectable.

**What's in:**

- Cell states: `idle → running → success / error`
  
- Output panel per cell: success shows row count + data preview; error shows error message
  
- Run all — standard; a notebook without it feels broken
  
- Run individual cell
  
- Edit any cell + re-run it
  
- Pre-failed cell: one cell the agent couldn't complete, user fixes it
  

**Cell states — visual treatment:**

| State | Left border | Header indicator | Output panel |
| --- | --- | --- | --- |
| `idle` | Accent color | —   | Hidden |
| `running` | Accent color | Spinner | Hidden |
| `success` | Green | Green check | Expanded: row count + data preview |
| `error` | Red | Red ✕ | Expanded: error message + "Edit and retry" |

**The scenario this enables:**  
Agent builds a model → one join cell fails (column mismatch) → user opens notebook, sees the failed cell, clicks "Edit and retry" → fixes the SQL → runs it → success output appears.

**Token cleanup:** replace hardcoded `#2770EF` and `#16a34a`.

* * *
### Phase 2 — Take control
The user doesn't wait for failure. They can reach into any cell, modify it, re-run it. Their changes are tracked — the cell is visually marked as "user-edited" vs "agent-authored."

- Edit affordance on every cell (not just failed ones)
  
- "User-edited" badge or visual diff to distinguish user changes from agent output
  
- Re-run updates the model output
  

* * *
### Phase 3 — Extend
The agent didn't go far enough. User adds their own steps.

- Add cell (SQL / Python / text) — already partially built
  
- New cells authored by the user are visually distinct from agent-authored cells
  
- Agent can be invoked from within the notebook ("add a cell that does X")
  

* * *
### Phase 4 — Lineage
The cells don't just run in sequence — they depend on each other. Make that visible.

- DAG view alongside (or instead of) the linear cell list
  
- Each node is a cell; edges show data flow
  
- Failing node highlights downstream dependents
  

* * *
### Phase 5 — Co-authoring
Agent and user work in the same surface at the same time.

- Agent can suggest a fix on a failed cell ("I think the issue is X — want me to try?")
  
- User can delegate a new cell to the agent mid-notebook
  
- The surface becomes a true back-and-forth, not agent-first or user-first
  

* * *
## Build order for Phase 1
1. Add `status` to `NbCellDef` — wire visual states to cell header and border
  
2. Add output panel component — success variant (row count + mini table) and error variant (message + CTA)
  
3. Wire run animation — `running` state on click, `setTimeout` → resolve to `success`
  
4. Wire Run all — runs all cells in sequence with staggered delays
  
5. Add pre-failed cell to `buildNotebookCells()` at `joined` buildStep — cell 4 (Join: orders × campaigns), column mismatch error
  
6. Wire "Edit and retry" CTA → opens cell for editing; on Run → resolves to `success`
  
7. Token cleanup
  

* * *
## Open questions
- **Output panel default state:** always expanded after run, or collapsed (click to expand)? Collapsed is cleaner at scale but expanded is more immediate. Suggestion: expand on first run, allow collapse after.
  
- **Nomenclature:** "Notebook" tab label — keep for now, revisit in Phase 2 when the framing is clearer.
