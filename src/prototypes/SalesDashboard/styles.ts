import { systemColors } from '@tokens/colors/system';

export const colors = {
  pageBg: systemColors.light['background-sunken'],
  cardBg: systemColors.light['background-base'],
  headerBg: systemColors.light['background-base'],
  editHeaderBg: '#1C2029',

  textPrimary: systemColors.light['content-primary'],
  textSecondary: systemColors.light['content-secondary'],

  brand: systemColors.light['content-brand'],

  border: systemColors.light['border-default'],
  borderDivider: systemColors.light['border-divider'],

  chartBlue: '#2770EF',
  chartGreen: '#5A9E8A',

  success: '#06BF7F',
  successBg: '#E6F9F1',

  panelBg: systemColors.light['background-base'],
  panelBorder: systemColors.light['border-default'],

  spotterUserBubble: '#2770EF',
  spotterAiBubble: systemColors.light['background-sunken'],
} as const;

export const typography = {
  fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export const shadows = {
  header: '0px 0px 4px 0px rgba(25,35,49,0.1), 0px 2px 4px 0px rgba(25,35,49,0.04)',
  panel: '-2px 0 8px rgba(0,0,0,0.08)',
} as const;

export const layout = {
  headerHeight: 60,
  tabBarHeight: 60,
  spotterPanelWidth: 340,
  canvasMargin: 24,
  tileGap: 16,
  tileRadius: 12,
} as const;
