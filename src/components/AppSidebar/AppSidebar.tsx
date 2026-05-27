import React, { forwardRef, useMemo } from 'react';
import { Icon } from '../icons';
import { systemColors, referenceColors } from '../../tokens/colors';
import styles from './AppSidebar.module.css';

// Sidebar-specific panel colors — not yet in the Radiant reference scale.
// These are ThoughtSpot product-level dark navy values used only in AppSidebar.
const SIDEBAR_PANEL_BG = '#232f43';
const SIDEBAR_PANEL_SELECTED = '#2f3a4e';

const DATA_TAB_ICON_PATH =
  'M17 8.5C17 9.63333 13.5067 10.8611 9 10.8611C4.50667 10.8611 1.02667 9.63333 1 8.51889V5.23222C2.97333 6.10111 5.85333 6.61111 9 6.61111C12.1467 6.61111 15.0267 6.10111 17 5.23222V8.5ZM17 11.3711V14.6767C16.9467 15.9611 13.3867 17 9 17C4.61333 17 1.05333 15.9611 1 14.6672V11.3617C2.97333 12.24 5.85333 12.75 9 12.75C12.1467 12.75 15.0267 12.24 17 11.3711ZM9 4.72222C4.58667 4.72222 1 3.66444 1 2.36111C1 1.05778 4.58667 0 9 0C13.4133 0 17 1.05778 17 2.36111C17 3.66444 13.4133 4.72222 9 4.72222Z';
const DEVELOP_TAB_ICON_LEFT_PATH =
  'M0 8.82471L4.20726 3.44784L5.57812 4.81615L2.61204 8.82471L5.52254 12.9104L4.20726 14.2016L0 8.82471Z';
const DEVELOP_TAB_ICON_CENTER_PATH = 'M5.00625 18L11.0825 0L12.9165 0L6.84023 18H5.00625Z';
const DEVELOP_TAB_ICON_RIGHT_PATH =
  'M12.4219 4.89691L13.7927 3.52861L18 8.90548L13.7927 14.2824L12.4589 12.9911L15.388 8.90548L12.4219 4.89691Z';

const classNames = (...values: Array<string | undefined | false>): string =>
  values.filter(Boolean).join(' ');

const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const InsightsTabIcon: React.FC = () => (
  <svg className={styles.tabSvg} fill="none" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M0 8.5C0 7.94772 0.447715 7.5 1 7.5H4.29412C4.8464 7.5 5.29412 7.94772 5.29412 8.5V18H0V8.5Z" fill="currentColor" />
    <path d="M6.35294 1C6.35294 0.447716 6.80065 0 7.35294 0H10.6471C11.1993 0 11.6471 0.447715 11.6471 1V18H6.35294V1Z" fill="currentColor" />
    <path d="M12.7059 4C12.7059 3.44772 13.1536 3 13.7059 3H17C17.5523 3 18 3.44772 18 4V18H12.7059V4Z" fill="currentColor" />
  </svg>
);

const DataTabIcon: React.FC = () => (
  <svg className={styles.tabSvg} fill="none" viewBox="0 0 18 18" aria-hidden="true">
    <path d={DATA_TAB_ICON_PATH} fill="currentColor" />
  </svg>
);

const DevelopTabIcon: React.FC = () => (
  <svg className={styles.tabSvg} fill="none" viewBox="0 0 18 18" aria-hidden="true">
    <path d={DEVELOP_TAB_ICON_LEFT_PATH} fill="currentColor" />
    <path d={DEVELOP_TAB_ICON_CENTER_PATH} fill="currentColor" />
    <path d={DEVELOP_TAB_ICON_RIGHT_PATH} fill="currentColor" />
  </svg>
);

const AdminTabIcon: React.FC = () => (
  <svg className={styles.tabSvg} fill="none" viewBox="0 0 18 18" aria-hidden="true">
    <circle cx="9" cy="9" r="2.8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 1.75V4.1M9 13.9V16.25M1.75 9H4.1M13.9 9H16.25M3.86 3.86L5.52 5.52M12.48 12.48L14.14 14.14M14.14 3.86L12.48 5.52M5.52 12.48L3.86 14.14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
);

const getDefaultTabIcon = (tabId: string): React.ReactNode => {
  switch (tabId) {
    case 'insights':
      return <InsightsTabIcon />;
    case 'data':
      return <DataTabIcon />;
    case 'develop':
      return <DevelopTabIcon />;
    case 'admin':
      return <AdminTabIcon />;
    default:
      return <AdminTabIcon />;
  }
};

export interface SidebarTab {
  id: string;
  label: string;
  headerTitle: string;
  icon?: React.ReactNode;
  showAddButton?: boolean;
  onAddClick?: () => void;
  headerActionSlot?: React.ReactNode;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
  isExternal?: boolean;
  href?: string;
}

export interface SidebarCategory {
  title: string;
  items: SidebarNavItem[];
}

export interface ScopeToggleOption {
  id: string;
  label: string;
}

export interface ScopeToggle {
  options: ScopeToggleOption[];
  activeId: string;
  onChange: (id: string) => void;
}

