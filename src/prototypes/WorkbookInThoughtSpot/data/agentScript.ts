// The agent-led workbook demo (Vivek, 3 Nov 2026): the same work as the manual demo, given to Spotter
// as prompts. Some prompts state a goal, some give a command. Step 1 = the goal prompt on Home builds
// the four-tab FY26 workbook. Later steps (margin, growth, variance, pivot, publish + pin, data app)
// are added here one at a time.
import type { ReasoningItem } from '../vendor/agentic-ds/runtime/schema';

/** What the demo types on Home. Any Home prompt starts this flow. */
export const GOAL_PROMPT =
  'I need to review FY26 plan vs actual with our CFO. Where are we off plan, how are margins holding, and what does next year look like?';

/** Turn 1: read the goal, look for a model that has actuals and plan. */
export const THINK_GOAL: ReasoningItem[] = [
  {
    kind: 'text',
    id: 'goal',
    summaryHeader: 'Reading your goal',
    text: 'You want FY26 plan against actual, margin, and a view of next year. That needs one model with both actuals and plan.',
  },
  { kind: 'tool', id: 'models', title: 'Searching your data models', doneTitle: 'Searched your data models', icon: 'search' },
];

/** Every customer has their own models, so the agent asks and the user answers in the chat (Vivek, 3 Nov). */
export const ASK_MODEL = 'A few of your models have revenue in them. Which one holds your actuals and your plan?';

/** Turn 2: open the model the user named and work out the shape of the workbook. */
export const thinkModel = (model: string): ReasoningItem[] => [
  { kind: 'tool', id: 'open', title: `Opening the ${model} model`, doneTitle: `Opened the ${model} model`, icon: 'model' },
  {
    kind: 'tool',
    id: 'cols',
    title: 'Reading its columns',
    doneTitle: 'Found revenue, COGS, gross profit and plan revenue, by region, month and industry',
    icon: 'table',
  },
  {
    kind: 'tool',
    id: 'plan',
    title: 'Looking for a planning table',
    doneTitle: 'Found FINANCE.PLANNING.PLAN_BY_REGION, keyed by region and month',
    icon: 'database',
  },
  {
    kind: 'text',
    id: 'shape',
    summaryHeader: 'Planning the workbook',
    text: 'The team keeps plan in a table they edit, so Plan becomes an input table that writes back there. Next year needs a growth rate that isn’t in the data, so it stays a local assumption you can change.',
  },
];

export const PLAN_INTRO = 'Here’s the workbook I’ll build.';

export const PLAN = {
  title: 'FY26 plan vs actual',
  description: 'Plan against actual by region on the Finance model, with gross margin and next year at 8% growth.',
  rows: [
    { label: 'Summary', value: 'By region: actual, plan, variance, gross margin, next year' },
    { label: 'Finance', value: 'Live from the Finance model, 1,152 rows' },
    { label: 'Plan', value: 'Input table keyed by Region and Month. Writes to FINANCE.PLANNING.PLAN_BY_REGION' },
    { label: 'Assumptions', value: 'Growth rate 8%. Lives only in this workbook' },
  ],
};

/** The streamed build, Apps-style "Working" checklist. */
export const BUILD_STEPS = [
  'Added the Finance tab, live from the model',
  'Added Plan as an input table, keyed by Region and Month',
  'Added Assumptions: growth rate 8%',
  'Built Summary: actual, plan, variance, margin and next year by region',
  'Loading live data',
];

export const BUILT = {
  name: 'FY26 plan vs actual',
  bullets: [
    'Summary rolls everything up by region, every number a formula',
    'Finance is live: 1,152 rows from the Finance model',
    'Plan is an input table; what you type saves back to your warehouse',
    'Assumptions holds the growth rate, 8% for now',
  ],
};

/** The next prompts, shown as chips under the built turn. Each becomes a later demo step. */
export const NEXT = [
  { id: 'margin', label: 'Add gross margin to every row' },
  { id: 'growth', label: 'What if growth is 10%?' },
  { id: 'onplan', label: 'Are we on plan?' },
];

// ── A plain request ("Create a workbook") — Vivek, 3 Nov: the response follows the input. A basic
// prompt gets a blank workbook: no model question, no reasoning, no plan. A goal gets the plan flow.

/** A prompt with an analysis goal in it. Anything else is a plain request for a workbook. */
export const isGoal = (prompt: string) =>
  /\b(plan|actuals?|fy ?\d{2}|margins?|cfo|budget|forecast|variance|revenue|review|growth|target)\b/i.test(prompt);

export const BLANK = {
  intro: 'I’ll start you a blank workbook.',
  title: 'Untitled workbook',
  description: 'A blank workbook with one sheet. Bring in data from a model, an Answer or a file whenever you’re ready.',
  action: 'Create workbook',
  busy: 'Creating…',
  steps: ['Created a blank workbook', 'Opening Sheet 1'],
  built: 'Created',
};

