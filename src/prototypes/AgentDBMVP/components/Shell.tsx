import React from 'react';
import { Avatar, Button, Horizontal, Icon, Select, Typography, Vertical } from '@/components';
import type { IconName } from '@/components';
import { spacing } from '@tokens/spacing';
import { Page } from '../types';
import { ORG_NAME } from '../data';
import { StatusPill } from './primitives';
import { SHOW_VARIANT_SWITCHER, Variant, VARIANT_OPTIONS } from '../variant';
import styles from './Shell.module.css';

const NAV: { group: string; items: { id: Page; label: string; icon: IconName }[] }[] = [
  {
    group: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: 'grid-view' },
      { id: 'data', label: 'Data', icon: 'database' },
      { id: 'sql', label: 'SQL editor', icon: 'formula' },
      { id: 'activity', label: 'Activity', icon: 'clock' },
    ],
  },
  {
    group: 'Manage',
    items: [
      { id: 'connect', label: 'Connect', icon: 'cord' },
      { id: 'access', label: 'Access', icon: 'key' },
      { id: 'usage', label: 'Usage and billing', icon: 'chart' },
    ],
  },
];

/**
 * Standalone console chrome: AgentDB is its own product, so there is no ThoughtSpot
 * navigation — but sign-in and the organisation come from ThoughtSpot.
 */
export const Shell: React.FC<{
  page: Page;
  onNavigate: (p: Page) => void;
  variant: Variant;
  onVariantChange: (v: Variant) => void;
  children: React.ReactNode;
}> = ({ page, onNavigate, variant, onVariantChange, children }) => (
  <div className={styles.app}>
    <header className={styles.header}>
      <Horizontal gap={spacing.C} align="center">
        <span className={styles.mark}>
          <Icon name="database" size="m" aria-hidden />
        </span>
        <Typography variant="content-label" color="base" noMargin>
          AgentDB
        </Typography>
        <span className={styles.divider} aria-hidden />
        <Typography variant="body-normal" color="gray-light" noMargin>
          {ORG_NAME}
        </Typography>
      </Horizontal>
      <Horizontal gap={spacing.D} align="center">
        {SHOW_VARIANT_SWITCHER && (
          <Select size="small" options={VARIANT_OPTIONS} value={variant} onChange={(v) => onVariantChange(v as Variant)} aria-label="Prototype version" />
        )}
        <StatusPill kind="success" label="All systems normal" />
        <Button variant="tertiary" size="small" icon="documentation">
          Docs
        </Button>
        <Avatar name="Priya Nair" size="s" />
      </Horizontal>
    </header>

    <div className={styles.body}>
      <nav className={styles.nav} aria-label="AgentDB">
        <Vertical gap={spacing.F}>
          {NAV.map((g) => (
            <Vertical key={g.group} gap={spacing.A}>
              <Typography variant="overline" color="gray-light" noMargin className={styles.groupLabel}>
                {g.group}
              </Typography>
              {g.items.map((item) => (
                <Button
                  key={item.id}
                  variant="tertiary"
                  icon={item.icon}
                  fullWidth
                  active={page === item.id}
                  className={`${styles.navItem} ${page === item.id ? styles.navActive : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </Vertical>
          ))}
        </Vertical>
        <Typography variant="footnote" color="gray-light" noMargin className={styles.navFoot}>
          {variant === 'v1' ? 'Signed in with ThoughtSpot' : 'Signed in with single sign-on'}
        </Typography>
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  </div>
);
