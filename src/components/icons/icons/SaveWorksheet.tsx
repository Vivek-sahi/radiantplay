import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.00008 1.99996V3.99996H4.00008V1.99996H2.00008ZM1.33341 0.666626C0.96522 0.666626 0.666748 0.965103 0.666748 1.33329V10.6666C0.666748 11.0348 0.96522 11.3333 1.33341 11.3333H10.6667C11.0349 11.3333 11.3334 11.0348 11.3334 10.6666V1.33329C11.3334 0.965103 11.0349 0.666626 10.6667 0.666626H1.33341ZM5.33341 1.99996V3.99996H10.0001V1.99996H5.33341ZM4.00008 5.33329H2.00008V9.99996H4.00008V5.33329ZM5.33341 9.99996V5.33329H10.0001V9.99996H5.33341Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33339 2.33339V4.66672H4.66672V2.33339H2.33339ZM1.55561 0.777832C1.12605 0.777832 0.777832 1.12606 0.777832 1.55561V12.4445C0.777832 12.8741 1.12605 13.2223 1.55561 13.2223H12.4445C12.8741 13.2223 13.2223 12.8741 13.2223 12.4445V1.55561C13.2223 1.12606 12.8741 0.777832 12.4445 0.777832H1.55561ZM6.22228 2.33339V4.66672H11.6667V2.33339H6.22228ZM4.66672 6.22228H2.33339V11.6667H4.66672V6.22228ZM6.22228 11.6667V6.22228H11.6667V11.6667H6.22228Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66669 2.66669V5.33336H5.33336V2.66669H2.66669ZM1.7778 0.888916C1.28688 0.888916 0.888916 1.28689 0.888916 1.7778V14.2222C0.888916 14.7132 1.28688 15.1111 1.7778 15.1111H14.2222C14.7132 15.1111 15.1111 14.7132 15.1111 14.2222V1.7778C15.1111 1.28689 14.7132 0.888916 14.2222 0.888916H1.7778ZM7.11114 2.66669V5.33336H13.3334V2.66669H7.11114ZM5.33336 7.11114H2.66669V13.3334H5.33336V7.11114ZM7.11114 13.3334V7.11114H13.3334V13.3334H7.11114Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 3V6H6V3H3ZM2 1C1.44771 1 1 1.44772 1 2V16C1 16.5523 1.44771 17 2 17H16C16.5523 17 17 16.5523 17 16V2C17 1.44772 16.5523 1 16 1H2ZM8 3V6H15V3H8ZM6 8H3V15H6V8ZM8 15V8H15V15H8Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
