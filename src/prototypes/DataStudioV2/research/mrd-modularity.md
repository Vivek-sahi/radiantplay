# MRD Modularity — Section Logic, Prompt Taxonomy, and Use-Case Matrix

**Date:** 2026-05-28  
**Status:** Reference design — governs how the MRD card renders across all Option 6 sessions  
**Scope:** DraftPlanCardMRD component, both directions (Intent + Echo), all prompt types

---

## 1. The modularity principle

The MRD is not a fixed form. It is a rendering of the AI's understanding of a prompt, shaped for two simultaneous audiences:

- **The user** — needs to validate scope, understand what the model will answer, and confirm ambiguous decisions before building starts
- **The AI building the model** — needs precise instructions, guardrails, and disambiguated definitions to build correctly

Every section in the MRD serves one or both audiences. Whether a section appears — and what it contains — is entirely driven by what the AI inferred from the prompt. No section should ever be hardcoded to a domain. Every section is conditional on signals from the plan.

**The system goal:** A user who types a vague prompt sees more structure (the AI surfaces its inferences for validation). A user who types a precise prompt sees less (the AI confirms it understood, then gets out of the way).

### When the MRD appears — hard scope rules

**The MRD appears exactly once: when a brand new model is being created from scratch.**

It does not appear for:
- Adding a column, metric, or dimension to an existing model
- Changing a join, data type, or filter on an existing model
- Renaming or reorganising an existing model
- Any edit, patch, or modification flow — regardless of how large the change is

The MRD is a creation contract, not a change log. Once a model exists and the user hits "Build model", the MRD is frozen. It becomes a read-only reference (the collapsible anchor card) — the record of what was intended when the model was first built. It is never regenerated or updated to reflect subsequent changes.

**Implication for edit flows:** When a user asks the agent to modify an existing model, there is no MRD step. The agent responds directly with a proposal or a plan, executes it, and shows the result. The creation MRD is still visible as context (collapsed), but it is not reopened or added to.

**Why this matters for modularity:** Because the MRD only appears at creation time, every section it contains must be computable from the user's prompt alone — with no knowledge of what changes may come later. Sections that would require knowing the model's edit history, current state, or previous versions do not belong in the MRD.

---

## 2. Full section inventory

### Always-present sections

| Section | Audience | Purpose | What drives content |
|---|---|---|---|
| **Goal** | User | Restates intent in clear language | `plan.goal` — AI rewrites the user's prompt as a single declarative statement |
| **Key metrics** | Both | What this model measures | `plan.columns` filtered to `type === 'metric' \| 'formula'` |
| **Dimensions & filters** | Both | What the user can slice by | `plan.columns` filtered to `type === 'dimension'`, excluding raw IDs and date fields |
| **Guardrails** | AI | What the AI must never do wrong | AI-generated from business context — scope rules, status filters, attribution logic |
| **AI instructions** | AI | How to interpret ambiguous questions | AI-generated vocabulary definitions, default behaviors, phrasing rules |

### Conditionally-present sections

| Section | Appears when | What drives the condition |
|---|---|---|
| **Confirm these** | `plan.confirmItems.length > 0` | AI confidence below threshold on specific decisions (see §5) |
| **Questions this model will answer** | Always in Intent direction | `plan.sampleQuestions` — AI generates 3–6 sample questions from any prompt |
| **Time handling** | `hasTimeDimension === true` | Any column ending in `_date`, `_at`, `_time`, or containing `date`/`time`/`period` |
| **Limitations** | `plan.limitations.length > 0` | AI detects known constraints: incomplete history, missing source, platform limits |
| **Linked concepts** (Echo) | Always in Echo's "What I understood" | `plan.tables` — the logical entities the AI inferred |
| **What I added** (Echo) | Always in Echo direction | Contains guardrails + AI instructions + time handling + limitations |
| **Formula definitions** | When computed metrics exist | Any `plan.columns` with `type === 'formula'` and a `formula` expression |

### Future sections (not yet built, defined here for completeness)

| Section | Appears when | Purpose |
|---|---|---|
| **Alternative interpretations** | AI confidence < 0.4 on model shape | "I could also have built this as X — here's why I chose Y" |
| **Data quality preview** | AI detects likely quality issues from domain context | Known nulls, sparse joins, time gaps common in this domain |
| **Related models** | Similar models exist in the workspace | "You already have a campaign model — this one extends it" |
| **Assumptions log** | Always, collapsed | Full enumeration of every decision the AI made, with confidence score |
| **Scope boundary** | When use case has common exclusions | What's explicitly NOT in this model and why |

---

## 3. Prompt taxonomy — five classification axes

Every prompt can be classified on five axes. Together, they determine which sections appear and how much content the AI surfaces.

### Axis 1 — Specificity

How much did the user tell the AI?

| Level | Description | Example prompt | AI inference load |
|---|---|---|---|
| **S1 — Fully specified** | Entities, metrics, and dimensions all named | "Build a model on orders, campaigns, and users with ROAS and conversion rate, breakable by channel, region, and user segment" | Low — AI mostly validates |
| **S2 — Domain + metric** | Domain is clear, key metric named, entities implied | "I need a campaign performance model with ROAS" | Medium — AI infers entities and supporting metrics |
| **S3 — Domain only** | Domain is clear, metrics implied by domain | "I need campaign analytics" | High — AI infers entities, metrics, and dimensions |
| **S4 — Outcome only** | Business question stated, no domain specified | "I need to understand why revenue dropped last quarter" | Very high — AI must infer domain, entities, metrics, and relevant dimensions |
| **S5 — Vague** | Intent unclear, domain ambiguous | "I need a sales model" | Extremely high — AI must ask clarifying questions or surface all assumptions |

