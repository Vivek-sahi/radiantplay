import { sysVar, shadowVar } from '@tokens/colors';
import { chartPalette } from '@tokens/colors/charts';

export const colors = {
  pageBg: sysVar('background-sunken'),
  cardBg: sysVar('background-base'),
  headerBg: sysVar('background-base'),
  editHeaderBg: sysVar('background-inverse'),

  textPrimary: sysVar('content-primary'),
  textSecondary: sysVar('content-secondary'),

  brand: sysVar('content-brand'),

  border: sysVar('border-default'),
  borderDivider: sysVar('border-divider'),

  // Chart series colours stay literal: ECharts draws to canvas and cannot read
  // CSS variables. The shared chart theme remaps the palette for dark mode.
  chartBlue: chartPalette.primary[0],
  chartGreen: chartPalette.primary[2],

  success: sysVar('content-success'),
  successBg: sysVar('background-success'),

  panelBg: sysVar('background-base'),
  panelBorder: sysVar('border-default'),

  spotterUserBubble: sysVar('background-brand'),
  spotterAiBubble: sysVar('background-sunken'),
} as const;

export const typography = {
  fontFamily: 'var(--font-family-primary)',
} as const;

export const shadows = {
  header: shadowVar('surface'),
  panel: shadowVar('surface'),
} as const;

export const layout = {
  headerHeight: 60,
  tabBarHeight: 60,
  spotterPanelWidth: 340,
  canvasMargin: 24,
  tileGap: 16,
  tileRadius: 12,
} as const;
