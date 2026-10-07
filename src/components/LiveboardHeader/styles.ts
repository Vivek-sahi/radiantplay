import { sysVar, shadowVar } from '@tokens/colors/system';
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
  // The ThoughtSpot primary nav follows the theme, like the product's Radiant nav
  primaryNavBg: sysVar('background-on-base'),
  primaryNavText: sysVar('content-primary'),
  primaryNavBorder: sysVar('border-subtle'),
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
