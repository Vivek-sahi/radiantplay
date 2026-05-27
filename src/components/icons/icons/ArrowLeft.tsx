import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M11.3285 6.66192L11.3285 5.32859L3.21888 5.32859L5.40941 3.13806L4.4666 2.19525L1.33326 5.32859L1.32854 5.32859L1.32854 5.33331L0.661866 5.99999L4.46661 9.80473L5.40941 8.86192L3.20942 6.66193L11.3285 6.66192Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M13.2167 7.77225V6.21669H3.75538L6.31101 3.66107L5.21106 2.56113L1.5555 6.21669H1.54999V6.2222L0.772202 6.99999L5.21106 11.4388L6.31101 10.3389L3.74435 7.77225H13.2167Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M15.1047 8.88257L15.1047 7.10479L4.29185 7.10479L7.21256 4.18408L5.95548 2.927L1.77769 7.10479L1.77139 7.10479L1.77139 7.11108L0.882493 7.99999L5.95548 13.073L7.21256 11.8159L4.27923 8.88257L15.1047 8.88257Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16.9928 9.99289V7.99289H4.82832L8.11412 4.70709L6.69991 3.29288L1.99989 7.99289H1.99281V7.99997L0.992798 8.99998L6.69991 14.7071L8.11412 13.2929L4.81413 9.99289H16.9928Z" fill="currentColor"/>` },
};

export const ArrowLeftIcon: React.FC<BaseIconProps> = ({
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

export default ArrowLeftIcon;
