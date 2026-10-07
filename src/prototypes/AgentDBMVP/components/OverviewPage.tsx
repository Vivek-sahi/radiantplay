import React from 'react';
import { ProgressBar, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable } from '../types';
import { formatGB, PLAN, QUERY_STATS } from '../data';
import { PageHeader, Panel, StatTile } from './primitives';
import { StorageBySource } from './StorageBySource';
import styles from './pages.module.css';

/**
 * Overview (7 Oct): what used to be "Usage and billing", renamed once the money left it.
 * Storage, queries, tables, and storage by source. No plan panel, no forecast, no connections (7 Oct review).
 */
export const OverviewPage: React.FC<{ tables: StoreTable[] }> = ({ tables }) => {
  const loaded = tables.filter((t) => !t.empty);
  const used = loaded.reduce((s, t) => s + t.sizeGB, 0);
  const sources = new Set(loaded.map((t) => t.writer.label)).size;

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Overview" />

      <div className={styles.tiles}>
        <StatTile label="Storage" value={formatGB(used)} note={`of ${PLAN.includedGB} GB · ${formatGB(PLAN.includedGB - used)} left`}>
          <ProgressBar value={used} max={PLAN.includedGB} size="small" />
        </StatTile>
        <StatTile label="Queries" value={QUERY_STATS.total24h} note="Last 24 hours" />
        <StatTile label="Tables" value={String(tables.length)} note={`From ${sources} ${sources === 1 ? 'source' : 'sources'}`} />
      </div>

      <Panel title="Storage by source">
        <StorageBySource tables={loaded} capacityGB={PLAN.includedGB} />
      </Panel>
    </Vertical>
  );
};
