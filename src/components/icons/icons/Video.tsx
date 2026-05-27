import React from 'react';
import { BaseIconProps } from '../Icon.types';
import { iconSize } from '../../../tokens/icons';

const VARIANTS: Record<'xs' | 's' | 'm' | 'l', { viewBox: string; inner: string }> = {
  xs: { viewBox: '0 0 12 12', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.33191 2.33501H10.6681C10.845 2.33501 11.0146 2.39936 11.1397 2.51392C11.2648 2.62847 11.335 2.78384 11.335 2.94584V9.05416C11.335 9.21616 11.2648 9.37153 11.1397 9.48608C11.0146 9.60063 10.845 9.66499 10.6681 9.66499H1.33191C1.15504 9.66499 0.985423 9.60063 0.86036 9.48608C0.735297 9.37153 0.665037 9.21616 0.665037 9.05416V2.94584C0.665037 2.78384 0.735297 2.62847 0.86036 2.51392C0.985423 2.39936 1.15504 2.33501 1.33191 2.33501ZM4.8746 3.66816V8.33269L8.20897 6.00042L4.8746 3.66816Z" fill="currentColor"/>` },
  s: { viewBox: '0 0 14 14', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.55746 2.72001H12.4424C12.6486 2.72001 12.8464 2.79516 12.9922 2.92894C13.138 3.06271 13.2199 3.24415 13.2199 3.43334V10.5667C13.2199 10.7558 13.138 10.9373 12.9922 11.0711C12.8464 11.2048 12.6486 11.28 12.4424 11.28H1.55746C1.35126 11.28 1.1535 11.2048 1.00769 11.0711C0.861881 10.9373 0.779966 10.7558 0.779966 10.5667V3.43334C0.779966 3.24415 0.861881 3.06271 1.00769 2.92894C1.1535 2.79516 1.35126 2.72001 1.55746 2.72001ZM5.68784 4.27686V9.72412L9.57532 7.00049L5.68784 4.27686Z" fill="currentColor"/>` },
  m: { viewBox: '0 0 16 16', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M1.77876 3.11188H14.2212C14.4569 3.11188 14.683 3.19772 14.8497 3.3505C15.0163 3.50328 15.11 3.7105 15.11 3.92657V12.0734C15.11 12.2895 15.0163 12.4967 14.8497 12.6495C14.683 12.8023 14.4569 12.8881 14.2212 12.8881H1.77876C1.54305 12.8881 1.31699 12.8023 1.15032 12.6495C0.983647 12.4967 0.890012 12.2895 0.890012 12.0734V3.92657C0.890012 3.7105 0.983647 3.50328 1.15032 3.3505C1.31699 3.19772 1.54305 3.11188 1.77876 3.11188ZM6.50013 4.88994V11.1112L10.9439 8.00056L6.50013 4.88994Z" fill="currentColor"/>` },
  l: { viewBox: '0 0 18 18', inner: `<path fill-rule="evenodd" clip-rule="evenodd" d="M2 3.5H16C16.2652 3.5 16.5196 3.59658 16.7071 3.76849C16.8946 3.94039 17 4.17355 17 4.41667V13.5833C17 13.8264 16.8946 14.0596 16.7071 14.2315C16.5196 14.4034 16.2652 14.5 16 14.5H2C1.73478 14.5 1.48043 14.4034 1.29289 14.2315C1.10536 14.0596 1 13.8264 1 13.5833V4.41667C1 4.17355 1.10536 3.94039 1.29289 3.76849C1.48043 3.59658 1.73478 3.5 2 3.5ZM7.31239 5.50064V12.5006L12.3124 9.00064L7.31239 5.50064Z" fill="currentColor"/>` },
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
