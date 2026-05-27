import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 13 13', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5556 6.49133C11.5556 9.27971 9.29211 11.5401 6.5 11.5401C3.70789 11.5401 1.44444 9.27971 1.44444 6.49133C1.44444 3.70295 3.70789 1.44252 6.5 1.44252C9.29211 1.44252 11.5556 3.70295 11.5556 6.49133ZM13 6.49133C13 10.0764 10.0899 12.9827 6.5 12.9827C2.91015 12.9827 0 10.0764 0 6.49133C0 2.90627 2.91015 0 6.5 0C10.0899 0 13 2.90627 13 6.49133ZM5.77778 7.93385V2.88504H7.22222V6.49133H9.38889V7.93385H5.77778Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 15 15', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M13.3333 7.48999C13.3333 10.7074 10.7217 13.3155 7.5 13.3155C4.27834 13.3155 1.66667 10.7074 1.66667 7.48999C1.66667 4.27263 4.27834 1.66444 7.5 1.66444C10.7217 1.66444 13.3333 4.27263 13.3333 7.48999ZM15 7.48999C15 11.6266 11.6421 14.98 7.5 14.98C3.35786 14.98 0 11.6266 0 7.48999C0 3.35338 3.35786 0 7.5 0C11.6421 0 15 3.35338 15 7.48999ZM6.66666 9.15444V3.32889H8.33333V7.48999H10.8333V9.15444H6.66666Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 17 17', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M15.1111 8.48865C15.1111 12.135 12.1512 15.0909 8.49999 15.0909C4.84878 15.0909 1.88889 12.135 1.88889 8.48865C1.88889 4.84231 4.84878 1.88637 8.49999 1.88637C12.1512 1.88637 15.1111 4.84231 15.1111 8.48865ZM17 8.48865C17 13.1768 13.1944 16.9773 8.49999 16.9773C3.80558 16.9773 0 13.1768 0 8.48865C0 3.8005 3.80558 0 8.49999 0C13.1944 0 17 3.8005 17 8.48865ZM7.55555 10.375V3.77274H9.44444V8.48865H12.2778V10.375H7.55555Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 9C16 12.866 12.866 16 9 16C5.13401 16 2 12.866 2 9C2 5.13401 5.13401 2 9 2C12.866 2 16 5.13401 16 9ZM18 9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C13.9706 0 18 4.02944 18 9ZM8 11V4H10V9H13V11H8Z" fill="currentColor"/>` },
};

export const ClockIcon: React.FC<BaseIconProps> = ({
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

export default ClockIcon;
