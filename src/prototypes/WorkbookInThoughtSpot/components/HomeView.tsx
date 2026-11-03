import React, { useState } from 'react';
import { SpotterWelcome } from '@spotter/page';
import { QuickActionRow } from '@spotter/chat';
import type { QuickActionItem } from '@spotter/chat';

// Chip row under the prompt bar (Vivek, 3 Nov): Quick search, App, Liveboard, Workbook.
// Radiant has no workbook icon; `table` is the nearest.
const ACTIONS: QuickActionItem[] = [
  { id: 'quick-search', label: 'Quick search', icon: 'explore' },
  { id: 'app', label: 'App', icon: 'apps' },
  { id: 'liveboard', label: 'Liveboard', icon: 'liveboard' },
  { id: 'workbook', label: 'Workbook', icon: 'table' },
];

export const HomeView: React.FC = () => {
  const [value, setValue] = useState('');
  // QuickActionRow locks the other chips once one fires; remounting resets it.
  const [chipsKey, setChipsKey] = useState(0);

  const handleAction = (id: string) => {
    if (id === 'workbook') setValue('Create a workbook ');
    setChipsKey((k) => k + 1);
  };

  return (
    <SpotterWelcome
      promptProps={{ value, onChange: setValue, placeholder: 'Enter your question' }}
      quickActions={<QuickActionRow key={chipsKey} actions={ACTIONS} onAction={handleAction} />}
    />
  );
};

export default HomeView;
