import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.33325 2.19044V9.99996H3.66659C3.32296 9.99996 2.88881 10.0476 2.88881 9.66663C2.88881 9.28567 3.32296 9.33329 3.66659 9.33329H8.66659V0.666626H2.5777C1.89045 0.666626 1.33325 1.26363 1.33325 1.99996V9.99996C1.33325 10.7363 1.89045 11.3333 2.5777 11.3333H10.6666V2.19044H9.33325Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M10.889 2.55561V11.6667H4.27789C3.87699 11.6667 3.37048 11.7223 3.37048 11.2778C3.37048 10.8334 3.87699 10.8889 4.27789 10.8889H10.1112V0.777832H3.00752C2.20573 0.777832 1.55566 1.47433 1.55566 2.33339V11.6667C1.55566 12.5258 2.20573 13.2223 3.00752 13.2223H12.4446V2.55561H10.889Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M12.4445 2.92066V13.3334H4.88894C4.43078 13.3334 3.85191 13.3969 3.85191 12.8889C3.85191 12.381 4.43078 12.4445 4.88894 12.4445H11.5556V0.888916H3.43709C2.52077 0.888916 1.77783 1.68492 1.77783 2.66669V13.3334C1.77783 14.3151 2.52077 15.1111 3.43709 15.1111H14.2223V2.92066H12.4445Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M14 3.28571V15H5.5C4.98457 15 4.33333 15.0714 4.33333 14.5C4.33333 13.9286 4.98457 14 5.5 14H13V1H3.86667C2.8358 1 2 1.8955 2 3V15C2 16.1045 2.8358 17 3.86667 17H16V3.28571H14Z" fill="currentColor"/>` },
};

export const BookClosedIcon: React.FC<BaseIconProps> = ({
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

export default BookClosedIcon;
