import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.6667 6H8.66669V1.33334H10V7.33333H4.6667V9.99999L1.33337 6.668L4.6667 3.33334V6Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M5.44442 6.99997H10.1111V1.55554H11.6666V8.55553H5.44442V11.6666L1.55554 7.77931L5.44442 3.88887V6.99997Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M6.22226 7.99998H11.5556V1.77777H13.3334V9.77776H6.22226V13.3333L1.77783 8.89065L6.22226 4.44443V7.99998Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M7 9H13V2H15V11H7V15L2 10.002L7 5V9Z" fill="currentColor"/>` },
};

export const EnterIcon: React.FC<BaseIconProps> = ({
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

export default EnterIcon;
