import React, {
  createContext,
  useCallback,
  useReducer,
  useRef,
} from 'react';
import { askSpotter, type ChatServiceMode } from '../runtime/chatService';
import type { ChatMessage } from '../runtime/schema';
import {
  chatReducer,
  initialChatState,
  type ChatState,
} from './chatReducer';

export interface SpotterChatContextValue {
  state: ChatState;
  /** Submit a user prompt. Empty / whitespace-only inputs are ignored. */
  send: (text: string) => void;
  /** Cancel the in-flight stream. The partial agent message stays as-is. */
  abort: () => void;
  /** Clear the entire conversation. Aborts any in-flight stream first. */
  clear: () => void;
  /** Load a pre-built message history (e.g. selecting a chat from the panel). */
  load: (messages: ChatMessage[]) => void;
}

export const SpotterChatContext = createContext<SpotterChatContextValue | null>(null);

export interface SpotterChatProviderProps {
  /**
   * Service mode. `canned` (default) runs the local fixtures.
   * `live` will call /api/chat once that integration lands.
   */
  mode?: ChatServiceMode;
  children: React.ReactNode;
}

const nextId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const SpotterChatProvider: React.FC<SpotterChatProviderProps> = ({
  mode = 'canned',
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  // Latest state ref — used to snapshot conversation history when sending,
  // without putting `state.messages` in `send`'s deps (which would recreate
  // the callback on every keystroke and cause subtle re-render churn).
  const stateRef = useRef(state);
  stateRef.current = state;

  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Cancel any prior stream — only one agent message streams at a time.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userId = nextId();
      const agentId = nextId();

      dispatch({ type: 'SEND_USER', userId, text: trimmed });
      dispatch({ type: 'START_AGENT', agentId });

      // Snapshot conversation including the just-added user message.
      const userMessage: ChatMessage = {
        id: userId,
        role: 'user',
        stage: 'done',
        text: trimmed,
        createdAt: Date.now(),
      };
      const messages = [...stateRef.current.messages, userMessage];

      try {
        for await (const chunk of askSpotter({
          messages,
          signal: controller.signal,
          mode,
        })) {
          if (controller.signal.aborted) break;
          dispatch({ type: 'AGENT_CHUNK', agentId, chunk });
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          dispatch({ type: 'AGENT_ERROR', agentId, message: err.message });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [mode],
  );

  const abort = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const clear = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'CLEAR' });
  }, []);

  const load = useCallback((messages: ChatMessage[]): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'LOAD', messages });
  }, []);

  const value: SpotterChatContextValue = { state, send, abort, clear, load };

  return (
    <SpotterChatContext.Provider value={value}>
      {children}
    </SpotterChatContext.Provider>
  );
};

SpotterChatProvider.displayName = 'SpotterChatProvider';
