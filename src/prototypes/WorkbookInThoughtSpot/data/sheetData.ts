// Sheet data for the live workbook. Columns follow the klimt-grid contract (components/grid/types).
import type { Column, Row } from '../components/grid/types';

const fromSource = (title: string) => ({
  disabledReason: `${title} comes from the data model. Only columns marked ✎ take input.`,
});

/** Sheet 1 of a workbook built on a data model: revenue by region, month and product line. */
export function modelColumns(): Column[] {
  return [
    { id: 'region', title: 'Region', dataType: 'text', width: 128, editable: fromSource('Region') },
    { id: 'month', title: 'Month', dataType: 'text', width: 104, editable: fromSource('Month') },
    { id: 'product', title: 'Product line', dataType: 'text', width: 140, editable: fromSource('Product line') },
    { id: 'revenue', title: 'Revenue', dataType: 'currency', width: 128, editable: fromSource('Revenue') },
    { id: 'cost', title: 'Cost', dataType: 'currency', width: 120, editable: fromSource('Cost') },
    {
      id: 'margin', title: 'Gross margin', dataType: 'percent', width: 124,
      badges: [{ icon: 'fx', label: 'Formula: (Revenue − Cost) ÷ Revenue' }],
      editable: { disabledReason: 'Gross margin is calculated from Revenue and Cost, so it can’t be typed over.' },
    },
    { id: 'deals', title: 'Deals', dataType: 'number', width: 88, editable: fromSource('Deals') },
    {
      id: 'plan', title: 'FY27 plan', dataType: 'currency', width: 128, editable: true, placeholder: 'Type a plan',
      badges: [{ icon: 'input', label: 'Input column' }],
      validate: (v) => (typeof v === 'number' && v < 0 ? 'A plan can’t be negative' : null),
    },
    { id: 'owner', title: 'Owner', dataType: 'text', width: 140, editable: fromSource('Owner') },
  ];
}

const REGIONS = ['APAC', 'EMEA', 'LATAM', 'North America'];
const MONTHS = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
const PRODUCTS = ['Platform', 'Analytics', 'Services'];
const OWNERS = ['Priya Nair', 'James Carter', 'Aisha Khan', 'Daniel Okafor', 'Sofia Alvarez', 'Kenji Watanabe'];

/** A seeded generator, so every run shows the same numbers. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function modelRows(): Row[] {
  const rand = rng(27);
  const rows: Row[] = [];
  for (const region of REGIONS)
    for (const month of MONTHS)
      for (const product of PRODUCTS) {
        const revenue = Math.round((80_000 + rand() * 420_000) * 100) / 100;
        const cost = Math.round(revenue * (0.35 + rand() * 0.35) * 100) / 100;
        rows.push({
          __id: `${region}|${month}|${product}`,
          region, month, product, revenue, cost,
          margin: Math.round(((revenue - cost) / revenue) * 1000) / 10,
          deals: Math.round(4 + rand() * 40),
          plan: null,
          owner: OWNERS[Math.floor(rand() * OWNERS.length)],
        });
      }
  return rows;
}

/** A blank sheet: eight text columns anyone can type in, and 60 empty rows. */
export function blankColumns(): Column[] {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((l) => ({ id: l, title: '', dataType: 'text', width: 120, editable: true }));
}

export function blankRows(sheet: string): Row[] {
  return Array.from({ length: 60 }, (_, i) => ({ __id: `${sheet}-${i}` }) as Row);
}
