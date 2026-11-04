import React from 'react';
import { Alert, Button, Card, Divider, Legend, Typography, Horizontal, Vertical } from '@/components';
import { StatusPill } from './primitives';
import { ReceiptBox, CalculatorBox, type HookBoxStyle } from './HookBoxes';
import { CacheFlowAnimation } from './CacheFlowAnimation';
import { LedgerAnimation } from './LedgerAnimation';
import { CacheMarkIcon } from './CacheMarkIcon';
import { spacing } from '../styles';
import styles from './CachingHook.module.css';
import { computeEstimate, defaultEstimate, formatRowsFull, MODEL_BAR_QUERIES } from '../utils';
import type { DataModel, EstimateInputs, Plan } from '../types';

const NOT_ENABLED = 'Contact your ThoughtSpot rep to enable caching.';

export type HeroStyle = 'icon' | 'animation' | 'none';
/** The texture behind the hook, fading towards the edges. */
export type HookBackground = 'none' | 'dots' | 'lines';
export const BACKGROUND_OPTIONS: { id: HookBackground; label: string }[] = [
  { id: 'dots', label: 'Dot grid, fading' },
  { id: 'lines', label: 'Line grid, fading' },
  { id: 'none', label: 'None' },
];
/** Stacked: hero, title, CTA and the box in one centred column. Columns: the pitch left, the box right. */
export type HookLayout = 'stacked' | 'columns';
export const LAYOUT_OPTIONS: { id: HookLayout; label: string }[] = [
  { id: 'stacked', label: 'Stacked · one column' },
  { id: 'columns', label: 'Two columns · pitch left, box right' },
];
export const HERO_OPTIONS: { id: HeroStyle; label: string }[] = [
  { id: 'icon', label: 'Icon' },
  { id: 'animation', label: 'Animation' },
  { id: 'none', label: 'Nothing' },
];
export type AnimationStyle = 'planes' | 'ledger';
export const ANIMATION_OPTIONS: { id: AnimationStyle; label: string }[] = [
  { id: 'planes', label: 'Queries through two planes' },
  { id: 'ledger', label: 'Ledger · a tailed log' },
];
export type IconStyle = 'figma' | 'mark';
export const ICON_OPTIONS: { id: IconStyle; label: string }[] = [
  { id: 'figma', label: 'The Figma illustration' },
  { id: 'mark', label: 'Cache mark, lit' },
];

/** One benefit line in the PM's layout: the number, the claim, the reason. */
const Benefit: React.FC<{ figure: string; prefix?: string; title: string; sub: string }> = ({ figure, prefix, title, sub }) => (
  <Horizontal gap={spacing.D} align="center" className={styles.benefit}>
    <div className={styles.figure}>
      {prefix && (
        <Typography variant="footnote" color="gray-light" as="span" noMargin>
          {prefix}{' '}
        </Typography>
      )}
      <Typography variant="modal-title" color="base" as="span" noMargin>
        {figure}
      </Typography>
    </div>
    <Vertical gap={0}>
      <Typography variant="content-label" color="base" noMargin>{title}</Typography>
      <Typography variant="footnote" color="gray-light" noMargin>{sub}</Typography>
    </Vertical>
  </Horizontal>
);

/** "Cost to cache this model … $0": the line that says it is in the plan. (PM's box, unchanged.) */
const CostRow: React.FC<{ cacheHours: number; plan: Plan }> = ({ cacheHours, plan }) => (
  <Horizontal justify="space-between" align="center" gap={spacing.D} className={styles.costRow}>
    <Vertical gap={0}>
      <Typography variant="content-label" color="base" noMargin>Cost to cache this model</Typography>
      <Typography variant="footnote" color="gray-light" noMargin>
        About {formatRowsFull(cacheHours)} of your {formatRowsFull(plan.freeHours)} free hours
      </Typography>
    </Vertical>
    <Typography variant="modal-title" color="base" as="span" noMargin>$0</Typography>
  </Horizontal>
);

/**
 * The Caching tab before a model is cached: the PLG hook. Title and the CTA
 * first, then the PM's box (the reference's card, content and visual as
 * designed) below them. A heavy model gets its own warehouse-load numbers; a
 * low-usage model gets the illustrative "as usage grows" chart, since its own
 * numbers would not make the case. Edit lets the user put in their own numbers.
 */
