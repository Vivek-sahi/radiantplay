import React, { useState } from 'react';
import { Tabs, Button, Link, NoData, Typography, Horizontal, Vertical } from '../../../components';
import type { Tab } from '../../../components';
import { CachingTab } from './CachingTab';
import { spacing } from '../styles';
import type { DataModel } from '../types';

const MODEL_TABS: Tab[] = [
  { id: 'columns', label: 'Columns' },
  { id: 'joins', label: 'Joins' },
  { id: 'data-samples', label: 'Data samples' },
  { id: 'dependents', label: 'Dependents' },
  { id: 'caching', label: 'Caching' },
];

export const ModelView: React.FC<{
  model: DataModel;
  backLabel: string;
  onBack: () => void;
  onChange: (next: DataModel) => void;
}> = ({ model, backLabel, onBack, onChange }) => {
  const [activeTab, setActiveTab] = useState('caching');

  return (
    <Vertical gap={spacing.E} style={{ maxWidth: '1200px' }}>
      <Link href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>
        ← {backLabel}
      </Link>

      {/* Model header */}
      <Horizontal justify="space-between" align="start" style={{ width: '100%' }}>
        <Vertical gap={spacing.B} style={{ maxWidth: '640px' }}>
          <Typography variant="overline" color="gray-light" noMargin>Model</Typography>
          <Typography variant="page-title" color="base" noMargin>{model.name}</Typography>
          <Typography variant="body-normal" color="gray-light" ellipsis={{ rows: 2 }} noMargin>
            {model.description}
          </Typography>
        </Vertical>
        <Horizontal gap={spacing.B} align="center" style={{ flexShrink: 0 }}>
          <Button variant="secondary" size="small">Search on this model</Button>
          <Button variant="secondary" size="small">Edit model</Button>
          <Button variant="tertiary" size="small" icon="more" iconOnly aria-label="More model actions">More</Button>
        </Horizontal>
      </Horizontal>

      <Tabs tabs={MODEL_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div style={{ paddingTop: `${spacing.C}px` }}>
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
