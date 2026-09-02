import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { c } from './styles';

// ── Data Studio experience variant ──────────────────────────────────────────
// 'vision' = the full vision-level experience. 'poc' = the scoped-down POC.
// 'demo'  = the stakeholder demo cut: Vision plus selected POC cleanups, and the
//           only cut where the run-of-show script fires.
// 'pocv2' = the MVP cut under active design (2026-08-06 review onward). Starts as
//           an exact duplicate of POC so the reviewed cut stays frozen for
//           reference while V2 moves.
// One source of truth, read anywhere via useVariant(); toggled from the header.
export type DataStudioVariant = 'vision' | 'poc' | 'demo' | 'pocv2';

// ── Customer-call lock ───────────────────────────────────────────────────────
// Set to a variant to lock the prototype to that cut: the header toggle hides,
// and ?v= / localStorage are ignored so every visitor lands on it. Set back to
// null to restore the toggle and normal behaviour. Locked to 'demo' 2026-09-02
// for a customer call — temporary, expected back in ~a week.
export const LOCKED_VARIANT: DataStudioVariant | null = 'demo';

/**
 * True for every cut that renders the POC experience. The ~28 `poc &&` checks in
 * ModelCanvas / AgentPanel read a single boolean, so POC V2 has to resolve it too
 * or it renders as Vision. Widen this, never the individual checks.
 */
export const isPocCut = (v: DataStudioVariant): boolean => v === 'poc' || v === 'pocv2';

/**
 * Central scope config — one field per thing the cuts actually differ on.
 *
 * Why this exists: a single `poc` boolean can only say "which cut am I", which
 * is enough for two cuts and useless for three. Demo needs to take *some* things
 * from POC and the rest from Vision, so each difference has to be nameable on
 * its own. Gate new behaviour off `useScope().thing`, not off the variant.
 *
 * The existing ~25 `poc &&` checks are deliberately left alone. A check moves
 * into this object when Demo needs it to differ — so the cost is per pick, not
 * a rewrite of every gate.
 */
