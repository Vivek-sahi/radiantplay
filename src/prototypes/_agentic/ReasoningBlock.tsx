import React, { useState } from 'react';
import styles from './ReasoningBlock.module.css';
import { ToolcallCard, ToolcallData } from './ToolcallCard';

export interface ReasoningStep {
  n: number;
  name: string;
  text: string;
  dotState: 'current' | 'done' | 'none';
  toolcall?: ToolcallData;
}

export interface ReasoningData {
  header: string;
  steps: ReasoningStep[];
  isDone: boolean;
  inlineText: string;
}

interface ReasoningBlockProps {
  data: ReasoningData;
}

export const ReasoningBlock: React.FC<ReasoningBlockProps> = ({ data }) => {
  const [isBoxOpen, setBoxOpen] = useState(false);

  const isDone = data.isDone;
  const blockClass = [
    styles.block,
    isDone ? styles.doneState : '',
    isBoxOpen ? styles.boxOpen : '',
    isDone && !isBoxOpen ? styles.collapsed : '',
  ].filter(Boolean).join(' ');

  const handleHeaderClick = () => {
    setBoxOpen(prev => !prev);
  };

  return (
    <div className={blockClass}>
      <div className={styles.header} onClick={handleHeaderClick}>
        <span className={styles.headerText}>{data.header}</span>
        <svg className={styles.chevron} viewBox="0 0 16 16" fill="none" width="14" height="14">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Inline body — current step, collapsed when box open or done */}
      <div className={`${styles.inlineBody} ${(isBoxOpen || isDone) ? styles.hidden : ''}`}>
        <div className={styles.inlineBodyInner}>
          <div className={styles.inlineVline} />
          <div className={styles.inlineContent}>
            <p className={styles.inlineStepText}>{data.inlineText}</p>
          </div>
        </div>
      </div>

      {/* Box view — expanded steps */}
      <div className={`${styles.boxView} ${isBoxOpen ? styles.boxViewOpen : ''}`}>
        <div className={styles.box}>
          {data.steps.map((step, i) => (
            <StepItem key={step.n} step={step} isLast={i === data.steps.length - 1 && !isDone} />
          ))}
          {isDone && (
            <div className={styles.workDone}>
              <span className={`${styles.stepDot} ${styles.doneDot}`} />
              <span className={`${styles.stepName} ${styles.stepNameVisible}`}>Work done</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StepItemProps {
  step: ReasoningStep;
  isLast: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ step }) => {
  const dotClass = [
    styles.stepDot,
    styles.stepDotPop,
    step.dotState === 'current' ? styles.currentDot : '',
    step.dotState === 'done' ? styles.doneDot : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.step}>
      <div className={styles.stepTitle}>
        <span className={dotClass} />
        <span className={`${styles.stepName} ${styles.stepNameVisible}`}>{step.name}</span>
      </div>
      <div className={styles.stepBody}>
        <div className={`${styles.stepVline} ${styles.extend}`} />
        <div className={styles.stepContent}>
          <p className={styles.stepText}>{step.text}</p>
          {step.toolcall && <ToolcallCard data={step.toolcall} />}
        </div>
      </div>
    </div>
  );
};
