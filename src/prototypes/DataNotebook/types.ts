// ─────────────────────────────────────────────────────────────────────────────
// Hex-inspired notebook — type model
//
// Self-contained standalone prototype. The whole notebook UX lives under
// src/prototypes/DataNotebook/.
// ─────────────────────────────────────────────────────────────────────────────

export type CellType =
  | 'sql'
  | 'python'
  | 'chart'
  | 'input'
  | 'single-value'
  | 'pivot'
  | 'csv'
  | 'markdown';

export type CellStatus =
  | 'idle'      // never run
  | 'queued'   // waiting to run (run-all / reactive)
  | 'running'  // executing now
  | 'success'  // ran clean
  | 'error'    // ran with an error
  | 'stale';   // an upstream dependency changed since last run

// A dataframe is just an array of row records. Columns are inferred from keys.
export type DataFrame = Record<string, unknown>[];

export interface CellColumn {
  name: string;
  type: string; // duckdb/inferred type label, e.g. 'VARCHAR', 'BIGINT', 'DOUBLE'
}

// The unified output any cell can produce.
export interface CellOutput {
  kind: 'table' | 'scalar' | 'text' | 'chart' | 'error' | 'none';
  columns?: CellColumn[];
  rows?: DataFrame;          // table rows (capped for display)
  rowCount?: number;         // total rows (may exceed rows.length when truncated)
  truncated?: boolean;
  scalar?: number | string | boolean | null;
  stdout?: string;           // python print() output
  error?: string;
  elapsedMs?: number;
}

interface CellBase {
  id: string;
  type: CellType;
  name: string;              // output variable name + cell title (Hex names the output after the cell)
  status: CellStatus;
  output?: CellOutput;
  inputs: string[];          // upstream variable names this cell reads (derived)
  collapsed?: boolean;
  // Agent authoring: while the agent is streaming a cell in, it animates.
  appearing?: boolean;
}

// A warehouse/connection a SQL cell can target. 'dataframes' = query in-memory vars.
export type SqlSourceId = 'sf_prod_customer' | 'spotstore' | 'dataframes';

export interface SqlCell extends CellBase {
  type: 'sql';
  source: SqlSourceId;
  returnMode: 'dataframe' | 'query'; // green pill = full dataframe, purple pill = 1k preview
  code: string;
}

export interface PythonCell extends CellBase {
  type: 'python';
  code: string;
}

export type ChartType = 'bar' | 'line' | 'area' | 'scatter';

export interface ChartCell extends CellBase {
  type: 'chart';
  sourceVar: string;        // dataframe variable to chart
  chartType: ChartType;
  x: string;                // x column
  y: string;                // y column (measure)
  agg: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  series?: string;          // optional breakdown column
}

export type InputKind = 'dropdown' | 'slider' | 'text' | 'date';

export interface InputCell extends CellBase {
  type: 'input';
  inputKind: InputKind;
  label: string;
  // 'name' is the variable other cells reference (e.g. {{region}})
  value: string | number;
  options?: string[];       // dropdown
  min?: number; max?: number; step?: number; // slider
  // dropdown options can be sourced live from a dataframe column
  optionsFromVar?: string;
  optionsFromColumn?: string;
}

export interface SingleValueCell extends CellBase {
  type: 'single-value';
  sourceVar: string;
  column: string;
  agg: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format: 'number' | 'percent' | 'currency';
  caption?: string;
}

export interface PivotCell extends CellBase {
  type: 'pivot';
  sourceVar: string;
  groupBy: string[];        // row dimensions
  values: { column: string; agg: 'sum' | 'avg' | 'count' | 'min' | 'max' }[];
}

export interface MarkdownCell extends CellBase {
  type: 'markdown';
  markdown: string;         // supports {{var}} interpolation
}

export interface CsvCell extends CellBase {
  type: 'csv';
  fileName?: string;        // name of the uploaded / loaded file
  loaded: boolean;          // whether a file has been parsed into the kernel
}

export type Cell =
  | SqlCell
  | PythonCell
  | ChartCell
  | InputCell
  | SingleValueCell
  | PivotCell
  | CsvCell
  | MarkdownCell;

// ── Agent thread ───────────────────────────────────────────────────────────────

export type AgentStepKind = 'search' | 'plan' | 'create-cell' | 'run' | 'summary' | 'text';

export interface AgentPlanItem {
  label: string;
  done: boolean;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  // For agent messages: a sequence of rendered blocks
  text?: string;
  kind?: AgentStepKind;
  // search block: the sources/tables it "found"
  searchHits?: { table: string; connection: string; rows: number }[];
  // plan block
  plan?: AgentPlanItem[];
  // create-cell block: which cell it wrote
  cellRef?: { cellId: string; cellType: CellType; cellName: string };
  // summary block
  summary?: string;
  streaming?: boolean;
}

// ── Connections (for the data browser modal + SQL source selector) ──────────────

export interface SeedColumn {
  name: string;
  type: string;
  nullable: boolean;
  classification: 'key' | 'measure' | 'attribute';
  description?: string | null;
  nullRate?: number;
}

export interface SeedTable {
  name: string;             // exact name (matches mockData)
  source: SqlSourceId;      // which connection it belongs to
  connectionLabel: string;
  connectionType: 'snowflake' | 'thoughtspot';
  description: string;
  rowCount: number;
  dqScore?: number;
  owner?: string;
  columns: SeedColumn[];
  records: DataFrame;       // the actual rows loaded into DuckDB
}

export interface ConnectionGroup {
  id: SqlSourceId;
  label: string;
  type: 'snowflake' | 'thoughtspot' | 'dataframes';
  sublabel: string;
  tables: string[];
}
