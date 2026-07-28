# Research: Monitoring & Observability — Competitive Landscape

_Large + new territory. This is a survey doc, not a single design decision. Use this to draw monitoring workflow hypotheses for Data Studio._

---

## The question
What monitoring and operational support features do leading BI/analytics tools provide for data analysts, and what does this tell us about the monitoring surface area Data Studio should cover?

## Who is affected
Primary user: data analyst who owns a semantic layer (built in dbt or ThoughtSpot Data Studio) whose end users consume dashboards via ThoughtSpot. See `knowledge/users.md`.

## Scope
Tools covered: **Tableau, Looker, Power BI, Hex, Sigma, Omni**
Frame: post-build operations — keeping things healthy, catching problems, communicating to stakeholders.

---

## 1. Research Methodology

Based on product documentation, official changelogs, practitioner blog posts, and community discussions for each tool, researched as of May 2026.

---

## 2. Feature-by-Feature Analysis

---

### 2.1 Tableau

**Product lines relevant here:** Tableau Cloud, Tableau Prep Conductor (pipeline), Tableau Catalog (metadata/lineage, Data Management add-on), Tableau Pulse (proactive metric monitoring).

#### Data Freshness & Pipeline Health
- **Tableau Prep Conductor:** Flow Overview shows last run status + error details. Run History tab. Scheduled Tasks view. Auto-suspend after 5 consecutive failures. Email/Slack notifications on failure.
- **Tableau Catalog:** Auto-attaches a Data Quality Warning to a data source when its extract refresh fails; auto-removes it on next success.

#### Alerting & Threshold Notifications
Two distinct surfaces:
- **Dashboard alerts:** Threshold-based on individual fields. Email + mobile push.
- **Tableau Pulse alerts:** Threshold alerts, trend alerts, off-cycle alerts (urgent issues). Delivery via email, Slack, mobile push.

#### Anomaly Detection
Tableau Pulse:
- Unexpected values, trend detection, correlated metrics (correlation ≥ 0.7), record-level outliers, forecast insights (Tableau+ only), pace-to-goal.
- Root cause analysis: dimensional drivers suggested automatically. Proactive push — analyst does not need to open a report.

#### Model / Semantic Layer Health
Tableau Catalog (Data Management add-on):
- **Lineage view:** Visual map from database table → workbook → sheet.
- **Impact analysis:** Count of downstream workbooks affected before making a change.
- **Stale Content view:** Workbooks/data sources not accessed within a configurable window (1–120 days).
- **Data Quality Warnings (DQW):** Warning / Deprecated / Stale / Under Maintenance / Custom. High-visibility badges cascade downstream — flag a table and all connected workbooks inherit the warning.

#### Usage Analytics
- Admin Insights project (Tableau Cloud): job performance, user activity, content usage. Admin-level primarily.
- Content creators can see view counts on own content but no self-serve equivalent to Power BI's per-report metrics.

#### Scheduled Reports & Subscriptions
- Subscribe to workbooks/views on schedule or datagroup-triggered (fires after data refresh, not wall-clock).
- Tableau Pulse digests: separate email/Slack digests (weekly/monthly) with AI-generated summaries of followed metrics.

#### Collaboration
- View-level comments only. DQW messages with links/images. Version history (Cloud, 30-day). No real-time co-authoring.

#### Data Quality / Lineage
- DQW system is primary quality signal. Catalog lineage: database table → data source → workbook → sheet.
- No native dbt integration — third-party bridge required (Castordoc, Atlan, Metaphor).

---

### 2.2 Looker

**Product lines:** Looker (Google Cloud), System Activity (built-in observability), LookML.

#### Data Freshness & Pipeline Health
- **Datagroups:** Cache/PDT rebuild rules. No native "freshness indicator" UI.
- **PDT Builds Explore (System Activity):** Build times, failures, rebuild history.
- **Delivery-triggered scheduling:** Schedules fire after datagroup completes (post-refresh).

#### Alerting & Threshold Notifications
- **Looker Alerts:** On dashboard tiles. Threshold condition, configurable check interval. Followers can subscribe to other users' alerts. Email, Slack, webhook delivery.
- Admin manages all instance alerts from the Admin panel. Alert History page tracks execution.
- **Limitation:** No AI-powered suggestions or trend alerts. Practitioners describe it as useful but simplistic.

