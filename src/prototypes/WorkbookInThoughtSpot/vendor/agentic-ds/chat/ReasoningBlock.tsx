import React, { useEffect, useMemo, useState } from 'react';
import type {
  MessageStage,
  ReasoningItem,
  ReasoningTrace,
} from '../runtime/schema';
import { Reasoning } from './Reasoning';

export interface ReasoningBlockProps {
  reasoning?: ReasoningTrace;
  stage: MessageStage;
}

/**
 * Renders a runtime ReasoningTrace with the shared Reasoning timeline.
 *
 * This is the adapter between the reducer's step model (label / description /
 * status / toolcall) and the timeline's flat item model (text rows and tool
 * rows). Consumers that already hold a ChatMessage keep using this; new code
 * that owns its own item list should render `Reasoning` directly.
 *
 * Lifecycle, unchanged from the original block:
 *   - while the agent works the timeline stays semi-collapsed, showing only
 *     the latest step;
 *   - when reasoning settles it expands briefly, then collapses to
 *     "Show work" 600ms later;
 *   - a user click locks the panel in its chosen state for the rest of the
 *     message's lifetime.
 */
export const ReasoningBlock: React.FC<ReasoningBlockProps> = ({
  reasoning,
  stage,
}) => {
  const isActive = stage === 'thinking' || stage === 'streaming';
  const [expanded, setExpanded] = useState(false);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    if (userToggled) return;
    if (stage === 'done' && reasoning?.isDone) {
      setExpanded(true);
      const t = setTimeout(() => setExpanded(false), 600);
      return () => clearTimeout(t);
    }
    if (isActive) {
      setExpanded(false);
    }
  }, [stage, reasoning?.isDone, isActive, userToggled]);

  const model = useMemo(() => reasoningTraceToItems(reasoning), [reasoning]);

  const handleToggle = (): void => {
    setUserToggled(true);
    setExpanded((prev) => !prev);
  };

  // Nothing to show until the first reasoning chunk arrives; TypingIndicator
  // covers that phase in AgentMessage.
  if (!reasoning) return null;

  return (
    <Reasoning
      items={model.items}
      visibleCount={model.visibleCount}
      loadedToolIds={model.loadedToolIds}
      status={reasoning.isDone ? 'done' : 'running'}
      expanded={expanded}
      onToggleExpanded={handleToggle}
      doneLabel={
        reasoning.durationSeconds !== undefined
          ? `Thought for ${reasoning.durationSeconds} seconds`
          : undefined
      }
    />
  );
};

ReasoningBlock.displayName = 'ReasoningBlock';

export interface ReasoningItemsModel {
  items: ReasoningItem[];
  /** Items belonging to steps that have started (not 'pending'). */
  visibleCount: number;
  /** Tool ids whose step has finished. */
  loadedToolIds: Set<string>;
}

/**
 * Flatten a step trace into timeline items. Each step yields a text row
 * (its description, headed by its label) and, when it carries a toolcall, a
 * tool row after it. Pending steps are appended but not counted as visible,
 * so the timeline streams them in as the reducer advances.
 */
export function reasoningTraceToItems(trace?: ReasoningTrace): ReasoningItemsModel {
  const items: ReasoningItem[] = [];
  const loadedToolIds = new Set<string>();
  let visibleCount = 0;
  if (!trace) return { items, visibleCount, loadedToolIds };

  for (const step of trace.steps) {
    const before = items.length;
    items.push({
      kind: 'text',
      id: step.id,
      text: step.description ?? step.label,
      summaryHeader: step.label,
    });
    if (step.toolcall) {
      items.push({ kind: 'tool', ...step.toolcall });
      if (step.status === 'done') loadedToolIds.add(step.toolcall.id);
    }
    if (step.status !== 'pending') visibleCount = items.length;
    else if (before === 0) visibleCount = 0;
  }
  return { items, visibleCount, loadedToolIds };
}

export default ReasoningBlock;
