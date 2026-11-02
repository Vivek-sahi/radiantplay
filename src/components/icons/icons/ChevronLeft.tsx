import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.13799 2.09766L8.0808 3.04047L5.21887 5.90239L8.0808 8.76432L7.13799 9.70713L3.33325 5.90239L7.13799 2.09766Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.32778 2.44727L9.42772 3.54721L6.0888 6.88613L9.42772 10.225L8.32778 11.325L3.88892 6.88613L8.32778 2.44727Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M9.51756 2.79688L10.7746 4.05395L6.95874 7.86986L10.7746 11.6858L9.51756 12.9428L4.44458 7.86986L9.51756 2.79688Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M10.7071 3.14648L12.1213 4.5607L7.82843 8.85359L12.1213 13.1465L10.7071 14.5607L5 8.85359L10.7071 3.14648Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ChevronLeftIcon: React.FC<BaseIconProps> = ({
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

export default ChevronLeftIcon;
