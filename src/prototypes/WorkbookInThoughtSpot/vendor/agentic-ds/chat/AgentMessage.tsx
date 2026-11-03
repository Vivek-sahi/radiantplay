import React, { useMemo, useState } from 'react';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import type { IconName } from '@components/icons';
import type { ChatMessage, ReasoningTrace } from '../runtime/schema';
import { ReasoningBlock } from './ReasoningBlock';
import { Reasoning, type ReasoningItem } from './Reasoning';
import { TypingIndicator } from './TypingIndicator';
import { AgentResponseBlock } from './AgentResponseBlock';
import styles from './AgentMessage.module.css';

/**
 * The wire format's reasoning trace, as the timeline needs it.
 *
 * The two models disagree on shape by one level. A `ReasoningStep` is a labelled
 * block that may carry a tool call; a `ReasoningItem` is either prose or a tool,
 * never both. So a step with a tool call becomes two items, and the label rides
 * along as the prose item's summary header — which is what the collapsed
 * timeline shows while the agent is working.
 *
 * The other two return values are what make it animate. `Reasoning` doesn't
 * schedule anything itself: it renders the first `visibleCount` items and treats
 * any tool outside `loadedToolIds` as still running. Both are derived from the
 * step statuses the reducer already tracks, so the timeline advances as the
 * stream arrives rather than on a second clock of its own.
 */
const toReasoning = (
  trace: ReasoningTrace
): { items: ReasoningItem[]; visibleCount: number; loadedToolIds: Set<string> } => {
  const items: ReasoningItem[] = [];
  const loadedToolIds = new Set<string>();
  let visibleCount = 0;

  for (const step of trace.steps) {
    const stepItems: ReasoningItem[] = [
      { kind: 'text', id: step.id, text: step.description ?? '', summaryHeader: step.label },
    ];
    if (step.toolcall) {
      stepItems.push({
        kind: 'tool',
        id: step.toolcall.id,
        title: step.toolcall.title,
        doneTitle: step.toolcall.doneTitle,
        // The tool glyph is preferred — a Radiant icon is the fallback for
        // tools that have no execution-flavoured equivalent.
        toolIcon: step.toolcall.toolIcon,
        icon: step.toolcall.toolIcon ? undefined : (step.toolcall.icon as IconName | undefined),
        input: step.toolcall.input,
        output: step.toolcall.output,
      });
    }
    items.push(...stepItems);

    // A pending step has not been reached yet, so it stays out of the reveal —
    // otherwise every step's marker appears at once, before the agent has got
    // there.
    if (step.status !== 'pending') visibleCount += stepItems.length;
    // A tool stops shimmering only when its own step resolves.
    if (step.status === 'done' && step.toolcall) loadedToolIds.add(step.toolcall.id);
  }

  return { items, visibleCount, loadedToolIds };
};

export interface AgentMessageProps {
  message: ChatMessage;
  /**
   * Avatar glyph for the agent. Defaults to the Spotter brand icon.
   * Pass a Radiant icon name for built-in glyphs, or a ReactNode for custom.
   */
  avatarIcon?: IconName | React.ReactNode;
  /**
   * Legacy prop — initial letter for the avatar. When provided overrides
   * the icon. Kept for forward-compat with the Custom Spotter "B" pattern.
   */
  initial?: string;
  /**
   * `classic` (default) is the avatar + body row the Spotter prototype uses.
   * `refresh` is the Spotter refresh turn: no avatar, the Reasoning timeline,
   * the response inset 16px and the four-action response footer.
   */
  look?: 'classic' | 'refresh';
}

const renderAvatar = (
  initial: string | undefined,
  icon: AgentMessageProps['avatarIcon'],
): React.ReactNode => {
  if (initial) return <span>{initial}</span>;
  if (typeof icon === 'string') return <Icon name={icon as IconName} size="m" />;
  if (icon) return icon;
  return <Icon name="ai" size="m" />;
};

/**
 * The response footer — thumbs up/down, copy, verify.
 *
 * Product-canonical at four actions. Tertiary icon buttons default to the brand
 * colour, so `footerBtn` pulls them back to content-secondary.
 */
