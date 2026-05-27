import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.66667 2.99999C5.66667 3.92047 4.92047 4.66666 4 4.66666C3.07953 4.66666 2.33333 3.92047 2.33333 2.99999C2.33333 2.07952 3.07953 1.33333 4 1.33333C4.92047 1.33333 5.66667 2.07952 5.66667 2.99999Z" fill="currentColor"/>
<path d="M10.3333 2.24999H9V3.99999H7.33333V5.33333H9V6.91666H10.3333V5.33333H12V3.99999H10.3333V2.24999Z" fill="currentColor"/>
<path d="M0.666668 8.58333C0.666668 6.74238 2.15905 5.24999 4 5.24999C5.84095 5.24999 7.33333 6.74238 7.33333 8.58333V10.6667H0.666668V8.58333Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.61111 3.5C6.61111 4.57389 5.74055 5.44445 4.66667 5.44445C3.59278 5.44445 2.72222 4.57389 2.72222 3.5C2.72222 2.42611 3.59278 1.55556 4.66667 1.55556C5.74055 1.55556 6.61111 2.42611 6.61111 3.5Z" fill="currentColor"/>
<path d="M12.0556 2.625H10.5V4.66667H8.55556V6.22222H10.5V8.06945H12.0556V6.22222H14V4.66667H12.0556V2.625Z" fill="currentColor"/>
<path d="M0.777778 10.0139C0.777778 7.86612 2.51889 6.125 4.66667 6.125C6.81444 6.125 8.55556 7.86612 8.55556 10.0139V12.4444H0.777778V10.0139Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.55555 3.99999C7.55555 5.22729 6.56063 6.22222 5.33333 6.22222C4.10603 6.22222 3.11111 5.22729 3.11111 3.99999C3.11111 2.77269 4.10603 1.77777 5.33333 1.77777C6.56063 1.77777 7.55555 2.77269 7.55555 3.99999Z" fill="currentColor"/>
<path d="M13.7778 2.99999H12V5.33333H9.77777V7.1111H12V9.22222H13.7778V7.1111H16V5.33333H13.7778V2.99999Z" fill="currentColor"/>
<path d="M0.888885 11.4444C0.888885 8.98984 2.87873 6.99999 5.33333 6.99999C7.78793 6.99999 9.77777 8.98984 9.77777 11.4444V14.2222H0.888885V11.4444Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8.5 4.5C8.5 5.88071 7.38071 7 6 7C4.61929 7 3.5 5.88071 3.5 4.5C3.5 3.11929 4.61929 2 6 2C7.38071 2 8.5 3.11929 8.5 4.5Z" fill="currentColor"/>
<path d="M15.5 3.375H13.5V6H11V8H13.5V10.375H15.5V8H18V6H15.5V3.375Z" fill="currentColor"/>
<path d="M1 12.875C1 10.1136 3.23858 7.875 6 7.875C8.76142 7.875 11 10.1136 11 12.875V16H1V12.875Z" fill="currentColor"/>` },
};

export const AddUserIcon: React.FC<BaseIconProps> = ({
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

export default AddUserIcon;
