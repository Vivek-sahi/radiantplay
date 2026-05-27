import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.99974 0.00389598L3.21361 2.71042L4.14265 3.66679L5.33312 2.51033L5.33331 8.66666L6.66664 8.66661L6.66645 2.51044L7.8568 3.66678L8.78584 2.71042L5.99974 0.00389598ZM1.99999 5.33331C1.99999 4.96512 2.29847 4.66665 2.66666 4.66665H4.66665V5.99998H3.33332V10.6666H8.66663V5.99998H7.33331V4.66665H9.3333C9.70149 4.66665 9.99996 4.96512 9.99996 5.33331V11.3333C9.99996 11.7015 9.70149 12 9.3333 12H2.66666C2.29847 12 1.99999 11.7015 1.99999 11.3333V5.33331Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.99974 0.00454543L3.74925 3.16215L4.83313 4.27792L6.22202 2.92872L6.22224 10.1111L7.77779 10.111L7.77757 2.92885L9.1663 4.27792L10.2502 3.16216L6.99974 0.00454543ZM2.33337 6.2222C2.33337 5.79265 2.68159 5.44442 3.11114 5.44442H5.44446V6.99997H3.88891V12.4444H10.1111V6.99997H8.55556V5.44442H10.8889C11.3184 5.44442 11.6667 5.79265 11.6667 6.2222V13.2222C11.6667 13.6517 11.3184 13.9999 10.8889 13.9999H3.11114C2.68159 13.9999 2.33337 13.6517 2.33337 13.2222V6.2222Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.99962 0.00519476L4.28477 3.61389L5.52349 4.88905L7.11079 3.34711L7.11104 11.5555L8.88881 11.5555L8.88856 3.34725L10.4757 4.88905L11.7144 3.61389L7.99962 0.00519476ZM2.66662 7.11108C2.66662 6.62017 3.06458 6.2222 3.5555 6.2222H6.22216V7.99997H4.44439V14.2222H11.5555V7.99997H9.7777V6.2222H12.4444C12.9353 6.2222 13.3332 6.62017 13.3332 7.11108V15.1111C13.3332 15.602 12.9353 15.9999 12.4444 15.9999H3.5555C3.06458 15.9999 2.66662 15.602 2.66662 15.1111V7.11108Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.99965 0.00584412L4.82043 4.06564L6.214 5.5002L7.99972 3.76551L8 13L10 13L9.99972 3.76567L11.7852 5.5002L13.1788 4.06565L8.99965 0.00584412ZM3 8C3 7.44772 3.44772 7 4 7H7V9H5V16H13V9H11V7H14C14.5523 7 15 7.44772 15 8V17C15 17.5523 14.5523 18 14 18H4C3.44772 18 3 17.5523 3 17V8Z" fill="currentColor"/>` },
};

export const ShareIcon: React.FC<BaseIconProps> = ({
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

export default ShareIcon;
