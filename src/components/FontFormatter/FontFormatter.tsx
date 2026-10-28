import { forwardRef } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import styles from './FontFormatter.module.css';

export type FontFormat = 'bold' | 'italic' | 'strikethrough' | 'underline';

export interface FontFormatterProps {
  /** Formats that are on */
  value?: FontFormat[];
  /** Called with the new set of formats when one is toggled */
  onChange?: (value: FontFormat[]) => void;
  /**
   * Which toggles to show, in order
   * @default ['bold', 'italic', 'strikethrough', 'underline']
   */
  formats?: FontFormat[];
  /** Disables every toggle */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

const FORMATS: Record<FontFormat, { icon: IconName; label: string }> = {
  bold: { icon: 'bold', label: 'Bold' },
  italic: { icon: 'italic', label: 'Italic' },
  strikethrough: { icon: 'strike-through', label: 'Strikethrough' },
  underline: { icon: 'underline', label: 'Underline' },
};

const DEFAULT_FORMATS: FontFormat[] = ['bold', 'italic', 'strikethrough', 'underline'];

/**
 * FontFormatter
 *
 * The Figma Font formatter (73:9046): a bordered group of 32px toggles for
 * bold, italic, strikethrough and underline. A format that's on uses Ghost
 * Highlight.
 *
 * @example
 * ```tsx
 * const [formats, setFormats] = useState<FontFormat[]>(['bold']);
 * <FontFormatter value={formats} onChange={setFormats} />
 * ```
 */
export const FontFormatter = forwardRef<HTMLDivElement, FontFormatterProps>(({
  value = [],
  onChange,
  formats = DEFAULT_FORMATS,
  disabled = false,
  className,
}, ref) => {
  const toggle = (format: FontFormat) => {
    onChange?.(value.includes(format) ? value.filter((f) => f !== format) : [...value, format]);
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Text formatting"
      className={[styles.formatter, disabled && styles.disabled, className].filter(Boolean).join(' ')}
    >
      {formats.map((format) => {
        const on = value.includes(format);
        return (
          <button
            key={format}
            type="button"
            className={[styles.toggle, on && styles.on].filter(Boolean).join(' ')}
            aria-pressed={on}
            aria-label={FORMATS[format].label}
            title={FORMATS[format].label}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggle(format)}
          >
            <Icon name={FORMATS[format].icon} size="s" />
          </button>
        );
      })}
    </div>
  );
});

FontFormatter.displayName = 'FontFormatter';

export default FontFormatter;
