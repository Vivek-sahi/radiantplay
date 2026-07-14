import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  Alert,
  Button,
  Link,
  Icon,
  ConfirmDialog,
  ActionMenu,
  ActionMenuItem,
  Typography,
  Horizontal,
  Vertical,
} from '@/components';
import type { TableColumn } from '@/components';
import { KeyValue, SectionHeader, StatCard, FloatingToast, StatusPill, runStatusPillKind } from './primitives';
import { CachingSettingsModal, type CacheConfigDraft } from './CachingSettingsModal';
import { RunHistoryModal } from './RunHistoryModal';
import { spacing } from '../styles';
import styles from './CachingTab.module.css';
import { formatRowsFull, formatSizeMB, scheduleDetail, scheduleLabel, windowMonthsLabel } from '../utils';
import type { CacheRun, CacheState, DataModel, TableCacheSetting, TableRunResult, WindowMonths } from '../types';

const REBUILD_MS = 6000; // simulated cache build time

// ── cache stat computation ────────────────────────────────────────────────────
const monthsFactor = (m?: WindowMonths) => (m ? Math.min(1, m / 24) : 1);

function computeStats(model: DataModel, draft: CacheConfigDraft) {
  const settings: TableCacheSetting[] =
    draft.window === 'custom' ? draft.tableSettings : model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' }));
  let sizeMB = 0;
  let rows = 0;
  const tableResults: TableRunResult[] = model.tables.map((t) => {
    const ts = settings.find((s) => s.tableId === t.id);
    const windowed = ts?.mode === 'window';
    const factor = windowed ? monthsFactor(ts?.windowMonths) : 1;
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
      windowApplied: windowed ? windowMonthsLabel(ts!.windowMonths!) : 'All history',
    };
  });
  return { sizeMB, rows, tableResults };
}

