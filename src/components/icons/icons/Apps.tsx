import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<rect x="0.399902" y="0.428467" width="5.13538" height="5.13537" rx="1" fill="currentColor"/>
<rect x="0.399902" y="6.32458" width="5.13538" height="5.13537" rx="1" fill="currentColor"/>
<rect x="6.29614" y="6.32458" width="5.13538" height="5.13537" rx="1" fill="currentColor"/>
<rect width="3.92879" height="3.92879" rx="0.85" transform="matrix(0.707107 0.707106 -0.707107 0.707106 9.12549 0)" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<rect x="0.5" y="0.629883" width="5.99131" height="5.99126" rx="1" fill="currentColor"/>
<rect x="0.5" y="7.50879" width="5.99131" height="5.99126" rx="1" fill="currentColor"/>
<rect x="7.37891" y="7.50879" width="5.99131" height="5.99126" rx="1" fill="currentColor"/>
<rect width="4.85322" height="4.85322" rx="0.9" transform="matrix(0.70711 0.707104 -0.70711 0.707104 10.4219 0.300049)" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<rect x="0.5" y="0.591309" width="6.84717" height="6.84714" rx="1" fill="currentColor"/>
<rect x="0.5" y="8.45288" width="6.84717" height="6.84714" rx="1" fill="currentColor"/>
<rect x="8.36157" y="8.45288" width="6.84717" height="6.84714" rx="1" fill="currentColor"/>
<rect width="5.54652" height="5.54652" rx="0.9" transform="matrix(0.707108 0.707105 -0.707108 0.707105 11.8921 0)" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<rect x="0.699951" y="0.752686" width="7.70306" height="7.70306" rx="1" fill="currentColor"/>
<rect x="0.699951" y="9.59705" width="7.70306" height="7.70306" rx="1" fill="currentColor"/>
<rect x="9.54419" y="9.59705" width="7.70306" height="7.70306" rx="1" fill="currentColor"/>
<rect x="13.3384" y="0.199951" width="6.23984" height="6.23984" rx="0.9" transform="rotate(45 13.3384 0.199951)" fill="currentColor"/>` },
};

export const AppsIcon: React.FC<BaseIconProps> = ({
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

export default AppsIcon;
