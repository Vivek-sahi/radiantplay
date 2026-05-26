import React, { useState } from 'react';
import { AppShell } from '../../components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '../../components/AppSidebar';
import type { GlobalHeaderProps } from '../../components/GlobalHeader';
import {
  PageHeader,
  ObjectTableToolbar,
  MemorySourcesTable,
} from './components';
import { liveboards, Liveboard } from './data/mockData';

type SidebarTabId = 'insights' | 'data' | 'develop' | 'admin';

const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data', label: 'Data', headerTitle: 'Data Workspace' },
  { id: 'develop', label: 'Develop', headerTitle: 'Develop' },
  { id: 'admin', label: 'Admin', headerTitle: 'Admin' },
];

const SIDEBAR_CATEGORIES: Record<SidebarTabId, SidebarCategory[]> = {
  insights: [
    {
      title: 'Navigation',
      items: [
        { id: 'home', label: 'Home' },
        { id: 'liveboards', label: 'Liveboards' },
        { id: 'spotter', label: 'Spotter' },
      ],
    },
  ],
  data: [
    {
      title: 'Data Workspace',
      items: [
        { id: 'data-objects', label: 'Data objects' },
        { id: 'connections', label: 'Connections' },
        { id: 'analyst-studio', label: 'Analyst studio', isExternal: true },
        { id: 'utilities', label: 'Utilities' },
        { id: 'sync', label: 'Sync' },
      ],
    },
    {
      title: 'Spotter Memory',
      items: [
        { id: 'memory-sources', label: 'Memory Sources' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { id: 'data-catalog', label: 'Data catalog' },
        { id: 'usage', label: 'Usage' },
        { id: 'dbt', label: 'dbt' },
        { id: 'liveboard-verification', label: 'Liveboard verification' },
      ],
    },
  ],
  develop: [
    {
      title: 'Developer',
      items: [
        { id: 'playground', label: 'Playground' },
        { id: 'custom-actions', label: 'Custom actions' },
      ],
    },
  ],
  admin: [
    {
      title: 'Overview',
      items: [
        { id: 'resource-control-centre', label: 'Resource control centre' },
      ],
    },
  ],
};

const DEFAULT_NAV: Record<SidebarTabId, string> = {
  insights: 'home',
  data: 'memory-sources',
  develop: 'playground',
  admin: 'resource-control-centre',
};

export const SpotterMemory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTabId>('data');
  const [selectedNav, setSelectedNav] = useState('memory-sources');
  const [contentTab, setContentTab] = useState('liveboard');
  const [searchValue, setSearchValue] = useState('');

  const filteredLiveboards = liveboards.filter(liveboard =>
    liveboard.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    liveboard.author.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleAddLiveboard = () => {
    console.log('Add Liveboard clicked');
  };

  const handleRowClick = (liveboard: Liveboard) => {
    console.log('Row clicked:', liveboard);
  };

  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search in your library',
    searchMode: 'trigger',
    userName: 'User',
    notificationCount: 1,
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab,
    onTabChange: (tabId) => {
      const next = tabId as SidebarTabId;
      setActiveTab(next);
      setSelectedNav(DEFAULT_NAV[next]);
    },
    categories: SIDEBAR_CATEGORIES,
    selectedNav,
    onNavSelect: setSelectedNav,
  };

  return (
    <div>
      <AppShell
        style={styles.shell}
        headerProps={headerProps}
        sidebarProps={sidebarProps}
        contentBackground="var(--rd-sys-color-background-base)"
      >
        <div style={styles.content}>
          <PageHeader
            title="Memory sources"
            description="Add trusted memory sources to help Spotter understand more context about your data and deliver accurate answers for all users."
            activeTab={contentTab}
            onTabChange={setContentTab}
          />

          <ObjectTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onAddClick={handleAddLiveboard}
            addButtonLabel="Add Liveboard"
          />

          <MemorySourcesTable
            data={filteredLiveboards}
            onRowClick={handleRowClick}
          />
        </div>
      </AppShell>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: '100vh',
  },
  content: {
    padding: '24px 32px',
  },
};

export default SpotterMemory;
