import React from 'react';
import { AppShell, Button, ActionMenu, ActionMenuItem, ActionMenuItemGroup } from '@/components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '@/components/AppSidebar';
import type { GlobalHeaderProps } from '@/components/GlobalHeader';
import { c } from '../styles';
import styles from './Shell.module.css';

export type NavKey = 'objects' | 'datastore';

/** Top-level surface the prototype is showing, chosen from the header switcher. */
export type Surface =
  | 'data-workspace'
  | 'spotter'
  | 'spotter-b'
  | 'search'
  | 'liveboard'
  | 'liveboard-b'
  | 'liveboard-dot'
  | 'liveboard-statement'
  | 'liveboard-stroke'
  | 'liveboard-hover'
  | 'spotter-source'
  | 'spotter-header-icon'
  | 'liveboard-hover-source'
  | 'search-icon';
// Switcher grouped by surface for demoing — recommended option first in each
// group; the surface name lives in the group header so item labels stay short,
// while the trigger button shows the fully-qualified label.
type SurfaceItem = { id: Surface; label: string; trigger?: string };
type SurfaceGroup = { label?: string; items: SurfaceItem[] };

const SURFACE_GROUPS: SurfaceGroup[] = [
  { items: [{ id: 'data-workspace', label: 'Data workspace' }] },
  {
    label: 'Spotter',
    items: [
      { id: 'spotter-b', label: 'Data freshness', trigger: 'Spotter · data freshness' },
      { id: 'spotter-source', label: 'Source-first copy', trigger: 'Spotter · source-first copy' },
      { id: 'spotter-header-icon', label: 'Header icon', trigger: 'Spotter · header icon' },
      { id: 'spotter', label: 'Cache above graph', trigger: 'Spotter · cache above graph' },
    ],
  },
  {
    label: 'Liveboard',
    items: [
      { id: 'liveboard-hover', label: 'Data freshness', trigger: 'Liveboard · data freshness' },
      { id: 'liveboard-dot', label: 'Neutral dot', trigger: 'Liveboard · neutral dot' },
      { id: 'liveboard-statement', label: 'Board statement', trigger: 'Liveboard · board statement' },
    ],
  },
  {
    label: 'Search data',
    items: [
      { id: 'search-icon', label: 'Top-right icon', trigger: 'Search data · top-right icon' },
      { id: 'search', label: 'Footer', trigger: 'Search data · footer' },
    ],
  },
];

export const SURFACES: SurfaceItem[] = SURFACE_GROUPS.flatMap((g) => g.items);

/** Full-width surfaces hide the data-workspace left nav (product-accurate). */
export const isFullWidthSurface = (s: Surface): boolean =>
  s.startsWith('liveboard') || s.startsWith('search');

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
        { id: 'datastore', label: 'Pulse' },
      ],
    },
  ],
};

// ── Shell ─────────────────────────────────────────────────────────────────────
export const Shell: React.FC<{
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  surface: Surface;
  onSurfaceChange: (surface: Surface) => void;
  children: React.ReactNode;
}> = ({ active, onNavigate, surface, onSurfaceChange, children }) => {
  const currentSurface = SURFACES.find((s) => s.id === surface) ?? SURFACES[0];
  const headerProps: GlobalHeaderProps = {
    searchPlaceholder: 'Search your library',
    searchMode: 'trigger',
    userName: 'Vivek Sahi',
    notificationCount: 3,
    theme: 'dark',
    // Prototype-only surface switcher: jump between the Near Store touchpoints
    // (Data workspace / Spotter / Search data / Liveboard) to demo how the
    // cached-vs-live marker appears on each. Not a real product control.
    rightSlot: (
      <div className={styles.switcher}>
        <ActionMenu
          placement="bottom-end"
          trigger={
            <Button variant="secondary" size="small" icon="chevron-down" iconPosition="trailing">
              {currentSurface.trigger ?? currentSurface.label}
            </Button>
          }
        >
          {SURFACE_GROUPS.flatMap((group, gi) =>
            group.label
              ? [
                  <ActionMenuItemGroup key={`g-${gi}`} label={group.label}>
                    {group.items.map((s) => (
                      <ActionMenuItem key={s.id} label={s.label} onClick={() => onSurfaceChange(s.id)} />
                    ))}
                  </ActionMenuItemGroup>,
                ]
              : group.items.map((s) => (
                  <ActionMenuItem key={s.id} label={s.label} onClick={() => onSurfaceChange(s.id)} />
                )),
          )}
        </ActionMenu>
      </div>
    ),
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
      hideSidebar={isFullWidthSurface(surface)}
      contentBackground={c['background-sunken']}
    >
      <div className={styles.content}>
        {children}
      </div>
    </AppShell>
  );
};
