import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.99977 0.00390625L3.21362 2.71044L4.14266 3.66681L5.33314 2.51035L5.33333 8.66671L6.66667 8.66665L6.66648 2.51046L7.85683 3.66681L8.78588 2.71044L5.99977 0.00390625ZM2 5.33334C2 4.96515 2.29848 4.66668 2.66667 4.66668H4.66667V6.00001H3.33333V10.6667H8.66667V6.00001H7.33333V4.66668H9.33333C9.70152 4.66668 10 4.96515 10 5.33334V11.3333C10 11.7015 9.70152 12 9.33333 12H2.66667C2.29848 12 2 11.7015 2 11.3333V5.33334Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99964 0.00463867L3.74914 3.16226L4.83303 4.27803L6.22192 2.92882L6.22214 10.1112L7.7777 10.1112L7.77747 2.92895L9.16621 4.27803L10.2501 3.16226L6.99964 0.00463867ZM2.33325 6.22232C2.33325 5.79276 2.68147 5.44454 3.11103 5.44454H5.44436V7.00009H3.88881V12.4445H10.111V7.00009H8.55547V5.44454H10.8888C11.3184 5.44454 11.6666 5.79276 11.6666 6.22232V13.2223C11.6666 13.6519 11.3184 14.0001 10.8888 14.0001H3.11103C2.68147 14.0001 2.33325 13.6519 2.33325 13.2223V6.22232Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.99977 0.00512695L4.28491 3.61384L5.52363 4.889L7.11094 3.34705L7.11119 11.5555L8.88897 11.5555L8.88872 3.3472L10.4758 4.889L11.7146 3.61384L7.99977 0.00512695ZM2.66675 7.11104C2.66675 6.62012 3.06472 6.22215 3.55564 6.22215H6.2223V7.99993H4.44453V14.2222H11.5556V7.99993H9.77786V6.22215H12.4445C12.9354 6.22215 13.3334 6.62012 13.3334 7.11104V15.111C13.3334 15.602 12.9354 15.9999 12.4445 15.9999H3.55564C3.06472 15.9999 2.66675 15.602 2.66675 15.111V7.11104Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8.99965 0.00585938L4.82043 4.06566L6.214 5.50022L7.99972 3.76553L8 13.0001L10 13L9.99972 3.76569L11.7852 5.50021L13.1788 4.06566L8.99965 0.00585938ZM3 8.00002C3 7.44773 3.44772 7.00002 4 7.00002H7V9.00002H5V16H13V9.00002H11V7.00002H14C14.5523 7.00002 15 7.44773 15 8.00002V17C15 17.5523 14.5523 18 14 18H4C3.44772 18 3 17.5523 3 17V8.00002Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ShareIcon: React.FC<BaseIconProps> = ({
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

export default ShareIcon;
