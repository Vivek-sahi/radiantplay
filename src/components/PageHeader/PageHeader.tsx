import { forwardRef } from 'react';
import { Breadcrumb } from '../Breadcrumb';
import type { BreadcrumbItem } from '../Breadcrumb';
import { Button } from '../Button';
import type { ButtonVariant } from '../Button/Button';
import type { IconName } from '../icons';
import { Tabs } from '../Tabs';
import type { Tab } from '../Tabs';
import styles from './PageHeader.module.css';

export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  /**
   * Button style
   * @default 'secondary'
   */
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
}

export interface PageHeaderProps {
  /** Page title, 24/32 */
  title: string;
  /** One line under the title */
  description?: string;
  /**
   * Pages above this one, top level first. The title is added as the
   * current page, so the trail shows a back button and the parent links.
   */
  breadcrumbs?: BreadcrumbItem[];
  /** Overrides what the breadcrumb back button does */
  onBack?: () => void;
  /** Tabs shown next to the title */
  tabs?: Tab[];
  /** Id of the active tab */
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  /** Buttons on the right, in order */
  actions?: PageHeaderAction[];
  className?: string;
}

/**
 * PageHeader
 *
 * The Figma Page header (20401:11336): an optional Breadcrumb, a 24/32 title
 * with optional Tabs beside it and Buttons on the right, and an optional
 * description line. Only the title is required.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   breadcrumbs={[{ label: 'Connections', href: '/data/connections' }]}
 *   title="Snowflake prod"
 *   description="Owned by Data platform. Synced every hour."
 *   tabs={[{ id: 'tables', label: 'Tables' }, { id: 'settings', label: 'Settings' }]}
 *   activeTab={tab}
 *   onTabChange={setTab}
 *   actions={[{ label: 'Share' }, { label: 'Edit', variant: 'primary' }]}
 * />
 * ```
 */
export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(({
  title,
  description,
  breadcrumbs,
  onBack,
  tabs,
  activeTab,
  onTabChange,
  actions,
  className,
}, ref) => {
  const hasBreadcrumb = Boolean(breadcrumbs && breadcrumbs.length > 0);
  const hasTabs = Boolean(tabs && tabs.length > 0);
  const hasActions = Boolean(actions && actions.length > 0);

  return (
    <header ref={ref} className={[styles.root, className].filter(Boolean).join(' ')}>
      {hasBreadcrumb && (
        <Breadcrumb
          items={[...(breadcrumbs ?? []), { label: title }]}
          showCurrent={false}
          onBack={onBack}
        />
      )}
      <div className={styles.row}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title} title={title}>{title}</h1>
          {hasTabs && (
            <Tabs
              className={styles.tabs}
              tabs={tabs ?? []}
              activeTab={activeTab ?? tabs?.[0]?.id ?? ''}
              onTabChange={(id) => onTabChange?.(id)}
            />
          )}
        </div>
        {hasActions && (
          <div className={styles.actions}>
            {actions?.map((action, i) => (
              <Button
                key={`${action.label}-${i}`}
                variant={action.variant ?? 'secondary'}
                icon={action.icon}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;
