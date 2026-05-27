import React from 'react';

export interface BrandMarkProps {
  /**
   * Direct pixel size for the brand mark — sets both width and height.
   * Falls back to 100% via CSS / className when omitted, so consumers
   * can size via styles instead. Defaults to 24.
   */
  pixelSize?: number;
  /**
   * Fill color for all paths. Defaults to `currentColor` so the mark
   * tints via CSS color inheritance.
   */
  color?: string;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

/**
 * ThoughtSpot brand mark — the canonical Radiant 3.0 monogram.
 *
 * Single source of truth for the TS mark. Use this anywhere the brand
 * needs to appear: app headers, primary nav bars, login screens,
 * about pages, brand strips in editors, etc.
 *
 * The SVG is 4 geometric paths (top bar + right bar + "T" hook + dot)
 * at viewBox 47.4216×48. Color flows through via `color` prop (default
 * `currentColor`) so themes can tint the mark via CSS.
 *
 * Sourced from Figma: Radiant 3.0 Design System
 * (file 1QlRveXx4wppvDXyPVWUTK · node 20202:11191).
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  pixelSize = 24,
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => (
  <svg
    width={pixelSize}
    height={pixelSize}
    viewBox="0 0 47.4216 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label={ariaLabel}
    aria-hidden={ariaHidden ?? !ariaLabel}
    role={ariaLabel ? 'img' : undefined}
  >
    <path d="M47.4216 0H0V8.78311H47.4216V0Z" fill={color} />
    <path d="M47.4216 11.7108H29.4035V20.4939H47.4216V11.7108Z" fill={color} />
    <path
      d="M11.512 11.7108H0V20.4939H11.512C15.8132 20.4939 19.3192 23.9999 19.3192 28.3011V47.4216H28.1024V28.3011C28.1024 19.1566 20.6566 11.7108 11.512 11.7108Z"
      fill={color}
    />
    <path
      d="M38.4216 33.253C34.3554 33.253 31.0481 36.5603 31.0481 40.6265C31.0481 44.6928 34.3554 48 38.4216 48C42.4879 48 45.7951 44.6928 45.7951 40.6265C45.7951 36.5603 42.4879 33.253 38.4216 33.253Z"
      fill={color}
    />
  </svg>
);

BrandMark.displayName = 'BrandMark';

export default BrandMark;
