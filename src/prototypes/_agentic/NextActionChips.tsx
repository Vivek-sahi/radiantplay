import React from 'react';
import styles from './NextActionChips.module.css';

export interface ChipItem {
  text: string;
  variant?: 'default' | 'enrich';
}

interface NextActionChipsProps {
  chips: ChipItem[];
  onChipClick: (text: string) => void;
}

export const NextActionChips: React.FC<NextActionChipsProps> = ({ chips, onChipClick }) => (
  <div className={styles.chips}>
    {chips.map((chip, i) => (
      <button
        key={i}
        className={`${styles.chip} ${chip.variant === 'enrich' ? styles.enrich : ''}`}
        onClick={() => onChipClick(chip.text)}
      >
        {chip.text}
      </button>
    ))}
  </div>
);
