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
  /** How long this step's tool runs. Defaults to LOAD_MS. A memory lookup and a
   *  warehouse query should not take the same time. */
  loadMs?: number;
}

/**
 * The full shape of a Spotter turn: read the question, check what the user has
 * asked before, resolve the data model, run the query, then build the chart.
 * Four tool kinds — memory, search, code, visualization — because a trace with
 * one tool in it doesn't show what the timeline is for.
 */
const VIZ_STEPS: RichStep[] = [
  {
    label: 'Understand the question',
    description:
      'Read this as a metric query — total sales over time, split by item type, across the last twelve months.',
  },
  {
    label: 'Check earlier questions',
    description:
      'You have asked about jacket sales before, so item type is likely the split you want here too.',
    loadMs: 1600,
    toolcall: {
      id: 'tc-memory',
      toolIcon: 'memory',
      title: 'Searching memory',
      doneTitle: 'Searched memory',
      input: 'recall({ scope: "recent_questions", limit: 20 })',
      output:
        '2 related:\n  · "Jacket sales last year"\n  · "Total sales by monthly"\nBoth grouped by item type.',
    },
  },
  {
    label: 'Resolve the data model',
    description:
      'Found 3 candidate tables and picked the orders → products → calendar chain on column overlap.',
    loadMs: 2400,
    toolcall: {
      id: 'tc-search',
      toolIcon: 'fetch',
      title: 'Searching the data model',
      doneTitle: 'Searched the data model',
      input: 'searchDataModel({\n  measures: ["sales"],\n  dimensions: ["item type", "month"]\n})',
      output:
        'orders.amount → products.item_type → calendar.month_label\n3 joins resolved · 0 ambiguous',
    },
  },
  {
    label: 'Run the query',
    description: 'Aggregated sales into monthly sums per item type over the last twelve months.',
    loadMs: 3200,
    toolcall: {
      id: 'tc-query',
      toolIcon: 'code',
      title: 'Running the query',
      doneTitle: 'Ran the query',
      input:
        'SELECT calendar.month_label,\n       products.item_type,\n       SUM(orders.amount) AS sales\nFROM orders\n  JOIN products ON products.id = orders.product_id\n  JOIN calendar ON calendar.date = orders.ordered_at\nWHERE calendar.date >= DATEADD(month, -12, CURRENT_DATE)\nGROUP BY 1, 2\nORDER BY 1',
      output: '60 rows · 5 item types × 12 months · 1.2s',
    },
  },
  {
    label: 'Build the visualization',
    description:
      'Picked a line chart — five series over twelve months reads as trends, which bars would flatten.',
    loadMs: 2000,
    toolcall: {
      id: 'tc-viz',
      toolIcon: 'answer',
      title: 'Creating the visualization',
      doneTitle: 'Created the visualization',
      input: 'chart({\n  type: "line",\n  x: "month_label",\n  y: "sales",\n  series: "item_type"\n})',
      output: 'Line chart · 5 series · 12 points each',
    },
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
      toolIcon: 'answer',
      title: 'Classifying intent',
      doneTitle: 'Classified intent',
      input: '"analyze sales for upcoming Fall and Winter"',
      output: '3 candidates: breakdown, forecast trend, both. Confidence is even — ask user.',
    },
  },
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

// ── Reasoning pacing ──────────────────────────────────────────────────────────
//
// These are the reasoning component's own playground timings
// (`SpotterRefresh/components/ReasoningView.tsx`), not invented here. A trace
// that resolves in a couple of seconds reads as a glitch rather than as work:
// the mask barely finishes one crop before the next step lands on it, and the
// prose has no time to be read.

/** Bouncing dots before the first step — the agent spinning up. */
const INITIAL_MS = 2200;
/**
 * A text step is held after it has finished streaming, before the next begins.
 *
 * Below the playground's 4200: this hold sits on top of the time the reader
 * already spent watching the line stream in, so most of it is dead air.
 */
const TEXT_HOLD_MS = 1600;
/**
 * A tool holds its resolved state before the next step begins. Short: the
 * reader has already watched it shimmer and seen its title flip to past tense,
 * so anything longer is just a stall between steps.
 */
const HOLD_MS = 1000;
/** How long a tool spends running, when it doesn't say. */
const LOAD_MS = 4000;
/** Collapse-to-"Show work" delay once the chain finishes. */
const DONE_DELAY_MS = 1600;

