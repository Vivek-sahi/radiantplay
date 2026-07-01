# 2026-05-06 — SegmentedControl visual alignment with Figma

Plan to bring `src/components/SegmentedControl/` to visual parity with the Radiant 3.0 Figma frame at `figma.com/design/1QlRveXx4wppvDXyPVWUTK?node-id=2-25`.

Structure of the component is correct. Only visual style needs fixes. No new design tokens required — every value maps to an existing token in `src/tokens/`.

## Source of truth

Figma variables pulled via MCP from node `2:25`:

| Figma var | Hex | Codebase token |
|---|---|---|
| `Background/Secondary Action` | `#EAEDF2` | `background-subtle` |
| `Background/Active` | `#FFFFFF` | `background-base` |
| `Segmented Control/Content/Active` | `#2770EF` | `content-brand` |
| `Semantics/Icon/Secondary` | `#777E8B` | `content-secondary` |
| `Elevation/100` | `0 2px 4px 0 rgba(25,35,49,0.04)` ×2 | `@tokens/shadows` (verify alias) |
| `Body/Normal` | Plain 14px / weight 375 / lineHeight 20 | `fontFamily.primary`, `fontSize.sm` |

Screenshot reference saved at `/tmp/segctrl-figma.png` for the implementation pass. Figma shows no divider between segments — gap-only spacing is correct.

## Deltas

Seven changes, all in `src/components/SegmentedControl/SegmentedControl.module.css`.

| # | Property | Current | Target | Reason |
|---|---|---|---|---|
| 1 | Track `border-radius` | `8px` | `9999px` (pill) | Figma frame is fully rounded |
| 2 | Segment `border-radius` | `6px` | `9999px` (pill) | Match track shape |
| 3 | Track `background-color` | `background-sunken` (#F6F8FA) | `background-subtle` (#EAEDF2) | One step darker per Figma |
| 4 | Active segment `color` | `content-primary` (dark) | `content-brand` (#2770EF) | **Headline visual difference** — active text is blue in Figma |
| 5 | Active segment `box-shadow` | Raw `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | `Elevation/100` token (or literal `0 2px 4px 0 rgba(25,35,49,0.04)` ×2) | Match Figma Elevation/100 |
| 6 | Segment font | weight 500 / inherits 13px / lineHeight 1 | weight **375** / size **14px** / lineHeight **20px** | Plain Light per Body/Normal |
| 7 | Disabled opacity | container 0.5, segment 0.4 | unify at 0.5 | Trivial consistency fix |

## Out of scope

- Divider line between segments — Figma frame does not show one.
- Hover tint (`rgba(0,0,0,0.04)`) — Figma frame has no documented hover state for this component; will leave as-is, noted for future review.
- Doc page demo gaps (no icon-only or disabled demos in `ComponentDocPage.tsx`) — separate follow-up; doesn't affect visual parity.
- Adding component-level token aliases (e.g. `--rd-comp-color-segmented-active-text`) — not required; existing system tokens cover everything.

## Sequence

1. Inspect `src/tokens/shadows.ts` (or wherever shadows live) for an existing alias that matches `Elevation/100`. If present, use the alias; if absent, use literal CSS custom-property values inline (no new token added).
2. Apply the 7 deltas to `SegmentedControl.module.css`.
3. `npm run build` to confirm no regressions.
4. Eyeball `/radiant/components/segmentedcontrol` against the Figma screenshot. Compare track colour, pill shape, active blue text, shadow, font weight.
5. Reverse out anything that drifts visually beyond what was specified.

## Files touched

- `src/components/SegmentedControl/SegmentedControl.module.css` — only file expected to change.

## Risk

Low. CSS-only change, scoped to one component. Other Radiant pages already use SegmentedControl (e.g. doc pages) — visual style change is intentional and propagates everywhere consistently.
