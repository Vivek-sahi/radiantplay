import React from 'react';
import { Icon } from '@components/icons';
import { Chip } from '@components/Chip';
import { colors, typography, layout } from './styles';

interface EditSubHeaderProps {
  title: string;
  activeTab: string;
  tabs: { label: string; id: string }[];
  filters: { label: string; value: string }[];
  onTabChange: (id: string) => void;
}

export const EditSubHeader: React.FC<EditSubHeaderProps> = ({ title, activeTab, tabs, filters, onTabChange }) => (
  <div style={s.editSubHeader}>
    <div style={s.editHeaderRow}>
      <div style={s.editIdentifier}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, color: colors.brand }}>
          <circle cx="9" cy="9" r="9" fill="currentColor" />
          <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke={colors.headerBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={s.editLbTitle}>{title}</span>
        <button style={s.editPencilBtn} aria-label="Edit name">
          <Icon name="pencil" size="s" color={colors.textSecondary} />
        </button>
      </div>
      <div style={s.vertSep} />
      <div style={s.editTabScroll}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={tab.id === activeTab ? s.editTabActive : s.editTab}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            <Icon name="chevron-down" size="xs" color={tab.id === activeTab ? colors.textPrimary : colors.textSecondary} />
          </button>
        ))}
      </div>
    </div>
    <div style={s.editFilterRow}>
      {filters.map((f) => (
        <Chip
          key={f.label}
          type="filter"
          label={f.label}
          filterValue={f.value}
          showChevron
        />
      ))}
    </div>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  editSubHeader: {
    background: colors.headerBg,
    flexShrink: 0,
    borderBottom: '1px solid #DBDFE7',
  },
  vertSep: {
    width: 1,
    height: 20,
    background: colors.divider,
    flexShrink: 0,
  },
  editHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    height: layout.headerHeight,
    padding: '0 32px',
  },
  editIdentifier: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  editLbTitle: {
    fontSize: 20,
    fontWeight: 500,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    letterSpacing: -0.4,
    whiteSpace: 'nowrap' as const,
  },
  editPencilBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    padding: 0,
  },
  editTabScroll: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    flex: 1,
    minWidth: 0,
    overflowX: 'auto',
    height: layout.headerHeight,
  },
  editTab: {
    padding: '0 12px',
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    whiteSpace: 'nowrap' as const,
    height: layout.tabBarHeight,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  editTabActive: {
    padding: '0 12px',
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${colors.brand}`,
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    whiteSpace: 'nowrap' as const,
    height: layout.tabBarHeight,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  editFilterRow: {
    display: 'flex',
    gap: 8,
    padding: '12px 32px',
  },
};
