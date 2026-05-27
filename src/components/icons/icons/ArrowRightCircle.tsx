import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0 6C-1.44847e-07 9.31371 2.68629 12 6 12C9.31371 12 12 9.31371 12 6C12 2.68629 9.31371 1.44847e-07 6 0C2.68629 -1.44847e-07 1.44847e-07 2.68629 0 6ZM10 6.00003L7 8.88679V6.6667H2V5.33337H7V3.11328L10 6.00003Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0 7C-1.68988e-07 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 1.68988e-07 7 0C3.13401 -1.68988e-07 1.68988e-07 3.13401 0 7ZM11.6667 7.00004L8.16667 10.3679V7.77782H2.33333V6.22226H8.16667V3.63216L11.6667 7.00004Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0 8C-1.93129e-07 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 1.93129e-07 8 0C3.58172 -1.93129e-07 1.93129e-07 3.58172 0 8ZM13.3333 8.00004L9.33333 11.849V8.88893H2.66667V7.11116H9.33333V4.15104L13.3333 8.00004Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M0 9C-2.1727e-07 13.9706 4.02944 18 9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 2.1727e-07 9 0C4.02944 -2.1727e-07 2.1727e-07 4.02944 0 9ZM15 9.00005L10.5 13.3302V10H3V8.00005H10.5V4.66992L15 9.00005Z" fill="currentColor"/>` },
};

export const ArrowRightCircleIcon: React.FC<BaseIconProps> = ({
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

export default ArrowRightCircleIcon;
