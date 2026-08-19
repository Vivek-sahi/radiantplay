/**
 * Cache state — the types and the pure logic behind the caching flow.
 *
 * Spec: `2026-08-12-caching-flow-spec.md`. Deliberately React-free and dependency-free
 * (nothing imported from `ModelCanvas.tsx`, which is 8,000+ lines): every function takes the
 * data it needs as an argument, so this is the one part of the flow that can be reasoned
 * about — and later tested — on its own.
 *
 * Caching, in one line: **bringing tables from other warehouses into ThoughtSpot's warehouse
 * and refreshing them on a frequency.** Required because we don't support federated query.
 * The benefit is that live queries stop, which saves money.
 */

import { NATIVE_TABLES, isInThoughtSpot } from '../../data/tableConnections';
import { CacheWindow, WINDOW_SHORT, windowFraction } from '../../../_shared/caching/windows';

// ── Window ────────────────────────────────────────────────────────────────────

/**
 * The window list lives in `_shared/caching/windows.ts` — **one definition, both prototypes.**
 *
 * Not duplicated here, because a list defined twice is a list that drifts, and the point of
 * consolidating with Near Store is that a window set on the canvas reads identically on the
 * model's Caching tab. Re-exported so callers in this prototype have one import.
 */
export type { CacheWindow };
export {
  WINDOW_OPTIONS, WINDOW_LABEL, WINDOW_SHORT, WINDOW_HOURS,
  DEFAULT_JOIN_WINDOW, DEFAULT_MODEL_WINDOW, windowFraction,
} from '../../../_shared/caching/windows';

// ── Refresh ───────────────────────────────────────────────────────────────────

export interface RefreshSetting {
  /**
   * Matches Near Store's `Frequency` exactly. Widened from `hourly | daily | weekly` on
   * 2026-08-12 when its `CachingSettingsModal` became the one caching dialog: a frequency the
   * user can pick there but we can't store would round-trip into something they didn't choose.
   */
  freq: 'hourly' | 'daily' | 'weekly' | 'monthly';
  /** Ignored when `freq` is hourly. */
  hour: string;
}

export const DEFAULT_REFRESH: RefreshSetting = { freq: 'daily', hour: '9:00 AM' };

const FREQ_LABEL: Record<RefreshSetting['freq'], string> = {
  hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
};

export const describeRefresh = (r: RefreshSetting): string =>
  r.freq === 'hourly' ? 'Hourly' : `${FREQ_LABEL[r.freq]} · ${r.hour}`;

// ── Residency ─────────────────────────────────────────────────────────────────

export type CacheRole = 'fact' | 'dimension';

/**
 * Where a table's data actually is. Three real states plus the two transitional ones —
 * see flow spec §2 on why "cached" was never a boolean.
 */
export type Residency =
  /** In its source warehouse, queried on demand. */
  | { kind: 'live' }
  /** Being brought over right now. */
  | { kind: 'caching'; startedAt: number }
  /** A copy lives in our store. `window: 'full'` for dimensions. */
  | { kind: 'cached'; window: CacheWindow; refColumn?: string; role: CacheRole; refresh: RefreshSetting }
  /** Our store *is* its home — CSV, Python output, or a table already in ThoughtSpot. */
  | { kind: 'native'; origin: 'csv' | 'python' | 'thoughtspot' }
  | { kind: 'failed'; reason: string };

/** What a table's residency is the moment it lands on the canvas. */
export const initialResidency = (
  table: string,
  sourceKind: 'warehouse' | 'csv' | 'python' = 'warehouse',
): Residency => {
  if (sourceKind === 'csv') return { kind: 'native', origin: 'csv' };
  if (sourceKind === 'python') return { kind: 'native', origin: 'python' };
  const native = NATIVE_TABLES[table];
  if (native) return { kind: 'native', origin: native };
  if (isInThoughtSpot(table)) return { kind: 'native', origin: 'thoughtspot' };
  return { kind: 'live' };
};

