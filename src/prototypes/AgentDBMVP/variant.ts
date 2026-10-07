import { createContext, useContext } from 'react';

/**
 * v1 — Pulse-aware: AgentDB knew which tables Pulse managed and treated them specially.
 * v2 — Neutral: ThoughtSpot is just another connection.
 * Ruled 28 Sep (Vivek): v2 is the behaviour. 7 Oct: the v1 data paths (Pulse tables, system
 * accounts, Overview, Activity) went with the V1 scope cut; only the sign-in wording differs now.
 */
export type Variant = 'v1' | 'v2';

export const VARIANT_OPTIONS = [
  { id: 'v1', label: 'v1 · Pulse-aware' },
  { id: 'v2', label: 'v2 · ThoughtSpot is just a connection' },
];

export const SHOW_VARIANT_SWITCHER = false;
export const DEFAULT_VARIANT: Variant = 'v2';

export const VariantContext = createContext<Variant>(DEFAULT_VARIANT);
export const useVariant = () => useContext(VariantContext);
