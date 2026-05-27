import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.99998 12C9.31368 12 12 9.31371 12 6.00001C12 2.68631 9.31368 3.05176e-05 5.99998 3.05176e-05C2.68628 3.05176e-05 0 2.68631 0 6.00001C0 9.31371 2.68628 12 5.99998 12ZM5.47139 8.60948L9.60945 4.47142L8.66664 3.52862L5.47139 6.72387L3.9428 5.19528L2.99999 6.13808L5.47139 8.60948Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.99998 14C10.866 14 14 10.866 14 7.00001C14 3.13403 10.866 3.05176e-05 6.99998 3.05176e-05C3.134 3.05176e-05 0 3.13403 0 7.00001C0 10.866 3.134 14 6.99998 14ZM6.38329 10.0444L11.211 5.21665L10.1111 4.11671L6.38329 7.84451L4.59993 6.06115L3.49999 7.16109L6.38329 10.0444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99998 16C12.4183 16 16 12.4183 16 8.00002C16 3.58175 12.4183 3.05175e-05 7.99998 3.05175e-05C3.58171 3.05175e-05 0 3.58175 0 8.00002C0 12.4183 3.58171 16 7.99998 16ZM7.29519 11.4793L12.8126 5.96189L11.5555 4.70481L7.29519 8.96516L5.25707 6.92703L3.99999 8.18411L7.29519 11.4793Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM8.20711 12.9142L14.4142 6.70711L13 5.29289L8.20711 10.0858L5.91421 7.79289L4.5 9.20711L8.20711 12.9142Z" fill="currentColor"/>` },
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
