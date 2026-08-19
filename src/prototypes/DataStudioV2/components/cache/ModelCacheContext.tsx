import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ModelCacheState } from './cacheState';

/**
 * A model's cache state, held above the canvas so other surfaces can read it.
 *
 * Why a context rather than state in `ModelCanvas`: the canvas **unmounts the moment you
 * navigate away**, and the two surfaces that need these facts are both elsewhere — the model
 * listing (Data objects) and the model's Caching tab. Caching something on the canvas and then
 * finding the listing still calls it Live is the exact incoherence consolidating the two
 * prototypes is meant to remove.
 *
 * This is the same reasoning `CacheProvider` in `CacheProgress.tsx` already follows for the
 * progress job, and deliberately a **separate** context: that one is "is a job running right
 * now", this one is "what does this model's cache consist of". The first is transient and
 * app-wide; the second is durable and per model.
 *
 * ⚠️ **Keyed by model name, not id.** The canvas has no model id — it carries a renameable
 * `modelName` and hands that back on save, and `handleCanvasPublished` then finds or creates the
 * listing row by `o.name === name`. The name is the only identifier the two sides share at the
 * moment it matters, so keying on anything else would mean inventing one.
 *
 * Only the model being built writes an entry, so every other model falls through to its own mock
 * state — which is what keeps the ported Near Store surfaces working for the sample models that
 * were never on our canvas.
 */

interface ModelCacheContextValue {
  /** Cache state per model **name**. Absent = nothing set on the canvas; use the model's own data. */
  byModel: Record<string, ModelCacheState>;
  get: (modelName: string) => ModelCacheState | undefined;
  set: (modelName: string, state: ModelCacheState) => void;
}

const ModelCacheContext = createContext<ModelCacheContextValue>({
  byModel: {},
  get: () => undefined,
  set: () => {},
});

export const ModelCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [byModel, setByModel] = useState<Record<string, ModelCacheState>>({});

  const set = useCallback((modelName: string, state: ModelCacheState) => {
    setByModel(prev => {
      // The canvas re-summarises on every render, so bail when nothing actually moved —
      // otherwise a fresh object identity per render would re-render every reader.
      const before = prev[modelName];
      if (before && sameState(before, state)) return prev;
      return { ...prev, [modelName]: state };
    });
  }, []);

  const get = useCallback((modelName: string) => byModel[modelName], [byModel]);

  const value = useMemo(() => ({ byModel, get, set }), [byModel, get, set]);
  return <ModelCacheContext.Provider value={value}>{children}</ModelCacheContext.Provider>;
};

export const useModelCache = (): ModelCacheContextValue => useContext(ModelCacheContext);

/**
 * Cheap structural comparison — enough to stop redundant writes without deep-equal on every
 * render. Compares what the reading surfaces actually display.
 */
function sameState(a: ModelCacheState, b: ModelCacheState): boolean {
  if (a.status !== b.status || a.cachedCount !== b.cachedCount) return false;
  if (a.sources.length !== b.sources.length || a.sources.some((s, i) => s !== b.sources[i])) return false;
  if (a.tables.length !== b.tables.length) return false;
  if (a.policy?.mode !== b.policy?.mode || a.policy?.window !== b.policy?.window) return false;
  return a.tables.every((t, i) => {
    const o = b.tables[i];
    return t.name === o.name && t.state === o.state && t.window === o.window
      && t.refColumn === o.refColumn && t.connection === o.connection;
  });
}
