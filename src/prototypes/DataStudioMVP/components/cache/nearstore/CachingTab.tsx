/**
 * ⚠️ DATA STUDIO'S OWN COPY of AgentDB (Pulse) caching. Taken 2026-08-26.
 *
 * AgentDB is a shipped SKU: it has been handed to engineering and built from. It is frozen —
 * nothing in Data Studio may import from `src/prototypes/NearStore/`, and AgentDB must never be
 * changed to serve Data Studio. That coupling happened once (a shared window list, 2026-08-12)
 * and had to be unpicked; this copy exists so it cannot happen again.
 *
 * Change this copy freely. Caching is out of Data Studio's MVP scope, so it may well be cut
 * outright before it is developed further.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  Alert,
  Button,
  Link,
  Icon,
  NoData,
  ActionMenu,
  ActionMenuItem,
  Typography,
  Horizontal,
  Vertical,
} from '@/components';
import type { TableColumn } from '@/components';
import { KeyValue, SectionHeader, StatCard, FloatingToast, StatusPill, runStatusPillKind, ConfirmModal } from './primitives';
import { CachingSettingsModal, type CacheConfigDraft } from './CachingSettingsModal';
import { RunHistoryModal } from './RunHistoryModal';
import { spacing } from './styles';
import styles from './CachingTab.module.css';
import { formatRowsFull, formatSizeMB, scheduleDetail, scheduleLabel } from './utils';
import { WINDOW_LABEL, windowFraction } from './windows';
import type { CacheRun, CacheState, CacheWindow, DataModel, TableCacheSetting, TableRunResult } from './types';

const REBUILD_MS = 6000; // simulated cache build time

// ── cache stat computation ────────────────────────────────────────────────────
// Fraction of a table a window keeps. Two years of history assumed, as before — the old
// `monthsFactor` divided months by 24 for exactly that reason.
const SPAN_HOURS = 2 * 365 * 24;
const windowFactor = (w?: CacheWindow) => (w ? windowFraction(w, SPAN_HOURS) : 1);

function computeStats(model: DataModel, draft: CacheConfigDraft) {
  const settings: TableCacheSetting[] =
    draft.window === 'custom' ? draft.tableSettings : model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' }));
  let sizeMB = 0;
  let rows = 0;
  const tableResults: TableRunResult[] = model.tables.map((t) => {
    const ts = settings.find((s) => s.tableId === t.id);
    const windowed = ts?.mode === 'window';
    const factor = windowed ? windowFactor(ts?.cacheWindow) : 1;
    const r = Math.round(t.rowCount * factor);
    const mb = Math.max(1, Math.round((t.rowCount * factor) / 8000));
    sizeMB += mb;
    rows += r;
    return {
      tableId: t.id,
      status: 'Success',
      rows: r,
      sizeMB: mb,
      durationSec: 20 + Math.round(r / 250_000),
      windowApplied: windowed ? WINDOW_LABEL[ts!.cacheWindow!] : 'All history',
    };
  });
  return { sizeMB, rows, tableResults };
}

let runSeq = 1000;
const nextRunId = () => `nr-${(runSeq += 1)}`;
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ── Caching tab ─────────────────────────────────────────────────────────────
export const CachingTab: React.FC<{
  model: DataModel;
  onChange: (next: DataModel) => void;
  /**
   * Whether data outside the cache window can still be queried from the source.
   *
   * ⚠️ **False for a multi-source model.** Near Store's cache is an optimisation over one
   * warehouse: cache the recent slice, fall through to the source for anything older. A model
   * that spans several warehouses has no such fallback, because querying live is exactly what
   * cannot join across warehouses — so there the window is not a cost/coverage trade-off, it is
   * the definition of what the model contains.
   *
   * Defaults to true, which is Near Store's own behaviour unchanged. Only Data Studio's
   * consolidated surfaces pass false, and only for models that draw on more than one source.
   */
  canFallBackToLive?: boolean;
}> = ({ model, onChange, canFallBackToLive = true }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIsEdit, setModalIsEdit] = useState(false);
  const [confirm, setConfirm] = useState<null | 'purge' | 'disable'>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const timerRef = useRef<number | null>(null);

  // Latest model, so a caching timer that fires later flips the right run.
  const modelRef = useRef(model);
  useEffect(() => { modelRef.current = model; }, [model]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const cache = model.cache;

  // ── mutations ──
  // Caching is async and can take minutes — it never blocks the screen. We add an
  // "In progress" run to run history + a toast, then flip that run to Success when
  // the (simulated) build finishes. The latest model is read from modelRef so the
  // completion lands on the right run even if state changed meanwhile.
  const completeRun = (runId: string, stats: ReturnType<typeof computeStats>) => {
    const m = modelRef.current;
    if (!m.cache) return;
    onChange({
      ...m,
      cache: {
        ...m.cache,
        status: 'cached',
        cacheSizeMB: stats.sizeMB,
        rowCount: stats.rows,
        lastRunStatus: 'Success',
        runs: m.cache.runs.map((r) =>
          r.id === runId
            ? { ...r, endTime: 'Just now', rows: stats.rows, status: 'Success', tableResults: stats.tableResults }
            : r,
        ),
      },
    });
    setToast({ message: 'Your model is now cached', type: 'success' });
  };

  const startRun = (
    runType: CacheRun['runType'],
    draft: CacheConfigDraft,
    baseCache: CacheState,
    startMessage: string,
  ) => {
    const stats = computeStats(model, draft);
    const runId = nextRunId();
    const inProgress: CacheRun = { id: runId, runType, startTime: 'Just now', status: 'In progress', tableResults: [] };
    onChange({
      ...model,
      cache: {
        ...baseCache,
        status: 'cached',
        cacheSizeMB: stats.sizeMB,
        rowCount: stats.rows,
        lastRunStatus: 'In progress',
        runs: [inProgress, ...baseCache.runs],
      },
    });
    setToast({ message: startMessage, type: 'info' });
    timerRef.current = window.setTimeout(() => completeRun(runId, stats), REBUILD_MS);
  };

  const applyConfig = (draft: CacheConfigDraft, isEdit: boolean) => {
    const baseCache: CacheState = {
      status: 'cached',
      window: draft.window,
      tableSettings: draft.window === 'custom' ? draft.tableSettings : undefined,
      schedule: draft.schedule,
      cacheSizeMB: 0,
      rowCount: 0,
      nextRunAt: 'Tomorrow, 9:00 AM',
      lastRunStatus: 'Success',
      runs: isEdit && cache ? cache.runs : [],
      analytics: isEdit ? cache?.analytics : undefined,
    };

    // "Also cache now" unchecked → don't rebuild now.
    if (draft.alsoCacheNow === false) {
      if (isEdit && cache) {
        // Keep the existing snapshot; the new settings apply on the next scheduled run.
        onChange({
          ...model,
          cache: {
            ...cache,
            window: draft.window,
            tableSettings: draft.window === 'custom' ? draft.tableSettings : undefined,
            schedule: draft.schedule,
          },
        });
        setToast({ message: 'Your settings have been updated. Run Refresh cache to update the cached data.', type: 'info' });
      } else {
        // Enable, schedule-only → pending first run.
        onChange({ ...model, cache: { ...baseCache, lastRunStatus: 'In progress', runs: [] } });
        setToast({ message: 'Caching enabled. The first run follows your schedule.', type: 'info' });
      }
      return;
    }

    startRun(
      isEdit ? 'Config change' : 'Scheduled',
      draft,
      baseCache,
      'Caching is in progress. You can check caching status in run history.',
    );
  };

  const doRefresh = () => {
    if (!cache) return;
    const draft: CacheConfigDraft = {
      window: cache.window,
      schedule: cache.schedule,
      tableSettings: cache.tableSettings ?? model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' })),
    };
    startRun('Ad-hoc', draft, cache, 'Caching is in progress. You can check caching status in run history.');
  };

  // Manual "check status" next to the in-progress pill — re-reads the run without a
  // page reload. The async build is simulated here, so checking resolves it.
  const refreshRunStatus = () => {
    if (!cache) return;
    const inProgress = cache.runs.find((r) => r.status === 'In progress');
    if (!inProgress) return;
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    const draft: CacheConfigDraft = {
      window: cache.window,
      schedule: cache.schedule,
      tableSettings: cache.tableSettings ?? model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' })),
    };
    completeRun(inProgress.id, computeStats(model, draft));
  };

  const purgeCache = () => {
    if (!cache) return;
    onChange({ ...model, cache: { ...cache, status: 'purged', cacheSizeMB: 0, rowCount: 0 } });
    setConfirm(null);
    setToast({ message: 'Cached snapshot is purged. The next cache runs on your schedule.', type: 'info' });
  };

  const disableCache = () => {
    onChange({ ...model, cache: undefined });
    setConfirm(null);
    setToast({ message: 'Caching has been disabled on this model.', type: 'info' });
  };

  const handleSaveConfig = (draft: CacheConfigDraft, isEdit: boolean) => {
    setModalOpen(false);
    applyConfig(draft, isEdit);
  };

  // ── not cacheable (Cacheability API says no) — distinct from "not cached yet" ──
  if (model.cacheability && !model.cacheability.cacheable) {
    return (
      <NoData
        className={styles.emptyState}
        illustration={<img src="/near-store/empty-state.svg" alt="" width={140} height={118} />}
        title="Caching isn't available on this model"
        description={model.cacheability.reason}
        action={<Link href="/near-store-overview.html" target="_blank" rel="noopener">Learn more about caching</Link>}
      />
    );
  }

  // ── not cached yet — the "Cache Model" CTA ──
  if (!cache) {
    return (
      <>
        <NoData
          className={styles.emptyState}
          illustration={<img src="/near-store/empty-state.svg" alt="" width={140} height={118} />}
          title="This model isn’t cached yet"
          description={canFallBackToLive
            ? 'Cache this model to cut live query cost and speed up load times.'
            : 'This model draws on more than one warehouse, so its data has to be cached in ThoughtSpot before it can be queried.'}
          action={
            <Vertical align="center" gap={spacing.C}>
              <Button variant="primary" onClick={() => { setModalIsEdit(false); setModalOpen(true); }}>
                Cache Model
              </Button>
              <Link href="/near-store-overview.html" target="_blank" rel="noopener">Learn more about caching</Link>
            </Vertical>
          }
        />
        {modalOpen && (
          <CachingSettingsModal model={model} isEdit={false} canFallBackToLive={canFallBackToLive} onClose={() => setModalOpen(false)} onSave={(d) => handleSaveConfig(d, false)} />
        )}
        {toast && <FloatingToast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </>
    );
  }

  // ── 5b: cached ──
  const purged = cache.status === 'purged';
  const paused = cache.status === 'paused';
  const pendingFirstRun = cache.status === 'cached' && cache.runs.length === 0;
  const editDraft: CacheConfigDraft = {
    window: cache.window,
    schedule: cache.schedule,
    tableSettings: cache.tableSettings ?? model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' })),
  };

  const settingsSummary: TableColumn<TableCacheSetting>[] = [
    { key: 'table', label: 'Table', render: (_v, row) => model.tables.find((t) => t.id === row.tableId)?.name ?? row.tableId },
    { key: 'setting', label: 'Cached', render: (_v, row) => (row.mode === 'full_table' ? 'All history' : WINDOW_LABEL[row.cacheWindow!]) },
    {
      key: 'ref',
      label: 'Reference column',
      render: (_v, row) =>
        row.mode === 'window'
          ? model.tables.find((t) => t.id === row.tableId)?.columns.find((col) => col.id === row.referenceColumnId)?.name ?? '—'
          : '—',
    },
  ];

  return (
    <>
      <Vertical gap={spacing.H}>
        {/* Paused = warning (model changed → serving live); failure = error. Two
            distinct patterns. Purge feedback is a toast, not a persistent alert. */}
        {paused ? (
          <Alert
            status="warning"
            variant="page"
            dismissible={false}
            message={canFallBackToLive
              ? "This model changed after it was last cached, so the cached data is out of date — queries are running live directly from source until it's rebuilt."
              : "This model changed after it was last cached, so the cached data is out of date. It spans more than one warehouse, so it can't fall back to live — rebuild the cache to restore it."}
            buttonText="Refresh now"
            onButtonClick={doRefresh}
          />
        ) : null}

        {/* Cache Settings */}
        <Vertical gap={spacing.C}>
          <SectionHeader
            title="Cache settings"
            size="small"
            actions={
              <>
                <Button variant="secondary" size="small" icon="clock" onClick={() => setShowHistory(true)}>
                  View run history
                </Button>
                <ActionMenu
                  placement="bottom-end"
                  trigger={<Button variant="secondary" size="small" icon="more" iconOnly aria-label="More cache actions">More</Button>}
                >
                  <ActionMenuItem label="Edit cache settings" icon={<Icon name="pencil" size="s" />} onClick={() => { setModalIsEdit(true); setModalOpen(true); }} />
                  <ActionMenuItem label="Refresh cache" icon={<Icon name="refresh" size="s" />} onClick={doRefresh} />
                  <ActionMenuItem label="Purge current cache" icon={<Icon name="eye-undo" size="s" />} onClick={() => setConfirm('purge')} disabled={purged} />
                  <ActionMenuItem label="Disable cache" icon={<Icon name="trash-can" size="s" />} destructive onClick={() => setConfirm('disable')} />
                </ActionMenu>
              </>
            }
          />
          <div>
            <KeyValue label="Cache scope">{cache.window === 'full' ? 'Full model' : 'Custom'}</KeyValue>
            <KeyValue label="Refresh frequency">
              <Vertical gap={spacing.A}>
                <span>{scheduleLabel(cache.schedule)}</span>
                {scheduleDetail(cache.schedule) && (
                  <Typography variant="footnote" color="gray-light" noMargin>{scheduleDetail(cache.schedule)}</Typography>
                )}
              </Vertical>
            </KeyValue>
            <KeyValue label="Cache size">
              {purged ? (
                <Horizontal gap={spacing.B} align="center">
                  <span>—</span>
                  <StatusPill kind="neutral" label="Purged" />
                </Horizontal>
              ) : pendingFirstRun ? 'Pending first run' : formatSizeMB(cache.cacheSizeMB)}
            </KeyValue>
            {(() => {
              const lastRun = cache.runs.find((r) => r.runType === 'Scheduled' || r.runType === 'Ad-hoc');
              return lastRun ? (
                <KeyValue label="Last run">
                  <Horizontal gap={spacing.B} align="center">
                    <span>{lastRun.startTime}</span>
                    <StatusPill kind={runStatusPillKind(lastRun.status)} label={lastRun.status} />
                    {lastRun.status === 'In progress' && (
                      <Button
                        variant="tertiary"
                        size="small"
                        icon="refresh"
                        iconOnly
                        aria-label="Refresh run status"
                        onClick={refreshRunStatus}
                      >
                        Refresh run status
                      </Button>
                    )}
                    {lastRun.status === 'Error' && (
                      <Link href="#" onClick={(e) => { e.preventDefault(); setShowHistory(true); }}>
                        View details
                      </Link>
                    )}
                  </Horizontal>
                </KeyValue>
              ) : null;
            })()}
            <KeyValue label="Next scheduled run">{cache.nextRunAt}</KeyValue>
          </div>

          {cache.window === 'custom' && cache.tableSettings && (
            <Vertical gap={spacing.B} className={styles.perTableBlock}>
              <Typography variant="content-label" color="base" noMargin>
                Per-table settings
              </Typography>
              <Table columns={settingsSummary as unknown as TableColumn[]} data={cache.tableSettings as unknown as Record<string, unknown>[]} rowKey="tableId" bordered compact />
            </Vertical>
          )}
        </Vertical>

        {/* Analytics — cache hit / miss. Always shown for a live cache; empty
            (zeroed) until queries have run against it. */}
        {!purged && !pendingFirstRun && (
          <Vertical gap={spacing.C}>
            <SectionHeader title="Analytics" size="small" />
            <Typography variant="footnote" color="gray-light" noMargin>
              {cache.analytics
                ? `Based on the last cache run · ${cache.analytics.basedOn}`
                : 'No queries have run against this cache yet — stats appear once they do.'}
            </Typography>
            <Horizontal gap={spacing.D} align="stretch" wrap>
              <StatCard label="Total queries fired" value={cache.analytics ? formatRowsFull(cache.analytics.totalQueries) : '0'} />
              <StatCard
                label="Queries on cached data"
                value={cache.analytics ? `${pct(cache.analytics.cachedQueries, cache.analytics.totalQueries)}%` : '—'}
                sub={`${cache.analytics ? formatRowsFull(cache.analytics.cachedQueries) : 0} queries`}
              />
              {/* Omitted where no live fallback exists: a multi-source model cannot serve a live
                  query, so a "0%" stat would invite the reader to wonder what went wrong. */}
              {canFallBackToLive && (
                <StatCard
                  label="Queries on live data"
                  value={cache.analytics ? `${pct(cache.analytics.liveQueries, cache.analytics.totalQueries)}%` : '—'}
                  sub={`${cache.analytics ? formatRowsFull(cache.analytics.liveQueries) : 0} queries`}
                />
              )}
            </Horizontal>
          </Vertical>
        )}

      </Vertical>

      {modalOpen && (
        <CachingSettingsModal
          canFallBackToLive={canFallBackToLive}
          model={model}
          isEdit={modalIsEdit}
          initial={modalIsEdit ? editDraft : undefined}
          onClose={() => setModalOpen(false)}
          onSave={(d) => handleSaveConfig(d, modalIsEdit)}
        />
      )}

      {showHistory && <RunHistoryModal model={model} onClose={() => setShowHistory(false)} />}

      {confirm === 'purge' && (
        <ConfirmModal
          title="Purge current cache?"
          message="This will delete the current copy of your cached data from ThoughtSpot. Your cache settings will remain and the cache will run as per schedule."
          confirmText="Purge current cache"
          onConfirm={purgeCache}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'disable' && (
        <ConfirmModal
          title="Disable caching?"
          message={canFallBackToLive
            ? 'This deletes the cache data and its configuration. All queries will run live, directly from source.'
            : 'This deletes the cache data and its configuration. This model spans more than one warehouse, so it can’t be queried at all until it is cached again.'}
          confirmText="Disable caching"
          onConfirm={disableCache}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <FloatingToast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </>
  );
};
