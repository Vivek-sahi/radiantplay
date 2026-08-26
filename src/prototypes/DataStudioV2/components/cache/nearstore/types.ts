/**
 * Near Store — domain types
 *
 * ThoughtSpot's data caching offering: cache model data queried live from
 * the source into ThoughtSpot to cut live query cost.
 */

/**
 * Cache **scope** — "Full Model" | "Custom".
 *
 * ⚠️ Renamed from `CacheWindow` (2026-08-12). It was never a window: a window is a *duration*
 * (last 7 days), and this is whether every table is cached whole or configured one by one. The
 * two names collided once the duration list moved to `./windows.ts` to be shared
 * with Data Studio's canvas, and the collision was the tell that one of them was misnamed.
 */
export type CacheScope = 'full' | 'custom';
// 'paused' = cache snapshot exists but serving is paused (e.g. a model change was
// detected). Serving falls back to live until the cache is rebuilt.
export type CacheStatus = 'not_cached' | 'cached' | 'refreshing' | 'purged' | 'paused';
export type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly';
/**
 * Cache durations come from `./windows.ts` — **one list, shared with Data Studio's
 * canvas**, so a window chosen there reads identically here.
 *
 * ⚠️ This replaces `WindowMonths = 1 | 3 | 6 | 13`. Months-only was right when caching was purely
 * a cost optimisation over years of warehouse data, but the canvas caches to make a
 * cross-warehouse join possible at all, and there the first cache has to be fast — hours and days.
 * The MVP months (1 · 3 · 6 · 13) are all still in the shared list, so nothing here loses an option.
 */
import type { CacheWindow as SharedCacheWindow } from './windows';
export type { CacheWindow } from './windows';
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

/** Per-table config — only used when scope === 'custom'. */
export interface TableCacheSetting {
  tableId: string;
  mode: 'full_table' | 'window';
  /** Which duration, when `mode === 'window'`. Was `windowMonths: 1 | 3 | 6 | 13`. */
  cacheWindow?: SharedCacheWindow;
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
  window: CacheScope;
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
  reasonCode?: 'CACHING_DISABLED_ON_ORG' | 'UNSUPPORTED_CONNECTOR' | 'MISSING_CUSTOM_CALENDAR';
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
}

export interface Capacity {
  purchasedGB: number;
}
