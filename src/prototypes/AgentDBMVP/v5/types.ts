// AgentDB console · v3 (14 Oct 2026). Built on v1, following the design document
// (~/agentdb-data-store/how-agentdb-works.html) and the PM's consolidated list.
// Several databases per customer, objects of three kinds, loads per table, identities typed by door.

import type { Role } from '../types';

export type { Role };

export type V3Page = 'data' | 'sql' | 'activity' | 'connect' | 'keys' | 'access';

/** Prototype control: a brand-new customer, or Acme Retail six weeks in. */
export type AppState = 'empty' | 'filled';

export type ObjectKind = 'table' | 'view' | 'materialized view';

export interface Column {
  name: string;
  /** Plain-English type from the fixed list (see ../tableSchema) */
  type: string;
}

export interface Database {
  id: string;
  name: string;
  createdBy: string;
  createdOn: string;
}

export interface DbObject {
  id: string;
  database: string;
  name: string;
  kind: ObjectKind;
  columns: Column[];
  rows: number;
  sizeGB: number;
  /** The database's own last-change time. '—' when nothing has arrived. */
  lastUpdated: string;
  createdBy: string;
  createdOn: string;
  /** Views and materialised views: the query they are built from. */
  definition?: string;
  /** Materialised views: how the stored result is refreshed. */
  refresh?: string;
}

export type LoadStatus = 'Completed' | 'Failed';

/** One stream load into one table, as the database recorded it (if recording is on; open with engineering). */
export interface LoadRecord {
  id: string;
  time: string;
  identity: string;
  database: string;
  table: string;
  label: string;
  rows: number;
  bytes: string;
  durationMs: number;
  status: LoadStatus;
  error?: string;
}

/** The two kinds of tool identity, by door. */
export type IdentityType = 'Query' | 'Ingest';

export interface Identity {
  id: string;
  name: string;
  type: IdentityType;
  createdBy: string;
  createdOn: string;
  lastUsed: string;
  revoked?: boolean;
  /** API keys only: when the key stops working. Undefined = never. */
  expires?: string;
}

export interface RecentRun {
  id: string;
  sql: string;
  time: string;
  ok: boolean;
  summary: string;
}

/**
 * A query on the SQL page (26 Oct). Saved as you type; kept until deleted. Open tabs are windows
 * onto these, so closing a tab loses nothing. Recent lists them all, pinned ones first.
 */
export interface SqlQuery {
  id: string;
  sql: string;
  /** Optional name given when pinned. Otherwise the first line names it. */
  name?: string;
  pinned?: boolean;
  /** Result of the last run. Undefined = never run. */
  status?: 'ok' | 'failed';
  /** Display time of the last edit or run, as the sample data writes times. */
  updated: string;
  /** Minutes ago, for sorting newest first. */
  age: number;
}

export interface SqlWorkspace {
  queries: SqlQuery[];
  open: string[];
  active: string;
  /** The tab reused by ▶ and Open in SQL until it is edited or run (shown in italics). */
  preview: string | null;
}
