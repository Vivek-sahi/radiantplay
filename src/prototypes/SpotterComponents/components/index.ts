/**
 * Spotter components — single import point.
 *
 * Import everything from here, never from the individual files:
 *
 *   import { Reasoning, UserMessage, PromptBar } from '.../SpotterComponents/components'
 *
 * Why: when these components are promoted into the shared Spotter DS
 * (src/spotter/), only this folder moves and this file keeps the same
 * exports — consumers just update one import path.
 *
 * Replacement map (once verified):
 *   Reasoning    → replaces @spotter ReasoningBlock
 *   UserMessage  → replaces @spotter UserBubble
 *   PromptBar    → replaces @spotter SpotterPrompt
 *   ResponseGridView, ToolIcon → new, no old equivalent
 */

export { default as Reasoning, ToolRow, SemiCollapsed, toolStepLabel } from './Reasoning';
export type {
  ReasoningProps,
  ReasoningItem,
  ToolCall,
  LatestStep,
  CodeExecution,
  ChartToken,
  ChartViz,
  NestLabels,
} from './Reasoning';

export { UserMessage, FileCard } from './UserMessage';
export type { UserMessageProps, UserMessageFile, UserMessageState } from './UserMessage';

export { default as PromptBar, PromptBarPlayground } from './PromptBar';
export type { OpenMenu, ConnectorsPlacement, PromptBarMode, PromptBarState } from './PromptBar';

export { default as ResponseGridView } from './ResponseGridView';

export { ToolIcon } from './ToolIcons';
export type { ToolIconName } from './ToolIcons';