export const BLANK_NEXT = [
  { id: 'from-model', label: 'Add data from a model' },
  { id: 'from-answer', label: 'Start from an Answer' },
  { id: 'upload', label: 'Upload a file' },
];

// ── Working in an existing workbook with Spotter (Vivek, 3 Nov: "the existing workbook workflows
// where the user is primarily using the agent"). Each prompt changes the grid through the same engine
// as a hand edit. Step 1 = margin on every row.

export const OPEN_NEXT = [
  { id: 'margin', label: 'Add gross margin to every row' },
  { id: 'growth', label: 'What if growth is 10%?' },
  { id: 'onplan', label: 'Are we on plan?' },
];

export const isMargin = (p: string) => /\bmargins?\b/i.test(p);

export const THINK_MARGIN: ReasoningItem[] = [
  { kind: 'tool', id: 'read', title: 'Reading the Finance tab', doneTitle: 'Read the Finance tab: gross profit in F, total revenue in D', icon: 'table' },
  { kind: 'tool', id: 'formula', title: 'Adding a column formula', doneTitle: 'Added =F2/D2 as one column formula', icon: 'formula' },
];

/** Margin facts from the Finance rows, for Spotter's answer: the row average and the industry range. */
export function marginFacts(rows: (string | number | null)[][]) {
  let sum = 0, n = 0;
  const byInd = new Map<string, [number, number]>();
  for (const r of rows) {
    const rev = Number(r[3]), gp = Number(r[5]);
    if (!rev) continue;
    sum += gp / rev; n++;
    const k = String(r[2]); const a = byInd.get(k) ?? [0, 0]; byInd.set(k, [a[0] + gp, a[1] + rev]);
  }
  const ind = [...byInd.entries()].map(([k, [gp, rev]]) => ({ k, m: gp / rev })).sort((a, b) => b.m - a.m);
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  return { avg: pct(sum / n), top: ind[0], low: ind[ind.length - 1], pct, rows: n };
}

export const marginAnswer = (f: ReturnType<typeof marginFacts>) =>
  `Added Gross margin % to the Finance tab. It’s one column formula, =F2/D2, across all ${f.rows.toLocaleString()} rows, so it stays right when the data refreshes. Margins average ${f.avg}. ${f.top.k} runs highest at ${f.pct(f.top.m)}; ${f.low.k} is lowest at ${f.pct(f.low.m)}.`;

export const AFTER_MARGIN = [
  { id: 'growth', label: 'What if growth is 10%?' },
  { id: 'onplan', label: 'Are we on plan?' },
];

// Money in the words a PM would say: $8.17B, $163M, $2.5M.
export const say = (n: number) => {
  const a = Math.abs(n);
  const t = a >= 1e9 ? `$${(a / 1e9).toFixed(2)}B` : a >= 1e7 ? `$${Math.round(a / 1e6)}M` : `$${(a / 1e6).toFixed(1)}M`;
  return t;
};

// ── Step 2: growth to 10% (a command) ─────────────────────────────────────────
export const isGrowth = (p: string) => /\b(growth|grow|next year)\b/i.test(p);
export const THINK_GROWTH: ReasoningItem[] = [
  { kind: 'tool', id: 'find', title: 'Finding the growth rate', doneTitle: 'Found growth_rate on Assumptions: 8%', icon: 'search' },
  { kind: 'tool', id: 'set', title: 'Changing it to 10%', doneTitle: 'Set growth_rate to 10%', icon: 'pencil' },
  { kind: 'tool', id: 'calc', title: 'Recalculating Summary', doneTitle: 'Summary’s Next year column recalculated', icon: 'formula' },
];
export const growthAnswer = (actualTotal: number, emeaActual: number) =>
  `Done. Growth is 10% on Assumptions, and Summary has already moved: next year comes to ${say(actualTotal * 1.1)}, up ${say(actualTotal * 0.02)} from ${say(actualTotal * 1.08)} at 8%. EMEA alone adds ${say(emeaActual * 0.02)} of that.`;
export const AFTER_GROWTH = [
  { id: 'onplan', label: 'Are we on plan?' },
  { id: 'quarter', label: 'Show revenue by region by quarter' },
];

