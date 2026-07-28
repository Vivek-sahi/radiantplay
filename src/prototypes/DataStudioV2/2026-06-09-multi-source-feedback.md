# Multi-source flow — feedback review
_19 issues · 2026-06-09 · Sources: user walkthrough + DE perspective (Netflix/Meta lens)_

* * *
## How to read this
Each issue has a **criticality** rating:

| Rating | Meaning |
| --- | --- |
| P0  | Demo-critical or trust-breaking — fix before next show |
| P1  | High — significant gap, build soon |
| P2  | Medium — noticeable but workable, schedule for later |
| P3  | Polish |

Issues are grouped by theme.

* * *
## Theme 1 — Visibility & preview
### Issue 1 · Table preview before adding · P1
**What:** When the env scan surfaces `DIM_ACCOUNTS · ANALYTICS_DB · 12k rows`, there's no way to preview the table. User asks: how does a user preview before committing to add it?

**Proposed fix:** Make the table name a clickable chip. Clicking opens a preview panel (reuse `MultiSourcePreviewPanel`) showing: schema (column name + type), 10 sample rows, metadata (owner, source, last updated, row count). Panel slides in from the right, doesn't interrupt the flow.

* * *
### Issue 2 · Data preview at the NPS column confirmation step · P1
**What:** At "I'm predicting the NPS text column is `nps_comments` — is that right?", the user has no idea what's actually been pulled in. They're confirming a column name they can't see.

**Proposed fix:** Expand this message to show a small inline data preview — 5 sample rows of the Pendo pull, highlighting the `nps_comments` column. "Here's a sample of what I pulled — does this look right?"

* * *
### Issue 3 · Staging table is a black box · P0
**What (DE):** "Staging table compiled" with no visibility into what happened. A data engineer won't accept opaque transformations touching production-adjacent data. This is a trust-breaking moment.

**Proposed fix:** The "Staging table compiled" agent step should be expandable. Clicking it reveals the generated DDL/SQL — the actual `CREATE TABLE` or `INSERT INTO` statement. Add a "Copy SQL" button and a "Open in notebook" link. This is the agent showing its work.

* * *
### Issue 4 · Warning icon on the CSV chip is unexplained · P2
**What:** The `⚠ CSV · subscription_pricing_discrepancies...csv` chip has a warning triangle that nobody explained. It's confusing — does it mean upload failed? Is the file invalid?

**Proposed fix:** Either (a) replace with a pending/processing icon until the file is validated, then switch to a check — so the icon has a clear lifecycle. Or (b) add a tooltip: "File received — validation pending." The ⚠ implies error, which isn't the intent.

* * *
### Issue 5 · Table trust signals missing from scan · P2
**What (DE):** Table cards in the env scan show name + row count, nothing else. A DE needs: who owns this table, when was it last updated, is it raw/curated/mart, what's the SLA. Without this I won't build on a table — it could be deprecated or unowned.

**Proposed fix:** Extend each table card in the scan result to show: owner (team or person), last_updated, a layer badge (Raw / Curated / Mart). Row count is already there. This is metadata ThoughtSpot already has — the agent should surface it.

* * *

* * *
## Theme 2 — User control vs. agent control
### Issue 6 · Flow is hardcoded — whatever the user types triggers Pendo next · P0
**What:** After "What other data do you want to bring in?", regardless of what the user types, the flow advances to the Pendo/NPS notebook step. If a demo viewer types something off-script, the response will be wrong.

**Proposed fix (short-term):** Not necessarily a code fix — but critical to communicate in a demo script. Add a visible hint in the flow (or a small dev-mode overlay) showing what the next scripted step is. Long-term: detect intent from the user's message so at least common variations route correctly.

* * *
### Issue 7 · Agent loads and caches the CSV without user confirmation · P1
**What:** "CSM mapping loaded and cached" happens as a done fact. The user never triggered this — the agent just did it. For a DE, this is the agent touching data without permission.

**Proposed fix:** Before loading, the agent should show a confirmation step: "Ready to stage this file into your Snowflake instance. Confirm?" with a Confirm / Cancel. The action becomes user-initiated, not agent-initiated.

* * *
### Issue 8 · Agent demands the CSV rather than waiting for the user · P2
**What:** "Now I need the CSM mapping file you mentioned. Please upload it." — the agent is commanding. The user never said "ask me for the CSV now." It feels like the agent is running the conversation.

**Proposed fix:** Flip it: "Let me know when you're ready to add the CSM mapping file." User-initiated upload. The drop zone appears when they say "I want to add the CSV now" — not when the agent decides it's time.

* * *
### Issue 9 · Pendo connection: agent assumed API without asking · P1
**What:** The agent jumps to "Configuring Pendo API endpoint" without the user specifying how they connect to Pendo. When did the user say API? They might have a Fivetran connector already.

**Proposed fix:** Before the notebook step, agent asks: "How do you connect to Pendo today? [Existing Fivetran/Airbyte connector] [Direct API] [Manual export]" — three paths, each different. This is also where you surface the managed connector as the preferred option (see Issue 12).

* * *

* * *
## Theme 3 — Security & governance
### Issue 10 · API key pasted inline in chat · P0
**What (DE):** The inline API key input is a security anti-pattern. At any serious company, raw credentials don't get pasted into a chat interface. This actively signals to a DE audience that the product wasn't designed for enterprise.

