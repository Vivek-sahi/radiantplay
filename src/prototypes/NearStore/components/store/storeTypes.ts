/**
 * AgentDB Store — types
 *
 * The second product on the data store: load warehouse tables into AgentDB on a
 * schedule. Pulse (caching a whole model) is a separate prototype and is frozen —
 * nothing here imports from `src/prototypes/NearStore/`.
 */

/** A warehouse connection. Store connections are created fresh — an existing
 *  live connection can't be reused, which is why they list separately. */
export interface Connection {
  id: string;
  name: string;
  /** Connector key, e.g. 'snowflake'. Drives the mark shown beside the name. */
  source: string;
  /** Display name of the connector, e.g. 'Snowflake'. */
  sourceName: string;
  tags: string[];
  csvUpload: 'Enabled' | 'Disabled';
  policy: string;
  modified: string;
  author: string;
  /** Tables reachable through this connection that have been brought in. */
  tableCount: number;
  /** Set on connections created by automation — shown as a caution line. */
  note?: string;
}

/** A table that has been loaded into AgentDB, plus the sync that maintains it.
 *  Deliberately one object here: splitting sync from table is a design question
 *  the kickoff raises, not something the mock has decided. */
export type SyncStatus = 'Success' | 'In progress' | 'Error' | 'Paused';

export interface StoreTable {
  id: string;
  name: string;
  /** Where it lives in AgentDB. Not a warehouse path — their pipeline writes the
   *  table here and we do not know what it was upstream. */
  path: string;
  /** The ETL platform that wrote it, if the write is attributable to a service
   *  account. ⚠️ Open with engineering — if writes are anonymous this is unknown. */
  writtenBy?: string;
  connectionId: string;
  sizeMB: number;
  rows: number;
  lastRefresh: string;
  status: SyncStatus;
  /** Human-readable schedule, e.g. 'Hourly'. */
  schedule: string;
  owner: string;
  incremental: boolean;
  columns: TableColumnMapping[];
}

/** One column's journey from source to AgentDB. `sync: false` means it isn't
 *  copied at all — the only mapping decision the kickoff argues must stay at
 *  load time, because you cannot model a column you didn't copy. */
export interface TableColumnMapping {
  source: string;
  sourceType: string;
  sample: string;
  target: string;
  targetType: string;
  sync: boolean;
  primaryKey: boolean;
}

export interface SyncRun {
  id: string;
  tableId: string;
  tableName: string;
  when: string;
  by: string;
  rows: number;
  duration: string;
  status: SyncStatus;
  note?: string;
}

/** The extract wizard's working state, carried across its three steps. */
export interface ExtractDraft {
  connectionId: string;
  mode: 'tables' | 'sql';
  selectedTables: string[];
  sql: string;
  /** Per-table column mappings, keyed by source table name. */
  mappings: Record<string, TableColumnMapping[]>;
  frequency: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Manual';
  startAt: string;
  days: string[];
  incremental: boolean;
  watermarkColumn: string;
  alerts: string;
}