// ── Step 3: are we on plan? (a goal) ─────────────────────────────────────────
export const isOnPlan = (p: string) => /\b(on plan|off plan|behind|ahead|variance|miss)\b/i.test(p);
export const THINK_ONPLAN: ReasoningItem[] = [
  { kind: 'tool', id: 'cmp', title: 'Comparing actual with plan by region', doneTitle: 'Compared actual with plan for 4 regions', icon: 'table' },
  { kind: 'tool', id: 'cf', title: 'Colouring Variance %', doneTitle: 'Added a colour scale to Variance %', icon: 'formula' },
];
export function onPlanAnswer(regions: { name: string; variance: number }[], totalVar: number, totalPlan: number) {
  const miss = [...regions].sort((a, b) => a.variance - b.variance)[0];
  const ahead = regions.filter((r) => r.variance >= 0).map((r) => r.name);
  const list = ahead.length > 1 ? `${ahead.slice(0, -1).join(', ')} and ${ahead[ahead.length - 1]}` : ahead[0];
  return `Mostly, yes. Overall you’re ${say(totalVar)} ${totalVar < 0 ? 'under' : 'over'} plan, against ${say(totalPlan)} planned, which rounds to 0.0%. ${miss.name}, your biggest region, is the one miss: ${say(miss.variance)} under plan. ${list} are slightly ahead. I coloured Variance % so the miss stands out.`;
}
export const AFTER_ONPLAN = [
  { id: 'quarter', label: 'Show revenue by region by quarter' },
  { id: 'pin', label: 'Publish and pin the summary to Finance weekly' },
];

// ── Step 4: revenue by region by quarter (a command) ─────────────────────────
export const isQuarter = (p: string) => /\b(quarter|quarterly|pivot|trend)\b/i.test(p);
export const THINK_PIVOT: ReasoningItem[] = [
  { kind: 'tool', id: 'pv', title: 'Creating a pivot from the Finance tab', doneTitle: 'Created a pivot tab from Finance', icon: 'table' },
  { kind: 'tool', id: 'grp', title: 'Grouping Total revenue by Region and Quarter', doneTitle: 'Grouped Total revenue by Region and Quarter, with totals', icon: 'formula' },
];
/** Quarter totals per region from the Finance rows: does every region grow every quarter, and the biggest region's last quarter. */
export function quarterFacts(rows: (string | number | null)[][]) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const q = new Map<string, Map<number, number>>();
  for (const r of rows) {
    const [mo, y] = String(r[1]).split(' ');
    const k = Number(y) * 4 + Math.floor(MONTHS.indexOf(mo) / 3);
    const m = q.get(String(r[0])) ?? new Map<number, number>();
    m.set(k, (m.get(k) ?? 0) + Number(r[3]));
    q.set(String(r[0]), m);
  }
  let allGrow = true, big = '', bigTotal = 0, bigLast = 0, lastKey = 0;
  for (const [reg, m] of q) {
    const ks = [...m.keys()].sort((a, b) => a - b);
    for (let i = 1; i < ks.length; i++) if (m.get(ks[i])! < m.get(ks[i - 1])!) allGrow = false;
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    if (total > bigTotal) { bigTotal = total; big = reg; lastKey = ks[ks.length - 1]; bigLast = m.get(lastKey)!; }
  }
  return { allGrow, big, bigLast, lastLabel: `Q${(lastKey % 4) + 1} ${Math.floor(lastKey / 4)}` };
}
export const pivotAnswer = (tab: string, f: ReturnType<typeof quarterFacts>) =>
  `Here’s Total revenue by region and quarter, on a new ${tab} tab. ${f.allGrow ? 'Every region grew every single quarter.' : 'Most regions grew quarter on quarter.'} ${f.big} closed ${f.lastLabel} at ${say(f.bigLast)}. So the miss is small against a strong trend.`;
export const AFTER_PIVOT = [
  { id: 'pin', label: 'Publish and pin the summary to Finance weekly' },
];

// ── Step 5: publish and pin (a command; two questions first) ─────────────────
export const isPin = (p: string) => /\b(pin|publish|liveboard)\b/i.test(p);
export const PIN_INTRO = 'Two quick questions before I do that.';
export const PIN_ASK = [
  {
    question: 'Publish your changes first? A pinned tile shows the published version, and so does everyone you’ve shared with.',
    options: ['Publish, then pin', 'Keep it a draft'],
  },
  {
    question: 'Summary’s Next year uses growth rate, which lives only in this workbook. How should the tile behave?',
    options: ['Pin it as a snapshot', 'Make Assumptions an input table, then pin it live'],
  },
];
export const thinkPin = (live: boolean, board: string): ReasoningItem[] => [
  ...(live ? [{ kind: 'tool' as const, id: 'inp', title: 'Making Assumptions an input table', doneTitle: 'Assumptions now saves to FINANCE.PLANNING.ASSUMPTIONS', icon: 'database' as const }] : []),
  { kind: 'tool', id: 'pub', title: 'Publishing your changes', doneTitle: 'Published your changes', icon: 'upload' },
  { kind: 'tool', id: 'pin', title: `Pinning Summary to ${board}`, doneTitle: `Pinned Summary to ${board}`, icon: 'pin' },
];
export const pinAnswer = (live: boolean, board: string) =>
  live
    ? `Published, and Summary is on ${board} as a live tile. Assumptions is an input table now, so when someone changes the growth rate the tile follows.`
    : `Published, and Summary is on ${board} as a snapshot. It shows today’s numbers. If you want it to follow growth-rate changes, ask me to make Assumptions an input table.`;
