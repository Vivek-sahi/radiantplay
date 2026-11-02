import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.00004 6.33333V2H3.66671V6.33333C3.66671 7.622 4.71138 8.66667 6.00004 8.66667C7.28871 8.66667 8.33337 7.622 8.33337 6.33333V2H7.00004V6.33333C7.00004 6.88562 6.55233 7.33333 6.00004 7.33333C5.44776 7.33333 5.00004 6.88562 5.00004 6.33333ZM8.66671 10V9.33333H3.33337V10H8.66671Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M5.83336 7.38893V2.33337H4.2778V7.38893C4.2778 8.89237 5.49659 10.1112 7.00003 10.1112C8.50347 10.1112 9.72225 8.89237 9.72225 7.38893V2.33337H8.16669V7.38893C8.16669 8.03326 7.64436 8.5556 7.00003 8.5556C6.35569 8.5556 5.83336 8.03326 5.83336 7.38893ZM10.1111 11.6667V10.8889H3.88892V11.6667H10.1111Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M6.66668 8.4444V2.66663H4.8889V8.4444C4.8889 10.1626 6.28179 11.5555 8.00001 11.5555C9.71823 11.5555 11.1111 10.1626 11.1111 8.4444V2.66663H9.33335V8.4444C9.33335 9.18078 8.73639 9.77774 8.00001 9.77774C7.26363 9.77774 6.66668 9.18078 6.66668 8.4444ZM11.5556 13.3333V12.4444H4.44446V13.3333H11.5556Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M7.5 9.5V3H5.5V9.5C5.5 11.433 7.067 13 9 13C10.933 13 12.5 11.433 12.5 9.5V3H10.5V9.5C10.5 10.3284 9.82843 11 9 11C8.17157 11 7.5 10.3284 7.5 9.5ZM13 15V14H5V15H13Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const UnderlineIcon: React.FC<BaseIconProps> = ({
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

export default UnderlineIcon;