**Section implication by specificity:**
- S1 → `confirm_these` rarely appears; `what_i_understood` in Echo is brief
- S2–S3 → `confirm_these` likely for 1–3 items; Echo's "What I understood" is substantive
- S4–S5 → `confirm_these` highly likely for 3+ items; Echo is most valuable direction; AI should flag low confidence explicitly

---

### Axis 2 — Analytical pattern

What type of analysis is being requested?

| Pattern | Core question | Key sections that become relevant |
|---|---|---|
| **Attribution** | What caused this outcome? | `time_handling` (attribution window), `confirm_these` (model: first-touch vs last-touch vs multi-touch), `guardrails` (null handling), `limitations` (attribution gaps) |
| **Trend / time-series** | How is X changing over time? | `time_handling` always (period definition, granularity), `dimensions` (time grain as dimension) |
| **Segmentation** | How does X differ across groups? | `dimensions` (segment definitions), `guardrails` (segment membership rules), `confirm_these` (segment boundary definitions) |
| **Funnel analysis** | Where are users dropping off? | `confirm_these` (funnel stage definitions, what counts as a conversion), `guardrails` (deduplication rule), `time_handling` (conversion window) |
| **KPI monitoring** | Are we hitting targets? | `key_metrics` (target vs actual), `time_handling` (reporting period), `guardrails` (what counts as "achieved") |
| **Cohort analysis** | How do groups behave over time? | `time_handling` (cohort anchor date), `confirm_these` (cohort definition), `guardrails` (cohort assignment rule) |
| **Anomaly / diagnostic** | Why is X different? | `confirm_these` (what "normal" means), `limitations` (data freshness may affect anomaly detection) |
| **Forecasting** | What will happen? | `limitations` (model type, accuracy bounds), `time_handling` (forecast horizon), `guardrails` (exclusions from training data) |
| **Inventory / snapshot** | What is the current state? | `time_handling` does NOT appear (point-in-time, no trend needed) |
| **Master data / reference** | What exists? | Minimal sections — no time, no metrics, mostly dimensions |

---

### Axis 3 — Domain / industry

| Domain | Typical entities | Key metrics | Common `confirm_these` triggers | Domain-specific guardrails |
|---|---|---|---|---|
| **Marketing** | campaigns, orders/conversions, users/leads | ROAS, CAC, LTV, CTR, conversion rate, CPC | Attribution model (first/last/multi-touch), null campaign = organic vs excluded, revenue gross vs net, "last month" definition | Only completed conversions, exclude test campaigns, organic is a valid bucket |
| **Sales** | opportunities, accounts, reps, products | ARR, pipeline value, win rate, ASP, sales cycle length, quota attainment | Booking vs billing vs recognized revenue, open vs closed pipeline, territory rules, multi-product deal counting | Exclude internal accounts, use booking date not close date for period attribution |
| **Finance** | transactions, cost centers, accounts, budget | Revenue, COGS, gross margin, EBITDA, budget variance, burn rate | Gross vs net revenue, fiscal vs calendar year, intercompany elimination, currency normalization | Exclude eliminated entities, use approved exchange rates, accrual basis not cash |
| **HR / People** | employees, departments, positions, events | Headcount, attrition rate, time to hire, eNPS, span of control | Active employee definition (includes/excludes leave), voluntary vs all attrition, headcount point-in-time vs period average | Exclude contractors unless specified, anonymize below group size n, use HR system as source of truth |
| **Product** | users, events, features, sessions | DAU/WAU/MAU, retention (D7/D30/D90), engagement rate, feature adoption, NPS | Active user definition (any event vs core action), session definition, retention window, deduplication of events | Exclude internal/test users, use deduplicated user IDs, filter to production environment |
| **Customer Success** | accounts, health scores, tickets, renewals | NRR, GRR, churn rate, health score, time to resolution, expansion ARR | Churn definition (non-renewal vs contraction vs both), health score component weights, NRR formula (include/exclude new logo) | Use contracted ARR not billed, exclude accounts in legal dispute |
| **E-commerce** | orders, products, sessions, returns | GMV, AOV, conversion rate, cart abandonment, return rate | GMV definition (gross vs net of returns, taxes), active product definition, session deduplication | Exclude cancelled orders, use shipped date not order date for revenue recognition |
| **Operations / Supply chain** | shipments, inventory, facilities, SLAs | On-time delivery, fill rate, inventory turns, defect rate, SLA compliance | SLA breach definition (committed vs estimated date), defect categorization, inventory valuation method | Use confirmed ship date, exclude force majeure events from SLA calculation |
| **Healthcare** (if applicable) | patients, encounters, providers, diagnoses | Readmission rate, LOS, cost per episode, outcome scores | Patient = unique individual vs unique encounter, readmission window (30 vs 90 days), anonymization level | HIPAA compliance required — all PII must be masked, minimum cell size for reporting |

---

### Axis 4 — Data complexity

