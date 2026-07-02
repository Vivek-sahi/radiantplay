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
  LoadingIndicator,
  Toast,
  Typography,
  Horizontal,
  Vertical,
} from '../../../components';
import type { TableColumn } from '../../../components';
import { KeyValue, SectionHeader } from './primitives';
import { CachingSettingsModal, type CacheConfigDraft } from './CachingSettingsModal';
import { RunHistoryModal } from './RunHistoryModal';
import { c, spacing } from '../styles';
import { formatSizeMB, scheduleLabel, windowMonthsLabel } from '../utils';
import type { CacheRun, DataModel, TableCacheSetting, TableRunResult, WindowMonths } from '../types';

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
function buildRun(runType: CacheRun['runType'], rows: number, tableResults: TableRunResult[]): CacheRun {
  runSeq += 1;
  return { id: `nr-${runSeq}`, runType, startTime: 'Just now', endTime: 'Just now', rows, status: 'Success', tableResults };
}

// ── Caching tab ─────────────────────────────────────────────────────────────
export const CachingTab: React.FC<{ model: DataModel; onChange: (next: DataModel) => void }> = ({ model, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIsEdit, setModalIsEdit] = useState(false);
  const [confirm, setConfirm] = useState<null | 'purge' | 'disable'>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState<null | 'caching' | 'refreshing'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  const cache = model.cache;

  // ── mutations ──
  const applyConfig = (draft: CacheConfigDraft, isEdit: boolean) => {
    const stats = computeStats(model, draft);
    const run = buildRun(isEdit ? 'Config change' : 'Scheduled', stats.rows, stats.tableResults);
    onChange({
      ...model,
      cache: {
        status: 'cached',
        window: draft.window,
        tableSettings: draft.window === 'custom' ? draft.tableSettings : undefined,
        schedule: draft.schedule,
        cacheSizeMB: stats.sizeMB,
        rowCount: stats.rows,
        nextRunAt: 'Tomorrow, 9:00 AM',
        lastRunStatus: 'Success',
        runs: isEdit && cache ? [run, ...cache.runs] : [run],
      },
    });
  };

  const doRefresh = () => {
    if (!cache) return;
    const draft: CacheConfigDraft = {
      window: cache.window,
      schedule: cache.schedule,
      tableSettings: cache.tableSettings ?? model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' })),
    };
    const stats = computeStats(model, draft);
    const run = buildRun('Ad-hoc', stats.rows, stats.tableResults);
    onChange({
      ...model,
      cache: { ...cache, status: 'cached', cacheSizeMB: stats.sizeMB, rowCount: stats.rows, lastRunStatus: 'Success', nextRunAt: 'Tomorrow, 9:00 AM', runs: [run, ...cache.runs] },
    });
  };

  const purgeCache = () => {
    if (!cache) return;
    onChange({ ...model, cache: { ...cache, status: 'purged', cacheSizeMB: 0, rowCount: 0 } });
    setConfirm(null);
  };

  const disableCache = () => {
    onChange({ ...model, cache: undefined });
    setConfirm(null);
  };

  // Run a simulated build, showing a loading state first.
  const scheduleRebuild = (fn: () => void, mode: 'caching' | 'refreshing') => {
    setBusy(mode);
    timerRef.current = window.setTimeout(() => {
      fn();
      setBusy(null);
      setToast('Cache completed successfully');
    }, REBUILD_MS);
  };

  const handleSaveConfig = (draft: CacheConfigDraft, isEdit: boolean) => {
    setModalOpen(false);
    scheduleRebuild(() => applyConfig(draft, isEdit), isEdit ? 'refreshing' : 'caching');
  };

  // ── busy: loading state (enable / refresh) ──
  if (busy) {
    return (
      <Vertical gap={spacing.F}>
        <Vertical align="center" justify="center" gap={spacing.D} style={{ padding: `${spacing.J}px 0` }}>
          <LoadingIndicator
            size="large"
            centered
            text={busy === 'caching' ? `Caching ${model.name}…` : 'Refreshing cache…'}
          />
          <Typography variant="body-normal" color="gray" noMargin>
            Copying data from Snowflake into the ThoughtSpot data store. This can take a few moments.
          </Typography>
        </Vertical>
      </Vertical>
    );
  }

  // ── 5a: not cached ──
  if (!cache) {
    return (
      <>
        <Vertical align="center" justify="center" gap={spacing.D} style={{ padding: `${spacing.I}px 0`, textAlign: 'center' }}>
          <Button variant="primary" onClick={() => { setModalIsEdit(false); setModalOpen(true); }}>
            {`Cache ${model.name}`}
          </Button>
          <div style={{ maxWidth: '480px' }}>
            <Typography variant="body-normal" color="gray" noMargin>
              By caching this model, you can reduce your live query cost and improve loading performance.
            </Typography>
          </div>
          <Link href="/agentdb-overview.html" target="_blank" rel="noopener">Learn more about caching</Link>
        </Vertical>
        {modalOpen && (
          <CachingSettingsModal model={model} isEdit={false} onClose={() => setModalOpen(false)} onSave={(d) => handleSaveConfig(d, false)} />
        )}
        {toast && <Toast message={toast} type="success" position="bottom-right" onDismiss={() => setToast(null)} />}
      </>
    );
  }

  // ── 5b: cached ──
  const purged = cache.status === 'purged';
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
        {/* Persistent alerts only for states that need attention (purged / failed). */}
        {purged ? (
          <Alert status="info" variant="section-multiline" dismissible={false} message="Cache purged — configuration retained. Run “Refresh Cache” to rebuild the snapshot." />
        ) : cache.lastRunStatus === 'Failure' ? (
          <Alert
            status="failure"
            variant="section-multiline"
            dismissible={false}
            message="The last cache run failed. Queries are routing to the live warehouse until the next successful run. Open the run log for per-table details."
          />
        ) : null}

        {/* Cache Settings */}
        <Vertical gap={spacing.C}>
          <SectionHeader
            title="Cache Settings"
            actions={
              <>
                <Button variant="tertiary" size="small" icon="pencil" onClick={() => { setModalIsEdit(true); setModalOpen(true); }}>
                  Edit
                </Button>
                <ActionMenu
                  placement="bottom-end"
                  trigger={<Button variant="tertiary" size="small" icon="more">More</Button>}
                >
                  <ActionMenuItem label="Refresh Cache" icon={<Icon name="refresh" size="s" />} onClick={() => scheduleRebuild(doRefresh, 'refreshing')} />
                  <ActionMenuItem label="Purge Cache" icon={<Icon name="eye-undo" size="s" />} onClick={() => setConfirm('purge')} disabled={purged} />
                  <ActionMenuItem label="Disable Cache" icon={<Icon name="trash-can" size="s" />} destructive onClick={() => setConfirm('disable')} />
                </ActionMenu>
              </>
            }
          />
          <div style={{ borderTop: `1px solid ${c['border-divider']}`, paddingTop: `${spacing.C}px` }}>
            <KeyValue label="Cache scope">{cache.window === 'full' ? 'Full Model' : 'Custom'}</KeyValue>
            <KeyValue label="Refresh frequency">
              <Vertical gap={spacing.A / 2}>
                <span>{scheduleLabel(cache.schedule)}</span>
                {cache.schedule.excludeWeekends && (
                  <Typography variant="footnote" color="gray" noMargin>Excluding weekends</Typography>
                )}
              </Vertical>
            </KeyValue>
            <KeyValue label="Cache size">{purged ? '—' : formatSizeMB(cache.cacheSizeMB)}</KeyValue>
            <KeyValue label="Next scheduled run">{cache.nextRunAt}</KeyValue>
          </div>

          {cache.window === 'custom' && cache.tableSettings && (
            <Vertical gap={spacing.B} style={{ marginTop: `${spacing.C}px` }}>
              <Typography variant="content-label" color="base" noMargin>
                Per-table settings
              </Typography>
              <Table columns={settingsSummary as unknown as TableColumn[]} data={cache.tableSettings as unknown as Record<string, unknown>[]} rowKey="tableId" bordered compact />
            </Vertical>
          )}
        </Vertical>

        {/* Run history entry point */}
        <Horizontal>
          <Button variant="secondary" size="small" icon="clock" onClick={() => setShowHistory(true)}>
            View run history
          </Button>
        </Horizontal>
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
        title="Purge cache data?"
        message="This removes the latest cache snapshot to free up data store space. Your caching configuration and schedule are kept — the next scheduled run (or Refresh Cache) will rebuild the snapshot."
        confirmText="Purge cache"
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

      {toast && <Toast message={toast} type="success" position="bottom-right" onDismiss={() => setToast(null)} />}
    </>
  );
};
