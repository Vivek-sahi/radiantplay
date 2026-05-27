---
description: Radiant compliance health check — components, tokens, content guidelines, and layout. Pass a prototype name and/or focus area as arguments.
---

Run a Radiant compliance health check on the current prototype. Shows what's reused from the design system, what's been customised, what's hardcoded, and where easy improvements exist. This is a status check — not a blocker.

Accepts optional arguments: `$ARGUMENTS`
- A prototype name (e.g., `/radiant-check MiniSpotters`)
- A focus area (e.g., `/radiant-check content guidelines`, `/radiant-check visual styling`)
- Both (e.g., `/radiant-check MiniSpotters content guidelines`)

## Instructions

Follow these steps in order.

---

### 1. Identify the prototype and focus area

**Parse $ARGUMENTS** to extract:
- **Prototype name** — if a word matches a folder in `src/prototypes/`, use that
- **Focus keyword** — if any of the following keywords appear, set the focus area:

| Keyword(s) | Focus area |
|------------|-----------|
| `content`, `content guidelines`, `text`, `writing`, `labels` | Content guidelines |
| `visual`, `styling`, `tokens`, `colors`, `spacing` | Token & visual coverage |
| `components`, `coverage`, `radiant` | Component coverage |
| `layout`, `grid`, `responsive` | Layout approach |
| `all` or no keyword | All dimensions equally |

**If no prototype name was provided**, detect it:
- Run `git branch --show-current`
- If on `prototype/<slug>`, find the matching folder in `src/prototypes/`
- If on `main` or another branch, check for recently modified prototype folders:
  - `git diff --name-only HEAD` (uncommitted changes)
  - `git diff --name-only --cached` (staged changes)
  - Look for paths matching `src/prototypes/<Name>/`
- If multiple prototypes have changes, or none are found — ask: **"Which prototype should I check?"**

**If no focus area was provided** and the prototype is large (5+ files), ask:
> Want me to check everything, or focus on a specific area?
> Options: `content guidelines`, `visual styling`, `component coverage`, `layout`, or `all`

If the prototype is small (under 5 files), default to `all` without asking.

---

### 2. Collect all files

Read every `.tsx`, `.ts`, and `.module.css` file under `src/prototypes/<Name>/`.

Also scan `src/components/` to get the full list of available Radiant components.

---

### 3. Analyse the prototype

Run all dimensions, but produce **detailed** output for the focus area and **summary** output for the rest. If focus is `all`, produce detailed output for everything.

#### Dimension 1 — Radiant components in use
From the imports (`../../components` or `@components/*`), list every Radiant component being used. For each, note how many times it appears and whether it's being used as-is or wrapped/extended with custom logic or styles on top.

Classify each as:
- **Reused as-is** — imported and used with no overrides
- **Extended** — imported but wrapped in a custom component or has additional inline styles/overrides layered on top

**Detailed output:** List every component with use count and classification.
**Summary output:** "X Radiant components used (Y as-is, Z extended)"

#### Dimension 2 — Custom components
List everything in `src/prototypes/<Name>/components/`. For each custom component:
- Understand what it does
- Check if a Radiant component could fully cover it → mark as **"Radiant equivalent exists"**
- If it extends a Radiant component with prototype-specific logic → mark as **"Built on Radiant"**
- If it's truly custom with no design system overlap → mark as **"Fully custom"**

**Detailed output:** Full breakdown per component with explanation.
**Summary output:** "N custom components (X built on Radiant, Y fully custom, Z have Radiant equivalents)"

#### Dimension 3 — Hardcoded values (token & visual coverage)
Scan for hardcoded values across all files. These are **not errors** — just documented so the designer knows what's there:
- Hex colors (`#...`), rgb/rgba
- Pixel values outside the spacing scale (4px increments)
- Hardcoded font families
- Inline `style={{}}` blocks

For each, note the file and what was hardcoded. Where a token exists that would directly replace it, mention it as an easy win — but only if it's a straightforward swap.

**Detailed output:** List every hardcoded value with file:line, token equivalent if available.
**Summary output:** "X hardcoded values found (Y have easy token swaps)"

#### Dimension 4 — Layout approach
Note whether the prototype uses:
- Radiant layout primitives (`Horizontal`, `Vertical`, `View`, `Grid`, `RdGrid`) — good
- Inline flex/grid styles — custom but fine; flag only if a layout primitive would simplify it

**Detailed output:** List each layout pattern used and where.
**Summary output:** "Uses X layout primitives, Y inline flex/grid patterns"

#### Dimension 5 — Content guidelines
Scan all user-facing strings in the prototype:
- **Button labels** — should be 1-2 words, imperative verbs (Create, Add, Delete, Save, Cancel, Edit, Export)
- **Input labels** — max 3 words, no articles, no punctuation
- **Titles / headings** — max 4 words, sentence case; modal titles start with a verb
- **Casing** — everything should be sentence case, never Title Case or ALL CAPS (except ThoughtSpot feature names: Answer, Liveboard, SpotIQ, Worksheet, Monitor)
- **Error messages** — should follow Issue + Remedy + CTA pattern

