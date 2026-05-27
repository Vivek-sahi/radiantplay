import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6 8.66667C4.52724 8.66667 3.33333 7.47276 3.33333 6H2C2 7.982 3.44152 9.62731 5.33333 9.9447V10.6667H4V12H8V10.6667H6.66667V9.9447C8.55848 9.62731 10 7.982 10 6H8.66667C8.66667 7.47276 7.47276 8.66667 6 8.66667ZM6 0.666672C4.89543 0.666672 4 1.5621 4 2.66667V6C4 7.10457 4.89543 8 6 8C7.10457 8 8 7.10457 8 6V2.66667C8 1.5621 7.10457 0.666672 6 0.666672Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.99998 10.1111C5.28176 10.1111 3.88887 8.71821 3.88887 6.99999H2.33331C2.33331 9.31232 4.01509 11.2319 6.2222 11.6021V12.4444H4.66665V14H9.33331V12.4444H7.77776V11.6021C9.98487 11.2319 11.6666 9.31232 11.6666 6.99999H10.1111C10.1111 8.71821 8.7182 10.1111 6.99998 10.1111ZM6.99998 0.777771C5.71131 0.777771 4.66665 1.82244 4.66665 3.1111V6.99999C4.66665 8.28866 5.71131 9.33333 6.99998 9.33333C8.28864 9.33333 9.33331 8.28866 9.33331 6.99999V3.1111C9.33331 1.82244 8.28864 0.777771 6.99998 0.777771Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.00002 11.5556C6.03634 11.5556 4.44446 9.96368 4.44446 8H2.66669C2.66669 10.6427 4.58872 12.8364 7.11113 13.2596V14.2222H5.33335V16H10.6667V14.2222H8.88891V13.2596C11.4113 12.8364 13.3334 10.6427 13.3334 8H11.5556C11.5556 9.96368 9.9637 11.5556 8.00002 11.5556ZM8.00002 0.888885C6.52726 0.888885 5.33335 2.08279 5.33335 3.55555V8C5.33335 9.47276 6.52726 10.6667 8.00002 10.6667C9.47278 10.6667 10.6667 9.47276 10.6667 8V3.55555C10.6667 2.08279 9.47278 0.888885 8.00002 0.888885Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9 13C6.79086 13 5 11.2091 5 9H3C3 11.973 5.16229 14.441 8 14.917V16H6V18H12V16H10V14.917C12.8377 14.441 15 11.973 15 9H13C13 11.2091 11.2091 13 9 13ZM9 1C7.34315 1 6 2.34315 6 4V9C6 10.6569 7.34315 12 9 12C10.6569 12 12 10.6569 12 9V4C12 2.34315 10.6569 1 9 1Z" fill="currentColor"/>` },
};

export const MicrophoneIcon: React.FC<BaseIconProps> = ({
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

export default MicrophoneIcon;
