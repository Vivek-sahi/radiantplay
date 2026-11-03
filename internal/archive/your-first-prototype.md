# Your First Prototype

A step-by-step guide to creating your first interactive prototype.

## Prerequisites

- Cursor IDE installed ([cursor.so](https://cursor.so))
- Node.js 18+ installed
- Repository forked and cloned

## Step 1: Start the Dev Server

```bash
cd radiantplay
npm install
npm run dev
```

Open http://localhost:5173 in your browser. You should see the Radiant Play welcome page.

## Step 2: Create Your Prototype

### Option A: Use the CLI

```bash
npm run new-prototype UserOnboarding
```

This creates:
- `src/prototypes/UserOnboarding/index.tsx`
- `src/prototypes/UserOnboarding/README.md`

### Option B: Create Manually

Create a new file: `src/prototypes/UserOnboarding/index.tsx`

```tsx
import React from 'react';
import { Button } from '../../components';
import { brandColors } from '../../tokens/colors/brand';

export const UserOnboarding: React.FC = () => {
  return (
    <div style={{ padding: '32px' }}>
      <h1>User Onboarding</h1>
      <Button variant="primary">Get started</Button>
    </div>
  );
};

export default UserOnboarding;
```

## Step 3: Describe Your UI to AI

Open Cursor and press `Cmd+K` (Mac) or `Ctrl+K` (Windows) to open the AI chat.

Try this prompt:

> Create a user onboarding wizard with 3 steps: 
> 1. Welcome screen with "Get started" button
> 2. Profile form with name and email inputs  
> 3. Preferences with notification toggle
>
> Include a stepper at the top showing progress, and Next/Back buttons at the bottom.

The AI will generate code using Radiant components.

## Step 4: Preview Your Prototype

Your changes appear instantly in the browser thanks to hot reload.

If you need to add your prototype to the navigation:

1. Open `src/App.tsx`
2. Import your prototype
3. Add it to the `renderContent` function

## Step 5: Iterate

Continue refining your prototype:

- Ask AI to add new features
- Paste screenshots for visual reference
- Reference example prototypes for patterns

## Common Prompts

**Adding a modal:**
> "Add a confirmation modal that opens when clicking Delete"

**Creating a form:**
> "Add a settings form with text inputs for name and email, and a toggle for notifications"

**Building a table:**
> "Create a data table showing users with columns for name, email, and status"

**Adding navigation:**
> "Add a sidebar with links to Dashboard, Settings, and Help"

## Next Steps

- Browse the [Example Prototypes](../src/prototypes/_examples/)
- Read the [Prototyping Guide](../docs/prototyping-guide.md)
- Explore available [Components](../src/components/)

## Tips

1. **Be specific** - Mention component names (Button, Modal, etc.)
2. **Describe interactions** - "opens when clicking", "filters the list"
3. **Reference examples** - "similar to the Filter Dialog example"
4. **Use mock data** - Import from `../../mocks`
