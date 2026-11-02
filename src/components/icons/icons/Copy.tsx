import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.66675 3.99996C7.40313 3.99996 8.00008 4.59691 8.00008 5.33329V9.99996C8.00008 10.7363 7.40313 11.3333 6.66675 11.3333H2.00008C1.2637 11.3333 0.666748 10.7363 0.666748 9.99996V5.33329C0.666748 4.59691 1.2637 3.99996 2.00008 3.99996H6.66675ZM6.66675 9.99996V5.33329H2.00008V9.99996H6.66675Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M10.6667 0.666626C11.0349 0.666626 11.3334 0.965103 11.3334 1.33329V6.66663C11.3334 7.03482 11.0349 7.33329 10.6667 7.33329H5.33341C4.96522 7.33329 4.66675 7.03482 4.66675 6.66663V1.33329C4.66675 0.965103 4.96522 0.666626 5.33341 0.666626H10.6667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7.77783 4.66672C8.63694 4.66672 9.33339 5.36317 9.33339 6.22228V11.6667C9.33339 12.5258 8.63694 13.2223 7.77783 13.2223H2.33339C1.47428 13.2223 0.777832 12.5258 0.777832 11.6667V6.22228C0.777832 5.36317 1.47428 4.66672 2.33339 4.66672H7.77783ZM7.77783 11.6667V6.22228H2.33339V11.6667H7.77783Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M12.4445 0.777832C12.8741 0.777832 13.2223 1.12606 13.2223 1.55561V7.77783C13.2223 8.20739 12.8741 8.55561 12.4445 8.55561H6.22228C5.79272 8.55561 5.4445 8.20739 5.4445 7.77783V1.55561C5.4445 1.12606 5.79272 0.777832 6.22228 0.777832H12.4445Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.88892 5.33336C9.87076 5.33336 10.6667 6.1293 10.6667 7.11114V13.3334C10.6667 14.3152 9.87076 15.1111 8.88892 15.1111H2.66669C1.68485 15.1111 0.888916 14.3152 0.888916 13.3334V7.11114C0.888916 6.1293 1.68485 5.33336 2.66669 5.33336H8.88892ZM8.88892 13.3334V7.11114H2.66669V13.3334H8.88892Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M14.2222 0.888916C14.7132 0.888916 15.1111 1.28689 15.1111 1.7778V8.88892C15.1111 9.37984 14.7132 9.7778 14.2222 9.7778H7.11114C6.62022 9.7778 6.22225 9.37984 6.22225 8.88892V1.77781C6.22225 1.28689 6.62022 0.888916 7.11114 0.888916H14.2222Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M10 6C11.1046 6 12 6.89543 12 8V15C12 16.1046 11.1046 17 10 17H3C1.89543 17 1 16.1046 1 15V8C1 6.89543 1.89543 6 3 6H10ZM10 15V8H3V15H10Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M16 1C16.5523 1 17 1.44772 17 2V10C17 10.5523 16.5523 11 16 11H8C7.44772 11 7 10.5523 7 10V2C7 1.44772 7.44772 1 8 1H16Z" fill="currentColor"/>` },
};

export const CopyIcon: React.FC<BaseIconProps> = ({
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

export default CopyIcon;
