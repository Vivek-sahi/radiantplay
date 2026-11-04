import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Icon, Link, ProgressBar, Table, Typography, Horizontal, Vertical } from '@/components';
import type { IconName, TableColumn } from '@/components';
import { StatusPill, SectionHeader, FloatingToast, type PillKind } from './primitives';
import { AddHoursModal } from './AddHoursModal';
import { c, spacing } from '../styles';
import styles from './DataCacheViewV2.module.css';
import {
  allowancePct,
  fitsFreeHours,
  formatCompact,
  formatRowsFull,
  gbUsed,
  hoursUsed,
  isCacheable,
  queryTimeAvoidedHours,
  roundSig,
  savedSoFarPerYear,
  savingPerYear,
  usd,
  usdRange,
  warehouseHours,
  HIT_CEILING,
  RATE_PER_QUERY,
} from '../utils';
import type { Cacheability, DataModel, Org, Plan } from '../types';

const ELIGIBILITY =
  'Cacheable today: models on Snowflake or Databricks that don’t use OAuth connections, custom calendars or passthrough SQL. More sources are on the way.';
const NOT_ENABLED = 'Contact your ThoughtSpot rep to enable caching.';
const TOP = 6;

// Per-model cache status. Run vocabulary is Pulse's (In progress / Success / Error); a
// model changed since it was cached gets its own pill here, because this list has a
// status column and "Success" would misread. The Caching tab keeps Pulse's banner.
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

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <Vertical gap={0} className={styles.stat}>
    <Typography variant="modal-title" color="base" as="span" noMargin>{value}</Typography>
    <Typography variant="footnote" color="gray-light" noMargin>{label}</Typography>
  </Vertical>
);

/**
 * The Data Cache page, v2: the state picks which job leads.
 *
 * Nothing cached → the saving headline and the list lead; the plan is one line under
 * the title; no metrics (four zeros say nothing).
 * Some cached → the metrics lead; the list follows with status per row; the saving
 * shrinks to one sentence above the list.
 * Not enabled → one notice under the title, every action disabled, no "Included" pill.
 *
 * One list throughout, in order of warehouse queries, each row carrying its own
 * state. Whether a model fits the free hours is judged per row against what is
 * left, not cumulatively down the list.
 */
