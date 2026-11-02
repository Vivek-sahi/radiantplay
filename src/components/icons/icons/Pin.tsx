import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10 7.33341C10 5.33341 8.01793 4.00008 6.66965 4.00008V2.66675C7.3931 2.39754 8.06782 1.65214 8.01793 0.666748H4.0265C3.98159 1.63183 4.63782 2.39246 5.33632 2.66675V4.00008C4.02649 4.00008 2.00001 5.33341 2 7.33341H10Z" fill="currentColor"/>
<path d="M6.66966 8.00008H5.33633V10.6667L6.003 12.0001L6.66966 10.6667V8.00008Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.6666 8.55561C11.6666 6.22228 9.35417 4.66672 7.78118 4.66672V3.11117C8.6252 2.79709 9.41238 1.92746 9.35417 0.777832H4.6975C4.64511 1.90376 5.41071 2.79117 6.22563 3.11117V4.66672C4.69749 4.66672 2.33326 6.22228 2.33325 8.55561H11.6666Z" fill="currentColor"/>
<path d="M7.78119 9.33339H6.22564V12.4445L7.00342 14.0001L7.78119 12.4445V9.33339Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.3334 9.7778C13.3334 7.11114 10.6907 5.33336 8.89295 5.33336V3.55558C9.85755 3.19664 10.7572 2.20278 10.6907 0.888916H5.36875C5.30887 2.17569 6.18384 3.18987 7.11518 3.55558V5.33336C5.36874 5.33336 2.66676 7.11114 2.66675 9.7778H13.3334Z" fill="currentColor"/>
<path d="M8.89297 10.6667H7.11519V14.2222L8.00408 16L8.89297 14.2222V10.6667Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M15 11C15 8 12.0269 6 10.0045 6V4C11.0897 3.59619 12.1017 2.4781 12.0269 1H6.03975C5.97239 2.44762 6.95673 3.58857 8.00448 4V6C6.03974 6 3.00001 8 3 11H15Z" fill="currentColor"/>
<path d="M10.0045 12H8.0045V16L9.0045 18L10.0045 16V12Z" fill="currentColor"/>` },
};

export const PinIcon: React.FC<BaseIconProps> = ({
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

export default PinIcon;
