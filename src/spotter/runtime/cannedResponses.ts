/**
 * Canned response fixtures for Spotter chat.
 *
 * Each fixture is a sequence of `{ delay, chunk }` events. The chat service
 * yields them with `setTimeout` to emulate SSE streaming. Pick logic uses
 * naive keyword matching against the user's prompt — good enough until the
 * canonical schema and live API land.
 */

import type { AnswerChunk, ReasoningToolCall } from './schema';

export interface CannedEvent {
  /** Milliseconds to wait before yielding this chunk. */
  delay: number;
  chunk: AnswerChunk;
}

interface RichStep {
  label: string;
  description?: string;
  toolcall?: ReasoningToolCall;
}

const VIZ_STEPS: RichStep[] = [
  {
    label: 'Understand the question',
    description:
      'Parsed prompt as a metric query about sales over time, segmented by item type.',
  },
  {
    label: 'Resolve the data model',
    description:
      'Located 3 candidate tables: orders, products, calendar. Picked the orders → products → calendar join chain based on column overlap.',
    toolcall: {
      id: 'tc-search',
      icon: 'database',
      title: 'Data model search',
      input: 'measures: ["sales"], dimensions: ["item type", "month"]',
      output: 'orders.amount → products.item_type → calendar.month_label (3 joins resolved)',
    },
  },
  {
    label: 'Generate the answer',
    description:
      'Aggregated sales as monthly sums grouped by item type for the last 12 months. Picked a line chart for time-series clarity.',
  },
];

const TEXT_STEPS: RichStep[] = [
  { label: 'Understand the question', description: 'Parsed prompt as a narrative summary request.' },
  { label: 'Pull the relevant data', description: 'Pulled the latest aggregated metrics from the warehouse.' },
  { label: 'Compose the response', description: 'Wrote a short narrative grounded in the most recent quarter.' },
];

const REFINE_STEPS: RichStep[] = [
  {
    label: 'Understand the question',
    description: 'The phrasing is broad — multiple intents fit the prompt.',
  },
  {
    label: 'Disambiguate intent',
    description:
      'Identified 3 likely directions and want to confirm before running anything that could mislead.',
    toolcall: {
      id: 'tc-disambig',
      icon: 'ai',
      title: 'Intent classifier',
      input: '"analyze sales for upcoming Fall and Winter"',
      output: '3 candidates: breakdown, forecast trend, both. Confidence is even — ask user.',
    },
  },
];

const SOURCES_STEPS: RichStep[] = [
  { label: 'Understand the question', description: 'Identified this as a churn / customer-health query.' },
  {
    label: 'Pull supporting sources',
    description: 'Cross-referenced the answer against active liveboards and worksheets.',
    toolcall: {
      id: 'tc-sources',
      icon: 'search',
      title: 'Source lookup',
      input: 'topic: "customer churn", recency: 90 days',
      output: '3 sources matched: Customer churn dashboard, Account health by segment, Renewals pipeline.',
    },
  },
  { label: 'Compose the response', description: 'Combined the latest churn delta with citation pills.' },
];

/** Splits a string into delta events of roughly `chunkSize` characters. */
const streamText = (
  blockId: string,
  text: string,
  chunkSize = 24,
  perChunkDelayMs = 28,
): CannedEvent[] => {
  const events: CannedEvent[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    events.push({
      delay: perChunkDelayMs,
      chunk: { kind: 'text_delta', blockId, delta: text.slice(i, i + chunkSize) },
    });
  }
  return events;
};

const reasoningSequence = (
  steps: RichStep[] = VIZ_STEPS,
  perStepDelayMs = 700,
): CannedEvent[] => {
  const totalMs = 200 + perStepDelayMs * steps.length + 200;
  const durationSeconds = Math.max(1, Math.round(totalMs / 1000));

  const events: CannedEvent[] = [
    {
      delay: 200,
      chunk: {
        kind: 'reasoning_start',
        steps: steps.map(({ label }) => ({ label })),
      },
    },
  ];
  steps.forEach((step, idx) => {
    events.push({
      delay: perStepDelayMs,
      chunk: {
        kind: 'reasoning_step',
        stepIndex: idx,
        status: 'done',
        ...(step.description !== undefined ? { description: step.description } : {}),
        ...(step.toolcall !== undefined ? { toolcall: step.toolcall } : {}),
      },
    });
  });
  events.push({ delay: 200, chunk: { kind: 'reasoning_done', durationSeconds } });
  return events;
};

// ---------- Fixtures ----------

