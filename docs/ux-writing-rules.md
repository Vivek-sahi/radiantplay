# ThoughtSpot UX Writing Rules

> **Source of truth** for all UI copy generated in prototypes and components.
> These rules are shared with the Spotter Writer Figma plugin and Claude.
> Each rule is a standalone constraint, prefixed with "When writing..." for element-type matching.

---

## Titles

When writing titles, the title should be the first thing a user reads to help identify their place, understand organization, and predict actions.

When writing titles for modal and alert dialogues, start with an imperative verb that is the exact same verb as the primary button.

When writing page titles, they do not need to start with a verb.

When writing titles, use approved action words.

When writing titles, the title text must not exceed four words.

When writing titles, always use sentence case capitalization.

When writing titles, do not use closing punctuation.

---

## Buttons

When writing button text, use imperative verbs or an imperative verb plus noun pairing.

When selecting imperative verbs for buttons, use words exclusively from the approved action word list.

When writing button text, keep the length to a maximum of one to two words.

When writing button text, avoid passive words unless the user is simply closing the modal.

---

## Approved Action Words

When setting button copy or creating a title for making a new object in the system that did not previously exist, use the word Create.

When setting button copy or creating a title for putting an already existing item or object into some kind of container, use the word Add.

When setting button copy or creating a title for erasing something from the system forever, use the word Delete.

When setting button copy or creating a title for taking something away and setting it aside where it still exists and can be restored, use the word Remove.

When setting button copy or creating a title for navigation, use approved words like Back, Cancel, Close, Continue, Done, Find, Next, Open, Redo, and Undo.

When setting button copy or creating a title for editing, use approved words like Confirm, Copy, Delete, Discard, Edit, Redo, Remove, and Reset.

When setting button copy or creating a title for viewing, use approved words like Close, Collapse, Compare, Customize, Drill down, Expand, Explore, Favorite, Filter, and Hide.

When setting button copy or creating a title for system actions, use approved words like Analyze, Authenticate, Connect, Enter, Join, Reload, Request, Retry, Schedule, Search, Sign in/out, Start, and Subscribe.

When setting button copy or creating a title for other actions, use approved words like Download, Export, Import, Install, Run, Save, Send, Share, Submit, Transfer, Upload, and Verify.

---

## Alerts

When crafting alert messaging in general, ensure the text is clear, factual, and efficient.

When writing system alerts, use one to two short phrases that provide key information and a remedy phrased as an action.

When creating call to action buttons for system alerts, include a one or two word call to action that uses the same imperative verb used in the remedy text.

When writing sectional alerts, efficiently provide information and context in one to two short phrases with punctuation, provide a remedy phrased as an action, and include a one to two word call to action if needed.

When writing toast alerts, use a short single phrase of four to six words.

When writing toast alerts, you may include congratulatory or encouraging language such as Success or Nice.

When writing toast alerts, you can include a primary button with clear imperative verbs like Save or Delete if there is information to be acted upon.

When writing muted alerts or empty states, use less text, adopt a more conversational and informal tone, and provide a clear title of two to four words with a short phrase to clarify what is missing and how to resolve it.

When writing empty states, you can employ a playful tone while encouraging users to take action.

When creating muted alerts, you must include a primary call to action button and can include a secondary button.

When writing alert dialogs, use clear and direct language patterns to describe the consequences of the action without being overly alarming.

When writing alert dialogs, ensure the primary button repeats the exact imperative verb described in the title.

When writing informational and alert dialogues, softer button language like close or confirm is permissible.

When creating secondary buttons for alert dialogs, the button should almost always say Cancel to allow the user to bail out.

---

## Labels

When writing UI labels, they must not exceed three words in length.

When writing UI labels, always use sentence case capitalization.

When writing UI labels, do not include closing punctuation.

When writing UI labels, avoid articles like the, a, or an to keep content short and actionable.

---

## Descriptive Text

When writing descriptive text, keep phrases short with a maximum of forty characters.

When writing descriptive text, limit the content to a maximum of four lines.

