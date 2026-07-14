import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '../icons';
import styles from './Select.module.css';

/**
 * Select Option
 */
export interface SelectOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Value (defaults to id if not provided) */
  value?: string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional icon name */
  icon?: string;
}

/**
 * Select Props
 */
export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of options to display */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string, option: SelectOption) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Label text above the select */
  label?: string;
  /** Helper text below the select */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Error message (shows below select) */
  errorMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'small' | 'basic' | 'large';
  /** Show search input in dropdown */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
}

/**
 * Select
 * 
 * A dropdown selection component following the Radiant design system.
 * 
 * **Features:**
 * - Single selection from list of options
 * - Searchable option
 * - Keyboard navigation
 * - Error and disabled states
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { id: 'us', label: 'United States' },
 *     { id: 'ca', label: 'Canada' },
 *   ]}
 *   value={country}
 *   onChange={setCountry}
 * />
 * ```
 */
export const Select = forwardRef<HTMLDivElement, SelectProps>(({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  helperText,
  error = false,
  errorMessage,
  disabled = false,
  fullWidth = false,
  size = 'basic',
  searchable = false,
  searchPlaceholder = 'Search...',
  className,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected option
  const selectedOption = options.find(opt => (opt.value ?? opt.id) === value);

  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Flip the menu above the trigger when there isn't room below (e.g. inside a
  // scrollable modal). Defaults to opening downward.
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const estimatedMenuHeight = Math.min(280, filteredOptions.length * 36 + (searchable ? 52 : 8) + 8);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUp(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
  }, [isOpen, filteredOptions.length, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const option = filteredOptions[highlightedIndex];
          if (!option.disabled) {
            onChange?.(option.value ?? option.id, option);
            setIsOpen(false);
            setSearchQuery('');
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
    }
  }, [disabled, isOpen, highlightedIndex, filteredOptions, onChange]);

  // Handle option click
  const handleOptionClick = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value ?? option.id, option);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Toggle dropdown
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(-1);
    } else {
      setSearchQuery('');
    }
  };

  // Build class names
  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
    className,
  ].filter(Boolean).join(' ');

  const triggerClasses = [
    styles.trigger,
    styles[size],
    isOpen && styles.open,
    error && styles.error,
    disabled && styles.disabled,
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      {...props}
    >
      {label && (
        <label className={styles.label}>{label}</label>
      )}

      <div
        ref={ref}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={triggerClasses}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? styles.value : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon 
          name="chevron-down" 
          size="s" 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </div>

      {isOpen && (
        <div className={[styles.dropdown, openUp && styles.dropdownUp].filter(Boolean).join(' ')} role="listbox">
          {searchable && (
            <div className={styles.searchContainer}>
              <Icon name="magnifying-glass" size="s" className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = (option.value ?? option.id) === value;
                const isHighlighted = index === highlightedIndex;

                const optionClasses = [
                  styles.option,
                  isSelected && styles.selected,
                  isHighlighted && styles.highlighted,
                  option.disabled && styles.optionDisabled,
                ].filter(Boolean).join(' ');

                return (
                  <div
                    key={option.id}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    className={optionClasses}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option.label}
                    {isSelected && (
                      <Icon name="checkmark" size="s" className={styles.checkIcon} />
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.noResults}>
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {(helperText || (error && errorMessage)) && (
        <span className={`${styles.helperText} ${error ? styles.errorText : ''}`}>
          {error && errorMessage ? errorMessage : helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
