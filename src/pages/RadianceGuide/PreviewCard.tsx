import React, { useState } from 'react';
import { Button } from '@components/Button';
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
  code?: string;
  /** A ready prompt for Claude, shown under the stage with a Copy button (instead of code). */
  prompt?: string;
  footnote?: React.ReactNode;
}

/** The prompt a designer pastes into Claude, with a Copy button. */
const PromptBox: React.FC<{ prompt: string }> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, () => {});
  };
  return (
    <div className={styles.prompt}>
      <div className={styles.promptText}>
        <span className={styles.promptLabel}>Ask Claude in your RadiantPlay project</span>
        <p className={styles.promptBody}>{prompt}</p>
      </div>
      <Button variant="secondary" size="small" onClick={copy}>{copied ? 'Copied' : 'Copy prompt'}</Button>
    </div>
  );
};

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
  prompt,
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

    {prompt ? <PromptBox prompt={prompt} /> : code && <CodeLine code={code} />}
    {footnote && <p className={styles.footnote}>{footnote}</p>}
  </article>
);
