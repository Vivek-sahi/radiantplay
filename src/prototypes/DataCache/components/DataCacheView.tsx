import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Icon, Link, Modal, ModalFooter, ProgressBar, Table, Typography, Horizontal, Vertical } from '@/components';
import type { IconName, TableColumn } from '@/components';
import { StatusPill, SectionHeader, FloatingToast, type PillKind } from './primitives';
import { c, spacing } from '../styles';
import styles from './DataCacheView.module.css';
import {
  allowancePct,
  cacheHours,
  coverage,
  formatCompact,
  formatRowsFull,
  gbUsed,
  hoursUsed,
  isCacheable,
  roundSig,
  savingPerYear,
  usdRange,
  warehouseHours,
  usd,
  HIT_CEILING,
  RATE_PER_QUERY,
} from '../utils';
import type { Cacheability, DataModel, Org, Plan } from '../types';

const ELIGIBILITY =
  'Cacheable today: models on Snowflake or Databricks that don’t use OAuth connections, custom calendars or passthrough SQL. More sources are on the way.';
const NOT_ENABLED = 'Contact your ThoughtSpot rep to enable caching.';
const TOP = 6;

// Per-model cache status, our agreed vocabulary only: In progress / Success / Error.
const cacheStatus = (m: DataModel): { kind: PillKind; label: string } => {
  const cache = m.cache!;
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

// A tile: icon + label, the value, an optional meter, a line under it.
const Tile: React.FC<{ icon: IconName; label: string; value: string; of?: string; meter?: number; sub: string }> = ({ icon, label, value, of, meter, sub }) => (
  <Card className={styles.tile}>
    <Vertical gap={spacing.C} className={styles.tileBody}>
      <Horizontal gap={spacing.B} align="center">
        <Icon name={icon} size="m" color={c['content-secondary']} />
        <Typography variant="content-label" color="base" noMargin>{label}</Typography>
      </Horizontal>
      <Horizontal gap={spacing.B} align="baseline">
        <Typography variant="page-title" color="base" noMargin>{value}</Typography>
        {of && <Typography variant="footnote" color="gray-light" noMargin>{of}</Typography>}
      </Horizontal>
      {meter !== undefined && <ProgressBar value={meter} color="blue" />}
      <Typography variant="footnote" color="gray-light" noMargin>{sub}</Typography>
    </Vertical>
  </Card>
);

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <Vertical gap={0} className={styles.stat}>
    <Typography variant="modal-title" color="base" noMargin>{value}</Typography>
    <Typography variant="footnote" color="gray-light" noMargin>{label}</Typography>
  </Vertical>
);

/**
 * The Data Cache page. Three parts, always in this order:
 * 1. The free allowance band: what the plan includes and how much of this org it covers.
 * 2. Four tiles in one row: query hours and storage used of the free amount, then what
 *    the cache has done so far, queries served from cache and warehouse cost avoided.
 * 3. Models: the hook headline (what caching would save), then ONE list of models in
 *    order of warehouse queries. Each row carries its own state: Cache Model, Add hours,
 *    the cache status once cached, or why it can't be cached.
 */
