import React from 'react';
import { AppShell, Button, ActionMenu, ActionMenuItem, ActionMenuItemGroup } from '@/components';
import type { AppSidebarProps, SidebarTab, SidebarCategory } from '@/components/AppSidebar';
import type { GlobalHeaderProps } from '@/components/GlobalHeader';
import { c } from '../styles';
import styles from './Shell.module.css';

export type NavKey = 'objects' | 'datastore' | 'agentdbstore' | 'modelcache' | 'externalstore';

/**
 * The two delivery phases, as a switch — so each can be walked through on its own.
 *
 * `pulse-only` — phase 1, what shipped. Nav shows **Pulse**; caching a model is the
 *   whole product and the Pulse dashboard is its landing.
 * `agentdb` — phase 2. Nav shows **AgentDB**; one store holding both the tables the
 *   customer's ETL platform writes and the models ThoughtSpot caches. Pulse stops
 *   being a separate nav entry — its dashboard becomes the Cached models tab.
 */
export type StoreModel = 'pulse-only' | 'agentdb' | 'split';

const STORE_MODELS: { id: StoreModel; label: string; trigger: string }[] = [
  { id: 'pulse-only', label: 'Phase 1 · Pulse only', trigger: 'Phase 1 · Pulse' },
  { id: 'agentdb', label: 'Phase 2 · AgentDB (Pulse + Store)', trigger: 'Phase 2 · AgentDB' },
  { id: 'split', label: 'Phase 2 alt · Separate pages under Storage', trigger: 'Phase 2 alt · Split' },
];

// Surface switcher hidden for now — only the phase dropdown is needed in the header.
const SHOW_SURFACE_SWITCHER = false;

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
const sidebarCategories = (model: StoreModel): Record<string, SidebarCategory[]> => ({
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
      items:
        model === 'pulse-only'
          ? [
              // Phase 1, exactly as shipped.
              { id: 'dbt', label: 'dbt' },
              { id: 'datastore', label: 'Pulse' },
            ]
          : model === 'agentdb'
            ? [
                // Phase 2 — one entry for the whole store. Model caching still starts
                // from the model's own Caching tab; it is no longer a separate product.
                { id: 'dbt', label: 'dbt' },
                { id: 'agentdbstore', label: 'AgentDB' },
              ]
            : [{ id: 'dbt', label: 'dbt' }],
    },
    // The split proposal: a section header carries the conceptual unity, and the
    // two halves are separate destinations with their own metrics — one for the
    // cache owner, one for the store owner. The header itself has no view.
    ...(model === 'split'
      ? [
          {
            title: 'Storage',
            items: [
              { id: 'modelcache', label: 'Model Cache' },
              { id: 'externalstore', label: 'Data Store' },
            ],
          } as SidebarCategory,
        ]
      : []),
  ],
});

// ── Shell ─────────────────────────────────────────────────────────────────────
export const Shell: React.FC<{
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  surface: Surface;
  onSurfaceChange: (surface: Surface) => void;
  storeModel: StoreModel;
  onStoreModelChange: (model: StoreModel) => void;
  children: React.ReactNode;
}> = ({ active, onNavigate, surface, onSurfaceChange, storeModel, onStoreModelChange, children }) => {
  const currentSurface = SURFACES.find((s) => s.id === surface) ?? SURFACES[0];
  const currentModel = STORE_MODELS.find((m) => m.id === storeModel) ?? STORE_MODELS[0];
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
        {/* Prototype-only: which product structure we are looking at. The
            open debate — two products, or one store with two ways in. */}
        <ActionMenu
          placement="bottom-end"
          trigger={
            <Button variant="secondary" size="small" icon="chevron-down" iconPosition="trailing">
              {currentModel.trigger}
            </Button>
          }
        >
          {STORE_MODELS.map((m) => (
            <ActionMenuItem key={m.id} label={m.label} onClick={() => onStoreModelChange(m.id)} />
          ))}
        </ActionMenu>
        {SHOW_SURFACE_SWITCHER && (
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
        )}
      </div>
    ),
  };

  const sidebarProps: AppSidebarProps = {
    tabs: SIDEBAR_TABS,
    activeTab: 'data',
    onTabChange: () => {},
    categories: sidebarCategories(storeModel),
    selectedNav: active,
    onNavSelect: (id) => {
      if (['objects', 'datastore', 'agentdbstore', 'modelcache', 'externalstore'].includes(id))
        onNavigate(id as NavKey);
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
