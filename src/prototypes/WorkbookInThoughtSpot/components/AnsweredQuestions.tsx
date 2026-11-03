import React from 'react';
import { spacing } from '@tokens/spacing';
import { fontFamily, fontSize } from '@tokens/typography';

// Answered clarifying questions, collapsed (Figma 762-3904): one quiet card
// holding each question in grey with its answer under it, sitting above the
// turn that used them.

const TEXT_PRIMARY = 'var(--rd-sys-color-content-primary)';
const TEXT_SECONDARY = 'var(--rd-sys-color-content-secondary)';
/** The radius every card in this thread wears. Between the lg and xl tokens,
 *  which is where this prototype's response cards have always sat — the plan
 *  cards were on lg and read as a different kind of object stacked under the
 *  answers. Exported so they cannot drift apart again. */
export const THREAD_CARD_RADIUS = 10;

const BORDER = 'var(--rd-sys-color-border-divider)';
const SURFACE = 'var(--rd-sys-color-background-base)';

export interface AnsweredPair {
  question: string;
  answer: string;
}

export const AnsweredQuestions: React.FC<{ pairs: AnsweredPair[] }> = ({ pairs }) => {
  if (pairs.length === 0) return null;
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: THREAD_CARD_RADIUS,
      padding: `${spacing.C}px ${spacing.D}px`,
      display: 'flex', flexDirection: 'column', gap: spacing.B,
    }}>
      {pairs.map(pair => (
        <div key={pair.question} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontFamily: fontFamily.primary, fontSize: fontSize.sm,
            lineHeight: '20px', color: TEXT_SECONDARY,
          }}>
            {pair.question}
          </span>
          <span style={{
            fontFamily: fontFamily.primary, fontSize: fontSize.md,
            lineHeight: '22px', color: TEXT_PRIMARY,
          }}>
            {pair.answer}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AnsweredQuestions;
