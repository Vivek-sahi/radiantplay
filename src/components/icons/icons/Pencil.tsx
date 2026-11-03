import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.89946 1.13807C9.63912 0.877718 9.21701 0.877718 8.95666 1.13807L8.48526 1.60947L10.3709 3.49508L10.8423 3.02367C11.1026 2.76333 11.1026 2.34122 10.8423 2.08087L9.89946 1.13807Z" fill="currentColor"/>
<path d="M9.89946 3.96648L8.01386 2.08087L2.08089 8.01384L1.60949 10.3708L3.9665 9.89944L9.89946 3.96648Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.5493 1.32771C11.2456 1.02397 10.7531 1.02397 10.4494 1.32771L9.89941 1.87768L12.0993 4.07756L12.6493 3.52759C12.953 3.22385 12.953 2.73139 12.6493 2.42765L11.5493 1.32771Z" fill="currentColor"/>
<path d="M11.5493 4.62753L9.34945 2.42765L2.42765 9.34945L1.87768 12.0993L4.62752 11.5493L11.5493 4.62753Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.1992 1.51742C12.852 1.17029 12.2892 1.17029 11.9421 1.51742L11.3136 2.14596L13.8277 4.66011L14.4563 4.03157C14.8034 3.68444 14.8034 3.12163 14.4563 2.7745L13.1992 1.51742Z" fill="currentColor"/>
<path d="M13.1992 5.28865L10.685 2.7745L2.7744 10.6851L2.14587 13.8278L5.28855 13.1993L13.1992 5.28865Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14.8492 1.70708C14.4587 1.31655 13.8255 1.31655 13.435 1.70708L12.7279 2.41418L15.5563 5.24261L16.2634 4.5355C16.6539 4.14498 16.6539 3.51182 16.2634 3.12129L14.8492 1.70708Z" fill="currentColor"/>
<path d="M14.8492 5.94972L12.0208 3.12129L3.12129 12.0208L2.41418 15.5563L5.94972 14.8492L14.8492 5.94972Z" fill="currentColor"/>` },
};

export const PencilIcon: React.FC<BaseIconProps> = ({
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

export default PencilIcon;
