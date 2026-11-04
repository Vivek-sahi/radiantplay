import React from 'react';
import { AppShell } from '@/components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '@/components/AppSidebar';
import type { GlobalHeaderProps } from '@/components/GlobalHeader';
import { c } from '../styles';
import styles from './Shell.module.css';

/** The two destinations this prototype builds. Every other nav item shows a placeholder. */
export type NavKey = 'objects' | 'datacache';

// ── Sidebar config — mirrors the product Data workspace nav (Nov 2026) ──────────
const SIDEBAR_TABS: SidebarTab[] = [
  { id: 'insights', label: 'Insights', headerTitle: 'Insights' },
  { id: 'data', label: 'Data', headerTitle: 'Data workspace', showAddButton: true },
];

// "Included" on the Data Cache entry: leadership's ask (2 Nov). The plan includes
// caching; the nav says so before anyone opens the page.
export type NavBadge = 'included' | 'new';
const categories = (badge: NavBadge): Record<string, SidebarCategory[]> => ({
  insights: [],
  data: [
    {
      items: [
        { id: 'objects', label: 'Data objects' },
        { id: 'connections', label: 'Connections' },
        { id: 'analyst-studio', label: 'Analyst Studio', isExternal: true },
        { id: 'utilities', label: 'Utilities' },
        { id: 'sync', label: 'Sync' },
      ],
    },
    {
      title: 'Spotter memory',
      items: [
        { id: 'memory-sources', label: 'Memory sources' },
        { id: 'context-center', label: 'Context Center' },
      ],
    },
    {
      title: 'Governance',
      items: [
        { id: 'data-catalog', label: 'Data catalog' },
        { id: 'usage', label: 'Usage' },
        { id: 'dbt', label: 'dbt' },
        { id: 'liveboard-verification', label: 'Liveboard verification' },
        { id: 'datacache', label: 'Data Cache', badge: <span className={`${styles.navTag} ${badge === 'new' ? styles.navTagNew : styles.navTagIncluded}`}>{badge === 'new' ? 'New' : 'Included'}</span> },
      ],
    },
  ],
});

export const NAV_LABELS: Record<string, string> = Object.fromEntries(
  categories('included').data.flatMap((cat) => cat.items.map((i) => [i.id, i.label])),
);

// ── Shell ─────────────────────────────────────────────────────────────────────
export const Shell: React.FC<{
  active: string;
  onNavigate: (id: string) => void;
  navBadge: NavBadge;
  children: React.ReactNode;
}> = ({ active, onNavigate, navBadge, children }) => {
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
    categories: categories(navBadge),
    selectedNav: active,
    onNavSelect: (id) => {
      if (id !== 'analyst-studio') onNavigate(id);
    },
  };

  return (
    <AppShell className={styles.shell} headerProps={headerProps} sidebarProps={sidebarProps} contentBackground={c['background-sunken']}>
      <div className={styles.content}>{children}</div>
    </AppShell>
  );
};
