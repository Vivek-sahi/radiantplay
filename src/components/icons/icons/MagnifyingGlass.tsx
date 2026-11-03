import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M8.66667 5C8.66667 7.02504 7.02504 8.66667 5 8.66667C2.97496 8.66667 1.33333 7.02504 1.33333 5C1.33333 2.97496 2.97496 1.33333 5 1.33333C7.02504 1.33333 8.66667 2.97496 8.66667 5ZM8.18655 8.85321C7.32137 9.56951 6.21096 10 5 10C2.23858 10 0 7.76142 0 5C0 2.23858 2.23858 0 5 0C7.76142 0 10 2.23858 10 5C10 6.06945 9.66424 7.06048 9.09238 7.87343L11.6095 10.3905L10.6667 11.3333L8.18655 8.85321Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M10.1111 5.83333C10.1111 8.19588 8.19588 10.1111 5.83333 10.1111C3.47078 10.1111 1.55556 8.19588 1.55556 5.83333C1.55556 3.47078 3.47078 1.55556 5.83333 1.55556C8.19588 1.55556 10.1111 3.47078 10.1111 5.83333ZM9.55097 10.3287C8.5416 11.1644 7.24612 11.6667 5.83333 11.6667C2.61167 11.6667 0 9.05499 0 5.83333C0 2.61167 2.61167 0 5.83333 0C9.05499 0 11.6667 2.61167 11.6667 5.83333C11.6667 7.08103 11.2749 8.23723 10.6078 9.18567L13.5444 12.1223L12.4444 13.2222L9.55097 10.3287Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M11.5556 6.66667C11.5556 9.36672 9.36673 11.5556 6.66667 11.5556C3.96661 11.5556 1.77778 9.36672 1.77778 6.66667C1.77778 3.96661 3.96661 1.77778 6.66667 1.77778C9.36673 1.77778 11.5556 3.96661 11.5556 6.66667ZM10.9154 11.8043C9.76183 12.7593 8.28128 13.3333 6.66667 13.3333C2.98477 13.3333 0 10.3486 0 6.66667C0 2.98477 2.98477 0 6.66667 0C10.3486 0 13.3333 2.98477 13.3333 6.66667C13.3333 8.0926 12.8857 9.41398 12.1232 10.4979L15.4793 13.854L14.2222 15.1111L10.9154 11.8043Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5ZM12.2798 13.2798C10.9821 14.3543 9.31644 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 9.10418 14.4964 10.5907 13.6386 11.8101L17.4142 15.5858L16 17L12.2798 13.2798Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const MagnifyingGlassIcon: React.FC<BaseIconProps> = ({
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

export default MagnifyingGlassIcon;
