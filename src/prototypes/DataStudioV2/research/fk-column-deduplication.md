# FK Column Deduplication in Semantic Models

**Question:** When two tables are joined (e.g. orders JOIN campaigns on campaign_id), the join key column "campaign_id" exists in both tables. In the data model / semantic layer UI, should this column appear once or twice?

**Date researched:** 2026-04-21

---

## The problem in plain terms

In a data model with a join between `orders` (fact) and `campaigns` (dimension) on `campaign_id`:

- `orders.campaign_id` = a **foreign key** — it's the join handle in the fact table. It's a system field, not a business column.
- `campaigns.campaign_id` = a **primary key** — the canonical identifier for a campaign, meaningful to end users.

If both are included in the model, users see `campaign_id` twice. This is confusing and semantically wrong — they represent the same concept, and the fact table's FK is redundant once the join exists.

---

## How tools handle it

| Tool | Default behavior | Auto-deduplicate? | FK hidden? |
|------|-----------------|-------------------|------------|
| **Looker (LookML)** | FK hidden by default | Yes — join relationship absorbs it | Yes (LAMS style guide recommends `hidden: yes` on FKs) |
| **Hex** | FK not exposed unless explicitly added as a dimension | Yes | Yes — hidden unless opted in |
| **dbt Semantic Layer** | FKs defined as "entities" (metadata for joining), never shown as columns | Yes — they don't exist as columns at all | N/A |
| **Sigma** | All columns visible including FKs | No | No — user must hide manually |
| **Metabase** | All columns visible including FKs | No | No — user must hide manually |
| **ThoughtSpot (current)** | Duplicate column names flagged **in red**, user resolves manually | No | No — shown but flagged |

---

## Key pattern

Sophisticated semantic layer tools (Looker, Hex, dbt) treat FK columns as **plumbing** — they belong to the join relationship definition, not the column list. Less mature tools show everything and push the cleanup to the user.

ThoughtSpot's current behavior (flag in red) is on the less mature end. Worksheets show duplicates and require manual resolution.

---

## Decision for Data Studio

Data Studio should behave like Looker/Hex — the smarter end of the spectrum.

**Rule:** When the agent adds a join, FK columns in the fact table are excluded from `includedColumns` by default. The column survives exactly once — from the dimension table where it's the PK.

**Applied to our demo model (Campaign Performance):**
- `orders.campaign_id` → excluded (FK in fact table — covered by the join)
- `campaigns.campaign_id` → included (PK in dimension table — the business identifier)
- `orders.user_id` → excluded (FK in fact table)
- `users.user_id` → included (PK in dimension table)

This produces a clean, deduplicated column list without any configuration by the user.

---

## Implication for agent coaching

When a user asks "why don't I see campaign_id in orders?", the agent should explain: "Join key columns in fact tables are automatically excluded — they're captured in the join relationship. You'll find campaign_id under Campaigns, which is the authoritative source."

This matches how Looker explains hidden FK dimensions.
