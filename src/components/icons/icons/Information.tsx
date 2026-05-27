import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.66665 3.33333V10H8.66665V11.3333H3.33331V10H5.33331V4.66667H3.99998V3.33333H6.66665ZM6.66665 0V2H5.33331V0H6.66665Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.7778 3.88889V11.6667H10.1111V13.2222H3.88892V11.6667H6.22225V5.44444H4.66669V3.88889H7.7778ZM7.7778 0V2.33333H6.22225V0H7.7778Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.8889 4.44444V13.3333H11.5556V15.1111H4.44446V13.3333H7.11112V6.22222H5.33335V4.44444H8.8889ZM8.8889 0V2.66667H7.11112V0H8.8889Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10 5V15H13V17H5V15H8V7H6V5H10ZM10 0V3H8V0H10Z" fill="currentColor"/>` },
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
