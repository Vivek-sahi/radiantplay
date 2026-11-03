---
name: rp-radiance
description: Radiance, ThoughtSpot's AI identity background (the animated wash behind AI surfaces). Load when a request mentions Radiance, an AI background, a wash or glow behind a page, and whenever a prototype recreates or extends a surface that has a Radiance product pattern even if Radiance is never mentioned - the Home page or Spotter home, SpotterX or a Spotter chat, a Liveboard with its Spotter panel, sign up or sign in - or another AI-flavoured surface such as an AI welcome, onboarding or an agent's empty state. Covers which pattern to use, the RadianceBackground component, and the lint.
user-invocable: false
---

# Radiance in prototypes

Radiance is vendored in `public/vendor/radiance/` (never edited, updated by the maintainer with `npm run radiance:update`, reaches forks through `/rp-sync-upstream`). These rules are summarised from Radiance's own `RULES.md`, vendored at `scripts/radiance/upstream/RULES.md`. Read the sections named here before writing Radiance code (AGENT-1).

## Which pattern (PLACE-1, PLACE-3, PRODUCT-1)

| The prototype is | Use | Say |
|---|---|---|
| Home page, Spotter home hero | `pattern="home"` | Always, even if Radiance was never mentioned. Name the pattern you used. |
| SpotterX, a full-page Spotter chat | `pattern="spotterx"` with `state` | Same |
| Liveboard with its Spotter panel | `pattern="liveboard"` with `state` | Same |
| Sign up, sign in, password reset, SSO | `pattern="signup"` | Same |
| Another AI surface: AI welcome, onboarding, an agent's empty state | Offer the closest template, default `top-wash-subtle-dynamic-fast` | Ask first, then name it |
| Admin, settings, tables, data screens with no AI | Nothing | Never add Radiance unasked |

Product patterns are fixed (§12, PRODUCT-2): no prominence, speed, seed, base or any other tuning, and no override. For a different look, start from the template the product is built on (`signup`: `right-wash-prominent-dynamic-fast`; `home`, `spotterx`, `liveboard`: `top-wash-subtle-dynamic-fast`) and say so. Templates are `<placement>-<intensity>-<motion>-<speed>` with placements `right-wash`, `left-wash`, `neutral`, `top-wash`, `bottom-wash`. Never change intensity, speed, spread, colour or grain unprompted (AGENT-2); a requested deviation gets the §10 warning first and a `RADIANCE-OVERRIDE` comment after.

## How

```tsx
import { RadianceBackground, useRadianceState } from '@/app-chrome/RadianceBackground/RadianceBackground';

<RadianceBackground pattern="home" heroHeight={336} />
const state = useRadianceState(conversationId, isResponding); // idle -> reasoning -> answered
<RadianceBackground pattern="spotterx" state={state} />
```

The component loads the renderer and the product's recipe on first use and follows light and dark. Each pattern's parent needs the layout in the comment at the top of `RadianceBackground.tsx` (for example `position: relative; isolation: isolate` for `home`). State comes only from the conversation (PRODUCT-4), never hover, scroll or a timer. One surface per region (SURFACE-3), background only (SURFACE-4), at most three moving surfaces on screen (IMPL-6).

Never hand-make a gradient, glow, noise or blob that imitates Radiance, and never copy or edit the renderer or a recipe (IMPL-1, IMPL-3, PRODUCT-3). If Radiance can't do something, say so and offer the nearest pattern (AGENT-7).

## Check

```bash
npm run radiance:lint -- src/prototypes/<Name>
```

It must report 0 errors. `npm run radiance:check` also confirms the vendored files are untouched.
