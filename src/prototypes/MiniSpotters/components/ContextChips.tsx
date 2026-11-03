import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/icons';
import { Menu } from '../../../components/Menu';
import { contextStyles as s, colors, font } from '../styles';
import { radius } from '../../../tokens/radius';
import { spacing } from '../../../tokens/spacing';
import type { MiniSpotter } from '../data/mockData';

interface ContextChipsProps {
  spotters: MiniSpotter[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}

/** Chip-like button for context selection */
const ContextChipButton: React.FC<{
  spotter: MiniSpotter;
  isActive: boolean;
  onClick: () => void;
}> = ({ spotter, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: `${spacing.B}px`,
      padding: `${spacing.B}px ${spacing.D}px`,
      borderRadius: `${radius['3xl']}px`,
      border: `1px solid ${isActive ? colors.borderBrand : colors.borderDefault}`,
      backgroundColor: isActive ? `color-mix(in srgb, ${colors.textBrand} 3%, transparent)` : colors.bg,
      fontFamily: font.family,
      fontSize: font.size.sm,
      fontWeight: isActive ? font.weight.medium : font.weight.regular,
      color: isActive ? colors.textBrand : colors.textPrimary,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
  >
    <span style={{ fontSize: `${font.size.sm}px`, lineHeight: 1 }}>{spotter.icon}</span>
    {spotter.name}
    {isActive && <Icon name="checkmark" size="xs" color={colors.textBrand} />}
  </button>
);

export const ContextChips: React.FC<ContextChipsProps> = ({
  spotters,
  activeId,
  onSelect,
  onCreateClick,
}) => {
  const [browseOpen, setBrowseOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!browseOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setBrowseOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [browseOpen]);

  return (
    <div style={s.section}>
      {/* Header row */}
      <div style={s.header}>
        <div>
          <div style={s.headerLeft}>
            <Icon name="spotter" size="m" color={colors.textBrand} />
            <h3 style={s.headerTitle}>Select your context</h3>
          </div>
          <p style={s.headerSubtitle}>Choose a SpotLight or browse popular questions</p>
        </div>

        {/* Browse All — positioned container */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <Button
            variant="primary"
            size="basic"
            icon="navigate"
            iconPosition="leading"
            onClick={() => setBrowseOpen(!browseOpen)}
          >
            Browse All
          </Button>

          {browseOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              zIndex: 100,
              width: '300px',
            }}>
              <Menu show onClose={() => setBrowseOpen(false)}>
                {spotters.map((sp) => (
                  <Menu.Item
                    key={sp.id}
                    icon={<span style={{ fontSize: `${font.size.md}px` }}>{sp.icon}</span>}
                    active={sp.id === activeId}
                    onClick={() => {
                      onSelect(sp.id);
                      setBrowseOpen(false);
                    }}
                  >
                    {sp.name}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item
                  icon={<Icon name="plus" size="s" color={colors.textBrand} />}
                  onClick={() => {
                    onCreateClick();
                    setBrowseOpen(false);
                  }}
                >
                  Create MiniSpotter
                </Menu.Item>
              </Menu>
            </div>
          )}
        </div>
      </div>

      {/* Chips */}
      <div style={s.chips}>
        {spotters.map((sp) => (
          <ContextChipButton
            key={sp.id}
            spotter={sp}
            isActive={sp.id === activeId}
            onClick={() => onSelect(sp.id)}
          />
        ))}
      </div>
    </div>
  );
};
