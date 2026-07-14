import React, { useMemo, useState } from 'react';
import {
  Modal,
  ModalFooter,
  Select,
  SegmentedControl,
  Checkbox,
  TextInput,
  Tooltip,
  Button,
  Link,
  Icon,
  Typography,
  Horizontal,
  Vertical,
} from '@/components';
import { c, spacing } from '../styles';
import styles from './CachingSettingsModal.module.css';
import type {
  CacheWindow,
  DataModel,
  Frequency,
  Schedule,
  TableCacheSetting,
  Weekday,
  WindowMonths,
} from '../types';

export interface CacheConfigDraft {
  window: CacheWindow;
  schedule: Schedule;
  tableSettings: TableCacheSetting[];
  /** Enable flow only: cache immediately on save, or wait for the first scheduled run. */
  alsoCacheNow?: boolean;
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

const WEEKDAYS: Weekday[] = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'S'];

const FieldLabel: React.FC<{ title: string; help?: string }> = ({ title, help }) => (
  <Vertical gap={spacing.A} className={styles.labelCol}>
    <Typography variant="content-label" color="base" noMargin>
      {title}
    </Typography>
    {help && (
      <Typography variant="body-normal" color="gray-light" noMargin>
        {help}
      </Typography>
    )}
  </Vertical>
);

