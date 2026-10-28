---
description: Write the engineering spec for a prototype that's ready to hand off. Checks it's ready, drafts the spec from the code, walks the designer through each section, and marks it Ready for build only when they approve. Pass the prototype name.
---

The designer wants to hand a prototype off to engineering. The spec is the record engineers build from, so it says what the designer means, not only what the code happens to do. Claude drafts it; the designer decides. Prototype: `$ARGUMENTS`. If no name was given, read `src/prototypes/registry-mine.ts` and ask which prototype with AskUserQuestion.

Many designers are not engineers. Ask in plain words, one round at a time.

## How the spec shows up

- `src/prototypes/<Name>/spec.tsx` exports `specs: ComponentSpec[]` and `approval: SpecApproval` (types in `src/app-chrome/SpecSheet/types.ts`). `src/prototypes/SpotterComponents/spec.tsx` is a worked example.
- The prototype gets a floating Prototype / Spec switch at the bottom of the page (`?spec` in the URL).
  - Draft: only shows under `npm run dev`, with a "Draft, not approved" banner.
  - Approved: shows to everyone, including on the deployed site, as "Ready for build" with the designer's name and date.
  - Approved, then the prototype's code changed: shows "Changed since approval". The check compares the code fingerprint (`npm run spec:hash <Name>`) with `approval.sourceHash`.
- A prototype without `spec.tsx` has no switch and looks the same as before.

## Step 1: Is it ready to hand off?

Run these and report the results in plain words:

```
npm run build
npm run scan:dark -- src/prototypes/<Name>
```

Then look at the prototype yourself:
- Hardcoded values (hex, rgb, magic px) left in its CSS Modules or inline styles.
- Raw `<button>`, `<input>`, `<select>`, `<table>` where a Radiant component exists.
- Inline styles for values that don't change at runtime (they can't go through `npm run handoff`).

Offer `/rp-radiant-check <Name>` for the full report.

Then ask: "Is this prototype ready to hand off to engineering?"
- If the checks found problems, list them first and recommend fixing them before the spec. Offer to fix them now.
- If the designer says it isn't ready, stop. A spec written before the design settles goes stale.

## Step 2: Draft it from the code

Read the prototype and pick the components engineering needs to build. Ask the designer which ones matter if it isn't obvious: a prototype often has one or two new pieces and a lot of existing Radiant components around them. Existing Radiant and Spotter components need no spec; list them under `files` instead.

For each component, fill in only what the code proves:
- `name`, `summary`, `preview` (the live component) and `states` (one live specimen per state, rendered from the real component with props, never a copy).
- `props` from its TypeScript interface.
- `measurements` from its CSS (give `px` so the sheet adds the spacing token).
- `files` with paths, and `sources` with `?raw` imports of its `.tsx` and `.module.css`, so the source can't drift.
- `keyboard` and `motion` only where the code handles keys or animates.

Write `src/prototypes/<Name>/spec.tsx` with `approval: { status: 'draft' }`. Tell the designer to open the prototype with `npm run dev` and use the Spec switch to see the draft.

## Step 3: The designer reviews each section

Go through the sections that need their judgement, one at a time, showing what you wrote and asking them to confirm or correct it:

1. **Anatomy:** are these the right parts, with the right names?
2. **States:** is anything missing (empty, loading, error, long text, disabled)? Is any state shown here not meant to ship?
3. **Behaviour:** what happens on each interaction, including the edge cases the prototype fakes or skips.
4. **Motion:** are the timings intended, or just what was easy to build?
5. **Out of scope:** anything in the prototype engineering should not build. Add it to `notes`.
6. **Usage:** when to use it and when not (`usage.use` and `usage.avoid`).

Write their answers into `spec.tsx` as you go. Never invent behaviour the designer didn't confirm: if they don't know, leave it out or add a note saying it's open.

## Step 4: Approval, by the designer only

Ask: "Approve this spec as ready for build?" Only an explicit yes from the designer counts. If they want changes, make them and ask again.

On yes:
1. Run `npm run spec:hash <Name>` for the current fingerprint.
2. Set `approval` to `{ status: 'approved', by: '<designer's name>', on: '<today, YYYY-MM-DD>', sourceHash: '<fingerprint>' }`. Take the name from `git config user.name`, and confirm it with them.
3. Run `npm run build`.
4. Tell them it now shows as Ready for build, and that it goes back to "Changed since approval" if the prototype changes; running `/rp-spec <Name>` again re-reviews and re-approves it.

Don't commit or push unless they ask. When they do, `/rp-contribute` or their usual flow takes it from there.

## Updating an approved spec

When the spec already exists, start at Step 1, then show what changed in the prototype since approval (`git log` and `git diff` on its folder since the approval date), update the affected sections with the designer, and ask for approval again (Step 4). The approval is per prototype: any change to its code needs a fresh yes.

## Never

- Never mark a spec approved without the designer's explicit yes in this conversation.
- Never approve on a prototype that fails `npm run build`.
- Never copy component code into the spec; render the real component and import its source with `?raw`.
- Never edit `registry-core.ts` or `registry.ts`. The spec lives in the prototype's own folder.
