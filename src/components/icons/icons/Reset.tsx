import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.33334 2.66665L5.99999 0V1.99999C8.39321 1.99999 10.3333 3.94008 10.3333 6.3333C10.3333 8.72652 8.39321 10.6666 5.99999 10.6666C3.60677 10.6666 1.66668 8.72652 1.66668 6.3333H3.00001C3.00001 7.99015 4.34314 9.33329 5.99999 9.33329C7.65684 9.33329 8.99997 7.99015 8.99997 6.3333C8.99997 4.67646 7.65684 3.33332 5.99999 3.33332V5.33331L3.33334 2.66665Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.88889 3.1111L6.99998 0V2.33332C9.79208 2.33332 12.0555 4.59676 12.0555 7.38886C12.0555 10.181 9.79208 12.4444 6.99998 12.4444C4.20789 12.4444 1.94445 10.181 1.94445 7.38886H3.5C3.5 9.32184 5.06699 10.8888 6.99998 10.8888C8.93297 10.8888 10.5 9.32184 10.5 7.38886C10.5 5.45587 8.93297 3.88887 6.99998 3.88887V6.2222L3.88889 3.1111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.44443 3.55554L7.99998 0V2.66666C11.1909 2.66666 13.7777 5.25345 13.7777 8.44441C13.7777 11.6354 11.1909 14.2222 7.99998 14.2222C4.80901 14.2222 2.22222 11.6354 2.22222 8.44441H3.99999C3.99999 10.6535 5.79085 12.4444 7.99998 12.4444C10.2091 12.4444 12 10.6535 12 8.44441C12 6.23528 10.2091 4.44443 7.99998 4.44443V7.11108L4.44443 3.55554Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5 4L9 0V3C12.5899 3 15.5 5.91015 15.5 9.5C15.5 13.0899 12.5899 16 9 16C5.41015 16 2.5 13.0899 2.5 9.5H4.5C4.5 11.9853 6.51472 14 9 14C11.4853 14 13.5 11.9853 13.5 9.5C13.5 7.01472 11.4853 5 9 5V8L5 4Z" fill="currentColor"/>` },
};

export const ResetIcon: React.FC<BaseIconProps> = ({
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

export default ResetIcon;
