import React, { useState } from 'react';
import { Button } from '@components/Button';
import { SearchInput } from '@components/SearchInput';
import { Tabs } from '@components/Tabs';
import type { Analyst } from '../data/mockData';
import styles from './AnalystListPage.module.css';

type TabId = 'all' | 'yours' | 'shared';

const TABS = [
  { id: 'all' as TabId, label: 'All' },
  { id: 'yours' as TabId, label: 'Yours' },
  { id: 'shared' as TabId, label: 'Shared' },
];

export interface AnalystListPageProps {
  analysts: Analyst[];
  onAnalystClick: (id: string) => void;
  onCreateNew: () => void;
}

export const AnalystListPage: React.FC<AnalystListPageProps> = ({
  analysts,
  onAnalystClick,
  onCreateNew,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const filtered = analysts.filter((a) => {
    const matchesSearch =
      searchValue.trim() === '' ||
      a.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      a.description.toLowerCase().includes(searchValue.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'yours' && a.canEdit) ||
      (activeTab === 'shared' && !a.canEdit);

    return matchesSearch && matchesTab;
  });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analysts</h1>
        <Button variant="secondary" onClick={onCreateNew}>
          + Create new
        </Button>
      </div>

      <div className={styles.search}>
        <SearchInput
          placeholder="Search analysts"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        className={styles.tabs}
      />

      <div className={styles.grid}>
        {filtered.map((analyst) => {
          const initial = analyst.name.charAt(0).toUpperCase();
          return (
            <button
              key={analyst.id}
              type="button"
              className={styles.card}
              onClick={() => onAnalystClick(analyst.id)}
            >
              <div className={styles.cardAvatar} aria-hidden="true">
                <span className={styles.cardAvatarInitial}>{initial}</span>
              </div>
              <div className={styles.cardName}>{analyst.name}</div>
              <div className={styles.cardDescription}>{analyst.description}</div>
              <div className={styles.cardAuthor}>by {analyst.author}</div>
              <div className={styles.cardChips}>
                {analyst.integrations.map((integration) => (
                  <span key={integration} className={styles.chip}>
                    {integration}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
};

AnalystListPage.displayName = 'AnalystListPage';

export default AnalystListPage;
