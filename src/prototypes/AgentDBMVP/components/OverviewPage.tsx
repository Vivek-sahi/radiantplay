import React, { useState } from 'react';
import { Button, Horizontal, Icon, ProgressBar, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Page } from '../types';
import { formatGB, formatUSD, PLAN, SERVICE_ACCOUNTS, SPEND, storageByWriter, TABLES } from '../data';
import { accountsFor, tablesFor, useVariant } from '../variant';
import { PageHeader, Panel, StatTile, StatusPill } from './primitives';
import { StorageBySource } from './StorageBySource';
import styles from './pages.module.css';

type Severity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  since: string;
  action: { label: string; go: () => void };
}

const SEVERITY: Record<Severity, { label: string; pill: 'failure' | 'warning' | 'info'; icon: 'exclamation-point-circle' | 'info-circle' }> = {
  critical: { label: 'Critical', pill: 'failure', icon: 'exclamation-point-circle' },
  warning: { label: 'Warning', pill: 'warning', icon: 'exclamation-point-circle' },
  info: { label: 'Info', pill: 'info', icon: 'info-circle' },
};
const ORDER: Severity[] = ['critical', 'warning', 'info'];

export const OverviewPage: React.FC<{ onNavigate: (p: Page) => void; onOpenTable: (id: string) => void }> = ({
  onNavigate,
  onOpenTable,
}) => {
  const [welcome, setWelcome] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const variant = useVariant();
  const tables = tablesFor(variant, TABLES);
  const accounts = accountsFor(variant, SERVICE_ACCOUNTS);
  const byWriter = storageByWriter(TABLES);
  const used = tables.reduce((s, t) => s + t.sizeGB, 0);
  const pulseTables = TABLES.filter((t) => t.writer.kind === 'pulse');
  const pulseModels = new Set(pulseTables.map((t) => t.writer.detail)).size;
  const sources = new Set(tables.map((t) => t.writer.label)).size;
  const spend = SPEND.storage + SPEND.compute;

  // Every alert is something AgentDB can see for itself: arrivals, metering, refusals, growth.
  const alerts: Alert[] = [
    ...tables
      .filter((t) => t.late)
      .map<Alert>((t) => ({
        id: `late-${t.id}`,
        severity: 'critical',
        title: `No new data in ${t.database}.${t.name} for ${t.late!.since}`,
        detail: `It usually updates ${t.late!.usual}. AgentDB can't see why. Check the ${t.writer.label} job that writes it.`,
        since: 'Since yesterday, 09:14',
        action: { label: 'View table', go: () => onOpenTable(t.id) },
      })),
    ...accounts
      .filter((a) => a.budget && a.spent / a.budget >= 0.9)
      .map<Alert>((a) => ({
        id: `budget-${a.id}`,
        severity: 'warning',
        title: `${a.name} has used ${Math.round((a.spent / a.budget!) * 100)}% of its monthly budget`,
        detail: `${formatUSD(a.spent)} of ${formatUSD(a.budget!)}. Its queries will be refused when it reaches the limit.`,
        since: 'Today, 10:41',
        action: { label: 'Review account', go: () => onNavigate('access') },
      })),
    {
      id: 'perm-support-copilot',
      severity: 'warning',
      title: 'support-copilot was refused 46 times in the last 24 hours',
      detail: 'It keeps trying to read stripe.charges, which it has no access to. Grant access, or check what the agent is asking for.',
      since: 'Today, 08:02',
      action: { label: 'Review account', go: () => onNavigate('access') },
    },
    {
      id: 'storage-projection',
      severity: 'info',
      title: 'Storage will be full in about 6 weeks',
      detail: `${formatGB(used)} of ${PLAN.includedGB} GB used, growing about 32 GB a week, mostly events.app_events.`,
      since: 'Today',
      action: { label: 'See usage', go: () => onNavigate('usage') },
    },
  ];
  const open = alerts
    .filter((a) => !dismissed.includes(a.id))
    .sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));

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
                  {pulseModels} cached models ({formatGB(byWriter.pulse)}) are stored here and count toward your storage.
                </Typography>
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
        <StatTile label="Tables" value={String(tables.length)} note={`Written by ${sources} sources`} />
      </div>

      <Panel
        title="Alerts"
        actions={
          open.length > 0 ? (
            <StatusPill kind={open.some((a) => a.severity === 'critical') ? 'failure' : 'warning'} label={`${open.length} open`} />
          ) : undefined
        }
      >
        {open.length === 0 ? (
          <Horizontal gap={spacing.B}>
            <Icon name="checkmark-circle" size="m" aria-hidden />
            <Typography variant="body-normal" color="gray-light" noMargin>
              No open alerts.
            </Typography>
          </Horizontal>
        ) : (
          <Vertical gap={spacing.C}>
            {open.map((a) => (
              <div key={a.id} className={`${styles.alert} ${styles[`alert_${a.severity}`]}`}>
                <span className={`${styles.alertIcon} ${styles[`alertIcon_${a.severity}`]}`}>
                  <Icon name={SEVERITY[a.severity].icon} size="l" aria-hidden />
                </span>
                <Vertical gap={spacing.A} className={styles.grow}>
                  <Horizontal gap={spacing.B} wrap>
                    <StatusPill kind={SEVERITY[a.severity].pill} label={SEVERITY[a.severity].label} />
                    <Typography variant="content-label" color="base" noMargin>
                      {a.title}
                    </Typography>
                  </Horizontal>
                  <Typography variant="body-normal" color="gray-light" noMargin>
                    {a.detail}
                  </Typography>
                  <Typography variant="footnote" color="gray-light" noMargin>
                    {a.since}
                  </Typography>
                </Vertical>
                <Horizontal gap={spacing.B} align="center">
                  <Button variant="secondary" size="small" onClick={a.action.go}>
                    {a.action.label}
                  </Button>
                  <Button
                    variant="tertiary"
                    size="small"
                    icon="cross"
                    iconOnly
                    aria-label={`Dismiss: ${a.title}`}
                    onClick={() => setDismissed((d) => [...d, a.id])}
                  >
                    Dismiss
                  </Button>
                </Horizontal>
              </div>
            ))}
            <Typography variant="footnote" color="gray-light" noMargin>
              Admins also get critical alerts by email.
            </Typography>
          </Vertical>
        )}
      </Panel>

      <Panel title="Storage by source">
        <StorageBySource tables={tables} capacityGB={PLAN.includedGB} />
      </Panel>
    </Vertical>
  );
};
