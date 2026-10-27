import React from 'react';
import { iconSize } from '@tokens/icons';

/**
 * Code: </>, for SQL in the navigation (Vivek, 26 Oct: "use code icon"). Radiant's set has none,
 * so it's drawn here on Radiant's 16px grid at the weight of its icons. Local to v5, not the DS.
 */
export const CodeIcon: React.FC<{ size?: keyof typeof iconSize }> = ({ size = 'm' }) => (
  <svg width={iconSize[size]} height={iconSize[size]} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M5 4.5L1.75 8L5 11.5M11 4.5L14.25 8L11 11.5M9.25 2.75L6.75 13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
);
