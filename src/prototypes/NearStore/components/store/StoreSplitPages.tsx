/**
 * The split proposal: Model Cache and Data Store as separate nav items under one
 * section header, each with its own metrics.
 *
 * The argument for it is persona — a cache owner and a store owner do different
 * jobs and each only needs their own half. The nav header carries the conceptual
 * unity so nothing has to share a page.
 *
 * See the warning in `StoreMetrics`: separate metrics are honest only if the two
 * halves have separate quotas.
 */
import React from 'react';
import { Typography, Vertical } from '@/components';
import type { StoreTable } from './storeTypes';
import type { DataModel } from '../../types';
import { StoreCachedModels } from './StoreCachedModels';
import { StoreExternalTables } from './StoreExternalTables';
import { StoreMetrics } from './StoreMetrics';
import { spacing } from '../../styles';
import { capacity } from '../../data';
import { formatCompact } from '../../utils';
import styles from './store.module.css';

const isLive = (m: DataModel) => m.cache && m.cache.status !== 'purged' && m.cache.status !== 'not_cached';

export const ModelCachePage: React.FC<{
  models: DataModel[];
  onOpenModel: (id: string) => void;
}> = ({ models, onOpenModel }) => {
  const cached = models.filter(isLive);
  const usedGB = cached.reduce((n, m) => n + m.cache!.cacheSizeMB, 0) / 1024;
  const rows = cached.reduce((n, m) => n + m.cache!.rowCount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.headText}>
        <Typography variant="page-title" noMargin>Model Cache</Typography>
      </div>
      <StoreMetrics
        usedGB={usedGB}
        totalGB={capacity.purchasedGB}
        countLabel="Models"
        countValue={String(cached.length)}
        rows={formatCompact(rows)}
      />
      <Vertical gap={spacing.D}>
        <StoreCachedModels models={models} onOpenModel={onOpenModel} />
      </Vertical>
    </div>
  );
};

export const DataStorePage: React.FC<{ tables: StoreTable[] }> = ({ tables }) => {
  const usedGB = tables.reduce((n, t) => n + t.sizeMB, 0) / 1024;
  const rows = tables.reduce((n, t) => n + t.rows, 0);

  return (
    <div className={styles.page}>
      <div className={styles.headText}>
        <Typography variant="page-title" noMargin>Data Store</Typography>
      </div>
      <StoreMetrics
        usedGB={usedGB}
        totalGB={capacity.purchasedGB}
        countLabel="Tables"
        countValue={String(tables.length)}
        rows={formatCompact(rows)}
      />
      <Vertical gap={spacing.D}>
        <StoreExternalTables tables={tables} />
      </Vertical>
    </div>
  );
};