export const holdsCache = (r: Residency | undefined): boolean =>
  r?.kind === 'cached' || r?.kind === 'native';

/**
 * What the caching dialog settled on, per table.
 *
 * ⚠️ `role` is **derived, never asked.** Fact-vs-dimension was a per-table dropdown until
 * 2026-08-12; it went because the dialog now asks the question it was standing in for — All
 * history or a time window — directly, per table. A guess the user has to confirm before
 * reaching the real control is a question about our implementation, not about their data. It
 * stays as a computed field because the model summary still reports it.
 */
export interface TableCacheChoice {
  window: CacheWindow;
  refColumn?: string;
  role: CacheRole;
}

/**
 * Badge text for a card. Returns null where the card should carry **no** badge — a native
 * table's source mark (the real CSV or Python logo) already says where it lives, so a badge
 * would be repeating it. See flow spec §2.
 */
export const residencyBadge = (r: Residency | undefined): string | null => {
  switch (r?.kind) {
    case 'cached': return r.window === 'full' ? 'Cached' : `Cached · ${WINDOW_SHORT[r.window]}`;
    case 'caching': return 'Caching…';
    case 'failed': return 'Cache failed';
    default: return null; // live and native both carry nothing
  }
};

// ── Model-level policy ────────────────────────────────────────────────────────

/**
 * The model's cache scope. `'full'` is portable — it has no parameters, so it means the same
 * thing for any future table and can propagate silently. A window is only *half* portable:
 * the duration travels, the reference column can't, because it doesn't exist until the table
 * does. Flow spec §4.
 */
export interface CachePolicy {
  mode: 'full' | 'window';
  /** Set when `mode` is `'window'`. Facts share one window so the model's period is sayable. */
  window?: CacheWindow;
  refresh: RefreshSetting;
}

/**
 * What a new table joining an existing model still needs asked.
 *
 * Under a full policy: nothing, ever. Under a windowed policy: nothing for a dimension
 * (dimensions cache whole and need no reference column), and exactly **one** question for a
 * fact — which date column. That's small enough to sit inline on the pending join edge
 * rather than reopening the modal.
 */
export const inheritedGap = (
  policy: CachePolicy | null,
  role: CacheRole,
): 'none' | 'ref-column' | 'full-modal' => {
  if (!policy) return 'full-modal';
  if (policy.mode === 'full') return 'none';
  return role === 'fact' ? 'ref-column' : 'none';
};

// ── Model-level summary — the bridge to other surfaces ────────────────────────

/**
 * What a model's cache looks like from outside the canvas.
 *
 * The canvas holds the truth per table (`residency`) and per model (`CachePolicy`), but both
 * live inside `ModelCanvas`, which unmounts the moment you navigate away. The model listing and
 * the model's Caching tab need the same facts — so this is the shape they read, and
 * `summariseModelCache` is the only thing that produces it.
 *
 * One summariser rather than each surface deriving its own: the listing saying "Cached" while
 * the Caching tab shows two of five tables filling is the kind of disagreement nobody catches
 * until a demo.
 */
export interface ModelCacheTable {
  name: string;
  /** `'full'` = All history. */
  window: CacheWindow;
  refColumn?: string;
  role?: CacheRole;
  /** Connection id, or null where the table has no source connection. */
  connection: string | null;
  state: Residency['kind'];
}

export interface ModelCacheState {
  tables: ModelCacheTable[];
  policy: CachePolicy | null;
  /**
   * Distinct source connections the model draws from.
   *
   * ⚠️ **More than one means no live fallback exists**, because live is exactly what cannot
   * join across warehouses. Near Store's single-source cache can always fall back to the
   * warehouse for data outside the window; a multi-source model cannot, so the window *is* its
   * scope and it can never be shown as "Live". Flow spec §9.
   */
  sources: string[];
  /** What a consumer sees on the listing. */
  status: 'none' | 'caching' | 'partial' | 'cached';
  cachedCount: number;
}

