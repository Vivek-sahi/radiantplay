import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.41666 1.33331C3.68028 1.33331 3.08333 1.93027 3.08333 2.66665V3.33331H4.41666V2.66665H7.58333V3.33331H8.91666V2.66665C8.91666 1.93027 8.31971 1.33331 7.58333 1.33331H4.41666ZM1.99999 3.99998C1.63181 3.99998 1.33333 4.29846 1.33333 4.66665V9.33331C1.33333 9.7015 1.63181 9.99998 2 9.99998H10C10.3682 9.99998 10.6667 9.7015 10.6667 9.33331V4.66665C10.6667 4.29846 10.3682 3.99998 10 3.99998H1.99999Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.15277 1.55554C4.29366 1.55554 3.59722 2.25199 3.59722 3.1111V3.88888H5.15277V3.1111H8.84722V3.88888H10.4028V3.1111C10.4028 2.25199 9.70633 1.55554 8.84722 1.55554H5.15277ZM2.33333 4.66665C1.90377 4.66665 1.55555 5.01488 1.55555 5.44443V10.8889C1.55555 11.3184 1.90377 11.6667 2.33333 11.6667H11.6667C12.0962 11.6667 12.4444 11.3184 12.4444 10.8889V5.44443C12.4444 5.01488 12.0962 4.66665 11.6667 4.66665H2.33333Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.88889 1.77777C4.90705 1.77777 4.11111 2.57371 4.11111 3.55555V4.44444H5.88889V3.55555H10.1111V4.44444H11.8889V3.55555C11.8889 2.57371 11.093 1.77777 10.1111 1.77777H5.88889ZM2.66667 5.33333C2.17575 5.33333 1.77778 5.7313 1.77778 6.22222V12.4444C1.77778 12.9354 2.17575 13.3333 2.66667 13.3333H13.3333C13.8243 13.3333 14.2222 12.9354 14.2222 12.4444V6.22222C14.2222 5.7313 13.8243 5.33333 13.3333 5.33333H2.66667Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.625 2C5.52043 2 4.625 2.89543 4.625 4V5H6.625V4H11.375V5H13.375V4C13.375 2.89543 12.4796 2 11.375 2H6.625ZM3 6C2.44772 6 2 6.44772 2 7V14C2 14.5523 2.44772 15 3 15H15C15.5523 15 16 14.5523 16 14V7C16 6.44772 15.5523 6 15 6H3Z" fill="currentColor"/>` },
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
