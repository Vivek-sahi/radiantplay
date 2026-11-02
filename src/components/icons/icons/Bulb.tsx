import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M7.33333 8.43902C8.88692 7.88991 10 6.40825 10 4.66663C10 2.45749 8.20914 0.666626 6 0.666626C3.79086 0.666626 2 2.45749 2 4.66663C2 6.40825 3.11307 7.8899 4.66666 8.43902V9.33329H7.33333V8.43902Z" fill="currentColor"/>
<path d="M4.66666 9.99996H7.33333V10.6666H4.66666V9.99996Z" fill="currentColor"/>
<path d="M6.66667 12L7.33333 11.3333H4.66667L5.33333 12H6.66667Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M8.55547 9.84562C10.368 9.20499 11.6666 7.4764 11.6666 5.4445C11.6666 2.86717 9.57725 0.777832 6.99992 0.777832C4.42259 0.777832 2.33325 2.86717 2.33325 5.4445C2.33325 7.47639 3.63184 9.20498 5.44436 9.84562V10.8889H8.55547V9.84562Z" fill="currentColor"/>
<path d="M5.44436 11.6667H8.55547V12.4445H5.44436V11.6667Z" fill="currentColor"/>
<path d="M7.7777 14.0001L8.55547 13.2223H5.44436L6.22214 14.0001H7.7777Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M9.77785 11.2521C11.8493 10.52 13.3334 8.54442 13.3334 6.22225C13.3334 3.27673 10.9456 0.888916 8.00008 0.888916C5.05456 0.888916 2.66675 3.27673 2.66675 6.22225C2.66675 8.54441 4.15085 10.5199 6.2223 11.2521V12.4445H9.77785V11.2521Z" fill="currentColor"/>
<path d="M6.2223 13.3334H9.77785V14.2222H6.2223V13.3334Z" fill="currentColor"/>
<path d="M8.88897 16L9.77786 15.1111H6.2223L7.11119 16H8.88897Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M11 12.6586C13.3304 11.8349 15 9.61244 15 7C15 3.68629 12.3137 1 9 1C5.68629 1 3 3.68629 3 7C3 9.61243 4.66961 11.8349 6.99999 12.6586V14H11V12.6586Z" fill="currentColor"/>
<path d="M6.99999 15H11V16H6.99999V15Z" fill="currentColor"/>
<path d="M10 18L11 17H7L8 18H10Z" fill="currentColor"/>` },
};

export const BulbIcon: React.FC<BaseIconProps> = ({
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

export default BulbIcon;
