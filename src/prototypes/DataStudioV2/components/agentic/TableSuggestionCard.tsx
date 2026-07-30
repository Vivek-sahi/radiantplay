import React, { useState } from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
import styles from './TableSuggestionCard.module.css';

/**
 * Agent's ranked table proposal — run-of-show S3/S4.
 *
 * The interaction is ported from surajboro-ts/spotter-readiness-vision
 * (`_agentic/SuggestionCard`); the payload is ours. Upstream's version also
 * carried column and formula variants — dropped here, because DataStudio adds
 * all columns by default and S14 is Maya writing the formula herself.
 *
 * Two departures from upstream:
 *  - `reasoning` on hover of the confidence badge. The script calls for it
 *    ("hover a score to see the agent's one-line reasoning") and upstream has
 *    no equivalent.
 *  - `name` must exist in the canvas TABLE_COLS catalogue — the agent can only
 *    propose tables the canvas can actually render.
 */

export interface TableProposal {
  /** Stable id for checkbox state. */
  id: string;
  /** Table name — must exist in TABLE_COLS or the canvas cannot place it. */
  name: string;
  /** One-line description shown under the name. */
  desc: string;
  /** Confidence 0–100, rendered as the badge. */
  pct: number;
  /** Why the agent picked it — revealed on badge hover. */
  reasoning: string;
  /** Which connection it came from, e.g. 'Snowflake'. */
  connection: string;
  /** Whether it starts ticked. Low-confidence rows start unticked (S3: billing_events at 38%). */
  checked: boolean;
}

export interface TableSuggestionCardProps {
  tables: TableProposal[];
  /** Fires with the ticked tables. Wire to the canvas append seam. */
  onAdd: (tables: TableProposal[]) => void;
  /** Frozen once committed, so earlier turns in the thread stay readable. */
  isReadOnly?: boolean;
  addLabel?: string;
}

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TableSuggestionCard: React.FC<TableSuggestionCardProps> = ({
  tables, onAdd, isReadOnly, addLabel = 'Add to model',
}) => {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(tables.filter(t => t.checked).map(t => t.id))
  );

  const toggle = (id: string) => {
    if (isReadOnly) return;
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selected = tables.filter(t => checked.has(t.id));

  return (
    <div className={styles.card}>
      <div className={`${styles.list} ${isReadOnly ? styles.readOnly : ''}`}>
        {tables.map(t => (
          <div
            key={t.id}
            className={styles.row}
            role="checkbox"
            aria-checked={checked.has(t.id)}
            aria-label={`${t.name} — ${t.pct}% confidence`}
            tabIndex={isReadOnly ? -1 : 0}
            onClick={() => toggle(t.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(t.id); }
            }}
          >
            <div className={`${styles.checkbox} ${!checked.has(t.id) ? styles.unchecked : ''}`}>
              <CheckIcon />
            </div>
            <div className={styles.rowText}>
              <span className={styles.rowName}>{t.name}</span>
              <span className={styles.rowDesc}>{t.desc}</span>
            </div>
            {/* title= carries the agent's reasoning on hover (S3). */}
            <span title={t.reasoning} style={{ display: 'flex', cursor: 'help' }}>
              <ConfidenceBadge pct={t.pct} />
            </span>
          </div>
        ))}
      </div>
      {!isReadOnly && (
        <div className={styles.footer}>
          <button
            className={styles.addBtn}
            disabled={selected.length === 0}
            onClick={() => onAdd(selected)}
          >
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
};
