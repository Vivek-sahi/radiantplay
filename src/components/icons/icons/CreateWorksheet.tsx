import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.99976 0.666656C1.26308 0.666656 0.666656 1.26391 0.666656 1.99999V9.99999C0.666656 10.7364 1.26361 11.3333 1.99999 11.3333H9.99999C10.7364 11.3333 11.3333 10.7364 11.3333 9.99999V5.33332H5.99999V0.666656H1.99976ZM4.66666 5.33332V1.99999H1.99976L1.99986 5.33332H4.66666ZM1.99989 6.66666H4.66666V9.99999H1.99999L1.99989 6.66666ZM5.99999 6.66666H9.99999V9.99999H5.99999V6.66666Z" fill="currentColor"/>
<path d="M8.66666 0.666656H9.99999V1.99999H11.3333V3.33332H9.99999V4.66666H8.66666V3.33332H7.33332V1.99999H8.66666V0.666656Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.33306 0.777771C1.4736 0.777771 0.777771 1.47457 0.777771 2.33333V11.6667C0.777771 12.5258 1.47422 13.2222 2.33333 13.2222H11.6667C12.5258 13.2222 13.2222 12.5258 13.2222 11.6667V6.22222H6.99999V0.777771H2.33306ZM5.44444 6.22222V2.33333H2.33306L2.33317 6.22222H5.44444ZM2.33321 7.77777H5.44444V11.6667H2.33333L2.33321 7.77777ZM6.99999 7.77777H11.6667V11.6667H6.99999V7.77777Z" fill="currentColor"/>
<path d="M10.1111 0.777771H11.6667V2.33333H13.2222V3.88888H11.6667V5.44444H10.1111V3.88888H8.55555V2.33333H10.1111V0.777771Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.66636 0.888885C1.68412 0.888885 0.888885 1.68522 0.888885 2.66666V13.3333C0.888885 14.3152 1.68482 15.1111 2.66666 15.1111H13.3333C14.3152 15.1111 15.1111 14.3152 15.1111 13.3333V7.11111H8V0.888885H2.66636ZM6.22222 7.11111V2.66666H2.66636L2.66648 7.11111H6.22222ZM2.66654 8.88889H6.22222V13.3333H2.66666L2.66654 8.88889ZM8 8.88889H13.3333V13.3333H8V8.88889Z" fill="currentColor"/>
<path d="M11.5556 0.888885H13.3333V2.66666H15.1111V4.44444H13.3333V6.22222H11.5556V4.44444H9.77777V2.66666H11.5556V0.888885Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.99965 1C1.89464 1 1 1.89588 1 3V15C1 16.1046 1.89543 17 3 17H15C16.1046 17 17 16.1046 17 15V8H9V1H2.99965ZM7 8V3H2.99965L2.9998 8H7ZM2.99986 10H7V15H3L2.99986 10ZM9 10H15V15H9V10Z" fill="currentColor"/>
<path d="M13 1H15V3H17V5H15V7H13V5H11V3H13V1Z" fill="currentColor"/>` },
};

export const CreateWorksheetIcon: React.FC<BaseIconProps> = ({
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

export default CreateWorksheetIcon;
