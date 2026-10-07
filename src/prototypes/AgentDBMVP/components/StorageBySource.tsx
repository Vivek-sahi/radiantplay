import React, { useState } from 'react';
import { Horizontal, Table, Typography, Vertical } from '@/components';
import { referenceColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { StoreTable } from '../types';
import { formatGB, formatRows } from '../data';
import styles from './storage.module.css';

/**
 * Colour follows the source, never its rank. Radiant chart palette, snapped to the nearest
 * passing steps (validated 28 Sep: brand-60, orange-70, purple-60, green-70). ThoughtSpot left
 * the chart on 7 Oct (it reads, it doesn't write); Airbyte took its colour.
 */
const SOURCE_COLOR: Record<string, string> = {
  Airbyte: referenceColors.brand['60'],
  Airflow: referenceColors.orange['70'],
  Fivetran: referenceColors.purple['60'],
  'dbt Cloud': referenceColors.green['70'],
};
const FALLBACK = referenceColors.gray['60'];

const pct = (part: number, whole: number) => {
  const p = (part / whole) * 100;
  return p > 0 && p < 1 ? '<1%' : `${Math.round(p)}%`;
};

/** What is stored, by who wrote it. No forecast: AgentDB doesn't predict (7 Oct). */
export const StorageBySource: React.FC<{ tables: StoreTable[]; capacityGB: number }> = ({ tables, capacityGB }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const bySource = Object.values(
    tables.reduce<Record<string, { label: string; gb: number; count: number; queries: number }>>((acc, t) => {
      const k = t.writer.label;
      acc[k] = acc[k] ?? { label: k, gb: 0, count: 0, queries: 0 };
      acc[k].gb += t.sizeGB;
      acc[k].count += 1;
      acc[k].queries += t.queries24h;
      return acc;
    }, {}),
  )
    .filter((s) => s.count > 0)
    .sort((a, b) => b.gb - a.gb);

  const used = bySource.reduce((s, x) => s + x.gb, 0);
  const free = Math.max(capacityGB - used, 0);

  return (
    <Vertical gap={spacing.D}>
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
            count: String(s.count),
            queries: s.queries ? formatRows(s.queries) : '—',
          })),
        ]}
        columns={[
          {
            key: 'label',
            label: 'Source',
            render: (v, r) => (
              <Horizontal gap={spacing.B}>
                <span className={styles.swatch} style={{ background: String(r.color) }} aria-hidden />
                <span>{String(v)}</span>
              </Horizontal>
            ),
          },
          { key: 'size', label: 'Size', align: 'right' },
          { key: 'count', label: 'Tables', align: 'right' },
          { key: 'queries', label: 'Queries, 24 h', align: 'right' },
        ]}
      />
    </Vertical>
  );
};
