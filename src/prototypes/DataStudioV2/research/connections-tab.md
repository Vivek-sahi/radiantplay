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

## Patterns observed

### Comparison table

| Platform | Default scope | Per-user auth supported? | Schema filtering | dbt model | Who can create |
|---|---|---|---|---|---|
| Hex | Workspace (default) + project-level option | Yes — OAuth per-user (Enterprise tier) on top of a workspace OAuth integration | Yes — admin-curated allow-list at the database/schema/table level; cosmetic only, not security | Attached to a warehouse connection; metadata-only via dbt Cloud Discovery API (no dbt Core support) | Workspace conn: Admin. Project conn: Admin/Manager/Editor (admin can disable project-level entirely) |
| Omni | Org-level connection | Layered — base access on the connection + per-user/group overrides; OAuth supported | Yes — "Restrict schemas" setting hides schemas from the model | Attached per-connection (Settings > Connections > dbt tab); Git SSH (GitHub/GitLab/Azure DevOps) syncs schema.yml metadata + manifest into the semantic model | Org Admins / Connection Admins |
| Sigma | Org-level only | Yes — connection-level OAuth (per-user tokens) or org-level OAuth; key-pair service account is the default | No schema selection at setup — all accessible DBs/schemas come in; access governed post-hoc via "Grant access" | dbt Semantic Layer integration (separate from the warehouse connection); query metrics via `{semantic_layer.metrics()}` template | Admins only (admin panel) |
| Looker (LookML) | Org-level (instance-wide) | Service-account based; per-user data access enforced via PDTs/access filters, not separate connections | Connections target one database; LookML Project picks tables/views via `include:` | dbt Semantic Layer is a separate semantic-layer integration; LookML itself is the modeling layer | Admins only |
| Looker Studio | Per-data-source, per-report | Yes — "Owner's credentials" (shared) or "Viewer's credentials" (each viewer auths) chosen per data source | Each data source binds to one table/query | No native dbt integration | Any user can create their own data sources |
| dbt Cloud | Account-level connection, reused across projects; credentials per developer | Yes — every developer sets personal "development credentials" against the shared connection | n/a (dbt is the modeling layer, not a data browser) | n/a — dbt Cloud *is* the dbt platform | Account admins create connections; any developer fills in their dev credentials |
| ThoughtSpot today | Org-level connection in the Data workspace | Authentication types: Key Pair, OAuth, Service Account, PAT (varies by warehouse) | Yes — explicit table-and-column picker at setup ("Select tables on the left, columns on the right"); columns can be added later but not removed | Not its own connection type — bolted onto an existing warehouse connection; supports dbt Cloud (API key + Account/Project/Env IDs) or dbt Core (manifest.json + catalog.json zip upload); imports up to 4 folders, creates Models | Users with `can manage data` or admin privileges |

### Key takeaways from peer behavior

1. **Workspace/org as default, per-user OAuth as upgrade.** Every modern peer (Hex, Omni, Sigma) treats the *connection* as a shared organizational object, but layers per-user OAuth on top so individual queries inherit the user's warehouse permissions. dbt Cloud takes this further: one shared connection, each developer fills in their own dev credentials. Looker Studio is the outlier — it pushes credential choice down to the data-source level.
   - Hex: <https://learn.hex.tech/docs/connect-to-data/data-connections/oauth-data-connections>
   - Omni: <https://docs.omni.co/docs/administration/permissions>
   - Sigma: <https://help.sigmacomputing.com/docs/configure-oauth>
   - dbt Cloud: <https://docs.getdbt.com/docs/dbt-cloud-environments>

2. **Schema filtering is admin curation, not security.** Hex states this explicitly: "filtering does not affect the underlying permissions in your data connection." Same model in Omni ("Restrict schemas to limit which schemas are visible"). Sigma is the outlier — it imports everything and governs access post-hoc with grants. ThoughtSpot today is the strictest: an explicit table/column picker that *cannot be reduced* later (only added to).
   - Hex: <https://learn.hex.tech/docs/connect-to-data/data-connections/data-connections-introduction>
   - Sigma: <https://help.sigmacomputing.com/docs/connect-to-snowflake>
   - ThoughtSpot: <https://docs.thoughtspot.com/cloud/10.15.0.cl/connections-snowflake-add>