| Level | Description | Sections affected |
|---|---|---|
| **Single entity** | 1 table, no joins | `linked_concepts` in Echo shows 1 concept; no join semantics in `confirm_these` |
| **Two-entity join** | 2 tables, 1 join | `confirm_these` may flag join semantic (what does a null foreign key mean) |
| **Multi-entity (3+)** | 3+ tables, multiple joins | `confirm_these` likely for join order and null handling; `guardrails` more complex |
| **With computed metrics** | Derived formulas | `key_metrics` shows formula definitions; `confirm_these` high likelihood for formula computation choice |
| **Cross-source** | Multiple connections | `limitations` (data freshness may differ across sources); `guardrails` (source-of-truth rules) |
| **Time-partitioned** | Large tables with date partitions | `time_handling` becomes critical for query performance, not just analysis |

---

### Axis 5 — User intent type

The MRD only appears for creation flows. The valid intent types within that constraint are:

| Intent | Description | Section implications |
|---|---|---|
| **Build new** | No prior model exists for this use case | Full MRD most valuable; `confirm_these` important; Echo direction most reassuring for first-time users |
| **Recreate / migrate** | "Same as what we have in Tableau/Looker" | `goal` restates the migration intent; `confirm_these` surfaces the top 3 decisions that commonly differ between the old tool and ThoughtSpot; `limitations` notes known capability gaps |
| **First model in a new domain** | Team has never modelled this business area before | All sections are more important than usual — user has less prior knowledge to validate against; `confirm_these` should lean toward medium-confidence items, not just low |
| **Duplicate with variation** | "Same model as Campaign Performance but for Product" | `goal` describes the new scope; `confirm_these` surfaces what was inherited vs changed; AI should note what it copied from the source model |

**Not valid MRD triggers — these are edit flows, handled separately:**
- "Add a column for return rate to my existing model"
- "Change the ROAS formula to use net revenue"
- "Remove the region dimension"
- "Add users as a new table"
- Any modification to a model that already has `buildStep !== 'empty'`

### Axis 6 — Input mode

A sixth axis that cuts across all others: how did the user specify what they want?

| Mode | Description | Example | Effect on MRD |
|---|---|---|---|
| **Intent-only** | Business goal stated, no data sources named | "I need campaign ROI analysis" | AI infers all entities and data sources; entities in MRD are logical concepts |
| **Intent + entities** | Business goal + logical entity names | "I need campaign ROI using orders, campaigns, and users" | AI uses entity names to anchor its inference; lower ambiguity |
| **Table-explicit** | Specific table names given, goal may or may not be stated | "Use orders, campaigns, and users to create a model" | See §9 — Table-explicit prompts; entities are treated as data anchors, not logical concepts |
| **Table-explicit, no goal** | Only table names given, no business context | "Use table_1, table_5, and table_6 to create a model" | Highest AI inference burden; see §9 — opaque table names sub-case |
| **Metric-first** | A specific metric or question is the entry point | "I need to track ROAS by channel" | AI works backward from the metric to infer entities; `confirm_these` surfaces the entity assumptions |

---

## 4. Section trigger rules — complete specification

### `confirm_these` — the full trigger catalog

Items appear in `confirm_these` when the AI made a judgment call that could plausibly have gone a different way, and where the wrong choice would meaningfully affect the model's accuracy or usefulness.

**Category 1: Formula computation method**

Trigger when: A computed metric has two or more valid computation approaches.

| Trigger condition | Example item |
|---|---|
| Ratio metric (÷) where denominator has zero risk | `[metric_name] uses NULLIF to handle zero denominator — divide-by-zero returns null, not infinity` |
| Computed at query time vs pre-aggregated | `[metric_name] computed at query time (not pre-aggregated) — changes with every filter applied` |
| Gross vs net | `Revenue = gross order value — returns and cancellations excluded separately, not netted` |
| Average vs sum ambiguity | `[metric_name] uses SUM across rows — not average per entity` |
| Weighted vs unweighted average | `[metric_name] is a simple average — not weighted by volume or size` |

---

**Category 2: Attribution and classification rules**

Trigger when: A null, missing, or ambiguous value has a business meaning that could be interpreted multiple ways.

| Trigger condition | Example item |
|---|---|
| Null foreign key has meaningful classification | `Unattributed [entity] (no [parent] linked) = [classification] — preserved as its own bucket, never excluded` |
| First-touch vs last-touch vs multi-touch | `Attribution model = last-touch — the final campaign before conversion gets 100% credit` |
| Direct vs assisted conversion | `Direct traffic treated as organic — not attributed to any paid campaign` |
| Self-service vs sales-assisted | `[outcome] flagged as self-service when [rep field] is null — not excluded from totals` |
| Internal vs external classification | `Accounts with [flag] excluded — treated as internal test, not customer revenue` |

---

**Category 3: Temporal anchors and period definitions**

Trigger when: The user used a relative time term that has multiple valid interpretations, or when fiscal and calendar year may differ.

| Trigger condition | Example item |
|---|---|
| "Last month" ambiguity | `"Last month" = most recent complete calendar month — not rolling 30 days` |
| "This quarter" ambiguity | `"This quarter" = current fiscal quarter starting [month] — not calendar Q` |
| Year-over-year granularity | `YoY comparison uses same calendar week — not same period within quarter` |
| Fiscal vs calendar year | `Fiscal year starts [month] — "annual" metrics use fiscal, not January-December` |
| Conversion window | `Attribution window = [N] days from first touch — impressions outside this window are excluded` |
| Cohort anchor | `Cohort = signup month — not first purchase month` |
| Retention window | `D30 retention = user active within days 25–35 — not strictly on day 30` |

---

