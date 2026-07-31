// POC AI-readiness flow — build a fix Issue from a wrong-rated Spotter answer.
// Extracted verbatim from the source flow's SpotterCards.spotterFix so the agentic flow
// doesn't need to pull in the whole (side-panel-only) SpotterCards component.
import type { SampleQuestion, Issue } from './data';

/** Build a fix from a wrong-rated Spotter answer. */
export const spotterFix = (q: SampleQuestion): Issue => ({
  id: `fix-${q.id}`, pillar: 'ai', checkCode: 'AI', severity: 'high', icon: 'sparkle',
  title: q.fixTitle ?? `Help Spotter answer “${q.name}”`,
  description: `You marked “${q.name}” incorrect.`,
  impact: 'Users asking this question get a wrong answer from Spotter.',
  source: 'Spotter', fixability: 'judgment',
  suggestion: q.fixSuggestion ?? 'Add an AI instruction or measure so Spotter answers this correctly.',
  status: 'open', basedOn: q.name, fixTarget: q.fixTarget, diff: q.fixDiff,
});
