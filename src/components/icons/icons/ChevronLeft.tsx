import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.13811 2.09764L8.08092 3.04045L5.21899 5.90238L8.08092 8.76431L7.13811 9.70712L3.33337 5.90238L7.13811 2.09764Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.32778 2.44724L9.42772 3.54718L6.0888 6.8861L9.42772 10.225L8.32778 11.325L3.88892 6.8861L8.32778 2.44724Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9.51744 2.79684L10.7745 4.05392L6.95862 7.86983L10.7745 11.6857L9.51744 12.9428L4.44446 7.86983L9.51744 2.79684Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.7071 3.14645L12.1213 4.56067L7.82843 8.85356L12.1213 13.1465L10.7071 14.5607L5 8.85356L10.7071 3.14645Z" fill="currentColor"/>` },
};

export const ChevronLeftIcon: React.FC<BaseIconProps> = ({
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

export default ChevronLeftIcon;