**Category 4: Scope and inclusion/exclusion rules**

Trigger when: The AI inferred a scope boundary that the user did not explicitly state, and the boundary meaningfully affects metric values.

| Trigger condition | Example item |
|---|---|
| Status filter applied | `Only [status = completed/active/approved] included — [excluded statuses] are filtered out` |
| Active vs all entity definition | `"Active [entity]" = [activity criterion in last N days] — inactive [entities] excluded unless specified` |
| Minimum size threshold | `Accounts with [metric] < [threshold] excluded — below reporting floor` |
| Test data exclusion | `[Flag = test/internal] accounts excluded from all metrics` |
| Date range boundary | `Historical data before [date] excluded — [reason: incomplete tracking, migration date, etc.]` |
| Geographic scope | `Analysis scoped to [region] — other regions not in this model` |

---

**Category 5: Entity and metric disambiguation**

Trigger when: A term used by the user maps to multiple possible sources, and the AI had to choose one.

| Trigger condition | Example item |
|---|---|
| "Revenue" maps to multiple tables | `Revenue = [table.column] — not [alternative table/column]` |
| "Users" ambiguous (registered vs paying vs active) | `"Users" = [definition] — [alternatives] not included` |
| Duplicate data sources | `Using [source A] as source of truth — [source B] exists but may differ` |
| Multiple valid join paths | `[Entity A] joined to [Entity B] via [key] — alternative join via [other key] not used` |
| Currency ambiguity | `All monetary values in USD — local currency not converted` |
| Deduplication rule | `[Event] counted once per [entity] per [period] — not once per session` |

---

**Category 6: Business logic inferences**

Trigger when: The AI applied domain-specific business logic that is common but not universal.

| Trigger condition | Example item |
|---|---|
| Churn definition (subscription) | `Churn = non-renewal at contract end date — mid-term cancellations counted separately` |
| Headcount definition | `Headcount = active employees on last day of period — contractors excluded` |
| SLA definition | `SLA breach = missed committed date — estimated date not used` |
| Health score weighting | `Health score weights: [component] [%], [component] [%] — equally weighted by default` |

---

### `time_handling` — trigger logic

```
appears when:
  any(plan.columns where name.endsWith('_date') 
    OR name.endsWith('_at')
    OR name.endsWith('_time')  
    OR name.includes('date')
    OR name.includes('period')
    OR name.includes('month')
    OR name.includes('quarter')
    OR name.includes('year')
  )
  
  OR prompt contains: "last", "this", "previous", "YoY", "MoM", "QoQ", 
    "trending", "over time", "by month", "by quarter", "daily", "weekly"
```

Content always covers:
1. Rolling window definitions (30/60/90 day)
2. Period anchoring ("last month" = ?)
3. Comparison period logic (YoY, MoM)
4. Time zone handling (if global data detected)
5. Any date columns used as range anchors vs grouping dimensions

---

### `limitations` — trigger logic

Limitations appear when the AI detects constraints that will affect what Spotter can answer correctly. Content is always specific — never generic disclaimers.

| Trigger | Example limitation |
|---|---|
| Platform gap (NLQ limitation) | `Spotter cannot self-join this model — recursive hierarchies (e.g., manager-to-employee) not supported` |
| Incomplete historical data | `[Table] data before [date] is incomplete — [reason]. Trend analysis before this date unreliable.` |
| Missing source integration | `[Event type] data not yet ingested — [channel/platform/system] excluded from this model` |
| Low-cardinality dimension | `[Dimension] has fewer than [N] distinct values — may limit filtering granularity` |
| Join sparsity | `[Junction table] is sparse — many [entity A] have no corresponding [entity B]` |
| Data freshness lag | `[Table] syncs every [N hours/days] — real-time analysis not possible` |
| Sampling | `[Table] is sampled at [%] — counts and rates are estimates, not exact` |
| PII restrictions | `[Columns] contain PII — masked in this model. Raw values accessible via [process].` |

---

## 5. Direction-specific rendering rules

### Direction 1 — Intent

**Philosophy:** User reads the MRD from the perspective of "does this model answer my questions?" The goal comes first, confirmations are surfaced immediately, questions validate scope, spec is available but tucked away.

**Section order:**
```
1. Goal paragraph                         — always
2. Confirm these                          — conditional (plan.confirmItems.length > 0)
3. Questions this model will answer       — always
4. Full specification [toggle]
   ├── Key metrics                        — always
   ├── Dimensions & filters               — always
   ├── Time handling                      — conditional (hasTimeDimension)
   ├── Guardrails                         — always
   ├── AI instructions                    — always
   └── Limitations                        — conditional (limitations.length > 0)
5. Build model [CTA]
```

**When this direction works best:**
- User is reviewing scope ("is this what I asked for?")
- Use case is well-understood and the questions section acts as a quick validator
- User is an analyst who wants to verify the spec
- Prompt was specific (S1–S2)
- The model has clean, well-defined metrics

**When this direction is weaker:**
- Vague prompt (S4–S5) — the goal restatement may hide how much inference the AI did
- First-time user who doesn't know what questions a data model should answer

---

### Direction 2 — Echo

**Philosophy:** User reads the MRD from the perspective of "did the AI understand me?" The conversation between user and AI is made explicit — what was asked, what was understood, where the AI deviated, what it added.

