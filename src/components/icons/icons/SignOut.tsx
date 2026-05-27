import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.45331 6.66666H2.66666V5.33333H9.45331L8.59331 4.46667L9.53998 3.53333L12 6L9.53998 8.46666L8.59998 7.53332L9.45331 6.66666ZM2 9.33332H6.66665V10.6667H0.666666V1.33334H6.66665V2.66667H2V9.33332Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.0289 7.77775H3.11111V6.2222H11.0289L10.0255 5.21109L11.13 4.1222L14 6.99997L11.13 9.87774L10.0333 8.78886L11.0289 7.77775ZM2.33333 10.8889H7.77776V12.4444H0.777777V1.55554H7.77776V3.11109H2.33333V10.8889Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M12.6044 8.88887H3.55555V7.11109H12.6044L11.4578 5.95554L12.72 4.7111L16 7.99998L12.72 11.2889L11.4666 10.0444L12.6044 8.88887ZM2.66666 12.4444H8.88887V14.2222H0.888884V1.77777H8.88887V3.55554H2.66666V12.4444Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14.18 10H4V8H14.18L12.89 6.7L14.31 5.3L18 9L14.31 12.7L12.9 11.3L14.18 10ZM3 14H10V16H1V2H10V4H3V14Z" fill="currentColor"/>` },
};

export const SignOutIcon: React.FC<BaseIconProps> = ({
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

export default SignOutIcon;
