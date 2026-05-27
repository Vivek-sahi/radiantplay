import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.66664 4.99999C8.66664 7.02503 7.02503 8.66664 4.99999 8.66664C2.97495 8.66664 1.33333 7.02503 1.33333 4.99999C1.33333 2.97495 2.97495 1.33333 4.99999 1.33333C7.02503 1.33333 8.66664 2.97495 8.66664 4.99999ZM8.18653 8.85319C7.32135 9.56948 6.21094 9.99997 4.99999 9.99997C2.23857 9.99997 0 7.7614 0 4.99999C0 2.23857 2.23857 0 4.99999 0C7.7614 0 9.99997 2.23857 9.99997 4.99999C9.99997 6.06944 9.66421 7.06047 9.09236 7.87341L11.6094 10.3905L10.6666 11.3333L8.18653 8.85319Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.1111 5.83332C10.1111 8.19586 8.19586 10.1111 5.83332 10.1111C3.47077 10.1111 1.55555 8.19586 1.55555 5.83332C1.55555 3.47077 3.47077 1.55555 5.83332 1.55555C8.19586 1.55555 10.1111 3.47077 10.1111 5.83332ZM9.55095 10.3287C8.54158 11.1644 7.2461 11.6666 5.83332 11.6666C2.61167 11.6666 0 9.05497 0 5.83332C0 2.61167 2.61167 0 5.83332 0C9.05497 0 11.6666 2.61167 11.6666 5.83332C11.6666 7.08101 11.2749 8.23721 10.6078 9.18564L13.5444 12.1222L12.4444 13.2222L9.55095 10.3287Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5555 6.66665C11.5555 9.3667 9.3667 11.5555 6.66665 11.5555C3.9666 11.5555 1.77777 9.3667 1.77777 6.66665C1.77777 3.9666 3.9666 1.77777 6.66665 1.77777C9.3667 1.77777 11.5555 3.9666 11.5555 6.66665ZM10.9154 11.8043C9.7618 12.7593 8.28125 13.3333 6.66665 13.3333C2.98476 13.3333 0 10.3485 0 6.66665C0 2.98476 2.98476 0 6.66665 0C10.3485 0 13.3333 2.98476 13.3333 6.66665C13.3333 8.09258 12.8856 9.41395 12.1231 10.4979L15.4793 13.854L14.2222 15.1111L10.9154 11.8043Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M13 7.5C13 10.5376 10.5376 13 7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5ZM12.2798 13.2798C10.9821 14.3543 9.31644 15 7.5 15C3.35786 15 0 11.6421 0 7.5C0 3.35786 3.35786 0 7.5 0C11.6421 0 15 3.35786 15 7.5C15 9.10418 14.4964 10.5907 13.6386 11.8101L17.4142 15.5858L16 17L12.2798 13.2798Z" fill="currentColor"/>` },
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