interface SidebarItemProps {
  item: SidebarNavItem;
  active: boolean;
  highlighted: boolean;
  onSelect: (item: SidebarNavItem) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, active, highlighted, onSelect }) => (
  <button
    type="button"
    className={classNames(
      styles.item,
      active && styles.itemActive,
      highlighted && styles.itemHighlighted,
    )}
    onClick={() => onSelect(item)}
    aria-current={active ? 'page' : undefined}
  >
    <span className={styles.itemLabel}>{item.label}</span>
    {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
    {item.isExternal && (
      <span className={styles.externalHint} aria-hidden="true">
        <Icon name="arrow-right" size="s" color="currentColor" />
      </span>
    )}
  </button>
);

export interface AppSidebarProps {
  tabs: SidebarTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  categories: Record<string, SidebarCategory[]>;
  selectedNav: string;
  onNavSelect: (navId: string) => void;
  scopeToggle?: ScopeToggle;
  highlightedItem?: string | null;
  headerSlot?: React.ReactNode;
  isOverlay?: boolean;
  onClose?: () => void;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AppSidebar = forwardRef<HTMLElement, AppSidebarProps>(
  (
    {
      tabs,
      activeTab,
      onTabChange,
      categories,
      selectedNav,
      onNavSelect,
      scopeToggle,
      highlightedItem = null,
      headerSlot,
      isOverlay = false,
      onClose,
      width = 260,
      className,
      style,
    },
    ref,
  ) => {
    const activeTabConfig = useMemo(
      () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
      [activeTab, tabs],
    );
    const activeCategories = useMemo(
      () => categories[activeTabConfig?.id ?? ''] ?? [],
      [activeTabConfig, categories],
    );

    const tokenStyles = {
      '--as-width': `${width}px`,
      // Surfaces
      '--as-bg':             systemColors.dark['background-base'],        // #1D232F — tab switcher bg
      '--as-border':         referenceColors.gray['90'],                  // #1D232F — seamless internal dividers; strong dark separator vs white content
      '--as-panel-bg':       SIDEBAR_PANEL_BG,                            // #232F43 — main menu panel (no system token)
      '--as-panel-selected': SIDEBAR_PANEL_SELECTED,                      // #2F3A4E — hover/selected panel (no system token)
      // Text & icons
      '--as-text':           referenceColors.gray['30'],                  // #DBDFE7 — nav item text (Figma: Gray/30; darker than content-primary-dark=#FFF)
      '--as-muted':          systemColors.dark['content-tertiary'],       // #777E8B — section header labels
      '--as-subtle':         systemColors.dark['content-tertiary'],       // #777E8B — inactive scope button text
      '--as-icon':           referenceColors.gray['40'],                  // #C0C6CF — unselected tab icons (no dark system token at this shade)
      // Interactive states
      '--as-active':         systemColors.dark['content-brand'],          // #71A1F4 — active nav item text (Blue/50)
      '--as-active-bg':      hexToRgba(referenceColors.brand['50'], 0.12), // rgba(113,161,244,0.12) — List State/Highlight
      '--as-hover-bg':       hexToRgba(referenceColors.brand['50'], 0.06), // subtle hover tint
      '--as-highlight-bg':   hexToRgba(referenceColors.brand['50'], 0.3),  // animated highlight tint
      '--as-focus':          systemColors.dark['border-focus'],           // #71A1F4 — focus ring
      // Scope toggle (segment control sits on white bg → needs light-mode brand color)
      '--as-scope-active':    systemColors.dark['content-brand-inverse'], // #2770EF — active segment text on white
      '--as-scope-active-bg': referenceColors.gray['00'],                 // #FFFFFF — active segment white pill
    } as React.CSSProperties;

    const mergedStyles: React.CSSProperties = {
      ...tokenStyles,
      ...style,
    };

    const handleTabClick = (tabId: string): void => {
      onTabChange(tabId);
      if (isOverlay) {
        onClose?.();
      }
    };

    const handleItemClick = (item: SidebarNavItem): void => {
      if (item.isExternal && item.href) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      } else {
        onNavSelect(item.id);
      }
      if (isOverlay) {
        onClose?.();
      }
    };

    if (!tabs.length || !activeTabConfig) {
      return null;
    }

    return (
      <aside
        ref={ref}
        className={classNames(styles.sidebar, isOverlay && styles.overlaySidebar, className)}
        style={mergedStyles}
      >
        <div className={styles.tabSwitcher}>
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              <button
                type="button"
                className={classNames(styles.tabButton, activeTab === tab.id && styles.tabButtonActive)}
                onClick={() => handleTabClick(tab.id)}
                aria-label={tab.label}
                title={tab.label}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className={styles.tabIcon}>{tab.icon ?? getDefaultTabIcon(tab.id)}</span>
              </button>
              {index < tabs.length - 1 && <div className={styles.tabDivider} aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerRow}>
              <h2 className={styles.headerTitle}>{activeTabConfig.headerTitle}</h2>
              {activeTabConfig.headerActionSlot}
              {activeTabConfig.showAddButton && (
                <button type="button" className={styles.addButton} onClick={activeTabConfig.onAddClick} aria-label="Add">
                  <Icon name="plus" size="m" color="currentColor" />
                </button>
              )}
            </div>

            {headerSlot && <div className={styles.headerSlot}>{headerSlot}</div>}

            {scopeToggle && (
              <div className={styles.scopeToggle}>
                {scopeToggle.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={classNames(
                      styles.scopeButton,
                      scopeToggle.activeId === option.id && styles.scopeButtonActive,
                    )}
                    onClick={() => scopeToggle.onChange(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className={styles.nav} aria-label={`${activeTabConfig.label} navigation`}>
            {activeCategories.map((category) => (
              <section key={category.title} className={styles.category}>
                <h3 className={styles.categoryTitle}>{category.title}</h3>
                <div className={styles.categoryItems}>
                  {category.items.map((item) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      active={selectedNav === item.id}
                      highlighted={highlightedItem === item.id}
                      onSelect={handleItemClick}
                    />
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>
      </aside>
    );
  },
);

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;
