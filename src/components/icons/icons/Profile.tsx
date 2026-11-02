import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M6 4.66663C7.10457 4.66663 8 3.7712 8 2.66663C8 1.56206 7.10457 0.666626 6 0.666626C4.89543 0.666626 4 1.56206 4 2.66663C4 3.7712 4.89543 4.66663 6 4.66663Z" fill="currentColor"/>
<path d="M2 9.33329C2 7.12415 3.79086 5.33329 6 5.33329C8.20914 5.33329 10 7.12415 10 9.33329V11.3333H2V9.33329Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.99992 5.4445C8.28858 5.4445 9.33325 4.39983 9.33325 3.11117C9.33325 1.8225 8.28858 0.777832 6.99992 0.777832C5.71125 0.777832 4.66658 1.8225 4.66658 3.11117C4.66658 4.39983 5.71125 5.4445 6.99992 5.4445Z" fill="currentColor"/>
<path d="M2.33325 10.8889C2.33325 8.31161 4.42259 6.22228 6.99992 6.22228C9.57725 6.22228 11.6666 8.31161 11.6666 10.8889V13.2223H2.33325V10.8889Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M8.00008 6.22225C9.47284 6.22225 10.6667 5.02834 10.6667 3.55558C10.6667 2.08282 9.47284 0.888916 8.00008 0.888916C6.52732 0.888916 5.33341 2.08282 5.33341 3.55558C5.33341 5.02834 6.52732 6.22225 8.00008 6.22225Z" fill="currentColor"/>
<path d="M2.66675 12.4445C2.66675 9.49895 5.05456 7.11114 8.00008 7.11114C10.9456 7.11114 13.3334 9.49895 13.3334 12.4445V15.1111H2.66675V12.4445Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M9 7C10.6569 7 12 5.65685 12 4C12 2.34315 10.6569 1 9 1C7.34315 1 6 2.34315 6 4C6 5.65685 7.34315 7 9 7Z" fill="currentColor"/>
<path d="M3 14C3 10.6863 5.68629 8 9 8C12.3137 8 15 10.6863 15 14V17H3V14Z" fill="currentColor"/>` },
};

export const ProfileIcon: React.FC<BaseIconProps> = ({
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

export default ProfileIcon;
