import React, { useEffect, useState } from 'react';
import styles from './Avatar.module.css';
import { useRadiantLook } from '../../context/RadiantLookContext';

export type AvatarSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
export type NamePosition = 'right' | 'bottom';

const bgColors = ['bgBlue', 'bgGreen', 'bgPurple', 'bgTeal', 'bgOrange', 'bgRed', 'bgYellow'] as const;

/**
 * Get a consistent background color based on name/id
 */
function getRandomBgClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % bgColors.length;
  return bgColors[index];
}

const sizeClassMap: Record<AvatarSize, string> = {
  xs: styles.sizeXs,
  s: styles.sizeS,
  m: styles.sizeM,
  l: styles.sizeL,
  xl: styles.sizeXl,
  xxl: styles.sizeXxl,
};

export interface AvatarProps {
  /**
   * Name of the user (used for initials and alt text)
   */
  name: string;
  /**
   * Unique identifier (used for consistent color generation)
   */
  id?: string;
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Size of the avatar
   * @default 'm'
   */
  size?: AvatarSize;
  /**
   * Whether to display the name alongside the avatar
   * @default false
   */
  showName?: boolean;
  /**
   * Position of the name relative to avatar
   * @default 'right'
   */
  namePosition?: NamePosition;
  /**
   * Whether the name should appear as a link
   * @default false
   */
  isNameLink?: boolean;
  /**
   * Badge value to display (max 99)
   */
  badgeValue?: number;
  /**
   * Show a simple dot badge instead of numbered
   * @default false
   */
  showBadge?: boolean;
  /**
   * Whether the avatar is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Click handler for the name (when isNameLink is true)
   */
  onNameClick?: () => void;
}

/**
 * Avatar Component
 * 
 * Displays a user avatar with initials fallback, optional image, name, and badge.
 * 
 * **Sizes:**
 * - `xs` - 20px
 * - `s` - 24px
 * - `m` - 32px (default)
 * - `l` - 40px
 * - `xl` - 48px
 * - `xxl` - 64px
 * 
 * **Features:**
 * - Automatic initials from name
 * - Consistent color based on name/id
 * - Image loading with fallback
 * - Numbered or dot badge support
 * 
 * @example
 * ```tsx
 * // Basic avatar with initials
 * <Avatar name="John Doe" />
 * 
 * // With image
 * <Avatar name="Jane Smith" src="/avatars/jane.jpg" size="l" />
 * 
 * // With name displayed
 * <Avatar name="Bob Wilson" showName />
 * 
 * // With badge
 * <Avatar name="Alice" badgeValue={5} />
 * ```
 */
export interface AvatarGroupProps {
  /**
   * Array of avatar props
   */
  avatars: Omit<AvatarProps, 'showName' | 'namePosition' | 'isNameLink' | 'badgeValue' | 'showBadge' | 'onNameClick'>[];
  /**
   * Maximum avatars to display before +N
   * @default 4, or 3 under look: 'radiant-3'
   */
  max?: number;
  /**
   * Size of the avatars
   * @default 'm'
   */
  size?: AvatarSize;
  /**
   * Spacing between avatars (negative for overlap)
   * @default -8
   */
  spacing?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * AvatarGroup Component
 * 
 * Displays a group of stacked avatars with +N overflow indicator.
 * 
 * @example
 * ```tsx
 * <AvatarGroup
 *   avatars={[
 *     { name: 'John Doe', src: '/john.jpg' },
 *     { name: 'Jane Smith' },
 *     { name: 'Bob Wilson', src: '/bob.jpg' },
 *     { name: 'Alice Brown' },
 *     { name: 'Charlie Davis' },
 *   ]}
 *   max={3}
 *   size="m"
 * />
 * ```
 */
export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max: maxProp,
  size = 'm',
  spacing = -8,
  className = '',
}) => {
  // Radiant 3.0: a group shows one to three avatars (Figma 25122:181508)
  const look = useRadiantLook();
  const max = maxProp ?? (look === 'radiant-3' ? 3 : 4);
  const displayedAvatars = avatars.slice(0, max);
  const overflowCount = avatars.length - max;

  const groupClasses = [
    styles.group,
    sizeClassMap[size],
    className,
  ].filter(Boolean).join(' ');

  const bgClass = 'bgGray';

  return (
    <div className={groupClasses}>
      {displayedAvatars.map((avatar, index) => (
        <div
          key={avatar.id || avatar.name + index}
          className={styles.groupItem}
          style={{ marginLeft: index > 0 ? spacing : 0, zIndex: displayedAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {overflowCount > 0 && (
        <div
          className={styles.groupItem}
          style={{ marginLeft: spacing, zIndex: 0 }}
        >
          <div className={styles.avatar}>
            <span className={`${styles.initial} ${styles[bgClass]}`}>
              +{overflowCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  id,
  src,
  size = 'm',
  showName = false,
  namePosition = 'right',
  isNameLink = false,
  badgeValue,
  showBadge = false,
  disabled = false,
  className = '',
  onNameClick,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  // Reset image state when src changes
  useEffect(() => {
    setIsImageLoaded(false);
    setHasImageError(false);
  }, [src]);

  const bgClass = getRandomBgClass(id || name);
  const initial = name.charAt(0).toUpperCase();

  const rootClasses = [
    styles.root,
    sizeClassMap[size],
    namePosition === 'right' ? styles.nameRight : styles.nameBottom,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const showInitial = !src || hasImageError || !isImageLoaded;
  const displayBadgeValue = badgeValue !== undefined;
  const displayDotBadge = showBadge && badgeValue === undefined;

  return (
    <div className={rootClasses}>
      <div className={styles.avatarContainer}>
        <div className={styles.avatar}>
          {showInitial && (
            <span className={`${styles.initial} ${styles[bgClass]}`}>
              {initial}
            </span>
          )}
          {src && !hasImageError && (
            <img
              src={src}
              alt={name}
              className={`${styles.avatarImage} ${isImageLoaded ? styles.loaded : ''}`}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setHasImageError(true)}
            />
          )}
        </div>
        
        {/* Numbered Badge */}
        {displayBadgeValue && (
          <span className={styles.badge}>
            {badgeValue < 100 ? badgeValue : '99+'}
          </span>
        )}
        
        {/* Dot Badge */}
        {displayDotBadge && (
          <span className={`${styles.badge} ${styles.dotBadge}`} />
        )}
      </div>

      {/* Name */}
      {showName && name && (
        <span 
          className={`${styles.name} ${isNameLink ? styles.nameLink : ''}`}
          onClick={isNameLink ? onNameClick : undefined}
          role={isNameLink ? 'button' : undefined}
          tabIndex={isNameLink ? 0 : undefined}
        >
          {name}
        </span>
      )}
    </div>
  );
};

export default Avatar;
