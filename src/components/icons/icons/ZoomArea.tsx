import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M2.00008 0.666748H0.666748V2.00008H2.00008V0.666748Z" fill="currentColor"/>
<path d="M4.00008 0.666748H2.66675V2.00008H4.00008V0.666748Z" fill="currentColor"/>
<path d="M4.66675 0.666748H6.00008V2.00008H4.66675V0.666748Z" fill="currentColor"/>
<path d="M8.00008 0.666748H6.66675V2.00008H8.00008V0.666748Z" fill="currentColor"/>
<path d="M8.66675 0.666748H10.0001V2.00008H8.66675V0.666748Z" fill="currentColor"/>
<path d="M11.3334 0.666748H10.6667V2.00008H11.3334V0.666748Z" fill="currentColor"/>
<path d="M11.3334 4.66675V6.00008H10.0001V4.66675H11.3334Z" fill="currentColor"/>
<path d="M11.3334 4.00008V2.66675H10.0001V4.00008H11.3334Z" fill="currentColor"/>
<path d="M11.3334 6.66675V8.00008H10.0001V6.66675H11.3334Z" fill="currentColor"/>
<path d="M2.00008 2.66675H0.666748V4.00008H2.00008V2.66675Z" fill="currentColor"/>
<path d="M0.666748 4.66675H2.00008V6.00008H0.666748V4.66675Z" fill="currentColor"/>
<path d="M2.00008 10.6667H0.666748V11.3334H2.00008V10.6667Z" fill="currentColor"/>
<path d="M0.666748 8.66675H2.00008V10.0001H0.666748V8.66675Z" fill="currentColor"/>
<path d="M4.00008 10.0001H2.66675V11.3334H4.00008V10.0001Z" fill="currentColor"/>
<path d="M0.666748 6.66675H2.00008V8.00008H0.666748V6.66675Z" fill="currentColor"/>
<path d="M6.00008 10.0001H4.66675V11.3334H6.00008V10.0001Z" fill="currentColor"/>
<path d="M6.66675 10.0001H8.00008V11.3334H6.66675V10.0001Z" fill="currentColor"/>
<path d="M4.27617 4.11446C5.31756 3.07307 7.006 3.07307 8.0474 4.11446C8.9549 5.02196 9.07158 6.42081 8.39745 7.45466L11.229 10.2862L10.2862 11.229L7.41297 8.3558C6.40494 8.89164 5.12541 8.73494 4.27617 7.8857C3.23477 6.8443 3.23477 5.15586 4.27617 4.11446ZM7.10459 5.05727C6.58389 4.53657 5.73967 4.53657 5.21897 5.05727C4.69828 5.57797 4.69828 6.42219 5.21897 6.94289C5.73967 7.46359 6.58389 7.46359 7.10459 6.94289C7.62529 6.42219 7.62529 5.57797 7.10459 5.05727Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33339 0.777832H0.777832V2.33339H2.33339V0.777832Z" fill="currentColor"/>
<path d="M4.66672 0.777832H3.11117V2.33339H4.66672V0.777832Z" fill="currentColor"/>
<path d="M5.4445 0.777832H7.00005V2.33339H5.4445V0.777832Z" fill="currentColor"/>
<path d="M9.33339 0.777832H7.77783V2.33339H9.33339V0.777832Z" fill="currentColor"/>
<path d="M10.1112 0.777832H11.6667V2.33339H10.1112V0.777832Z" fill="currentColor"/>
<path d="M13.2223 0.777832H12.4445V2.33339H13.2223V0.777832Z" fill="currentColor"/>
<path d="M13.2223 5.4445V7.00005H11.6667V5.4445H13.2223Z" fill="currentColor"/>
<path d="M13.2223 4.66672V3.11117H11.6667V4.66672H13.2223Z" fill="currentColor"/>
<path d="M13.2223 7.77783V9.33339H11.6667V7.77783H13.2223Z" fill="currentColor"/>
<path d="M2.33339 3.11117H0.777832V4.66672H2.33339V3.11117Z" fill="currentColor"/>
<path d="M0.777832 5.4445H2.33339V7.00005H0.777832V5.4445Z" fill="currentColor"/>
<path d="M2.33339 12.4445H0.777832V13.2223H2.33339V12.4445Z" fill="currentColor"/>
<path d="M0.777832 10.1112H2.33339V11.6667H0.777832V10.1112Z" fill="currentColor"/>
<path d="M4.66672 11.6667H3.11117V13.2223H4.66672V11.6667Z" fill="currentColor"/>
<path d="M0.777832 7.77783H2.33339V9.33339H0.777832V7.77783Z" fill="currentColor"/>
<path d="M7.00005 11.6667H5.4445V13.2223H7.00005V11.6667Z" fill="currentColor"/>
<path d="M7.77783 11.6667H9.33339V13.2223H7.77783V11.6667Z" fill="currentColor"/>
<path d="M4.98882 4.80017C6.20378 3.5852 8.17363 3.5852 9.38859 4.80017C10.4473 5.85892 10.5835 7.49091 9.79698 8.69706L13.1004 12.0005L12.0005 13.1005L8.64842 9.74839C7.47239 10.3735 5.9796 10.1907 4.98882 9.19994C3.77385 7.98498 3.77385 6.01513 4.98882 4.80017ZM8.28865 5.90011C7.68117 5.29263 6.69624 5.29263 6.08876 5.90011C5.48128 6.50759 5.48128 7.49252 6.08876 8.1C6.69624 8.70748 7.68117 8.70748 8.28865 8.1C8.89613 7.49252 8.89613 6.50759 8.28865 5.90011Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66669 0.888916H0.888916V2.66669H2.66669V0.888916Z" fill="currentColor"/>
<path d="M5.33336 0.888916H3.55558V2.66669H5.33336V0.888916Z" fill="currentColor"/>
<path d="M6.22225 0.888916H8.00003V2.66669H6.22225V0.888916Z" fill="currentColor"/>
<path d="M10.6667 0.888916H8.88892V2.66669H10.6667V0.888916Z" fill="currentColor"/>
<path d="M11.5556 0.888916H13.3334V2.66669H11.5556V0.888916Z" fill="currentColor"/>
<path d="M15.1111 0.888916H14.2222V2.66669H15.1111V0.888916Z" fill="currentColor"/>
<path d="M15.1111 6.22225V8.00003H13.3334V6.22225H15.1111Z" fill="currentColor"/>
<path d="M15.1111 5.33336V3.55558H13.3334V5.33336H15.1111Z" fill="currentColor"/>
<path d="M15.1111 8.88892V10.6667H13.3334V8.88892H15.1111Z" fill="currentColor"/>
<path d="M2.66669 3.55558H0.888916V5.33336H2.66669V3.55558Z" fill="currentColor"/>
<path d="M0.888916 6.22225H2.66669V8.00003H0.888916V6.22225Z" fill="currentColor"/>
<path d="M2.66669 14.2222H0.888916V15.1111H2.66669V14.2222Z" fill="currentColor"/>
<path d="M0.888916 11.5556H2.66669V13.3334H0.888916V11.5556Z" fill="currentColor"/>
<path d="M5.33336 13.3334H3.55558V15.1111H5.33336V13.3334Z" fill="currentColor"/>
<path d="M0.888916 8.88892H2.66669V10.6667H0.888916V8.88892Z" fill="currentColor"/>
<path d="M8.00003 13.3334H6.22225V15.1111H8.00003V13.3334Z" fill="currentColor"/>
<path d="M8.88892 13.3334H10.6667V15.1111H8.88892V13.3334Z" fill="currentColor"/>
<path d="M5.70147 5.48587C7.09 4.09734 9.34126 4.09734 10.7298 5.48587C11.9398 6.69587 12.0954 8.561 11.1965 9.93947L14.9719 13.7149L13.7148 14.9719L9.88388 11.141C8.53983 11.8554 6.83379 11.6465 5.70147 10.5142C4.31294 9.12565 4.31294 6.8744 5.70147 5.48587ZM9.47271 6.74295C8.77844 6.04868 7.65282 6.04868 6.95855 6.74295C6.26429 7.43721 6.26429 8.56284 6.95855 9.2571C7.65282 9.95137 8.77844 9.95137 9.47271 9.2571C10.167 8.56284 10.167 7.43721 9.47271 6.74295Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
<path d="M6.41413 6.17157C7.97622 4.60948 10.5089 4.60948 12.071 6.17157C13.4322 7.53282 13.6073 9.63109 12.5961 11.1819L16.8434 15.4292L15.4292 16.8434L11.1193 12.5336C9.60728 13.3373 7.68799 13.1023 6.41413 11.8284C4.85203 10.2663 4.85203 7.73367 6.41413 6.17157ZM10.6568 7.58579C9.87572 6.80474 8.60939 6.80474 7.82834 7.58579C7.04729 8.36683 7.04729 9.63317 7.82834 10.4142C8.60939 11.1953 9.87572 11.1953 10.6568 10.4142C11.4378 9.63317 11.4378 8.36683 10.6568 7.58579Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
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
