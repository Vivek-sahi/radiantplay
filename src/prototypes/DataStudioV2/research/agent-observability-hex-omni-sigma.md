# Research: Agent Observability — Hex Context Studio, Omni, Sigma

_Supplement to monitoring-competitive-landscape.md. Focused on how BI tools monitor AI agent quality and close the feedback loop to improve the semantic model._

---

## The question
How do Hex, Omni, and Sigma detect when their AI agent is answering questions poorly, surface the semantic gaps causing failures, and close the loop back to model improvement?

---

## 1. Hex — Context Studio

### What it is
Launched January 28, 2026. A "unified toolkit that brings agent observation, improvement, and deployment into one workflow." Available to Admins and Managers on Team/Enterprise plans.

### Observability layer

**The Observability Dashboard** — high-level view across all Hex AI surfaces (Threads, Notebook Agent, Modeling Agent, Published App Agent, Slack, MCP):
- Conversation volume over time
- Unique user counts
- Agent type + source breakdown (Hex UI / Slack / MCP / CLI)
- Workspace role breakdown
- **Topics:** AI-generated clusters of what business questions are being asked, with trend direction (growing, newly emerging)
- **Warnings:** counts by type
- Time range: 7 / 30 / 90 days

**The three warning types (auto-generated from conversation analysis):**
1. **Missing context** — agent lacked documented info about a metric, relationship, or business rule
2. **User doubt** — user expressed skepticism in the conversation ("are you sure about that?")
3. **Data limitation** — agent flagged a data quality caveat (incomplete coverage, gaps)

**Thread Inspector (per-conversation, Admin only):**
- Overview: who asked, when, question summary, agent response summary
- Timeline: step-by-step conversation with tool calls surfaced
- Warnings: specific moments where context was missing or user pushed back
- Which data sources were referenced

Sensitive mode: users can mark their thread private, hiding it from admins.

### How gaps are identified

The **Review Agent** runs continuously. It analyzes warning data and clusters it into prioritized groups — not a raw feed of problems but a ranked list of what to fix first, organized by topic, warning severity, and number of users affected.

**Context Suggestions (launched April 2026):** Automatically clusters warnings into suggestion groups presented as a feed. Each suggestion shows which questions triggered it and how many users were affected.

Suggested fix types:
- This topic needs a definition added to a workspace guide
- This instruction needs clarification in an existing guide
- This data source should be endorsed
- This semantic model field needs a better description or calculation

### How gaps are fixed (the improvement loop)

Three context types the agent draws from:
1. **Workspace Guides** — RAG-retrieved text files. Best for business process docs, terminology, context that only applies to certain question types.
2. **Semantic Models** — structured metric definitions with deterministic SQL. Define what "revenue" or "active user" means. Can sync from dbt MetricFlow, Cube, Snowflake Semantic Views, GitHub.
3. **Endorsements** — which tables/schemas/projects/models are trusted and should be prioritized.

**Context Workbench workflow:**
1. Review Agent flags a gap → specific suggestion generated
2. Edit the guide or semantic model in the Workbench
3. Click "Test and Publish" → diff view of every edit
4. Threads tab: type actual business questions, see how agent responds with the proposed change *before* it goes live
5. Publish → change goes live for all agents
6. Version history tracks every published version with rollback

**CLI + GitHub:** Suggestions accessible via Hex CLI. GitHub Action auto-syncs guide changes from a repo into the workspace with validation checks. Attribution logs track who changed what.

### Key differentiator
Context Studio is the only tool researched with a complete **observe → diagnose → fix → test → deploy** loop. The system is designed to get smarter the more it's used: usage → warnings → Review Agent suggestions → Context Workbench → test → publish → fewer warnings → loop.

---

## 2. Omni Analytics — AI/Agent Monitoring

### Architecture context
Omni's AI queries exclusively through its semantic model — no bypass. The AI ("Blobby") plans actions, selects tools, executes queries, evaluates results, and iterates — all through the same governed layer powering dashboards.

### Observability

**AI Dashboard (admin-only):** Logs of AI interactions — prompts, responses, linked sessions. More a searchable log than an aggregated trends dashboard.

**Token Tracking Dashboard:** Tracks LLM token consumption across features, users, and groups. One user prompt can fire many sequential tool calls (data model search, query generation, visualization, summarization). Blank prompts in the log = internal agent reasoning steps. So the token dashboard is also a window into query complexity — you can see that one question triggered 8 tool calls, which implies semantic model incompleteness.

**AI Activity section in Workbook Inspector (April 2026):** Shows info about active AI sessions inline in the workbook view.

### How gaps are identified

**Thumbs up/down on every AI response.** Omni explicitly tells data teams: "Make it clear to stakeholders that a 👎 is the fastest way to contribute to context improvement."

**Learn from Conversation:** When users make corrections mid-conversation ("revenue should exclude returns"), the system captures these and automatically suggests context additions to the semantic model. Gaps are discovered by business users in natural conversation and bubble up to the data team for review. This is a bottom-up improvement mechanism.

### How gaps are fixed

Manual AI context additions at three levels:
- **Model level** — global rules applied to every query
- **Topic level** — domain-specific guidance for a curated dataset slice
- **View and field level** — synonyms, usage notes, sample values, example queries, behavioral rules ("always group by week not day")

Native Modeling Agent or IDE plugins (Claude, Cursor) for at-scale context generation.

**AI Session History (Sept 2025):** Persistent, shareable session URLs — users can return to or share previous analyses.

