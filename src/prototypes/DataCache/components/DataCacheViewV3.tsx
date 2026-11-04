import React, { useState } from 'react';
import { Alert, Button, Card, Icon, Link, Modal, ModalFooter, ProgressBar, Table, Typography, Horizontal, Vertical } from '@/components';
import type { IconName, TableColumn } from '@/components';
import { StatusPill, SectionHeader, FloatingToast, type PillKind } from './primitives';
import { AddHoursModal } from './AddHoursModal';
import { LimitBanner, type Limit } from './LimitBanner';
import { EstimateModal } from './EstimateModal';
import { CalculatorInputs, ReceiptLines } from './HookBoxes';
import { c, spacing } from '../styles';
import styles from './DataCacheViewV3.module.css';
import {
  allowancePct,
  computeEstimate,
  fitsFreeHours,
  planCoverage,
  formatCompact,
  formatRowsFull,
  gbUsed,
  hoursUsed,
  isCacheable,
  savingPerYear,
  usd,
  usdRange,
  usdRangeYr,
  estimateBasis,
  warehouseHours,
  RATE_PER_QUERY,
} from '../utils';
import type { DataModel, EstimateInputs, Org, Plan } from '../types';

/** The proposed designs (4 Nov): banner 1 with the calculator folded in, four ways. */
export type BannerStyle = 'inline' | 'modal' | 'receipt' | 'expand';
/** The tag beside the page title: nothing (the convention), a short neutral label, or the green pill. */
export type TitleTag = 'none' | 'neutral' | 'pill';

/** Ways to make the plan line under the title stand out (Vivek, 4 Nov). */
export type PlanLine = 'plain' | 'bold' | 'pills' | 'strip';
export const PLAN_LINE_OPTIONS: { id: PlanLine; label: string }[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'bold', label: 'Bold' },
  { id: 'pills', label: 'Pills' },
  { id: 'strip', label: 'Strip' },
];

export const TITLE_TAG_OPTIONS: { id: TitleTag; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'neutral', label: 'Included' },
  { id: 'pill', label: 'Green pill' },
];
export const BANNER_OPTIONS: { id: BannerStyle; label: string }[] = [
  { id: 'inline', label: 'Banner · the calculator inline' },
  { id: 'modal', label: 'Banner · calculator in a modal' },
  { id: 'receipt', label: 'Banner · receipt in a modal' },
  { id: 'expand', label: 'Banner · expands into the calculator' },
];

const NOT_ENABLED = 'Contact your ThoughtSpot rep to enable caching.';
const TOP = 10;
const ORG_SCOPE = 'Last 30 days, on your cacheable models';

/** Starting inputs for the org-level estimate: the queries on the cacheable models, at the ceiling and rate. */
export const defaultOrgEstimate = (org: Org): EstimateInputs => ({
  queriesPerMonth: Math.round((org.warehouseQueries30d * org.volumeShare) / 100),
  avgQuerySeconds: org.warehouseQueries30d > 0 ? Math.round(((org.warehouseHours30d * 3600) / org.warehouseQueries30d) * 10) / 10 : 3,
  hitPct: 80,
  ratePerQuery: RATE_PER_QUERY,
});

const cacheStatus = (m: DataModel): { kind: PillKind; label: string } => {
  const cache = m.cache!;
  if (cache.status === 'paused') return { kind: 'warning', label: 'Model changed' };
  if (cache.status === 'purged') return { kind: 'neutral', label: 'Purged' };
  if (cache.runs.some((r) => r.status === 'In progress')) return { kind: 'neutral', label: 'In progress' };
  if (cache.lastRunStatus === 'Error') return { kind: 'failure', label: 'Error' };
  return { kind: 'success', label: 'Cached' };
};
const queries = (m: DataModel) => m.usage?.warehouseQueries30d ?? 0;

const Tile: React.FC<{ icon: IconName; label: string; value: string; of?: string; meter?: number; sub: string }> = ({ icon, label, value, of, meter, sub }) => (
  <Card className={styles.tile}>
    <Vertical gap={spacing.C} className={styles.tileBody}>
      <Horizontal gap={spacing.B} align="center" className={styles.tileLabel}>
        <Icon name={icon} size="m" color={c['content-secondary']} />
        <Typography variant="content-label" color="base" noMargin>{label}</Typography>
      </Horizontal>
      <Horizontal gap={spacing.B} align="baseline">
        <Typography variant="page-title" color="base" as="span" noMargin>{value}</Typography>
        {of && <Typography variant="footnote" color="gray-light" as="span" noMargin>{of}</Typography>}
      </Horizontal>
      {meter !== undefined && <ProgressBar value={meter} color="blue" />}
      {sub && <Typography variant="footnote" color="gray-light" noMargin>{sub}</Typography>}
    </Vertical>
  </Card>
);

