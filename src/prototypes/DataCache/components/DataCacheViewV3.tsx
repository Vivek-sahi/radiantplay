import React, { useState } from 'react';
import { Alert, Button, Card, Icon, Link, Modal, ModalFooter, ProgressBar, Table, Typography, Horizontal, Vertical } from '@/components';
import type { IconName, TableColumn } from '@/components';
import { StatusPill, SectionHeader, FloatingToast, type PillKind } from './primitives';
import { AddHoursModal } from './AddHoursModal';
import { EstimateModal, fitLine } from './EstimateModal';
import { CalculatorInputs, ReceiptLines } from './HookBoxes';
import { c, spacing } from '../styles';
import styles from './DataCacheViewV3.module.css';
import {
  allowancePct,
  computeEstimate,
  fitsFreeHours,
  formatCompact,
  formatRowsFull,
  gbUsed,
  hoursUsed,
  isCacheable,
  savedSoFarPerYear,
  savingPerYear,
  usd,
  usdRange,
  warehouseHours,
  RATE_PER_QUERY,
} from '../utils';
import type { Cacheability, DataModel, EstimateInputs, Org, Plan } from '../types';

/** The proposed designs (4 Nov): banner 1 with the calculator folded in, four ways. */
export type BannerStyle = 'inline' | 'modal' | 'receipt' | 'expand';
/** The tag beside the page title: nothing (the convention), a short neutral label, or the green pill. */
export type TitleTag = 'none' | 'neutral' | 'pill';
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
const TOP = 6;
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
  return { kind: 'success', label: 'Success' };
};
const lastRefreshed = (m: DataModel): string | null => {
  const done = m.cache!.runs.find((r) => (r.runType === 'Scheduled' || r.runType === 'Ad-hoc') && r.status === 'Success' && r.endTime);
  return done?.endTime ?? null;
};
const BLOCKED_REASON: Record<NonNullable<Cacheability['reasonCode']>, string> = {
  OAUTH_CONNECTION: 'OAuth connection',
  UNSUPPORTED_CONNECTOR: 'Source not supported yet',
  PASSTHROUGH_SQL: 'Passthrough SQL',
  MISSING_CUSTOM_CALENDAR: 'Custom calendar',
  CACHING_DISABLED_ON_ORG: 'Not enabled',
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
      <Typography variant="footnote" color="gray-light" noMargin>{sub}</Typography>
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
  estimate: EstimateInputs;
  onEstimate: (next: EstimateInputs) => void;
  onOpenModel: (modelId: string) => void;
  onCacheModel: (modelId: string) => void;
}> = ({ org, models, plan, enabled, banner, titleTag, estimate, onEstimate, onOpenModel, onCacheModel }) => {
  const [showAll, setShowAll] = useState(false);
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
  const fit = fitLine(estimate, plan);

  // ── the one list: the PM's table ──
  const byQueries = (a: DataModel, b: DataModel) => queries(b) - queries(a);
  const ordered = [...models.filter(isCacheable).sort(byQueries), ...models.filter((m) => !isCacheable(m)).sort(byQueries)];
  const list = showAll ? ordered : ordered.slice(0, TOP);
  const fits = (m: DataModel) => fitsFreeHours(m, used, plan);
  const action = (row: DataModel) => {
    if (row.cache) {
      const s = cacheStatus(row);
      const when = lastRefreshed(row);
      return (
        <Horizontal gap={spacing.B} align="center" wrap justify="end">
          <StatusPill kind={s.kind} label={s.label} />
          {when && <Typography variant="footnote" color="gray-light" as="span" noMargin>Refreshed {when}</Typography>}
        </Horizontal>
      );
    }
    if (!isCacheable(row)) {
      const code = row.cacheability?.reasonCode;
      return <Typography variant="footnote" color="gray-light" as="span" noMargin>Not cacheable{code ? ` · ${BLOCKED_REASON[code]}` : ''}</Typography>;
    }
    return fits(row) ? (
      <Button variant="secondary" size="small" disabled={!enabled} onClick={() => onCacheModel(row.id)}>Cache Model</Button>
    ) : (
      <Button variant="secondary" size="small" disabled={!enabled} onClick={() => setAddFor(row)}>Add hours</Button>
    );
  };
  const money = (text: string) => <Typography variant="content-label" color="base" as="span" noMargin>{text}</Typography>;
  const columns: TableColumn<DataModel>[] = [
    { key: 'name', label: 'Model', render: (_v, row) => <Link href="#" onClick={(e) => { e.preventDefault(); onOpenModel(row.id); }}>{row.name}</Link> },
    { key: 'queries', label: 'Warehouse queries, 30 d', render: (_v, row) => formatRowsFull(queries(row)) },
    { key: 'hours', label: 'Query hours, 30 d', render: (_v, row) => `${formatRowsFull(warehouseHours(row))} h` },
    ...(org.aboveThreshold
      ? [{
          key: 'saving',
          label: 'Est. saving / yr',
          render: (_v: unknown, row: DataModel) => {
            if (!isCacheable(row)) return '—';
            if (row.cache) { const s = savedSoFarPerYear(row); return s !== null ? <Typography variant="content-label" color="success" as="span" noMargin>~{usd(s)} so far</Typography> : 'Counting'; }
            return <Typography variant="content-label" color="success" as="span" noMargin>{usdRange(savingPerYear(queries(row)))}</Typography>;
          },
        }]
      : []),
    { key: 'action', label: '', width: '220px', align: 'right', render: (_v, row) => action(row) },
  ];

  // ── the banner ──
  const hero = (
    <Vertical gap={spacing.A} className={styles.hero}>
      <Typography variant="headline-large" color="success" as="span" noMargin>{usdRange(est.savingPerYear).replace(' to ', '–')}/yr</Typography>
      <Typography variant="footnote" color="gray-light" noMargin>estimated warehouse cost savings</Typography>
      <Typography variant="footnote" color={fit.ok ? 'gray-light' : 'warning'} noMargin className={styles.fit}>{fit.text}</Typography>
      {banner === 'expand' && (
        <div className={styles.adjust}>
          <Button variant="tertiary" size="small" onClick={() => setExpanded((v) => !v)}>{expanded ? 'Done' : 'Adjust'}</Button>
        </div>
      )}
    </Vertical>
  );
  const copy = (
    <Vertical gap={spacing.A}>
      <Typography variant="section-label" color="base" as="h2" noMargin>Estimated cost savings with DataCache</Typography>
      <Typography variant="body-normal" color="gray-light" noMargin>
        With DataCache, 60-80% of your warehouse queries on cacheable models can be executed extremely fast and at no cost. Your DataCache plan includes {formatRowsFull(plan.freeHours)} query hours and {plan.freeGB} GB storage.
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
        <Typography variant="body-normal" color="gray-light" noMargin>
          Your plan includes {formatRowsFull(plan.freeHours)} query hours and {plan.freeGB} GB of cache storage a month.
        </Typography>
      </Vertical>
      {!enabled && <Alert status="info" variant="section" dismissible={false} message={NOT_ENABLED} />}

      {bannerEl}

      <Horizontal gap={spacing.D} align="stretch" wrap className={styles.tileRow}>
        <Tile icon="clock" label="Query hours" value={formatRowsFull(used)} of={`of ${formatRowsFull(plan.freeHours)}`} meter={allowancePct(used, plan.freeHours)} sub={n ? `Used by your ${n} cached ${n === 1 ? 'model' : 'models'} this month` : 'Nothing cached yet'} />
        <Tile icon="database" label="Storage" value={gb >= 1 ? `${gb.toFixed(gb < 10 ? 1 : 0)} GB` : gb > 0 ? `${Math.round(gb * 1024)} MB` : '0 GB'} of={`of ${plan.freeGB} GB`} meter={allowancePct(gb, plan.freeGB)} sub={n ? `${formatCompact(rows)} rows across ${n} ${n === 1 ? 'model' : 'models'}` : 'Nothing cached yet'} />
        <Tile icon="chart" label="Queries served from cache" value={formatRowsFull(fromCache)} sub={fromCache ? `${hitPct}% of queries on cached models` : 'Counting from the first cache run'} />
        <Tile icon="chart" label="Warehouse cost avoided" value={fromCache ? `~${usd(saved)}` : '$0'} sub={fromCache ? `About ${usd(saved * 12)} a year at this rate` : 'Estimate at $0.05 per warehouse query'} />
      </Horizontal>

      <Vertical gap={spacing.D}>
        <SectionHeader title="Models" />
        <Table columns={columns as unknown as TableColumn[]} data={list as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
        {ordered.length > TOP && (
          <div>
            <Button variant="tertiary" size="small" onClick={() => setShowAll((v) => !v)}>{showAll ? `Show top ${TOP}` : `Show all ${ordered.length} models`}</Button>
          </div>
        )}
      </Vertical>

      {open === 'calc' && (
        <EstimateModal
          initial={estimate}
          plan={plan}
          queriesHelp={ORG_SCOPE}
          fit
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
