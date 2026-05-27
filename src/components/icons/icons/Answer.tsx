import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<g clip-path="url(#clip0_18867_4357)">
<path d="M4.85912 0.986982C2.11334 1.36251 0 3.67283 0 6.46682C0 9.52274 2.52817 12.0001 5.64683 12.0001C8.5059 12.0001 10.8687 9.91799 11.2422 7.2168L4.85912 7.21663L4.85912 0.986982Z" fill="currentColor"/>
<path d="M6.24744 0.519202V0C6.24744 0 6.54468 0.0198856 6.69126 0.0375073C8.09753 0.206568 9.35265 0.838986 10.2873 1.7673C11.18 2.65395 11.7857 3.81584 11.9531 5.11038C11.9841 5.34982 12 5.59322 12 5.83958H9.20072C9.20072 5.83954 9.20072 5.83962 9.20072 5.83958L6.24667 5.83946V0.519127L6.24744 0.519202Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4357">
<rect width="12" height="12" fill="currentColor"/>
</clipPath>
</defs>` },
  s: { viewBox: '0 0 14 14', inner: `<g clip-path="url(#clip0_18867_4358)">
<path d="M5.66897 1.15148C2.46557 1.5896 0 4.28497 0 7.54462C0 11.1099 2.94953 14.0001 6.58797 14.0001C9.92355 14.0001 12.6801 11.571 13.1159 8.4196L5.66897 8.4194L5.66897 1.15148Z" fill="currentColor"/>
<path d="M7.28868 0.605736V0C7.28868 0 7.63546 0.0231999 7.80647 0.0437585C9.44712 0.240996 10.9114 0.978817 12.0018 2.06186C13.0433 3.09627 13.75 4.45181 13.9453 5.96211C13.9815 6.24145 14 6.52543 14 6.81285H10.7342C10.7342 6.8128 10.7342 6.8129 10.7342 6.81285L7.28778 6.8127V0.605648L7.28868 0.605736Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4358">
<rect width="14" height="14" fill="currentColor"/>
</clipPath>
</defs>` },
  m: { viewBox: '0 0 16 16', inner: `<g clip-path="url(#clip0_18867_4360)">
<path d="M6.47883 1.31598C2.81779 1.81668 0 4.89711 0 8.62242C0 12.697 3.3709 16.0001 7.52911 16.0001C11.3412 16.0001 14.4916 13.224 14.9896 9.6224L6.47882 9.62217L6.47883 1.31598Z" fill="currentColor"/>
<path d="M8.32992 0.69227V0C8.32992 0 8.72624 0.0265142 8.92168 0.0500097C10.7967 0.275423 12.4702 1.11865 13.7164 2.35641C14.9066 3.5386 15.7143 5.08778 15.9375 6.81384C15.9788 7.13309 16 7.45763 16 7.78611H12.2676C12.2676 7.78605 12.2676 7.78617 12.2676 7.78611L8.32889 7.78594V0.692169L8.32992 0.69227Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4360">
<rect width="16" height="16" fill="currentColor"/>
</clipPath>
</defs>` },
  l: { viewBox: '0 0 18 18', inner: `<g clip-path="url(#clip0_18867_4424)">
<path d="M7.28868 1.48047C3.17001 2.04377 0 5.50925 0 9.70023C0 14.2841 3.79226 18.0001 8.47025 18.0001C12.7589 18.0001 16.303 14.877 16.8633 10.8252L7.28868 10.8249L7.28868 1.48047Z" fill="currentColor"/>
<path d="M9.37116 0.778804V0C9.37116 0 9.81702 0.0298285 10.0369 0.0562609C12.1463 0.309851 14.029 1.25848 15.4309 2.65096C16.77 3.98092 17.6786 5.72376 17.9297 7.66557C17.9762 8.02473 18 8.38983 18 8.75937H13.8011C13.8011 8.75931 13.8011 8.75944 13.8011 8.75937L9.37 8.75918V0.77869L9.37116 0.778804Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4424">
<rect width="18" height="18" fill="currentColor"/>
</clipPath>
</defs>` },
};

export const AnswerIcon: React.FC<BaseIconProps> = ({
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

export default AnswerIcon;
