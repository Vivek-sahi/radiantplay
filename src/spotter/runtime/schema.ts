/**
 * Spotter runtime schema.
 *
 * Defines the wire-shape for Spotter agent responses (AnswerContent +
 * AnswerBlock variants), the streaming chunk protocol (AnswerChunk), and
 * the chat-state types consumed by SpotterChatProvider.
 *
 * Iterates as the canonical Spotter response contract lands; current
 * shapes are starting points designed to render the screens we have.
 */

import type { IconName } from '@components/icons';

// ---------- Answer blocks ----------

export type AnswerBlockKind =
  | 'text'
  | 'viz'
  | 'sources'
  | 'followups'
  | 'refine'
  | 'error';

export interface TextBlockData {
  kind: 'text';
  id: string;
  text: string;
}

export type VizChartKind = 'line' | 'bar' | 'pie' | 'table';

export type VizTokenKind = 'measure' | 'keyword' | 'filter' | 'formula';

export interface VizToken {
  id: string;
  label: string;
  kind: VizTokenKind;
}

export interface VizSeries {
  id: string;
  label: string;
  /** Optional palette override. Defaults to the chart palette. */
  color?: string;
  data: number[];
}

export interface VizData {
  xAxis?: { label?: string; categories: string[] };
  yAxis?: { label?: string };
  series: VizSeries[];
}

/** How the viz slot renders. Discriminated by `type`. */
export type VizSource =
  | {
      /** External chart embedded as an iframe. */
      type: 'iframe';
      url: string;
      /** Optional iframe sandbox attribute (space-separated tokens). */
      sandbox?: string;
      /** Optional title for the iframe (a11y). */
      title?: string;
    }
  | {
      /** Inline chart data — VizBlock renders an SVG sketch from this. */
      type: 'data';
      chartKind: VizChartKind;
      data: VizData;
    }
  | {
      /** Empty / loading state. Shows the placeholder message in the slot. */
      type: 'placeholder';
      message?: string;
    };

/** Pre-computed table data shown when the user toggles to table view. */
export interface VizTableData {
  columns: string[];
  rows: Array<string | number>[];
}

export interface VizBlockData {
  kind: 'viz';
  id: string;
  /** Optional bold heading rendered above the chart card. */
  title?: string;
  tokens: VizToken[];
  /** What renders in the chart slot. See VizSource for the priority. */
  source: VizSource;
  /** Optional pre-computed table data for the chart/table toggle. */
  tableData?: VizTableData;
}

export interface Source {
  id: string;
  label: string;
  url?: string;
}

export interface SourcesBlockData {
  kind: 'sources';
  id: string;
  items: Source[];
}

export interface FollowUpsBlockData {
  kind: 'followups';
  id: string;
  suggestions: string[];
}

export interface RefineBlockData {
  kind: 'refine';
  id: string;
  questions: string[];
}

export interface ErrorBlockData {
  kind: 'error';
  id: string;
  message: string;
}

export type AnswerBlock =
  | TextBlockData
  | VizBlockData
  | SourcesBlockData
  | FollowUpsBlockData
  | RefineBlockData
  | ErrorBlockData;

export interface AnswerContent {
  /** Bold heading rendered above the first block (per screen 3). Optional. */
  title?: string;
  blocks: AnswerBlock[];
}

// ---------- Reasoning ----------
//
// A reasoning trace is a list of steps (the wire shape the reducer fills in).
// The Reasoning timeline renders it as a flat list of items: text rows and tool
// rows. Tool rows carry the full tool-call model below; chat/ReasoningBlock
// adapts a trace into items.

/** Custom tool-execution glyphs rendered by chat/ToolIcons.tsx. */
export type ToolIconName = 'fetch' | 'answer' | 'code' | 'memory' | 'web';

