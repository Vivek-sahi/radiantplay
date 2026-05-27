import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.99994 11.3334L2.49994 8.66669H0.666626V7.33335H2.74994L3.24994 4.66669H1.33329V3.33335H3.49994L3.99994 0.666687H5.33327L4.83327 3.33335H7.49992L7.99992 0.666687L9.32713 0.666695L8.82867 3.33335H10.6666V4.66669H8.57943L8.08097 7.33335H9.99996V8.66669H7.83173L7.33327 11.3334H5.99994L6.49993 8.66669H3.83327L3.33327 11.3334L1.99994 11.3334ZM6.74993 7.33335L7.24993 4.66669H4.58327L4.08327 7.33335H6.74993Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.33336 13.2222L2.91669 10.1111H0.777832V8.55555H3.20836L3.79169 5.44444H1.55561V3.88888H4.08336L4.66669 0.777771H6.22225L5.63892 3.88888H8.75001L9.33334 0.777771L10.8818 0.77778L10.3002 3.88888H12.4445V5.44444H10.0094L9.4279 8.55555H11.6667V10.1111H9.13713L8.55558 13.2222H7.00003L7.58336 10.1111H4.47225L3.88892 13.2222L2.33336 13.2222ZM7.87502 8.55555L8.45835 5.44444H5.34725L4.76392 8.55555H7.87502Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.66666 15.1111L3.33333 11.5556H0.888916V9.7778H3.66666L4.33333 6.22225H1.7778V4.44447H4.66666L5.33333 0.888916H7.11111L6.44444 4.44447H9.99998L10.6666 0.888916L12.4363 0.888927L11.7716 4.44447H14.2222V6.22225H11.4393L10.7747 9.7778H13.3334V11.5556H10.4424L9.77777 15.1111H8L8.66666 11.5556H5.11111L4.44444 15.1111L2.66666 15.1111ZM8.99999 9.7778L9.66665 6.22225H6.11111L5.44444 9.7778H8.99999Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.99997 17L3.74997 13H1V11H4.12497L4.87497 7H2V5H5.24997L5.99997 1H7.99997L7.24997 5H11.2499L11.9999 1L13.9908 1.00001L13.2431 5H16V7H12.8692L12.1215 11H15V13H11.7477L11 17H8.99996L9.74996 13H5.74997L4.99997 17L2.99997 17ZM10.125 11L10.875 7H6.87497L6.12497 11H10.125Z" fill="currentColor"/>` },
};

export const MeasureIcon: React.FC<BaseIconProps> = ({
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

export default MeasureIcon;