/** Viz answer: matches the screen-3 reference. */
const vizFixture: CannedEvent[] = [
  ...reasoningSequence(VIZ_STEPS),
  {
    delay: 100,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'viz',
        id: 'viz-sales-monthly',
        title: 'Total sales by monthly date and item type',
        tokens: [
          { id: 't-sales', label: 'sales', kind: 'measure' },
          { id: 't-monthly', label: 'monthly', kind: 'keyword' },
          { id: 't-item', label: 'by item type', kind: 'keyword' },
          { id: 't-date', label: 'date = last year', kind: 'filter' },
        ],
        source: {
          type: 'data',
          chartKind: 'line',
          data: {
            xAxis: {
              categories: [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ],
            },
            yAxis: { label: 'Total sales' },
            series: [
              { id: 'bags', label: 'Bags', data: [4.2, 4.4, 4.5, 4.7, 5.1, 5.3, 5.6, 5.4, 5.5, 5.8, 6.0, 6.2] },
              { id: 'dresses', label: 'Dresses', data: [5.5, 6.1, 7.2, 8.6, 9.4, 10.2, 11.0, 11.4, 10.8, 9.7, 8.4, 7.6] },
              { id: 'headwear', label: 'Headwear', data: [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.4, 4.3, 4.2, 4.3, 4.4, 4.5] },
              { id: 'jackets', label: 'Jackets', data: [3.4, 3.6, 4.2, 5.1, 6.4, 7.6, 8.5, 9.4, 10.2, 11.0, 11.5, 11.2] },
              { id: 'jeans', label: 'Jeans', data: [3.0, 3.4, 3.7, 3.6, 3.5, 3.6, 3.8, 4.0, 4.1, 4.0, 3.9, 3.8] },
            ],
          },
        },
        tableData: {
          columns: ['Month', 'Bags', 'Dresses', 'Headwear', 'Jackets', 'Jeans'],
          rows: [
            ['Jan', 4.2, 5.5, 4.0, 3.4, 3.0],
            ['Feb', 4.4, 6.1, 4.1, 3.6, 3.4],
            ['Mar', 4.5, 7.2, 4.2, 4.2, 3.7],
            ['Apr', 4.7, 8.6, 4.3, 5.1, 3.6],
            ['May', 5.1, 9.4, 4.4, 6.4, 3.5],
            ['Jun', 5.3, 10.2, 4.5, 7.6, 3.6],
          ],
        },
      },
    },
  },
  { delay: 200, chunk: { kind: 'block_done', blockId: 'viz-sales-monthly' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'followups',
        id: 'follow-viz',
        suggestions: [
          'Compare against the same period last year',
          'Break this down by region',
          'Show me top 5 items only',
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'follow-viz' } },
  { delay: 100, chunk: { kind: 'message_done' } },
];

/** Text-only answer with streamed paragraph. */
const textFixture: CannedEvent[] = [
  ...reasoningSequence(TEXT_STEPS),
  {
    delay: 100,
    chunk: { kind: 'block_start', block: { kind: 'text', id: 'text-summary', text: '' } },
  },
  ...streamText(
    'text-summary',
    'Total Q4 revenue across all regions came in at $12.4M, up 8% versus the same period last year. The largest contributor was North America at $5.6M, followed by EMEA at $3.8M and APAC at $3.0M.',
  ),
  { delay: 100, chunk: { kind: 'block_done', blockId: 'text-summary' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'followups',
        id: 'follow-text',
        suggestions: [
          'Break down by region',
          'Compare quarter over quarter',
          'Show top contributing accounts',
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'follow-text' } },
  { delay: 100, chunk: { kind: 'message_done' } },
];

/** Refine — Spotter asks back when the question is ambiguous. */
const refineFixture: CannedEvent[] = [
  ...reasoningSequence(REFINE_STEPS, 700),
  {
    delay: 100,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'refine',
        id: 'refine-1',
        questions: [
          'Sales by item type, summed for the next 3 months',
          'Sales forecast trend by month for Fall and Winter',
          'Both — first the breakdown, then the forecast',
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'refine-1' } },
  { delay: 100, chunk: { kind: 'message_done' } },
];

/** Text + sources — light citation example. */
const sourcesFixture: CannedEvent[] = [
  ...reasoningSequence(SOURCES_STEPS),
  {
    delay: 100,
    chunk: { kind: 'block_start', block: { kind: 'text', id: 'text-src', text: '' } },
  },
  ...streamText(
    'text-src',
    'Customer churn for the last 90 days dropped from 4.2% to 3.6%, with most of the improvement coming from accounts in the enterprise segment.',
  ),
  { delay: 100, chunk: { kind: 'block_done', blockId: 'text-src' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'sources',
        id: 'sources-1',
        items: [
          { id: 's-churn', label: 'Customer churn — Q4 2025' },
          { id: 's-accounts', label: 'Account health by segment' },
          { id: 's-renewals', label: 'Renewals pipeline view' },
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'sources-1' } },
  { delay: 100, chunk: { kind: 'message_done' } },
];

// ---------- Picker ----------

/** Naive keyword-based router. Default falls through to viz so any random
 *  prompt produces a chart-shaped answer (the most common case). */
export function pickCannedResponse(userText: string): CannedEvent[] {
  const lower = userText.toLowerCase().trim();

  if (lower.length === 0) return vizFixture;

  if (/\b(churn|customer|retention|account|source|cite)\b/.test(lower)) {
    return sourcesFixture;
  }
  if (/^(analyze|help me|figure|maybe|not sure)\b/.test(lower)) {
    return refineFixture;
  }
  if (/^\b(hi|hello|hey|thanks|thank you)\b/.test(lower)) {
    return textFixture;
  }
  return vizFixture;
}
