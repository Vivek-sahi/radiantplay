import React from 'react';
import { RdModal } from '../../../components/RdModal';
import { Horizontal, Vertical } from '../../../components/Layout';
import { Radio } from '../../../components/Radio';
import { c, sp, ts, text } from '../styles';
import { radius } from '@tokens/radius';
import { Icon } from '@components/icons';

/**
 * Old canvas vs new canvas — the last step before the canvas opens.
 *
 * ⚠️ **Why this is here and not in the `+` menu.** The choice used to be a nav submenu
 * (`+ → Model → Old canvas / New canvas`), where the user has no context to choose with —
 * they haven't yet said what kind of model they want, and "old" and "new" mean nothing on
 * their own. It now opens **after** the model type and **after** the connection: the
 * connection is a property of the model whichever canvas you use, so it can be answered
 * first, which leaves the canvas choice as the last thing before you land on one.
 *
 * It is a **radio group**, not two clickable panels — one of the two is always chosen, and
 * Continue acts on it. Arrow keys move between the cards, space selects.
 *
 * ⚠️ **Do not wrap text in `<View>`.** `View` is `display: flex` with row direction, not a
 * generic div — a text node inside one becomes a flex item. Plain `<div>` for text,
 * `Vertical` / `Horizontal` for layout.
 *
 * ⚠️ **Screenshots and feature copy are placeholders.** The frames are labelled as such
 * rather than faked, so nobody reads a grey box as a real screen. Replace both when the
 * assets and the product copy exist.
 */

export interface CanvasChoiceModalProps {
  onClose: () => void;
  /** Returns to Select connection, the step before this one. */
  onBack: () => void;
  /** Chosen: the new canvas. */
  onChooseNew: () => void;
  /** Chosen: the existing canvas. */
  onChooseOld: () => void;
}

type ChoiceId = 'new' | 'old';

interface ChoiceCard {
  id: ChoiceId;
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
      'Preview your data as you build',
      'Spreadsheet view for exploring',
      'Formulas and filters on the model',
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

const CanvasChoiceModal: React.FC<CanvasChoiceModalProps> = ({ onClose, onBack, onChooseNew, onChooseOld }) => {
  const [selected, setSelected] = React.useState<ChoiceId>('new');

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); setSelected('old'); }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key))    { e.preventDefault(); setSelected('new'); }
  };

  return (
    <RdModal
      size="M2"
      title="Choose how to build your model"
      onClose={onClose}
      /* Back, not Cancel — this is the last of several steps, and the one before it
         is a choice the user may well want to revisit. Escape and the close control
         are still how you leave the flow entirely. */
      cancelLabel="Back"
      onCancel={onBack}
      confirmLabel="Continue"
      onConfirm={() => (selected === 'new' ? onChooseNew() : onChooseOld())}
    >
      <Vertical gap={sp.D}>
        <div style={{ ...text(ts.footnote), color: c['content-secondary'] }}>
          Both build a model on the connection you picked. You can’t switch a model between
          them afterwards.
        </div>

        <div
          role="radiogroup"
          aria-label="Canvas"
          onKeyDown={onKeyDown}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: sp.D }}
        >
          {CARDS.map(card => {
            const isSelected = selected === card.id;
            return (
              <div
                key={card.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSelected(card.id)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setSelected(card.id); } }}
                className="dsmvp-choice-card"
                style={{
                  display: 'flex', flexDirection: 'column', gap: sp.C,
                  padding: sp.D,
                  border: `1px solid ${isSelected ? c['border-brand'] : c['border-default']}`,
                  boxShadow: isSelected ? `0 0 0 1px ${c['border-brand']}` : 'none',
                  borderRadius: radius.lg,
                  background: isSelected ? c['background-information'] : c['background-base'],
                  cursor: 'pointer',
                  transition: 'border-color 120ms, box-shadow 120ms, background 120ms',
                }}
              >
                {/* Header — the control, the name, and the recommendation, in that order */}
                <Horizontal gap={sp.B} align="center">
                  <div style={{ flexShrink: 0, display: 'flex', pointerEvents: 'none' }}>
                    <Radio checked={isSelected} showLabel={false} value={card.id} />
                  </div>
                  <div style={{ ...text(ts.contentLabelSubhead), color: c['content-primary'], flex: 1, minWidth: 0 }}>
                    {card.title}
                  </div>
                  {card.recommended && (
                    <div style={{
                      ...text(ts.caption),
                      flexShrink: 0,
                      color: c['content-brand'],
                      background: c['background-base'],
                      border: `1px solid ${c['border-brand']}`,
                      borderRadius: radius.sm,
                      padding: `0 ${sp.B}px`,
                      whiteSpace: 'nowrap',
                    }}>Recommended</div>
                  )}
                </Horizontal>

                {/* Visual of the canvas. A labelled placeholder, not a fake screen. */}
                <div style={{
                  aspectRatio: '16 / 9', width: '100%',
                  border: `1px dashed ${c['border-default']}`, borderRadius: radius.md,
                  background: c['background-subtle'],
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: sp.A, color: c['content-tertiary'],
                }}>
                  <Icon name="table" size="m" color="currentColor" />
                  <div style={{ ...text(ts.caption), color: c['content-tertiary'] }}>Screenshot placeholder</div>
                </div>

                <div style={{ ...text(ts.footnote), color: c['content-secondary'] }}>{card.blurb}</div>

                <Vertical gap={sp.A}>
                  {card.features.map(f => (
                    <Horizontal key={f} gap={sp.B} align="start">
                      <div style={{ flexShrink: 0, display: 'flex', marginTop: 2, color: c['content-success'] }}>
                        <Icon name="checkmark" size="xs" color="currentColor" />
                      </div>
                      <div style={{ ...text(ts.caption), color: c['content-primary'] }}>{f}</div>
                    </Horizontal>
                  ))}
                </Vertical>
              </div>
            );
          })}
        </div>
      </Vertical>

      <style>{`
        .dsmvp-choice-card:hover[aria-checked="false"] { border-color: ${c['border-hover']}; }
        .dsmvp-choice-card:focus-visible { outline: 2px solid ${c['border-focus']}; outline-offset: 2px; }
      `}</style>
    </RdModal>
  );
};

export default CanvasChoiceModal;
