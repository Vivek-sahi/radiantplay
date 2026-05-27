import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.666666 9.33334H11.3333V11.3333H0.666666V9.33334Z" fill="currentColor"/>
<path d="M10 1.33334H8.66667V2.66668H7.33333V4.00001H8.66667V5.33334H10V4.00001H11.3333V2.66668H10V1.33334Z" fill="currentColor"/>
<path d="M5.33333 6.00001H0.666666V8.00001H5.33333V6.00001Z" fill="currentColor"/>
<path d="M6.66667 6.00001H11.3333V8.00001H6.66667V6.00001Z" fill="currentColor"/>
<path d="M5.33333 2.66668H0.666666V4.66668H5.33333V2.66668Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.777779 10.8889H13.2222V13.2222H0.777779V10.8889Z" fill="currentColor"/>
<path d="M11.6667 1.55554H10.1111V3.1111H8.55556V4.66665H10.1111V6.22221H11.6667V4.66665H13.2222V3.1111H11.6667V1.55554Z" fill="currentColor"/>
<path d="M6.22222 6.99999H0.777779V9.33332H6.22222V6.99999Z" fill="currentColor"/>
<path d="M7.77778 6.99999H13.2222V9.33332H7.77778V6.99999Z" fill="currentColor"/>
<path d="M6.22222 3.1111H0.777779V5.44443H6.22222V3.1111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.888885 12.4444H15.1111V15.1111H0.888885V12.4444Z" fill="currentColor"/>
<path d="M13.3333 1.77777H11.5556V3.55555H9.77777V5.33333H11.5556V7.1111H13.3333V5.33333H15.1111V3.55555H13.3333V1.77777Z" fill="currentColor"/>
<path d="M7.11111 7.99999H0.888885V10.6667H7.11111V7.99999Z" fill="currentColor"/>
<path d="M8.88889 7.99999H15.1111V10.6667H8.88889V7.99999Z" fill="currentColor"/>
<path d="M7.11111 3.55555H0.888885V6.22222H7.11111V3.55555Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M1 14H17V17H1V14Z" fill="currentColor"/>
<path d="M15 2H13V4H11V6H13V8H15V6H17V4H15V2Z" fill="currentColor"/>
<path d="M8 9H1V12H8V9Z" fill="currentColor"/>
<path d="M10 9H17V12H10V9Z" fill="currentColor"/>
<path d="M8 4H1V7H8V4Z" fill="currentColor"/>` },
};

export const CreatePinboardIcon: React.FC<BaseIconProps> = ({
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

export default CreatePinboardIcon;
