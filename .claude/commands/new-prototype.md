Start a new prototype for: $ARGUMENTS

## Instructions

Follow these steps in order. Stop immediately if any step fails and explain what went wrong.

---

### 1. Pull latest main

```
git checkout main
git pull origin main
```

---

### 2. Confirm the prototype name

Derive a PascalCase prototype name from the description in $ARGUMENTS.

- Examples: "filter panel" → `FilterPanel`, "user onboarding flow" → `UserOnboarding`, "liveboard comments" → `LiveboardComments`
- Keep it short (1–3 words, no articles or filler)

Ask the designer:

> **Prototype name:** `<DerivedName>` — does this work, or would you like a different name?

Wait for confirmation before continuing. Use the confirmed name for all remaining steps.

---

### 3. Ask discovery questions

Before writing any code, ask the designer these questions in a single message so they can answer all at once:

> To get started, a few quick questions:
>
> 1. **Goal** — What problem does this prototype explore or demonstrate?
> 2. **User** — Who is the target user? (e.g. admin, analyst, data manager, end user)
> 3. **Key screens or flows** — What are the main screens or interaction flows to prototype? (bullet list is fine)
> 4. **ThoughtSpot features** — Any specific ThoughtSpot features involved? (Answer, Liveboard, SpotIQ, Worksheet, Monitor, Spotter — or none)
> 5. **Layout type** — Single page, multi-page, wizard/stepper, or dashboard?
> 6. **Your name** — For the author field in the gallery (e.g. "Maya Chen")
> 7. **References** — Any Figma links, screenshots, or existing prototypes to reference? (optional)

Wait for the designer's answers before continuing.

---

### 4. Create the branch

Slugify the confirmed prototype name for the branch:
- Lowercase, hyphen-separated
- Example: `FilterPanel` → `prototype/filter-panel`

```
git checkout -b prototype/<slug>
```

---

### 5. Scaffold the prototype files

Use the designer's **layout type** answer from step 3 to pick the right scaffold. All scaffolds share the same base files — the difference is the starter content in the main component.

#### Base files (always created)

**`src/prototypes/<Name>/components/.gitkeep`**
Empty file — reserves the components folder.

**`src/prototypes/<Name>/data/mockData.ts`**
```ts
/**
 * Mock data for <Name> prototype
 *
 * Add your types and data here. Use realistic names, dates, and values.
 * Import with: import { ... } from './data/mockData';
 */

// Example — replace with your own types and data:
//
// export interface Item {
//   id: string;
//   name: string;
//   status: 'active' | 'inactive';
// }
//
// export const items: Item[] = [
//   { id: '1', name: 'Example item', status: 'active' },
// ];
```

**`src/prototypes/<Name>/styles.ts`**
```ts
import { CSSProperties } from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

export const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
  },
  content: {
    padding: `${spacing.H}px`,
    maxWidth: '1200px',
    margin: '0 auto',
  },
};
```

#### Main component — varies by layout type

**If layout type is "dashboard" or "multi-page":**

**`src/prototypes/<Name>/index.tsx`**
```tsx
import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

/**
 * <Name>
 *
 * Goal: <goal from step 3>
 * User: <user from step 3>
 * Flows: <key screens/flows from step 3>
 */

const HEADER_HEIGHT = 56;
const SIDEBAR_WIDTH = 240;

export const <Name>: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: systemColors.light['background-sunken'] }}>
      {/* Header */}
      <header style={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', padding: `0 ${spacing.F}px`, backgroundColor: systemColors.light['background-base'], borderBottom: `1px solid ${systemColors.light['border-divider']}` }}>
        <h1 style={{ fontSize: '16px', fontWeight: 600, color: systemColors.light['content-primary'] }}>
          <Name display name>
        </h1>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <nav style={{ width: SIDEBAR_WIDTH, backgroundColor: systemColors.light['background-base'], borderRight: `1px solid ${systemColors.light['border-divider']}`, padding: `${spacing.D}px` }}>
          {/* Add navigation items here */}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', padding: `${spacing.F}px` }}>
          {/* Start building your prototype here */}
        </main>
      </div>
    </div>
  );
};

export default <Name>;
```

**If layout type is "wizard/stepper":**

