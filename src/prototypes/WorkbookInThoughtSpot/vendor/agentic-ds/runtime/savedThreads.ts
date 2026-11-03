/**
 * Saved conversations behind the chats in the left panel.
 *
 * These are resolved threads, not fixtures that stream: opening one is meant to
 * feel like returning to a conversation you already had, so every message is
 * `done` and every reasoning trace is closed. The live turn — dots, streaming
 * prose, tools shimmering — is `cannedResponses`, and it stays the only thing
 * that plays.
 *
 * Response bodies are `markdown` blocks so they render through the frozen
 * formatting spec: the type scale, the list treatment, and the grid table with
 * vertical rules and row hover.
 */

import type { ChatMessage, ReasoningStep, AnswerBlock } from './schema';

interface ThreadStep {
  label: string;
  description: string;
  toolcall?: ReasoningStep['toolcall'];
}

/** A resolved turn: the question, what Spotter did, and what it answered. */
interface Turn {
  ask: string;
  steps: ThreadStep[];
  seconds: number;
  blocks: AnswerBlock[];
}

/**
 * Fixed timestamps, spaced a few minutes apart, so a thread reads in order and
 * doesn't shift every time the module reloads.
 */
const BASE = Date.UTC(2026, 7, 17, 9, 0, 0);
const MINUTE = 60_000;

const buildThread = (chatId: string, turns: Turn[]): ChatMessage[] =>
  turns.flatMap((turn, i) => {
    const at = BASE + i * 7 * MINUTE;
    const user: ChatMessage = {
      id: `${chatId}-u${i}`,
      role: 'user',
      stage: 'done',
      text: turn.ask,
      createdAt: at,
    };
    const agent: ChatMessage = {
      id: `${chatId}-a${i}`,
      role: 'agent',
      stage: 'done',
      reasoning: {
        isDone: true,
        durationSeconds: turn.seconds,
        steps: turn.steps.map((step, s) => ({
          id: `${chatId}-a${i}-step-${s}`,
          label: step.label,
          status: 'done' as const,
          description: step.description,
          ...(step.toolcall ? { toolcall: step.toolcall } : {}),
        })),
      },
      content: { blocks: turn.blocks },
      createdAt: at + 30_000,
    };
    return [user, agent];
  });

// ── Shared reasoning shapes ───────────────────────────────────────────────────

const resolveModel = (id: string, note: string): ThreadStep => ({
  label: 'Resolve the data model',
  description: note,
  toolcall: {
    id,
    toolIcon: 'fetch',
    title: 'Searching the data model',
    doneTitle: 'Searched the data model',
    input: 'searchDataModel({ measures, dimensions })',
    output: 'Join chain resolved · 0 ambiguous',
  },
});

const runQuery = (id: string, sql: string, rows: string): ThreadStep => ({
  label: 'Run the query',
  description: 'Aggregated the result set and pulled it back for charting.',
  toolcall: {
    id,
    toolIcon: 'code',
    title: 'Running the query',
    doneTitle: 'Ran the query',
    input: sql,
    output: rows,
  },
});

// ── c1 · Total sales by month ─────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const totalSales: Turn[] = [
  {
    ask: 'Total sales by month',
    seconds: 12,
    steps: [
      {
        label: 'Understand the question',
        description: 'Read this as a monthly time series over the trailing twelve months.',
      },
      resolveModel('c1-t1', 'Picked the orders → calendar chain on column overlap.'),
      runQuery(
        'c1-t2',
        'SELECT calendar.month_label, SUM(orders.amount) AS sales\nFROM orders JOIN calendar ON calendar.date = orders.ordered_at\nWHERE calendar.date >= DATEADD(month, -12, CURRENT_DATE)\nGROUP BY 1 ORDER BY 1',
        '12 rows · 1.1s',
      ),
    ],
    blocks: [
      {
        kind: 'viz',
        id: 'c1-viz',
        title: 'Total sales by month',
        tokens: [
          { id: 'c1-t-sales', label: 'sales', kind: 'measure' },
          { id: 'c1-t-monthly', label: 'monthly', kind: 'keyword' },
          { id: 'c1-t-date', label: 'date = last 12 months', kind: 'filter' },
        ],
        source: {
          type: 'data',
          chartKind: 'line',
          data: {
            xAxis: { categories: MONTHS },
            yAxis: { label: 'Sales ($M)' },
            series: [
              {
                id: 'sales',
                label: 'Sales',
                data: [18.4, 19.1, 21.6, 22.8, 24.0, 25.7, 26.9, 26.2, 27.8, 29.4, 31.0, 32.6],
              },
            ],
          },
        },
      },
      {
        kind: 'markdown',
        id: 'c1-md',
        html:
          '<p>Sales grew from <strong>$18.4M</strong> in January to <strong>$32.6M</strong> in December — up 77% across the year, with the only dip in August.</p>' +
          '<ul><li>The steepest month-over-month jump was <strong>March</strong>, at +13%.</li>' +
          '<li><strong>August</strong> fell 2.6%, the single down month.</li>' +
          '<li>The last quarter alone added $5.7M, a third of the year&rsquo;s growth.</li></ul>',
      },
    ],
  },
];

