---
description: Modal and dialog patterns including size selection (M1-M4), wizard modals, subnavigation modals, splashscreen modals, footer button placement, and progress bars. Use when building modals, dialogs, confirmation prompts, or multi-step wizards. Do NOT use for inline alerts or toasts (see widget-patterns.md).
alwaysApply: false
---

# Modal Patterns (M1-M4)

> Guidelines for using Modal components from the Radiant 3.0 Design System

**Showcase:** See `src/pages/SurfacesShowcase.tsx` for interactive component documentation.

## Size Selection Guide

| Size | Width | Use Case |
|------|-------|----------|
| **M1** | 394px | Confirmations, alerts, simple forms, single-field inputs |
| **M2** | 788px | Standard forms, settings panels, content previews |
| **M3** | 1182px | Complex layouts, data tables, comparison views, multi-column content |
| **M4** | Full Screen | Immersive experiences, editors, dashboards, full-page workflows |

## Type Selection Guide

| Type | When to Use |
|------|-------------|
| **simple** | Single-step actions, confirmations, basic forms, content display |
| **wizard** | Multi-step processes (2-4 steps), onboarding flows, guided setup, sequential forms |
| **subnavigation** | Settings with categories, complex configuration panels, tabbed content |
| **splashscreen** | Feature announcements, onboarding, tutorials, welcome screens |

## Quick Reference

### Basic Modal Usage

```tsx
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  size="M2"
  type="simple"
  title="Modal Title"
  footer={
    <>
      <Button variant="secondary" onClick={handleClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
    </>
  }
>
  {/* Content */}
</Modal>
```

### Wizard Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  size="M2"
  type="wizard"
  title="Create New Group"
  eyebrow="Step 1 of 3"
  currentStep={1}
  totalSteps={3}
  footer={
    <>
      <Button variant="tertiary" onClick={handleCancel}>Cancel</Button>
      <Button variant="secondary" onClick={handleBack}>Back</Button>
      <Button variant="primary" onClick={handleNext}>Next</Button>
    </>
  }
>
  <StepContent />
</Modal>
```

### Sub-navigation Modal

```tsx
import { Modal, ModalNavPanel, ModalNavItem } from '@/components/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  size="M3"
  type="subnavigation"
  title="Settings"
  navigation={
    <ModalNavPanel>
      <ModalNavItem active={section === 'general'} onClick={() => setSection('general')}>
        General
      </ModalNavItem>
      <ModalNavItem active={section === 'security'} onClick={() => setSection('security')}>
        Security
      </ModalNavItem>
    </ModalNavPanel>
  }
>
  <SettingsContent section={section} />
</Modal>
```

### Splash Screen Modal

```tsx
import { Modal, ModalSplashContent } from '@/components/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  size="M2"
  type="splashscreen"
  mediaContent={<img src={featureImage} alt="New Feature" />}
  footer={<Button variant="primary" onClick={handleClose}>Done</Button>}
>
  <ModalSplashContent
    title="Introducing Parameters"
    bulletPoints={[
      'Create formulas with adjustable values',
      'Run different scenarios without changing answers'
    ]}
  />
</Modal>
```

## Design Tokens

Always use Radiant tokens for styling:

```typescript
// Import tokens
import { spacing, componentSpacing } from '@/tokens';
import { systemColors } from '../../tokens/colors';
import { v2TextStyles } from '@/tokens';
import { componentShadows } from '@/tokens';

// Modal-specific spacing
componentSpacing.modal.padding        // 24px
componentSpacing.modal.headerPaddingY // 20px
componentSpacing.modal.footerPaddingY // 16px

// Colors
systemColors.light['background-base']      // Modal surface (white)
systemColors.light['background-sunken']    // Footer background (gray-10)
systemColors.light['border-divider']       // Borders (gray-20)
systemColors.light['content-primary']      // Title text (gray-90)
systemColors.light['content-brand']        // Tertiary button text (blue-60)

// Typography
v2TextStyles.modalTitle     // 20px Medium, 28px line-height
v2TextStyles.bodyNormal     // 14px Light, 20px line-height
```

## Button Placement (Footer)

Follow Figma spec for footer button arrangement:

```
┌────────────────────────────────────────────────────┐
│ [Tertiary Action]          [Secondary] [Primary]  │
└────────────────────────────────────────────────────┘
     Left side                      Right side
```

- **Tertiary** (left): Low-emphasis actions like "Learn More", "Help"
- **Secondary** (right, before primary): "Cancel", "Back"
- **Primary** (right, last): Main action - "Submit", "Next", "Confirm"

## Wizard Progress Bar

- Supports 2-4 steps
- Active steps: Primary blue (`systemColors.light['content-brand']`)
- Inactive steps: Gray (`systemColors.light['border-subtle']`)
- Height: 4px with 6px gaps

## Accessibility

- Focus trap is automatic
- Escape key closes modal (can be disabled with `closeOnEscape={false}`)
- `aria-modal="true"` and `aria-labelledby` are applied
- Close button has `aria-label="Close modal"`

## Component Composition

For advanced customization, compose with sub-components:

```tsx
import {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalWizardProgress,
  ModalNavPanel,
  ModalNavItem,
  ModalSplashContent,
} from '@/components/Modal';
```

## Files Reference

- `src/components/Modal/Modal.tsx` - Main component
- `src/components/Modal/Modal.module.css` - Styles
- `src/components/Modal/ModalHeader.tsx` - Header sub-component
- `src/components/Modal/ModalFooter.tsx` - Footer sub-component
- `src/components/Modal/ModalWizardProgress.tsx` - Step indicator
- `src/components/Modal/ModalNavPanel.tsx` - Navigation panel
- `src/components/Modal/ModalNavItem.tsx` - Navigation item
- `src/components/Modal/ModalSplashContent.tsx` - Splash content layout
