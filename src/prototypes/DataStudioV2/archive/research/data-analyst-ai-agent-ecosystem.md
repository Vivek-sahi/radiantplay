# Research: How Data Analysts Are Using AI Agents in 2025-2026

_Ecosystem research to inform monitoring POV for Data Studio. Focus: what workflows are being transformed, what's still broken, and what this means for how monitoring should be designed._

---

## The headline

80% of analytics professionals now use AI in their daily workflows (dbt Labs 2026 State of Analytics Engineering Report), up from 30% one year prior. But output is scaling faster than trust. Trust concerns rose from 66% to 83% year-over-year. Only 24% of teams prioritize AI-assisted testing and observability vs. 72% for AI-assisted coding.

**The structural problem: tools make it easy to generate data and hard to verify it.**

---

## What's actually working

### Coding agents (Claude Code, Cursor, Copilot) for data work

Tasks that have genuinely collapsed in time:

| Task | Before | After |
|---|---|---|
| dbt staging + intermediate models | Hours | Minutes — analyst reviews, not writes |
| dbt YAML docs + tests | Day of maintenance | Automated via dbt Copilot on every push |
| PR review (900–1,000 dbt PRs/quarter) | 1 FTE of reviewer time | 90% reduction (Zscaler multi-agent system) |
| Data profiling / schema exploration | 3–5 min per table | ~10 seconds |
| Python pipeline first draft | Half a day | 20–30 minutes |
| Full dbt project (staging → dim/fact → tests → docs → backfill) | Multi-day | One Claude Code session (documented March 2026) |
| Incident investigation | 15-hour average | Under 2 hours (Monte Carlo Troubleshooting Agent, 80%+ reduction) |

**Claude Code context:** Dominates practitioner community (226 mentions vs. competitors in one tracker). Strong at understanding dbt dialect nuances and multi-file project context. The CLAUDE.md convention — documenting conventions, schema info, business rules — has become a standard workflow pattern.

### MCP connections data teams are actually using

- **GitHub** — dbt PR review, automated PR comments, commit history
- **Slack** — incident notifications, morning metric summaries
- **Snowflake/BigQuery/DuckDB** — schema introspection, query execution, freshness checking
- **dbt Cloud** — job triggering, run retrieval, lineage access
- **Notion/Google Docs** — institutional knowledge retrieval
- **PostgreSQL/MySQL** — direct query via MCP

The Surfalytics "Claude Code 101 for Data Professionals" course now explicitly teaches connecting agents to PostgreSQL, GitHub, Sentry, Notion, and Slack as a baseline workflow — not an advanced technique.

---

## The documented failure modes

Monte Carlo's analysis is the most cited:

1. **No data health validation** — agents "will confidently query a table that hasn't been updated in two weeks without checking source data integrity."
2. **Incident blindness** — agents "will ignore an active incident and build a transformation on top of bad data."
3. **No downstream impact awareness** — agents "will push a schema change that silently breaks a dozen downstream dashboards."
4. **Hallucinated SQL** — produces "syntactically correct SQL with table names it hallucinated" when it has no database access.
5. **The confidence problem** — AI systems are 34% more likely to use phrases like "definitely" and "certainly" when generating *incorrect* information.
6. **Silent semantic errors** — "An agent can return a plausible, well-formed response that is completely wrong for the situation — with no error thrown, no alert fired, nothing in the logs." Uniquely dangerous in data work.
7. **Compounding errors** — 85% per-step accuracy on a 10-step workflow = ~20% end-to-end success rate.

---

## The emerging patterns

### 1. Agent as first responder for data incidents
Monte Carlo's Troubleshooting Agent: triggered when an alert fires, runs dozens of subagents in parallel testing hypotheses (bad source data, ETL failure, transformation error, model output issue), traverses lineage automatically, correlates with recent code changes. Result: 2-minute investigation vs. 15-hour average.

### 2. Agent as PR reviewer for dbt changes
Zscaler's PRISM: LangGraph multi-agent system (Linter, Governor, Impact Analyzer, Optimizer, Self-Healing). Reviews 956 PRs/quarter, 90% reduction in reviewer time, 2,100 engineering hours saved annually. Engineers approve via GitHub comment ("Accept"). This is the established pattern.

### 3. Agent as documentation writer
50% of analytics engineers use AI for documentation. dbt Copilot generates column descriptions automatically. Column-level lineage now auto-propagates descriptions downstream for passthrough/rename columns. Agent-generated doc = first draft; human review = quality gate.

### 4. Agent as self-service analytics layer
Snowflake Intelligence, Looker MCP, Databricks Genie: non-technical stakeholders ask in natural language, governed agent translates to SQL through the semantic layer. The semantic layer is the trust mechanism — constrains the agent to certified metrics.

### 5. Morning briefing agents
Agents query the data stack overnight, detect metric movements, deliver structured Slack summaries before stand-ups. "Flag anomalies, deliver morning briefs, and open small PRs" — dbt Labs describes this as standard governed agent behavior.

