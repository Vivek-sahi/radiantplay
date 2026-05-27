import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6666 9.99997C10.6666 5.21351 6.78645 1.33332 1.99999 1.33332V2.66665C6.05007 2.66665 9.33331 5.94989 9.33331 9.99997H10.6666Z" fill="currentColor"/>
<path d="M8.66664 9.99997C8.66664 6.31808 5.68188 3.33332 1.99999 3.33332V4.66665C4.94551 4.66665 7.33331 7.05446 7.33331 9.99997H8.66664Z" fill="currentColor"/>
<path d="M6.66665 9.99997C6.66665 7.42265 4.57732 5.33331 1.99999 5.33331V6.66664C3.84094 6.66664 5.33332 8.15902 5.33332 9.99997H6.66665Z" fill="currentColor"/>
<path d="M4.66665 9.99997C4.66665 8.52721 3.47275 7.33331 1.99999 7.33331V9.99997H4.66665Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4444 11.6666C12.4444 6.08244 7.91751 1.55555 2.33332 1.55555V3.1111C7.05841 3.1111 10.8888 6.94154 10.8888 11.6666H12.4444Z" fill="currentColor"/>
<path d="M10.1111 11.6666C10.1111 7.3711 6.62885 3.88888 2.33332 3.88888V5.44443C5.76975 5.44443 8.55552 8.2302 8.55552 11.6666H10.1111Z" fill="currentColor"/>
<path d="M7.77775 11.6666C7.77775 8.65976 5.34019 6.2222 2.33332 6.2222V7.77775C4.48109 7.77775 6.2222 9.51886 6.2222 11.6666H7.77775Z" fill="currentColor"/>
<path d="M5.44442 11.6666C5.44442 9.94842 4.05153 8.55553 2.33332 8.55553V11.6666H5.44442Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2222 13.3333C14.2222 6.95135 9.0486 1.77777 2.66666 1.77777V3.55554C8.06677 3.55554 12.4444 7.93319 12.4444 13.3333H14.2222Z" fill="currentColor"/>
<path d="M11.5555 13.3333C11.5555 8.4241 7.57585 4.44443 2.66666 4.44443V6.2222C6.59401 6.2222 9.77775 9.40594 9.77775 13.3333H11.5555Z" fill="currentColor"/>
<path d="M8.88887 13.3333C8.88887 9.89686 6.10309 7.11108 2.66666 7.11108V8.88886C5.12126 8.88886 7.1111 10.8787 7.1111 13.3333H8.88887Z" fill="currentColor"/>
<path d="M6.22221 13.3333C6.22221 11.3696 4.63034 9.77774 2.66666 9.77774V13.3333H6.22221Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M16 15C16 7.8203 10.1797 2 3 2V4C9.07513 4 14 8.92487 14 15H16Z" fill="currentColor"/>
<path d="M13 15C13 9.47715 8.52285 5 3 5V7C7.41828 7 11 10.5817 11 15H13Z" fill="currentColor"/>
<path d="M10 15C10 11.134 6.86599 8 3 8V10C5.76142 10 8 12.2386 8 15H10Z" fill="currentColor"/>
<path d="M7 15C7 12.7909 5.20914 11 3 11V15H7Z" fill="currentColor"/>` },
};

export const FollowIcon: React.FC<BaseIconProps> = ({
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

export default FollowIcon;
