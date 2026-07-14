import React from 'react';
import { AppShell } from '@/components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '@/components/AppSidebar';
import type { GlobalHeaderProps } from '@/components/GlobalHeader';
import { c } from '../styles';
import styles from './Shell.module.css';

export type NavKey = 'objects' | 'datastore';

// ── Sidebar config — mirrors the product Data workspace nav ───────────────────
// Rail tabs: Insights + Data (AppSidebar auto-supplies the icons for these ids).
const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data', label: 'Data', headerTitle: 'Data workspace', showAddButton: true },
];

// Nav groups shown under the Data tab. Near Store is our added feature under Governance.
const SIDEBAR_CATEGORIES: Record<string, SidebarCategory[]> = {
  insights: [],
  data: [
    {
      items: [
        { id: 'objects', label: 'Data objects' },
        { id: 'connections', label: 'Connections' },
        { id: 'analyst-studio', label: 'Analyst Studio', isExternal: true },
        { id: 'utilities', label: 'Utilities' },
      ],
    },
    {
      title: 'Spotter memory',
      items: [{ id: 'memory-sources', label: 'Memory sources' }],
    },
    {
      title: 'Governance',
      items: [
        { id: 'dbt', label: 'dbt' },
        { id: 'datastore', label: 'Near Store' },
      ],
    },
  ],
};

// ── Shell ─────────────────────────────────────────────────────────────────────
export const Shell: React.FC<{
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  children: React.ReactNode;
}> = ({ active, onNavigate, children }) => {
  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search your library',
    searchMode: 'trigger',
    userName: 'Vivek Sahi',
    notificationCount: 3,
    theme: 'dark',
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: 'data',
    onTabChange: () => {},
    categories: SIDEBAR_CATEGORIES,
    selectedNav: active,
    onNavSelect: (id) => {
      if (id === 'objects' || id === 'datastore') onNavigate(id);
    },
  };

  return (
    <AppShell
      className={styles.shell}
      headerProps={headerProps}
      sidebarProps={sidebarProps}
      contentBackground={c['background-sunken']}
    >
      <div className={styles.content}>
        {children}
      </div>
    </AppShell>
  );
};
