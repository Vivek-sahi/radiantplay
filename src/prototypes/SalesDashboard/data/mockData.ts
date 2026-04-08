// ── Tab & filter configuration ──────────────────────────
// Replace with your Liveboard's tab structure and filter set.

export const liveboardName = 'Sales dashboard';

export const tabsData = [
  { label: 'Overview',    id: 'overview'    },
  { label: 'Performance', id: 'performance' },
  { label: 'Regions',     id: 'regions'     },
];

export const filterData = [
  { label: 'Time period', value: 'This quarter' },
  { label: 'Region',      value: 'All regions'  },
  { label: 'Product',     value: 'All products' },
];

// ── SpotterViz sample messages ──────────────────────────
// Shown in the SpotterViz side panel (edit mode).

export const spotterVizMessages = [
  { role: 'user' as const, text: 'Show me revenue breakdown by segment' },
  {
    role: 'assistant' as const,
    text: 'Here is the revenue breakdown by customer segment.',
    steps: [
      'Analyzing revenue data',
      'Grouping by segment',
      'Creating visualization',
    ],
  },
];
