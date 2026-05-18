# Data Studio — Use Case Scenarios

> **Note:** This document describes scripted use case flows built during the prototype phase. The "6 situations" and "demo arc" framing is historical. Data Studio is now a full product — these scenarios remain valid as use cases but are not a complete or current picture of the product. For current product direction see `product.md`. For current build state see `CONTEXT.md`. "Project" in this document means "model."

---

## Demo script — Sara's story

**Character:** Sara, data analyst, marketing analytics team.  
**Scenario:** Campaign Performance Analysis — orders + campaigns + users in Snowflake.  
**Setup:** Sara's VP and senior marketing leaders have specific questions they want to answer via Spotter. They've given her a brief with use cases and sample questions.

---

### Situation 1 — Zero to one

**Screen:** Overview → "New project" → NewProjectPrompt

**Sara types:**
> "My VP of marketing wants to understand campaign performance. Key questions: What's our ROAS by campaign and channel? Which user segments convert best? How efficient is our budget across regions? I have order data, campaign data, and user data in Snowflake."

**Agent (5 working steps, ~25 seconds, stoppable by typing):**
1. Understanding your requirements
2. Finding tables in Snowflake
3. Identifying joins
4. Selecting columns
5. Building the model

**Agent response (auto-applied, no confirm needed):**
> I've built your campaign performance model.
>
> **Tables** — orders (150 rows), campaigns (45 rows), users (90 rows)
>
> **Joins** — orders → campaigns on `campaign_id` (LEFT JOIN · preserves organic orders with no campaign); orders → users on `user_id` (LEFT JOIN)
>
> **Columns** — 18 selected across 3 tables. Removed PII (name, email) and system fields.
>
> **Metrics** based on your goals:
> — Return on Spend = SUM(orders.amount) / NULLIF(SUM(campaigns.spend), 0)
> — Conversion Rate = COUNT(DISTINCT orders.user_id) / COUNT(DISTINCT users.user_id)
>
> ⚠️ `campaign_id` is null on 18% of orders — organic purchases with no campaign attribution. Included in total revenue via LEFT JOIN, excluded from Return on Spend.
>
> Would you like to modify anything, or are you ready to test?

**Canvas state:** Visualizer shows orders + campaigns + users with join lines. Left panel: Tables (3), Joins (2), Formulas (2). Revealed with fade-in after build completes.

**Sara clicks "Switch to test mode"**

**Wow moment:** Full model — tables, joins, columns, metrics — built from a plain-English brief in ~25 seconds. No form-filling, no step-by-step approvals, no confirm clicks. Sara never touched the canvas.

---

### Situation 2 — Test it

**Screen:** Workspace in test mode (Test button active in header). Agent panel shifts to test-mode prompt.

**Sara types:**
> "What's our ROAS by campaign for last quarter?"

**Agent response:**

| Campaign | Spend | Revenue | ROAS |
|----------|-------|---------|------|
| Summer Sale | $12,400 | $48,200 | 3.9× |
| Brand Awareness | $8,100 | $18,300 | 2.3× |
| Retargeting | $5,600 | $31,400 | 5.6× |
| (unattributed) | — | $22,100 | — |

> **Answer confidence**
> 🟡 **Data quality** — `campaign_id` is null on 18% of orders. $22,100 revenue (15% of total) has no campaign attribution. ROAS figures may be understated for all campaigns.
> 🟢 **Context** — All columns used have sufficient descriptions. No approximations made.
> 🟢 **Structure** — No join traps detected. LEFT JOIN is correct for this aggregation.
>
> *Inspect this answer ↓*

**Sara clicks Inspect:**
- Columns used: campaign_name, spend, amount, campaign_id
- Join path: orders LEFT JOIN campaigns on campaign_id
- SQL visible
- Data quality flag expanded: "27 of 150 orders have null campaign_id. These are organic purchases — expected, not a bug. ROAS is calculated on attributed orders only."

