# Prototypes: rules for this folder

Loaded whenever Claude works in `src/prototypes/`. The root CLAUDE.md conventions still apply.

## Registering a prototype

- A designer's prototype goes in `registry-mine.ts`, never `registry-core.ts` or `registry.ts`.
- A new prototype's entry includes `theme: 'global'`, so it follows light and dark with the rest of the app. Add it only once the dark check below passes. Without it a designer prototype stays light, which is the safe default for older prototypes.
- `/rp-new-prototype` (guided) and `npm run new-prototype <Name>` (quick) both scaffold from a template and register the entry for you.

## Before calling a prototype done

1. Dark check: `npm run scan:dark -- src/prototypes/<Name>` reports dark ready. Fix findings with `sysVar()` / `var(--rd-sys-color-*)`, never `systemColors.light[...]` or hex. If something can't be fixed yet, leave `theme: 'global'` off and say so.
2. `npm run build` passes.
3. Offer `/rp-radiant-check <Name>` for the full compliance report and the gallery thumbnail.

## Structure

- Components only this prototype uses go in `src/prototypes/<Name>/components/`, never `src/components/`.
- Mock data comes from `@/mocks` or `src/prototypes/<Name>/data/`.
- Older prototypes move to dark mode with `/rp-migrate-prototype`, which sets `theme: 'global'` when they're ready.
- Radiance (the AI background): a prototype of the Home page, SpotterX, a Liveboard with Spotter or sign up uses its Radiance product pattern even when unasked. Follow `.claude/skills/rp-radiance/SKILL.md`.
