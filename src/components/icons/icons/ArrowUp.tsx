import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.33335 11.3333H6.66669V3.22367L8.85722 5.41421L9.80003 4.4714L6.66669 1.33805V1.33333H6.66196L5.99529 0.666658L2.19055 4.4714L3.13336 5.41421L5.33335 3.21421V11.3333Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.22223 13.2222H7.77779V3.76095L10.3334 6.31657L11.4334 5.21663L7.77779 1.56106V1.55556H7.77228L6.99449 0.777768L2.55563 5.21663L3.65558 6.31657L6.22223 3.74992V13.2222Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.11112 15.1111H8.88889V4.29823L11.8096 7.21894L13.0667 5.96186L8.88889 1.78407V1.77778H8.8826L7.9937 0.888877L2.92072 5.96186L4.17779 7.21894L7.11112 4.28562V15.1111Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8 17H10V4.83551L13.2858 8.12131L14.7 6.70709L10 2.00708V2H9.99292L8.9929 0.999987L3.2858 6.70709L4.70001 8.12131L8 4.82132V17Z" fill="currentColor"/>` },
};

export const ArrowUpIcon: React.FC<BaseIconProps> = ({
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

export default ArrowUpIcon;
