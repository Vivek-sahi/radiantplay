import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.89949 1.13807C9.63914 0.87772 9.21703 0.87772 8.95668 1.13807L8.48528 1.60947L10.3709 3.49509L10.8423 3.02368C11.1026 2.76333 11.1026 2.34122 10.8423 2.08088L9.89949 1.13807Z" fill="currentColor"/>
<path d="M9.89949 3.96649L8.01388 2.08088L2.0809 8.01386L1.60949 10.3709L3.96651 9.89947L9.89949 3.96649Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.5493 1.32775C11.2456 1.02401 10.7531 1.02401 10.4494 1.32775L9.89943 1.87772L12.0993 4.0776L12.6493 3.52763C12.953 3.22389 12.953 2.73143 12.6493 2.42769L11.5493 1.32775Z" fill="currentColor"/>
<path d="M11.5493 4.62757L9.34946 2.42769L2.42765 9.34949L1.87768 12.0993L4.62753 11.5494L11.5493 4.62757Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.1992 1.51742C12.8521 1.17029 12.2892 1.17029 11.9421 1.51742L11.3136 2.14596L13.8277 4.66011L14.4563 4.03157C14.8034 3.68444 14.8034 3.12163 14.4563 2.7745L13.1992 1.51742Z" fill="currentColor"/>
<path d="M13.1992 5.28865L10.685 2.7745L2.7744 10.6851L2.14587 13.8278L5.28855 13.1993L13.1992 5.28865Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14.8492 1.70711C14.4587 1.31658 13.8255 1.31658 13.435 1.70711L12.7279 2.41422L15.5563 5.24264L16.2634 4.53554C16.6539 4.14501 16.6539 3.51185 16.2634 3.12132L14.8492 1.70711Z" fill="currentColor"/>
<path d="M14.8492 5.94975L12.0208 3.12132L3.12129 12.0208L2.41418 15.5563L5.94972 14.8492L14.8492 5.94975Z" fill="currentColor"/>` },
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
