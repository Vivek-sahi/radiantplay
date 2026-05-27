import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M0.661865 5.33806V6.67139H8.77153L6.58099 8.86193L7.5238 9.80473L10.6571 6.67139H10.6619V6.66667L11.3285 6L7.5238 2.19526L6.58099 3.13807L8.78099 5.33806H0.661865Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M0.772186 6.22774V7.78329H10.2335L7.67784 10.3389L8.77778 11.4389L12.4333 7.78329H12.4389V7.77778L13.2166 7L8.77778 2.56113L7.67784 3.66108L10.2445 6.22774H0.772186Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M0.882523 7.11741V8.89519H11.6954L8.77469 11.8159L10.0318 13.073L14.2096 8.89519H14.2159V8.88889L15.1048 7.99999L10.0318 2.92701L8.77469 4.18409L11.708 7.11741H0.882523Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M0.992844 8.00709V10.0071H13.1573L9.87154 13.2929L11.2857 14.7071L15.9858 10.0071H15.9928V10L16.9929 8.99999L11.2857 3.29288L9.87154 4.7071L13.1715 8.00709H0.992844Z" fill="currentColor"/>` },
};

export const ArrowRightIcon: React.FC<BaseIconProps> = ({
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

export default ArrowRightIcon;
