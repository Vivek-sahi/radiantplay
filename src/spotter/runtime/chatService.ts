/**
 * Spotter chat service.
 *
 * `askSpotter` returns an async iterable of `AnswerChunk`s. Two modes:
 *
 *   - **canned** (default) — yields chunks from `cannedResponses` fixtures
 *     with `setTimeout` delays, emulating SSE without hitting the API.
 *   - **live** (later) — POSTs to `/api/chat` and parses SSE events.
 *
 * The chunk stream shape is identical in both modes, so consumers don't
 * change when we flip on live mode.
 */

import type { AnswerChunk, ChatMessage } from './schema';
import { pickCannedResponse } from './cannedResponses';

export type ChatServiceMode = 'canned' | 'live';

export interface AskSpotterParams {
  messages: ChatMessage[];
  systemPrompt?: string;
  signal?: AbortSignal;
  mode?: ChatServiceMode;
}

class AbortError extends DOMException {
  constructor() {
    super('Aborted', 'AbortError');
  }
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AbortError());
      return;
    }
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new AbortError());
      },
      { once: true },
    );
  });

async function* cannedStream(
  params: AskSpotterParams,
): AsyncGenerator<AnswerChunk> {
  const userMessages = params.messages.filter((m) => m.role === 'user');
  const lastUserText = userMessages[userMessages.length - 1]?.text ?? '';

  const events = pickCannedResponse(lastUserText);

  for (const event of events) {
    if (event.delay > 0) {
      await sleep(event.delay, params.signal);
    }
    yield event.chunk;
  }
}

async function* liveStream(
  _params: AskSpotterParams,
): AsyncGenerator<AnswerChunk> {
  // Live mode lands later. Flip a switch when ready.
  yield {
    kind: 'error',
    message: 'Live mode is not enabled. Set mode to "canned" or wait for live integration.',
  };
}

/**
 * Ask Spotter a question. Returns an async iterable of chunks. The consumer
 * (SpotterChatProvider) reduces these into chat state.
 */
export function askSpotter(params: AskSpotterParams): AsyncGenerator<AnswerChunk> {
  const mode = params.mode ?? 'canned';
  return mode === 'canned' ? cannedStream(params) : liveStream(params);
}
