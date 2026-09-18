/**
 * DirectionCard — Model Requirements Document card.
 *
 * Shared between the full-screen onboarding chat and the DME AgentPanel
 * (where it appears in read-only history). isLatest=false removes the
 * Build model button; the card stays fully expandable/collapsible.
 */
import React from 'react';
import { fontFamily, fontWeight } from '@tokens/typography';
import { systemColors } from '@tokens/colors';
import { spacing } from '@tokens/spacing';
import { Button } from '@components/Button';
import type { DataConnection } from '../data/mockData';

// ─── Direction interface ───────────────────────────────────────────────────────

export interface Direction {
  id: string;
  title: string;
  description: string;        // short subtitle
  goal: string;               // "What you asked for" prose
  keyQuestions: string[];     // "Questions you'll be able to answer"
  linkedConcepts: string[];   // concept chain in "What I understood"
  understoodPoints: string[]; // bullet list in "What I understood"
  addedSections: Array<{ label: string; items: string[] }>; // "What I added" sub-sections
  guardrails: string[];       // appended as the last "Guardrails" sub-section
  docHtml: string;            // full HTML doc for the canvas panel
}

// ─── DirectionCard ─────────────────────────────────────────────────────────────

export function DirectionCard({
  direction,
  connection,
  version,
  isCollapsed = false,
  isLatest = true,
  onBuild,
  onToggleCollapse,
  onOpenCanvas: _onOpenCanvas,  // hidden — uncomment Open doc button below to use
}: {
  direction: Direction;
  connection: DataConnection;
  version: number;
  isCollapsed?: boolean;
  isLatest?: boolean;
  onBuild: () => void;
  onToggleCollapse?: () => void;
  onOpenCanvas: () => void;
}) {
  const [addedExpanded, setAddedExpanded] = React.useState(false);

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      margin: `0 0 ${spacing.C}px`,
      fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      color: systemColors.light['content-secondary'],
    }}>
      {children}
    </p>
  );

  const BulletList = ({ items }: { items: string[] }) => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.B, fontSize: 13, lineHeight: '19px', color: systemColors.light['content-secondary'], fontWeight: fontWeight.light }}>
          <span style={{
            flexShrink: 0, marginTop: 5, width: 4, height: 4, borderRadius: '50%',
            backgroundColor: systemColors.light['content-tertiary'],
            display: 'inline-block',
          }} />
          {item}
        </li>
      ))}
    </ul>
  );

  const Divider = () => (
    <div style={{ height: 1, background: systemColors.light['border-divider'] }} />
  );

  const SubSectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{
      margin: `0 0 ${spacing.B}px`,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color: systemColors.light['content-secondary'],
      opacity: 0.7,
    }}>
      {children}
    </p>
  );

  // Snowflake SVG icon — #29B5E8 is Snowflake's official brand color, no Radiant token maps to it
  const SNOWFLAKE_BRAND = '#29B5E8';
  const SnowflakeIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M12 2v20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3" stroke={SNOWFLAKE_BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12h20M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3" stroke={SNOWFLAKE_BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.636 5.636l12.728 12.728M5.636 5.636l1.06 3.889M5.636 5.636l3.889 1.06M18.364 18.364l-1.06-3.889M18.364 18.364l-3.889-1.06" stroke={SNOWFLAKE_BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.364 5.636L5.636 18.364M18.364 5.636l-3.889 1.06M18.364 5.636l-1.06 3.889M5.636 18.364l3.889-1.06M5.636 18.364l1.06-3.889" stroke={SNOWFLAKE_BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // ── Collapsed view — version badge inline with title, expand chevron ──────────
  if (isCollapsed) {
    return (
      <div
        style={{
          borderRadius: spacing.C,
          backgroundColor: systemColors.light['background-base'],
          border: `1px solid ${systemColors.light['border-divider']}`,
          cursor: 'pointer',
        }}
        onClick={onToggleCollapse}
      >
        <div style={{ padding: `${spacing.C}px ${spacing.D}px ${spacing.D}px` }}>
          {/* Title row: version badge + title + expand chevron */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: spacing.B, marginBottom: spacing.A,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.B, flex: 1, minWidth: 0 }}>
              <span style={{
                flexShrink: 0,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                padding: '1px 6px', borderRadius: 100,
                backgroundColor: systemColors.light['background-information'],
                color: systemColors.light['content-brand'],
                border: `1px solid ${systemColors.light['content-brand']}`,
              }}>
                v{version}
              </span>
              <h2 style={{
                margin: 0, padding: 0,
                fontSize: 15, fontWeight: 700, lineHeight: '22px',
                color: systemColors.light['content-primary'],
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {direction.title}
              </h2>
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
            {direction.description}
          </p>
        </div>
      </div>
    );
  }

  // ── Full (expanded) view ───────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: spacing.C, overflow: 'hidden',
      backgroundColor: systemColors.light['background-base'],
      border: `1px solid ${systemColors.light['border-divider']}`,
    }}>
      {/* ── Header block ── */}
      <div style={{
        backgroundColor: systemColors.light['background-sunken'],
        borderBottom: `1.5px solid ${systemColors.light['border-divider']}`,
      }}>
        {/* Top strip: MODEL REQUIREMENT label + version badge | connection chip + collapse chevron */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${spacing.C}px ${spacing.D}px`,
          borderBottom: `1px solid ${systemColors.light['border-divider']}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.B }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              backgroundColor: systemColors.light['content-brand'],
            }} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: systemColors.light['content-brand'],
            }}>
              Model requirement
            </span>
            {/* Version badge — always blue border */}
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
              padding: '1px 6px', borderRadius: 100,
              backgroundColor: systemColors.light['background-information'],
              color: systemColors.light['content-brand'],
              border: `1px solid ${systemColors.light['content-brand']}`,
            }}>
              {isLatest ? `v${version} · Latest` : `v${version}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.C }}>
            {/* Connection chip */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: spacing.B,
              backgroundColor: systemColors.light['background-base'],
              borderRadius: 100, padding: '3px 10px',
              border: `1px solid ${systemColors.light['border-divider']}`,
            }}>
              <SnowflakeIcon />
              <span style={{ fontSize: 12, fontWeight: 500, color: systemColors.light['content-secondary'] }}>
                {connection.name}
              </span>
            </div>
            {/* Collapse chevron — only on non-latest expanded cards */}
            {!isLatest && (
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
        </div>

        {/* Title + description */}
        <div style={{ padding: `${spacing.C}px ${spacing.D}px ${spacing.D}px`, display: 'flex', flexDirection: 'column', gap: spacing.B }}>
          <h2 style={{
            margin: 0, padding: 0,
            fontSize: 17, fontWeight: 700, lineHeight: '24px',
            color: systemColors.light['content-primary'],
          }}>
            {direction.title}
          </h2>
          <p style={{
            margin: 0, padding: 0,
            fontSize: 12, fontWeight: fontWeight.light, lineHeight: '18px',
            color: systemColors.light['content-secondary'],
          }}>
            {direction.description}
          </p>
        </div>
      </div>

      {/* ── What you asked for ── */}
      <div style={{ padding: `${spacing.D}px` }}>
        <SectionLabel>What you asked for</SectionLabel>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: fontWeight.light,
          lineHeight: '20px', color: systemColors.light['content-primary'],
        }}>
          {direction.goal}
        </p>
      </div>

      <Divider />

      {/* ── Questions you'll be able to answer ── */}
      <div style={{ padding: `${spacing.D}px` }}>
        <SectionLabel>Questions you'll be able to answer</SectionLabel>
        <BulletList items={direction.keyQuestions} />
      </div>

      <Divider />

      {/* ── What I understood ── */}
      <div style={{ padding: `${spacing.D}px` }}>
        <SectionLabel>What I understood</SectionLabel>
        <p style={{ margin: `0 0 ${spacing.C}px`, fontSize: 13, lineHeight: '20px', color: systemColors.light['content-primary'] }}>
          <span style={{ fontWeight: 500 }}>
            {direction.linkedConcepts.length} linked concepts:{' '}
          </span>
          {direction.linkedConcepts.map((c, i) => (
            <React.Fragment key={c}>
              <span style={{ fontWeight: 600, color: systemColors.light['content-primary'] }}>{c}</span>
              {i < direction.linkedConcepts.length - 1 && (
                <span style={{ color: systemColors.light['content-tertiary'], margin: '0 5px' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </p>
        <BulletList items={direction.understoodPoints} />
      </div>

      {/* ── What I added (collapsible) — includes guardrails ── */}
      <div style={{ borderTop: `1px solid ${systemColors.light['border-divider']}` }}>
        <button
          onClick={() => setAddedExpanded(e => !e)}
          style={{
            width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.C,
            padding: addedExpanded
              ? `${spacing.D}px ${spacing.D}px ${spacing.B}px`
              : `${spacing.D}px`,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: fontFamily.primary, fontSize: 'inherit', textAlign: 'left' as const,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.A }}>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: systemColors.light['content-secondary'],
            }}>
              What I added
            </span>
            {!addedExpanded && (
              <span style={{
                fontSize: 11, fontWeight: fontWeight.light,
                lineHeight: '16px', color: systemColors.light['content-tertiary'],
              }}>
                metrics, dimensions, consumers, guardrails &amp; more
              </span>
            )}
          </div>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ flexShrink: 0, marginTop: 2, transform: addedExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            aria-hidden
          >
            <path d="M2 4l4 4 4-4" stroke={systemColors.light['content-tertiary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {addedExpanded && (() => {
          const allSections = [
            ...direction.addedSections,
            ...(direction.guardrails.length > 0 ? [{ label: 'Guardrails', items: direction.guardrails }] : []),
          ];
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {allSections.map((section, i) => (
                <React.Fragment key={section.label}>
                  {i > 0 && <div style={{ height: 1, background: systemColors.light['border-divider'] }} />}
                  <div style={{ padding: `${spacing.D}px` }}>
                    <SubSectionLabel>{section.label}</SubSectionLabel>
                    <BulletList items={section.items} />
                  </div>
                </React.Fragment>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── Footer: Build model CTA — only on the latest MRD ── */}
      {isLatest && (
        <div style={{
          borderTop: `1px solid ${systemColors.light['border-divider']}`,
          padding: `${spacing.C}px ${spacing.D}px`,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.C,
          backgroundColor: systemColors.light['background-sunken'],
        }}>
          {/* "Open doc" is hidden — uncomment to re-enable:
          <Button variant="tertiary" size="small" onClick={onOpenCanvas}
            icon={...} iconPosition="leading">Open doc</Button>
          */}
          <Button variant="primary" size="basic" onClick={onBuild}>
            Build model
          </Button>
        </div>
      )}
    </div>
  );
}
