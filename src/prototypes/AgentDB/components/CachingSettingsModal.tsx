import React, { useMemo, useState } from 'react';
import {
  Modal,
  Select,
  SegmentedControl,
  Checkbox,
  Alert,
  Button,
  Link,
  Icon,
  Typography,
  Horizontal,
  Vertical,
} from '../../../components';
import { c, spacing, radius } from '../styles';
import type {
  CacheWindow,
  DataModel,
  Frequency,
  Schedule,
  TableCacheSetting,
  WindowMonths,
} from '../types';

export interface CacheConfigDraft {
  window: CacheWindow;
  schedule: Schedule;
  tableSettings: TableCacheSetting[];
}

const FREQ_OPTIONS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({ id: String(h), label: String(h).padStart(2, '0') }));
const MINUTE_OPTIONS = [0, 15, 30, 45].map((m) => ({ id: String(m), label: String(m).padStart(2, '0') }));
const MONTHS_OPTIONS: { id: string; label: string }[] = [1, 3, 6, 13].map((m) => ({
  id: String(m),
  label: `Last ${m} months`,
}));

/** Shared left-column width so labels + table names align, and all controls line up. */
const LABEL_W = '240px';

const FieldLabel: React.FC<{ title: string; help?: string }> = ({ title, help }) => (
  <Vertical gap={spacing.A} style={{ width: LABEL_W, flexShrink: 0 }}>
    <Typography variant="content-label" color="base" noMargin>
      {title}
    </Typography>
    {help && (
      <Typography variant="body-normal" color="gray" noMargin>
        {help}
      </Typography>
    )}
  </Vertical>
);

const Connector: React.FC<{ children: string }> = ({ children }) => (
  <Typography variant="body-normal" color="gray" as="span" noMargin>
    {children}
  </Typography>
);

