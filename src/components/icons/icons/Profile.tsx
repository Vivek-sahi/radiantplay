import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.99998 4.66665C7.10455 4.66665 7.99998 3.77122 7.99998 2.66666C7.99998 1.56209 7.10455 0.666662 5.99998 0.666662C4.89542 0.666662 3.99999 1.56209 3.99999 2.66666C3.99999 3.77122 4.89542 4.66665 5.99998 4.66665Z" fill="currentColor"/>
<path d="M1.99999 9.33331C1.99999 7.12417 3.79085 5.33332 5.99998 5.33332C8.20912 5.33332 9.99997 7.12417 9.99997 9.33331V11.3333H1.99999V9.33331Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99996 5.44443C8.28862 5.44443 9.33329 4.39976 9.33329 3.1111C9.33329 1.82244 8.28862 0.777777 6.99996 0.777777C5.7113 0.777777 4.66663 1.82244 4.66663 3.1111C4.66663 4.39976 5.7113 5.44443 6.99996 5.44443Z" fill="currentColor"/>
<path d="M2.33331 10.8889C2.33331 8.31154 4.42264 6.22221 6.99996 6.22221C9.57728 6.22221 11.6666 8.31154 11.6666 10.8889V13.2222H2.33331V10.8889Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8 6.2222C9.47275 6.2222 10.6667 5.0283 10.6667 3.55554C10.6667 2.08279 9.47275 0.888883 8 0.888883C6.52724 0.888883 5.33334 2.08279 5.33334 3.55554C5.33334 5.0283 6.52724 6.2222 8 6.2222Z" fill="currentColor"/>
<path d="M2.66668 12.4444C2.66668 9.49889 5.05449 7.11109 8 7.11109C10.9455 7.11109 13.3333 9.4989 13.3333 12.4444V15.1111H2.66668V12.4444Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 7C10.6569 7 12 5.65685 12 4C12 2.34315 10.6569 1 9 1C7.34315 1 6 2.34315 6 4C6 5.65685 7.34315 7 9 7Z" fill="currentColor"/>
<path d="M3 14C3 10.6863 5.68629 8 9 8C12.3137 8 15 10.6863 15 14V17H3V14Z" fill="currentColor"/>` },
};

export const ProfileIcon: React.FC<BaseIconProps> = ({
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

export default ProfileIcon;
