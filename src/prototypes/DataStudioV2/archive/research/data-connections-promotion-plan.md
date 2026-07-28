# Promoting Data + Connections from Playground to Live Prototype

_Plan written 2026-05-05 (session 49). Two-step promotion: Data first, then Connections. Decisions locked. Pick up from here in the next session._

---

## Premise

`DataStudioV2` has a Playground area (`components/explorations/`) where Data Browser and Connections were designed. The live prototype's left nav has **Overview · Projects · Data · Connections · Monitoring · Governance**, but **only Overview is wired** — Data, Connections, Monitoring, Governance are dead clicks today (`index.tsx::handleNavChange` only handles `'overview'`).

This plan promotes the Playground designs for **Data** and **Connections** into the live prototype. Monitoring and Governance stay dead — out of scope.

The audit (session 49) verified there is **no impact on existing surfaces** (Workspace canvas, Overview, ModelView, AgentPanel, LeftPanel, PromptBar inline browser). Promotion is purely additive to the dead nav targets.

---

## Locked decisions

| # | Decision | Locked because |
|---|---|---|
| 1 | **Default landing for Data tab: Warehouse view** | Most discoverable; user sees what's connected, drills in |
| 2 | **Default landing for Connections tab: List view** | Natural — see existing connections, click "+ New" or open one |
| 3 | **Single source of truth: PromptBar's existing `WAREHOUSE_TREE` is canonical** | Lift it from PromptBar.tsx into mockData.ts. PromptBar reads from there. Data + Connections pages also read from there. Add fields to existing structure as needed; do NOT introduce a parallel data set. |
| 4 | **"+ New connection" wizard is in scope, fully wired** | Click "+ New" in Connections list → opens wizard → walks through provider → creds → test → save → returns to list with new connection added |
| 5 | **Action stubs (Test connection / Disconnect / Edit / Sync) stay visual-only** | These workflows are not well-designed in the playground. Honest signal that they need a separate review pass. No handlers, no toasts, no fake confirmations. |
| 6 | **Delete orphan `DataBrowserModal.tsx`** | Verified zero imports anywhere. Dead code. |
| 7 | **Strict design system compliance is mandatory** | Use ONLY Radiant components. Use design tokens (no hardcoded colors / spacing / fonts). No custom HTML+CSS for things that should use Radiant primitives. No new primitives invented. |

---

## Out of scope (do not touch)

- **`Dbt.tsx` (DbtExploration)** — separate dbt project building flow. Belongs in a future promotion targeting NewProjectPrompt area, not Data/Connections nav. Phase 2 task #5.
- **Deep-link from Workspace to Connections** — future task.
- **Day-zero "Connect a warehouse" entry from outside Connections** — comes via the agent build flow later; not via UI deep link.
- **Wiring action buttons** (Test / Disconnect / Edit / Sync) — separate UX review pass.
- **Monitoring + Governance nav** — leave dead.

---

## Step 1 — Data promotion

**Goal:** Click "Data" in left nav → land on Warehouse view → drill warehouse → schema → table.

### Scope

1. **Lift `WAREHOUSE_TREE` from PromptBar.tsx to mockData.ts.**
   - Existing structure in PromptBar.tsx is canonical.
   - PromptBar updates to read from the lifted source.
   - Verify Workspace + PromptBar's `+ Tables` flow still works.
