/**
 * "Select a data modelling option" — the modal behind `+ → Model → Old canvas`.
 *
 * Ported from `surajboro-ts/spotter-readiness-vision`
 * (`OneClickModelGenerationHandoff/ModelSelectionModal`), and now an unmodified
 * copy of it: his five options, his copy, his icons, his order, his default
 * selection, and "Build your own model" keeping its gradient border and
 * SpotterModel pill.
 *
 * Our canvas used to sit here as a sixth "Multi source model" card. It doesn't
 * any more — the canvas is reached from `+ → Model → New canvas` instead, so a
 * card here would have been a second door to the same room.
 *
 * Everything in this modal is inert, and honestly so: these are the classic
 * ("old canvas") build paths, which this prototype doesn't implement.
 */
import React, { useState } from 'react';
import { RdModal } from '../../../components/RdModal';
import { Card } from '../../../components/Card';
import { Icon } from '../../../components/icons';
import { systemColors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';
import { fontSize, fontWeight } from '../../../tokens/typography';

type CardId = 'build' | 'semantic' | 'dbt' | 'tml' | 'datasets';

interface OptionCardConfig {
  id: CardId;
  title: string;
  subtitle: string;
  iconName: string;
  /** Illustration tints — product-level brand colours with no Radiant token equivalent. */
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

/**
 * "SpotterModel powered" badge, flush in the bottom-left of the card surface.
 * Animated conic-gradient border when selected, plain border when not — top and
 * right edges only, so the left and bottom sit flush with the card.
 */
const SpotterPoweredPill: React.FC<{ isSelected?: boolean }> = ({ isSelected = false }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      zIndex: 2,
      borderRadius: '0 14px 0 0',
      overflow: 'hidden',
      padding: isSelected ? '1.5px 1.5px 0 0' : '1px 1px 0 0',
      display: 'inline-flex',
    }}
  >
    {isSelected ? (
      <div
        style={{
          position: 'absolute',
          width: 300, height: 300, top: '50%', left: '50%', marginTop: -150, marginLeft: -150,
          background: 'conic-gradient(from 0deg, #8C62F5, #48D1E0, #2770EF, #8C62F5)',
          animation: 'spotter-border-spin 3s linear infinite',
        }}
      />
    ) : (
      <div style={{ position: 'absolute', inset: 0, backgroundColor: systemColors.light['border-default'] }} />
    )}
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: systemColors.light['background-base'],
        borderRadius: '0 12px 0 0',
        padding: `8px ${spacing.F}px 8px ${spacing.D}px`,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.B,
        fontSize: 12,
        fontWeight: fontWeight.medium,
        color: systemColors.light['content-primary'],
        whiteSpace: 'nowrap',
      }}
    >
      <img src="/spotter-assets/SpotterModel avatar.svg" width={24} height={24} alt="SpotterModel" />
      SpotterModel powered
    </div>
  </div>
);

export interface CreateModelModalProps {
  onClose: () => void;
  /**
   * Next pressed with **Build your own model** selected.
   *
   * Only this one option continues anywhere — it hands off to the old-vs-new canvas
   * choice. Every other path here (semantic layer, dbt, TML, datasets) is a classic build
   * path this prototype doesn't implement and stays exactly as it was, closing on Next.
   * Optional, so Suraj's modal keeps its original behaviour wherever it isn't passed.
   */
  onBuildOwn?: () => void;
}

const CreateModelModal: React.FC<CreateModelModalProps> = ({ onClose, onBuildOwn }) => {
  // 'build' is Suraj's own default — restored now that our card is gone.
  const [selectedCard, setSelectedCard] = useState<CardId>('build');
  const [hovered, setHovered] = useState<CardId | null>(null);

  // **Build your own model** continues to the canvas choice. Every other option is a
  // classic build path this prototype doesn't implement, so Next closes rather than doing
  // nothing at all — a primary button that swallows the click reads as broken, where
  // closing reads as "nothing to do here yet".
  const handleNext = () => {
    if (selectedCard === 'build' && onBuildOwn) { onBuildOwn(); return; }
    onClose();
  };

  const cardContent = (card: OptionCardConfig) => (
    <div style={{ display: 'flex', gap: `${spacing.F}px`, alignItems: 'flex-start', padding: `${spacing.D}px`, height: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          width: spacing.K, height: spacing.K, borderRadius: 4,
          backgroundColor: card.iconBg, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={card.iconName as never} size="l" color={card.iconColor} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.A}px`, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: fontSize.md, fontWeight: fontWeight.medium, color: systemColors.light['content-brand'], lineHeight: '24px' }}>
          {card.title}
        </span>
        <span style={{ fontSize: fontSize.xs, color: systemColors.light['content-secondary'], lineHeight: '18px' }}>
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
      <style>{`@keyframes spotter-border-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${spacing.F}px`, height: 552, alignContent: 'start', overflowY: 'auto' }}>
        {CARDS.map(card => {
          const isSelected = selectedCard === card.id;

          // His "Build your own model" card — custom rendering, gradient border when
          // selected, SpotterModel pill always. Left exactly as he had it.
          if (card.id === 'build') {
            return (
              <div
                key={card.id}
                style={{ position: 'relative' }}
                onClick={() => setSelectedCard('build')}
                onMouseEnter={() => setHovered('build')}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  style={{
                    position: 'relative', borderRadius: 9, overflow: 'hidden', padding: 2,
                    height: 168, cursor: 'pointer',
                    ...(isSelected ? {} : {
                      boxShadow: `inset 0 0 0 1px ${hovered === 'build'
                        ? systemColors.light['border-brand']
                        : systemColors.light['border-default']}`,
                      transition: 'box-shadow 0.15s',
                    }),
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        width: 700, height: 700, top: '50%', left: '50%', marginTop: -350, marginLeft: -350,
                        background: 'conic-gradient(from 0deg, #8C62F5, #48D1E0, #2770EF, #8C62F5)',
                        animation: 'spotter-border-spin 3s linear infinite',
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: 'relative', zIndex: 1,
                      backgroundColor: isSelected ? systemColors.light['background-sunken'] : '#fff',
                      borderRadius: 7, height: '100%', overflow: 'hidden',
                    }}
                  >
                    {cardContent(card)}
                    <SpotterPoweredPill isSelected={isSelected} />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Card
              key={card.id}
              interactive
              isSelected={isSelected}
              data={card.id}
              onClick={id => setSelectedCard(id as CardId)}
              style={{
                height: 168,
                ...(isSelected
                  ? {
                      borderColor: systemColors.light['border-brand'],
                      boxShadow: `0 0 0 1px ${systemColors.light['border-focus']}`,
                      backgroundColor: systemColors.light['background-sunken'],
                    }
                  : { boxShadow: 'none' }),
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

export default CreateModelModal;
