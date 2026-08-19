import React from 'react';
import { Tooltip, Icon } from '../../../../components';
import { systemColors } from '../../../../tokens/colors';
import { ModelCacheState, canFallBackToLive } from './cacheState';
import styles from './CacheMarker.module.css';

/**
 * Data-freshness marker — **ported from Near Store**, where it was designed and reviewed
 * (`src/prototypes/NearStore/components/CacheMarker.tsx`). Brought across rather than rebuilt so
 * the consolidated prototype shows one marker, not two that drifted.
 *
 * A neutral clock glyph carries the "freshness" meaning; a small status dot shows the source at a
 * glance — GREEN = live (warehouse), BLUE = cached (ThoughtSpot). Secondary by design: it is
 * metadata about the answer and must never compete with the insight.
 *
 * Changes made on the way in:
 * - The tooltip said "cached data from AgentDB". Near Store was renamed in July and this string
 *   was missed; it says ThoughtSpot now.
 * - `caching` and `partial` states added. Near Store's model cache is enabled all at once, but
 *   ours fills table by table from the canvas, so a model can genuinely be half-cached.
 * - CSS Modules and tokens are unchanged from the original.
 */

const CACHE_TOOLTIP =
  'This model uses cached data — a snapshot held in ThoughtSpot and refreshed on a schedule so queries stay fast.';
const LIVE_TOOLTIP =
  'This model is queried live from the warehouse — read straight from the source.';
const MULTI_SOURCE_TOOLTIP =
  'This model draws on more than one warehouse, so its data has to live in ThoughtSpot — it cannot be queried live.';

export type MarkerState = 'cached' | 'live' | 'caching' | 'partial';

/** Clock glyph with a green (live) / blue (cached) status dot. */
export const FreshnessGlyph: React.FC<{ state: MarkerState }> = ({ state }) => (
  <span className={styles.clockWrap}>
    <Icon name="clock" size="s" color={systemColors.light['content-secondary']} />
    <span
      className={[styles.badge, state === 'live' ? styles.badgeLive : styles.badgeCached].join(' ')}
    />
  </span>
);

export const CacheMarker: React.FC<{
  state: MarkerState;
  /** For cached: the last-refreshed timestamp, e.g. "23 Jun, 9:00 AM". */
  detail?: string;
  /** Multi-source models cannot be queried live, so the tooltip says why. */
  multiSource?: boolean;
  variant?: 'full' | 'icon';
  className?: string;
}> = ({ state, detail, multiSource, variant = 'full', className }) => {
  const tooltip =
    state === 'live'
      ? (multiSource ? MULTI_SOURCE_TOOLTIP : LIVE_TOOLTIP)
      : CACHE_TOOLTIP;

  const label =
    state === 'live' ? 'Live'
      : state === 'caching' ? 'Caching…'
        : state === 'partial' ? 'Partly cached'
          : detail ? `Cached · ${detail}` : 'Cached';

  return (
    <span className={[styles.marker, className].filter(Boolean).join(' ')}>
      <Tooltip content={tooltip} maxWidth={280}>
        <span className={styles.iconTrigger}>
          <FreshnessGlyph state={state} />
        </span>
      </Tooltip>
      {variant !== 'icon' && <span className={styles.label}>{label}</span>}
    </span>
  );
};

/**
 * What the listing shows for a model, from whatever the canvas published.
 *
 * ⚠️ **A multi-source model can never read "Live."** Live is not a state it can be in — live is
 * exactly what cannot join across warehouses. So an uncached multi-source model shows as *not
 * cached yet* rather than as live, which are different claims. A single-source model with no
 * cache genuinely is live, and says so. Flow spec §9.
 */
export const modelMarkerState = (cache: ModelCacheState | undefined): MarkerState | null => {
  if (!cache) return 'live';           // never on our canvas — a plain warehouse-backed model
  switch (cache.status) {
    case 'caching': return 'caching';
    case 'cached': return 'cached';
    case 'partial': return 'partial';
    case 'none': return canFallBackToLive(cache) ? 'live' : 'partial';
  }
};
