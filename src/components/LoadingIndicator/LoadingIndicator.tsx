import React from 'react';
import styles from './LoadingIndicator.module.css';
import { useRadiantLook } from '../../context/RadiantLookContext';

/**
 * LoadingIndicator Size
 */
export type LoadingIndicatorSize = 'small' | 'medium' | 'large';

/**
 * Contextual size variants (xs=12px, s=16px, m=24px, l=32px, xl=48px)
 */
export type ContextualSize = 'xs' | 's' | 'm' | 'l' | 'xl';

/**
 * Skeleton variants
 */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

/**
 * LoadingIndicator Props
 */
export interface LoadingIndicatorProps {
  /** Size of the spinner */
  size?: LoadingIndicatorSize;
  /** Loading text to display */
  text?: string;
  /** Whether to center in container */
  centered?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Contextual Spinner Props
 */
export type ContextualColor = 'blue' | 'gray' | 'white';

export interface ContextualProps {
  /** Size of the spinner. Defaults to m (24px), or Figma's 18px under look: 'radiant-3' */
  size?: ContextualSize;
  /** Blue (brand), gray, or white for dark or coloured surfaces */
  color?: ContextualColor;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton Props
 */
export interface SkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Width (number for px, string for %) */
  width?: number | string;
  /** Height (number for px, string for %) */
  height?: number | string;
  /** Additional className */
  className?: string;
}

/**
 * LoadingOverlay Props
 */
export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Loading text to display */
  text?: string;
  /** Content to overlay */
  children: React.ReactNode;
  /** Additional className for the container */
  className?: string;
}

/**
 * LoadingIndicator Component Interface with compound components
 */
interface LoadingIndicatorComponent extends React.FC<LoadingIndicatorProps> {
  Contextual: React.FC<ContextualProps>;
  Skeleton: React.FC<SkeletonProps>;
}

/**
 * LoadingIndicator Component
 * 
 * A spinning loader indicator for async operations.
 * 
 * **Features:**
 * - Multiple sizes (small, medium, large)
 * - Optional loading text
 * - Can be centered in container
 * - Contextual spinner sub-component
 * - Skeleton placeholder sub-component
 * 
 * @example
 * ```tsx
 * <LoadingIndicator size="medium" text="Loading..." />
 * <LoadingIndicator.Contextual size="m" />
 * <LoadingIndicator.Skeleton variant="text" width="60%" />
 * ```
 */
export const LoadingIndicator: LoadingIndicatorComponent = ({
  size = 'medium',
  text,
  centered = false,
  className,
}) => {
  const containerClasses = [
    styles.container,
    centered && styles.centered,
    className,
  ].filter(Boolean).join(' ');

  const spinnerClasses = [
    styles.spinner,
    styles[size],
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle 
            className={styles.track} 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="3"
          />
          <path 
            className={styles.arc}
            d="M12 2C6.47715 2 2 6.47715 2 12"
            stroke="currentColor" 
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
};

/**
 * LoadingOverlay Component
 * 
 * Overlays content with a loading indicator when active.
 * 
 * @example
 * ```tsx
 * <LoadingOverlay isVisible={isLoading} text="Saving...">
 *   <FormContent />
 * </LoadingOverlay>
 * ```
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text,
  children,
  className,
}) => {
  return (
    <div className={`${styles.overlayContainer} ${className || ''}`}>
      {children}
      {isVisible && (
        <div className={styles.overlay}>
          <LoadingIndicator size="large" text={text} />
        </div>
      )}
    </div>
  );
};

/**
 * Contextual Spinner Component
 * 
 * Inline loading spinner with size variants.
 */
const contextualSizes: Record<ContextualSize, number> = {
  xs: 12,
  s: 16,
  m: 24,
  l: 32,
  xl: 48,
};

const Contextual: React.FC<ContextualProps> = ({
  size,
  color = 'blue',
  className,
}) => {
  const look = useRadiantLook();
  const sizeValue = size ? contextualSizes[size] : look === 'radiant-3' ? 18 : contextualSizes.m;
  const colorClass = color === 'blue' ? '' : ` ${styles[color]}`;

  return (
    <div 
      className={`${styles.contextual}${colorClass} ${className || ''}`}
      style={{ width: sizeValue, height: sizeValue }}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle 
          className={styles.track} 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="3"
        />
        <path 
          className={styles.arc}
          d="M12 2C6.47715 2 2 6.47715 2 12"
          stroke="currentColor" 
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/**
 * Skeleton Placeholder Component
 * 
 * Shimmer loading placeholder with variants.
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
}) => {
  const getWidth = () => {
    if (width !== undefined) {
      return typeof width === 'number' ? `${width}px` : width;
    }
    return variant === 'text' ? '100%' : variant === 'circular' ? '40px' : '100%';
  };
  
  const getHeight = () => {
    if (height !== undefined) {
      return typeof height === 'number' ? `${height}px` : height;
    }
    return variant === 'text' ? '1em' : variant === 'circular' ? '40px' : '100px';
  };
  
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular': return '50%';
      case 'rounded': return '8px';
      case 'text': return '4px';
      default: return '0';
    }
  };
  
  return (
    <div 
      className={`${styles.skeleton} ${className || ''}`}
      style={{
        width: getWidth(),
        height: getHeight(),
        borderRadius: getBorderRadius(),
      }}
    />
  );
};

// Attach compound components
LoadingIndicator.Contextual = Contextual;
LoadingIndicator.Skeleton = Skeleton;

export default LoadingIndicator;