export const DataCacheView: React.FC<{
  org: Org;
  models: DataModel[];
  plan: Plan;
  enabled: boolean;
  /** Below the threshold the model list is optional (the reference has both frames). */
  showList: boolean;
  onOpenModel: (modelId: string) => void;
  onCacheModel: (modelId: string) => void;
  /** Bumped by "Learn more" on a Caching tab: scroll to the hook and highlight it once. */
  highlightKey: number;
}> = ({ org, models, plan, enabled, showList, onOpenModel, onCacheModel, highlightKey }) => {
  const [showAll, setShowAll] = useState(false);
  const [addFor, setAddFor] = useState<DataModel | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const hookRef = useRef<HTMLDivElement>(null);

  // Each Learn more highlights once; a later visit to the page must not replay it.
  const handledKey = useRef(0);
  useEffect(() => {
    if (!highlightKey || highlightKey === handledKey.current) return;
    handledKey.current = highlightKey;
    hookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 2200);
    return () => window.clearTimeout(t);
  }, [highlightKey]);

  // ── the numbers ──
  const cached = models.filter((m) => m.cache);
  const n = cached.length;
  const used = hoursUsed(models);
  const gb = gbUsed(models);
  const rows = cached.reduce((t, m) => t + (m.cache!.status === 'purged' ? 0 : m.cache!.rowCount), 0);
  const cover = coverage(org.cacheableHours30d, org.cacheableModels, plan);
  const restCount = Math.max(0, org.cacheableModels - n);
  const projectedRest = Math.max(0, Math.round((org.cacheableHours30d - used) / 10) * 10);
  const cachedQueries = cached.reduce((t, m) => t + queries(m), 0);
  // What the cache has done so far, from each cached model's analytics (the Caching tab's numbers).
  const fromCache = cached.reduce((t, m) => t + (m.cache!.analytics?.cachedQueries ?? 0), 0);
  const onCached = cached.reduce((t, m) => t + (m.cache!.analytics?.totalQueries ?? 0), 0);
  const hitPct = onCached > 0 ? Math.round((fromCache / onCached) * 100) : 0;
  const saved = fromCache * RATE_PER_QUERY;

  // ── the one list ──
  // Cacheable models first, in order of warehouse queries (cached and not, together),
  // then the ones that can't be cached. Which uncached models the free hours still
  // cover is cumulative down that order.
  const byQueries = (a: DataModel, b: DataModel) => queries(b) - queries(a);
  const ordered = [...models.filter(isCacheable).sort(byQueries), ...models.filter((m) => !isCacheable(m)).sort(byQueries)];
  const covered = new Set<string>();
  let cum = used;
  for (const m of ordered) {
    if (m.cache || !isCacheable(m)) continue;
    cum += cacheHours(m);
    if (cum <= plan.freeHours) covered.add(m.id);
  }
  const remaining = ordered.filter((m) => !m.cache && isCacheable(m));
  const coveredCount = remaining.filter((m) => covered.has(m.id)).length;
  const list = showAll ? ordered : ordered.slice(0, TOP);

  const cacheCell = (row: DataModel) => {
    if (row.cache) {
      const s = cacheStatus(row);
      const when = lastRefreshed(row);
      return (
        <Horizontal gap={spacing.B} align="center">
          <StatusPill kind={s.kind} label={s.label} />
          {when && <Typography variant="footnote" color="gray-light" as="span" noMargin>Refreshed {when}</Typography>}
        </Horizontal>
      );
    }
    if (!isCacheable(row)) {
      const code = row.cacheability?.reasonCode;
      return (
        <Typography variant="footnote" color="gray-light" as="span" noMargin>
          Not cacheable{code ? ` · ${BLOCKED_REASON[code]}` : ''}
        </Typography>
      );
    }
    return covered.has(row.id) ? (
      <Button variant="secondary" size="small" disabled={!enabled} onClick={() => onCacheModel(row.id)}>Cache Model</Button>
    ) : (
      <Button variant="secondary" size="small" disabled={!enabled} onClick={() => setAddFor(row)}>Add hours</Button>
    );
  };
  const savingCell = (row: DataModel) => {
    if (!isCacheable(row)) return '—';
    if (row.cache) {
      const a = row.cache.analytics;
      return a ? (
        <Typography variant="content-label" color="base" as="span" noMargin>~{usd(a.cachedQueries * RATE_PER_QUERY * 12)} a year</Typography>
      ) : (
        '—'
      );
    }
    return org.aboveThreshold ? (
      <Typography variant="content-label" color="base" as="span" noMargin>{usdRange(savingPerYear(queries(row)))}</Typography>
    ) : (
      '—'
    );
  };
  const columns: TableColumn<DataModel>[] = [
    { key: 'name', label: 'Model', render: (_v, row) => <Link href="#" onClick={(e) => { e.preventDefault(); onOpenModel(row.id); }}>{row.name}</Link> },
    { key: 'queries', label: 'Warehouse queries, 30 d', render: (_v, row) => formatRowsFull(queries(row)) },
    { key: 'hours', label: 'Query hours, 30 d', render: (_v, row) => `${formatRowsFull(warehouseHours(row))} h` },
    ...(org.aboveThreshold ? [{ key: 'saving', label: 'Est. saving / yr', render: (_v: unknown, row: DataModel) => savingCell(row) }] : []),
    { key: 'cache', label: 'Cache', width: '220px', render: (_v, row) => cacheCell(row) },
  ];
  const coverageLine =
    remaining.length === 0
      ? null
      : coveredCount === 0
        ? 'Your free hours are committed to the cached models. Caching more needs added hours.'
        : coveredCount === remaining.length
          ? remaining.length === 1
            ? 'Your free hours cover the one remaining cacheable model.'
            : `Your free hours cover all ${remaining.length} remaining cacheable models.`
          : `Your free hours cover the next ${coveredCount} cacheable ${coveredCount === 1 ? 'model' : 'models'}. After that, caching needs added hours.`;
  const table = (
    <Vertical gap={spacing.C}>
      {coverageLine && <Typography variant="footnote" color="gray-light" noMargin>{coverageLine}</Typography>}
      <Table columns={columns as unknown as TableColumn[]} data={list as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
      {ordered.length > TOP && (
        <div>
          <Button variant="tertiary" size="small" onClick={() => setShowAll((v) => !v)}>
            {showAll ? `Show top ${TOP}` : `Show all ${ordered.length} models`}
          </Button>
        </div>
      )}
    </Vertical>
  );

  // ── the hook headline ──
  let headline: React.ReactNode;
  if (org.aboveThreshold && remaining.length) {
    // Above the org-wide threshold: dollars per model. The rollup leaves out models already cached.
    const rollup = Math.max(0, org.savingPerYear - cached.reduce((t, m) => t + savingPerYear(queries(m)), 0));
    const share = Math.max(0, Math.round(((org.warehouseQueries30d * org.volumeShare) / 100 - cachedQueries) / org.warehouseQueries30d * 100));
    headline = (
      <Vertical gap={spacing.D} className={styles.hookCopy}>
        <Typography variant="modal-title" color="base" noMargin>
          {n ? 'Caching your next most-queried models' : 'Caching your most-queried models'} could save {usdRange(rollup)} a year in warehouse cost
        </Typography>
        <Typography variant="body-normal" color="gray-light" noMargin>
          Your {formatRowsFull(Math.max(0, org.eligibleModels - n))} most-queried cacheable models generate {share}% of your warehouse queries, each saving at least $1,000 a year.
        </Typography>
        <Horizontal gap={spacing.F} align="start" wrap>
          <Stat value={formatRowsFull(org.warehouseQueries30d)} label="warehouse queries, last 30 days" />
          <Stat value={`${formatRowsFull(org.warehouseHours30d)} h`} label="warehouse query time, last 30 days" />
          <Stat value={String(org.activeModels)} label="models in use" />
          <Stat value={String(org.connections)} label="connections" />
        </Horizontal>
        <Typography variant="footnote" color="gray-light" noMargin>
          Estimate assumes up to 80% of queries use cached data, $0.05 per warehouse query.
        </Typography>
        {!enabled && <Alert status="info" variant="section" message={NOT_ENABLED} />}
      </Vertical>
    );
  } else {
    // Below the threshold, or nothing left to cache: queries and percentages, no dollars.
    headline = (
      <Vertical gap={spacing.D} className={styles.hookCopy}>
        <Typography variant="modal-title" color="base" noMargin>
          Up to 80% of your warehouse queries could be served from cache
        </Typography>
        <Typography variant="body-normal" color="gray-light" noMargin>
          Your models ran {formatRowsFull(org.warehouseQueries30d)} warehouse queries in the last 30 days across {org.connections} connections. Caching serves repeat queries without running them in your warehouse again.
        </Typography>
        <Horizontal gap={spacing.F} align="start" wrap>
          <Stat value={formatRowsFull(org.warehouseQueries30d)} label="warehouse queries, last 30 days" />
          <Stat value={`${formatRowsFull(org.warehouseHours30d)} h`} label="warehouse query time, last 30 days" />
          <Stat value={`Up to ${formatRowsFull(roundSig(Math.round(org.warehouseQueries30d * HIT_CEILING)))}`} label="could be served from cache" />
          <Stat value={String(org.activeModels)} label="models in use" />
        </Horizontal>
        {!showList && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            To cache a model, open it from Data objects and turn caching on from its Caching tab.
          </Typography>
        )}
        {!enabled ? (
          <Alert status="info" variant="section" message={NOT_ENABLED} />
        ) : (
          !showList && (
            <div>
              <Button variant="primary" onClick={() => onOpenModel('')}>Go to my models</Button>
            </div>
          )
        )}
      </Vertical>
    );
  }

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      <Horizontal gap={spacing.C} align="center">
        <Typography variant="page-title" color="base" noMargin>Data Cache</Typography>
        <StatusPill kind="success" icon="checkmark" label="Included in your plan" />
      </Horizontal>

      {/* The free allowance band: the big text, leadership's ask. */}
      <Card className={styles.band}>
        <Vertical gap={spacing.C} className={styles.bandBody}>
          <Typography variant="headline-large" color="base" noMargin>
            Your plan includes {formatRowsFull(plan.freeHours)} query hours a month. Enough to cache {cover.pct}% of your cacheable models.
          </Typography>
          <Typography variant="body-large" color="gray-light" noMargin>
            {formatRowsFull(cover.modelsFit)} of your {formatRowsFull(org.cacheableModels)} cacheable models fit in the free hours, with {plan.freeGB} GB of storage included.
          </Typography>
          <Typography variant="footnote" color="gray-light" noMargin>{ELIGIBILITY}</Typography>
          <Horizontal gap={spacing.B} align="baseline" className={styles.bill}>
            <Typography variant="content-label" color="base" noMargin>Your ThoughtSpot caching bill</Typography>
            <Typography variant="modal-title" color="base" noMargin>$0</Typography>
          </Horizontal>
        </Vertical>
      </Card>

      {/* The metrics, one row. */}
      <Horizontal gap={spacing.D} align="stretch" wrap className={styles.tileRow}>
        <Tile
          icon="clock"
          label="Query hours this month"
          value={formatRowsFull(used)}
          of={`of ${formatRowsFull(plan.freeHours)} free`}
          meter={allowancePct(used, plan.freeHours)}
          sub={
            n
              ? projectedRest > 0
                ? `Used by your ${n} cached models. About ${formatRowsFull(projectedRest)} more would cover the other ${restCount}`
                : `Used by your ${n} cached models`
              : `About ${formatRowsFull(projectedRest)} if you cache all ${restCount} cacheable models`
          }
        />
        <Tile
          icon="database"
          label="Storage"
          value={gb > 0 ? `${gb.toFixed(gb < 10 ? 1 : 0)} GB` : '0 B'}
          of={`of ${plan.freeGB} GB free`}
          meter={allowancePct(gb, plan.freeGB)}
          sub={n ? `${formatCompact(rows)} rows across ${n} models` : 'Compressed size of cached data'}
        />
        <Tile
          icon="chart"
          label="Queries served from cache"
          value={formatRowsFull(fromCache)}
          sub={fromCache ? `${hitPct}% of queries on cached models never reached your warehouse` : 'Cache a model to start counting'}
        />
        {org.aboveThreshold ? (
          <Tile
            icon="measure"
            label="Warehouse cost avoided"
            value={fromCache ? `~${usd(saved)}` : '$0'}
            sub={fromCache ? `About ${usd(saved * 12)} a year at this rate, $0.05 per query` : 'Estimate at $0.05 per warehouse query'}
          />
        ) : (
          <Tile
            icon="measure"
            label="Warehouse queries avoided"
            value={formatRowsFull(fromCache)}
            sub={fromCache ? 'Queries answered without running in your warehouse' : 'Counts queries answered without your warehouse'}
          />
        )}
      </Horizontal>

      {/* Models: the hook headline, then the one list. */}
      <Vertical gap={spacing.D}>
        <SectionHeader title="Models" />
        <div ref={hookRef} className={`${styles.hook} ${highlight ? styles.highlight : ''}`}>
          <Vertical gap={spacing.E}>
            <Horizontal gap={spacing.H} align="start" className={styles.hookTop}>
              {headline}
              <img className={styles.illustration} src="/data-cache/empty-state.svg" alt="" width={180} height={152} />
            </Horizontal>
            {showList && table}
          </Vertical>
        </div>
      </Vertical>

      {addFor && (
        <Modal
          isOpen
          onClose={() => setAddFor(null)}
          title="Add query hours"
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={<Button variant="secondary" onClick={() => setAddFor(null)}>Not now</Button>}
              primaryAction={<Button variant="primary" onClick={() => { setAddFor(null); setToast('Request sent to your ThoughtSpot rep'); }}>Contact my ThoughtSpot rep</Button>}
            />
          }
        >
          <Vertical gap={spacing.D}>
            <Typography variant="body-normal" color="base" noMargin>
              Caching {addFor.name} needs about {formatRowsFull(cacheHours(addFor))} query hours a month. Your free hours are committed to the models above it.
            </Typography>
            <Typography variant="body-normal" color="base" noMargin>
              Add a pack of 1,000 query hours and keep caching. Your ThoughtSpot rep can turn it on today.
            </Typography>
            <Alert status="info" variant="section" message="Free hours reset on the 1st of every month. Nothing is charged until you add hours." />
          </Vertical>
        </Modal>
      )}
      {toast && <FloatingToast message={toast} type="success" onDismiss={() => setToast(null)} />}
    </Vertical>
  );
};
