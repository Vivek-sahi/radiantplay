// The PM's demo data (SaaS_Model_Data, "Finance model"). Picking a data model opens ONE Live tab
// named after the model (Vivek, 3 Nov); the user adds tabs as the analysis grows. financeModel.json
// is FACT_CUSTOMER_MONTH by region × month × industry, with plan and prior year on the same rows.
import data from './financeModel.json';
import type { Workbook, Sheet } from '../engine/workbook';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (iso: string) => {
  const [y, m] = iso.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};

type Row = [string, string, string, number, number, number, number, number];

export function financeWorkbook(modelName: string, name: string): Workbook {
  const model: Sheet = {
    id: 'model',
    name: modelName,
    kind: 'live',
    columns: [
      { title: 'Region', type: 'text', width: 96, fromModel: true },
      { title: 'Month', type: 'date', width: 100, fromModel: true },
      { title: 'Industry', type: 'text', width: 176, fromModel: true },
      { title: 'Total revenue', type: 'currency', width: 132, fromModel: true },
      { title: 'COGS', type: 'currency', width: 120, fromModel: true },
      { title: 'Gross profit', type: 'currency', width: 124, fromModel: true },
      { title: 'Plan revenue', type: 'currency', width: 128, fromModel: true },
      { title: 'PY revenue', type: 'currency', width: 124, fromModel: true },
    ],
    rows: (data.rows as Row[]).map(([reg, m, ind, ...nums]) => [reg, monthLabel(m), ind, ...nums]),
    cells: {},
  };
  return { name, model: modelName, sheets: [model], names: {} };
}

export function blankWorkbook(name: string): Workbook {
  return { name, model: '', sheets: [{ id: 'sheet1', name: 'Sheet 1', kind: 'local', columns: [], rows: [], cells: {} }], names: {} };
}
