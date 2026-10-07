import React, { useState } from 'react';
import { referenceColors, sysVar, shadowVar, systemColors, rdComponentColors } from '../tokens/colors';
import { figmaNameAliases } from '../tokens/colors/system';
import { componentNameAliases } from '../tokens/colors/component';
import { LastUpdated } from '../components/LastUpdated';

type ActiveLayer = 'reference' | 'system' | 'component' | null;

// Token counts, without the alias names
const systemTokenCount = Object.keys(systemColors.light).length - Object.keys(figmaNameAliases).length;
const componentTokenCount = Object.keys(rdComponentColors.light).length - Object.keys(componentNameAliases).length;

export const ArchitectureShowcase: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>(null);

  return (
    <div style={styles.container}>
      {/* Header */}
      <section style={styles.headerSection}>
        <LastUpdated date="2026-10-07" />
        <h2 style={styles.pageTitle}>Token architecture</h2>
        <p style={styles.pageDescription}>
          The Radiant design system uses three layers of tokens. Every system and component token has a
          light and a dark value, so every component follows the theme.
        </p>
      </section>

      {/* Architecture Diagram */}
      <section style={styles.diagramSection}>
        <h3 style={styles.sectionTitle}>Token flow diagram</h3>
        <p style={styles.sectionDescription}>
          Select a layer to see details. Tokens flow from reference to system to component.
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
              <span style={styles.layerTitle}>Reference tokens</span>
            </div>
            <p style={styles.layerSubtitle}>Primitive values (rd-ref-color-*)</p>
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
              <path d="M20 0 L20 45 M10 35 L20 50 L30 35" stroke={sysVar('border-default')} strokeWidth="2" fill="none" />
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
              <span style={styles.layerTitle}>System tokens</span>
            </div>
            <p style={styles.layerSubtitle}>Semantic, follows the theme (rd-sys-color-*)</p>
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
              <path d="M20 0 L20 45 M10 35 L20 50 L30 35" stroke={sysVar('border-default')} strokeWidth="2" fill="none" />
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
              <span style={styles.layerTitle}>Component tokens</span>
            </div>
            <p style={styles.layerSubtitle}>Per component (rd-comp-color-*)</p>
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
                <h4 style={styles.detailsTitle}>🎨 Reference / primitive tokens</h4>
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
                <h4 style={styles.detailsTitle}>💡 System tokens (light and dark)</h4>
                <p style={styles.detailsDescription}>
                  {systemTokenCount} semantic tokens in three groups (background, content and border), plus
                  three shadows: <code>shadow-surface</code>, <code>shadow-menu</code> and <code>shadow-modal</code>.
                  Each has a light and a dark value in <code>tokens.css</code>. ThemeProvider sets{' '}
                  <code>data-theme</code> on <code>&lt;html&gt;</code>, and every{' '}
                  <code>var(--rd-sys-color-*)</code> switches with it. The names follow the product; older
                  names such as <code>background-subtle</code> and <code>border-default</code> still work as aliases.
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

  /* Border */
  --rd-sys-color-border-default: #C0C6CF;
  --rd-sys-color-border-focus: #71A1F4;

  /* Shadow */
  --rd-sys-color-shadow-menu: 0 0 4px #19233114, 0 12px 24px #1923311f;
}

