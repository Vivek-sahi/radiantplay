import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.33333 5.33333H6.66667V9.33333H5.33333V5.33333Z" fill="currentColor"/>
<path d="M5.33333 2.66667H6.66667V4H5.33333V2.66667Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6 12C9.31371 12 12 9.31371 12 6C12 2.68629 9.31371 0 6 0C2.68629 0 0 2.68629 0 6C0 9.31371 2.68629 12 6 12ZM6 10.6667C8.57733 10.6667 10.6667 8.57733 10.6667 6C10.6667 3.42267 8.57733 1.33333 6 1.33333C3.42267 1.33333 1.33333 3.42267 1.33333 6C1.33333 8.57733 3.42267 10.6667 6 10.6667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.22222 6.22222H7.77778V10.8889H6.22222V6.22222Z" fill="currentColor"/>
<path d="M6.22222 3.11111H7.77778V4.66667H6.22222V3.11111Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM7 12.4444C10.0069 12.4444 12.4444 10.0069 12.4444 7C12.4444 3.99312 10.0069 1.55556 7 1.55556C3.99312 1.55556 1.55556 3.99312 1.55556 7C1.55556 10.0069 3.99312 12.4444 7 12.4444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.11111 7.11111H8.88889V12.4444H7.11111V7.11111Z" fill="currentColor"/>
<path d="M7.11111 3.55556H8.88889V5.33333H7.11111V3.55556Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM8 14.2222C11.4364 14.2222 14.2222 11.4364 14.2222 8C14.2222 4.56356 11.4364 1.77778 8 1.77778C4.56356 1.77778 1.77778 4.56356 1.77778 8C1.77778 11.4364 4.56356 14.2222 8 14.2222Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8 8H10V14H8V8Z" fill="currentColor"/>
<path d="M8 4H10V6H8V4Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18ZM9 16C12.866 16 16 12.866 16 9C16 5.13401 12.866 2 9 2C5.13401 2 2 5.13401 2 9C2 12.866 5.13401 16 9 16Z" fill="currentColor"/>` },
};

export const InfoCircleIcon: React.FC<BaseIconProps> = ({
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

export default InfoCircleIcon;