/** A nested code-execution block inside a tool row (double accordion). */
export interface CodeExecution {
  id: string;
  /** LLM-generated header for this nested block (done state). */
  summaryHeader: string;
  /** Present-tense header shown (shimmering) while this sub-step runs. */
  loadingHeader?: string;
  /** Demo only: how long this sub-step stays in its loading state. */
  loadMs?: number;
  /** Code input; omit when the block is a chart. */
  input?: string;
  output?: string;
  /** When present, the nested block opens the chart card instead of code. */
  chart?: ChartViz;
}

/** A query token chip shown above a chart (Spotter's parsed query phrases). */
export interface ChartToken {
  kind: 'measure' | 'filter' | 'keyword' | 'date';
  label: string;
}

/** Visualization output. Input is the NL question; output is a chart. */
export interface ChartViz {
  question: string;
  tokens?: ChartToken[];
  series: { label: string; value: number }[];
}

/**
 * Labels for a nestable tool (code execution, answer generation). While only
 * the first sub-step runs the row shows `singular`; once it nests the title is
 * a count: `${runningVerb} N ${unit}` / `${doneVerb} N ${unit}`.
 */
export interface NestLabels {
  singular: string;
  runningVerb: string;
  doneVerb: string;
  unit: string;
}

export interface ReasoningToolCall {
  id: string;
  /** Present tense, shown while running ("Fetching…"). */
  title: string;
  /** Past tense, shown once loaded ("Fetched…"). */
  doneTitle?: string;
  /** Radiant icon name for the row glyph. */
  icon?: IconName;
  /** Custom tool-execution glyph; takes precedence over `icon`. */
  toolIcon?: ToolIconName;
  /** MCP logo image src (e.g. Slack). */
  logo?: string;
  /** Connector display name (e.g. "Slack"); drives the collapsed header. */
  connector?: string;
  /** Tools sharing a group id run in parallel and collapse into one step. */
  group?: string;
  /** Demo only: how long this tool holds the loading state. */
  loadMs?: number;
  /** MCP permission gate: the expanded body shows an approval prompt. */
  permission?: { action: string; description?: string };
  /** Error / permission denied: title turns red, output shows this message. */
  error?: string;
  input?: string;
  output?: string;
  codeExecutions?: CodeExecution[];
  nest?: NestLabels;
  chart?: ChartViz;
}

/** One row of the reasoning timeline. */
export type ReasoningItem =
  | { kind: 'text'; id: string; text: string; summaryHeader?: string }
  | ({ kind: 'tool' } & ReasoningToolCall);

export type ToolCall = Extract<ReasoningItem, { kind: 'tool' }>;

export interface ReasoningStep {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'done';
  /** Multi-line body text describing what the step found. */
  description?: string;
  /** Optional embedded tool-call card. */
  toolcall?: ReasoningToolCall;
}

export interface ReasoningTrace {
  steps: ReasoningStep[];
  isDone: boolean;
  /** Total duration of the reasoning sequence, in seconds. */
  durationSeconds?: number;
}

// ---------- Streaming chunks ----------

export type AnswerChunk =
  | { kind: 'reasoning_start'; steps: { label: string }[] }
  | {
      kind: 'reasoning_step';
      stepIndex: number;
      status: 'current' | 'done';
      /** Optional rich detail folded into the step on this transition. */
      description?: string;
      toolcall?: ReasoningToolCall;
    }
  | { kind: 'reasoning_done'; durationSeconds?: number }
  | { kind: 'block_start'; block: AnswerBlock }
  | { kind: 'text_delta'; blockId: string; delta: string }
  | { kind: 'block_done'; blockId: string }
  | { kind: 'message_done' }
  | { kind: 'error'; message: string };

// ---------- Chat state ----------

export type ChatRole = 'user' | 'agent';

export type MessageStage = 'sending' | 'thinking' | 'streaming' | 'done' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  stage: MessageStage;
  /** User-message text. Undefined for agent messages. */
  text?: string;
  /** Agent-message reasoning trace. Undefined for user messages. */
  reasoning?: ReasoningTrace;
  /** Agent-message content. Filled progressively as blocks stream in. */
  content?: AnswerContent;
  /** Error message when stage === 'error'. */
  error?: string;
  createdAt: number;
}
