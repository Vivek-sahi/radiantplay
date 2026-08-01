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

const DAU_STEPS: RichStep[] = [
  {
    label: 'Understand the question',
    description:
      'Parsed the prompt as a Daily Active Users (DAU) trend over the last 12 months.',
  },
  {
    label: 'Resolve the data model',
    description:
      'Using Mixpanel Daily Events — # Users by daily event date, excluding internal ThoughtSpot accounts.',
    toolcall: {
      id: 'tc-dau',
      icon: 'database',
      title: 'ThoughtSpot: Answer generation',
      input: 'measures: ["# Users"], dimensions: ["Event Date daily"]',
      output:
        'Resolved # Users → Event Date daily on Mixpanel Daily Events (filter: Account Name != "thoughtspot, inc.")',
    },
  },
  {
    label: 'Generate the answer',
    description: 'Aggregated # Users by day and rendered a bar chart of the daily trend.',
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

/**
 * Viz answer: DAU daily bar chart (Near Store demo). Reasoning stays generic —
 * no cache mention; the cached/live indicator lives on the answer card.
 */
const dauFixture: CannedEvent[] = [
  ...reasoningSequence(DAU_STEPS),
  {
    delay: 100,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'viz',
        id: 'viz-dau',
        tokens: [
          { id: 't-users', label: '# Users', kind: 'measure' },
          { id: 't-daily', label: 'Event Date daily', kind: 'keyword' },
          { id: 't-acct', label: "Account Name != 'thoughtspot, inc.'", kind: 'filter' },
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
      },
    },
  },
  { delay: 200, chunk: { kind: 'block_done', blockId: 'viz-dau' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'followups',
        id: 'follow-dau',
        suggestions: [
          'Break this down by account',
          'Compare against the previous 12 months',
          'Show weekly instead of daily',
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'follow-dau' } },
  { delay: 100, chunk: { kind: 'message_done' } },
];

const MAU_STEPS: RichStep[] = [
  {
    label: 'Understand the question',
    description: 'Parsed the prompt as a Monthly Active Users (MAU) trend over the last 12 months.',
  },
  {
    label: 'Resolve the data model',
    description:
      'Using Mixpanel Daily Events — # Users rolled up to a monthly grain, excluding internal ThoughtSpot accounts.',
    toolcall: {
      id: 'tc-mau',
      icon: 'database',
      title: 'ThoughtSpot: Answer generation',
      input: 'measures: ["# Users"], dimensions: ["Event Date monthly"]',
      output: 'Resolved # Users → Event Date monthly (distinct users per month)',
    },
  },
  {
    label: 'Generate the answer',
    description: 'Counted distinct # Users by month and rendered a line chart of the monthly trend.',
  },
];

/**
 * Viz answer: MAU monthly line chart (Near Store demo). This answer is served
 * LIVE from the warehouse, so its answer card shows the live (green) marker —
 * paired with the cached DAU answer to show both states in one conversation.
 */
const mauFixture: CannedEvent[] = [
  ...reasoningSequence(MAU_STEPS),
  {
    delay: 100,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'viz',
        id: 'viz-mau',
        tokens: [
          { id: 't-users-m', label: '# Users', kind: 'measure' },
          { id: 't-monthly', label: 'Event Date monthly', kind: 'keyword' },
          { id: 't-acct-m', label: "Account Name != 'thoughtspot, inc.'", kind: 'filter' },
        ],
        source: {
          type: 'data',
          chartKind: 'line',
          data: {
            xAxis: {
              label: 'Monthly Event Date',
              categories: [
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              ],
            },
            yAxis: { label: '# Users' },
            series: [
              {
                id: 'm1',
                label: '# Users',
                data: [420000, 435000, 448000, 460000, 452000, 470000, 495000, 510000, 505000, 520000, 534000, 548000],
              },
            ],
          },
        },
        tableData: {
          columns: ['Monthly Event Date', '# Users'],
          rows: [
            ['Jul', 420000], ['Aug', 435000], ['Sep', 448000],
            ['Oct', 460000], ['Nov', 452000], ['Dec', 470000],
          ],
        },
      },
    },
  },
  { delay: 200, chunk: { kind: 'block_done', blockId: 'viz-mau' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'followups',
        id: 'follow-mau',
        suggestions: [
          'Break this down by account',
          'Compare against the previous year',
          'Show weekly instead of monthly',
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'follow-mau' } },
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

// ---------- Renewal risk (Data Studio hand-off) ----------
// Answers the question the Data Studio demo ends on, after publishing the Renewal risk
// model and clicking "Test in Spotter". The point of the beat is that data which was never
// in a warehouse — Jira escalations, pulled by a script — made it all the way through to a
// board-level answer, so the escalation count is named in the prose, cited in the sources,
// and carried as a column in the table.
//
// Columns and tables are the real ones from the model (accounts, contracts, arr_snapshot,
// usage_events, jira_cs_tickets), so the answer can't contradict what was just built.

const RENEWAL_STEPS: RichStep[] = [
  {
    label: 'Understand the question',
    description:
      'Parsed prompt as renewal exposure: accounts with a renewal date inside 90 days, filtered to declining usage and open P1 escalations.',
  },
  {
    label: 'Resolve the data model',
    description:
      'Matched the Renewal risk model. Escalations resolve through jira_cs_tickets, which is cached rather than queried live.',
    toolcall: {
      id: 'tc-renewal',
      icon: 'database',
      title: 'Data model search',
      input: 'measures: ["arr"], dimensions: ["account", "renewal date"], filters: ["usage declining", "open P1s"]',
      output: 'Renewal risk · accounts → contracts, arr_snapshot, usage_events, jira_cs_tickets (4 joins resolved)',
    },
  },
  {
    label: 'Generate the answer',
    description:
      'Ranked the 4 matching accounts by renewal risk and summed ARR, both raw and weighted by risk. Bar for the size comparison; the full breakdown is in the table view.',
  },
];

const renewalRiskFixture: CannedEvent[] = [
  ...reasoningSequence(RENEWAL_STEPS),
  {
    delay: 100,
    chunk: { kind: 'block_start', block: { kind: 'text', id: 'text-renewal', text: '' } },
  },
  ...streamText(
    'text-renewal',
    '$1.1M of ARR is up for renewal in the next 90 days across 4 at-risk accounts — $754K once weighted by renewal risk. All four are declining on usage, and between them they carry 8 open P1 escalations. Northwind is the largest single exposure at $420K, with the steepest usage drop and 3 open P1s.',
  ),
  { delay: 100, chunk: { kind: 'block_done', blockId: 'text-renewal' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'viz',
        id: 'viz-renewal-risk',
        title: 'ARR at risk by account, renewing in the next 90 days',
        tokens: [
          { id: 't-arr', label: 'ARR', kind: 'measure' },
          { id: 't-account', label: 'by account', kind: 'keyword' },
          { id: 't-renewal', label: 'renewal date = next 90 days', kind: 'filter' },
          { id: 't-usage', label: 'usage declining', kind: 'filter' },
          { id: 't-p1', label: 'open P1s > 0', kind: 'filter' },
        ],
        source: {
          type: 'data',
          // One measure, so one hue that darkens with magnitude — colour here means "more",
          // not "which account". A colour per account would encode identity nobody needs.
          chartKind: 'bar',
          data: {
            xAxis: { categories: ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin'] },
            yAxis: { label: 'ARR at risk ($K)' },
            series: [
              { id: 'arr-at-risk', label: 'ARR at risk', data: [420, 310, 280, 95] },
            ],
          },
        },
        tableData: {
          columns: ['Account', 'Renewal date', 'ARR', '90-day usage', 'Open P1s', 'Renewal risk'],
          rows: [
            ['Northwind', '12 Aug 2024', '$420K', '−38%', 3, 0.78],
            ['Fabrikam', '28 Aug 2024', '$280K', '−31%', 2, 0.71],
            ['Contoso', '3 Sep 2024', '$310K', '−27%', 2, 0.64],
            ['Tailspin', '19 Sep 2024', '$95K', '−12%', 1, 0.31],
          ],
        },
      },
    },
  },
  { delay: 200, chunk: { kind: 'block_done', blockId: 'viz-renewal-risk' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'sources',
        id: 'sources-renewal',
        items: [
          { id: 's-model', label: 'Renewal risk — published model' },
          { id: 's-contracts', label: 'contracts · Snowflake' },
          { id: 's-arr', label: 'arr_snapshot · Snowflake' },
          { id: 's-usage', label: 'usage_events · Databricks' },
          // The proof point, said out loud: this never went through a warehouse.
          { id: 's-jira', label: 'jira_cs_tickets · Jira, cached' },
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'sources-renewal' } },
  {
    delay: 200,
    chunk: {
      kind: 'block_start',
      block: {
        kind: 'followups',
        id: 'follow-renewal',
        suggestions: [
          'Which escalations are open on Northwind?',
          'Break renewal risk down by segment',
          'How has ARR at risk moved since last quarter?',
        ],
      },
    },
  },
  { delay: 100, chunk: { kind: 'block_done', blockId: 'follow-renewal' } },
  { delay: 100, chunk: { kind: 'message_done' } },
];

// ---------- Picker ----------

/** Naive keyword-based router. Default falls through to viz so any random
 *  prompt produces a chart-shaped answer (the most common case). */
export function pickCannedResponse(userText: string): CannedEvent[] {
  const lower = userText.toLowerCase().trim();

  if (lower.length === 0) return vizFixture;

  // Renewal risk must be tested BEFORE the churn rule below. That rule matches on
  // "account", which every renewal question contains, so without this ordering the demo's
  // closing question returns a churn answer — confidently, and about the wrong thing.
  // `accounts?` deliberately — \baccount\b does not match the plural, which is how every
  // one of these questions is actually phrased.
  if (/\b(renew|renewal|renewing)\b/.test(lower)
    || (/\brisk\b/.test(lower) && /\b(accounts?|arr|escalations?|usage)\b/.test(lower))
    || (/\b(p1|escalations?)\b/.test(lower) && /\b(accounts?|open|renew)\b/.test(lower))) {
    return renewalRiskFixture;
  }
  if (/\b(mau|monthly active)\b/.test(lower)) {
    return mauFixture;
  }
  if (/\b(dau|daily active|active users)\b/.test(lower)) {
    return dauFixture;
  }
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