When writing descriptive text that is longer than four lines, you must separate the blocks of text with a hard break.

When writing descriptive text, use standard punctuation.

When writing descriptive text, start sentences with imperative verbs that put the action before the outcome to help users understand what they will do.

When writing descriptive text, use single verbs instead of verb and noun phrases whenever possible.

When writing descriptive text, avoid permissive language and instead give users confidence about exactly what they should do.

When writing descriptive text, use active voice to make the user the actor and avoid verbs ending in ing.

---

## Input Fields

When providing input field assistance, do not use placeholder or ghost text inside empty input fields.

When writing helper text, include examples of an appropriate field input, separate multiple examples with a comma, and do not include multi-step instructions.

---

## Errors

When writing error messaging, be direct, efficient, and avoid placing any blame on the user.

When writing input field errors, use a short phrase of three to five words that focuses heavily on the remedy rather than the error itself.

When writing input field errors, you can start the phrase with an imperative verb like Add, enter, or choose.

When an error message overwrites a field label in the user interface, the error message must reference the field name in addition to describing the issue or remedy.

When an input field has persistent helper text that gets overwritten by an error message, the error message must reference both the field name and the helper text.

When writing user interface errors for required controls like checkboxes, keep the message simple using two to five words and clearly provide a remedy.

---

## Tooltips

When writing tooltips, use one to two words to describe what the element is without using any verbs.

When writing tooltips, do not use them for calls to action, but only to help users understand an icon or to show the full version of truncated text.

---

## Explain Cards

When writing explain cards, include a two to four word title that adds context rather than just stating the term.

When writing explain cards, follow the guidelines for long form descriptive text and ensure the title is the very first messaging on the card.

---

## Splash Modals

When writing splash modals, include a two to four word title as the first messaging, one to two lines of descriptive text, and a button to dismiss the modal.

When writing splash modals, use repeatable text patterns such as What is new.

---

## Spotlights

When writing spotlights, limit the text to forty characters per line for a maximum of four lines.

When writing spotlights with large amounts of text, separate the text into four line blocks to ensure scannability.

---

## Brand Voice

When writing for the ThoughtSpot brand voice, ensure the tone is approachable, genuine, humble, and friendly, using plain language without being overly casual.

When writing for the ThoughtSpot brand voice, ensure the tone is pioneering, visionary, innovative, and trailblazing, without being risky or intimidating.

When writing for the ThoughtSpot brand voice, ensure the tone is smart, insightful, trusted, and sharp, providing value in every line without being pushy or arrogant.

When writing for the ThoughtSpot brand voice, ensure the tone is provocative, thought provoking, unfiltered, and compelling, challenging users to think differently without being overbearing or contentious.

---

## Tone Adaptation

When writing general user interface content, use active voice in most cases to keep sentences simple, short, and conversational.

When writing general user interface content, use passive voice sparingly and only to soften and provide distance in select situations like notifying a user of a disabled account.

When adjusting the tone of the brand voice, shift to adapt to the user emotional state, being more practical for bad news or errors and quirkier for successes or empty states.

When adjusting the tone of the brand voice, always err on the side of being clear and human, prioritizing clarity and simplicity over adding a quirky wink that might interrupt a task.

---

## Terminology

When writing standard feature names in the product, they must always be written in lower case.

When writing unique terms that identify a core feature, a standalone feature, or a differentiated branded feature, capitalize them in all instances.

When using specific ThoughtSpot terminology, adhere exactly to the capitalization of the terms Answer, Connection, Data Model, Explore mode, Group, Liveboard, Monitor, SpotApp, SpotIQ, Highlights, and AskSage.

When naming product features and tools, name things only when absolutely necessary and in a way that makes it easy for the user to understand what the thing is or does.

---

## Trademarks

When using a trademarked name before a full trademark is granted, the name should appear with a superscripted trademark symbol.

When a trademark becomes official, the superscripted trademark symbol must be replaced with a registered trademark symbol wherever the name appears.
