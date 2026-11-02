import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<g clip-path="url(#clip0_18867_4357)">
<path d="M5.18848 0.934937C2.29383 1.11566 0.000180244 3.52133 0 6.4613C0 9.51888 2.48056 12.0002 5.53809 12.0004C6.71141 12.0003 7.85468 11.6272 8.80273 10.9359C9.53356 10.403 10.1192 9.70193 10.5137 8.89685L6.38574 7.03455C5.6571 6.70576 5.18848 5.98042 5.18848 5.18103V0.934937Z" fill="currentColor"/>
<path d="M5.99998 0.703297C5.99998 0.314876 6.31626 -0.00432449 6.70207 0.040636C9.68508 0.388262 12 2.92366 12 6.00001C12.0009 6.60998 11.9085 7.2151 11.7271 7.79463C11.6111 8.16532 11.1908 8.32331 10.8363 8.16463L6.41597 6.18619C6.16289 6.07292 5.99998 5.82153 5.99998 5.54426V0.703297Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4357">
<rect width="12" height="12" fill="currentColor"/>
</clipPath>
</defs>` },
  s: { viewBox: '0 0 14 14', inner: `<g clip-path="url(#clip0_18867_4358)">
<path d="M6.05322 1.0907C2.676 1.30155 -0.000488281 4.10879 -0.000488281 7.53894C-0.000267029 11.106 2.8943 13.9998 6.46143 13.9999C7.8303 13.9998 9.16396 13.5652 10.27 12.7587C11.1229 12.1368 11.8059 11.3183 12.2661 10.3788L7.44971 8.20691C6.59972 7.82337 6.05336 6.97729 6.05322 6.0448V1.0907Z" fill="currentColor"/>
<path d="M6.99998 0.820514C6.99998 0.367356 7.36897 -0.00504524 7.81908 0.0474087C11.2993 0.452972 14 3.41094 14 7.00001C14.001 7.71165 13.8932 8.41761 13.6817 9.09373C13.5463 9.5262 13.0559 9.71052 12.6423 9.5254L7.48529 7.21723C7.19004 7.08508 6.99998 6.79179 6.99998 6.46831V0.820514Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4358">
<rect width="14" height="14" fill="currentColor"/>
</clipPath>
</defs>` },
  m: { viewBox: '0 0 16 16', inner: `<g clip-path="url(#clip0_18867_4360)">
<path d="M6.91772 1.24658C3.05815 1.48767 -0.000244141 4.69563 -0.000244141 8.61572C-0.000142097 12.6925 3.30769 16.0004 7.38452 16.0005C8.94895 16.0004 10.473 15.5033 11.7371 14.5815C12.7116 13.8709 13.4914 12.9354 14.0173 11.8618L8.5144 9.37939C7.54287 8.94102 6.91772 7.97357 6.91772 6.90771V1.24658Z" fill="currentColor"/>
<path d="M7.99998 0.93773C7.99998 0.419836 8.42168 -0.00576598 8.9361 0.0541814C12.9134 0.517682 16 3.89822 16 8.00001C16.0012 8.81331 15.878 9.62013 15.6362 10.3928C15.4815 10.8871 14.921 11.0977 14.4483 10.8862L8.55462 8.24826C8.21719 8.09723 7.99998 7.76204 7.99998 7.39235V0.93773Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_18867_4360">
<rect width="16" height="16" fill="currentColor"/>
</clipPath>
</defs>` },
  l: { viewBox: '0 0 18 18', inner: `<g clip-path="url(#clip0_18867_4424)">
<path d="M7.78223 1.40234C3.44033 1.67367 0 5.28238 0 9.69238C1.33514e-05 14.2789 3.72114 18 8.30762 18C10.0675 17.9999 11.7821 17.4412 13.2041 16.4043C14.3005 15.6048 15.1788 14.5525 15.7705 13.3447L9.57812 10.5518C8.48519 10.0586 7.78226 8.97053 7.78223 7.77148V1.40234Z" fill="currentColor"/>
<path d="M9.00004 1.05494C9.00004 0.472314 9.47445 -0.00648669 10.0532 0.0609536C14.5276 0.582389 18 4.38547 18 8.99995C18.0013 9.9149 17.8627 10.8226 17.5907 11.6919C17.4167 12.2479 16.7862 12.4849 16.2544 12.2469L9.62401 9.27923C9.2444 9.10932 9.00004 8.73223 9.00004 8.31633V1.05494Z" fill="currentColor"/>
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
