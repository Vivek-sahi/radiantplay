# DataStudio — Design Patterns & Anti-patterns

_What works, what doesn't, and why. Every entry here came from a real attempt. Update as decisions are made or reversed._

---

## Anti-patterns — tried and walked back

### ❌ Left-nav with Data / Context / Prep / Cache as sections
**What it was:** Data, Context, Prep, and Cache as top-level left-nav items in the workspace — each a distinct area to work through.
**Why it felt wrong:** It implied a linear "do all four" mandatory flow. Users don't need all four every time. Some just want to model. Some start with prep. The nav made every capability feel required and sequential.
**The principle it violated:** DataStudio's capabilities are orthogonal, not a pipeline. Prep is optional. Caching is optional. Testing is optional. The UI can't imply otherwise.

---

### ❌ Testing as a separate view / mode
**What it was:** Testing happened in a distinct view — you'd switch to "test mode" to ask questions and see diagnostics.
**Why it felt wrong:** Testing happens as you build. You might want to tweak AI context and immediately test whether Spotter's answer improved. Switching views breaks that loop.
**The principle it violated:** Build and test are concurrent, not sequential. The workspace should support both happening at the same time.

---

### ❌ Persona-based tabs at equal weight (Column properties / Code / Data preview / Lineage)
**What it was:** Four tabs at the top of the center panel, each serving a different user type — visual builder, code writer, data previewer, lineage checker.
**Why it felt wrong:** The tabs implied equal importance. But column properties IS the model — it's the primary view. Code, data preview, and lineage are secondary views that you open when you need them, not things you switch between as a workflow.
**The principle it violated:** Primary and secondary views have different visual weight. Secondary views should be on-demand (panels, drawers, overlays) not equal-weight tabs competing for attention.
**The correction:** Column properties as the always-visible primary view. Code, data preview, and lineage as on-demand secondary views — available but not always present.

---

### ❌ Step-by-step agentic flow with frequent confirmation
**What it was:** Agent gives tables → user confirms → agent proposes joins → user confirms → agent builds → user confirms. Each step gated on user approval.
**Why it felt wrong:** Too much waiting, too little trust. Users were not meaningfully reviewing at each step — they were just clicking through. The confirmation steps created friction without adding value.
**Reference:** Reviewed how Cursor and Claude Code handle this. Three patterns exist:
1. Step-by-step with confirmation — poor UX
2. Plan mode (show plan, user reviews, then execute) — too much to read, low follow-through
3. One-shot build, user modifies after — right for DataStudio
**The principle it violated:** Agentic means trusting the agent. One good result to react to beats five small decisions to approve.

---

## Confirmed patterns — what works

### ✅ One-shot build
Agent reads the brief, builds the full model in one pass, shows it. User reacts — modifies, ditches, or keeps. No confirmation gates during the build.
**Why it works:** Matches how Cursor/Claude Code work. Puts the cognitive load on review, not approval. Faster to get to a real artifact.

### ✅ Agent on the right, column properties as the primary canvas
Large column properties view for the model. Agent panel on the right side (consistent with ThoughtSpot's pattern in other products). This is the spatial layout that feels right.
**Why it works:** Column properties IS the model — it deserves the most space. The agent is a collaborator, not the primary interface.

### ✅ Agent panel: right-side, resizable
Not fixed width. User can expand or collapse it. Default is right side — consistent with ThoughtSpot's existing agent panel pattern across products.

### ✅ Free-form commands + column references by clicking
After the zero-shot build, users can type free-form instructions OR click on a column to reference it in the agent panel. `@mention` for data objects (tables, columns).
**Why it works:** Meets users at different interaction styles — some will type, some will point and click. The column reference pattern makes it spatial, not just conversational.

### ✅ Secondary views on demand
Code view, data preview, lineage — available when needed, not always visible. Open on demand, close when done.
**Why it works:** Reduces visual noise. The model is the primary object. Secondary views are diagnostic tools.

---

## Competitive intelligence

### Sigma
Losing deals to Sigma. Their insight: **don't ask users to learn a new paradigm — meet them where they already work.** Sigma built a spreadsheet-like interface that data teams and business teams both recognize. They also have strong dbt integration. They're not inventing new UX — they're translating familiar patterns into a more powerful tool.
**What DataStudio can learn:** The zero-shot build and agent-first approach IS asking users to work differently. That's a risk. The payoff has to be undeniable. The AHA moment needs to be so fast and so clearly better that the unfamiliar interaction style doesn't matter.

### Omni
Also losing deals. Less is known about their specific UX advantages.

### Hex
Good inspiration but wrong model for DataStudio. Hex is notebook-based, focused on data science and exploration. DataStudio is a semantic model workspace — structured, outcome-focused (publish to Spotter), not exploratory.
**What DataStudio can learn from Hex:** The notebook's strength is that every step is visible and auditable. DataStudio's agent panel creates a similar audit trail of what the agent did — that's worth preserving and making legible.

### dbt Cloud, Monte Carlo
Technical users do well in these tools. They're optimized for SQL-native, pipeline-aware workflows. DataStudio is more accessible — the agent abstracts away the SQL. But the trust these tools have built (dbt in particular) is worth understanding. dbt users trust the tool because it's the source of truth. DataStudio should feel equally trustworthy for the BI layer.

---

## Open design questions — not yet decided

These are the decisions the DataStudio design is actively trying to close. When a task touches one of these, flag it and don't silently make the call.

| Question | Status | Notes |
|---|---|---|
| Does testing happen in a parallel panel within the workspace, or still in a separate mode? | In progress | Currently building parallel test capability |
| Post-publish: how does monitoring work? What errors surface, how are they debugged, can the user retry? | Not designed | Situation 6 covers alert → workspace, but the monitoring surface itself is open |
| Connections: how does the user connect to Snowflake? What schema/database filtering is available to avoid table pollution? | Open | Auth flow, schema picker, exclusion rules not designed |
| Does prep happen before or after caching? | Trying to close | Core architectural question: do transforms apply to live data, cached data, or both? |
| Where does caching live? Workspace only, or also accessible from model view without opening the workspace? | Open | Related to whether all actions require opening the full workspace |
| Workspace canvas layout: this is the first visual exploration question | In progress | User is exploring in Playground.tsx right now |

---

## The workspace canvas exploration (in progress)

The central visual design question right now is: **what does the workspace feel like to use?**

Three experience questions being explored in Playground.tsx:

1. **Zero-shot build → free-form commands → column references by clicking → @mention**
   What does this interaction sequence feel like spatially? How does the column reference work visually — does clicking a column add it to the prompt, highlight it, open a detail panel?

2. **On-demand secondary views**
   Data preview, code view, lineage — how do they appear when called? Slide in from the bottom? Replace the center panel? Open as a floating panel?

3. **Prep in the workspace**
   When the user invokes prep, what does the experience look like? Does the agent panel drive it? Does a separate panel appear? How does the user see and manage transforms?

These three together define the spatial grammar of the workspace. Resolve these before building new workspace features.