2. **Create `DataBrowserPage.tsx`** in `components/`. Clone of `DataBrowserExploration` minus:
   - Inner `<Shell>` wrapper (the live app's Shell already wraps everything)
   - `<SubStateBar>` (designer-debug tool)
   - Keep the internal state machine (drill-down via clicks already works).
3. **Wire `data` nav case in `index.tsx`** alongside the existing `'overview'` case. Default to Warehouse view.
4. **Delete orphan `DataBrowserModal.tsx`** (`grep -rn DataBrowserModal src/` first to confirm zero imports).
5. **Design system audit on the new `DataBrowserPage.tsx`** — replace any custom HTML/inline styling with Radiant components and tokens (see constraints below).

### Out of scope

- Anything in Connections (Step 2)
- Anything Dbt-related

### Review checkpoint

After step 1 ships:
- Click "Data" in left nav → Warehouse view loads
- Drill warehouse → schema → table → preview / schema / used-by tabs work
- Workspace canvas + PromptBar's `+ Tables` flow still work as before
- No regressions in Overview, ModelView, agent flows
- Design system compliance verified (no raw HTML, no hardcoded styles)

If clean → proceed to Step 2.

---

## Step 2 — Connections promotion

**Goal:** Click "Connections" in left nav → land on List view → click a connection for detail, or "+ New" to add one.

### Scope

1. **Add connection-level metadata** to existing mockData connections (status, lastSync, ownerEmail, type, etc.). Schema sketch:
   ```ts
   interface Connection {
     id: string;
     name: string;                // "Snowflake — marketing_db"
     type: 'snowflake' | 'bigquery' | 'databricks' | 'redshift' | 'postgres' | 'dbt';
     status: 'connected' | 'auth-needed' | 'error';
     lastSync: string;            // "3h ago"
     ownerEmail?: string;
     databases?: Database[];      // for warehouse-type
     dbtProject?: string;         // for dbt-type
   }
   ```
2. **Create `ConnectionsPage.tsx`** in `components/`. Clone of `ConnectionsExploration` minus:
   - Inner `<Shell>` wrapper
   - `<SubStateBar>`
   - Keep the internal state machine (`list` → `new` / `detail` / `dbt-setup`, transitions via click handlers).
3. **Wire `connections` nav case in `index.tsx`**. Default to List view.
4. **Wire "+ New connection" wizard fully:**
   - Click "+ New" → opens wizard
   - Provider tile pick → credentials form → test → save → returns to list with new connection added
   - Use Radiant primitives throughout (Modal / Card / Button / TextInput / Select)
5. **Action stubs stay visual-only** — Test / Disconnect / Edit / Sync buttons render but do nothing.
6. **Design system audit on `ConnectionsPage.tsx`** — same strictness as Step 1.

### Out of scope

- `Dbt.tsx` exploration (separate later)
- Deep-link from anywhere outside Connections
- Wiring action buttons

### Review checkpoint

After step 2 ships:
- Click "Connections" in left nav → List view loads
- Click "+ New" → wizard works end-to-end → new connection appears in list
- Click a connection row → Detail view loads
- From Detail → "Set up dbt" → DbtSetupView works
- No regressions in Workspace, Overview, ModelView, Data tab from Step 1
- Design system compliance verified

---

## Design system constraints (apply to both steps)

The playground components were built loose. Promoted versions must be strict.

- **Use ONLY Radiant components** from `src/components/`: `Button`, `TextInput`, `TextArea`, `Select`, `Modal`, `Card`, `Tabs`, `Sidebar`, `Chip`, `Avatar`, `Tooltip`, `Toast`, `Alert`, `LoadingIndicator`, `Horizontal`, `Vertical`, `View`, etc.
- **No custom HTML buttons / inputs / selects / modals.** Replace `<button>` → `Button`, `<input>` → `TextInput`, `<select>` → `Select`, custom modal divs → `Modal`.
- **No hardcoded colors.** Use design tokens: `c['content-primary']`, `c['border-default']`, `c['background-base']`, etc. No raw hex (`#2563EB`), no `rgb()`/`rgba()`.
- **No hardcoded spacing.** Use `sp.A` (4) / `sp.B` (8) / `sp.C` (12) / `sp.D` (16) / `sp.E` (20) / `sp.F` (24) / `sp.G` (28) / `sp.H` (32) / `sp.I` (40) / `sp.J` (48). No magic pixels.
- **No custom fonts.** Use `ff.primary` / `ff.mono`. Use `fs.xs/sm/md/lg/xl` for sizing, `fw.regular/medium/semibold/bold` for weight.
- **No new prototype-local components in `src/components/`** (the shared design system area). New components for the live prototype go in `src/prototypes/DataStudioV2/components/`.
- If you find playground code that's loose, that's the audit task — convert to design-system equivalent. If unsure whether something is loose or proper, check `.cursor/rules/design-system.md` and `src/prototypes/DataStudioV2/design-system.md`.

---

## Touchpoints — what NOT to break

These surfaces must continue working after each step:

- **Workspace canvas** (M7 cache + quality work — header subtext, modals, agent integration)
- **Overview page**
- **ModelView**
- **AgentPanel + SCRIPTS state machine**
- **LeftPanel `Add table` agent flow**
- **PromptBar inline browser** — UX should be unchanged after lifting `WAREHOUSE_TREE` to mockData.ts (just reads from a different source)

After each step, run `npm run build` and verify it passes before committing.

---

## Working environment

The promotion happens in worktree #2: **`/Users/vivek.sahi/radiantplay-conn/`** on branch **`dsv/vivek-data-browser-fixes`**.

Vivek's cache + prep work continues in worktree #1 (`/Users/vivek.sahi/radiantplay/` on `dsv/vivek-phase-2-explorations`). The two worktrees share git history but have independent working trees, so they don't interfere.

To start the promotion:
1. Open a new terminal
2. `cd /Users/vivek.sahi/radiantplay-conn/`
3. Start a Claude session there
4. Point it at this plan file (`research/data-connections-promotion-plan.md`)
5. Have it execute Step 1 first; review; then Step 2

After each step:
- `npm run build` passes
- Commit with a clear message
- Push to `origin dsv/vivek-data-browser-fixes`
- Do NOT merge into `dsv/vivek-phase-2-explorations` until both steps reviewed
- Do NOT push to `main`

---

## Briefing prompt for the next Claude (paste-ready)

```
I'm starting a new session in this worktree to promote DataStudioV2's Data Browser into the live prototype. This is Step 1 of a two-step promotion plan documented in:

  src/prototypes/DataStudioV2/research/data-connections-promotion-plan.md

Read these in order before doing anything:
1. CLAUDE.md (root)
2. src/prototypes/DataStudioV2/CLAUDE.md
3. src/prototypes/DataStudioV2/CONTEXT.md
4. src/prototypes/DataStudioV2/research/data-connections-promotion-plan.md  ← the plan
5. src/prototypes/DataStudioV2/components/Shell.tsx
6. src/prototypes/DataStudioV2/index.tsx
7. src/prototypes/DataStudioV2/components/PromptBar.tsx (find the inline WAREHOUSE_TREE constant)
8. src/prototypes/DataStudioV2/components/explorations/DataBrowser.tsx
9. src/prototypes/DataStudioV2/data/mockData.ts

Then execute Step 1 only (Data promotion). Do NOT touch Connections — that's Step 2, separate review.

Strict design system compliance is non-negotiable. See the plan for constraints.

After Step 1: build passes, push to origin dsv/vivek-data-browser-fixes, summarize what shipped, what was touched, what's still a stub. Do not merge to dsv/vivek-phase-2-explorations or main.
```
