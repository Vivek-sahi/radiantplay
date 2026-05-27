import React from 'react';
import styles from './AgentResponseBlock.module.css';
import { SuggestionCard } from './SuggestionCard';
import { NextActionChips } from './NextActionChips';
import { VersionCard } from './VersionCard';
import type { ResponseData, SuggType } from './types';

interface AgentResponseBlockProps {
  data: ResponseData;
  isReadOnly?: boolean;
  onAddToModel: (suggType: SuggType, items: unknown[]) => void;
  onRefine: (suggType: SuggType) => void;
  onChipClick: (text: string) => void;
  onRestoreVersion: (num: number) => void;
}

export const AgentResponseBlock: React.FC<AgentResponseBlockProps> = ({
  data, isReadOnly, onAddToModel, onRefine, onChipClick, onRestoreVersion,
}) => {
  const hasSuggCard = data.suggType === 'tables' || data.suggType === 'joins'
    || data.suggType === 'columns' || data.suggType === 'formulas';

  const clarifyLines = data.clarifyQuestions ?? [];

  return (
    <div className={`${styles.block} ${data.isVisible ? styles.visible : ''}`}>
      {data.text && <p className={styles.text}>{data.text}</p>}

      {clarifyLines.length > 0 && (
        <div className={styles.clarifyList}>
          {clarifyLines.map((q, i) => (
            <div key={i} className={styles.clarifyQ}>
              <span className={styles.clarifyNum}>{i + 1}.</span>
              <span className={styles.clarifyText}>{q}</span>
            </div>
          ))}
        </div>
      )}

      {data.versionCard && (
        <VersionCard
          versionNum={data.versionCard.versionNum}
          label={data.versionCard.label}
          isLatest={data.versionCard.isLatest}
          isDisabled={data.versionCard.isDisabled}
          onRestore={onRestoreVersion}
        />
      )}

      {hasSuggCard && data.suggType && (
        <SuggestionCard
          suggType={data.suggType as SuggType}
          tables={data.tables}
          joins={data.joins}
          columnGroups={data.columnGroups}
          formulas={data.formulas}
          isReadOnly={isReadOnly}
          onAdd={onAddToModel}
          onRefine={onRefine}
        />
      )}

      {data.chips && data.chips.length > 0 && (
        <NextActionChips chips={data.chips} onChipClick={onChipClick} />
      )}
    </div>
  );
};
