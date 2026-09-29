import React, { useState } from 'react';
import { Horizontal, Table, Typography, Vertical } from '@/components';
import { referenceColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { StoreTable } from '../types';
import { formatGB } from '../data';
import styles from './storage.module.css';

/**
 * Colour follows the source, never its rank. Radiant chart palette, snapped to the nearest
 * passing steps (validated 28 Sep: brand-60, orange-70, purple-60, green-70, yellow-70).
 * Yellow-70 is under 3:1 on white, so every segment is also named in the legend with its value.
 */
const SOURCE_COLOR: Record<string, string> = {
  ThoughtSpot: referenceColors.brand['60'],
  Airflow: referenceColors.orange['70'],
  Fivetran: referenceColors.purple['60'],
  'dbt Cloud': referenceColors.green['70'],
  'File upload': referenceColors.yellow['70'],
};
const FALLBACK = referenceColors.gray['60'];

const pct = (part: number, whole: number) => {
  const p = (part / whole) * 100;
  return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`;
};

/** GB added in the last 7 days, per source (sample data). */
const WEEK_GROWTH: Record<string, number> = {
  ThoughtSpot: 1.2,
  Airflow: 28.4,
  Fivetran: 2.1,
  'dbt Cloud': 0.1,
  'File upload': 0,
};

export const StorageBySource: React.FC<{ tables: StoreTable[]; capacityGB: number }> = ({ tables, capacityGB }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const bySource = Object.values(
    tables.reduce<Record<string, { label: string; gb: number; count: number }>>((acc, t) => {
      const k = t.writer.label;
      acc[k] = acc[k] ?? { label: k, gb: 0, count: 0 };
      acc[k].gb += t.sizeGB;
      acc[k].count += 1;
      return acc;
    }, {}),
  )
    .filter((s) => s.count > 0)
    .sort((a, b) => b.gb - a.gb);

  const used = bySource.reduce((s, x) => s + x.gb, 0);
  const free = Math.max(capacityGB - used, 0);
  const top = bySource[0];
  const fastest = [...bySource].sort((a, b) => (WEEK_GROWTH[b.label] ?? 0) - (WEEK_GROWTH[a.label] ?? 0))[0];
  const weekTotal = bySource.reduce((s, x) => s + (WEEK_GROWTH[x.label] ?? 0), 0);
  const weeksLeft = weekTotal > 0 ? Math.floor(free / weekTotal) : null;

  return (
    <Vertical gap={spacing.D}>
      <Typography variant="body-normal" color="base" noMargin>
        <b>{top.label}</b> holds {pct(top.gb, used)} of your data
        {fastest.label === top.label ? ' and is growing fastest' : `; ${fastest.label} is growing fastest`} (
        {formatGB(WEEK_GROWTH[fastest.label] ?? 0)} this week).
        {weeksLeft !== null && ` At this rate, storage is full in about ${weeksLeft} weeks.`}
      </Typography>

      <Vertical gap={spacing.A}>
        <div className={styles.bar} role="img" aria-label={`Storage: ${formatGB(used)} used of ${capacityGB} GB`}>
          {bySource.map((s) => (
            <span
              key={s.label}
              className={`${styles.segment} ${hovered && hovered !== s.label ? styles.dim : ''}`}
              style={{ flexGrow: s.gb, background: SOURCE_COLOR[s.label] ?? FALLBACK }}
              tabIndex={0}
              aria-label={`${s.label} ${formatGB(s.gb)}`}
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.label)}
              onBlur={() => setHovered(null)}
            />
          ))}
          <span className={styles.free} style={{ flexGrow: free }} aria-hidden />
        </div>
        <Horizontal justify="space-between">
          <Typography variant="footnote" color={hovered ? 'base' : 'gray-light'} noMargin>
            {hovered
              ? (() => {
                  const h = bySource.find((x) => x.label === hovered)!;
                  return `${h.label}: ${formatGB(h.gb)} · ${pct(h.gb, used)} of used · ${h.count} ${h.count === 1 ? 'table' : 'tables'}`;
                })()
              : `${formatGB(used)} used`}
          </Typography>
          <Typography variant="footnote" color="gray-light" noMargin>
            {capacityGB} GB plan
          </Typography>
        </Horizontal>
      </Vertical>

      <Table
        compact
        className={styles.legendTable}
        rowKey="label"
        data={[
          ...bySource.map((s) => ({
            label: s.label,
            color: SOURCE_COLOR[s.label] ?? FALLBACK,
            size: formatGB(s.gb),
            share: pct(s.gb, used),
            count: String(s.count),
            week: (WEEK_GROWTH[s.label] ?? 0) > 0 ? `+${formatGB(WEEK_GROWTH[s.label])}` : '—',
          })),
          { label: 'Available', color: '', size: formatGB(free), share: '', count: '', week: '' },
        ]}
        columns={[
          {
            key: 'label',
            label: 'Source',
            render: (v, r) => (
              <Horizontal gap={spacing.B}>
                <span
                  className={r.color ? styles.swatch : `${styles.swatch} ${styles.swatchFree}`}
                  style={r.color ? { background: String(r.color) } : undefined}
                  aria-hidden
                />
                <span className={r.color ? undefined : styles.muted}>{String(v)}</span>
              </Horizontal>
            ),
          },
          { key: 'size', label: 'Size', align: 'right' },
          { key: 'share', label: 'Share of used', align: 'right' },
          { key: 'count', label: 'Tables', align: 'right' },
          { key: 'week', label: 'Added this week', align: 'right' },
        ]}
      />
    </Vertical>
  );
};
