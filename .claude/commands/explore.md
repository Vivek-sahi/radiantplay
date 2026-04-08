Suspend Radiant design system constraints for freeform UI exploration: $ARGUMENTS

## Instructions

This skill is a context modifier — it relaxes Radiant rules for the specified scope so the designer can explore freely.

### 1. Parse the argument

Read `$ARGUMENTS` to determine:
- **What** is being explored (e.g., "shadcn form components", "custom color palette", "tailwind for the chart")
- **Scope** — whole file or partial (e.g., "just the sidebar", "the chart section")

If no argument is provided, ask the designer what they want to explore.

### 2. Add the explore marker

Add a comment to the top of the relevant file (or section):

```typescript
// @explore: <description from arguments>
```

If the scope is partial (e.g., "just the sidebar"), add the marker above the specific section, not at the top of the file.

### 3. Suspend Radiant constraints

For the explored scope, the following are **suspended**:
- Radiant component enforcement (raw `<button>`, `<input>`, `<div>` are fine)
- Token-only color/spacing/typography rules (hardcoded hex, custom scales are fine)
- Compliance checklist checks
- Content guidelines (sentence case, approved words)
- Layout primitive enforcement (`Horizontal`/`Vertical` not required)

The following **still apply**:
- TypeScript type safety
- Accessibility basics (keyboard nav, alt text, aria-labels)
- `npm run build` must pass
- File placement conventions (keep in `src/prototypes/<Name>/`)

### 4. Inform the designer

Print a confirmation:

```
Exploratory mode active for: <description>
Scope: <whole file / partial — specify section>

Suspended: Radiant components, tokens, compliance, content rules
Still applies: TypeScript, accessibility, build must pass

Radiant components can still be used alongside custom code.
To return to Radiant compliance, remove the // @explore marker.
```

### 5. Proceed with the task

Continue with the designer's request using the relaxed constraints. Use whatever libraries, styles, or patterns the exploration calls for. Radiant components can still be used if the designer wants — exploration doesn't forbid them, it just doesn't require them.

### Notes

- The `@explore` marker persists in the file across sessions
- If a future session opens this file without invoking `/explore`, the orchestrator will ask whether to continue in exploratory mode or return to Radiant compliance
- The marker is visible in code review so the team can see what was explored
- Partial exploration: the rest of the file outside the explored scope still follows Radiant rules
