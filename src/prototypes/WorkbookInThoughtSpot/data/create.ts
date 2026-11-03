// Starting a workbook from Spotter (Vivek, 3 Nov 2026). The question card asks only the data
// source: data model, Answer, upload or blank workbook (no template). Which model or Answer is
// asked in the chat and answered in the chat, since every customer has their own. Upload asks
// for the file in the card. Blank workbook needs nothing more. No plan card.
import type { IconName } from '@components/icons';

export type SourceId = 'model' | 'answer' | 'upload' | 'blank';

export const SOURCES: { id: SourceId; label: string; icon: IconName }[] = [
  { id: 'model', label: 'ThoughtSpot data model', icon: 'model' },
  { id: 'answer', label: 'An Answer', icon: 'answer' },
  { id: 'upload', label: 'Upload a file', icon: 'upload' },
  { id: 'blank', label: 'Blank workbook', icon: 'table' },
];

/** What Spotter asks in the chat for sources the user names themselves. */
export const CHAT_QUESTION: Partial<Record<SourceId, string>> = {
  model: 'Which data model should I use?',
  answer: 'Which Answer should I start from?',
};

/** The build checklist before the workbook opens, per source. */
export function buildSteps(source: SourceId, detail: string): string[] {
  switch (source) {
    case 'model':
      return [`Opened the ${detail} model`, 'Created Sheet 1 from its columns', 'Loading live data'];
    case 'answer':
      return [`Opened "${detail}"`, 'Copied its columns and formulas into Sheet 1', 'Loading live data'];
    case 'upload':
      return [`Read ${detail}`, 'Translated its formulas', 'Saving the data to your warehouse'];
    case 'blank':
      return ['Created a blank workbook', 'Opening Sheet 1'];
  }
}