For each violation, note the file, the string, and what it should be.

**Detailed output:** List every string checked, flag violations with suggested fix.
**Summary output:** "X content strings checked, Y follow guidelines, Z could be improved"

---

### 4. Calculate a compliance score

Based on the analysis:

- **Radiant coverage** = (Radiant components used + custom components built on Radiant) ÷ total distinct UI elements × 100
- **Token coverage** = (token-based values) ÷ (token-based + hardcoded values) × 100
- **Content compliance** = (strings following guidelines) ÷ (total content strings) × 100

Present these as rough percentages — they're directional indicators, not exact measurements.

---

### 5. Output the report

Adapt the report based on the focus area. The focused dimension gets the full detailed section; other dimensions get a one-line summary in the HEALTH OVERVIEW.

Print in this format:

```
Radiant Check — <PrototypeName>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Focus: <focus area, or "Full check">

HEALTH OVERVIEW
  Radiant coverage:    ~X%   (Y of Z components from the design system)
  Token coverage:      ~X%   (colors, spacing, typography)
  Content compliance:  ~X%   (labels, titles, button text)
  Custom components:   N     (breakdown below)

<For each dimension that is in focus, print the full detailed section.>
<For dimensions not in focus, the one-line in HEALTH OVERVIEW is sufficient.>

──────────────────────────────
RADIANT COMPONENTS IN USE        ← only if focus includes this
──────────────────────────────
  Reused as-is:
    ✓ Button        6 uses
    ✓ TextInput     3 uses
    ✓ Modal         1 use

  Extended / wrapped:
    ~ Table         1 use — custom sort logic added on top
    ~ Chip          2 uses — inline color override applied

──────────────────────────────
CUSTOM COMPONENTS                 ← only if focus includes this
──────────────────────────────
  Built on Radiant:
    • FilterRow.tsx        — wraps TextInput + Select, prototype-specific layout
    • StatusBadge.tsx      — built on Chip, adds icon slot

  Fully custom:
    • ChartTooltip.tsx     — no Radiant equivalent, custom overlay

  Radiant equivalent exists (easy swap if needed):
    • IconButton.tsx       → Button variant="tertiary" + Icon would cover this

──────────────────────────────
HARDCODED VALUES                  ← only if focus includes this
──────────────────────────────
  Colors (X found):
    • FilterRow.tsx:42     #2770EF  — easy swap: systemColors.light['content-brand']
    • ChartTooltip.tsx:18  rgba(0,0,0,0.4)  — custom, no direct token equivalent

  Spacing (X found):
    • StatusBadge.tsx:11   padding: 7px  — easy swap: spacing.A (4px) or spacing.B (8px)
    • ChartTooltip.tsx:24  gap: 10px  — custom

  Fonts (X found):
    • FilterRow.tsx:6      fontFamily: '"Inter", sans-serif'  — easy swap: fontFamily.primary

──────────────────────────────
CONTENT GUIDELINES                ← only if focus includes this
──────────────────────────────
  Button labels:
    ✓ "Save"              — correct: imperative, 1 word
    ✓ "Create group"      — correct: imperative, 2 words
    ✗ "Click here to submit" — should be: "Submit" (1-2 words, imperative)

  Titles / headings:
    ✓ "Group settings"    — correct: sentence case, 2 words
    ✗ "User Management Dashboard" — should be: "User management dashboard" (sentence case)

  Labels:
    ✓ "Email address"     — correct: 2 words, no punctuation
    ✗ "Enter the user's name:" — should be: "User name" (max 3 words, no punctuation)

──────────────────────────────
LAYOUT                            ← only if focus includes this
──────────────────────────────
  Radiant primitives:
    ✓ Horizontal      3 uses
    ✓ Vertical        5 uses

  Inline flex/grid:
    ~ styles.ts:12    display: 'flex' — could use Horizontal
    • styles.ts:28    display: 'grid' — complex grid, fine as-is

──────────────────────────────
EASY WINS  (optional improvements)
──────────────────────────────
  These are quick swaps that would improve coverage with minimal effort:
  1. <easy win from the focused dimension>
  2. <easy win>
  3. <easy win>

  These are fine as-is (custom/complex, not worth changing):
  • <item> — <reason>

──────────────────────────────
SUMMARY
  <1-2 sentence overall assessment, neutral tone>
  Run /radiant-check again after any updates to re-check.
  To focus on a specific area: /radiant-check <area>
```

Keep the tone neutral and informational throughout. Hardcoded values and content issues are not failures — they're just documented. Only surface easy wins where the fix is direct and obvious.
