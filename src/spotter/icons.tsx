import React from 'react';
import type { BaseIconProps } from '@components/icons';
import { iconSize } from '../tokens/icons';

/**
 * Spotter-specific icons.
 *
 * Matches Radiant's icon API (BaseIconProps + IconSize) so consumers can
 * pass `size="m"` etc. exactly like `<Icon name="..." />`. Only glyphs that
 * the Radiant registry does not yet ship live here. The full Radiant
 * catalog is at `/radiant/icons`.
 */

/**
 * Panel toggle — rounded rectangle with a vertical divider creating a small
 * left compartment and a larger right compartment. Sourced from the Spotter
 * Left Panel Figma file (node 3529:24539). No Radiant equivalent yet.
 */
export const PanelToggleIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden}
    role={ariaLabel ? 'img' : undefined}
  >
    <g transform="translate(1.35 2.58)">
      <path
        d="M14.3213 0C14.8665 0.000187257 15.3084 0.442115 15.3086 0.987305V11.9756L15.3037 12.0762C15.2531 12.5741 14.8325 12.9627 14.3213 12.9629H0.987305L0.886719 12.958C0.421869 12.9108 0.0521021 12.541 0.00488281 12.0762L0 11.9756V0.987305C0.000175585 0.476069 0.388775 0.055423 0.886719 0.00488281L0.987305 0H14.3213ZM2 2V10.9629H4.4043V2H2ZM6.4043 2V10.9629H13.3086V2H6.4043Z"
        fill={color}
      />
    </g>
  </svg>
);

PanelToggleIcon.displayName = 'PanelToggleIcon';

/**
 * Bell — notifications. No Radiant equivalent yet.
 */
export const BellIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden}
    role={ariaLabel ? 'img' : undefined}
  >
    <path
      d="M9 2.25c-2.485 0-4.5 2.015-4.5 4.5v2.25c0 .624-.248 1.222-.69 1.664L3 11.475c-.354.354-.103.96.397.96h11.206c.5 0 .751-.606.397-.96l-.81-.811A2.354 2.354 0 0 1 13.5 9V6.75c0-2.485-2.015-4.5-4.5-4.5z"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.125 14.25a1.875 1.875 0 0 0 3.75 0"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

BellIcon.displayName = 'BellIcon';

/**
 * ThoughtSpot brand mark.
 *
 * @deprecated Import `BrandMark` from `@components/BrandMark` instead.
 * Kept as an alias for backwards compatibility — the Radiant DS now owns
 * the single source of truth for the brand mark since it's a product-
 * agnostic asset used across many surfaces (GlobalHeader, LiveboardHeader,
 * Spotter showcase, etc.).
 */
export { BrandMark as ThoughtSpotMark } from '@components/BrandMark';
export type { BrandMarkProps as ThoughtSpotMarkProps } from '@components/BrandMark';

/**
 * Chart-with-search glyph — used as the "Ask" mode in the Spotter prompt
 * mode toggle. Bar chart on the left half + magnifying glass with circle
 * on the right. Sourced from the Spotter prompt-bar Figma node.
 */
export const ChartSearchIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 16.9142 16.9142"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden}
    role={ariaLabel ? 'img' : undefined}
  >
    <path d="M8 0H11V6.02469C9.83642 6.14022 8.79019 6.65465 8 7.42929V0Z" fill={color} />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.9142 15.5L15.5 16.9142L13.291 14.5336C11.7789 15.3373 9.85962 15.1023 8.58576 13.8284C7.02366 12.2663 7.02366 9.73367 8.58576 8.17157C10.1479 6.60948 12.6805 6.60948 14.2426 8.17157C15.6039 9.53282 15.7789 11.6311 14.7677 13.1819L16.9142 15.5ZM9.99997 9.58579C10.781 8.80474 12.0473 8.80474 12.8284 9.58579C13.6094 10.3668 13.6094 11.6332 12.8284 12.4142C12.0473 13.1953 10.781 13.1953 9.99997 12.4142C9.21892 11.6332 9.21892 10.3668 9.99997 9.58579Z"
      fill={color}
    />
    <path
      d="M6.5 11C6.5 10.2177 6.67967 9.47732 7 8.81794V3.42857H4V12.8571H6.85625C6.62642 12.283 6.5 11.6563 6.5 11Z"
      fill={color}
    />
    <path d="M3 6.57143H0V12.8571H3V6.57143Z" fill={color} />
  </svg>
);

ChartSearchIcon.displayName = 'ChartSearchIcon';

/**
 * Orbits glyph — used as the "Analyze" mode in the Spotter prompt mode
 * toggle. Two crossed elliptical orbits with a center dot (atomic / DNA
 * helix style). Sourced from the Spotter prompt-bar Figma node.
 */
export const OrbitsIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => (
  <svg
    width={iconSize[size]}
    height={iconSize[size]}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden}
    role={ariaLabel ? 'img' : undefined}
  >
    <g transform="translate(9 9)">
      <ellipse
        cx="0"
        cy="0"
        rx="2.6"
        ry="6.2"
        stroke={color}
        strokeWidth="1.4"
        fill="none"
        transform="rotate(-45)"
      />
      <ellipse
        cx="0"
        cy="0"
        rx="2.6"
        ry="6.2"
        stroke={color}
        strokeWidth="1.4"
        fill="none"
        transform="rotate(45)"
      />
      <circle cx="0" cy="0" r="1.4" fill={color} />
    </g>
  </svg>
);

OrbitsIcon.displayName = 'OrbitsIcon';