/** Reasoning prose arrives in word-chunks, the way an LLM streams it. */
const STREAM_TICK_MS = 110;
const STREAM_WORDS = 3;
/**
 * Pause after a step's first chunk, so its slide-in finishes before more text
 * can wrap a line. Without it an early wrap lands mid-ticker, when the mask
 * can't re-crop yet, and the top line flashes.
 */
const ENTRANCE_MS = 560;

/** Cumulative character counts to slice the text to at each streamed chunk. */
const streamStops = (text: string, wordsPerChunk = STREAM_WORDS): number[] => {
  const tokens = text.split(' ');
  const stops: number[] = [];
  let acc = 0;
  for (let i = 0; i < tokens.length; i++) {
    acc += tokens[i].length + (i < tokens.length - 1 ? 1 : 0); // include the space
    if ((i + 1) % wordsPerChunk === 0 || i === tokens.length - 1) stops.push(acc);
  }
  return stops.length ? stops : [text.length];
};

const reasoningSequence = (steps: RichStep[] = VIZ_STEPS): CannedEvent[] => {
  const events: CannedEvent[] = [
    {
      delay: 200,
      chunk: {
        kind: 'reasoning_start',
        steps: steps.map(({ label }) => ({ label })),
      },
    },
  ];

  let totalMs = 200 + INITIAL_MS;

  steps.forEach((step, idx) => {
    // The step begins. Its tool call is announced here rather than on
    // completion, so the row can render in its loading state — a tool that only
    // appears once it has finished never looks like it ran. No description yet:
    // the prose streams in below.
    // The gap before this step is the hold belonging to the one that just
    // finished, so it is the PREVIOUS step's kind that picks it — a tool holds
    // its resolved state briefly, a text step is left up to be read.
    const prev = steps[idx - 1];
    const openDelay =
      idx === 0 ? INITIAL_MS : prev.toolcall ? HOLD_MS : TEXT_HOLD_MS;
    events.push({
      delay: openDelay,
      chunk: {
        kind: 'reasoning_step',
        stepIndex: idx,
        status: 'current',
        ...(step.toolcall !== undefined ? { toolcall: step.toolcall } : {}),
      },
    });
    if (idx > 0) totalMs += openDelay;

    // Stream the prose a few words at a time. Each chunk is another `current`
    // carrying a longer description — the block re-crops per chunk, which is
    // what makes the text grow smoothly instead of appearing all at once.
    const text = step.description;
    if (text) {
      streamStops(text).forEach((stop, ci) => {
        const delay = ci === 0 ? (idx > 0 ? ENTRANCE_MS : STREAM_TICK_MS) : STREAM_TICK_MS;
        events.push({
          delay,
          chunk: {
            kind: 'reasoning_step',
            stepIndex: idx,
            status: 'current',
            description: text.slice(0, stop),
            ...(step.toolcall !== undefined ? { toolcall: step.toolcall } : {}),
          },
        });
        totalMs += delay;
      });
    }

    // It resolves: a tool stops shimmering, and the step's marker settles.
    const resolveDelay = step.toolcall ? step.loadMs ?? LOAD_MS : 0;
    events.push({
      delay: resolveDelay,
      chunk: {
        kind: 'reasoning_step',
        stepIndex: idx,
        status: 'done',
        ...(text !== undefined ? { description: text } : {}),
        ...(step.toolcall !== undefined ? { toolcall: step.toolcall } : {}),
      },
    });
    totalMs += resolveDelay;
  });

  const durationSeconds = Math.max(1, Math.round(totalMs / 1000));
  events.push({ delay: DONE_DELAY_MS, chunk: { kind: 'reasoning_done', durationSeconds } });
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
  { delay: 100, chunk: { kind: 'message_done' } },
];

/** Refine — Spotter asks back when the question is ambiguous. */
const refineFixture: CannedEvent[] = [
  ...reasoningSequence(REFINE_STEPS),
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

// ---------- Picker ----------

/** Naive keyword-based router. Default falls through to viz so any random
 *  prompt produces a chart-shaped answer (the most common case). */
export function pickCannedResponse(userText: string): CannedEvent[] {
  const lower = userText.toLowerCase().trim();

  if (lower.length === 0) return vizFixture;

  if (/^(analyze|help me|figure|maybe|not sure)\b/.test(lower)) {
    return refineFixture;
  }
  if (/^\b(hi|hello|hey|thanks|thank you)\b/.test(lower)) {
    return textFixture;
  }
  return vizFixture;
}
