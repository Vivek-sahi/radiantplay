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

export interface ReasoningToolCall {
  id: string;
  /** Optional Radiant icon name shown in the toolcall card header. */
  icon?: string;
  title: string;
  input?: string;
  output?: string;
}

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