export const CachingHook: React.FC<{
  model: DataModel;
  plan: Plan;
  enabled: boolean;
  onCache: () => void;
  onLearnMore: () => void;
  onEstimate: (next: EstimateInputs) => void;
  boxStyle: HookBoxStyle;
  /** The hero above the title: the Figma illustration, or the two-planes animation. */
  hero: HeroStyle;
  animation: AnimationStyle;
  icon: IconStyle;
  layout: HookLayout;
  background: HookBackground;
}> = ({ model, plan, enabled, onCache, onLearnMore, onEstimate, boxStyle, hero, animation, icon, layout, background }) => {
  const heroEl =
    hero === 'none' ? null
    : hero === 'animation' ? (animation === 'ledger' ? <LedgerAnimation /> : <CacheFlowAnimation />)
    : icon === 'mark' ? <CacheMarkIcon /> : <img src="/data-cache/empty-state.svg" alt="" width={140} height={118} />;
  const inputs = model.estimate ?? defaultEstimate(model);
  const r = computeEstimate(inputs, plan);
  const heavy = inputs.queriesPerMonth >= MODEL_BAR_QUERIES;

  // The PM's card, as designed (2 Nov): "Warehouse load" for a heavy model, "As usage grows"
  // for a low-usage one. Its own labels, no Edit.
  const pmCard = heavy ? (
    <Card className={styles.card}>
      <Vertical gap={spacing.D} className={styles.cardBody}>
        <Horizontal justify="space-between" align="center">
          <Typography variant="content-label" color="base" noMargin>Warehouse load</Typography>
          <StatusPill kind="neutral" label="Last 30 days" compact />
        </Horizontal>
        <Vertical gap={spacing.B}>
          <Horizontal justify="space-between" align="center">
            <Typography variant="body-normal" color="gray-light" noMargin>Without caching</Typography>
            <Typography variant="body-normal" color="base" noMargin>{formatRowsFull(inputs.queriesPerMonth)}</Typography>
          </Horizontal>
          <div className={styles.bar} />
          <Horizontal justify="space-between" align="center">
            <Typography variant="body-normal" color="gray-light" noMargin>With caching</Typography>
            <Typography variant="body-normal" color="base" noMargin>as few as ~{formatRowsFull(r.stillReaching)}</Typography>
          </Horizontal>
          <div className={`${styles.bar} ${styles.barShaded}`}>
            <i className={styles.barSolid} style={{ width: `${100 - inputs.hitPct}%` }} />
          </div>
          <Typography variant="footnote" color="gray-light" noMargin>Shaded area: queries that could use cached data</Typography>
        </Vertical>
        <Divider />
        <Horizontal gap={spacing.E} align="start">
          <Vertical gap={0} className={styles.stat}>
            <Typography variant="modal-title" color="base" as="span" noMargin>{formatRowsFull(r.warehouseHours)} h</Typography>
            <Typography variant="footnote" color="gray-light" noMargin>warehouse query time on this model, 30 d</Typography>
          </Vertical>
          <Vertical gap={0} className={styles.stat}>
            <Typography variant="modal-title" color="success" as="span" noMargin>{formatRowsFull(plan.freeHours)} h</Typography>
            <Typography variant="footnote" color="gray-light" noMargin>free query hours a month, included in your plan</Typography>
          </Vertical>
        </Horizontal>
        <CostRow cacheHours={r.cacheHours} plan={plan} />
        <Typography variant="footnote" color="gray-light" noMargin>
          Estimate assumes up to 80% of queries use cached data. Results vary with your data, date range and refresh schedule.
        </Typography>
      </Vertical>
    </Card>
  ) : (
    <Card className={styles.card}>
      <Vertical gap={spacing.D} className={styles.cardBody}>
        <Horizontal justify="space-between" align="center">
          <Typography variant="content-label" color="base" noMargin>As usage grows</Typography>
          <StatusPill kind="neutral" label="Illustrative" compact />
        </Horizontal>
        <Typography variant="body-normal" color="gray-light" noMargin>
          More users asking Spotter means more queries. When those queries use cached data, warehouse load can stay close to flat.
        </Typography>
        <svg className={styles.chart} viewBox="0 0 380 150" role="img" aria-label="Illustrative chart: total queries rise, warehouse queries stay close to flat">
          <g className={styles.grid}>
            <line x1="20" y1="30" x2="370" y2="30" />
            <line x1="20" y1="65" x2="370" y2="65" />
            <line x1="20" y1="100" x2="370" y2="100" />
            <line x1="20" y1="135" x2="370" y2="135" />
          </g>
          <path className={styles.area} d="M20 128 C 140 126, 250 100, 370 22 L 370 118 C 250 124, 140 126, 20 128 Z" />
          <path className={styles.lineTotal} d="M20 128 C 140 126, 250 100, 370 22" />
          <path className={styles.lineWarehouse} d="M20 128 C 140 127, 250 124, 370 118" />
        </svg>
        <Legend
          dotShape="line"
          items={[
            { label: 'Total queries', color: 'var(--rd-sys-color-content-tertiary)' },
            { label: 'Warehouse queries', color: 'var(--rd-sys-color-content-brand)' },
          ]}
        />
        <Divider />
        <Horizontal justify="space-between" align="center" gap={spacing.C}>
          <StatusPill kind="neutral" label="Last 30 days" compact />
          <Typography variant="footnote" color="gray-light" noMargin>
            {formatRowsFull(inputs.queriesPerMonth)} queries · {formatRowsFull(r.warehouseHours)} h warehouse query time
          </Typography>
        </Horizontal>
        <CostRow cacheHours={r.cacheHours} plan={plan} />
      </Vertical>
    </Card>
  );

  // The PM's layout as designed: the case on the left (eyebrow, headline, two paragraphs,
  // three benefits, the CTA), the card on the right.
  if (boxStyle === 'original') {
    return (
      <Horizontal gap={spacing.I} align="start" className={styles.pmLayout}>
        <Vertical gap={spacing.E} className={styles.pmCopy}>
          <Typography variant="overline" color="gray-light" noMargin>How you benefit</Typography>
          <Typography variant="page-title" color="base" as="h2" noMargin>
            Your data isn’t always changing. Why keep incurring DW query cost?
          </Typography>
          <Typography variant="body-normal" color="gray-light" noMargin>
            Most business data updates periodically, not every second. Yet dashboards and AI agents keep querying your warehouse as if every second matters.
          </Typography>
          <Typography variant="body-normal" color="gray-light" noMargin>
            Cache frequently used data to deliver fast answers, reduce warehouse load, and lower costs by 30–60%. ThoughtSpot refreshes the cache on the schedule you set.
          </Typography>
          <Vertical gap={spacing.C} className={styles.benefits}>
            <Benefit figure="30–60%" title="Lower warehouse cost" sub="Fewer queries reach your warehouse." />
            <Benefit figure="80%" prefix="Up to" title="Queries from cache" sub="Most queries only need recent data." />
            <Benefit figure="AI" title="Scale Spotter freely" sub="More AI questions, less warehouse load." />
          </Vertical>
          <Horizontal gap={spacing.C} align="center">
            <Button variant="primary" onClick={onCache} disabled={!enabled}>Cache Model</Button>
            <Button variant="tertiary" onClick={onLearnMore}>Learn more</Button>
          </Horizontal>
          {!enabled && <Alert status="info" variant="section" dismissible={false} message={NOT_ENABLED} />}
        </Vertical>
        {pmCard}
      </Horizontal>
    );
  }

  const box = boxStyle === 'receipt' ? <ReceiptBox inputs={inputs} plan={plan} /> : <CalculatorBox inputs={inputs} plan={plan} onChange={onEstimate} />;

  // Two columns (Francois, 4 Nov): the pitch on the left, the box on the right, filling the width.
  const bgClass = background === 'dots' ? styles.bgDots : background === 'lines' ? styles.bgLines : '';
  if (layout === 'columns') {
    return (
      <Horizontal gap={spacing.I} align={heroEl ? 'start' : 'center'} className={`${styles.columns} ${bgClass}`}>
        <Vertical gap={spacing.C} className={`${styles.colLeft} ${heroEl ? '' : styles.colLeftLifted}`}>
          <Typography variant="page-title" color="base" as="h2" noMargin className={styles.colTitle}>Cache to reduce query cost</Typography>
          <Typography variant="body-large" color="gray-light" noMargin className={styles.colText}>
            Your ThoughtSpot plan includes {formatRowsFull(plan.freeHours)} query hours and {plan.freeGB} GB storage. ThoughtSpot refreshes the cache on the schedule you set.
          </Typography>
          {heroEl && <div className={styles.colHero}>{heroEl}</div>}
          <Horizontal gap={spacing.C} align="center" className={styles.cta}>
            <Button variant="primary" size="large" onClick={onCache} disabled={!enabled} className={styles.ctaButton}>Cache Model</Button>
            <Button variant="tertiary" onClick={onLearnMore}>Learn more</Button>
          </Horizontal>
          {!enabled && <Alert status="info" variant="section" dismissible={false} message={NOT_ENABLED} />}
        </Vertical>
        <div className={styles.colRight}>{box}</div>
      </Horizontal>
    );
  }

  return (
    <>
      <Vertical gap={spacing.G} align="center" className={`${styles.layout} ${bgClass}`}>
        {/* Title and description one step up from the DS empty state (Vivek, 4 Nov): page-title and
            body-large, and the CTA at its largest. Composed from Typography rather than NoData. */}
        <Vertical align="center" gap={spacing.B} className={styles.intro}>
          {heroEl}
          <Typography variant="page-title" color="base" as="h2" noMargin>Cache to reduce query cost</Typography>
          <Typography variant="body-large" color="gray-light" noMargin className={styles.introText}>
            Your ThoughtSpot plan includes {formatRowsFull(plan.freeHours)} query hours and {plan.freeGB} GB storage.
          </Typography>
          <div className={styles.cta}>
            <Button variant="primary" size="large" onClick={onCache} disabled={!enabled} className={styles.ctaButton}>Cache Model</Button>
          </div>
          {!enabled && <Alert status="info" variant="section" dismissible={false} message={NOT_ENABLED} />}
        </Vertical>
        <div className={styles.boxSlot}>{box}</div>
        <Button variant="tertiary" onClick={onLearnMore}>Learn more</Button>
      </Vertical>

    </>
  );
};
