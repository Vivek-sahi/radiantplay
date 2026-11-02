import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.00008 1.33337H8.00008V10.6667H6.00008V1.33337Z" fill="currentColor"/>
<path d="M5.33342 4.66671H3.33341V10.6667H5.33342V4.66671Z" fill="currentColor"/>
<path d="M2.66675 6.66671H0.666748V10.6667H2.66675V6.66671Z" fill="currentColor"/>
<path d="M10.6667 3.33337H8.66675V10.6667H10.6667V3.33337Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7.00005 1.55554H9.33339V12.4444H7.00005V1.55554Z" fill="currentColor"/>
<path d="M6.22228 5.44443H3.88894V12.4444H6.22228V5.44443Z" fill="currentColor"/>
<path d="M3.11117 7.77776H0.777832V12.4444H3.11117V7.77776Z" fill="currentColor"/>
<path d="M12.4445 3.88888H10.1112V12.4444H12.4445V3.88888Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.00003 1.77783H10.6667V14.2223H8.00003V1.77783Z" fill="currentColor"/>
<path d="M7.11114 6.22228H4.44447V14.2223H7.11114V6.22228Z" fill="currentColor"/>
<path d="M3.55558 8.88894H0.888916V14.2223H3.55558V8.88894Z" fill="currentColor"/>
<path d="M14.2222 4.4445H11.5556V14.2223H14.2222V4.4445Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 2H12V16H9V2Z" fill="currentColor"/>
<path d="M8 7H5V16H8V7Z" fill="currentColor"/>
<path d="M4 10H1V16H4V10Z" fill="currentColor"/>
<path d="M16 5H13V16H16V5Z" fill="currentColor"/>` },
};

export const ChartIcon: React.FC<BaseIconProps> = ({
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

export default ChartIcon;
