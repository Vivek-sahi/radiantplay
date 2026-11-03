import { spacing } from '@tokens/spacing';

// ── Grid spec ─────────────────────────────────────────────────────────────────
//
// Both the chat and object surfaces use a 12-column grid with 24px gutters and a
// 24px minimum side margin. The chat grid caps at 800px (centered, margins grow
// once it hits the cap); the object grid fills its pane (no cap).
//
export const CHAT_GRID = {
  columns: 12,
  maxWidth: 800,
  gutter: spacing.F, // 24
  margin: spacing.F, // 24
} as const;

export const OBJECT_GRID = {
  columns: 12,
  gutter: spacing.F, // 24
  margin: spacing.F, // 24
} as const;
