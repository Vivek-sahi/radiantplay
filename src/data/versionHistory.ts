/**
 * Version History Data
 *
 * Tracks version history for Radiant design system updates.
 * Includes component additions, modifications, Figma syncs, and removals.
 */
import { PLATFORM_VERSION } from './platformVersion';

export type ChangeType = 'added' | 'modified' | 'removed' | 'synced';
export type VersionType = 'major' | 'minor' | 'patch' | 'figma-sync';

export interface VersionChange {
  type: ChangeType;
  component: string;
  description: string;
  group?: string; // optional theme group — renders a section header in the changelog
}

export interface VersionEntry {
  version: string;
  date: string;
  type: VersionType;
  changes: VersionChange[];
}

/**
 * Version history entries - newest first
 */
export const versionHistory: VersionEntry[] = [
  {
    version: '26.11.1d',
    date: '2026-11-02',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Design system', component: 'ConnectorLogo', description: 'Shared connector logos (ThoughtSpot, Salesforce, HubSpot, Slack, Gong, monday.com) from one list; connectors without a logo show their brand-colour disc. Spotter\'s Connectors menu uses it' },
    ],
  },
  {
    version: '26.11.1c',
    date: '2026-11-02',
    type: 'figma-sync',
    changes: [
      { type: 'synced', group: 'Design system', component: '18 new icons', description: 'ai-star, analyst, collapse, delete, globe, memory, model, new-chat, parameter, styling, tab, trash-folder and six -stroke outlines; the rest refreshed from Figma. trash-can now aliases delete. 167 icons' },
      { type: 'modified', group: 'Tooling', component: 'npm run sync-icons', description: 'Reads the new Iconography page in full, Solid and Stroke styles and misnamed layers; retries slow downloads and drops white frame backgrounds' },
    ],
  },
  {
    version: '26.11.1b',
    date: '2026-11-02',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Icon guidance', description: 'Rule files list icons by what they mean and what has no icon, and say never to draw icons, use emoji or add icon libraries. /rp-radiant-check lists hand-drawn icons with the Icon to use instead' },
      { type: 'modified', group: 'Design system', component: 'apps-stroke', description: 'Draws fully in light mode: its masks keep their white fill, and npm run sync-icons now does this for every icon' },
    ],
  },
  {
    version: '26.11.1a',
    date: '2026-11-02',
    type: 'figma-sync',
    changes: [
      { type: 'added', group: 'Design system', component: 'Apps icon', description: 'apps (solid) and apps-stroke (outline) in all four sizes, from the Radiant 3.0 Object Icons set. Listed in the Product group on the icons page and in the rule files' },
    ],
  },
  {
    version: '26.10.4s',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Tooling', component: '/rp-spec', description: 'Drafts a prototype\'s engineering spec from the code, reviews it with the designer section by section, and marks it Ready for build only on their approval' },
      { type: 'added', group: 'Playground', component: 'Prototype spec', description: 'A Prototype / Spec switch on prototypes with a spec. Drafts show only under npm run dev; approved specs show to everyone and flag changes made after approval' },
    ],
  },
  {
    version: '26.10.4r',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Playground', component: 'Gallery announcement', description: 'A one-time splash screen introducing gallery groups, Move to group and renaming, and how to keep the old ungrouped view' },
    ],
  },
  {
    version: '26.10.4q',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Fork sync', description: 'The gallery plugin sits where forks rarely edit vite.config.ts, and /rp-sync-upstream resolves vite.config.ts and Liveboard template conflicts' },
      { type: 'modified', group: 'Tooling', component: 'Vite', description: 'Vite 7.3.7 fixes the dev server security alerts. Run npm install after syncing' },
    ],
  },
  {
    version: '26.10.4p',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Components', component: 'FontFormatter', description: 'Bold, italic, strikethrough and underline toggles from the Figma Font formatter' },
      { type: 'modified', group: 'Components', component: 'RichTextEditor', description: 'Format buttons use Radiant icons instead of Georgia letters, and a strikethrough toolbar item is available' },
    ],
  },
  {
    version: '26.10.4o',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Components', component: 'Accordion', description: 'variant list (Figma basic list: 48px parents, 32px nested children) and Accordion.ListItem with single and multi select and hover actions' },
      { type: 'modified', group: 'Components', component: 'Accordion', description: 'An open item follows its content height, so nested accordions open fully' },
    ],
  },
  {
    version: '26.10.4n',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Components', component: 'ColorPicker', description: 'selectorType menu: the Figma trigger and panel with a hex field and 56 Radiant swatches. RADIANT_PALETTE is exported' },
      { type: 'modified', group: 'Components', component: 'Popover', description: 'Flips to the other side of its trigger near a screen edge instead of covering it' },
    ],
  },
  {
    version: '26.10.4m',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Components', component: 'Table', description: 'TableCellRenderers.title, tokens, button and iconButton, from the Figma Object table cells' },
      { type: 'modified', group: 'Components', component: 'Table', description: 'Under look: radiant-3: 32px sentence-case header, 72px rows, Radiant checkboxes and a sort icon on hover' },
    ],
  },
  {
    version: '26.10.4l',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Components', component: 'SearchInput, Tabs, LoadingIndicator', description: 'SearchInput onClear and an underlined variant, per-tab disabled, and gray or white spinners' },
      { type: 'modified', group: 'Components', component: 'Button', description: 'Icon-only buttons use their text children as the accessible name' },
      { type: 'modified', group: 'Design system', component: 'Component docs', description: 'Props start collapsed behind a Show props button' },
      { type: 'modified', group: 'Components', component: 'Radiant 3.0 look', description: 'Under look: radiant-3: Select label-line helper and error text, 8px brand ProgressBar, PageHeader divider, regular Stepper titles, 18px spinner, Avatar names that scale and groups of three' },
    ],
  },
  {
    version: '26.10.4k',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Components', component: 'Button, Link', description: 'Tertiary icon-only buttons are round, as iconOnly intended. White links keep their colour on hover' },
      { type: 'modified', group: 'Components', component: 'Radiant 3.0 look', description: 'Under look: radiant-3: Ghost icon colour, Ghost Highlight for active menu rows, selected options and calendar dates, sentence-case menu group titles, no tooltip arrow, Segmented control spacing, Alert action and dismiss shapes, Global header hover fills' },
    ],
  },
  {
    version: '26.10.4j',
    date: '2026-10-28',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Design system', component: 'Component docs', description: 'A Usage section with Do and Don\'t rules from the Radiant 3.0 Figma file, for Button, Toast, Alert, Avatar, LoadingIndicator, ExplainerCard, Modal, TextInput and TextArea. The same rules are in the component inventory Claude reads' },
      { type: 'modified', group: 'Design system', component: 'Component docs', description: 'Wrong entries corrected (LoadingIndicator, SearchInput, Tabs, Modal, AppSidebar) and missing props added for Button, TextInput and Table' },
    ],
  },
  {
    version: '26.10.4i',
    date: '2026-10-27',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Tooling', component: '/rp-contribute', description: 'Asks what you are sharing, decides where each piece belongs (Radiant, Spotter, shared code or a sample), splits it into PRs against staging, runs the checks and writes the PR description. Asks before every commit and push' },
    ],
  },
  {
    version: '26.10.4h',
    date: '2026-10-27',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Playground', component: 'Group suggestions', description: 'Prototypes that share a name prefix before a colon or a folder prefix get a Group them note; one click groups them and drops the prefix from their names, with Undo' },
      { type: 'modified', group: 'Playground', component: 'Gallery notes', description: 'Group suggestion and thumbnail notes use a quieter style matching the Sort pill, instead of Alert' },
    ],
  },
  {
    version: '26.10.4g',
    date: '2026-10-27',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Playground', component: 'Gallery groups', description: 'An optional group on each prototype shows as a collapsible heading. Move cards with Move to group or by dragging, rename a group by clicking its name; changes save to registry-mine.ts under npm run dev, with Undo' },
      { type: 'added', group: 'Playground', component: 'Gallery views', description: 'Sort by recent or name, show in groups or all in one grid, and a list view with the group as a column' },
      { type: 'modified', group: 'Playground', component: 'Gallery', description: 'Samples have their own item in the left pane. Cards without a thumbnail show a Radiance-style placeholder instead of a live preview, and a note offers to capture the missing thumbnails' },
    ],
  },
  {
    version: '26.10.4f',
    date: '2026-10-26',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter', component: 'PromptBar', description: 'New opt-in props for surfaces that gather sources elsewhere: placeholder, onBlur, showModel, showPlus, connectors and onConnectorsChange, a left connectors placement with a count badge, hover text, plusMenuContent and leftExtras. Defaults are unchanged' },
      { type: 'modified', group: 'Spotter', component: '@spotter/chat', description: 'Exports DeepAnalysisGlyph and the Connector and ConnectorStatus types' },
      { type: 'modified', group: 'Components', component: 'Select', description: 'Shows the icon an option already carries, in the list and in the trigger' },
      { type: 'modified', group: 'Components', component: 'Tooltip', description: 'Renders on the page body and measures again once laid out, so it stays on its trigger inside animated or transformed layouts' },
    ],
  },
  {
    version: '26.10.4e',
    date: '2026-10-26',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Tooling', component: 'src/components/CLAUDE.md', description: 'Loaded whenever Claude works on shared components: read the four Tier 3 rule files first, keep default looks unchanged, check every use before changing a prop' },
      { type: 'added', group: 'Tooling', component: 'Guidance test', description: 'internal/scripts/guidance-test runs 10 prompts through headless Claude Code and scores whether it read the right rule files and asked the gate questions (maintainer only)' },
      { type: 'modified', group: 'Tooling', component: 'release.sh', description: 'Highlights go to src/data/highlights.ts, the file the changelog page reads' },
    ],
  },
  {
    version: '26.10.4d',
    date: '2026-10-26',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Rule files', description: 'Static styles go in a CSS Module next to the component; inline styles only for runtime values, so npm run handoff converts them' },
      { type: 'modified', group: 'Tooling', component: 'Liveboard template', description: 'Moves to CSS Modules: a new Liveboard prototype has 3 inline style blocks instead of 35, and looks and works as before' },
      { type: 'modified', group: 'Tooling', component: 'Handoff export', description: 'Ignores CSS comments, so a hex value in a comment no longer reads as ambiguous' },
    ],
  },
  {
    version: '26.10.4c',
    date: '2026-10-26',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Tooling', component: 'Handoff export', description: 'npm run handoff <Prototype> writes its CSS Modules as SCSS with the product\'s Radiant tokens ($rd-spacing--*, rd-sys-color()) plus a report of what still needs a person' },
      { type: 'modified', group: 'Tooling', component: 'Prototype template', description: 'Uses a token-only CSS Module instead of inline styles, so new prototypes export clean' },
    ],
  },
  {
    version: '26.10.4b',
    date: '2026-10-26',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Form alignment with Figma', component: 'TextInput', description: 'Under look: \'radiant-3\' the label line reads "Label (helper text)" and nothing goes under the field. On error the label turns red with an icon and reads errorMessage, or Please add “{label}” when none is set' },
      { type: 'modified', group: 'Form alignment with Figma', component: 'TextArea', description: 'Same Radiant 3.0 label line as TextInput; the character counter stays under the field' },
    ],
  },
  {
    version: '26.10.4a',
    date: '2026-10-26',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Modal M4', description: 'Fills the overlay padding, so it sits 24px from every window edge instead of 8px at the top and bottom; width caps removed. Header is 72px with the title and Close button 20px from the top' },
      { type: 'modified', group: 'Spotter chat', component: 'VizBlock M4 expand modal', description: 'Dropped its M4 width override, now redundant' },
    ],
  },
  {
    version: '26.10.3j',
    date: '2026-10-14',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Claude guidance', description: 'CLAUDE.md tells Claude to read _orchestration.md before UI or prototype work and carries the tier table again, naming the rule files; asks for short, plain replies; the gate hook also covers new Data Model Editor and Spotter prototypes' },
      { type: 'modified', group: 'Tooling', component: 'Rule files', description: 'Removed false claims that the rules auto-load in Claude Code; the icon list has all 151 icons; the Data Model Editor gate uses rp-prototype-model instead of old model ids' },
    ],
  },
  {
    version: '26.10.3i',
    date: '2026-10-14',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Documentation', component: 'Changelog highlights', description: 'Six short highlights for v26.10: dark mode, Geist, Radiant 3.0 components, the new Radiant Play look, design system updates, and one item for the rest. The first six in the list show, instead of everything from the last 60 days' },
    ],
  },
  {
    version: '26.10.3h',
    date: '2026-10-14',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Dependencies', description: 'source-map-js 1.2.2 fixes Dependabot alert 37 (high): a crafted source map could stall the build. Development only, through Vite and PostCSS' },
    ],
  },
  {
    version: '26.10.3g',
    date: '2026-10-14',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'App frame', description: 'The playground and the design system share one frame: a left pane with the Radiant Play logo, a Playground / Design system switcher, and content on a raised panel; light mode separates surfaces by fill' },
      { type: 'added', group: 'Tooling', component: 'Help menu', description: 'Help at the bottom of both left panes: What\'s new with the version, and the three guides in a new tab' },
      { type: 'modified', group: 'Tooling', component: 'Design system layout', description: 'The panel scrolls on its own and section titles no longer jump when a page opens' },
      { type: 'modified', group: 'Docs', component: 'Guides', description: 'Getting started, How it works and Claude setup follow light and dark mode with Radiant tokens, Geist and the Radiance Home pattern' },
      { type: 'modified', group: 'Components', component: 'ActionMenu', description: 'Closes once an item is chosen; Escape and Tab always close it (Sneharsh Damani)' },
      { type: 'modified', group: 'Components', component: 'Tour', description: 'Follows scrolling inside a container, not only the window' },
    ],
  },
  {
    version: '26.10.3f',
    date: '2026-10-13',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Docs', component: 'Prototype template', description: 'The template README starts with /rp-new-prototype and describing the UI to Claude, not Cursor' },
      { type: 'modified', group: 'Docs', component: 'UX writing rules', description: 'Says the rules are shared with Claude' },
      { type: 'modified', group: 'Docs', component: 'Cursor docs', description: 'The Cursor model guide and the Cursor-to-Claude video script move to docs/archive/' },
    ],
  },
  {
    version: '26.10.3e',
    date: '2026-10-13',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Maintainer pushes', description: 'origin gets two push URLs (GitHub and galaxy), so a plain git push updates both; install-maintainer-hooks.sh sets it up. push-faris.sh still works. Designer forks are unchanged' },
      { type: 'modified', group: 'Docs', component: 'Getting started guide', description: 'Teaches the Claude desktop app: set up in the Code tab, start with /rp-new-prototype, share with /rp-coolify-deploy. The model credits slide is now a slash commands slide' },
      { type: 'modified', group: 'Docs', component: 'How it works', description: 'Says Claude finds the rules in .cursor/rules/ through CLAUDE.md' },
      { type: 'modified', group: 'Docs', component: 'Claude setup page', description: 'The gallery\'s Claude setup page and its markdown twin rewritten for the desktop app, with no API key and the /rp- commands' },
      { type: 'modified', group: 'Docs', component: 'Onboarding docs', description: 'GETTING_STARTED, the forking and prototyping guides, FORK-WORKFLOW and README set up with the Claude desktop app and a Galaxy fork' },
      { type: 'modified', group: 'Docs', component: 'Node version', description: 'Docs said Node 18+, but Vite 7 needs 22+ (or 20.19+). They say so now' },
    ],
  },
  {
    version: '26.10.3d',
    date: '2026-10-13',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Thumbnail setup', description: 'npm run thumbnails:setup works again. It failed on every machine because npm rejects .radiantplay-visual as a package name; setup now writes its own package.json' },
      { type: 'modified', group: 'Tooling', component: 'Thumbnail capture', description: 'npm run thumbnails takes --wait <ms> (default 800) to settle longer before each shot, for screens that reload an iframe when the theme switches to dark' },
    ],
  },
  {
    version: '26.10.3c',
    date: '2026-10-13',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Docs', component: 'Hosting', description: 'Coolify only: Vercel is switched off, and the docs and the project canvas Sites tab list Coolify sites only. vercel.json, middleware.ts and api/chat.ts stay for forks still on Vercel' },
    ],
  },
  {
    version: '26.10.3b',
    date: '2026-10-13',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Figma', component: 'PageHeader', description: 'new component from Figma. A 24/32 title with optional `breadcrumbs`, `description`, `tabs` (Radiant Tabs) and `actions` (Buttons on the right).' },
      { type: 'added', group: 'Figma', component: 'EditHeader', description: 'new component from Figma, the edit-mode sibling of WizardHeader. A 20/28 title with optional segmented `tabs`, and Reset, Save and Exit buttons (`onReset`, `onSave`, `onExit`); `edited` switches between the Saved and Edited states.' },
      { type: 'added', group: 'Figma', component: 'SplitButton', description: 'a main action plus a chevron that opens an ActionMenu (Figma Split button). Props: label, onClick, items, variant (primary, secondary), icon, iconOnly, disabled, mainDisabled, menuDisabled, menuPlacement.' },
      { type: 'added', group: 'Figma', component: 'DotLoader', description: 'the three-dot global loader from Figma, with an optional message below. Props: message, label. Respects reduced motion. LoadingIndicator is unchanged.' },
      { type: 'added', group: 'Figma', component: 'ScrollArea', description: 'a wrapper that styles its content\'s scroll bar like Figma (8px track, rounded tertiary thumb) with CSS only. Props: orientation, maxHeight, maxWidth, focusable. Global scrollbars are unchanged.' },
      { type: 'added', group: 'Figma', component: 'Token', description: 'new 24px read only and editable token for measures, attributes, conditions and dates (`type`, `status` default/warning/error, `editable`, `active`, `onRemove`, `showIcon`). First component to use the chip date, error and active-border tokens.' },
      { type: 'added', group: 'Figma', component: 'ChipIdentifier', description: 'new 24px brand chip with inverse text for identifiers such as key columns (`label`, `maxWidth`).' },
      { type: 'added', group: 'Figma', component: 'UserChip', description: 'new 28px person chip with a Radiant Avatar, name and optional remove button for inputs (`name`, `src`, `selected`, `onClick`, `onRemove`, `disabled`). First component to use the chip input tokens.' },
      { type: 'added', group: 'Figma', component: 'Breadcrumb', description: 'new component from Figma. A round back button and gray parent links; `items` takes `{ label, href?, onClick? }`, the last item is the current page, with `showBackButton`, `onBack` and `showCurrent`.' },
      { type: 'added', group: 'Figma', component: 'NumberInput', description: 'a number field with spin buttons that show on hover and focus, with min, max, step, error, helper text, disabled and read-only states; arrow keys step the value and it follows TextInput\'s radiant-3 look.' },
      { type: 'added', group: 'Figma', component: 'InlineEdit', description: 'text that turns into a field on click or Enter, in 14 and 16px sizes; Enter or blur confirms, Escape cancels, with value, onChange, placeholder, required and disabled props.' },
      { type: 'added', group: 'Figma', component: 'FileUploader', description: 'a file field with an Upload button, drag and drop, a clear button and an optional file list showing uploading, complete or error per file; no real upload, with files, onFilesChange, multiple, accept, error, disabled and readOnly props.' },
      { type: 'added', group: 'Figma', component: 'DateRangePicker', description: 'new range version of DatePicker from Figma "Date Picker / Range". Two fields joined by "to" share one calendar that opens under the active field; days between start and end are highlighted, with a hover preview while picking the end. Props: value ({ start, end }), onChange, format, label, startPlaceholder, endPlaceholder, separator, hasError, helperText, disabled, minDate, maxDate. DatePicker itself is unchanged.' },
      { type: 'modified', group: 'Figma', component: 'Token sweep', description: 'GlobalHeader, AppSidebar and DatePicker use spacing, radius and type tokens where a token has the exact same value (54 replacements). No visual change.' },
      { type: 'modified', group: 'Dark mode', component: 'Avatar', description: 'Count badge and status dot use the solid failure red with contrasting text and a ring, readable in light and dark; purple and orange initials avatars lighten in dark mode.' },
      { type: 'added', group: 'Documentation', component: 'On this page', description: 'Design system pages with three or more sections list them on the right once you scroll, current one highlighted. Content starts after the sidebar on every page; page titles and section headings share one style; section links are blue pills.' },
      { type: 'modified', group: 'Documentation', component: 'Radiance guide', description: 'Template builder first, with a copyable prompt for Claude instead of code; section links as pills.' },
      { type: 'modified', group: 'Documentation', component: 'Design system pages', description: 'Theme icon at the top right instead of the sidebar footer control; Inspect removed from that footer; Colours swatches follow the theme; Component Registry rows carry real Figma ids and dates; New tags trimmed to the last month; Icons usage moved to the bottom; changelog highlights follow the teaser.' },
    ],
  },
  {
    version: '26.10.3a',
    date: '2026-10-13',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: 'Skills menu', description: 'rp-radiance, rp-prototype-model and rp-prototype-thumbnails no longer appear in the / menu. Claude still loads each when a request needs it (Radiance or an AI background, switching a prototype model, updating a thumbnail), and the commands that capture thumbnails still do.' },
      { type: 'modified', group: 'Project status dashboard', component: 'Project canvas', description: 'The maintainer canvas opens in about 14 seconds instead of about two minutes: Forks shows the results saved by the last full run, with their age, and the local-file check runs once instead of per doc. /rp-project-canvas full (or census) refreshes Forks and the prototype census in the background, with a 60 second limit per fork fetch.' },
      { type: 'added', group: 'Project status dashboard', component: 'Census tab', description: 'The prototype census moves to its own maintainer-only tab; with nothing saved or a week-old run it shows the command to run with a Copy button.' },
      { type: 'removed', group: 'Tooling', component: '/rp-prototype-census', description: 'Replaced by /rp-project-canvas full. The census script stays.' },
    ],
  },
  {
    version: '26.10.2e',
    date: '2026-10-12',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Figma', component: 'Accordion', description: 'New variant="card": each item is a card with radius 6, surface shadow (menu shadow on hover), 24px padding, a leading 18px chevron, a 16/24 title at 550 and a 12/16 body lined up with the title. Existing variants are unchanged.' },
      { type: 'modified', group: 'Figma', component: 'ExplainerCard', description: 'New appearance="raised": menu shadow, no border, radius 6, padding 20, an 18/24 title and body in primary text. New media, onDismiss, primaryAction and secondaryAction props; title is optional for the title-less layout. The bordered default is unchanged.' },
      { type: 'modified', group: 'Figma', component: 'NoData', description: 'New layout="horizontal": icon left, secondary text, type page or section, status empty, warning or success, Small Secondary and Small Primary buttons and a tertiary link. The centred stack default is unchanged.' },
      { type: 'modified', group: 'Figma', component: 'Tour', description: 'New tone="brand": a 340px brand-filled spotlight card with inverse text, a "2 of 4" counter and white tertiary buttons. The default card is unchanged.' },
      { type: 'added', group: 'Figma', component: 'WizardHeader', description: 'The Figma wizard as a 64px page header: eyebrow, 20/28 title, Secondary and Primary buttons, a divider, a tertiary Exit button and a 4px segmented progress bar. WizardModal is unchanged.' },
      { type: 'added', group: 'Documentation', component: 'Radiance guide', description: 'Radiance guide at /radiant/radiance: the four product patterns live, a template builder, the rules and how Radiance reaches prototypes.' },
    ],
  },
  {
    version: '26.10.2d',
    date: '2026-10-12',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Figma', component: 'Radiant 3.0 look (opt-in)', description: 'Add look: \'radiant-3\' to a prototype\'s registry-mine.ts entry to switch its Radiant components to the Figma sizes. New prototypes get it from /rp-new-prototype and npm run new-prototype. Existing prototypes are unchanged until they opt in; /rp-migrate-prototype offers it after the dark check, never on its own, and /rp-sync-upstream never adds it.' },
      { type: 'modified', group: 'Figma', component: 'Text fields (opt-in)', description: 'Under the look, TextInput, TextArea, Select, SearchInput and DatePicker fields are 32px with 16/12 side padding and a 6px radius; labels are 12/18 regular and turn brand blue on focus; hover darkens the border; no focus ring; disabled fades the whole field to 40%.' },
      { type: 'modified', group: 'Figma', component: 'Menu and Select popup (opt-in)', description: 'Under the look: Raised, no border, 6px radius, 8px list padding, 32px items with 16px sides and a 12px gap, ghost hover fill.' },
      { type: 'modified', group: 'Figma', component: 'Tabs (opt-in)', description: 'Under the look: 48px, 12px side padding, regular weight in every state. size="small" gives 32px.' },
      { type: 'modified', group: 'Figma', component: 'Icon button (opt-in)', description: 'Under the look the 32px icon-only button uses an 18px icon.' },
      { type: 'modified', group: 'Figma', component: 'DatePicker (opt-in)', description: 'Under the look: 24px panel padding, 6px radius, Raised, menu shadow, no border; 32px rounded-square day cells; 14/20 emphasis weekday labels in secondary text; month and year as brand tertiary buttons; 32px nav buttons with 18px chevrons.' },
      { type: 'modified', group: 'Figma', component: 'Pagination Range (opt-in)', description: 'Under the look: 24px round secondary icon buttons and "results" in the label.' },
      { type: 'added', group: 'Figma', component: 'TextInput', description: 'New readOnly state (On Base fill, no border), helperText and trailingIcon, in both looks. Existing props work as before.' },
      { type: 'added', group: 'Figma', component: 'Tabs size and Button xs', description: 'Tabs size="medium" (48px) or "small" (32px); without it Tabs keep today\'s height. Button size="xs" is a 20px icon-only button with a 12px icon. Both work in either look.' },
      { type: 'added', group: 'Figma', component: 'RadiantLook', description: 'RadiantLook, useRadiantLook() and RadiantLookScope in src/context/RadiantLookContext.tsx. Portaled content wraps itself in RadiantLookScope to keep the look; the Spotter VizBlock expand modal does.' },
    ],
  },
  {
    version: '26.10.2c',
    date: '2026-10-12',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Figma', component: 'Toggle', description: 'Thin 8px track with a 16px thumb that overhangs it, on the toggle tokens. Off: grey track, white outlined thumb with a soft shadow. On: light blue track, blue thumb. The outer box stays 28x16. The grey hover tint is gone; Figma has no hover state.' },
      { type: 'modified', group: 'Figma', component: 'Toast', description: 'Dark grey (Background Inverse) with white text, 16px padding, 6px corners, 18px status icon and the menu shadow. The action is a real white Button (Primary White Small); dismiss is a 24px white icon button. About 8px taller, so a toast placed in the page flow pushes content down by that much while it shows.' },
      { type: 'modified', group: 'Figma', component: 'Stepper and VerticalStepper', description: 'Done steps are green with a 16px check, the current step is a blue outline with a blue number, upcoming steps are grey outlines. 32px circles, 1px strokes and connectors; connectors turn green after done steps.' },
      { type: 'modified', group: 'Figma', component: 'Tabs', description: 'Hover turns the label blue with no grey fill; inactive labels use the primary text colour. The active underline uses the Brand border token (same blue). Colours moved from inline styles into CSS, which had blocked the hover colour. Weight and padding unchanged.' },
      { type: 'modified', group: 'Figma', component: 'Button Small', description: 'Primary Small and Primary White Small have 16px corners, matching the basic size.' },
    ],
  },
  {
    version: '26.10.2b',
    date: '2026-10-12',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Dark mode', component: 'ThemeSwitch', description: 'New variant="icon": one icon button that shows the current theme (sun, moon or half-filled circle for system) and cycles light, dark, system on click. The playground header uses it; the default stays the segmented control, so the Radiant docs sidebar and forks are unchanged. Ctrl+D works as before.' },
      { type: 'modified', group: 'Figma', component: 'Button White', description: 'Fully white, with Figma\'s on-colour hover and pressed fills; disabled is the white fill at 40%. Tertiary White hovers with a fainter tint and presses with the light blue tint instead of a black overlay.' },
      { type: 'modified', group: 'Figma', component: 'Button Secondary', description: 'Hover is a darker grey (it showed no change before); pressed is a deeper grey with dark text instead of blue.' },
      { type: 'modified', group: 'Figma', component: 'Button tokens', description: 'Primary, Secondary and Tertiary use their button colour tokens (same colours). Small buttons get Figma\'s positive letter spacing, so labels are about 1px wider.' },
      { type: 'modified', group: 'Figma', component: 'SegmentedControl', description: 'Inactive labels are darker (primary text). The selected label uses the segmented control token: blue in light mode, near-white in dark mode.' },
      { type: 'modified', group: 'Figma', component: 'Modal', description: 'Title is bolder (550). Header on Raised; footer on On Base with no top border, still 72px.' },
      { type: 'modified', group: 'Figma', component: 'Tooltip', description: 'Rounder (6px), menu shadow, inverse background and text; the arrow matches.' },
      { type: 'modified', group: 'Figma', component: 'Checkbox and Radio', description: 'Borders on the Brand, Failure and Bold border tokens, set in CSS instead of inline styles. The hover border that never showed is gone; Figma has no hover state.' },
      { type: 'modified', group: 'Figma', component: 'Alert', description: 'Muted alerts sit on Secondary Action grey, a shade darker. The page alert dismiss icon is 18px inside the same 32px button.' },
      { type: 'modified', group: 'Figma', component: 'ProgressBar', description: 'Track and blue fill use the background tokens (same colours).' },
      { type: 'modified', group: 'Figma', component: 'WizardModal and TextArea', description: 'Corrected var() fallbacks (radius 12px, label 14px).' },
      { type: 'added', group: 'Radiance', component: 'Managed Radiance', description: 'public/vendor/radiance/manifest.json records the source commit and a checksum per file; the vendored files add the SpotterX and Liveboard recipes and Radiance\'s own lint. npm run radiance:check (also in build:strict) fails if a copy is edited, npm run radiance:lint -- src/prototypes/<Name> checks a prototype, npm run radiance:update refreshes everything (maintainer), and /rp-sync-upstream brings updates to forks. RadianceBackground takes a pattern (home, signup, spotterx, liveboard or a template) and a state; existing pages are unchanged. Home page, SpotterX, Liveboard and sign up prototypes get their Radiance pattern automatically (rp-radiance skill), and /rp-new-prototype asks about Radiance for AI surfaces.' },
    ],
  },
  {
    version: '26.10.2a',
    date: '2026-10-12',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Radiance', component: 'Playground and home page', description: 'Radiance\'s Home pattern, a subtle top wash, sits behind the top of the playground and the home page. It follows light and dark, freezes under reduced motion, and loads only on these pages and /radiant.' },
      { type: 'modified', group: 'Radiance', component: 'Design system page', description: 'The /radiant hero is a light card with the Radiance wash instead of the dark gradient card, with Radiant buttons and token colours.' },
      { type: 'added', group: 'Tooling', component: 'Designer project canvas', description: '/rp-project-canvas on a designer fork shows your own work: next steps, your prototypes with dark, Geist and thumbnail readiness, how many releases you are behind RadiantPlay, your branches, your Coolify site and guides. The first run asks two questions and saves the answers in internal/status.local.sh, which stays on your machine. It uses the Radiance look in Geist, with Radiance\'s own Home wash.' },
      { type: 'modified', group: 'Tooling', component: 'scan.mjs --mine --json', description: 'meta adds each prototype\'s name and lastChange. Existing fields are unchanged.' },
    ],
  },
  {
    version: '26.10.1b',
    date: '2026-10-12',
    type: 'patch',
    changes: [
      { type: 'removed', group: 'Tooling', component: '/thumbnail command', description: 'Thumbnails are captured by /rp-radiant-check after a check, by /rp-sync-upstream for missing ones, and by /rp-migrate-prototype; or ask Claude to update a thumbnail. The steps live in the rp-prototype-thumbnails skill.' },
      { type: 'added', group: 'Tooling', component: 'Model switching skill', description: '/switch-model stays for now. Or ask Claude to switch the model a prototype calls; the rp-prototype-model skill handles it. Not the same as Claude Code\'s own /model.' },
      { type: 'modified', group: 'Tooling', component: 'npm run new-prototype', description: 'Scaffolds from the token-based template, registers in registry-mine.ts and marks the prototype theme: global when the dark scan confirms it.' },
      { type: 'added', group: 'Tooling', component: 'src/prototypes/CLAUDE.md', description: 'Folder rules Claude Code loads when working on prototypes: registry-mine.ts, theme: global after a dark check, done means a clean scan and build.' },
      { type: 'modified', group: 'Dark mode', component: 'Designer prototypes', description: 'Prototypes in registry-mine.ts stay light unless marked theme: global, so nothing changes until a designer migrates. /rp-migrate-prototype and /rp-new-prototype set global; /rp-sync-upstream no longer marks anything, so one sync is enough.' },
      { type: 'modified', group: 'Tooling', component: 'rp- command names', description: 'Every RadiantPlay command starts with rp- (/rp-new-prototype, /rp-radiant-check, /rp-migrate-prototype, /rp-sync-upstream, /rp-coolify-deploy, /rp-explore, /rp-project-canvas, /rp-prototype-census). Old names keep working; the steps stay in the old files for now so forks that edited a command merge cleanly.' },
    ],
  },
  {
    version: '26.10.1a',
    date: '2026-10-09',
    type: 'figma-sync',
    changes: [
      { type: 'added', group: 'Tooling', component: 'Figma token sync', description: 'Snapshot of the Radiant 3.0 Figma variables, text styles and effect styles, plus a diff against the TS tokens and tokens.css (npm run figma-tokens:diff). Tooling only.' },
      { type: 'synced', group: 'Tokens', component: 'background-base-inverse', description: 'Gray/80 (#323946) per Figma Background/Inverse. Tooltips and the Liveboard edit header get slightly lighter. Undoes the 26.5.4a revert to #1D232F; Figma is now the source of truth.' },
      { type: 'synced', group: 'Tokens', component: 'Light mode values', description: 'brand/10 is #F2F7FF; button-secondary-pressed, button-tertiary-pressed, toggle-track-on and toggle-thumb-on match Figma.' },
      { type: 'added', group: 'Tokens', component: 'New Figma tokens', description: 'button-overlay, segmented-control-content-active, and the gray-20a, brand-10a and purple-20a alpha colours.' },
      { type: 'added', group: 'Tokens', component: 'Figma name aliases', description: 'background-inverse, background-secondary-action, content-inverse, border-subtle, border-bold and border-bold-hover, next to our existing names. Nothing renamed.' },
      { type: 'added', group: 'Tokens', component: 'Chip CSS variables', description: '--rd-comp-color-chip-* in tokens.css (light, dark and system dark), so CSS Modules can use chip tokens.' },
      { type: 'synced', group: 'Typography', component: 'Geist', description: 'Geist and Geist Mono variable fonts, self-hosted and preloaded. Headings and labels at the new emphasis weight (550), body at 400, letter spacing per Figma. semibold and light remain as deprecated aliases (550 and 400).' },
      { type: 'modified', group: 'Typography', component: 'Hardcoded fonts and weights', description: 'Plain font stacks and 600/375 weights replaced with tokens across components, Spotter, pages, sample prototypes, the prototype template and the scaffold. DataModelEditor switched to Geist; its Plain font files removed.' },
      { type: 'modified', group: 'Typography', component: 'Typography', description: 'Headline, title and label variants at the 550 emphasis weight with Figma letter spacing (were 500). Spec labels on the Typography page match Figma.' },
      { type: 'modified', group: 'Typography', component: 'Global font rules', description: 'Form controls inherit the page font instead of Arial; code elements use Geist Mono; conditional weights and hardcoded monospace stacks use tokens.' },
      { type: 'added', group: 'Tooling', component: 'Visual snapshots', description: 'Screenshot every page and sample prototype in light and dark, and compare two builds side by side (scripts/visual-snapshots). Playwright stays outside package.json.' },
      { type: 'synced', group: 'Dark mode', component: 'Dark values', description: 'Dark Gray scale, 52 semantic and 48 component dark values match Figma; 22 missing dark values added to tokens.css; system-dark block matches the dark theme including shadows. Not visible until dark mode is switched on.' },
      { type: 'added', group: 'Dark mode', component: 'Ctrl+D shortcut', description: 'Press Ctrl+D anywhere in the app to switch between light and dark mode. The choice is saved across reloads.' },
      { type: 'added', group: 'Dark mode', component: 'Theme controller', description: 'ThemeContext with light, dark and system modes, saved in the browser, light by default. The only writer of data-theme; useTheme() and useIsDarkMode() for components. An inline script in index.html applies the saved theme before first paint.' },
      { type: 'added', group: 'Tooling', component: 'Scaligent token tally', description: 'Compares our colour tokens with the product codebase (match, differs, proposed, Scaligent-only), with a Figma name check. npm run scaligent-tokens:tally. Tooling only.' },
      { type: 'modified', group: 'Tokens', component: 'Product token names', description: 'Shadows are --rd-sys-color-shadow-surface/-menu/-modal and button-overlay is button-bg-overlay, matching the product. The older names stay as aliases.' },
      { type: 'added', group: 'Tokens', component: 'New product tokens', description: 'background-secondary-hover and the circular progress tokens (progress-track-active, progress-track-empty, progress-indicator-default). Nothing uses them yet.' },
      { type: 'removed', group: 'Dark mode', component: 'System-dark copy', description: 'The prefers-color-scheme copy of the dark tokens in tokens.css. The theme controller handles the system setting.' },
      { type: 'added', group: 'Tokens', component: 'Differences list', description: 'docs/2026-10-06-scaligent-token-differences.md lists the 33 values where Figma and the product disagree.' },
      { type: 'added', group: 'Tokens', component: 'sysVar, compVar, shadowVar', description: 'Helpers that return the CSS variable for a token, for inline styles that follow the theme. Use them instead of systemColors.light[...].' },
      { type: 'modified', group: 'Dark mode', component: 'Shared layers', description: 'Components, Spotter, Liveboard tiles and the prototype templates follow the theme. The docs sidebar follows the theme; the product primary nav stays dark. 11 undefined token names now point at real tokens.' },
      { type: 'added', group: 'Dark mode', component: 'Chart theme', description: '13 chart tokens with the product names and dark values, and useChartTheme() for ECharts. Dark series colours use the product OKLCH remap. Charts redraw on theme change.' },
      { type: 'added', group: 'Dark mode', component: 'ThemeSwitch', description: 'Light, Dark and System control on SegmentedControl, in the gallery header and the Radiant docs sidebar. Stays in step with Ctrl+D.' },
      { type: 'modified', group: 'Dark mode', component: 'Pages', description: 'Gallery, home, Radiant docs and changelog pages follow the theme. The Colours page shows light and dark values side by side for every token.' },
      { type: 'added', group: 'Tooling', component: 'Dark readiness scan', description: 'npm run scan:dark counts colour code that will not follow the theme, per prototype; npm run lint:tokens fails on the shared layers. /radiant-check prints a dark ready line. Exceptions with reasons in scripts/radiant-check/rules.json.' },
      { type: 'added', group: 'Tooling', component: 'Geist readiness', description: 'The scan flags hardcoded font stacks and 600/375 weights; --mine lists a designer\'s prototypes with theme and thumbnail status; vendor/ is counted separately; rules-mine.json holds a designer\'s own exceptions.' },
      { type: 'added', group: 'Tooling', component: 'Migration codemod', description: 'npm run migrate:codemod moves prototype code onto Geist and theme tokens, leaving a decision list for what it cannot settle. Skips vendor/, follows scan exceptions, keeps brand colours. npm run codemod:check tests it on the sample prototypes.' },
      { type: 'added', group: 'Tooling', component: '/migrate-prototype', description: 'Migrates a designer\'s prototypes onto Geist and dark mode in one pass: scan, pick, codemod, grouped decisions, build, light and dark check, light-only flag per prototype. Never commits.' },
      { type: 'modified', group: 'Tooling', component: '/sync-upstream light-only step', description: 'After a merge, prototypes that are not dark ready are flagged light-only and the status table is shown. On the first sync of this release, run npm run migrate:light-only -- --write once, since the fork\'s older command doesn\'t have the step yet.' },
      { type: 'modified', group: 'Tooling', component: '/sync-upstream build fix', description: 'A registry-mine.ts entry importing a deleted sample thumbnail SVG breaks the build after a clean merge; the sync drops the import and the gallery shows a live preview.' },
      { type: 'modified', group: 'Tokens', component: 'applyTheme', description: 'Accepts \'system\' again and resolves it to the system preference, so older fork code still typechecks.' },
      { type: 'modified', group: 'Tooling', component: 'Migration codemod', description: 'Names a missing prototype path instead of crashing.' },
      { type: 'modified', group: 'Tooling', component: 'Coolify nginx', description: 'docker/nginx.conf serves every .html with Cache-Control: no-cache, so browsers pick up a new deploy without a hard refresh. Applied to the radiantplay-staging app too.' },
      { type: 'modified', group: 'Tooling', component: '/coolify-deploy', description: 'Written for Claude in Chrome and Coolify v4.4.3 field names; sets the nginx config through the code editor, checks no-cache, and asks before moving any secret.' },
      { type: 'modified', group: 'Tooling', component: 'Migration codemod', description: 'Chart options are no longer rewritten to CSS variables or font tokens; they become chart decisions resolved with useChartTheme(). --include-vendor migrates a vendor/ folder on request.' },
      { type: 'modified', group: 'Tooling', component: 'Dark readiness', description: 'The scan follows imports into other prototypes\' folders and flags static pages in an iframe. Screenshots flag a dark image identical to the light one; archived prototypes can be captured by name; light-only.mjs --force --reason keeps a prototype light.' },
      { type: 'modified', group: 'Dark mode', component: 'ThoughtSpot nav', description: 'GlobalHeader, AppSidebar, the Liveboard primary nav, edit toolbar and styling drawer follow the theme on background-on-base, matching the product. GlobalHeader theme defaults to auto; dark is the legacy always-dark nav.' },
      { type: 'modified', group: 'Dark mode', component: 'Sample prototypes', description: 'Every sample prototype works in dark mode, NewUIAdmin2 included. A registry entry can set theme: light-only to stay light until it is ready.' },
      { type: 'added', group: 'Gallery', component: 'Thumbnails', description: 'Light and dark screenshots per prototype (/thumbnail, npm run thumbnails). Prototypes without one show a live preview instead of a folder icon. /new-prototype no longer draws a placeholder.' },
      { type: 'modified', group: 'Guidance', component: 'Theme-aware examples', description: 'CLAUDE.md, cursor rules, skills and /new-prototype teach sysVar(), compVar() and shadowVar() instead of systemColors.light, so new prototypes work in dark mode.' },
      { type: 'added', group: 'Components', component: 'AppSidebar theme', description: 'auto (default) follows the app theme; dark keeps the legacy navy nav, like GlobalHeader.' },
    ],
  },
  {
    version: '26.9.1c',
    date: '2026-09-03',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Tooling', component: '/coolify-deploy', description: 'Guided Coolify setup for a fork, one verified step at a time, plus a check mode that compares an existing app against the recipe. Drives the Coolify and galaxy UIs via Claude in Chrome, never types secrets, reads docs/coolify/ at run time.' },
      { type: 'modified', group: 'Deployment', component: 'Coolify docs', description: 'Every app on one fork must share the same GitHub webhook secret; Coolify checks the signature per app and skips mismatches silently while galaxy shows 200.' },
    ],
  },
  {
    version: '26.9.1b',
    date: '2026-09-03',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Dependencies', component: 'Security update', description: 'npm audit fix clears all 19 Dependabot alerts without major bumps: react-router-dom 7.13 to 7.18.3, vite 7.3.3 to 7.3.6, plus transitive patches for postcss, browserslist, @babel/core and esbuild. Lockfile remains on the public npm registry.' },
    ],
  },
  {
    version: '26.9.1a',
    date: '2026-09-03',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Spotter', component: 'Refresh blocks', description: 'Reasoning, UserMessage, PromptBar and ToolIcon (Devanshi Behera) move from the SpotterComponents prototype into src/spotter/chat/. ReasoningBlock and UserBubble become adapters over them, so existing prototypes are unchanged; PromptBar ships alongside SpotterPrompt.' },
      { type: 'added', group: 'Spotter', component: 'Refresh showcase', description: 'Front door for the Refresh blocks on /radiant/spotter with usage rules; Spotter roadmap updated.' },
      { type: 'added', group: 'Deployment', component: 'Coolify docs', description: 'docs/coolify/ gathers the designer deploy guide, an operations sheet (apps, webhook, recipe, quirks) and an index; the original design record moved to docs/archive/.' },
      { type: 'added', group: 'Deployment', component: 'docker/nginx.conf + Dockerfile', description: 'The SPA fallback config every Coolify app pastes in, and a multi-stage image for the no-git deploy path.' },
      { type: 'modified', group: 'Tooling', component: 'push-faris.sh + pre-push hook', description: 'One-step push to origin and galaxy; the hook now protects the faris working branch from force-push and deletion instead of blocking the retired personal branch.' },
      { type: 'modified', group: 'Repository', component: 'CLAUDE.md + README', description: 'faris replaces personal in the branch model; Coolify URLs listed beside the Vercel ones for main, staging and faris.' },
    ],
  },
  {
    version: '26.7.1b',
    date: '2026-07-01',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Components', component: 'SegmentedControl', description: 'Aligned visual style to the Radiant 3.0 Figma: pill-shaped track and segments, brand-blue active label, Elevation/100 shadow, lighter font weight, unified disabled opacity. CSS-only; propagates everywhere SegmentedControl is used.' },
    ],
  },
  {
    version: '26.7.1a',
    date: '2026-07-01',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Tooling', component: 'Prototype census', description: 'Opt-in /prototype-census counts prototypes across all forks (folders + registry entries by section, per creator, archived included) with API-based fork auto-discovery. The status dashboard displays the cached result without refetching.' },
      { type: 'added', group: 'Tiles', component: 'Chart color override', description: 'AnswerTile and ChartRenderer accept an optional colors prop; AreaChart and ColumnChart use it, falling back to the default sequential palette. Additive and backward-compatible.' },
      { type: 'removed', group: 'Dependencies', component: '@vercel/analytics', description: 'Dropped the Vercel Analytics dependency and its inject() wiring in main.tsx. Bumped echarts to 6.1.' },
      { type: 'modified', group: 'Tooling', component: 'public-strip.sh', description: 'Omits .claude/settings.json and the post-compact hook from the public snapshot, avoiding the liveboard-gate.sh hook error on public clones.' },
      { type: 'removed', group: 'Repository', component: 'Revefi talk deck', description: 'Removed the personal talk deck from main; it now lives on the personal branch (dated).' },
    ],
  },
  {
    version: '26.5.4b',
    date: '2026-05-27',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Repository', component: 'Housekeeping', description: 'Archived stale root files to internal/archive/, consolidated onboarding docs (SETUP-GUIDE.md, getting-started/) into GETTING_STARTED.md, grouped maintainer scripts under internal/scripts/, dropped a redundant cp build step, and stopped tracking the 11 MB Notion export. No user-facing changes.' },
      { type: 'added', group: 'Tooling', component: 'public-strip.sh + housekeeping-check.sh', description: 'public-strip.sh produces a clean public snapshot (omits internal files, scrubs strings, grep-gates the result). housekeeping-check.sh runs the reorg pre-merge checks in one command.' },
    ],
  },
  {
    version: '26.5.4a',
    date: '2026-05-26',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Prototypes', component: 'StylingPanel (Liveboard - Styling panel)', description: 'Restored after the original PR #14 revert. Per-tile drawer with density, color theme, corner style, spacing, and highlight overrides. Shared tile CSS variables added to AnswerTile, NoteTile, GroupTile. Authored by Devanshi Behera. Two integration bugs from the original PR also fixed (missing AnswerTileProps.highlighted, EditToolbar onToggleStyling wiring)' },
      { type: 'added', group: 'Prototypes', component: 'NewUIAdmin2 (AdminUI 2.0)', description: 'Application Settings screen added to the shared sample registry. Cluster settings, administration toggles, downloads and schedules, version control, AI settings. Lands via PR #19 from simran-pandit/feat/newuiadmin2' },
      { type: 'added', group: 'Spotter prototype', component: 'Analyst right-pane state machine', description: 'AnalystLandingPage + AnalystListPage added. Right pane now switches between chat, analyst landing, and analyst list states (matches the spotter-ia.md spec)' },
      { type: 'added', group: 'Spotter DS', component: 'PromptSuggestionsPanel', description: 'New panel surfaced from the prompt bar. Hideable, mode-aware. Prompt bar position stays fixed when the suggestion panel opens' },
      { type: 'modified', group: 'Spotter prototype', component: '12 IA polish corrections', description: 'Analyst selection state, recency-sorted chats, chat naming, analyst reorder on chat start only, clear analyst highlights when View all opens, center analyst grid at 936px, move Spotter (Default) into its own panel section, drop the logo icon from the Default panel item and welcome page' },
      { type: 'modified', group: 'Liveboard template', component: 'SpotterViz side panel', description: 'Full rebuild to match the Figma side-panel overlay. position: fixed (not flex sibling), dark navy #1d232f, mascot + greeting + 3 suggestion chips + sticky prompt bar' },
      { type: 'added', group: 'Playground', component: 'Archive section + sidebar nav', description: 'Gallery has a light left sidebar with Prototypes (default) and Archived sections. Per-card 3-dot menu archives or restores any prototype in your session (sessionStorage-backed). Save-to-code modal generates a Claude-ready prompt to commit the layout permanently. MiniSpotters and AdminLang now appear as archived by default' },
      { type: 'added', group: 'Registry', component: 'ProjectMeta.section field', description: "New 'sample' | 'mine' | 'archived' field on ProjectMeta. Drives the new archive section in the gallery" },
      { type: 'modified', group: 'Liveboard template', component: 'KPI cards + LineChart legend', description: 'KPI cards shortened (default height 1 row), and the first two (Revenue, Customers) now show chart variants instead of bare numbers. LineChart legend overlap fixed' },
      { type: 'modified', group: 'Brand', component: 'Logo navigates back to playground', description: 'ThoughtSpot brand mark click in GlobalHeader, LiveboardHeader (PrimaryNav), EditToolbar, and the DataModelEditor title now all navigate back to / (the playground gallery)' },
      { type: 'modified', group: 'Tokens', component: 'background-base-inverse', description: 'Reverted from #323946 back to #1D232F to match the production Liveboard edit-toolbar background. The Phase 2 token change had unintentionally muted the dark header' },
      { type: 'modified', group: 'Content', component: 'Customer references scrubbed', description: 'Royal Enfield references swapped to Acme Apparel across prototypes' },
      { type: 'modified', group: 'TypeScript', component: '43 errors resolved', description: '38 were in NewUIAdmin2, 4 pre-existing across DS + ChangelogPage. 34 of the 38 were unused-var noise — switched to noUnusedLocals: false for the prototype layer' },
      { type: 'modified', group: 'Dependencies', component: 'package-lock.json registry URLs', description: '31 ThoughtSpot internal artifactory URLs (jfrog-colo.corp.thoughtspot.com) rewritten to the public npm registry so Vercel can install dependencies on the open repo' },
    ],
  },
  {
    version: '26.5.3d',
    date: '2026-05-19',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Radiant brand', component: 'BrandMark component', description: 'New @components/BrandMark — canonical Radiant 3.0 TS monogram (4-path geometric mark). Single source of truth. Props: pixelSize, color (defaults to currentColor), className, aria props. Replaces inline SVG copies that lived in GlobalHeader, LiveboardHeader, EditToolbar, and spotter/icons.tsx' },
      { type: 'modified', group: 'Radiant brand', component: 'TS logo refresh', description: 'GlobalHeader, LiveboardHeader (PrimaryNav), and EditToolbar all swapped from the older single-path wordmark to the new 4-path monogram via <BrandMark />. ThoughtSpotMark in @spotter/icons is now a deprecated alias for BrandMark' },
      { type: 'added', group: 'Spotter DS', component: 'SettingsMenu + PersonalMemoryToggle', description: '@spotter/page popover Settings menu opened from a Radiant Popover trigger. 6 items in 4 dividered groups: Spotter instructions (modal) · Usage monitoring + Admin settings (external) · Manage memory sources (external) + Personal memory (inline toggle) · Spotter best practices (modal)' },
      { type: 'added', group: 'Spotter DS', component: 'ChatRowMenu + AnalystRowMenu', description: 'Hover-triggered row menus built on Radiant ActionMenu. ChatRow: Rename / Favorite / Share / Delete. AnalystRow: Edit (privilege-gated) / Share / Make a copy / Delete. Shared RowMenuAffordance helper for the fade-on-hover kebab pattern' },
      { type: 'modified', group: 'Spotter DS', component: 'ReasoningBlock', description: 'Unified brand-blue header (current step while streaming, "Thought for X seconds" once settled). Flat layout — no card chrome around peek or expanded steps. Code-block-styled tool I/O (monospace, background-subtle, generous padding). Peek description fades out instead of unmounting instantly' },
      { type: 'modified', group: 'Spotter DS', component: 'SpotterShell width tokens', description: 'spotterLayout.chatMaxWidth (936) and textMaxWidth (844) now actually flow through ChatThread, SpotterPrompt, ChatCanvas, and SpotterWelcome via --spotter-chat-max-width / --spotter-text-max-width CSS vars injected at the shell root. Tokens were bumped in 26.5.3c but CSS still hardcoded the old 880/760' },
      { type: 'modified', group: 'Spotter DS', component: 'AgentMessage avatar centering', description: 'Avatar now centers vertically with the first body line via a -6px margin (compensates for the 32px avatar vs 20px text-line center offset)' },
      { type: 'modified', group: 'Spotter DS', component: 'SpotterPrompt mode toggle', description: 'ChartSearch at size="m" (16px), Orbits at size="l" (18px) per design spec' },
      { type: 'modified', group: 'Spotter DS', component: 'ChatCanvas single stream', description: 'Dropped border-top + opaque background + top padding from .promptArea — chat thread now flows into the sticky prompt as one continuous stream, no visible separator' },
      { type: 'modified', group: 'Spotter prototype', component: 'Left panel restructure', description: '"Custom spotters" → "Analysts" (matches IA — analyst = custom AI agent, separate from data model). Dropped the "Spotter (Default)" row. "View library" → "View all >". Settings button at the bottom opens SettingsMenu. Chat + analyst rows wrapped in hover menus. mockData.ts: customSpotters → analysts with canEdit flag' },
      { type: 'modified', group: 'Spotter runtime', component: 'Toolcall icons', description: 'cannedResponses now use semantic Radiant glyphs (database, ai, search) instead of the generic spotter sparkle — toolcall icons describe the tool type, not the vendor' },
      { type: 'modified', group: 'Documentation', component: 'spotter-roadmap.md', description: 'Stage B Phase 1 marked done with itemized completion list. Phase 2 (right-pane state machine + AnalystLandingPage + AnalystListPage + showcase previews) listed as pending with effort estimates' },
    ],
  },
  {
    version: '26.5.3c',
    date: '2026-05-19',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Spotter DS', component: 'Spotter DS showcase page', description: 'New /radiant/spotter page with 4 sections — Chat (UserBubble, AgentMessage, TypingIndicator, ReasoningBlock, SpotterPrompt, QuickAction, QuickActionRow), Blocks (Text, Viz, Sources, FollowUps, Refine, Error + AnswerCard placeholder), Icons (5 Spotter glyphs at XS-XL), Tokens (spotterGlow, spotterChartBg, spotterLayout swatches). Ghosted placeholders for all planned components' },
      { type: 'added', group: 'Spotter DS', component: 'SpotterShell doc page', description: 'New /radiant/components/spottershell — peer to GlobalHeader / AppShell doc pages. Breadcrumb + title + previews for SpotterShell, SpotterLeftSide (rail+panel internals merged), SpotterWelcome (default + custom greeting via tabs), SpotterLeftToggle. SpotterShell preview uses real GlobalHeader theme="light"' },
      { type: 'added', group: 'Spotter DS', component: 'Fullscreen previews', description: '/preview/spottershell and /preview/appshell render the shells at full viewport with no Radiant chrome. Linked from each doc page via "View fullscreen ↗"' },
      { type: 'added', group: 'Documentation', component: 'Spotter cursor rules', description: 'Four new rules — spotter-ia.md (standalone IA: left panel structure, right-pane states, Settings menu, hover menus, exact widths), spotter-agentic-chat-ia.md (embedded Code/Viz/Model), spotter-scaffolding.md, plus Planned-components section in spotter-components.md. Spotter Requirements Gate in _orchestration.md upgraded to Q&A by mode' },
      { type: 'added', group: 'Documentation', component: 'docs/spotter-roadmap.md', description: 'Resume-here tracker for all Spotter work — status per mode, active scope, planned components, open questions, linked docs' },
      { type: 'modified', group: 'Sidebar', component: 'Radiant nav', description: '"Spotter" renamed to "Spotter DS"; new "SpotterShell" entry under Widgets; "New" badges removed from LiveboardHeader / GlobalHeader / AppSidebar / AppShell' },
      { type: 'modified', group: 'Tokens', component: 'spotterLayout', description: 'chatMaxWidth 880 → 936 (matches 2026-05-19 IA spec). New textMaxWidth = 844 for text content inside the chat container' },
      { type: 'modified', group: 'Icons', component: 'VizBlock expand button', description: 'Now uses the diagonal expand glyph (matches Figma node 852:7344) instead of the horizontal fullscreen icon. Affects every viz answer rendered in Spotter responses' },
      { type: 'modified', group: 'Spotter logic', component: 'ReasoningBlock streaming', description: 'Three-state model documented — semi-collapsed during streaming (current step upfront, expand to see prior steps), expanded then auto-collapsing on done, settled "Thought for X seconds" trigger after 600ms' },
      { type: 'modified', group: 'Showcase styling', component: 'Visual conventions', description: 'Spotter doc pages aligned to ComponentDocPage spec — 1000px container, 36px Plain 700 title, 20px Plain 600 section title, 32px card padding, 12px radius. No own background — inherits the sunken layout bg like other Radiant pages' },
      { type: 'modified', group: 'Components', component: 'PreviewCard', description: 'Showcase wrapper gained useTabs (Radiant Tabs for multi-variant cards, matches GlobalHeader doc-page pattern) and fullSizeHref ("View fullscreen ↗" link) props' },
    ],
  },
  {
    version: '26.5.3b',
    date: '2026-05-18',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Tooling', component: '/sync-upstream', description: 'Rewrite — preview-first, feature-branch safe. Lands upstream on main before forwarding into your branch. Stash uses --include-untracked so new files are no longer lost. /check-upstream consolidated into /sync-upstream as phase one' },
      { type: 'modified', group: 'Infrastructure', component: 'middleware', description: 'Staging branch is publicly accessible; other preview branches stay gated' },
      { type: 'modified', group: 'Infrastructure', component: 'Vercel headers', description: 'X-Frame-Options SAMEORIGIN so same-origin iframes inside prototypes load correctly' },
      { type: 'modified', group: 'Maintainer workflow', component: 'Branch model', description: 'CLAUDE.md split: personal + personal/* are origin-only, galaxy-bound branches are main, staging, and shared feat/fix/chore. Pre-push hook enforces the rule' },
    ],
  },
  {
    version: '26.5.3a',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Sample prototypes', component: 'Gallery order', description: 'Spotter moved to the bottom of registry-core.ts so it appears first in the gallery (the gallery reverses array order to show newest-by-date first). Convention: append new sample prototypes to the end of the array' },
    ],
  },
  {
    version: '26.5.3',
    date: '2026-05-08',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Spotter prototype', component: 'Spotter prototype', description: 'Registered in registry-core.ts as a sample. In-thread agentic chat with welcome state, collapsible 64↔260 left panel, light-mode GlobalHeader, sticky prompt' },
      { type: 'added', group: 'Spotter DS', component: '@spotter/* — two-layer DS', description: 'Peer to @components/* — Spotter-domain blocks built on Radiant primitives. Subdomains: chat, page, answer, viz, runtime, plus tokens and icons' },
      { type: 'added', group: 'Spotter DS', component: 'Chat layer', description: 'SpotterChatProvider + useReducer + AbortController, async-iterable askSpotter() service (canned + live modes), 4 fixtures with rich reasoning' },
      { type: 'added', group: 'Spotter DS', component: 'Block renderers', description: 'TextBlock, VizBlock (real ECharts with line/bar/pie/table, iframe/data/placeholder slot, M4 fullscreen expand modal, canonical 5-action footer), SourcesBlock, FollowUpsBlock (clickable chips that call send), RefineBlock, ErrorBlock' },
      { type: 'added', group: 'Spotter DS', component: 'Page shell + chat layout', description: 'SpotterShell, SpotterLeftSide (smooth 64↔260 animation), SpotterRail/Item, SpotterPanel/Section/Item/Action, SpotterWelcome. ChatThread, MessageRow, UserBubble, AgentMessage with feedback row, TypingIndicator, ReasoningBlock with embedded ToolcallCard and "Worked for X seconds" footer' },
      { type: 'added', group: 'Spotter DS', component: 'Prompt + icons', description: 'SpotterPrompt with purple→blue gradient on :focus-within. Custom PanelToggle, ChartSearch, Orbits, Bell, ThoughtSpotMark glyphs (Radiant icons used for everything else)' },
      { type: 'added', group: 'Documentation', component: 'Spotter rules + plans', description: 'Three .cursor/rules files (spotter-components, spotter-logic, spotter-response-style) auto-attach on Spotter files. Spotter Requirements Gate in _orchestration.md. CLAUDE.md addendum. Four plan docs covering DS, prototype shell, answer card, chat extraction, plus VizBlock behaviour guide' },
      { type: 'synced', group: 'Design system', component: '147 icons + light GlobalHeader', description: 'Radiant 3.0 Figma icon sync — 96 new icons added, 51 existing icons updated, 1 retired (Refresh → Sync with refresh alias). Registry went from 53 → 148 unique icons (151 entries with 3 backward-compat aliases). Light-mode GlobalHeader theme used by the Spotter prototype' },
    ],
  },
  {
    version: '26.5.2e',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter prototype', component: 'Sentence-case fixes', description: '"Deal Accelerator" → "Deal accelerator", "Fall and Winter" → "fall and winter" — flagged by /radiant-check' },
      { type: 'added', group: 'Spotter DS', component: 'spotterLayout token', description: 'New spotterLayout.chatMaxWidth (880) constant in src/spotter/tokens.ts. Documented constant for shared use; CSS modules continue to use 880px until a global CSS-variable home is decided' },
    ],
  },
  {
    version: '26.5.2d',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter chat', component: 'VizBlock — real ECharts rendering', description: 'Replaced the custom SVG sketch with echarts-for-react using the existing chart palette (chartColors / chartUi / chartFont) from _shared/tiles. Supports line / bar / pie / table chartKinds with axis labels, gridlines, tooltips, value labels on bars, multi-series legend' },
      { type: 'modified', group: 'Spotter chat', component: 'VizBlock M4 expand modal', description: 'Modal portaled to document.body to escape the chat tree containing block; M4 full-width override (max-width: none) so it covers the viewport edge-to-edge; "Expand"/"Close" header + chart title + view toggle + tokens row + chart slot + "Showing X of X data points" footer matching the figma' },
      { type: 'modified', group: 'Spotter chat', component: 'Streaming keyframes containing block', description: 'blockIn / reasoningIn / stepIn / workedForIn keyframes now end with transform: none instead of translateY(0). Translate(0) is a non-none transform that creates a containing block, which trapped Modal position: fixed' },
    ],
  },
  {
    version: '26.5.2c',
    date: '2026-05-08',
    type: 'patch',
    changes: [
      { type: 'modified', group: 'Spotter chat', component: 'Streaming animation polish', description: 'Six smoothness fixes: step dot color transition (gray→brand→gray no longer snaps), block fade-up entry on viz / followups / sources, steps container collapse via max-height + opacity (no remount), toolcall body slide-open instead of pop, ReasoningBlock fades in only when reasoning starts (cleaner crossfade from TypingIndicator), "Worked for X seconds" fade-in with delay' },
      { type: 'modified', group: 'Spotter chat', component: 'ReasoningBlock mount behaviour', description: 'Steps + toolcall body now stay mounted, visibility flips via data attributes — re-open is instant, collapse animates smoothly' },
    ],
  },
  {
    version: '26.5.2b',
    date: '2026-05-07',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Spotter chat', component: 'Chat extraction end-to-end', description: 'SpotterChatProvider + useReducer + AbortController. ChatThread, MessageRow, UserBubble (single-row layout), AgentMessage with feedback row. TypingIndicator (spinner + "Analysing…"). ReasoningBlock with rich steps (descriptions + embedded ToolcallCard, brand-blue trigger when expanded, gray done dots, "Worked for X seconds")' },
      { type: 'added', group: 'Spotter chat', component: 'Streaming runtime', description: 'AnswerChunk protocol (reasoning_start/step/done, block_start/text_delta/block_done, message_done, error). askSpotter() async generator with canned + live modes. 4 fixtures (viz, text, refine, sources) with rich reasoning. Naive keyword router defaults to viz' },
      { type: 'added', group: 'Spotter chat', component: 'Block renderers', description: 'TextBlock, VizBlock (slot model: chartSlot > iframe > data > placeholder; canonical 5-action footer; chart/table toggle; expand modal), SourcesBlock, FollowUpsBlock (clickable chips that call send), RefineBlock (clickable options), ErrorBlock' },
      { type: 'modified', group: 'Spotter chat', component: 'SpotterPrompt', description: 'Purple→blue gradient border on :focus-within using token-based linear-gradient with background-clip trick' },
      { type: 'modified', group: 'Spotter prototype', component: 'Welcome ↔ chat transition', description: 'Prototype now wraps in SpotterChatProvider; renders SpotterWelcome when empty, ChatCanvas (sticky prompt + thread + disclaimer) when populated' },
      { type: 'modified', group: 'Spotter DS', component: 'Smooth panel animation', description: 'SpotterLeftSide owns a wrapper with cubic-bezier(0.32, 0.72, 0, 1) width transition for 64↔260 collapsed/expanded' },
      { type: 'modified', group: 'Spotter DS', component: 'PanelToggle icon, ChartSearch + Orbits glyphs', description: 'Custom SVGs in src/spotter/icons.tsx — panel toggle from Figma (8K7cAOPsv...), prompt mode toggles (RzKUZMdJsNVdoVhkYmXvlI / 1887:6197)' },
      { type: 'modified', group: 'Spotter DS', component: 'Panel section visuals', description: 'Full-width selected state on items, full-width line breaks between sections (per Figma 1887:3912)' },
      { type: 'added', group: 'Documentation', component: 'VizBlock behaviour doc + Spotter rules', description: 'docs/2026-05-07-spotter-viz-block-behaviour.md covers slot model and customization. Three .cursor/rules files (spotter-components, -logic, -response-style) auto-load when working on Spotter files. Spotter Requirements Gate added to _orchestration.md. CLAUDE.md addendum points to the four Spotter docs' },
    ],
  },
  {
    version: '26.5.2a',
    date: '2026-05-07',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Spotter DS', component: '@spotter/ peer to @components/', description: 'Two-layer DS scaffold: Spotter-domain building blocks layered on top of Radiant. New path alias @spotter/* in vite + tsconfig' },
      { type: 'added', group: 'Spotter DS', component: 'chat primitives', description: 'QuickAction, QuickActionRow, SpotterPrompt — controlled prompt with auto-resize, mode toggle, model picker, controls icon, blue submit' },
      { type: 'added', group: 'Spotter DS', component: 'page primitives', description: 'SpotterShell, SpotterLeftSide, SpotterRail/Item, SpotterPanel/Section/Item/Action, SpotterWelcome — full shell with smooth 64↔260 width animation between rail and panel modes' },
      { type: 'added', group: 'Spotter DS', component: 'spotter tokens', description: 'src/spotter/tokens.ts — radial brand glow + chart-token bg aliases over Radiant system colors' },
      { type: 'added', group: 'Spotter DS', component: 'spotter icons', description: 'src/spotter/icons.tsx — PanelToggle, Bell, ThoughtSpotMark (brand), ChartSearch and Orbits (prompt mode toggle) — only glyphs missing from Radiant registry' },
      { type: 'added', group: 'Prototypes', component: 'Spotter prototype', description: 'First Spotter DS consumer: light-mode GlobalHeader, collapsible left nav, welcome canvas with greeting + prompt + 3 quick actions; mock chats and custom Spotters in left panel' },
      { type: 'added', group: 'Documentation', component: 'Spotter DS plan set', description: 'Four plan docs under docs/: parent two-layer DS plan, prototype shell plan, AnswerCard spec, chat extraction spec' },
    ],
  },
  {
    version: '26.5.2',
    date: '2026-05-07',
    type: 'patch',
    changes: [
      { type: 'added', group: 'Documentation', component: 'Muze charts setup guide', description: 'docs/muze-charts-setup.md — opt-in walkthrough for adding Muze (private packagecloud library) to a prototype: auth, install, component scaffolding, chart-shape cheatsheet, and resize-aware mounting' },
      { type: 'modified', group: 'Design system', component: 'LiveboardHeader', description: 'Refactor: unify dark surfaces and tokenize raw hex values' },
      { type: 'modified', group: 'Design system', component: 'Radiant pages text contrast', description: 'Bump content-tertiary to content-secondary for readability' },
      { type: 'removed', group: 'Pages', component: '5 unrouted page components', description: 'Delete ComponentStatusPage, DataDashboardDemo, GuidelinesPage, SettingsPanelDemo, SpotterDashboard — never wired into App.tsx routes (~2,400 lines)' },
      { type: 'modified', group: 'Design system', component: 'components/index.ts', description: 'Remove duplicate exports of LoadingIndicator, Popover, Select' },
    ],
  },
  {
    version: '26.5.1',
    date: '2026-05-05',
    type: 'patch',
    changes: [
      { type: 'removed', group: 'Prototypes', component: 'SalesDashboard prototype', description: 'Liveboard sample prototype removed from the registry — reference patterns continue to live in _liveboard-template' },
      { type: 'removed', group: 'Prototypes', component: 'SpotterModel prototype', description: 'Standalone agent edit-flow prototype removed — its patterns are now covered by DataModelEditor + the shared _agentic module' },
      { type: 'removed', group: 'Prototypes', component: 'StylingPanel merge reverted', description: 'PR #14 (StylingPanel + shared tile density/override system) reverted on staging due to integration issues; will be re-introduced in a follow-up PR' },
    ],
  },
  {
    version: '26.5.0',
    date: '2026-04-30',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Data Model Editor', component: 'DataModelEditor prototype', description: 'New canvas-based prototype: draggable table cards, column tree, join connectors, retail schema preset, and a unified config gate via window.__DME_CONFIG__' },
      { type: 'added', group: 'Data Model Editor', component: 'Welcome variants', description: 'Two starting states: blank canvas with creation welcome, or pre-populated retail schema with "Check for AI readiness" CTA' },
      { type: 'added', group: 'SpotterModel', component: 'AI agent panel', description: 'Right-side AI chat panel with table, join, column, and formula suggestions; reasoning blocks; confidence badges; and version-history restore' },
      { type: 'added', group: 'SpotterModel', component: '/api/chat proxy', description: 'Anthropic proxy as a Vercel serverless function and a Vite dev middleware so the panel works in both environments' },
      { type: 'added', group: 'SpotterModel', component: '/switch-model command', description: 'Switch the Claude model used by AI-capable prototypes between Haiku (cheap/fast), Sonnet (balanced), and Opus (most capable)' },
      { type: 'added', group: 'Shared modules', component: '_agentic module', description: '11 components shared across AI-enabled prototypes: AgentPanel, SuggestionCard, ReasoningBlock, ConfidenceBadge, JoinDiagram, NextActionChips, ToolcallCard, TypingIndicator, UserBubble, VersionCard, AgentResponseBlock' },
      { type: 'added', group: 'Shared modules', component: '_datamodel module', description: '4 canvas-layer components: TableCanvas, ColumnTree, JoinConnector, TableCard — reusable for any data-model surface' },
      { type: 'modified', group: 'Design system', component: 'OverlayLoading', description: 'New variant + label props (backwards-compatible — existing usages continue to render the spinner)' },
      { type: 'added', group: 'AI orchestrator', component: 'DME rule files', description: 'Three new rule files (data-model-editor-ia, -components, -interactions) and a Tier 2 DME Requirements Gate that asks welcomeVariant, SpotterModel, and dataset before loading' },
      { type: 'modified', group: 'AI orchestrator', component: 'DME concern row split', description: 'Single Tier 1 DME row split into IA / components / interactions plus an "AI agent panel (any prototype)" fallback row for non-DME adopters' },
      { type: 'modified', group: 'Infrastructure', component: 'ANTHROPIC_API_KEY in dev', description: 'Fixed: vite middleware now reads the key via loadEnv — previously process.env was empty and the AI panel errored on dev' },
    ],
  },
  {
    version: '26.4.4c',
    date: '2026-04-28',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Project status dashboard', component: '/project-status command', description: 'Renamed from /status-page; generates a local HTML dashboard with overview, branches, forks/upstream, and docs/plans tabs at zero LLM token cost' },
      { type: 'added', group: 'Project status dashboard', component: 'Worktree view', description: 'Each checkout shown with branch, modified count, divergence vs main, and locked/prunable badges' },
      { type: 'added', group: 'Project status dashboard', component: 'Branch divergence', description: 'Three columns vs main, staging, and upstream/main with last commit subject + relative age' },
      { type: 'added', group: 'Project status dashboard', component: 'Role-aware tabs', description: 'Maintainers see the full Forks tab; designer forks see an Upstream sync tab with behind/ahead vs upstream' },
      { type: 'added', group: 'Project status dashboard', component: 'Inline markdown viewer', description: 'Click any .md row to open its rendered content in an in-page modal (marked with raw fallback)' },
      { type: 'added', group: 'Project status dashboard', component: 'Local-only badges', description: 'Gitignored files (BACKLOG.md, plans/, articles/) get a blue local chip' },
      { type: 'modified', group: 'Project status dashboard', component: 'Forks sort order', description: 'Most recently pushed forks first instead of alphabetical' },
      { type: 'added', group: 'Changelog highlights', component: 'Highlights section', description: 'Curated section at the top of the Changelog page cherry-picks major work across recent releases' },
      { type: 'added', group: 'Changelog highlights', component: 'Visibility window', description: 'Highlights show items from the last 60 days OR the last 6 items, whichever is longer' },
      { type: 'added', group: 'Changelog highlights', component: 'release.sh prompt', description: 'release.sh asks the maintainer for highlights interactively during release and pre-inserts them in the printed ChangelogPage draft' },
      { type: 'added', group: 'AI orchestrator', component: 'MCP plugin overhead check', description: 'New Step 0c flags Figma MCP ~4k tokens-per-message cost once per session if no Figma signal is detected' },
      { type: 'modified', group: 'Security', component: 'postcss', description: 'Bumped 8.5.6 to 8.5.10 in lockfile to patch XSS via unescaped style tag (GHSA-qx2v-qp2m-jg93)' },
      { type: 'added', group: 'Documentation', component: 'Workflow explorations', description: '3-slide ASCII workflow deck and revised AI workflow diagram salvaged from local experiments' },
    ],
  },
  {
    version: '26.4.4b',
    date: '2026-04-28',
    type: 'minor',
    changes: [
      { type: 'added', group: 'Phase 1 — Primitive colors', component: 'darkGray Scale', description: '12 stops added to referenceColors — neutral foundation for Phase 6 dark mode remap' },
      { type: 'added', group: 'Phase 1 — Primitive colors', component: 'Alpha Variants', description: 'gray-70a/60a/40a/10a, blue-10a, dark-gray-30a for overlays and translucent highlights' },
      { type: 'modified', group: 'Phase 1 — Primitive colors', component: 'Hex Fixes', description: 'purple/70 #6847BA→#6A4ABA, purple/100 #0D0030→#0E0033, teal/70 #359FAA→#369FAA' },
      { type: 'modified', group: 'Phase 2 — Light semantic colors', component: '6 Value Fixes', description: 'content-tertiary, border-focus, border-hover, background-overlay, background-ghost-highlight, background-base-inverse' },
      { type: 'added', group: 'Phase 2 — Light semantic colors', component: '22 Accent Tokens', description: '9 background-accent-*, 6 content-accent-*, 7 border-* (subtle-hover + 6 accents)' },
      { type: 'modified', group: 'Phase 3 — Typography', component: 'Letter Spacing', description: 'tight -0.01em → -0.4px (Figma absolute), new tighter -0.6px' },
      { type: 'modified', group: 'Phase 3 — Typography', component: 'Heading Weights', description: '6 v2TextStyles entries medium → semibold (headlineLarge, pageTitle, modalTitle, sectionLabel, contentLabel, contentLabelSubhead)' },
      { type: 'modified', group: 'Phase 3 — Typography', component: 'Body Weight', description: 'textStyles.body.large/normal light (375) → regular (400)' },
      { type: 'added', group: 'Phase 4 — Elevation', component: 'shadowPrimitives', description: '3 semantic levels (surface/menu/modal) with light + dark variants matching Figma' },
      { type: 'added', group: 'Phase 4 — Elevation', component: 'CSS Shadow Variables', description: '--shadow-surface, --shadow-menu, --shadow-modal added to :root and [data-theme="dark"]' },
      { type: 'modified', group: 'Phase 4 — Elevation', component: 'Component Migration', description: 'Modal, Tooltip, Popover, Card, Menu, DatePicker, FilterModal, InputMentions, AppSidebar overlay now use semantic shadow vars' },
      { type: 'modified', group: 'Phase 5 — Layout', component: 'Sidebar Width', description: 'AppSidebar/AppShell default 261px → 260px (Figma alignment)' },
    ],
  },
  {
    version: '26.4.4a',
    date: '2026-04-27',
    type: 'minor',
    changes: [
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Modal Header', description: 'Padding restored to 20px 24px (variable height) so wizard variants grow correctly for eyebrow + title' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Modal Footer', description: 'Fixed at 72px with 0 24px padding; tertiary-left / primary-right CTA placement bug fixed (was double-wrapped)' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Wizard Stepper', description: 'Rebuilt as discrete 4px segments with 6px gap and 2px radii; also renders for splashscreen type' },
      { type: 'removed', group: 'Modal alignment with Figma', component: 'Close Icon', description: 'X icon removed from M1/M2/M3 simple modals — only M4 keeps the "Close" text link, per Figma' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Splash Screen', description: 'Header no longer renders (title lives in body via ModalSplashContent)' },
      { type: 'modified', group: 'Modal alignment with Figma', component: 'Overlay z-index', description: 'Bumped to 1000 so M4 covers the sidebar' },
      { type: 'added', group: 'Surfaces showcase', component: 'Eyebrow Variant', description: 'New M2 eyebrow-only modal demo (no stepper)' },
      { type: 'added', group: 'Surfaces showcase', component: 'Splash Screen Multi', description: 'New 3-step onboarding splash flow with stepper' },
      { type: 'modified', group: 'Surfaces showcase', component: 'Wizard Footer', description: 'Back kept rendered (disabled on step 1) + primary button minWidth: spacing.I*2 for position consistency' },
      { type: 'modified', group: 'Surfaces showcase', component: 'Button Demo Tokens', description: 'Secondary uses content-primary, primary uses content-alternate' },
      { type: 'added', group: 'Platform tooling', component: 'LastUpdated', description: 'Shared component reads lastModified from componentRegistry; added to Surfaces, Icons, Architecture, ComponentDocPage' },
      { type: 'modified', group: 'Platform tooling', component: 'Modal Registry Entry', description: 'Refreshed with current Figma node ID and 2026-04-27 sync date' },
    ],
  },
  {
    version: '26.4.1c',
    date: '2026-04-08',
    type: 'major',
    changes: [
      { type: 'added', group: 'Fork architecture', component: 'Registry Split', description: 'registry-core.ts (upstream) + registry-mine.ts (designer) + thin merger — eliminates merge conflicts for all designer forks' },
      { type: 'modified', group: 'Fork architecture', component: 'Fork Workflow', description: 'sync-upstream, check-upstream, new-prototype, prototype-structure, FORK-WORKFLOW updated for 3-file registry' },
      { type: 'added', group: 'AI orchestrator', component: 'Orchestrator Tier System', description: 'Intent-based classification (Tier 0–3) with concern-matching — 81% context reduction' },
      { type: 'added', group: 'AI orchestrator', component: 'Pre-Implementation Gate', description: '4 checks before code: component exists, CSS anti-patterns, icon name, forbidden words' },
      { type: 'added', group: 'AI orchestrator', component: 'Iteration Loop Detection', description: 'Suggests batching after 3+ sequential single-property changes' },
      { type: 'added', group: 'AI orchestrator', component: 'Claude Code Skills', description: '6 auto-activating skills with globs (component-inventory, content-guidelines, token-usage, layout-patterns, widget-patterns, modal-patterns)' },
      { type: 'added', group: 'Liveboard system', component: 'Canvas 3-Tier Split', description: 'liveboard-canvas.md (568 lines) → core (242), edit (238), advanced (100) with prerequisite chains' },
      { type: 'added', group: 'Liveboard system', component: 'Liveboard Requirements Gate', description: '4-question pre-build gate (mode, interactions, tile types, data)' },
      { type: 'added', group: 'Liveboard system', component: 'Shared Tiles', description: '_shared/tiles/ with AnswerTile, ChartRenderer, and 12 chart types' },
      { type: 'added', group: 'Liveboard system', component: 'SalesDashboard', description: 'Liveboard prototype with view/edit modes and SpotterViz panel' },
      { type: 'added', group: 'Platform tooling', component: 'Deployment Password Gate', description: 'Edge middleware password-gates Vercel deployments — opt-in per designer via SITE_PASSWORD env var in their Vercel dashboard' },
      { type: 'added', group: 'Platform tooling', component: 'Platform Version', description: 'platformVersion.ts as single source of truth — version badge on homepage, playground, and DS sidebar' },
      { type: 'added', group: 'Platform tooling', component: 'Component Source Badge', description: 'Figma / Scaligent / Custom badge on every component doc page' },
      { type: 'added', group: 'Platform tooling', component: 'Release Tooling', description: 'scripts/release.sh, pre-push hook, install-maintainer-hooks.sh' },
      { type: 'modified', group: 'UI and performance', component: 'Homepage', description: 'Space blue title, subtle card icons, shortened descriptions, footer easter egg' },
      { type: 'modified', group: 'UI and performance', component: 'ECharts Bundle', description: 'Lazy-loaded via React.lazy — 1.18 MB chunk deferred until first chart render' },
      { type: 'modified', group: 'UI and performance', component: 'CLAUDE.md', description: 'Trimmed 36% (210 → 135 lines) — guidelines moved to on-demand skills' },
      { type: 'modified', group: 'UI and performance', component: 'Documentation', description: 'README, SETUP-GUIDE, Onepager, prototyping-guide refreshed with current counts' },
      { type: 'modified', group: 'Bug fixes and security', component: 'TypeScript', description: 'All 6 errors resolved — icon name, TileMode import, NoteTileProps, unused variables' },
      { type: 'modified', group: 'Bug fixes and security', component: 'Avatar', description: 'Light background tokens swapped for saturated content tokens (contrast fix)' },
      { type: 'modified', group: 'Bug fixes and security', component: 'Vite', description: '7.3.2 — high severity vulnerability patched' },
      { type: 'modified', group: 'Bug fixes and security', component: 'ConfirmDialog', description: 'Non-Radiant gradient override removed' },
      { type: 'removed', group: 'Cleanup', component: 'Cmdk Prototype', description: 'Gitignored (11 MB Figma Make export) — reduces designer fork size' },
      { type: 'removed', group: 'Cleanup', component: 'Orphaned Prototypes', description: 'Deleted Homepage_example, ImpersonationV2, Liveboard, ModalPatterns' },
      { type: 'removed', group: 'Cleanup', component: 'liveboard-canvas.md', description: 'Replaced by 3-tier canvas files (core + edit + advanced)' },
    ],
  },
  {
    version: '26.3.3a',
    date: '2026-03-17',
    type: 'major',
    changes: [
      { type: 'added', component: 'Liveboard Template', description: 'Starter template with AnswerTile, KPI, bar chart, SpotterViz' },
      { type: 'added', component: 'AdminLang', description: 'Admin CSV-based translation settings prototype' },
      { type: 'added', component: 'MiniSpotters', description: 'Domain-specific Spotter instances with bounded context' },
      { type: 'added', component: 'Liveboard Scaffolding', description: 'liveboard-ia.md and liveboard-scaffolding.md rules' },
      { type: 'added', component: 'Workflow Skills', description: '/start, /ship, /release, /status, /sync-upstream commands' },
      { type: 'modified', component: 'Project Name', description: 'Renamed figmaradiant → radiantplay across all config and UI' },
      { type: 'modified', component: 'Playground Gallery', description: 'Redesigned with component counts and metadata cards' },
      { type: 'removed', component: 'Liveboard Prototype', description: 'Removed from gallery (replaced by template system)' },
      { type: 'removed', component: 'Admin Impersonation', description: 'Removed from registry' },
    ],
  },
  {
    version: '26.2.5a',
    date: '2026-03-05',
    type: 'minor',
    changes: [
      { type: 'added', component: 'UX Writing Guidelines', description: 'Spotter Writer rules integrated into Cursor agent (PR #1 by Yash Chauhan)' },
      { type: 'added', component: 'How It Works Page', description: 'Converted to slide-based format with tab navigation' },
      { type: 'added', component: 'Cursor Model Guide', description: 'Model selection guidance for designers' },
      { type: 'modified', component: 'Homepage', description: 'Redesigned with getting started guide' },
    ],
  },
  {
    version: '26.2.4a',
    date: '2026-03-02',
    type: 'minor',
    changes: [
      { type: 'added', component: '35 New Components', description: 'Horizontal, Vertical, View, Grid, SplitPane, NoData, ExplainerCard, Image, Illustration, Legend, SafeHTML, and 24 more' },
      { type: 'modified', component: 'Component Count', description: 'Updated from 38 → 73 in registry and all UI displays' },
      { type: 'modified', component: 'component-inventory.md', description: '6 new decision-tree sections, 4 new combination patterns' },
      { type: 'modified', component: 'widget-patterns.md', description: 'ActionMenu, DragDrop, Tree, and Tour patterns appended' },
    ],
  },
  {
    version: '26.2.2a',
    date: '2026-02-18',
    type: 'major',
    changes: [
      { type: 'added', component: 'Reference Tokens', description: '9 tonal scales (brand, gray, blue, green, red, yellow, orange, purple, teal) × 12 stops' },
      { type: 'added', component: 'System Tokens', description: '42 semantic tokens (background, content, border) with light/dark mode support' },
      { type: 'added', component: 'Component Tokens', description: '46 per-component tokens (button, chip, toggle) with light/dark mode' },
      { type: 'added', component: 'CSS Custom Properties', description: 'rd-sys-color-* and rd-comp-color-* variables in tokens.css' },
      { type: 'added', component: 'Dark Mode', description: 'Built-in light/dark mode via data-theme attribute' },
      { type: 'modified', component: 'All Components', description: 'Migrated 36 CSS modules and 48 TS files to new 3-layer token system' },
      { type: 'modified', component: 'Color System Page', description: 'Added System Tokens preview with 42 semantic tokens' },
      { type: 'modified', component: 'Architecture Page', description: 'Rewritten with Reference → System → Component documentation' },
      { type: 'removed', component: 'brand.ts / alias.ts / mapped.ts', description: 'Replaced by reference.ts, system.ts, and component.ts' },
    ],
  },
  {
    version: '26.2.1b',
    date: '2026-02-03',
    type: 'patch',
    changes: [
      { type: 'modified', component: 'Typography Page', description: 'Fixed page crash by removing invalid body-small variant' },
      { type: 'modified', component: 'Typography Page', description: 'Consolidated Typography documentation to /radiant/typography path' },
      { type: 'modified', component: 'App Routes', description: 'Added redirect from /radiant/components/typography to /radiant/typography' },
    ],
  },
  {
    version: '26.2.1a',
    date: '2026-02-03',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Surfaces Showcase', description: 'New Surfaces section showcasing Modal patterns (M1-M4) with interactive examples' },
      { type: 'added', component: 'ModalFooter', description: 'Reusable footer component with tertiary, secondary, and primary action slots' },
      { type: 'added', component: 'ModalHeader', description: 'Reusable header component with title, eyebrow, and close button' },
      { type: 'added', component: 'ModalWizardProgress', description: 'Progress bar component for wizard-type modals (2-4 steps)' },
      { type: 'added', component: 'ModalNavPanel', description: 'Left navigation panel for sub-navigation type modals' },
      { type: 'added', component: 'ModalSplashContent', description: 'Content component for splash screen modals' },
      { type: 'modified', component: 'Modal', description: 'Fixed spacing to match Figma specs (20px/24px padding), right-aligned CTAs in footer' },
      { type: 'modified', component: 'Modal.module.css', description: 'Added margin-left: auto to primaryActions for proper right alignment' },
      { type: 'removed', component: 'ModalPatterns', description: 'Removed from playground gallery (now available in Surfaces showcase)' },
    ],
  },
  {
    version: '26.1.4c',
    date: '2026-01-30',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Toast', description: 'Temporary notification component with auto-dismiss' },
      { type: 'added', component: 'TextArea', description: 'Multi-line text input with character counter' },
      { type: 'added', component: 'SegmentedControl', description: 'Mutually exclusive segment options (text/icon variants)' },
      { type: 'added', component: 'LoadingIndicator.Skeleton', description: 'Shimmer/skeleton loading placeholder variant' },
      { type: 'added', component: 'AvatarGroup', description: 'Stacked avatars with +N overflow indicator' },
      { type: 'added', component: 'TableCellRenderers', description: 'Helper utilities for Avatar, Chip, Status table cells' },
      { type: 'added', component: 'VersionHistoryPage', description: 'Full changelog page replacing popup panel' },
      { type: 'modified', component: 'DatePicker', description: 'Added Month and Year picker view modes' },
      { type: 'modified', component: 'Sidebar', description: 'Changed version footer to link to changelog page' },
    ],
  },
  {
    version: '26.1.4b',
    date: '2026-01-30',
    type: 'minor',
    changes: [
      // Phase 2: Core Components
      { type: 'added', component: 'LoadingIndicator', description: 'Contextual and global loading spinners' },
      { type: 'added', component: 'Avatar', description: 'User avatars with initials fallback and badges' },
      { type: 'added', component: 'Card', description: 'Content container with header, body, and footer' },
      { type: 'added', component: 'Typography', description: 'V2 typography system with 20+ variants' },
      { type: 'added', component: 'Divider', description: 'Horizontal and vertical line separators' },
      { type: 'added', component: 'Link', description: 'Styled anchor element for navigation' },
      // Phase 3: Interactive Components
      { type: 'added', component: 'Accordion', description: 'Collapsible content sections' },
      { type: 'added', component: 'Menu', description: 'Dropdown menu with items, groups, and dividers' },
      { type: 'added', component: 'Pagination', description: 'Page navigation with numbers, dots, and range' },
      { type: 'added', component: 'ProgressBar', description: 'Determinate and indeterminate progress indicator' },
      { type: 'added', component: 'Stepper', description: 'Multi-step process indicator' },
      // Phase 4: Advanced Components
      { type: 'added', component: 'DatePicker', description: 'Date selection input with calendar dropdown' },
      { type: 'added', component: 'IconGallery', description: 'Searchable gallery of available icons' },
      // Token Enhancements
      { type: 'modified', component: 'Tokens', description: 'Added complete color scales and V2 typography tokens' },
    ],
  },
  {
    version: '26.1.4a',
    date: '2026-01-30',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Popover', description: 'New interactive overlay component' },
      { type: 'added', component: 'Tooltip', description: 'Lightweight tooltip component' },
      { type: 'added', component: 'Table', description: 'Data table with sorting and selection' },
    ],
  },
  {
    version: '26.1.3c',
    date: '2026-01-28',
    type: 'figma-sync',
    changes: [
      { type: 'synced', component: 'Button', description: 'Updated hover states from Figma' },
      { type: 'synced', component: 'Chip', description: 'Synced color tokens from Figma' },
    ],
  },
  {
    version: '26.1.3b',
    date: '2026-01-25',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Select', description: 'Dropdown select component with search' },
      { type: 'modified', component: 'TextInput', description: 'Added password visibility toggle' },
      { type: 'modified', component: 'Modal', description: 'Improved animation transitions' },
    ],
  },
  {
    version: '26.1.3a',
    date: '2026-01-20',
    type: 'minor',
    changes: [
      { type: 'added', component: 'Modal', description: 'Dialog modal component' },
      { type: 'added', component: 'Tabs', description: 'Tab navigation component' },
      { type: 'added', component: 'Alert', description: 'Status alert banners' },
    ],
  },
  {
    version: '26.1.2b',
    date: '2026-01-15',
    type: 'patch',
    changes: [
      { type: 'modified', component: 'Button', description: 'Fixed disabled state opacity' },
      { type: 'modified', component: 'Checkbox', description: 'Improved focus ring styling' },
    ],
  },
  {
    version: '26.1.2a',
    date: '2026-01-10',
    type: 'major',
    changes: [
      { type: 'added', component: 'Button', description: 'Initial button component with 3 variants' },
      { type: 'added', component: 'Checkbox', description: 'Checkbox with indeterminate state' },
      { type: 'added', component: 'Radio', description: 'Radio button group component' },
      { type: 'added', component: 'Toggle', description: 'Toggle switch component' },
      { type: 'added', component: 'TextInput', description: 'Text input with labels and validation' },
      { type: 'added', component: 'SearchInput', description: 'Search input with clear button' },
      { type: 'added', component: 'Chip', description: 'Chip component for tags and filters' },
    ],
  },
];

/**
 * Get the current version (latest entry)
 */
export const getCurrentVersion = (): string => {
  return PLATFORM_VERSION;
};

/**
 * Get recent version entries
 */
export const getRecentVersions = (count: number = 5): VersionEntry[] => {
  return versionHistory.slice(0, count);
};

/**
 * Get change type icon
 */
export const getChangeTypeIcon = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return '+';
    case 'modified':
      return '~';
    case 'removed':
      return '-';
    case 'synced':
      return '↻';
    default:
      return '•';
  }
};

/**
 * Get change type color
 */
export const getChangeTypeColor = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return 'var(--rd-sys-color-content-success, #06BF7F)';
    case 'modified':
      return 'var(--rd-sys-color-content-brand, #2770EF)';
    case 'removed':
      return 'var(--rd-sys-color-content-failure, #E22B3D)';
    case 'synced':
      return 'var(--rd-sys-color-content-accent-purple, #8C62F5)';
    default:
      return 'var(--rd-sys-color-content-secondary, #777E8B)';
  }
};

/**
 * Get version type label
 */
export const getVersionTypeLabel = (type: VersionType): string => {
  switch (type) {
    case 'major':
      return 'Major Release';
    case 'minor':
      return 'Minor Release';
    case 'patch':
      return 'Patch';
    case 'figma-sync':
      return 'Figma Sync';
    default:
      return 'Update';
  }
};
