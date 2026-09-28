import React, { useState } from 'react';
import { Button, Horizontal, Icon, ProgressBar, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Page } from '../types';
import { formatGB, formatUSD, PLAN, SERVICE_ACCOUNTS, SPEND, storageByWriter, TABLES, KIND_LABEL } from '../data';
import { accountsFor, tablesFor, useVariant } from '../variant';
import { PageHeader, Panel, StatTile, StatusPill, Swatch } from './primitives';
import styles from './pages.module.css';

export const OverviewPage: React.FC<{ onNavigate: (p: Page) => void; onOpenTable: (id: string) => void }> = ({
  onNavigate,
  onOpenTable,
}) => {
  const [welcome, setWelcome] = useState(true);
  const variant = useVariant();
  const tables = tablesFor(variant, TABLES);
  const accounts = accountsFor(variant, SERVICE_ACCOUNTS);
  const byWriter = storageByWriter(TABLES);
  // v2: storage grouped by whoever wrote it — ThoughtSpot is one writer among several.
  const byLabel = Object.entries(
    tables.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.writer.label]: (acc[t.writer.label] ?? 0) + t.sizeGB }), {}),
  ).sort((a, b) => b[1] - a[1]);
  const used = byWriter.pulse + byWriter.pipeline + byWriter.upload;
  const pulseTables = TABLES.filter((t) => t.writer.kind === 'pulse');
  const pulseModels = new Set(pulseTables.map((t) => t.writer.detail)).size;
  const late = tables.filter((t) => t.late);
  const nearBudget = accounts.filter((a) => a.budget && a.spent / a.budget >= 0.9);
  const topReaders = [...accounts].sort((a, b) => b.spent - a.spent).slice(0, 5);
  const spend = SPEND.storage + SPEND.compute;

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Overview" subtitle="Everything in your AgentDB, at a glance." />

      {variant === 'v1' && welcome && (
        <div className={styles.welcome}>
          <Horizontal gap={spacing.D} align="start" justify="space-between">
            <Horizontal gap={spacing.C} align="start">
              <span className={styles.welcomeIcon}>
                <Icon name="info-circle" size="l" aria-hidden />
              </span>
              <Vertical gap={spacing.A}>
                <Typography variant="content-label" color="base" noMargin>
                  Your AgentDB was set up when you turned on Pulse in ThoughtSpot
                </Typography>
                <Typography variant="body-normal" color="gray-light" noMargin>
                  {pulseModels} cached models ({formatGB(byWriter.pulse)}) are stored here and count toward your
                  storage. You can also load your own data and connect other tools and agents.
                </Typography>
                <Horizontal gap={spacing.B} className={styles.welcomeActions}>
                  <Button variant="secondary" size="small" onClick={() => onNavigate('data')}>
                    See your data
                  </Button>
                  <Button variant="tertiary" size="small" onClick={() => onNavigate('connect')}>
                    Connect a pipeline or agent
                  </Button>
                </Horizontal>
              </Vertical>
            </Horizontal>
            <Button variant="tertiary" size="small" icon="cross" iconOnly aria-label="Dismiss" onClick={() => setWelcome(false)}>
              Dismiss
            </Button>
          </Horizontal>
        </div>
      )}

      <div className={styles.tiles}>
        <StatTile label="Storage" value={formatGB(used)} note={`of ${PLAN.includedGB} GB · ${formatGB(PLAN.includedGB - used)} left`}>
          <ProgressBar value={used} max={PLAN.includedGB} size="small" />
        </StatTile>
        <StatTile label="Spend this month" value={formatUSD(spend)} note={`Last month ${formatUSD(SPEND.lastMonth)}`} />
        <StatTile label="Queries, last 24 hours" value="48.2K" note="Median response 180 ms" />
        <StatTile label="Tables" value={String(TABLES.length)} note={variant === 'v1' ? `${pulseTables.length} managed by Pulse` : `Written by ${byLabel.length} sources`} />
      </div>

      <div className={styles.twoCol}>
        <Panel title="Needs attention">
          <Vertical gap={spacing.C}>
            {late.map((t) => (
              <div key={t.id} className={styles.alertRow}>
                <StatusPill kind="warning" label="Late" />
                <Vertical gap={spacing.A} className={styles.grow}>
                  <Typography variant="body-normal" color="base" noMargin>
                    Nothing has arrived in {t.database}.{t.name} for {t.late!.since}
                  </Typography>
                  <Typography variant="footnote" color="gray-light" noMargin>
                    It usually updates {t.late!.usual}. Check the {t.writer.label} job that writes it.
                  </Typography>
                </Vertical>
                <Button variant="tertiary" size="small" onClick={() => onOpenTable(t.id)}>
                  View table
                </Button>
              </div>
            ))}
            {nearBudget.map((a) => (
              <div key={a.id} className={styles.alertRow}>
                <StatusPill kind="warning" label="Budget" />
                <Vertical gap={spacing.A} className={styles.grow}>
                  <Typography variant="body-normal" color="base" noMargin>
                    {a.name} has used {formatUSD(a.spent)} of its {formatUSD(a.budget!)} monthly budget
                  </Typography>
                  <Typography variant="footnote" color="gray-light" noMargin>
                    Its queries will be refused once it reaches the limit.
                  </Typography>
                </Vertical>
                <Button variant="tertiary" size="small" onClick={() => onNavigate('access')}>
                  Review
                </Button>
              </div>
            ))}
            <div className={styles.alertRow}>
              <StatusPill kind="info" label="Storage" />
              <Vertical gap={spacing.A} className={styles.grow}>
                <Typography variant="body-normal" color="base" noMargin>
                  At the current rate you&apos;ll reach {PLAN.includedGB} GB in about 7 weeks
                </Typography>
                <Typography variant="footnote" color="gray-light" noMargin>
                  events.app_events is growing fastest (about 4 GB a day).
                </Typography>
              </Vertical>
              <Button variant="tertiary" size="small" onClick={() => onNavigate('usage')}>
                See usage
              </Button>
            </div>
          </Vertical>
        </Panel>

        <Panel title="Storage by source">
          {variant === 'v2' ? (
            <Vertical gap={spacing.C}>
              <ProgressBar value={used} max={PLAN.includedGB} size="small" />
              {byLabel.map(([label, gb]) => (
                <Horizontal key={label} justify="space-between">
                  <Typography variant="body-normal" color="base" noMargin>
                    {label}
                  </Typography>
                  <Typography variant="body-normal" color="base" noMargin className={styles.num}>
                    {formatGB(gb)}
                  </Typography>
                </Horizontal>
              ))}
              <Horizontal justify="space-between">
                <Typography variant="body-normal" color="gray-light" noMargin>
                  Available
                </Typography>
                <Typography variant="body-normal" color="gray-light" noMargin className={styles.num}>
                  {formatGB(PLAN.includedGB - used)}
                </Typography>
              </Horizontal>
            </Vertical>
          ) : (
          <Vertical gap={spacing.C}>
            <div className={styles.stackBar} role="img" aria-label="Storage split by source">
              <span className={styles.segPulse} style={{ width: `${(byWriter.pulse / PLAN.includedGB) * 100}%` }} />
              <span className={styles.segPipeline} style={{ width: `${(byWriter.pipeline / PLAN.includedGB) * 100}%` }} />
              <span className={styles.segUpload} style={{ width: `${Math.max((byWriter.upload / PLAN.includedGB) * 100, 0.6)}%` }} />
            </div>
            {(
              [
                ['pulse', 'Pulse (cached models)', byWriter.pulse, 'Rebuilt from your warehouse if removed'],
                ['pipeline', 'Pipelines', byWriter.pipeline, 'The only copy, written by your tools'],
                ['upload', 'File uploads', byWriter.upload, 'The only copy'],
                ['free', 'Available', PLAN.includedGB - used, ''],
              ] as const
            ).map(([kind, label, gb, note]) => (
              <Horizontal key={kind} gap={spacing.C} align="start" justify="space-between">
                <Horizontal gap={spacing.B} align="center">
                  <Swatch kind={kind} />
                  <Vertical gap={0}>
                    <Typography variant="body-normal" color="base" noMargin>
                      {label}
                    </Typography>
                    {note && (
                      <Typography variant="footnote" color="gray-light" noMargin>
                        {note}
                      </Typography>
                    )}
                  </Vertical>
                </Horizontal>
                <Typography variant="body-normal" color="base" noMargin className={styles.num}>
                  {formatGB(gb)}
                </Typography>
              </Horizontal>
            ))}
          </Vertical>
          )}
        </Panel>
      </div>

      <Panel title="Top consumers this month" actions={<Button variant="tertiary" size="small" onClick={() => onNavigate('activity')}>View activity</Button>} flush>
        <Table
          compact
          rowKey="id"
          data={topReaders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', label: 'Name', render: (v) => <code className={styles.mono}>{String(v)}</code> },
            { key: 'kind', label: 'Type', render: (v) => KIND_LABEL[v as keyof typeof KIND_LABEL] },
            { key: 'lastUsed', label: 'Last used' },
            { key: 'spent', label: 'Spend', align: 'right', render: (v) => formatUSD(v as number) },
          ]}
        />
      </Panel>
    </Vertical>
  );
};
