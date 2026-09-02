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

// Reasoning moved to the shared Spotter DS (src/spotter/chat). Re-exported so
// existing imports from this barrel keep working.
export { Reasoning, ToolRow, SemiCollapsed, toolStepLabel } from '@spotter/chat';
export type {
  ReasoningProps,
  ReasoningItem,
  ToolCall,
  LatestStep,
  CodeExecution,
  ChartToken,
  ChartViz,
  NestLabels,
} from '@spotter/chat';

// UserMessage moved to the shared Spotter DS (src/spotter/chat).
export { UserMessage, FileCard } from '@spotter/chat';
export type { UserMessageProps, UserMessageFile, UserMessageState } from '@spotter/chat';

export { default as PromptBar, PromptBarPlayground } from './PromptBar';
export type { OpenMenu, ConnectorsPlacement, PromptBarMode, PromptBarState } from './PromptBar';

export { default as ResponseGridView } from './ResponseGridView';

export { ToolIcon } from '@spotter/chat';
export type { ToolIconName } from '@spotter/runtime/schema';
