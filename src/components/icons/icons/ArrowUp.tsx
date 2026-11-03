import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.33323 11.3333H6.66656V3.22364L8.8571 5.41417L9.7999 4.47136L6.66656 1.33802V1.3333H6.66184L5.99517 0.666626L2.19043 4.47136L3.13324 5.41417L5.33323 3.21418V11.3333Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.22226 13.2222H7.77782V3.76089L10.3334 6.31651L11.4334 5.21657L7.77782 1.56101V1.5555H7.77231L6.99452 0.77771L2.55566 5.21657L3.65561 6.31651L6.22226 3.74986V13.2222Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M7.11105 15.1111H8.88883V4.29827L11.8095 7.21898L13.0666 5.9619L8.88883 1.78411V1.77782H8.88254L7.99364 0.888916L2.92065 5.9619L4.17773 7.21898L7.11105 4.28566V15.1111Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M8.00009 17H10.0001V4.83552L13.2859 8.12132L14.7001 6.70711L10.0001 2.00709V2.00001H9.99301L8.993 1L3.28589 6.70711L4.7001 8.12132L8.00009 4.82133V17Z" fill="currentColor"/>` },
};

export const ArrowUpIcon: React.FC<BaseIconProps> = ({
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

export default ArrowUpIcon;
