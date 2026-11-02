import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 8.66675C4.52724 8.66675 3.33333 7.47284 3.33333 6.00008H2C2 7.98208 3.44152 9.62739 5.33333 9.94478V10.6667H4V12.0001H8V10.6667H6.66667V9.94478C8.55848 9.62739 10 7.98208 10 6.00008H8.66667C8.66667 7.47284 7.47276 8.66675 6 8.66675ZM6 0.666748C4.89543 0.666748 4 1.56218 4 2.66675V6.00008C4 7.10465 4.89543 8.00008 6 8.00008C7.10457 8.00008 8 7.10465 8 6.00008V2.66675C8 1.56218 7.10457 0.666748 6 0.666748Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99992 10.1112C5.2817 10.1112 3.88881 8.71827 3.88881 7.00005H2.33325C2.33325 9.31238 4.01503 11.2319 6.22214 11.6022V12.4445H4.66658V14.0001H9.33325V12.4445H7.7777V11.6022C9.98481 11.2319 11.6666 9.31238 11.6666 7.00005H10.111C10.111 8.71827 8.71814 10.1112 6.99992 10.1112ZM6.99992 0.777832C5.71125 0.777832 4.66658 1.8225 4.66658 3.11117V7.00005C4.66658 8.28872 5.71125 9.33339 6.99992 9.33339C8.28858 9.33339 9.33325 8.28872 9.33325 7.00005V3.11117C9.33325 1.8225 8.28858 0.777832 6.99992 0.777832Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.00008 11.5556C6.0364 11.5556 4.44453 9.96371 4.44453 8.00003H2.66675C2.66675 10.6427 4.58878 12.8364 7.11119 13.2596V14.2222H5.33341V16H10.6667V14.2222H8.88897V13.2596C11.4114 12.8364 13.3334 10.6427 13.3334 8.00003H11.5556C11.5556 9.96371 9.96376 11.5556 8.00008 11.5556ZM8.00008 0.888916C6.52732 0.888916 5.33341 2.08282 5.33341 3.55558V8.00003C5.33341 9.47279 6.52732 10.6667 8.00008 10.6667C9.47284 10.6667 10.6667 9.47279 10.6667 8.00003V3.55558C10.6667 2.08282 9.47284 0.888916 8.00008 0.888916Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 13C6.79086 13 5 11.2091 5 9H3C3 11.973 5.16229 14.441 8 14.917V16H6V18H12V16H10V14.917C12.8377 14.441 15 11.973 15 9H13C13 11.2091 11.2091 13 9 13ZM9 1C7.34315 1 6 2.34315 6 4V9C6 10.6569 7.34315 12 9 12C10.6569 12 12 10.6569 12 9V4C12 2.34315 10.6569 1 9 1Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const MicrophoneIcon: React.FC<BaseIconProps> = ({
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

export default MicrophoneIcon;
