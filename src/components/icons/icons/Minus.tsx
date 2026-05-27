import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M1.33337 6.66668V5.33334H10.6667V6.66668H1.33337Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M1.55554 7.77778V6.22223H12.4444V7.77778H1.55554Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M1.77783 8.88889V7.11111H14.2223V8.88889H1.77783Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M2 10V8H16V10H2Z" fill="currentColor"/>` },
};

export const MinusIcon: React.FC<BaseIconProps> = ({
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

export default MinusIcon;
