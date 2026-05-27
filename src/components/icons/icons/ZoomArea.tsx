import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.00002 0.666656H0.666687V1.99999H2.00002V0.666656Z" fill="currentColor"/>
<path d="M4.00002 0.666656H2.66669V1.99999H4.00002V0.666656Z" fill="currentColor"/>
<path d="M4.66669 0.666656H6.00002V1.99999H4.66669V0.666656Z" fill="currentColor"/>
<path d="M8.00002 0.666656H6.66669V1.99999H8.00002V0.666656Z" fill="currentColor"/>
<path d="M8.66669 0.666656H10V1.99999H8.66669V0.666656Z" fill="currentColor"/>
<path d="M11.3334 0.666656H10.6667V1.99999H11.3334V0.666656Z" fill="currentColor"/>
<path d="M11.3334 4.66666V5.99999H10V4.66666H11.3334Z" fill="currentColor"/>
<path d="M11.3334 3.99999V2.66666H10V3.99999H11.3334Z" fill="currentColor"/>
<path d="M11.3334 6.66666V7.99999H10V6.66666H11.3334Z" fill="currentColor"/>
<path d="M2.00002 2.66666H0.666687V3.99999H2.00002V2.66666Z" fill="currentColor"/>
<path d="M0.666687 4.66666H2.00002V5.99999H0.666687V4.66666Z" fill="currentColor"/>
<path d="M2.00002 10.6667H0.666687V11.3333H2.00002V10.6667Z" fill="currentColor"/>
<path d="M0.666687 8.66666H2.00002V9.99999H0.666687V8.66666Z" fill="currentColor"/>
<path d="M4.00002 9.99999H2.66669V11.3333H4.00002V9.99999Z" fill="currentColor"/>
<path d="M0.666687 6.66666H2.00002V7.99999H0.666687V6.66666Z" fill="currentColor"/>
<path d="M6.00002 9.99999H4.66669V11.3333H6.00002V9.99999Z" fill="currentColor"/>
<path d="M6.66669 9.99999H8.00002V11.3333H6.66669V9.99999Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M4.2761 4.11437C5.3175 3.07297 7.00594 3.07297 8.04734 4.11437C8.95484 5.02187 9.07152 6.42072 8.39739 7.45457L11.2289 10.2861L10.2861 11.2289L7.41291 8.35571C6.40488 8.89155 5.12535 8.73485 4.2761 7.88561C3.23471 6.84421 3.23471 5.15577 4.2761 4.11437ZM7.10453 5.05718C6.58383 4.53648 5.73961 4.53648 5.21891 5.05718C4.69821 5.57788 4.69821 6.4221 5.21891 6.9428C5.73961 7.4635 6.58383 7.4635 7.10453 6.9428C7.62523 6.4221 7.62523 5.57788 7.10453 5.05718Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33333 0.777771H0.777771V2.33333H2.33333V0.777771Z" fill="currentColor"/>
<path d="M4.66666 0.777771H3.1111V2.33333H4.66666V0.777771Z" fill="currentColor"/>
<path d="M5.44444 0.777771H6.99999V2.33333H5.44444V0.777771Z" fill="currentColor"/>
<path d="M9.33333 0.777771H7.77777V2.33333H9.33333V0.777771Z" fill="currentColor"/>
<path d="M10.1111 0.777771H11.6667V2.33333H10.1111V0.777771Z" fill="currentColor"/>
<path d="M13.2222 0.777771H12.4444V2.33333H13.2222V0.777771Z" fill="currentColor"/>
<path d="M13.2222 5.44444V6.99999H11.6667V5.44444H13.2222Z" fill="currentColor"/>
<path d="M13.2222 4.66666V3.1111H11.6667V4.66666H13.2222Z" fill="currentColor"/>
<path d="M13.2222 7.77777V9.33333H11.6667V7.77777H13.2222Z" fill="currentColor"/>
<path d="M2.33333 3.1111H0.777771V4.66666H2.33333V3.1111Z" fill="currentColor"/>
<path d="M0.777771 5.44444H2.33333V6.99999H0.777771V5.44444Z" fill="currentColor"/>
<path d="M2.33333 12.4444H0.777771V13.2222H2.33333V12.4444Z" fill="currentColor"/>
<path d="M0.777771 10.1111H2.33333V11.6667H0.777771V10.1111Z" fill="currentColor"/>
<path d="M4.66666 11.6667H3.1111V13.2222H4.66666V11.6667Z" fill="currentColor"/>
<path d="M0.777771 7.77777H2.33333V9.33333H0.777771V7.77777Z" fill="currentColor"/>
<path d="M6.99999 11.6667H5.44444V13.2222H6.99999V11.6667Z" fill="currentColor"/>
<path d="M7.77777 11.6667H9.33333V13.2222H7.77777V11.6667Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M4.98876 4.80011C6.20372 3.58514 8.17357 3.58514 9.38853 4.80011C10.4473 5.85885 10.5834 7.49084 9.79692 8.697L13.1004 12.0005L12.0004 13.1004L8.64836 9.74833C7.47232 10.3735 5.97954 10.1907 4.98876 9.19988C3.77379 7.98492 3.77379 6.01507 4.98876 4.80011ZM8.28859 5.90005C7.68111 5.29257 6.69618 5.29257 6.0887 5.90005C5.48122 6.50753 5.48122 7.49245 6.0887 8.09994C6.69618 8.70742 7.68111 8.70742 8.28859 8.09994C8.89607 7.49245 8.89607 6.50753 8.28859 5.90005Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66669 0.888885H0.888916V2.66666H2.66669V0.888885Z" fill="currentColor"/>
<path d="M5.33336 0.888885H3.55558V2.66666H5.33336V0.888885Z" fill="currentColor"/>
<path d="M6.22225 0.888885H8.00003V2.66666H6.22225V0.888885Z" fill="currentColor"/>
<path d="M10.6667 0.888885H8.88892V2.66666H10.6667V0.888885Z" fill="currentColor"/>
<path d="M11.5556 0.888885H13.3334V2.66666H11.5556V0.888885Z" fill="currentColor"/>
<path d="M15.1111 0.888885H14.2222V2.66666H15.1111V0.888885Z" fill="currentColor"/>
<path d="M15.1111 6.22222V8H13.3334V6.22222H15.1111Z" fill="currentColor"/>
<path d="M15.1111 5.33333V3.55555H13.3334V5.33333H15.1111Z" fill="currentColor"/>
<path d="M15.1111 8.88889V10.6667H13.3334V8.88889H15.1111Z" fill="currentColor"/>
<path d="M2.66669 3.55555H0.888916V5.33333H2.66669V3.55555Z" fill="currentColor"/>
<path d="M0.888916 6.22222H2.66669V8H0.888916V6.22222Z" fill="currentColor"/>
<path d="M2.66669 14.2222H0.888916V15.1111H2.66669V14.2222Z" fill="currentColor"/>
<path d="M0.888916 11.5556H2.66669V13.3333H0.888916V11.5556Z" fill="currentColor"/>
<path d="M5.33336 13.3333H3.55558V15.1111H5.33336V13.3333Z" fill="currentColor"/>
<path d="M0.888916 8.88889H2.66669V10.6667H0.888916V8.88889Z" fill="currentColor"/>
<path d="M8.00003 13.3333H6.22225V15.1111H8.00003V13.3333Z" fill="currentColor"/>
<path d="M8.88892 13.3333H10.6667V15.1111H8.88892V13.3333Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.70147 5.48584C7.09 4.09731 9.34126 4.09731 10.7298 5.48584C11.9398 6.69584 12.0954 8.56097 11.1965 9.93944L14.9719 13.7148L13.7148 14.9719L9.88388 11.141C8.53983 11.8554 6.83379 11.6465 5.70147 10.5142C4.31294 9.12562 4.31294 6.87437 5.70147 5.48584ZM9.47271 6.74292C8.77844 6.04865 7.65282 6.04865 6.95855 6.74292C6.26429 7.43718 6.26429 8.56281 6.95855 9.25707C7.65282 9.95134 8.77844 9.95134 9.47271 9.25707C10.167 8.56281 10.167 7.43718 9.47271 6.74292Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 1H1V3H3V1Z" fill="currentColor"/>
<path d="M6 1H4V3H6V1Z" fill="currentColor"/>
<path d="M7 1H9V3H7V1Z" fill="currentColor"/>
<path d="M12 1H10V3H12V1Z" fill="currentColor"/>
<path d="M13 1H15V3H13V1Z" fill="currentColor"/>
<path d="M17 1H16V3H17V1Z" fill="currentColor"/>
<path d="M17 7V9H15V7H17Z" fill="currentColor"/>
<path d="M17 6V4H15V6H17Z" fill="currentColor"/>
<path d="M17 10V12H15V10H17Z" fill="currentColor"/>
<path d="M3 4H1V6H3V4Z" fill="currentColor"/>
<path d="M1 7H3V9H1V7Z" fill="currentColor"/>
<path d="M3 16H1V17H3V16Z" fill="currentColor"/>
<path d="M1 13H3V15H1V13Z" fill="currentColor"/>
<path d="M6 15H4V17H6V15Z" fill="currentColor"/>
<path d="M1 10H3V12H1V10Z" fill="currentColor"/>
<path d="M9 15H7V17H9V15Z" fill="currentColor"/>
<path d="M10 15H12V17H10V15Z" fill="currentColor"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.41413 6.17157C7.97622 4.60948 10.5089 4.60948 12.071 6.17157C13.4322 7.53282 13.6073 9.63109 12.5961 11.1819L16.8434 15.4292L15.4292 16.8434L11.1193 12.5336C9.60728 13.3373 7.68799 13.1023 6.41413 11.8284C4.85203 10.2663 4.85203 7.73367 6.41413 6.17157ZM10.6568 7.58579C9.87572 6.80474 8.60939 6.80474 7.82834 7.58579C7.04729 8.36683 7.04729 9.63317 7.82834 10.4142C8.60939 11.1953 9.87572 11.1953 10.6568 10.4142C11.4378 9.63317 11.4378 8.36683 10.6568 7.58579Z" fill="currentColor"/>` },
};

export const ZoomAreaIcon: React.FC<BaseIconProps> = ({
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

export default ZoomAreaIcon;
