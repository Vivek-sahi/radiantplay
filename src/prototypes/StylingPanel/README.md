# Prototype Template

This is your starting point for creating a new prototype using the Radiant design system.

## Quick Start

1. **Copy this folder** to create your prototype:
   ```
   src/prototypes/YourPrototypeName/
   ```

2. **Describe your UI** to Cursor AI:
   - Paste a screenshot from Figma
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

All components use the Radiant design token system. For custom styling:

```tsx
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

const style = {
  backgroundColor: systemColors.light['content-brand'],
  padding: `${spacing.D}px`,
};
```

## Need Help?

- See `src/prototypes/_examples/` for reference implementations
- Check `docs/prototyping-guide.md` for detailed instructions
- Review `.cursor/rules/prototype-generation.md` for AI guidelines
