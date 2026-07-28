# Journey 4: dbt plug-and-play — Build Spec

_Agreed in session 56. Write no code until this spec is signed off._

---

## Overview

Journey 4 is "dbt plug-and-play": start from the Journey Picker, import a dbt project through a 4-step wizard, optionally fix semantic issues in the canvas, and publish models to Spotter. The thesis is speed — existing dbt investment → live ThoughtSpot models with minimal friction.

---

## Entry point

Journey Picker → "04 dbt plug-and-play" → `onSelectJourney('dbt')` → `dbt-overview` view.

Landing: Shell with Data Browser tab active, External Models sub-tab active, **empty state**.

---

## Screen 1 — External Models empty state

Shown when no dbt project has been connected.

- dbt logo (orange circle with "d", reuse `DbtLogo` from `Dbt.tsx`)
- Heading: "No dbt projects connected"
- Subtext: "Import your dbt project to build models in ThoughtSpot. Your models stay in sync automatically."
- Three value-prop cards (reuse from `Dbt.tsx` EmptyState): Live link · AI catches issues · Push back to dbt
- Primary CTA: **"Import dbt project"** → opens import wizard modal

---

## Screen 2 — Import wizard (4-step modal)

Modal over the Data Browser shell. ~560px wide. Step indicator at top (Step 1 of 4 etc.).

### Step 1 — Connect

Two sections:

**Warehouse**
- Dropdown: existing connections pre-listed. Pre-select `snowflake-prod` (already connected in Journey 1 context).

**dbt credentials**
- Label: "dbt Cloud API token" · single password input
- Service URL: pre-filled `https://cloud.getdbt.com` (editable)

CTA: "Test connection →"

---

### Step 2 — Testing connection

Working-steps animation (same visual pattern as AgentPanel working steps):

1. Connecting to dbt Cloud → ✓
2. Reading manifest.json → ✓
3. Resolving warehouse views → ✓

Auto-advances to Step 3 after ~1.5s on completion.

---

### Step 3 — Select projects

Header: "We found 3 projects in your dbt Cloud account"

Project list with checkboxes:
| | Project | Models |
|---|---|---|
| ☑ | analytics | 18 models |
| ☑ | marketing | 6 models |
| ☐ | finance | 24 models |

`finance` unchecked by default — demonstrates project-level filtering (equivalent to schema filter in Journey 1).

CTA: "Import 2 projects (24 models) →"

---

### Step 4 — Review

Two sub-phases within the same step:

**4a — Translation animation (~1.5s):**
- "Translating 24 models to draft TS Models…" → ✓
- "Running validation pass (chasm traps, joins, descriptions)…" → ✓

**4b — Review list:**

Summary chips at top:
`24 models` · `1 blocking` · `14 advisory` · `9 ready`

Model table (5 rows; representative sample):

| Model | Status | Issues | Actions |
|---|---|---|---|
| fct_revenue | ▲ Advisory | 2 | Review issues · Publish |
| fct_orders | ● Blocking | broken ref: customers.email | Review issues |
| dim_customers | ● Ready | — | Publish |
| dim_campaigns | ▲ Advisory | 1 | Review issues · Publish |
| fct_marketing_perf | ▲ Advisory | 3 | Review issues · Publish |

**Blocking models:** "Publish" action hidden — user must Review issues first.  
**Advisory models:** both actions available; user can publish despite advisory issues.  
**Ready models:** "Publish" only.

Modal footer: **[Import & close]**

---

## Three exit paths from the wizard

### Path A — Import & close
Click "Import & close" → wizard closes → land in **External Models filled state** (Screen 3). All models in draft state.

### Path B — Publish from wizard
Click "Publish" on any model in the review list → **dbt PublishModal** opens (see below) → on confirm → toast "Published" → model row updates to Published · wizard stays open for remaining models.

### Path C — Review issues
Click "Review issues" on a model → wizard closes → **canvas opens** with that dbt model pre-loaded (Screen 4).

---

## Screen 3 — External Models filled state

After wizard closes (Path A or after publishing from Path B), External Models shows all imported models:

List view (not cards). Columns:
- Model name (dbt orange ◆ badge)
- Source: `dbt · analytics`
- Status: Draft / Published
- Issues: "2 advisory" / "1 blocking" / "—"
- Last synced: "just now" with **Sync now** link
- Actions: Review issues · Publish

Header area: "24 models · synced from dbt analytics · Last synced just now"

**Overview:** Imported dbt projects also appear in the Overview project list as linked projects (dbt badge + "Linked · analytics" subtitle under the project name). Clicking a project in Overview → same canvas as Path C.

---

## Screen 4 — Canvas (dbt model)

Same `Workspace` shell. No structural changes.

**Agent panel:** `projectSource === 'dbt'` triggers `import_dbt` script path (already exists in `AgentPanel.tsx` line 271). The existing broken-column fix scripts (`fix_dbt_campaign_roas`, `fix_dbt_days_to_convert`) are active.

**Column indicators:** warning icons on 3 columns (broken/degraded) — same pattern explored in `Dbt.tsx`. Clicking a flagged column pre-composes an agent message.

