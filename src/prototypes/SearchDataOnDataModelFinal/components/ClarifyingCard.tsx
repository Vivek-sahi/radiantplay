import React, { useState, useEffect } from 'react';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { fontWeight, fontFamily, fontSize } from '@tokens/typography';
import { Checkbox } from '@components/Checkbox';
import { TextInput } from '@components/TextInput';
import { Button } from '@components/Button';

export interface ClarifyOption {
  label: string;
}

export interface ClarifyQuestion {
  question: string;
  options: ClarifyOption[];
}

export interface ClarifyingCardProps {
  questions: ClarifyQuestion[];   // array of questions
  currentStep: number;            // 0-indexed
  onNext: (selections: string[], freeText?: string) => void;
  onCancel: () => void;
  onBack?: () => void;
}

export const ClarifyingCard: React.FC<ClarifyingCardProps> = ({
  questions,
  currentStep,
  onNext,
  onCancel,
  onBack,
}) => {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [freeTextChecked, setFreeTextChecked] = useState(false);
  const [freeText, setFreeText] = useState('');

  // Reset state when the step changes
  useEffect(() => {
    setChecked(new Set());
    setFreeTextChecked(false);
    setFreeText('');
  }, [currentStep]);

  const q = questions[currentStep];
  if (!q) return null;

  const totalSteps = questions.length;

  const toggleOption = (idx: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleNext = () => {
    // Selection is optional — empty selections = user is skipping this question
    const selections = Array.from(checked).map(i => q.options[i].label);
    onNext(selections, freeTextChecked && freeText.trim() ? freeText.trim() : undefined);
  };

  return (
    <div
      style={{
        backgroundColor: systemColors.light['background-base'],
        borderRadius: spacing.C,
        border: `1px solid ${systemColors.light['border-divider']}`,
        boxShadow: '0 4px 16px rgba(29,35,47,0.10)',
        fontFamily: fontFamily.primary,
        overflow: 'hidden',
        animation: 'slideUpIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
      }}
    >
      {/* Question header */}
      <div style={{ padding: `${spacing.D}px ${spacing.F}px` }}>
        <p style={{
          margin: 0,
          fontSize: fontSize.md,
          fontWeight: 600,
          lineHeight: '26px',
          color: systemColors.light['content-primary'],
        }}>
          {q.question}
        </p>
      </div>

      <div style={{ height: 1, backgroundColor: systemColors.light['border-divider'] }} />

      {/* Options */}
      <div>
        {q.options.map((opt, i) => (
          <div key={i}>
            <div
              onClick={() => toggleOption(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.C,
                padding: `0 ${spacing.F}px`,
                minHeight: 54,
                cursor: 'pointer',
                backgroundColor: checked.has(i)
                  ? '#EEF3FD'
                  : 'transparent',
                transition: 'background-color 0.12s',
              }}
              onMouseEnter={e => {
                if (!checked.has(i))
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    systemColors.light['background-sunken'];
              }}
              onMouseLeave={e => {
                if (!checked.has(i))
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {/* stopPropagation prevents double-toggle: without it, a click on the
                  Checkbox fires both its onChange AND bubbles to the row's onClick */}
              <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, display: 'flex' }}>
                <Checkbox
                  checked={checked.has(i)}
                  onChange={() => toggleOption(i)}
                />
              </div>
              <span style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.light,
                lineHeight: '22px',
                color: systemColors.light['content-primary'],
              }}>
                {opt.label}
              </span>
            </div>
            <div style={{ height: 1, backgroundColor: systemColors.light['border-divider'] }} />
          </div>
        ))}

        {/* Something else... */}
        <div>
          <div
            onClick={() => setFreeTextChecked(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.C,
              padding: `0 ${spacing.F}px`,
              minHeight: 54,
              cursor: 'pointer',
              backgroundColor: freeTextChecked
                ? '#EEF3FD'
                : 'transparent',
              transition: 'background-color 0.12s',
            }}
            onMouseEnter={e => {
              if (!freeTextChecked)
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  systemColors.light['background-sunken'];
            }}
            onMouseLeave={e => {
              if (!freeTextChecked)
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, display: 'flex' }}>
              <Checkbox
                checked={freeTextChecked}
                onChange={v => setFreeTextChecked(v)}
              />
            </div>
            <span style={{
              fontSize: fontSize.sm,
              fontWeight: fontWeight.light,
              lineHeight: '22px',
              color: freeTextChecked
                ? systemColors.light['content-primary']
                : systemColors.light['content-secondary'],
            }}>
              Something else…
            </span>
          </div>

          {/* Inline text input — appears when "Something else..." is checked */}
          {freeTextChecked && (
            <div
              style={{
                padding: `0 ${spacing.F}px ${spacing.D}px`,
                backgroundColor: '#EEF3FD',
                animation: 'slideUpIn 0.2s ease both',
              }}
            >
              <TextInput
                placeholder="Describe your goal…"
                value={freeText}
                onChange={e => setFreeText(e.target.value)}
                showLabel={false}
                autoFocus
              />
            </div>
          )}
          <div style={{ height: 1, backgroundColor: systemColors.light['border-divider'] }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing.C}px ${spacing.F}px`,
        backgroundColor: systemColors.light['background-sunken'],
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: fontWeight.light,
          color: systemColors.light['content-secondary'],
        }}>
          {currentStep + 1}/{totalSteps}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.C }}>
          <Button variant="secondary" onClick={currentStep > 0 && onBack ? onBack : onCancel}>
            {currentStep > 0 ? 'Back' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
          >
            {currentStep < totalSteps - 1 ? 'Next' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClarifyingCard;