[data-theme="dark"] {
  --rd-sys-color-background-base: #1F2024;
  --rd-sys-color-content-primary: #DFE0E2;
  --rd-sys-color-shadow-menu: 0 0 6px rgba(0,0,0,0.16), 0 12px 28px rgba(0,0,0,0.32);
  /* every token has a dark value */
}`}</pre>
                </div>
              </>
            )}
            {activeLayer === 'component' && (
              <>
                <h4 style={styles.detailsTitle}>🧩 Component tokens</h4>
                <p style={styles.detailsDescription}>
                  {componentTokenCount} tokens for buttons, chips, progress, charts, toggles and the segmented
                  control, each with a light and a dark value. The 13 chart tokens
                  (<code>--rd-comp-color-chart-*</code>) take their names and dark values from the product;
                  their light values are proposed. CSS modules read system and component tokens as CSS
                  custom properties.
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
        <h3 style={styles.sectionTitle}>Real example: button component</h3>
        <p style={styles.sectionDescription}>
          See how tokens flow through the 3-layer system to create a Primary Button.
        </p>

        <div style={styles.exampleFlow}>
          {/* Step 1 */}
          <div style={styles.exampleStep}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitle}>Reference token</span>
            </div>
            <div style={styles.stepContent}>
              <code style={styles.stepCode}>referenceColors.brand['60']</code>
              <div style={styles.colorPreview}>
                <div style={{ ...styles.colorSwatch, backgroundColor: referenceColors.brand['60'] }} />
                <span>{referenceColors.brand['60']}</span>
              </div>
            </div>
          </div>

          <div style={styles.stepArrow}>→</div>

          {/* Step 2 */}
          <div style={styles.exampleStep}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>2</span>
              <span style={styles.stepTitle}>System token</span>
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
              <span style={styles.stepTitle}>CSS module applies</span>
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
              <span style={styles.stepTitle}>Rendered button</span>
            </div>
            <div style={styles.stepContent}>
              <button style={styles.previewButton}>Add</button>
            </div>
          </div>
        </div>
      </section>

      {/* Consumption Patterns */}
      <section style={styles.consumptionSection}>
        <h3 style={styles.sectionTitle}>How tokens are consumed</h3>
        <p style={styles.sectionDescription}>
          Tokens reach the UI two ways: CSS custom properties in CSS modules, and helper functions for
          inline styles. Both follow the theme.
        </p>

        <div style={styles.consumptionGrid}>
          {/* Path 1: CSS Custom Properties */}
          <div style={styles.consumptionCard}>
            <div style={styles.consumptionHeader}>
              <span style={styles.consumptionBadge}>CSS modules</span>
              <span style={styles.consumptionTag}>Follows the theme</span>
            </div>
            <p style={styles.consumptionDesc}>
              Component <code>.module.css</code> files use <code>var(--rd-sys-color-*)</code> and <code>var(--rd-comp-color-*)</code>.
              The values switch when <code>data-theme</code> changes, with no extra code.
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
              <span style={styles.consumptionUsageValue}>Radiant and Spotter component styles</span>
            </div>
          </div>

          {/* Path 2: TypeScript Objects */}
          <div style={styles.consumptionCard}>
            <div style={styles.consumptionHeader}>
              <span style={{ ...styles.consumptionBadge, backgroundColor: sysVar('background-success'), color: sysVar('content-success') }}>TypeScript</span>
              <span style={styles.consumptionTag}>Inline styles</span>
            </div>
            <p style={styles.consumptionDesc}>
              Pages and prototypes use <code>sysVar()</code>, <code>compVar()</code> and <code>shadowVar()</code> for
              inline styles. Each returns the CSS variable, so the style follows the theme.{' '}
              <code>systemColors.light[...]</code> returns a fixed hex value and stays light; use it only
              when you need the raw value, such as a swatch.
            </p>
            <div style={styles.codeBlock}>
              <div style={styles.codeHeader}>MyPage.tsx</div>
              <pre style={styles.code}>{`import { sysVar, compVar, shadowVar }
  from '@tokens/colors';

<div style={{
  background: sysVar('background-base'),
  color: sysVar('content-primary'),
  borderColor: sysVar('border-divider'),
  boxShadow: shadowVar('surface'),
}} />

