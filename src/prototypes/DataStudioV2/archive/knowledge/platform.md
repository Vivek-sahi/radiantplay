# DataStudio — Platform Knowledge

_What ThoughtSpot currently does in the spaces DataStudio touches. What's missing, what's broken, what DataStudio is building. Update as the product evolves._

---

## Where DataStudio sits in the ThoughtSpot product

Three major product verticals:

| Product | Who it's for |
|---------|-------------|
| **Insights** | Business users — ask questions, get answers via Spotter |
| **Data Studio** | Data teams — build, prep, test, cache, monitor AI-ready models |
| **Admin** | Platform admins — manage users, permissions, configuration |

DataStudio is a peer to Insights, not a sub-feature. It has its own surface, its own navigation, its own user (the member of the data staff). It is the **second major ThoughtSpot product**.

**Design implication:** DataStudio should feel like a ThoughtSpot product — consistent use of table patterns, agent patterns, full-screen patterns, left-hand navigation. Stay within the Radiant design system. Where DataStudio needs to diverge (data density, specialized workflows), define it deliberately rather than defaulting to custom.

---

## Current semantic modeling in ThoughtSpot

A step-by-step tabbed flow — linear in intent, but not truly guided:

1. **Select tables** — choose which warehouse tables to include
2. **Define joins** — specify relationships between tables
3. **Choose columns** — select which columns from each table enter the model
4. **Column properties** — for each column: type (attribute / measure), aggregation, indexing priority, synonyms, descriptions
5. **Formulas** — add custom calculated columns
6. **Column-level filters** — optional
7. **Parameters** — optional

**What's missing from the current tool:**
- Not agentic — the canvas and any agent capability do not communicate
- No data preview — can't see what the data actually looks like during modeling
- No prep — data quality issues in the warehouse can't be addressed here
- No code view — no way to see or edit the underlying SQL
- Column properties are not auto-populated — every description, synonym, and type setting is manual
- Too many clicks — the experience is tedious; high-effort for low-value interactions

**The experience gap DataStudio closes:** an agent that reads the tables, proposes the joins, writes the column properties, suggests formulas, identifies quality issues — in one pass, with the user reviewing rather than authoring.

---

## Caching

**Today:** ThoughtSpot does not have caching. Queries go live to the warehouse on every Spotter request.

**What DataStudio is building:**
- User-controlled, opt-in — requires explicit consent ("I want to cache my data in ThoughtSpot")
- **Refresh frequency** — how often the cache is updated (hourly, daily, weekly, custom)
- **Data lookback window** — how much history to cache (last 6 months, last 1 year, etc.)
- **Cost story** — caching has a cost implication (storage, compute); this is part of the decision UI

**Design implication:** Caching is a high-stakes, explicit user action — one of the three moments in DataStudio that requires explicit confirmation (alongside publish and monitor-and-fix). The UI must communicate: what will be cached, at what frequency, covering what time range, and at what cost. Not a switch — a decision with consequences.

---

## How Spotter fails today

Spotter operates on column tokens — semantic labels attached to columns in the model. When a question comes in:

1. Spotter translates the question into intent
2. It searches for the right column token to match that intent
3. It generates an answer from the matched column(s)

**Failure mode 1 — Token not found:** Spotter can't find a column token that matches the question. Answer is poor or empty. Root cause: missing or vague AI context (descriptions, synonyms) on the columns.

**Failure mode 2 — Wrong token matched:** Spotter finds a token based on its intent translation, but it's the wrong column. Answer is confidently wrong. Root cause: ambiguous column naming, missing context, or no synonyms distinguishing similar columns.

**What Spotter doesn't know:** It has no understanding of the underlying data quality. It doesn't know if a column has 40% nulls, inconsistent date formats, or duplicate rows. Some rudimentary null-handling has been added, but it's not systematic. Spotter doesn't know when to distrust its own answer.

**What DataStudio adds:** Testing surfaces exactly which questions Spotter gets wrong and why (3-dimension diagnostic: data quality · context · structure). Coaching lets the user teach Spotter how to handle those questions better. Together these close the feedback loop that doesn't exist today.

---

## dbt integration

**The customer pattern:** More and more ThoughtSpot customers have dbt models already. They want their business users to use Spotter on top of that data. Today, translating a dbt model into a ThoughtSpot semantic model is manual and broken.

**The vision:** Plug-and-play import.
1. Connect dbt project
2. DataStudio shows what translated cleanly and what's broken
3. User fixes the broken parts
4. User adds BI-specific enrichment (AI context, synonyms, additional formulas) that lives in ThoughtSpot, not dbt
5. Publish

**Source of truth rules:**
- dbt is always the source of truth for the data model itself
- Changes in dbt propagate forward to ThoughtSpot
- BI enrichment added in ThoughtSpot does NOT sync back to dbt
- Sync is one-way: dbt → ThoughtSpot

**Design implication:** The dbt-imported model should feel like a connected, living artifact — not a one-time copy. When dbt changes, DataStudio should surface what changed and what it means for the ThoughtSpot model. The "broken / needs review" state after a dbt sync is a real, recurring workflow.

---

## The product thesis (being validated)

**The bet:** A unified workspace that handles the full lifecycle (model → prep → cache → monitor) is better than the fragmented toolchain data teams use today.

**The known unknown:** Users may have different starting points:
- Some will want end-to-end: "I have raw tables, I want to get to Spotter answers, all in one place"
- Some will want plug-and-play: "I have a dbt model, I just need the modeling and enrichment part"
- Some may want only caching, or only testing

**The design response:** Build the unified experience as the primary path. Make each capability work standalone as well. The workspace is the default; the individual tools are accessible entry points.

This thesis needs to be validated with real users. The demo (situations 1–6) is how we test whether stakeholders believe it.

---

## Open questions about platform

- [ ] What does ThoughtSpot's Insights surface look like in detail — what patterns should DataStudio inherit vs. invent?
- [ ] What is the current admin tool's design language — does DataStudio need to feel consistent with it?
- [ ] What does a dbt sync conflict look like today — is there any precedent in ThoughtSpot for "something upstream changed, here's what broke"?
- [ ] How does caching interact with data prep — if transforms are applied at query time, does the cache store the transformed or raw data?
- [ ] What is ThoughtSpot's pricing model around caching — is cost per GB, per query, something else? This affects how cost is communicated in the UI.
