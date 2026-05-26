import { CSSProperties } from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontFamily, fontSize, fontWeight } from '../../tokens/typography';

export const c  = systemColors.light;
export const sp = spacing;
export const ff = fontFamily;
export const fs = fontSize;
export const fw = fontWeight;

export const HEADER_HEIGHT  = 52;
export const TAB_BAR_HEIGHT = 40;

export const styles: Record<string, CSSProperties> = {
  pageHeader: {
    height: HEADER_HEIGHT,
    backgroundColor: systemColors.light['background-base'],
    borderBottom: `1px solid ${systemColors.light['border-divider']}`,
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${spacing.F}px`,
    flexShrink: 0,
    gap: spacing.B,
  },
  tabBar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: systemColors.light['background-base'],
    borderBottom: `1px solid ${systemColors.light['border-divider']}`,
    display: 'flex',
    alignItems: 'flex-end',
    padding: `0 ${spacing.F}px`,
    flexShrink: 0,
    gap: spacing.A,
  },
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: systemColors.light['background-sunken'],
  },
};