**Sara types:**
> "Which segments convert best?"

**Agent response:**

| Segment | Users | Orders | Conversion |
|---------|-------|--------|------------|
| Enterprise | 210 | 89 | 42% |
| Mid-market | 180 | 61 | 34% |
| SMB | 290 | 74 | 26% |
| (unclassified) | 140 | — | — |

> **Answer confidence**
> 🟡 **Context** — `users.segment` has no description. I interpreted it as customer tier based on the values. Verify this is correct.
> 🟡 **Data quality** — `segment` is null for 15% of users (140 rows). Conversion for this group is unknown.
> 🟢 **Structure** — No join traps detected.

**Wow moment:** Sara can see *why* the answer might be wrong — not just that it is. Two issues identified: one data quality (null campaign_id), one context gap (segment has no description). She has a diagnosis, not just a symptom.

---

### Situation 3 — Teach and fix

**Screen:** Workspace, continuing from test mode. Sara switches back to build/coach mode.

**Sara types:**
> "Generate descriptions for all columns that are missing context"

**Agent (working steps):**
- Scanning 26 columns across orders, campaigns, users…
- Found 18 columns with no descriptions
- Generating descriptions based on names, types, and your use case…
- Applying…

**Agent response:**
> I've drafted and applied descriptions for 18 columns. A few examples:
>
> - `orders.region` → "Geographic region where the order was placed (North, South, East, West, APAC)"
> - `campaigns.channel` → "Marketing channel (paid_search, social, email, display)"
> - `users.segment` → "Customer tier based on purchase behavior: enterprise, mid-market, SMB, individual"
>
> Since this project is in draft, I applied these directly — no approval needed. You can edit any description inline by clicking it, or just tell me what to change.
>
> **What this fixes:** Spotter will now correctly interpret segment, channel, and region. Previously it was approximating from column names alone. Want me to also check for synonym gaps?

**Sara:** "Yes — and add 'revenue' as a synonym for order amount"

**Agent:** "Done. I found 3 more synonym opportunities: `spend` → 'investment', `conversion_rate` → 'conversion', `lifetime_value` → 'LTV'. Added all of them including yours. `orders.amount` now responds to 'revenue', 'order value', and 'sales'."

**Wow moment:** One instruction fixes 18 columns. The agent doesn't just do what Sara asked — it scans the whole class of issues and fixes them all. Sara didn't have to find each gap manually.

---

### Situation 4 — Expand the model

**Screen:** Overview → Sara clicks "Marketing Campaign Attribution" (published, 1,839 conversations) → Workspace opens

**Context:** Three weeks after publish. Marketing team wants product-level breakdowns.

**Sara types:**
> "I want to add product category performance — the team wants to know which product lines drive the most revenue per campaign"

**Agent (working steps):**
- Checking current model for product data…
- Found `orders.product_category` — already included in your model
- Drafting a new metric…

**Agent response:**
> `product_category` is already in your model — no new table needed.
>
> I've added one metric based on your request:
> - **Revenue by product** = SUM(orders.amount) grouped by product_category
>
> Your team can now ask "What's revenue by product category and campaign?" and get a clean answer. Ready to republish?

**Sara:** "Republish"

**Agent:** "Published. Changes are live. Your team's next Spotter query will use the updated model."

**Wow moment:** Expanding the model takes one message. No data team meeting, no engineering ticket. Sara does it herself in under a minute.

---

### Situation 5 — Cache it

**Screen:** Workspace → Settings → Cache tab (or agent surfaces it proactively)

**Agent (proactive suggestion in workspace):**
> This project had 1,839 Spotter conversations last month. Every query is hitting Snowflake live. Enabling daily caching would serve all queries from a pre-built cache — estimated to save ~$340/month in compute costs and reduce query time from ~3s to ~200ms.

**Sara:** "Enable it, daily at 2am"

