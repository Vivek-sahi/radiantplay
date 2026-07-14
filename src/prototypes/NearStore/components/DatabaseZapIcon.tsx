import React from 'react';

/** lucide:database-zap — indicates a model is cached in Near Store. */
export const DatabaseZapIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 21 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M10 7C14.9706 7 19 5.65685 19 4C19 2.34315 14.9706 1 10 1C5.02944 1 1 2.34315 1 4C1 5.65685 5.02944 7 10 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 4V18C0.9945 18.4809 1.33587 18.9552 1.99541 19.383C2.65494 19.8107 3.6133 20.1793 4.78971 20.4577C5.96612 20.7361 7.32609 20.9162 8.755 20.9827C10.1839 21.0493 11.6398 21.0003 13 20.84M19 4V7M19 11L16 16H20L17 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 11C1.00152 11.4675 1.33076 11.9285 1.96153 12.3461C2.5923 12.7636 3.50713 13.1263 4.63304 13.4051C5.75895 13.6839 7.06476 13.8711 8.44629 13.9519C9.82782 14.0326 11.2468 14.0045 12.5901 13.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
