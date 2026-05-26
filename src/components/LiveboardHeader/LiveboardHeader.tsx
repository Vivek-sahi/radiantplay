import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '@components/BrandMark';
import { ViewHeader } from './ViewHeader';
import { EditToolbar } from './EditToolbar';
import { EditSubHeader } from './EditSubHeader';
import { colors, layout } from './styles';

export interface LiveboardHeaderProps {
  mode: 'view' | 'edit';
  title: string;
  activeTab: string;
  tabs: { label: string; id: string }[];
  filters: { label: string; value: string }[];
  onTabChange: (id: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleSpotter?: () => void;
  spotterOpen?: boolean;
}

// ThoughtSpot primary nav bar (dark, 60px). Clicking the brand mark returns
// to the playground gallery — matches the GlobalHeader default behavior.
const PrimaryNav: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={s.primaryNav}>
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Go to playground"
        style={s.logoBtn}
      >
        <BrandMark pixelSize={24} aria-hidden />
      </button>
    </div>
  );
};

export const LiveboardHeader: React.FC<LiveboardHeaderProps> = ({
  mode,
  title,
  activeTab,
  tabs,
  filters,
  onTabChange,
  onEdit,
  onSave,
  onCancel,
  onToggleSpotter,
  spotterOpen,
}) => {
  if (mode === 'view') {
    return (
      <>
        <PrimaryNav />
        <ViewHeader
          title={title}
          activeTab={activeTab}
          tabs={tabs}
          filters={filters}
          onTabChange={onTabChange}
          onEdit={onEdit}
        />
      </>
    );
  }

  return (
    <>
      <EditToolbar
        onSave={onSave}
        onCancel={onCancel}
        onToggleSpotter={onToggleSpotter}
        spotterOpen={spotterOpen}
      />
      <EditSubHeader
        title={title}
        activeTab={activeTab}
        tabs={tabs}
        filters={filters}
        onTabChange={onTabChange}
      />
    </>
  );
};

const s: Record<string, React.CSSProperties> = {
  primaryNav: {
    display: 'flex',
    alignItems: 'center',
    height: layout.headerHeight,
    padding: '0 24px',
    background: colors.editHeaderBg,
    color: colors.textOnDark,
    flexShrink: 0,
  },
  logoBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    borderRadius: 4,
  },
};
