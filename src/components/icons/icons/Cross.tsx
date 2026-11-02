import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M3.17157 2.22876L2.22876 3.17157L5.05719 6L2.22876 8.82842L3.17157 9.77123L6 6.9428L8.82842 9.77123L9.77123 8.82842L6.9428 6L9.77123 3.17157L8.82842 2.22876L6 5.05719L3.17157 2.22876Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M3.70029 2.60022L2.60034 3.70016L5.90017 7L2.60034 10.2998L3.70029 11.3998L7.00012 8.09994L10.2999 11.3998L11.3999 10.2998L8.10006 7L11.3999 3.70016L10.2999 2.60022L7.00012 5.90005L3.70029 2.60022Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M4.22876 2.97168L2.97168 4.22876L6.74292 7.99999L2.97168 11.7712L4.22876 13.0283L7.99999 9.25707L11.7712 13.0283L13.0283 11.7712L9.25707 7.99999L13.0283 4.22876L11.7712 2.97168L7.99999 6.74292L4.22876 2.97168Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M4.75748 3.34314L3.34326 4.75735L7.5859 8.99999L3.34326 13.2426L4.75748 14.6568L9.00012 10.4142L13.2428 14.6568L14.657 13.2426L10.4143 8.99999L14.657 4.75735L13.2428 3.34314L9.00012 7.58578L4.75748 3.34314Z" fill="currentColor"/>` },
};

export const CrossIcon: React.FC<BaseIconProps> = ({
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

export default CrossIcon;
