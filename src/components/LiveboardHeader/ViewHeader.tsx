import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import { Tooltip } from '@components/Tooltip';
import { Chip } from '@components/Chip';
import { Menu } from '@components/Menu';
import { colors, typography, shadows, layout } from './styles';

interface ViewHeaderProps {
  title: string;
  activeTab: string;
  tabs: { label: string; id: string }[];
  filters: { label: string; value: string }[];
  onTabChange: (id: string) => void;
  onEdit: () => void;
}

// ── Tab bar with overflow scroll arrows ─────────────────

const TabBar: React.FC<{
  tabs: { label: string; id: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div style={s.tabBarWrapper}>
      {canScrollLeft && (
        <button style={{ ...s.shifter, left: 0 }} onClick={() => scroll('left')}>
          <Icon name="chevron-left" size="s" color={colors.textSecondary} />
        </button>
      )}
      <div ref={scrollRef} style={s.tabScroll}>
        <div style={s.tabSequence}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={tab.id === activeTab ? s.tabActive : s.tab}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
              {tab.id === activeTab && <div style={s.tabUnderline} />}
            </button>
          ))}
        </div>
      </div>
      {canScrollRight && (
        <button style={{ ...s.shifter, right: 0 }} onClick={() => scroll('right')}>
          <Icon name="chevron-right" size="s" color={colors.textSecondary} />
        </button>
      )}
    </div>
  );
};

// ── Main header ─────────────────────────────────────────

export const ViewHeader: React.FC<ViewHeaderProps> = ({ title, activeTab, tabs, filters, onTabChange, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={s.headerOuter}>
      {/* Row 1: Title + Tabs + Actions */}
      <header style={s.headerRow}>
        {/* Identifier */}
        <div style={s.identifier}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, color: colors.brand }}>
            <circle cx="9" cy="9" r="9" fill="currentColor" />
            <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke={colors.headerBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={s.title}>{title}</span>
          <Tooltip content="Info" placement="bottom">
            <button style={s.lixssBtn} aria-label="Info">
              <Icon name="info-circle" size="xs" color={colors.textSecondary} />
            </button>
          </Tooltip>
          <Tooltip content="Favorite" placement="bottom">
            <button style={s.lixssBtn} aria-label="Favorite">
              <Icon name="pin" size="xs" color={colors.textSecondary} />
            </button>
          </Tooltip>
        </div>

        {/* Separator */}
        <div style={s.vertSep} />

        {/* Tabs — takes remaining space */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />

        {/* Action items — fixed on the right */}
        <div style={s.actions}>
          <Button variant="primary" size="basic" icon="star" iconPosition="leading" style={{ borderRadius: 20 }}>
            AI Highlights
          </Button>
          <Tooltip content="Comments" placement="bottom">
            <button style={s.iconBtn} aria-label="Comments">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2.5h12a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-3.5v3L7 10.5H2a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip content="Share" placement="bottom">
            <button style={s.iconBtn} aria-label="Share">
              <Icon name="share" size="m" color={colors.textSecondary} />
            </button>
          </Tooltip>
          <div style={s.menuAnchor}>
            <button
              style={s.iconBtn}
              aria-label="More options"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name="more" size="m" color={colors.textSecondary} />
            </button>
            <div style={s.menuDropdown}>
              <Menu show={menuOpen} onClose={() => setMenuOpen(false)}>
                <Menu.Item onClick={() => { setMenuOpen(false); onEdit(); }}>Edit</Menu.Item>
                <Menu.Item onClick={() => setMenuOpen(false)}>Rename</Menu.Item>
                <Menu.Item onClick={() => setMenuOpen(false)}>Make a copy</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => setMenuOpen(false)}>Download</Menu.Item>
                <Menu.Item onClick={() => setMenuOpen(false)}>Present</Menu.Item>
                <Menu.Item onClick={() => setMenuOpen(false)}>Schedule</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => setMenuOpen(false)}>TML</Menu.Item>
                <Menu.Item onClick={() => setMenuOpen(false)}>Request verification</Menu.Item>
                <Menu.Divider />
                <Menu.Item danger onClick={() => setMenuOpen(false)}>Delete</Menu.Item>
              </Menu>
            </div>
          </div>
        </div>
      </header>

      {/* Row 2: Personalised view + Filters */}
      <div style={s.filterBar}>
        <div style={s.personalisedView}>
          <button style={s.viewSelector}>
            <span style={s.viewLabel}>Default view</span>
            <Icon name="chevron-down" size="s" color={colors.brand} />
          </button>
          <div style={s.vertSepShort} />
        </div>
        <div style={s.filterChips}>
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
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  headerOuter: {
    background: colors.headerBg,
    boxShadow: shadows.header,
    flexShrink: 0,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    height: layout.headerHeight,
    padding: '0 32px',
  },
  identifier: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 500,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    letterSpacing: -0.4,
    lineHeight: '28px',
    whiteSpace: 'nowrap' as const,
  },
  lixssBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    background: colors.actionPillBg,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    padding: 4,
    flexShrink: 0,
  },
  vertSep: {
    width: 1,
    height: 20,
    background: colors.divider,
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  tabBarWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    height: layout.headerHeight,
    overflow: 'hidden',
  },
  tabScroll: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    overflowX: 'auto',
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  },
  tabSequence: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  tab: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: layout.headerHeight,
    padding: '0 6px',
    fontSize: 14,
    fontWeight: 500,
    color: colors.textPrimary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    whiteSpace: 'nowrap' as const,
    lineHeight: '20px',
  },
  tabActive: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: layout.headerHeight,
    padding: '0 6px',
    fontSize: 16,
    fontWeight: 600,
    color: colors.textPrimary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily,
    whiteSpace: 'nowrap' as const,
    lineHeight: '24px',
    letterSpacing: -0.4,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: colors.brand,
    borderRadius: '3px 3px 0 0',
  },
  shifter: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: layout.headerHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.headerBg,
    border: 'none',
    cursor: 'pointer',
    zIndex: 2,
    borderRadius: 9,
    padding: 0,
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 32px',
  },
  personalisedView: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  viewSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: typography.fontFamily,
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: 375,
    color: colors.brand,
    lineHeight: '20px',
  },
  vertSepShort: {
    width: 1,
    height: 20,
    background: colors.divider,
    flexShrink: 0,
  },
  menuAnchor: {
    position: 'relative',
  },
  menuDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    zIndex: 200,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 6,
    padding: 0,
    color: colors.textSecondary,
  },
  filterChips: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap' as const,
  },
};
