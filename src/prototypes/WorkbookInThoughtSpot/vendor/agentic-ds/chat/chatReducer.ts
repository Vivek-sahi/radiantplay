/**
 * Spotter chat reducer.
 *
 * Pure state reducer. Takes `AnswerChunk` events from the service and
 * folds them into the chat-message list. Lives next to the provider so
 * the action shape is centralized.
 */

import type {
  AnswerChunk,
  ChatMessage,
  ReasoningStep,
} from '../runtime/schema';

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export type ChatAction =
  | { type: 'SEND_USER'; userId: string; text: string }
  | { type: 'START_AGENT'; agentId: string }
  | { type: 'AGENT_CHUNK'; agentId: string; chunk: AnswerChunk }
  | { type: 'AGENT_ERROR'; agentId: string; message: string }
  /** Replace the thread wholesale — opening a saved conversation. */
  | { type: 'LOAD_THREAD'; messages: ChatMessage[] }
  /** Load a pre-built message history. Same as LOAD_THREAD. */
  | { type: 'LOAD'; messages: ChatMessage[] }
  | { type: 'CLEAR' };

export const initialChatState: ChatState = {
  messages: [],
  isStreaming: false,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SEND_USER': {
      const userMessage: ChatMessage = {
        id: action.userId,
        role: 'user',
        stage: 'done',
        text: action.text,
        createdAt: Date.now(),
      };
      return { ...state, messages: [...state.messages, userMessage] };
    }

    case 'START_AGENT': {
      const agentMessage: ChatMessage = {
        id: action.agentId,
        role: 'agent',
        stage: 'thinking',
        createdAt: Date.now(),
      };
      return {
        ...state,
        messages: [...state.messages, agentMessage],
        isStreaming: true,
      };
    }

    case 'AGENT_CHUNK': {
      const messages = state.messages.map((m) =>
        m.id === action.agentId ? mergeChunk(m, action.chunk) : m,
      );
      const finished =
        action.chunk.kind === 'message_done' || action.chunk.kind === 'error';
      return {
        ...state,
        messages,
        isStreaming: finished ? false : state.isStreaming,
      };
    }

    case 'AGENT_ERROR': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.agentId
            ? { ...m, stage: 'error', error: action.message }
            : m,
        ),
        isStreaming: false,
      };
    }

    case 'LOAD':
    case 'LOAD_THREAD':
      // A saved thread is already resolved, so nothing is streaming. Sending
      // aborts any in-flight turn before dispatching this.
      return { messages: action.messages, isStreaming: false };

    case 'CLEAR':
      return initialChatState;
  }
}

// ---------- internals ----------

function mergeChunk(m: ChatMessage, chunk: AnswerChunk): ChatMessage {
  switch (chunk.kind) {
    case 'reasoning_start': {
      // Every step starts pending, including the first. The gap between the
      // trace being announced and its first step beginning is what the
      // reasoning block renders as its bouncing dots — skipping straight to
      // 'current' skips that state entirely.
      const steps: ReasoningStep[] = chunk.steps.map((s, i) => ({
        id: `${m.id}-step-${i}`,
        label: s.label,
        status: 'pending',
      }));
      return {
        ...m,
        stage: 'thinking',
        reasoning: { steps, isDone: false },
      };
    }

    case 'reasoning_step': {
      if (!m.reasoning) return m;
      // Only the named step changes. A step begins when it says so — nothing
      // is advanced on its behalf, because the pause between one step
      // finishing and the next starting is part of the pacing.
      const steps = m.reasoning.steps.map((s, i) =>
        i === chunk.stepIndex
          ? {
              ...s,
              status: chunk.status,
              ...(chunk.description !== undefined ? { description: chunk.description } : {}),
              ...(chunk.toolcall !== undefined ? { toolcall: chunk.toolcall } : {}),
            }
          : s
      );
      return { ...m, reasoning: { ...m.reasoning, steps } };
    }

    case 'reasoning_done': {
      if (!m.reasoning) return m;
      return {
        ...m,
        stage: 'streaming',
        reasoning: {
          steps: m.reasoning.steps.map((s) => ({ ...s, status: 'done' as const })),
          isDone: true,
          ...(chunk.durationSeconds !== undefined
            ? { durationSeconds: chunk.durationSeconds }
            : {}),
        },
      };
    }

    case 'block_start': {
      const content = m.content ?? { blocks: [] };
      return {
        ...m,
        stage: 'streaming',
        content: {
          ...content,
          blocks: [...content.blocks, chunk.block],
        },
      };
    }

    case 'text_delta': {
      if (!m.content) return m;
      return {
        ...m,
        content: {
          ...m.content,
          blocks: m.content.blocks.map((b) =>
            b.id === chunk.blockId && b.kind === 'text'
              ? { ...b, text: b.text + chunk.delta }
              : b,
          ),
        },
      };
    }

    case 'block_done':
      // Streaming for this block finished. No state change — block_start
      // and text_delta have already populated the content.
      return m;

    case 'message_done':
      return { ...m, stage: 'done' };

    case 'error':
      return { ...m, stage: 'error', error: chunk.message };
  }
}
