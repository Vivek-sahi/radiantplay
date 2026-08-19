# Cleanup checklist — Demo cut
_2026-07-31, from a pass over the spreadsheet tab, data preview, data browser, agent empty state, overview page, publish modal, agentic import and code blocks._

Tick what you want. My recommendation is in the **Do?** column — everything marked **yes** is something I'd do before this goes in front of stakeholders.

* * *
## Do first
| ☐   | Item | Do? | Effort | Why |
| --- | --- | --- | --- | --- |
| ☐   | **Publish + deploy** | **yes** | 5 min | The Demo cut and 21 earlier commits are local only; the shared link still shows a pre-demo build. Also gives a fallback if anything below breaks. |
## Bugs — things that are wrong, not just unpolished
| ☐   | Item | Do? | Effort | Why |
| --- | --- | --- | --- | --- |
| ☐   | **"Morning, Sara" → Maya** in the canvas agent welcome | **yes** | 1 min | Overview says Maya; the script is Maya Chen. Missed when the Overview greeting was fixed. |
| ☐   | **Demo lands on the canvas, not Workspace** (`index.tsx:188`) | **yes** | 5 min | POC lands on the canvas after the agent builds a model; Vision lands on the old Workspace notebook. Demo inherits Vision, so it currently ends up on the older surface. |
| ☐   | **Publish modal rows derived from state** | **yes** | ~30 min | Today all three are hardcoded: _Source: Snowflake_ (the model spans four sources by S18 — undercuts the whole story at the closing beat), _Cache: Yes · weekly refresh_ (contradicts the Daily default and the agent's own "refreshing daily"), _Status: Spotter ready_ (shown even if readiness never ran). |
| ☐   | **Drop the dead "Table info" button** in the data browser | **yes** | 5 min | Every table row shows it on hover; it has no handler and never did. Flagged in the 07-28 review. |
## Demo polish
| ☐ | Item | Do? | Effort | Why |
|---|---|---|---|---|
| ☐ | **Empty-state chips** — replace the off-story ones | **yes** | 10 min | First screen a stakeholder sees offers *"Fetch dim_accounts, support_cases and call_metrics"*, which isn't in the renewal-risk story. Not replaced with the script's opening line — S2 has Maya typing that. |
| ☐ | **Hide the inert spreadsheet toolbar buttons in Demo** | **yes** | ~45 min | 11 controls, 5 work. Undo, Redo, Sort range, Format paint, Align, Wrap, Currency, Percent and both decimal buttons do nothing — and Align/Wrap show dropdown carets that never open, so they invite the click. |
| ☐ | **Delete the orphaned `SpreadsheetIcons.tsx`** | **yes** | 2 min | 12 exported Figma icons + a map, imported by nothing. The toolbar was rebuilt with inline SVGs, so these are dead. (Alternative: wire them for pixel accuracy — ~1 h, and it doesn't make any button work.) |
| ☐ | **`acct_st` column on `accounts`** | **your call** | 15 min | S16's *Say* lane commits the presenter to saying the column name out loud. It doesn't exist — we surface `arr`/`acv` instead, so the narration won't match the screen at the differentiator beat. Either add the column or reword the script. |
| ☐ | **"N cols" vs "N rows"** in adjacent pane headers | defer | 2 min | Different units side by side. Cosmetic. |
## Decisions, not tasks
| ☐   | Item | Do? | Why |
| --- | --- | --- | --- |
| ☐   | **Agentic Tier-1 components: wire or delete** | **delete, after the demo** | `ToolcallCard`, `PlanStepsCard`, `ReasoningBlock`, `NextActionChips`, `TypingIndicator` were imported as "the actual import" and are rendered nowhere — our own steps renderer, chips and typing indicator superseded them. Wiring them now would churn the exact path being demoed. |
| ☐   | **Per-step code storage** | defer | One shared `pythonConfig`/`sqlConfig` serves every code block. Switching cards reloads from the saved step, so an edit you typed but never ran is silently discarded. Right architecture, wrong week. |
| ☐   | **AI readiness** | **held** | Komal's merge. Chip stays; the click-through behaviour arrives with her work. |
## Already done — no action
- Data tab is already labelled **Spreadsheet** in the view switcher (old NEXT_UP item).
  
- Data preview: row count, "Not run yet", `table · step` header, Limit, Data/Semantic — all working.
  
- Code blocks: Python and SQL are always editors, Run keeps you in the code, Fix-with-AI review works.
  
- Overview: greeting is Maya; setup chips hidden in Demo. Its redesign is deliberately deferred into Demo.
