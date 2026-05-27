import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.66669 3.33333H9.33335L8.22224 10.6667H3.7778L2.66669 3.33333ZM2.66669 2.66667V1.33333H9.33335V2.66667H2.66669Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.11108 3.88889H10.8889L9.59257 12.4444H4.40738L3.11108 3.88889ZM3.11108 3.11111V1.55556H10.8889V3.11111H3.11108Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.55554 4.44445H12.4444L10.9629 14.2222H5.03702L3.55554 4.44445ZM3.55554 3.55556V1.77778H12.4444V3.55556H3.55554Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4 5H14L12.3333 16H5.66667L4 5ZM4 4V2H14V4H4Z" fill="currentColor"/>` },
};

export const TrashCanIcon: React.FC<BaseIconProps> = ({
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

export default TrashCanIcon;