const ResponseFooter: React.FC = () => (
  <div className={styles.footer}>
    <Button
      variant="tertiary"
      size="small"
      iconOnly
      icon="thumb-up"
      title="Good response"
      className={styles.footerBtn}
    >
      Good response
    </Button>
    <Button
      variant="tertiary"
      size="small"
      iconOnly
      icon="thumb-down"
      title="Bad response"
      className={styles.footerBtn}
    >
      Bad response
    </Button>
    <Button
      variant="tertiary"
      size="small"
      iconOnly
      icon="copy"
      title="Copy"
      className={styles.footerBtn}
    >
      Copy
    </Button>
    <Button
      variant="tertiary"
      size="small"
      iconOnly
      icon="double-check"
      title="Verify"
      className={styles.footerBtn}
    >
      Verify
    </Button>
  </div>
);

const RefreshAgentMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const { items, visibleCount, loadedToolIds } = useMemo(
    () =>
      message.reasoning
        ? toReasoning(message.reasoning)
        : { items: [], visibleCount: 0, loadedToolIds: new Set<string>() },
    [message.reasoning]
  );

  // Closed, and it stays closed until the reader opens it. Collapsed is not an
  // empty state for this component: while the agent works it shows the latest
  // step on its own, which is the whole point of the collapsed treatment.
  // Forcing it open during the run replaces that with a wall of steps.
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.refreshBody}>
      {/* No separate "thinking" indicator: the reasoning block owns that state.
          With nothing revealed yet it renders its own bouncing dots, so the
          agent spinning up and the agent working are one continuous element
          rather than a spinner that swaps out for a different component. */}
      {items.length > 0 && (
        <Reasoning
          items={items}
          visibleCount={visibleCount}
          loadedToolIds={loadedToolIds}
          status={message.reasoning?.isDone ? 'done' : 'running'}
          expanded={expanded}
          onToggleExpanded={() => setExpanded((e) => !e)}
        />
      )}
      <AgentResponseBlock content={message.content} inset />
      {message.stage === 'error' && message.error && (
        <div className={styles.error} role="alert">
          {message.error}
        </div>
      )}
      {message.stage === 'done' &&
        message.content &&
        message.content.blocks.length > 0 && <ResponseFooter />}
    </div>
  );
};

export const AgentMessage: React.FC<AgentMessageProps> = ({
  message,
  avatarIcon,
  initial,
  look = 'classic',
}) => {
  if (look === 'refresh') return <RefreshAgentMessage message={message} />;

  // Pre-reasoning: show a typing indicator until the first chunk arrives.
  const showTyping = message.stage === 'thinking' && !message.reasoning;

  return (
    <div className={styles.row}>
      <span className={styles.avatar} aria-hidden="true">
        {renderAvatar(initial, avatarIcon)}
      </span>
      <div className={styles.body}>
        {showTyping && <TypingIndicator />}
        <ReasoningBlock reasoning={message.reasoning} stage={message.stage} />
        <AgentResponseBlock content={message.content} />
        {message.stage === 'error' && message.error && (
          <div className={styles.error} role="alert">
            {message.error}
          </div>
        )}
        {message.stage === 'done' &&
          message.content &&
          message.content.blocks.length > 0 && <FeedbackRow />}
      </div>
    </div>
  );
};

AgentMessage.displayName = 'AgentMessage';

const FeedbackRow: React.FC = () => {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  return (
    <div className={styles.feedback}>
      <span className={styles.feedbackLabel}>Is this useful?</span>
      <button
        type="button"
        className={styles.feedbackBtn}
        data-active={vote === 'up'}
        onClick={() => setVote((v) => (v === 'up' ? null : 'up'))}
        aria-label="Useful"
        aria-pressed={vote === 'up'}
      >
        <Icon name="thumb-up" size="s" />
      </button>
      <button
        type="button"
        className={styles.feedbackBtn}
        data-active={vote === 'down'}
        onClick={() => setVote((v) => (v === 'down' ? null : 'down'))}
        aria-label="Not useful"
        aria-pressed={vote === 'down'}
      >
        <Icon name="thumb-down" size="s" />
      </button>
    </div>
  );
};

export default AgentMessage;
