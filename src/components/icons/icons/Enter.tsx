import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.66671 6.00004H8.66671V1.33337H10V7.33338H4.66671V10L1.33337 6.66804L4.66671 3.33337V6.00004Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M5.44443 6.99999H10.1111V1.55554H11.6667V8.55554H5.44443V11.6667L1.55554 7.77932L5.44443 3.88888V6.99999Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M6.22228 8.00006H11.5556V1.77783H13.3334V9.77784H6.22228V13.3334L1.77783 8.89072L6.22228 4.4445V8.00006Z" fill="currentColor"/>` },
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