**Section order:**
```
1. What you asked for                     — always (plan.goal)
2. What I understood                      — always
   ├── Linked concepts [N]: A → B → C     — always
   ├── Key metrics (first 3)              — always
   └── Dimensions (first 3)              — always
3. Confirm these                          — conditional (plan.confirmItems.length > 0)
4. What I added [toggle]                  — always
   ├── Guardrails                         — always
   ├── AI instructions                    — always
   ├── Time handling                      — conditional (hasTimeDimension)
   └── Limitations                        — conditional (limitations.length > 0)
5. Build model [CTA]
```

**When this direction works best:**
- Vague or outcome-only prompt (S3–S5) — the gap between "what you asked" and "what I understood" is large and valuable to show
- First-time user — they see exactly how the AI parsed their request
- Novel use case — unfamiliar domain where the user may not know what they need
- When `confirm_these` has items — the "understood → confirm → added" flow feels natural
- Business user reviewing an analyst-built prompt

**When this direction is weaker:**
- Fully specified prompt (S1) — the "What I understood" section adds little value when everything was explicit
- User who just wants to get to the questions, not re-read their prompt

---

## 6. Use-case section matrix

For each combination of domain + analytical pattern, which sections are active and what's in `confirm_these`.

### Marketing

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| Campaign ROI / ROAS | ✅ (attribution window, period) | Formula computation (gross vs net revenue), attribution model (last-touch default), null campaign = organic | Impressions from ad platform may lag 24–48h |
| CAC / LTV analysis | ✅ (acquisition cohort, LTV window) | LTV horizon (12/24/36 months), CAC formula (include/exclude headcount), payback period definition | LTV projection requires historical data ≥ 2× the horizon |
| Email performance | ✅ (send date, open window) | Open rate methodology (pixel vs click proxy), unique vs total opens, unsubscribe included/excluded | Bot clicks inflate open rates — filter rule may be imperfect |
| Paid search / PPC | ✅ (impression window) | Click attribution (same session vs multi-session), quality score inclusion | Keyword-level data may not be available at conversion level |
| Organic / SEO | ✅ | "Organic" definition (excludes all paid vs just campaign-tagged), branded vs non-branded split | Search Console data has 3-day delay |
| Funnel conversion | ✅ (conversion window, funnel stage dates) | Funnel stage definitions (what event = top/mid/bottom), re-entry allowed or not, session vs user funnel | Anonymous pre-login users may not stitch correctly to signed-up users |

---

### Sales

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| Pipeline analysis | ✅ (stage entry dates, close date) | Booking vs pipeline definition, probability weighting included/excluded, multi-product opportunity counting | Stage history may not be fully populated for older deals |
| Revenue / ARR | ✅ (booking date, revenue recognition date) | Booking vs billed vs recognized, ARR for multi-year deals (annualized or total), expansion separate from new | Billing system may have 2–5 day lag from CRM |
| Rep performance | ✅ (quota period, ramp period) | Ramped vs full quota, team vs individual attribution, SDR-sourced vs AE-sourced split | New reps (< 90 days) excluded from average if ramping |
| Forecast | ✅ (forecast period, commit vs best case) | Forecast categories (commit vs upside vs pipeline), rollup level (rep/manager/region), currency | Forecast accuracy degrades beyond 90-day horizon |
| Win/loss analysis | None required | Won definition (closed-won only vs also includes verbal commit), loss reason categorization | Loss reason field is manually entered — completeness varies by rep |
| Churn / expansion | ✅ (renewal date, expansion date) | Contraction vs churn vs both counted as churn, expansion threshold (minimum ARR increase), NRR formula | Downgrades require manual review — automated flag may lag |

---

### Finance

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| P&L | ✅ (fiscal period) | Fiscal vs calendar year, accrual vs cash basis, intercompany elimination applied/not, COGS definition | Month-end close takes 5–10 business days — prior month figures may restate |
| Budget vs actual | ✅ (budget period) | Budget version (approved vs latest revision), variance = $ or %, favorable vs unfavorable sign convention | Budget data may only exist at department level, not cost center |
| Cost center analysis | ✅ | Cost allocation method (direct only vs allocated), headcount costs included/excluded, capex vs opex split | Allocations recalculated monthly — prior period comparisons may shift |
| Cash flow | ✅ (cash date vs invoice date) | Direct vs indirect method, operating vs total cash flow, intercompany excluded | Bank reconciliation may not be complete for current period |
| Unit economics | ✅ (cohort period) | Gross margin definition (include/exclude S&M), contribution margin vs gross margin, currency | Multi-currency contracts require FX normalization — rate lock date matters |

---

### HR / People

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| Headcount | ✅ (snapshot date) | Point-in-time vs period average headcount, contractors included/excluded, leaves of absence counted | Headcount from HRIS may lag offers/starts by 1–2 days |
| Attrition / turnover | ✅ (termination month) | Voluntary vs involuntary vs total attrition, annualized rate formula, rehires counted or excluded | Termination reason field is manually entered — completeness varies |
| Time to hire | ✅ (requisition open date, start date) | Time to hire = open-to-offer vs open-to-start vs offer-to-start, internal transfers included/excluded | Requisitions closed without hire not always flagged — denominator may be understated |
| Compensation | None (snapshot) | Comp = base only vs total cash vs total comp, equity excluded unless specified, full-time equivalent normalization | Compensation data has restricted access — row-level security may apply |
| Span of control | None (snapshot) | Direct reports only vs all reports, IC vs all contributors counted, vacancies counted or excluded | Contractor managers may appear as ICs in system |
| Performance | ✅ (review cycle) | Rating scale normalization across cycles (if scale changed), calibrated vs raw scores | Historical cycles used different scales — normalization approximation |

