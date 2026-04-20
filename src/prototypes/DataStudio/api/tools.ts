// ── Data Studio tool registry ─────────────────────────────────────────────────
//
// Each entry defines one agent tool: what it does, how it labels itself during
// execution, and what kind of output it produces. The agent selects tools
// based on the user's intent; each tool maps to one or more step definitions
// in the scripted flows (flows in AgentPanel) and informs future LLM routing.

export type ToolOutputType =
  | 'table_list'     // List of recommended data objects
  | 'join_proposal'  // Proposed joins with confidence scores
  | 'column_list'    // Calculated columns / transformations
  | 'health_report'  // Data quality scan results
  | 'confirmation';  // Simple success / action confirmation

export interface ToolDef {
  id: string;
  label: string;           // Step label shown during execution
  description: string;     // Detail text shown under the step
  outputType: ToolOutputType;
}

export const TOOLS: Record<string, ToolDef> = {

  search_warehouse: {
    id: 'search_warehouse',
    label: 'Searching warehouse',
    description: 'Scanning connected data sources for tables matching your use case based on column names, descriptions, and semantic similarity.',
    outputType: 'table_list',
  },

  propose_tables: {
    id: 'propose_tables',
    label: 'Selecting tables',
    description: 'Ranking candidate tables by relevance to your stated goal and preparing row counts and column previews.',
    outputType: 'table_list',
  },

  propose_joins: {
    id: 'propose_joins',
    label: 'Finding relationships',
    description: 'Analyzing foreign keys and shared column names to identify join candidates and score confidence.',
    outputType: 'join_proposal',
  },

  build_metric: {
    id: 'build_metric',
    label: 'Building calculated fields',
    description: 'Writing SQL expressions for the requested metrics and validating them against live schema.',
    outputType: 'column_list',
  },

  check_data_health: {
    id: 'check_data_health',
    label: 'Analyzing data health',
    description: 'Scanning all columns for nulls, duplicates, date format mismatches, and anomalous values.',
    outputType: 'health_report',
  },

  fix_issues: {
    id: 'fix_issues',
    label: 'Fixing data issues',
    description: 'Applying fixes step-by-step: adding descriptions, removing duplicates, filling nulls, normalizing dates.',
    outputType: 'confirmation',
  },

  write_descriptions: {
    id: 'write_descriptions',
    label: 'Writing column descriptions',
    description: 'Generating natural-language descriptions for each column to improve AI readability.',
    outputType: 'confirmation',
  },

};
