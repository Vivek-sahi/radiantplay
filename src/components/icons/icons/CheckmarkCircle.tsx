import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.99998 12C9.31368 12 12 9.31368 12 5.99998C12 2.68628 9.31368 0 5.99998 0C2.68628 0 0 2.68628 0 5.99998C0 9.31368 2.68628 12 5.99998 12ZM5.47139 8.60945L9.60945 4.47139L8.66664 3.52858L5.47139 6.72384L3.9428 5.19525L2.99999 6.13805L5.47139 8.60945Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99998 14C10.866 14 14 10.866 14 6.99998C14 3.134 10.866 0 6.99998 0C3.134 0 0 3.134 0 6.99998C0 10.866 3.134 14 6.99998 14ZM6.38329 10.0444L11.211 5.21662L10.1111 4.11668L6.38329 7.84448L4.59993 6.06112L3.49999 7.16106L6.38329 10.0444Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM7.29521 11.4793L12.8126 5.96187L11.5556 4.70479L7.29521 8.96514L5.25708 6.92702L4 8.18409L7.29521 11.4793Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM8.20711 12.9142L14.4142 6.70711L13 5.29289L8.20711 10.0858L5.91421 7.79289L4.5 9.20711L8.20711 12.9142Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const CheckmarkCircleIcon: React.FC<BaseIconProps> = ({
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

export default CheckmarkCircleIcon;
