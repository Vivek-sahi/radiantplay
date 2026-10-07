// AgentDB MVP — standalone SaaS console concept.
// Separate from AgentDBStore and NearStore by design: nothing is imported from either.
//
// V1 scope (7 Oct 2026 feedback): minimum observability. AgentDB shows only what the database
// itself knows — tables, storage, queries and their outcome. Jobs, schedules and in-progress
// states live in the pipeline tool, so nothing here predicts or tracks a load.

export type Page = 'overview' | 'data' | 'queries' | 'connect' | 'access';

/** How a table got into AgentDB. V1: pipelines only. ThoughtSpot is a reader, not a source. */
export type WriterKind = 'pipeline';

export interface Writer {
  kind: WriterKind;
  /** The tool, e.g. "Fivetran", "dbt Cloud", "Airflow" */
  label: string;
  /** The service account that wrote it */
  detail: string;
}

export interface TableColumn {
  name: string;
  type: string;
  /** Added after data was loaded — empty until the next load replaces the table (visible in the preview, never as a tag) */
  addedLater?: boolean;
}

/** One database per AgentDB (7 Oct), so a table is just its name. */
export interface StoreTable {
  id: string;
  name: string;
  writer: Writer;
  rows: number;
  sizeGB: number;
  /** The database's own last-update time. We only know a load once it is over. */
  lastUpdated: string;
  /** Queries that touched this table in the last 24 hours */
  queries24h: number;
  columns: TableColumn[];
  /** Created in the console and not loaded yet */
  empty?: boolean;
  /** Date column the table is split by (set at creation, can't change) */
  splitBy?: string;
}

export type IdentityKind = 'pipeline' | 'agent' | 'app' | 'person';

export type Permission = 'Read' | 'Write' | 'Read & write';

export interface ServiceAccount {
  id: string;
  name: string;
  kind: IdentityKind;
  permission: Permission;
  /** Queries per second; null = no limit */
  rateLimit: number | null;
  lastUsed: string;
  createdBy: string;
  /** Access revoked — the password no longer works */
  revoked?: boolean;
  passwordSetAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  lastActive: string;
}

export type QueryStatus = 'Completed' | 'In progress' | 'Failed';

export interface QueryRecord {
  id: string;
  time: string;
  who: string;
  kind: IdentityKind;
  /** The SQL, as the database saw it */
  summary: string;
  /** Tables the query read or wrote */
  tables: string[];
  /** 0 while in progress */
  durationMs: number;
  status: QueryStatus;
  note?: string;
}