#### Anomaly Detection
**Not available natively.** Looker has no built-in anomaly detection. Teams use Monte Carlo, Metaplane, Bigeye.

#### Model / Semantic Layer Health
- **Content Validator:** Scans all Looks and dashboard tiles for broken LookML field/explore/model references. Find & Replace mode for global field rename. Scoped validation per project/folder.
- **CI Content Validator:** Runs automatically on GitHub PRs against LookML repo — prevents broken content reaching production.
- **Errors and Broken Content dashboard (System Activity):** Runtime query errors across Looks, dashboards, schedules, PDTs. Queryable — analysts can set Looker Alerts on it.

#### Usage Analytics
**System Activity** — curated Explores + dashboards built on Looker's own application database:
- User Activity, Content Activity (30-day "accessed" flag), Database Performance, Instance Performance, Performance Recommendations, Errors and Broken Content, Dashboard Diagnostics, Conversational Analytics.
- Default 90-day retention. Elite System Activity: 1 year + no concurrent query limits.
- **Limitation:** Admin-level. Individual creators cannot see "usage for my dashboard" without admin access.

#### Scheduled Reports & Subscriptions
- Email, Slack, S3, SFTP, and more. Datagroup-triggered delivery.
- No documented auto-suspension of broken schedules (unlike Tableau's 5-failure rule).

#### Collaboration
- Dashboard notes (limited). No cell-level comments. LookML in Git = developer-facing version control. Looker Boards for organized content collections.

#### Data Quality / Lineage
- No native DQW equivalent. No graphical lineage view natively.
- dbt Cloud integration: syncs descriptions/metadata into LookML. Schema changes do not auto-propagate.

---

### 2.3 Power BI (Microsoft Fabric)

#### Data Freshness & Pipeline Health
- **Scheduled refresh:** Up to 48x/day (Premium/Fabric). Email notification on failure. Auto-disable after 4 consecutive failures.
- **Refresh history:** Full attempt history with start time, duration, status, error details.
- **Lineage view (workspace):** Visual map of workspace artifacts with last refresh time, next refresh time, owner, endorsement status in side pane.

#### Alerting & Threshold Notifications
- **Data alerts:** Threshold on KPI / gauge / card tiles only (not report visuals). Runs on data refresh. Single-recipient only without Power Automate.
- **Power Automate integration:** Standard workaround for group notifications, Slack/Teams alerts, Jira ticket creation on alert or refresh failure.
- **Limitation:** Alerts only on dashboard tiles. No metric subscription or proactive anomaly-based alerting natively.

#### Anomaly Detection
- **Built-in anomaly detection (line chart visuals):** SR-CNN algorithm. Analyst-initiated (must open report and click anomaly). Dimensional explanation via ML.
- **AI Insights:** Key Influencers, Smart Narratives, Decomposition Tree.
- **Copilot (Fabric F2+ / Premium P1+):** Conversational anomaly explanation, Smart Narrative generation.
- **Limitation:** Visual-level feature. Not proactive. Requires opening the report.

#### Model / Semantic Layer Health
- **Lineage view + impact analysis:** Shows downstream reports/dashboards before making a change. "Notify contacts" button sends a message to all affected workspace contact lists.
- **Endorsement system:** Promoted / Certified badges on semantic models, dataflows, reports.
- **No native broken content scanner.** Breakage is discovered when a stakeholder opens a broken report.

#### Usage Analytics
- **Per-report usage metrics (creator-level, no admin required):** Last 30 days. Views, unique viewers, view trend, rank vs. tenant, distribution method, platform, typical opening time. Can be copied and customized.
- **Tenant-level (admin):** Activity log (90 days, REST API or Unified Audit Log). Admin monitoring workspace. Tenant inventory.

#### Scheduled Reports & Subscriptions
- Email snapshots (PNG + link). Paginated reports (PDF/Excel/Word, Premium/Fabric) for full operational delivery.
- Subscription failure not surfaced prominently to creators.

#### Collaboration
- Report page + visual-level comments with @mentions and threads. Smart Narratives. Version history (30 days). Deployment pipelines (dev → test → prod, Premium/Fabric).

#### Data Quality / Lineage
- Lineage view (workspace-level). Microsoft Purview for end-to-end lineage (requires Purview license). No native data quality check or DQW equivalent.

---

### 2.4 Hex

#### Data Freshness & Pipeline Health
- **Scheduled runs:** Hourly / daily / weekly / monthly / cron (Team+). App freshness indicator shows end users when the app was last run (since Nov 2023).
- **Run log:** 90-day history of scheduled runs with status. Cancel in-progress runs.

#### Alerting & Threshold Notifications
- **Conditional notifications:** Trigger delivery only if a condition is met after the scheduled run. Email + Slack. Run-triggered, not continuous.

#### Anomaly Detection
**Not available natively.** DIY only via Python/SQL notebook logic + conditional notification.

#### Model / Semantic Layer Health
- **No content validator.** Broken SQL cells surface only at next run.
- **Version history:** Chronological timeline of edits. Diff view for reviewing proposed changes (AI-generated edits).
- **Semantic views (Nov 2025):** Governed layer for what non-technical users can access via AI chat.
- **Audit logs (Apr 2024):** Full user action audit for compliance.

#### Usage Analytics
- **Analytics dashboard (Enterprise):** User activity, AI token consumption. Admin-level aggregate only.
- **No per-project "who viewed this app" usage report.** Primarily admin/aggregate.

#### Scheduled Reports & Subscriptions
- Delivers a live app link (not static snapshot). Stakeholders need Hex access.

#### Collaboration
- **Multiplayer editing:** Real-time co-authoring in notebooks.
- **Cell-level comments:** In both notebooks and published apps. Reply threads, @mentions.
- **Diff view:** Accept/reject proposed changes.

#### Data Quality / Lineage
- No native quality checks. Admin API `queriedTables` endpoint for programmatic lineage. Monte Carlo integration documented.

---

### 2.5 Sigma Computing

#### Data Freshness & Pipeline Health
- **Live query model by default** — no extract staleness problem.
- **Materializations:** Scheduled results stored back to warehouse. Materialization section in Usage dashboard tracks failures, runtimes.
- **Scheduled export failure handling:** Auto-pause after 10 consecutive failures + owner email.

#### Alerting & Threshold Notifications
- **Conditional exports/alerts:** Data availability, threshold comparisons, formula-based conditions (statistical bounds, z-scores). Email, email bursts, Slack, Teams, SharePoint, Google Sheets, cloud storage, webhooks.
- **Notification Action (Fall 2025):** In-app workflow action triggering real-time Slack/email alerts from user interactions in data apps.
- Admin view: all org schedules with last run status (Success / Error / Running / Skipped).

#### Anomaly Detection
**Not available natively.** Formula-based DIY outlier detection + conditional alert.
- **Sigma Reveal (Fall 2025):** AI-powered metric breakdown — natural language exploration of why a metric changed.

#### Model / Semantic Layer Health
- **Content Validation (Fall 2025):** Identifies broken references when columns are renamed/removed. Newer; less mature than Looker/Omni.
- **dbt Core integration (Fall 2025):** Syncs metadata from dbt Core into Sigma semantic layer.
- **YAML code representation:** Sigma data model can be committed to Git.
- **Workbook lifecycle:** Explore / Draft / Published states. Live draft visible only to editors until published.

#### Usage Analytics
Built-in Usage dashboards (admin-level):
- Users, Document Activity (top docs + unused docs), Document Permissions, Exports, Queries (success rate / runtimes / peak times), Materializations, Embedding, Ask Sigma usage.
- Hourly refresh. Warehouse-native — usage data stays in analyst's warehouse.

#### Scheduled Reports & Subscriptions
- **Email bursts:** Single scheduled export sending personalized filtered slices to large recipient lists. Strongest implementation in the group.
- Slack, Teams, SharePoint, Google Sheets, cloud storage, webhooks.
- Admin can search, filter, pause, retry, bulk delete all org schedules.

#### Collaboration
- Real-time co-authoring (shared live draft). Element-level comments with image annotations. Version history. Slack/Teams native integration. Tenants for multi-org sharing (Fall 2025).

#### Data Quality / Lineage
- No native DQW equivalent. Live queries mean bad data is immediately visible (no stale extract masking issues).
- Audit logs in `SIGMA_SHARED` schema — queryable in warehouse. Metaplane integration for automated impact analysis.

---

### 2.6 Omni Analytics

#### Data Freshness & Pipeline Health
- **Schema refreshes:** Manual, scheduled, or API-triggered to sync dbt manifest changes into Omni model.
- **dbt environment switching:** Dev/prod environment toggle for pre-production validation.
- **No native pipeline monitoring** beyond dbt layer.

#### Alerting & Threshold Notifications
- **Omni Alerts:** Condition types: results changed / not changed / present / missing. Cron or preset scheduling. Email, Slack, webhooks.
- "Results missing" condition is notable — catches pipeline failures where expected data doesn't arrive.
- Alert escalation workflow documented.

#### Anomaly Detection
**Not available natively.** Condition-based alerts only (analyst-defined thresholds).

#### Model / Semantic Layer Health
**Most differentiated capability in the group.**
- **Content Validator:** Shows which dashboards/workbooks reference a broken field/view/topic *before* a merge. Bulk find-and-replace. Discovery search (which content uses field X before deprecating it).
- **Branching (SDLC):** Isolated branch environments where warehouse change + dbt model + Omni model change + dashboard updates ship as one coordinated release. Prevents the "dbt rename breaks 30 dashboards" failure mode.
- **Git integration:** Semantic model in Git with PR workflows. Model history for teams not needing full Git.
- **dbt bi-directional integration:** Omni pulls from dbt AND analysts can edit dbt models from inside Omni's built-in dbt IDE, committing back to the dbt repo.

#### Usage Analytics
- **Omni Analytics dashboard (admin):** User engagement, workbook/dashboard consumption, model-level query performance, scheduled delivery success rates, AI interaction logs. Customizable.

#### Scheduled Reports & Subscriptions
- Email, Slack, webhooks with cron scheduling. No email burst equivalent documented.

#### Collaboration
- **Branching as collaboration model** (engineering-centric). Content drafts for isolated workbook editing. Version control via Git/model history.
- Comments not prominently documented — collaboration is analyst/engineer-facing, not analyst/stakeholder-facing.

---

## 3. Feature Comparison Matrix

| Feature | Tableau | Looker | Power BI | Hex | Sigma | Omni |
|---|---|---|---|---|---|---|
| **Data freshness indicator (consumer-visible)** | Via Catalog (add-on) | No native UI | Lineage pane side pane | App freshness indicator ✓ | No (live queries) | No |
| **Pipeline failure notifications** | ✓ email/Slack | Via System Activity (manual setup) | ✓ email + auto-disable after 4 fails | ✓ email/Slack | ✓ auto-pause after 10 fails | Via dbt layer |
| **Threshold-based alerts** | ✓ | ✓ | ✓ (dashboard tiles only) | ✓ (post-run) | ✓ (formula-based) | ✓ |
| **Proactive / AI anomaly detection** | ✓ Tableau Pulse (subscription, ML) | ✗ | Partial (visual-level, analyst-initiated) | ✗ | ✗ | ✗ |
| **Root cause / dimensional drill on anomalies** | ✓ Pulse | ✗ | ✓ (anomaly explanation in line chart) | ✗ | ✗ | ✗ |
| **Broken content scanner** | Via Catalog (auto on extract fail) | ✓ Content Validator + CI integration | ✗ (lineage for pre-change only) | ✗ | ✓ Fall 2025 (newer) | ✓ pre-merge validation + bulk fix |
| **Schema change propagation from dbt** | ✗ (third-party) | Partial (manual refresh) | ✗ | ✗ | ✓ Fall 2025 | ✓ bi-directional auto |
| **Branching / dev-prod separation** | ✗ | ✓ LookML Git branches | ✓ Deployment pipelines (Premium) | ✗ | ✗ | ✓ first-class branch model |
| **Lineage (table → dashboard)** | ✓ (Catalog add-on) | Partial (no graphical native map) | ✓ workspace view; Purview for E2E | ✗ (Admin API only) | Partial (audit logs) | ✓ via dbt metadata |
| **Per-report usage metrics (creator-level)** | Limited (admin-level) | ✗ | ✓ 30-day, no admin needed | ✗ | ✗ | ✗ |
| **Usage analytics (org admin)** | ✓ | ✓ 90 days / 1 yr Elite | ✓ 90-day activity log | ✓ Enterprise | ✓ hourly refresh | ✓ |
| **Stale content detection** | ✓ explicit admin view | Partial (30-day flag) | Partial (unused reports count) | ✗ | Via Document Activity | ✗ |
| **Scheduled reports** | ✓ (email, Slack, PDF; datagroup-triggered) | ✓ (email, Slack, S3, SFTP) | ✓ (snapshots; paginated for full delivery) | ✓ (live app link; Hex access required) | ✓ (email bursts, Slack, Teams, webhooks) | ✓ (email, Slack, webhooks) |
| **Personalized/segmented delivery** | ✓ data-driven subscriptions | ✓ per-recipient filtering | ✓ paginated with parameters | ✗ | ✓ email bursts (strongest) | Limited |
| **Comments / annotations** | View-level | Dashboard notes (limited) | Report page + visual-level @mentions | ✓ cell-level (notebooks + apps) | ✓ element-level + image annotations | Not highlighted |
| **Real-time co-authoring** | ✗ | ✗ | ✗ | ✓ multiplayer notebooks | ✓ shared live draft | ✗ |
| **Version history / rollback** | ✓ 30-day Cloud | ✓ Git (dev-facing) | ✓ 30-day + deployment pipelines | ✓ timeline + diff view | ✓ edit history | ✓ model history + Git |
| **Data quality warnings / labels** | ✓ DQW system (cascading, manual + auto) | ✗ | Endorsement/certification only | ✗ | ✗ | ✗ |
| **Impact analysis before changes** | ✓ Catalog lineage + count | Partial (Content Validator) | ✓ lineage view + notify contacts | ✗ | Partial (Content Validator, newer) | ✓ pre-merge + branching |

---

## 4. Table Stakes vs. Differentiators

### Table Stakes (every tool has a version)
1. **Scheduled report delivery** — all 6 support it. Format/destination/logic vary.
2. **Threshold-based alerts** — all 6 support it. Sophistication varies widely.
3. **Pipeline failure notifications** — all tools notify owners on failure. Auto-suspension is common.
4. **Usage analytics (admin-level)** — all 6 expose usage at admin level.
5. **Version history** — all 6 have some form of history/rollback.
6. **Collaboration via comments** — all 6 have at least dashboard/app-level commenting.

### Differentiators (1–2 tools only)

**Proactive anomaly detection + root cause → Tableau (Pulse)**
The only tool with subscription-based, always-on anomaly detection that pushes to analysts and explains likely dimensional root causes. Power BI's anomaly detection is analyst-initiated (requires opening a report). No other tool comes close.

**Pre-change impact validation + coordinated deploy → Omni**
Branching + bi-directional dbt + pre-merge Content Validator = the warehouse change, dbt model, Omni model, and dashboard all ship as one atomic release. Directly prevents the "renamed a dbt field and broke 30 dashboards" failure mode.

**Data quality warning system (cascading) → Tableau**
DQW with warning types, auto-attach on extract failure, and downstream cascade has no equivalent in the other five tools. Stakeholders see the warning before consuming broken data.

**Semantic layer content validation as first-class → Omni and Looker**
Both have Content Validators that scan the full content library for broken references. Looker's is more mature (CI integration). Omni's is more comprehensive (pre-merge validation + branch deploy).

**Email bursts / data-driven delivery at scale → Sigma**
Single scheduled export sending personalized filtered slices to large recipient lists. Strongest implementation in the group.

**Real-time co-authoring at cell level → Hex**
Multiplayer notebook editing with cell-level comments in notebooks and published apps. No other tool offers this.

**Git-native semantic layer development → Omni and Looker**
Both treat the semantic layer as code (LookML / Omni YAML) with Git integration, PR workflows, and branch-based development.

**Per-report usage metrics for content creators → Power BI**
The only tool where individual creators (no admin access needed) get a self-serve, pre-built report showing who viewed their content, how many times, and how the opening time trends.

**Live warehouse queries eliminating extract staleness → Sigma**
Sigma's default live query model removes the extract freshness problem architecturally. The tradeoff is performance, handled via materializations.

---

## 5. Week in the Life of a Data Analyst

*Persona: Ana — owns a dbt semantic layer with ~40 models. Stakeholders (sales ops, finance, growth) consume dashboards via Looker + Power BI. Also runs a Hex app for weekly revenue analysis delivered to leadership.*

---

### Monday
**Morning (30–45 min): alert triage**
- Three Looker Alert Slacks: 2 routine threshold fires, 1 unexpected churn rate spike.
- Power BI email: "Scheduled refresh failed — Finance Pipeline."
- Tableau Prep email: "SF Opportunity Sync flow failed — connection timeout."

Ana handles each:
1. **Churn alert:** Opens Looker Explore, traces to a batch of bad Salesforce records. Adds a dashboard note. Emails Salesforce admin.
2. **Power BI refresh failure:** Checks refresh history — gateway timeout. Re-triggers manually. Uses lineage view to identify 4 downstream reports owned by Finance. Sends Slack message.
3. **Prep flow failure:** Clicks link, sees error, re-runs after confirming SF API was intermittently down. Succeeds on retry.

**Late morning:** Digs into churn spike — builds a Looker Explore, saves as temporary Look, shares link in Slack to Head of Sales.

**Afternoon: broken content fix**
Checks Looker System Activity "Errors and Broken Content." One Look has a runtime error — she deprecated `customer_health_tier` last week and forgot downstream content. Uses Content Validator to find 3 affected Looks, Find & Replace to point them to `customer_risk_band`.

---

### Tuesday
**Morning: stakeholder communication**
Reviews dashboards for the 2pm sales ops business review. Checks "Last Refreshed" metadata in Looker. Sets up a Monday morning Looker delivery (datagroup-triggered) for the sales ops lead.

**Content work:** Building a new dbt model for product usage. Creates an Omni branch — develops dbt model, Omni model changes, and initial dashboard together against dev warehouse. Runs Content Validator on branch to confirm no existing dashboards broken.

---

### Wednesday
**Morning: Tableau Pulse digest review**
Pulse flagged two overnight anomalies: DAU trending down for 5 days; session length flagged as correlated driver. Clicks through the insight brief, sees dimensional breakdown pointing to mobile users. Forwards to product manager with link to dashboard.

**Afternoon: data quality labeling**
Data engineer flags upcoming marketing data source maintenance (Thu evening). Ana adds a Tableau DQW "Under Maintenance" warning to the data source with a message and time window. Warning cascades to all downstream dashboards automatically — no manual stakeholder outreach needed.

---

### Thursday
**Morning: weekly usage review habit**
Checks Power BI usage metrics for the Finance Dashboard. CFO's assistant hasn't opened it in 3 weeks. Slack message → CFO prefers email snapshots → sets up a Power BI subscription for them.

Checks "unused reports" count in workspace usage metrics. Two reports: zero opens in 30 days. Tags for review, marks one as deprecated.

**Late morning: Hex app prep**
Reviews Hex revenue notebook run log — last week succeeded. Adjusts a Conditional Notification: if Q4 revenue is below 90% of target, send Slack to finance channel. Tests condition against current data.

**Afternoon: lineage mapping before dbt change**
Plans to rename `fct_opportunities_v2` → `fct_pipeline`. Uses Omni Content Validator to search all workbooks referencing the old field — finds 7 workbooks + 2 dashboards. Bulk replace in development branch. Runs against dev warehouse to confirm before merging.

---

### Friday
**Morning: automated delivery**
Hex notebook runs at 7am. Conditional notification does not fire (revenue above threshold). Leadership gets app link. No manual intervention.

**Mid-morning: manual operational comms**
Sends a Slack message to #data-consumers summarizing the week: the churn anomaly, the SF sync issue resolved, the upcoming marketing maintenance window.
*This is manual — no tool among the six automates the cross-dashboard weekly status digest for the analyst's stakeholders.*

**Afternoon: weekly hygiene**
- Review failed schedules and broken content from the week (Looker System Activity / Power BI usage metrics).
- Check for unauthorized access in workspace permissions.
- Review dbt test results from the week in dbt's UI.
- Update semantic layer documentation for models shipped this week.

---

### Key Patterns Across the Week

1. **Alert triage is the first task of the day, every day.** 20–40 min each morning sorting signal from noise. Alert fatigue is a real problem when thresholds are poorly calibrated.

2. **Broken content is a recurring maintenance tax.** Schema/model changes regularly cause broken Looks and reports. Looker and Omni catch it pre-deploy. Tableau's DQWs and lineage help. Power BI, Hex, and Sigma mostly surface breakage only when a stakeholder opens the broken report.

3. **Stakeholder communication is mostly manual.** No tool provides a "weekly data health digest for your team." Analysts assemble this manually from usage metrics, failed schedules, and alert history, then communicate via Slack or email. **This is the largest gap in current tooling.**

4. **Usage analytics is underused by individual creators.** Power BI is the only tool surfacing per-report usage metrics to creators without admin access. In Looker, Sigma, and Tableau, creators must have admin access or ask an admin to build it for them.

5. **The anomaly detection gap.** Only Tableau Pulse provides proactive, subscription-based anomaly monitoring that pushes to the analyst. All others require opening dashboards to look for problems. Silent anomalies go undetected until a stakeholder asks.

6. **dbt/semantic layer changes are the highest-leverage failure source.** A single field rename can break dozens of dashboards. Omni and Looker address this most directly. The #1 operational pain point for analysts who own both a semantic layer and a BI layer.

---

## 6. Feature Gaps — What No Tool Does Well

1. **Analyst-facing "operational health dashboard" for their own content** — which of my dashboards had delivery failures, which are approaching staleness, which have declining usage, which triggered alerts. Every tool fragments this across admin views, notification emails, and manual checking.

2. **Cross-dashboard weekly digest for stakeholders** — a summary an analyst can share each week: "here is the state of your data — these metrics changed, these were updated, these issues are in progress." Has to be assembled manually today.

3. **Proactive anomaly detection without pre-configured thresholds** — Pulse comes closest but requires subscribing to specific metrics. No tool monitors all data automatically without configuration.

4. **Real-time "your semantic model drifted from the warehouse schema" notification** — Omni comes closest but requires a manual schema refresh trigger. No tool provides a live notification on schema drift.

5. **Per-report usage metrics for content creators without admin access** — Power BI is best but limited to 30 days, once-per-day refresh. No tool provides real-time "X people are viewing this dashboard right now" for individual creators.

---

## Options considered
_Not applicable at this stage — this is a landscape survey. Options will be drawn from this doc in a follow-on research/ideation session._

## Decision
_Deferred — next step is to draw monitoring workflow hypotheses for Data Studio from section 6 (gaps) and the Week in the Life patterns._

## What this defers / leaves open
- Which of the 6 gap areas is the right first bet for Data Studio monitoring?
- How does ThoughtSpot's existing alert/monitor infrastructure (Spotter alerts, scheduled Liveboard delivery) map to the table stakes vs. gaps identified here?
- What does the "operational health dashboard for an analyst" actually look like in the Data Studio context?

## Explorations needed before building?
Yes. Before designing any monitoring UI, we should map the Week in the Life patterns against what ThoughtSpot already provides — to identify the delta, not rebuild what already exists.

---

## Sources

- Tableau Pulse: help.tableau.com/current/online/en-us/pulse_intro.htm
- Tableau Prep Conductor monitoring: help.tableau.com/current/server/en-us/prep_conductor_monitor_flow.htm
- Tableau Data Quality Warnings: help.tableau.com/current/server/en-us/dm_dqw.htm
- Tableau Catalog overview: help.tableau.com/current/online/en-us/dm_catalog_overview.htm
- Looker System Activity dashboards: docs.cloud.google.com/looker/docs/system-activity-dashboards
- Looker Content Validation: docs.cloud.google.com/looker/docs/content-validation
- Looker Alerts: cloud.google.com/looker/docs/alerts-overview
- Power BI usage metrics: learn.microsoft.com/en-us/power-bi/collaborate-share/service-modern-usage-metrics
- Power BI lineage view: powerbi.microsoft.com/en-us/blog/announcing-power-bi-lineage-view-ga-and-introducing-dataset-impact-analysis/
- Power BI anomaly detection: learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-anomaly-detection
- Hex scheduled runs: learn.hex.tech/docs/share-insights/scheduled-runs
- Hex Fall 2025 launch: hex.tech/blog/fall-2025-launch/
- Sigma conditional export/alert: help.sigmacomputing.com/docs/schedule-a-conditional-export-or-alert
- Sigma usage overview: help.sigmacomputing.com/docs/usage-overview
- Sigma Fall 2025 launch: sigmacomputing.com/product-launch/fall-2025
- Omni alerts: omni.co/blog/using-alerts-for-operational-workflows-in-omni
- Omni SDLC controls: omni.co/blog/manage-changes-with-omnis-sdlc-controls
- Omni dbt integration: docs.omni.co/integrations/dbt
