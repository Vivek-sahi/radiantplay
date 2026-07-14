import React, { useState } from 'react';
import { Tabs, Button, NoData, Typography, Horizontal, Vertical } from '@/components';
import type { Tab } from '@/components';
import { CachingTab } from './CachingTab';
import { spacing } from '../styles';
import styles from './ModelView.module.css';
import type { DataModel } from '../types';

const MODEL_TABS: Tab[] = [
  { id: 'columns', label: 'Columns' },
  { id: 'joins', label: 'Joins' },
  { id: 'data-samples', label: 'Data samples' },
  { id: 'dependents', label: 'Dependents' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'caching', label: 'Caching' },
];

export const ModelView: React.FC<{
  model: DataModel;
  onChange: (next: DataModel) => void;
}> = ({ model, onChange }) => {
  const [activeTab, setActiveTab] = useState('caching');

  return (
    <Vertical gap={spacing.E} className={styles.page}>
      {/* Model header */}
      <Horizontal justify="space-between" align="start" className={styles.headerRow}>
        <Vertical gap={spacing.B} className={styles.headerText}>
          <Typography variant="overline" color="gray-light" noMargin>Model</Typography>
          <Typography variant="page-title" color="base" noMargin>{model.name}</Typography>
          <Typography variant="body-normal" color="gray-light" ellipsis={{ rows: 2 }} noMargin>
            {model.description}
          </Typography>
        </Vertical>
        <Horizontal gap={spacing.B} align="center" className={styles.headerActions}>
          <Button variant="secondary" size="small">Search on this model</Button>
          <Button variant="secondary" size="small">Edit model</Button>
          <Button variant="tertiary" size="small" icon="more" iconOnly aria-label="More model actions">More</Button>
        </Horizontal>
      </Horizontal>

      <Tabs tabs={MODEL_TABS} activeTab={activeTab} onTabChange={setActiveTab} className={styles.transparentTabs} />

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'caching' ? (
          <CachingTab model={model} onChange={onChange} />
        ) : (
          <NoData
            title="Not part of this prototype"
            description="This tab is shown for context. The Agent DB prototype focuses on the Caching tab."
          />
        )}
      </div>
    </Vertical>
  );
};
