import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M10.6094 3.60947L5.13803 9.08087L1.66663 5.60947L2.60944 4.66666L5.13803 7.19525L9.66663 2.66666L10.6094 3.60947Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12.3777 4.21106L5.99443 10.5944L1.94446 6.54439L3.0444 5.44445L5.99443 8.39448L11.2778 3.11111L12.3777 4.21106Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M14.1459 4.81262L6.85071 12.1078L2.22217 7.47929L3.47925 6.22221L6.85071 9.59367L12.8888 3.55554L14.1459 4.81262Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M15.9142 5.41421L7.70711 13.6213L2.5 8.41421L3.91421 7L7.70711 10.7929L14.5 4L15.9142 5.41421Z" fill="currentColor"/>` },
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