export interface Scope {
  /** Preview header offers node-level vs whole-model preview. POC's addition. */
  modelLevelPreview: boolean;
  /** "Columns" in the canvas view switcher. POC drops it — Canvas · Spreadsheet only. */
  columnsTab: boolean;
  /** Data browser category tabs (Warehouse · Business Apps · External sources). */
  browserCategoryTabs: boolean;
  /**
   * The connection filter beside the browser's search box — a facet that narrows a
   * unified tree to one or more connections.
   *
   * On for POC V2: multi-source is the MVP promise, so every connection shows at
   * once by default (a cross-warehouse join is impossible otherwise — see Tableau's
   * multi-connection data source), and the filter is how you narrow that down
   * without ever hiding the others behind a mode. POC hid it because it was scoped
   * to a single connection. See 2026-08-11-data-browser-spec.md §1.
   */
  browserConnectionFilter: boolean;
  /**
   * The data browser is a **flat list of the model's one connection's tables** — no
   * connection grouping, no database or schema levels, no connection filter. Search
   * narrows table names.
   *
   * Why: the connection is chosen once, before the canvas opens, and cannot be changed
   * (2026-08-17). And we don't let users sync a schema, a database or several warehouses,
   * so three of the tree's four levels describe nothing.
   *
   * ⚠️ **A model is therefore single-connection, which makes the caching gate unreachable
   * on this path** — every table shares a warehouse, so nothing needs bringing over. That
   * is correct for MVP phase 1 being single-source; multi-source is phase 2 and will need
   * a way back to more than one connection.
   */
  flatTableBrowser: boolean;
  /**
   * Caching is raised **on the canvas** — the gate at the join, the notice, the settings
   * dialog and the topbar cache pill.
   *
   * Off for POC V2 from 2026-08-17. Canvas caching existed for one reason: a join across two
   * warehouses is impossible, so both tables had to be brought into ThoughtSpot's store. The
   * MVP is a **single warehouse** with metadata only, so there is nothing to bring over.
   *
   * ⚠️ This is **not** the same as caching leaving the product. The **model** cache — the
   * performance one on a saved model's Caching tab — stays: that is a different cache, after
   * the model is ready, and it was always a separate surface.
   *
   * ⚠️ Turning `tableCaching` off is not how you express this. That flag switches the
   * `!tableCaching` branches back on, which is Vision's older model-level caching UI — more
   * caching, not less.
   */
  canvasCaching: boolean;
  /**
   * The left dock carries a `Data` / `Metrics` tab pair — the warehouse tree, and
   * the model's own fields (every selected column across all tables, plus
   * formulas) in one flat list.
   *
   * A tab rather than a second panel: two left rails is a pattern no surveyed
   * platform uses, and sharing the dock costs no new chrome. Filters are not in
   * this pane — they aren't metrics.
   */
  metricsPane: boolean;
  /**
   * The second warehouse connection reads as Databricks rather than BigQuery.
   * The run-of-show has Maya saying product usage lives in Databricks, so the
   * browser has to agree with the narration.
   */
  databricksConnection: boolean;
  /** Opening the Spreadsheet tab clears canvas selection and closes the panels. */
  clearSelectionOnSpreadsheet: boolean;
  /** Full-screen toggle in the preview header. Redundant where Spreadsheet is a tab. */
  spreadsheetFullScreen: boolean;
  /**
   * Home screen carries the setup entry points — Create a connection, Connect
   * Snowflake, Cache a model, and the two multi-source flows.
   */
  homeSetupEntryPoints: boolean;
  /**
   * The "AgentDB" connection (ThoughtSpot's own store, `cached` schema) shows in
   * the data browser. Its tables are Pendo/NPS leftovers and the label predates
   * the Near Store rename, so it's off-story for the demo.
   */
  nearStoreConnection: boolean;
  /**
   * Pick mode stays on so several cards can be referenced at once, each landing
   * as a chip in the composer; "join these tables" then reasons over that set and
   * returns a join recommendation. Off = one reference per activation.
   */
  multiSelectJoinFlow: boolean;
  /** Connection pill on the home prompt bar is a bordered button, not plain text. */
  borderedConnectionPill: boolean;
  /** Home prompt bar carries the `@` table-mention button. */
  promptBarTableMention: boolean;
  /**
   * The AI-readiness pill opens Komal's "Check for" panel, and its CTA runs the
   * ported agentic readiness flow (physical → semantic → Spotter grading → apply)
   * in the agent panel. Off = Vision's own scan → Fix all → tune dropdown.
   *
   * On for Demo as well as POC: the run-of-show gives readiness the longest beat
   * (S15–S18, 60s) and asks for "three layers checking in sequence", which is the
   * flow's physical/semantic/ai pillars.
   */
  readinessFlow: boolean;
  /**
   * The conversation starts before the model does. Her question on the home
   * screen opens the canvas with no model on it — the chat panel centred on the
   * wash, the model card not drawn yet — and the draft model is created when she
   * accepts the agent's first table proposal, the card growing in beside a chat
   * that stays exactly where it is.
   *
   * The frame is that objects are created from intent: the model isn't a
   * container you make and then fill, it's the first thing the conversation
   * produces. Run-of-show S1→S3.
   *
   * Off = the model exists before you arrive (New model, or opening one), which
   * is every other path into the canvas.
   */
  chatFirstStart: boolean;
  /**
   * The table-caching flow: attempting a join that needs tables brought into
   * ThoughtSpot raises an info step, then a modal that sets the model's cache
   * scope, then a background fill the join resumes from.
   *
   * Caching is bringing tables from other warehouses into ThoughtSpot's warehouse
   * and refreshing them on a frequency — required because we don't support
   * federated query, and worth doing because live queries stop, which saves
   * money. Spec: `2026-08-12-caching-flow-spec.md`.
   *
   * Off everywhere but POC V2: Vision never gated on caching, POC is frozen on the
   * on-drop prompt below, and Demo runs its own scripted caching beat at S6.
   */
  tableCaching: boolean;
  /**
   * The legacy prompt: adding a table from a second connection asks to cache the
   * **model** before it will land on the canvas.
   *
   * ⚠️ Superseded by `tableCaching`, and the two are mutually exclusive. Dropping a
   * table is not a caching touchpoint in the new flow — preview queries the source
   * live, and caching a table the user may delete costs a cache for nothing. The
   * requirement is real at the join, which is where it now surfaces.
   *
   * This exists as its own flag because the check it guards reads the `poc`
   * boolean, and `poc` is `isPocCut(variant)` — which includes POC V2. Without an
   * explicit flag, POC V2 would inherit the on-drop prompt it is meant to replace.
   */
  cacheOnConnectionAdd: boolean;
}

