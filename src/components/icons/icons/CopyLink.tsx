import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.666667 3.33333C0.666667 2.59695 1.189 2 1.83333 2H4.66667V3.33333H2V8.66667H4.66667V10H1.83333C1.189 10 0.666667 9.40305 0.666667 8.66667V3.33333ZM3.33333 5.33333H8.66667V6.66667H3.33333V5.33333ZM10.1667 10C10.811 10 11.3333 9.40305 11.3333 8.66667V3.33333C11.3333 2.59695 10.811 2 10.1667 2H7.33333V3.33333H10V8.66667H7.33333V10H10.1667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.777779 3.88889C0.777779 3.02978 1.38717 2.33334 2.13889 2.33334H5.44445V3.88889H2.33333V10.1111H5.44445V11.6667H2.13889C1.38717 11.6667 0.777779 10.9702 0.777779 10.1111V3.88889ZM3.88889 6.22222H10.1111V7.77778H3.88889V6.22222ZM11.8611 11.6667C12.6128 11.6667 13.2222 10.9702 13.2222 10.1111V3.88889C13.2222 3.02978 12.6128 2.33334 11.8611 2.33334H8.55556V3.88889H11.6667V10.1111H8.55556V11.6667H11.8611Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0.888885 4.44444C0.888885 3.4626 1.58533 2.66666 2.44444 2.66666H6.22222V4.44444H2.66666V11.5556H6.22222V13.3333H2.44444C1.58533 13.3333 0.888885 12.5374 0.888885 11.5556V4.44444ZM4.44444 7.11111H11.5556V8.88889H4.44444V7.11111ZM13.5556 13.3333C14.4147 13.3333 15.1111 12.5374 15.1111 11.5556V4.44444C15.1111 3.4626 14.4147 2.66666 13.5556 2.66666H9.77777V4.44444H13.3333V11.5556H9.77777V13.3333H13.5556Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 20 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.11111 5C1.11111 3.89543 1.98167 3 3.05556 3H7.77778V5H3.33334V13H7.77778V15H3.05556C1.98167 15 1.11111 14.1046 1.11111 13V5ZM5.55556 8H14.4444V10H5.55556V8ZM16.9444 15C18.0183 15 18.8889 14.1046 18.8889 13V5C18.8889 3.89543 18.0183 3 16.9444 3H12.2222V5H16.6667V13H12.2222V15H16.9444Z" fill="currentColor"/>` },
};

export const CopyLinkIcon: React.FC<BaseIconProps> = ({
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

export default CopyLinkIcon;
