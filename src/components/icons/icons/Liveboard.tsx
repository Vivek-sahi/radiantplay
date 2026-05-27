import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<g clip-path="url(#clip0_18867_4356)">
<path d="M7.79997 5.69493C7.79997 5.24561 8.15814 4.88137 8.59997 4.88137H11.2C11.6418 4.88137 12 5.24561 12 5.69493V11.1864C12 11.6358 11.6418 12 11.2 12H8.59997C8.15814 12 7.79997 11.6358 7.79997 11.1864V5.69493Z" fill="currentColor"/>
<path d="M0 0.813558C0 0.364243 0.358172 0 0.799999 0H6.19999C6.64182 0 6.99999 0.364242 6.99999 0.813558V11.1864C6.99999 11.6357 6.64182 12 6.19999 12H0.799999C0.358172 12 0 11.6357 0 11.1864L0 0.813558Z" fill="currentColor"/>
<path d="M7.79997 0.813558C7.79997 0.364243 8.15814 0 8.59997 0L11.2 4.84926e-08C11.6418 4.84926e-08 12 0.364243 12 0.813558V3.05084C12 3.50016 11.6418 3.8644 11.2 3.8644H8.59997C8.15814 3.8644 7.79997 3.50016 7.79997 3.05084V0.813558Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4356">
<rect width="12" height="12" fill="currentColor"/>
</clipPath>
</defs>` },
  s: { viewBox: '0 0 14 14', inner: `<g clip-path="url(#clip0_18867_4359)">
<path d="M9.09996 6.64408C9.09996 6.11988 9.51783 5.69493 10.0333 5.69493H13.0666C13.5821 5.69493 14 6.11988 14 6.64408V13.0509C14 13.5751 13.5821 14 13.0666 14H10.0333C9.51783 14 9.09996 13.5751 9.09996 13.0509V6.64408Z" fill="currentColor"/>
<path d="M0 0.949151C0 0.42495 0.417867 0 0.933332 0H7.23332C7.74879 0 8.16665 0.42495 8.16665 0.949151V13.0508C8.16665 13.575 7.74879 14 7.23332 14H0.933332C0.417867 14 0 13.575 0 13.0508L0 0.949151Z" fill="currentColor"/>
<path d="M9.09996 0.949152C9.09996 0.42495 9.51783 0 10.0333 0L13.0666 5.65747e-08C13.5821 5.65747e-08 14 0.42495 14 0.949151V3.55932C14 4.08352 13.5821 4.50847 13.0666 4.50847H10.0333C9.51783 4.50847 9.09996 4.08352 9.09996 3.55932V0.949152Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4359">
<rect width="14" height="14" fill="currentColor"/>
</clipPath>
</defs>` },
  m: { viewBox: '0 0 16 16', inner: `<g clip-path="url(#clip0_18867_4362)">
<path d="M10.4 7.59323C10.4 6.99415 10.8775 6.50849 11.4666 6.50849H14.9333C15.5224 6.50849 15.9999 6.99415 15.9999 7.59324V14.9153C15.9999 15.5143 15.5224 16 14.9333 16H11.4666C10.8775 16 10.4 15.5143 10.4 14.9153V7.59323Z" fill="currentColor"/>
<path d="M0 1.08474C0 0.485657 0.477562 0 1.06667 0H8.26666C8.85576 0 9.33332 0.485657 9.33332 1.08474V14.9152C9.33332 15.5143 8.85576 16 8.26666 16H1.06667C0.477562 16 0 15.5143 0 14.9152L0 1.08474Z" fill="currentColor"/>
<path d="M10.4 1.08474C10.4 0.485657 10.8775 0 11.4666 0L14.9333 6.46568e-08C15.5224 6.46568e-08 15.9999 0.485657 15.9999 1.08474V4.06779C15.9999 4.66688 15.5224 5.15254 14.9333 5.15254H11.4666C10.8775 5.15254 10.4 4.66688 10.4 4.06779V1.08474Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4362">
<rect width="16" height="16" fill="currentColor"/>
</clipPath>
</defs>` },
  l: { viewBox: '0 0 18 18', inner: `<g clip-path="url(#clip0_18867_4423)">
<path d="M11.7 8.54239C11.7 7.86842 12.2372 7.32205 12.9 7.32205H16.7999C17.4627 7.32205 17.9999 7.86842 17.9999 8.54239V16.7797C17.9999 17.4536 17.4627 18 16.7999 18H12.9C12.2372 18 11.7 17.4536 11.7 16.7797V8.54239Z" fill="currentColor"/>
<path d="M0 1.22034C0 0.546364 0.537258 0 1.2 0H9.29999C9.96273 0 10.5 0.546364 10.5 1.22034V16.7796C10.5 17.4536 9.96273 18 9.29999 18H1.2C0.537258 18 0 17.4536 0 16.7796L0 1.22034Z" fill="currentColor"/>
<path d="M11.7 1.22034C11.7 0.546364 12.2372 0 12.8999 0L16.7999 7.27389e-08C17.4627 7.27389e-08 17.9999 0.546364 17.9999 1.22034V4.57627C17.9999 5.25024 17.4627 5.7966 16.7999 5.7966H12.8999C12.2372 5.7966 11.7 5.25024 11.7 4.57627V1.22034Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4423">
<rect width="18" height="18" fill="currentColor"/>
</clipPath>
</defs>` },
};

export const LiveboardIcon: React.FC<BaseIconProps> = ({
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

export default LiveboardIcon;
