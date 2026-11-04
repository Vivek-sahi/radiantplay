import type { ComponentSpec, SpecApproval } from '@/app-chrome/SpecSheet/types';
import { DataCacheViewV3, defaultOrgEstimate } from './components/DataCacheViewV3';
import { CachingHook } from './components/CachingHook';
import { CalculatorBox } from './components/HookBoxes';
import { LimitBanner, type Limit } from './components/LimitBanner';
import { StatusPill } from './components/primitives';
import { orgs, plan } from './data';
import type { Org } from './types';

import pageSrc from './components/DataCacheViewV3.tsx?raw';
import pageCss from './components/DataCacheViewV3.module.css?raw';
import hookSrc from './components/CachingHook.tsx?raw';
import boxSrc from './components/HookBoxes.tsx?raw';
import limitSrc from './components/LimitBanner.tsx?raw';
import utilsSrc from './utils.ts?raw';

/**
 * PARKED (Vivek, 5 Nov): renamed from spec.tsx so the Prototype / Spec switch does not
 * show. Rename back to spec.tsx to bring the handoff spec back. Not up to date with the
 * compute-hours change ($3 per compute hour).
 *
 * Data Cache (PLG): the engineering handoff, drafted 4 Nov 2026 from the code and
 * Vivek's rulings in session. DRAFT until Vivek approves it.
 *
 * The caching workflow itself (Caching Settings modal, runs, run history, purge,
 * disable) is Pulse's and is unchanged; this spec covers only what is new.
 */

const noop = () => {};

const page = (org: Org, opts: { enabled?: boolean; limit?: Limit } = {}) => () => (
  <DataCacheViewV3
    org={org}
    models={org.models}
    plan={plan}
    enabled={opts.enabled ?? true}
    banner="modal"
    titleTag="none"
    planLine="plain"
    limit={opts.limit ?? 'none'}
    savingForAll={false}
    estimate={defaultOrgEstimate(org)}
    onEstimate={noop}
    onOpenModel={noop}
    onCacheModel={noop}
  />
);

const heavyModel = orgs.retail.models[0];
const hook = (opts: { enabled?: boolean; blocked?: boolean } = {}) => () => (
  <CachingHook
    model={heavyModel}
    plan={plan}
    enabled={opts.enabled ?? true}
    blocked={opts.blocked}
    onCache={noop}
    onLearnMore={noop}
    onEstimate={noop}
    boxStyle="calculator"
    hero="none"
    animation="planes"
    icon="figma"
    layout="columns"
    background="dots"
  />
);

const changedFromPulse = [
  'New: the Data Cache page (nav item with a "New" tag), the Caching tab empty state, the estimate calculator and modal, the plan-limit banners.',
  'Unchanged from Pulse, do not rebuild: Caching Settings modal, cache runs and run history, Model changed / Error states, purge and disable, the not-cacheable empty state on the Caching tab.',
  'Every number in the prototype comes from mock data (data.ts). The formulas are in utils.ts, constants in one place.',
];

