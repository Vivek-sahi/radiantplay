# Spotter answer card plan (2026-05-07)

Plan for bringing the Spotter answer response card from Figma into the Spotter DS as the first concrete component under `src/spotter/answer/`. This is the answer view that renders inside a chat thread when Spotter responds with a viz-backed answer.

**Source.** Figma — AI Design System and Style Guidelines, node `122:15399` (`Card / Answer`).

**Sibling doc.** Builds on `docs/2026-05-07-spotter-ds-plan.md` (Phase 3, net-new components).

## Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ [sales] [monthly] [▼ date = last 12 months] [▼ region = east]    │  Header
│                                            [↶ undo ▾] [chart/table]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                       [Chart slot]                               │  Body
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│ Pin   Save   Download   Edit          Add to coaching            │  Footer
└──────────────────────────────────────────────────────────────────┘
```

**Card shell.** White surface, 8 radius, light elevation, 800 width baseline, 460 min-height, 700 max-height. Component description note from Figma: card height should be 60% of viewport height when laid out in a Spotter page.

**Header (top, 20 padding, 16 gap below).**

- **Token area** (left, flex-grows, wrap to multi-row): colored chips for the search interpretation. Four token kinds visible:
  - **Column** (green) — measures, e.g. `sales`.
  - **Keyword** (blue) — language modifiers, e.g. `monthly`.
  - **Filter** (gray + funnel icon) — predicate, e.g. `date = last 12 months`.
  - **Formula** (gray + formula icon) — derived expression. Not in this screenshot but present in the symbol library.
- **Header actions** (right, fixed): undo/redo split button (optional via `showUndo`) + chart/table view toggle (segmented control, two icon segments).

**Body.** Chart slot. Consumer-provided. Card does not own chart logic — it takes a `chart` slot prop. Empty state shows a "Replace chart component here" placeholder in Figma but that is design-time only, not a runtime state.

**Footer (40 height, top divider, 20 padding, 8 vertical).**

- **Left actions group**: Pin, Save, Download, Edit (icon + label, ghost buttons, 16 gap).
- **Right actions group**: Add to coaching (ghost button with plus icon).
- Both groups are slot-shaped so a consumer can swap the action set per surface.

## Component breakdown

The card is one named export plus four internal building blocks. All under `src/spotter/answer/`.

| Component | Public | Wraps | Purpose |
|---|---|---|---|
| `AnswerCard` | yes | Radiant `Card` | Top-level shell. Composes header, body, footer. |
| `AnswerHeader` | yes | Radiant `Horizontal` | Token row + header actions row. Exported so chat surface can render answer header standalone. |
| `AnswerToken` | yes | Radiant `Chip` | One token chip. Variants: `column \| keyword \| filter \| formula`. Optional leading icon. |
| `AnswerTokenList` | internal | Radiant `Horizontal` (wrap) | Renders an array of tokens with wrap and 8 gap. |
| `AnswerHeaderActions` | internal | Radiant `Horizontal` | Hosts undo split + view toggle. |
| `AnswerViewToggle` | yes | Radiant `SegmentedControl` | Chart/table swap. Exported because it is reused outside the card. |
| `AnswerFooter` | yes | Radiant `Horizontal` | Footer action row with `left` and `right` slots. |
| `AnswerFooterAction` | internal | Radiant `Button` (ghost, with icon) | Single footer action. |

Undo/redo split button — Radiant has no `SplitButton` primitive. Compose from `Button` + `IconButton` + `Menu` rather than building a new primitive. If reused enough, promote to Radiant later.

## Radiant primitives in use

Already in `src/components/`, no additions needed:

- `Card` — surface, radius, elevation.
- `Chip` — token chips. Confirm Chip supports left icon + variant colors. If not, extend with a `tone` prop in this branch.
- `SegmentedControl` — chart/table view toggle.
- `Button` / `IconButton` — footer actions, undo/redo halves.
- `Menu` (or `Popover`) — undo dropdown half.
- `Horizontal` / `Vertical` / `View` — layout primitives, no inline flex.

## Token mapping (Figma → Radiant)

Figma exposes a mix of system tokens and chart tokens. Map as follows. Anything `❗charts❗` is a Spotter-domain chart token, not yet in Radiant. Decide per-token whether to bring into Radiant tokens or keep as Spotter-local.

| Figma token | Radiant equivalent | Notes |
|---|---|---|
| `--background/surface` | `background-base` | Card surface. |
| `--text/default` | `content-primary` | Token labels, footer labels. |
| `--icons/info` | `content-secondary` | Header action icons. |
| `--charts/gray/20` | New Spotter token | Filter chip background, view toggle bg, divider on dense surfaces. |
| `--charts/green/20` | New Spotter token | Column chip background. |
| `--charts/blue/20` | New Spotter token | Keyword chip background. |
| `Divider/On light bg #EAEDF2` | `border-divider` | Footer top border. |
| `Body/Normal` (Plain Light 14/20) | `v2TextStyles.bodyNormal` | Token labels. |
| `Footnote/Caption` (Plain 12/18) | `v2TextStyles.caption` | Footer action labels. |
| `Elevation/100` | `shadow-100` | Card elevation. |
| 8px radius | `radius-md` (verify) | Card corners. |
| 4px radius | `radius-sm` (verify) | Chip corners. |
| 8/16/20 spacing | `spacing.B / D / E` | Header gap, body gap, padding. |

