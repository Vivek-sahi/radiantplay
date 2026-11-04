// "FY26 plan vs actual": the PM's scenario as an existing workbook someone already set up (Vivek,
// 3 Nov). Opening it is the edit scenario: the analysis continues from here. Built on the same
// Finance model data as a new workbook; every number on Summary is a live formula.
import { financeWorkbook } from './finance';
import type { Sheet, Workbook } from '../engine/workbook';

const REGIONS = ['APAC', 'EMEA', 'LATAM', 'NA'];

export function fy26Workbook(): Workbook {
  const base = financeWorkbook('Finance', 'FY26 plan vs actual');
  const finance = base.sheets[0];

  // Plan: plan revenue by region and month, the team's input table (written back on save).
  const planBy = new Map<string, number>();
  for (const row of finance.rows) {
    const k = `${row[0]}|${row[1]}`;
    planBy.set(k, (planBy.get(k) ?? 0) + (row[6] as number));
  }
  const plan: Sheet = {
    id: 'plan',
    name: 'Plan',
    kind: 'input',
    columns: [
      { title: 'Region', type: 'text', width: 96, fromModel: true, key: true, keyFrom: finance.name },
      { title: 'Month', type: 'date', width: 100, fromModel: true, key: true, keyFrom: finance.name },
      { title: 'Plan revenue', type: 'currency', width: 140, input: true },
    ],
    rows: [...planBy.entries()].map(([k, v]) => [...k.split('|'), Math.round(v)]),
    cells: {},
    source: 'Writes to FINANCE.PLANNING.PLAN_BY_REGION in your warehouse',
    writesTo: 'FINANCE.PLANNING.PLAN_BY_REGION',
  };
  // What the warehouse holds now, so edits count as unsaved changes until Save.
  plan.savedRows = plan.rows.map((r) => [...r]);

  // Assumptions: values that live only in this workbook.
  const assumptions: Sheet = {
    id: 'assumptions',
    name: 'Assumptions',
    kind: 'local',
    columns: [
      { title: 'Assumption', type: 'text', width: 160 },
      { title: 'Value', type: 'percent', width: 104 },
    ],
    rows: [],
    cells: { '0,2': 'Growth rate', '1,2': '8%' },
  };

  // Summary: one row per region, every value a formula over the other tabs.
  const cells: Record<string, string> = {};
  REGIONS.forEach((reg, i) => {
    const r = i + 2;
    cells[`0,${r}`] = reg;
    cells[`1,${r}`] = `=SUMIFS(Finance!D:D,Finance!A:A,A${r})`;
    cells[`2,${r}`] = `=SUMIFS(Plan!C:C,Plan!A:A,A${r})`;
    cells[`3,${r}`] = `=B${r}-C${r}`;
    cells[`4,${r}`] = `=D${r}/C${r}`;
    cells[`5,${r}`] = `=SUMIFS(Finance!F:F,Finance!A:A,A${r})`;
    cells[`6,${r}`] = `=F${r}/B${r}`;
    cells[`7,${r}`] = `=B${r}*(1+growth_rate)`;
  });
  const t = REGIONS.length + 2;
  cells[`0,${t}`] = 'Total';
  ['B', 'C', 'D', 'F', 'H'].forEach((l, i) => { cells[`${[1, 2, 3, 5, 7][i]},${t}`] = `=SUM(${l}2:${l}${t - 1})`; });
  cells[`4,${t}`] = `=D${t}/C${t}`;
  cells[`6,${t}`] = `=F${t}/B${t}`;
  const summary: Sheet = {
    id: 'summary',
    name: 'Summary',
    kind: 'local',
    columns: [
      { title: 'Region', type: 'text', width: 96 },
      { title: 'Actual revenue', type: 'currency', width: 140 },
      { title: 'Plan revenue', type: 'currency', width: 140 },
      { title: 'Variance', type: 'currency', width: 120 },
      { title: 'Variance %', type: 'percent', width: 104 },
      { title: 'Gross profit', type: 'currency', width: 140 },
      { title: 'Gross margin', type: 'percent', width: 112 },
      { title: 'Next year', type: 'currency', width: 140 },
    ],
    rows: [],
    cells,
  };

  return {
    ...base,
    sheets: [summary, finance, plan, assumptions],
    names: { growth_rate: 'Assumptions!$B$2' },
  };
}
