import React, { useMemo, useState } from 'react';
import { Horizontal, Select, Table, Tooltip, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { QueryRecord } from '../types';
import { formatMs, formatUSD, KIND_LABEL, QUERIES } from '../data';
import { PageHeader, Panel, StatTile, StatusPill } from './primitives';
import { queriesFor, useVariant } from '../variant';
import styles from './pages.module.css';

const WHO_FILTER = [
  { id: 'all', label: 'Everyone' },
  { id: 'system', label: 'ThoughtSpot' },
  { id: 'agent', label: 'Agents' },
  { id: 'app', label: 'Apps' },
  { id: 'pipeline', label: 'Pipelines' },
  { id: 'person', label: 'People' },
];

const STATUS_FILTER = [
  { id: 'all', label: 'All statuses' },
  { id: 'Success', label: 'Success' },
  { id: 'Error', label: 'Error' },
  { id: 'Stopped', label: 'Stopped' },
];

export const ActivityPage: React.FC = () => {
  const [who, setWho] = useState('all');
  const [status, setStatus] = useState('all');
  const variant = useVariant();
  const queries = queriesFor(variant, QUERIES);
  const whoOptions = variant === 'v1' ? WHO_FILTER : WHO_FILTER.filter((o) => o.id !== 'system');

  const rows = useMemo(
    () => queries.filter((q) => (who === 'all' || q.kind === who) && (status === 'all' || q.status === status)),
    [queries, who, status],
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Activity" subtitle="Every query, and who or what ran it." />

      <div className={styles.tiles}>
        <StatTile label="Queries, last 24 hours" value="48.2K" note={variant === 'v1' ? '61% from ThoughtSpot, 27% from agents' : '61% from thoughtspot, 27% from agents'} />
        <StatTile label="Median response" value="180 ms" note="95% answered under 1.2 s" />
        <StatTile label="Stopped by a limit" value="312" note="All from churn-analyst" />
        <StatTile label="Errors" value="46" note="Mostly permission errors" />
      </div>

      <Panel title="Recent queries" flush>
        <Horizontal gap={spacing.C} className={styles.filters}>
          <Select size="basic" options={whoOptions} value={who} onChange={(v) => setWho(v)} />
          <Select size="basic" options={STATUS_FILTER} value={status} onChange={(v) => setStatus(v)} />
        </Horizontal>
        <Table
          compact
          rowKey="id"
          data={rows as unknown as Record<string, unknown>[]}
          emptyMessage="No queries match these filters"
          columns={[
            { key: 'time', label: 'Time', width: '96px', render: (v) => <span className={styles.num}>{String(v)}</span> },
            {
              key: 'who',
              label: 'Run by',
              render: (_v, r) => {
                const q = r as unknown as QueryRecord;
                return (
                  <Vertical gap={0}>
                    {q.kind === 'person' ? (
                      <Typography variant="body-normal" color="base" noMargin>{q.who}</Typography>
                    ) : (
                      <code className={styles.mono}>{q.who}</code>
                    )}
                    <Typography variant="footnote" color="gray-light" noMargin>{KIND_LABEL[q.kind]}</Typography>
                  </Vertical>
                );
              },
            },
            { key: 'summary', label: 'Query' },
            { key: 'durationMs', label: 'Time taken', align: 'right', render: (v) => formatMs(v as number) },
            { key: 'scanned', label: 'Data read', align: 'right' },
            { key: 'cost', label: 'Cost', align: 'right', render: (v) => ((v as number) < 0.01 ? '< $0.01' : formatUSD(v as number)) },
            {
              key: 'status',
              label: 'Status',
              render: (_v, r) => {
                const q = r as unknown as QueryRecord;
                const pill = (
                  <span>
                    <StatusPill kind={q.status === 'Success' ? 'success' : q.status === 'Error' ? 'failure' : 'warning'} label={q.status} />
                  </span>
                );
                return q.note ? <Tooltip content={q.note}>{pill}</Tooltip> : pill;
              },
            },
          ]}
        />
      </Panel>
    </Vertical>
  );
};
