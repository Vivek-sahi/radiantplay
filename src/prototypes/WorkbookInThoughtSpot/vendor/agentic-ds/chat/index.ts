// Spotter — chat surface. Agentic conversation building blocks.

// Primitives
export { QuickAction } from './QuickAction';
export type { QuickActionProps } from './QuickAction';

export { QuickActionRow } from './QuickActionRow';
export type { QuickActionItem, QuickActionRowProps } from './QuickActionRow';

export { SpotterPrompt } from './SpotterPrompt';
export type { SpotterPromptProps, SpotterPromptMode } from './SpotterPrompt';

// Both composers ship until the composer decision (adoption plan §8.1): SpotterPrompt
// carries the mode toggle + data-model picker, PromptBar model/skills/connectors.
// `PromptBarCore` is the same component under the name the Spotter refresh
// hosts use (it is also the default export).
export { PromptBar, PromptBar as PromptBarCore, PromptBarPlayground, DeepAnalysisGlyph } from './PromptBar';
export type {
  OpenMenu, ConnectorsPlacement, PromptBarMode, PromptBarState,
  Connector, ConnectorStatus, PromptBarCoreProps, PromptBarConnector, ActionAppearance,
} from './PromptBar';

// The chat grid — 800px column, 24px gutters and side margins. Refresh
// surfaces that render a thread read their width from here.
export { CHAT_GRID, OBJECT_GRID } from './grid';

// Layout
export { ChatThread } from './ChatThread';
export type { ChatThreadProps } from './ChatThread';

export { MessageRow } from './MessageRow';
export type { MessageRowProps } from './MessageRow';

export { UserBubble } from './UserBubble';
export type { UserBubbleProps } from './UserBubble';

export { UserMessage, FileCard } from './UserMessage';
export type { UserMessageProps, UserMessageFile, UserMessageState } from './UserMessage';

export { useSquirclePath } from './useSquirclePath';
export { getSvgPath as getSquirclePath } from './figmaSquircle';

export { AgentMessage } from './AgentMessage';
export type { AgentMessageProps } from './AgentMessage';

export { TypingIndicator } from './TypingIndicator';
export type { TypingIndicatorProps } from './TypingIndicator';

export { ReasoningBlock, reasoningTraceToItems } from './ReasoningBlock';
export type { ReasoningBlockProps, ReasoningItemsModel } from './ReasoningBlock';

export { Reasoning, ToolRow, SemiCollapsed, ClarifyAnswersCard, toolStepLabel } from './Reasoning';
export type {
  ReasoningProps,
  SemiCollapsedProps,
  LatestStep,
  ReasoningItem,
  ToolCall,
  CodeExecution,
  ChartToken,
  ChartViz,
  NestLabels,
  ClarifyExchange,
} from './Reasoning';

export { ToolIcon } from './ToolIcons';
export type { ToolIconName } from './ToolIcons';

export { AgentResponseBlock } from './AgentResponseBlock';
export type { AgentResponseBlockProps } from './AgentResponseBlock';

// Clarifying questions — the agent pauses mid-run to ask (human in the loop).
export {
  ClarifyingQuestion,
  CLARIFY_EXIT_MS,
  CLARIFY_SAMPLES,
  buildClarifySteps,
} from './ClarifyingQuestion';
export type {
  ClarifyingQuestionProps,
  ClarifyStep,
  ClarifyAnswer,
  ClarifySelectMode,
} from './ClarifyingQuestion';
export { ClarifyingQuestionFlow, DOT_MOTION } from './ClarifyingQuestionFlow';
export type { ClarifyFlowVariant } from './ClarifyingQuestionFlow';

// Block renderers (one per AnswerBlock kind)
export * from './blocks';

// Response formatting — the frozen markdown spec.
export * from './formatting';

// State (provider + hook + reducer types)
export {
  SpotterChatProvider,
  SpotterChatContext,
} from './SpotterChatProvider';
export type {
  SpotterChatProviderProps,
  SpotterChatContextValue,
} from './SpotterChatProvider';

export { useSpotterChat } from './useSpotterChat';

export {
  chatReducer,
  initialChatState,
} from './chatReducer';
export type { ChatState, ChatAction } from './chatReducer';