/**
 * The Data Cache page, proposed designs (4 Nov). Title with the Included pill, the plan
 * line, the banner (banner 1: the saving as a hero figure on a tinted panel, the copy
 * beside it, the calculator folded in one of four ways), the four metrics, then the
 * PM's table unchanged. The metrics are always there; nothing cached reads "0 of 1,000".
 */
export const DataCacheViewV3: React.FC<{
  org: Org;
  models: DataModel[];
  plan: Plan;
  enabled: boolean;
  banner: BannerStyle;
  titleTag: TitleTag;
  planLine: PlanLine;
  /** A plan limit reached: query hours used up, or storage full. */
  limit: Limit;
  /** Below the threshold the saving column is hidden; on, it shows for every org (open question). */
  savingForAll: boolean;
  estimate: EstimateInputs;
  onEstimate: (next: EstimateInputs) => void;
  onOpenModel: (modelId: string) => void;
  onCacheModel: (modelId: string) => void;
}> = ({ org, models, plan, enabled, banner, titleTag, planLine, limit, savingForAll, estimate, onEstimate, onOpenModel, onCacheModel }) => {
  const [addFor, setAddFor] = useState<DataModel | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [open, setOpen] = useState<null | 'calc' | 'receipt'>(null);
  const [expanded, setExpanded] = useState(false);

  // ── the numbers ──
  const cached = models.filter((m) => m.cache && m.cache.status !== 'purged');
  const n = cached.length;
  const used = hoursUsed(models);
  const hoursLeft = Math.max(0, plan.freeHours - used);
  const gb = gbUsed(models);
  const rows = cached.reduce((t, m) => t + m.cache!.rowCount, 0);
  const fromCache = cached.reduce((t, m) => t + (m.cache!.analytics?.cachedQueries ?? 0), 0);
  const onCached = cached.reduce((t, m) => t + (m.cache!.analytics?.totalQueries ?? 0), 0);
  const hitPct = onCached > 0 ? Math.round((fromCache / onCached) * 100) : 0;
  const saved = fromCache * RATE_PER_QUERY;
  const est = computeEstimate(estimate, plan);

  // ── the one list: the PM's table ──
  const byQueries = (a: DataModel, b: DataModel) => queries(b) - queries(a);
  const ordered = [...models.filter(isCacheable).sort(byQueries), ...models.filter((m) => !isCacheable(m)).sort(byQueries)];
  const list = ordered.slice(0, TOP); // top 10, no Show all (Vivek, 4 Nov)
  const fits = (m: DataModel) => fitsFreeHours(m, used, plan);
  const action = (row: DataModel) => {
    if (row.cache) {
      const s = cacheStatus(row);
      return limit === 'hours' ? <StatusPill kind="warning" label="Paused" asButton /> : <StatusPill kind={s.kind} label={s.label} asButton />;
    }
    // Not cacheable: a disabled Cache Model button in place of the reason text (Vivek, 4 Nov).
    if (!isCacheable(row)) return <Button variant="secondary" size="small" disabled>Cache Model</Button>;
    // Storage full: nothing new can be cached. Hours used up: every row asks for hours (the PM's frame).
    if (limit === 'storage') return <Button variant="secondary" size="small" disabled>Cache Model</Button>;
    return fits(row) && limit !== 'hours' ? (
      <Button variant="secondary" size="small" disabled={!enabled} onClick={() => onCacheModel(row.id)}>Cache Model</Button>
    ) : (
      <Button variant="secondary" size="small" disabled={!enabled} onClick={() => setAddFor(row)}>Add hours</Button>
    );
  };
  const columns: TableColumn<DataModel>[] = [
    { key: 'name', label: 'Model', render: (_v, row) => <Link href="#" onClick={(e) => { e.preventDefault(); onOpenModel(row.id); }}>{row.name}</Link> },
    { key: 'queries', label: 'Warehouse queries, 30 d', render: (_v, row) => formatRowsFull(queries(row)) },
    { key: 'hours', label: 'Query hours, 30 d', render: (_v, row) => `${formatRowsFull(warehouseHours(row))} h` },
    ...(org.aboveThreshold || savingForAll
      ? [{
          key: 'saving',
          label: 'Est. saving / yr',
          render: (_v: unknown, row: DataModel) => {
            if (!isCacheable(row)) return '—';
            // Same estimate before, during and after caching (Vivek, 4 Nov).
            return <Typography variant="content-label" color="success" as="span" noMargin>{usdRange(savingPerYear(queries(row)))}</Typography>;
          },
        }]
      : []),
    { key: 'action', label: '', width: '220px', align: 'right', render: (_v, row) => <div className={styles.actionSlot}>{action(row)}</div> },
  ];

  // ── the banner ──
  const hero = (
    <Vertical gap={spacing.A} className={styles.hero}>
      <Typography variant="headline-large" color="success" as="span" noMargin>{usdRangeYr(est.savingPerYear)}</Typography>
      <Typography variant="footnote" color="gray-light" noMargin className={styles.basis}>{estimateBasis(estimate)}</Typography>
      {banner === 'expand' && (
        <div className={styles.adjust}>
          <Button variant="tertiary" size="small" onClick={() => setExpanded((v) => !v)}>{expanded ? 'Done' : 'Adjust'}</Button>
        </div>
      )}
    </Vertical>
  );
  // Coverage copy: Vivek's line (4 Nov), the % from the PM's coverage maths.
  const cov = planCoverage(org, plan);
  const em = (text: string) => <Typography variant="content-label-subhead" color="base" as="span" noMargin>{text}</Typography>;
  const copy = (
    <Vertical gap={spacing.A}>
      <Typography variant="section-label" color="base" as="h2" noMargin>Estimated cost savings</Typography>
      <Typography variant="body-normal" color="gray-light" noMargin>
        With DataCache, 60-80% of your warehouse queries on cacheable models can be executed extremely fast and at no cost. Your plan includes {formatRowsFull(plan.freeHours)} query hours, enough to cache {em(`${cov.pct}%`)} of your models.
      </Typography>
    </Vertical>
  );
  const inputs = <CalculatorInputs inputs={estimate} onChange={onEstimate} queriesHelp={ORG_SCOPE} layout="row" />;
  const bannerEl = (
    <Card className={styles.banner}>
      <Horizontal gap={spacing.F} align="stretch" className={styles.bannerRow}>
        {hero}
        <Vertical gap={spacing.D} className={styles.bannerBody}>
          {copy}
          {banner === 'inline' && <div className={styles.inputs}>{inputs}</div>}
          {banner === 'modal' && <div><Button variant="secondary" onClick={() => setOpen('calc')}>Estimate your saving</Button></div>}
          {banner === 'receipt' && <div><Button variant="secondary" onClick={() => setOpen('receipt')}>How we got this number</Button></div>}
          {banner === 'expand' && expanded && <div className={styles.inputs}>{inputs}</div>}
        </Vertical>
      </Horizontal>
    </Card>
  );

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      <Vertical gap={spacing.B}>
        <Horizontal gap={spacing.C} align="center">
          <Typography variant="page-title" color="base" as="h1" noMargin>Data Cache</Typography>
          {enabled && titleTag === 'pill' && <StatusPill kind="success" icon="checkmark" label="Included in your plan" />}
          {enabled && titleTag === 'neutral' && <StatusPill kind="neutral" label="Included" />}
        </Horizontal>
        {planLine === 'plain' && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            Your plan includes {formatRowsFull(plan.freeHours)} query hours and {plan.freeGB} GB of cache storage a month.
          </Typography>
        )}
        {planLine === 'bold' && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            Your plan includes {em(`${formatRowsFull(plan.freeHours)} query hours`)} and {em(`${plan.freeGB} GB of cache storage`)} a month.
          </Typography>
        )}
        {planLine === 'pills' && (
          <Horizontal gap={spacing.B} align="center" wrap>
            <Typography variant="body-normal" color="gray-light" noMargin>Your plan includes</Typography>
            <StatusPill kind="success" icon="clock" label={`${formatRowsFull(plan.freeHours)} query hours a month`} />
            <StatusPill kind="success" icon="database" label={`${plan.freeGB} GB of cache storage`} />
          </Horizontal>
        )}
        {planLine === 'strip' && (
          <Horizontal gap={spacing.F} align="center" wrap className={styles.planStrip}>
            <Typography variant="content-label" color="success" noMargin>Included in your plan</Typography>
            <Horizontal gap={spacing.B} align="center">
              <Icon name="clock" size="m" color={c['content-secondary']} />
              {em(`${formatRowsFull(plan.freeHours)} query hours`)}
              <Typography variant="body-normal" color="gray-light" as="span" noMargin>a month</Typography>
            </Horizontal>
            <Horizontal gap={spacing.B} align="center">
              <Icon name="database" size="m" color={c['content-secondary']} />
              {em(`${plan.freeGB} GB`)}
              <Typography variant="body-normal" color="gray-light" as="span" noMargin>of cache storage</Typography>
            </Horizontal>
          </Horizontal>
        )}
      </Vertical>
      {!enabled && <Alert status="info" variant="section" dismissible={false} message={NOT_ENABLED} />}
      <LimitBanner limit={limit} plan={plan} />

      {bannerEl}

      <Horizontal gap={spacing.D} align="stretch" wrap className={styles.tileRow}>
        <Tile icon="clock" label="Query hours" value={formatRowsFull(limit === 'hours' ? plan.freeHours : used)} of={`of ${formatRowsFull(plan.freeHours)}`} meter={limit === 'hours' ? 100 : allowancePct(used, plan.freeHours)} sub={limit === 'hours' ? 'Used up on 22 Nov. Resets 1 Dec' : n ? `Used by your ${n} cached ${n === 1 ? 'model' : 'models'} this month` : ''} />
        <Tile icon="database" label="Storage" value={limit === 'storage' ? `${plan.freeGB} GB` : gb >= 1 ? `${gb.toFixed(gb < 10 ? 1 : 0)} GB` : gb > 0 ? `${Math.round(gb * 1024)} MB` : '0 GB'} of={`of ${plan.freeGB} GB`} meter={limit === 'storage' ? 100 : allowancePct(gb, plan.freeGB)} sub={limit === 'storage' ? 'Full' : n ? `${formatCompact(rows)} rows across ${n} ${n === 1 ? 'model' : 'models'}` : ''} />
        <Tile icon="chart" label="Queries served from cache" value={formatRowsFull(fromCache)} sub={fromCache ? `${hitPct}% of queries on cached models` : ''} />
        <Tile icon="chart" label="Warehouse cost avoided" value={fromCache ? `~${usd(saved)}` : '$0'} sub={fromCache ? `About ${usd(saved * 12)} a year at this rate` : 'Estimate at $0.05 per warehouse query'} />
      </Horizontal>

      <Vertical gap={spacing.D}>
        <SectionHeader title="Models" />
        <Table columns={columns as unknown as TableColumn[]} data={list as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
        {/* Shown, not wired: the interaction isn't part of this prototype (Vivek, 4 Nov). */}
        <div>
          <Button variant="tertiary" size="small">Show all {formatRowsFull(org.activeModels)} models</Button>
        </div>
      </Vertical>

      {open === 'calc' && (
        <EstimateModal
          initial={estimate}
          plan={plan}
          queriesLabel="Queries on your cacheable models"
          queriesHelp="Last 30 days"
          onSave={(next) => { onEstimate(next); setOpen(null); }}
          onClose={() => setOpen(null)}
        />
      )}
      {open === 'receipt' && (
        <Modal isOpen onClose={() => setOpen(null)} title="How we estimate the saving" size="medium" footer={<ModalFooter primaryAction={<Button variant="primary" onClick={() => setOpen(null)}>Close</Button>} />}>
          <ReceiptLines inputs={estimate} plan={plan} scope={ORG_SCOPE} />
        </Modal>
      )}
      {addFor && (
        <AddHoursModal model={addFor} plan={plan} hoursLeft={hoursLeft} onRequest={() => { setAddFor(null); setToast('Request sent to your ThoughtSpot rep'); }} onClose={() => setAddFor(null)} />
      )}
      {toast && <FloatingToast message={toast} type="success" onDismiss={() => setToast(null)} />}
    </Vertical>
  );
};
