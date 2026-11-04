import React, { useState } from 'react';
import { Tabs, Button, NoData, Typography, Horizontal, Vertical } from '@/components';
import type { Tab } from '@/components';
import { CachingTab } from './CachingTab';
import type { HookBoxStyle } from './HookBoxes';
import type { HeroStyle, HookLayout, HookBackground, AnimationStyle, IconStyle } from './CachingHook';
import { spacing } from '../styles';
import styles from './ModelView.module.css';
import type { DataModel, Plan } from '../types';

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
  plan: Plan;
  /** Caching enabled on the cluster. Off: the CTA is disabled and a notice says who to contact. */
  enabled: boolean;
  onLearnMore: () => void;
  /** Open the Caching Settings modal straight away (arriving from "Cache Model" on the Data Cache page). */
  autoOpenSettings?: boolean;
  boxStyle: HookBoxStyle;
  hero: HeroStyle;
  animation: AnimationStyle;
  icon: IconStyle;
  layout: HookLayout;
  background: HookBackground;
}> = ({ model, onChange, plan, enabled, onLearnMore, autoOpenSettings, boxStyle, hero, animation, icon, layout, background }) => {
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
          <Button variant="secondary">Search on this model</Button>
          <Button variant="secondary">Edit model</Button>
          <Button variant="tertiary" icon="more" iconOnly aria-label="More model actions">More</Button>
        </Horizontal>
      </Horizontal>

      <Tabs tabs={MODEL_TABS} activeTab={activeTab} onTabChange={setActiveTab} className={styles.transparentTabs} />

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'caching' ? (
          <CachingTab model={model} onChange={onChange} plan={plan} enabled={enabled} onLearnMore={onLearnMore} autoOpenSettings={autoOpenSettings} boxStyle={boxStyle} hero={hero} animation={animation} icon={icon} layout={layout} background={background} />
        ) : (
          <NoData
            title="Not part of this prototype"
            description="This tab is shown for context. The prototype focuses on the Caching tab."
          />
        )}
      </div>
    </Vertical>
  );
};
