/**
 * Near Store — Spotter surface mock data.
 *
 * Business-user models shown in the "Select data model" picker, plus a canned
 * DAU answer for the chat. Each model carries a cache state so the picker and
 * the answer card can show the cached-vs-live indicator. "Mixpanel Daily Events"
 * is the cached running example.
 */
import type { VizBlockData } from '@spotter/runtime';

export type SpotterModelCache =
  | { state: 'cached'; lastRefreshed: string; windowLabel: string }
  | { state: 'live' };

export interface SpotterModel {
  id: string;
  name: string;
  createdOn: string;
  description: string;
  tags: string[];
  cache: SpotterModelCache;
  topLiveboards: { title: string; author: string }[];
  author: string;
}

export const spotterModels: SpotterModel[] = [
  {
    id: 'mixpanel-daily',
    name: 'Mixpanel Daily Events',
    createdOn: 'May 16, 2024',
    description:
      'Mixpanel event data joined to salesforce clusters and accounts. Keywords and Formulas are parsed out into separate rows. Data is aggregated to daily level.',
    tags: ['Product Management', 'AI'],
    cache: { state: 'cached', lastRefreshed: '23 Jun, 9:00 AM', windowLabel: 'Last 13 months' },
    topLiveboards: [
      { title: 'CSM-AM 360°', author: 'devin mcpherson' },
      { title: 'Spotter - Adoption among customers', author: 'alok yadav' },
      { title: 'Mixpanel SpotIQ', author: 'rahul pjp' },
    ],
    author: 'sephali.sahoo',
  },
  {
    id: 'retail-apparel',
    name: '(Sample) Retail - Apparel',
    createdOn: 'Feb 02, 2024',
    description: 'Sample retail apparel model with orders, returns, and store dimensions.',
    tags: ['Sample', 'Retail'],
    cache: { state: 'live' },
    topLiveboards: [{ title: 'Apparel Sales Overview', author: 'sample.user' }],
    author: 'sample.user',
  },
  {
    id: 'embrace-query-stats',
    name: '[AG] Embrace Query Stats WS',
    createdOn: 'Mar 11, 2025',
    description: 'Embrace warehouse query statistics for performance monitoring.',
    tags: ['Infra', 'Monitoring'],
    cache: { state: 'cached', lastRefreshed: '27 Jul, 6:00 AM', windowLabel: 'Last 6 months' },
    topLiveboards: [{ title: 'Query Performance', author: 'infra.team' }],
    author: 'infra.team',
  },
  {
    id: 'agentspot-financial',
    name: 'AgentSpot Demo Financial Mock Data',
    createdOn: 'Jan 20, 2025',
    description: 'Mock financial data for AgentSpot demos — ledger, revenue, and cost centres.',
    tags: ['Finance', 'Demo'],
    cache: { state: 'live' },
    topLiveboards: [{ title: 'Financial Demo', author: 'demo.user' }],
    author: 'demo.user',
  },
  {
    id: 'case-created-solved',
    name: 'Case Created Solved',
    createdOn: 'Apr 05, 2025',
    description: 'Support case volumes — created vs solved, by team and priority.',
    tags: ['Support'],
    cache: { state: 'cached', lastRefreshed: '26 Jul, 9:00 AM', windowLabel: 'Last 3 months' },
    topLiveboards: [{ title: 'Support Ops', author: 'support.lead' }],
    author: 'support.lead',
  },
  {
    id: 'claude-metadata',
    name: 'Claude Metadata',
    createdOn: 'Jun 02, 2025',
    description: 'Metadata for Claude usage and model activity.',
    tags: ['AI'],
    cache: { state: 'live' },
    topLiveboards: [{ title: 'Claude Usage', author: 'ai.platform' }],
    author: 'ai.platform',
  },
];

/** Canned answer for "what is the dau" — a daily bar chart. */
export const dauAnswer: VizBlockData = {
  kind: 'viz',
  id: 'dau-answer',
  tokens: [
    { id: 't1', label: '# Users', kind: 'measure' },
    { id: 't2', label: 'Event Date daily', kind: 'keyword' },
    { id: 't3', label: "Account Name != 'thoughtspot, inc.'", kind: 'filter' },
  ],
  source: {
    type: 'data',
    chartKind: 'bar',
    data: {
      xAxis: {
        label: 'Daily Event Date',
        categories: [
          '10/02', '10/03', '10/04', '10/05', '10/06', '10/07', '10/08',
          '10/09', '10/10', '10/13', '10/14', '10/15', '10/16', '10/17',
        ],
      },
      yAxis: { label: '# Users' },
      series: [
        {
          id: 's1',
          label: '# Users',
          data: [63000, 59000, 50000, 13000, 18000, 64000, 63000, 61000, 60000, 60000, 63000, 63000, 61000, 51000],
        },
      ],
    },
  },
  tableData: {
    columns: ['Daily Event Date', '# Users'],
    rows: [
      ['10/02', 63000], ['10/03', 59000], ['10/04', 50000], ['10/05', 13000],
      ['10/06', 18000], ['10/07', 64000], ['10/08', 63000],
    ],
  },
};
