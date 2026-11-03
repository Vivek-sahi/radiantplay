import React from 'react';
import { sysVar, compVar, shadowVar } from '@tokens/colors';

const font = 'var(--font-family-primary)';
const brand = sysVar('content-brand');

// ─── RdModal ───────────────────────────────────────────────────────────────────
// Standardised modal component for the Radiant design system.
//
// Sizes:  M1 = 394px  |  M2 = 788px  |  M3 = 1182px  |  M4 = 1350px
//
// Variants:
//   Simple  — just a title in the header (no eyebrow)
//   Eyebrow — small label above the title + optional stepper bar (up to 4 steps)
//
// Footer (M1/M2/M3 only — M4 never shows a footer):
//   [tertiary text link] ────────── [secondary pill]  [primary pill]
//   Pass onCancel/onConfirm to show those buttons. Both are optional.
//
// Spec:
//   Container  — border-radius: 6px, bg: background-base, shadow: shadow-modal
//   Header     — height: 68px, padding: 0 24px, border-bottom: 1px solid border-divider
//   Content    — padding: 24px, flex: 1, overflow-y: scroll
//   Stepper    — 3px bar, brand fill, max 4 steps, transition width 0.3s
//   Footer     — height: 72px, padding: 0 24px, bg: background-sunken, border-top: 1px solid border-divider

export type ModalSize = 'M1' | 'M2' | 'M3' | 'M4';

const WIDTHS: Record<ModalSize, number> = {
  M1: 394,
  M2: 788,
  M3: 1182,
  M4: 1350,
};

export interface RdModalProps {
  size: ModalSize;
  title: string;
  /** Eyebrow label shown above the title in small grey text. */
  eyebrow?: string;
  /** 1-based step number. Requires eyebrow + totalSteps to activate stepper. */
  currentStep?: number;
  /** Max 4 steps. */
  totalSteps?: number;
  /** Called when the backdrop or the M4 "Close" button is clicked. */
  onClose: () => void;

  // ── Footer actions (ignored for M4) ──────────────────────────────────────
  /** Left-side text link (tertiary action). */
  tertiaryLabel?: string;
  onTertiary?: () => void;
  /** Secondary pill button (e.g. Cancel / Back). */
  cancelLabel?: string;
  onCancel?: () => void;
  /** Primary pill button. */
  confirmLabel?: string;
  onConfirm?: () => void;

  children: React.ReactNode;
}

export const RdModal: React.FC<RdModalProps> = ({
  size,
  title,
  eyebrow,
  currentStep,
  totalSteps,
  onClose,
  tertiaryLabel,
  onTertiary,
  cancelLabel = 'Cancel',
  onCancel,
  confirmLabel = 'Save',
  onConfirm,
  children,
}) => {
  const isM4 = size === 'M4';
  const hasStepper =
    !!eyebrow &&
    currentStep !== undefined &&
    totalSteps !== undefined &&
    totalSteps > 0;
  const stepPercent = hasStepper
    ? Math.min((currentStep! / totalSteps!) * 100, 100)
    : 0;
  const hasFooter = !isM4 && !!(onCancel || onConfirm || tertiaryLabel);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: sysVar('background-overlay'),
        zIndex: 10001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: sysVar('background-base'),
          borderRadius: '6px',
          boxShadow: shadowVar('modal'),
          width: `${WIDTHS[size]}px`,
          maxWidth: '96vw',
          maxHeight: isM4 ? '90vh' : '85vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: font,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '68px',
            padding: '0 24px',
            borderBottom: `1px solid ${sysVar('border-divider')}`,
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div>
            {eyebrow && (
              <div
                style={{
                  fontSize: '12px', fontWeight: 500, color: sysVar('content-secondary'),
                  fontFamily: font, marginBottom: '4px',
                }}
              >
                {eyebrow}
              </div>
            )}
            <div
              style={{
                fontSize: isM4 ? '18px' : '17px',
                fontWeight: 700,
                color: sysVar('content-primary'),
                fontFamily: font,
              }}
            >
              {title}
            </div>
          </div>

          {/* M4 gets an inline "Close" link; other sizes close via backdrop click */}
          {isM4 && (
            <button
              onClick={onClose}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: '14px', fontWeight: 500,
                color: brand, padding: 0, flexShrink: 0,
              }}
            >
              Close
            </button>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {children}
        </div>

        {/* ── Stepper bar (eyebrow variant only) ── */}
        {hasStepper && (
          <div style={{ height: '3px', backgroundColor: sysVar('background-subtle'), flexShrink: 0 }}>
            <div
              style={{
                height: '100%',
                width: `${stepPercent}%`,
                backgroundColor: brand,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}

        {/* ── Footer ── */}
        {hasFooter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '72px',
              padding: '0 24px',
              backgroundColor: sysVar('background-sunken'),
              borderTop: `1px solid ${sysVar('border-divider')}`,
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {/* Tertiary — left side */}
            <div>
              {tertiaryLabel ? (
                <button
                  onClick={onTertiary}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontFamily: font, fontSize: '13.5px', fontWeight: 500,
                    color: sysVar('content-primary'), padding: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sysVar('content-brand'); }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = sysVar('content-primary'); }}
                >
                  {tertiaryLabel}
                </button>
              ) : <span />}
            </div>

            {/* Secondary + Primary — right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {onCancel && (
                <button
                  onClick={onCancel}
                  style={{
                    height: '36px', padding: '0 24px', borderRadius: '20px',
                    border: 'none',
                    backgroundColor: compVar('button-secondary-default'),
                    cursor: 'pointer', fontFamily: font, fontSize: '13.5px',
                    fontWeight: 500, color: sysVar('content-primary'), transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.82'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  {cancelLabel}
                </button>
              )}
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  style={{
                    height: '36px', padding: '0 24px', borderRadius: '20px',
                    border: 'none', backgroundColor: compVar('button-primary-default'),
                    cursor: 'pointer', fontFamily: font, fontSize: '13.5px',
                    fontWeight: 'var(--font-weight-emphasis)', color: compVar('button-primary-on-color-default'), transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RdModal;