/** Kept as an alias so nothing that imported the old name breaks. */
export type PocScope = Scope;

const VISION_SCOPE: Scope = {
  modelLevelPreview: false,
  columnsTab: true,
  browserCategoryTabs: true,
  browserConnectionFilter: true,
  flatTableBrowser: false,
  canvasCaching: true,
  metricsPane: false,
  databricksConnection: false,
  clearSelectionOnSpreadsheet: false,
  spreadsheetFullScreen: true,
  homeSetupEntryPoints: true,
  nearStoreConnection: true,
  multiSelectJoinFlow: false,
  borderedConnectionPill: false,
  promptBarTableMention: false,
  readinessFlow: false,
  chatFirstStart: false,
  tableCaching: false,
  cacheOnConnectionAdd: false,
};

const POC_SCOPE: Scope = {
  modelLevelPreview: true,
  columnsTab: false,
  browserCategoryTabs: false,
  browserConnectionFilter: false,
  flatTableBrowser: false,
  canvasCaching: true,
  metricsPane: false,
  databricksConnection: true,
  clearSelectionOnSpreadsheet: true,
  spreadsheetFullScreen: false,
  homeSetupEntryPoints: false,
  nearStoreConnection: false,
  multiSelectJoinFlow: true,
  borderedConnectionPill: true,
  promptBarTableMention: true,
  readinessFlow: true,
  chatFirstStart: false,
  tableCaching: false,
  cacheOnConnectionAdd: true,   // the on-drop prompt POC was reviewed with — frozen
};

// Demo starts as Vision and takes POC's cleanups one at a time. Spreading
// VISION_SCOPE is the safety property: Demo can only differ where a pick is
// named here, so it can never drift from Vision by accident.
//
// Reviewed pick by pick on 2026-07-31. Deliberately left as Vision: data-browser
// tree rows (no column reveal — add to canvas and load the preview), the Add
// button and connection filter (both needed on the demo), browser and agent-panel
// collapse, the Clean/Code node menu (S10 needs Code), and free cross-connection
// adds (the script runs its own caching beat).
const DEMO_SCOPE: Scope = {
  ...VISION_SCOPE,
  modelLevelPreview: true,           // node-level vs whole-model preview
  columnsTab: false,                 // Canvas · Spreadsheet only
  browserCategoryTabs: false,        // no Business Apps / External sources tabs
  // browserConnectionFilter stays Vision's `true` — the demo needs the filter.
  databricksConnection: true,        // browser must agree with the narration
  clearSelectionOnSpreadsheet: true, // opening Spreadsheet is a context switch
  spreadsheetFullScreen: false,      // redundant — Spreadsheet is its own tab
  homeSetupEntryPoints: false,       // no connection/cache setup on the home screen
  nearStoreConnection: false,        // off-story clutter, stale label
  multiSelectJoinFlow: true,         // reference several cards, then "join these"
  borderedConnectionPill: true,      // reads as a control, not a label
  promptBarTableMention: true,       // `@` to name tables in the prompt
  readinessFlow: true,               // S15–S18: the three-layer readiness beat
  chatFirstStart: true,              // S1–S3: the model is created from the conversation
};

