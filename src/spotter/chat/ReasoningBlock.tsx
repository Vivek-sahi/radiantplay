import React, { useEffect, useState } from 'react';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import type {
  MessageStage,
  ReasoningStep,
  ReasoningToolCall,
  ReasoningTrace,
} from '../runtime/schema';
import styles from './ReasoningBlock.module.css';

export interface ReasoningBlockProps {
  reasoning?: ReasoningTrace;
  stage: MessageStage;
}

/**
 * Reasoning panel — has four visual states tied to the message lifecycle:
 *
 *   1. Streaming + semi-collapsed (default while streaming)
 *      Shows ONLY the current step (label + description) as a peek.
 *      Clicking expands the full trace up to the current step.
 *
 *   2. Streaming + expanded (user clicked)
 *      Full trace of every step streamed so far. Pending steps stay
 *      hidden until they activate.
 *
 *   3. Done + collapsed (default after streaming, with 600ms delay)
 *      Single "Thought for X seconds" trigger that re-expands the trace.
 *
 *   4. Done + expanded (user clicked, or briefly before auto-collapse)
 *      Full trace + duration footer.
 *
 * A user click on the trigger overrides the auto behaviour for the
 * remainder of this message's lifetime.
 *
 * When expanded, each step renders:
 *   - colored dot (gray pending, brand-blue pulsing current, gray done)
 *   - bold title
 *   - optional description body
 *   - optional embedded ToolcallCard with input / output
 *   - left-side connector line linking the dots
 */
export const ReasoningBlock: React.FC<ReasoningBlockProps> = ({
  reasoning,
  stage,
}) => {
  const isActive = stage === 'thinking' || stage === 'streaming';
  const [expanded, setExpanded] = useState(false);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    // Auto-expand briefly when reasoning settles, then collapse 600ms later.
    // A prior user click locks the panel in its chosen state.
    if (userToggled) return;
    if (stage === 'done' && reasoning?.isDone) {
      setExpanded(true);
      const t = setTimeout(() => setExpanded(false), 600);
      return () => clearTimeout(t);
    }
    // While streaming we stay in the semi-collapsed peek state.
    if (isActive) {
      setExpanded(false);
    }
  }, [stage, reasoning?.isDone, isActive, userToggled]);

  const handleToggle = (): void => {
    setUserToggled(true);
    setExpanded((prev) => !prev);
  };

  // Don't render until reasoning is actually set — avoids the trigger
  // appearing during the typing-only phase. TypingIndicator covers
  // that phase in AgentMessage.
  if (!reasoning) return null;

  const stepCount = reasoning.steps.length;
  // The "current" step during streaming is the last item in the array
  // (it gets pushed to 'current' by the reducer and stays last until the
  // next reasoning_step chunk arrives). When the array is empty we have
  // nothing to peek at yet.
  const currentStep: ReasoningStep | undefined =
    stepCount > 0 ? reasoning.steps[stepCount - 1] : undefined;
  const isDoneSettled = stage === 'done' && reasoning.isDone;
  const showSemiCollapsedPeek = isActive && !expanded && currentStep !== undefined;
  const showSteps = expanded && stepCount > 0;

  return (
    <div className={styles.reasoning}>
      {/*
        Unified brand-blue header. Text varies by state — current step
        label while streaming, "Thought for X seconds" once settled.
        Chevron flips based on expanded.
      */}
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse reasoning trace' : 'Expand reasoning trace'}
      >
        <span className={styles.headerTitle}>
          {isDoneSettled && reasoning.durationSeconds !== undefined
            ? `Thought for ${reasoning.durationSeconds} seconds`
            : currentStep?.label ?? 'Show work'}
        </span>
        <span className={styles.headerChevron} data-expanded={expanded} aria-hidden="true">
          <Icon name="chevron-down" size="s" />
        </span>
      </button>
      {/*
        Peek body — current step description with a left guideline.
        Stays mounted while we have a current step description so the
        transition to the done state can ease out (opacity + max-height)
        instead of unmounting instantly. data-visible drives the CSS.
      */}
      {currentStep?.description && (
        <p
          className={styles.peekDescription}
          data-visible={showSemiCollapsedPeek}
          aria-hidden={!showSemiCollapsedPeek}
        >
          {currentStep.description}
        </p>
      )}
      {/*
        Steps container stays MOUNTED. Visibility flips via `data-expanded`
        so the height/opacity transition can animate collapse/expand smoothly.
      */}
      <div className={styles.steps} data-expanded={showSteps}>
        {reasoning.steps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            isLast={
              index === stepCount - 1 && reasoning.durationSeconds === undefined
            }
            animationDelay={index * 80}
          />
        ))}
        {reasoning.isDone && reasoning.durationSeconds !== undefined && (
          <div className={styles.workedFor}>
            <div className={styles.dotColumn}>
              <span
                className={styles.dot}
                data-status="done"
                aria-hidden="true"
              />
            </div>
            <p className={styles.workedForBody}>
              Thought for {reasoning.durationSeconds} seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

ReasoningBlock.displayName = 'ReasoningBlock';

// ---------- StepRow ----------

interface StepRowProps {
  step: ReasoningStep;
  isLast: boolean;
  animationDelay: number;
}

const StepRow: React.FC<StepRowProps> = ({ step, isLast, animationDelay }) => {
  return (
    <div className={styles.step} style={{ animationDelay: `${animationDelay}ms` }}>
      <div className={styles.dotColumn}>
        {!isLast && <span className={styles.connector} aria-hidden="true" />}
        <span className={styles.dot} data-status={step.status} aria-hidden="true" />
      </div>
      <div className={styles.body}>
        <h4 className={styles.title}>{step.label}</h4>
        {step.description && <p className={styles.description}>{step.description}</p>}
        {step.toolcall && <ToolcallCard toolcall={step.toolcall} />}
      </div>
    </div>
  );
};

const looksLikeJson = (s: string): boolean => {
  const trimmed = s.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

// ---------- ToolcallCard ----------

const ToolcallCard: React.FC<{ toolcall: ReasoningToolCall }> = ({ toolcall }) => {
  const [open, setOpen] = useState(false);
  const hasBody = toolcall.input !== undefined || toolcall.output !== undefined;

  return (
    <div className={styles.toolcall}>
      <button
        type="button"
        className={styles.toolcallHeader}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <span className={styles.toolcallIcon} aria-hidden="true">
          <Icon name={(toolcall.icon as IconName) ?? 'search'} size="s" />
        </span>
        <span className={styles.toolcallTitle}>{toolcall.title}</span>
        {hasBody && (
          <span className={styles.toolcallShowDetails}>
            <span>Show details</span>
            <span className={styles.toolcallChevron} data-expanded={open}>
              <Icon name="chevron-down" size="s" />
            </span>
          </span>
        )}
      </button>
      {hasBody && (
        <div className={styles.toolcallBody} data-open={open}>
          {toolcall.input !== undefined && (
            <div className={styles.toolcallSection}>
              <span className={styles.toolcallLabel}>Input:</span>
              <pre className={styles.toolcallValue}>{toolcall.input}</pre>
            </div>
          )}
          {toolcall.output !== undefined && (
            <div className={styles.toolcallSection}>
              <span className={styles.toolcallLabel}>Output:</span>
              <pre className={styles.toolcallValue}>
                {looksLikeJson(toolcall.output) && (
                  <span className={styles.toolcallValueLang}>JSON</span>
                )}
                {toolcall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReasoningBlock;
