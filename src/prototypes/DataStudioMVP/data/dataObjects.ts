/**
 * Data objects — the Data Workspace landing list (POC V2).
 *
 * POC V2 gives up Data Studio's own home screen: the canvas becomes a feature of
 * ThoughtSpot's Data Workspace rather than a destination of its own. This is the
 * list that page shows.
 *
 * Rows are derived from existing mock data — `OVERVIEW_PROJECTS` for models and
 * `RECENT_TABLES` for tables — so no table or model name is invented here.
 *
 * `canvas` is the field that decides where a row opens. Models built on our
 * multi-source canvas reopen there; everything else opens in the classic
 * modelling UI. Making the two canvases consistent is a later phase, so the
 * distinction is real and has to be visible in the data.
 */
import { OVERVIEW_PROJECTS, RECENT_TABLES } from './mockData';

export type ObjectCanvas = 'multiSource' | 'classic';
export type SourceProvider = 'snowflake' | 'bigquery' | 'databricks' | 'postgres' | 'salesforce' | 'dbt';

export interface DataObject {
  id: string;
  name: string;
  type: 'Model' | 'Table';
  source: string;
  sourceProvider: SourceProvider;
  tags: string[];
  author: string;
  lastModified: string;
  /** Which canvas opens this object. Models only — tables have no canvas. */
  canvas?: ObjectCanvas;
  /** `MODEL_DETAILS` key, so the detail page can find real columns and joins. */
  projectId?: string;
  /** What the model is for, as its author described it at save. Optional, as the field is. */
  description?: string;
}

/**
 * Which existing models were built on the multi-source canvas. Two, so the
 * split behaviour is visible without having to create one first. Everything
 * else opens in the classic modelling UI.
 */
const MULTI_SOURCE_MODELS = new Set(['proj-mc', 'proj-2']);

/** Per-model source label + provider. Connection names come from `CONNECTIONS`. */
const MODEL_SOURCE: Record<string, { source: string; sourceProvider: SourceProvider }> = {
  'proj-mc': { source: 'bigquery-marketing', sourceProvider: 'bigquery' },
  'proj-sp': { source: 'dbt_sales_pipeline', sourceProvider: 'dbt' },
  'proj-1':  { source: 'snowflake-prod',     sourceProvider: 'snowflake' },
  'proj-2':  { source: 'salesforce-crm',     sourceProvider: 'salesforce' },
  'proj-3':  { source: 'snowflake-finance',  sourceProvider: 'snowflake' },
};

const MODEL_TAGS: Record<string, string[]> = {
  'proj-mc': ['Marketing', 'Analysis'],
  'proj-sp': ['Sales'],
  'proj-1':  ['Sales', 'Analysis'],
  'proj-2':  ['CRM'],
  'proj-3':  ['Finance'],
};

/** `RECENT_TABLES` carries "Snowflake · marketing_db" — split it into the two fields. */
const parseTableConnection = (connection: string): { source: string; sourceProvider: SourceProvider } => {
  const [providerRaw, schema] = connection.split('·').map(s => s.trim());
  const provider = providerRaw.toLowerCase();
  const sourceProvider: SourceProvider =
    provider === 'bigquery'   ? 'bigquery'
    : provider === 'salesforce' ? 'salesforce'
    : provider === 'databricks' ? 'databricks'
    : provider === 'postgres'   ? 'postgres'
    : 'snowflake';
  return { source: schema || providerRaw, sourceProvider };
};

const MODEL_OBJECTS: DataObject[] = OVERVIEW_PROJECTS.map(p => ({
  id: `model-${p.id}`,
  name: p.name,
  type: 'Model' as const,
  ...(MODEL_SOURCE[p.id] ?? { source: 'snowflake-prod', sourceProvider: 'snowflake' as const }),
  tags: MODEL_TAGS[p.id] ?? [],
  author: p.author,
  lastModified: p.lastModified,
  canvas: MULTI_SOURCE_MODELS.has(p.id) ? ('multiSource' as const) : ('classic' as const),
  projectId: p.id,
}));

const TABLE_OBJECTS: DataObject[] = RECENT_TABLES.map(t => ({
  id: `table-${t.id}`,
  name: t.name,
  type: 'Table' as const,
  ...parseTableConnection(t.connection),
  tags: [],
  author: 'Maya Chen',
  lastModified: t.lastSynced,
}));

export const DATA_OBJECTS: DataObject[] = [...MODEL_OBJECTS, ...TABLE_OBJECTS];

/** Recent objects strip above the table — the six most recently touched. */
export const RECENT_DATA_OBJECTS: DataObject[] = [
  ...MODEL_OBJECTS.slice(0, 3),
  ...TABLE_OBJECTS.slice(0, 3),
];

/**
 * A model the user just created on the canvas. Prepended to the list so
 * publishing lands back on a page that shows the thing they made.
 */
export const makeCreatedModel = (name: string, author: string, description?: string): DataObject => ({
  id: `model-created-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  type: 'Model',
  source: 'snowflake-prod',
  sourceProvider: 'snowflake',
  tags: [],
  author,
  lastModified: 'just now',
  canvas: 'multiSource',
  description,
});
