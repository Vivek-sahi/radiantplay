---
name: content-guidelines
description: UX writing rules for buttons, titles, labels, errors, alerts, and approved action words. Load when writing or reviewing any user-facing text in prototypes.
globs:
  - "src/prototypes/**/*.tsx"
---

# ThoughtSpot UX Writing Rules

Apply these rules as **hard constraints** to ALL user-facing text in UI components, prototypes, and mock data.

**Full ruleset (79 rules):** [docs/ux-writing-rules.md](docs/ux-writing-rules.md)
**Detailed reference:** [docs/content-guidelines-detailed.md](docs/content-guidelines-detailed.md)

---

## Rule Application Process

Before generating ANY user-facing string, follow this sequence:

1. **Identify the element type** — button, title, label, alert, toast, tooltip, error, descriptive text, input field, explain card, splash modal, or spotlight
2. **Apply the matching constraints** from the table below
3. **Apply brand voice rules** — approachable, not casual; clear over clever
4. **Apply terminology rules** — exact capitalization of ThoughtSpot features
5. **Validate** — check character limits, word counts, casing, punctuation, and approved word list

---

## Hard Constraints by Element Type

### Titles

| Constraint | Rule |
|---|---|
| **Max length** | 4 words |
| **Casing** | Sentence case |
| **Punctuation** | No closing punctuation |
| **Modal/dialog titles** | Must start with an imperative verb that matches the primary button exactly |
| **Page titles** | Do not need to start with a verb |
| **Verb source** | Approved action words only |

### Buttons

| Constraint | Rule |
|---|---|
| **Max length** | 1-2 words |
| **Format** | Imperative verb, or imperative verb + noun |
| **Verb source** | Approved action words only — no exceptions |
| **Passive words** | Forbidden unless simply closing a modal |

### Labels

| Constraint | Rule |
|---|---|
| **Max length** | 3 words |
| **Casing** | Sentence case |
| **Punctuation** | No closing punctuation |
| **Articles** | Never use "the", "a", or "an" |

### Errors

| Constraint | Rule |
|---|---|
| **Input field errors** | 3-5 words, remedy-focused, blame-free |
| **Can start with** | Imperative verb (Add, enter, choose) |
| **If overwrites label** | Must reference the field name |
| **If overwrites helper text** | Must reference field name AND helper text content |
| **Checkbox/required controls** | 2-5 words, clear remedy |

### Alerts

| Type | Constraint |
|---|---|
| **System alerts** | 1-2 short phrases + remedy as action. CTA button uses same verb as remedy. |
| **Sectional alerts** | 1-2 short phrases with punctuation + remedy + optional CTA |
| **Toast alerts** | 4-6 words. May use congratulatory language (Success, Nice). |
| **Alert dialogs** | Primary button repeats title's imperative verb. Secondary button is almost always Cancel. |
| **Muted alerts / empty states** | 2-4 word title + short clarifying phrase. Conversational tone. Must include primary CTA. |

### Descriptive Text

| Constraint | Rule |
|---|---|
| **Max line length** | 40 characters |
| **Max lines** | 4 lines (hard break if longer) |
| **Structure** | Action before outcome — start with imperative verbs |
| **Voice** | Active voice, user is the actor. No "-ing" verbs. |
| **Forbidden** | Permissive language ("You can..."), verb+noun phrases when a single verb works |

### Input Fields

| Constraint | Rule |
|---|---|
| **Placeholder text** | NEVER use placeholder/ghost text inside empty fields |
| **Helper text** | Include examples of correct input. Separate multiple examples with commas. No multi-step instructions. |

### Tooltips

| Constraint | Rule |
|---|---|
| **Max length** | 1-2 words |
| **Content** | Describe what the element IS, no verbs |
| **Forbidden** | Calls to action. Only for icon labels or truncated text. |

### Explain Cards

| Constraint | Rule |
|---|---|
| **Title** | 2-4 words, adds context (not just the term) |
| **Body** | Follows descriptive text rules |

### Splash Modals

| Constraint | Rule |
|---|---|
| **Title** | 2-4 words, first messaging shown |
| **Body** | 1-2 lines of descriptive text |
| **Pattern** | Repeatable text like "What is new" |
| **Dismiss** | Must include a dismiss button |

### Spotlights

| Constraint | Rule |
|---|---|
| **Max line length** | 40 characters |
| **Max lines** | 4 lines (separate into blocks if longer) |

