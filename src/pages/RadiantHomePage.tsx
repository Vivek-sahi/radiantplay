import React from 'react';
import { sysVar, type SystemColorKey } from '../tokens/colors';
import { getComponentCount, getIconCount, getTokenCountLabel } from '../data/componentRegistry';
import { PLATFORM_VERSION } from '../data/platformVersion';
import { RadianceBackground } from '../app-chrome/RadianceBackground/RadianceBackground';
import { Button } from '../components/Button';
import { spacing } from '../tokens/spacing';
import { fontWeight } from '../tokens/typography';

// Theme-aware tints from system tokens.
// alphaTint matches the old 10% hex-alpha badges; softTint lands near the old */10 reference fills in light.
const alphaTint = (key: SystemColorKey, pct: number) => `color-mix(in srgb, ${sysVar(key)} ${pct}%, transparent)`;
const softTint = (key: SystemColorKey) => `color-mix(in srgb, ${sysVar(key)} 40%, ${sysVar('background-base')})`;

interface ComponentCardProps {
  name: string;
  description: string;
  icon: string;
  variants: number;
  status: 'stable' | 'beta' | 'new';
  onClick: () => void;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  name,
  description,
  icon,
  variants,
  status,
  onClick,
}) => {
  const statusColors = {
    stable: { bg: alphaTint('content-accent-green', 10), text: sysVar('content-accent-green') },
    beta: { bg: alphaTint('content-warning', 10), text: sysVar('content-warning') },
    new: { bg: alphaTint('content-accent-blue', 10), text: sysVar('content-accent-blue') },
  };

  return (
    <button onClick={onClick} style={styles.card}>
      <div style={styles.cardIcon}>{icon}</div>
      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>{name}</h3>
          <span
            style={{
              ...styles.cardStatus,
              backgroundColor: statusColors[status].bg,
              color: statusColors[status].text,
            }}
          >
            {status}
          </span>
        </div>
        <p style={styles.cardDescription}>{description}</p>
        <div style={styles.cardMeta}>
          <span style={styles.cardVariants}>{variants} variant{variants !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div style={styles.cardArrow}>→</div>
    </button>
  );
};

interface RadiantHomePageProps {
  onNavigate: (id: string) => void;
}

export const RadiantHomePage: React.FC<RadiantHomePageProps> = ({ onNavigate }) => {
  // Components organized by category (display grid)
  const componentCategories = [
    {
      category: 'Selection Controls',
      components: [
        { id: 'button', name: 'Button', description: 'Primary, secondary, and tertiary buttons', icon: '🔘', variants: 3, status: 'stable' as const },
        { id: 'checkbox', name: 'Checkbox', description: 'Selection for multiple choices', icon: '☑️', variants: 3, status: 'stable' as const },
        { id: 'radio', name: 'Radio', description: 'Single selection from options', icon: '🔘', variants: 2, status: 'stable' as const },
        { id: 'toggle', name: 'Toggle', description: 'Switch for on/off states', icon: '🔀', variants: 2, status: 'stable' as const },
      ],
    },
    {
      category: 'Inputs',
      components: [
        { id: 'textinput', name: 'TextInput', description: 'Text input with validation', icon: '📝', variants: 3, status: 'stable' as const },
        { id: 'textarea', name: 'TextArea', description: 'Multi-line text input', icon: '📄', variants: 2, status: 'new' as const },
        { id: 'searchinput', name: 'SearchInput', description: 'Search with clear button', icon: '🔍', variants: 1, status: 'stable' as const },
        { id: 'select', name: 'Select', description: 'Dropdown selection', icon: '📋', variants: 3, status: 'stable' as const },
        { id: 'datepicker', name: 'DatePicker', description: 'Date selection calendar', icon: '📅', variants: 2, status: 'new' as const },
        { id: 'segmentedcontrol', name: 'SegmentedControl', description: 'Mutually exclusive segments', icon: '🔲', variants: 3, status: 'new' as const },
      ],
    },
    {
      category: 'Feedback',
      components: [
        { id: 'alert', name: 'Alert', description: 'Notification banners', icon: '⚠️', variants: 5, status: 'stable' as const },
        { id: 'toast', name: 'Toast', description: 'Temporary notifications', icon: '🍞', variants: 4, status: 'new' as const },
        { id: 'modal', name: 'Modal', description: 'Overlay dialogs', icon: '🪟', variants: 3, status: 'stable' as const },
        { id: 'tooltip', name: 'Tooltip', description: 'Hover information', icon: '💬', variants: 4, status: 'stable' as const },
        { id: 'popover', name: 'Popover', description: 'Interactive overlays', icon: '📌', variants: 2, status: 'stable' as const },
        { id: 'loadingindicator', name: 'LoadingIndicator', description: 'Spinners and skeletons', icon: '⏳', variants: 5, status: 'new' as const },
        { id: 'progressbar', name: 'ProgressBar', description: 'Progress visualization', icon: '📊', variants: 4, status: 'new' as const },
      ],
    },
    {
      category: 'Data Display',
      components: [
        { id: 'table', name: 'Table', description: 'Data tables with sorting', icon: '📊', variants: 3, status: 'stable' as const },
        { id: 'chip', name: 'Chip', description: 'Attribute and filter pills', icon: '🏷️', variants: 4, status: 'stable' as const },
        { id: 'avatar', name: 'Avatar', description: 'User avatars and groups', icon: '👤', variants: 6, status: 'new' as const },
      ],
    },
    {
      category: 'Navigation',
      components: [
        { id: 'tabs', name: 'Tabs', description: 'Content organization tabs', icon: '📑', variants: 2, status: 'stable' as const },
        { id: 'link', name: 'Link', description: 'Navigation links', icon: '🔗', variants: 4, status: 'new' as const },
        { id: 'menu', name: 'Menu', description: 'Dropdown action menus', icon: '📜', variants: 2, status: 'new' as const },
        { id: 'pagination', name: 'Pagination', description: 'Page navigation', icon: '📖', variants: 3, status: 'new' as const },
        { id: 'stepper', name: 'Stepper', description: 'Multi-step progress', icon: '🚶', variants: 2, status: 'new' as const },
      ],
    },
    {
      category: 'Layout',
      components: [
        { id: 'card', name: 'Card', description: 'Content containers', icon: '🃏', variants: 3, status: 'new' as const },
        { id: 'accordion', name: 'Accordion', description: 'Collapsible sections', icon: '📂', variants: 3, status: 'new' as const },
        { id: 'divider', name: 'Divider', description: 'Content separators', icon: '➖', variants: 2, status: 'new' as const },
      ],
    },
    {
      category: 'Typography',
      components: [
        { id: 'typography', name: 'Typography', description: 'Text variants and styles', icon: '🔤', variants: 20, status: 'new' as const },
      ],
    },
  ];

  // Flatten for backward compatibility
  const components = componentCategories.flatMap(cat => cat.components);

  const stats = [
    { label: 'Components', value: String(getComponentCount()), icon: '🧩' },
    { label: 'Icons', value: String(getIconCount()), icon: '🎛️' },
    { label: 'Design Tokens', value: getTokenCountLabel(), icon: '🎯' },
    { label: 'TypeScript', value: '100%', icon: '💪' },
  ];

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <RadianceBackground heroHeight={300} />
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeIcon}>✨</span>
            <span>Design system {PLATFORM_VERSION}</span>
          </div>
          <h1 style={styles.heroTitle}>Radiant</h1>
          <p style={styles.heroSubtitle}>
            A comprehensive React component library built with TypeScript. 
            Designed for consistency, accessibility, and developer experience.
          </p>
          <div style={styles.heroActions}>
            <Button variant="primary" size="large" onClick={() => onNavigate('button')}>
              Browse components
            </Button>
            <Button variant="secondary" size="large" onClick={() => onNavigate('architecture')}>
              Token architecture
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        {stats.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={styles.statValue}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Token Architecture Section */}
      <section style={styles.tokenSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Token Architecture</h2>
          <p style={styles.sectionDescription}>
            A 3-layer token system (Reference → System → Component) with built-in light/dark mode
          </p>
        </div>
        <div style={styles.tokenFlow}>
          <div style={styles.tokenLayer} onClick={() => onNavigate('colours')}>
            <div style={{ ...styles.tokenLayerIcon, backgroundColor: softTint('background-accent-blue') }}>
              <span style={{ color: sysVar('content-brand'), fontSize: '20px' }}>1</span>
            </div>
            <div style={styles.tokenLayerContent}>
              <h4 style={styles.tokenLayerTitle}>Reference Tokens</h4>
              <p style={styles.tokenLayerDesc}>Primitive tonal scales: brand.'60', gray.'90'</p>
            </div>
          </div>
          <div style={styles.tokenArrow}>→</div>
          <div style={styles.tokenLayer} onClick={() => onNavigate('architecture')}>
            <div style={{ ...styles.tokenLayerIcon, backgroundColor: softTint('background-accent-green') }}>
              <span style={{ color: sysVar('content-success'), fontSize: '20px' }}>2</span>
            </div>
            <div style={styles.tokenLayerContent}>
              <h4 style={styles.tokenLayerTitle}>System Tokens</h4>
              <p style={styles.tokenLayerDesc}>Semantic, mode-aware: --rd-sys-color-background-brand</p>
            </div>
          </div>
          <div style={styles.tokenArrow}>→</div>
          <div style={styles.tokenLayer} onClick={() => onNavigate('button')}>
            <div style={{ ...styles.tokenLayerIcon, backgroundColor: softTint('background-accent-purple-subtle') }}>
              <span style={{ color: sysVar('content-accent-purple'), fontSize: '20px' }}>3</span>
            </div>
            <div style={styles.tokenLayerContent}>
              <h4 style={styles.tokenLayerTitle}>Component Tokens</h4>
              <p style={styles.tokenLayerDesc}>Per-component: --rd-comp-color-button-primary-hover</p>
            </div>
          </div>
        </div>
        <button style={styles.tokenCTA} onClick={() => onNavigate('architecture')}>
          View Full Token Architecture →
        </button>
      </section>

      {/* Components Grid - Organized by Category */}
      <section style={styles.componentsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Components</h2>
          <p style={styles.sectionDescription}>
            {components.length} featured components with live examples — {getComponentCount()} total in the registry
          </p>
        </div>
        {componentCategories.map((category) => (
          <div key={category.category} style={styles.categorySection}>
            <h3 style={styles.categoryTitle}>{category.category}</h3>
            <div style={styles.componentsGrid}>
              {category.components.map((component) => (
                <ComponentCard
                  key={component.id}
                  name={component.name}
                  description={component.description}
                  icon={component.icon}
                  variants={component.variants}
                  status={component.status}
                  onClick={() => onNavigate(component.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Quick Links */}
      <section style={styles.quickLinksSection}>
        <div style={styles.quickLinkCard} onClick={() => onNavigate('colours')}>
          <div style={styles.quickLinkIcon}>🎨</div>
          <div style={styles.quickLinkContent}>
            <h3 style={styles.quickLinkTitle}>Colour System</h3>
            <p style={styles.quickLinkDescription}>
              Explore the complete colour palette with 8 scales and usage guidelines.
            </p>
          </div>
        </div>
        <div style={styles.quickLinkCard} onClick={() => onNavigate('typography')}>
          <div style={styles.quickLinkIcon}>🔤</div>
          <div style={styles.quickLinkContent}>
            <h3 style={styles.quickLinkTitle}>Typography</h3>
            <p style={styles.quickLinkDescription}>
              Typography system with 20+ variants for consistent text styling.
            </p>
          </div>
        </div>
        <div style={styles.quickLinkCard} onClick={() => onNavigate('icons')}>
          <div style={styles.quickLinkIcon}>⭐</div>
          <div style={styles.quickLinkContent}>
            <h3 style={styles.quickLinkTitle}>Icons</h3>
            <p style={styles.quickLinkDescription}>
              Browse {getIconCount()} carefully crafted icons with searchable gallery.
            </p>
          </div>
        </div>
        <div style={styles.quickLinkCard} onClick={() => onNavigate('surfaces')}>
          <div style={styles.quickLinkIcon}>🪟</div>
          <div style={styles.quickLinkContent}>
            <h3 style={styles.quickLinkTitle}>Surfaces</h3>
            <p style={styles.quickLinkDescription}>
              Modal patterns (M1-M4) with Simple, Wizard, Sub-navigation, and Splash Screen types.
            </p>
          </div>
        </div>
        <div style={styles.quickLinkCard} onClick={() => onNavigate('registry')}>
          <div style={styles.quickLinkIcon}>📋</div>
          <div style={styles.quickLinkContent}>
            <h3 style={styles.quickLinkTitle}>Component Registry</h3>
            <p style={styles.quickLinkDescription}>
              Full component status, source, and implementation details.
            </p>
          </div>
        </div>
        <div style={styles.quickLinkCard} onClick={() => onNavigate('spotter-showcase')}>
          <div style={styles.quickLinkIcon}>💬</div>
          <div style={styles.quickLinkContent}>
            <h3 style={styles.quickLinkTitle}>Spotter showcase</h3>
            <p style={styles.quickLinkDescription}>
              Every Spotter component in one place — chat surface, blocks, page shell, icons, tokens.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  // Hero: light and theme-aware, on the Radiance "home" wash behind it.
  hero: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.N}px ${spacing.L}px`,
    marginBottom: spacing.H,
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    borderRadius: 'var(--radius-3xl)',
    border: `1px solid ${sysVar('border-subtle')}`,
  },
  heroContent: {
    flex: 1,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.B,
    padding: `${spacing.B}px ${spacing.D}px`,
    background: `color-mix(in srgb, ${sysVar('content-brand')} 12%, transparent)`,
    borderRadius: 'var(--radius-full)',
    marginBottom: spacing.F,
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: fontWeight.emphasis,
    color: sysVar('content-brand'),
  },
  heroBadgeIcon: {
    fontSize: 'var(--font-size-sm)',
  },
  heroTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '64px',
    fontWeight: fontWeight.emphasis,
    color: sysVar('content-primary'),
    margin: `0 0 ${spacing.D}px`,
    letterSpacing: '-0.035em',
    lineHeight: 1.02,
  },
  heroSubtitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '18px',
    color: sysVar('content-primary'),
    lineHeight: 1.5,
    maxWidth: '520px',
    margin: `0 0 ${spacing.H}px`,
  },
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.C,
  },

  // Stats
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '48px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px',
    background: sysVar('background-base'),
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  statIcon: {
    fontSize: '28px',
  },
  statValue: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '32px',
    fontWeight: 700,
    color: sysVar('content-primary'),
  },
  statLabel: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    fontWeight: 500,
    color: sysVar('content-secondary'),
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Token Architecture
  tokenSection: {
    marginBottom: '48px',
    padding: '32px',
    backgroundColor: sysVar('background-base'),
    borderRadius: '20px',
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  tokenFlow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '24px',
  },
  tokenLayer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: sysVar('background-sunken'),
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  tokenLayerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  tokenLayerContent: {
    flex: 1,
  },
  tokenLayerTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    margin: 0,
    marginBottom: '4px',
  },
  tokenLayerDesc: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '11px',
    color: sysVar('content-secondary'),
    margin: 0,
  },
  tokenArrow: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '24px',
    color: sysVar('border-subtle-hover'),
  },
  tokenCTA: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: `1px solid ${sysVar('border-subtle-hover')}`,
    borderRadius: '8px',
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    fontWeight: 500,
    color: sysVar('content-primary'),
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },

  // Components
  componentsSection: {
    marginBottom: '48px',
  },
  sectionHeader: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '28px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '8px',
  },
  sectionDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
  },
  categorySection: {
    marginBottom: '32px',
  },
  categoryTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-secondary'),
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  componentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: sysVar('background-base'),
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'left',
  },
  cardIcon: {
    fontSize: '32px',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: sysVar('background-sunken'),
    borderRadius: '12px',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  cardTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    margin: 0,
  },
  cardStatus: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '10px',
    fontWeight: 'var(--font-weight-emphasis)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  cardDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    margin: 0,
    marginBottom: '8px',
    lineHeight: '18px',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardVariants: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '12px',
    fontWeight: 500,
    color: sysVar('border-default'),
  },
  cardArrow: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '20px',
    color: sysVar('border-subtle-hover'),
    transition: 'all 200ms ease',
  },

  // Quick Links
  quickLinksSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  quickLinkCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '28px',
    background: `linear-gradient(135deg, ${sysVar('background-sunken')} 0%, ${sysVar('background-base')} 100%)`,
    border: `1px solid ${sysVar('background-subtle')}`,
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  quickLinkIcon: {
    fontSize: '40px',
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '18px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '8px',
  },
  quickLinkDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '22px',
    margin: 0,
  },
};

export default RadiantHomePage;
