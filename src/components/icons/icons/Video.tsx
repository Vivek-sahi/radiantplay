import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path d="M1.33191 2.33496H10.6682C10.845 2.33496 11.0147 2.39932 11.1397 2.51387C11.2648 2.62842 11.335 2.78379 11.335 2.94579V9.05413C11.335 9.21613 11.2648 9.3715 11.1397 9.48605C11.0147 9.60061 10.845 9.66496 10.6682 9.66496H1.33191C1.15505 9.66496 0.985426 9.60061 0.860362 9.48605C0.735299 9.3715 0.665039 9.21613 0.665039 9.05413V2.94579C0.665039 2.78379 0.735299 2.62842 0.860362 2.51387C0.985426 2.39932 1.15505 2.33496 1.33191 2.33496ZM4.87461 3.66811V8.33266L8.20899 6.00039L4.87461 3.66811Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path d="M1.55753 2.71997H12.4425C12.6487 2.71997 12.8465 2.79513 12.9923 2.9289C13.1381 3.06268 13.22 3.24412 13.22 3.4333V10.5666C13.22 10.7558 13.1381 10.9373 12.9923 11.071C12.8465 11.2048 12.6487 11.28 12.4425 11.28H1.55753C1.35132 11.28 1.15356 11.2048 1.00775 11.071C0.861944 10.9373 0.780029 10.7558 0.780029 10.5666V3.4333C0.780029 3.24412 0.861944 3.06268 1.00775 2.9289C1.15356 2.79513 1.35132 2.71997 1.55753 2.71997ZM5.68791 4.27683V9.7241L9.57541 7.00047L5.68791 4.27683Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path d="M1.77864 3.11194H14.2211C14.4569 3.11194 14.6829 3.19777 14.8496 3.35056C15.0163 3.50334 15.1099 3.71056 15.1099 3.92663V12.0735C15.1099 12.2896 15.0163 12.4968 14.8496 12.6496C14.6829 12.8024 14.4569 12.8882 14.2211 12.8882H1.77864C1.54293 12.8882 1.31687 12.8024 1.1502 12.6496C0.983528 12.4968 0.889893 12.2896 0.889893 12.0735V3.92663C0.889893 3.71056 0.983528 3.50334 1.1502 3.35056C1.31687 3.19777 1.54293 3.11194 1.77864 3.11194ZM6.50003 4.89V11.1113L10.9438 8.00063L6.50003 4.89Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path d="M2 3.5H16C16.2652 3.5 16.5196 3.59658 16.7071 3.76849C16.8946 3.94039 17 4.17355 17 4.41667V13.5833C17 13.8264 16.8946 14.0596 16.7071 14.2315C16.5196 14.4034 16.2652 14.5 16 14.5H2C1.73478 14.5 1.48043 14.4034 1.29289 14.2315C1.10536 14.0596 1 13.8264 1 13.5833V4.41667C1 4.17355 1.10536 3.94039 1.29289 3.76849C1.48043 3.59658 1.73478 3.5 2 3.5ZM7.31239 5.50064V12.5006L12.3124 9.00064L7.31239 5.50064Z" fill-rule="evenodd" clip-rule="evenodd" fill="currentColor"/>` },
};

export const VideoIcon: React.FC<BaseIconProps> = ({
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

export default VideoIcon;
