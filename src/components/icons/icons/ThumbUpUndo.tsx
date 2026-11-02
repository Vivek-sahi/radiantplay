import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 18 18', inner: `<path d="M1.00005 7H4.00005V16H1.00005V7ZM14.99 6C15.2714 5.9997 15.5497 6.05878 15.8067 6.17338C16.0637 6.28798 16.2936 6.45551 16.4814 6.66504C16.6693 6.87457 16.8108 7.12137 16.8967 7.38932C16.9826 7.65726 17.011 7.94033 16.98 8.22001L16.32 14.22C16.2659 14.7097 16.0328 15.1622 15.6656 15.4907C15.2983 15.8192 14.8228 16.0005 14.33 16H5.00005V7.01L7.17005 5.32L9.27005 1.94001C9.45019 1.65178 9.70081 1.41422 9.99826 1.24975C10.2957 1.08528 10.6302 0.999324 10.97 1H11.2C12.2 1 13 1.8 13 2.8V6H14.99Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 18 18', inner: `<path d="M1.00005 7H4.00005V16H1.00005V7ZM14.99 6C15.2714 5.9997 15.5497 6.05878 15.8067 6.17338C16.0637 6.28798 16.2936 6.45551 16.4814 6.66504C16.6693 6.87457 16.8108 7.12137 16.8967 7.38932C16.9826 7.65726 17.011 7.94033 16.98 8.22001L16.32 14.22C16.2659 14.7097 16.0328 15.1622 15.6656 15.4907C15.2983 15.8192 14.8228 16.0005 14.33 16H5.00005V7.01L7.17005 5.32L9.27005 1.94001C9.45019 1.65178 9.70081 1.41422 9.99826 1.24975C10.2957 1.08528 10.6302 0.999324 10.97 1H11.2C12.2 1 13 1.8 13 2.8V6H14.99Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 18 18', inner: `<path d="M1.00005 7H4.00005V16H1.00005V7ZM14.99 6C15.2714 5.9997 15.5497 6.05878 15.8067 6.17338C16.0637 6.28798 16.2936 6.45551 16.4814 6.66504C16.6693 6.87457 16.8108 7.12137 16.8967 7.38932C16.9826 7.65726 17.011 7.94033 16.98 8.22001L16.32 14.22C16.2659 14.7097 16.0328 15.1622 15.6656 15.4907C15.2983 15.8192 14.8228 16.0005 14.33 16H5.00005V7.01L7.17005 5.32L9.27005 1.94001C9.45019 1.65178 9.70081 1.41422 9.99826 1.24975C10.2957 1.08528 10.6302 0.999324 10.97 1H11.2C12.2 1 13 1.8 13 2.8V6H14.99Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M1.00005 7H4.00005V16H1.00005V7ZM14.99 6C15.2714 5.9997 15.5497 6.05878 15.8067 6.17338C16.0637 6.28798 16.2936 6.45551 16.4814 6.66504C16.6693 6.87457 16.8108 7.12137 16.8967 7.38932C16.9826 7.65726 17.011 7.94033 16.98 8.22001L16.32 14.22C16.2659 14.7097 16.0328 15.1622 15.6656 15.4907C15.2983 15.8192 14.8228 16.0005 14.33 16H5.00005V7.01L7.17005 5.32L9.27005 1.94001C9.45019 1.65178 9.70081 1.41422 9.99826 1.24975C10.2957 1.08528 10.6302 0.999324 10.97 1H11.2C12.2 1 13 1.8 13 2.8V6H14.99Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const ThumbUpUndoIcon: React.FC<BaseIconProps> = ({
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

export default ThumbUpUndoIcon;
