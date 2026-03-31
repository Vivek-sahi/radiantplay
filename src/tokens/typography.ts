/**
 * Typography Tokens
 * 
 * Based on the Figma design system using the "Plain" font family.
 * Includes font families, sizes, weights, line heights, and composite text styles.
 */

// Font Family
export const fontFamily = {
  primary: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", "Source Code Pro", monospace',
} as const;

// Font Sizes (in pixels)
// Based on Radiant V2 typography scale
export const fontSize = {
  xs: 12,    // footnote, caption, overline
  sm: 14,    // body-normal, content-label-subhead
  md: 16,    // body-large, content-label
  lg: 18,    // section-label
  xl: 20,    // modal-title
  '2xl': 24, // page-title
  '3xl': 32, // headline-large
  '4xl': 40, // h0
  '5xl': 48, // display
} as const;

// Font Weights
export const fontWeight = {
  light: 375,
  regular: 400,
  medium: 500,
  semibold: 600,
} as const;

// Line Heights (in pixels)
// Based on Radiant V2 typography scale (font-size + 4-8px)
export const lineHeight = {
  xs: 16,    // 12px font
  sm: 18,    // 12px font (caption, footnote)
  md: 20,    // 14px font
  lg: 24,    // 16-18px font
  xl: 28,    // 20px font
  '2xl': 32, // 24px font
  '3xl': 40, // 32px font
  '4xl': 48, // 40px font
  '5xl': 56, // 48px font
} as const;

// Letter Spacing
export const letterSpacing = {
  tight: '-0.01em',
  normal: '0',
  wide: '0.01em',
  wider: '0.02em',
} as const;

/**
 * Composite Text Styles
 * These match the Figma text styles exactly
 */
export const textStyles = {
  // Display Styles
  display: {
    largeHeadline: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['3xl'],
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight['3xl'],
      letterSpacing: letterSpacing.tight,
    },
  },

  // Title Styles
  title: {
    page: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight['2xl'],
      letterSpacing: letterSpacing.normal,
    },
    modal: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.xl,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Heading Styles
  heading: {
    h1: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight['2xl'],
      letterSpacing: letterSpacing.tight,
    },
    h2: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight['2xl'],
      letterSpacing: letterSpacing.normal,
    },
    h3: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.lg,
      letterSpacing: letterSpacing.normal,
    },
    h4: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.lg,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Label Styles
  label: {
    section: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.lg,
      letterSpacing: letterSpacing.normal,
    },
    content: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.lg,
      letterSpacing: letterSpacing.normal,
    },
    contentSubhead: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      lineHeight: lineHeight.md,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Body Styles
  body: {
    large: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.light,
      lineHeight: lineHeight.lg,
      letterSpacing: letterSpacing.normal,
    },
    normal: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.light,
      lineHeight: lineHeight.md,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.xs,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Caption & Footnote Styles
  caption: {
    regular: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.sm,
      letterSpacing: letterSpacing.normal,
    },
    medium: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.sm,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Overline Styles
  overline: {
    regular: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.sm,
      letterSpacing: letterSpacing.wider,
      textTransform: 'uppercase' as const,
    },
  },

  // Button Text Styles
  button: {
    large: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.lg,
      letterSpacing: letterSpacing.normal,
    },
    medium: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.md,
      letterSpacing: letterSpacing.normal,
    },
    small: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.xs,
      letterSpacing: letterSpacing.normal,
    },
  },

  // Link Styles
  link: {
    default: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.light,
      lineHeight: lineHeight.md,
      letterSpacing: letterSpacing.normal,
      textDecoration: 'underline' as const,
    },
    medium: {
      fontFamily: fontFamily.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      lineHeight: lineHeight.md,
      letterSpacing: letterSpacing.normal,
      textDecoration: 'underline' as const,
    },
  },

  // Code/Mono Styles
  code: {
    block: {
      fontFamily: fontFamily.mono,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.md,
      letterSpacing: letterSpacing.normal,
    },
    inline: {
      fontFamily: fontFamily.mono,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.regular,
      lineHeight: lineHeight.sm,
      letterSpacing: letterSpacing.normal,
    },
  },
} as const;

/**
 * Radiant V2 Typography Styles
 * 
 * These map directly to ThoughtSpot Radiant's V2 typography system.
 * Use these for consistent text styling across the application.
 */
export const v2TextStyles = {
  // Display - Large headlines for hero sections
  headlineLarge: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize['3xl'],  // 32px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight['3xl']}px`,  // 40px
    letterSpacing: letterSpacing.tight,
  },

  // Titles - Page and modal headers
  pageTitle: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize['2xl'],  // 24px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight['2xl']}px`,  // 32px
    letterSpacing: letterSpacing.normal,
  },
  modalTitle: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.xl,  // 20px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight.xl}px`,  // 28px
    letterSpacing: letterSpacing.normal,
  },

  // Labels - Section and content headers
  sectionLabel: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.lg,  // 18px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight.lg}px`,  // 24px
    letterSpacing: letterSpacing.normal,
  },
  contentLabel: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.md,  // 16px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight.lg}px`,  // 24px
    letterSpacing: letterSpacing.normal,
  },
  contentLabelSubhead: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.sm,  // 14px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight.md}px`,  // 20px
    letterSpacing: letterSpacing.normal,
  },

  // Body - Main content text
  bodyLarge: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.md,  // 16px
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.lg}px`,  // 24px
    letterSpacing: letterSpacing.normal,
  },
  bodyNormal: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.sm,  // 14px
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.md}px`,  // 20px
    letterSpacing: letterSpacing.normal,
  },

  // Small Text - Footnotes, captions, overlines
  footnote: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.xs,  // 12px
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.sm}px`,  // 18px
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.xs,  // 12px
    fontWeight: fontWeight.regular,
    lineHeight: `${lineHeight.sm}px`,  // 18px
    letterSpacing: letterSpacing.normal,
  },
  overline: {
    fontFamily: fontFamily.primary,
    fontSize: fontSize.xs,  // 12px
    fontWeight: fontWeight.medium,
    lineHeight: `${lineHeight.sm}px`,  // 18px
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
} as const;

// V2 Text Style type
export type V2TextStyle = keyof typeof v2TextStyles;

// Type exports
export type FontFamily = keyof typeof fontFamily;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type LetterSpacing = keyof typeof letterSpacing;
export type TextStyle = typeof textStyles;

// Utility type for text style values
export type TextStyleValue = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing: string;
  textDecoration?: string;
  textTransform?: string;
};

