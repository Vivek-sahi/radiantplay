// Spotter — chat surface. Agentic conversation building blocks.

// Primitives
export { QuickAction } from './QuickAction';
export type { QuickActionProps } from './QuickAction';

export { QuickActionRow } from './QuickActionRow';
export type { QuickActionItem, QuickActionRowProps } from './QuickActionRow';

export { SpotterPrompt } from './SpotterPrompt';
export type { SpotterPromptProps, SpotterPromptMode } from './SpotterPrompt';

// Layout
export { ChatThread } from './ChatThread';
export type { ChatThreadProps } from './ChatThread';

export { MessageRow } from './MessageRow';
export type { MessageRowProps } from './MessageRow';

export { UserBubble } from './UserBubble';
export type { UserBubbleProps } from './UserBubble';

export { AgentMessage } from './AgentMessage';
export type { AgentMessageProps } from './AgentMessage';

export { TypingIndicator } from './TypingIndicator';
export type { TypingIndicatorProps } from './TypingIndicator';

export { ReasoningBlock } from './ReasoningBlock';
export type { ReasoningBlockProps } from './ReasoningBlock';

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
