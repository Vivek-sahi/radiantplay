import React, { useState } from 'react';
import { RadianceBackground } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { SpotterPrompt } from '@spotter/chat';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import chip from '@spotter/chat/QuickAction.module.css';
import welcome from '@spotter/page/SpotterWelcome.module.css';
import { NewBadge } from './NewBadge';
import { HomeWidgets } from './HomeWidgets';
import styles from '../WorkbookInThoughtSpot.module.css';

// Home on the Radiance "home" product pattern (ThoughtSpot's AI background), as the product
// ships it. SpotterWelcome isn't used because its blue glow would sit on top of Radiance.
//
// Chip row under the prompt bar (Vivek, 3 Nov): Quick search, App, Liveboard, Workbook.
// Workbook carries a New tag, like "Create apps" in the Apps prototype. The Spotter kit's
// QuickActionRow has no badge slot, so this row draws the same chips with the kit's styles.
// Radiant has no workbook icon; `table` is the nearest.
const ACTIONS: { id: string; label: string; icon: IconName; isNew?: boolean }[] = [
  { id: 'quick-search', label: 'Quick search', icon: 'explore' },
  { id: 'app', label: 'App', icon: 'apps' },
  { id: 'liveboard', label: 'Liveboard', icon: 'liveboard' },
  { id: 'workbook', label: 'Workbook', icon: 'table', isNew: true },
];

export const HomeView: React.FC<{ onStart: (prompt: string) => void }> = ({ onStart }) => {
  const [value, setValue] = useState('');

  const handleAction = (id: string) => {
    if (id === 'workbook') setValue('Create a workbook ');
  };

  return (
    <div className={styles.home}>
      <RadianceBackground pattern="home" heroHeight={360} />
      <Vertical gap={24} align="center" className={styles.homeContent}>
        <h1 className={welcome.greeting}>
          Let’s <span className={welcome.greetingAccent}>make sense</span> of your data together.
        </h1>
        <SpotterPrompt className={styles.homePrompt} value={value} onChange={setValue} onSubmit={(v) => v.trim() && onStart(v.trim())} placeholder="Enter your question" />
        <Horizontal gap={12} justify="center" align="center" wrap>
          {ACTIONS.map((a) => (
            <button key={a.id} type="button" className={chip.quickAction} onClick={() => handleAction(a.id)}>
              <span className={chip.icon}><Icon name={a.icon} size="s" /></span>
              <span>{a.label}</span>
              {a.isNew && <NewBadge />}
            </button>
          ))}
        </Horizontal>
        <HomeWidgets />
      </Vertical>
    </div>
  );
};

export default HomeView;
