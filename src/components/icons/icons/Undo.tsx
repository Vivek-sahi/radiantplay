import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M9.99992 10.6667V4.9817C9.99992 4.61351 9.70144 4.31503 9.33325 4.31503L4.16383 4.31503L6.1143 2.3727L5.07062 1.33337L2.07648 4.31503H2.07125V4.32023L1.33325 5.05516L5.07062 8.77693L6.1143 7.73761L4.15336 5.78485L8.02639 5.78485L8.69726 5.78485V10.6667H9.99992Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M11.6668 12.4444V5.81192C11.6668 5.38236 11.3186 5.03414 10.889 5.03414L4.85801 5.03414L7.13355 2.76809L5.91593 1.55554L2.42276 5.03414H2.41667V5.04021L1.55566 5.89762L5.91593 10.2397L7.13355 9.02715L4.84579 6.74894L9.36433 6.74894L10.147 6.74894V12.4444H11.6668Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M13.3334 14.2223V6.64226C13.3334 6.15134 12.9354 5.75337 12.4445 5.75337L5.55194 5.75337L8.15256 3.1636L6.76099 1.77783L2.7688 5.75337H2.76183V5.76031L1.77783 6.74021L6.76099 11.7026L8.15256 10.3168L5.53798 7.71314L10.702 7.71314L11.5965 7.71314V14.2223H13.3334Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M15 16V7.47248C15 6.9202 14.5523 6.47248 14 6.47248L6.24587 6.47248L9.17157 3.55898L7.60606 2L3.11484 6.47248H3.107V6.48029L2 7.58267L7.60605 13.1653L9.17157 11.6064L6.23017 8.67722L12.0397 8.67722L13.046 8.67722V16H15Z" fill="currentColor"/>` },
};

export const UndoIcon: React.FC<BaseIconProps> = ({
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

export default UndoIcon;
