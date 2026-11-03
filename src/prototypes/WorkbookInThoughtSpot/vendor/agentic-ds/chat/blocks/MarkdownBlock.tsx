import React from 'react';
import type { MarkdownBlockData } from '../../runtime/schema';
import { SpotterMarkdown } from '../formatting';

export interface MarkdownBlockProps {
  block: MarkdownBlockData;
}

/**
 * A formatted response body, rendered to the frozen formatting spec — the type
 * scale, the list treatment, and the grid table with vertical rules and row
 * hover.
 */
export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({ block }) => (
  <SpotterMarkdown html={block.html} />
);

MarkdownBlock.displayName = 'MarkdownBlock';

export default MarkdownBlock;
