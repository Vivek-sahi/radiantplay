import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 2L2 5.33333H10L6 2Z" fill="currentColor"/>
<path d="M6 10L10 6.66667H2L6 10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99992 2.33331L2.33325 6.2222H11.6666L6.99992 2.33331Z" fill="currentColor"/>
<path d="M6.99992 11.6666L11.6666 7.77776H2.33325L6.99992 11.6666Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.00008 2.66669L2.66675 7.11113H13.3334L8.00008 2.66669Z" fill="currentColor"/>
<path d="M8.00008 13.3334L13.3334 8.88891H2.66675L8.00008 13.3334Z" fill="currentColor"/>` },
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
