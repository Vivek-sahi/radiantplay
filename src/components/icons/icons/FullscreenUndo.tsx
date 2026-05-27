import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M1.99969 10H0.666687V2H1.99969V10ZM11.3337 10H9.99969V2H11.3337V10ZM8.66669 6.66699H3.33368V5.33301H8.66669V6.66699Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33344 11.6663H0.777771V2.33334H2.33344V11.6663ZM13.2221 11.6663H11.6664V2.33334H13.2221V11.6663ZM10.1108 7.77767H3.8891V6.22201H10.1108V7.77767Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66623 13.3337H0.888885V2.66666H2.66623V13.3337ZM15.1115 13.3337H13.3332V2.66666H15.1115V13.3337ZM11.5559 8.88932H4.44455V7.111H11.5559V8.88932Z" fill="currentColor"/>` },
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