**Canvas header:** identical to Journey 1 — cache status, quality issues button, gear icon, Share button, Publish button. No removals. The dbt-linked nature of the model doesn't change the header UI.

**Publish:** triggers **dbt PublishModal** (see below).

---

## dbt PublishModal

Same modal shell as existing `PublishModal`. Different body content — no tables/columns detail (dbt is source of truth for schema):

| Label | Value |
|---|---|
| Source | dbt · analytics · linked |
| Joins | 2 relationships |
| Metrics | 3 (ROAS, Conversion Rate, Days to Convert) |
| AI context | Not reviewed |
| Data prep | Not reviewed |
| Caching | Not available for linked dbt models |

Footer: [Cancel] · [Publish Model]

---

## What gets reused

| Piece | Status |
|---|---|
| JourneyPicker | ✓ unchanged — Journey 4 entry already wired |
| Shell / Workspace | ✓ unchanged |
| AgentPanel `import_dbt` + dbt fix scripts | ✓ already exist (lines 271, 695–722) |
| PublishModal shell | ✓ new dbt variant inside `Workspace.tsx` |
| ShareModal | ✓ unchanged |
| Working-steps animation pattern | ✓ reuse from AgentPanel |
| `DbtLogo` component | ✓ extract from `Dbt.tsx` |
| Value-prop cards (EmptyState) | ✓ extract from `Dbt.tsx` |
| Model list table (ImportedState) | ✓ adapt as wizard Step 4b |

---

## What's new

| Component | Where |
|---|---|
| Journey 4 routing (`'dbt'` case) | `index.tsx` |
| `DbtOverview` — empty state + wizard trigger | `components/DbtOverview.tsx` |
| `DbtImportWizard` — 4-step modal | `components/DbtImportWizard.tsx` |
| `ExternalModelsPage` — filled state | `components/ExternalModelsPage.tsx` |
| `DbtPublishModal` — variant | inside `Workspace.tsx` |
| Linked-project badge on Overview cards | `components/Overview.tsx` (additive) |

---

## Sync behaviour (for demo)

- Default sync schedule: 24h (shown as "Last synced X ago" in External Models)
- On-demand: "Sync now" link triggers a brief working-steps animation then refreshes the timestamp
- No conflict UX in this spec — deferred

---

## Session 56 — build review fixes (next session)

Issues found after first build pass. Fix these before demo.

**1. External Models empty state — wrong approach**
`DbtOverview.tsx` was built as a separate screen. Wrong. The External Models tab already exists inside `DataBrowserPage`. The empty state belongs IN that tab. Fix: add props to `DataBrowserPage` — `initialTab`, `dbtImported`, `onImportDbt`, `onReviewIssues`. When `dbtImported === false`, render empty state content inside `ExternalModelsView` instead of the populated list. Journey 4 routing → `data-browser` view (not `dbt-overview`). Delete or stop using `DbtOverview.tsx`.

**2. Wizard — use design system WizardModal**
`DbtImportWizard.tsx` built a custom modal. Wrong. Must use the `WizardModal` component from `src/components/WizardModal`. Rewrite wizard steps as `WizardStep[]` objects passed to `WizardModal`.

**3. Step 3 — no model counts on Import CTA**
CTA currently says "Import 2 projects (24 models) →". Remove model count. Just "Import".

**4. Step 4 — simplify model list**
Remove summary chips (1 blocking / 14 advisory / 9 ready). Replace with flat list only. Status column: "Ready" or "2 issues" (no blocking/advisory labels). Both CTAs (Review issues, Publish) always shown per row — no hiding based on status.

**5. Canvas — agent welcome message when opened from wizard**
When canvas opens via "Review issues" from wizard, agent panel is empty. Should show an immediate welcome card: "I've opened [model name] in ThoughtSpot. What would you like to do?" with two chips: "Enrich for AI" + "Fix translation issues". Add `isDbtReview` boolean prop to Workspace → AgentPanel (same pattern as `isDayZero`).

**6. Canvas — column warning indicators not wired**
Broken/degraded dbt columns should show warning icons in CenterPanel. The `columnOverrides` for the pre-loaded dbt model need `syncStatus: 'broken'` or `'degraded'` on 3 columns. Set these in `openDbtCanvas` in index.tsx.

**7. Canvas — dbt fix scripts not firing**
Clicking "Fix translation issues" chip should fire existing dbt fix scripts (`fix_dbt_campaign_roas`, `fix_dbt_days_to_convert`). Wire the chip action to submit those script names through AgentPanel.

**8. Publish from dbt canvas not working**
`DbtPublishModal` not opening when Publish button clicked in dbt canvas. Debug `project.projectSource === 'dbt'` check in Workspace.tsx — likely the projectSource is not being preserved correctly when canvas is opened from wizard.

---

## Out of scope for Journey 4

- Fix-issues flow for blocking models (fct_orders broken ref) — show the state, but don't build the fix path
- Promote-back-to-dbt (push overrides to dbt repo)
- Conflict resolution UX (what happens when dbt changes conflict with TS enrichments)
- Branch / dev mode
