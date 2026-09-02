/**
 * The AgentDB page — phase 2's single nav entry.
 *
 * Monitoring only, no CTAs. The customer's own ETL platform writes tables here,
 * and ThoughtSpot caches models here; ThoughtSpot itself loads nothing. Capacity
 * sits above the tabs deliberately — the summary is the unified view of one
 * store, and the tabs are how you inspect each half.
 *
 * Two tabs rather than one list because the halves need different columns: a
 * cached model has a status and a schedule we own, an external table has only
 * what we can observe. A filter would force a lowest common denominator.
 */
import React, { useState } from 'react';
import { Typography, Vertical, Tabs } from '@/components';
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

export const StoreView: React.FC<{
  tables: StoreTable[];
  models: DataModel[];
  onOpenModel: (id: string) => void;
}> = ({ tables, models, onOpenModel }) => {
  const [tab, setTab] = useState('models');

  const cached = models.filter(isLive);
  const externalGB = tables.reduce((n, t) => n + t.sizeMB, 0) / 1024;
  const cachedGB = cached.reduce((n, m) => n + m.cache!.cacheSizeMB, 0) / 1024;
  const totalGB = capacity.purchasedGB;
  const usedGB = externalGB + cachedGB;
  const totalRows =
    tables.reduce((n, t) => n + t.rows, 0) + cached.reduce((n, m) => n + m.cache!.rowCount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.headText}>
        <Typography variant="page-title" noMargin>AgentDB</Typography>
      </div>

      <StoreMetrics
        usedGB={usedGB}
        totalGB={totalGB}
        splits={[
          { label: 'Model Cache', gb: cachedGB },
          { label: 'Data Store', gb: externalGB },
        ]}
        countLabel="Tables"
        countValue={String(tables.length + cached.length)}
        countSub={`${cached.length} model caches · ${tables.length} data store tables`}
        rows={formatCompact(totalRows)}
      />

      <Vertical gap={spacing.D}>
        <Tabs
          tabs={[
            { id: 'models', label: `Model Cache (${cached.length})` },
            { id: 'external', label: `Data Store (${tables.length})` },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
        {tab === 'models'
          ? <StoreCachedModels models={models} onOpenModel={onOpenModel} />
          : <StoreExternalTables tables={tables} />}
      </Vertical>
    </div>
  );
};
