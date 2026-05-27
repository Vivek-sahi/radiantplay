import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.33333 8.43908C8.88692 7.88997 10 6.40831 10 4.66669C10 2.45755 8.20914 0.666687 6 0.666687C3.79086 0.666687 2 2.45755 2 4.66669C2 6.40831 3.11307 7.88996 4.66666 8.43908V9.33335H7.33333V8.43908Z" fill="currentColor"/>
<path d="M4.66666 10H7.33333V10.6667H4.66666V10Z" fill="currentColor"/>
<path d="M6.66667 12L7.33333 11.3334H4.66667L5.33333 12H6.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.55555 9.84556C10.3681 9.20493 11.6667 7.47634 11.6667 5.44444C11.6667 2.86711 9.57733 0.777771 7 0.777771C4.42267 0.777771 2.33333 2.86711 2.33333 5.44444C2.33333 7.47633 3.63192 9.20492 5.44444 9.84556V10.8889H8.55555V9.84556Z" fill="currentColor"/>
<path d="M5.44444 11.6667H8.55555V12.4444H5.44444V11.6667Z" fill="currentColor"/>
<path d="M7.77778 14L8.55555 13.2222H5.44444L6.22222 14H7.77778Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M9.77777 11.2521C11.8492 10.52 13.3333 8.54442 13.3333 6.22225C13.3333 3.27673 10.9455 0.888916 8 0.888916C5.05448 0.888916 2.66666 3.27673 2.66666 6.22225C2.66666 8.54441 4.15076 10.5199 6.22221 11.2521V12.4445H9.77777V11.2521Z" fill="currentColor"/>
<path d="M6.22221 13.3334H9.77777V14.2222H6.22221V13.3334Z" fill="currentColor"/>
<path d="M8.88889 16L9.77777 15.1111H6.22222L7.11111 16H8.88889Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M11 12.6586C13.3304 11.8349 15 9.61244 15 7C15 3.68629 12.3137 1 9 1C5.68629 1 3 3.68629 3 7C3 9.61243 4.66961 11.8349 6.99999 12.6586V14H11V12.6586Z" fill="currentColor"/>
<path d="M6.99999 15H11V16H6.99999V15Z" fill="currentColor"/>
<path d="M10 18L11 17H7L8 18H10Z" fill="currentColor"/>` },
};

export const BulbIcon: React.FC<BaseIconProps> = ({
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

export default BulbIcon;