export const DataCacheViewV2: React.FC<{
  org: Org;
  models: DataModel[];
  plan: Plan;
  enabled: boolean;
  showList: boolean;
  onOpenModel: (modelId: string) => void;
  onOpenObjects: () => void;
  onCacheModel: (modelId: string) => void;
  highlightKey: number;
}> = ({ org, models, plan, enabled, showList, onOpenModel, onOpenObjects, onCacheModel, highlightKey }) => {
  const [showAll, setShowAll] = useState(false);
  const [addFor, setAddFor] = useState<DataModel | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const hookRef = useRef<HTMLDivElement>(null);
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
  const timeAvoided = queryTimeAvoidedHours(models);

  // ── the one list ──
  const byQueries = (a: DataModel, b: DataModel) => queries(b) - queries(a);
  const ordered = [...models.filter(isCacheable).sort(byQueries), ...models.filter((m) => !isCacheable(m)).sort(byQueries)];
  const remaining = ordered.filter((m) => !m.cache && isCacheable(m));
  const fits = (m: DataModel) => fitsFreeHours(m, used, plan);
  const fitCount = remaining.filter(fits).length;
  const list = showAll ? ordered : ordered.slice(0, TOP);
  // The saving the list itself promises: the uncached cacheable rows, at the ceiling.
  const listSaving = remaining.reduce((t, m) => t + savingPerYear(queries(m)), 0);

  const cacheCell = (row: DataModel) => {
    if (row.cache) {
      const s = cacheStatus(row);
      const when = lastRefreshed(row);
      return (
        <Horizontal gap={spacing.B} align="center" wrap>
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
      ? [
          {
            key: 'saving',
            label: 'Est. saving / yr',
            render: (_v: unknown, row: DataModel) => (!row.cache && isCacheable(row) ? money(usdRange(savingPerYear(queries(row)))) : '—'),
          },
          ...(n > 0
            ? [
                {
                  key: 'saved',
                  label: 'Saved so far',
                  render: (_v: unknown, row: DataModel) => {
                    const s = savedSoFarPerYear(row);
                    return row.cache ? (s !== null ? money(`~${usd(s)} a year`) : 'Counting') : '—';
                  },
                },
              ]
            : []),
        ]
      : []),
    { key: 'cache', label: 'Cache', width: '220px', render: (_v, row) => cacheCell(row) },
  ];

  const table = (
    <Vertical gap={spacing.C}>
      {remaining.length > 0 && fitCount < remaining.length && (
        <Typography variant="footnote" color="gray-light" noMargin>
          {fitCount === 0
            ? `Your free hours have ${formatRowsFull(hoursLeft)} left this month. Caching more needs added hours.`
            : `Your free hours have ${formatRowsFull(hoursLeft)} left this month, enough for ${fitCount} of the ${remaining.length} models not cached yet.`}
        </Typography>
      )}
      <Table columns={columns as unknown as TableColumn[]} data={list as unknown as Record<string, unknown>[]} rowKey="id" hoverable bordered />
      <Horizontal justify="space-between" align="center" wrap gap={spacing.C}>
        <Typography variant="footnote" color="gray-light" noMargin>{ELIGIBILITY}</Typography>
        {ordered.length > TOP && (
          <Button variant="tertiary" size="small" onClick={() => setShowAll((v) => !v)}>
            {showAll ? `Show top ${TOP}` : `Show all ${ordered.length} models`}
          </Button>
        )}
      </Horizontal>
    </Vertical>
  );

  // ── the saving headline (nothing cached) ──
  const hookHeadline = org.aboveThreshold ? (
    <Vertical gap={spacing.D} className={styles.hookCopy}>
      <Typography variant="headline-large" color="base" as="h2" noMargin>
        Caching your most-queried models could save {usdRange(org.savingPerYear)} a year in warehouse cost
      </Typography>
      <Typography variant="body-large" color="gray-light" noMargin>
        Your most-queried cacheable models generate {org.volumeShare}% of your warehouse queries, each saving at least $1,000 a year. Caching is included in your plan.
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
    </Vertical>
  ) : (
    <Vertical gap={spacing.D} className={styles.hookCopy}>
      <Typography variant="headline-large" color="base" as="h2" noMargin>
        Up to 80% of your warehouse queries could be served from cache
      </Typography>
      <Typography variant="body-large" color="gray-light" noMargin>
        Your models ran {formatRowsFull(org.warehouseQueries30d)} warehouse queries in the last 30 days across {org.connections} connections. Caching serves repeat queries without running them in your warehouse again. It is included in your plan.
      </Typography>
      <Horizontal gap={spacing.F} align="start" wrap>
        <Stat value={formatRowsFull(org.warehouseQueries30d)} label="warehouse queries, last 30 days" />
        <Stat value={`${formatRowsFull(org.warehouseHours30d)} h`} label="warehouse query time, last 30 days" />
        <Stat value={`Up to ${formatRowsFull(roundSig(Math.round(org.warehouseQueries30d * HIT_CEILING)))}`} label="could be served from cache" />
        <Stat value={String(org.activeModels)} label="models in use" />
      </Horizontal>
      {!showList && enabled && (
        <Vertical gap={spacing.C}>
          <Typography variant="body-normal" color="gray-light" noMargin>
            To cache a model, open it from Data objects and turn caching on from its Caching tab.
          </Typography>
          <div>
            <Button variant="primary" onClick={onOpenObjects}>Go to my models</Button>
          </div>
        </Vertical>
      )}
    </Vertical>
  );

  // ── the metrics (some cached) ──
  const metrics = (
    <Horizontal gap={spacing.D} align="stretch" wrap className={styles.tileRow}>
      <Tile
        icon="clock"
        label="Query hours"
        value={formatRowsFull(used)}
        of={`of ${formatRowsFull(plan.freeHours)} free`}
        meter={allowancePct(used, plan.freeHours)}
        sub={`Used by your ${n} cached ${n === 1 ? 'model' : 'models'} this month`}
      />
      <Tile
        icon="database"
        label="Storage"
        value={gb >= 1 ? `${gb.toFixed(gb < 10 ? 1 : 0)} GB` : `${Math.round(gb * 1024)} MB`}
        of={`of ${plan.freeGB} GB free`}
        meter={allowancePct(gb, plan.freeGB)}
        sub={`${formatCompact(rows)} rows across ${n} ${n === 1 ? 'model' : 'models'}`}
      />
      <Tile
        icon="chart"
        label="Served from cache"
        value={formatRowsFull(fromCache)}
        sub={fromCache ? `${hitPct}% of queries on cached models never reached your warehouse` : 'Counting from the first cache run'}
      />
      {org.aboveThreshold ? (
        <Tile
          icon="chart"
          label="Warehouse cost avoided"
          value={fromCache ? `~${usd(saved)}` : '$0'}
          sub={fromCache ? `About ${usd(saved * 12)} a year at this rate, $0.05 per query` : 'Estimate at $0.05 per warehouse query'}
        />
      ) : (
        <Tile
          icon="clock"
          label="Query time avoided"
          value={`${formatRowsFull(timeAvoided)} h`}
          sub={timeAvoided ? 'Warehouse query time the cache absorbed' : 'Counting from the first cache run'}
        />
      )}
    </Horizontal>
  );

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      {/* Title, the plan in one line, and the notice when caching isn't enabled. */}
      <Vertical gap={spacing.B}>
        <Horizontal gap={spacing.C} align="center">
          <Typography variant="page-title" color="base" as="h1" noMargin>Data Cache</Typography>
          {enabled && <StatusPill kind="success" icon="checkmark" label="Included in your plan" />}
        </Horizontal>
        <Typography variant="body-normal" color="gray-light" noMargin>
          Your plan includes {formatRowsFull(plan.freeHours)} query hours and {plan.freeGB} GB of cache storage a month. Your caching bill: $0.
        </Typography>
      </Vertical>
      {!enabled && <Alert status="info" variant="section" dismissible={false} message={NOT_ENABLED} />}

      {n > 0 ? (
        <>
          {metrics}
          <Vertical gap={spacing.D}>
            <SectionHeader title="Models" />
            <div ref={hookRef} className={`${styles.hook} ${highlight ? styles.highlight : ''}`}>
              <Vertical gap={spacing.D}>
                {remaining.length > 0 && org.aboveThreshold && (
                  <Typography variant="body-large" color="base" noMargin>
                    Caching the {remaining.length === 1 ? 'one model' : `${remaining.length} models`} not cached yet could save about {usdRange(listSaving)} more a year.
                  </Typography>
                )}
                {table}
              </Vertical>
            </div>
          </Vertical>
        </>
      ) : (
        <div ref={hookRef} className={`${styles.hook} ${highlight ? styles.highlight : ''}`}>
          <Vertical gap={spacing.F}>
            <Horizontal gap={spacing.H} align="start" className={styles.hookTop}>
              {hookHeadline}
              <img className={styles.illustration} src="/data-cache/empty-state.svg" alt="" width={180} height={152} />
            </Horizontal>
            {showList && table}
          </Vertical>
        </div>
      )}

      {addFor && (
        <AddHoursModal
          model={addFor}
          plan={plan}
          hoursLeft={hoursLeft}
          onRequest={() => { setAddFor(null); setToast('Request sent to your ThoughtSpot rep'); }}
          onClose={() => setAddFor(null)}
        />
      )}
      {toast && <FloatingToast message={toast} type="success" onDismiss={() => setToast(null)} />}
    </Vertical>
  );
};
