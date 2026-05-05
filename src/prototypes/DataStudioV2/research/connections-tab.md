# Research: Connections — IA, scope, and management

## The question

How are connections managed in Data Studio? What's the IA of the Connections tab, and what scope/auth model do connections have?

## Who is affected

Data analyst (primary user). Affects Day Zero ("Set up ThoughtSpot" story) and the dbt-as-integration variant of Day N.

---

## Specific questions

**Tactical management**
- How are connections managed day-to-day? What are the possible models?
- Who can view, edit, share, revoke a connection?

**Scope of a connection**
- Does a connection scope **data**, or only **auth**?
- Is a connection **user-level**, **workspace-level**, or **org-level**?
- What's the right default scope, and why?

**What goes in the Connections tab**
- List view: which connections, status, owner, created-at?
- Empty state (Day Zero): what does it look like with no connections?
- New connection flow (Hex-style auth): what does the wizard look like?
- Schema filtering UI — bring all schemas vs a subset
- Status / health indicators per connection

**dbt as a connection type ("integration")**
- Auth → pick warehouse → bring in projects + models — what does this look like in our shell?
- Is dbt visually different from Snowflake/BigQuery, or same pattern with different fields?

**The "why"**
- What makes our connections model defensible vs Sigma / Omni / Hex?

---

## Competitive references to study

- **Hex** (primary — auth to warehouse, import all tables, optional schema filter)
- **Omni** — auth model, scope, management UX
- **Sigma** — same
- **Looker / Looker Studio** — connection patterns
- **dbt Cloud** — credentials + project model
- **ThoughtSpot today** — what's the existing Connections concept, what to keep or change?

---

## Options considered
_(fill in after competitive review)_

### Option A — [name]
### Option B — [name]
### Option C — [name]

---

## Decision
_(to fill in)_

---

## What this defers

- Server-side auth/credential storage (out of scope — UX research only)
- Connection refresh / sync mechanics (covered in monitoring research, eventually)

---

## Explorations needed before building?

Yes — once decision is made, try 2–3 Connections-tab layouts in `Playground.tsx` (empty state + populated state) before committing.
