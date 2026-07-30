/**
 * Agentic conversation vocabulary.
 *
 * Tier 1 — lifted as-is from surajboro-ts/spotter-readiness-vision
 * (`src/prototypes/_agentic`). These encode no product decisions: nothing here
 * knows what a table, column or join is, so none of it can go stale as the
 * canvas evolves.
 *
 * Tier 2 — the proposal interaction, reimplemented against DataStudio's model.
 * Upstream's SuggestionCard also carried column and formula variants; both are
 * dropped. We add all columns by default, and S14 is Maya writing the formula.
 *
 * Deliberately not ported: upstream's AgentPanel (reaches into its own DOM),
 * AgentMessage/UserBubble/AgentResponseBlock (we have thread chrome),
 * VersionCard, StopClarifyCard and BuildFeedbackCard (need ClarifyingCard from
 * a different prototype).
 */

// ── Tier 1 — conversation grammar ────────────────────────────────────────────
export { ToolcallCard } from './ToolcallCard';
export type { ToolcallData } from './ToolcallCard';
export { ReasoningBlock } from './ReasoningBlock';
export type { ReasoningStep, ReasoningData } from './ReasoningBlock';
export { PlanStepsCard } from './PlanStepsCard';
export { NextActionChips } from './NextActionChips';
export { ConfidenceBadge } from './ConfidenceBadge';
export { TypingIndicator } from './TypingIndicator';
export type { PlanStep, PlanStepsData } from './types';

// ── Tier 2 — proposals, typed against our model ──────────────────────────────
export { TableSuggestionCard } from './TableSuggestionCard';
export { JoinSuggestionCard } from './JoinSuggestionCard';
export type { JoinProposal } from './JoinSuggestionCard';
export { JoinDiagram } from './JoinDiagram';
export type { Cardinality } from './JoinDiagram';
export type { TableProposal, TableSuggestionCardProps } from './TableSuggestionCard';