**Proposed fix:** Primary path: "Use existing Pendo credentials from your org's secret store" — a single button that resolves the credential without the user seeing it. Secondary path (fallback): "Enter manually" — which opens a masked input with a note: "This will be stored in your org's credential vault." The key is never visible in the chat thread.

* * *
### Issue 11 · No governance warning before cross-source join · P2
**What (DE):** Joining Pendo behavioral data with `DIM_ACCOUNTS` (customer PII) is a data privacy decision. At Meta or Netflix, this join requires explicit authorization under data minimization policies. The agent just does it silently.

**Proposed fix:** One-time inline warning before the join proceeds: "This model joins behavioral data (Pendo NPS) with customer records (DIM_ACCOUNTS). Confirm this is permitted under your org's data governance policy." [Confirm] [Learn more]. Simple friction, big trust signal.

* * *

* * *
## Theme 4 — Wrong defaults
### Issue 12 · Managed connector should be the default for Pendo, not a custom notebook · P1
**What (DE):** Custom Python notebooks for API ingestion are fragile, unmaintained, and an engineering smell. Any enterprise running Pendo almost certainly has a Fivetran or Airbyte connector. Using a notebook as the primary path sends the wrong message about how the product thinks about data engineering.

**Proposed fix:** Detect known SaaS sources (Pendo, Salesforce, Mixpanel, etc.) and check if a managed connector exists in the org. Primary path = managed connector. The custom notebook is the "advanced / I don't have a connector" fallback — not the default.

* * *
### Issue 13 · Context panel labels Snowflake tables as "created" · P2
**What:** The context panel groups `DIM_ACCOUNTS` and other existing Snowflake tables under a heading that implies they were created in this session. They weren't — they're references to existing tables.

**Proposed fix:** Split the context panel into two sections: "Source tables" (Snowflake references, shown with a database icon) and "Created this session" (notebook, staging table, CSV dataset). Different visual treatment — source tables are more muted, created artifacts are more prominent.

* * *
### Issue 14 · Notebook can't be opened from the context panel or agent steps · P1
**What:** "Creating Python notebook container" appears in the agent steps, and the notebook shows up in the context panel — but clicking either does nothing interactive. For a flow where the notebook is a key artifact, this is a dead end.

**Proposed fix:** Clicking the notebook in the context panel (or in the agent step) should open it — either expanding it inline in the chat, or switching the right panel to a notebook view. The notebook cells from session 117 are already built — it just needs to be wired to a click.

* * *

* * *
## Theme 5 — Post-build hygiene
### Issue 15 · No refresh schedule before publish · P1
**What (DE):** After "Build the model," the agent publishes to ThoughtSpot with no discussion of when the model refreshes. Pendo API and CSV are not self-updating. This means the model is effectively a one-time snapshot — but the UI implies it's live.

**Proposed fix:** Add a step between "Build the model" and "Published to ThoughtSpot": "How often should this model refresh? [Hourly] [Daily at 6am] [Weekly] [Manual only]" — picking one configures the schedule. This is also a natural moment to show the Pendo connector vs. notebook distinction (connectors auto-schedule, notebooks need a cron job).

* * *
### Issue 16 · CSV treated as a stable source — operational implications ignored · P2
**What (DE):** The CSV is treated identically to a warehouse table in the model. But a CSV has no refresh mechanism — someone has to re-upload it. Who? When? What happens when it goes stale? The agent never asks.

**Proposed fix:** After CSV upload, agent asks: "Is this a one-time enrichment or will this file be updated regularly?" If one-time: no change. If recurring: "Who owns re-uploading it? I'll add a staleness alert to the model so ThoughtSpot flags when the file is more than X days old."

* * *
### Issue 17 · No validation gate before BI publish · P1
**What (DE):** The model goes straight from "staging table compiled" to "published in ThoughtSpot." At Netflix, nothing goes to BI without passing: row count check, null % on join keys, referential integrity across all sources. Skipping this is a data quality incident waiting to happen.

**Proposed fix:** Add a validation summary step before publish: a small table showing row counts per source, null % on the join key (`account_id` or equivalent), and a sample join result (5 rows). If everything looks clean: "All checks passed — publish?" If something's off: "Join key has 12% nulls — review before publishing?"

* * *
### Issue 18 · No impact analysis before publish · P2
**What (DE):** Before this model goes live in ThoughtSpot, has anyone checked if it overlaps with existing models? If there's already a `customer_health` model referencing `DIM_ACCOUNTS`, this new model might define conflicting metrics. Metric sprawl is a real problem at scale.

**Proposed fix:** Before final publish, agent runs a quick check: "2 existing models in ThoughtSpot reference DIM_ACCOUNTS — no metric conflicts found. Ready to publish?" Or if there's a conflict: "Found a potential overlap with `customer_health_v2` which also defines an NPS score column. Review before publishing?"

* * *

* * *
## Theme 6 — Polish
### Issue 19 · Notebook icon in context panel should be the Python notebook icon · P3
**What:** The notebook item in the context panel uses the generic notebook icon. Since this is explicitly a Python notebook, it should use the Python/Jupyter notebook icon from Radiant.

**Proposed fix:** Swap the icon on the notebook context panel item to use the Python notebook icon from the Radiant icon set.

* * *

_End of review doc. Add CriticMarkup feedback inline — comments, edits, priorities._
