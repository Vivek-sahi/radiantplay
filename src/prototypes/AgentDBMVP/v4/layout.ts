/** Table column widths as token expressions, so no pixel literal lives in a component. */
export const COL = {
  xs: 'var(--spacing-14)',                                   // 56
  sm: 'calc(var(--spacing-16) + var(--spacing-2))',           // 72
  md: 'var(--spacing-24)',                                   // 96
  lg: 'calc(var(--spacing-24) + var(--spacing-6))',           // 120
  xl: 'calc(var(--spacing-24) + var(--spacing-16))',          // 160
} as const;
