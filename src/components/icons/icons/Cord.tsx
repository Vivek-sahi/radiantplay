import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.0027 3.13059H8.00265L8.00261 4.13059H4.00265L4.0027 3.13059Z" fill="currentColor"/>
<path d="M6.66929 5.19096H4.00265V6.19096H6.66929V5.19096Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9.98216 8.66666C10.3618 8.66666 10.6692 8.33833 10.6692 7.93332L10.6692 1.39999C10.6692 0.994981 10.3618 0.666656 9.9821 0.666656H2.02082C1.64113 0.666656 1.33332 0.994981 1.33332 1.39999L1.33338 7.93332C1.33338 8.33833 1.64119 8.66666 2.02088 8.66666L3.544 8.66666V11.3333L8.00265 8.66666H9.98216ZM7.48174 7.33514V7.33697L4.919 8.83327L4.919 7.33514H4.04424V7.33332L2.66924 7.33332V1.99999L9.33598 1.99999V7.33514H7.48174Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M4.66975 3.65236H9.33637L9.33632 4.81902H4.6697L4.66975 3.65236Z" fill="currentColor"/>
<path d="M7.78078 6.05613H4.6697V7.2228H7.78078V6.05613Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M11.6458 10.1111C12.0888 10.1111 12.4474 9.72806 12.4474 9.25555L12.4473 1.63333C12.4473 1.16082 12.0887 0.777771 11.6457 0.777771H2.35756C1.91459 0.777771 1.55548 1.16082 1.55548 1.63333L1.55555 9.25555C1.55555 9.72806 1.91466 10.1111 2.35763 10.1111L4.1346 10.1111V13.2222L9.33636 10.1111H11.6458ZM8.72864 8.55767V8.5598L5.73877 10.3055L5.73877 8.55767H4.71822V8.55555L3.11405 8.55555V2.33333L10.8919 2.33333V8.55767H8.72864Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M5.33693 4.17413H10.6702L10.6701 5.50746H5.33687L5.33693 4.17413Z" fill="currentColor"/>
<path d="M8.89239 6.92129H5.33687V8.25463H8.89239V6.92129Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.3095 11.5556C13.8158 11.5556 14.2257 11.1178 14.2257 10.5778L14.2256 1.86666C14.2256 1.32665 13.8157 0.888885 13.3095 0.888885H2.69443C2.18818 0.888885 1.77777 1.32665 1.77777 1.86666L1.77784 10.5778C1.77784 11.1178 2.18825 11.5556 2.6945 11.5556L4.72533 11.5556V15.1111L10.6702 11.5556H13.3095ZM9.97566 9.7802V9.78263L6.55866 11.7777L6.55866 9.7802H5.39232V9.77777L3.55899 9.77777V2.66666L12.448 2.66666V9.7802H9.97566Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M6.00398 4.69589H12.0039L12.0039 6.19589H6.00392L6.00398 4.69589Z" fill="currentColor"/>
<path d="M10.0039 7.78646H6.00392V9.28646H10.0039V7.78646Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.9732 13C15.5427 13 16.0038 12.5075 16.0038 11.9L16.0037 2.1C16.0037 1.49249 15.5426 1 14.9731 1H3.03117C2.46164 1 1.99992 1.49249 1.99992 2.1L2.00001 11.9C2.00001 12.5075 2.46172 13 3.03125 13L5.31594 13V17L12.0039 13H14.9732ZM11.2226 11.0027V11.0055L7.37844 13.2499L7.37844 11.0027H6.0663V11L4.0038 11V3L14.0039 3V11.0027H11.2226Z" fill="currentColor"/>` },
};

export const CordIcon: React.FC<BaseIconProps> = ({
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

export default CordIcon;
