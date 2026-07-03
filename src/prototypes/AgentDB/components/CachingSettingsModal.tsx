import React, { useMemo, useState } from 'react';
import {
  Modal,
  Select,
  SegmentedControl,
  Checkbox,
  TextInput,
  Tooltip,
  Alert,
  Button,
  Link,
  Icon,
  Typography,
  Horizontal,
  Vertical,
} from '../../../components';
import { c, spacing, radius, fontFamily, fontSize, fontWeight } from '../styles';
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

const WEEKDAYS: Weekday[] = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'S'];

const dayChip = (on: boolean): React.CSSProperties => ({
  minWidth: '34px',
  height: '32px',
  padding: `0 ${spacing.B}px`,
  border: 'none',
  borderRadius: `${radius.md}px`,
  cursor: 'pointer',
  fontFamily: fontFamily.primary,
  fontSize: `${fontSize.sm}px`,
  fontWeight: fontWeight.medium,
  backgroundColor: on ? c['background-information'] : c['background-subtle'],
  color: on ? c['content-brand'] : c['content-secondary'],
});

const FieldLabel: React.FC<{ title: string; help?: string }> = ({ title, help }) => (
  <Vertical gap={spacing.A} style={{ width: LABEL_W, flexShrink: 0 }}>
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

  const updateTable = (tableId: string, patch: Partial<TableCacheSetting>) =>
    setTableSettings((prev) => prev.map((ts) => (ts.tableId === tableId ? { ...ts, ...patch } : ts)));

  const toggleWeekday = (day: Weekday) =>
    setSchedule((s) => {
      const cur = s.weekdays ?? [];
      return { ...s, weekdays: cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day] };
    });

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
          <Button variant="primary" onClick={handleSave}>
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
                <Typography variant="body-normal" color="gray-light" noMargin>
                  Set how much history each table caches. Everything older is queried live from Snowflake.
                </Typography>
              </Vertical>

              {/* Header row */}
              <Horizontal gap={spacing.F} align="center" style={{ paddingBottom: `${spacing.A}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                <div style={{ width: LABEL_W, flexShrink: 0 }}>
                  <Typography variant="overline" color="gray-light" noMargin>Table</Typography>
                </div>
                <Horizontal gap={spacing.A} align="center">
                  <Typography variant="overline" color="gray-light" noMargin>Cache setting</Typography>
                  <Tooltip
                    maxWidth={300}
                    content="“Time window” caches only recent data (e.g. the last 13 months) in ThoughtSpot; anything older is queried live from Snowflake. Changing a table's window re-caches it on the next run and drops the old snapshot."
                  >
                    <span style={{ display: 'inline-flex', cursor: 'help' }}>
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
                      <button key={d} type="button" onClick={() => toggleWeekday(d)} style={dayChip(on)} aria-pressed={on}>
                        {d}
                      </button>
                    );
                  })}
                </Horizontal>
              )}
              {schedule.frequency === 'monthly' && (
                <Vertical gap={spacing.A} style={{ maxWidth: '320px' }}>
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

          {/* Info / warning banner */}
          {!isEdit ? (
            <Horizontal
              gap={spacing.B}
              align="center"
              style={{ width: '100%', padding: `${spacing.C}px ${spacing.D}px`, backgroundColor: c['background-subtle'], borderRadius: `${radius.md}px` }}
            >
              <Icon name="info-circle" size="s" color={c['content-secondary']} />
              <Typography variant="body-normal" color="gray-light" noMargin>
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
        </Vertical>
      </div>
    </Modal>
  );
};
