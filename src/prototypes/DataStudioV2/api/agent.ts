import type { ProjectState } from '../index';

// ── Skills registry ───────────────────────────────────────────────────────────
// Documents what the agent can do and when each skill is available.
// All execution is scripted — no API calls. Adding a workflow = add here + SCRIPTS in AgentPanel.

export interface Skill {
  key: string;
  description: string;
  availableWhen: (project: ProjectState) => boolean;
}

export const SKILLS: Skill[] = [
  {
    key: 'build_project',
    description: 'One-shot: find tables, joins, columns, and metrics from a project brief',
    availableWhen: p => p.buildStep === 'empty',
  },
  {
    key: 'find_tables',
    description: 'Search the warehouse and propose tables to add to the project',
    availableWhen: p => p.buildStep !== 'empty',
  },
  {
    key: 'create_joins',
    description: 'Identify shared keys and propose joins between tables',
    availableWhen: p => p.addedTables.length >= 2,
  },
  {
    key: 'select_columns',
    description: 'Choose which columns from each table to include',
    availableWhen: p => p.addedTables.length > 0,
  },
  {
    key: 'create_metric',
    description: 'Add a calculated column or business metric using SQL',
    availableWhen: p => p.buildStep === 'joined' || p.buildStep === 'transformed' || p.buildStep === 'healthy',
  },
  {
    key: 'profile_data',
    description: 'Scan all columns for nulls, duplicates, anomalies, and format issues',
    availableWhen: p => p.addedTables.length > 0,
  },
  {
    key: 'fix_health',
    description: 'Fix data quality issues found during profiling',
    availableWhen: p => p.addedTables.length > 0,
  },
  {
    key: 'test_model',
    description: 'Ask questions against the current model to validate it',
    availableWhen: p => p.buildStep !== 'empty',
  },
  {
    key: 'coach',
    description: 'Fix a gap or incorrect answer found during testing',
    availableWhen: p => p.buildStep !== 'empty',
  },
];
