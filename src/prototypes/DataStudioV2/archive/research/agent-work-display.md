# Agent Work Display — Research & Decision

**Date:** 2026-04-22  
**Status: DECIDED — C-iii built. All open questions resolved.**  
**Context:** Deciding how the Data Studio agent panel shows its work during modeling workflows

---

## What we researched

How do leading AI tools display agent reasoning and work steps to users?

| Product | Pattern | Audience |
|---------|---------|---------|
| **Claude Code** | Inline tool-call cards (`Bash(...)`, `Read(...)`) stream as they fire. Approval gates before destructive actions. | Developers |
| **Cursor** | Tool-call blocks in chat thread + file pills. Plan Mode shows multi-step plan before execution. Compact mode collapses noise. | Developers |
| **Lovable** | Task list + live preview iframe. Steps in plain language. Prompt queue for async. No plan-first — see it live. | Non-technical builders |
| **Hex Threads** | Steps stream + auto-collapse when done. Dual audience: SQL for data team, explanations for business users. Final result card. | Data teams + biz users |
| **Databricks Genie** | Plain-language thinking steps inline. "Research plan" framing for long tasks. Sidebar for hypothesis details. | Business users + analysts |
| **Snowflake Cortex Analyst** | SQL always surfaced. Expandable tool call sections. Verified Query Repository for trust flywheel. | Analysts / developers |

---

## Key design tensions

**Transparency vs. noise**  
Analysts need to trust the model they're building — that means seeing the SQL. But a wall of queries is cognitively overwhelming. Solution: plain-language primary, SQL accessible on demand.

**Fixed pipeline vs. open-ended**  
The 1-shot build has a known sequence (understand → find tables → join → select → profile). But coaching, formula creation, and other workflows are open-ended and more like a coding agent conversation. The display pattern needs to work for both — no rigid step list.

**Plan-first vs. see-it-live**  
We explicitly decided against showing a plan and asking for confirmation before running. Seeing it live is easier to review than reading a plan. This rules out Cursor's Plan Mode as a default pattern (though it may apply for high-stakes moments like publish).

**Approval gates**  
For 1-shot build: no approval gates. For publish and cache: explicit confirm. For coaching: one-shot apply, no approval. This aligns with Lovable's pattern over Claude Code's approval-gate model.

---

## What we explored (Section 8, playground.html)

Three animated explorations, same workflow (1-shot build), varying SQL treatment:

**C-i — No SQL**  
Title (what) + description (how). Purest conversational form. Works for stakeholders who don't verify queries. Too opaque for the primary analyst audience.

**C-ii — SQL inline**  
SQL block appears as each step runs. Maximum transparency. Can get noisy for steps with long queries. Scroll-heavy.

**C-iii — SQL on demand**  
Title + description + "View SQL" toggle per step. Clean by default, verifiable when needed. This is the Hex Threads + Cortex Analyst pattern: plain language is the headline, SQL is the receipt.

All three: steps appear dynamically (not pre-listed), avatar animates while working (pulsing orb + rotating sparkle, like Claude Code), steps collapse to "Show work" toggle when done, final outcome card appears (model name + chips: tables / joins / columns / issues + CTAs).

---

## Decision: C-iii as the direction

**Why C-iii:**
- Matches the analyst audience — they can trust the narrative and verify when needed
- Dual-audience by default (Hex Threads pattern): product managers see the story, data engineers see the SQL
- Dynamic steps work for both known pipelines (1-shot build) and open-ended workflows (coaching, formulas)
- The collapse → "Show work" → outcome card pattern gives every workflow a clean ending with a scannable summary

**What to take from other patterns:**
- The animated avatar (Claude Code) builds presence and communicates "I'm actively working"
- The outcome card (Hex Threads) gives a fast-scan summary that's more useful than re-reading the steps
- "View SQL" toggle (Cortex Analyst) is the right affordance — not hidden, not always-on

**What we're not doing:**
- No fixed step list shown upfront (rules out Hex Threads' always-visible pending steps)
- No plan-first approval (rules out Cursor Plan Mode for default flows)
- No tool-call jargon like `find_tables(...)` (rules out Cursor/Claude Code raw tool names for this audience)

---

## Resolved questions

**Coaching and formula workflows:** Same title+description step structure as the 1-shot build — fewer steps, but the same ladder format. Not a flat chat conversation. Confirmed by session 44 implementation.

**Agent assumptions mid-build:** Inline in the description of the relevant step. No separate line.

**"Show work" expand state:** All SQL toggles default to collapsed when expanded. The reasoning/step descriptions are the primary content. SQL is secondary — Sara clicks into whichever step she wants to verify specifically.

---

## Reference

- Playground: `src/prototypes/DataStudio/playground.html` Section 8
- Agent patterns table: `CONTEXT.md` → "Agent patterns (decided 2026-04-20)"
