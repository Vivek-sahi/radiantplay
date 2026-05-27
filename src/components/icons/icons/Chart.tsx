import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.00002 1.33331H8.00002V10.6666H6.00002V1.33331Z" fill="currentColor"/>
<path d="M5.33335 4.66665H3.33335V10.6666H5.33335V4.66665Z" fill="currentColor"/>
<path d="M2.66669 6.66665H0.666687V10.6666H2.66669V6.66665Z" fill="currentColor"/>
<path d="M10.6667 3.33331H8.66669V10.6666H10.6667V3.33331Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99999 1.55554H9.33333V12.4444H6.99999V1.55554Z" fill="currentColor"/>
<path d="M6.22222 5.44443H3.88888V12.4444H6.22222V5.44443Z" fill="currentColor"/>
<path d="M3.1111 7.77776H0.777771V12.4444H3.1111V7.77776Z" fill="currentColor"/>
<path d="M12.4444 3.88888H10.1111V12.4444H12.4444V3.88888Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.00003 1.77777H10.6667V14.2222H8.00003V1.77777Z" fill="currentColor"/>
<path d="M7.11114 6.22222H4.44447V14.2222H7.11114V6.22222Z" fill="currentColor"/>
<path d="M3.55558 8.88888H0.888916V14.2222H3.55558V8.88888Z" fill="currentColor"/>
<path d="M14.2222 4.44444H11.5556V14.2222H14.2222V4.44444Z" fill="currentColor"/>` },
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
