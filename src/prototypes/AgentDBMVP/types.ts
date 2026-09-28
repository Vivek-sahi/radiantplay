// AgentDB MVP — standalone SaaS console concept.
// Separate from AgentDBStore and NearStore by design: nothing is imported from either.

export type Page = 'overview' | 'data' | 'activity' | 'usage' | 'access' | 'connect' | 'sql';

/** How a table got into AgentDB. Pulse tables are a cache; everything else is the only copy. */
export type WriterKind = 'pulse' | 'pipeline' | 'upload';

export interface Writer {
  kind: WriterKind;
  /** e.g. "Pulse", "Fivetran", "dbt Cloud", "Airflow", "File upload" */
  label: string;
  /** Pulse: the model name. Pipeline: the service account that wrote it. */
  detail: string;
}

export interface TableColumn {
  name: string;
  type: string;
  isKey?: boolean;
  /** A type widen is running (PRD Req 3: the only status indicator in the feature) */
  updating?: boolean;
  /** Added after data was loaded — empty for existing rows */
  addedLater?: boolean;
}

export interface StoreTable {
  id: string;
  database: string;
  name: string;
  writer: Writer;
  rows: number;
  sizeGB: number;
  /** Human-readable "last arrived" */
  lastArrived: string;
  /** We observe state, not runs: "late" = nothing arrived within the usual interval. */
  late?: { usual: string; since: string };
  columns: TableColumn[];
  /** Pulse only: next scheduled refresh */
  nextRefresh?: string;
  /** Created in the console and waiting for its first load */
  empty?: boolean;
  /** Date column the table is split by (set at creation, can't change) */
  splitBy?: string;
  /** A load is arriving right now — blocks delete and empty (PRD Req 4) */
  loading?: boolean;
}

export type IdentityKind = 'system' | 'pipeline' | 'agent' | 'app' | 'person';

export type Permission = 'Read' | 'Write' | 'Read & write';

export interface ServiceAccount {
  id: string;
  name: string;
  kind: IdentityKind;
  permission: Permission;
  /** Monthly budget in USD; null = no limit */
  budget: number | null;
  spent: number;
  /** Queries per second; null = no limit */
  rateLimit: number | null;
  lastUsed: string;
  /** System accounts are created and managed by ThoughtSpot */
  managed?: boolean;
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

export interface QueryRecord {
  id: string;
  time: string;
  who: string;
  kind: IdentityKind;
  summary: string;
  durationMs: number;
  scanned: string;
  cost: number;
  status: 'Success' | 'Error' | 'Stopped';
  note?: string;
}