---

## Approved Action Words — Semantic Lookup

These words are NOT interchangeable. Each has a precise meaning.

| Action | When to use | Example |
|---|---|---|
| **Create** | Making a NEW object that did not previously exist | Create Liveboard |
| **Add** | Putting an EXISTING item into a container | Add filter |
| **Delete** | Erasing something FOREVER from the system | Delete Answer |
| **Remove** | Taking something away; it still exists and can be restored | Remove from Liveboard |
| **Discard** | Abandoning unsaved changes | Discard changes |

### Full Approved Word List by Category

| Category | Approved words |
|---|---|
| **Navigation** | Back, Cancel, Close, Continue, Done, Find, Next, Open, Redo, Undo |
| **Editing** | Confirm, Copy, Delete, Discard, Edit, Redo, Remove, Reset |
| **Viewing** | Close, Collapse, Compare, Customize, Drill down, Expand, Explore, Favorite, Filter, Hide |
| **System** | Analyze, Authenticate, Connect, Enter, Join, Reload, Request, Retry, Schedule, Search, Sign in/out, Start, Subscribe |
| **Other** | Download, Export, Import, Install, Run, Save, Send, Share, Submit, Transfer, Upload, Verify |

### Forbidden Words

Do NOT use these — use the approved alternative:

| Forbidden | Use instead |
|---|---|
| Check | Select or Verify |
| Submit | Save or Send |
| Modify | Edit or Customize |
| Refresh | Reload |
| Proceed | (use direct action verb) |
| Yes / OK | (use specific action verb) |

---

## Brand Voice

The ThoughtSpot voice is the intersection of four attributes:

| Attribute | Means | Does NOT mean |
|---|---|---|
| **Approachable** | Genuine, humble, friendly, plain language | Overly casual |
| **Pioneering** | Visionary, innovative, trailblazing | Risky or intimidating |
| **Smart** | Insightful, trusted, sharp | Pushy or arrogant |
| **Provocative** | Thought-provoking, compelling, challenging | Overbearing or contentious |

### Tone Adaptation

- **Errors / bad news** — More practical, direct, blame-free
- **Success / empty states** — Can be quirkier, playful, encouraging
- **Default** — Always err on clarity and simplicity over cleverness

### Voice Rules

- Use **active voice** in most cases
- Use **passive voice** only to soften negative messages (e.g., "Account disabled" vs "We disabled your account")
- Use **contractions** (don't, can't, we'll) for conversational tone
- Use **present tense** to describe results ("Object added" not "Object has been added")

---

## Terminology — Exact Capitalization

Always capitalize these ThoughtSpot features:

| Term | Notes |
|---|---|
| **Answer** | Saved query result |
| **Connection** | External data source link |
| **Data Model** | Curated data model |
| **Explore mode** | Note: lowercase "mode" |
| **Group** | User group |
| **Liveboard** | Never "Pinboard" |
| **Monitor** | Scheduled alert |
| **SpotApp** | Analytics app template |
| **SpotIQ** | AI insights feature |
| **Highlights** | |
| **AskSage** | |

Standard/generic feature names are always **lowercase** (e.g., "search bar", "tab", "button").

### Trademarks

- Pre-grant: name appears with superscripted ™
- Post-grant: replace with ®

---

## Numbers & Formatting

| Type | Format | Example |
|---|---|---|
| Numbers | Always digits | **3 items** not **three items** |
| Time | 12-hour, lowercase am/pm | **2:30 pm** |
| Date | DD/MM/YYYY | **28/04/2023** |
| Percentage | Symbol | **5%** not **5 percent** |
| Ampersand | OK in headers/menus | **Copy & paste** but not in sentences |

---

## Common Rewrites

| Bad | Good | Rule violated |
|---|---|---|
| Are you sure you want to delete? | **Delete this Answer?** | Title max 4 words; match button verb |
| Your changes have been saved | **Changes saved** | Use present tense, active voice |
| Click here to learn more | **Learn more** | No permissive language |
| You can schedule alerts to receive updates | **Schedule alerts to get updates** | No "You can..." |
| Proceed to export | **Export** | Use direct action verb |
| Submit your request | **Send request** | "Submit" is forbidden |
| Expand/Collapse is unavailable when subtotals are off | **Turn on subtotals to enable expand/collapse** | Action before outcome |
