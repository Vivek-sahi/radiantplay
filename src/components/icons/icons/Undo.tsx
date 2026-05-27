import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10 10.6666V4.98163C10 4.61344 9.70156 4.31497 9.33337 4.31497L4.16396 4.31497L6.11442 2.37264L5.07075 1.33331L2.0766 4.31497H2.07138V4.32017L1.33337 5.0551L5.07074 8.77687L6.11442 7.73755L4.15348 5.78479L8.02651 5.78479L8.69739 5.78479V10.6666H10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.6667 12.4444V5.81192C11.6667 5.38236 11.3184 5.03414 10.8889 5.03414L4.85789 5.03414L7.13343 2.76809L5.91581 1.55554L2.42264 5.03414H2.41654V5.04021L1.55554 5.89762L5.91581 10.2397L7.13343 9.02715L4.84567 6.74894L9.3642 6.74894L10.1469 6.74894V12.4444H11.6667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.3334 14.2222V6.6422C13.3334 6.15128 12.9354 5.75331 12.4445 5.75331L5.55194 5.75331L8.15256 3.16354L6.76099 1.77777L2.7688 5.75331H2.76183V5.76025L1.77783 6.74015L6.76099 11.7025L8.15256 10.3168L5.53798 7.71308L10.702 7.71308L11.5965 7.71308V14.2222H13.3334Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M15 16V7.47248C15 6.9202 14.5523 6.47248 14 6.47248L6.24587 6.47248L9.17157 3.55898L7.60606 2L3.11484 6.47248H3.107V6.48029L2 7.58267L7.60605 13.1653L9.17157 11.6064L6.23017 8.67722L12.0397 8.67722L13.046 8.67722V16H15Z" fill="currentColor"/>` },
};

export const UndoIcon: React.FC<BaseIconProps> = ({
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

export default UndoIcon;
