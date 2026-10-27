import React from 'react';
import { iconSize } from '@tokens/icons';

/**
 * Go to (↗), for links that take you to another page (Vivek, 27 Oct). Radiant's set has none, so
 * it's drawn here on Radiant's 16px grid, like CodeIcon and HomeIcon. Local to v5, not the DS.
 */
export const GoToIcon: React.FC<{ size?: keyof typeof iconSize }> = ({ size = 'm' }) => (
  <svg width={iconSize[size]} height={iconSize[size]} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M5 11L11 5M6 4.75H11.25V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
);
