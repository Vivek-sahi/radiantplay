# Data Studio — foundation

_How to think about this product. Read before touching anything: it is the layer that makes the
other documents short, because the "why" lives here instead of being repeated in each one._

_Captured from Vivek, sessions 157–158 (2026-08-13 / 2026-08-17). **He is the architect — these are his positions, not
mine.** Where something is open it says so; do not fill a gap by inference. Direct quotes are kept
verbatim._

---

## What success sounds like

> "This is a lot of improvement on our current data modeling UX, and it feels like this has the
> end-to-end analyst workflow for data modeling."

Two claims, both of which have to land: **a big improvement on what exists**, and **end-to-end**.

---

## The workflow we serve

Data teams don't start from data. They start from a request:

1. A business user asks a question — *"what was revenue this year, what's the trend?"*
2. The data team identifies the tables that answer it
3. They build **one single model**
4. They share it with the business users
5. An agent is pointed at that model, and the business users get answers

**Everything we build serves step 3.** Data Workspace is the surface for data teams; the canvas lives
inside it because by the time a user reaches it, they have already had the conversation with the
business team about the use case and what data it needs.

---

## What a model is

**By outcome:** a data object which, when pointed at by an agent, can **answer all business questions
with trust, accuracy and speed** for a particular business team or use case.

**By composition:** a group of columns carrying

- the data itself
- the **context** around that data
- an understanding of the **audience** for that data
- the **memory of AI interactions** with that data

So: semantics *plus* actual data.

**The frame that matters:** a model is an **environment the agent acts in**. Not a schema that
happens to be consumed by AI — a workspace built for an agent from the start. The analogy Vivek drew
is how he uses Claude in this repo: the model is to the Spotter agent what a codebase is to a coding
agent.

⚠️ **This is why AI readiness is a phase rather than a feature.** Descriptions, synonyms and context
aren't metadata decoration; they are what the object is *for*.

**Other properties:**

- A model **does not exist before it has tables.** Nothing is created until then, and nothing is
  created until Save — there is no draft state.
- It belongs to a **team**, used for one or several use cases, and is **owned by one analyst**.
- **It decays without maintenance.** Over time it needs more columns to answer more questions, and
  updated descriptions and context to answer them accurately.
- **The smallest useful model** is fast, has limited columns, and answers every question one team
  has. No fixed threshold — a large enterprise has large models.
- **It can be wrong** two ways: it gives a wrong answer because someone wrote incorrect column
  descriptions, or it is **incomplete** because it lacks the metrics a question needs.

**The canvas is a workbench — an IDE where you build a model, visually.** It is a tool, not a
document.

---

## The user

**They always know the questions they want answered.** Sometimes they know which tables are needed
and sometimes they don't — and when they don't, **they ask the agent and it tells them.** Same for
schema.

That ordering matters: the question comes first, the tables second. Never design as though the user
arrives wanting to browse.

---

## The agent, and the line between it and the human

POC **is** agentic. But we are not building the agentic part — it is **inherited from another team**,
and the shape of that is not settled yet.

- **No new agent features in the MVP.** We integrate; phase 2 onward may add to it.
- **MVP has both:** you open a canvas, there is an agent, **and** there is manual table selection.
- ⚠️ **It will be a broken experience in MVP.** Integration with that team is outstanding work, not a
  detail.

**Things only a human does — the agent cannot:**

- trigger caching
- save a model

**Open, and it belongs to the agent team, not us:** when the agent proposes a join, what is the user
actually reviewing?

---

## Correctness — preview is the mechanism

The posture here is the opposite of guardrails, and it is easy to get wrong:

**A user cannot build something that isn't possible.** And for everything else, **they see the
data.** Set the wrong cardinality and the preview shows the repetition — so they fix it themselves.
Write a formula that doesn't do what they meant and the values are right there not matching, so they
modify it.

**So: explain, don't prevent.** Case by case, but the default is not to block.

**Hard lines:**

- **Never silently change what a user configured.** An agent changing something is different — that
  is visible and attributable.
- **Never show something we know is inaccurate.**
- Today they cannot tell a join is wrong at all, because there is no preview and no validation. **The
  preview is the fix.** The most common mistake it catches is wrong cardinality.

**Chasm and fan traps are a real problem, not vocabulary.** A model with such a trap has no honest
flat preview, so **the preview is unavailable — and we say why.**

**Open:** how much the system should claim to have checked. And whether we ever *refuse* a join —
that needs validating, not deciding.

---

## Caching — what it is, and why it is not in the MVP

⚠️ **Canvas caching left the MVP on 2026-08-17.** The MVP is **one warehouse, metadata only**, so
there is nothing to bring over. Its entire reason was that two tables in two warehouses cannot be
joined — remove multi-source and the reason goes with it. **The model cache stays**: that is the
performance one on a saved model's Caching tab, a different cache, after the model is ready, and it
was always a separate surface.

