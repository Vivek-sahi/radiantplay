// Content from the PM's vision prototype, screen 1 "Workbooks home + new Workbook" (16 Oct 2026).
import type { IconName } from '@components/icons';

export interface StartOption {
  id: string;
  icon: IconName;
  title: string;
  description: string;
}

export const START_OPTIONS: StartOption[] = [
  { id: 'model', icon: 'model', title: 'From a model', description: 'Open governed data in sheets, live' },
  { id: 'answer', icon: 'answer', title: 'From an Answer', description: 'Keep working on a search result' },
  { id: 'input-table', icon: 'table', title: 'Blank input table', description: 'Targets, forecasts and mappings' },
  { id: 'excel', icon: 'upload', title: 'Upload an Excel file', description: 'Formulas translated; data saved to your warehouse' },
];

export interface Template {
  id: string;
  title: string;
  description: string;
}

export const TEMPLATES: Template[] = [
  { id: 'budget-vs-actual', title: 'Budget vs actual', description: 'Actuals, targets, variance' },
  { id: 'monthly-close', title: 'Monthly close', description: 'Accruals, reconciliations' },
  { id: 'sales-forecast', title: 'Sales forecast', description: 'Pipeline, commit, best case' },
  { id: 'headcount-plan', title: 'Headcount plan', description: 'Hires, cost, scenarios' },
];

export interface WorkbookRow {
  id: string;
  name: string;
  model: string;
  sheets: number;
  owner: string;
  edited: string;
  status: 'Verified' | 'Draft';
  mine: boolean;
}

export const WORKBOOKS: WorkbookRow[] = [
  { id: 'fy27-revenue-plan', name: 'FY27 Revenue Plan', model: 'Finance Model', sheets: 4, owner: 'You', edited: '2 hours ago', status: 'Verified', mine: true },
  { id: 'monthly-close-pack', name: 'Monthly close pack', model: 'GL Model', sheets: 6, owner: 'A. Kim', edited: 'Yesterday', status: 'Verified', mine: false },
  { id: 'pipeline-vs-target', name: 'Pipeline vs target', model: 'Sales Model', sheets: 3, owner: 'J. Reyes', edited: '3 days ago', status: 'Draft', mine: false },
  { id: 'emea-opex-review', name: 'EMEA opex review', model: 'Finance Model', sheets: 5, owner: 'M. Okafor', edited: '4 days ago', status: 'Verified', mine: false },
  { id: 'headcount-fy27', name: 'Headcount FY27', model: 'HR Model', sheets: 4, owner: 'You', edited: 'Last week', status: 'Draft', mine: true },
  { id: 'pricing-scenarios', name: 'Pricing scenarios', model: 'Revenue Model', sheets: 2, owner: 'S. Tan', edited: 'Last week', status: 'Draft', mine: false },
  { id: 'board-pack-q3', name: 'Board pack Q3', model: 'Finance Model', sheets: 7, owner: 'L. Costa', edited: '2 weeks ago', status: 'Verified', mine: false },
  { id: 'vendor-spend', name: 'Vendor spend', model: 'Procurement Model', sheets: 3, owner: 'You', edited: '3 weeks ago', status: 'Draft', mine: true },
];
