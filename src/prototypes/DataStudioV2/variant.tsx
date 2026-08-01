import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ── Data Studio experience variant ──────────────────────────────────────────
// 'vision' = the full vision-level experience. 'poc' = the scoped-down POC.
// 'demo'  = the stakeholder demo cut: Vision plus selected POC cleanups, and the
//           only cut where the run-of-show script fires.
// One source of truth, read anywhere via useVariant(); toggled from the header.
export type DataStudioVariant = 'vision' | 'poc' | 'demo';

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
}

/** Kept as an alias so nothing that imported the old name breaks. */
export type PocScope = Scope;

const VISION_SCOPE: Scope = {
  modelLevelPreview: false,
  columnsTab: true,
  browserCategoryTabs: true,
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
};

const POC_SCOPE: Scope = {
  modelLevelPreview: true,
  columnsTab: false,
  browserCategoryTabs: false,
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

export const SCOPE_BY_VARIANT: Record<DataStudioVariant, Scope> = {
  vision: VISION_SCOPE,
  poc: POC_SCOPE,
  demo: DEMO_SCOPE,
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
  v === 'vision' || v === 'poc' || v === 'demo';

// Initial value: ?v= URL param wins, then localStorage, then 'vision'.
function readInitialVariant(): DataStudioVariant {
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
  const options: { value: DataStudioVariant; label: string }[] = [
    { value: 'vision', label: 'Vision' },
    { value: 'poc', label: 'POC' },
    { value: 'demo', label: 'Demo' },
  ];
  return (
    <div
      role="tablist"
      aria-label="Data Studio experience"
      style={{ display: 'flex', alignItems: 'center', background: '#EAEDF2', borderRadius: 8, padding: 2, gap: 2 }}
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
              background: active ? '#FFFFFF' : 'transparent',
              color: active ? '#1D232F' : '#777E8B',
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
