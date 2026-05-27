import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.666685 1.99999C0.666685 1.6318 0.965161 1.33332 1.33335 1.33332H10.6667C11.0348 1.33332 11.3333 1.6318 11.3333 1.99999V7.99997C11.3333 8.36816 11.0348 8.66664 10.6667 8.66664H6.66665V9.64318L8.36979 10.7786L7.63019 11.888L5.99999 10.8012L4.3698 11.888L3.6302 10.7786L5.33332 9.64319V8.66664H1.33335C0.965161 8.66664 0.666685 8.36816 0.666685 7.99997V1.99999ZM5.00001 6.66664L7.66667 4.99998L5.00001 3.33332V6.66664Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.777768 2.33333C0.777768 1.90377 1.12599 1.55555 1.55554 1.55555H12.4444C12.8739 1.55555 13.2222 1.90377 13.2222 2.33333V9.33331C13.2222 9.76286 12.8739 10.1111 12.4444 10.1111H7.77772V11.2504L9.76472 12.575L8.90185 13.8693L6.99996 12.6014L5.09806 13.8693L4.2352 12.575L6.22217 11.2504V10.1111H1.55554C1.12599 10.1111 0.777768 9.76286 0.777768 9.33331V2.33333ZM5.83331 7.77775L8.94441 5.83332L5.83331 3.88888V7.77775Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.888883 2.66665C0.888883 2.17573 1.28685 1.77777 1.77777 1.77777H14.2222C14.7131 1.77777 15.1111 2.17573 15.1111 2.66665V10.6666C15.1111 11.1575 14.7131 11.5555 14.2222 11.5555H8.88883V12.8576L11.1597 14.3715L10.1736 15.8507L7.99996 14.4016L5.82637 15.8507L4.84024 14.3715L7.11106 12.8576V11.5555H1.77777C1.28685 11.5555 0.888883 11.1575 0.888883 10.6666V2.66665ZM6.66664 8.88886L10.2222 6.66664L6.66664 4.44443V8.88886Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1 3C1 2.44771 1.44772 2 2 2H16C16.5523 2 17 2.44772 17 3V12C17 12.5523 16.5523 13 16 13H9.99997V14.4648L12.5547 16.1679L11.4453 17.8321L8.99998 16.2019L6.55469 17.8321L5.44528 16.1679L7.99997 14.4648V13H2C1.44772 13 1 12.5523 1 12V3ZM7.5 10L11.5 7.5L7.5 5V10Z" fill="currentColor"/>` },
};

export const PresentIcon: React.FC<BaseIconProps> = ({
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

export default PresentIcon;
