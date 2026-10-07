import { sysVar, shadowVar, systemColors } from '@tokens/colors/system';
import { fontFamily } from '@tokens/typography';

export const colors = {
  pageBg: sysVar('background-sunken'),
  headerBg: sysVar('background-base'),
  editHeaderBg: sysVar('background-base-inverse'),
  textPrimary: sysVar('content-primary'),
  textSecondary: sysVar('content-secondary'),
  textOnDark: sysVar('content-primary-inverse'),
  textOnDarkMuted: sysVar('border-subtle-hover'),
  brand: sysVar('content-brand'),
  border: sysVar('border-divider'),
  borderDark: sysVar('border-default-inverse'),
  divider: sysVar('border-default'),
  actionPillBg: sysVar('background-subtle'),
  // The ThoughtSpot primary nav is dark in both themes, like AppSidebar, so it reads fixed values
  primaryNavBg: systemColors.light['background-base-inverse'],
  primaryNavText: systemColors.light['content-primary-inverse'],
} as const;

export const typography = {
  fontFamily: fontFamily.primary,
} as const;

export const shadows = {
  header: shadowVar('surface'),
} as const;

export const layout = {
  headerHeight: 60,
  tabBarHeight: 60,
} as const;
