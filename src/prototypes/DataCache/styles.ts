/**
 * Data Cache — shared token references
 *
 * Everything routes through Radiant tokens: no hard-coded hex / rgba / magic px.
 * Text is rendered via the Radiant `Typography` component. Colours for inline
 * props (icon colour, shell background) come from `sysVar`, so they follow light
 * and dark mode. `c[key]` keeps the call sites of the Pulse copy unchanged.
 */

import { sysVar, type SystemColorKey } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { radius } from '@tokens/radius';
import { fontFamily, fontSize, fontWeight, lineHeight } from '@tokens/typography';

export const c: Record<SystemColorKey, string> = new Proxy({} as Record<SystemColorKey, string>, {
  get: (_t, key: string) => sysVar(key as SystemColorKey),
});
export { spacing, radius, fontFamily, fontSize, fontWeight, lineHeight };