const Connector: React.FC<{ children: string }> = ({ children }) => (
  <Typography variant="body-normal" color="gray-light" as="span" noMargin>
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
  // Default: cache now when first enabling; leave unchecked when editing an
  // existing cache (edits apply on the next scheduled run unless opted in).
  const [alsoCacheNow, setAlsoCacheNow] = useState(!isEdit);

  const updateTable = (tableId: string, patch: Partial<TableCacheSetting>) =>
    setTableSettings((prev) => prev.map((ts) => (ts.tableId === tableId ? { ...ts, ...patch } : ts)));

  const toggleWeekday = (day: Weekday) =>
    setSchedule((s) => {
      const cur = s.weekdays ?? [];
      return { ...s, weekdays: cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day] };
    });

  const handleSave = () => onSave({ window, schedule, tableSettings, alsoCacheNow });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Caching Settings"
      size="M3"
      footer={
        <ModalFooter
          secondaryAction={
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          }
          primaryAction={
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          }
        />
      }
    >
      <Vertical gap={spacing.F}>
          <Horizontal align="center" gap={spacing.B} className={styles.disclaimer}>
            <Icon name="info-circle" size="s" color={c['content-secondary']} />
            <Typography variant="body-normal" color="gray-light" noMargin>
              Caching includes every column in a table, even those not used in this model.
            </Typography>
          </Horizontal>
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
                <Typography variant="body-normal" color="gray-light" noMargin>
                  Set how much history each table caches. Everything older is queried live from Snowflake.
                </Typography>
              </Vertical>

              {/* Header row */}
              <Horizontal gap={spacing.F} align="center" className={styles.tableHeaderRow}>
                <div className={styles.labelCol}>
                  <Typography variant="overline" color="gray-light" noMargin>Table</Typography>
                </div>
                <Horizontal gap={spacing.A} align="center">
                  <Typography variant="overline" color="gray-light" noMargin>Cache setting</Typography>
                  <Tooltip
                    maxWidth={300}
                    content="“Time window” caches only recent data (e.g. the last 13 months) in ThoughtSpot; anything older is queried live from Snowflake. Changing a table's window re-caches it on the next run and drops the old snapshot."
                  >
                    <span className={styles.helpTrigger}>
                      <Icon name="info-circle" size="s" color={c['content-secondary']} />
                    </span>
                  </Tooltip>
                </Horizontal>
              </Horizontal>

              {model.tables.map((t, idx, arr) => {
                const ts = tableSettings.find((x) => x.tableId === t.id)!;
                const dateCols = t.columns.filter((col) => col.type === 'date');
                const noDate = dateCols.length === 0;
                return (
                  <Horizontal
                    key={t.id}
                    gap={spacing.F}
                    align="center"
                    className={`${styles.tableRow} ${idx < arr.length - 1 ? styles.tableRowBordered : ''}`}
                  >
                    <div className={styles.labelCol}>
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
                          { id: 'window', label: 'Time window', disabled: noDate },
                        ]}
                        value={ts.mode}
                        onChange={(v) =>
                          updateTable(t.id, {
                            mode: v as TableCacheSetting['mode'],
                            windowMonths: v === 'window' ? ts.windowMonths ?? 13 : undefined,
                            referenceColumnId: v === 'window' ? (ts.referenceColumnId ?? dateCols[0]?.id) : undefined,
                          })
                        }
                        size="small"
                        aria-label={`Cache mode for ${t.name}`}
                      />
                      {noDate ? (
                        <Typography variant="footnote" color="gray-light" noMargin>
                          No date column — caches all history
                        </Typography>
                      ) : ts.mode === 'window' ? (
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
                      ) : null}
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
                  onChange={(v) =>
                    setSchedule((s) => {
                      const frequency = v as Frequency;
                      return {
                        ...s,
                        frequency,
                        weekdays: frequency === 'weekly' ? s.weekdays ?? ['M'] : s.weekdays,
                        monthDays: frequency === 'monthly' ? s.monthDays ?? '1' : s.monthDays,
                      };
                    })
                  }
                  aria-label="Frequency"
                />
                <Connector>at</Connector>
                <Select
                  options={HOUR_OPTIONS}
                  value={String(schedule.hour)}
                  onChange={(v) => setSchedule((s) => ({ ...s, hour: Number(v) }))}
                  aria-label="Hour"
                />
                <Connector>:</Connector>
                <Select
                  options={MINUTE_OPTIONS}
                  value={String(schedule.minute)}
                  onChange={(v) => setSchedule((s) => ({ ...s, minute: Number(v) }))}
                  aria-label="Minute"
                />
                <Connector>hours</Connector>
              </Horizontal>
              {schedule.frequency === 'daily' && (
                <Checkbox
                  checked={schedule.excludeWeekends}
                  onChange={(checked) => setSchedule((s) => ({ ...s, excludeWeekends: checked }))}
                  label="Exclude weekends"
                  showLabel
                />
              )}
              {schedule.frequency === 'weekly' && (
                <Horizontal gap={spacing.A} wrap>
                  {WEEKDAYS.map((d) => {
                    const on = (schedule.weekdays ?? []).includes(d);
                    return (
                      <button key={d} type="button" onClick={() => toggleWeekday(d)} className={`${styles.dayChip} ${on ? styles.dayChipOn : ''}`} aria-pressed={on}>
                        {d}
                      </button>
                    );
                  })}
                </Horizontal>
              )}
              {schedule.frequency === 'monthly' && (
                <Vertical gap={spacing.A} className={styles.monthlyInput}>
                  <TextInput
                    value={schedule.monthDays ?? ''}
                    onChange={(e) => setSchedule((s) => ({ ...s, monthDays: e.target.value }))}
                    placeholder="e.g. 1,10,20"
                  />
                  <Typography variant="footnote" color="gray-light" noMargin>
                    Enter dates separated by comma e.g. 2,5,10…
                  </Typography>
                </Vertical>
              )}
              <Link href="#" onClick={(e) => e.preventDefault()}>
                {schedule.timezone}
              </Link>
            </Vertical>
          </Horizontal>

          {/* "Also cache now" — cache on save, or leave unchecked to apply on the
              next scheduled run. Replaces the old edit-mode refresh warning. */}
          <Vertical gap={spacing.A}>
            <Checkbox
              checked={alsoCacheNow}
              onChange={setAlsoCacheNow}
              label="Also cache now"
              showLabel
            />
            <Typography variant="footnote" color="gray-light" noMargin>
              {isEdit
                ? 'Rebuild the cache now so your new settings take effect immediately. If unchecked, they’re saved but the current cache keeps serving until the next scheduled run.'
                : 'Cache immediately on save. If left unchecked, the first cache runs at the next scheduled time.'}
            </Typography>
          </Vertical>
        </Vertical>
    </Modal>
  );
};
