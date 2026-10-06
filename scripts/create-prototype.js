#!/usr/bin/env node

/**
 * Create Prototype Script
 * 
 * Creates a new prototype folder with template files.
 * 
 * Usage:
 *   node scripts/create-prototype.js MyPrototype
 *   npm run new-prototype MyPrototype
 *   npm run new-prototype MyPrototype -- --liveboard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get prototype name and flags from args
const args = process.argv.slice(2);
const isLiveboard = args.includes('--liveboard');
const prototypeName = args.find(a => !a.startsWith('--'));

if (!prototypeName) {
  console.error('\x1b[31mError: Please provide a prototype name\x1b[0m');
  console.log('\nUsage:');
  console.log('  npm run new-prototype MyPrototypeName');
  console.log('  node scripts/create-prototype.js MyPrototypeName\n');
  process.exit(1);
}

// Validate name (PascalCase)
if (!/^[A-Z][a-zA-Z0-9]*$/.test(prototypeName)) {
  console.error('\x1b[31mError: Prototype name should be in PascalCase (e.g., MyPrototype)\x1b[0m');
  process.exit(1);
}

// Paths
const prototypesDir = path.join(__dirname, '..', 'src', 'prototypes');
const prototypeDir = path.join(prototypesDir, prototypeName);

// Check if already exists
if (fs.existsSync(prototypeDir)) {
  console.error(`\x1b[31mError: Prototype '${prototypeName}' already exists\x1b[0m`);
  process.exit(1);
}

// Create directory
fs.mkdirSync(prototypeDir, { recursive: true });

// ── Liveboard template ─────────────────────────────────
if (isLiveboard) {
  const liveboardTemplateDir = path.join(prototypesDir, '_liveboard-template');
  if (!fs.existsSync(liveboardTemplateDir)) {
    console.error('\x1b[31mError: _liveboard-template not found. Cannot scaffold Liveboard.\x1b[0m');
    process.exit(1);
  }

  // Recursively copy template directory
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        let content = fs.readFileSync(srcPath, 'utf-8');
        // Replace template name with prototype name
        content = content.replace(/LiveboardTemplate/g, prototypeName);
        content = content.replace(/Liveboard Template/g, prototypeName.replace(/([A-Z])/g, ' $1').trim());
        fs.writeFileSync(destPath, content);
      }
    }
  }

  copyDir(liveboardTemplateDir, prototypeDir);

  // Auto-register in registry.ts
  const registryPath = path.join(prototypesDir, 'registry.ts');
  let registryContent = fs.readFileSync(registryPath, 'utf-8');

  const importLine = `const ${prototypeName} = React.lazy(() => import('./${prototypeName}'));`;
  const importMarker = '/**\n * All registered projects\n */';
  if (!registryContent.includes(importLine)) {
    registryContent = registryContent.replace(importMarker, `${importLine}\n\n${importMarker}`);
  }

  const registryEntry = `  {
    id: '${prototypeName}',
    name: '${prototypeName.replace(/([A-Z])/g, ' $1').trim()}',
    description: 'Liveboard prototype — view and edit modes with SpotterViz.',
    author: 'Designer',
    component: ${prototypeName},
  },`;

  const newMarker = "  // Add more projects here. New prototypes default to 'mine' section.";
  const oldMarker = "  // Add more projects here as they are created";
  const entryMarker = registryContent.includes(newMarker) ? newMarker : oldMarker;
  if (registryContent.includes(entryMarker) && !registryContent.includes(`id: '${prototypeName}'`)) {
    registryContent = registryContent.replace(entryMarker, `${registryEntry}\n${entryMarker}`);
  }

  fs.writeFileSync(registryPath, registryContent);

  console.log('\n\x1b[32m✓ Created Liveboard prototype: ' + prototypeName + '\x1b[0m\n');
  console.log('Files created (from _liveboard-template):');
  console.log(`  src/prototypes/${prototypeName}/index.tsx`);
  console.log(`  src/prototypes/${prototypeName}/styles.ts`);
  console.log(`  src/prototypes/${prototypeName}/data/mockData.ts`);
  console.log(`  src/prototypes/${prototypeName}/components/AnswerTile.tsx`);
  console.log(`  src/prototypes/${prototypeName}/components/SampleBarChart.tsx`);
  console.log(`  src/prototypes/${prototypeName}/components/SampleKPITile.tsx`);
  console.log(`  src/prototypes/${prototypeName}/components/SpotterVizPanel.tsx`);
  console.log(`  src/prototypes/registry.ts (auto-registered)`);
  console.log('\nNext steps:');
  console.log(`  1. Update mock data in src/prototypes/${prototypeName}/data/mockData.ts`);
  console.log(`  2. Customize tile layout in src/prototypes/${prototypeName}/index.tsx`);
  console.log('  3. Preview at localhost:5173/playground\n');
  process.exit(0);
}

