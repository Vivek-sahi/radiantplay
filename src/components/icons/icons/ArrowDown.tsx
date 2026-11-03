import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6.6571 0.666626H5.32377V8.77629L3.13324 6.58575L2.19043 7.52856L5.32377 10.6619V10.6666H5.32849L5.99517 11.3333L9.79991 7.52856L8.8571 6.58575L6.6571 8.78575V0.666626Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M7.76678 0.77771H6.21123V10.239L3.65561 7.68336L2.55566 8.7833L6.21123 12.4389V12.4444H6.21674L6.99452 13.2222L11.4334 8.7833L10.3334 7.68336L7.76678 10.25V0.77771Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.87622 0.888916H7.09844V11.7018L4.17773 8.78109L2.92065 10.0382L7.09844 14.216V14.2222H7.10474L7.99364 15.1111L13.0666 10.0382L11.8095 8.78109L8.87622 11.7144V0.888916Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9.98566 1H7.98566V13.1645L4.69986 9.87869L3.28564 11.2929L7.98566 15.9929V16H7.99274L8.99275 17L14.6999 11.2929L13.2856 9.87869L9.98566 13.1787V1Z" fill="currentColor"/>` },
};

export const ArrowDownIcon: React.FC<BaseIconProps> = ({
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

export default ArrowDownIcon;