**`src/prototypes/<Name>/index.tsx`**
```tsx
import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

/**
 * <Name>
 *
 * Goal: <goal from step 3>
 * User: <user from step 3>
 * Flows: <key screens/flows from step 3>
 */

const STEPS = ['Step 1', 'Step 2', 'Step 3'];

export const <Name>: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: systemColors.light['background-sunken'], display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${spacing.J}px ${spacing.F}px` }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: `${spacing.D}px`, marginBottom: `${spacing.H}px` }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: `${spacing.B}px`, color: i <= currentStep ? systemColors.light['content-brand'] : systemColors.light['content-secondary'] }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, backgroundColor: i <= currentStep ? systemColors.light['background-information'] : systemColors.light['background-subtle'] }}>
              {i + 1}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ width: '100%', maxWidth: 600, backgroundColor: systemColors.light['background-base'], borderRadius: 12, padding: `${spacing.H}px`, border: `1px solid ${systemColors.light['border-divider']}` }}>
        {/* Start building your step content here */}
        <p style={{ color: systemColors.light['content-secondary'] }}>Step {currentStep + 1} content</p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: `${spacing.C}px`, marginTop: `${spacing.F}px` }}>
        {currentStep > 0 && (
          <button onClick={handleBack} style={{ padding: `${spacing.B}px ${spacing.D}px`, borderRadius: 8, border: `1px solid ${systemColors.light['border-default']}`, backgroundColor: systemColors.light['background-base'], cursor: 'pointer' }}>
            Back
          </button>
        )}
        <button onClick={handleNext} style={{ padding: `${spacing.B}px ${spacing.D}px`, borderRadius: 8, border: 'none', backgroundColor: systemColors.light['content-brand'], color: '#fff', cursor: 'pointer' }}>
          {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default <Name>;
```

**If layout type is "single page" or anything else:**

**`src/prototypes/<Name>/index.tsx`**
```tsx
import React from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

/**
 * <Name>
 *
 * Goal: <goal from step 3>
 * User: <user from step 3>
 * Flows: <key screens/flows from step 3>
 */
export const <Name>: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: systemColors.light['background-sunken'] }}>
      <div style={{ padding: `${spacing.H}px`, maxWidth: 1200, margin: '0 auto' }}>
        {/* Start building your prototype here */}
      </div>
    </div>
  );
};

export default <Name>;
```

---

### 6. Create the thumbnail

Create a basic SVG thumbnail at `src/prototypes/thumbnails/<Name>.svg`:

```svg
<svg width="800" height="450" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="800" height="450" fill="#F6F8FA"/>

  <!-- UI representation -->
  <rect x="100" y="80" width="600" height="300" rx="12" fill="white"/>

  <!-- Title -->
  <text x="400" y="420" fill="#1D232F" font-family="system-ui" font-size="18" text-anchor="middle" font-weight="500">
    <Display Name>
  </text>
</svg>
```

Use the display name from the registry entry as the title text.

---

### 7. Register in registry-mine.ts

Open `src/prototypes/registry-mine.ts` — this is the designer's own file, never touched by upstream.

**A — Add the thumbnail import** at the top of the file (after the existing import):

```ts
import <Name>Thumbnail from './thumbnails/<Name>.svg';
```

**B — Add the lazy import** before the `myRegistry` array:

```ts
const <Name> = React.lazy(() => import('./<Name>'));
```

**C — Add the registry entry** inside the `myRegistry` array:

```ts
  {
    id: '<Name>',
    name: '<Display name in sentence case>',
    description: '<One sentence from the designer's goal answer>',
    author: '<designer's name from step 3>',
    lastModified: '<today's date as YYYY-MM-DD>',
    thumbnail: <Name>Thumbnail,
    component: <Name>,
    section: 'mine',
  },
```

> **Important:** Always write to `registry-mine.ts`, never to `registry-core.ts` or `registry.ts`.
> `registry-mine.ts` is the designer's file — upstream never changes it, so it never conflicts on sync.

---

### 8. Report

Print a summary in this format:

```
Prototype created: <Name>
Branch: prototype/<slug>

Files created:
  src/prototypes/<Name>/index.tsx          ← main component (<layout type> layout)
  src/prototypes/<Name>/styles.ts          ← shared styles with tokens
  src/prototypes/<Name>/data/mockData.ts   ← mock data starter
  src/prototypes/<Name>/components/        ← put your local components here
  src/prototypes/thumbnails/<Name>.svg     ← gallery thumbnail

Registered in registry-mine.ts — it will appear in the gallery under "My prototypes".

What's next:
  • Describe your UI or paste a Figma screenshot — Claude will build it using Radiant components
  • To check design system compliance: /radiant-check
  • To check for upstream updates: /check-upstream
```
