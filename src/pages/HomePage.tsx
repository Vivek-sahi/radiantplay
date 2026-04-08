import React from 'react';
import { useNavigate } from 'react-router-dom';
import { systemColors, referenceColors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { getComponentCount, getIconCount, getTokenCountLabel } from '../data/componentRegistry';
import { getCurrentVersion } from '../data/versionHistory';

/**
 * HomePage - Landing page for Radiant Play
 *
 * Hero with buttons → Navigation cards → Guide CTA → Footer
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const footerMessages = [
    'Held together by design tokens and duct tape',
    'No designers were harmed in the making of this',
    'Built during standups nobody needed',
    'AI wrote 80% of this. The other 20% was panic',
    '12 components, 3 coffees, 1 deadline',
    'Pixel-perfect except for that one thing',
    'Shipped before anyone changed their mind',
    'CSS is fine. Everything is fine',
    'Made with spacing-D and questionable decisions',
    'Reviewed by no one. Approved by everyone',
    'Not a bug. It\'s a design token',
    'Built on vibes and a 4px base grid',
  ];

  const [footerMessage] = React.useState(() =>
    footerMessages[Math.floor(Math.random() * footerMessages.length)]
  );
  const [showEgg, setShowEgg] = React.useState(false);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <main style={styles.main}>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div style={styles.heroText}>
          <div style={styles.eyebrowRow}>
            <span style={styles.eyebrow}>ThoughtSpot Design</span>
            <span style={styles.versionBadge}>{getCurrentVersion()}</span>
          </div>
          <h1 style={styles.title}>
            Radiant<span style={styles.titleAccent}>Play</span>
          </h1>
          <p style={styles.subtitle}>
            Build interactive prototypes with real Radiant components.
            Every screen stays consistent with the design system.
          </p>
          <div style={styles.heroActions}>
            <a
              href="/guide.html"
              style={styles.primaryBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(39, 112, 239, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(39, 112, 239, 0.25)';
              }}
            >
              Getting started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="/how-it-works.html"
              style={styles.secondaryBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = systemColors.light['background-subtle'];
                e.currentTarget.style.borderColor = systemColors.light['border-default'];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = systemColors.light['background-base'];
                e.currentTarget.style.borderColor = systemColors.light['background-subtle'];
              }}
            >
              How prototyping works
            </a>
          </div>
        </div>

        {/* ── Navigation Cards ─────────────────────────────────── */}
        <div style={styles.cardsContainer}>
          {/* Radiant Card */}
          <button
            style={styles.card}
            onClick={() => navigate('/radiant')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(39, 112, 239, 0.18), 0 0 0 1px rgba(39, 112, 239, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.06)';
            }}
          >
            <div style={styles.cardIconWrapper}>
              <div style={{ ...styles.cardIcon, background: referenceColors.blue['20'], boxShadow: 'none' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={referenceColors.blue['70']} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke={referenceColors.blue['70']} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke={referenceColors.blue['70']} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 style={styles.cardTitle}>Radiant DS</h2>
            <p style={styles.cardDescription}>
              Explore components, design tokens, icons, and documentation.
            </p>
            <div style={styles.cardStats}>
              <span style={styles.cardStatPill}>{getComponentCount()} Components</span>
              <span style={styles.cardStatPill}>{getIconCount()} Icons</span>
              <span style={styles.cardStatPill}>{getTokenCountLabel()} Tokens</span>
            </div>
            <div style={styles.cardCtaButton}>
              <span>Browse components</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Playground Card */}
          <button
            style={styles.card}
            onClick={() => navigate('/playground')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(6, 191, 127, 0.18), 0 0 0 1px rgba(6, 191, 127, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.06)';
            }}
          >
            <div style={styles.cardIconWrapper}>
              <div style={{ ...styles.cardIcon, background: referenceColors.blue['20'], boxShadow: 'none' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 14.66V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4H9.34" stroke={referenceColors.blue['70']} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 2L22 6L12 16H8V12L18 2Z" stroke={referenceColors.blue['70']} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 style={styles.cardTitle}>Playground</h2>
            <p style={styles.cardDescription}>
              Build prototypes with AI assistance. Create and iterate on your designs.
            </p>
            <div style={styles.cardStats}>
              <span style={styles.cardStatPill}>Full-page experience</span>
              <span style={styles.cardStatPill}>AI-powered</span>
            </div>
            <div style={{ ...styles.cardCtaButton, color: referenceColors.blue['60'], background: referenceColors.blue['10'], borderColor: referenceColors.blue['20'] }}>
              <span>Open projects</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={styles.eggWrapper}>
          <div
            style={styles.funFooter}
            onClick={() => setShowEgg(v => !v)}
            title=""
          >
            {footerMessage}
          </div>
          {showEgg && (
            <div style={styles.eggTooltip}>
              What are you looking for? 😄
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: `linear-gradient(180deg, ${systemColors.light['background-sunken']} 0%, ${systemColors.light['background-base']} 100%)`,
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `96px ${spacing.H}px ${spacing.L}px`,
    maxWidth: '960px',
    margin: '0 auto',
    width: '100%',
  },

  // Hero
  heroText: {
    textAlign: 'center',
    marginBottom: `${spacing.K}px`,
  },
  eyebrowRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    marginBottom: `${spacing.E}px`,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: systemColors.light['content-brand'],
    background: referenceColors.blue['10'],
    border: `1px solid ${referenceColors.blue['20']}`,
    borderRadius: '99px',
    padding: `${spacing.A}px ${spacing.D}px`,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  title: {
    fontSize: '56px',
    fontWeight: 800,
    color: referenceColors.blue['85'],
    marginBottom: `${spacing.D}px`,
    letterSpacing: '-.03em',
    lineHeight: 1.1,
  },
  titleAccent: {
    color: referenceColors.blue['60'],
  },
  versionBadge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
    backgroundColor: systemColors.light['background-subtle'],
    padding: `${spacing.A}px ${spacing.B}px`,
    borderRadius: '20px',
    letterSpacing: '0.01em',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: 1.6,
    maxWidth: '520px',
    margin: '0 auto',
    marginBottom: `${spacing.H}px`,
  },
  heroActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${spacing.C}px`,
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #2770EF 0%, #1E5BBB 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.23, 1, 0.32, 1)',
    boxShadow: '0 4px 16px rgba(39, 112, 239, 0.25)',
    textDecoration: 'none',
    minWidth: '200px',
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: systemColors.light['content-primary'],
    background: systemColors.light['background-base'],
    border: `1.5px solid ${systemColors.light['background-subtle']}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.23, 1, 0.32, 1)',
    textDecoration: 'none',
    minWidth: '200px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },

  // Cards
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: `${spacing.F}px`,
    width: '100%',
    marginBottom: `${spacing.L}px`,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: `${spacing.G}px ${spacing.H}px`,
    background: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: '24px',
    cursor: 'pointer',
    transition: 'all 250ms cubic-bezier(0.23, 1, 0.32, 1)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  },
  cardIconWrapper: {
    marginBottom: `${spacing.F}px`,
  },
  cardIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: systemColors.light['content-primary'],
    marginBottom: `${spacing.C}px`,
    letterSpacing: '-0.5px',
  },
  cardDescription: {
    fontSize: '15px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: 1.6,
    marginBottom: `${spacing.E}px`,
    maxWidth: '280px',
  },
  cardStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${spacing.B}px`,
    marginBottom: `${spacing.F}px`,
    flexWrap: 'wrap',
  },
  cardStatPill: {
    fontSize: '13px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
    background: systemColors.light['background-sunken'],
    padding: `${spacing.A}px ${spacing.C}px`,
    borderRadius: '6px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  cardCtaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    fontSize: '15px',
    fontWeight: 600,
    color: systemColors.light['content-brand'],
    background: referenceColors.blue['10'],
    padding: `${spacing.C}px ${spacing.F}px`,
    borderRadius: '10px',
    border: `1px solid ${systemColors.light['background-information']}`,
    transition: 'all 150ms ease',
  },

  // Latest prototype button
  latestBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${spacing.C}px`,
    padding: `12px ${spacing.F}px`,
    fontSize: '15px',
    fontWeight: 400,
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#059669',
    background: 'linear-gradient(90deg, rgba(6,191,127,0.08) 0%, rgba(6,191,127,0.08) 40%, rgba(6,191,127,0.18) 50%, rgba(6,191,127,0.08) 60%, rgba(6,191,127,0.08) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 3s ease-in-out infinite',
    border: '1.5px solid rgba(6, 191, 127, 0.2)',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all .2s cubic-bezier(0.23, 1, 0.32, 1)',
    marginBottom: `${spacing.L}px`,
    boxShadow: '0 2px 12px rgba(6, 191, 127, 0.1)',
  },
  latestDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#06BF7F',
    flexShrink: 0,
    boxShadow: '0 0 8px rgba(6, 191, 127, 0.5)',
  },
  latestName: {
    color: '#059669',
    fontWeight: 700,
    fontSize: '15px',
  },

  // Footer
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${spacing.C}px`,
  },
  eggWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    marginTop: `${spacing.F}px`,
  },
  funFooter: {
    fontSize: '14px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
    textAlign: 'center',
    fontStyle: 'italic',
    cursor: 'default',
    userSelect: 'none',
    borderBottom: `1px dashed ${systemColors.light['border-divider']}`,
    paddingBottom: `${spacing.A}px`,
  },
  eggTooltip: {
    fontSize: '12px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: '8px',
    padding: `${spacing.B}px ${spacing.C}px`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
};

export default HomePage;
