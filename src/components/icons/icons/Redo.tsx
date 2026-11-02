import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.00008 10.6667V4.9817C2.00008 4.61351 2.29856 4.31503 2.66675 4.31503L7.83617 4.31503L5.8857 2.3727L6.92938 1.33337L9.92352 4.31503H9.92875V4.32023L10.6667 5.05516L6.92938 8.77693L5.8857 7.73761L7.84664 5.78485L3.97361 5.78485L3.30274 5.78485V10.6667H2.00008Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33323 12.4444V5.81192C2.33323 5.38236 2.68145 5.03414 3.111 5.03414L9.14199 5.03414L6.86645 2.76809L8.08407 1.55554L11.5772 5.03414H11.5833V5.04021L12.4443 5.89762L8.08407 10.2397L6.86645 9.02715L9.15421 6.74894L4.63567 6.74894L3.85299 6.74894V12.4444H2.33323Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66661 14.2223V6.64226C2.66661 6.15134 3.06458 5.75337 3.5555 5.75337L10.4481 5.75337L7.84744 3.1636L9.23901 1.77783L13.2312 5.75337H13.2382V5.76031L14.2222 6.74021L9.23901 11.7026L7.84744 10.3168L10.462 7.71314L5.29798 7.71314L4.40349 7.71314V14.2223H2.66661Z" fill="currentColor"/>` },
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
