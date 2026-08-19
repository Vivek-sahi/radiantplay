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
import { WINDOW_LABEL, WINDOW_OPTIONS } from '../../_shared/caching/windows';
import styles from './CachingSettingsModal.module.css';
import type {
  CacheScope,
  CacheWindow,
  DataModel,
  Frequency,
  Schedule,
  TableCacheSetting,
  Weekday,
} from '../types';

/**
 * Opting a table into a window here keeps Near Store's reviewed default of 13 months. The
 * canvas defaults to the shortest window instead, because there the cache is blocking a join —
 * same list, different urgency. See `_shared/caching/windows.ts`.
 *
 * Overridable per caller via `defaultTableWindow` rather than changed outright: 13 months is
 * right where the cache is a cost optimisation over years of warehouse data, and 24 hours is
 * right where the first cache has to finish before the user can carry on. One list, two defaults.
 */
const DEFAULT_MODEL_TABLE_WINDOW = '13mo' as const;

export interface CacheConfigDraft {
  window: CacheScope;
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
/**
 * Window options come from the shared list, so this dropdown and Data Studio's canvas offer the
 * same durations. Replaces a months-only `[1, 3, 6, 13]` — those four are all still here, with
 * hours and days added below them for the case where a cache blocks a join and has to be fast.
 */
const WINDOW_SELECT_OPTIONS = WINDOW_OPTIONS.map((w) => ({ id: w, label: WINDOW_LABEL[w] }));

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
  /**
   * Which window a table gets when it is switched to **Time window**.
   *
   * Defaults to Near Store's reviewed 13 months. Data Studio's canvas passes the shortest window,
   * because there caching is what unblocks a cross-warehouse join and the point of a window is to
   * make the first cache small enough to finish while the user waits — a 13-month default caches
   * far more data than the join needs to exist.
   */
  defaultTableWindow?: CacheWindow;
}> = ({
  model, initial, isEdit = false, onClose, onSave, canFallBackToLive = true,
  defaultTableWindow = DEFAULT_MODEL_TABLE_WINDOW,
}) => {
  const defaultTableSettings: TableCacheSetting[] = useMemo(
    () =>
      initial?.tableSettings ??
      model.tables.map((t) => ({ tableId: t.id, mode: 'full_table' as const })),
    [initial, model.tables],
  );

  const [window, setWindow] = useState<CacheScope>(initial?.window ?? 'full');
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
      title="Caching settings"
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
          {/* Cache window */}
          <Horizontal align="start" gap={spacing.F}>
            <FieldLabel
              title="Cache scope"
              help="Cache the whole model, or set a time window per table."
            />
            <Select
              options={[
                { id: 'full', label: 'Full model' },
                { id: 'custom', label: 'Custom' },
              ]}
              value={window}
              onChange={(v) => setWindow(v as CacheScope)}
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
                  {canFallBackToLive
                    ? 'Set how much history each table caches. Everything older is queried live directly from source.'
                    : 'Set how much history each table caches. This model draws on more than one warehouse, so anything older isn’t available — the window is what the model covers.'}
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
                    content={canFallBackToLive
                      ? '“Time window” caches only recent data (e.g. the last 13 months) in ThoughtSpot; anything older is queried live directly from source. Changing a table\'s window re-caches it on the next run and drops the old snapshot.'
                      : '“Time window” caches only recent data in ThoughtSpot. This model spans more than one warehouse, so data outside the window can’t be queried live — the window defines what the model covers. Changing a table\'s window re-caches it on the next run and drops the old snapshot.'}
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
                            cacheWindow: v === 'window' ? ts.cacheWindow ?? defaultTableWindow : undefined,
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
                            options={WINDOW_SELECT_OPTIONS}
                            value={ts.cacheWindow ?? defaultTableWindow}
                            onChange={(v) => updateTable(t.id, { cacheWindow: v as CacheWindow })}
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
            <FieldLabel title="Refresh frequency" help="How often should the cache be refreshed." />
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

          {/* "Also cache now" — create flow only. In edit, settings just save and the
              cache updates on the next scheduled run (or via Refresh cache). */}
          {!isEdit && (
            <Vertical gap={spacing.A}>
              <Checkbox
                checked={alsoCacheNow}
                onChange={setAlsoCacheNow}
                label="Also cache now"
                showLabel
              />
              <Typography variant="footnote" color="gray-light" noMargin>
                Cache immediately on save. If left unchecked, the first cache runs at the next scheduled time.
              </Typography>
            </Vertical>
          )}

          {/* All-columns disclaimer — moved below "Also cache now" so it informs
              rather than gates. Create flow only; hidden when editing. */}
          {!isEdit && (
            <Horizontal align="center" gap={spacing.B} className={styles.disclaimer}>
              <Icon name="info-circle" size="s" color={c['content-secondary']} />
              <Typography variant="body-normal" color="gray-light" noMargin>
                Caching includes every column in a table, even those not used in this model.
              </Typography>
            </Horizontal>
          )}
        </Vertical>
    </Modal>
  );
};