### What Omni lacks
No equivalent to Hex's warning taxonomy, no AI-generated topic clustering across conversations, no Review Agent generating prioritized suggestions, no test-before-publish workflow for context changes. Improvement loop is present but reactive and manual — requires human initiation at each step.

---

## 3. Sigma — Ask Sigma Usage Dashboard

### What Ask Sigma is
Natural language query interface ("agentic AI analyst"). Multi-turn conversation. Auto-selects best data source based on semantic relevance + historical usage frequency. "Analysis breakdown" shows step-by-step decision logic. Works against warehouse tables, Snowflake Semantic Views, dbt models, Sigma data models.

### Usage dashboard — architecture

**Key design choice: warehouse-native storage.** All Ask Sigma query logs are written to the customer's own warehouse (Snowflake / Databricks / BigQuery). Sigma never stores or has access to this data. Access controlled through warehouse roles — only authorized admins can read.

Setup: admin configures a dedicated schema → Sigma gets write access → every Ask Sigma query logged → Sigma generates a view over this → pre-built dashboard workbook connects to this view.

Refresh: near-real-time as queries occur.

### What the usage dashboard shows
- Top users and teams by query volume
- Full question text (queryable, sortable)
- Most-used data sources
- Emerging trends in question topics
- Token consumption (primary cost driver)
- Query volume patterns across functions and business lines

**Intended use cases:**
1. Spot champions — identify power users as internal advocates
2. Guide adoption — find where training/documentation gaps exist
3. Improve data assets — look at questions returning poor answers to identify where better metric definitions or semantic layer coverage is needed

**Sigma Agents (Dec 2025):** Separate from Ask Sigma. Scheduled/triggered data workflows. Every agent-initiated action logged to warehouse. Includes inline response feedback + Q&A audit log written to warehouse.

### What Sigma lacks
No automatic quality signal detection (no warning taxonomy), no surface for questions the agent failed to answer, no improvement suggestions for the data model, no test-before-publish workflow. The data is there but deriving "this question was answered poorly because X is missing from the semantic model" requires a human analyst to inspect the logs manually.

---

## Comparison: The Four Core Questions

| Question | Hex | Omni | Sigma |
|---|---|---|---|
| **How do you know when the agent answers poorly?** | Auto-generated warnings: missing context, user doubt, data limitation. Inferred from agent behavior + user text. | Thumbs down + high tool-call count as implicit signal. Requires user action. | No automatic quality signal. Must inspect logs manually. |
| **How do you identify semantic gaps?** | Review Agent clusters warnings into gap categories + specific suggestions. Automated. | "Learn from Conversation" captures mid-chat corrections. Manual inspection of AI logs. | Human reviews full question text in usage dashboard. No automated gap detection. |
| **How do you improve the agent?** | Context Workbench + test-before-publish + version control + attribution. Full workflow. | Manual context additions at model/topic/field level + Learn from Conversation promotions. | Manually improve data model in standard semantic layer tools. No AI-specific workflow. |
| **What does the feedback loop look like?** | Fully closed: Usage → Warnings → Review Agent → Suggestions → Workbench → Test → Publish → loop | Semi-closed: Usage → thumbs down or correction → suggestion → human promotes to model | Open: Usage logs in warehouse → human inspection → manual model improvement |

---

## Key design implications for Data Studio

1. **Automatic quality signal generation is the differentiator.** Hex doesn't wait for users to say "that was wrong" — it infers quality from agent uncertainty and user pushback. This means you get quality signals from users who never bother to rate. For ThoughtSpot: Spotter expressing uncertainty, users reformulating questions, users abandoning a thread mid-way — all are quality signals even without explicit thumbs down.

2. **Closing the loop is what separates a dashboard from a workflow tool.** Sigma and Omni both show you data. Hex generates a specific fix, lets you test it, and deploys with version control. For ThoughtSpot: the monitoring surface should not just show "Spotter failed this question type 47 times this week" — it should suggest the specific semantic model field or definition that needs to change, and let the analyst validate the fix before it goes live.

3. **Warehouse-native sovereignty (Sigma) is architecturally important for enterprise.** ThoughtSpot's enterprise customers likely have the same data residency concerns. Writing AI interaction logs to the customer's own warehouse rather than a vendor-managed store is a credible enterprise design.

4. **The AI improvement loop is a monitoring capability for the builder persona.** This isn't consumer-facing monitoring — it's the builder seeing "here's where Spotter is failing your users, here's why, here's how to fix it." That fits directly into the 5-theme framework (AI answer improvement as the #3 priority).

---

## Sources
- Introducing Context Studio — hex.tech/blog/introducing-context-studio/
- Context Studio Documentation — learn.hex.tech/docs/agent-management/context-studio
- Agent Observability — learn.hex.tech/docs/agent-management/observability
- Context Suggestions (Apr 2026) — learn.hex.tech/changelog/2026-04-23
- Hex Fall 2025 Launch — hex.tech/blog/fall-2025-launch/
- Omni Usage Analytics — docs.omni.co/administration/analytics
- Omni Token Tracking — docs.omni.co/administration/token-tracking
- Tuning for Smarter AI in Omni — omni.co/blog/tuning-for-smarter-ai-in-omni
- Building Omni's Agentic Architecture — omni.co/blog/building-omnis-architecture-for-agentic-analytics
- Ask Sigma Usage Dashboard — sigmacomputing.com/blog/introducing-warehouse-ai-models-usage-dashboard-for-ask-sigma
- Configure Ask Sigma Usage Dashboard — help.sigmacomputing.com/docs/configure-a-usage-dashboard-for-ask-sigma
