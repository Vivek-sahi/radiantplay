import { systemColors } from '@tokens/colors/system';
import { fontFamily } from '@tokens/typography';

export const colors = {
  pageBg: systemColors.light['background-sunken'],
  headerBg: systemColors.light['background-base'],
  editHeaderBg: systemColors.light['background-base-inverse'],
  textPrimary: systemColors.light['content-primary'],
  textSecondary: systemColors.light['content-secondary'],
  textOnDark: systemColors.light['content-primary-inverse'],
  textOnDarkMuted: systemColors.light['border-subtle-hover'],
  brand: systemColors.light['content-brand'],
  border: systemColors.light['border-divider'],
  borderDark: systemColors.light['border-default-inverse'],
  divider: systemColors.light['border-default'],
  actionPillBg: systemColors.light['background-subtle'],
} as const;

export const typography = {
  fontFamily: fontFamily.primary,
} as const;

export const shadows = {
  header: '0px 0px 4px 0px rgba(25,35,49,0.1), 0px 2px 4px 0px rgba(25,35,49,0.04)',
} as const;

export const layout = {
  headerHeight: 60,
  tabBarHeight: 60,
} as const;
