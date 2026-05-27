import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.19526 2.86194L4.13807 3.80475L2.60947 5.33334H9.39052L7.86193 3.80475L8.80474 2.86194L11.9428 6.00001L8.80474 9.13808L7.86193 8.19527L9.39052 6.66668H2.60947L4.13807 8.19527L3.19526 9.13808L0.0571899 6.00001L3.19526 2.86194Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.72786 3.33893L4.8278 4.43887L3.04444 6.22223H10.9557L9.1723 4.43887L10.2722 3.33893L13.9333 7.00001L10.2722 10.6611L9.1723 9.56115L10.9557 7.77779H3.04444L4.8278 9.56115L3.72786 10.6611L0.0667725 7.00001L3.72786 3.33893Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.26039 3.81592L5.51747 5.073L3.47934 7.11112H12.5207L10.4826 5.073L11.7397 3.81592L15.9238 8.00001L11.7397 12.1841L10.4826 10.927L12.5207 8.8889H3.47934L5.51747 10.927L4.26039 12.1841L0.0762939 8.00001L4.26039 3.81592Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.79292 4.29291L6.20714 5.70712L3.91424 8.00001H14.0858L11.7929 5.70712L13.2071 4.29291L17.9142 9.00001L13.2071 13.7071L11.7929 12.2929L14.0858 10H3.91424L6.20714 12.2929L4.79292 13.7071L0.0858154 9.00001L4.79292 4.29291Z" fill="currentColor"/>` },
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