export const CachingSettingsModal: React.FC<{
  model: DataModel;
  initial?: CacheConfigDraft;
  isEdit?: boolean;
  onClose: () => void;
  onSave: (draft: CacheConfigDraft) => void;
}> = ({ model, initial, isEdit = false, onClose, onSave }) => {
  const defaultTableSettings: TableCacheSetting[] = useMemo(
    () =>
      initial?.tableSettings ??
      model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' as const })),
    [initial, model.tables],
  );

  const [window, setWindow] = useState<CacheWindow>(initial?.window ?? 'full');
  const [schedule, setSchedule] = useState<Schedule>(
    initial?.schedule ?? { frequency: 'daily', hour: 9, minute: 0, excludeWeekends: true, timezone: 'Asia/Calcutta' },
  );
  const [tableSettings, setTableSettings] = useState<TableCacheSetting[]>(defaultTableSettings);

  const updateTable = (tableId: string, patch: Partial<TableCacheSetting>) =>
    setTableSettings((prev) => prev.map((ts) => (ts.tableId === tableId ? { ...ts, ...patch } : ts)));

  // Validation: any windowed table needs a reference column.
  const invalid =
    window === 'custom' &&
    tableSettings.some((ts) => ts.mode === 'window' && !ts.referenceColumnId);

  const changed =
    JSON.stringify({ window, schedule, tableSettings }) !== JSON.stringify(initial ?? {});

  const handleSave = () => onSave({ window, schedule, tableSettings });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Caching Settings"
      size="M3"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={invalid}>
            Save
          </Button>
        </>
      }
    >
      <div style={{ maxHeight: '58vh', overflowY: 'auto', paddingRight: `${spacing.B}px` }}>
        <Vertical gap={spacing.F} style={{ paddingBottom: `${spacing.B}px` }}>
          {/* Cache window */}
          <Horizontal align="start" gap={spacing.F}>
            <FieldLabel
              title="Cache scope"
              help="Cache the whole model, or set a time window per table."
            />
            <Select
              options={[
                { id: 'full', label: 'Full Model' },
                { id: 'custom', label: 'Custom' },
              ]}
              value={window}
              onChange={(v) => setWindow(v as CacheWindow)}
              aria-label="Cache window"
            />
          </Horizontal>

          {/* Per-table settings (custom only) */}
          {window === 'custom' && (
            <Vertical gap={spacing.C}>
              <Vertical gap={spacing.A}>
                <Typography variant="content-label" color="base" noMargin>
                  Custom settings
                </Typography>
                <Typography variant="body-normal" color="gray" noMargin>
                  Set how much history each table caches. Everything older is queried live from Snowflake.
                </Typography>
              </Vertical>

              {/* Header row */}
              <Horizontal gap={spacing.F} align="center" style={{ paddingBottom: `${spacing.A}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                <div style={{ width: LABEL_W, flexShrink: 0 }}>
                  <Typography variant="overline" color="gray" noMargin>Table</Typography>
                </div>
                <Typography variant="overline" color="gray" noMargin>Cache setting</Typography>
              </Horizontal>

              {model.tables.map((t, idx, arr) => {
                const ts = tableSettings.find((x) => x.tableId === t.id)!;
                const dateCols = t.columns.filter((col) => col.type === 'date');
                return (
                  <Horizontal
                    key={t.id}
                    gap={spacing.F}
                    align="center"
                    style={{
                      minHeight: '40px',
                      paddingBottom: `${spacing.C}px`,
                      borderBottom: idx < arr.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
                    }}
                  >
                    <div style={{ width: LABEL_W, flexShrink: 0 }}>
                      <Horizontal gap={spacing.B} align="center">
                        <Icon name="table" size="s" color={c['content-secondary']} />
                        <Typography variant="body-normal" color="base" noMargin>
                          {t.name}
                        </Typography>
                      </Horizontal>
                    </div>
                    <Horizontal gap={spacing.C} align="center">
                      <SegmentedControl
                        options={[
                          { id: 'full_table', label: 'All history' },
                          { id: 'window', label: 'Time window' },
                        ]}
                        value={ts.mode}
                        onChange={(v) =>
                          updateTable(t.id, {
                            mode: v as TableCacheSetting['mode'],
                            windowMonths: v === 'window' ? ts.windowMonths ?? 13 : undefined,
                            referenceColumnId: v === 'window' ? ts.referenceColumnId : undefined,
                          })
                        }
                        size="small"
                        aria-label={`Cache mode for ${t.name}`}
                      />
                      {ts.mode === 'window' && (
                        <>
                          <Select
                            options={MONTHS_OPTIONS}
                            value={String(ts.windowMonths ?? 13)}
                            onChange={(v) => updateTable(t.id, { windowMonths: Number(v) as WindowMonths })}
                            size="small"
                            aria-label={`Window length for ${t.name}`}
                          />
                          <Select
                            options={dateCols.map((col) => ({ id: col.id, label: col.name }))}
                            value={ts.referenceColumnId}
                            onChange={(v) => updateTable(t.id, { referenceColumnId: v })}
                            placeholder="Select column"
                            size="small"
                            aria-label={`Reference column for ${t.name}`}
                          />
                        </>
                      )}
                    </Horizontal>
                  </Horizontal>
                );
              })}
            </Vertical>
          )}

          {/* Refresh frequency */}
          <Horizontal align="start" gap={spacing.F}>
            <FieldLabel title="Refresh Frequency" help="How often should the cache be refreshed." />
            <Vertical gap={spacing.C}>
              <Horizontal gap={spacing.B} align="center" wrap>
                <Select
                  options={FREQ_OPTIONS}
                  value={schedule.frequency}
                  onChange={(v) => setSchedule((s) => ({ ...s, frequency: v as Frequency }))}
                  aria-label="Frequency"
                />
                <Connector>at</Connector>
                <Select
                  options={HOUR_OPTIONS}
                  value={String(schedule.hour)}
                  onChange={(v) => setSchedule((s) => ({ ...s, hour: Number(v) }))}
                  size="small"
                  aria-label="Hour"
                />
                <Connector>:</Connector>
                <Select
                  options={MINUTE_OPTIONS}
                  value={String(schedule.minute)}
                  onChange={(v) => setSchedule((s) => ({ ...s, minute: Number(v) }))}
                  size="small"
                  aria-label="Minute"
                />
                <Connector>hours</Connector>
              </Horizontal>
              <Checkbox
                checked={schedule.excludeWeekends}
                onChange={(checked) => setSchedule((s) => ({ ...s, excludeWeekends: checked }))}
                label="Exclude weekends"
                showLabel
              />
              <Link href="#" onClick={(e) => e.preventDefault()}>
                {schedule.timezone}
              </Link>
            </Vertical>
          </Horizontal>

          {/* Info / warning banner */}
          {!isEdit ? (
            <Horizontal
              gap={spacing.B}
              align="center"
              style={{ width: '100%', padding: `${spacing.C}px ${spacing.D}px`, backgroundColor: c['background-subtle'], borderRadius: `${radius.md}px` }}
            >
              <Icon name="info-circle" size="s" color={c['content-secondary']} />
              <Typography variant="body-normal" color="gray" noMargin>
                First Cache will be done today. Future refreshes will follow the schedule above.
              </Typography>
            </Horizontal>
          ) : changed ? (
            <Alert
              status="warning"
              variant="section-multiline"
              dismissible={false}
              message="Saving will refresh the cache now and delete the existing snapshot."
            />
          ) : null}

          {invalid && (
            <Horizontal gap={spacing.A} align="center">
              <Icon name="exclamation-point-circle" size="s" color={c['content-warning']} />
              <Typography variant="body-normal" color="gray" noMargin>
                Select a reference column for each table using a time window.
              </Typography>
            </Horizontal>
          )}
        </Vertical>
      </div>
    </Modal>
  );
};
