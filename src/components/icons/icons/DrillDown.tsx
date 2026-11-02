import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.54208 7.53042H9.94114L6.2691 11.2025L2.59706 7.53042H5.04509C5.04509 3.34919 4.59465 1.60031 1.37305 0.79834C7.54208 0.79834 7.54208 4.87773 7.54208 7.53042Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.79925 8.78549H11.5982L7.31412 13.0695L3.03007 8.78549H5.8861C5.8861 3.90738 5.36059 1.86703 1.60205 0.931396C8.79925 0.931396 8.79925 5.69069 8.79925 8.78549Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M10.0562 10.0406H13.2549L8.35889 14.9366L3.46283 10.0406H6.72687C6.72687 4.46558 6.12628 2.13375 1.83081 1.06445C10.0562 1.06445 10.0562 6.50365 10.0562 10.0406Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M11.3134 11.2956H14.912L9.4039 16.8037L3.89584 11.2956H7.56788C7.56788 5.02378 6.89222 2.40047 2.05981 1.19751C11.3134 1.19751 11.3134 7.3166 11.3134 11.2956Z" fill="currentColor"/>` },
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
