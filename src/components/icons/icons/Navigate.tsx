import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.00002 2L2.00002 5.33333H10L6.00002 2Z" fill="currentColor"/>
<path d="M6.00002 10L10 6.66667H2.00002L6.00002 10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7.00002 2.33334L2.33335 6.22223H11.6667L7.00002 2.33334Z" fill="currentColor"/>
<path d="M7.00002 11.6667L11.6667 7.77779H2.33335L7.00002 11.6667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 2.66666L2.66666 7.1111H13.3333L8 2.66666Z" fill="currentColor"/>
<path d="M8 13.3333L13.3333 8.88888H2.66666L8 13.3333Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 3L3 8H15L9 3Z" fill="currentColor"/>
<path d="M9 15L15 10H3L9 15Z" fill="currentColor"/>` },
};

export const NavigateIcon: React.FC<BaseIconProps> = ({
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

export default NavigateIcon;
