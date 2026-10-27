import React from 'react';
import { iconSize } from '@tokens/icons';

/**
 * Home, for Overview in the navigation (Vivek, 26 Oct). Radiant's set has none, so it's drawn
 * here on Radiant's 16px grid, filled like Radiant's icons. Local to v5, not the DS.
 */
export const HomeIcon: React.FC<{ size?: keyof typeof iconSize }> = ({ size = 'm' }) => (
  <svg width={iconSize[size]} height={iconSize[size]} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 1.25L1.5 6.6V14.25H6.25V10H9.75V14.25H14.5V6.6L8 1.25ZM13 7.3L8 3.2L3 7.3V12.75H4.75V8.5H11.25V12.75H13V7.3Z" fill="currentColor" />
  </svg>
);
