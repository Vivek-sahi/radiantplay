import React from 'react';
import { RdModal } from '../../../components/RdModal';
import { systemColors } from '@tokens/colors';
import { spacing as sp } from '@tokens/spacing';
import { fontFamily as ff, fontSize as fs, fontWeight as fw } from '@tokens/typography';
import { radius } from '@tokens/radius';
import { Icon } from '@components/icons';

/**
 * Old canvas vs new canvas — the second step of the entry flow.
 *
 * ⚠️ **Why this is here and not in the `+` menu.** The choice used to be a nav submenu
 * (`+ → Model → Old canvas / New canvas`), where the user has no context to choose with —
 * they haven't yet said what kind of model they want, and "old" and "new" mean nothing on
 * their own. It now opens **after** the model-type modal, and **only for "Build your own
 * model"**: every other path in that modal (dbt, TML, semantic layer, datasets) goes
 * straight through, unchanged.
 *
 * Each side is a card carrying a title, a visual of the canvas, and the two or three
 * features that actually distinguish it — because that is the only thing that makes the
 * choice answerable.
 *
 * ⚠️ **Screenshots and feature copy are placeholders.** The frames are labelled as such
 * rather than faked, so nobody reads a grey box as a real screen. Replace both when the
 * assets and the product copy exist.
 */

const c = systemColors.light;

export interface CanvasChoiceModalProps {
  onClose: () => void;
  /** Chosen: the new multi-source canvas. */
  onChooseNew: () => void;
  /** Chosen: the existing canvas. */
  onChooseOld: () => void;
}

interface ChoiceCard {
  id: 'new' | 'old';
  title: string;
  blurb: string;
  features: string[];
  recommended?: boolean;
}

const CARDS: ChoiceCard[] = [
  {
    id: 'new',
    title: 'New canvas',
    blurb: 'Placeholder — describe the new canvas here.',
    features: [
      'Model across multiple sources',
      'Preview your data as you build',
      'Spreadsheet view for exploring',
    ],
    recommended: true,
  },
  {
    id: 'old',
    title: 'Old canvas',
    blurb: 'Placeholder — describe the existing canvas here.',
    features: [
      'Placeholder feature',
      'Placeholder feature',
    ],
  },
];

const CanvasChoiceModal: React.FC<CanvasChoiceModalProps> = ({ onClose, onChooseNew, onChooseOld }) => {
  const [selected, setSelected] = React.useState<'new' | 'old'>('new');

  return (
    <RdModal
      size="M2"
      title="Choose how to build your model"
      onClose={onClose}
      cancelLabel="Cancel"
      onCancel={onClose}
      confirmLabel="Continue"
      onConfirm={() => (selected === 'new' ? onChooseNew() : onChooseOld())}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: sp.D }}>
        {CARDS.map(card => {
          const isSelected = selected === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setSelected(card.id)}
              style={{
                display: 'flex', flexDirection: 'column', gap: sp.C,
                padding: sp.D,
                border: `1px solid ${isSelected ? c['border-brand'] : c['border-default']}`,
                boxShadow: isSelected ? `0 0 0 1px ${c['border-brand']}` : 'none',
                borderRadius: radius.lg,
                background: isSelected ? c['background-sunken'] : c['background-base'],
                cursor: 'pointer',
                transition: 'border-color 120ms, box-shadow 120ms, background 120ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>
                  {card.title}
                </span>
                {card.recommended && (
                  <span style={{
                    fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-brand'],
                    border: `1px solid ${c['border-brand']}`, borderRadius: radius.sm,
                    padding: '0 6px', lineHeight: '18px',
                  }}>Recommended</span>
                )}
              </div>

              {/* Visual of the canvas. A labelled placeholder, not a fake screen. */}
              <div style={{
                aspectRatio: '16 / 9', width: '100%',
                border: `1px dashed ${c['border-default']}`, borderRadius: radius.md,
                background: c['background-subtle'],
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.A,
                color: c['content-tertiary'],
              }}>
                <Icon name="table" size="m" color="currentColor" />
                <span style={{ fontSize: fs.xs, fontFamily: ff.primary }}>Screenshot placeholder</span>
              </div>

              <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5 }}>
                {card.blurb}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
                {card.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
                    <span style={{ flexShrink: 0, display: 'flex', marginTop: 2, color: c['content-success'] }}>
                      <Icon name="checkmark" size="xs" color="currentColor" />
                    </span>
                    <span style={{ fontSize: fs.xs, color: c['content-primary'], lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </RdModal>
  );
};

export default CanvasChoiceModal;
