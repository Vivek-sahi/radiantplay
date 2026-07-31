// POC AI-readiness flow — Spotter grading result types.
// Ported from the source flow's SpotterGradingModal (only the shared type contract is
// needed here; the modal UI itself is not used — InlineGrading is the grading surface).
import type { SampleQuestion } from './data';

export type GradeState = 'correct' | 'incorrect' | 'oos';
export interface SpotterVerdict { state: GradeState; reason?: string }
export interface GradingResult { questions: SampleQuestion[]; verdicts: Record<string, SpotterVerdict> }
