# DataStudio — User Knowledge

_Who uses DataStudio, their mental model, workflow, frustrations, and success criteria. Update as understanding deepens._

---

## Primary user: Member of the Data Staff

Not a fixed role — the boundaries between analytics engineer, data engineer, and data analyst are blurring. Think of them as a **member of the data staff**, analogous to a member of the technical staff who spans multiple disciplines. With agents, they can extend their reach from pure analysis into data engineering tasks they couldn't do before.

**Profile:**
- Technical — can write SQL, understand table schemas, know what a join is
- May not be expert in dbt, pipeline orchestration, or warehouse management tools — but with an agent, that gap shrinks
- Works closer to the business than pure engineering — tied to a team or vertical (finance, sales, marketing)
- Has access to warehouse credentials for their domain
- Accountable for data accuracy — if a number is wrong, it's their problem

---

## Their world before DataStudio

They spend their time across three types of work:

**1. Ad hoc requests**
Sales needs pipeline numbers for next quarter. They go into the warehouse, find or build the right query, pull the number, share it as a CSV or a Slack message. Fast, manual, no durable artifact.

**2. Building for Spotter / dashboards**
Bring tables into ThoughtSpot (or connect via dbt). Make joins. Create calculated fields. Write AI context — descriptions, synonyms, business logic hints. Enable for Spotter. This is their primary "building" work.

**3. Debugging**
A business user reports that a number looks wrong. They trace it back — is it the table? The join? The formula? The AI context missing? This is reactive, unplanned, and damages trust.

---

## The ideal vs. the reality

**Ideal path (rare):** Warehouse tables are clean and well-structured → join everything in Snowflake → bring a single flat table into ThoughtSpot → add AI enrichment → done. Spotter works great.

**Common path:** Multiple raw tables → bring into ThoughtSpot → make joins there → write AI context → hope it works. Spotter is inconsistent.

**Painful path:** Tables have data quality issues, nulls, inconsistent formats, missing descriptions → Spotter gives wrong or unreliable answers → user doesn't know why → no tools to fix it → trust erodes.

---

## Where the current process breaks down

| Pain point | What happens today | What DataStudio addresses |
|---|---|---|
| Semantic modeling UI is hard | ThoughtSpot's modeling UI is not agentic — every join, formula, and description is manual | Agent builds joins, formulas, and context from a brief |
| No testing during build | Models are published without knowing if Spotter will answer correctly | Testing is built into the build workflow |
| No way to diagnose Spotter failures | If Spotter gets it wrong, there's no tool to understand why | Test → 3-dimension diagnostic → coaching |
| No integrated data prep | Data quality issues exist in warehouse; no BI-layer fix mechanism | Prep = query-time SQL transforms embedded in the model |
| Work is fragmented | Modeling here, prep somewhere else, testing not at all | One workspace: connect → build → test → coach → prep → cache → monitor |

---

## What makes them trust DataStudio immediately

- The agent does something non-trivial on the first try without being told exactly how
- Everything they need is in one place — they don't have to leave to do the next step
- It writes the code for them (SQL transforms, formulas, AI context)
- Testing gives them a clear, actionable answer — not just "it failed"

## What makes them dismiss it immediately

- It's not agentic — they still have to do the hard parts manually
- It feels complex — too many steps, too much configuration
- It can't write code — if they still have to write the SQL, the value is gone
- Features are scattered — they have to go to three places to finish one task

---

## The AHA moment

Zero-shot: give the agent a brief ("I want to analyze campaign performance across regions and user segments") and watch it — read the tables, propose the joins, write the AI context for every column, suggest which columns to include, identify data quality issues — in one pass. What would have taken them a day of manual work is done in minutes, and they just have to review and publish.

---

## Secondary user: Business user / Spotter consumer

Doesn't use DataStudio directly. Uses Spotter to ask business questions. Their experience is entirely downstream — they select a data model, ask a question, get an answer. DataStudio's quality determines whether that answer is trustworthy.

They are the reason accuracy matters. A bad answer erodes their trust in Spotter, which erodes their trust in the data team.

---

## Open questions about users

- [ ] How much do they currently know about what "AI-ready" means? Do they have a mental model for why Spotter fails, or is it a black box?
- [ ] What is their relationship with dbt? Do they own the dbt models or consume them?
- [ ] How do they currently decide what to put in a model vs. leave out?
- [ ] What does their interaction with the business user look like — do they get requirements, or do they pull what they think is needed?
