import React, { useState } from 'react';
import { systemColors, referenceColors } from '../tokens/colors';
import { LastUpdated } from '../components/LastUpdated';

type ActiveLayer = 'reference' | 'system' | 'component' | null;

export const ArchitectureShowcase: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>(null);

  return (
    <div style={styles.container}>
      {/* Header */}
      <section style={styles.headerSection}>
        <LastUpdated date="2026-04-27" />
        <h2 style={styles.pageTitle}>Token Architecture</h2>
        <p style={styles.pageDescription}>
          The Radiant Design System uses a 3-tier token architecture that provides flexibility, 
          consistency, and maintainability across all components.
        </p>
      </section>

      {/* Architecture Diagram */}
      <section style={styles.diagramSection}>
        <h3 style={styles.sectionTitle}>Token Flow Diagram</h3>
        <p style={styles.sectionDescription}>
          Click on each layer to see details. Tokens flow from Reference → System → Component.
        </p>
        
        <div style={styles.flowChart}>
          {/* Reference Layer */}
          <div 
            style={{
              ...styles.layer,
              ...styles.brandLayer,
              ...(activeLayer === 'reference' ? styles.layerActive : {}),
            }}
            onClick={() => setActiveLayer(activeLayer === 'reference' ? null : 'reference')}
          >
            <div style={styles.layerHeader}>
              <span style={styles.layerNumber}>1</span>
              <span style={styles.layerTitle}>Reference Tokens</span>
            </div>
            <p style={styles.layerSubtitle}>Primitive Values (rd-ref-color-*)</p>
            <div style={styles.layerContent}>
              <code style={styles.tokenExample}>brand.'60' = #2770EF</code>
              <code style={styles.tokenExample}>gray.'90' = #1D232F</code>
              <code style={styles.tokenExample}>green.'60' = #06BF7F</code>
            </div>
            <div style={styles.layerFile}>
              <span style={styles.fileIcon}>📄</span>
              <code>tokens/colors/reference.ts</code>
            </div>
          </div>

          {/* Arrow 1 */}
          <div style={styles.arrowContainer}>
            <svg width="40" height="60" viewBox="0 0 40 60" style={styles.arrow}>
              <path d="M20 0 L20 45 M10 35 L20 50 L30 35" stroke={systemColors.light['border-default']} strokeWidth="2" fill="none" />
            </svg>
            <span style={styles.arrowLabel}>maps to</span>
          </div>

          {/* System Layer */}
          <div 
            style={{
              ...styles.layer,
              ...styles.semanticLayer,
              ...(activeLayer === 'system' ? styles.layerActive : {}),
            }}
            onClick={() => setActiveLayer(activeLayer === 'system' ? null : 'system')}
          >
            <div style={styles.layerHeader}>
              <span style={styles.layerNumber}>2</span>
              <span style={styles.layerTitle}>System Tokens</span>
            </div>
            <p style={styles.layerSubtitle}>Semantic, Mode-Aware (rd-sys-color-*)</p>
            <div style={styles.layerContent}>
              <code style={styles.tokenExample}>--rd-sys-color-background-base</code>
              <code style={styles.tokenExample}>--rd-sys-color-content-primary</code>
              <code style={styles.tokenExample}>--rd-sys-color-border-brand</code>
            </div>
            <div style={styles.layerFile}>
              <span style={styles.fileIcon}>📄</span>
              <code>tokens/colors/system.ts</code>
            </div>
          </div>

          {/* Arrow 2 */}
          <div style={styles.arrowContainer}>
            <svg width="40" height="60" viewBox="0 0 40 60" style={styles.arrow}>
              <path d="M20 0 L20 45 M10 35 L20 50 L30 35" stroke={systemColors.light['border-default']} strokeWidth="2" fill="none" />
            </svg>
            <span style={styles.arrowLabel}>used by</span>
          </div>

          {/* Component Layer */}
          <div 
            style={{
              ...styles.layer,
              ...styles.componentLayer,
              ...(activeLayer === 'component' ? styles.layerActive : {}),
            }}
            onClick={() => setActiveLayer(activeLayer === 'component' ? null : 'component')}
          >
            <div style={styles.layerHeader}>
              <span style={styles.layerNumber}>3</span>
              <span style={styles.layerTitle}>Component Tokens</span>
            </div>
            <p style={styles.layerSubtitle}>Per-Component (rd-comp-color-*)</p>
            <div style={styles.layerContent}>
              <code style={styles.tokenExample}>--rd-comp-color-button-primary-default</code>
              <code style={styles.tokenExample}>--rd-comp-color-chip-attribute-default</code>
            </div>
            <div style={styles.layerFile}>
              <span style={styles.fileIcon}>📄</span>
              <code>tokens/colors/component.ts</code>
            </div>
          </div>
        </div>

        {/* Layer Details */}
        {activeLayer && (
          <div style={styles.detailsPanel}>
            {activeLayer === 'reference' && (
              <>
                <h4 style={styles.detailsTitle}>🎨 Reference / Primitive Tokens</h4>
                <p style={styles.detailsDescription}>
                  The foundation of the color system. Mode-agnostic tonal scales for 9 color families
                  (gray, brand, red, purple, blue, teal, yellow, green, orange) plus black/white.
                  Scale runs from '00' (lightest) to '100' (darkest).
                </p>
                <div style={styles.codeBlock}>
                  <div style={styles.codeHeader}>tokens/colors/reference.ts</div>
                  <pre style={styles.code}>{`export const referenceColors = {
  gray: {
    '00': '#FFFFFF',
    '10': '#F6F8FA',
    '20': '#EAEDF2',
    '40': '#C0C6CF',
    '60': '#777E8B',
    '90': '#1D232F',
    '100': '#000000',
  },
  brand: {
    '60': '#2770EF',  // Primary
    '70': '#2359B6',  // Hover
    '80': '#163772',  // Pressed
  },
  // red, purple, blue, teal, yellow, green, orange
  black: '#000000',
  white: '#FFFFFF',
}`}</pre>
                </div>
              </>
            )}
            {activeLayer === 'system' && (
              <>
                <h4 style={styles.detailsTitle}>💡 System Tokens (Light + Dark)</h4>
                <p style={styles.detailsDescription}>
                  Mode-aware semantic tokens organized into 3 groups: background (15), content (15),
                  and border (12) — 42 tokens per mode. They automatically switch between light and dark
                  values via CSS custom properties and <code>data-theme</code>.
                </p>
                <div style={styles.codeBlock}>
                  <div style={styles.codeHeader}>styles/tokens.css</div>
                  <pre style={styles.code}>{`:root, [data-theme="light"] {
  /* Background */
  --rd-sys-color-background-base: #FFFFFF;
  --rd-sys-color-background-sunken: #F6F8FA;
  --rd-sys-color-background-brand: #2770EF;

  /* Content */
  --rd-sys-color-content-primary: #1D232F;
  --rd-sys-color-content-brand: #2770EF;
  --rd-sys-color-content-success: #06BF7F;

  /* Border */
  --rd-sys-color-border-default: #C0C6CF;
  --rd-sys-color-border-brand: #2770EF;
  --rd-sys-color-border-focus: #2770EF;
}

[data-theme="dark"] {
  --rd-sys-color-background-base: #1D232F;
  --rd-sys-color-content-primary: #FFFFFF;
  /* ... all tokens swap */
}`}</pre>
                </div>
              </>
            )}
            {activeLayer === 'component' && (
              <>
                <h4 style={styles.detailsTitle}>🧩 Component Tokens</h4>
                <p style={styles.detailsDescription}>
                  46 per-component tokens for button (11), chip (30), and toggle (5). CSS modules
                  consume system and component tokens via CSS custom properties.
                </p>
                <div style={styles.codeBlock}>
                  <div style={styles.codeHeader}>components/Button/Button.module.css</div>
                  <pre style={styles.code}>{`.button {
  font-family: var(--font-family-primary);
  border-radius: var(--radius-2xl);
  transition: background-color var(--duration-fast);
}

.primary.standard {
  background-color: var(--rd-sys-color-background-brand);
  color: var(--rd-sys-color-content-alternate);
}

.primary.standard:hover {
  background-color: var(--rd-comp-color-button-primary-hover);
}

.secondary.standard {
  background-color: var(--rd-sys-color-background-subtle);
  color: var(--rd-sys-color-content-primary);
}`}</pre>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Real Example */}
      <section style={styles.exampleSection}>
        <h3 style={styles.sectionTitle}>Real Example: Button Component</h3>
        <p style={styles.sectionDescription}>
          See how tokens flow through the 3-layer system to create a Primary Button.
        </p>

        <div style={styles.exampleFlow}>
          {/* Step 1 */}
          <div style={styles.exampleStep}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitle}>Reference Token</span>
            </div>
            <div style={styles.stepContent}>
              <code style={styles.stepCode}>referenceColors.brand['60']</code>
              <div style={styles.colorPreview}>
                <div style={{ ...styles.colorSwatch, backgroundColor: '#2770EF' }} />
                <span>#2770EF</span>
              </div>
            </div>
          </div>

          <div style={styles.stepArrow}>→</div>

          {/* Step 2 */}
          <div style={styles.exampleStep}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>2</span>
              <span style={styles.stepTitle}>System Token</span>
            </div>
            <div style={styles.stepContent}>
              <code style={styles.stepCode}>--rd-sys-color-background-brand: #2770EF</code>
            </div>
          </div>

          <div style={styles.stepArrow}>→</div>

          {/* Step 3 */}
          <div style={styles.exampleStep}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>3</span>
              <span style={styles.stepTitle}>CSS Module Applies</span>
            </div>
            <div style={styles.stepContent}>
              <code style={styles.stepCode}>background: var(--rd-sys-color-background-brand)</code>
            </div>
          </div>

          <div style={styles.stepArrow}>→</div>

          {/* Step 4 */}
          <div style={styles.exampleStep}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>4</span>
              <span style={styles.stepTitle}>Rendered Button</span>
            </div>
            <div style={styles.stepContent}>
              <button style={styles.previewButton}>Add</button>
            </div>
          </div>
        </div>
      </section>

      {/* Consumption Patterns */}
      <section style={styles.consumptionSection}>
        <h3 style={styles.sectionTitle}>How Tokens Are Consumed</h3>
        <p style={styles.sectionDescription}>
          Tokens are available through two paths. Components use CSS custom properties for theme-aware styling.
          Pages and prototypes use TypeScript objects for inline styles.
        </p>

        <div style={styles.consumptionGrid}>
          {/* Path 1: CSS Custom Properties */}
          <div style={styles.consumptionCard}>
            <div style={styles.consumptionHeader}>
              <span style={styles.consumptionBadge}>CSS Modules</span>
              <span style={styles.consumptionTag}>Theme-aware</span>
            </div>
            <p style={styles.consumptionDesc}>
              Component <code>.module.css</code> files use <code>var(--rd-sys-color-*)</code> and <code>var(--rd-comp-color-*)</code>.
              These automatically switch values when <code>data-theme</code> changes — no JS needed.
            </p>
            <div style={styles.codeBlock}>
              <div style={styles.codeHeader}>Button.module.css</div>
              <pre style={styles.code}>{`.primary {
  background: var(--rd-sys-color-background-brand);
  color: var(--rd-sys-color-content-alternate);
}
.primary:hover {
  background: var(--rd-comp-color-button-primary-hover);
}`}</pre>
            </div>
            <div style={styles.consumptionUsage}>
              <span style={styles.consumptionUsageLabel}>Used by</span>
              <span style={styles.consumptionUsageValue}>35 component CSS modules</span>
            </div>
          </div>

          {/* Path 2: TypeScript Objects */}
          <div style={styles.consumptionCard}>
            <div style={styles.consumptionHeader}>
              <span style={{ ...styles.consumptionBadge, backgroundColor: referenceColors.green['10'], color: systemColors.light['content-success'] }}>TypeScript</span>
              <span style={styles.consumptionTag}>Inline styles</span>
            </div>
            <p style={styles.consumptionDesc}>
              Pages and prototypes import <code>systemColors</code> and <code>referenceColors</code> directly
              for inline styles. Access light/dark maps via <code>.light[...]</code> or <code>.dark[...]</code>.
            </p>
            <div style={styles.codeBlock}>
              <div style={styles.codeHeader}>MyPage.tsx</div>
              <pre style={styles.code}>{`import { systemColors, referenceColors }
  from '../tokens/colors';

<div style={{
  background: systemColors.light['background-base'],
  color: systemColors.light['content-primary'],
  borderColor: referenceColors.gray['20'],
}} />`}</pre>
            </div>
            <div style={styles.consumptionUsage}>
              <span style={styles.consumptionUsageLabel}>Used by</span>
              <span style={styles.consumptionUsageValue}>46+ page and prototype files</span>
            </div>
          </div>
        </div>

        <div style={styles.consumptionNote}>
          <strong>When to use which?</strong>{' '}
          Use CSS custom properties in reusable components (they respond to theme changes automatically).
          Use TypeScript imports in pages, prototypes, and one-off layouts where inline styles are more convenient.
        </div>
      </section>

      {/* File Structure */}
      <section style={styles.structureSection}>
        <h3 style={styles.sectionTitle}>File Structure</h3>
        <div style={styles.fileTree}>
          <div style={styles.treeItem}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>src/</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 20 }}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>tokens/</span>
            <span style={styles.treeLabel}>← 3-layer token system (TypeScript)</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 40 }}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>colors/</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 60 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>reference.ts</span>
            <span style={styles.treeDesc}>Primitive tonal scales (9 families)</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 60 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>system.ts</span>
            <span style={styles.treeDesc}>Semantic tokens (light + dark)</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 60 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>component.ts</span>
            <span style={styles.treeDesc}>46 per-component tokens (button, chip, toggle)</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 60 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>charts.ts</span>
            <span style={styles.treeDesc}>Chart color palettes</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 20 }}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>styles/</span>
            <span style={styles.treeLabel}>← CSS custom properties</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 40 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>tokens.css</span>
            <span style={styles.treeDesc}>rd-sys-color-* and rd-comp-color-* variables</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 40 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>global.css</span>
            <span style={styles.treeDesc}>Base styles</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 20 }}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>components/</span>
            <span style={styles.treeLabel}>← Component library</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 40 }}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>Button/</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 60 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>Button.tsx</span>
            <span style={styles.treeDesc}>React component</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 60 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>Button.module.css</span>
            <span style={styles.treeDesc}>Scoped styles with rd-sys/rd-comp tokens</span>
          </div>
        </div>
      </section>

      {/* Token Categories */}
      <section style={styles.categoriesSection}>
        <h3 style={styles.sectionTitle}>Token Categories</h3>
        <div style={styles.categoryGrid}>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: referenceColors.blue['10'] }}>🎨</div>
            <h4 style={styles.categoryTitle}>Colors</h4>
            <ul style={styles.categoryList}>
              <li>9 reference scales (00-100)</li>
              <li>42 system tokens × 2 modes</li>
              <li>46 component tokens × 2 modes</li>
              <li>rd-ref / rd-sys / rd-comp prefix</li>
            </ul>
          </div>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: referenceColors.green['10'] }}>📏</div>
            <h4 style={styles.categoryTitle}>Spacing</h4>
            <ul style={styles.categoryList}>
              <li>4px increments</li>
              <li>spacing-1 to spacing-24</li>
              <li>Consistent gaps</li>
              <li>Padding & margins</li>
            </ul>
          </div>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: referenceColors.purple['10'] }}>🔤</div>
            <h4 style={styles.categoryTitle}>Typography</h4>
            <ul style={styles.categoryList}>
              <li>Font family: Plain</li>
              <li>Sizes: 12-40px</li>
              <li>Weights: 375-600</li>
              <li>Line heights</li>
            </ul>
          </div>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: referenceColors.yellow['10'] }}>⬜</div>
            <h4 style={styles.categoryTitle}>Radius & Shadow</h4>
            <ul style={styles.categoryList}>
              <li>Radius: 2-24px, full</li>
              <li>Shadows: xs-2xl</li>
              <li>Focus rings</li>
              <li>Elevation levels</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={styles.benefitsSection}>
        <h3 style={styles.sectionTitle}>Why This Architecture?</h3>
        <div style={styles.benefitsGrid}>
          <div style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🔄</span>
            <h4 style={styles.benefitTitle}>Single Source of Truth</h4>
            <p style={styles.benefitDesc}>Change a color once in reference.ts, and it cascades through system and component tokens automatically.</p>
          </div>
          <div style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🌙</span>
            <h4 style={styles.benefitTitle}>Built-in Light/Dark Mode</h4>
            <p style={styles.benefitDesc}>System tokens have light and dark maps. Set data-theme on the HTML element and all components adapt.</p>
          </div>
          <div style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🧩</span>
            <h4 style={styles.benefitTitle}>Consistency</h4>
            <p style={styles.benefitDesc}>All components use the same tokens, ensuring visual harmony across the system.</p>
          </div>
          <div style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🛠️</span>
            <h4 style={styles.benefitTitle}>Maintainability</h4>
            <p style={styles.benefitDesc}>Clear separation of concerns makes updates and debugging straightforward.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },

  // Header
  headerSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  pageTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '28px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: '12px',
  },
  pageDescription: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 375,
    color: systemColors.light['content-secondary'],
    lineHeight: '24px',
    maxWidth: '800px',
  },

  // Section styles
  sectionTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '20px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: '8px',
  },
  sectionDescription: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    fontWeight: 375,
    color: systemColors.light['content-secondary'],
    marginBottom: '24px',
  },

  // Diagram Section
  diagramSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  flowChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
    padding: '24px 0',
  },
  layer: {
    width: '100%',
    maxWidth: '500px',
    padding: '20px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    border: '2px solid transparent',
  },
  layerActive: {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  brandLayer: {
    backgroundColor: referenceColors.blue['10'],
    borderColor: systemColors.light['background-information'],
  },
  semanticLayer: {
    backgroundColor: referenceColors.green['10'],
    borderColor: systemColors.light['background-success'],
  },
  componentLayer: {
    backgroundColor: referenceColors.purple['10'],
    borderColor: referenceColors.purple['20'],
  },
  layerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  layerNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: systemColors.light['content-primary'],
    color: systemColors.light['background-base'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  layerTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '18px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
  },
  layerSubtitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    color: systemColors.light['content-secondary'],
    marginLeft: '40px',
    marginBottom: '12px',
  },
  layerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginLeft: '40px',
    marginBottom: '12px',
  },
  tokenExample: {
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
    fontSize: '12px',
    color: referenceColors.gray['70'],
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: '4px 8px',
    borderRadius: '4px',
    width: 'fit-content',
  },
  layerFile: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: '40px',
    fontSize: '12px',
    color: systemColors.light['content-secondary'],
  },
  fileIcon: {
    fontSize: '14px',
  },
  arrowContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4px 0',
  },
  arrow: {
    display: 'block',
  },
  arrowLabel: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '11px',
    color: systemColors.light['content-secondary'],
    marginTop: '-8px',
  },

  // Details Panel
  detailsPanel: {
    marginTop: '24px',
    padding: '24px',
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: '8px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  detailsTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: '8px',
  },
  detailsDescription: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    color: systemColors.light['content-secondary'],
    lineHeight: '20px',
    marginBottom: '16px',
  },
  codeBlock: {
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: systemColors.light['content-primary'],
  },
  codeHeader: {
    padding: '8px 16px',
    backgroundColor: systemColors.light['background-raised-inverse'],
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
    fontSize: '12px',
    color: systemColors.light['border-default'],
  },
  code: {
    padding: '16px',
    margin: 0,
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
    fontSize: '13px',
    color: referenceColors.gray['30'],
    lineHeight: '20px',
    overflow: 'auto',
  },

  // Example Section
  exampleSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  exampleFlow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '12px',
    overflowX: 'auto',
    padding: '16px 0',
  },
  exampleStep: {
    flex: '1 1 200px',
    minWidth: '180px',
    padding: '16px',
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: '8px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: systemColors.light['content-brand'],
    color: systemColors.light['background-base'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
  },
  stepTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stepCode: {
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
    fontSize: '11px',
    color: referenceColors.gray['70'],
    backgroundColor: systemColors.light['background-base'],
    padding: '6px 8px',
    borderRadius: '4px',
    wordBreak: 'break-all',
  },
  stepArrow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '24px',
    color: systemColors.light['border-default'],
    flexShrink: 0,
  },
  colorPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: systemColors.light['content-secondary'],
  },
  colorSwatch: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: `1px solid ${referenceColors.gray['30']}`,
  },
  previewButton: {
    padding: '6px 16px',
    backgroundColor: systemColors.light['content-brand'],
    color: systemColors.light['background-base'],
    border: 'none',
    borderRadius: '16px',
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    fontWeight: 375,
    cursor: 'pointer',
  },

  // Consumption Patterns
  consumptionSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  consumptionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  consumptionCard: {
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: '10px',
    padding: '24px',
    border: `1px solid ${systemColors.light['background-subtle']}`,
  },
  consumptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  consumptionBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '6px',
    backgroundColor: referenceColors.blue['10'],
    color: systemColors.light['content-brand'],
  },
  consumptionTag: {
    fontSize: '11px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: systemColors.light['background-subtle'],
  },
  consumptionDesc: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '20px',
    marginBottom: '16px',
  },
  consumptionUsage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${systemColors.light['background-subtle']}`,
  },
  consumptionUsageLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: systemColors.light['content-secondary'],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  consumptionUsageValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: systemColors.light['content-primary'],
  },
  consumptionNote: {
    fontSize: '13px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '20px',
    backgroundColor: referenceColors.blue['10'],
    border: `1px solid ${systemColors.light['background-information']}`,
    borderRadius: '8px',
    padding: '12px 16px',
  },

  // File Structure
  structureSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  fileTree: {
    fontFamily: '"SF Mono", "Monaco", "Inconsolata", monospace',
    fontSize: '13px',
    lineHeight: '28px',
  },
  treeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  folderIcon: {
    fontSize: '16px',
  },
  folderName: {
    color: systemColors.light['content-primary'],
    fontWeight: 500,
  },
  fileName: {
    color: referenceColors.gray['70'],
  },
  treeLabel: {
    color: systemColors.light['content-brand'],
    fontSize: '11px',
    marginLeft: '8px',
  },
  treeDesc: {
    color: systemColors.light['content-secondary'],
    fontSize: '11px',
    marginLeft: '8px',
  },

  // Categories
  categoriesSection: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  categoryCard: {
    padding: '20px',
    backgroundColor: systemColors.light['background-sunken'],
    borderRadius: '8px',
    textAlign: 'center',
  },
  categoryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    margin: '0 auto 12px',
  },
  categoryTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: '8px',
  },
  categoryList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    color: systemColors.light['content-secondary'],
    lineHeight: '22px',
    textAlign: 'left',
  },

  // Benefits
  benefitsSection: {
    backgroundColor: systemColors.light['content-primary'],
    borderRadius: '12px',
    padding: '32px',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  benefitCard: {
    padding: '20px',
    backgroundColor: systemColors.light['background-raised-inverse'],
    borderRadius: '8px',
  },
  benefitIcon: {
    fontSize: '28px',
    display: 'block',
    marginBottom: '12px',
  },
  benefitTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    color: systemColors.light['background-base'],
    marginBottom: '8px',
  },
  benefitDesc: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    color: systemColors.light['border-default'],
    lineHeight: '18px',
  },
};

export default ArchitectureShowcase;

