import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.33333 1.33333H6.66667V10.6667H5.33333V1.33333Z" fill="currentColor"/>
<path d="M1.33333 6.66666V5.33333H10.6667V6.66666H1.33333Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.22222 1.55556H7.77778V12.4444H6.22222V1.55556Z" fill="currentColor"/>
<path d="M1.55556 7.77778V6.22222H12.4444V7.77778H1.55556Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.11111 1.77777H8.88889V14.2222H7.11111V1.77777Z" fill="currentColor"/>
<path d="M1.77778 8.88888V7.1111H14.2222V8.88888H1.77778Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8 2H10V16H8V2Z" fill="currentColor"/>
<path d="M2 10V8H16V10H2Z" fill="currentColor"/>` },
};

export const PlusIcon: React.FC<BaseIconProps> = ({
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

export default PlusIcon;
