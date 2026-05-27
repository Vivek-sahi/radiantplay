import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3.9933 6.53978L5.32663 5.20645V11.9998H6.65996V5.20645L7.99329 6.53978L8.93329 5.59978L5.9933 2.65979L3.05331 5.59978L3.9933 6.53978ZM10.6666 0.666433V3.33309H8.66662C8.66662 2.66642 8.00662 1.3331 5.99996 1.3331C3.9933 1.3331 3.3333 2.66642 3.3333 3.33309H1.33331V0.666433H10.6666Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M4.65886 7.62972L6.21441 6.07417V13.9997H7.76996V6.07417L9.32552 7.62972L10.4222 6.53306L6.99219 3.10307L3.5622 6.53306L4.65886 7.62972ZM12.4444 0.777483V3.88858H10.1111C10.1111 3.1108 9.34107 1.55526 6.99997 1.55526C4.65886 1.55526 3.88886 3.1108 3.88886 3.88858H1.55554V0.777483H12.4444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.32441 8.72004L7.10217 6.94228V16H8.87994V6.94228L10.6577 8.72004L11.911 7.46672L7.99106 3.54674L4.07108 7.46672L5.32441 8.72004ZM14.2221 0.888941V4.44447H11.5555C11.5555 3.55558 10.6755 1.77782 7.99994 1.77782C5.32441 1.77782 4.44441 3.55558 4.44441 4.44447H1.77776V0.888941H14.2221Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.98998 9.81003L7.98997 7.81003V18H9.98997V7.81003L11.99 9.81003L13.4 8.40003L8.98997 3.99005L4.57999 8.40003L5.98998 9.81003ZM15.9999 1.00001V5H13C13 3.99999 12.01 2.00001 8.99997 2.00001C5.98998 2.00001 4.99998 3.99999 4.99998 5H1.99999V1.00001H15.9999Z" fill="currentColor"/>` },
};

export const UploadIcon: React.FC<BaseIconProps> = ({
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

export default UploadIcon;
