import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 1.33333C3.42267 1.33333 1.33333 3.42267 1.33333 6C1.33333 8.57733 3.42267 10.6667 6 10.6667C8.57733 10.6667 10.6667 8.57733 10.6667 6H12C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0C7.65693 0 9.15753 0.672349 10.2426 1.75737L11.3333 0.666667V4H8L9.29984 2.70016C8.45466 1.85489 7.28859 1.33333 6 1.33333ZM5.33333 3.33333L8.66667 6L5.33333 8.66667V3.33333Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7 1.55556C3.99312 1.55556 1.55556 3.99312 1.55556 7C1.55556 10.0069 3.99312 12.4444 7 12.4444C10.0069 12.4444 12.4444 10.0069 12.4444 7H14C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0C8.93308 0 10.6838 0.784407 11.9497 2.05026L13.2222 0.777778V4.66667H9.33333L10.8498 3.15019C9.86377 2.16404 8.50336 1.55556 7 1.55556ZM6.22222 3.88889L10.1111 7L6.22222 10.1111V3.88889Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 1.77778C4.56356 1.77778 1.77778 4.56356 1.77778 8C1.77778 11.4364 4.56356 14.2222 8 14.2222C11.4364 14.2222 14.2222 11.4364 14.2222 8H16C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C10.2092 0 12.21 0.896465 13.6568 2.34315L15.1111 0.888889V5.33333H10.6667L12.3998 3.60022C11.2729 2.47319 9.71812 1.77778 8 1.77778ZM7.11111 4.44444L11.5556 8L7.11111 11.5556V4.44444Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 2C5.13401 2 2 5.13401 2 9C2 12.866 5.13401 16 9 16C12.866 16 16 12.866 16 9H18C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9C0 4.02944 4.02944 0 9 0C11.4854 0 13.7363 1.00852 15.364 2.63605L17 1V6H12L13.9498 4.05024C12.682 2.78234 10.9329 2 9 2ZM8 5L13 9L8 13V5Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
