/**
 * Data Cache — domain types
 *
 * ThoughtSpot's data caching offering: cache model data queried live from
 * the source into ThoughtSpot to cut live query cost. The caching workflow
 * types are the Pulse ones, unchanged. The PLG additions are at the end:
 * per-model warehouse usage, the plan's free allowance, and the org.
 */

export type CacheWindow = 'full' | 'custom'; // "Full Model" | "Custom"
// 'paused' = cache snapshot exists but serving is paused (e.g. a model change was
// detected). Serving falls back to live until the cache is rebuilt.
export type CacheStatus = 'not_cached' | 'cached' | 'refreshing' | 'purged' | 'paused';
export type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type WindowMonths = 1 | 3 | 6 | 13;
export type RunType = 'Scheduled' | 'Ad-hoc' | 'Config change' | 'Purge' | 'Model update';
export type RunStatus = 'In progress' | 'Success' | 'Error';
export type ColumnType = 'string' | 'number' | 'date' | 'boolean';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
}

export interface ModelTable {
  id: string;
  name: string;
  rowCount: number;
  columns: Column[];
}

/** Per-table config — only used when window === 'custom'. */
export interface TableCacheSetting {
  tableId: string;
  mode: 'full_table' | 'window';
  windowMonths?: WindowMonths; // when mode === 'window'
  referenceColumnId?: string; // required when mode === 'window'
}

export type Weekday = 'M' | 'T' | 'W' | 'Th' | 'F' | 'Sa' | 'S';

export interface Schedule {
  frequency: Frequency;
  hour: number; // 0-23
  minute: number; // 0-59
  excludeWeekends: boolean; // daily only
  weekdays?: Weekday[]; // weekly only
  monthDays?: string; // monthly only — comma-separated day numbers, e.g. "1,10,20"
  timezone: string; // e.g. 'Asia/Calcutta'
}

/** Per-table outcome inside a single run (powers the run-detail view). */
export interface TableRunResult {
  tableId: string;
  status: RunStatus;
  rows: number;
  sizeMB: number;
  durationSec: number;
  windowApplied: string; // 'Full table' | 'Last 13 months'
  note?: string;
}

export interface CacheRun {
  id: string;
  runType: RunType;
  startTime: string; // display string, e.g. '2 days ago' | '10 May 2026'
  endTime?: string;
  rows?: number;
  status: RunStatus;
  tableResults: TableRunResult[];
}

/** Cache-utilisation stats (the Analytics block on the Caching tab). */
export interface CacheAnalytics {
  totalQueries: number;
  cachedQueries: number; // served from the cache
  liveQueries: number; // fell through to a live source query
  basedOn: string; // display string, e.g. '15 May 2026, 9:00 AM'
}

export interface CacheState {
  status: CacheStatus;
  window: CacheWindow;
  tableSettings?: TableCacheSetting[]; // when window === 'custom'
  schedule: Schedule;
  cacheSizeMB: number;
  rowCount: number;
  nextRunAt: string; // display string, e.g. '20 May 2026'
  lastRunStatus: RunStatus; // drives the prominent banner
  runs: CacheRun[]; // newest first
  analytics?: CacheAnalytics; // cache hit/miss stats, when available
}

export interface ModelAuthor {
  name: string;
  imageUrl?: string;
}

/**
 * Cacheability check (from the Cacheability API). When `cacheable` is false, the
 * Caching tab shows a "can't be cached" empty state and surfaces `reason`.
 */
export interface Cacheability {
  cacheable: boolean;
  reasonCode?:
    | 'CACHING_DISABLED_ON_ORG'
    | 'UNSUPPORTED_CONNECTOR'
    | 'MISSING_CUSTOM_CALENDAR'
    | 'OAUTH_CONNECTION'
    | 'PASSTHROUGH_SQL';
  reason?: string;
}

export interface DataModel {
  id: string;
  name: string;
  description: string;
  source: string; // connector identity, e.g. 'Snowflake'
  tables: ModelTable[];
  cache?: CacheState; // undefined = never cached (shows CTA)
  cacheability?: Cacheability; // undefined = cacheable; { cacheable: false } = blocked
  tags?: string[];
  author?: ModelAuthor;
  lastModified?: string;
  usage?: ModelUsage; // warehouse load this model puts on the source, last 30 days
  estimate?: EstimateInputs; // the user's own numbers for the calculator, when edited
}

/** The calculator's inputs on a model's Caching tab. Defaults come from `usage`. */
export interface EstimateInputs {
  queriesPerMonth: number;
  avgQuerySeconds: number;
  hitPct: number; // share of queries served from cache, 0-100
  ratePerQuery: number; // $ per warehouse query
}

// ── PLG additions ─────────────────────────────────────────────────────────────

/** What a model costs the customer today: its warehouse load over the last 30 days. */
export interface ModelUsage {
  warehouseQueries30d: number;
  avgQuerySeconds: number; // average execution time per warehouse query
  users30d: number;
}

/** The free allowance included in the plan, per month. LaunchDarkly-configurable in the product. */
export interface Plan {
  freeHours: number; // query hours
  freeGB: number; // storage
}

/**
 * The customer org behind a scenario. The headline figures are org-wide (the
 * product sees every model); the `models` list is the sample the prototype
 * renders, so counts in copy come from here, not from `models.length`.
 */
export interface Org {
  id: string;
  name: string;
  activeModels: number;
  cacheableModels: number;
  /** Cacheable models above the per-model bar (each saves at least $1,000 a year). */
  eligibleModels: number;
  warehouseQueries30d: number;
  warehouseHours30d: number;
  cacheableHours30d: number; // query hours if every cacheable model were cached
  connections: number;
  /** Share of warehouse queries the eligible models generate, 0-100. */
  volumeShare: number;
  /** Org-wide estimated yearly saving if the eligible models were cached, at the ceiling. */
  savingPerYear: number;
  /** Above the org-wide threshold the page talks in dollars; below it, queries and percentages only. */
  aboveThreshold: boolean;
  models: DataModel[];
}
