// The setup questions when a workbook is started from Spotter (Vivek, 3 Nov 2026):
// the data source first, then one question that depends on the source. No plan card.
import type { IconName } from '@components/icons';

export type SourceId = 'model' | 'answer' | 'upload' | 'input-table' | 'template';

export const SOURCES: { id: SourceId; label: string; icon: IconName }[] = [
  { id: 'model', label: 'ThoughtSpot data model', icon: 'model' },
  { id: 'answer', label: 'An Answer', icon: 'answer' },
  { id: 'upload', label: 'Upload a file', icon: 'upload' },
  { id: 'input-table', label: 'Blank input table', icon: 'table' },
  { id: 'template', label: 'A template', icon: 'grid-view' },
];

/** Models ranked by fit to the request, as the Apps model question ranks them. */
export const MODELS = [
  { id: 'finance', label: 'Finance', confidence: 97 },
  { id: 'gl', label: 'General ledger', confidence: 84 },
  { id: 'sales', label: 'Sales booking', confidence: 68 },
  { id: 'people', label: 'People', confidence: 33 },
];

export const ANSWERS = [
  { id: 'rev-region-month', label: 'Revenue by region and month' },
  { id: 'opex-dept', label: 'Opex by department, FY26' },
  { id: 'bookings-q3', label: 'Q3 bookings by segment' },
];

export const INPUT_KINDS = [
  { id: 'targets', label: 'Targets' },
  { id: 'forecasts', label: 'Forecasts' },
  { id: 'mappings', label: 'Mappings' },
];

export const TEMPLATE_ROWS = [
  { id: 'budget-vs-actual', label: 'Budget vs actual' },
  { id: 'monthly-close', label: 'Monthly close' },
  { id: 'sales-forecast', label: 'Sales forecast' },
  { id: 'headcount-plan', label: 'Headcount plan' },
];

/** The build checklist before the workbook opens, per source. */
export function buildSteps(source: SourceId, detail: string): string[] {
  switch (source) {
    case 'model':
      return [`Opened the ${detail} model`, 'Created Sheet 1 from its columns', 'Loading live data'];
    case 'answer':
      return [`Opened "${detail}"`, 'Copied its columns and formulas into Sheet 1', 'Loading live data'];
    case 'upload':
      return [`Read ${detail}`, 'Translated its formulas', 'Saving the data to your warehouse'];
    case 'input-table':
      return ['Created an input table', `Set it up for ${detail.toLowerCase()}`, 'Opening the sheet'];
    case 'template':
      return [`Opened the ${detail} template`, 'Mapping its fields to your data', 'Loading live data'];
  }
}
