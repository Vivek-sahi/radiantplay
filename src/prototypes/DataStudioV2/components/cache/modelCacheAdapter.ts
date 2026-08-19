import type {
  CacheRun, CacheState, Column, DataModel, ModelTable, Schedule, TableCacheSetting,
} from '../../../NearStore/types';
import type { CacheConfigDraft } from '../../../NearStore/components/CachingSettingsModal';
import type { DataObject } from '../../data/dataObjects';
import { tableMetadata } from '../../data/mockData';
import {
  CachePolicy, CacheWindow, Col, DEFAULT_JOIN_WINDOW, ModelCacheState,
  RefreshSetting, TableCacheChoice, classifyRole, estimateCache,
} from './cacheState';

/**
 * Adapter between our canvas's cache state and Near Store's model-caching components.
 *
 * Near Store's `CachingTab`, `CachingSettingsModal` and `RunHistoryModal` are used **as they
 * are** — imported, not copied — so the consolidated prototype has one implementation of
 * model-level caching rather than two that drift. `CachingTab`'s whole interface is
 * `{ model, onChange }`, so all the impedance sits in this one file.
 *
 * The two sides model the same domain slightly differently, and the mapping is where that shows:
 *
 * | Ours | Near Store's | Note |
 * |---|---|---|
 * | `ModelCacheState.status` | `CacheState.status` | `caching` → `refreshing`; `partial` → `cached`, because a cache does exist and the per-table rows say which tables |
 * | `CachePolicy.mode` | `CacheState.window` (a `CacheScope`) | `'window'` → `'custom'` |
 * | per-table `window` | `TableCacheSetting.cacheWindow` | Same shared `CacheWindow` type since 2026-08-12 |
 * | column **names** | `referenceColumnId` | We generate `ModelTable` columns with `id === name`, so the two agree without a lookup table |
 *
 * ⚠️ **Some fields have no source on our side** and are marked below: Near Store shows a cache
 * size, a next-run time and a run history, none of which our canvas produces. They are derived
 * where a defensible derivation exists and left blank where it doesn't — an invented "next run
 * on 20 May" would read as real scheduling.
 */

/** ~8,000 rows per MB, matching Near Store's own `computeStats`. */
const ROWS_PER_MB = 8_000;

const parseHour = (label: string): number => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!m) return 9;
  const h = Number(m[1]) % 12;
  return /pm/i.test(m[3]) ? h + 12 : h;
};

const toSchedule = (refresh: RefreshSetting): Schedule => ({
  frequency: refresh.freq,
  hour: parseHour(refresh.hour),
  minute: 0,
  // Near Store offers weekend exclusion and weekday/month-day pickers; the canvas's modal has
  // only a frequency, so these start at their neutral values and are editable on the tab.
  excludeWeekends: false,
  timezone: 'Asia/Calcutta',
});

const HOUR_LABEL = (hour: number): string => {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
};

/** The other direction, so a schedule set in the modal survives as our `RefreshSetting`. */
const fromSchedule = (s: Schedule): RefreshSetting => ({
  freq: s.frequency,
  hour: HOUR_LABEL(s.hour),
});

const columnsOf = (tableName: string) => {
  const meta = tableMetadata[tableName];
  // `id === name` on purpose — Near Store keys the reference column by id, we carry names, and
  // making them the same value removes a lookup that could disagree with itself.
  return (meta?.columns ?? []).map(col => ({
    id: col.name,
    name: col.name,
    type: (col.type === 'number' || col.type === 'date' || col.type === 'boolean')
      ? col.type
      : 'string' as const,
  }));
};

/**
 * Our model, in the shape Near Store's caching components read.
 *
 * `cache` is undefined when the canvas never cached anything — which is what makes the tab show
 * its "Cache {model}" call to action rather than an empty settings block.
 */
export const toNearStoreModel = (
  object: DataObject,
  cache: ModelCacheState | undefined,
): DataModel => {
  const tables: ModelTable[] = (cache?.tables ?? []).map(t => ({
    id: t.name,
    name: t.name,
    rowCount: tableMetadata[t.name]?.rowCount ?? 0,
    columns: columnsOf(t.name),
  }));

  return {
    id: object.id,
    name: object.name,
    description: '',
    // Near Store's field is a single connector identity. A multi-source model has several, and
    // saying so is the point — it is why this model can never fall back to live.
    source: cache && cache.sources.length > 1
      ? `${cache.sources.length} sources`
      : (cache?.sources[0] ?? object.source),
    tables,
    tags: object.tags,
    lastModified: object.lastModified,
    cache: cache && cache.status !== 'none' ? toCacheState(cache) : undefined,
  };
};

