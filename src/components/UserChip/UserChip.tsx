import React, { forwardRef, useCallback } from 'react';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { Icon } from '../icons';
import { sysVar } from '../../tokens/colors';
import styles from './UserChip.module.css';

export interface UserChipProps {
  /** Person's name, shown as the label and used for the avatar initials */
  name: string;
  /** Avatar image URL. Falls back to initials. */
  src?: string;
  /** Stable id for the avatar initials colour */
  id?: string;
  /**
   * Selected look: dark fill, inverse text and a checkmark over a dimmed avatar.
   * @default false
   */
  selected?: boolean;
  /** Disables the chip at 40% opacity */
  disabled?: boolean;
  /** Click or Enter/Space on the chip, e.g. to toggle selection */
  onClick?: () => void;
  /** Shows the remove button (Dismiss=True); also fires on Delete or Backspace */
  onRemove?: () => void;
  /** Maximum width before the name truncates, in px */
  maxWidth?: number;
  className?: string;
}

/**
 * UserChip
 *
 * The Figma Input chip (587:16405): a 28px pill with a 24px Avatar, the person's
 * name and an optional remove button, used for people inside inputs such as
 * share or mention fields. Selected chips use the dark input-selected fill,
 * inverse text and a checkmark over the dimmed avatar.
 *
 * @example
 * ```tsx
 * <UserChip name="Priya Shah" src={url} onRemove={remove} />
 * <UserChip name="Leo Park" selected onClick={toggle} />
 * ```
 */
export const UserChip = forwardRef<HTMLDivElement, UserChipProps>(({
  name,
  src,
  id,
  selected = false,
  disabled = false,
  onClick,
  onRemove,
  maxWidth,
  className,
}, ref) => {
  const interactive = Boolean(onClick) && !disabled;
  const removable = Boolean(onRemove);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled) return;
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    } else if (removable && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onRemove?.();
    }
  }, [disabled, interactive, removable, onClick, onRemove]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) onRemove?.();
  }, [disabled, onRemove]);

  const classes = [
    styles.chip,
    selected && styles.selected,
    removable && styles.removable,
    interactive && styles.interactive,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const focusable = (interactive || removable) && !disabled;

  return (
    <div ref={ref} className={classes} style={maxWidth ? { maxWidth } : undefined}>
      <span
        className={styles.body}
        role={interactive ? 'button' : undefined}
        aria-pressed={interactive ? selected : undefined}
        aria-disabled={disabled || undefined}
        aria-keyshortcuts={removable && !disabled ? 'Delete Backspace' : undefined}
        tabIndex={focusable ? 0 : undefined}
        onClick={interactive ? onClick : undefined}
        onKeyDown={focusable ? handleKeyDown : undefined}
        title={name}
      >
        <span className={styles.avatar}>
          <Avatar name={name} id={id} src={src} size="s" className={styles.avatarImage} />
          {selected && (
            <span className={styles.check}>
              <Icon name="checkmark" size="s" aria-hidden />
            </span>
          )}
        </span>
        <span className={styles.name}>{name}</span>
      </span>
      {removable && (
        <Button
          variant="tertiary"
          size="xs"
          iconOnly
          colorway={selected ? 'white' : 'standard'}
          icon={
            <Icon
              name="cross"
              size="xs"
              color={sysVar(selected ? 'content-inverse' : 'content-primary')}
            />
          }
          className={styles.dismiss}
          onClick={handleRemove}
          disabled={disabled}
          aria-label={`Remove ${name}`}
        >
          Remove
        </Button>
      )}
    </div>
  );
});

UserChip.displayName = 'UserChip';

export default UserChip;
