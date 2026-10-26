# Shared components: rules for this folder

Loaded whenever Claude works in `src/components/`. This is the Radiant design system that every prototype and every designer's fork uses. The root CLAUDE.md conventions still apply.

## Read first

Before creating or changing a component here, read these four rule files (Tier 3 in `.cursor/rules/_orchestration.md`):

1. `.cursor/rules/design-system.md`: folder structure, forwardRef, props, CSS Modules, accessibility, icons
2. `.cursor/rules/component-inventory.md`: what already exists and its props
3. `.cursor/rules/token-usage.md`: colours, spacing, type, radius and shadows
4. `.cursor/rules/content-guidelines.md`: any text the component renders

## Rules

- Only design system components live here. A component one prototype needs goes in `src/prototypes/<Name>/components/`.
- Don't change how an existing component looks or behaves by default. New looks are opt-in through a prop or variant, so prototypes in designers' forks stay as they are until they choose the new version.
- Before changing a prop or its default, search `src/prototypes/` and `src/spotter/` for every use of it.
- Tokens only: `var(--rd-sys-color-*)` in CSS Modules, `sysVar()` in TypeScript. No hex, `rgb()`, `!important` or gradients. If the component you're editing already has them, fix that first.
- Every component works in light and dark mode, has a visible focus style and works from the keyboard.

## Before calling it done

1. `npm run scan:dark -- src/components/<Name>` reports no findings.
2. `npm run build` passes.
3. Add or update the component's row in `src/data/componentRegistry.ts`, and add an entry to `docs/CHANGELOG.md` and `src/data/versionHistory.ts`.
