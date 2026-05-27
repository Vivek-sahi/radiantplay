import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M1.99996 10.6667V4.9817C1.99996 4.61351 2.29844 4.31503 2.66663 4.31503L7.83604 4.31503L5.88558 2.3727L6.92925 1.33337L9.9234 4.31503H9.92862V4.32023L10.6666 5.05516L6.92926 8.77693L5.88558 7.73761L7.84652 5.78485L3.97349 5.78485L3.30261 5.78485V10.6667H1.99996Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33335 12.4444V5.81192C2.33335 5.38236 2.68157 5.03414 3.11113 5.03414L9.14211 5.03414L6.86657 2.76809L8.08419 1.55554L11.5774 5.03414H11.5835V5.04021L12.4445 5.89762L8.08419 10.2397L6.86657 9.02715L9.15433 6.74894L4.6358 6.74894L3.85311 6.74894V12.4444H2.33335Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66661 14.2222V6.6422C2.66661 6.15128 3.06458 5.75331 3.5555 5.75331L10.4481 5.75331L7.84744 3.16354L9.23901 1.77777L13.2312 5.75331H13.2382V5.76025L14.2222 6.74015L9.23901 11.7025L7.84744 10.3168L10.462 7.71308L5.29798 7.71308L4.40349 7.71308V14.2222H2.66661Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 16V7.47248C3 6.9202 3.44772 6.47248 4 6.47248L11.7541 6.47248L8.82843 3.55898L10.3939 2L14.8852 6.47248H14.893V6.48029L16 7.58267L10.3939 13.1653L8.82843 11.6064L11.7698 8.67722L5.96029 8.67722L4.95398 8.67722V16H3Z" fill="currentColor"/>` },
};

export const RedoIcon: React.FC<BaseIconProps> = ({
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

export default RedoIcon;
