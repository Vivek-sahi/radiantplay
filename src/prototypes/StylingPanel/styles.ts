export const colors = {
  pageBg: '#F6F8FA',
  cardBg: '#FFFFFF',
  navBg: '#1C2029',
  headerBg: '#FFFFFF',
  kpiCardBg: '#163772',

  textPrimary: '#1D232F',
  textSecondary: '#777E8B',
  textMuted: '#4A515E',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#EAEDF2',

  brand: '#3D7A6A',
  brandLight: '#B2C9C4',
  brandDark: '#2C5C50',

  border: '#EAEDF2',
  borderDark: '#C0C6CF',

  failure: '#E22B3D',
  failureBg: '#FFEBEC',

  chartBar: '#5A9E8A',
  chartLine: '#3D7A6A',
  chartDot: '#B2C9C4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

export const borderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  card: 16,
  full: 9999,
} as const;

export const shadows = {
  header: '0px 0px 4px 0px rgba(25,35,49,0.1), 0px 2px 4px 0px rgba(25,35,49,0.04)',
} as const;
