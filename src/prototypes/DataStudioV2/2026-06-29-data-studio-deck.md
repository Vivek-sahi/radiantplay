---
marp: true
theme: default
paginate: true
---

<!-- _paginate: false -->

# Data Studio
### Positioning & Product Vision

---

## The problem

**Spotter is only as good as the data behind it.** But today, getting data Spotter-ready — clean, joined, semantically rich, and AI-ready — is slow, manual, and spread across multiple tools.

That creates two problems:

- **Time to value** — it takes **[X weeks]** to go from buying ThoughtSpot to getting a model live in Spotter, because preparing data is still a fragmented, manual process.
- **Spotter quality** — even after a model is live, there's no easy way to know whether Spotter is answering correctly. Data changes, business logic evolves, and answer quality silently degrades over time.

> The result: customers buy ThoughtSpot, but getting to high-quality AI takes too long — and keeping it that way is even harder.

---

## The bet

**Our bet is simple.**

As AI becomes the primary way people interact with data, the quality of AI will depend on the quality of the data behind it.

Preparing data is no longer a one-time task. Models need to be continuously **tested, monitored, and improved** as data changes, business context evolves, and AI usage grows.

ThoughtSpot is uniquely positioned because we own **both sides of the loop** — where data is prepared (Data Studio) and where it's consumed (Spotter). That lets us continuously improve Spotter quality instead of treating data preparation as a one-time setup.

---

## What is Data Studio?

**Data Studio is ThoughtSpot's product for data teams.**

It's where teams connect data from any source, prepare it for AI, add semantics and context, validate with Spotter before release, monitor quality in production, and continuously improve models over time.

Instead of splitting these capabilities across **Data Workspace** and **Analyst Studio**, Data Studio brings them together into a single experience designed for the AI era — both a **unification** of the two products and a **rethink** of how data teams prepare, validate, and maintain data for AI.

---

## Why we win

Most platforms solve one part of the problem. Some help customers prepare data. Others provide AI experiences on top of it.

**ThoughtSpot owns both.**

Because we own where data is prepared and where it's consumed, we can continuously observe how Spotter performs in the real world, feed those learnings back into the model, and improve quality over time.

That feedback loop is difficult to recreate with disconnected tools — and it's where we believe our advantage lies.

---

## Product pillars

Everything in Data Studio supports one of four customer jobs:

1. **Bring your data from anywhere**
2. **Make data AI-ready**
3. **Validate & improve Spotter quality**
4. **Optimize BI & AI cost**

---

## Pillar 1 · Bring your data from anywhere

Bring together data from warehouses, semantic layers, applications, and files — without forcing customers to rebuild work they've already done.

We know enterprise data isn't neatly sitting inside a single warehouse. It's fragmented across cloud data warehouses, dbt, SaaS applications, spreadsheets, and custom sources. **Data Studio is designed for that reality.**

---

## Pillar 2 · Make data AI-ready

Transform, join, and enrich data with the semantics and business context AI needs to answer correctly.

Customer data is rarely AI-ready on day one. We bring preparation, modeling, and semantic enrichment together so teams can move from raw data to AI-ready models **in one place**.

---

## Pillar 3 · Validate & improve Spotter quality

Test Spotter before release, monitor answer quality after deployment, understand why answers fail, and continuously improve models over time.

As Anthropic and others have shown, AI quality naturally degrades as data and business context evolve. **Monitoring and improving quality is a core part of the product — not an afterthought.**

---

## Pillar 4 · Optimize BI & AI cost

Give teams visibility and control over warehouse and AI costs as adoption grows.

As AI usage scales, query costs and inference costs become operational concerns. Data Studio helps customers understand where that spend comes from and **optimize it over time**.

---

## Outcomes

| Outcome | Metric |
|---------|--------|
| Faster onboarding | Time to first AI-ready model |
| Better Spotter quality | Spotter accuracy over time |
| Easier model maintenance | Time spent maintaining models |
| Lower BI & AI cost | Query & inference cost |

---

## End-to-end journey

Rather than describing individual capabilities, here's what the product looks like end to end.

A data team wants to build a **Customer Health** model.

They connect data from **Snowflake, Pendo, and a CSV**, clean and transform it, join the datasets, enrich them with semantic context, validate the model by asking Spotter real questions, publish a certified version, monitor quality in production, and continuously improve it as data and business context change.

> The rest of the deck breaks that journey into the capabilities needed to support it.

---

<!-- _paginate: false -->

# Product Workflows

---

## P1 · Bring your data from anywhere

**Cloud data warehouses**
- Connect a warehouse · Configure credentials · Filter schemas and databases
- Browse and select tables · Preview tables
- Refresh / resync connections · Manage existing connections · Cache data within ThoughtSpot

**Semantic layers (dbt)**
- Connect dbt project · Import semantic models · Preview models
- Keep models in sync · Resolve sync conflicts · Push changes from ThoughtSpot back to dbt

---

## P1 · Bring your data from anywhere (cont.)

**Applications**
- Connect third-party applications · Browse available datasets
- Select data to import · Preview imported data · Cache data within ThoughtSpot

**Files**
- Upload CSV / Excel
- Cache data in a connection or in ThoughtSpot · Preview imported data

---

## P2 · Make data AI-ready

**Bring data into the workspace**
- Select imported tables · Add additional sources to the canvas · Preview data at any step

**Prep & transform data**
- Clean and transform data · Handle nulls and anomalies · Filter, aggregate, and reshape data
- Create formulas · Python notebooks for advanced transformations
- Preview before and after every transformation

---

## P2 · Make data AI-ready (cont.)

**Join & model data**
- Join datasets · Define relationships and cardinality · Validate and preview joins

**Enrich for AI**
- Generate descriptions and synonyms · Define business metrics
- Add business context · Build semantic relationships · Review and curate AI-generated metadata

---

## P2 · Make data AI-ready (cont.)

**Validate AI readiness**
- Ask Spotter questions against the draft model · Inspect reasoning and generated SQL
- Identify gaps in semantics or context · Iterate until the model is ready

**Publish to Spotter**
- Publish the model · Certify the model
- Version and manage releases · Make the model available in Spotter

---

## P3 · Monitor & improve Spotter quality

- Monitor Spotter accuracy
- Monitor freshness
- Monitor usage and adoption
- Detect quality drift
- Diagnose problems
- Improve models
- Release improvements

---

## P4 · Optimize BI & AI cost

**Optimize query costs**
- Monitor warehouse query costs · Cache data within ThoughtSpot
- Configure cache refresh schedules · Balance freshness vs. compute cost · Recommend datasets to cache

**Optimize AI costs**
- Monitor AI inference costs · Understand cost by model and workload
- Cache common AI responses · Configure AI budgets and limits

---

## Feature modules

For each module we describe:

- What exists today
- What needs to change
- The customer problem it solves
- Open product questions

---

## Strategic risks

1. **Agents become good enough to infer context** without a curated semantic layer.
2. **Warehouses absorb more** of the semantic and AI workflow.
3. **We fail to build for the workflows data teams actually care about** — creating a product-market fit gap.
