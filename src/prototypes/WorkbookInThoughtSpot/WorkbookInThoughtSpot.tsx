import React, { useState } from 'react';
import { GlobalHeader } from '@components/GlobalHeader';
import { AppSidebar } from '@components/AppSidebar';
import type { AppSidebarProps } from '@components/AppSidebar';
import { HomeView } from './components/HomeView';
import { WorkbooksView } from './components/WorkbooksView';
import { NewBadge } from './components/NewBadge';
import styles from './WorkbookInThoughtSpot.module.css';

const TABS: AppSidebarProps['tabs'] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights', showAddButton: true },
  { id: 'data', label: 'Data', headerTitle: 'Data' },
];

// The product's Insights nav, with Workbooks added under Library (Vivek, 3 Nov).
const NAV: AppSidebarProps['categories'] = {
  insights: [
    {
      title: '',
      items: [
        { id: 'home', label: 'Home' },
        { id: 'spotter', label: 'Spotter' },
        { id: 'agentspot', label: 'AgentSpot', isExternal: true },
        { id: 'search-data', label: 'Search data' },
      ],
    },
    {
      title: 'Library',
      items: [
        { id: 'liveboards', label: 'Liveboards' },
        { id: 'answers', label: 'Answers' },
        { id: 'workbooks', label: 'Workbooks', badge: <NewBadge /> },
        { id: 'collections', label: 'Collections' },
      ],
    },
    {
      title: 'Analysis & alerts',
      items: [
        { id: 'liveboard-schedules', label: 'Liveboard schedules' },
        { id: 'monitor-subscriptions', label: 'Monitor subscriptions' },
        { id: 'spotiq-analysis', label: 'SpotIQ analysis' },
      ],
    },
  ],
  data: [],
};

// Pages built so far. Every other nav item stays on the current page.
type Page = 'home' | 'workbooks';
const BUILT: Page[] = ['home', 'workbooks'];

const WorkbookInThoughtSpot: React.FC = () => {
  const [tab, setTab] = useState('insights');
  const [page, setPage] = useState<Page>('home');

  return (
    <div className={styles.shell}>
      <GlobalHeader theme="auto" searchPlaceholder="Search your library" notificationCount={1} userName="Vivek Sahi" />
      <div className={styles.body}>
        <AppSidebar
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
          categories={NAV}
          selectedNav={page}
          onNavSelect={(id) => {
            if (BUILT.includes(id as Page)) setPage(id as Page);
          }}
        />
        <main className={styles.main}>{page === 'home' ? <HomeView /> : <WorkbooksView />}</main>
      </div>
    </div>
  );
};

export default WorkbookInThoughtSpot;