**Agent:** "Caching enabled. Data will refresh every day at 2:00 AM. First run is scheduled for tonight. Once the cache is warm, Spotter queries on this project will be near-instant."

**Cache panel shows:** schedule (daily · 2:00 AM), next run (tonight 2:00 AM), estimated savings ($340/mo), last run status (pending first run).

**Wow moment:** Cost control built into the same workspace where Sara builds the model. Not a separate admin panel. Not an engineering request. One toggle.

---

### Situation 6 — Monitor and fix

**Screen:** Overview — alert card visible

**Alert card:** Schema change · campaigns table · critical · 2 hours ago · "budget_currency column added"

**Sara clicks the alert → Workspace opens, campaigns table highlighted in left panel and visualizer**

**Agent:**
> **What changed:** Snowflake added `budget_currency` to the campaigns table. It wasn't there when you built this model.
>
> **What's affected:** Your ROAS metric divides `orders.amount` (USD) by `campaigns.spend`. But `spend` for international campaigns may now be in non-USD currencies, making ROAS inaccurate for those rows.
>
> **Proposed fix:** Mark campaigns where `budget_currency ≠ 'USD'` as currency-unverified. Spotter will show a ⚠️ on ROAS for those campaigns until you add a proper conversion.
>
> Apply this fix?

**Sara:** "Yes, apply it"

**Agent:** "Done. 4 international campaigns are now flagged. ROAS for those campaigns will show a currency warning in Spotter. I've also added a note to the model context so your team knows why."

**Wow moment:** The alert surfaces proactively. Sara doesn't discover the problem from a confused user — Data Studio finds it first, explains it, and offers a fix. One click to apply. No engineering escalation.

---

## Screens implied by this script

These views need to exist or be built:

| Screen | Exists? | Notes |
|--------|---------|-------|
| Overview with alert cards | Built | Alert cards need to be clickable with routing |
| NewProjectPrompt | Built | Working |
| Workspace — build mode | Built | Visualizer, left panel, agent panel working |
| Workspace — test mode | Not built | Agent panel shifts to test mode; answer + confidence diagnostic |
| Answer confidence panel | Not built | 3-dimension inline diagnostic per answer |
| Inspect answer panel | Not built | Columns used, join path, SQL, expanded issue detail |
| Coaching in draft (no approval) | Partial | Approval flow exists; needs draft-mode bypass |
| Cache settings panel | Not built | Schedule, next run, savings estimate |
| Alert → workspace routing | Not built | Click alert → workspace pre-navigated to affected node |

---

## Open Questions

Design questions to resolve before or during build. Mark resolved when decided.

- [x] **Proposal card placement** — resolved
  Proposals live in the agent panel as chat messages. Canvas is read-only output of confirmed actions.

- [x] **Left panel tree scope** — resolved
  Project tables only (not the full warehouse). Left panel answers "what's in my model." The warehouse browser (DataBrowserModal) stays as a secondary modal for adding new tables.

- [x] **Where do joins go in the left panel tree?** — resolved
  Flat "Joins" section, not nested under tables.

- [x] **Where do cross-table formulas go in the left panel?** — resolved
  Flat "Formulas" section.

- [x] **One-shot build vs step-by-step** — resolved (2026-04-20)
  One-shot: agent executes all 5 steps (~25s), auto-applies state, shows summary. No confirmation needed. Sara can stop mid-build by typing.

- [x] **Test mode layout** — resolved (2026-04-20)
  Conversational. Agent panel shifts to question-answering mode. Canvas stays as-is (visualizer/preview/notebook remain). No separate test surface.

- [ ] **View vs edit mode** — deferred until post-publish
  Relevant once projects are published and shared. Not a question for the build arc.

- [ ] **Error/warning routing** — deferred to Situation 6
  How monitoring alerts route back into the workspace at the right node.

- [ ] **Validate with users** — after prototype is complete
  Does the one-shot build feel empowering or like too much at once?
