import React from 'react';
import { statusColors, textColors, sysVar } from '../../tokens/colors';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const ChevronRightIcon: React.FC<IconProps> = ({ 
  size = 14, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 14 14" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M5.25 3.5L8.75 7L5.25 10.5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = textColors.secondary,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="8" cy="8" r="8" fill={color} />
    <path 
      d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" 
      stroke={sysVar('background-base')} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIconSimple: React.FC<IconProps> = ({ 
  size = 14, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 14 14" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Status Icons - Use semantic tokens for default colors
export const InfoIcon: React.FC<IconProps> = ({ 
  size = 18, 
  color = statusColors.info.default,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5ZM9 8.25C9.41421 8.25 9.75 8.58579 9.75 9V12C9.75 12.4142 9.41421 12.75 9 12.75C8.58579 12.75 8.25 12.4142 8.25 12V9C8.25 8.58579 8.58579 8.25 9 8.25ZM9 6.75C9.41421 6.75 9.75 6.41421 9.75 6C9.75 5.58579 9.41421 5.25 9 5.25C8.58579 5.25 8.25 5.58579 8.25 6C8.25 6.41421 8.58579 6.75 9 6.75Z" 
      fill={color}
    />
  </svg>
);

export const SuccessIcon: React.FC<IconProps> = ({ 
  size = 18, 
  color = statusColors.success.default,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5ZM12.5303 7.53033C12.8232 7.23744 12.8232 6.76256 12.5303 6.46967C12.2374 6.17678 11.7626 6.17678 11.4697 6.46967L8 9.93934L6.53033 8.46967C6.23744 8.17678 5.76256 8.17678 5.46967 8.46967C5.17678 8.76256 5.17678 9.23744 5.46967 9.53033L7.46967 11.5303C7.76256 11.8232 8.23744 11.8232 8.53033 11.5303L12.5303 7.53033Z" 
      fill={color}
    />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ 
  size = 18, 
  color = statusColors.warning.default,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M7.69064 2.62509C8.26801 1.62497 9.73199 1.62497 10.3094 2.62509L16.5761 13.4999C17.1534 14.5 16.4215 15.75 15.2667 15.75H2.73333C1.57852 15.75 0.846554 14.5 1.42393 13.4999L7.69064 2.62509ZM9 6C9.41421 6 9.75 6.33579 9.75 6.75V9.75C9.75 10.1642 9.41421 10.5 9 10.5C8.58579 10.5 8.25 10.1642 8.25 9.75V6.75C8.25 6.33579 8.58579 6 9 6ZM9 13.5C9.41421 13.5 9.75 13.1642 9.75 12.75C9.75 12.3358 9.41421 12 9 12C8.58579 12 8.25 12.3358 8.25 12.75C8.25 13.1642 8.58579 13.5 9 13.5Z" 
      fill={color}
    />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ 
  size = 18, 
  color = statusColors.error.default,
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5ZM6.96967 6.96967C7.26256 6.67678 7.73744 6.67678 8.03033 6.96967L9 7.93934L9.96967 6.96967C10.2626 6.67678 10.7374 6.67678 11.0303 6.96967C11.3232 7.26256 11.3232 7.73744 11.0303 8.03033L10.0607 9L11.0303 9.96967C11.3232 10.2626 11.3232 10.7374 11.0303 11.0303C10.7374 11.3232 10.2626 11.3232 9.96967 11.0303L9 10.0607L8.03033 11.0303C7.73744 11.3232 7.26256 11.3232 6.96967 11.0303C6.67678 10.7374 6.67678 10.2626 6.96967 9.96967L7.93934 9L6.96967 8.03033C6.67678 7.73744 6.67678 7.26256 6.96967 6.96967Z" 
      fill={color}
    />
  </svg>
);

// Button Icons - Use currentColor by default for flexibility
export const PlusIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M8 3V13M3 8H13" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M4 6L8 10L12 6" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M8 2V10M8 10L5 7M8 10L11 7M3 14H13" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M14 14L10.5 10.5" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M13 8C13 7.73478 12.8946 7.48043 12.7071 7.29289C12.5196 7.10536 12.2652 7 12 7H11.5C11.3674 7 11.2402 6.94732 11.1464 6.85355C11.0527 6.75979 11 6.63261 11 6.5V6C11 5.73478 10.8946 5.48043 10.7071 5.29289C10.5196 5.10536 10.2652 5 10 5H9.5C9.36739 5 9.24021 4.94732 9.14645 4.85355C9.05268 4.75979 9 4.63261 9 4.5V4C9 3.73478 8.89464 3.48043 8.70711 3.29289C8.51957 3.10536 8.26522 3 8 3C7.73478 3 7.48043 3.10536 7.29289 3.29289C7.10536 3.48043 7 3.73478 7 4V4.5C7 4.63261 6.94732 4.75979 6.85355 4.85355C6.75979 4.94732 6.63261 5 6.5 5H6C5.73478 5 5.48043 5.10536 5.29289 5.29289C5.10536 5.48043 5 5.73478 5 6V6.5C5 6.63261 4.94732 6.75979 4.85355 6.85355C4.75979 6.94732 4.63261 7 4.5 7H4C3.73478 7 3.48043 7.10536 3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8C3 8.26522 3.10536 8.51957 3.29289 8.70711C3.48043 8.89464 3.73478 9 4 9H4.5C4.63261 9 4.75979 9.05268 4.85355 9.14645C4.94732 9.24021 5 9.36739 5 9.5V10C5 10.2652 5.10536 10.5196 5.29289 10.7071C5.48043 10.8946 5.73478 11 6 11H6.5C6.63261 11 6.75979 11.0527 6.85355 11.1464C6.94732 11.2402 7 11.3674 7 11.5V12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13C8.26522 13 8.51957 12.8946 8.70711 12.7071C8.89464 12.5196 9 12.2652 9 12V11.5C9 11.3674 9.05268 11.2402 9.14645 11.1464C9.24021 11.0527 9.36739 11 9.5 11H10C10.2652 11 10.5196 10.8946 10.7071 10.7071C10.8946 10.5196 11 10.2652 11 10V9.5C11 9.36739 11.0527 9.24021 11.1464 9.14645C11.2402 9.05268 11.3674 9 11.5 9H12C12.2652 9 12.5196 8.89464 12.7071 8.70711C12.8946 8.51957 13 8.26522 13 8Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M2 4H14M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ 
  size = 16, 
  color = 'currentColor',
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L11 3L13 5L4.5 13.5L2 14Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);