// ── The canvas's own tables, in the shape the caching dialog reads ────────────

/**
 * Map our `[name, TYPE]` column pairs onto Near Store's typed columns.
 *
 * The `date` mapping is the load-bearing one: `CachingSettingsModal` disables **Time window**
 * for a table with no date column, which is exactly the rule the canvas already had ("a table
 * with no date column can't be windowed, so it caches whole"). One rule, now enforced by the
 * control rather than by prose next to it.
 */
const DATE_TYPES = ['DATE', 'TIMESTAMP', 'DATETIME'];
const NUMBER_TYPES = ['INT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMBER', 'NUMERIC'];

const toColumns = (cols: Col[]): Column[] => cols.map(([name, type]) => {
  const t = (type ?? '').toUpperCase();
  return {
    id: name,
    name,
    type: DATE_TYPES.includes(t) ? 'date'
      : NUMBER_TYPES.includes(t) ? 'number'
        : t === 'BOOL' || t === 'BOOLEAN' ? 'boolean'
          : 'string',
  };
});

export interface CanvasCacheTable {
  name: string;
  cols: Col[];
  rowCount?: number;
}

/**
 * The tables on the canvas, as a `DataModel` — so Near Store's `CachingSettingsModal` can be
 * the **one** caching dialog in the product.
 *
 * It was two: this canvas had its own `TableCacheModal` for the cache that unblocks a join, and
 * Near Store had this one for the cache that speeds a saved model up. Both ask the same three
 * things — scope, per-table window, refresh schedule — so the second one was a reimplementation
 * with different words for the same choices, and a user meeting both would have no reason to
 * believe they were the same feature. Removed 2026-08-12.
 */
export const canvasCacheModel = (
  modelName: string,
  tables: CanvasCacheTable[],
): DataModel => ({
  id: 'canvas-model',
  name: modelName,
  description: '',
  source: '',
  tables: tables.map(t => ({
    id: t.name,
    name: t.name,
    rowCount: t.rowCount ?? tableMetadata[t.name]?.rowCount ?? 0,
    columns: toColumns(t.cols),
  })),
  tags: [],
  lastModified: '',
});

/**
 * What the dialog returns, in the canvas's own terms.
 *
 * `role` is computed here rather than collected: see `TableCacheChoice`. Under a **Full model**
 * scope every table caches whole, which is why the per-table settings are only read in `custom`.
 */
export const draftToCanvasCache = (
  draft: CacheConfigDraft,
  tables: CanvasCacheTable[],
): { policy: CachePolicy; choices: Record<string, TableCacheChoice> } => {
  const full = draft.window === 'full';
  const choices: Record<string, TableCacheChoice> = {};

  for (const t of tables) {
    const s = draft.tableSettings.find(x => x.tableId === t.name);
    const windowed = !full && s?.mode === 'window';
    const window: CacheWindow = windowed ? (s?.cacheWindow ?? DEFAULT_JOIN_WINDOW) : 'full';
    choices[t.name] = {
      window,
      refColumn: windowed ? s?.referenceColumnId : undefined,
      role: classifyRole(t.rowCount ?? tableMetadata[t.name]?.rowCount, t.cols),
    };
  }

  return {
    policy: {
      mode: full ? 'full' : 'window',
      // The model's period is the window its windowed tables share — tables set to All history
      // don't contribute one.
      window: full ? undefined : Object.values(choices).find(c => c.window !== 'full')?.window,
      refresh: fromSchedule(draft.schedule),
    },
    choices,
  };
};

/** The dialog's own draft shape, seeded from a policy the model already has. */
export const policyToDraft = (
  policy: CachePolicy | null,
  tables: CanvasCacheTable[],
  choices?: Record<string, TableCacheChoice>,
): CacheConfigDraft | undefined => {
  if (!policy) return undefined;
  return {
    window: policy.mode === 'full' ? 'full' : 'custom',
    schedule: toSchedule(policy.refresh),
    tableSettings: tables.map((t): TableCacheSetting => {
      const window = choices?.[t.name]?.window ?? (policy.mode === 'full' ? 'full' : policy.window);
      return window && window !== 'full'
        ? {
          tableId: t.name,
          mode: 'window',
          cacheWindow: window,
          referenceColumnId: choices?.[t.name]?.refColumn ?? toColumns(t.cols).find(c => c.type === 'date')?.id,
        }
        : { tableId: t.name, mode: 'full_table' };
    }),
  };
};

