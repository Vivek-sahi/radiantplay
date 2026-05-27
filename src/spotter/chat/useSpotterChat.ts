import { useContext } from 'react';
import {
  SpotterChatContext,
  type SpotterChatContextValue,
} from './SpotterChatProvider';

/**
 * Read the Spotter chat context. Must be called inside a
 * `<SpotterChatProvider>`. Returns `{ state, send, abort, clear }`.
 */
export function useSpotterChat(): SpotterChatContextValue {
  const ctx = useContext(SpotterChatContext);
  if (!ctx) {
    throw new Error(
      'useSpotterChat must be used within a SpotterChatProvider',
    );
  }
  return ctx;
}
