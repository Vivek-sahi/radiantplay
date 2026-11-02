import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M1.99985 0.666626C1.26317 0.666626 0.666748 1.26388 0.666748 1.99996V9.99996C0.666748 10.7363 1.2637 11.3333 2.00008 11.3333H10.0001C10.7365 11.3333 11.3334 10.7363 11.3334 9.99996V5.33329H6.00008V0.666626H1.99985ZM4.66675 5.33329V1.99996H1.99985L1.99995 5.33329H4.66675ZM1.99999 6.66663H4.66675V9.99996H2.00008L1.99999 6.66663ZM6.00008 6.66663H10.0001V9.99996H6.00008V6.66663Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M8.66675 0.666626H10.0001V1.99996H11.3334V3.33329H10.0001V4.66663H8.66675V3.33329H7.33341V1.99996H8.66675V0.666626Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M2.33312 0.777832C1.47366 0.777832 0.777832 1.47463 0.777832 2.33339V11.6667C0.777832 12.5258 1.47428 13.2223 2.33339 13.2223H11.6667C12.5258 13.2223 13.2223 12.5258 13.2223 11.6667V6.22228H7.00005V0.777832H2.33312ZM5.4445 6.22228V2.33339H2.33312L2.33323 6.22228H5.4445ZM2.33328 7.77783H5.4445V11.6667H2.33339L2.33328 7.77783ZM7.00005 7.77783H11.6667V11.6667H7.00005V7.77783Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M10.1112 0.777832H11.6667V2.33339H13.2223V3.88894H11.6667V5.4445H10.1112V3.88894H8.55561V2.33339H10.1112V0.777832Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M2.66639 0.888916C1.68415 0.888916 0.888916 1.68525 0.888916 2.66669V13.3334C0.888916 14.3152 1.68485 15.1111 2.66669 15.1111H13.3334C14.3152 15.1111 15.1111 14.3152 15.1111 13.3334V7.11114H8.00003V0.888916H2.66639ZM6.22225 7.11114V2.66669H2.66639L2.66651 7.11114H6.22225ZM2.66657 8.88892H6.22225V13.3334H2.66669L2.66657 8.88892ZM8.00003 8.88892H13.3334V13.3334H8.00003V8.88892Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
<path d="M11.5556 0.888916H13.3334V2.66669H15.1111V4.44447H13.3334V6.22225H11.5556V4.44447H9.7778V2.66669H11.5556V0.888916Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M2.99965 1C1.89464 1 1 1.89588 1 3V15C1 16.1046 1.89543 17 3 17H15C16.1046 17 17 16.1046 17 15V8H9V1H2.99965ZM7 8V3H2.99965L2.9998 8H7ZM2.99986 10H7V15H3L2.99986 10ZM9 10H15V15H9V10Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>
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
