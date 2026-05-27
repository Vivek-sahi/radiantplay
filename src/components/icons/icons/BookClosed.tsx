import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.33334 2.19047V9.99999H3.66668C3.32305 9.99999 2.8889 10.0476 2.8889 9.66666C2.8889 9.2857 3.32305 9.33332 3.66668 9.33332H8.66668V0.666656H2.57779C1.89054 0.666656 1.33334 1.26366 1.33334 1.99999V9.99999C1.33334 10.7363 1.89054 11.3333 2.57779 11.3333H10.6667V2.19047H9.33334Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M10.8889 2.55555V11.6667H4.27778C3.87689 11.6667 3.37037 11.7222 3.37037 11.2778C3.37037 10.8333 3.87689 10.8889 4.27778 10.8889H10.1111V0.777771H3.00741C2.20562 0.777771 1.55556 1.47427 1.55556 2.33333V11.6667C1.55556 12.5257 2.20562 13.2222 3.00741 13.2222H12.4444V2.55555H10.8889Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M12.4444 2.92063V13.3333H4.88888C4.43072 13.3333 3.85185 13.3968 3.85185 12.8889C3.85185 12.3809 4.43072 12.4444 4.88888 12.4444H11.5555V0.888885H3.43703C2.5207 0.888885 1.77777 1.68489 1.77777 2.66666V13.3333C1.77777 14.3151 2.5207 15.1111 3.43703 15.1111H14.2222V2.92063H12.4444Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14 3.28571V15H5.5C4.98457 15 4.33333 15.0714 4.33333 14.5C4.33333 13.9286 4.98457 14 5.5 14H13V1H3.86667C2.8358 1 2 1.8955 2 3V15C2 16.1045 2.8358 17 3.86667 17H16V3.28571H14Z" fill="currentColor"/>` },
};

export const BookClosedIcon: React.FC<BaseIconProps> = ({
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

export default BookClosedIcon;