---

### Product

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| DAU/WAU/MAU | ✅ (activity window) | Active = any event vs core action, session definition, test users excluded | Event pipeline may have 2–6h lag — today's metrics are incomplete |
| Retention | ✅ (cohort anchor, retention window) | D7/D30/D90 window (strict day or range), new user definition, re-activation counted as retained or new | Users who delete and recreate accounts may appear as new |
| Feature adoption | ✅ (feature release date, adoption window) | Feature = any use vs N+ uses, adoption rate denominator (all users vs eligible users), one-time vs sustained | Feature flags may not have been fully rolled out — check % exposed |
| Funnel / activation | ✅ (conversion window) | Activation definition (key action completed), ordered funnel vs unordered, session vs user-level | Anonymous pre-signup events may not stitch to user ID |
| Engagement | ✅ (session definition) | Session = time-bounded (30min idle) vs intent-bounded, engagement score formula weights | Mobile and web sessions may not be unified |
| Churn prediction / health | ✅ (inactivity window) | Churned = N days inactive, at-risk threshold, feature weights in health score | Real-time model data not available — scores update daily |

---

### Customer Success

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| NRR / GRR | ✅ (renewal cohort, expansion date) | NRR formula (include/exclude new logo), contraction threshold, multi-year vs annual normalization | Expansion ARR recognized at booking vs go-live varies by contract |
| Health score | ✅ (score calculation date) | Component weights, red/yellow/green threshold definitions, support ticket severity weighting | Health score is a snapshot — historical trend requires point-in-time snapshots stored separately |
| Churn analysis | ✅ (churn date) | Voluntary vs forced (non-pay) churn, partial churn (contraction) counted or separate, reactivation removes from churned | Reactivation window definition affects cohort sizes significantly |
| Time to value | ✅ (contract start, first value event) | Value event definition (first use vs first insight vs first share), onboarding vs post-onboarding period | Value event may vary by product tier — normalization needed |
| Support volume | ✅ (ticket created vs resolved date) | Count tickets by created vs resolved, CSAT required or optional, escalation criteria | Closed tickets may reopen — deduplicate by ticket ID not event |

---

### E-commerce

| Use case | Time handling | Confirm these items | Limitations |
|---|---|---|---|
| Revenue / GMV | ✅ (order date vs shipped vs delivered) | GMV definition (gross vs net of returns and taxes), cancelled orders excluded/included, gift cards counted | Returns may lag orders by 30+ days — current period GMV understated |
| Conversion rate | ✅ (session date) | Conversion = add-to-cart vs checkout start vs purchase, session deduplication, mobile app included | Web and app sessions not unified by default |
| Basket / AOV | ✅ | AOV = all orders vs first-order only, bundles as 1 item vs N items, returns not yet deducted | Bundle pricing complicates per-item analysis |
| Inventory | None (snapshot) or ✅ (turnover) | Inventory valuation (FIFO vs LIFO vs weighted average), returns in transit included/excluded | Warehouse data may have 15-30min latency |
| Customer LTV | ✅ (acquisition date, LTV window) | LTV includes/excludes returns, acquisition channel attribution, multi-account households | Long LTV horizons require extrapolation for customers acquired < N months ago |
| Return rate | ✅ (return window) | Return rate = units vs revenue, window = 30/60/90 days from purchase, exchanges counted as returns | Some return reasons are free-text — categorization requires normalization |

---

## 7. Confidence model — when `confirmItems` populates

The AI populates `plan.confirmItems` during the planning phase, before the MRD is shown. Items appear when the AI's confidence in a specific decision is below a threshold. The threshold varies by decision category.

### Confidence tiers

| Tier | Threshold | Behavior |
|---|---|---|
| **High confidence** | > 0.85 | Decision is standard for this domain, no alternative would be reasonable. Item not added to `confirmItems`. |
| **Medium confidence** | 0.55–0.85 | Decision is the most common choice but alternatives exist. Item added to `confirmItems` as a pre-checked acknowledgment. |
| **Low confidence** | < 0.55 | Multiple valid interpretations exist and the choice materially affects the model. Item added to `confirmItems` as an open question. |

### What determines confidence

**Lowers confidence (more likely to appear in `confirmItems`):**
- Two equally common industry conventions exist for a term (gross vs net revenue)
- User's prompt is vague or outcome-focused (no explicit entities or metrics named)
- Domain has a known "gotcha" decision that varies by company (fiscal year, churn definition)
- The decision involves a null or missing value that has business meaning
- The computed metric formula has a meaningful denominator choice
- This is the user's first model in this domain (no prior decisions to inherit)

**Raises confidence (less likely to appear in `confirmItems`):**
- User explicitly named the metric and its formula ("ROAS = revenue divided by spend")
- Term is unambiguous in the specified domain ("DAU" in product analytics = daily active users, period)
- Prior model in the workspace already made this decision (inherit the convention)
- User confirmed in the clarifying questions phase that preceded the MRD

### Maximum items in `confirmItems`

Show at most **3 items**. If the AI has low confidence on more than 3 decisions, surface the top 3 by impact (the decisions that most affect metric accuracy), and log the rest to a collapsible "Assumptions" section (future capability). 

Overwhelming the user with a long confirmation list defeats the purpose — if confidence is universally low, the AI should ask clarifying questions before generating the MRD at all.

