/**
 * Agent DB — shared token references
 *
 * Everything routes through Radiant tokens: no hard-coded hex / rgba / magic px.
 * Text is rendered via the Radiant `Typography` component; these tokens cover the
 * few bespoke surfaces (dark shell, status pills, data-row values).
 */

import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { radius } from '../../tokens/radius';
import { fontFamily, fontSize, fontWeight, lineHeight } from '../../tokens/typography';

export const c = systemColors.light;
export { spacing, radius, fontFamily, fontSize, fontWeight, lineHeight };

/** Dark-shell surfaces (icon rail + Data workspace sidebar + top bar). */
export const shell = {
  bg: c['background-base-inverse'], // #1D232F
  raised: c['background-raised-inverse'], // #323946
  text: c['content-primary-inverse'], // #FFFFFF
  textDim: c['content-tertiary'], // #C0C6CF
  textMuted: c['content-secondary'], // #777E8B
  accent: c['content-brand-inverse'], // #71A1F4
  divider: c['border-divider-inverse'], // #4A515E
};
