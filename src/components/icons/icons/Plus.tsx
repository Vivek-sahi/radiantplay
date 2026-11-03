import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.33325 1.33331H6.66659V10.6666H5.33325V1.33331Z" fill="currentColor"/>
<path d="M1.33325 6.66665V5.33331H10.6666V6.66665H1.33325Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.22233 1.55554H7.77789V12.4444H6.22233V1.55554Z" fill="currentColor"/>
<path d="M1.55566 7.77776V6.22221H12.4446V7.77776H1.55566Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.11117 1.77777H8.88894V14.2222H7.11117V1.77777Z" fill="currentColor"/>
<path d="M1.77783 8.88888V7.1111H14.2223V8.88888H1.77783Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8 2H10V16H8V2Z" fill="currentColor"/>
<path d="M2 10V8H16V10H2Z" fill="currentColor"/>` },
};

export const PlusIcon: React.FC<BaseIconProps> = ({
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

export default PlusIcon;
