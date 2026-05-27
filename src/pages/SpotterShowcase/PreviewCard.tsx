import React, { useState } from 'react';
import { Tabs } from '@components/Tabs';
import styles from './PreviewCard.module.css';

export interface PreviewVariant {
  label: string;
  node: React.ReactNode;
  description?: string;
}

export interface PreviewCardProps {
  name: string;
  path?: string;
  description?: string;
  variants: PreviewVariant[];
  /** Render as a "planned" ghosted placeholder instead of live previews. */
  planned?: boolean;
  plannedHint?: string;
  /**
   * When true and variants.length > 1, render variants in a Radiant Tabs
   * switcher (only one visible at a time). Matches the GlobalHeader doc-page
   * pattern. Single-variant cards ignore this flag.
   */
  useTabs?: boolean;
  /**
   * When set, shows a "View fullscreen ↗" link in the card header that
   * opens the given path (typically a no-chrome route that renders the
   * component at full viewport).
   */
  fullSizeHref?: string;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  name,
  path,
  description,
  variants,
  planned = false,
  plannedHint,
  useTabs = false,
  fullSizeHref,
}) => {
  const [activeTab, setActiveTab] = useState<string>(variants[0]?.label ?? '');
  const shouldTab = useTabs && variants.length > 1;
  const activeVariant = shouldTab
    ? variants.find((v) => v.label === activeTab) ?? variants[0]
    : null;
  return (
    <article className={styles.card} id={name.toLowerCase()}>
      <header className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        {path && <code className={styles.path}>{path}</code>}
        {planned && <span className={styles.plannedBadge}>Planned</span>}
        {fullSizeHref && (
          <a className={styles.fullSizeLink} href={fullSizeHref} target="_blank" rel="noreferrer">
            View fullscreen ↗
          </a>
        )}
      </header>
      {description && <p className={styles.description}>{description}</p>}

      {planned ? (
        <div className={styles.plannedSlot}>
          <p className={styles.plannedText}>
            {plannedHint ?? 'Component is planned but not yet in code. See spotter-components.md → Planned components.'}
          </p>
        </div>
      ) : shouldTab && activeVariant ? (
        <div className={styles.tabbed}>
          <Tabs
            tabs={variants.map((v) => ({ id: v.label, label: v.label }))}
            activeTab={activeTab || variants[0].label}
            onTabChange={setActiveTab}
          />
          <section className={styles.variant}>
            {activeVariant.description && (
              <div className={styles.variantHeader}>
                <span className={styles.variantDescription}>{activeVariant.description}</span>
              </div>
            )}
            <div className={styles.variantStage}>
              <div className={styles.stageInner}>{activeVariant.node}</div>
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.variants}>
          {variants.map((variant) => (
            <section key={variant.label} className={styles.variant}>
              <div className={styles.variantHeader}>
                <span className={styles.variantLabel}>{variant.label}</span>
                {variant.description && (
                  <span className={styles.variantDescription}>{variant.description}</span>
                )}
              </div>
              <div className={styles.variantStage}>
                <div className={styles.stageInner}>{variant.node}</div>
              </div>
            </section>
          ))}
        </div>
      )}
    </article>
  );
};
