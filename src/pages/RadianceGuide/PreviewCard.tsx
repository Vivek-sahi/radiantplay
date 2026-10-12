import React from 'react';
import { CodeLine } from './CodeBlock';
import styles from './PreviewCard.module.css';

/**
 * A Radiance preview card, built like the Spotter DS page's PreviewCard: name,
 * path chip, description, then a framed live stage. The stage has no padding
 * so the surface fills it, and its header carries the card's own controls.
 */
export interface PreviewCardProps {
  id: string;
  name: string;
  path: string;
  /** Short badge after the path, such as "Fixed". */
  badge?: string;
  description: React.ReactNode;
  /** Label shown in the stage header. */
  stageLabel: string;
  stageNote?: string;
  /** Controls rendered at the right of the stage header. */
  controls?: React.ReactNode;
  /** The live surface. Gets a 280px stage. */
  preview: React.ReactNode;
  /** One line of code, shown under the stage. */
  code: string;
  footnote?: React.ReactNode;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  id,
  name,
  path,
  badge,
  description,
  stageLabel,
  stageNote,
  controls,
  preview,
  code,
  footnote,
}) => (
  <article className={styles.card} id={id}>
    <header className={styles.header}>
      <h3 className={styles.name}>{name}</h3>
      <code className={styles.path}>{path}</code>
      {badge && <span className={styles.badge}>{badge}</span>}
    </header>
    <p className={styles.description}>{description}</p>

    <section className={styles.variant}>
      <div className={styles.variantHeader}>
        <div className={styles.variantText}>
          <span className={styles.variantLabel}>{stageLabel}</span>
          {stageNote && <span className={styles.variantDescription}>{stageNote}</span>}
        </div>
        {controls && <div className={styles.controls}>{controls}</div>}
      </div>
      {preview}
    </section>

    <CodeLine code={code} />
    {footnote && <p className={styles.footnote}>{footnote}</p>}
  </article>
);
