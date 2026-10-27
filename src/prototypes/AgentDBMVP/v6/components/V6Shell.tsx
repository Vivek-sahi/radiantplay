import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, ActionMenuItemGroup, Avatar, Button, Icon, Tooltip } from '@/components';
import type { IconName } from '@/components';
import { AppSidebar } from '@/components/AppSidebar';
import type { AppSidebarProps } from '@/components/AppSidebar';
import { ROLE_OPTIONS, Variant, VARIANT_OPTIONS } from '../../variant';
import { AppState, Role, V3Page } from '../types';
import { CodeIcon } from './CodeIcon';
import { HomeIcon } from './HomeIcon';
import styles from '../v6.module.css';

/** The IA from the design document (section 10): three workspace pages, three set-up pages. Text only, as the product's sidebar. */
const NAV: AppSidebarProps['categories'] = {
  agentdb: [
    {
      title: 'Workspace',
      items: [
        { id: 'data', label: 'Overview' },
        { id: 'sql', label: 'SQL' },
        { id: 'activity', label: 'Queries' },
      ],
    },
    {
      title: 'Setup',
      items: [
        { id: 'connect', label: 'Connect' },
        { id: 'keys', label: 'API keys' },
        { id: 'access', label: 'Members' },
      ],
    },
  ],
};

/** Navigation option 2 (Vivek, 26 Oct): icons only; the menu button opens the names as an overlay. */
export type NavStyle = 'labels' | 'icons';
// Radiant's set has no code, plug or log icon: these are its nearest (contact sheet checked 26 Oct).
const NAV_ICON: Record<string, IconName | React.ReactNode> = { data: <HomeIcon />, sql: <CodeIcon />, activity: 'replay-search', connect: 'copy-link', keys: 'key', access: 'community' };

const TABS: AppSidebarProps['tabs'] = [{ id: 'agentdb', label: 'AgentDB', headerTitle: 'AgentDB' }];

/**
 * AppSidebar ships in the dark colourway; the product's sidebar is light. The same component, the light
 * system palette, read through the CSS variables so a UI style restyles it too (Vivek, 27 Oct).
 */
const LIGHT = {
  '--as-bg': 'var(--rd-sys-color-background-sunken)',
  '--as-panel-bg': 'var(--rd-sys-color-background-sunken)',
  '--as-border': 'var(--rd-sys-color-border-divider)',
  '--as-panel-selected': 'var(--rd-sys-color-background-subtle)',
  '--as-text': 'var(--rd-sys-color-content-primary)',
  '--as-muted': 'var(--rd-sys-color-content-secondary)',
  '--as-subtle': 'var(--rd-sys-color-content-secondary)',
  '--as-icon': 'var(--rd-sys-color-content-tertiary)',
  '--as-active': 'var(--rd-sys-color-content-brand)',
  '--as-active-bg': 'var(--rd-sys-color-background-ghost-highlight)',
  '--as-hover-bg': 'var(--rd-sys-color-background-ghost-hover)',
  '--as-highlight-bg': 'var(--rd-sys-color-background-ghost-highlight)',
  '--as-focus': 'var(--rd-sys-color-border-focus)',
} as React.CSSProperties;

const STATE_OPTIONS = [
  { id: 'empty', label: 'Empty workspace' },
  { id: 'filled', label: 'Filled workspace' },
];

/**
 * v3 chrome (Vivek, 15 Oct): no header. The sidebar carries the navigation and, at its foot,
 * the signed-in person with the account menu.
 */
