import React, { useState } from 'react';
import { RdModal } from '@components/RdModal';
import { Card } from '@components/Card';
import { Icon } from '@components/icons';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { fontSize, fontWeight } from '@tokens/typography';

type CardId = 'build' | 'semantic' | 'dbt' | 'tml' | 'datasets';

interface OptionCardConfig {
  id: CardId;
  title: string;
  subtitle: string;
  iconName: string;
  // Hardcoded illustration tints — product-level brand colours with no Radiant token equivalent
  iconBg: string;
  iconColor: string;
}

const CARDS: OptionCardConfig[] = [
  {
    id: 'build',
    title: 'Build your own model',
    subtitle: 'Connect your source for search and automated insight creation.',
    iconName: 'database',
    iconBg: '#abc7f9',
    iconColor: '#2770EF',
  },
  {
    id: 'semantic',
    title: 'Import semantic layer',
    subtitle: "Leverage semantic modelling that you've already done to build your model quickly.",
    iconName: 'download',
    iconBg: '#ffccb3',
    iconColor: '#FF8142',
  },
  {
    id: 'dbt',
    title: 'Connect with dbt',
    subtitle: 'Transform your existing dbt models into ThoughtSpot models with ease.',
    iconName: 'schema',
    iconBg: '#fcd4d7',
    iconColor: '#FF694A',
  },
  {
    id: 'tml',
    title: 'Migrate with TML',
    subtitle: 'Use ThoughtSpot Modelling Language (TML) to migrate your content without recreating your model.',
    iconName: 'chart',
    iconBg: '#fde9af',
    iconColor: '#FCC838',
  },
  {
    id: 'datasets',
    title: 'Use ThoughtSpot datasets',
    subtitle: 'Jumpstart your model with datasets already published in Analyst Studio.',
    iconName: 'collection',
    iconBg: '#d1c0fb',
    iconColor: '#8C62F5',
  },
];

export interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
}

export const ModelSelectionModal: React.FC<ModelSelectionModalProps> = ({
  isOpen,
  onClose,
  onNext,
}) => {
  const [selectedCard, setSelectedCard] = useState<CardId | null>('build');
  const [buildHovered, setBuildHovered] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (selectedCard === 'build') {
      onNext();
    }
  };

  const cardContent = (card: OptionCardConfig) => (
    <div
      style={{
        display: 'flex',
        gap: `${spacing.F}px`,
        alignItems: 'flex-start',
        padding: `${spacing.D}px`,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: spacing.K,
          height: spacing.K,
          borderRadius: 4,
          backgroundColor: card.iconBg,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={card.iconName as any} size="l" color={card.iconColor} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.A}px`, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.medium,
            color: systemColors.light['content-brand'],
            lineHeight: '24px',
          }}
        >
          {card.title}
        </span>
        <span
          style={{
            fontSize: fontSize.xs,
            color: systemColors.light['content-secondary'],
            lineHeight: '18px',
          }}
        >
          {card.subtitle}
        </span>
      </div>
    </div>
  );

  return (
    <RdModal
      size="M2"
      title="Select a data modelling option"
      onClose={onClose}
      cancelLabel="Cancel"
      onCancel={onClose}
      confirmLabel="Next"
      onConfirm={handleNext}
    >
      {/* Keyframes for the rotating gradient border on the build card */}
      <style>{`
        @keyframes spotter-border-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* 552 = 3 card rows (168) + 2 gaps (24), so all five cards fit without
          scrolling. This sits inside RdModal's 24px content padding, so the
          body measures 600 — ConnectionSelectionScreen negates that padding
          and declares 600 outright, keeping both modals the same height. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `${spacing.F}px`,
          height: 552,
          alignContent: 'start',
          overflowY: 'auto',
        }}
      >
        {CARDS.map((card) => {
          const isSelected = selectedCard === card.id;

          // ── Build card — custom rendering with gradient border + AI pill ──
          if (card.id === 'build') {
            return (
              <div
                key={card.id}
                style={{ position: 'relative' }}
                onClick={() => setSelectedCard('build')}
                onMouseEnter={() => setBuildHovered(true)}
                onMouseLeave={() => setBuildHovered(false)}
              >
                {/* Outer wrapper — provides the border (gradient when selected, inset shadow when not) */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 9,
                    overflow: 'hidden',
                    padding: 2,
                    height: 168,
                    cursor: 'pointer',
                    ...(isSelected ? {} : {
                      boxShadow: `inset 0 0 0 1px ${buildHovered
                        ? systemColors.light['border-brand']
                        : systemColors.light['border-default']}`,
                      transition: 'box-shadow 0.15s',
                    }),
                  }}
                >
                  {/* Spinning gradient — only rendered when selected */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        width: 700,
                        height: 700,
                        top: '50%',
                        left: '50%',
                        marginTop: -350,
                        marginLeft: -350,
                        background: 'conic-gradient(from 0deg, #8C62F5, #48D1E0, #2770EF, #8C62F5)',
                        animation: 'spotter-border-spin 3s linear infinite',
                      }}
                    />
                  )}
                  {/* Inner card surface — identical in both states; pill always anchors here */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      backgroundColor: isSelected ? '#EEF3FD' : '#fff',
                      borderRadius: 7,
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    {cardContent(card)}
                  </div>
                </div>
              </div>
            );
          }

          // ── All other cards — standard Card component ──
          return (
            <Card
              key={card.id}
              interactive
              isSelected={isSelected}
              data={card.id}
              onClick={(id) => setSelectedCard(id as CardId)}
              style={{
                height: 168,
                ...(isSelected ? {
                  borderColor: systemColors.light['border-brand'],
                  boxShadow: `0 0 0 1px ${systemColors.light['border-focus']}`,
                  backgroundColor: '#EEF3FD',
                } : {
                  boxShadow: 'none',
                }),
              }}
            >
              {cardContent(card)}
            </Card>
          );
        })}
      </div>
    </RdModal>
  );
};

export default ModelSelectionModal;
