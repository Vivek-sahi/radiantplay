import { spacing } from '@tokens/spacing';

/**
 * Reads CSS source and lists the design tokens it uses, with the name
 * engineering writes in scaligent SCSS. Same mapping as
 * internal/scripts/handoff-export.mjs, so the spec sheet and the export agree.
 */

export type TokenKind = 'colour' | 'spacing' | 'type' | 'radius' | 'shadow' | 'motion' | 'other';

export interface TokenUse {
  /** CSS variable without var(), such as --rd-sys-color-content-primary */
  variable: string;
  kind: TokenKind;
  /** What engineering writes in scaligent, when there is a 1:1 name. */
  scss?: string;
  uses: number;
}

export interface TokenScan {
  tokens: TokenUse[];
  /** Hex and rgb() colours written as raw values. */
  rawColours: string[];
  /** px values outside var() fallbacks, other than 0 and 1px hairlines. */
  rawPx: string[];
}

// px value → spacing letter, from src/tokens/spacing.ts (A..N). scaligent has a..l.
const PX_TO_LETTER = new Map<number, string>();
Object.entries(spacing).forEach(([key, value]) => {
  if (/^[A-N]$/.test(key) && !PX_TO_LETTER.has(value)) PX_TO_LETTER.set(value, key);
});

/** "D · 16" for on-grid values, "6px" otherwise. */
export function spacingLabel(px: number): string {
  const letter = PX_TO_LETTER.get(px);
  return letter ? `${letter} · ${px}` : `${px}px`;
}

/** $rd-spacing--d for on-grid values scaligent has (4 to 64). */
export function spacingScss(px: number): string | undefined {
  const letter = PX_TO_LETTER.get(px);
  return letter && letter <= 'L' ? `$rd-spacing--${letter.toLowerCase()}` : undefined;
}

function spacingVarPx(name: string): number | undefined {
  const key = name.replace('--spacing-', '');
  const match = Object.entries(spacing).find(([k]) => k.toLowerCase() === key);
  return match ? match[1] : undefined;
}

function classify(variable: string): Pick<TokenUse, 'kind' | 'scss'> {
  if (variable.startsWith('--rd-sys-color-shadow-')) return { kind: 'shadow', scss: `rd-sys-color('${variable.slice(15)}')` };
  if (variable.startsWith('--rd-sys-color-')) return { kind: 'colour', scss: `rd-sys-color('${variable.slice(15)}')` };
  // Component colours: the scaligent name is not confirmed yet (handoff plan, open question 1).
  if (variable.startsWith('--rd-comp-color-')) return { kind: 'colour' };
  if (variable.startsWith('--spacing-')) {
    const px = spacingVarPx(variable);
    return { kind: 'spacing', scss: px === undefined ? undefined : spacingScss(px) };
  }
  if (/^--(font|line-height|letter-spacing)-/.test(variable)) return { kind: 'type' };
  if (variable.startsWith('--radius-')) return { kind: 'radius' };
  if (variable.startsWith('--shadow-') || variable.startsWith('--elevation-')) return { kind: 'shadow' };
  if (variable.startsWith('--duration-') || variable.startsWith('--easing-')) return { kind: 'motion' };
  return { kind: 'other' };
}

const KIND_ORDER: TokenKind[] = ['colour', 'spacing', 'type', 'radius', 'shadow', 'motion', 'other'];

export function scanCss(sources: string[]): TokenScan {
  const counts = new Map<string, number>();
  const rawColours = new Set<string>();
  const rawPx = new Set<string>();

  for (const raw of sources) {
    const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
      counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    }
    // Raw values only count outside var(...) fallbacks and custom property definitions.
    const declarations = css
      .split(/[;{}]/)
      .map((d) => d.trim())
      .filter((d) => d.includes(':') && !d.startsWith('--') && !d.startsWith('@'));
    for (const decl of declarations) {
      const value = decl.slice(decl.indexOf(':') + 1).replace(/var\([^()]*(\([^()]*\))?[^()]*\)/g, '');
      for (const m of value.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)) rawColours.add(m[0]);
      for (const m of value.matchAll(/(?<![\w.-])(\d*\.?\d+)px\b/g)) {
        if (Number(m[1]) > 1) rawPx.add(`${m[1]}px`);
      }
    }
  }

  const tokens = [...counts.entries()]
    .map(([variable, uses]) => ({ variable, uses, ...classify(variable) }))
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.variable.localeCompare(b.variable));

  return { tokens, rawColours: [...rawColours].sort(), rawPx: [...rawPx].sort((a, b) => parseFloat(a) - parseFloat(b)) };
}
