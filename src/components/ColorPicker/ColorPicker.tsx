import React, { useState, useCallback } from 'react';
import styles from './ColorPicker.module.css';

export type ColorPickerSelectorType = 'hex' | 'rgb' | 'palette';

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  selectorType?: ColorPickerSelectorType;
  palette?: string[];
  disabled?: boolean;
  className?: string;
}

// Swatch values are data (the colours a user can pick), so they stay as literals.
const DEFAULT_PALETTE = [
  '#000000',
  '#ffffff',
  '#f5f5f5',
  '#e0e0e0',
  '#9e9e9e',
  '#616161',
  '#2196f3',
  '#4caf50',
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#00bcd4',
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Ensure the string is a valid 6-digit hex colour, returning '' if not. */
function normaliseHex(raw: string): string {
  const cleaned = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#[0-9A-Fa-f]{6}$/.test(cleaned) ? cleaned.toLowerCase() : '';
}

/** Parse any CSS colour string into { r, g, b } (0-255). Falls back to black. */
function parseToRgb(color: string): { r: number; g: number; b: number } {
  // Try hex
  const hex = normaliseHex(color);
  if (hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  // Try rgb(r, g, b)
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
      g: Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
      b: Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
    };
  }

  return { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0'))
      .join('')
  );
}

// ── Sub-selectors ──────────────────────────────────────────────────────────

interface HexSelectorProps {
  value: string;
  onChange: (color: string) => void;
  disabled: boolean;
}

const HexSelector: React.FC<HexSelectorProps> = ({ value, onChange, disabled }) => {
  const hex = normaliseHex(value) || '#000000';
  const [textValue, setTextValue] = useState<string>(hex);

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value; // already valid hex from browser picker
    setTextValue(newHex);
    onChange(newHex);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    const valid = normaliseHex(e.target.value);
    if (valid) onChange(valid);
  };

  const handleTextBlur = () => {
    // Restore to last valid value on blur
    const valid = normaliseHex(textValue);
    setTextValue(valid || hex);
  };

  return (
    <div className={styles.hexRow}>
      <input
        type="color"
        className={styles.colorNativeInput}
        value={hex}
        onChange={handleColorInput}
        disabled={disabled}
        aria-label="Pick color"
      />
      <input
        type="text"
        className={styles.hexTextInput}
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        disabled={disabled}
        maxLength={7}
        placeholder="#000000"
        aria-label="Hex color value"
        spellCheck={false}
      />
    </div>
  );
};

interface RgbSelectorProps {
  value: string;
  onChange: (color: string) => void;
  disabled: boolean;
}

const RgbSelector: React.FC<RgbSelectorProps> = ({ value, onChange, disabled }) => {
  const { r, g, b } = parseToRgb(value);

  const handleChannel = (channel: 'r' | 'g' | 'b', raw: string) => {
    const n = Math.min(255, Math.max(0, parseInt(raw, 10) || 0));
    const newHex = rgbToHex(
      channel === 'r' ? n : r,
      channel === 'g' ? n : g,
      channel === 'b' ? n : b
    );
    onChange(newHex);
  };

  return (
    <div className={styles.rgbRow}>
      {(
        [
          { label: 'R', channel: 'r' as const, val: r },
          { label: 'G', channel: 'g' as const, val: g },
          { label: 'B', channel: 'b' as const, val: b },
        ] as const
      ).map(({ label, channel, val }) => (
        <div key={channel} className={styles.rgbField}>
          <label className={styles.rgbLabel}>{label}</label>
          <input
            type="number"
            className={styles.rgbInput}
            value={val}
            min={0}
            max={255}
            onChange={(e) => handleChannel(channel, e.target.value)}
            disabled={disabled}
            aria-label={`${label} channel (0-255)`}
          />
        </div>
      ))}
    </div>
  );
};

interface PaletteSelectorProps {
  value: string;
  palette: string[];
  onChange: (color: string) => void;
  disabled: boolean;
}

const PaletteSelector: React.FC<PaletteSelectorProps> = ({
  value,
  palette,
  onChange,
  disabled,
}) => {
  const normValue = normaliseHex(value);

  return (
    <div className={styles.paletteGrid}>
      {palette.map((color) => {
        const normColor = normaliseHex(color) || color;
        const isSelected = normColor === normValue;
        return (
          <button
            key={color}
            type="button"
            className={[styles.swatch, isSelected && styles.swatchSelected]
              .filter(Boolean)
              .join(' ')}
            style={{ backgroundColor: normColor }}
            onClick={() => !disabled && onChange(normColor)}
            aria-label={`Select color ${normColor}`}
            aria-pressed={isSelected}
            disabled={disabled}
            title={normColor}
          />
        );
      })}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#000000',
  onChange,
  selectorType = 'hex',
  palette = DEFAULT_PALETTE,
  disabled = false,
  className,
}) => {
  const handleChange = useCallback(
    (color: string) => {
      onChange?.(color);
    },
    [onChange]
  );

  // Derive a safe CSS color string for preview
  const previewColor = (() => {
    const hex = normaliseHex(value);
    if (hex) return hex;
    if (value) return value; // pass through rgb() etc. for preview
    return '#000000';
  })();

  const containerClasses = [styles.container, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* Color preview swatch */}
      <div className={styles.previewWrapper}>
        <div className={styles.checkerboard} aria-hidden="true" />
        <div
          className={styles.previewSwatch}
          style={{ backgroundColor: previewColor }}
          aria-label={`Current color: ${previewColor}`}
        />
      </div>

      {/* Selector */}
      {selectorType === 'hex' && (
        <HexSelector value={value} onChange={handleChange} disabled={disabled} />
      )}
      {selectorType === 'rgb' && (
        <RgbSelector value={value} onChange={handleChange} disabled={disabled} />
      )}
      {selectorType === 'palette' && (
        <PaletteSelector
          value={value}
          palette={palette}
          onChange={handleChange}
          disabled={disabled}
        />
      )}
    </div>
  );
};

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
