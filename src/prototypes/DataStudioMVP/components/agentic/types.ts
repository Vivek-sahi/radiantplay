/**
 * Agentic conversation types.
 *
 * Ported from surajboro-ts/spotter-readiness-vision `src/prototypes/_agentic`.
 * Trimmed deliberately: the upstream `types.ts` also re-exports SuggestionCard
 * and BuildFeedbackCard types, which drag in ClarifyingCard from another
 * prototype. We only take the domain-neutral conversation grammar — nothing
 * here knows about tables, columns or joins.
 *
 * Table/join proposal payloads live in `TableSuggestionCard.tsx` and are typed
 * against DataStudio's own model, not the upstream one.
 */

import type { ToolcallData } from './ToolcallCard';
import type { ReasoningStep, ReasoningData } from './ReasoningBlock';

export type { ToolcallData, ReasoningStep, ReasoningData };

/** One step in a multi-step agent plan. `reasoningData` is set on the active step. */
export interface PlanStep {
  label: string;
  caption?: string;
  state: 'done' | 'active' | 'pending';
  reasoningData?: ReasoningData;
}

export interface PlanStepsData {
  goal: string;
  steps: PlanStep[];
}
