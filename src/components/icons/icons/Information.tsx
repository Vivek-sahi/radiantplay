import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.66658 3.33333V10H8.66658V11.3333H3.33325V10H5.33325V4.66667H3.99992V3.33333H6.66658ZM6.66658 0V2H5.33325V0H6.66658Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7.7778 3.88889V11.6667H10.1111V13.2222H3.88892V11.6667H6.22225V5.44444H4.66669V3.88889H7.7778ZM7.7778 0V2.33333H6.22225V0H7.7778Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.88878 4.44444V13.3333H11.5554V15.1111H4.44434V13.3333H7.111V6.22222H5.33322V4.44444H8.88878ZM8.88878 0V2.66667H7.111V0H8.88878Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M10 5V15H13V17H5V15H8V7H6V5H10ZM10 0V3H8V0H10Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const InformationIcon: React.FC<BaseIconProps> = ({
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

export default InformationIcon;