export const specs: ComponentSpec[] = [
  {
    id: 'data-cache-page',
    name: 'Data Cache page',
    summary:
      'Org-level page under Data workspace. Shows what caching could save, what the plan includes, and every model with its caching state. The savings banner always shows, for every org.',
    tags: ['New', 'Light and dark'],
    preview: page(orgs.retail),
    anatomy: [
      { name: 'Title', description: '"Data Cache", with the plan line under it: "Your plan includes 1,000 query hours and 500 GB of cache storage a month."' },
      { name: 'Not-enabled notice', description: 'Only when caching is off on the cluster: "Contact your ThoughtSpot rep to enable caching."' },
      { name: 'Limit banner', description: 'Only when query hours are used up or storage is full. See Plan-limit banner.' },
      { name: 'Savings banner', description: 'See Savings banner. Always shown.' },
      { name: 'Usage tiles', description: 'Query hours (of 1,000, with meter) · Storage (of 500 GB, with meter) · Queries served from cache · Warehouse cost avoided. No subtext while nothing is cached.' },
      { name: 'Models list', description: 'See Models list.' },
    ],
    states: [
      { label: 'Nothing cached, plan covers all models', note: '?scenario=retail', render: page(orgs.retail) },
      { label: 'Nothing cached, plan covers part', note: '?scenario=global · coverage below 100%, rows past the free hours show Add hours', render: page(orgs.global) },
      { label: 'Small org (below the threshold)', note: '?scenario=claims · banner still shows; saving column hidden (open question)', render: page(orgs.claims) },
      { label: 'Models cached', note: '?scenario=cached · tiles filled, statuses on rows', render: page(orgs.cached) },
      { label: 'Caching not enabled on the cluster', note: '?enabled=0 · notice, every action disabled', render: page(orgs.retail, { enabled: false }) },
      { label: 'Query hours used up', note: '?scenario=cached&limit=hours', render: page(orgs.cached, { limit: 'hours' }) },
      { label: 'Storage full', note: '?scenario=cached&limit=storage', render: page(orgs.cached, { limit: 'storage' }) },
    ],
    behaviour: [
      { trigger: 'Page loads', result: 'Shows the savings banner for every org, including small orgs and when caching is not enabled.' },
      { trigger: 'Usage tiles, nothing cached', result: 'Values read 0 / $0 with no subtext.' },
      { trigger: 'Usage tiles, models cached', result: 'Query hours = sum of the cached models\' query hours; Storage = sum of cache sizes; Queries served from cache and Warehouse cost avoided ($0.05 × queries served) from the cache analytics.' },
    ],
    files: [
      { path: 'src/prototypes/DataCache/components/DataCacheViewV3.tsx', holds: 'The page, banner, tiles and list' },
      { path: 'src/prototypes/DataCache/utils.ts', holds: 'Every formula and constant' },
      { path: 'src/prototypes/DataCache/data.ts', holds: 'Mock orgs and models' },
    ],
    sources: [
      { title: 'DataCacheViewV3.tsx', code: pageSrc },
      { title: 'DataCacheViewV3.module.css', code: pageCss },
      { title: 'utils.ts', code: utilsSrc },
    ],
    notes: [
      ...changedFromPulse,
      'Out of scope: everything behind Design explorations in the prototype settings (v1, v2, other banner layouts, heroes, animations, plan-line styles). Build only the default.',
    ],
  },
  {
    id: 'savings-banner',
    name: 'Savings banner',
    summary: 'The headline of the Data Cache page: the estimated yearly saving on the left, the pitch and the coverage line on the right, and a button that opens the estimate modal.',
    tags: ['New'],
    anatomy: [
      { name: 'Saving figure', description: 'Range, e.g. "$287k–$382k/yr", in success green.' },
      { name: 'Basis line', description: '"At $0.05 per warehouse query, with 80% queries served from DataCache". Both numbers follow the estimate inputs. Wraps to two lines (max 280px).' },
      { name: 'Title', description: '"Estimated cost savings"' },
      { name: 'Description', description: '"With DataCache, 60-80% of your warehouse queries on cacheable models can be executed extremely fast and at no cost. Your plan includes 1,000 query hours, enough to cache N% of your models." N is bold.' },
      { name: 'Button', description: '"Estimate your saving" (secondary). Opens the estimate modal.' },
    ],
    behaviour: [
      { trigger: 'Saving figure', result: 'Yearly saving = queries a month × 365 / 30 × share served from cache × cost per query. Shown as a range from 75% to 100% of that (the 60–80% band).' },
      { trigger: 'Default inputs (org level)', result: 'Queries a month = the org\'s warehouse queries in 30 d × the share on cacheable models; served from cache 80%; $0.05 per query.' },
      { trigger: 'Coverage N%', result: 'N = min(100, plan query hours ÷ query hours needed to cache every cacheable model × 100). Query hours needed = warehouse query hours of the cacheable models in 30 d (1:1 placeholder, see notes). Retail 100%, Global 42%.' },
      { trigger: 'Estimate modal saved', result: 'The banner figure and basis line update to the new inputs.' },
    ],
    notes: [
      'Placeholder maths: cache query hours are taken 1:1 with the warehouse query hours they replace, until the real compute-hour formula lands.',
      'Open (waiting on leadership + Harviish): per Harviish, cache query hours = queries × average cache query time. Once that average is confirmed, coverage N% should use the same derivation as the calculator\'s "~X of your 1,000 query hours" line, so the page and the Caching tab agree.',
      'Open: the first sentence is passive; Vivek has it as "ok for now".',
    ],
  },
  {
    id: 'models-list',
    name: 'Models list',
    summary: 'Every model, cacheable first then not cacheable, each sorted by warehouse queries (high to low). Top 10, then Show all.',
    tags: ['New'],
    anatomy: [
      { name: 'Model', description: 'Name, links to the model.' },
      { name: 'Warehouse queries, 30 d', description: 'Count.' },
      { name: 'Query hours, 30 d', description: 'Warehouse query time, in hours.' },
      { name: 'Est. saving / yr', description: 'Per-model saving range, success green. "—" when the model cannot be cached.' },
      { name: 'Action / status', description: 'One fixed-width slot, right-aligned: a button or a status in the same shape and width.' },
      { name: 'Show all N models', description: 'Under the table. N = models in use in the org.' },
    ],
    states: [
      { label: 'Cached', render: () => <StatusPill kind="success" label="Cached" asButton /> },
      { label: 'In progress', render: () => <StatusPill kind="neutral" label="In progress" asButton /> },
      { label: 'Error', render: () => <StatusPill kind="failure" label="Error" asButton /> },
      { label: 'Model changed', render: () => <StatusPill kind="warning" label="Model changed" asButton /> },
      { label: 'Paused (query hours used up)', render: () => <StatusPill kind="warning" label="Paused" asButton /> },
    ],
    behaviour: [
      { trigger: 'Cacheable, fits the free hours left', result: 'Cache Model (secondary, small). Opens the model\'s Caching tab with Caching Settings open.' },
      { trigger: 'Cacheable, does not fit the free hours left', result: 'Add hours. Opens the Add query hours modal. Fit is judged per row: the model\'s query hours ≤ plan hours − hours already used by cached models.' },
      { trigger: 'Not cacheable', result: 'Cache Model, disabled. No reason text, no tooltip. Saving shows "—".' },
      { trigger: 'Cached / in progress / error / model changed', result: 'Status in the button\'s shape and width; only text and colour change. No "Refreshed" text.' },
      { trigger: 'Saving column once a model is cached', result: 'Keeps the same estimate as before caching.' },
      { trigger: 'Show all', result: 'Lists every model. Not wired in the prototype.' },
      { trigger: 'Caching not enabled', result: 'Every button disabled.' },
    ],
    notes: [
      'Open: below the threshold (small org) the saving column is hidden, while the banner shows dollars. Vivek to decide whether it shows for every org.',
      'Per-model saving uses the same formula as the banner at 80% and $0.05.',
    ],
  },
  {
    id: 'caching-tab',
    name: 'Caching tab, model not cached',
    summary: 'The empty state of a model\'s Caching tab: the pitch and the CTA on the left, the calculator on the right.',
    tags: ['New', 'Light and dark'],
    preview: hook(),
    anatomy: [
      { name: 'Title', description: '"Cache to reduce query cost"' },
      { name: 'Description', description: '"Your data doesn\'t change every second. Cache your data in ThoughtSpot and refresh it on your schedule. Your plan includes 1,000 query hours and 500 GB storage."' },
      { name: 'Cache Model', description: 'Primary, large. Opens Caching Settings (Pulse).' },
      { name: 'Learn more', description: 'Tertiary. Goes to documentation (link TBD).' },
      { name: 'Calculator', description: 'See Estimate calculator.' },
    ],
    states: [
      { label: 'Default', render: hook() },
      { label: 'Caching not enabled', note: 'CTA disabled, notice under it', render: hook({ enabled: false }) },
      { label: 'Plan limit reached', note: 'CTA disabled; the limit banner sits above the tab content', render: hook({ blocked: true }) },
    ],
    measurements: [
      { element: 'Description max width', px: 520 },
      { element: 'Calculator column', px: 640 },
      { element: 'Gap between columns', px: 40 },
    ],
    files: [{ path: 'src/prototypes/DataCache/components/CachingHook.tsx', holds: 'The tab\'s empty state' }],
    sources: [{ title: 'CachingHook.tsx', code: hookSrc }],
    notes: [
      'Same layout for heavy and low-usage models.',
      'Open: the Learn more link target (documentation page not written yet).',
      'Out of scope: the hero, animation, background and box options under Design explorations.',
    ],
  },
  {
    id: 'calculator',
    name: 'Estimate calculator',
    summary: 'Live estimate for one model on its Caching tab. The same inputs appear org-wide in the estimate modal on the Data Cache page.',
    tags: ['New'],
    preview: () => <CalculatorBox inputs={{ queriesPerMonth: 228_790, avgQuerySeconds: 4.2, hitPct: 80, ratePerQuery: 0.05, hoursPerMonth: 267, ratePerHour: 3 }} plan={plan} onChange={noop} />,
    anatomy: [
      { name: 'Title', description: '"Estimated savings"' },
      { name: 'Result', description: 'Saving on a subtle surface, "$84k–$111k/yr", then the basis line "At $0.05 per warehouse query, with 80% queries served from DataCache", live from the inputs. Same figure format and basis line as the Data Cache page banner and the estimate modal.' },
      { name: 'Queries on this model', description: 'Number field. Help: "Last 30 days". Prefilled from the model\'s warehouse queries.' },
      { name: 'Warehouse cost per query ($)', description: 'Number field, default 0.05.' },
      { name: 'Queries served from cache', description: 'Slider 0–100% in steps of 5, default 80. Help: "Most models reach 60 to 80%".' },
      { name: 'Query hours line', description: '"Caching this model uses ~32 of your 1,000 query hours", small, at the bottom.' },
    ],
    behaviour: [
      { trigger: 'Any input changes', result: 'Result recalculates immediately; the edits are kept for that model.' },
    ],
    files: [{ path: 'src/prototypes/DataCache/components/HookBoxes.tsx', holds: 'CalculatorBox and CalculatorInputs' }],
    sources: [{ title: 'HookBoxes.tsx', code: boxSrc }],
    notes: [
      'Units (Harviish, 4 Nov): inputs stay in queries and the saving in $ per query (what telemetry has, how customers read their bill); the cost side is query hours on the cache (what we meter), derived from queries. Final call with leadership. Open: the query hours line differs between the two calculators ("~32 of your 1,000 query hours" here, "enough to cache N% of your models" on the page) and is not decided. "~32" is static text. Harviish\'s formula is queries × average cache query time; the average and the period (month or year) are not confirmed. Our own 1:1 placeholder would give ~267 h for this model.',
      'Estimate modal (Data Cache page): same three inputs, labelled "Queries on your cacheable models" / "Last 30 days"; Cancel and Save. Same figure and basis line as the calculator. Open: the slider label.',
    ],
  },
  {
    id: 'limit-banner',
    name: 'Plan-limit banner',
    summary: 'Warning banner (Radiant Alert, section multi-line, full width) at the top of the Data Cache page and of every model\'s Caching tab when a plan limit is reached.',
    tags: ['New'],
    preview: () => <LimitBanner limit="hours" plan={plan} />,
    states: [
      { label: 'Query hours used up', render: () => <LimitBanner limit="hours" plan={plan} /> },
      { label: 'Storage full', render: () => <LimitBanner limit="storage" plan={plan} /> },
    ],
    behaviour: [
      { trigger: 'Query hours used up', result: 'Caching pauses until the 1st; queries run on the warehouse; nothing is charged. Cached models show Paused, every uncached model shows Add hours, Cache Model is disabled on the Caching tab. Hours tile shows 1,000 of 1,000, "Used up on 22 Nov. Resets 1 Dec".' },
      { trigger: 'Storage full', result: 'Existing caches keep refreshing; no new model can be cached until storage is added or a cache is purged. Cache Model disabled everywhere. Storage tile shows 500 GB of 500 GB, "Full".' },
      { trigger: 'More hours or storage', result: 'No button on the banner: customers contact sales (Vivek, 4 Nov).' },
    ],
    files: [{ path: 'src/prototypes/DataCache/components/LimitBanner.tsx', holds: 'Banner and its modal' }],
    sources: [{ title: 'LimitBanner.tsx', code: limitSrc }],
    notes: [
      'Query-hours copy is the PM\'s ("compute" → "query").',
      'Open: storage-full copy is a placeholder for Vivek\'s wording.',
      'Open: the dates (22 Nov, 1 Dec) are mock; the real ones come from the billing cycle.',
    ],
  },
];

export const approval: SpecApproval = { status: 'draft' };
