/**
 * Mock data for the Spotter prototype shell.
 *
 * Provides: left panel entries (analysts, chats, data models) and
 * per-chat pre-baked message histories so selecting a chat from the panel
 * loads a realistic conversation into the canvas.
 */

import type { ChatMessage, AnswerBlock } from '@spotter/runtime';

export interface Analyst {
  id: string;
  name: string;
  canEdit: boolean;
  description: string;
  author: string;
  integrations: string[];
}

export interface ChatEntry {
  id: string;
  title: string;
  /** The analyst this chat belongs to. */
  analystId: string;
  /** Pre-baked conversation shown when this chat is selected. */
  messages: ChatMessage[];
}

export interface DataModel {
  id: string;
  name: string;
}

// ---------- helpers ----------

const ts = (offsetMinutes: number): number =>
  Date.now() - offsetMinutes * 60 * 1000;

const userMsg = (id: string, text: string, minutesAgo: number): ChatMessage => ({
  id,
  role: 'user',
  stage: 'done',
  text,
  createdAt: ts(minutesAgo),
});

const agentMsg = (
  id: string,
  minutesAgo: number,
  blocks: AnswerBlock[],
): ChatMessage => ({
  id,
  role: 'agent',
  stage: 'done',
  reasoning: {
    steps: [
      { id: `${id}-s1`, label: 'Understand the question', status: 'done', description: 'Parsed the prompt and identified the relevant metrics.' },
      { id: `${id}-s2`, label: 'Resolve the data model', status: 'done', description: 'Matched to sales data model — orders, products, calendar tables.' },
      { id: `${id}-s3`, label: 'Generate the answer', status: 'done', description: 'Aggregated data and selected the most appropriate chart type.' },
    ],
    isDone: true,
    durationSeconds: 3,
  },
  content: { blocks },
  createdAt: ts(minutesAgo - 0.5),
});

// ---------- chat histories ----------

export const analysts: Analyst[] = [
  {
    id: 'customer-prep',
    name: 'Customer prep',
    canEdit: true,
    description: 'Prepare for customer meetings with data-backed insights on account health, purchase history, and growth opportunities.',
    author: 'Priya Nair',
    integrations: ['Salesforce', 'HubSpot'],
  },
  {
    id: 'deal-accelerator',
    name: 'Deal accelerator',
    canEdit: false,
    description: 'Identify high-value deals at risk and surface recommended actions to move them forward in the pipeline.',
    author: 'Rahul Mehta',
    integrations: ['Salesforce', 'Outreach'],
  },
  {
    id: 'territory-planner',
    name: 'Territory planner',
    canEdit: true,
    description: 'Analyse coverage gaps, dealer density, and demand signals to optimise territory assignments across regions.',
    author: 'Divya Krishnan',
    integrations: ['Google Sheets', 'Salesforce'],
  },
  {
    id: 'product-pulse',
    name: 'Product pulse',
    canEdit: false,
    description: 'Track feature adoption, user feedback trends, and NPS movements to prioritise your product roadmap.',
    author: 'Arjun Sharma',
    integrations: ['Mixpanel', 'Zendesk'],
  },
  {
    id: 'support-triage',
    name: 'Support triage',
    canEdit: true,
    description: 'Surface high-priority support tickets, detect escalation patterns, and track resolution SLA compliance.',
    author: 'Meera Iyer',
    integrations: ['Zendesk', 'Jira'],
  },
  {
    id: 'revenue-forecaster',
    name: 'Revenue forecaster',
    canEdit: false,
    description: 'Generate and compare revenue forecast scenarios using historical trends and pipeline data.',
    author: 'Karthik Bose',
    integrations: ['Salesforce', 'NetSuite'],
  },
];

