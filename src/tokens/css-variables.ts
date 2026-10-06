/**
 * CSS Variables Generator
 * 
 * Generates CSS custom properties from design tokens.
 * This enables runtime theming and easy token consumption in CSS.
 */

import { referenceColors } from './colors/reference';
import { systemColors } from './colors/system';
import { rdComponentColors } from './colors/component';
import { fontSize, fontWeight, lineHeight, letterSpacing, fontFamily } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows, elevation } from './shadows';
import { borderWidth } from './borders';
import { duration, easing } from './animation';
import { zIndex } from './zIndex';

/**
 * Helper to convert camelCase to kebab-case
 */
const toKebabCase = (str: string): string =>
  str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Helper to flatten nested objects into CSS variable format
 */
const flattenObject = (
  obj: Record<string, any>,
  prefix: string = ''
): Record<string, string> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newKey = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = String(value);
    }
    
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Generate CSS variables object
 */
export const generateCSSVariables = () => {
  const variables: Record<string, string> = {};

  // Reference Colors (3-layer architecture)
  const refColorVars = flattenObject(referenceColors, 'rd-ref-color');
  Object.assign(variables, refColorVars);

  // Font
  variables['font-family-primary'] = fontFamily.primary;
  variables['font-family-mono'] = fontFamily.mono;

  // Font Sizes
  Object.entries(fontSize).forEach(([key, value]) => {
    variables[`font-size-${toKebabCase(key)}`] = `${value}px`;
  });

  // Font Weights
  Object.entries(fontWeight).forEach(([key, value]) => {
    variables[`font-weight-${toKebabCase(key)}`] = String(value);
  });

  // Line Heights
  Object.entries(lineHeight).forEach(([key, value]) => {
    variables[`line-height-${toKebabCase(key)}`] = `${value}px`;
  });

  // Letter Spacing
  Object.entries(letterSpacing).forEach(([key, value]) => {
    variables[`letter-spacing-${toKebabCase(key)}`] = value;
  });

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    if (typeof value === 'number') {
      variables[`spacing-${toKebabCase(key)}`] = `${value}px`;
    }
  });

  // Radius
  Object.entries(radius).forEach(([key, value]) => {
    variables[`radius-${toKebabCase(key)}`] = value === 9999 ? '9999px' : `${value}px`;
  });

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    variables[`shadow-${toKebabCase(key)}`] = value;
  });

  // Elevation
  Object.entries(elevation).forEach(([key, value]) => {
    variables[`elevation-${toKebabCase(key)}`] = value;
  });

  // Border Widths
  Object.entries(borderWidth).forEach(([key, value]) => {
    variables[`border-width-${toKebabCase(key)}`] = `${value}px`;
  });

  // Duration
  Object.entries(duration).forEach(([key, value]) => {
    variables[`duration-${toKebabCase(key)}`] = `${value}ms`;
  });

  // Easing
  Object.entries(easing).forEach(([key, value]) => {
    variables[`easing-${toKebabCase(key)}`] = value;
  });

  // Z-Index
  Object.entries(zIndex).forEach(([key, value]) => {
    variables[`z-index-${toKebabCase(key)}`] = String(value);
  });

  return variables;
};

/**
 * Generate theme-specific CSS variables
 */
export const generateThemeVariables = (theme: 'light' | 'dark') => {
  const sysColors = systemColors[theme];
  const compColors = rdComponentColors[theme];

  const vars: Record<string, string> = {};

  // System tokens
  Object.entries(sysColors).forEach(([key, value]) => {
    vars[`rd-sys-color-${key}`] = value;
  });

  // Component tokens
  Object.entries(compColors).forEach(([key, value]) => {
    vars[`rd-comp-color-${key}`] = value;
  });

  return vars;
};

/**
 * Convert variables object to CSS string
 */
export const variablesToCSS = (
  variables: Record<string, string>,
  selector: string = ':root'
): string => {
  const cssVars = Object.entries(variables)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');

  return `${selector} {\n${cssVars}\n}`;
};

/**
 * Generate complete CSS variables stylesheet
 */
export const generateCSSStylesheet = (): string => {
  const baseVars = generateCSSVariables();
  const lightVars = generateThemeVariables('light');
  const darkVars = generateThemeVariables('dark');

  return `/**
 * Design Tokens - CSS Custom Properties
 * Generated from Figma design system
 */

/* Base tokens (theme-independent) */
${variablesToCSS(baseVars, ':root')}

/* Light theme (default) */
${variablesToCSS(lightVars, ':root, [data-theme="light"]')}

/* Dark theme */
${variablesToCSS(darkVars, '[data-theme="dark"]')}

/* System preference dark mode */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${Object.entries(darkVars).map(([key, value]) => `    --${key}: ${value};`).join('\n')}
  }
}
`;
};

/**
 * CSS variable references for use in JS/TS
 * Usage: cssVar.color.primary.default -> 'var(--color-primary-default)'
 */
const createVarProxy = (prefix: string = ''): any => {
  return new Proxy({}, {
    get(_, prop: string) {
      const newPrefix = prefix ? `${prefix}-${toKebabCase(prop)}` : toKebabCase(prop);
      
      // Return a function that gets the var, or continue building the path
      const varRef = `var(--${newPrefix})`;
      
      // Return both the string and a proxy for nested access
      const proxy = createVarProxy(newPrefix);
      proxy.toString = () => varRef;
      proxy.valueOf = () => varRef;
      
      return proxy;
    },
  });
};

export const cssVar = createVarProxy();

// Type for CSS variable references
export type CSSVarRef = string & { [key: string]: CSSVarRef };

