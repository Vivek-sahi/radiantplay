import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.41659 1.33337C3.68021 1.33337 3.08325 1.93033 3.08325 2.66671V3.33337H4.41659V2.66671H7.58325V3.33337H8.91659V2.66671C8.91659 1.93033 8.31963 1.33337 7.58325 1.33337H4.41659ZM1.99992 4.00004C1.63173 4.00004 1.33325 4.29852 1.33325 4.66671V9.33337C1.33325 9.70156 1.63173 10 1.99992 10H9.99992C10.3681 10 10.6666 9.70156 10.6666 9.33337V4.66671C10.6666 4.29852 10.3681 4.00004 9.99992 4.00004H1.99992Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M5.15289 1.55554C4.29378 1.55554 3.59733 2.25199 3.59733 3.1111V3.88888H5.15289V3.1111H8.84733V3.88888H10.4029V3.1111C10.4029 2.25199 9.70644 1.55554 8.84733 1.55554H5.15289ZM2.33344 4.66665C1.90389 4.66665 1.55566 5.01488 1.55566 5.44443V10.8889C1.55566 11.3184 1.90389 11.6667 2.33344 11.6667H11.6668C12.0963 11.6667 12.4446 11.3184 12.4446 10.8889V5.44443C12.4446 5.01488 12.0963 4.66665 11.6668 4.66665H2.33344Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M5.88894 1.77783C4.9071 1.77783 4.11117 2.57377 4.11117 3.55561V4.4445H5.88894V3.55561H10.1112V4.4445H11.8889V3.55561C11.8889 2.57377 11.093 1.77783 10.1112 1.77783H5.88894ZM2.66672 5.33339C2.1758 5.33339 1.77783 5.73136 1.77783 6.22228V12.4445C1.77783 12.9354 2.1758 13.3334 2.66672 13.3334H13.3334C13.8243 13.3334 14.2223 12.9354 14.2223 12.4445V6.22228C14.2223 5.73136 13.8243 5.33339 13.3334 5.33339H2.66672Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M6.625 2C5.52043 2 4.625 2.89543 4.625 4V5H6.625V4H11.375V5H13.375V4C13.375 2.89543 12.4796 2 11.375 2H6.625ZM3 6C2.44772 6 2 6.44772 2 7V14C2 14.5523 2.44772 15 3 15H15C15.5523 15 16 14.5523 16 14V7C16 6.44772 15.5523 6 15 6H3Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const CaseIcon: React.FC<BaseIconProps> = ({
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

export default CaseIcon;
