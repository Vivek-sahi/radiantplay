import React from 'react';
import { Button, Horizontal, ProgressBar, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { formatGB, formatUSD, KIND_LABEL, PLAN, SERVICE_ACCOUNTS, SPEND, storageByWriter, TABLES } from '../data';
import { KeyValue, PageHeader, Panel, StatTile } from './primitives';
import { accountsFor, tablesFor, useVariant } from '../variant';
import styles from './pages.module.css';

export const UsagePage: React.FC<{ toast: (m: string) => void }> = ({ toast }) => {
  const variant = useVariant();
  const byWriter = storageByWriter(TABLES);
  const byLabel = Object.entries(
    tablesFor(variant, TABLES).reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.writer.label]: (acc[t.writer.label] ?? 0) + t.sizeGB }), {}),
  ).sort((a, b) => b[1] - a[1]);
  const used = byWriter.pulse + byWriter.pipeline + byWriter.upload;
  const total = SPEND.storage + SPEND.compute;
  const compute = [...accountsFor(variant, SERVICE_ACCOUNTS)].sort((a, b) => b.spent - a.spent);
  const maxSpend = compute[0]?.spent ?? 1;

  return (
    <Vertical gap={spacing.F}>
      <PageHeader
        title="Usage and billing"
        subtitle="September 2026, month to date."
        actions={
          <Button variant="secondary" onClick={() => toast('Request sent to your ThoughtSpot account team')}>
            Request more storage
          </Button>
        }
      />

      <div className={styles.tiles}>
        <StatTile label="Spend this month" value={formatUSD(total)} note={`Last month ${formatUSD(SPEND.lastMonth)}`} />
        <StatTile label="Storage" value={formatUSD(SPEND.storage)} note={`${formatGB(used)} stored`} />
        <StatTile label="Compute" value={formatUSD(SPEND.compute)} note="Charged for the time queries run" />
        {variant === 'v1' ? (
          <StatTile
            label="Warehouse spend avoided"
            value={formatUSD(SPEND.warehouseAvoided)}
            note="Estimate: Pulse queries answered here instead of in Snowflake"
          />
        ) : (
          <StatTile label="Data read this month" value="38.6 TB" note="Across all service accounts" />
        )}
      </div>

      <div className={styles.twoCol}>
        <Panel title="Plan">
          <Vertical gap={spacing.C}>
            <KeyValue label="Plan">{PLAN.name}</KeyValue>
            <KeyValue label="Storage included">{PLAN.includedGB} GB</KeyValue>
            <KeyValue label="Used">
              <Vertical gap={spacing.A}>
                <span>
                  {formatGB(used)} of {PLAN.includedGB} GB
                </span>
                <ProgressBar value={used} max={PLAN.includedGB} size="small" />
              </Vertical>
            </KeyValue>
            <KeyValue label="Billed through">Your ThoughtSpot contract</KeyValue>
            <KeyValue label="When storage is full">
              {variant === 'v1'
                ? 'New data is refused; Pulse refreshes and pipeline writes fail until space is freed. Queries keep working.'
                : 'New data is refused and writes fail until space is freed. Queries keep working.'}
            </KeyValue>
          </Vertical>
        </Panel>

        <Panel title="Storage by source">
          {variant === 'v2' ? (
            <Vertical gap={spacing.C}>
              {byLabel.map(([label, gb]) => (
                <KeyValue key={label} label={label}>{formatGB(gb)}</KeyValue>
              ))}
            </Vertical>
          ) : (
          <Vertical gap={spacing.C}>
            <KeyValue label="Pulse (cached models)">{formatGB(byWriter.pulse)}</KeyValue>
            <KeyValue label="Pipelines">{formatGB(byWriter.pipeline)}</KeyValue>
            <KeyValue label="File uploads">{formatGB(byWriter.upload)}</KeyValue>
            <Typography variant="footnote" color="gray-light" noMargin>
              Pulse storage is included in your AgentDB bill. Removing a cached model frees its space; ThoughtSpot can rebuild it
              from your warehouse.
            </Typography>
          </Vertical>
          )}
        </Panel>
      </div>

      <Panel title="Compute by service account" flush>
        <Table
          compact
          rowKey="id"
          data={compute as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', label: 'Name', render: (v) => <code className={styles.mono}>{String(v)}</code> },
            { key: 'kind', label: 'Type', render: (v) => KIND_LABEL[v as keyof typeof KIND_LABEL] },
            {
              key: 'spent',
              label: 'Share',
              width: '32%',
              render: (v) => (
                <div className={styles.barCell}>
                  <ProgressBar value={v as number} max={maxSpend} size="small" />
                </div>
              ),
            },
            {
              key: 'budget',
              label: 'Spend / budget',
              align: 'right',
              render: (_v, r) => {
                const a = r as unknown as (typeof SERVICE_ACCOUNTS)[number];
                return (
                  <Horizontal gap={spacing.A} justify="end">
                    <span className={styles.num}>{formatUSD(a.spent)}</span>
                    <Typography variant="footnote" color="gray-light" noMargin>
                      {a.budget ? `of ${formatUSD(a.budget)}` : 'no limit'}
                    </Typography>
                  </Horizontal>
                );
              },
            },
          ]}
        />
      </Panel>
    </Vertical>
  );
};
