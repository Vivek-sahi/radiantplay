import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.33329 6C5.33329 6.92047 4.5871 7.66667 3.66663 7.66667C2.74615 7.66667 1.99996 6.92047 1.99996 6C1.99996 5.07953 2.74615 4.33333 3.66663 4.33333C4.5871 4.33333 5.33329 5.07953 5.33329 6ZM6.59229 5.33333C6.28913 3.99734 5.09435 3 3.66663 3C2.00977 3 0.666626 4.34315 0.666626 6C0.666626 7.65685 2.00977 9 3.66663 9C5.09435 9 6.28913 8.00266 6.59229 6.66667H8.66663V8H11.3333V5.33333H6.59229Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.22228 7C6.22228 8.07389 5.35172 8.94444 4.27783 8.94444C3.20394 8.94444 2.33339 8.07389 2.33339 7C2.33339 5.92611 3.20394 5.05556 4.27783 5.05556C5.35172 5.05556 6.22228 5.92611 6.22228 7ZM7.6911 6.22222C7.33742 4.66356 5.94351 3.5 4.27783 3.5C2.34484 3.5 0.777832 5.067 0.777832 7C0.777832 8.933 2.34484 10.5 4.27783 10.5C5.94351 10.5 7.33742 9.33644 7.6911 7.77778H10.1112V9.33333H13.2223V6.22222H7.6911Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.11114 8C7.11114 9.2273 6.11622 10.2222 4.88892 10.2222C3.66162 10.2222 2.66669 9.2273 2.66669 8C2.66669 6.7727 3.66162 5.77778 4.88892 5.77778C6.11622 5.77778 7.11114 6.7727 7.11114 8ZM8.7898 7.11111C8.38559 5.32979 6.79255 4 4.88892 4C2.67978 4 0.888916 5.79086 0.888916 8C0.888916 10.2091 2.67978 12 4.88892 12C6.79255 12 8.38559 10.6702 8.7898 8.88889H11.5556V10.6667H15.1111V7.11111H8.7898Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 9C8 10.3807 6.88071 11.5 5.5 11.5C4.11929 11.5 3 10.3807 3 9C3 7.61929 4.11929 6.5 5.5 6.5C6.88071 6.5 8 7.61929 8 9ZM9.88849 8C9.43376 5.99601 7.64159 4.5 5.5 4.5C3.01472 4.5 1 6.51472 1 9C1 11.4853 3.01472 13.5 5.5 13.5C7.64159 13.5 9.43376 12.004 9.88849 10H13V12H17V8H9.88849Z" fill="currentColor"/>` },
};

export const KeyIcon: React.FC<BaseIconProps> = ({
  size = 'm',
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}) => {
  const variant = VARIANTS[size];
  return (
    <svg
      width={iconSize[size]}
      height={iconSize[size]}
      viewBox={variant.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
      style={{ color }}
      dangerouslySetInnerHTML={{ __html: variant.inner }}
    />
  );
};

export default KeyIcon;