// POC V2 — the MVP cut. An exact duplicate of POC at 2026-08-06, so the cut that
// was reviewed stays frozen at `?v=poc` for reference while V2 changes. Every
// divergence gets named here, the same discipline DEMO_SCOPE follows.
//
// The 2026-08-06 review settled two things that land here rather than in Scope:
// the entry point is a CTA (no Data Studio home in MVP), and the published model
// view does not change. Both are surface work, not scope flags — see
// 2026-08-06-poc-scope.html.
const POC_V2_SCOPE: Scope = {
  ...POC_SCOPE,
  browserConnectionFilter: false,    // ...and no filter, since there is one connection
  flatTableBrowser: true,            // one connection, chosen before the canvas — flat list of its tables
  canvasCaching: false,              // single warehouse → nothing to bring over. Model cache (post-save) unaffected
  metricsPane: true,                 // Data / Metrics tabs share the left dock
  tableCaching: true,                // caching is raised at the join — 2026-08-12-caching-flow-spec.md
  cacheOnConnectionAdd: false,       // ...and therefore never on drop. Replaces POC's prompt
};

export const SCOPE_BY_VARIANT: Record<DataStudioVariant, Scope> = {
  vision: VISION_SCOPE,
  poc: POC_SCOPE,
  demo: DEMO_SCOPE,
  pocv2: POC_V2_SCOPE,
};

interface VariantContextValue {
  variant: DataStudioVariant;
  scope: Scope;
  setVariant: (v: DataStudioVariant) => void;
}

const VariantContext = createContext<VariantContextValue>({
  variant: 'vision',
  scope: VISION_SCOPE,
  setVariant: () => {},
});

const STORAGE_KEY = 'ds2-variant';
const isVariant = (v: unknown): v is DataStudioVariant =>
  v === 'vision' || v === 'poc' || v === 'demo' || v === 'pocv2';

// Initial value: ?v= URL param wins, then localStorage, then 'vision'.
// A LOCKED_VARIANT overrides all three.
function readInitialVariant(): DataStudioVariant {
  if (LOCKED_VARIANT) return LOCKED_VARIANT;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('v');
    if (isVariant(fromUrl)) return fromUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isVariant(stored)) return stored;
  } catch { /* SSR / storage blocked — fall through */ }
  return 'vision';
}

// Reflect the variant in the URL (?v=…) so each version is shareable + reload-safe.
function syncUrl(v: DataStudioVariant): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('v') !== v) {
      url.searchParams.set('v', v);
      window.history.replaceState({}, '', url.toString());
    }
  } catch { /* noop */ }
}

export const VariantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [variant, setVariantState] = useState<DataStudioVariant>(readInitialVariant);

  const setVariant = useCallback((v: DataStudioVariant) => {
    setVariantState(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* noop */ }
    syncUrl(v);
  }, []);

  // Ensure the URL carries ?v= from first render, even before any toggle.
  useEffect(() => { syncUrl(variant); }, [variant]);

  return (
    <VariantContext.Provider value={{ variant, scope: SCOPE_BY_VARIANT[variant], setVariant }}>
      {children}
    </VariantContext.Provider>
  );
};

export const useVariant = (): VariantContextValue => useContext(VariantContext);
// Convenience: read just the active scope config.
export const useScope = (): PocScope => useContext(VariantContext).scope;

// ── Header toggle — a small segmented control (Vision · POC · Demo) ──────────
export const VariantToggle: React.FC = () => {
  const { variant, setVariant } = useVariant();
  if (LOCKED_VARIANT) return null;
  const options: { value: DataStudioVariant; label: string }[] = [
    { value: 'vision', label: 'Vision' },
    { value: 'poc', label: 'POC' },
    { value: 'pocv2', label: 'POC V2' },
    { value: 'demo', label: 'Demo' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Data Studio experience"
      style={{ display: 'flex', alignItems: 'center', background: c['background-subtle'], borderRadius: 8, padding: 2, gap: 2 }}
    >
      {options.map(({ value, label }) => {
        const active = variant === value;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={active}
            onClick={() => setVariant(value)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: active ? c['background-base'] : 'transparent',
              color: active ? c['content-primary'] : '#777E8B',
              boxShadow: active ? '0 1px 2px rgba(25,35,49,0.12)' : 'none',
              transition: 'background 120ms, color 120ms',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