export const PIN_DRAFT = 'Okay, it stays a draft. A pinned tile needs a published version, so I haven’t pinned anything yet.';
export const AFTER_PIN = [
  { id: 'app', label: 'Regional leads need to update their plan every month' },
];

// ── Step 6: an app for regional leads (a goal → Faris's Apps flow) ───────────
export const isApp = (p: string) => /\b(app|leads?|update their plan|regional)\b/i.test(p);
export const THINK_APP: ReasoningItem[] = [
  {
    kind: 'text',
    id: 'need',
    summaryHeader: 'Reading what you need',
    text: 'Regional leads should change their own plan, not the whole workbook. Plan is already an input table keyed by Region and Month, so an app can write straight to it.',
  },
  { kind: 'tool', id: 'plan', title: 'Reading the Plan input table', doneTitle: 'Plan: 4 regions, by month, saves to FINANCE.PLANNING.PLAN_BY_REGION', icon: 'database' },
];
/** App styles, named the way Excel names its table styles. */
export type AppStyle = 'light' | 'banded' | 'dark';
export const APP_STYLES: { id: AppStyle; label: string; plan: string }[] = [
  { id: 'light', label: 'Light: plain rows, like Excel’s default table', plan: 'Light, plain rows' },
  { id: 'banded', label: 'Medium: banded rows, like Excel’s Medium styles', plan: 'Medium, banded rows' },
  { id: 'dark', label: 'Dark: a strong header row, like Excel’s Dark styles', plan: 'Dark, strong header row' },
];
export const styleFor = (answer: string): AppStyle => APP_STYLES.find((x) => x.label === answer)?.id ?? 'light';

// Faris's context readout (chatIntroCopy / lbIntroCopy grammar): when the app is seeded from something
// the user already has, the agent says what it knows and asks nothing about data. One question left.
export const APP_INTRO =
  'A data app fits. I’ve got everything from this workbook: it’s built on the Finance model, Plan is an input table keyed by Region and Month, and Summary already has actual, plan and variance. So there’s nothing to set up on data. Two quick questions.';
export const APP_ASK = [
  // Approval is not an app step (Vivek, 4 Nov): it goes through the workbook / sheet publish and share flow.
  { question: 'Who uses it?', options: ['Regional leads', 'The finance team, all regions'] },
  // The style step (Faris's flow has one; Vivek, 3 Nov: like Excel's table styles).
  { question: 'How should it look?', options: APP_STYLES.map((x) => x.label) },
];
export const APP_BULLETS = [
  'Each lead picks their region and sees actual, plan and variance for the last 6 months',
  'They change plan month by month; it saves to the Plan input table',
];
export const AFTER_APP = [
  { id: 'publish-app', label: 'Publish and share it with the regional leads' },
];
export const appPlan = (answer: string, style: AppStyle = 'light') => {
  const audience = /finance team/i.test(answer) ? 'The finance team, all regions' : 'Regional leads, each in their own region';
  return { ...appPlanFor(audience, style), style };
};
const appPlanFor = (audience: string, style: AppStyle) => ({
  title: 'Regional plan update',
  description: `An app for ${audience.toLowerCase()} to check actual against plan and update plan month by month.`,
  rows: [
    { label: 'Users', value: audience },
    { label: 'Shows', value: 'Actual, plan and variance for the last 6 months, by month' },
    { label: 'Can change', value: 'Plan revenue, month by month' },
    { label: 'Writes to', value: 'The Plan input table: FINANCE.PLANNING.PLAN_BY_REGION' },
    { label: 'Style', value: APP_STYLES.find((x) => x.id === style)!.plan },
  ],
});
export const APP_STEPS = [
  'Read the Plan and Finance tabs',
  'Added a region picker',
  'Added actual, plan and variance for the last 6 months',
  'Made plan editable, saving to the Plan input table',
];
export const APP_BUILT = 'It reads the same numbers you do. Publish the workbook and share it with the regional leads to let them in.';

// After the app: publish so the leads can use it. Sharing itself stays with the user (the Share dialog).
export const isShareApp = (p: string) => /\bshare it with\b/i.test(p);
export const THINK_SHARE_APP: ReasoningItem[] = [
  { kind: 'tool', id: 'pub', title: 'Publishing the workbook', doneTitle: 'Published the workbook with Regional plan update', icon: 'upload' },
];
export const SHARE_APP_ANSWER = 'Published. To let the regional leads in, open Share at the top and add them; each lead sees only their own region in the app.';
