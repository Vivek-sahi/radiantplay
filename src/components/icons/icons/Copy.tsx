import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.66667 4C7.40305 4 8 4.59696 8 5.33334V10C8 10.7364 7.40305 11.3333 6.66667 11.3333H2C1.26362 11.3333 0.666668 10.7364 0.666668 10V5.33334C0.666668 4.59696 1.26362 4 2 4H6.66667ZM6.66667 10V5.33334H2V10H6.66667Z" fill="currentColor"/>
<path d="M10.6667 0.666672C11.0349 0.666672 11.3333 0.965149 11.3333 1.33334V6.66667C11.3333 7.03486 11.0349 7.33334 10.6667 7.33334H5.33333C4.96514 7.33334 4.66667 7.03486 4.66667 6.66667V1.33334C4.66667 0.965149 4.96514 0.666672 5.33333 0.666672H10.6667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.77778 4.66666C8.63689 4.66666 9.33333 5.36311 9.33333 6.22222V11.6667C9.33333 12.5258 8.63689 13.2222 7.77778 13.2222H2.33333C1.47422 13.2222 0.777779 12.5258 0.777779 11.6667V6.22222C0.777779 5.36311 1.47422 4.66666 2.33333 4.66666H7.77778ZM7.77778 11.6667V6.22222H2.33333V11.6667H7.77778Z" fill="currentColor"/>
<path d="M12.4444 0.777771C12.874 0.777771 13.2222 1.12599 13.2222 1.55555V7.77777C13.2222 8.20733 12.874 8.55555 12.4444 8.55555H6.22222C5.79267 8.55555 5.44445 8.20733 5.44445 7.77777V1.55555C5.44445 1.12599 5.79267 0.777771 6.22222 0.777771H12.4444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.88889 5.33333C9.87072 5.33333 10.6667 6.12927 10.6667 7.11111V13.3333C10.6667 14.3152 9.87072 15.1111 8.88889 15.1111H2.66666C1.68482 15.1111 0.888885 14.3152 0.888885 13.3333V7.11111C0.888885 6.12927 1.68482 5.33333 2.66666 5.33333H8.88889ZM8.88889 13.3333V7.11111H2.66666V13.3333H8.88889Z" fill="currentColor"/>
<path d="M14.2222 0.888885C14.7131 0.888885 15.1111 1.28685 15.1111 1.77777V8.88889C15.1111 9.3798 14.7131 9.77777 14.2222 9.77777H7.11111C6.62019 9.77777 6.22222 9.3798 6.22222 8.88889V1.77777C6.22222 1.28685 6.62019 0.888885 7.11111 0.888885H14.2222Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10 6C11.1046 6 12 6.89543 12 8V15C12 16.1046 11.1046 17 10 17H3C1.89543 17 1 16.1046 1 15V8C1 6.89543 1.89543 6 3 6H10ZM10 15V8H3V15H10Z" fill="currentColor"/>
<path d="M16 1C16.5523 1 17 1.44772 17 2V10C17 10.5523 16.5523 11 16 11H8C7.44772 11 7 10.5523 7 10V2C7 1.44772 7.44772 1 8 1H16Z" fill="currentColor"/>` },
};

export const CopyIcon: React.FC<BaseIconProps> = ({
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

export default CopyIcon;
