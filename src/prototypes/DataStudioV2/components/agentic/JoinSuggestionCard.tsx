import React, { useState } from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
import { JoinDiagram, type Cardinality } from './JoinDiagram';
import styles from './TableSuggestionCard.module.css';
import { Button } from '../../../../components/Button';

/**
 * Agent's proposed joins — run-of-show S7.
 *
 * Same interaction as TableSuggestionCard (tick, inspect, commit), typed against
 * our join model. Upstream's JoinSuggestion carried a free-text `cardinality`
 * and no joinType; ours uses the canvas's own union types so an accepted
 * proposal maps straight onto InitialCanvasJoin with no interpretation.
 */

export interface JoinProposal {
  id: string;
  leftTable: string;
  leftCol: string;
  rightTable: string;
  rightCol: string;
  joinType: 'inner' | 'full_outer' | 'left_outer' | 'right_outer';
  cardinality: Cardinality;
  /** Confidence 0–100. */
  pct: number;
  /** Why the agent inferred this join — revealed on badge hover. */
  reasoning: string;
  checked: boolean;
  /** Set when the many-side could inflate aggregates. Surfaced on the diagram. */
  warnFanOut?: boolean;
}

export interface JoinSuggestionCardProps {
  joins: JoinProposal[];
  onAdd: (joins: JoinProposal[]) => void;
  isReadOnly?: boolean;
}

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const JoinSuggestionCard: React.FC<JoinSuggestionCardProps> = ({ joins, onAdd, isReadOnly }) => {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(joins.filter(j => j.checked).map(j => j.id))
  );

  const toggle = (id: string) => {
    if (isReadOnly) return;
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selected = joins.filter(j => checked.has(j.id));

  return (
    <div className={styles.card}>
      <div className={`${styles.list} ${isReadOnly ? styles.readOnly : ''}`}>
        {joins.map(j => (
          <div
            key={j.id}
            className={styles.row}
            role="checkbox"
            aria-checked={checked.has(j.id)}
            aria-label={`Join ${j.leftTable} to ${j.rightTable} — ${j.pct}% confidence`}
            tabIndex={isReadOnly ? -1 : 0}
            onClick={() => toggle(j.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(j.id); }
            }}
          >
            <div className={`${styles.checkbox} ${!checked.has(j.id) ? styles.unchecked : ''}`}>
              <CheckIcon />
            </div>
            <div className={styles.rowText}>
              <JoinDiagram
                leftTable={j.leftTable}
                leftCol={j.leftCol}
                rightTable={j.rightTable}
                rightCol={j.rightCol}
                cardinality={j.cardinality}
                joinType={j.joinType}
                warnFanOut={j.warnFanOut}
              />
            </div>
            <ConfidenceBadge pct={j.pct} reasoning={j.reasoning} />
          </div>
        ))}
      </div>
      {!isReadOnly && (
        <div className={styles.footer}>
          <Button variant="primary" size="basic" disabled={selected.length === 0} onClick={() => onAdd(selected)}>
            Create joins
          </Button>
        </div>
      )}
    </div>
  );
};
