// Mock Workbooks for the Library list. Finance, per the PM's use case.
export interface WorkbookRow {
  id: string;
  name: string;
  model: string;
  author: string;
  modified: string;
}

export const WORKBOOKS: WorkbookRow[] = [
  { id: 'fy27-revenue-plan', name: 'FY27 revenue plan', model: 'Finance', author: 'You', modified: '2 hours ago' },
  { id: 'q3-budget-vs-actual', name: 'Q3 budget vs actual', model: 'Finance', author: 'Priya Nair', modified: 'Yesterday' },
  { id: 'october-close', name: 'October close', model: 'General ledger', author: 'You', modified: '3 days ago' },
  { id: 'headcount-plan', name: 'Headcount plan 2027', model: 'People', author: 'James Carter', modified: 'Last week' },
];
