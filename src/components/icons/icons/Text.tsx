import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.66663 2V3.33333H5.33329V10H6.66663V3.33333H9.33329V2H2.66663Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.11108 2.33337V3.88893H6.2222V11.6667H7.77775V3.88893H10.8889V2.33337H3.11108Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M3.55554 2.66663V4.4444H7.1111V13.3333H8.88888V4.4444H12.4444V2.66663H3.55554Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4 3V5H8V15H10V5H14V3H4Z" fill="currentColor"/>` },
};

export const TextIcon: React.FC<BaseIconProps> = ({
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

export default TextIcon;
