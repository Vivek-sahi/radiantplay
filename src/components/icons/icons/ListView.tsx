import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.666626 3.33333H11.3333V2H0.666626V3.33333Z" fill="currentColor"/>
<path d="M0.666626 5.5H11.3333V4.16667H0.666626V5.5Z" fill="currentColor"/>
<path d="M11.3333 7.66667H0.666626V6.33333H11.3333V7.66667Z" fill="currentColor"/>
<path d="M0.666626 10H11.3333V8.66667H0.666626V10Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.777832 3.88893H13.2223V2.33337H0.777832V3.88893Z" fill="currentColor"/>
<path d="M0.777832 6.41671H13.2223V4.86115H0.777832V6.41671Z" fill="currentColor"/>
<path d="M13.2223 8.94449H0.777832V7.38893H13.2223V8.94449Z" fill="currentColor"/>
<path d="M0.777832 11.6667H13.2223V10.1112H0.777832V11.6667Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.888916 4.4444H15.1111V2.66663H0.888916V4.4444Z" fill="currentColor"/>
<path d="M0.888916 7.33329H15.1111V5.55551H0.888916V7.33329Z" fill="currentColor"/>
<path d="M15.1111 10.2222H0.888916V8.4444H15.1111V10.2222Z" fill="currentColor"/>
<path d="M0.888916 13.3333H15.1111V11.5555H0.888916V13.3333Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M1 5H17V3H1V5Z" fill="currentColor"/>
<path d="M1 8.25H17V6.25H1V8.25Z" fill="currentColor"/>
<path d="M17 11.5H1V9.5H17V11.5Z" fill="currentColor"/>
<path d="M1 15H17V13H1V15Z" fill="currentColor"/>` },
};

export const ListViewIcon: React.FC<BaseIconProps> = ({
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

export default ListViewIcon;