3. **dbt is almost never its own connection.** In Hex, Omni, and ThoughtSpot, dbt is a *tab on an existing warehouse connection* — auth to Git or dbt Cloud, then the platform pulls model metadata into the data browser/semantic layer. Sigma is the partial exception: dbt Semantic Layer is configured separately because it routes queries through the dbt SL JDBC API rather than the warehouse directly.
   - Hex: <https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration>
   - Omni: <https://docs.omni.co/integrations/dbt/setup>
   - ThoughtSpot: <https://docs.thoughtspot.com/cloud/latest/dbt-integration>
   - Sigma: <https://help.sigmacomputing.com/docs/configure-a-dbt-semantic-layer-integration>

4. **Management UI converges on a list with status + edit-in-place.** Looker shows columns for Name, Database, Scope, SSL, Type with green/yellow/red status indicators and a "Test" action per row. ThoughtSpot's existing page is similar (list, click in to view tables, edit via "More" menu). Hex puts connections in `Settings → Data sources` plus an in-project Data browser sidebar with a refresh icon. The pattern across the board: a list of connections with name, type (warehouse logo), status, and a per-row actions menu.
   - Looker: <https://docs.cloud.google.com/looker/docs/admin-panel-database-connections>
   - Hex: <https://learn.hex.tech/docs/explore-data/data-browser>

5. **Authentication ladders are remarkably similar.** Snowflake key-pair → service account → OAuth (workspace-level) → OAuth (per-user) is the path Hex, Sigma, and dbt Cloud all expose. The differences are mostly in plan-gating: Hex puts per-user OAuth behind Enterprise; Sigma exposes it at all tiers; ThoughtSpot exposes it in the picker alongside service-account and PAT.

6. **What ThoughtSpot does today that's unusual.** The hard table-and-column picker at setup time is unique to ThoughtSpot — peers either bring everything and curate later (Sigma) or curate via a soft filter that admins can change (Hex, Omni). ThoughtSpot's "you can add columns but not remove them" rule is the strictest model of the group and creates a real friction point if the analyst over-selects.

---

## Options considered

### Option A — Hex-style: workspace-scoped connection + soft schema filter

**Shape.** One connection per warehouse, scoped to the workspace, created once by an admin. Auth defaults to a service account or key pair; per-user OAuth is offered as an Enterprise/Pro upgrade. After auth, the analyst sees a soft "Schema filter" UI — all schemas come in by default; checkbox-style allow-list to hide ones they don't want. Filtering is cosmetic only (does not change warehouse permissions).

**Tradeoffs.**
- ✅ Familiar to Hex/Omni users — analysts already know this mental model.
- ✅ Curation is reversible (filter is soft) — fixes ThoughtSpot's "can add columns but not remove them" pain.
- ✅ AI agents benefit from filtering (Hex confirms: "improves AI agent accuracy").
- ⚠️ Requires us to support per-user OAuth eventually if we want to compete with Sigma on row-level governance.
- ⚠️ Soft filter ≠ security — we need to be clear in copy that hiding ≠ restricting access.

### Option B — Looker Studio-style: per-user data sources with shared option

