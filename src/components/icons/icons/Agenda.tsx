import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.00008 0H2.00008V0.666667H1.33341C0.965225 0.666667 0.666748 0.965143 0.666748 1.33333V10.6667C0.666748 11.0349 0.965225 11.3333 1.33341 11.3333H10.6667C11.0349 11.3333 11.3334 11.0349 11.3334 10.6667V1.33333C11.3334 0.965143 11.0349 0.666667 10.6667 0.666667H10.0001V0H8.00008V0.666667H4.00008V0ZM2.00008 2V10H10.0001V2H2.00008ZM6.00008 6H8.66675V8.66667H6.00008V6Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M4.66672 0H2.33339V0.777778H1.55561C1.12606 0.777778 0.777832 1.126 0.777832 1.55556V12.4444C0.777832 12.874 1.12606 13.2222 1.55561 13.2222H12.4445C12.8741 13.2222 13.2223 12.874 13.2223 12.4444V1.55556C13.2223 1.126 12.8741 0.777778 12.4445 0.777778H11.6667V0H9.33339V0.777778H4.66672V0ZM2.33339 2.33333V11.6667H11.6667V2.33333H2.33339ZM7.00005 7H10.1112V10.1111H7.00005V7Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M5.33336 0H2.66669V0.888889H1.7778C1.28689 0.888889 0.888916 1.28686 0.888916 1.77778V14.2222C0.888916 14.7131 1.28689 15.1111 1.7778 15.1111H14.2222C14.7132 15.1111 15.1111 14.7131 15.1111 14.2222V1.77778C15.1111 1.28686 14.7132 0.888889 14.2222 0.888889H13.3334V0H10.6667V0.888889H5.33336V0ZM2.66669 2.66667V13.3333H13.3334V2.66667H2.66669ZM8.00003 8H11.5556V11.5556H8.00003V8Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M6 0H3V1H2C1.44772 1 1 1.44772 1 2V16C1 16.5523 1.44772 17 2 17H16C16.5523 17 17 16.5523 17 16V2C17 1.44772 16.5523 1 16 1H15V0H12V1H6V0ZM3 3V15H15V3H3ZM9 9H13V13H9V9Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
