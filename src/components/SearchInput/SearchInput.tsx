import React, { forwardRef } from 'react';
import { Icon } from '../icons';
import { Button } from '../Button';
import styles from './SearchInput.module.css';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Shows a clear button while there's a value, and calls this when it's clicked */
  onClear?: () => void;
  /** Outlined (a bordered field) or underlined (a 40px row with a bottom border, for menus and panels) */
  variant?: 'outlined' | 'underlined';
  /** Additional CSS class name */
  className?: string;
}

/**
 * SearchInput Component
 * 
 * A search input field with a leading search icon. Pass `onClear` to get a
 * clear button while the field has a value.
 * 
 * @example
 * ```tsx
 * <SearchInput placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  placeholder = 'Search',
  value,
  onChange,
  disabled = false,
  onClear,
  variant = 'outlined',
  className,
  ...props
}, ref) => {
  const containerClasses = [
    styles.container,
    variant === 'underlined' && styles.underlined,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/*
        ⚠️ The colour is passed, not left to the class.

        `Icon` writes `style={{ color }}` on the svg with a default of `currentColor`, and an
        inline style beats a class — so `.icon { color: content-tertiary }` never applied and the
        search glyph inherited the field's text colour instead, rendering near-black next to a
        tertiary-grey placeholder. Same token, stated where it actually wins.
      */}
      <Icon name="search" size="m" className={styles.icon} color="var(--rd-sys-color-content-tertiary)" />
      <input
        ref={ref}
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {onClear && value && !disabled && (
        <Button variant="tertiary" size="xs" iconOnly icon="cross" onClick={onClear} className={styles.clear}>
          Clear search
        </Button>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;