/** True only where data outside the cache window can still be queried from the source. */
export const canFallBackToLive = (s: ModelCacheState): boolean => s.sources.length <= 1;

/** The minimum a caller has to hand over — deliberately not `CanvasGroup`, to stay React- and
 *  ModelCanvas-free. */
export interface SummariseInput {
  tableName: string;
  connection?: string | null;
  residency?: Residency;
}

export const summariseModelCache = (
  groups: SummariseInput[],
  policy: CachePolicy | null,
): ModelCacheState => {
  const tables: ModelCacheTable[] = groups.map(g => ({
    name: g.tableName,
    window: g.residency?.kind === 'cached' ? g.residency.window : 'full',
    refColumn: g.residency?.kind === 'cached' ? g.residency.refColumn : undefined,
    role: g.residency?.kind === 'cached' ? g.residency.role : undefined,
    connection: g.connection ?? null,
    state: g.residency?.kind ?? 'live',
  }));

  const sources = [...new Set(groups.map(g => g.connection).filter((c): c is string => !!c))];
  const cachedCount = tables.filter(t => t.state === 'cached').length;
  const filling = tables.some(t => t.state === 'caching');

  // Order matters: a fill in progress outranks a partial count, because "caching" is a
  // transient the user is watching and "partial" is a resting state they have to act on.
  const status: ModelCacheState['status'] =
    filling ? 'caching'
      : cachedCount === 0 ? 'none'
        : cachedCount === tables.length ? 'cached'
          : 'partial';

  return { tables, policy, sources, status, cachedCount };
};

// ── Classification and detection ──────────────────────────────────────────────

export type Col = [string, string];

/**
 * Rows above which a table is treated as a fact. Caching happens before joins exist, so
 * classification can't use join position — row count plus "has a usable date column" is what
 * we have. The modal shows the guess and lets it be corrected, which is the real safety net.
 *
 * ⚠️ Every table in `tableMetadata` is currently 45–1,240 rows, so **everything classifies as
 * a dimension today** and nothing would ever get a window. That's a mock-data gap, not a
 * logic gap — see flow spec §7.7.
 */
export const FACT_ROW_THRESHOLD = 500_000;

const DATE_TYPES = ['DATE', 'TIMESTAMP', 'DATETIME'];

/** Column names that read as *when the thing happened*, rather than an audit stamp. */
const EVENT_DATE_HINTS = [
  'order_date', 'event_date', 'created_date', 'call_date', 'reported_date', 'submitted_at',
  'response_date', 'qbr_date', 'renewal_date', 'signup_date', 'created_at', 'created', 'ts',
  'timestamp', 'date',
];

export const dateColumns = (cols: Col[]): string[] =>
  cols.filter(([, type]) => DATE_TYPES.includes(type.toUpperCase())).map(([name]) => name);

/**
 * The reference column a window filters on. Prefers an event-shaped name over any other date
 * column, so `order_date` wins over `updated_at`. Returns undefined when the table has no
 * date column at all — which is fine, because such a table can't be windowed and therefore
 * has to cache full.
 */
export const detectRefColumn = (cols: Col[]): string | undefined => {
  const dates = dateColumns(cols);
  if (!dates.length) return undefined;
  for (const hint of EVENT_DATE_HINTS) {
    const hit = dates.find(d => d.toLowerCase() === hint);
    if (hit) return hit;
  }
  const partial = dates.find(d => EVENT_DATE_HINTS.some(h => d.toLowerCase().includes(h)));
  return partial ?? dates[0];
};

/**
 * Fact or dimension, from column statistics only.
 *
 * A table with no date column is classified as a dimension regardless of size: it cannot be
 * windowed, so it has to cache full, and calling it a fact would only produce a window
 * control with nothing to filter on.
 */
