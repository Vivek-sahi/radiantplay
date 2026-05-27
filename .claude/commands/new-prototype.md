---
description: Scaffold a new Radiant-compliant prototype. Pass the prototype name and a brief description of what it should do.
---

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

Before writing any code, ask the designer all questions in a single message. Present each question with numbered selectable options — the last option is always for a custom answer. For free-text questions, indicate that clearly.

> To get started, a few quick questions — pick an option or type a custom answer:
>
> **1. Goal** — What problem does this prototype explore or demonstrate?
> *(Free text — describe in one sentence)*
>
> **2. User** — Who is the target user?
> 1. Admin
> 2. Analyst
> 3. Data manager
> 4. End user
> 5. Other — describe
>
> **3. Key screens or flows** — What are the main screens or interaction flows to prototype?
> *(Free text — bullet list is fine)*
>
> **4. ThoughtSpot features** — Any specific ThoughtSpot features involved?
> 1. Answer
> 2. Liveboard
> 3. SpotIQ
> 4. Data model editor
> 5. Monitor
> 6. Spotter
> 7. None
> 8. Other — describe
>
> **5. Layout type** — *(Skip this question if you selected Data model editor above — its layout is fixed)*
> 1. Single page
> 2. Multi-page
> 3. Wizard / stepper
> 4. Dashboard
> 5. Other — describe
>
> **6. Your name** — For the author field in the gallery (e.g. "Maya Chen")
> *(Free text)*
>
> **7. References** — Any Figma links, screenshots, or existing prototypes to reference?
> *(Optional — paste links or describe, or leave blank)*

Wait for the designer's answers before continuing.

**If the answer to question 4 is "Data model editor":** before proceeding to step 4, ask these follow-up questions in a single message. Do NOT ask for layout type — DME layout is fixed.

> A few more questions to configure the Data model editor:
>
> **1. Mode** — Which canvas modes should the prototype include?
> 1. Create only (blank canvas)
> 2. Edit only (pre-populated model)
> 3. Both (toggle between Create and Edit)
>
> **2. SpotterModel AI** — Do you want the AI agent panel?
> 1. Yes — with AI agent panel
> 2. No — canvas only, no AI panel
>
> **3. Dataset** — Which schema should be loaded?
> 1. Default mock retail schema (12 tables)
> 2. Custom — I'll describe it

Wait for answers, then:

**If SpotterModel = Yes (option 1):**

Resolve the API key automatically — check in this order:

1. Run `echo $ANTHROPIC_API_KEY` — if non-empty and not a placeholder, ask:
   > Found `ANTHROPIC_API_KEY` in your shell environment. Use this for the prototype?
   > 1. Yes — use the shell key
   > 2. No — I'll provide a different key

   - If "Yes": write it to `.env.local` → `echo "ANTHROPIC_API_KEY=<key>" > .env.local`
   - If "No": ask them to paste their key, then write it to `.env.local`

2. If no shell key: run `grep "^ANTHROPIC_API_KEY=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'"` — if non-empty and not a placeholder, say:
   > Found an API key in `.env.local` — will use this.

3. If neither found: ask:
   > I need your Anthropic API key to enable the AI agent panel.
   > You can get one at console.anthropic.com if you don't have one.
   >
   > Paste your API key:

   Then write it to `.env.local`: `echo "ANTHROPIC_API_KEY=<key>" > .env.local`

Default to `claude-haiku-4-5-20251001` (fastest, cheapest). The designer can switch models anytime using `/switch-model`.

**If SpotterModel = No (option 2):** scaffold with `window.__DME_CONFIG__ = { spotterModel: false }`. No API key needed.

**If custom dataset:** note the schema to replace `DATASOURCE_TABLES` in the init file.

Load `data-model-editor-ia.md` + `data-model-editor-components.md` (always), and also `data-model-editor-interactions.md` if SpotterModel = Yes.

Use the existing `SpotterModelCreate` / `SpotterModelEdit` components as the foundation — do NOT use the generic scaffolds in step 4.

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

**If the ThoughtSpot feature is "Data model editor":** skip the generic scaffold below and instead create a thin wrapper following the pattern of `src/prototypes/DataModelEditor/index.tsx`, importing from the existing `SpotterModelCreate` / `SpotterModelEdit` components.

#### Base files (always created for generic prototypes)

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
<svg width="800" height="450" viewBox="0  0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  • To switch the AI model used in this prototype: /switch-model
  • To check design system compliance: /radiant-check
  • To pull in upstream updates: /sync-upstream (shows a preview first, then asks before merging)
```
