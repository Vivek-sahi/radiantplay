import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M3.1952 2.86182L4.13801 3.80463L2.60941 5.33322H9.39046L7.86187 3.80463L8.80468 2.86182L11.9427 5.99989L8.80468 9.13796L7.86187 8.19515L9.39046 6.66655H2.60941L4.13801 8.19515L3.1952 9.13796L0.0571289 5.99989L3.1952 2.86182Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.72773 3.33887L4.82768 4.43881L3.04432 6.22217H10.9555L9.17218 4.43881L10.2721 3.33887L13.9332 6.99995L10.2721 10.661L9.17218 9.56109L10.9555 7.77773H3.04432L4.82768 9.56109L3.72773 10.661L0.0666504 6.99995L3.72773 3.33887Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M4.26027 3.81592L5.51735 5.073L3.47922 7.11112H12.5206L10.4825 5.073L11.7396 3.81592L15.9237 8.00001L11.7396 12.1841L10.4825 10.927L12.5206 8.8889H3.47922L5.51735 10.927L4.26027 12.1841L0.0761719 8.00001L4.26027 3.81592Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4.79304 4.29297L6.20726 5.70718L3.91436 8.00008H14.0859L11.793 5.70718L13.2073 4.29297L17.9144 9.00008L13.2073 13.7072L11.793 12.293L14.0859 10.0001H3.91436L6.20726 12.293L4.79304 13.7072L0.0859375 9.00008L4.79304 4.29297Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const FullscreenIcon: React.FC<BaseIconProps> = ({
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

export default FullscreenIcon;
