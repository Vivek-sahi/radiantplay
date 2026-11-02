import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2 11.3333L2.5 8.66663H0.666687V7.33329H2.75L3.25 4.66663H1.33335V3.33329H3.5L4 0.666626H5.33333L4.83333 3.33329H7.49998L7.99998 0.666626L9.32719 0.666634L8.82873 3.33329H10.6667V4.66663H8.57949L8.08103 7.33329H10V8.66663H7.8318L7.33333 11.3333H6L6.49999 8.66663H3.83333L3.33333 11.3333L2 11.3333ZM6.74999 7.33329L7.24999 4.66663H4.58333L4.08333 7.33329H6.74999Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.3333 13.2223L2.91663 10.1112H0.777771V8.55561H3.2083L3.79163 5.4445H1.55555V3.88894H4.0833L4.66663 0.777832H6.22219L5.63886 3.88894H8.74995L9.33328 0.777832L10.8817 0.777841L10.3002 3.88894H12.4444V5.4445H10.0094L9.42784 8.55561H11.6667V10.1112H9.13706L8.55552 13.2223H6.99997L7.58329 10.1112H4.47219L3.88885 13.2223L2.3333 13.2223ZM7.87496 8.55561L8.45829 5.4445H5.34719L4.76386 8.55561H7.87496Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66666 15.1111L3.33333 11.5556H0.888916V9.7778H3.66666L4.33333 6.22225H1.7778V4.44447H4.66666L5.33333 0.888916H7.11111L6.44444 4.44447H9.99998L10.6666 0.888916L12.4363 0.888927L11.7716 4.44447H14.2222V6.22225H11.4393L10.7747 9.7778H13.3334V11.5556H10.4424L9.77777 15.1111H8L8.66666 11.5556H5.11111L4.44444 15.1111L2.66666 15.1111ZM8.99999 9.7778L9.66665 6.22225H6.11111L5.44444 9.7778H8.99999Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M2.99997 17L3.74997 13H1V11H4.12497L4.87497 7H2V5H5.24997L5.99997 1H7.99997L7.24997 5H11.2499L11.9999 1L13.9908 1.00001L13.2431 5H16V7H12.8692L12.1215 11H15V13H11.7477L11 17H8.99996L9.74996 13H5.74997L4.99997 17L2.99997 17ZM10.125 11L10.875 7H6.87497L6.12497 11H10.125Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