Everything below still describes the built behaviour and still holds for the phase that brings
multi-source back. It is history and future, not current scope.

**Two reasons, and the first one is not multi-source:**

1. **Cost.** Today, if your data is in Snowflake, every single agent question hits Snowflake and
   queries it. Cache the model and you get **infinite queries for zero cost**, because the data now
   sits in our own warehouse — **Agent DB**. Much cheaper.
2. **A technical workaround for multi-source.** Databricks talking to Snowflake is very difficult.
   The alternative to waiting on a data engineer to consolidate warehouses is for the analyst to
   bring both tables into ThoughtSpot themselves. An analyst is a persona with their own timeline.

**What it is, precisely:** **copying** data into our platform, with a refresh cadence, over a time
window. The word "cache" stays — it is an industry term.

**Outside the window:**

| | Behaviour |
|---|---|
| **Single source** | We **hit live query** against the source |
| **Multi-source** | An **error** — we cannot answer, because we don't have that data |

**The controls:**

- **Refresh frequency is a model-level decision.** The user chooses how fresh, up to a day. **There
  is no staleness problem** — freshness is their call.
- **The window is per-table, exposed through one control.** Choose *full model* and every table gets
  the same window, for consistency. Choose *custom* and you set them per table.
- **Who pays:** the customer buys space from us.

**Waiting:** 30 seconds to a minute is acceptable. Beyond that is too long.

**On failure:** tell the user it failed. If the settings were saved they can retry — or we retry
ourselves. If the settings weren't saved, say so and ask them to cache again. A genuine edge case.

**Open:** what is blocked during a fill. Vivek's instinct is that **preview and spreadsheet go
unavailable and return when loading completes**, while the agent, formulas and presentation work
continue. That conflicts with the built behaviour, which bars **join** and keeps preview
progressive. ⚠️ **Do not resolve this unilaterally** — it needs technical clarity first, then a
proposal, then a feasibility check with the modelling team.

**Also open:** whether a user can cache before joining if they want to, and whether caching reads as
a decision or a setting.

---

## Vocabulary

| Term | Means |
|---|---|
| **Formula** | A custom column |
| **Metric** | Custom columns **plus** columns from source |
| **Agent DB** | ThoughtSpot's own warehouse — where cached data lands |
| **Model** | The object. Not a dataset, not a SQL view — those are other things, and eventually less relevant |
| **Build / Explore** | A possible reframe of the Canvas / Spreadsheet tabs. The bottom preview is **not** actionable; the spreadsheet **is**, and it exists for exploration rather than checking |

---

## Design principles

**Polish means the UI, specifically:**

- The screen is clear
- I can see everything I can do on it
- I can understand it
- I can execute everything I want to
- The interaction model is very clear
- **There are not multiple ways to do the same thing**
- Every feature is designed end to end

⚠️ **The prototype fails the first one today.** "The UI has too much going on, which is not typical
ThoughtSpot UI." Simplifying is live work.

**One way to do a thing** is why there is one caching dialog rather than two, and why filters need a
single home rather than also hanging off a card menu.

**This is a stakeholder prototype, not a product.** It exists to make design decisions reviewable.
"Not built" is the normal state of anything off a demoed path. Grade a gap by whether it *lies* in a
path we walk — not by whether it works.

---

## The two things that make this product

1. **You can start from any messy data and model it.**
2. **You are not making a static model.** You are making something that works for AI agents.

⚠️ Neither is fully true in the MVP, deliberately. The MVP assumes tables that are **already clean
and prepared** in one warehouse — "start from any messy data" arrives with the Python/SQL/cleaning
phase. What the MVP does deliver is the second half: the model is built to be consumed by Spotter
from the start, which is why semantics sit inside the journey rather than after it.

---

## Risks, stated plainly

- **Will people find value in this, and are we solving the right problems for data teams?** Unknown.
  But this is step one and the step has to be taken — by phase five the value compounds.
- **No validation, no customer data points.** Every judgement here is internal.
- **The MVP does not complete the end-to-end lifecycle**, by scope. That is the hardest thing about
  it, and what the later phases close.
- **The AI part is the biggest unknown and the biggest lever.** The Spotter model agent hasn't been
  detailed at all, it arrives as an integration, and it is a tricky area.

---

## How we work

- **Vivek is the architect. He makes the decisions.** Execute according to his thinking; don't fill
  gaps by inference. If something is unanswered, ask again.
- **Discuss before coding.** When a topic is under discussion, don't jump to an implementation —
  propose, agree, then change.
- Design notes are notes, not a build queue.
