import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2 2H11.3333V3.33333H2V2ZM2 5.33333H9.33333V6.66667H2V5.33333ZM2 8.66667H7.33333V10H2V8.66667Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33325 2.33325H13.2221V3.88881H2.33325V2.33325ZM2.33325 6.22214H10.8888V7.7777H2.33325V6.22214ZM2.33325 10.111H8.55547V11.6666H2.33325V10.111Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66675 2.66675H15.1112V4.44453H2.66675V2.66675ZM2.66675 7.11119H12.4445V8.88897H2.66675V7.11119ZM2.66675 11.5556H9.77786V13.3334H2.66675V11.5556Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 3H17V5H3V3ZM3 8H14V10H3V8ZM3 13H11V15H3V13Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
