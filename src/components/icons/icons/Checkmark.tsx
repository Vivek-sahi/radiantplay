import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M10.6094 3.60944L5.13803 9.08084L1.66663 5.60944L2.60944 4.66663L5.13803 7.19522L9.66663 2.66663L10.6094 3.60944Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M12.3777 4.21103L5.99443 10.5943L1.94446 6.54436L3.0444 5.44442L5.99443 8.39445L11.2778 3.11108L12.3777 4.21103Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M14.1459 4.81262L6.85071 12.1078L2.22217 7.47929L3.47925 6.22221L6.85071 9.59367L12.8888 3.55554L14.1459 4.81262Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M15.9142 5.41421L7.70711 13.6213L2.5 8.41421L3.91421 7L7.70711 10.7929L14.5 4L15.9142 5.41421Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const CheckmarkIcon: React.FC<BaseIconProps> = ({
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

export default CheckmarkIcon;
