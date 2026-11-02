import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.666748 2.00004C0.666748 1.63185 0.965225 1.33337 1.33341 1.33337H10.6667C11.0349 1.33337 11.3334 1.63185 11.3334 2.00004V8.00004C11.3334 8.36823 11.0349 8.66671 10.6667 8.66671H6.66673V9.64325L8.36987 10.7787L7.63027 11.8881L6.00007 10.8013L4.36987 11.8881L3.63027 10.7787L5.3334 9.64326V8.66671H1.33341C0.965225 8.66671 0.666748 8.36823 0.666748 8.00004V2.00004ZM5.00008 6.66671L7.66675 5.00004L5.00008 3.33337V6.66671Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.777832 2.33332C0.777832 1.90376 1.12606 1.55554 1.55561 1.55554H12.4445C12.8741 1.55554 13.2223 1.90377 13.2223 2.33332V9.33332C13.2223 9.76288 12.8741 10.1111 12.4445 10.1111H7.77781V11.2504L9.76481 12.5751L8.90194 13.8694L7.00004 12.6014L5.09814 13.8694L4.23528 12.5751L6.22225 11.2504V10.1111H1.55561C1.12606 10.1111 0.777832 9.76287 0.777832 9.33332V2.33332ZM5.83339 7.77776L8.9445 5.83332L5.83339 3.88888V7.77776Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.888916 2.66672C0.888916 2.1758 1.28689 1.77783 1.7778 1.77783H14.2222C14.7132 1.77783 15.1111 2.1758 15.1111 2.66672V10.6667C15.1111 11.1576 14.7132 11.5556 14.2222 11.5556H8.88889V12.8577L11.1597 14.3716L10.1736 15.8508L8.00001 14.4017L5.82641 15.8508L4.84028 14.3716L7.11111 12.8577V11.5556H1.7778C1.28689 11.5556 0.888916 11.1576 0.888916 10.6667V2.66672ZM6.66669 8.88894L10.2222 6.66672L6.66669 4.4445V8.88894Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M1 3C1 2.44771 1.44772 2 2 2H16C16.5523 2 17 2.44772 17 3V12C17 12.5523 16.5523 13 16 13H9.99997V14.4648L12.5547 16.1679L11.4453 17.8321L8.99998 16.2019L6.55469 17.8321L5.44528 16.1679L7.99997 14.4648V13H2C1.44772 13 1 12.5523 1 12V3ZM7.5 10L11.5 7.5L7.5 5V10Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const PresentIcon: React.FC<BaseIconProps> = ({
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

export default PresentIcon;