---

## 8. Priority and ordering rules

When multiple items compete for space, apply this priority order within `confirmItems`:

1. **Formula definition items** — wrong formula = wrong numbers everywhere
2. **Attribution / classification rules** — affects all metric denominators
3. **Scope boundaries** — wrong inclusion/exclusion = inflated or deflated metrics
4. **Temporal anchors** — affects period-over-period comparisons
5. **Entity disambiguation** — affects join semantics

Within `limitations`, order by impact:
1. Items that currently produce wrong data (e.g., broken ingestion)
2. Items that will produce wrong data in the future (known data quality issues)
3. Platform limitations (NLQ can't do X)
4. Historical completeness gaps

---

## 9. Edge cases and special handling

### Prompt is a question, not a statement
**Input:** "Why did revenue drop last quarter?"  
**Handling:** Convert to a goal statement ("Diagnose the drivers of revenue decline in Q[N] versus Q[N-1]"). Add `confirm_these` for period definition. Surface diagnostic dimensions prominently.

### Prompt references an existing model
**Input:** "I need campaign performance like we had in Tableau"  
**Handling:** Goal states the migration intent. `confirm_these` surfaces the top 3 decisions that commonly differ between Tableau and ThoughtSpot's approach. `limitations` notes any known capability gaps.

### Prompt is for a single metric, no model needed
**Input:** "Just show me total revenue"  
**Handling:** MRD is minimal. Goal is brief. `key_metrics` has one item. No `time_handling` unless temporal context is implied. No `confirm_these` unless revenue definition is ambiguous. `what_i_understood` in Echo notes the simplicity.

### Prompt spans multiple analytical patterns
**Input:** "I need to understand campaign ROI and retention by cohort"  
**Handling:** Goal captures both intents. `key_metrics` covers both patterns. `time_handling` covers both windows (attribution window for ROI, cohort anchor for retention). `confirm_these` may surface the tension between the two time models (attribution window vs retention cohort are conceptually different).

### Prompt implies sensitive data (HR, health, finance)
**Input:** "I need individual employee compensation data"  
**Handling:** `guardrails` explicitly includes PII masking and access control requirements. `limitations` notes row-level security implications. `confirm_these` may surface the minimum reporting cell size (anonymization threshold).

### Prompt is in a language other than English
**Handling:** All MRD sections render in the language of the prompt. `ai_instructions` includes a note that Spotter should respond in the same language.

### Prompt references data that doesn't exist yet
**Input:** "I need real-time event data"  
**Handling:** `limitations` notes that real-time ingestion is not currently available. Goal still reflects the intent. `confirm_these` surfaces the best available approximation ("Nearest available: near-real-time, [N]-hour refresh").

### Two valid models exist for the same prompt
**Input:** "I need a sales model" — could be pipeline-focused or revenue-focused  
**Handling:** If the AI cannot resolve the ambiguity from the clarifying questions phase, it picks the most common interpretation and adds it to `confirm_these` with an explicit note: "I built this as a pipeline model — if you need a revenue/booking model, tell me and I'll rebuild."

---

### Table-explicit prompts — three sub-cases

Table-explicit prompts introduce a fundamentally different input mode: the user has named the data they want to use, but may or may not have stated why. This shifts the AI's task from "infer what data you need" to "infer what the user wants to do with the data they've named."

The MRD still has no access to schema metadata — no column names, no row counts, no join keys. The only material the AI has is the table names themselves, plus whatever business context was in the prompt.

---

#### Sub-case A — Semantic table names, no explicit goal

**Input:** "Use orders, campaigns, and users to create a model"

The table names are meaningful business concepts. The AI can infer purpose from them.

**What changes in the MRD:**

| Section | Behaviour |
|---|---|
| **Goal** | AI translates the table names into a business statement. "Build a model to understand campaign performance and user behaviour across the order funnel — using orders, campaigns, and users as the core data sources." The goal is AI-inferred, not user-stated. |
| **Confirm these** | Always has at least one item: the AI's inferred purpose. "I've interpreted this as a campaign attribution model — is that the right use case?" This item always appears first, before formula or temporal items. |
| **What I understood (Echo)** | The most valuable section. Shows the AI's interpretation of each entity: "orders = transactional records, campaigns = paid channel metadata, users = registered customer profiles — linked in that order." This is what makes Echo the stronger direction for this sub-case. |
| **Key metrics / Dimensions** | Populated from the inferred use case, not the user's words. AI notes that metrics are inferred from entity names. |
| **Limitations** | Always includes: "Entity descriptions and metric definitions are inferred from table names — confirmed structure will be resolved during the build scan." |

**Stronger direction:** Echo. The gap between what the user typed ("use these tables") and what the AI understood ("I think you want to understand X") is large and worth making explicit.

---

#### Sub-case B — Opaque or technical table names, no explicit goal

**Input:** "Use table_1, fact_sales, and dim_geography to create a model"

Some names are interpretable (fact_sales, dim_geography), some are not (table_1). The AI's ability to infer purpose is degraded.

**Decision gate: can the AI infer a coherent use case?**

- If at least 2 of N tables have semantic names → attempt the MRD, but with heavy caveats
- If the majority of tables are opaque (table_1, tbl_007, raw_extract) → do not generate the MRD. Instead, ask one clarifying question: "What do you want to understand from these tables?" The MRD cannot be useful without a basis for the goal.

**What changes in the MRD (when attempted):**

| Section | Behaviour |
|---|---|
| **Goal** | Necessarily vague: "Build a model from [table names] — [AI's partial inference from interpretable names only]." The goal is marked as provisional. |
| **Confirm these** | Two mandatory items regardless of confidence level: (1) "I inferred [X] as the use case from [semantic table names] — is that right?" (2) "I couldn't determine what [opaque_table_name] contains — you may want to describe its purpose before building." |
| **Key metrics** | Only populated for interpretable entities. For opaque tables, the metrics section either omits them or notes "metrics from [table_name] to be determined." |
| **Dimensions** | Same as metrics — populated from interpretable names only. |
| **What I understood (Echo)** | Explicitly distinguishes what the AI could infer vs couldn't. "fact_sales → likely sales transaction data. dim_geography → likely geographic reference data. table_1 → content unknown — I've assumed a supporting lookup table." |
| **Limitations** | Always includes: "One or more table names are not descriptive enough for the AI to infer their content. The model structure for these tables will be determined entirely during the build scan. Metric and dimension suggestions above may be incomplete." |
| **AI instructions** | Notes that Spotter should handle questions about [opaque_table] cautiously until the model is validated post-build. |

**Stronger direction:** Echo — because the transparency about what was understood vs guessed is the most important thing the user needs to see.

**If all table names are opaque:** Block the MRD entirely. Surface a single prompt instead: "I don't have enough context to draft a meaningful model requirement from these table names. What are you trying to understand?" The MRD generates only after this is answered.

---

#### Sub-case C — Any table names with explicit business goal

**Input:** "Use orders, campaigns, and users to build a campaign ROI model with ROAS by channel"

This is the richest and most resolvable input combination. The user has given the AI both what data to use and what they want to know.

**What changes in the MRD:**

| Section | Behaviour |
|---|---|
| **Goal** | Strong and precise — AI synthesises the user's named entities and explicit goal into a single statement. Lower inference load than intent-only prompts because entities are pinned. |
| **Confirm these** | Fewer items than typical. Table names act as entity anchors, which resolves many attribution and entity disambiguation questions automatically. Only true ambiguities surface (formula computation method, temporal anchors). |
| **Key metrics** | High confidence — AI knows both what metric was requested (ROAS) and what data it comes from (orders.amount / campaigns.spend). |
| **What I understood (Echo)** | Brief — the gap between what was asked and what was understood is small. The value in Echo is showing that the AI connected the table names to the right metric logic. |
| **Limitations** | Standard domain limitations. No special "inferred from table names" caveat needed. |

**Stronger direction:** Either works. Intent is stronger if the user is focused on whether the model will answer the right questions. Echo is stronger if the user is focused on whether the AI correctly interpreted the relationship between their named tables and their stated goal.

**Key property:** This sub-case has the lowest `confirm_these` frequency of any prompt type. When the user names both their data sources and their goal, most AI decisions become deterministic. The AI's job is execution, not inference.

---

#### Summary — how input mode shifts the MRD

| Input mode | Goal character | Confirm these | Best direction | Limitations always includes |
|---|---|---|---|---|
| Intent-only | Business statement (strong) | Residual low-confidence decisions | Either | Domain-specific |
| Intent + entities | Business statement (strong, anchored) | Very few | Either | Domain-specific |
| Table-explicit, semantic, no goal | Inferred from entity names (tentative) | Always: inferred purpose + formula items | Echo | "Entity descriptions inferred from table names" |
| Table-explicit, opaque, no goal | Partially inferred or blocked | Always: purpose + named unknowns | Echo (if shown at all) | "Table content unknown for [N] of [N] tables" |
| Table-explicit + explicit goal | AI synthesis of both inputs (strong) | Minimal | Either | Domain-specific |
| Metric-first | Derived from metric name | Entity assumptions | Intent | "Entities inferred from metric — may not be the only valid source" |

---

## 10. What this system does NOT try to do

**It does not appear in edit flows.** The MRD is a creation artifact. When a user modifies an existing model — adding a column, changing a formula, updating a join — there is no MRD step. The agent responds to the modification request directly. The original MRD remains visible as a collapsed reference card but is never reopened, regenerated, or added to. A new MRD is only generated when a new model is created from scratch.

**It does not validate schema.** The MRD is a business intent document. Every entity name, metric definition, and dimension is the AI's logical inference from the prompt. Physical table names, column names, join keys, row counts, and match rates are resolved during the build phase — never before.

**It does not replace clarifying questions.** The MRD assumes the clarifying questions phase (if present in the flow) already resolved the highest-level ambiguities. `confirm_these` handles residual low-confidence decisions, not the fundamental "what are you trying to build?" question. If the AI cannot infer a coherent goal (opaque table names, fully ambiguous prompt), it returns to the clarifying questions step rather than generating an empty or unreliable MRD.

**It does not score data quality.** Any data quality signals in `limitations` are AI inferences based on domain knowledge (e.g., "ad platform data typically lags 24h"), not live checks against the warehouse.

**It does not make irreversible decisions.** Every section in the MRD is editable before the user hits "Build model." The user is always in control. The AI surfaces its best interpretation; the user confirms, adjusts, or overrides.

**It does not represent the current state of the model.** After the model is built and subsequently edited, the MRD reflects the original creation intent only. It is not updated to reflect changes made post-build. If a team needs to understand what a model currently does, that comes from the model itself — column descriptions, lineage, and the build history — not from the MRD.
