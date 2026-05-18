# Data Studio — Work Queue

_Active work items. Not a shared deliverable — used for session-to-session continuity._

---

## Active

### Fix all with agent + AIRS buttons

**What:** "Fix all with agent" DQ chip and AIRS "Generate →" / "Add →" buttons are currently unresponsive (visual only).

**Preferred approach (Option B):** Make "Fix all with agent" the single entry point for DQ fixes — clicking it sends a message to the agent triggering `review_data_quality`. Remove the suggestion chip approach. Mirror the same pattern for AIRS with a new `improve_ai_readiness` script.

**Why deferred:** Not blocking current work. The existing suggestion chip already triggers the DQ flow.

---

### Team review + iterate on feedback

Any visual or copy feedback from the team after reviewing the updated prototype.

---

## Done (recent)

- ✅ Documentation cleanup — product.md rewrite, CONTEXT.md stripped, SESSION_LOG.md established, NEXT_UP.md created (session 113)
- ✅ Rename Day Zero → fromScratch throughout codebase (session 112)
- ✅ Notebook view polish — instructions, add block button, run animation + version bump (session 111)
- ✅ Working steps fix — day_zero_parse_use_case (session 110)
- ✅ PlanPanel Preview/Code tabs (session 109)
- ✅ Blast radius flow for ins-d3; MultiModelDriftCard for ins-d3 multi-model (session 108)
- ✅ Wire onOpenObject on 4 remaining debug cards ins-d1/d2/d3/d6 (session 106)
- ✅ Artifact UI in Pulse debug flows review (session 105)
