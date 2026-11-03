// Response formatting — the frozen spec for every tag an agent can emit.
//
// The table settled on grid with vertical rules and row hover (row-level only,
// layered over the base fill rather than replacing it). `MarkdownTable` is the
// standalone component for data the agent hands over as columns and rows;
// `SpotterMarkdown` styles a whole response body, tables included.

export { SpotterMarkdown } from './Markdown';
export type { SpotterMarkdownProps } from './Markdown';

export { MarkdownTable } from './MarkdownTable';
export type {
  MarkdownTableProps,
  MarkdownTableColumn,
  MarkdownTableVariant,
  ZebraHeader,
} from './MarkdownTable';

// The spec itself. Ship surfaces read BASELINE and FINAL_TABLE; the control
// rig and spec sheet in SpotterRefresh read the rest to build their UI.
export {
  BASELINE,
  FINAL_TABLE,
  SCHEMA,
  COLOR_OPTS,
  BG_TOKENS,
  COLOR_VARMAP,
  COLUMN_FLOORS,
  columnFloor,
  INNER_PAD,
  MARKER_GLYPHS,
  PAGE_PAD,
  PROSE_FLOOR,
  TOKEN_VARS,
  VARMAP,
} from './formattingConfig';
export type { FormattingState, ControlItem, ControlGroup } from './formattingConfig';
