# Prototype Template

This is your starting point for creating a new prototype using the Radiant design system.

## Quick Start

1. **Create your prototype** by typing this in Claude's Code tab:
   ```
   /rp-new-prototype YourPrototypeName
   ```

2. **Describe your UI** to Claude in the same chat:
   - Drag in a screenshot from Figma
   - Describe the layout and interactions
   - Reference ThoughtSpot UI patterns

3. **AI generates the code** using Radiant components

## Available Components

```tsx
import {
  // Buttons & Actions
  Button,           // primary, secondary, tertiary variants
  
  // Feedback
  Alert,            // info, success, warning, failure, muted
  Modal,            // dialog overlays
  
  // Form Controls
  TextInput,        // text fields
  SearchInput,      // search with icon
  Checkbox,         // multi-select
  Radio,            // single-select
  Toggle,           // on/off switch
  
  // Navigation & Layout
  Tabs,             // tab navigation
  Sidebar,          // side navigation
  Chip,             // tags/labels
  
  // Icons
  Icon,             // 46 icons available
} from '../../components';
```

## Available Mock Data

```tsx
import {
  users,           // Sample user profiles
  analytics,       // Chart and table data
  navigation,      // Menu structures
  forms,           // Dropdown options
} from '../../mocks';
```

## Example Usage

```tsx
import React, { useState } from 'react';
import { Button, Modal, TextInput } from '../../components';
import { users } from '../../mocks';

export const MyPrototype: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open dialog
      </Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit user"
      >
        <TextInput label="Name" defaultValue={users[0].name} />
      </Modal>
    </div>
  );
};
```

## Tips for AI-Generated Prototypes

1. **Be specific** about layout: "Two-column layout with sidebar on left"
2. **Reference components**: "Use a primary Button for the main action"
3. **Describe interactions**: "Modal opens when clicking the edit icon"
4. **Mention data**: "Show a table with 5 sample users"

## Design Tokens

All components use the Radiant design token system. For custom styling, read colours through `sysVar()` (system tokens) or `compVar()` (component tokens). Each returns a CSS variable, so the colour follows light and dark mode:

```tsx
import { sysVar } from '@tokens/colors';
import { spacing } from '@tokens/spacing';

const style = {
  backgroundColor: sysVar('background-brand'),
  color: sysVar('content-primary-inverse'),
  padding: `${spacing.D}px`,
};
```

Do not read the `systemColors.light` object in a style, and do not hard-code hex or rgb colours. Both stay light when the theme switches to dark. For a translucent colour, mix the variable: `color-mix(in srgb, ${sysVar('content-brand')} 10%, transparent)`.

## Need Help?

- See `src/prototypes/_examples/` for reference implementations
- Check `docs/prototyping-guide.md` for detailed instructions
- Review `.cursor/rules/prototype-generation.md` for AI guidelines
