import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.5422 7.53043H9.94127L6.26923 11.2025L2.59718 7.53043H5.04521C5.04521 3.3492 4.59477 1.60033 1.37317 0.798355C7.5422 0.798355 7.5422 4.87775 7.5422 7.53043Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.79925 8.7855H11.5982L7.31412 13.0696L3.03007 8.7855H5.8861C5.8861 3.9074 5.36059 1.86705 1.60205 0.931412C8.79925 0.931412 8.79925 5.6907 8.79925 8.7855Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M10.0563 10.0406H13.2551L8.35901 14.9366L3.46295 10.0406H6.72699C6.72699 4.4656 6.12641 2.13377 1.83093 1.06448C10.0563 1.06448 10.0563 6.50367 10.0563 10.0406Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M11.3132 11.2956H14.9118L9.40378 16.8037L3.89571 11.2956H7.56776C7.56776 5.0238 6.8921 2.40049 2.05969 1.19753C11.3132 1.19753 11.3132 7.31662 11.3132 11.2956Z" fill="currentColor"/>` },
};

export const DrillDownIcon: React.FC<BaseIconProps> = ({
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

export default DrillDownIcon;
