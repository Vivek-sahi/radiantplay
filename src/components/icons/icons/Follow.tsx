import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6667 10C10.6667 5.21357 6.78647 1.33337 2 1.33337V2.66671C6.05009 2.66671 9.33333 5.94995 9.33333 10H10.6667Z" fill="currentColor"/>
<path d="M8.66667 10C8.66667 6.31814 5.6819 3.33337 2 3.33337V4.66671C4.94552 4.66671 7.33333 7.05452 7.33333 10H8.66667Z" fill="currentColor"/>
<path d="M6.66667 10C6.66667 7.42271 4.57733 5.33337 2 5.33337V6.66671C3.84095 6.66671 5.33333 8.15909 5.33333 10H6.66667Z" fill="currentColor"/>
<path d="M4.66667 10C4.66667 8.52728 3.47276 7.33337 2 7.33337V10H4.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.4444 11.6667C12.4444 6.08244 7.91746 1.55554 2.33325 1.55554V3.1111C7.05835 3.1111 10.8888 6.94155 10.8888 11.6667H12.4444Z" fill="currentColor"/>
<path d="M10.111 11.6667C10.111 7.3711 6.6288 3.88888 2.33325 3.88888V5.44443C5.76969 5.44443 8.55547 8.23021 8.55547 11.6667H10.111Z" fill="currentColor"/>
<path d="M7.7777 11.6667C7.7777 8.65977 5.34014 6.22221 2.33325 6.22221V7.77776C4.48103 7.77776 6.22214 9.51888 6.22214 11.6667H7.7777Z" fill="currentColor"/>
<path d="M5.44436 11.6667C5.44436 9.94843 4.05147 8.55554 2.33325 8.55554V11.6667H5.44436Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.2223 13.3334C14.2223 6.95143 9.0487 1.77783 2.66675 1.77783V3.55561C8.06687 3.55561 12.4445 7.93327 12.4445 13.3334H14.2223Z" fill="currentColor"/>
<path d="M11.5556 13.3334C11.5556 8.42419 7.57594 4.4445 2.66675 4.4445V6.22228C6.59411 6.22228 9.77786 9.40603 9.77786 13.3334H11.5556Z" fill="currentColor"/>
<path d="M8.88897 13.3334C8.88897 9.89695 6.10319 7.11117 2.66675 7.11117V8.88894C5.12135 8.88894 7.11119 10.8788 7.11119 13.3334H8.88897Z" fill="currentColor"/>
<path d="M6.2223 13.3334C6.2223 11.3697 4.63043 9.77783 2.66675 9.77783V13.3334H6.2223Z" fill="currentColor"/>` },
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
