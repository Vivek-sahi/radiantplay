import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.99997 1.33333C3.42265 1.33333 1.33333 3.42265 1.33333 5.99997C1.33333 8.57729 3.42265 10.6666 5.99997 10.6666C8.57729 10.6666 10.6666 8.57729 10.6666 5.99997H11.9999C11.9999 9.31366 9.31366 11.9999 5.99997 11.9999C2.68628 11.9999 0 9.31366 0 5.99997C0 2.68628 2.68628 0 5.99997 0C7.65689 0 9.15748 0.672346 10.2426 1.75736L11.3333 0.666663V3.99998H7.99996L9.29979 2.70015C8.45461 1.85488 7.28855 1.33333 5.99997 1.33333ZM5.33331 3.33332L8.66662 5.99997L5.33331 8.66662V3.33332Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.99997 1.55555C3.9931 1.55555 1.55555 3.9931 1.55555 6.99997C1.55555 10.0068 3.9931 12.4444 6.99997 12.4444C10.0068 12.4444 12.4444 10.0068 12.4444 6.99997H13.9999C13.9999 10.8659 10.8659 13.9999 6.99997 13.9999C3.13399 13.9999 0 10.8659 0 6.99997C0 3.13399 3.13399 0 6.99997 0C8.93304 0 10.6837 0.784404 11.9497 2.05025L13.2222 0.777774V4.66665H9.33329L10.8498 3.15018C9.86372 2.16403 8.50332 1.55555 6.99997 1.55555ZM6.2222 3.88887L10.1111 6.99997L6.2222 10.1111V3.88887Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99997 1.77777C4.56354 1.77777 1.77777 4.56354 1.77777 7.99997C1.77777 11.4364 4.56354 14.2222 7.99997 14.2222C11.4364 14.2222 14.2222 11.4364 14.2222 7.99997H15.9999C15.9999 12.4182 12.4182 15.9999 7.99997 15.9999C3.58171 15.9999 0 12.4182 0 7.99997C0 3.58171 3.58171 0 7.99997 0C10.2092 0 12.21 0.896462 13.6568 2.34315L15.1111 0.888886V5.33331H10.6666L12.3997 3.6002C11.2728 2.47318 9.71808 1.77777 7.99997 1.77777ZM7.11108 4.44443L11.5555 7.99997L7.11108 11.5555V4.44443Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9 2C5.13401 2 2 5.13401 2 9C2 12.866 5.13401 16 9 16C12.866 16 16 12.866 16 9H18C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C11.4854 0 13.7363 1.00852 15.364 2.63605L17 1V6H12L13.9498 4.05024C12.682 2.78234 10.9329 2 9 2ZM8 5L13 9L8 13V5Z" fill="currentColor"/>` },
};

export const ReplaySearchIcon: React.FC<BaseIconProps> = ({
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

export default ReplaySearchIcon;
