import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2 1.99988H10V3.33321H2V1.99988ZM2 5.33321H10V6.66654H2V5.33321ZM2 8.66654H10V9.99988H2V8.66654Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33325 2.33313H11.6666V3.88869H2.33325V2.33313ZM2.33325 6.22202H11.6666V7.77757H2.33325V6.22202ZM2.33325 10.1109H11.6666V11.6665H2.33325V10.1109Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66675 2.66663H13.3334V4.4444H2.66675V2.66663ZM2.66675 7.11107H13.3334V8.88885H2.66675V7.11107ZM2.66675 11.5555H13.3334V13.3333H2.66675V11.5555Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 3H15V5H3V3ZM3 8H15V10H3V8ZM3 13H15V15H3V13Z" fill="currentColor"/>` },
};

export const HamburgerIcon: React.FC<BaseIconProps> = ({
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

export default HamburgerIcon;