export const chats: ChatEntry[] = [
  {
    id: 'chat-1',
    title: 'Total sales by monthly',
    analystId: 'spotter-default',
    messages: [
      userMsg('c1-u1', 'Show me total sales by month', 45),
      agentMsg('c1-a1', 44, [
        {
          kind: 'viz',
          id: 'c1-viz',
          title: 'Total sales by monthly date and item type',
          tokens: [
            { id: 't1', label: 'sales', kind: 'measure' },
            { id: 't2', label: 'monthly', kind: 'keyword' },
            { id: 't3', label: 'by item type', kind: 'keyword' },
            { id: 't4', label: 'date = last year', kind: 'filter' },
          ],
          source: {
            type: 'data',
            chartKind: 'line',
            data: {
              xAxis: { categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] },
              series: [
                { id: 's1', label: 'Bags', data: [4,4.2,4.5,4.8,5,5.2,5.5,5.8,6,6.2,6.5,6.8] },
                { id: 's2', label: 'Dresses', data: [3.2,3.5,3.8,4,4.2,4.5,4.8,5,5.2,5.5,5.8,6] },
                { id: 's3', label: 'Jackets', data: [5.8,6.2,7,8.5,10,11,12,11.5,10.5,11,12,11.8] },
              ],
            },
          },
        },
        { kind: 'followups', id: 'c1-fu', suggestions: ['Compare against the same period last year', 'Break this down by region', 'Show me top 5 items only'] },
      ]),
    ],
  },
  {
    id: 'chat-2',
    title: 'Regions with lowest sales',
    analystId: 'spotter-default',
    messages: [
      userMsg('c2-u1', 'Which regions have the lowest sales this quarter?', 120),
      agentMsg('c2-a1', 119, [
        {
          kind: 'text',
          id: 'c2-txt',
          text: 'The three regions with the lowest sales this quarter are **North-East (₹4.2M)**, **Eastern Plains (₹3.9M)**, and **Hill Stations (₹2.8M)**. Hill Stations is down 18% quarter-on-quarter, driven by reduced dealer inventory ahead of the monsoon season.',
        },
        { kind: 'followups', id: 'c2-fu', suggestions: ['Show Hill Stations trend over 12 months', 'Compare all regions side by side', 'What products sell best in Hill Stations?'] },
      ]),
      userMsg('c2-u2', 'Show Hill Stations trend over 12 months', 118),
      agentMsg('c2-a2', 117, [
        {
          kind: 'viz',
          id: 'c2-viz2',
          title: 'Hill Stations — monthly sales trend',
          tokens: [
            { id: 't1', label: 'sales', kind: 'measure' },
            { id: 't2', label: 'Hill Stations', kind: 'filter' },
            { id: 't3', label: 'last 12 months', kind: 'filter' },
          ],
          source: {
            type: 'data',
            chartKind: 'line',
            data: {
              xAxis: { categories: ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'] },
              series: [{ id: 's1', label: 'Hill Stations', data: [4.1,3.9,3.5,3.2,3.8,4.2,4.0,3.5,3.2,3.0,2.9,2.8] }],
            },
          },
        },
        { kind: 'followups', id: 'c2-fu2', suggestions: ['What caused the dip in March?', 'Compare with Eastern Plains', 'Show dealer count alongside sales'] },
      ]),
    ],
  },
  {
    id: 'chat-3',
    title: 'Geographical zones exhibiting low engagement',
    analystId: 'spotter-default',
    messages: [
      userMsg('c3-u1', 'Which geographical zones are showing low customer engagement?', 240),
      agentMsg('c3-a1', 239, [
        {
          kind: 'text',
          id: 'c3-txt',
          text: 'Low engagement zones (bottom quartile by active customers and repeat purchase rate) this period: **Deccan Plateau**, **Coastal Andhra**, and **Central MP**. These zones share traits — lower dealer density and limited service centre coverage. Deccan Plateau has seen a 22% drop in test rides in the last 60 days.',
        },
        { kind: 'followups', id: 'c3-fu', suggestions: ['Show dealer density map for these zones', 'How does service centre coverage correlate with sales?', 'What marketing campaigns ran in these zones?'] },
      ]),
    ],
  },
  {
    id: 'chat-4',
    title: 'Sparsely populated areas with high product demand',
    analystId: 'spotter-default',
    messages: [
      userMsg('c4-u1', 'Find sparsely populated areas where product demand is disproportionately high', 360),
      agentMsg('c4-a1', 359, [
        {
          kind: 'text',
          id: 'c4-txt',
          text: 'Areas with population density below the 30th percentile but demand index above the 70th percentile: **Ladakh (demand index 78, density rank 4th)**, **Spiti Valley (72, 2nd)**, and **Rann of Kutch fringe (68, 8th)**. These are strong candidates for targeted distribution partnerships.',
        },
        {
          kind: 'viz',
          id: 'c4-viz',
          title: 'Demand index vs population density — outlier zones',
          tokens: [
            { id: 't1', label: 'demand index', kind: 'measure' },
            { id: 't2', label: 'population density', kind: 'measure' },
            { id: 't3', label: 'outlier zones', kind: 'filter' },
          ],
          source: {
            type: 'data',
            chartKind: 'bar',
            data: {
              xAxis: { categories: ['Ladakh', 'Spiti Valley', 'Rann of Kutch'] },
              series: [
                { id: 's1', label: 'Demand index', data: [78, 72, 68] },
                { id: 's2', label: 'Population density rank', data: [4, 2, 8] },
              ],
            },
          },
        },
        { kind: 'followups', id: 'c4-fu', suggestions: ['Which dealers are closest to these areas?', 'What models are most in demand here?', 'Model distribution partnership ROI'] },
      ]),
    ],
  },
];

export const dataModels: DataModel[] = [
  { id: 'all', name: 'All data models' },
  { id: 'sales', name: 'Sales' },
  { id: 'support', name: 'Support' },
  { id: 'product', name: 'Product analytics' },
];

export const tenantName = 'Acme Apparel';
