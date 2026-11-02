import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.94281 9.70713L4 8.76432L6.86193 5.90239L4 3.04046L4.94281 2.09766L8.74755 5.90239L4.94281 9.70713Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M5.76669 11.325L4.66675 10.225L8.00566 6.88613L4.66675 3.54721L5.76669 2.44727L10.2056 6.88613L5.76669 11.325Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M6.59033 12.9428L5.33325 11.6858L9.14916 7.86986L5.33325 4.05395L6.59033 2.79688L11.6633 7.86986L6.59033 12.9428Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M7.41421 14.5607L6 13.1465L10.2929 8.85359L6 4.5607L7.41421 3.14648L13.1213 8.85359L7.41421 14.5607Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ChevronRightIcon: React.FC<BaseIconProps> = ({
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

export default ChevronRightIcon;
