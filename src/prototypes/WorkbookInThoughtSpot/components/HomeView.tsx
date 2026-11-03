import React, { useState } from 'react';
import { SpotterWelcome } from '@spotter/page';
import { Horizontal } from '@components/Layout';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import chip from '@spotter/chat/QuickAction.module.css';
import { NewBadge } from './NewBadge';

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

export const HomeView: React.FC = () => {
  const [value, setValue] = useState('');

  const handleAction = (id: string) => {
    if (id === 'workbook') setValue('Create a workbook ');
  };

  return (
    <SpotterWelcome
      promptProps={{ value, onChange: setValue, placeholder: 'Enter your question' }}
      quickActions={
        <Horizontal gap={12} justify="center" align="center" wrap>
          {ACTIONS.map((a) => (
            <button key={a.id} type="button" className={chip.quickAction} onClick={() => handleAction(a.id)}>
              <span className={chip.icon}><Icon name={a.icon} size="s" /></span>
              <span>{a.label}</span>
              {a.isNew && <NewBadge />}
            </button>
          ))}
        </Horizontal>
      }
    />
  );
};

export default HomeView;