// ── Default template ───────────────────────────────────

// Component template
const componentTemplate = `import React, { useState } from 'react';
import { Button, Modal, TextInput, Alert } from '../../components';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { users, analytics } from '../../mocks';

/**
 * ${prototypeName}
 * 
 * Description of your prototype.
 * 
 * Created: ${new Date().toLocaleDateString()}
 */
export const ${prototypeName}: React.FC = () => {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>${prototypeName}</h1>
        <p style={styles.subtitle}>
          Your prototype description here
        </p>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Getting Started</h2>
          <p style={styles.cardText}>
            This is your prototype template. Replace this content with your own UI.
          </p>
          
          <div style={styles.actions}>
            <Button 
              variant="primary" 
              onClick={() => setIsModalOpen(true)}
            >
              Open modal
            </Button>
            <Button variant="secondary">
              Secondary action
            </Button>
          </div>
        </div>

        <Alert
          status="info"
          variant="section"
          message="Tip: Describe your UI to Cursor AI to generate components"
        />
      </main>

      {/* Example Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: systemColors.light['content-secondary'] }}>
          This is an example modal. Replace with your content.
        </p>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
    padding: \`\${spacing.H}px\`,
    fontFamily: 'var(--font-family-primary)',
  },
  header: {
    marginBottom: \`\${spacing.H}px\`,
  },
  title: {
    fontSize: '32px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: \`\${spacing.B}px\`,
  },
  subtitle: {
    fontSize: '16px',
    color: systemColors.light['content-tertiary'],
    margin: 0,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: \`\${spacing.F}px\`,
    maxWidth: '800px',
  },
  card: {
    backgroundColor: systemColors.light['background-base'],
    borderRadius: \`\${spacing.C}px\`,
    padding: \`\${spacing.H}px\`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: \`\${spacing.C}px\`,
  },
  cardText: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: systemColors.light['content-secondary'],
    marginBottom: \`\${spacing.F}px\`,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
};

export default ${prototypeName};
`;

// README template
const readmeTemplate = `# ${prototypeName}

## Description

Describe what this prototype demonstrates.

## Components Used

- Button
- Modal
- Alert
- (add more as you use them)

## How to Run

1. Start the dev server: \`npm run dev\`
2. Navigate to this prototype in the sidebar

## Notes

Add any notes about the prototype here.
`;

// Write files
fs.writeFileSync(path.join(prototypeDir, 'index.tsx'), componentTemplate);
fs.writeFileSync(path.join(prototypeDir, 'README.md'), readmeTemplate);

// Auto-register in registry.ts
const registryPath = path.join(prototypesDir, 'registry.ts');
let registryContent = fs.readFileSync(registryPath, 'utf-8');

// Add the lazy import before the registry array
const importLine = `const ${prototypeName} = React.lazy(() => import('./${prototypeName}'));`;
const importMarker = '/**\n * All registered projects\n */';
if (!registryContent.includes(importLine)) {
  registryContent = registryContent.replace(
    importMarker,
    `${importLine}\n\n${importMarker}`
  );
}

// Add the registry entry before the comment placeholder
const registryEntry = `  {
    id: '${prototypeName}',
    name: '${prototypeName.replace(/([A-Z])/g, ' $1').trim()}',
    description: 'New prototype — describe your UI to Cursor to generate it.',
    author: 'Designer',
    component: ${prototypeName},
  },`;

// Support both old and new marker comments for backward compatibility with forks
const newMarker = "  // Add more projects here. New prototypes default to 'mine' section.";
const oldMarker = "  // Add more projects here as they are created";
const entryMarker = registryContent.includes(newMarker) ? newMarker : oldMarker;
if (registryContent.includes(entryMarker) && !registryContent.includes(`id: '${prototypeName}'`)) {
  registryContent = registryContent.replace(
    entryMarker,
    `${registryEntry}\n${entryMarker}`
  );
}

fs.writeFileSync(registryPath, registryContent);

// Success message
console.log('\n\x1b[32m✓ Created prototype: ' + prototypeName + '\x1b[0m\n');
console.log('Files created:');
console.log(`  src/prototypes/${prototypeName}/index.tsx`);
console.log(`  src/prototypes/${prototypeName}/README.md`);
console.log(`  src/prototypes/registry.ts (auto-registered)`);
console.log('\nNext steps:');
console.log(`  1. Open src/prototypes/${prototypeName}/index.tsx`);
console.log('  2. Describe your UI to Cursor AI');
console.log('  3. Preview at localhost:5173/playground\n');