// ── c2 · Which regions are underperforming? ───────────────────────────────────

const regions: Turn[] = [
  {
    ask: 'Which regions are underperforming?',
    seconds: 16,
    steps: [
      {
        label: 'Understand the question',
        description:
          '"Underperforming" is not a column, so read it as revenue against target, ranked ascending.',
      },
      resolveModel('c2-t1', 'Found targets on the plan table and joined it to regional revenue.'),
      runQuery(
        'c2-t2',
        'SELECT region, SUM(revenue) AS actual, SUM(target) AS target\nFROM regional_revenue GROUP BY 1 ORDER BY (SUM(revenue) / SUM(target)) ASC',
        '5 rows · 0.8s',
      ),
    ],
    blocks: [
      {
        kind: 'markdown',
        id: 'c2-md',
        html:
          '<h2>Two regions are behind plan</h2>' +
          '<p>EMEA and Latin America are the only regions under target. Everything else is at or above.</p>' +
          '<table><thead><tr><th>Region</th><th>Actual</th><th>Target</th><th>Attainment</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>EMEA</td><td>$18.2M</td><td>$24.0M</td><td>76%</td></tr>' +
          '<tr><td>Latin America</td><td>$6.4M</td><td>$7.5M</td><td>85%</td></tr>' +
          '<tr><td>APAC</td><td>$14.9M</td><td>$14.5M</td><td>103%</td></tr>' +
          '<tr><td>North America</td><td>$42.7M</td><td>$40.0M</td><td>107%</td></tr>' +
          '<tr><td>Japan</td><td>$9.1M</td><td>$8.0M</td><td>114%</td></tr>' +
          '</tbody></table>' +
          '<h3>What is behind EMEA</h3>' +
          '<p>EMEA&rsquo;s gap is <strong>$5.8M</strong>, more than five times Latin America&rsquo;s. Pipeline coverage there is healthy at 3.1x, so the shortfall is conversion rather than demand.</p>',
      },
    ],
  },
];

// ── c3 · Jacket sales last year ───────────────────────────────────────────────

const jackets: Turn[] = [
  {
    ask: 'Jacket sales last year',
    seconds: 11,
    steps: [
      {
        label: 'Understand the question',
        description: 'Filtered to the jackets item type across last calendar year.',
      },
      resolveModel('c3-t1', 'Resolved item type through the products dimension.'),
    ],
    blocks: [
      {
        kind: 'viz',
        id: 'c3-viz',
        title: 'Jacket sales by month, last year',
        tokens: [
          { id: 'c3-t-sales', label: 'sales', kind: 'measure' },
          { id: 'c3-t-item', label: 'item type = jackets', kind: 'filter' },
          { id: 'c3-t-date', label: 'date = last year', kind: 'filter' },
        ],
        source: {
          type: 'data',
          chartKind: 'bar',
          data: {
            xAxis: { categories: MONTHS },
            yAxis: { label: 'Sales ($M)' },
            series: [
              {
                id: 'jackets',
                label: 'Jackets',
                data: [3.4, 3.6, 4.2, 5.1, 6.4, 7.6, 8.5, 9.4, 10.2, 11.0, 11.5, 11.2],
              },
            ],
          },
        },
      },
      {
        kind: 'markdown',
        id: 'c3-md',
        html:
          '<p>Jackets are strongly seasonal: sales more than tripled from January to November, then eased in December.</p>' +
          '<p>The curve is almost the inverse of dresses, which peak in August — worth pairing them on the same axis if you are planning inventory.</p>',
      },
    ],
  },
];

// ── c4 · Prep me for the Acme renewal ─────────────────────────────────────────

const acme: Turn[] = [
  {
    ask: 'Prep me for the Acme renewal',
    seconds: 21,
    steps: [
      {
        label: 'Understand the question',
        description: 'Pulled the account record, usage trend, and open support history.',
      },
      {
        label: 'Check earlier questions',
        description: 'You asked about Acme seat growth two weeks ago — carried that framing over.',
        toolcall: {
          id: 'c4-t0',
          toolIcon: 'memory',
          title: 'Searching memory',
          doneTitle: 'Searched memory',
          input: 'recall({ account: "Acme", limit: 10 })',
          output: '1 related: "Acme seat growth since January"',
        },
      },
      resolveModel('c4-t1', 'Joined accounts to usage and tickets on account id.'),
    ],
    blocks: [
      {
        kind: 'markdown',
        id: 'c4-md',
        html:
          '<h2>Acme renews in 18 days</h2>' +
          '<p>Contract value is <strong>$412K</strong>, up from $340K last term. The account is healthy on usage but has an open escalation.</p>' +
          '<h3>What is going well</h3>' +
          '<ul><li>Weekly active users up <strong>34%</strong> since January.</li>' +
          '<li>Seats at 92% utilisation — they are close to needing an expansion.</li>' +
          '<li>Three new teams onboarded in the last quarter.</li></ul>' +
          '<h3>What to get ahead of</h3>' +
          '<ul><li>A P1 ticket on data-refresh latency has been open <strong>11 days</strong>.</li>' +
          '<li>Their exec sponsor changed in June and has not been met since.</li></ul>' +
          '<blockquote>Lead with the utilisation number — it makes the expansion conversation theirs to raise rather than yours.</blockquote>',
      },
    ],
  },
];

