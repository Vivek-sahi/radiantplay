import { forwardRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Button } from '../Button';
import { Link } from '../Link';
import { Icon } from '../icons';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  label: string;
  /** Navigates like a normal link */
  href?: string;
  /** Called when the item is activated. Works with or without href. */
  onClick?: () => void;
}

export interface BreadcrumbProps {
  /** Trail from the top level down. The last item is the current page. */
  items: BreadcrumbItem[];
  /**
   * Shows the round back button before the trail. It goes to the item
   * before the current page, or calls onBack when given.
   * @default true
   */
  showBackButton?: boolean;
  /** Overrides what the back button does */
  onBack?: () => void;
  /**
   * Shows the current page (last item) at the end of the trail. Turn off when
   * a page title right below already names the page, as PageHeader does.
   * @default true
   */
  showCurrent?: boolean;
  /**
   * Accessible name for the navigation landmark
   * @default 'Breadcrumb'
   */
  'aria-label'?: string;
  className?: string;
}

/**
 * Breadcrumb
 *
 * The Figma Breadcrumb (20401:11320): a small round secondary back button and
 * gray links for the pages above this one, separated by chevrons. The last
 * item is the current page and carries aria-current="page". Long labels
 * truncate with an ellipsis.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Data', href: '/data' },
 *     { label: 'Connections', onClick: openConnections },
 *     { label: 'Snowflake prod' },
 *   ]}
 * />
 * ```
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(({
  items,
  showBackButton = true,
  onBack,
  showCurrent = true,
  'aria-label': ariaLabel = 'Breadcrumb',
  className,
}, ref) => {
  const parent = items.length > 1 ? items[items.length - 2] : undefined;
  const visible = showCurrent ? items : items.slice(0, -1);

  const goBack = () => {
    if (onBack) return onBack();
    if (!parent) return;
    if (parent.onClick) return parent.onClick();
    if (parent.href) window.location.assign(parent.href);
  };

  const canGoBack = Boolean(onBack || parent?.onClick || parent?.href);

  return (
    <nav ref={ref} aria-label={ariaLabel} className={[styles.root, className].filter(Boolean).join(' ')}>
      {showBackButton && canGoBack && (
        <Button
          variant="secondary"
          size="small"
          icon="arrow-left"
          iconOnly
          aria-label={parent ? `Back to ${parent.label}` : 'Back'}
          title={parent ? `Back to ${parent.label}` : 'Back'}
          className={styles.back}
          onClick={goBack}
        >
          Back
        </Button>
      )}
      {visible.length > 0 && (
        <ol className={styles.list}>
          {visible.map((item, i) => {
            const isCurrent = i === items.length - 1;
            const handleClick = item.onClick
              ? (e: MouseEvent<HTMLAnchorElement>) => {
                  if (!item.href) e.preventDefault();
                  item.onClick?.();
                }
              : undefined;
            const handleKeyDown = !item.href && item.onClick
              ? (e: KeyboardEvent<HTMLAnchorElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.onClick?.();
                  }
                }
              : undefined;
            return (
              <li key={`${item.label}-${i}`} className={styles.item}>
                {i > 0 && (
                  <span className={styles.separator} aria-hidden="true">
                    <Icon name="chevron-right" size="xs" />
                  </span>
                )}
                {isCurrent ? (
                  <span className={styles.current} aria-current="page" title={item.label}>
                    {item.label}
                  </span>
                ) : item.href || item.onClick ? (
                  <Link
                    color="gray"
                    href={item.href}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    role={item.href ? undefined : 'button'}
                    tabIndex={item.href ? undefined : 0}
                    className={styles.link}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.static} title={item.label}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

export default Breadcrumb;