export const V6Shell: React.FC<{
  page: V3Page;
  onNavigate: (p: V3Page) => void;
  me: string;
  onSignOut: () => void;
  onDocs: () => void;
  /** The prototype controls, floating. */
  controls?: React.ReactNode;
  navStyle?: NavStyle;
  children: React.ReactNode;
}> = ({ page, onNavigate, me, onSignOut, onDocs, controls, navStyle = 'labels', children }) => {
  const [menuKey, setMenuKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const pick = (fn: () => void) => () => {
    fn();
    setMenuKey((n) => n + 1);
  };

  const accountMenu = (trigger: React.ReactElement) => (
    <ActionMenu key={menuKey} placement="top-start" trigger={trigger}>
      <ActionMenuItem label="Docs" onClick={pick(onDocs)} />
      <ActionMenuItem label="Sign out" onClick={pick(onSignOut)} />
    </ActionMenu>
  );

  // The full sidebar, with names. Option 1 shows it always; option 2 opens it over the page.
  const sidebar = (overlay: boolean) => (
        <AppSidebar
          isOverlay={overlay}
          onClose={() => setExpanded(false)}
          style={LIGHT}
          tabs={TABS}
          activeTab="agentdb"
          onTabChange={() => undefined}
          categories={NAV}
          selectedNav={page}
          onNavSelect={(id) => onNavigate(id as V3Page)}
          bottomSlot={
            <div className={styles.avatarWrap}>
              {accountMenu(
                <Button variant="tertiary" fullWidth className={`${styles.avatarButton} ${styles.meAvatar}`}>
                  <Avatar name={me} size="s" showName />
                  <Icon name="chevron-up" size="s" color="currentColor" aria-hidden />
                </Button>,
              )}
            </div>
          }
        />
  );

  // Option 2: one rail. Collapsed it shows icons; expanded, the same rail widens over the page and
  // the names appear beside the icons, which stay where they were. Esc, a pick or a click outside closes it.
  const railItem = (id: string, label: string, icon: IconName | React.ReactNode, onClick: () => void, current = false, action = label) => {
    const button = (
      <span className={[styles.railItem, current && styles.railItemOn].filter(Boolean).join(' ')}>
        <Button variant="tertiary" icon={icon} iconOnly={!expanded} fullWidth={expanded} aria-label={action} aria-current={current ? 'page' : undefined} onClick={onClick}>
          {label}
        </Button>
      </span>
    );
    return expanded ? (
      <React.Fragment key={id}>{button}</React.Fragment>
    ) : (
      <Tooltip key={id} content={action} placement="right">
        {button}
      </Tooltip>
    );
  };
  const rail = (
    <nav
      className={[styles.iconRail, expanded && styles.iconRailOpen].filter(Boolean).join(' ')}
      aria-label="Navigation"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setExpanded(false);
      }}
    >
      {/* The menu button carries the product name when open (Vivek, 26 Oct). */}
      {railItem('toggle', 'AgentDB', 'hamburger', () => setExpanded((x) => !x), false, expanded ? 'Collapse menu' : 'Expand menu')}
      {NAV.agentdb.map((group, gi) => (
        <React.Fragment key={group.title ?? gi}>
          {gi > 0 && <span className={styles.iconRailRule} aria-hidden />}
          {group.items.map((item) =>
            railItem(item.id, item.label, NAV_ICON[item.id], () => {
              onNavigate(item.id as V3Page);
              setExpanded(false);
            }, page === item.id),
          )}
        </React.Fragment>
      ))}
      <span className={styles.grow} />
      {accountMenu(
        <Button variant="tertiary" aria-label={`${me}: account`} className={styles.meAvatar}>
          <Avatar name={me} size="s" showName={expanded} />
        </Button>,
      )}
    </nav>
  );

  return (
    <div className={styles.app}>
      {navStyle === 'icons' ? (
        <div className={styles.railSpace}>
          {expanded && <div className={styles.navScrim} onClick={() => setExpanded(false)} aria-hidden />}
          {rail}
        </div>
      ) : (
        <div className={styles.sidebarWrap}>{sidebar(false)}</div>
      )}
      <main className={styles.content}>{children}</main>
      {controls}
    </div>
  );
};

/**
 * The prototype's own controls, one gear menu floating bottom-right (Vivek, 15 Oct): the
 * version, the workspace state, the signed-in role. None is a product feature.
 */
export const ProtoMenu: React.FC<{
  variant: Variant;
  onVariantChange: (v: Variant) => void;
  appState: AppState;
  onAppStateChange: (s: AppState) => void;
  role: Role;
  onRoleChange: (r: Role) => void;
  /** Live (27 Oct, the demo): the console follows the demo's state file, which the terminal writes. */
  live?: boolean;
  onLiveChange?: (on: boolean) => void;
}> = ({ variant, onVariantChange, appState, onAppStateChange, role, onRoleChange, live = false, onLiveChange }) => {
  const [menuKey, setMenuKey] = useState(0);
  const pick = (fn: () => void) => () => {
    fn();
    setMenuKey((n) => n + 1);
  };
  const mark = (on: boolean) => (on ? <Icon name="checkmark" size="s" aria-hidden /> : <span className={styles.iconSpacer} aria-hidden />);

  return (
    <div className={styles.protoControls}>
      <ActionMenu
        key={menuKey}
        placement="top-start"
        trigger={
          <Button variant="secondary" icon="settings" iconOnly aria-label="Prototype settings">
            Prototype settings
          </Button>
        }
      >
        <ActionMenuItemGroup label="Version">
          {VARIANT_OPTIONS.map((o) => (
            <ActionMenuItem key={o.id} label={o.label} icon={mark(variant === o.id)} onClick={pick(() => onVariantChange(o.id as Variant))} />
          ))}
        </ActionMenuItemGroup>
        <ActionMenuItemGroup label="Workspace">
          {STATE_OPTIONS.map((o) => (
            <ActionMenuItem key={o.id} label={o.label} icon={mark(appState === o.id)} onClick={pick(() => onAppStateChange(o.id as AppState))} />
          ))}
        </ActionMenuItemGroup>
        <ActionMenuItemGroup label="Signed in as">
          {ROLE_OPTIONS.map((o) => (
            <ActionMenuItem key={o.id} label={o.label} icon={mark(role === o.id)} onClick={pick(() => onRoleChange(o.id))} />
          ))}
        </ActionMenuItemGroup>
        {onLiveChange && (
          <ActionMenuItemGroup label="Demo">
            <ActionMenuItem label="Live: follow the terminal" icon={mark(live)} onClick={pick(() => onLiveChange(!live))} />
          </ActionMenuItemGroup>
        )}
      </ActionMenu>
    </div>
  );
};
