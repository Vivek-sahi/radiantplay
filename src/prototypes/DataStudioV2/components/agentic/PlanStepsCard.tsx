import React from 'react';
import { Button } from '@components/Button';
import { spacing } from '@tokens/spacing';
import { systemColors } from '@tokens/colors';
import { fontWeight } from '@tokens/typography';
import { ReasoningBlock } from './ReasoningBlock';
import styles from './PlanStepsCard.module.css';
import type { PlanStepsData } from './types';

interface PlanStepsCardProps {
  data: PlanStepsData;
  showBuildCta?: boolean;
  onBuild?: () => void;
  isCollapsed?: boolean;
  isDisabled?: boolean;
  versionNum?: number;
  onToggleCollapse?: () => void;
}

export const PlanStepsCard: React.FC<PlanStepsCardProps> = ({
  data,
  showBuildCta,
  onBuild,
  isCollapsed,
  isDisabled,
  versionNum,
  onToggleCollapse,
}) => {
  // ── Collapsed view — version badge + title + phase count + chevron ──────────
  if (isCollapsed) {
    const doneCount = data.steps.filter(s => s.state === 'done').length;
    return (
      <div
        onClick={onToggleCollapse}
        style={{
          borderRadius: spacing.C,
          backgroundColor: systemColors.light['background-base'],
          border: `1px solid ${systemColors.light['border-divider']}`,
          cursor: 'pointer',
        }}
      >
        <div style={{ padding: `${spacing.C}px ${spacing.D}px ${spacing.D}px` }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: spacing.B, marginBottom: spacing.A,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.B, flex: 1, minWidth: 0 }}>
              {versionNum && (
                <span style={{
                  flexShrink: 0,
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                  padding: '1px 6px', borderRadius: 100,
                  backgroundColor: systemColors.light['background-information'],
                  color: systemColors.light['content-brand'],
                  border: `1px solid ${systemColors.light['content-brand']}`,
                }}>
                  v{versionNum}
                </span>
              )}
              <span style={{
                fontSize: 15, fontWeight: 700, lineHeight: '22px',
                color: systemColors.light['content-primary'],
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                Build plan
              </span>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 4 }}>
              <path d="M2 4l4 4 4-4" stroke={systemColors.light['content-tertiary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{
            margin: 0, padding: 0,
            fontSize: 12, fontWeight: fontWeight.light, lineHeight: '18px',
            color: systemColors.light['content-secondary'],
          }}>
            {doneCount} of {data.steps.length} phases completed
          </p>
        </div>
      </div>
    );
  }

  // ── Expanded view ─────────────────────────────────────────────────────────
  return (
    <div className={styles.card}>
      {/* Version badge row (only when versioned) */}
      {versionNum && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${spacing.C}px ${spacing.D}px`,
          borderBottom: `1px solid ${systemColors.light['border-divider']}`,
          backgroundColor: systemColors.light['background-sunken'],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.B }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: systemColors.light['content-brand'],
            }}>
              Build plan
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
              padding: '1px 6px', borderRadius: 100,
              backgroundColor: systemColors.light['background-information'],
              color: systemColors.light['content-brand'],
              border: `1px solid ${systemColors.light['content-brand']}`,
            }}>
              v{versionNum}
            </span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.A, display: 'flex', alignItems: 'center' }}
              title="Collapse"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 8l4-4 4 4" stroke={systemColors.light['content-tertiary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Body: steps — dimmed when superseded by a newer plan */}
      <div className={styles.body} style={isDisabled ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>
        <div className={styles.steps}>
          {data.steps.map((step, i) => (
            <div key={i} className={styles.step} style={{ opacity: step.state === 'pending' ? 0.45 : 1 }}>
              <div className={styles.iconSlot}>
                {step.state === 'active' ? (
                  // Arc spinner: r=7.5, circ≈47.12; dasharray 12/35 ≈ quarter arc
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className={styles.spinner}>
                    <circle cx="9" cy="9" r="7.5" stroke="var(--rd-sys-color-border-default)" strokeWidth="2" />
                    <circle cx="9" cy="9" r="7.5" stroke="var(--rd-sys-color-content-brand)" strokeWidth="2" strokeDasharray="12 35.12" strokeLinecap="round" transform="rotate(-90 9 9)" />
                  </svg>
                ) : step.state === 'done' ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <circle cx="9" cy="9" r="9" fill="var(--rd-sys-color-content-success)" />
                    <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <circle cx="9" cy="9" r="8" stroke="var(--rd-sys-color-border-default)" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
              <div className={styles.info}>
                <span className={[styles.label, styles[step.state]].join(' ')}>
                  {step.label}
                </span>
                {step.caption && (
                  <span className={styles.caption}>{step.caption}</span>
                )}
                {step.reasoningData && (
                  <div style={{ marginTop: spacing.B }}>
                    <ReasoningBlock data={step.reasoningData} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showBuildCta && (
        <div className={styles.ctaFooter}>
          <Button variant="primary" onClick={onBuild} fullWidth>
            Build model
          </Button>
        </div>
      )}
    </div>
  );
};
