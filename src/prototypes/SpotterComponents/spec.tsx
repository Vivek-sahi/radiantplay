/**
 * Engineering spec for this prototype, shown at /playground/SpotterComponents?spec
 *
 * Plain data rendered by the shared spec sheet (src/app-chrome/SpecSheet). Specimens
 * are the live components, and the source comes in with ?raw, so neither can drift.
 * Content adapted from Sneharsh Damani's User message spec in his SpotterRefresh fork.
 */
import { UserMessage } from '@spotter/chat';
import type { UserMessageFile } from '@spotter/chat';
import type { ComponentSpec, SpecApproval } from '@/app-chrome/SpecSheet';
import userMessageSource from '@spotter/chat/UserMessage.tsx?raw';
import userMessageCss from '@spotter/chat/UserMessage.module.css?raw';

const FILES: UserMessageFile[] = [
  { name: 'Q2 Revenue.csv', type: 'csv', size: '2.4 MB' },
  { name: 'Forecast 2026.xlsx', type: 'xlsx', size: '1.8 MB' },
];
const LONG =
  'Show me monthly revenue broken down by region for the last 12 months, then compare it against the same period last year and call out any region that grew more than 20 percent.';

/** An example, so it stays a draft: only a designer approves a spec (/rp-spec) */
export const approval: SpecApproval = { status: 'draft' };

export const specs: ComponentSpec[] = [
  {
    id: 'user-message',
    name: 'User message',
    summary:
      'A person’s turn in a Spotter conversation. Right-aligned squircle bubble with text, an optional highlighted reference and attached files.',
    tags: ['3 states', 'Files-aware truncation', 'Light and dark', 'Tokens only'],
    preview: () => (
      <UserMessage message="Q2 revenue by region" highlightedText="Revenue breakdown by region" files={FILES} state="hover" />
    ),
    anatomy: [
      { name: 'Bubble', description: 'background-on-base, squircle 16/16/2/16 with the tail bottom right. Hugs its content.' },
      { name: 'Highlighted reference', description: 'Optional. Follow-up glyph and a one-line label with ellipsis.' },
      { name: 'Message text', description: 'Body large, 16/24. Wraps and keeps line breaks.' },
      { name: 'File grid', description: 'Optional. Up to 3 columns of fixed 202.67px cards.' },
      { name: 'Hover footer', description: 'Timestamp, then copy, edit and delete. Height is reserved so nothing jumps.' },
    ],
    states: [
      { label: 'Default', note: 'Resting. No footer.', render: () => <UserMessage message="Show me Q2 revenue by region" state="default" /> },
      { label: 'Hover', note: 'Footer fades in. Bubble dips to 92% opacity.', render: () => <UserMessage message="Show me Q2 revenue by region" state="hover" /> },
      { label: 'Edit', note: 'Bubble becomes a text field with a border-brand outline, Cancel and Send.', render: () => <UserMessage message="Show me Q2 revenue by region" state="edit" /> },
      { label: 'Long text with files', note: 'Text keeps 4 lines with an ellipsis; whole file rows fill the rest of the 168px budget.', render: () => <UserMessage message={LONG} files={FILES} state="default" /> },
    ],
    props: [
      { name: 'message', type: 'string', description: 'Required. The message text.' },
      { name: 'highlightedText', type: 'string', description: 'Reference shown above the message.' },
      { name: 'files', type: 'UserMessageFile[]', default: '[]', description: 'Attachments, shown as a file grid.' },
      { name: 'state', type: "'default' | 'hover' | 'edit'", default: "'default'", description: 'Forces a state; otherwise interaction drives it.' },
      { name: 'timestamp', type: 'string', description: 'Shown in the hover footer.' },
    ],
    measurements: [
      { element: 'Bubble padding, top and bottom', px: 12 },
      { element: 'Bubble padding, sides', px: 16 },
      { element: 'Reference to text', px: 6, value: 'bottom margin on the reference row' },
      { element: 'Text to files', px: 12 },
      { element: 'Between file cards', px: 8 },
      { element: 'Bubble to footer', px: 4 },
      { element: 'Bubble width', value: 'max 656, min 320' },
      { element: 'Left gutter', value: 'max(16, min(128, width - 340))' },
      { element: 'Collapsed content height', value: 'max 168 (7 lines)' },
    ],
    behaviour: [
      { trigger: 'Text over 168px, no files', result: 'Clips at 168px and fades. No ellipsis.' },
      { trigger: 'Text with files', result: 'Text keeps 4 lines (3 under a reference) with an ellipsis; files get what is left, in whole rows.' },
      { trigger: 'Show more', result: 'Expands to the full text and every file. Resets when the message changes.' },
      { trigger: 'Container narrows', result: 'Left gutter shrinks first, then file columns drop from 3 to 1. Text never clips by width.' },
    ],
    motion: [
      { what: 'Expand and collapse', property: 'max-height on text and outer clip together', timing: '0.32s, cubic-bezier(.4,0,.2,1)' },
      { what: 'Fade gradient', property: 'opacity', timing: '0.32s, same easing' },
      { what: 'Bubble hover', property: 'opacity to 0.92', timing: '0.12s ease' },
    ],
    files: [
      { path: 'src/spotter/chat/UserMessage.tsx', holds: 'Component, truncation budget, states' },
      { path: 'src/spotter/chat/UserMessage.module.css', holds: 'Layout, type, colours' },
      { path: 'src/spotter/chat/useSquirclePath.ts', holds: 'Squircle corners (needs figmaSquircle.ts)' },
    ],
    sources: [
      { title: 'UserMessage.tsx', code: userMessageSource },
      { title: 'UserMessage.module.css', code: userMessageCss },
    ],
  },
];