Open token decision: do chart bg colors live in `src/tokens/` (Radiant) or `src/spotter/tokens.ts` (Spotter-local)? Recommendation: keep them Spotter-local for now since they are domain-specific. Promote to Radiant only if a non-Spotter surface adopts them.

## Props API

```ts
// src/spotter/answer/types.ts
export type AnswerTokenKind = 'column' | 'keyword' | 'filter' | 'formula';

export interface AnswerToken {
  id: string;
  label: string;
  kind: AnswerTokenKind;
}

export type AnswerViewMode = 'chart' | 'table';

// src/spotter/answer/AnswerCard.tsx
export interface AnswerCardProps {
  tokens: AnswerToken[];
  chart: React.ReactNode;                  // chart or table content
  view?: AnswerViewMode;                   // controlled view
  onViewChange?: (view: AnswerViewMode) => void;
  showUndo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  footerLeft?: React.ReactNode;            // slot — defaults to Pin/Save/Download/Edit
  footerRight?: React.ReactNode;           // slot — defaults to Add to coaching
  className?: string;
}
```

Header and footer remain composable. Consumers who want a non-default action set pass their own footer slots. The Spotter response renderer will pass canonical defaults.

## File structure

```
src/spotter/answer/
├── index.ts                    ← barrel
├── types.ts                    ← shared types
├── AnswerCard.tsx
├── AnswerCard.module.css
├── AnswerHeader.tsx
├── AnswerHeader.module.css
├── AnswerToken.tsx             ← single chip
├── AnswerToken.module.css
├── AnswerTokenList.tsx
├── AnswerViewToggle.tsx
├── AnswerFooter.tsx
└── AnswerFooter.module.css
```

Footer action defaults live inside `AnswerFooter.tsx` as exported helper components (`PinAction`, `SaveAction`, etc.), not as separate files, until the action set grows.

## Build phases

1. **Tokens.** Add `src/spotter/tokens.ts` for the four Spotter chart bg colors (gray/green/blue/orange-formula). One file, no subfolders, exported from `@spotter`.
2. **AnswerToken + AnswerTokenList.** Standalone, fully testable in isolation.
3. **AnswerViewToggle.** Wraps SegmentedControl. Two segments, icons only.
4. **AnswerHeader.** Composes token list + actions row (undo composed inline, view toggle).
5. **AnswerFooter.** Two slot row, default action set.
6. **AnswerCard.** Composes the three. Handles dimensions, elevation, radius.
7. **Demo route.** Add a temp demo page (or extend an existing prototype) that renders the card with mock tokens and a placeholder chart slot. Confirms visual fidelity before exporting publicly.

After the card lands, the next answer-surface pieces are `SourcesPanel`, `ConfidenceBadge`, `FollowUpRail`, and `FeedbackBar` from the Phase 1 inventory.

## Visual fidelity checks

Before declaring done, validate:

- Card width 800 default, height between 460 and 700, scales to 60% viewport in page mode.
- Token chips wrap to a second row at narrow widths without breaking action row layout.
- Header actions stay right-aligned regardless of token count.
- View toggle reflects controlled state and emits change events.
- Footer divider uses `border-divider`, not a hardcoded gray.
- All text in sentence case. All labels imperative for actions (Pin, Save, Download, Edit).
- No hardcoded hex anywhere. No raw `rgb()`. No magic px outside the 4-base spacing scale.

## Open questions

- **Token color source.** Confirm whether Spotter chart tokens already exist in Radiant under a different name, before adding new Spotter-local tokens.
- **Chip variants.** Does Radiant `Chip` support a `tone` prop with custom backgrounds? If not, extend it (cleanest) or build `AnswerToken` as a new component that shares Chip styling but owns its own bg logic.
- **Split button promotion.** If undo/redo split appears in more than two Spotter surfaces, promote to a Radiant `SplitButton`. Otherwise keep composed.
- **Pinning state.** Is "Pin" a toggle (pinned vs. unpinned), and does the icon flip? Need a Figma frame for the pinned state.
- **Coaching action.** "Add to coaching" is Spotter-specific. Confirm intent before locking the default footer set.
- **Empty state.** Card with no tokens, or no chart content yet (still loading). Need design.
- **Streaming.** When the answer is streaming in, does the card appear with skeleton tokens and a chart shimmer, or only after the full response lands? Tied to the streaming-UX open question in the parent plan.

## Out of scope for this card

- Chat thread integration (handled by `chat/ChatThread` later).
- Drill-down panel (separate `viz/DrillPanel`).
- Sources / citations (separate `answer/SourcesPanel`).
- Follow-up suggestions (separate `answer/FollowUpRail`).
- Real chart rendering. Card receives a chart node from the consumer.
