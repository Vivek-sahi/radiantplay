import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.66667 2V3.33333H5.33333V10H6.66667V3.33333H9.33333V2H2.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.11111 2.33331V3.88887H6.22222V11.6666H7.77778V3.88887H10.8889V2.33331H3.11111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M3.55556 2.66669V4.44446H7.11111V13.3334H8.88889V4.44446H12.4444V2.66669H3.55556Z" fill="currentColor"/>` },
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
