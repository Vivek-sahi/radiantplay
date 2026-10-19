import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, ActionMenuItemGroup, Avatar, Button, Icon } from '@/components';
import { AppSidebar } from '@/components/AppSidebar';
import type { AppSidebarProps } from '@/components/AppSidebar';
import { systemColors } from '@tokens/colors';
import { ROLE_OPTIONS, Variant, VARIANT_OPTIONS } from '../../variant';
import { AppState, Role, V3Page } from '../types';
import styles from '../v3.module.css';

/** The IA from the design document (section 10): three workspace pages, three set-up pages. Text only, as the product's sidebar. */
const NAV: AppSidebarProps['categories'] = {
  agentdb: [
    {
      title: 'Workspace',
      items: [
        { id: 'data', label: 'Data' },
        { id: 'sql', label: 'SQL' },
        { id: 'activity', label: 'Queries' },
      ],
    },
    {
      title: 'Setup',
      items: [
        { id: 'connect', label: 'Connect' },
        { id: 'keys', label: 'API keys' },
        { id: 'access', label: 'Access' },
      ],
    },
  ],
};

const TABS: AppSidebarProps['tabs'] = [{ id: 'agentdb', label: 'AgentDB', headerTitle: 'AgentDB' }];

/** AppSidebar ships in the dark colourway; the product's sidebar is light. The same component, the light system palette. */
const LIGHT = {
  '--as-bg': systemColors.light['background-sunken'],
  '--as-panel-bg': systemColors.light['background-sunken'],
  '--as-border': systemColors.light['border-divider'],
  '--as-panel-selected': systemColors.light['background-subtle'],
  '--as-text': systemColors.light['content-primary'],
  '--as-muted': systemColors.light['content-secondary'],
  '--as-subtle': systemColors.light['content-secondary'],
  '--as-icon': systemColors.light['content-tertiary'],
  '--as-active': systemColors.light['content-brand'],
  '--as-active-bg': systemColors.light['background-information'],
  '--as-hover-bg': systemColors.light['background-ghost-hover'],
  '--as-highlight-bg': systemColors.light['background-information'],
  '--as-focus': systemColors.light['border-focus'],
} as React.CSSProperties;

const STATE_OPTIONS = [
  { id: 'empty', label: 'Empty workspace' },
  { id: 'filled', label: 'Filled workspace' },
];

/**
 * v3 chrome (Vivek, 15 Oct): no header. The sidebar carries the navigation and, at its foot,
 * the signed-in person with the account menu.
 */
export const V3Shell: React.FC<{
  page: V3Page;
  onNavigate: (p: V3Page) => void;
  me: string;
  onSignOut: () => void;
  onDocs: () => void;
  /** The prototype controls, floating. */
  controls?: React.ReactNode;
  children: React.ReactNode;
}> = ({ page, onNavigate, me, onSignOut, onDocs, controls, children }) => {
  const [menuKey, setMenuKey] = useState(0);
  const pick = (fn: () => void) => () => {
    fn();
    setMenuKey((n) => n + 1);
  };

  return (
    <div className={styles.app}>
      <div className={styles.sidebarWrap}>
        <AppSidebar
          style={LIGHT}
          tabs={TABS}
          activeTab="agentdb"
          onTabChange={() => undefined}
          categories={NAV}
          selectedNav={page}
          onNavSelect={(id) => onNavigate(id as V3Page)}
          bottomSlot={
            <div className={styles.avatarWrap}>
              <ActionMenu
                key={menuKey}
                placement="top-start"
                trigger={
                  <Button variant="tertiary" fullWidth className={styles.avatarButton}>
                    <Avatar name={me} size="s" showName />
                    <Icon name="chevron-up" size="s" color="currentColor" aria-hidden />
                  </Button>
                }
              >
                <ActionMenuItem label="Docs" onClick={pick(onDocs)} />
                <ActionMenuItem label="Sign out" onClick={pick(onSignOut)} />
              </ActionMenu>
            </div>
          }
        />
      </div>
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
}> = ({ variant, onVariantChange, appState, onAppStateChange, role, onRoleChange }) => {
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
        placement="top-end"
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
      </ActionMenu>
    </div>
  );
};
