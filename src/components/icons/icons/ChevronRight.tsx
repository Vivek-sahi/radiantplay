import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.94281 9.70712L4 8.76431L6.86193 5.90238L4 3.04045L4.94281 2.09764L8.74755 5.90238L4.94281 9.70712Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.76657 11.325L4.66663 10.225L8.00554 6.88611L4.66663 3.54719L5.76657 2.44725L10.2054 6.88611L5.76657 11.325Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.59045 12.9428L5.33337 11.6857L9.14928 7.86983L5.33337 4.05392L6.59045 2.79684L11.6634 7.86983L6.59045 12.9428Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.41421 14.5607L6 13.1465L10.2929 8.85356L6 4.56067L7.41421 3.14645L13.1213 8.85356L7.41421 14.5607Z" fill="currentColor"/>` },
};

export const ChevronRightIcon: React.FC<BaseIconProps> = ({
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

export default ChevronRightIcon;
