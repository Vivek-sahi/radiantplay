import React from 'react';
import { Tooltip, Icon } from '@/components';
import { c } from '../styles';
import styles from './CacheMarker.module.css';

/**
 * Data-freshness marker. A neutral clock glyph carries the "freshness" meaning;
 * a small status dot shows the source at a glance — GREEN = live (warehouse),
 * BLUE = cached (Near Store). Secondary by design: it is metadata about the
 * answer and must never compete with the insight.
 * - full (default) → clock + dot + "Last refreshed on {date}" / "Live"
 * - compact        → clock + dot + "as of {date}"
 * - icon           → clock + dot only; the tooltip carries the detail (Liveboard hover)
 */
const CACHE_TOOLTIP =
  'This answer uses cached data from Near Store — a snapshot of the model refreshed on a schedule so queries stay fast.';
const LIVE_TOOLTIP =
  'This answer is queried live from the warehouse (Snowflake) — read straight from the source.';

export type CacheCopy = 'default' | 'source';

export interface CacheMarkerProps {
  state: 'cached' | 'live';
  /** For cached: the last-refreshed timestamp, e.g. "23 Jun, 9:00 AM". */
  detail?: string;
  variant?: 'full' | 'compact' | 'icon';
  /**
   * default — "Last refreshed on {date}" / "Live".
   * source  — foregrounds where the answer was queried from (the honest axis,
   *           since a "live" answer isn't guaranteed current): "Cached · updated
   *           {date}" / "Live from warehouse".
   */
  copy?: CacheCopy;
  className?: string;
}

/** Clock glyph with a green (live) / blue (cached) status dot. */
export const FreshnessGlyph: React.FC<{ state: 'cached' | 'live' }> = ({ state }) => (
  <span className={styles.clockWrap}>
    <Icon name="clock" size="s" color={c['content-secondary']} />
    <span
      className={[styles.badge, state === 'live' ? styles.badgeLive : styles.badgeCached].join(' ')}
    />
  </span>
);

export const CacheMarker: React.FC<CacheMarkerProps> = ({
  state,
  detail,
  variant = 'full',
  copy = 'default',
  className,
}) => {
  const cls = [styles.marker, className].filter(Boolean).join(' ');

  const tooltip =
    state === 'live'
      ? LIVE_TOOLTIP
      : variant === 'icon' && detail
        ? `Last updated on ${detail}. ${CACHE_TOOLTIP}`
        : CACHE_TOOLTIP;

  const label =
    state === 'live'
      ? copy === 'source'
        ? 'Live from warehouse'
        : 'Live'
      : copy === 'source'
        ? `Cached · updated ${detail}`
        : variant === 'compact'
          ? `as of ${detail}`
          : `Last updated on ${detail}`;

  return (
    <span className={cls}>
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
 * DotMarker — the quiet "dot only" exploration (no clock). Green = live,
 * blue = cached; detail on hover.
 */
export const DotMarker: React.FC<{ state: 'cached' | 'live'; detail?: string }> = ({
  state,
  detail,
}) => {
  const tip =
    state === 'cached'
      ? detail
        ? `${CACHE_TOOLTIP} Last updated on ${detail}.`
        : CACHE_TOOLTIP
      : LIVE_TOOLTIP;
  const dotCls = [styles.dot, state === 'cached' ? styles.dotCached : styles.dotLive].join(' ');
  return (
    <Tooltip content={tip} maxWidth={280}>
      <span className={dotCls} role="img" aria-label={state === 'cached' ? 'Cached' : 'Live'} />
    </Tooltip>
  );
};
