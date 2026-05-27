import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.99995 1.99998V3.99998H3.99995V1.99998H1.99995ZM1.33329 0.666655C0.965096 0.666655 0.666624 0.965131 0.666624 1.33332V10.6666C0.666624 11.0348 0.965096 11.3333 1.33329 11.3333H10.6666C11.0348 11.3333 11.3333 11.0348 11.3333 10.6666V1.33332C11.3333 0.965131 11.0348 0.666655 10.6666 0.666655H1.33329ZM5.33328 1.99998V3.99998H9.99993V1.99998H5.33328ZM3.99995 5.33331H1.99995V9.99996H3.99995V5.33331ZM5.33328 9.99996V5.33331H9.99993V9.99996H5.33328Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.33338 2.33332V4.66665H4.66671V2.33332H2.33338ZM1.55561 0.777769C1.12605 0.777769 0.77783 1.12599 0.77783 1.55555V12.4444C0.77783 12.874 1.12605 13.2222 1.55561 13.2222H12.4445C12.874 13.2222 13.2222 12.874 13.2222 12.4444V1.55555C13.2222 1.12599 12.874 0.777769 12.4445 0.777769H1.55561ZM6.22226 2.33332V4.66665H11.6667V2.33332H6.22226ZM4.66671 6.2222H2.33338V11.6666H4.66671V6.2222ZM6.22226 11.6666V6.2222H11.6667V11.6666H6.22226Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.66669 2.66666V5.33332H5.33335V2.66666H2.66669ZM1.7778 0.888884C1.28688 0.888884 0.888914 1.28685 0.888914 1.77777V14.2222C0.888914 14.7131 1.28688 15.1111 1.7778 15.1111H14.2222C14.7131 15.1111 15.1111 14.7131 15.1111 14.2222V1.77777C15.1111 1.28685 14.7131 0.888884 14.2222 0.888884H1.7778ZM7.11112 2.66666V5.33332H13.3333V2.66666H7.11112ZM5.33335 7.11109H2.66669V13.3333H5.33335V7.11109ZM7.11112 13.3333V7.11109H13.3333V13.3333H7.11112Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 3V6H6V3H3ZM2 1C1.44771 1 1 1.44772 1 2V16C1 16.5523 1.44771 17 2 17H16C16.5523 17 17 16.5523 17 16V2C17 1.44772 16.5523 1 16 1H2ZM8 3V6H15V3H8ZM6 8H3V15H6V8ZM8 15V8H15V15H8Z" fill="currentColor"/>` },
};

export const SaveWorksheetIcon: React.FC<BaseIconProps> = ({
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

export default SaveWorksheetIcon;
