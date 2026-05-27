import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5 6.33333V2H3.66667V6.33333C3.66667 7.622 4.71134 8.66667 6 8.66667C7.28867 8.66667 8.33333 7.622 8.33333 6.33333V2H7V6.33333C7 6.88562 6.55229 7.33333 6 7.33333C5.44772 7.33333 5 6.88562 5 6.33333ZM8.66667 10V9.33333H3.33333V10H8.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.83333 7.38889V2.33334H4.27778V7.38889C4.27778 8.89233 5.49656 10.1111 7 10.1111C8.50344 10.1111 9.72222 8.89233 9.72222 7.38889V2.33334H8.16667V7.38889C8.16667 8.03322 7.64433 8.55556 7 8.55556C6.35567 8.55556 5.83333 8.03322 5.83333 7.38889ZM10.1111 11.6667V10.8889H3.88889V11.6667H10.1111Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.66666 8.44444V2.66666H4.88889V8.44444C4.88889 10.1627 6.28178 11.5556 8 11.5556C9.71822 11.5556 11.1111 10.1627 11.1111 8.44444V2.66666H9.33333V8.44444C9.33333 9.18082 8.73638 9.77777 8 9.77777C7.26362 9.77777 6.66666 9.18082 6.66666 8.44444ZM11.5556 13.3333V12.4444H4.44444V13.3333H11.5556Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 9.5V3H5.5V9.5C5.5 11.433 7.067 13 9 13C10.933 13 12.5 11.433 12.5 9.5V3H10.5V9.5C10.5 10.3284 9.82843 11 9 11C8.17157 11 7.5 10.3284 7.5 9.5ZM13 15V14H5V15H13Z" fill="currentColor"/>` },
};

export const UnderlineIcon: React.FC<BaseIconProps> = ({
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

export default UnderlineIcon;
