export type ModelSource      = 'warehouse' | 'dbt';
export type HealthStatus     = 'healthy' | 'needs-coaching' | 'broken';
export type PublishStatus    = 'draft' | 'published';
export type ColumnKind       = 'attribute' | 'measure' | 'metric';
export type JoinType         = 'LEFT JOIN' | 'INNER JOIN' | 'FULL OUTER JOIN';
export type Severity         = 'high' | 'medium' | 'low';
export type PrepJobStatus    = 'success' | 'failed' | 'running';
export type FilterOperator   = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
export type ValidationIssueType = 'chasm-trap' | 'join-error' | 'rls-gap' | 'fan-out' | 'circular-ref';
export type QualityIssueType    = 'null' | 'duplicate' | 'anomaly' | 'no-description' | 'date-format';

export interface ModelColumn {
  name: string;
  table: string;        // 'computed' for derived metrics
  kind: ColumnKind;
  formula?: string;     // computed metrics only
  description?: string;
  synonyms?: string[];
  aiContextSet: boolean;
  hidden?: boolean;
}

export interface ModelTable {
  name: string;
  connection: string;
  rows: number;
  includedColumns: number;
}

export interface ModelJoin {
  left: string;
  right: string;
  on: string;
  type: JoinType;
}

export interface ModelFilter {
  column: string;
  operator: FilterOperator;
  value?: string | number | boolean | string[];
  description?: string;
}

export interface RLSRule {
  column: string;
  userAttribute: string;
  description?: string;
}

export interface ValidationIssue {
  type: ValidationIssueType;
  severity: Severity;
  description: string;
  affectedTables?: string[];
}

export interface TestQuestion {
  id: string;
  question: string;
  passed: boolean;
  failReason?: string;
}

export interface DataQualityIssue {
  type: QualityIssueType;
  severity: Severity;
  table: string;
  column?: string;
  percentage: number;
  description: string;
}

export interface PrepJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  status: PrepJobStatus;
}

export interface DbtSource {
  project: string;
  connection: string;
  schedule: string;
  lastSuccessfulSync: string;
}

export interface SavedAnswer {
  id: string;
  question: string;
  user: string;
  timestamp: string;
  feedback: 'positive' | 'negative' | null;
  failed: boolean;
}

export interface DataModel {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  updatedAt: string;

  source: ModelSource;
  connectionId: string;
  dbtSource?: DbtSource;
  tml?: string;

  tables: ModelTable[];
  joins: ModelJoin[];
  columns: ModelColumn[];
  filters: ModelFilter[];
  rls: RLSRule[];

  healthStatus: HealthStatus;
  validationIssues: ValidationIssue[];
  testSuite: TestQuestion[];
  dataQualityIssues: DataQualityIssue[];

  prepJobs: PrepJob[];

  answers: SavedAnswer[];
  liveboards: string[];
  semanticGaps: string[];

  memory: string;

  publishStatus: PublishStatus;
  sharedWith: string[];
}
