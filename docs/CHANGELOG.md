# Changelog

## 26.10.3i — 2026-10-14

The changelog highlights catch up with v26.10.

- Six short highlights: dark mode, Geist, components updated to Radiant 3.0, a new look for Radiant Play, design system updates, and one item for everything else
- The page shows the first six highlights in `src/data/highlights.ts`, instead of every item from the last 60 days. Older items stay in the file

## 26.10.3h — 2026-10-14

Security fix for a build tool dependency.

- `source-map-js` 1.2.1 → 1.2.2 in `package-lock.json` (Dependabot alert 37, GHSA-68fv-2mgg-jv7q, high): a crafted source map could stall the build. Development only, pulled in by Vite through PostCSS; `package.json` is unchanged

## 26.10.3g — 2026-10-14

The playground and the design system share one frame, the guides follow light and dark mode, and menus close after a choice.

- One frame for both sections: a full-height left pane with the Radiant Play logo (a play mark with "Rp", teal mixed from Radiant's green and blue), a top row with a Playground / Design system switcher and the theme icon, and the content on a raised panel. Light mode separates surfaces by fill instead of hairlines
- Help at the bottom of both left panes opens What's new (the changelog, with the version) and the three guides, which open in a new tab. The design system's version button moved into it
- The design system panel scrolls on its own, so its frame stays put; On this page follows it, and scrollbars show only on hover
- Section titles in the design system no longer jump when a page opens: they get their style before the first paint
- Getting started, How it works and Claude setup and skills use Radiant tokens and Geist, follow the app's light or dark setting, and show the Radiance Home pattern at the top, as /home and the playground do (`public/guides-theme.css` and `guides-theme.js`)
- ActionMenu closes once an item is chosen, and Escape and Tab always close it (Sneharsh Damani's fix, taken unchanged from their fork). Tour also follows scrolling inside a container

## 26.10.3f — 2026-10-13

The last Cursor mentions outside the changelog are gone.

- The prototype template's README (copied into every new prototype) starts with `/rp-new-prototype` and describing the UI to Claude
- `docs/ux-writing-rules.md` says the rules are shared with Claude
- `cursor-model-guide.md` and `cursor-to-claude-loom-script.md` move from `docs/collaboration/` to `docs/archive/`

## 26.10.3e — 2026-10-13

The onboarding docs teach the Claude desktop app and name the Node version you need, and one push reaches both remotes on the maintainer machine.

- `guide.html`: setup is now the Claude app's Code tab (clone, open the folder, ask Claude to start the dev server); the first prototype starts with `/rp-new-prototype`, and sharing points to `/rp-coolify-deploy`. The model credits slide is now a slash commands slide. The wizard's code boxes keep their line breaks
- `how-it-works.html`: says Claude finds the rules in `.cursor/rules/` through `CLAUDE.md`
- Claude setup page (`cursor-to-claude-setup.html`, linked from the gallery) and `docs/collaboration/cursor-to-claude-setup.md`: rewritten for the desktop app with no API key, with the `/rp-` commands, troubleshooting and a short section for anyone who already has the project
- `GETTING_STARTED.md`, `docs/collaboration/forking-guide.md`, `docs/prototyping-guide.md`, `FORK-WORKFLOW.md` and `README.md`: setup is the Claude desktop app and a Galaxy fork, not Cursor and GitHub; the first prototype starts with `/rp-new-prototype`
- Node.js: the docs said 18+, but Vite 7 needs 22+ (or 20.19+). They say so now
- `guide.html` gives the Galaxy repo URL on the fork step
- `origin` gets two push URLs, GitHub and galaxy, so a plain `git push` updates both. `bash internal/scripts/install-maintainer-hooks.sh` sets this up on a new clone. `push-faris.sh` still works, and `release.sh` only prints `git push galaxy main` when it is still needed
- Designer forks are unchanged: they have one remote and push to it as before

## 26.10.3d — 2026-10-13

Thumbnail setup works again.

- `npm run thumbnails:setup` failed on every machine: `npm init -y` names the package after its folder, and npm rejects `.radiantplay-visual` for the leading dot. Setup now writes its own `package.json`
- `npm run thumbnails` takes `--wait <ms>` (default 800) to settle longer before each shot, for screens that reload an iframe when the theme switches to dark

## 26.10.3c — 2026-10-13

RadiantPlay runs on Coolify only. Vercel is switched off.

- The docs (CLAUDE.md, README, getting started, the Coolify docs) and the project canvas Sites tab list Coolify sites only
- `vercel.json`, `middleware.ts` and `api/chat.ts` stay, so a fork that still deploys on Vercel keeps working after `/rp-sync-upstream`. The Data Model Editor's AI panel works in local dev (`npm run dev`) and not on the Coolify sites, as before

## 26.10.3b — 2026-10-13

Thirteen new Radiant components from Figma (batch 5), a token sweep with no visual change (batch 6), and a tidier design system: the theme icon moves to the top right and the Colours page follows the theme.

- PageHeader: new component from Figma. A 24/32 title with optional `breadcrumbs`, `description`, `tabs` (Radiant Tabs) and `actions` (Buttons on the right).
- EditHeader: new component from Figma, the edit-mode sibling of WizardHeader. A 20/28 title with optional segmented `tabs`, and Reset, Save and Exit buttons (`onReset`, `onSave`, `onExit`); `edited` switches between the Saved and Edited states.
- SplitButton: a main action plus a chevron that opens an ActionMenu (Figma Split button). Props: label, onClick, items, variant (primary, secondary), icon, iconOnly, disabled, mainDisabled, menuDisabled, menuPlacement.
- DotLoader: the three-dot global loader from Figma, with an optional message below. Props: message, label. Respects reduced motion. LoadingIndicator is unchanged.
- ScrollArea: a wrapper that styles its content's scroll bar like Figma (8px track, rounded tertiary thumb) with CSS only. Props: orientation, maxHeight, maxWidth, focusable. Global scrollbars are unchanged.
- Token: new 24px read only and editable token for measures, attributes, conditions and dates (`type`, `status` default/warning/error, `editable`, `active`, `onRemove`, `showIcon`). First component to use the chip date, error and active-border tokens.
- ChipIdentifier: new 24px brand chip with inverse text for identifiers such as key columns (`label`, `maxWidth`).
- UserChip: new 28px person chip with a Radiant Avatar, name and optional remove button for inputs (`name`, `src`, `selected`, `onClick`, `onRemove`, `disabled`). First component to use the chip input tokens.
- Breadcrumb: new component from Figma. A round back button and gray parent links; `items` takes `{ label, href?, onClick? }`, the last item is the current page, with `showBackButton`, `onBack` and `showCurrent`.
- NumberInput: a number field with spin buttons that show on hover and focus, with min, max, step, error, helper text, disabled and read-only states; arrow keys step the value and it follows TextInput's radiant-3 look.
- InlineEdit: text that turns into a field on click or Enter, in 14 and 16px sizes; Enter or blur confirms, Escape cancels, with value, onChange, placeholder, required and disabled props.
- FileUploader: a file field with an Upload button, drag and drop, a clear button and an optional file list showing uploading, complete or error per file; no real upload, with files, onFilesChange, multiple, accept, error, disabled and readOnly props.
- DateRangePicker: new range version of DatePicker from Figma "Date Picker / Range". Two fields joined by "to" share one calendar that opens under the active field; days between start and end are highlighted, with a hover preview while picking the end. Props: value ({ start, end }), onChange, format, label, startPlaceholder, endPlaceholder, separator, hasError, helperText, disabled, minDate, maxDate. DatePicker itself is unchanged.
- Token sweep (no visual change): GlobalHeader, AppSidebar and DatePicker now use spacing, radius, font size, weight and line height tokens wherever a token has the exact same value (54 replacements). Values with no exact token, such as 999px pills, 120ms transitions and the legacy dark sidebar colours, are unchanged.
- Design system pages: the theme icon sits at the top right, as on the playground, instead of the Light, Dark and System control in the sidebar footer; the Inspect button is gone from that footer (Sidebar gains `showInspect`, on by default)
- On this page: design system pages with three or more sections list them on the right once you scroll, with the current section highlighted. Content starts after the sidebar on every page, up to 1200px, with the same room kept on the right for the list
- One heading style across the design system: page titles at 32/40 and section headings at 20/28, on every page; section links are blue pills (demos keep their own type)
- Radiance guide: the template builder comes first and hands you a prompt for Claude with a Copy button instead of a code line; the section links are pills, pinned at the top when there's no room for the list
- Colours page: each token is one swatch that follows the theme, with the current mode's value first and the other under it
- Component Registry: rows for the new components, and the rows batches 1 to 4 changed now carry their real Figma node, file and sync date; placeholder Figma ids are gone
- Avatar: the count badge and status dot are solid failure red with contrasting text and a thin ring, readable in light and dark (they used the pale failure background before); purple and orange initials avatars are lighter in dark mode so their initials stay readable
- The New tag stays only on items added in the last month; the Icons page puts Usage at the bottom; changelog highlights follow the v26.10 teaser

## 26.10.3a — 2026-10-13

Typing `/rp-` lists only the commands you pick on purpose, and the maintainer's project canvas opens in seconds.

- The `rp-radiance`, `rp-prototype-model` and `rp-prototype-thumbnails` skills no longer appear in the `/` menu. Claude still loads each one when a request needs it: mention Radiance or an AI background, ask to switch a prototype's model ("switch it to Sonnet"), or ask to update a thumbnail. `/rp-radiant-check`, `/rp-sync-upstream` and `/rp-migrate-prototype` still capture thumbnails as before
- `/rp-project-canvas` on the maintainer's checkout takes about 14 seconds instead of about two minutes. The Forks tab shows the results saved by the last full run, with their age, instead of calling GitHub for every fork. Checking which docs are local now takes two git calls instead of two per doc
- `/rp-project-canvas full` (or `census`) opens the quick canvas, then refreshes the Forks tab and the prototype census in the background and rewrites the page. Each fork fetch in the census has a 60 second limit, so one slow fork no longer stalls the run
- The census has its own Census tab on the maintainer canvas. With nothing saved, or results more than a week old, it shows the command to run with a Copy button
- `/rp-prototype-census` is removed: `/rp-project-canvas full` replaces it. `internal/scripts/prototype-census.sh` is unchanged apart from the time limit

## 26.10.2e — 2026-10-12

Figma-shaped variants for five Radiant components, plus a new WizardHeader. Every variant is opt-in: each component's default looks and behaves exactly as before.

- Accordion `variant="card"`: each item is a card (radius 6, Base background, surface shadow that lifts to the menu shadow on hover) with 24px padding, a leading 18px chevron (right when collapsed, down when open), a 16/24 title at 550 and a 12/16 body lined up with the title
- ExplainerCard `appearance="raised"`: menu shadow, no border, radius 6, padding 20, gap 12, an 18/24 title and body in primary text. New props for both appearances: `media` (300 x 170, radius 6), `onDismiss` (24px close button), `primaryAction` and `secondaryAction` (small Primary and Tertiary buttons). `title` is now optional, for the title-less layout
- NoData `layout="horizontal"`: icon left, title and description in secondary text. `type="section"` uses a 32px status icon, `type="page"` a status illustration; `status` is empty, warning or success. `primaryAction`, `secondaryAction` and `link` add Small Primary, Small Secondary and a tertiary link
- Tour `tone="brand"`: the Figma spotlight card, a 340px brand-filled card with inverse text, a "2 of 4" step counter and white tertiary buttons
- New `WizardHeader`: the Figma wizard as a 64px page header, eyebrow over a 20/28 title, Secondary and Primary buttons, a divider and a tertiary Exit button, with a 4px segmented progress bar below. It has its own page in the Radiant docs. WizardModal is unchanged
- Radiance guide at /radiant/radiance: the four product patterns live, a template builder, the rules and how Radiance reaches prototypes

## 26.10.2d — 2026-10-12

Radiant 3.0 Figma sizes arrive as an opt-in look. Add `look: 'radiant-3'` to a prototype's entry in `registry-mine.ts` and its Radiant components switch to the Figma sizes. New prototypes get it from `/rp-new-prototype` and `npm run new-prototype`. Existing prototypes look exactly as before until they opt in, and `/rp-migrate-prototype` offers it after the dark check, never on its own. `/rp-sync-upstream` never adds it.

Under `look: 'radiant-3'`:

- Text fields (TextInput, TextArea, Select, SearchInput, DatePicker) are 32px tall with 16px left and 12px right padding and a 6px radius. Labels are 12/18 regular and turn brand blue while the field has focus. Hover darkens the border; focus shows the brand border with no ring. Disabled fades the whole field to 40%
- Menus and the Select popup sit on Raised with no border and a 6px radius, 8px list padding and 32px items (16px sides, 12px gap). Hover uses the ghost hover fill
- Tabs are 48px with 12px side padding and regular weight in every state (`size="small"` gives 32px)
- The 32px icon-only button uses an 18px icon
- DatePicker: the panel has 24px padding, a 6px radius, Raised background, menu shadow and no border. Day cells are 32px rounded squares (6px), weekday labels are 14/20 emphasis in secondary text, and the month and year are brand tertiary buttons with 32px nav buttons and 18px chevrons
- Pagination Range uses 24px round secondary icon buttons and reads "Showing 1-20 of 500 results"

Available in both looks:

- TextInput gains `readOnly` (filled On Base background, no border), `helperText` and `trailingIcon`. Existing props work as before
- Tabs gain `size` (`medium` 48px, `small` 32px). Without it Tabs keep today's height
- Button gains `size="xs"`: a 20px icon-only button with a 12px icon
- `RadiantLook`, `useRadiantLook()` and `RadiantLookScope` (in `src/context/RadiantLookContext.tsx`). Portaled content wraps itself in `RadiantLookScope` to keep the look; the Spotter VizBlock expand modal does

## 26.10.2c — 2026-10-12

Five Radiant components take their Figma shape. Each stays inside the space it used before, so layouts around them do not move; the Toast is the one exception noted below.

- Toggle is a thin 8px track with a 16px round thumb that overhangs it. Off is a grey track with a white, outlined thumb and a soft shadow; on is a light blue track with a blue thumb. The outer box stays 28x16, so labels and rows do not shift. The grey hover tint is gone; Figma has no hover state
- Toast is dark grey (Background Inverse) with white text, 16px padding, 6px corners, an 18px status icon and the menu shadow. Its action is a real white Button (Primary White Small) and the dismiss is a 24px white icon button. A toast is about 8px taller; prototypes that place it in the page flow (Variables in NewUIAdmin2) push content down by that much while it shows
- Stepper and VerticalStepper: done steps are green with a 16px check, the current step is a blue outline with a blue number, upcoming steps are grey outlines. Circles are 32px with a 1px stroke, connectors are 1px and turn green after done steps. Titles: done in secondary grey, current in blue
- Tabs hover turns the label blue with no grey fill behind it, and inactive tabs use the primary text colour, a shade darker. The active underline uses the Brand border token (same blue). The tab colours now live in CSS instead of inline styles, which had kept hover from changing the label. Weight and padding are unchanged
- Small primary buttons are rounder: 16px corners on Primary Small and Primary White Small, matching the basic size

## 26.10.2b — 2026-10-12

Radiant components pick up the right Figma colours, and the playground header switches theme with one icon button. Sizes, padding and heights are unchanged; only colours, weights and a few radii move.

- The Light, Dark and System control at the top right of the playground is now one icon button. It shows the current theme (sun for light, moon for dark, half-filled circle for system) and a click moves to the next one: light, dark, system. Ctrl+D works as before. `ThemeSwitch` gains `variant="icon"`; the default stays the segmented control, so the Radiant docs sidebar and forks using `ThemeSwitch` are unchanged

- Button White (`colorway="white"`) is fully white, with Figma's hover and pressed fills. Disabled is the white fill at 40%
- Button Tertiary White hovers with a fainter tint and presses with the light blue tint, instead of a black overlay
- Button Secondary hover is now a darker grey (it showed no change before), and pressed is a deeper grey with dark text instead of blue
- Button Primary, Secondary and Tertiary use their button colour tokens (same colours). Small buttons get Figma's positive letter spacing, so their labels are about 1px wider
- Segmented control inactive labels are darker (primary text instead of secondary). The selected label stays blue in light mode and turns near-white in dark mode
- Modal titles are bolder (550). The header sits on Raised and the footer on On Base with no top border; the footer stays 72px
- Tooltips are rounder (6px), with the menu shadow and the inverse colours; the arrow matches
- Checkbox and Radio borders use the border tokens (Brand, Failure, Bold), set in CSS instead of inline styles. The hover border that never showed is gone; Figma has no hover state
- Muted alerts sit on Secondary Action grey, a shade darker. The page alert's dismiss icon is 18px inside the same 32px button
- Progress bar track and blue fill use the background tokens (same colours)
- Corrected `var()` fallbacks in WizardModal (radius) and TextArea (label size)

- Radiance is now managed: `public/vendor/radiance/manifest.json` records the source commit and a checksum per file, the vendored files include every product recipe (Home, SpotterX, Liveboard) and Radiance's own lint, `npm run radiance:check` (also in `build:strict`) fails if a copy is edited, `npm run radiance:lint -- src/prototypes/<Name>` checks a prototype, the maintainer refreshes everything with `npm run radiance:update`, and `/rp-sync-upstream` brings updates to forks. `RadianceBackground` takes a `pattern` (home, signup, spotterx, liveboard or a template) and a `state`; existing pages are unchanged. Prototypes of the Home page, SpotterX, a Liveboard with Spotter or sign up now get their Radiance pattern automatically (the `rp-radiance` skill), and `/rp-new-prototype` asks about Radiance for AI surfaces

## 26.10.2a — 2026-10-12

Radiance, ThoughtSpot's AI identity background, comes to the playground, the home page and the design system page. `/rp-project-canvas` on a designer's fork now shows a canvas about the designer's own work.

- The playground (`/`) and the home page (`/home`) carry Radiance's Home pattern, a subtle top wash that follows light and dark and freezes under reduced motion. It loads only on those pages and `/radiant`; prototype pages never fetch it
- The design system page (`/radiant`) opens on a light hero card with the Radiance wash instead of the dark gradient card, with Radiant buttons
- Text over the wash uses the primary text colour so it stays readable

- The designer canvas has two tabs. Home lists up to four next steps, each with the command that fixes it, says how many releases your fork is behind RadiantPlay with each release's summary and a link to `/radiant/changelog`, lists your branches, and links the designer guides. My prototypes shows each prototype in `registry-mine.ts` with its last change, theme, dark and Geist readiness, thumbnail and an open link, then your Coolify site (up or down, and whether pages are served `no-cache`).
- The first run asks two questions, what to call the canvas and whether your fork is on Coolify, and saves the answers in `internal/status.local.sh`, which stays on your machine. Running `bash internal/scripts/status.sh` directly never asks anything
- Off Twingate VPN the canvas no longer hangs: it checks the git host for 3 seconds before fetching RadiantPlay
- `scan.mjs --mine --json` adds each prototype's `name` and `lastChange` to `meta`. Existing fields are unchanged
- The designer canvas uses the Radiance look in Geist, light and dark, with Radiance's own Home wash drawn by its renderer. The renderer and its Home stylesheet sit in `public/vendor/radiance/`, an interim copy from the Radiance site until the Radiance repo is available
- The maintainer canvas is unchanged. `STATUS_ROLE=designer bash internal/scripts/status.sh` previews the designer canvas on the maintainer's checkout

## 26.10.1b — 2026-10-12

Every RadiantPlay command now starts with `rp-`, so typing `/rp-` lists them all. Thumbnails happen as part of other work, and designers' prototypes stay light until they're migrated, so one sync is all it takes.

- `/thumbnail` is no longer a command. `/rp-radiant-check` captures or refreshes a prototype's thumbnail after a check, `/rp-sync-upstream` captures missing ones after a sync, and `/rp-migrate-prototype` keeps capturing them in its light and dark check. Asking Claude to "update my thumbnail" works too. The steps live in the `rp-prototype-thumbnails` skill, which asks the one-time screenshot tool question once per machine
- Ask Claude to switch a prototype's model ("switch it to Sonnet") and the `rp-prototype-model` skill handles it. It changes the model AI prototypes call, not Claude Code's own `/model`. `/switch-model` stays for now, since a fork has edited it
- Designer prototypes stay light by default. A prototype in `registry-mine.ts` with no `theme` line stays light when someone turns dark mode on, exactly as it looked before; `theme: 'global'` puts it in dark mode. `/rp-migrate-prototype` sets `global` once a prototype is dark ready, and `/rp-new-prototype` sets it for new prototypes. `/rp-sync-upstream` no longer marks anything, so one sync is enough (26.10.1a's "run `npm run migrate:light-only` once" step isn't needed). Older `theme: 'light-only'` lines keep working
- `/rp-new-prototype` points to `/rp-radiant-check` for the thumbnail, and to asking for a model switch
- RadiantPlay commands now start with `rp-`: `/rp-new-prototype`, `/rp-radiant-check`, `/rp-migrate-prototype`, `/rp-sync-upstream`, `/rp-coolify-deploy`, `/rp-explore`, `/rp-project-canvas` and `/rp-prototype-census`. Type `/rp-` to see them all. The old names keep working too: for now the steps stay in the old files, so forks that edited a command merge cleanly, and each `rp-` command hands off to its old file
- `npm run new-prototype <Name>` scaffolds from the token-based `_template` (or `_liveboard-template` with `--liveboard`), registers in `registry-mine.ts` instead of `registry.ts`, and marks the prototype `theme: 'global'` when the dark scan confirms it. It used to write `systemColors.light[...]` and register where the gallery never looked
- New `src/prototypes/CLAUDE.md`: Claude Code loads it whenever it works in `src/prototypes/`, so a prototype made by just asking Claude also gets `theme: 'global'` after a dark check, and lands in `registry-mine.ts`

## 26.10.1a — 2026-10-09

Dark mode, Geist and the Radiant 3.0 Figma tokens. Every page, shared component and sample prototype works in light and dark (Ctrl+D), type is Geist, and tokens match Figma. `/migrate-prototype` moves your own prototypes across, and `/sync-upstream` keeps the ones that aren't ready in light mode until you do.

- Added `scripts/figma-tokens/`: a snapshot of the Figma design system's variables, text styles and effect styles, and a diff that compares it with `src/tokens/*` and `src/styles/tokens.css`. Run `npm run figma-tokens:diff`; refresh steps are in its README. Tooling only
- Light mode tokens now match Figma:
  - `background-base-inverse` is Gray/80 (`#323946`) per Figma `Background/Inverse`. Tooltips and the Liveboard edit header get slightly lighter. This undoes the 26.5.4a revert to `#1D232F`, which had matched the production edit bar; Figma is now the source of truth
  - `brand/10` is `#F2F7FF` (was `#EBF2FD`)
  - Component tokens: `button-secondary-pressed`, `button-tertiary-pressed`, `toggle-track-on` and `toggle-thumb-on` match Figma. No component reads these tokens yet, so nothing changes on screen
- Added tokens from Figma: `button-overlay`, `segmented-control-content-active`, and the `gray-20a`, `brand-10a` and `purple-20a` alpha colours
- Added Figma's names as aliases next to ours: `background-inverse`, `background-secondary-action`, `content-inverse`, `border-subtle`, `border-bold`, `border-bold-hover`. Nothing is renamed
- Chip component tokens are now CSS variables (`--rd-comp-color-chip-*`), so CSS Modules can use them
- Dark mode values now match Figma: the neutral Dark Gray scale (every stop except 90 moved), all 52 semantic and 48 component dark values, and the 22 dark values `tokens.css` was missing. The system-dark (`prefers-color-scheme`) block now matches the dark theme, including shadows. Dark mode isn't switched on anywhere yet, so nothing changes on screen. Tokens Figma doesn't have (`content-alternate`, the `*-inverse` set, links, `background-inset`) keep their older dark values
- Typography is now Geist, matching Figma:
  - Geist and Geist Mono variable fonts are self-hosted in `public/fonts/geist/` (SIL Open Font License, licence file alongside) and preloaded. Plain was never shipped for most users, so most screens were falling back to system fonts; they now render in Geist
  - New `--font-weight-emphasis` (550), Figma's "Emphasis" weight for headings and labels. `semibold` and `light` stay as deprecated aliases that point at 550 and 400, so older code follows the new weights
  - Text styles: headings and labels at 550, body and footnote at 400, letter spacing per Figma (0, 0.4% and 0.6% as `normal`, `relaxed`, `loose`). New `--letter-spacing-*` CSS variables
  - Monospace is now Geist Mono
  - Replaced hardcoded Plain font stacks and `600` / `375` weights with the tokens across components, Spotter, pages and sample prototypes (including `_template` and the `/new-prototype` scaffold, so new prototypes start on Geist)
  - DataModelEditor uses Geist; its bundled Plain font files are removed
  - Rule and skill docs updated to Geist and the new weights
- Typography component variants (headline, titles, labels) now use the 550 emphasis weight and Figma letter spacing; they were at 500. The Typography page's spec labels match Figma
- Conditional weights (`active ? 600 : 400`, used on selected tabs) and 45 hardcoded monospace stacks now use the tokens; code text renders in Geist Mono
- Native buttons, inputs, selects and text areas inherit the page font instead of the browser default (Arial), and `code`, `kbd`, `samp`, `pre` use Geist Mono
- `npm run figma-tokens:diff` also checks the Typography component's CSS against Figma
- Added `scripts/visual-snapshots/`: screenshots every page and sample prototype of a build in light and dark, and compares two builds in a review page. Playwright stays outside `package.json`; setup is in its README
- The token count on the Radiant home page goes from 373 to 400 (new Figma tokens, the product's token names, and aliases)
- Press Ctrl+D anywhere in the app to switch between light and dark mode. The choice is saved, so it survives a reload
- Added a theme controller (`src/context/ThemeContext.tsx`): light, dark or system mode, saved in the browser, light by default. It is the only code that sets `data-theme`; use `useTheme()` to change the theme and `useIsDarkMode()` to read it. A small script in `index.html` applies the saved theme before the page paints, so a reload never flashes the wrong one. Native scrollbars and form controls follow the theme (`color-scheme`)
- Added `scripts/scaligent-tokens/`: compares our colour tokens with the ThoughtSpot product's (Scaligent `radiant-styles`) and reports match, differs, proposed and Scaligent-only per token. `--names` adds Figma names to the check. Run `npm run scaligent-tokens:tally`; needs a local Scaligent checkout. Tooling only
- Visual snapshots pick dark mode through the saved theme instead of setting the attribute after load
- Token names now follow the product (Scaligent) where Figma and the product differ. Older names keep working as aliases:
  - Shadows are `--rd-sys-color-shadow-surface`, `-menu` and `-modal`, with light and dark values. `--shadow-surface`, `--shadow-menu` and `--shadow-modal` still work and point at them
  - `button-overlay` is now `button-bg-overlay`; `button-overlay` still works
- Added `background-secondary-hover` (Gray/30, dark Dark Gray/30) and the circular progress tokens `progress-track-active`, `progress-track-empty` and `progress-indicator-default`, from the product. Nothing uses them yet
- Removed the `prefers-color-scheme` copy of the dark tokens from `tokens.css` (about 130 lines). The theme controller resolves the system setting and sets `data-theme`, so the copy was never used. `npm run figma-tokens:diff` no longer checks it
- Added `docs/2026-10-06-scaligent-token-differences.md`: the 33 token values where Figma and the product disagree, grouped by cause
- Shared components, Spotter, the Liveboard tiles and the prototype templates now follow the theme:
  - Inline styles read CSS variables through new helpers, `sysVar()`, `compVar()` and `shadowVar()` from `@tokens/colors`, instead of `systemColors.light[...]`, which is always light. No component reads light-only values any more
  - Hard-coded colours in component and tile CSS became tokens. A few light values moved to the nearest token: modal overlays use `background-overlay`, ad-hoc shadows use the three shadow tokens, the Liveboard toolbar is a touch lighter (`background-inverse`), and tile descriptions use `content-secondary`
  - The docs sidebar follows the theme; its dark gradient is gone. The ThoughtSpot primary nav (Liveboard header, AppSidebar) stays dark in both themes
  - 11 token names that never existed (`content-subtle`, `background-surface`, `content-negative` and others) now point at real tokens, so those colours show in both themes
  - `_template` and `_liveboard-template` start new prototypes dark-ready, and the template README teaches `sysVar()`
- Charts follow the theme:
  - Added 13 chart tokens (`--rd-comp-color-chart-*`) with the product's names and dark values. The product has no light values yet, so ours are proposed, taken from the current chart colours
  - New `useChartTheme()` gives ECharts its colours for the current theme. Dark series colours come from the product's OKLCH lightness remap, ported so our charts match. All shared chart types and the Spotter chart block use it and redraw when the theme changes
  - User-picked note text colours are lightened on dark tiles
- Added `ThemeSwitch` (`src/components/ThemeSwitch/`): Light, Dark and System, built on `SegmentedControl` and bound to the theme controller. It sits in the gallery header and at the foot of the Radiant docs sidebar (new `footerContent` slot on `Sidebar`). Ctrl+D still works and the two stay in step
- The gallery, home pages, Radiant docs pages and changelog follow the theme. Code blocks on the docs pages stay dark in both themes. A few light values moved to the nearest token, mostly mid-grey text that is now `content-primary` and pale tints that are now the matching background token
- The Colours page shows every system, shadow, component and chart token with its light and dark value side by side, and lists aliases under the token they point at. The Architecture page describes how theming works now
- Added a dark readiness scan (`scripts/radiant-check/`): per prototype and layer it counts colour literals, light-only reads, unknown token names, `prefers-color-scheme` media queries and `data-theme` writes, with accepted exceptions and their reasons in `rules.json`. `npm run scan:dark` reports; `npm run lint:tokens` fails on the shared layers only and isn't wired into `/ship`. `/radiant-check` now prints a dark ready line and suggests `sysVar()` instead of `systemColors.light[...]`
- Visual snapshots list light surfaces per page, so a dark run shows what didn't follow the theme
- Component status badges (registry) and the "synced" changelog colour follow the theme
- The ThoughtSpot nav follows the theme, matching the product with the Radiant theme on (checked on champagne): `GlobalHeader`, `AppSidebar`, the Liveboard primary nav, the Liveboard edit toolbar and the styling drawer use `background-on-base` with a `border-subtle` divider. In light mode that's light grey instead of the old dark navy. `GlobalHeader` takes `theme="auto"` by default; `light` is the older name for it and `dark` is the legacy always-dark nav. The GlobalHeader doc page shows both
- All sample prototypes work in dark mode, including NewUIAdmin2. Tailwind-style greys map to Radiant tokens through `docs/2026-10-07-phase6-colour-mapping.md`, so light mode shifts slightly in those prototypes. Third-party logos, user-picked colours and palettes stay as they are
- A prototype that isn't dark ready yet can set `theme: 'light-only'` in its registry entry. It stays light, charts included, while the rest of the app is dark
- Gallery thumbnails are real screenshots, in light and dark, saved next to each prototype (`thumbnail.light.jpg`, `thumbnail.dark.jpg`, 640x360, 15 to 30 KB). Every sample prototype has them now. Capture with `/thumbnail` or `npm run thumbnails -- <Name>`; `npm run thumbnails:setup` installs the screenshot tool once, outside the project. `npm run thumbnails:check` lists missing or outdated ones, and `/sync-upstream` reports them
- A prototype without a thumbnail shows a live preview of itself instead of a folder icon. At most four previews load at once, only while on screen
- `/new-prototype` no longer draws a blank placeholder thumbnail. Hand-made SVG thumbnails still work, and `scripts/thumbnails/tokenize-svg.mjs` converts one to theme tokens so it follows light and dark
- The SpotterViz side panel uses the nav surface and follows the theme
- The guidance Claude follows now teaches theme-aware colour. `CLAUDE.md`, the `.cursor/rules` files, the repo skills and the `/new-prototype` templates use `sysVar()`, `compVar()` and `shadowVar()` instead of `systemColors.light[...]`, which stays light in dark mode, and font weights through tokens. `systemColors` and `rdComponentColors` carry a note that they are token data, not for UI. `/new-prototype` ends with a dark readiness scan
- `AppSidebar` takes `theme`: `auto` (default) follows the app theme, `dark` keeps the legacy navy nav, like `GlobalHeader`. Forks that pass `theme: 'dark'` keep working after sync
- `/sync-upstream` always builds after merging and repairs `systemColors` reads that a clean merge can break, found in a dry run of this release against the maintainer's own fork
- `/sync-upstream` knows how to resolve three more conflicts found in the second dry run: sample thumbnail SVGs (take upstream, including deletions), `package.json` scripts added on both sides (keep both), and guidance files (take upstream's block, keep the fork's other edits)
- The readiness scan also checks fonts: hardcoded font stacks and the old Plain weights 600 and 375 written as numbers, with a "geist" column next to "dark". `node scripts/radiant-check/scan.mjs --mine` shows one row per prototype in `registry-mine.ts` with its theme and thumbnail status. Code under a `vendor/` folder is counted in its own column and left alone. Designers keep their own exceptions in `scripts/radiant-check/rules-mine.json`, which upstream never edits. `/radiant-check` prints a "Geist ready" line
- Added a migration codemod (`npm run migrate:codemod -- <paths>`, dry run by default, `--write` to apply). It moves prototype code onto Geist and theme tokens: font stacks, weights (600 to emphasis, 375 to regular), exact-match font sizes, `systemColors.light[...]` to `sysVar()`, hex values that equal a token (picked by the property's role), Tailwind-style greys, alpha tints and plain shadows. Anything it can't settle goes to a decision list grouped by value. It never touches `vendor/`, follows the scan's exceptions, and treats logo and brand colours as data. `npm run codemod:check` tests it against the sample prototypes' before and after states
- Added `/migrate-prototype`: brings a designer's existing prototypes onto Geist and dark mode, all of them in one pass by default (or one, by name). It scans everything into one table, lets you pick, applies the codemod in one run, asks the leftover decisions once per kind across all prototypes, builds once, checks light and dark screenshots, and lifts the light-only flag where a prototype is clean. It never commits, never touches `vendor/`, and only shows its undo unless you ask for it
- `/sync-upstream` marks prototypes that aren't dark ready yet as light-only after a merge (`npm run migrate:light-only`, with a dated comment), shows the status table, and points to `/migrate-prototype`. A flag removed by hand stays removed. The first sync that brings this release in runs your fork's older copy of `/sync-upstream`, which doesn't have this step yet: after that sync, run `npm run migrate:light-only -- --write` once (or run `/sync-upstream` again). Later syncs re-read the command file after the merge and pick up new steps themselves
- `/sync-upstream` fixes a build break a clean merge can cause: a `registry-mine.ts` entry that imports a sample thumbnail SVG this release deletes. It drops the import and the gallery shows a live preview
- `applyTheme()` accepts `'system'` again and resolves it to the system preference, so older fork code that passes it still typechecks
- The codemod says which path doesn't exist instead of crashing when given a missing prototype folder
- `docker/nginx.conf` sends `Cache-Control: no-cache` on every `.html`, so after a Coolify deploy browsers load the new build instead of the old one, and a page added to `public/` can't get stuck on the app shell. The `radiantplay-staging` Coolify app has it now too
- `/coolify-deploy` follows how designers actually run it, in Claude in Chrome: field names for Coolify v4.4.3 (Build strategy, Site type, Ports exposes, the Auto deploy dropdown), the full nginx block set through the code editor rather than typed, a no-cache check in `check` mode, and the secret rule from the "Deploy a prototype to Coolify" guide (ask before each move, never read it). The Coolify MCP is listed as maintainer-only
- Fixed from the first full migration run: the codemod no longer writes CSS variables or font tokens into chart options (ECharts draws on a canvas and can't read them); those lines become `chart` decisions, resolved with `useChartTheme()`. `--include-vendor` migrates a `vendor/` folder when you decide it's yours to change
- The readiness scan no longer calls a prototype dark ready when its screens come from code it doesn't scan: imports from another prototype's folder, or a static page shown in an iframe. It names the reason. Screenshots flag a dark image that looks the same as the light one, and archived prototypes can be captured by name. `light-only.mjs --force --reason` keeps a prototype light-only when the scan says ready but it isn't

## 26.9.1c — 2026-09-03

Guided Coolify setup for designers. Docs and tooling only, no product changes.

- Added `/coolify-deploy`: a Claude Code command that walks a designer through putting their fork on Coolify one verified step at a time (deploy key, app, build settings, Node pin, static site and nginx fallback, first deploy, auto-deploy webhook), plus `/coolify-deploy check` to compare an existing app against the known-good recipe. Reads `docs/coolify/` at run time; never types secrets
- Documented that every Coolify app on one fork must share the same GitHub webhook secret, since Coolify verifies the signature per app and silently skips mismatches

## 26.9.1b — 2026-09-03

Dependency security update. No product changes.

- Resolved all 19 Dependabot alerts with `npm audit fix` (no major bumps): react-router-dom 7.13 → 7.18.3 (12 advisories, mostly server-side features this static SPA never uses), vite 7.3.3 → 7.3.6, and transitive patches for postcss, browserslist, @babel/core and esbuild. Lockfile stays on the public npm registry only

## 26.9.1a — 2026-09-03

Spotter Refresh blocks adopted into the shared Spotter DS, and Coolify deployment consolidated into the shared repo.

- Adopted Devanshi's Refresh blocks into `src/spotter/chat/`: `Reasoning` (timeline), `UserMessage` (bubble), `PromptBar` (composer) and `ToolIcon`. `ReasoningBlock` and `UserBubble` remain as adapters over the new components, so existing prototypes keep working; `PromptBar` ships alongside `SpotterPrompt` until the composer decision
- Added a Refresh blocks front door on `/radiant/spotter` (showcase, rules) and updated the Spotter roadmap

- Added `docs/coolify/`: a designer deploy guide, an operations sheet (apps, webhook, recipe, known quirks) and a short index. The original design record moved to `docs/archive/`
- Added `docker/nginx.conf` (the SPA fallback every Coolify app uses) and a `Dockerfile` for the no-git deploy path
- Added `internal/scripts/push-faris.sh` (push a branch to origin and galaxy in one step) and updated the pre-push hook to protect the `faris` working branch instead of the retired `personal` branch
- Updated CLAUDE.md and the README: `faris` replaces `personal` in the branch model, and each branch's Coolify URL sits beside its Vercel one

## 26.7.1b — 2026-07-01

SegmentedControl visual refresh. CSS-only, no breaking changes.

- Aligned SegmentedControl to the Radiant 3.0 Figma: pill-shaped track and segments, brand-blue active label, Elevation/100 shadow, lighter font weight, unified disabled opacity. Propagates everywhere SegmentedControl is used.

## 26.7.1a — 2026-07-01

Maintainer tooling and a small design-system addition. No breaking changes.

- Added an opt-in prototype census (`/prototype-census`) that counts prototypes across every fork, with API-based fork auto-discovery, surfaced in the local status dashboard
- Added an optional per-tile chart color override to AnswerTile and the chart renderer, falling back to the default palette
- Removed the Vercel Analytics dependency and bumped echarts to 6.1
- Fixed the public snapshot to omit `.claude/settings.json` and the post-compact hook, avoiding a hook error on public clones
- Removed the personal Revefi talk deck from main (it now lives on the personal branch)

## 26.5.4b — 2026-05-27

Internal repository housekeeping and public-release groundwork. No user-facing changes.

- Archived stale root files (old HTML exports, a duplicate page, the superseded root backlog) to `internal/archive/` with a manifest noting each move
- Consolidated onboarding docs: `SETUP-GUIDE.md` and `getting-started/` merged into `GETTING_STARTED.md`
- Grouped maintainer-only scripts under `internal/scripts/`
- Dropped a redundant build-time `cp` of `cursor-to-claude-setup.html`
- Stopped tracking the 11 MB Notion export (kept on disk, gitignored)
- Added `public-strip.sh` (public-snapshot generator) and `housekeeping-check.sh` (reorg pre-merge checks)

## 26.5.4a — 2026-05-26

### Highlights

- **Spotter prototype** — AnalystLandingPage, AnalystListPage, and right-pane state machine added. Prompt bar rebuilt with mode toggle, hideable data-model picker, and a new PromptSuggestionsPanel. 12 IA polish corrections (analyst selection, recency-sorted chats, panel restructure, chat naming). The Liveboard template's SpotterViz side panel was also rebuilt to match the Figma design: dark navy overlay with welcome state, persona suggestion chips, and prompt bar.
- **Liveboard Styling panel restored** — Per-tile density, color theme, corner style, spacing, and highlight overrides via a right-side drawer. Shared tile CSS variables added to `AnswerTile`, `NoteTile`, `GroupTile`. Two integration bugs from the original PR fixed (missing `AnswerTileProps.highlighted`, `EditToolbar` `onToggleStyling` wiring).
- **AdminUI 2.0 prototype** — Application Settings screen added to the shared sample registry: cluster settings, administration toggles, downloads and schedules, version control, AI settings.
- **Playground archive section and sidebar navigation** — Gallery now has a light left sidebar with Prototypes (default) and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session. Save-to-code modal generates a Claude-ready prompt to commit the layout permanently. `MiniSpotters` and `AdminLang` now appear as archived by default.

### Added
- `src/prototypes/StylingPanel/` — Liveboard Styling panel prototype restored (originally PR #14, reverted then re-landed via worktree cherry-pick). Per-tile drawer with density, color theme, corner style, spacing, and highlight overrides. Authored by Devanshi Behera.
- Shared tile CSS variables for tile density / color theme / corner / spacing / highlight on `AnswerTile`, `NoteTile`, `GroupTile`.
- `src/prototypes/NewUIAdmin2/` — AdminUI 2.0 Application Settings screen. Registered in `registry-core.ts` as a sample. Cluster settings, administration toggles, downloads and schedules, version control, AI settings. Authored by the Design Team via Simran Pandit (PR #19).
- `src/prototypes/Spotter/AnalystLandingPage.tsx` + `AnalystListPage.tsx` — right-pane state machine for the standalone Spotter prototype. Replaces the prior "always show chat" right pane.
- `src/spotter/page/PromptSuggestionsPanel.tsx` — new suggestion panel surfaced from the prompt bar. Hideable, mode-aware.
- `src/prototypes/_liveboard-template/components/SpotterVizPanel.tsx` — full rebuild to match the Figma side-panel overlay. `position: fixed` (not flex sibling), dark navy `#1d232f`, mascot + greeting + 3 suggestion chips + sticky prompt bar.
- `src/prototypes/_liveboard-template/components/spotterviz-mascot.png` — mascot asset.
- `section?: 'sample' | 'mine' | 'archived'` field on `ProjectMeta` in `src/prototypes/registry-core.ts`. Drives the new archive section in the gallery.
- `src/pages/PlaygroundGallery.tsx` — light left sidebar with Prototypes / Archived sections, per-card 3-dot menu, sessionStorage-backed archive overrides, save-to-code modal generating a Claude-ready prompt.
- `MiniSpotters` and `AdminLang` registered with `section: 'archived'` so they appear in the Archived section by default.
- `Liveboard - Styling panel` and `AdminUI2.0` thumbnails (`StylingPanel.svg`, `NewUIAdmin2.svg`).

### Fixed
- `AnswerTileProps` was missing `highlighted?: boolean`. `GroupTile` was passing it through and tripping TS2322. Added to the props interface so the highlight-override path from the styling drawer works.
- `EditToolbar` was missing the `onToggleStyling` + `stylingOpen` props wiring. The Styling button rendered but did nothing. Added the props, wired the click handler, and applied the active-state styling.
- `background-base-inverse` token reverted from `#323946` back to `#1D232F` to match the production Liveboard edit-toolbar background (the Phase 2 token change had unintentionally muted it).
- `ThoughtSpot` brand mark click in `GlobalHeader`, `LiveboardHeader` (`PrimaryNav`), `EditToolbar`, and the `DataModelEditor` title now all navigate back to `/` (the playground gallery).
- Spotter prototype IA polish — 12 corrections: analyst selection state, recency-sorted chats, panel restructure, chat naming, analyst reorder on chat start only, clear analyst highlights when "View all" opens, center analyst grid at 936px, move Spotter (Default) into its own panel section, drop the logo icon from the Default panel item and welcome page.
- 43 TypeScript errors resolved across DS + `NewUIAdmin2` + `ChangelogPage` (38 were in `NewUIAdmin2`, 4 pre-existing). 34 of the 38 were `unused-var` noise — switched to `noUnusedLocals: false` for the prototype layer.
- `LineChart` legend overlap in the Liveboard template.
- `package-lock.json` rewritten — 31 ThoughtSpot internal artifactory URLs swapped to the public npm registry so Vercel can install dependencies.

### Changed
- Liveboard template: KPI cards shortened (default height 1 row), and the first two (`Revenue`, `Customers`) now show chart variants instead of bare numbers.
- Royal Enfield references scrubbed from prototypes and replaced with `Acme Apparel`.
- `Liveboard - Styling panel` is the canonical display name for the styling drawer prototype (was `StylingPanel`).
- `MiniSpotters` and `AdminLang` moved from "hidden" to "archived" so they remain discoverable in the Archived gallery section.

## 26.5.3d — 2026-05-19

### Highlights

- **ThoughtSpot brand mark refresh** — new Radiant 3.0 monogram (4-path geometric mark with bars + "T" hook + dot) replaces the older wordmark across `GlobalHeader`, `LiveboardHeader`, `EditToolbar`, and the Spotter showcase.
- **Spotter Standalone IA — Stage B Phase 1** — Analysts section in the left panel (replaces "Custom spotters"), Settings popover at the bottom (6 items in 4 dividered groups, inline Personal memory toggle), hover row menus on both chats and analysts.
- **Spotter chat surface polish** — flat reasoning layout matching the real product (no card chrome), code-block-styled tool I/O, single content stream (no separator between chat thread and prompt), eased peek-description transitions.
- **`@components/BrandMark`** — new single source of truth for the TS brand mark; the SVG paths were previously duplicated in 4 files.

### Added
- `src/components/BrandMark/BrandMark.tsx` — canonical TS brand mark. Props: `pixelSize`, `color` (defaults to `currentColor`), `className`, aria props. Renders the 4-path Radiant 3.0 monogram at viewBox `0 0 47.4216 48`.
- `src/spotter/page/SettingsMenu.tsx` + `PersonalMemoryToggle.tsx` — popover Settings menu opened from a trigger (uses Radiant `Popover` with `children` as the trigger). 6 items in 4 dividered groups: Spotter instructions (modal) · Usage monitoring + Admin settings (external) · Manage memory sources (external) + Personal memory (inline toggle) · Spotter best practices (modal).
- `src/spotter/page/ChatRowMenu.tsx` + `AnalystRowMenu.tsx` — hover-triggered row menus. ChatRow: Rename / Favorite / Share / Delete. AnalystRow: Edit (privilege-gated) / Share / Make a copy / Delete. Built on Radiant `ActionMenu` for keyboard + click-outside.
- `src/spotter/page/RowMenuAffordance.tsx` — internal helper for the shared hover-affordance pattern (kebab fades in on row hover / focus-within / menu-open).

### Fixed
- `ReasoningBlock` peek (streaming + semi-collapsed): brand-blue inline title with chevron + description below with a thin left guideline. Was a bordered card with dot column. Now matches the real product.
- `ReasoningBlock` expanded view: dropped the card border around the steps list — steps now flow as a plain dot column.
- `ReasoningBlock` header: unified into a single brand-blue button. Text shows the current step label while streaming, "Thought for X seconds" once settled. Chevron rotates on expand.
- `ReasoningBlock` toolcall I/O: Input/Output values render as proper code blocks — monospace, `background-subtle`, rounded, generous padding. Labels changed from UPPERCASE letterspaced to sentence-case "Input:" / "Output:". JSON output gets a language hint.
- `ReasoningBlock` peek description: fades out (opacity + max-height + guideline) instead of unmounting instantly when streaming ends.
- `AgentMessage`: avatar centers vertically with the first body line (negative margin compensates for the 32px avatar vs 20px text-line center offset).
- `SpotterPrompt` mode toggle: ChartSearch at `size="m"` (16px), Orbits at `size="l"` (18px) — per design spec.
- `ChatCanvas` `.promptArea`: dropped `border-top` and opaque background; dropped top padding. Chat thread now flows into the sticky prompt as one continuous stream.
- `SpotterWelcome` content width: uses `--spotter-text-max-width` (844) instead of inheriting the wider chat-active 936.
- Width tokens (`chatMaxWidth = 936`, `textMaxWidth = 844`) now actually flow through `ChatThread`, `SpotterPrompt`, `ChatCanvas` `promptWrapper`, and `SpotterWelcome` via `--spotter-chat-max-width` / `--spotter-text-max-width` CSS vars injected at the `SpotterShell` root.
- Toolcall icons in `cannedResponses` now use semantic Radiant glyphs (`database`, `ai`, `search`) instead of the generic `spotter` sparkle.
- TS brand mark SVG updated to Radiant 3.0 — was the older wordmark with a single composite path; now four geometric paths.

### Changed
- `GlobalHeader`, `LiveboardHeader`, `EditToolbar` all now import `<BrandMark />` from `@components/BrandMark` instead of inlining their own SVG.
- `@spotter/icons` `ThoughtSpotMark` is now a deprecated alias for `BrandMark` (kept for backwards compatibility with the Spotter showcase).
- `src/prototypes/Spotter/index.tsx` — left panel reordered. "Custom spotters" section renamed to **Analysts** (matches the IA spec — analyst = custom AI agent, separate from data model). Dropped the "Spotter (Default)" row. "View library" → "View all >". Settings button at the bottom now opens `SettingsMenu`. Chat and analyst rows wrapped in their respective hover menus.
- `src/prototypes/Spotter/data/mockData.ts` — `customSpotters` → `analysts` with a `canEdit` flag per row.
- `docs/spotter-roadmap.md` — Stage B Phase 1 marked done, Phase 2 (right-pane state machine + Analyst pages) listed as pending.

## 26.5.3c — 2026-05-19

### Highlights

- **Spotter design system gets its own doc surface** — new `/radiant/spotter` showcase covering chat primitives, block renderers, icons, and tokens; new `/radiant/components/spottershell` peer to the GlobalHeader / AppShell docs.
- **Fullscreen previews** for SpotterShell and AppShell — `/preview/spottershell` and `/preview/appshell` render the shells at full viewport without Radiant chrome.

### Added
- `/radiant/spotter` Spotter DS showcase page — 4 sections (Chat, Blocks, Icons, Tokens) with static previews for every shipped Spotter component plus ghosted placeholders for planned ones (AnswerCard, Source/Model picker, Analyst components, ChatRowMenu, SettingsMenu, PersonalMemoryToggle).
- `/radiant/components/spottershell` — dedicated SpotterShell doc page mirroring the GlobalHeader / AppShell pattern. SpotterLeftSide preview rolls SpotterRail + SpotterPanel into one card since they're internal compositions of the same component. SpotterShell preview uses real `GlobalHeader theme="light"` (matches AppShell composition).
- "View fullscreen ↗" link on SpotterShell and AppShell doc pages — opens `/preview/spottershell` and `/preview/appshell` in a new tab. Both render at 100vh × 100vw with no Radiant chrome.
- `PreviewCard` gained `useTabs` (Radiant Tabs for multi-variant cards) and `fullSizeHref` (fullscreen link) primitives.
- 4 new Spotter cursor rules: `spotter-ia.md` (standalone IA — left panel, right-pane states, Settings menu, hover menus, widths), `spotter-agentic-chat-ia.md` (embedded Code/Viz/Model surfaces), `spotter-scaffolding.md` (how to create a new Spotter prototype), plus a Planned-components section in `spotter-components.md`.
- `docs/spotter-roadmap.md` resume-here tracker with status per mode and per phase.

### Fixed
- VizBlock expand button now uses the diagonal `expand` icon (matches Figma `RzKUZMdJsNVdoVhkYmXvlI` node `852:7344`) instead of the horizontal `fullscreen` icon. Affects every viz answer rendered in Spotter responses.
- Home page hero now reads `PLATFORM_VERSION` instead of the hardcoded `26.4.1b`.
- Sidebar Icons badge reads `getIconCount()` (151) instead of the hardcoded `46`.
- Design Tokens stat computes from `generateCSSVariables` + theme generators (373) instead of the hardcoded `290+`.
- Component count includes RdModal (76 total).
- `26.5.3` icon-sync numbers corrected: 53 → 148 unique icons (151 registry entries with 3 backward-compat aliases — settings → cog, search → magnifying-glass, refresh → sync).
- TextBlock mock data in the showcase now includes `block.id` (was missing — caused React "missing key prop" warnings in AgentMessage previews).
- Spotter DS page CSS aligned to ComponentDocPage conventions (1000px container, 36px title, 20px section title, 32px card padding, 12px radius) and no longer renders its own white background — picks up the sunken layout bg like other Radiant pages.

### Changed
- Sidebar: top-level "Spotter" renamed to **"Spotter DS"**; new **"SpotterShell"** entry under Widgets; "New" badges removed from LiveboardHeader / GlobalHeader / AppSidebar / AppShell.
- `spotterLayout` tokens — `chatMaxWidth` 880 → **936** (matches 2026-05-19 IA spec); new `textMaxWidth = 844` for text content inside the chat container.
- `ReasoningBlock` streaming behaviour tightened in `spotter-logic.md`: explicit three-state model (semi-collapsed during streaming → expanded then collapsing → settled "Thought for X seconds").
- Spotter Requirements Gate in `_orchestration.md` upgraded from "load 3 rules" to a Q&A flow with tiered loading by surface mode (Standalone / Spotter Model / Viz / Code).
- `spotter-scaffolding.md` example replaced placeholder `<Canvas>` / `<WelcomeState />` with copy-pasteable JSX using real component names. Added a `SpotterWelcome` prop-surface table noting `greeting` is a single ReactNode (no title/subtitle split). Added a maintainer note: on `main`/`staging`, `registry-mine.ts` stays empty.
- 3 historical Spotter plans moved to `docs/archive/` (ds-plan, prototype-shell, chat-extraction). Active spec docs (answer-card, viz-block-behaviour) stay flat at `docs/`.
- VizBlock showcase entry reduced from 5 chart-kind variants to a single Default line-chart preview; supported kinds mentioned in the description instead.

## 26.5.3b — 2026-05-18

### Highlights

- **`/sync-upstream` rewrite** — preview-first, feature-branch safe. Stashes WIP with `--include-untracked`, lands upstream on `main` before forwarding into your branch, never silently abandons your work.

### Fixed
- `/sync-upstream`: now refuses to merge `upstream/main` directly into a feature branch. Always lands on `main` first, then merges `main` forward into the feature branch. Stash uses `--include-untracked` so new files are no longer lost during sync.
- middleware: staging branch publicly accessible, other preview branches stay gated.
- vercel: `X-Frame-Options: SAMEORIGIN` so same-origin iframes inside prototypes load correctly.

### Changed
- `/check-upstream` consolidated into `/sync-upstream` — preview is now phase one of a single command with a yes/no gate before anything destructive runs.
- Maintainer branch model split documented in CLAUDE.md: `personal` and `personal/*` are origin-only (galaxy-bound branches are `main`, `staging`, and shared `feat/*` / `fix/*` / `chore/*`). Pre-push hook enforces the rule.

## 26.5.3a — 2026-05-08

### Changed
- registry-core: Spotter moved to the bottom of the array so it appears first in the gallery (gallery reverses array order to show newest-by-date first)

## 26.5.3 — 2026-05-08

### Highlights

- **Spotter prototype** — in-thread agentic chat with reasoning, viz blocks, and follow-ups
- **Spotter design system (in progress)** — chat / page / runtime layered on Radiant

### Added
- feat(spotter): two-layer DS scaffold — `@spotter/*` peer to `@components/*` for Spotter-domain blocks built on Radiant primitives. Subdomains: chat, page, answer, viz, runtime, plus `tokens.ts` and `icons.tsx`
- feat(spotter): Spotter prototype registered in `registry-core.ts` as a sample. Wraps `SpotterChatProvider`, switches between welcome and chat-active canvas, light-mode `GlobalHeader`, collapsible 64↔260 left panel with smooth animation
- feat(spotter): chat extraction end-to-end — `SpotterChatProvider`, `useReducer`, `AbortController`, async-iterable `askSpotter()` service with canned + live modes, four canned fixtures with rich reasoning
- feat(spotter): six block renderers — TextBlock, VizBlock (real ECharts via `_shared/tiles/chartPalette` — line / bar / pie / table with axes, gridlines, tooltips, value labels, legend; iframe / data / placeholder slot priority; Pin / Save / Download / Edit + Add to coaching footer; M4 fullscreen expand modal portaled to body), SourcesBlock, FollowUpsBlock (clickable chips that call `send`), RefineBlock (clickable options), ErrorBlock
- feat(spotter): `ChatThread`, `MessageRow`, `UserBubble` (single-row), `AgentMessage` with feedback row, `TypingIndicator` (spinner + "Analysing…"), `ReasoningBlock` (collapsed-by-default "Show work ⌄" trigger, gray done dots, embedded `ToolcallCard` with "Show details", "Worked for X seconds" footer)
- feat(spotter): purple → blue gradient border on `SpotterPrompt:focus-within`
- feat(spotter): custom icons — `PanelToggleIcon` (sidebar layout glyph from Figma), `ChartSearchIcon` + `OrbitsIcon` (prompt mode toggle), `BellIcon`, `ThoughtSpotMark`. All other glyphs use Radiant icons (151-icon registry)
- feat(icons): sync 147 icons from Radiant 3.0 Figma + light-mode GlobalHeader (carried forward from `26.5.2`)
- docs(spotter): four planning docs — DS plan, prototype shell, AnswerCard spec, chat extraction. Plus `docs/2026-05-07-spotter-viz-block-behaviour.md` (slot model + customization guide)
- docs(spotter): three `.cursor/rules/` files — `spotter-components.md`, `spotter-logic.md`, `spotter-response-style.md` — auto-attach when working in `src/spotter/**` or `src/prototypes/Spotter*/**`. Spotter Requirements Gate added to `_orchestration.md`. CLAUDE.md addendum points to the Spotter docs
- spotter(tokens): `spotterGlow` (radial brand glow) + `spotterChartBg` (chart-token aliases) + `spotterLayout.chatMaxWidth` (880)

### Changed
- spotter(chat): streaming animation polish — step dot color transitions, block fade-up entry, steps container collapse via `max-height + opacity` (no remount), toolcall body slide-open, ReasoningBlock fades in only when reasoning starts, "Worked for X seconds" fade-in
- spotter(panel): full-width selected state on items, full-width line breaks between sections (per Figma)
- spotter(reasoning): brand-blue trigger when expanded, gray done dots, ToolcallCard collapsed by default with brand-blue "Show details ⌄" link
- spotter(prototype): sentence-case fixes — "Deal Accelerator" → "Deal accelerator", "Fall and Winter" → "fall and winter"

### Fixed
- spotter(chat): streaming keyframes (blockIn, reasoningIn, stepIn, workedForIn) end with `transform: none` instead of `translateY(0)` — translate(0) creates a containing block per CSS spec, which had trapped Modal's `position: fixed` to the chat canvas

## 26.5.2e — 2026-05-08

### Changed
- spotter(prototype): sentence-case fixes — "Deal Accelerator" → "Deal accelerator", "Fall and Winter" → "fall and winter" (flagged by /radiant-check)

### Added
- spotter(tokens): `spotterLayout.chatMaxWidth` (880) — documented constant for the shared chat thread + prompt max-width

## 26.5.2d — 2026-05-08

### Changed
- spotter(viz): VizBlock now uses real ECharts (echarts-for-react) instead of an SVG sketch. Pulls from the shared chart palette (`_shared/tiles/chartPalette`) so colors, fonts, and axis styling match the rest of the project's charts. Supports `line` / `bar` / `pie` / `table` from the schema with axis labels, gridlines, tooltips, value labels on bars, and a top legend for multi-series
- spotter(viz): M4 expand modal — portaled to `document.body` to escape any ancestor containing block, full-width override (`max-width: none`), proper layout with chart title + view toggle + tokens + chart + "Showing X of X data points" footer

### Fixed
- spotter(chat): streaming keyframes (blockIn, reasoningIn, stepIn, workedForIn) end with `transform: none` instead of `translateY(0)` — translate(0) still creates a containing block per CSS spec, which had trapped Modal's `position: fixed` to the chat canvas

## 26.5.2c — 2026-05-08

### Changed
- spotter(chat): streaming animation polish — six fixes to make the live agent message feel smooth instead of poppy
  - Step dot color transitions smoothly between gray / brand / gray as `reasoning_step` chunks fire
  - New blocks (viz, followups, sources) fade up on entry instead of popping
  - Steps container collapses via `max-height + opacity` (no unmount), so the auto-collapse 600ms after done animates instead of jumping
  - Toolcall body slides open via `max-height + opacity` instead of conditional render
  - `ReasoningBlock` only renders once reasoning is set — cleaner crossfade from TypingIndicator
  - "Worked for X seconds" fades up with a 120ms delay instead of popping
- spotter(chat): ReasoningBlock keeps steps + toolcall bodies mounted across collapse cycles so re-open is instant and collapse is animated

## 26.5.2b — 2026-05-07

### Added
- feat(spotter): chat extraction end-to-end — SpotterChatProvider + useReducer + AbortController, ChatThread, MessageRow, UserBubble (single-row), AgentMessage with feedback row, TypingIndicator (spinner + "Analysing…"), ReasoningBlock with rich steps (descriptions + embedded ToolcallCard, "Worked for X seconds")
- feat(spotter): streaming runtime — AnswerChunk protocol, askSpotter() async generator (canned + live shell), 4 fixtures with naive keyword routing (viz default)
- feat(spotter): six block renderers — TextBlock, VizBlock (slot model with iframe / data / placeholder, canonical footer, chart/table toggle, expand modal), SourcesBlock, FollowUpsBlock (clickable chips), RefineBlock, ErrorBlock
- feat(spotter): smooth 64↔260 panel animation via SpotterLeftSide wrapper
- feat(spotter): purple→blue gradient border on SpotterPrompt :focus-within
- feat(spotter): custom PanelToggle icon (Figma path), ChartSearch + Orbits glyphs for prompt mode toggle
- feat(prototype): Spotter prototype now wraps in SpotterChatProvider; welcome ↔ chat-active transition with sticky prompt and disclaimer
- docs(spotter): VizBlock behaviour doc; three .cursor/rules files (components, logic, response-style) with auto-attach globs; Spotter Requirements Gate in _orchestration.md; CLAUDE.md two-layer DS section

### Changed
- spotter(panel): full-width selected state on items, full-width line breaks between sections (per Figma)
- spotter(reasoning): brand-blue trigger when expanded, gray done dots, ToolcallCard collapsed by default with "Show details" link
- spotter(viz): schema discriminated union with `source: iframe | data | placeholder` + optional `tableData`

## 26.5.2a — 2026-05-07

### Added
- feat(spotter): `@spotter/*` peer to `@components/*` — two-layer DS scaffold for Spotter-domain building blocks layered on Radiant
- feat(spotter): chat primitives — QuickAction, QuickActionRow, SpotterPrompt (controlled, auto-resize, mode toggle, model picker, blue submit)
- feat(spotter): page primitives — SpotterShell, SpotterLeftSide, SpotterRail/Item, SpotterPanel/Section/Item/Action, SpotterWelcome
- feat(spotter): smooth 64↔260 width animation between collapsed rail and expanded panel
- feat(spotter): spotter tokens (radial glow + chart-bg aliases) and spotter icons (PanelToggle, Bell, ThoughtSpotMark, ChartSearch, Orbits) — only glyphs missing from Radiant registry
- feat(prototype): Spotter prototype — first DS consumer with light-mode GlobalHeader and welcome canvas
- docs(spotter): four plan docs covering the two-layer DS, prototype shell, AnswerCard spec, and chat extraction approach

## 26.5.2 — 2026-05-07

### Added
- docs(muze): `docs/muze-charts-setup.md` — opt-in guide for adding Muze charts (auth, install, chart-shape cheatsheet, resize-aware mounting). Default install stays friction-free for designers who don't use Muze

### Changed
- refactor(LiveboardHeader): unify dark surfaces and tokenize raw hex values
- fix(radiant-pages): bump content-tertiary to content-secondary for readability
- chore(components): remove duplicate exports of LoadingIndicator, Popover, Select from components/index.ts

### Removed
- chore(pages): delete 5 unrouted page components (ComponentStatusPage, DataDashboardDemo, GuidelinesPage, SettingsPanelDemo, SpotterDashboard) — ~2,400 lines of dead code never wired into App.tsx

## 26.5.1 — 2026-05-05

### Removed
- chore(prototypes): SalesDashboard prototype removed from the registry — reference patterns continue to live in `_liveboard-template`
- chore(prototypes): SpotterModel standalone prototype removed — patterns now covered by DataModelEditor + the shared `_agentic` module
- revert(prototype): PR #14 (StylingPanel + shared tile density/override system) reverted on staging due to integration issues; will be re-introduced in a follow-up PR

## 26.5.0 — 2026-04-30

### Added
- feat(prototype): Data Model Editor — interactive canvas-based prototype with table cards, draggable column tree, and join connectors
- feat(prototype): SpotterModel agent panel — AI-powered chat interface with table, join, column, and formula suggestions backed by Anthropic
- feat(prototypes): shared `_agentic` module — AgentPanel, SuggestionCard, ReasoningBlock, ConfidenceBadge, JoinDiagram, NextActionChips, ToolcallCard, TypingIndicator, UserBubble, VersionCard, AgentResponseBlock
- feat(prototypes): shared `_datamodel` module — TableCanvas, ColumnTree, JoinConnector, TableCard
- feat(infra): `/api/chat` proxy for the Anthropic API (Vercel function + Vite dev middleware)
- feat(ds): OverlayLoading variant + label props (backwards-compatible)
- feat(tooling): `/switch-model` command — switch the Claude model used by AI-capable prototypes between Haiku, Sonnet, and Opus
- docs(rules): three new orchestrator rule files — `data-model-editor-ia.md`, `data-model-editor-components.md`, `data-model-editor-interactions.md`
- docs(orchestrator): "AI agent panel (any prototype)" fallback row so non-DME prototypes can adopt `_agentic`

### Changed
- chore(orchestrator): split the single DME concern row into three sub-rows (IA / components / interactions) so the right rule file loads per task
- chore(tooling): `new-prototype` command updated for DME-style scaffolding
- chore(tooling): status.sh untracked-files badge

### Fixed
- fix(infra): vite middleware now reads `ANTHROPIC_API_KEY` via `loadEnv` — `process.env` was empty in dev and the AI panel errored

## 26.4.4c — 2026-04-28

- feat(changelog): Highlights section at the top — curated picks across recent releases (60-day window, min 6 items)
- feat(release): release.sh prompts for highlights interactively during release
- docs(orchestration): add MCP plugin overhead check (B1 from workflow plan)
- feat(status): sort forks by last push descending
- feat(status): add worktrees + branch divergence vs main/staging/upstream
- feat(status): merge plans/rules/docs into one tab, drop Open work
- feat(status): role-aware dashboard — designer forks see upstream-sync tab
- feat(status): rename to /project-status, add inline md viewer + local badges
- chore(deps): bump postcss to 8.5.10 in lockfile (fixes XSS advisory)
- chore: salvage workflow explorations + orchestration tightening
- Merge branch 'feat/token-system-figma-alignment' into staging
- feat(tokens): Phases 4 & 5 — shadows + layout aligned with Figma 3.0
- feat(tokens): Phase 3 — typography aligned with Figma 3.0 + changelog
- feat(tokens): Phase 2 — light mode semantic colors aligned with Figma 3.0
- feat(tokens): Phase 1 — primitive colors aligned with Figma 3.0
- Merge branch 'review/rd-modal-component' into staging
- docs: add 26.4.4a changelog for Modal Figma alignment
- feat: align Modal with Figma spec and absorb RdModal learnings
- Merge branch 'pr-10-rd-modal' into staging
- feat: add RdModal shared modal component
- fix: add process type declaration to middleware to resolve TS2580 errors
- chore: extend password gate cookie lifetime to 14 days


All notable changes to Radiant Play are documented here.

**Versioning:** `YY.M.Ws` — Year.Month.Week + sub-release letter (a, b, c...).
Example: `26.4.1b` = 2026, April, week 1, second release that week.

---

## [26.4.4b] - 2026-04-28

### Token system Figma alignment (Phases 1–5 of 8, dark mode out of scope)

#### Phase 4 — Elevation / Shadows

- New `shadowPrimitives` with 3 semantic levels matched to Figma: `surface` (Card, Tooltip, Nav), `menu` (Dropdown, Popover, Sidebar overlay), `modal` (Modal, Dialog)
- Light mode uses colored ink tints (`#192331`); dark mode uses pure black for cool dark base
- New CSS variables `--shadow-surface`, `--shadow-menu`, `--shadow-modal` with light/dark theme variants
- Component CSS migrated from legacy `--shadow-xs/sm/md/lg/xl/2xl` (kept as aliases) to semantic vars: Modal, Tooltip, Popover, Card, Menu, DatePicker, FilterModal, InputMentions, AppSidebar overlay
- Modal hardcoded RGBA box-shadow replaced with `var(--shadow-modal)` (token-only compliance)

#### Phase 5 — Layout constants

- `AppSidebar.tsx` and `AppShell.tsx` default sidebar width `261px → 260px` (Figma rounding alignment)
- Header height stays `60px`, content max width `1280px` — `CLAUDE.md` and `.cursor/rules/layout-patterns.md` already reflect these (no doc updates needed)

### Token system Figma alignment (Phases 1–3 of 8)

Plan: `plans/2026-04-07-token-system-implementation.md`

#### Phase 1 — Primitive colors

- **darkGray scale** (12 stops) added to `referenceColors` — neutral foundation for Phase 6 dark mode remap
- **Alpha variants** added: `gray-70a/60a/40a/10a`, `blue-10a`, `dark-gray-30a`
- **Hex fixes** to match Figma: `purple/70` `#6847BA → #6A4ABA`, `purple/100` `#0D0030 → #0E0033`, `teal/70` `#359FAA → #369FAA`
- New primitives exposed in `tokens.css` as `--rd-ref-color-dark-gray-*` and `--rd-ref-color-*a`

#### Phase 2 — Light mode semantic colors

- **6 value fixes**: `content-tertiary`, `border-focus`, `border-hover`, `background-overlay`, `background-ghost-highlight`, `background-base-inverse`
- **22 new tokens**: 9 background-accent-*, 6 content-accent-*, 7 border-* (subtle-hover + 6 accents), `background-on-base`, `background-active`
- Same keys added to dark object as placeholders (Phase 6 will remap properly)
- Phase 2.5 (deprecate 25 extra RP tokens) deferred — list not enumerated

#### Phase 3 — Typography

- `letterSpacing.tight`: `-0.01em → -0.4px` (Figma absolute)
- `letterSpacing.tighter`: new (`-0.6px`)
- 6 v2TextStyles weights `medium → semibold`: headlineLarge, pageTitle, modalTitle, sectionLabel, contentLabel, contentLabelSubhead
- pageTitle/modalTitle: `letterSpacing.normal → tight`
- footnote/caption/overline: `letterSpacing → tighter`
- `textStyles.body.large/normal`: `light (375) → regular (400)`

---

## [26.4.4a] - 2026-04-27

### Modal alignment with Figma (absorbed RdModal PR)

- **Header**: padding restored to `20px 24px` (variable height) so wizard variants grow correctly for eyebrow + title
- **Footer**: fixed at 72px height with `0 24px` padding; CTA placement bug fixed (tertiary-left / primary-right now sit at correct edges — was double-wrapped)
- **Wizard stepper**: rebuilt as discrete 4px segments with 6px gap and 2px radii; also renders for `splashscreen` type to enable onboarding flows
- **Close button**: removed X icon from M1/M2/M3 simple modals — only M4 keeps the "Close" text link, per Figma
- **Splash screen**: header no longer renders (title lives in body via `ModalSplashContent`)
- **Overlay z-index**: bumped to 1000 so M4 covers the sidebar

### Surfaces showcase additions

- New M2 eyebrow-only variant (no stepper)
- New M2 splash-screen-multi (3-step onboarding flow with stepper)
- Wizard footer keeps Back rendered (disabled on step 1) + primary button uses `minWidth: spacing.I*2` so position stays consistent across steps
- Spec card updated to Figma values; secondary/primary demo swatches use `content-primary` / `content-alternate` tokens

### LastUpdated component

- New shared component reads `lastModified` from `componentRegistry` (or accepts a manual date)
- Added at top of Surfaces, Icons, Architecture, and ComponentDocPage
- Modal registry entry refreshed with current Figma node ID and `2026-04-27` sync date

---

## [26.4.1c] - 2026-04-08

### Fork architecture

- **Registry split**: Monolith `registry.ts` split into `registry-core.ts` (upstream) + `registry-mine.ts` (designer) + thin merger — eliminates merge conflicts for all designer forks
- **Skills and docs updated**: `sync-upstream`, `check-upstream`, `new-prototype`, `prototype-structure`, `FORK-WORKFLOW` all reference new 3-file registry architecture
- **Self-documenting migration**: Migration note in `registry-mine.ts` guides any Claude instance through first-time conflict resolution

### AI orchestrator

- **Orchestrator tier system**: Intent-based classification (Tier 0–3) with concern-matching table — 81% context reduction for median tasks
- **Pre-implementation gate**: 4 checks before code (component exists, CSS anti-patterns, icon name, forbidden words)
- **Iteration loop detection**: Suggests batching after 3+ sequential single-property changes
- **MCP overhead awareness**: Flags Figma MCP ~4,000 token overhead when idle
- **Context budget check**: Proactive `/compact` suggestion on topic switches
- **Session memory**: Tracks loaded rule files to prevent redundant reads

### Liveboard system

- **Canvas 3-tier split**: Monolithic `liveboard-canvas.md` (568 lines) → core (242), edit (238), advanced (100) with prerequisite chains
- **Requirements gate**: 4-question pre-build gate (mode, interactions, tile types, data) before loading canvas context
- **UserPromptSubmit hooks**: Liveboard intent detection + post-compact convention recovery (~200 tokens/msg)
- **Shared tiles**: `_shared/tiles/` with AnswerTile, ChartRenderer, and 12 chart types
- **SalesDashboard prototype**: Liveboard prototype with view/edit modes and SpotterViz panel

### Platform and tooling

- **Deployment password gate**: Edge middleware password-gates Vercel deployments — opt-in per designer via `SITE_PASSWORD` env var in their Vercel dashboard
- **CalVer versioning**: `platformVersion.ts` as single source of truth; version badge on homepage, playground, and DS sidebar
- **Component source badges**: Figma / Scaligent / Custom badge on every component doc page
- **Release tooling**: `scripts/release.sh`, pre-push hook, `install-maintainer-hooks.sh`
- **6 Claude Code skills**: Auto-activating with `globs` frontmatter (component-inventory, content-guidelines, token-usage, layout-patterns, widget-patterns, modal-patterns)
- **CLAUDE.md trimmed 36%** (210 → 135 lines) — detailed guidelines moved to on-demand skills

### UI and performance

- **Homepage polish**: Space blue title, subtle card icons, shortened descriptions, footer easter egg
- **ECharts lazy-loaded**: 1.18 MB chunk deferred from startup to first chart render
- **All DS pages centred**: maxWidth 1200px in RadiantLayout

### Bug fixes and security

- **0 TypeScript errors**: Icon name, TileMode import, NoteTileProps, unused variables all resolved
- **Avatar contrast**: Light background tokens swapped for saturated content tokens
- **Vite 7.3.2**: High severity vulnerability patched
- **Picomatch**: Vulnerability patched, Figma Make package.json removed
- **ConfirmDialog**: Non-Radiant gradient override removed
- **Button examples**: All now include `iconPosition` prop

### Cleanup

- **Cmdk prototype gitignored**: 11 MB Figma Make export removed from designer forks
- **Orphaned prototypes deleted**: Homepage_example, ImpersonationV2, Liveboard, ModalPatterns
- **Documentation updated**: README, SETUP-GUIDE, Onepager, prototyping-guide refreshed with current counts

---

## [26.3.3a] - 2026-03-17

### Added

- **Liveboard template**: Starter template with AnswerTile, KPI tile, bar chart, and SpotterViz panel
- **AdminLang prototype**: Admin CSV-based translation settings with upload and validation
- **MiniSpotters prototype**: Domain-specific Spotter instances with bounded context and prompt libraries
- **Liveboard scaffolding rules**: `liveboard-ia.md` and `liveboard-scaffolding.md` for Liveboard generation
- **Cursor → Claude Code setup guide**: Migration guide linked from gallery

### Changed

- Thumbnail illustrations: removed dark colors, muted palette
- Legacy slash commands replaced with skill-based commands (`/start`, `/ship`, `/release`, `/status`)
- Docs updated to Galaxy URLs

### Removed

- **Liveboard prototype**: Removed from gallery (replaced by Liveboard template system)
- **Admin Impersonation prototype**: Removed from registry

---

## [26.3.2a] - 2026-03-13

### Added

- **Liveboard scaffolding**: Template, IA guidelines, and scaffolding rules (contributed by Devanshi Behera via PR #4)

---

## [26.3.1a] - 2026-03-10

### Changed

- Cursor rules optimized for progressive disclosure and on-demand loading

### Removed

- SpotterViz chart editor prototype reverted (premature)

---

## [26.2.5a] - 2026-03-05

### Added

- **UX writing guidelines**: Spotter Writer rules integrated into Cursor agent (contributed by Yash Chauhan via PR #1)
- **How it works page**: Converted to slide-based format with tab navigation
- **Playground gallery redesign**: New card layout with component counts and latest prototype shortcut
- **Workflow skills**: `/start`, `/ship`, `/release`, `/status` commands
- **Cursor model guide**: Model selection guidance for designers

### Changed

- **Project renamed**: figmaradiant → radiantplay across all config, docs, and UI
- Homepage redesigned with getting started guide
- `_examples` folder archived, stale docs cleaned up

---

## [26.2.4a] - 2026-03-03

### Added

- Getting started guide link on homepage

### Changed

- Homepage redesigned with split layout and polished guide landing

### Fixed

- Guide CTA moved below cards, floating hint removed

---

## [26.2.3a] - 2026-03-02

### Added

- **35 new components** (38 → 73 total): Horizontal, Vertical, View, Grid/RdGrid/RdGridItem, SplitPane, NoData, ExplainerCard, Image, Illustration, Legend, SafeHTML, OverlayLoading, FormControl, SearchBar, ActionMenu, VerticalStepper, List, Slider, ManagedList, Trending, NestedCheckbox, ManageTags, NumericFilterInput, DirectionControl, ColorPicker, InputMentions, FilterModal, Tree, TreeTable, Formatters, Tour, RichTextEditor, DragDrop, FormBuilder, DynamicForm, FacetSortBar

### Fixed

- Rollup path traversal vulnerability patched (GHSA-mw96-cpmx-2vgc)

---

## [26.2.3a] - 2026-02-25

### Added

- **Admin Impersonation prototype**: GlobalHeader icon, session popup, toast notification
- Fork-based workflow guide for designer onboarding

---

## [26.2.2a] - 2026-02-19

### Added

- **Vercel Analytics and Speed Insights**: Visitor analytics and Core Web Vitals tracking
- **AppSidebar integration**: Added to Liveboard, AdminGroups, and ChartEditorAI prototypes
- **localStorage filter**: Exclude internal visits from analytics

### Changed

- Cmdk simplified to icon-only admin trigger
- Prototype headers replaced with shared GlobalHeader component
- Component registry overhauled with roadmap page

---

## [26.2.2a] - 2026-02-18

### Added

- **3-layer color token system**: Reference (9 tonal scales × 12 stops) → System (42 semantic tokens × light/dark) → Component (46 per-component tokens × light/dark)
- CSS custom properties with `rd-sys-color-*` and `rd-comp-color-*` prefixes
- Dark mode support via `data-theme` attribute

### Changed

- All 36 CSS modules and 48 TypeScript files migrated from legacy `brandColors.*` to new `systemColors` / `referenceColors`
- Token count: 150+ → 290+

### Removed

- `brand.ts`, `alias.ts`, `mapped.ts`, `semantic.ts` — replaced by 3-layer system
- All legacy `--color-brand-*` CSS custom properties

### Fixed

- Dark mode override on macOS — default light theme set in `index.html`

---

## [26.2.1a] - 2026-02-16

### Added

- **ChartEditorAI prototype**: Figma-accurate chart editor layout
- **Homepage redesign**: Getting started guide with unified page title styles
- **ThoughtSpot product icons**: Added to Cmdk prototype
- **TODO.md checklist**: Project task tracking

### Changed

- Playground page overhauled with consolidated AI prototyping rules
- Hard-coded spacing replaced with design tokens across prototypes

### Fixed

- Typography page crash fixed
- Vercel 404 on direct URL navigation fixed with rewrites
- HTTP security headers added to `vercel.json`

---

## [26.2.1a] - 2026-02-04

### Added

- **Surfaces Showcase** (`/radiant/surfaces`): Modal patterns with all 4 sizes (M1–M4) and 4 types
- **Modal sub-components**: ModalFooter, ModalHeader, ModalWizardProgress, ModalNavPanel, ModalNavItem, ModalSplashContent
- **Admin Groups prototype**: Group creation wizard with bulk org assignment
- **SpotterMemory prototype**: Memory Sources object table with search and pagination

### Changed

- Modal spacing updated to Figma spec (header 20/24, content 24, footer 20/24)
- Modal footer buttons right-aligned per spec

### Removed

- ModalPatterns moved from Playground to Surfaces showcase

---

## [26.1.4a] - 2026-01-30

### Added

- **Playground system**: Gallery grid + full-page project viewer with lazy loading
- **Project Registry** (`src/prototypes/registry.ts`): Central metadata registry
- **Navigation sidebar**: Added to Liveboard prototype
- **Version history page**: Changelog component

### Changed

- URL structure reorganized under `/radiant/*`
- Renamed HomePage.tsx → RadiantHomePage.tsx

### Removed

- PlaygroundShowcase.tsx, WelcomePage.tsx — replaced by new system
- Command K prototype experiments cleaned up

---

## [26.1.3a] - 2026-01-28

### Added

- WelcomePage, global Inspector, and 7 new components
- Quick Setup section on HomePage

---

## [26.1.2a] - 2026-01-21

### Added

- **Initial release**: 17 core components, 3-tier design token system, 46 icons
- Component documentation pages
- Example prototypes (Filter Dialog, Data Dashboard, Settings Panel)
- AI-assisted prototyping workflow
- Project renamed from figmamcp → figmaradiant
