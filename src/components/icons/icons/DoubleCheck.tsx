import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M5.16667 3.33331L5.16667 4.66665L0.666672 4.66665L0.666672 3.33331L5.16667 3.33331Z" fill="currentColor"/>
<path d="M5.16667 7.5L5.16667 8.83333L0.666672 8.83333L0.666672 7.5L5.16667 7.5Z" fill="currentColor"/>
<path d="M11.3378 2.47142L7.9833 5.82592L5.86198 3.7046L6.80479 2.76179L7.9833 3.9403L10.395 1.52861L11.3378 2.47142Z" fill="currentColor"/>
<path d="M11.321 6.6381L7.98322 9.97592L5.8619 7.8546L6.80471 6.91179L7.98322 8.0903L10.3782 5.6953L11.321 6.6381Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M6.02778 3.88892L6.02778 5.44447L0.777778 5.44447L0.777779 3.88892L6.02778 3.88892Z" fill="currentColor"/>
<path d="M6.02778 8.75L6.02778 10.3056L0.777778 10.3056L0.777779 8.75L6.02778 8.75Z" fill="currentColor"/>
<path d="M13.2274 2.88332L9.31384 6.7969L6.83897 4.32203L7.93891 3.22209L9.31384 4.59702L12.1275 1.78338L13.2274 2.88332Z" fill="currentColor"/>
<path d="M13.2079 7.7444L9.31375 11.6385L6.83888 9.16364L7.93883 8.0637L9.31375 9.43863L12.1079 6.64446L13.2079 7.7444Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M6.88889 4.44446L6.88889 6.22224L0.888885 6.22224L0.888885 4.44446L6.88889 4.44446Z" fill="currentColor"/>
<path d="M6.88889 10L6.88889 11.7778L0.888885 11.7778L0.888885 10L6.88889 10Z" fill="currentColor"/>
<path d="M15.1171 3.29522L10.6444 7.76789L7.81596 4.93946L9.07304 3.68238L10.6444 5.25373L13.86 2.03815L15.1171 3.29522Z" fill="currentColor"/>
<path d="M15.0947 8.85077L10.6443 13.3012L7.81586 10.4728L9.07294 9.21567L10.6443 10.787L13.8376 7.59369L15.0947 8.85077Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M7.75 5L7.75 7L1 7L1 5L7.75 5Z" fill="currentColor"/>
<path d="M7.75 11.25L7.75 13.25L1 13.25L1 11.25L7.75 11.25Z" fill="currentColor"/>
<path d="M17.0067 3.70713L11.9749 8.73888L8.79296 5.55689L10.2072 4.14268L11.9749 5.91045L15.5925 2.29291L17.0067 3.70713Z" fill="currentColor"/>
<path d="M16.9815 9.95713L11.9748 14.9638L8.79284 11.7819L10.2071 10.3676L11.9748 12.1354L15.5673 8.54291L16.9815 9.95713Z" fill="currentColor"/>` },
};

export const DoubleCheckIcon: React.FC<BaseIconProps> = ({
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

export default DoubleCheckIcon;
