import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M4.00264 3.13056H8.00259L8.00255 4.13056H4.00259L4.00264 3.13056Z" fill="currentColor"/>
<path d="M6.66923 5.19093H4.00259V6.19093H6.66923V5.19093Z" fill="currentColor"/>
<path d="M9.9821 8.66663C10.3618 8.66663 10.6692 8.3383 10.6692 7.93329L10.6691 1.39996C10.6691 0.994951 10.3617 0.666626 9.98204 0.666626H2.02076C1.64107 0.666626 1.33326 0.994951 1.33326 1.39996L1.33332 7.93329C1.33332 8.3383 1.64113 8.66663 2.02082 8.66663L3.54394 8.66663V11.3333L8.00258 8.66663H9.9821ZM7.48168 7.33511V7.33694L4.91894 8.83324L4.91894 7.33511H4.04418V7.33329L2.66918 7.33329V1.99996L9.33592 1.99996V7.33511H7.48168Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M4.66975 3.65242H9.33637L9.33632 4.81908H4.6697L4.66975 3.65242Z" fill="currentColor"/>
<path d="M7.78078 6.05619H4.6697V7.22286H7.78078V6.05619Z" fill="currentColor"/>
<path d="M11.6458 10.1112C12.0888 10.1112 12.4474 9.72812 12.4474 9.25561L12.4473 1.63339C12.4473 1.16088 12.0887 0.777832 11.6457 0.777832H2.35756C1.91459 0.777832 1.55548 1.16088 1.55548 1.63339L1.55555 9.25561C1.55555 9.72812 1.91466 10.1112 2.35763 10.1112L4.1346 10.1112V13.2223L9.33636 10.1112H11.6458ZM8.72864 8.55774V8.55986L5.73877 10.3056L5.73877 8.55774H4.71822V8.55561L3.11405 8.55561V2.33339L10.8919 2.33339V8.55774H8.72864Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M5.33687 4.17416H10.6701L10.6701 5.50749H5.33681L5.33687 4.17416Z" fill="currentColor"/>
<path d="M8.89233 6.92132H5.33681V8.25466H8.89233V6.92132Z" fill="currentColor"/>
<path d="M13.3095 11.5556C13.8157 11.5556 14.2256 11.1178 14.2256 10.5778L14.2255 1.86669C14.2255 1.32668 13.8157 0.888916 13.3094 0.888916H2.69437C2.18811 0.888916 1.7777 1.32668 1.7777 1.86669L1.77778 10.5778C1.77778 11.1178 2.18819 11.5556 2.69444 11.5556L4.72527 11.5556V15.1111L10.6701 11.5556H13.3095ZM9.97559 9.78023V9.78266L6.5586 11.7777L6.5586 9.78023H5.39226V9.77781L3.55893 9.7778V2.66669L12.4479 2.66669V9.78023H9.97559Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M6.00398 4.69589H12.0039L12.0039 6.19589H6.00392L6.00398 4.69589Z" fill="currentColor"/>
<path d="M10.0039 7.78646H6.00392V9.28646H10.0039V7.78646Z" fill="currentColor"/>
<path d="M14.9732 13C15.5427 13 16.0038 12.5075 16.0038 11.9L16.0037 2.1C16.0037 1.49249 15.5426 1 14.9731 1H3.03117C2.46164 1 1.99992 1.49249 1.99992 2.1L2.00001 11.9C2.00001 12.5075 2.46172 13 3.03125 13L5.31594 13V17L12.0039 13H14.9732ZM11.2226 11.0027V11.0055L7.37844 13.2499L7.37844 11.0027H6.0663V11L4.0038 11V3L14.0039 3V11.0027H11.2226Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const CordIcon: React.FC<BaseIconProps> = ({
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

export default CordIcon;
