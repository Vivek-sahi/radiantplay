import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.99995 0H1.99995V0.666665H1.33329C0.9651 0.666665 0.666624 0.965141 0.666624 1.33333V10.6666C0.666624 11.0348 0.9651 11.3333 1.33329 11.3333H10.6666C11.0348 11.3333 11.3333 11.0348 11.3333 10.6666V1.33333C11.3333 0.965141 11.0348 0.666665 10.6666 0.666665H9.99993V0H7.99994V0.666665H3.99995V0ZM1.99995 1.99999V9.99997H9.99993V1.99999H1.99995ZM5.99994 5.99998H8.6666V8.66664H5.99994V5.99998Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.66671 0H2.33338V0.777775H1.5556C1.12605 0.777775 0.777829 1.126 0.777829 1.55555V12.4444C0.777829 12.874 1.12605 13.2222 1.5556 13.2222H12.4445C12.874 13.2222 13.2222 12.874 13.2222 12.4444V1.55555C13.2222 1.126 12.874 0.777775 12.4445 0.777775H11.6667V0H9.33336V0.777775H4.66671V0ZM2.33338 2.33333V11.6666H11.6667V2.33333H2.33338ZM7.00003 6.99998H10.1111V10.1111H7.00003V6.99998Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.33334 0H2.66669V0.888886H1.7778C1.28688 0.888886 0.888913 1.28685 0.888913 1.77777V14.2222C0.888913 14.7131 1.28688 15.1111 1.7778 15.1111H14.2222C14.7131 15.1111 15.1111 14.7131 15.1111 14.2222V1.77777C15.1111 1.28685 14.7131 0.888886 14.2222 0.888886H13.3333V0H10.6667V0.888886H5.33334V0ZM2.66669 2.66666V13.3333H13.3333V2.66666H2.66669ZM8 7.99998H11.5555V11.5555H8V7.99998Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6 0H3V1H2C1.44772 1 1 1.44772 1 2V16C1 16.5523 1.44772 17 2 17H16C16.5523 17 17 16.5523 17 16V2C17 1.44772 16.5523 1 16 1H15V0H12V1H6V0ZM3 3V15H15V3H3ZM9 9H13V13H9V9Z" fill="currentColor"/>` },
};

export const AgendaIcon: React.FC<BaseIconProps> = ({
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

export default AgendaIcon;
