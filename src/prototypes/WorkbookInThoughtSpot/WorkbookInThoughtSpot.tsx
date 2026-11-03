import React, { useState } from 'react';
import { GlobalHeader } from '@components/GlobalHeader';
import { AppSidebar } from '@components/AppSidebar';
import type { AppSidebarProps } from '@components/AppSidebar';
import { HomeView } from './components/HomeView';
import { WorkbooksView } from './components/WorkbooksView';
import { NewBadge } from './components/NewBadge';
import { CreateFlow } from './components/CreateFlow';
import { OpenWorkbook } from './components/OpenWorkbook';
import { fy26Workbook } from './data/fy26';
import type { SourceId } from './data/create';
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
type Page = 'home' | 'workbooks' | 'create' | 'open';
const BUILT: Page[] = ['home', 'workbooks'];

const WorkbookInThoughtSpot: React.FC = () => {
  const [tab, setTab] = useState('insights');
  // On the Spotter chat screen the nav is hidden, as in SpotterX; the hamburger opens it over the page.
  const [navOpen, setNavOpen] = useState(false);
  const [page, setPage] = useState<Page>('home');
  // A new run each time, so the questions start fresh.
  const [run, setRun] = useState<{ key: number; seed?: string; source?: SourceId }>({ key: 0 });
  const chatScreen = page === 'create' || page === 'open';
  const startCreate = (seed?: string, source?: SourceId) => {
    setRun((r) => ({ key: r.key + 1, seed, source }));
    setPage('create');
  };

  return (
    <div className={`${styles.shell} ${chatScreen ? styles.shellClear : ''}`}>
      <div className={styles.headerLayer}>
        <GlobalHeader theme="auto" searchPlaceholder="Search your library" notificationCount={1} userName="Vivek Sahi" showHamburger={chatScreen} onHamburgerClick={() => setNavOpen((o) => !o)} />
      </div>
      <div className={styles.body}>
        {(!chatScreen || navOpen) && (
          <AppSidebar
            isOverlay={chatScreen}
            onClose={() => setNavOpen(false)}
            tabs={TABS}
            activeTab={tab}
            onTabChange={setTab}
            categories={NAV}
            selectedNav={chatScreen ? '' : page}
            onNavSelect={(id) => {
              if (BUILT.includes(id as Page)) {
                setPage(id as Page);
                setNavOpen(false);
              }
            }}
          />
        )}
        <main className={styles.main}>
          {page === 'home' && <HomeView onStart={(prompt) => startCreate(prompt)} />}
          {page === 'workbooks' && <WorkbooksView onCreate={(source) => startCreate(undefined, source)} onOpen={(id) => { if (id === 'fy26-plan-vs-actual') setPage('open'); }} />}
          {page === 'open' && <OpenWorkbook build={fy26Workbook} />}
          {page === 'create' && <CreateFlow key={run.key} runId={run.key} seedPrompt={run.seed} startSource={run.source} />}
        </main>
      </div>
    </div>
  );
};

export default WorkbookInThoughtSpot;