### 6. Context infrastructure as the core investment
OpenAI's internal data agent (3,500+ users, 600 petabytes, 70,000 datasets): achieved 5× accuracy improvement through context engineering, not model selection. Six context layers required: table usage patterns, human annotations, codex enrichment (pipeline code), institutional knowledge (Slack/Docs/Notion), memory systems, runtime context.

**Key finding:** "Context infrastructure maturity matters more than model selection. Most pilots fail because of insufficient context infrastructure, not model capability gaps." — a16z

### 7. Skills as disseminated expertise
dbt's agent skills format: structured markdown files encoding workflows of the best analytics engineers, consumable by any AI agent. 30+ agents now support the format. "The biggest wins came from encoding workflows, not facts." — Tristan Handy, dbt Labs CEO.

---

## Monitoring and observability tasks being handed to agents

**Monte Carlo Monitoring Agent:**
- Analyzes how fields are actually used across query logs
- Recommends monitoring rules and thresholds — one-button deployment
- 60% acceptance rate for recommendations
- 30%+ increase in monitoring deployment efficiency

**Elementary Data MCP Server:**
- Gap detection: agent scans project, finds assets missing freshness checks or schema tests, generates missing tests, inserts into project — from the IDE, without context switching
- Downstream impact: before a schema change deploys, agent surfaces all affected dashboards, metrics, and downstream models

**dbt Observability Agent (coming soon):**
- Monitors jobs, pinpoints likely root causes, proposes fixes
- Full context: lineage, test results, CI metrics via dbt MCP

**SYNQ MCP Server:**
- Root cause analysis by correlating Git commits with data incidents
- When connected to Slack and internal knowledge bases: "the vast majority of issues could be debugged this way"

---

## The trust architecture that's emerging

The pattern for making agent-generated analysis trustworthy to business users:

1. **Semantic layer as guardrail** — agents query the semantic layer rather than generating raw SQL. Eliminates the hallucinated-join class of errors. Reduces but doesn't eliminate error rate.
2. **Health gates before analysis** — before any query or transformation, check the health of underlying tables. "⚠️ There's an active freshness incident on `dim_accounts`. Numbers below should be treated as provisional." This signal should travel *with the data* into wherever it's being used — not just sit in a monitoring dashboard.
3. **Deterministic aggregation before prose** — Microsoft's Chief of Staff Executive Briefing Agent: deterministic SQL aggregation ensures numbers are correct before generating narrative explanation.
4. **MCP-only tool restriction** — Recce's finding: "Restricting agents to MCP-only tools removed a class of unpredictable behavior without limiting capability."

---

## Design implications for ThoughtSpot Data Studio monitoring

1. **Monitoring must expose signals via MCP.** The ecosystem is building agents that query monitoring infrastructure. A monitoring feature that surfaces freshness, test results, and known incidents as a health status per asset enables the data health gate pattern automatically — from Claude Code, Cursor, or dbt agents.

2. **Downstream impact analysis is the highest-value signal.** The #1 documented failure mode of current AI tools. A monitoring feature that shows "here are all downstream consumers of this model and the predicted impact of this change" addresses the most cited pain point.

3. **Trust signals must travel with the data.** Not just a monitoring dashboard — freshness, health status, and known issues should surface in the agent's response inline, wherever the data is being used.

4. **PR/change review integration is the near-term high-value opportunity.** Zscaler/Recce/dbt patterns are proven. Agents that review data model changes before they merge, with downstream impact, are producing the most dramatic time savings.

5. **Context infrastructure is the product.** Organizations getting the most from agents have annotated schemas, business glossaries, and documented institutional knowledge. A monitoring feature that helps build and maintain context — not just alerts on anomalies but surfaces the semantic meaning of what's monitored — is more valuable than threshold alerts alone.

---

## Sources
- 2026 State of Analytics Engineering Report — getdbt.com
- Agentic coding in analytics engineering — getdbt.com/blog
- How Zscaler cut PR review time by 90% — getdbt.com/blog
- Claude And Cursor Can't Do Data Right — montecarlodata.com
- Monte Carlo Observability Agents — montecarlodata.com
- Inside OpenAI's in-house data agent — openai.com
- Your Data Agents Need Context — a16z.com
- Elementary Data MCP Server — elementary-data.com
- SYNQ MCP for data quality — synq.io
- Introducing Looker MCP Server — cloud.google.com
- Snowflake-managed MCP server — docs.snowflake.com
- Designing Reliable AI Agents for dbt Data Reviews (Recce) — blog.reccehq.com
- A Dispatch from the Jagged Frontier — roundup.getdbt.com
- Agent Skills: Disseminating Expertise — Tristan Handy
- 2026 Data Engineering Trends — kestra.io
- ThoughtSpot Pushes Upstream With Agentic Data Preparation — hpcwire.com
