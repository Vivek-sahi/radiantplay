import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M1.99976 10H0.666748V2H1.99976V10ZM11.3337 10H9.99976V2H11.3337V10ZM8.66675 6.66699H3.33374V5.33301H8.66675V6.66699Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.3335 11.6663H0.777832V2.33325H2.3335V11.6663ZM13.2222 11.6663H11.6665V2.33325H13.2222V11.6663ZM10.1108 7.77759H3.88916V6.22192H10.1108V7.77759Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66626 13.3337H0.888916V2.66675H2.66626V13.3337ZM15.1116 13.3337H13.3333V2.66675H15.1116V13.3337ZM11.5559 8.8894H4.44458V7.11108H11.5559V8.8894Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M3 15H1V3H3V15ZM17 15H15V3H17V15ZM13 10H5V8H13V10Z" fill="currentColor"/>` },
};

export const FullscreenUndoIcon: React.FC<BaseIconProps> = ({
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

export default FullscreenUndoIcon;