export const classifyRole = (rowCount: number | undefined, cols: Col[]): CacheRole => {
  if (!detectRefColumn(cols)) return 'dimension';
  if (rowCount === undefined) return 'dimension';
  return rowCount >= FACT_ROW_THRESHOLD ? 'fact' : 'dimension';
};

// ── Estimates ─────────────────────────────────────────────────────────────────

/**
 * Assumed span of history in a table, used to turn a window into a row count. Real stats
 * would give the actual min/max of the reference column — this is the stand-in, and it is
 * the reason `estimateCache` returns null rather than a number when it has nothing to go on.
 *
 * ⚠️ Blocking question #3 to the modeling team is whether column statistics exist pre-cache.
 * If they don't, **the readout is omitted, not invented** — a fake estimate is worse than
 * none, because the whole point of showing it is to make the window choice meaningful.
 */
const ASSUMED_SPAN_HOURS = 365 * 24;

/** Tableau Hyper benchmark: ~1M rows ≈ 4s on laptop-class hardware. */
const ROWS_PER_SECOND = 250_000;
/** ~8 bytes per column per row, from Hyper's 25GB / 500M rows on a 60-column table. */
const BYTES_PER_COL_ROW = 8;

export interface CacheEstimate {
  rows: number;
  gb: number;
  seconds: number;
}

export const estimateCache = (
  rowCount: number | undefined,
  colCount: number,
  window: CacheWindow,
): CacheEstimate | null => {
  if (rowCount === undefined) return null;
  const rows = Math.max(1, Math.round(rowCount * windowFraction(window, ASSUMED_SPAN_HOURS)));
  return {
    rows,
    gb: (rows * colCount * BYTES_PER_COL_ROW) / 1e9,
    seconds: Math.max(1, rows / ROWS_PER_SECOND),
  };
};

export const formatRows = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`
    : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`
      : `${n}`;

export const formatDuration = (seconds: number): string =>
  seconds < 60 ? `${Math.round(seconds)} sec`
    : seconds < 3600 ? `${Math.round(seconds / 60)} min`
      : `${(seconds / 3600).toFixed(1)} hr`;

/** `≈ 500K rows · 0.4 GB · est. 2 sec` — the readout that makes a window choice mean something. */
export const describeEstimate = (e: CacheEstimate | null): string | null =>
  e && `≈ ${formatRows(e.rows)} rows · ${e.gb < 0.1 ? '<0.1' : e.gb.toFixed(1)} GB · est. ${formatDuration(e.seconds)}`;

/**
 * Above this, an *inherited* full-cache policy stops being silent and asks.
 *
 * "Apply to all future tables" is decided when the model is cheap and fires when it may not
 * be: five 50K-row dimensions set the policy, then a 300M-row fact table joins in and starts
 * a ~45-minute cache under a decision made when caching took two seconds. This is the one
 * interruption that is earned *against* an explicit user preference. Flow spec §4.
 */
export const CIRCUIT_BREAKER_SECONDS = 120;

/**
 * How long a cache run takes in the prototype, total, regardless of how many tables are in it.
 *
 * Long on purpose. Real caching spans three orders of magnitude (seconds to tens of minutes)
 * and our mock tables are 45–1,240 rows, so the number can't be derived from anything — it has
 * to be *chosen*, and the thing worth choosing for is testing what the canvas allows while a
 * cache is in flight. At 1.6s a table there was no window in which to try anything.
 *
 * A total rather than a per-table figure so the window stays the same whether the run is one
 * table or five — otherwise every extra table would change what there is time to test.
 */
export const CACHE_RUN_TOTAL_MS = 30_000;

export const perTableMs = (tableCount: number): number =>
  Math.max(1, Math.round(CACHE_RUN_TOTAL_MS / Math.max(1, tableCount)));

export const breaksCircuit = (e: CacheEstimate | null): boolean =>
  !!e && e.seconds > CIRCUIT_BREAKER_SECONDS;
