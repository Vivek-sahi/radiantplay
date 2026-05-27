import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12 6C12 2.68629 9.31371 -1.44847e-07 6 0C2.68629 1.44847e-07 -1.44847e-07 2.68629 0 6C1.44847e-07 9.31371 2.68629 12 6 12C9.31371 12 12 9.31371 12 6ZM2 5.99997L5 3.11322V5.3333L10 5.3333V6.66663L5 6.66663L5 8.88672L2 5.99997Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M14 7C14 3.13401 10.866 -1.68988e-07 7 0C3.13401 1.68988e-07 -1.68988e-07 3.13401 0 7C1.68988e-07 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7ZM2.33333 6.99996L5.83333 3.63208L5.83333 6.22218L11.6667 6.22218V7.77774L5.83333 7.77774L5.83333 10.3678L2.33333 6.99996Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M16 8C16 3.58172 12.4183 -1.93129e-07 8 0C3.58172 1.93129e-07 -1.93129e-07 3.58172 0 8C1.93129e-07 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8ZM2.66667 7.99996L6.66667 4.15095V7.11107L13.3333 7.11107V8.88884L6.66667 8.88884L6.66667 11.849L2.66667 7.99996Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M18 9C18 4.02944 13.9706 -2.1727e-07 9 0C4.02944 2.1727e-07 -2.1727e-07 4.02944 0 9C2.1727e-07 13.9706 4.02944 18 9 18C13.9706 18 18 13.9706 18 9ZM3 8.99995L7.5 4.66982L7.5 7.99995L15 7.99995V9.99995L7.5 9.99995L7.5 13.3301L3 8.99995Z" fill="currentColor"/>` },
};

export const ArrowLeftCircleIcon: React.FC<BaseIconProps> = ({
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

export default ArrowLeftCircleIcon;
