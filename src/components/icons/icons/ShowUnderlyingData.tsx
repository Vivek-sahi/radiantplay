import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 13 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M9.70988 7.25675L12.2778 8.65718L6.5 12.2219L0.722223 8.65718L3.29012 7.25675L6.5 9.16642L9.70988 7.25675ZM6.50732 1.52773L12.2778 4.20128L6.52197 7.766L0.722223 4.20128L6.50732 1.52773Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M11.0139 8.23131L13.9266 9.81981L7.37293 13.8633L0.819215 9.81981L3.73198 8.23131L7.37293 10.3974L11.0139 8.23131ZM7.38124 1.7329L13.9266 4.76549L7.39785 8.80894L0.819215 4.76549L7.38124 1.7329Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 17 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12.6975 9.4896L16.0556 11.3209L8.5 15.9825L0.944445 11.3209L4.30247 9.4896L8.5 11.9869L12.6975 9.4896ZM8.50958 1.99781L16.0556 5.49398L8.52873 10.1555L0.944445 5.49398L8.50958 1.99781Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M13.4444 9.5L17 11.3333L9 16L1 11.3333L4.55556 9.5L9 12L13.4444 9.5ZM9.01014 2L17 5.5L9.03042 10.1667L1 5.5L9.01014 2Z" fill="currentColor"/>` },
};

export const ShowUnderlyingDataIcon: React.FC<BaseIconProps> = ({
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

export default ShowUnderlyingDataIcon;
