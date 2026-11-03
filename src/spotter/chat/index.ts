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
export { PromptBar, PromptBarPlayground, DeepAnalysisGlyph } from './PromptBar';
export type {
  OpenMenu, ConnectorsPlacement, PromptBarMode, PromptBarState,
  Connector, ConnectorStatus,
} from './PromptBar';

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

export { Reasoning, ToolRow, SemiCollapsed, toolStepLabel } from './Reasoning';
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
} from './Reasoning';

export { ToolIcon } from './ToolIcons';

export { AgentResponseBlock } from './AgentResponseBlock';
export type { AgentResponseBlockProps } from './AgentResponseBlock';

// Block renderers (one per AnswerBlock kind)
export * from './blocks';

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