let runSeq = 1000;
const nextRunId = () => `nr-${(runSeq += 1)}`;
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ── Caching tab ─────────────────────────────────────────────────────────────
export const CachingTab: React.FC<{ model: DataModel; onChange: (next: DataModel) => void }> = ({ model, onChange }) => {
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
    setToast({ message: 'Cache completed successfully', type: 'success' });
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
        setToast({ message: 'Settings saved — changes apply on the next scheduled run.', type: 'info' });
      } else {
        // Enable, schedule-only → pending first run.
        onChange({ ...model, cache: { ...baseCache, lastRunStatus: 'In progress', runs: [] } });
        setToast({ message: 'Caching scheduled — the first run will follow the schedule above.', type: 'info' });
      }
      return;
    }

    startRun(
      isEdit ? 'Config change' : 'Scheduled',
      draft,
      baseCache,
      'Caching is in progress and may take up to a few mins. View status in run history.',
    );
  };

  const doRefresh = () => {
    if (!cache) return;
    const draft: CacheConfigDraft = {
      window: cache.window,
      schedule: cache.schedule,
      tableSettings: cache.tableSettings ?? model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' })),
    };
    startRun('Ad-hoc', draft, cache, 'Caching is in progress and may take up to a few mins. View status in run history.');
  };

  const purgeCache = () => {
    if (!cache) return;
    onChange({ ...model, cache: { ...cache, status: 'purged', cacheSizeMB: 0, rowCount: 0 } });
    setConfirm(null);
    setToast({ message: 'Cache purged — configuration retained. Run “Refresh Cache” to rebuild.', type: 'info' });
  };

  const disableCache = () => {
    onChange({ ...model, cache: undefined });
    setConfirm(null);
  };

  const handleSaveConfig = (draft: CacheConfigDraft, isEdit: boolean) => {
    setModalOpen(false);
    applyConfig(draft, isEdit);
  };

  // ── 5a: not cached ──
  if (!cache) {
    return (
      <>
        <Vertical align="center" justify="center" gap={spacing.D} className={styles.emptyState}>
          <Button variant="primary" onClick={() => { setModalIsEdit(false); setModalOpen(true); }}>
            {`Cache ${model.name}`}
          </Button>
          <div className={styles.emptyStateText}>
            <Typography variant="body-normal" color="gray-light" noMargin>
              By caching this model, you can reduce your live query cost and improve loading performance.
            </Typography>
          </div>
          <Link href="/near-store-overview.html" target="_blank" rel="noopener">Learn more about caching</Link>
        </Vertical>
        {modalOpen && (
          <CachingSettingsModal model={model} isEdit={false} onClose={() => setModalOpen(false)} onSave={(d) => handleSaveConfig(d, false)} />
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
    { key: 'setting', label: 'Cached', render: (_v, row) => (row.mode === 'full_table' ? 'All history' : windowMonthsLabel(row.windowMonths!)) },
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
            message="This model changed after it was last cached, so the cache is invalidated — queries are running live from Snowflake until it's rebuilt."
            buttonText="Refresh now"
            onButtonClick={doRefresh}
          />
        ) : !purged && cache.lastRunStatus === 'Failure' ? (
          <Alert
            status="failure"
            variant="page"
            dismissible={false}
            message="The last cache run failed. Queries are routing to the live warehouse until the next successful run."
            buttonText="View details"
            onButtonClick={() => setShowHistory(true)}
          />
        ) : null}

        {/* Cache Settings */}
        <Vertical gap={spacing.C}>
          <SectionHeader
            title="Cache Settings"
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
                  <ActionMenuItem label="Refresh Cache" icon={<Icon name="refresh" size="s" />} onClick={doRefresh} />
                  <ActionMenuItem label="Purge current cache" icon={<Icon name="eye-undo" size="s" />} onClick={() => setConfirm('purge')} disabled={purged} />
                  <ActionMenuItem label="Disable Cache" icon={<Icon name="trash-can" size="s" />} destructive onClick={() => setConfirm('disable')} />
                </ActionMenu>
              </>
            }
          />
          <div>
            <KeyValue label="Cache scope">{cache.window === 'full' ? 'Full Model' : 'Custom'}</KeyValue>
            <KeyValue label="Refresh frequency">
              <Vertical gap={spacing.A}>
                <span>{scheduleLabel(cache.schedule)}</span>
                {scheduleDetail(cache.schedule) && (
                  <Typography variant="footnote" color="gray-light" noMargin>{scheduleDetail(cache.schedule)}</Typography>
                )}
              </Vertical>
            </KeyValue>
            <KeyValue label="Cache size">
              {purged ? '—' : pendingFirstRun ? 'Pending first run' : formatSizeMB(cache.cacheSizeMB)}
            </KeyValue>
            {(() => {
              const lastRun = cache.runs.find((r) => r.runType === 'Scheduled' || r.runType === 'Ad-hoc');
              return lastRun ? (
                <KeyValue label="Last run">
                  <Horizontal gap={spacing.B} align="center">
                    <span>{lastRun.startTime}</span>
                    <StatusPill kind={runStatusPillKind(lastRun.status)} label={lastRun.status} />
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
              <StatCard
                label="Queries on live data"
                value={cache.analytics ? `${pct(cache.analytics.liveQueries, cache.analytics.totalQueries)}%` : '—'}
                sub={`${cache.analytics ? formatRowsFull(cache.analytics.liveQueries) : 0} queries`}
              />
            </Horizontal>
          </Vertical>
        )}

      </Vertical>

      {modalOpen && (
        <CachingSettingsModal
          model={model}
          isEdit={modalIsEdit}
          initial={modalIsEdit ? editDraft : undefined}
          onClose={() => setModalOpen(false)}
          onSave={(d) => handleSaveConfig(d, modalIsEdit)}
        />
      )}

      {showHistory && <RunHistoryModal model={model} onClose={() => setShowHistory(false)} />}

      <ConfirmDialog
        isOpen={confirm === 'purge'}
        title="Purge current cache?"
        message="This removes the latest cache snapshot to free up data store space. Your caching configuration and schedule are kept — the next scheduled run (or Refresh Cache) will rebuild the snapshot."
        confirmText="Purge current cache"
        status="warning"
        onConfirm={purgeCache}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        isOpen={confirm === 'disable'}
        title="Disable caching?"
        message="This deletes the cache data and its configuration. All queries will route live to Snowflake. You'll need to set caching up again from scratch."
        confirmText="Disable caching"
        status="danger"
        onConfirm={disableCache}
        onCancel={() => setConfirm(null)}
      />

      {toast && <FloatingToast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </>
  );
};
