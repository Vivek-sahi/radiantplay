import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.666748 9.33325H11.3334V11.3333H0.666748V9.33325Z" fill="currentColor"/>
<path d="M10.0001 1.33325H8.66675V2.66659H7.33341V3.99992H8.66675V5.33325H10.0001V3.99992H11.3334V2.66659H10.0001V1.33325Z" fill="currentColor"/>
<path d="M5.33341 5.99992H0.666748V7.99992H5.33341V5.99992Z" fill="currentColor"/>
<path d="M6.66675 5.99992H11.3334V7.99992H6.66675V5.99992Z" fill="currentColor"/>
<path d="M5.33341 2.66659H0.666748V4.66659H5.33341V2.66659Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.777832 10.889H13.2223V13.2223H0.777832V10.889Z" fill="currentColor"/>
<path d="M11.6667 1.55566H10.1112V3.11122H8.55561V4.66677H10.1112V6.22233H11.6667V4.66677H13.2223V3.11122H11.6667V1.55566Z" fill="currentColor"/>
<path d="M6.22228 7.00011H0.777832V9.33344H6.22228V7.00011Z" fill="currentColor"/>
<path d="M7.77783 7.00011H13.2223V9.33344H7.77783V7.00011Z" fill="currentColor"/>
<path d="M6.22228 3.11122H0.777832V5.44455H6.22228V3.11122Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.888916 12.4445H15.1111V15.1112H0.888916V12.4445Z" fill="currentColor"/>
<path d="M13.3334 1.77783H11.5556V3.55561H9.7778V5.33339H11.5556V7.11117H13.3334V5.33339H15.1111V3.55561H13.3334V1.77783Z" fill="currentColor"/>
<path d="M7.11114 8.00005H0.888916V10.6667H7.11114V8.00005Z" fill="currentColor"/>
<path d="M8.88892 8.00005H15.1111V10.6667H8.88892V8.00005Z" fill="currentColor"/>
<path d="M7.11114 3.55561H0.888916V6.22228H7.11114V3.55561Z" fill="currentColor"/>` },
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
