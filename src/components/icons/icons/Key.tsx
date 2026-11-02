import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.33335 6C5.33335 6.92047 4.58716 7.66667 3.66669 7.66667C2.74621 7.66667 2.00002 6.92047 2.00002 6C2.00002 5.07953 2.74621 4.33333 3.66669 4.33333C4.58716 4.33333 5.33335 5.07953 5.33335 6ZM6.59235 5.33333C6.2892 3.99734 5.09441 3 3.66669 3C2.00983 3 0.666687 4.34315 0.666687 6C0.666687 7.65685 2.00983 9 3.66669 9C5.09441 9 6.2892 8.00266 6.59235 6.66667H8.66669V8H11.3334V5.33333H6.59235Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.22222 7C6.22222 8.07389 5.35166 8.94444 4.27777 8.94444C3.20388 8.94444 2.33333 8.07389 2.33333 7C2.33333 5.92611 3.20388 5.05556 4.27777 5.05556C5.35166 5.05556 6.22222 5.92611 6.22222 7ZM7.69104 6.22222C7.33736 4.66356 5.94345 3.5 4.27777 3.5C2.34477 3.5 0.777771 5.067 0.777771 7C0.777771 8.933 2.34477 10.5 4.27777 10.5C5.94345 10.5 7.33736 9.33644 7.69104 7.77778H10.1111V9.33333H13.2222V6.22222H7.69104Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.11114 8C7.11114 9.2273 6.11622 10.2222 4.88892 10.2222C3.66162 10.2222 2.66669 9.2273 2.66669 8C2.66669 6.7727 3.66162 5.77778 4.88892 5.77778C6.11622 5.77778 7.11114 6.7727 7.11114 8ZM8.7898 7.11111C8.38559 5.32979 6.79255 4 4.88892 4C2.67978 4 0.888916 5.79086 0.888916 8C0.888916 10.2091 2.67978 12 4.88892 12C6.79255 12 8.38559 10.6702 8.7898 8.88889H11.5556V10.6667H15.1111V7.11111H8.7898Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8 9C8 10.3807 6.88071 11.5 5.5 11.5C4.11929 11.5 3 10.3807 3 9C3 7.61929 4.11929 6.5 5.5 6.5C6.88071 6.5 8 7.61929 8 9ZM9.88849 8C9.43376 5.99601 7.64159 4.5 5.5 4.5C3.01472 4.5 1 6.51472 1 9C1 11.4853 3.01472 13.5 5.5 13.5C7.64159 13.5 9.43376 12.004 9.88849 10H13V12H17V8H9.88849Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