const toCacheState = (cache: ModelCacheState): CacheState => {
  const windowed = cache.tables.filter(t => t.window !== 'full');
  const tableSettings: TableCacheSetting[] = cache.tables.map(t => ({
    tableId: t.name,
    mode: t.window === 'full' ? 'full_table' : 'window',
    cacheWindow: t.window === 'full' ? undefined : t.window,
    referenceColumnId: t.window === 'full' ? undefined : t.refColumn,
  }));

  let rows = 0;
  let sizeMB = 0;
  for (const t of cache.tables) {
    const rowCount = tableMetadata[t.name]?.rowCount;
    const est = estimateCache(rowCount, columnsOf(t.name).length || 1, t.window);
    const r = est?.rows ?? rowCount ?? 0;
    rows += r;
    sizeMB += Math.max(1, Math.round(r / ROWS_PER_MB));
  }

  const refreshing = cache.status === 'caching';

  return {
    // 'partial' maps to 'cached': a snapshot genuinely exists, and which tables it covers is
    // what the per-table rows below are for.
    status: refreshing ? 'refreshing' : 'cached',
    window: cache.policy?.mode === 'window' || windowed.length > 0 ? 'custom' : 'full',
    tableSettings,
    schedule: toSchedule(cache.policy?.refresh ?? { freq: 'daily', hour: '9:00 AM' }),
    cacheSizeMB: sizeMB,
    rowCount: rows,
    // ⚠️ No scheduler exists in the prototype, so there is no next run to name. Near Store
    // renders this as a display string, and the honest one is a dash.
    nextRunAt: '—',
    lastRunStatus: refreshing ? 'In progress' : 'Success',
    runs: toRuns(cache, rows),
  };
};

/**
 * One run, describing the cache the canvas actually performed — so Run history reflects
 * something that happened rather than a fabricated schedule of past runs.
 */
const toRuns = (cache: ModelCacheState, rows: number): CacheRun[] => {
  if (cache.status === 'none') return [];
  const inProgress = cache.status === 'caching';
  return [{
    id: 'canvas-run-1',
    runType: 'Config change',
    startTime: 'Just now',
    endTime: inProgress ? undefined : 'Just now',
    rows,
    status: inProgress ? 'In progress' : 'Success',
    tableResults: cache.tables.map(t => {
      const rowCount = tableMetadata[t.name]?.rowCount;
      const est = estimateCache(rowCount, columnsOf(t.name).length || 1, t.window);
      const r = est?.rows ?? rowCount ?? 0;
      return {
        tableId: t.name,
        status: (t.state === 'caching' ? 'In progress' : 'Success') as CacheRun['status'],
        rows: r,
        sizeMB: Math.max(1, Math.round(r / ROWS_PER_MB)),
        durationSec: Math.max(1, Math.round(est?.seconds ?? 1)),
        windowApplied: t.window === 'full' ? 'All history' : t.window,
      };
    }),
  }];
};

/**
 * The other direction — settings edited on the Caching tab written back into our state, so the
 * canvas's badges and the model listing agree with what the tab now says.
 *
 * Only the facts our side owns are read back: per-table windows, reference columns, and the
 * policy. Near Store's run history and size figures are derived, so there is nothing to store.
 */
export const fromNearStoreModel = (
  next: DataModel,
  previous: ModelCacheState,
): ModelCacheState => {
  const settings = next.cache?.tableSettings ?? [];
  const scopeIsFull = next.cache?.window === 'full';

  const tables = previous.tables.map(t => {
    const s = settings.find(x => x.tableId === t.name);
    const window: CacheWindow = scopeIsFull || !s || s.mode === 'full_table'
      ? 'full'
      : (s.cacheWindow ?? t.window);
    return {
      ...t,
      window,
      refColumn: window === 'full' ? undefined : (s?.referenceColumnId ?? t.refColumn),
      // A table configured on this tab has a cache by definition — the tab only exists for a
      // model that has one.
      state: t.state === 'caching' ? t.state : ('cached' as const),
    };
  });

  const policy: CachePolicy = {
    mode: scopeIsFull ? 'full' : 'window',
    window: tables.find(t => t.window !== 'full')?.window,
    refresh: previous.policy?.refresh ?? { freq: 'daily', hour: '9:00 AM' },
  };

  const cachedCount = tables.filter(t => t.state === 'cached').length;
  return {
    ...previous,
    tables,
    policy,
    cachedCount,
    status: tables.some(t => t.state === 'caching') ? 'caching'
      : cachedCount === 0 ? 'none'
        : cachedCount === tables.length ? 'cached' : 'partial',
  };
};
