/**
 * Agent DB — domain types
 *
 * ThoughtSpot's data caching offering: cache model data queried live from
 * Snowflake into ThoughtSpot to cut live query cost.
 */

export type CacheWindow = 'full' | 'custom'; // "Full Model" | "Custom"
export type CacheStatus = 'not_cached' | 'cached' | 'refreshing' | 'purged';
export type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type WindowMonths = 1 | 3 | 6 | 13;
export type RunType = 'Scheduled' | 'Ad-hoc' | 'Config change';
export type RunStatus = 'In progress' | 'Success' | 'Failure';
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
}

export interface DataModel {
  id: string;
  name: string;
  description: string;
  source: 'Snowflake';
  tables: ModelTable[];
  cache?: CacheState; // undefined = never cached (shows CTA)
}

export interface Capacity {
  purchasedGB: number;
}
