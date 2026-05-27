import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.99999 1.99999H11.3333V3.33332H1.99999V1.99999ZM1.99999 5.33332H9.33331V6.66665H1.99999V5.33332ZM1.99999 8.66664H7.33331V9.99997H1.99999V8.66664Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.33332 2.33332H13.2222V3.88887H2.33332V2.33332ZM2.33332 6.2222H10.8888V7.77775H2.33332V6.2222ZM2.33332 10.1111H8.55552V11.6666H2.33332V10.1111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.66666 2.66666H15.1111V4.44444H2.66666V2.66666ZM2.66666 7.1111H12.4444V8.88887H2.66666V7.1111ZM2.66666 11.5555H9.77775V13.3333H2.66666V11.5555Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 3H17V5H3V3ZM3 8H14V10H3V8ZM3 13H11V15H3V13Z" fill="currentColor"/>` },
};

export const SortIcon: React.FC<BaseIconProps> = ({
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

export default SortIcon;
