import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M3.33341 2.66667L6.00008 0V2C8.39332 2 10.3334 3.9401 10.3334 6.33333C10.3334 8.72657 8.39332 10.6667 6.00008 10.6667C3.60685 10.6667 1.66675 8.72657 1.66675 6.33333H3.00008C3.00008 7.99019 4.34323 9.33333 6.00008 9.33333C7.65694 9.33333 9.00008 7.99019 9.00008 6.33333C9.00008 4.67648 7.65694 3.33333 6.00008 3.33333V5.33333L3.33341 2.66667Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.88878 3.11111L6.99989 0V2.33333C9.792 2.33333 12.0554 4.59678 12.0554 7.38889C12.0554 10.181 9.792 12.4444 6.99989 12.4444C4.20779 12.4444 1.94434 10.181 1.94434 7.38889H3.49989C3.49989 9.32189 5.06689 10.8889 6.99989 10.8889C8.93289 10.8889 10.4999 9.32189 10.4999 7.38889C10.4999 5.45589 8.93289 3.88889 6.99989 3.88889V6.22222L3.88878 3.11111Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M4.44439 3.55556L7.99995 0V2.66667C11.1909 2.66667 13.7777 5.25347 13.7777 8.44444C13.7777 11.6354 11.1909 14.2222 7.99995 14.2222C4.80897 14.2222 2.22217 11.6354 2.22217 8.44444H3.99995C3.99995 10.6536 5.79081 12.4444 7.99995 12.4444C10.2091 12.4444 11.9999 10.6536 11.9999 8.44444C11.9999 6.23531 10.2091 4.44444 7.99995 4.44444V7.11111L4.44439 3.55556Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M5 4L9 0V3C12.5899 3 15.5 5.91015 15.5 9.5C15.5 13.0899 12.5899 16 9 16C5.41015 16 2.5 13.0899 2.5 9.5H4.5C4.5 11.9853 6.51472 14 9 14C11.4853 14 13.5 11.9853 13.5 9.5C13.5 7.01472 11.4853 5 9 5V8L5 4Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