<span style={{
  background: compVar('chip-filter-default'),
}} />`}</pre>
            </div>
            <div style={styles.consumptionUsage}>
              <span style={styles.consumptionUsageLabel}>Used by</span>
              <span style={styles.consumptionUsageValue}>Pages and prototypes</span>
            </div>
          </div>
        </div>

        <div style={styles.consumptionNote}>
          <strong>When to use which?</strong>{' '}
          Use CSS custom properties in component CSS modules. Use <code>sysVar()</code>,{' '}
          <code>compVar()</code> and <code>shadowVar()</code> for inline styles in pages and prototypes.
          Either way, the UI switches with the theme.
        </div>
      </section>

      {/* File Structure */}
      <section style={styles.structureSection}>
        <h3 style={styles.sectionTitle}>File structure</h3>
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
            <span style={styles.treeDesc}>Component tokens, light and dark (button, chip, progress, chart, toggle, segmented control)</span>
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
            <span style={styles.treeDesc}>rd-sys-color-* and rd-comp-color-* variables, with a light and a dark block</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 40 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>global.css</span>
            <span style={styles.treeDesc}>Base styles</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 20 }}>
            <span style={styles.folderIcon}>📁</span>
            <span style={styles.folderName}>context/</span>
          </div>
          <div style={{ ...styles.treeItem, marginLeft: 40 }}>
            <span style={styles.fileIcon}>📄</span>
            <span style={styles.fileName}>ThemeContext.tsx</span>
            <span style={styles.treeDesc}>Theme controller: light, dark or system, saved in the browser</span>
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
        <h3 style={styles.sectionTitle}>Token categories</h3>
        <div style={styles.categoryGrid}>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: sysVar('background-ghost-highlight') }}>🎨</div>
            <h4 style={styles.categoryTitle}>Colors</h4>
            <ul style={styles.categoryList}>
              <li>9 reference scales (00-100)</li>
              <li>{systemTokenCount} system tokens, light and dark</li>
              <li>{componentTokenCount} component tokens, light and dark</li>
              <li>rd-ref / rd-sys / rd-comp prefix</li>
            </ul>
          </div>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: sysVar('background-success') }}>📏</div>
            <h4 style={styles.categoryTitle}>Spacing</h4>
            <ul style={styles.categoryList}>
              <li>4px increments</li>
              <li>spacing-1 to spacing-24</li>
              <li>Consistent gaps</li>
              <li>Padding & margins</li>
            </ul>
          </div>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: sysVar('background-accent-purple-subtle') }}>🔤</div>
            <h4 style={styles.categoryTitle}>Typography</h4>
            <ul style={styles.categoryList}>
              <li>Font family: Geist</li>
              <li>Sizes: 12-40px</li>
              <li>Weights: 375-600</li>
              <li>Line heights</li>
            </ul>
          </div>
          <div style={styles.categoryCard}>
            <div style={{ ...styles.categoryIcon, backgroundColor: sysVar('background-warning') }}>⬜</div>
            <h4 style={styles.categoryTitle}>Radius & Shadow</h4>
            <ul style={styles.categoryList}>
              <li>Radius: 2-24px, full</li>
              <li>Shadows: surface, menu, modal</li>
              <li>Focus rings</li>
              <li>Elevation levels</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={styles.benefitsSection}>
        <h3 style={styles.sectionTitle}>Why this architecture?</h3>
        <div style={styles.benefitsGrid}>
          <div style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🔄</span>
            <h4 style={styles.benefitTitle}>Single source of truth</h4>
            <p style={styles.benefitDesc}>Change a color once in reference.ts, and it cascades through system and component tokens automatically.</p>
          </div>
          <div style={styles.benefitCard}>
            <span style={styles.benefitIcon}>🌙</span>
            <h4 style={styles.benefitTitle}>Light, dark and system themes</h4>
            <p style={styles.benefitDesc}>ThemeProvider owns the theme and is the only code that sets data-theme on the html element. Pick light, dark or system with the theme switch in the gallery header or the docs sidebar, or press Ctrl+D. The browser saves the choice; light is the default.</p>
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
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    padding: '32px',
    boxShadow: shadowVar('surface'),
  },
  pageTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '28px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '12px',
  },
  pageDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-regular)',
    color: sysVar('content-secondary'),
    lineHeight: '24px',
    maxWidth: '800px',
  },

  // Section styles
  sectionTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '20px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '8px',
  },
  sectionDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    fontWeight: 'var(--font-weight-regular)',
    color: sysVar('content-secondary'),
    marginBottom: '24px',
  },

  // Diagram Section
  diagramSection: {
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    padding: '32px',
    boxShadow: shadowVar('surface'),
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
    boxShadow: shadowVar('menu'),
  },
  brandLayer: {
    backgroundColor: sysVar('background-ghost-highlight'),
    borderColor: sysVar('background-information'),
  },
  semanticLayer: {
    backgroundColor: sysVar('background-success'),
    borderColor: sysVar('background-success'),
  },
  componentLayer: {
    backgroundColor: sysVar('background-accent-purple-subtle'),
    borderColor: sysVar('background-accent-purple-subtle'),
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
    backgroundColor: sysVar('content-primary'),
    color: sysVar('content-primary-inverse'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'var(--font-weight-emphasis)',
  },
  layerTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '18px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
  },
  layerSubtitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-secondary'),
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
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    color: sysVar('content-primary'),
    backgroundColor: sysVar('background-base'),
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
    color: sysVar('content-secondary'),
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
    fontFamily: 'var(--font-family-primary)',
    fontSize: '11px',
    color: sysVar('content-secondary'),
    marginTop: '-8px',
  },

  // Details Panel
  detailsPanel: {
    marginTop: '24px',
    padding: '24px',
    backgroundColor: sysVar('background-sunken'),
    borderRadius: '8px',
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  detailsTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '8px',
  },
  detailsDescription: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    color: sysVar('content-secondary'),
    lineHeight: '20px',
    marginBottom: '16px',
  },
  codeBlock: {
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'var(--rd-ref-color-dark-gray-00)', // code blocks stay dark in both themes
  },
  codeHeader: {
    padding: '8px 16px',
    backgroundColor: 'var(--rd-ref-color-dark-gray-10)',
    fontFamily: 'var(--font-family-mono)',
    fontSize: '12px',
    color: 'var(--rd-ref-color-dark-gray-60)',
  },
  code: {
    padding: '16px',
    margin: 0,
    fontFamily: 'var(--font-family-mono)',
    fontSize: '13px',
    color: 'var(--rd-ref-color-dark-gray-90)',
    lineHeight: '20px',
    overflow: 'auto',
  },

  // Example Section
  exampleSection: {
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    padding: '32px',
    boxShadow: shadowVar('surface'),
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
    backgroundColor: sysVar('background-sunken'),
    borderRadius: '8px',
    border: `1px solid ${sysVar('background-subtle')}`,
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
    backgroundColor: sysVar('background-brand'),
    color: sysVar('content-alternate'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'var(--font-weight-emphasis)',
  },
  stepTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stepCode: {
    fontFamily: 'var(--font-family-mono)',
    fontSize: '11px',
    color: sysVar('content-primary'),
    backgroundColor: sysVar('background-base'),
    padding: '6px 8px',
    borderRadius: '4px',
    wordBreak: 'break-all',
  },
  stepArrow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '24px',
    color: sysVar('content-tertiary'),
    flexShrink: 0,
  },
  colorPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: sysVar('content-secondary'),
  },
  colorSwatch: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: `1px solid ${sysVar('border-subtle-hover')}`,
  },
  previewButton: {
    padding: '6px 16px',
    backgroundColor: sysVar('background-brand'),
    color: sysVar('content-alternate'),
    border: 'none',
    borderRadius: '16px',
    fontFamily: 'var(--font-family-primary)',
    fontSize: '14px',
    fontWeight: 'var(--font-weight-regular)',
    cursor: 'pointer',
  },

  // Consumption Patterns
  consumptionSection: {
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    padding: '32px',
    boxShadow: shadowVar('surface'),
  },
  consumptionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  consumptionCard: {
    backgroundColor: sysVar('background-sunken'),
    borderRadius: '10px',
    padding: '24px',
    border: `1px solid ${sysVar('background-subtle')}`,
  },
  consumptionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  consumptionBadge: {
    fontSize: '12px',
    fontWeight: 'var(--font-weight-emphasis)',
    padding: '3px 10px',
    borderRadius: '6px',
    backgroundColor: sysVar('background-ghost-highlight'),
    color: sysVar('content-brand'),
  },
  consumptionTag: {
    fontSize: '11px',
    fontWeight: 500,
    color: sysVar('content-secondary'),
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: sysVar('background-subtle'),
  },
  consumptionDesc: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '20px',
    marginBottom: '16px',
  },
  consumptionUsage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${sysVar('background-subtle')}`,
  },
  consumptionUsageLabel: {
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-secondary'),
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  consumptionUsageValue: {
    fontSize: '12px',
    fontWeight: 500,
    color: sysVar('content-primary'),
  },
  consumptionNote: {
    fontSize: '13px',
    fontWeight: 400,
    color: sysVar('content-secondary'),
    lineHeight: '20px',
    backgroundColor: sysVar('background-ghost-highlight'),
    border: `1px solid ${sysVar('background-information')}`,
    borderRadius: '8px',
    padding: '12px 16px',
  },

  // File Structure
  structureSection: {
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    padding: '32px',
    boxShadow: shadowVar('surface'),
  },
  fileTree: {
    fontFamily: 'var(--font-family-mono)',
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
    color: sysVar('content-primary'),
    fontWeight: 500,
  },
  fileName: {
    color: sysVar('content-primary'),
  },
  treeLabel: {
    color: sysVar('content-brand'),
    fontSize: '11px',
    marginLeft: '8px',
  },
  treeDesc: {
    color: sysVar('content-secondary'),
    fontSize: '11px',
    marginLeft: '8px',
  },

  // Categories
  categoriesSection: {
    backgroundColor: sysVar('background-base'),
    borderRadius: '12px',
    padding: '32px',
    boxShadow: shadowVar('surface'),
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  categoryCard: {
    padding: '20px',
    backgroundColor: sysVar('background-sunken'),
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
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '8px',
  },
  categoryList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-secondary'),
    lineHeight: '22px',
    textAlign: 'left',
  },

  // Benefits
  benefitsSection: {
    backgroundColor: sysVar('content-primary'),
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
    backgroundColor: sysVar('background-raised-inverse'),
    borderRadius: '8px',
  },
  benefitIcon: {
    fontSize: '28px',
    display: 'block',
    marginBottom: '12px',
  },
  benefitTitle: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '16px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary-inverse'),
    marginBottom: '8px',
  },
  benefitDesc: {
    fontFamily: 'var(--font-family-primary)',
    fontSize: '13px',
    color: sysVar('content-tertiary'),
    lineHeight: '18px',
  },
};

export default ArchitectureShowcase;

