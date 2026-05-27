import React from 'react';
import type { AnswerBlock, AnswerContent } from '../runtime/schema';
import {
  TextBlock,
  VizBlock,
  SourcesBlock,
  FollowUpsBlock,
  RefineBlock,
  ErrorBlock,
} from './blocks';
import styles from './AgentResponseBlock.module.css';

export interface AgentResponseBlockProps {
  content?: AnswerContent;
}

/**
 * Renders an `AnswerContent` as a stack of typed block views.
 * Block-renderer dispatcher — add new block kinds in ./blocks/.
 */
export const AgentResponseBlock: React.FC<AgentResponseBlockProps> = ({ content }) => {
  if (!content) return null;
  if (content.blocks.length === 0 && !content.title) return null;

  return (
    <div className={styles.response}>
      {content.title && <h3 className={styles.title}>{content.title}</h3>}
      {content.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
};

AgentResponseBlock.displayName = 'AgentResponseBlock';

const BlockRenderer: React.FC<{ block: AnswerBlock }> = ({ block }) => {
  switch (block.kind) {
    case 'text':
      return <TextBlock block={block} />;
    case 'viz':
      return <VizBlock block={block} />;
    case 'sources':
      return <SourcesBlock block={block} />;
    case 'followups':
      return <FollowUpsBlock block={block} />;
    case 'refine':
      return <RefineBlock block={block} />;
    case 'error':
      return <ErrorBlock block={block} />;
  }
};
