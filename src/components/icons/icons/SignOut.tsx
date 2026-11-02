import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.45341 6.66659H2.66675V5.33325H9.45341L8.59341 4.46659L9.54008 3.53325L12.0001 5.99992L9.54008 8.46659L8.60008 7.53325L9.45341 6.66659ZM2.00008 9.33325H6.66675V10.6666H0.666748V1.33325H6.66675V2.66659H2.00008V9.33325Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.0289 7.77789H3.11117V6.22233H11.0289L10.0256 5.21122L11.1301 4.12233L14.0001 7.00011L11.1301 9.87789L10.0334 8.789L11.0289 7.77789ZM2.33339 10.889H7.77783V12.4446H0.777832V1.55566H7.77783V3.11122H2.33339V10.889Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M12.6045 8.88894H3.55558V7.11117H12.6045L11.4578 5.95561L12.72 4.71117L16 8.00005L12.72 11.2889L11.4667 10.0445L12.6045 8.88894ZM2.66669 12.4445H8.88892V14.2223H0.888916V1.77783H8.88892V3.55561H2.66669V12.4445Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14.18 10H4V8H14.18L12.89 6.7L14.31 5.3L18 9L14.31 12.7L12.9 11.3L14.18 10ZM3 14H10V16H1V2H10V4H3V14Z" fill="currentColor"/>` },
};

export const SignOutIcon: React.FC<BaseIconProps> = ({
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

export default SignOutIcon;
