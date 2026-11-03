import React from 'react';
import type { TextBlockData } from '../../runtime/schema';
import styles from './TextBlock.module.css';

export interface TextBlockProps {
  block: TextBlockData;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  return <p className={styles.text}>{block.text}</p>;
};

TextBlock.displayName = 'TextBlock';

export default TextBlock;