**Shape.** Each analyst can create their own connections in their workspace; when sharing a prototype/answer, they choose whether downstream users use "owner's credentials" (the analyst's) or "viewer's credentials" (each viewer authenticates). Connections are first-class user resources, not admin resources.

**Tradeoffs.**
- ✅ Lowest friction for Day Zero — analyst doesn't wait on an admin to set up the warehouse.
- ✅ Matches the agentic / self-service positioning of Data Studio.
- ⚠️ Ungoverned — every analyst rolls their own credentials, hard to audit at scale.
- ⚠️ No peer in our competitive set (Hex/Omni/Sigma) does this for warehouses; Looker Studio is the only example and it is widely seen as a consumer/lightweight tool.
- ⚠️ Gets uncomfortable when artifacts are shared — "whose connection answered this?" becomes an audit question.

### Option C — Hybrid: workspace connections + per-user dev credentials (dbt Cloud model)

**Shape.** An admin (or first analyst) creates a workspace-level connection that defines the warehouse, default database, and a soft schema filter. Each analyst then plugs in their own development credentials against that connection (key-pair, OAuth, or PAT). Queries always use the analyst's credentials; the workspace connection only shapes what's visible. This is the model dbt Cloud uses today, and it maps cleanly onto Hex's workspace-OAuth + per-user-token architecture.

**Tradeoffs.**
- ✅ Best-of-both: governed (workspace-scoped) but personal (queries run as the user).
- ✅ Matches the "agentic analyst" story — the agent acts as the user, not as a service account.
- ✅ Naturally explains row-level security: "the agent sees what you see."
- ⚠️ Two-step setup (admin sets up the connection, analyst fills in dev creds) — more steps than Option A on Day Zero.
- ⚠️ More infrastructure to build than Option A (per-user credential vault).
- ⚠️ Empty state needs to handle two states: "no workspace connection yet" (admin step) and "connection exists, you haven't authed yet" (analyst step).

---

### dbt as a connection type — pattern question

Across all peers (Hex, Omni, ThoughtSpot today), dbt is **attached to an existing warehouse connection**, not a peer connection type. The auth flow:

1. Pick a warehouse connection (already authed).
2. Choose dbt Cloud (API token + IDs) or dbt Core (Git/zip upload).
3. Pick projects/folders to import.
4. Models flow into the data browser as enriched metadata (descriptions, tests, freshness, lineage links).

If we expose dbt as a *visible* connection type in the Connections list (the way ThoughtSpot does today), the IA tension is: it looks like a peer of Snowflake, but it requires a Snowflake (or BigQuery, or Databricks) connection to function. Two reasonable resolutions:

- **A1.** Keep dbt as its own row in the Connections list, with a "depends on: [warehouse-connection-name]" subtitle. Mirrors current TS.
- **A2.** Make dbt a *tab inside* a warehouse connection's detail page, the way Omni does it. Cleaner IA, but hides dbt from the Connections list entirely — bad for discovery on Day N.

---

## Decision

**Option C (Hybrid) — admin-enabled warehouse + per-user credentials, with a soft schema filter at user-auth time. No setup-time table/column picker.**

### Shape

1. **Admin step (lightweight, assumed pre-done in the demo).** When a customer onboards ThoughtSpot, the org has connected its warehouse account (e.g., Snowflake instance URL, Databricks endpoint). This is one-time, pre-conditional setup — not part of any analyst's Day Zero flow.
2. **Per-user auth (the analyst's first action).** Each analyst authenticates with their own warehouse credentials (key-pair, OAuth, or equivalent) when they first connect. Form opens, they fill it.
3. **Visibility filtered by warehouse RBAC.** The analyst sees only the data their warehouse permissions grant them. They cannot see what other users have access to.
4. **Soft schema filter at user-auth time.** As part of first auth, the analyst can choose to bring only one or two schemas to start (for trust-building). They can expand later. Soft = curation, not security.
5. **No setup-time table/column picker.** ThoughtSpot today's biggest friction — the hard "select tables, then columns" picker that can only grow — is removed. All accessible tables flow in by default.
6. **dbt placement (A1 vs A2) deferred.** Will be resolved by `dbt-short-flow.md` research.

### Why

- **Enterprise governance + analyst self-service.** Admin gates the warehouse availability; users own their own access. The agentic story is clean: "the agent acts as you, sees what you see."
- **Removes ThoughtSpot's biggest setup friction.** Analysts who over-select tables today are stuck. The new model lets them start small and grow naturally.
- **Trust by default on Day One.** Soft schema filter at user-auth time lets analysts validate one schema before bringing in dozens. Reduces overwhelm.
- **Data-visibility honesty.** Per-user credentials let the product truthfully say "you see what you have access to, and only that." No security caveats to navigate in copy or demo.
- **Peer-validated.** Closest peer model is dbt Cloud (account-level connection + per-developer dev creds). Hex Enterprise and Sigma also offer per-user OAuth on top of workspace connections. Our differentiation: stricter on user-only visibility; killing the table picker entirely; soft schema filter is a *user* control, not just an admin one.

---

## What this defers

- **dbt placement (A1 vs A2)** — pending `dbt-short-flow.md` research conclusions
- **Schema filter UI shape** — left-rail tree, two-pane all/selected, or other. Resolve during Playground exploration
- **Workspace-level admin schema filter** — Hex/Omni let admins curate at the workspace level on top of user filtering. Scoped to "later"
- Server-side auth/credential storage (out of scope — UX research only)
- Connection refresh / sync mechanics (covered in monitoring research, eventually)
- Row-level security model — covered in a separate governance research doc
- Multi-warehouse joins (e.g., joining a Snowflake table to a BigQuery table)

---

## Explorations needed before building?

Yes — once decision is made, try 2–3 Connections-tab layouts in `Playground.tsx` (empty state + populated state) before committing.

Specifically worth sketching:
- Empty state (no connections) — do we lead with warehouse logos, or with a single "Add connection" CTA?
- Populated state — list with status pills (green/yellow/red, à la Looker), or richer cards with table count + last refresh?
- Connection detail page — does dbt live as a tab here (Option A2) or as its own list row (Option A1)?
- Schema filter UI — left-rail tree with checkboxes (Hex-style) or two-pane "all / selected" (Sigma-style)?