// ── c5 · Product margin trend across quarters ─────────────────────────────────

const margin: Turn[] = [
  {
    ask: 'Product margin trend across quarters',
    seconds: 14,
    steps: [
      {
        label: 'Understand the question',
        description: 'Read margin as gross margin percent, by product line, by quarter.',
      },
      resolveModel('c5-t1', 'Margin is derived — computed it from revenue and COGS rather than reading a column.'),
      runQuery(
        'c5-t2',
        'SELECT quarter, product_line,\n       (SUM(revenue) - SUM(cogs)) / SUM(revenue) AS margin\nFROM product_financials GROUP BY 1, 2 ORDER BY 1',
        '16 rows · 0.9s',
      ),
    ],
    blocks: [
      {
        kind: 'viz',
        id: 'c5-viz',
        title: 'Gross margin by product line',
        tokens: [
          { id: 'c5-t-margin', label: 'gross margin', kind: 'formula' },
          { id: 'c5-t-line', label: 'by product line', kind: 'keyword' },
          { id: 'c5-t-date', label: 'last 4 quarters', kind: 'filter' },
        ],
        source: {
          type: 'data',
          chartKind: 'line',
          data: {
            xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
            yAxis: { label: 'Margin %' },
            series: [
              { id: 'core', label: 'Core', data: [62, 63, 64, 66] },
              { id: 'addons', label: 'Add-ons', data: [71, 70, 68, 64] },
              { id: 'services', label: 'Services', data: [38, 36, 35, 33] },
            ],
          },
        },
      },
      {
        kind: 'markdown',
        id: 'c5-md',
        html:
          '<p>Core margin is improving, but add-ons have given up seven points over the year and services keep sliding.</p>' +
          '<table><thead><tr><th>Product line</th><th>Q1</th><th>Q4</th><th>Change</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Core</td><td>62%</td><td>66%</td><td>+4 pts</td></tr>' +
          '<tr><td>Add-ons</td><td>71%</td><td>64%</td><td>&minus;7 pts</td></tr>' +
          '<tr><td>Services</td><td>38%</td><td>33%</td><td>&minus;5 pts</td></tr>' +
          '</tbody></table>' +
          '<p>Add-ons started the year as the highest-margin line and ended below Core. That is the one worth explaining.</p>',
      },
    ],
  },
];

// ── c6 · Churn risk by account segment ────────────────────────────────────────

const churn: Turn[] = [
  {
    ask: 'Churn risk by account segment',
    seconds: 18,
    steps: [
      {
        label: 'Understand the question',
        description: 'Used the churn-risk score already on the account record rather than deriving one.',
      },
      resolveModel('c6-t1', 'Joined risk scores to segment and ARR.'),
      {
        label: 'Cross-check the number',
        description: 'Checked the total against the churn dashboard so the two do not disagree.',
        toolcall: {
          id: 'c6-t2',
          toolIcon: 'fetch',
          title: 'Cross-checking the total',
          doneTitle: 'Cross-checked the total',
          input: 'compare({ metric: "arr_at_risk", against: "churn_dashboard" })',
          output: 'Matches within rounding · $8.9M',
        },
      },
    ],
    blocks: [
      {
        kind: 'markdown',
        id: 'c6-md',
        html:
          '<h2>Mid-market carries the most risk</h2>' +
          '<p><strong>$8.9M</strong> of ARR sits in accounts scored high-risk. Mid-market is 61% of that while being 34% of the book.</p>' +
          '<table><thead><tr><th>Segment</th><th>Accounts at risk</th><th>ARR at risk</th><th>Share of segment</th></tr></thead>' +
          '<tbody>' +
          '<tr><td>Mid-market</td><td>34</td><td>$5.4M</td><td>18%</td></tr>' +
          '<tr><td>Enterprise</td><td>7</td><td>$2.6M</td><td>6%</td></tr>' +
          '<tr><td>SMB</td><td>52</td><td>$0.9M</td><td>11%</td></tr>' +
          '</tbody></table>' +
          '<p>Enterprise has the fewest at-risk accounts but the highest value each. Mid-market is where the volume and the money overlap.</p>',
      },
    ],
  },
];

/** Saved threads, keyed by the chat id in the left panel's roster. */
export const savedThreads: Record<string, ChatMessage[]> = {
  c1: buildThread('c1', totalSales),
  c2: buildThread('c2', regions),
  c3: buildThread('c3', jackets),
  c4: buildThread('c4', acme),
  c5: buildThread('c5', margin),
  c6: buildThread('c6', churn),
};

export const threadFor = (chatId: string | null): ChatMessage[] | undefined =>
  chatId ? savedThreads[chatId] : undefined;
