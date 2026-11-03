# Radiance Language — Ruleset

**This file is the single source of truth.** If anything in a skill, README, Figma file,
or someone's memory disagrees with this document, this document wins.

**Version 2.0.0.** What changed from 1.0 is in [`CHANGELOG.md`](CHANGELOG.md).

Radiance is a shared language. It works only if every surface across every product
reads as the same system. That is the whole point: a person moving between two
ThoughtSpot surfaces should never have to wonder whether they are still in the same
product. Most rules here exist to protect that coherence, not to restrict anyone.

---

## 0. How to read this

Every rule has an ID (`COLOR-1`, `MOTION-5`, …). Cite the ID when you warn someone.

Rules are grouped by what they protect:

| Tier | Meaning |
|---|---|
| 🔒 **LOCKED** | The identity of the language. An AI must never change these on its own, for any reason. |
| ⚠️ **ON REQUEST** | The user may have these. An AI must never change them unprompted — only when explicitly asked. |
| ✅ **FREE** | The user's call. No friction, no warning. |
| 🔐 **FIXED** | Product patterns (§12): ThoughtSpot's finished screens, locked as a whole. Nobody adjusts or overrides them. Only the Radiance admin changes them, in this repository. |

**Outside the product patterns, nothing here is absolutely forbidden.** A user can
override any rule on their own surface, but every override goes through §10 — warn,
confirm, annotate. No silent deviations. A product pattern has no override path: the
moment it changes, it is no longer that product's pattern. Start from a template
instead (PRODUCT-2).

---

## 1. Entry — always start from a named pattern

### 🔒 PLACE-1 — Every Radiance surface starts from a named pattern

Two kinds exist:

```
Product patterns (fixed)      signup    home    spotterx    liveboard
Templates (customisable)      right-wash    left-wash    neutral    top-wash    bottom-wash
```

**Product patterns** are ThoughtSpot's finished screens (Sign up, Home page,
SpotterX, Liveboard), each locked exactly as it ships (§12). **Templates** are the five
placements everything else starts from, and the only patterns anyone customises.

**Product first.** When the surface *is* one of those products, or the request names
one ("bring the Radiance background from the sign up page"), use its product pattern.
Reach for a template when no product pattern is the answer, or when someone wants to
customise.

There is no sixth template. Do not invent one, do not blend two, do not derive one.
New product patterns come only from the Radiance admin (PRODUCT-5).

### 🔒 PLACE-2 — Use the shorthand, not hand-assembled attributes

```html
<div class="radiance-local" data-radiance-pattern="top-wash-subtle-dynamic-fast"></div>
<div class="radiance-local" data-radiance-pattern="signup"></div>
```

A template's name is `<placement>-<intensity>-<motion>-<speed>`; a product pattern's
name is the product. The renderer expands either into the low-level attributes.
Hand-writing the six underlying attributes is how people get `intensity` and
`dark-glow` out of sync, which silently changes dark mode.

### 🔒 PLACE-3 — Default when nothing is specified

If a user says "add a Radiance background" with no other detail, apply:

```
top-wash-subtle-dynamic-fast
```

…and **tell them which pattern you used.** Never apply a pattern silently.
Theme follows the host product's light/dark state — do not hardcode it.

**Building one of the product screens is not "nothing specified".** A new Home page
prototype gets `home`, a sign-up flow gets `signup`, a SpotterX or Liveboard screen
gets `spotterx` or `liveboard`, even when the request never mentions Radiance. Those
screens only ever look one way (PRODUCT-1).

### ⚠️ PLACE-4 — If the need doesn't map, say so

If no product pattern applies and none of the five templates fit, pick the nearest,
name it, and explain the compromise.
Never approximate Radiance with a hand-rolled CSS gradient. A near-miss that looks
"Radiance-ish" is worse than an honest reuse of an existing pattern, because it
teaches the next person that approximations are acceptable.

### ✅ PLACE-5 — Which template to use is free

Documented homes, as a starting point rather than a restriction:

| Template | Where it is used today |
|---|---|
| `right-wash` | Sign up (as the `signup` product pattern), the deck's colour system |
| `left-wash` | The deck's opportunity slide |
| `neutral` | The deck's cover and handoff |
| `top-wash` | Home page (as the `home` product pattern) |
| `bottom-wash` | Not yet used in production |

SpotterX and Liveboard are not built on a template; they run the Spotter engine (§12).

### 🔒 PLACE-6 — To change direction, change pattern

Never CSS-flip a Radiance surface (`transform: scaleX(-1)`). A flip also mirrors the
grain and defeats the texture cache. `left-wash` and `bottom-wash` exist precisely so
you never need to flip anything.

---

## 2. Surface

### 🔒 SURFACE-1 — The base is the host's background colour
A Radiance surface sits on the colour of the area it belongs to, in light and in dark.
Where the host is white, the base is white. Where the host is another colour, the base
is that colour. Nothing else is ever the base.

```html
<div class="radiance-local" data-radiance-pattern="neutral-subtle-dynamic-slow"
     data-radiance-base="#F6F7F9"></div>
```

- Prefer the `--radiance-base` custom property, set by the host's theme next to its
  own background colour, so the base follows the theme by itself.
  `data-radiance-base` on the surface wins over it.
- With neither, the base is `#FFFFFF` in light and `#1A1B1E` in dark.
- The base is the host's actual, opaque background colour, read from the product.
  Never a tint picked to warm or cool the Radiance, never a brand colour, never "just
  slightly warmer". A base that differs from the area around it shows as a seam.
- Product patterns lock their own bases (§12).

### 🔒 SURFACE-2 — Radiance is opaque
The canvas is created with `{ alpha: false }`. Radiance is a **background**, not a
translucent overlay stacked on something else. Never set the surface to transparent
and blend it into another background.

### 🔒 SURFACE-3 — One surface per region
Never stack two Radiance surfaces, never nest one inside another. Two grain fields
multiplying each other is immediately visible and always wrong.

### 🔒 SURFACE-4 — Background only
Radiance is never a fill for buttons, cards, icons, avatars, chart series, badges,
or text. It is the field things sit *on*.

### 🔒 SURFACE-5 — Layer order is fixed
```
base fill → blurred blobs → directional wash → dark falloff (dark+subtle only)
          → film: dither (dark only) → grain → fine noise → tone lift
```
Never reorder. The film is always last and always on top: dither, grain and fine
noise over the colour, then the tone lift over the whole colour field (GRAIN-2).

### ⚠️ SURFACE-6 — Contrast is checked against the strongest zone
Radiance is not uniform. Check foreground contrast against the **most saturated**
part of the pattern, not the average. If text only passes over the quiet corner,
it fails.

---

## 3. Colour

### 🔒 COLOR-1 — Only these colours exist

**Light**

| Role | Hex | RGB |
|---|---|---|
| Pink (dominant) | `#FF78A0` | 255, 120, 160 |
| Violet (dominant) | `#8C64FF` | 140, 100, 255 |
| Blue (dominant) | `#288CFF` | 40, 140, 255 |
| Peach (warmth) | `#FFB464` | 255, 180, 100 |
| Mint (support only) | `#50DCB4` | 80, 220, 180 |
| Veil — blue / pink / gold | `#C8DCFF` `#FFC8DC` `#FFF0B4` | |

**Dark**

| Role | Hex | RGB |
|---|---|---|
| Pink (dominant) | `#FF5D8E` | 255, 93, 142 |
| Violet (dominant) | `#8A5DFF` | 138, 93, 255 |
| Blue (dominant) | `#278CFF` | 39, 140, 255 |
| Peach (warmth) | `#FFB45A` | 255, 180, 90 |
| Mint (support only) | `#2DDCB1` | 45, 220, 177 |
| Veil — blue / pink / gold | `#A0C4FF` `#FFAAD2` `#FFE896` | |

No substitutions. No brand-colour injection. No new hues. Not even a close one.

### 🔒 COLOR-2 — Light and dark palettes are not interchangeable
The dark values are not "the light values dimmed" — they are separately tuned for
`screen` blending on a dark base. Using a light value on a dark surface produces a
muddy result that no amount of opacity fixes.

### 🔒 COLOR-3 — Mint is a support colour
Mint is deliberately quiet: `0.32` opacity at its loudest in light, down to `0.024`
in neutral dark. It is never promoted to a dominant, never used to signal anything,
never brightened "so you can see it". If mint reads clearly, it is wrong.

### 🔒 COLOR-4 — The hierarchy does not change per screen
Blue, violet and pink lead. Peach is warmth. Mint supports. This ordering is the
same on every surface in every product.

### 🔒 COLOR-5 — Colours blend only with their neighbours
Every composition keeps its colours in one order:

```
peach → pink → violet → blue → mint
```

Each colour only ever blends into the one beside it. Opposite hues never overlap:
mint never meets pink, peach never meets blue or violet. Two opposite hues mix through
grey, which is the muddy patch that can appear between colours; with the order held,
it cannot. Peach and mint stay compact accents at the two ends. The renderer's blob
sets are arranged this way. Never re-anchor a colour out of its place in the order.

---

## 4. Grain

Grain is the most recognisable part of Radiance and the most frequently broken.

### 🔒 GRAIN-1 — Grain size is `1.0px`
Not a taste setting. Not "a bit coarser for large screens". `1.0px`.

### 🔒 GRAIN-2 — The film's structure is fixed
The film builds on the Home page hero's, which SpotterX and Liveboard carry too. It
is the only film (GRAIN-6), and the renderer draws it on every surface, in this order:

| Pass | Light | Dark |
|---|---|---|
| Dither | — | `globalAlpha 0.42`, drawn at `0.76` |
| Grain: a macro and a micro pass | alpha multipliers `1.16` / `0.30`, at full strength | `1.18` / `0.36`, drawn at `0.76` |
| Fine noise: a `56px` fractal-noise tile | `0.22`, `multiply` | `0.27`, `screen` |
| Tone lift | saturate `1.16`, contrast `1.06` | saturate `1.2`, contrast `1.08` |

### 🔒 GRAIN-3 — The film is topmost and unsmoothed
Always the last layers. Grain is always drawn with `imageSmoothingEnabled = false`.
Smoothing turns film grain into blur, which is the opposite of the intent.

In dark, the dither pass is masked by the colour field exactly as the grain is, so
the bare base renders at its true value rather than being lifted toward grey by
texture that has no colour to sit on.

### 🔒 GRAIN-4 — The film lives inside the colour field, never on the bare surface
Every pass of the film (dither, grain, fine noise and tone lift) is masked by the
colour field's own alpha. Where there is colour, there is film: it reaches into faint
colour (about 80% strength by 12% colour), the way Home's hero does, and falls away
before the bare base (under 6% strength below 0.5% colour). Where the surface is bare,
it stays clean, so a Radiance surface sitting next to a panel of its base colour
shows no seam.

This is a property of the composition, not a per-instance setting. Never mask the
film to an arbitrary shape, never fade it toward an edge by hand, and never apply it
per-blob. The mask is the colour field and nothing else.

### 🔒 GRAIN-5 — Never substitute a static noise image for the grain on web
The grain is generated per surface so it matches the surface's exact pixel
dimensions. A tiled PNG will visibly repeat. Two tiles are sanctioned, and neither
stands in for the grain: the film's fine-noise tile (rasterised by the renderer at
the surface's pixel density and masked to the colour field, GRAIN-2), and the Figma
plugin's tiled grain image, because Figma cannot run the generator.

### 🔒 GRAIN-6 — One grain per theme, on every surface
Radiance has exactly two grains: the light grain and the dark grain (GRAIN-2's table).
Every surface in the language draws the grain of its theme at that value: every
template, every product pattern, any screen. A person moving between two ThoughtSpot
screens in light mode sees the same grain on both, and the same again in dark.

Nothing has a grain of its own. No product, page or recipe adds another noise layer or
changes the grain's strength, and a product whose colour is softer (Home's hero)
softens its colour, never its grain. Where the grain shows follows the pattern: the
colour field for templates, the product's own fade for product patterns. What the
grain is never changes.

---

## 5. Blend and blur

### 🔒 BLEND-1 — Blend modes are per-theme and fixed
Light uses `source-over`. Dark uses `screen`. Never swapped, never "tried the other
way to see".

### 🔒 BLEND-2 — Blur radii are fixed
Light `40px` (neutral `22px`). Dark `64px` (neutral `40px`).

### 🔒 BLEND-3 — No filters on top
Do not layer CSS `filter`, `mix-blend-mode`, or `backdrop-filter` over a Radiance
surface. The composition already contains every blend it needs, including its own
tone lift (GRAIN-2), drawn inside the colour field so the base stays exact. A CSS
filter would shift the base too. The product recipes' filters belong to those
product patterns (PRODUCT-3) and set no precedent.

---

## 6. Motion

### 🔒 MOTION-1 — Motion is ambient drift, never interactive
Never bind Radiance motion to cursor position, scroll offset, hover, focus, click,
loading state, or any input. Radiance does not respond to the user. It breathes on
its own. This is a deliberate identity decision, not an oversight.

The one exception is the Spotter product patterns' lifecycle states, which follow
Spotter as it reasons and answers (PRODUCT-4). Templates never take a state.

### 🔒 MOTION-2 — No visible loop, no bounce, no trigger easing
Every blob's orbit, size, stretch and tilt is two or three sine waves at
incommensurate per-blob frequencies, so no path ever closes and the drift never
visibly repeats. Each blob also breathes: its size and glow swell by up to 5% on its
own 5–8 second rhythm. The tempo follows the square root of the speed, so a fast
pattern breathes a little quicker, never frantically. All of it is seeded and runs on
the shared timeline (MOTION-4). Never replace it with a keyframe loop.

### 🔒 MOTION-3 — Static variants ignore speed
A static surface renders one locked frame and caches it. Setting speed on a static
surface does nothing. That is correct.

### 🔒 MOTION-4 — One shared timeline
All surfaces read from a single session-anchored time origin so they stay in phase.
Never give a surface its own clock — two Radiance surfaces drifting out of sync in
the same viewport is instantly noticeable.

### ⚠️ MOTION-5 — Speed is tunable on request, within `0.4`–`2.0`
Canonical values:

| Pattern | slow | fast |
|---|---|---|
| `right-wash`, `left-wash` | `0.62` | `1.02` |
| `neutral` | `0.86` | `1.34` |
| `top-wash`, `bottom-wash` | `0.92` | `1.72` |

Below `0.4` the drift reads as dead. Above `2.0` it reads as nervous and pulls
attention away from content. Outside the range → warn per §10.
The renderer emits a `MOTION-5` console warning automatically.

### 🔒 MOTION-6 — Never pick a non-canonical speed on your own
If the user has not asked for a speed, use the pattern's `slow` or `fast` value.
Never interpolate, never "tune it a little" to fit a layout.

### 🔒 MOTION-7 — `prefers-reduced-motion` is honoured, always
When the OS requests reduced motion, the surface freezes at its resting frame —
same pattern, same composition, no drift. The renderer does this automatically and
there is no opt-out attribute. Do not add one. Motion sensitivity is not a
preference to be overridden by a design decision.

---

## 7. Intensity

### ⚠️ INT-1 — `subtle` wherever content sits on top
`subtle` is the default for product surfaces — anything with UI, text, or data over
it. `prominent` is for covers, heroes, marketing moments, and empty canvases.

### 🔒 INT-2 — Never `prominent` behind dense content
Tables, dashboards, forms, long-form text. If someone has to read it, the background
is `subtle`.

### 🔒 INT-3 — `dark-glow` must equal `intensity`
`data-radiance-dark-glow` and `data-radiance-intensity` must always match. When they
disagree the dark falloff layer turns on or off silently and the surface stops
matching the rest of the product. Using `data-radiance-pattern` prevents this
entirely. The renderer emits an `INT-3` console warning if they diverge.

### 🔒 INT-4 — Never change intensity unprompted
Not to fit a layout, not because it looked better, not to improve contrast. Only on
explicit request.

---

## 8. Adjusting a pattern

A template's shipped values are the recommendation, not a ceiling. Teams can tune a
surface for their product — but through **percentages of the pattern's own value**,
never by typing in a new absolute number.

Adjustments are for templates. A product pattern takes none (PRODUCT-2). To give a
new surface a product's look with a twist, start from the template the product is
built on (§12) and adjust that.

### ⚠️ ADJUST-1 — Adjust by percentage, never by absolute value

```html
<div class="radiance-local"
     data-radiance-pattern="top-wash-subtle-dynamic-fast"
     data-radiance-prominence="120%"
     data-radiance-speed-scale="70%"></div>
```

`100%` always means "exactly what the pattern ships", so a surface that sets nothing
and a surface that sets `100%` are identical. Three reasons this is the only
sanctioned way to tune:

- **The baseline stays visible.** `data-radiance-speed` keeps the canonical `1.72`;
  the scale multiplies at read time. Anyone reading the markup sees both what the
  pattern is and how far this surface departs from it.
- **It survives a change upstream.** If a pattern's tuning is ever revised, a surface
  at `120%` follows it. A surface hardcoded to `2.06` silently stops tracking.
- **It is auditable.** "Prominence at 120%" is a reviewable decision. "Opacity 0.53"
  is a number nobody can judge.

Accepted forms: `120%`, `120`, `1.2`. Prefer the `%` form — it is what the rule is
written in and what a reviewer expects.

### 🔒 ADJUST-2 — Never adjust unprompted
An AI applies an adjustment only when the user asks for one, in the direction and
amount they asked for. Not to fit a layout, not to improve contrast, not because the
surface "felt a bit strong". If they did not name a percentage, use the pattern
default and say which pattern you used.

### ⚠️ ADJUST-3 — Prominence: `50%`–`150%`
`data-radiance-prominence` scales blob opacity and the directional wash together, so
the whole composition strengthens or softens as one thing rather than the blobs
drifting out of step with the wash.

Below `50%` the colour stops reading as deliberate and looks like a rendering fault.
Above `150%` the blobs clip and the surface competes with the content on top of it.
If you want a genuinely bigger jump, switch `subtle` ↔ `prominent` first — that is a
larger, already-tuned step — and adjust from there.

### ⚠️ ADJUST-4 — Spread: `75%`–`125%`
`data-radiance-spread` scales blob radius. The neutral pattern already moves through
roughly this range on its own as the surface changes shape, which is where the bounds
come from.

Below `75%` the blobs separate into visible discs instead of a field. Above `125%`
they merge into one flat wash and the pattern's direction disappears.

### ⚠️ ADJUST-5 — Speed: `50%`–`150%`
`data-radiance-speed-scale` multiplies the pattern's canonical `slow` or `fast` value.

The absolute guardrail in MOTION-5 still applies on top of this: whatever the
percentage works out to must land inside `0.4`–`2.0`. For a pattern whose `fast` is
already `1.72`, that means `+50%` is not reachable — the absolute ceiling binds first,
and the renderer warns.

### ✅ ADJUST-6 — Size is CSS, and it is free
"Make it 30% taller" is not a Radiance adjustment. Size, height, width and aspect
ratio belong to the container, need no attribute, and need no permission:

```css
.hero { height: 520px; }   /* was 400px */
```

The renderer scales blob radius and orbit travel to whatever surface it is given, so
a taller field stays in the language on its own. Never use `data-radiance-spread` to
fake a size change — spread changes the composition, size changes the frame.

### 🔒 ADJUST-7 — Only these four things scale
Prominence, spread, speed, size. Colour, grain, blend mode, blur radius, layer order
and motion character have no percentage interface, because they are not degrees of
anything — they are the identity. A request to "reduce the grain by 30%" is an
override under §10, not an adjustment.

### ✅ MASK-1 — Masking and cropping are free
Any shape, any clip path, any corner radius, any container crop. This is the main
creative latitude the language gives you, and you do not need to ask.

### 🔒 MASK-2 — Crop, don't re-aim
Cropping a `top-wash` so that colour appears to come from the left is a violation —
you get the colour but lose the internal logic, and it will not match the real
`left-wash` next to it. If you need a direction, use the pattern that points there.

### 🔒 MASK-3 — No non-uniform scaling
Uniform scale is fine. `scaleX` alone, `scaleY` alone, or any stretch distorts the
grain, which is the one thing in the composition that must stay at `1.0px`.

### ⚠️ MASK-4 — Below ~120px, use a static variant
Under roughly 120×120 the drift is too small to read and only costs a frame budget.
Use the static variant of the same pattern.

### ✅ MASK-5 — Size and aspect ratio are free
Wide, tall, square, tiny, full-bleed. The renderer scales blob radius and orbit to
the surface, so a compact modal crop and a full homepage field speak the same
language without identical blob density.

---

## 9. Implementation

### 🔒 IMPL-1 — Never fork `radiance-renderer.js`
Import it. A copied renderer is how the language drifts: the copy gets a "small
tweak", the tweak never comes back, and six months later two products look related
but not the same. If you need behaviour the renderer does not have, raise it against
this repository instead of editing a copy.

The frozen 1.0 renderer at `renderer/v1/radiance-renderer.js` is kept for reference and
comparison. New work uses the current renderer, and a page never loads both.

### 🔒 IMPL-2 — Never hand-author the internals
Blob arrays, gradient stops, wash definitions, grain generation. These are not
configuration. They are the language.

### 🔒 IMPL-3 — Never re-implement Radiance in another medium
No CSS-gradient lookalike, no SVG approximation, no custom shader, no exported PNG
standing in for a live surface. If the target cannot run the renderer, use the Figma
plugin output or say plainly that Radiance is not available there.

### 🔒 IMPL-4 — Keep the production safeguards
Seeded generation, texture caching, visibility pausing, viewport pausing,
scan-on-DOM-change, one-pass static rendering, `MAX_DPR = 2`. Removing any of these
turns a background into a performance problem.

### ⚠️ IMPL-5 — Unique seed per duplicated instance
When the same pattern appears more than once on screen, give each a distinct
`data-radiance-seed="unique-name"` so they drift differently but stay stable across
reloads.

### ⚠️ IMPL-6 — At most 3 concurrent visible dynamic surfaces
Beyond that, make the extras static.

---

## 10. Overrides — warn, confirm, annotate

Users can override anything on their own surfaces. They own their product. But an
override is a decision, not an accident, so it has to be made deliberately. Product
patterns are the exception: they have no override path (PRODUCT-2).

### AGENT-1 — Read this file before generating any Radiance code
Every time. Not from memory.

### AGENT-2 — Never customise anything unprompted
An AI must never change intensity, speed, spread, colour, grain, or blend on its own
initiative. Not to fit a layout. Not because it looked better. Not as an improvement.
If the user did not ask, use the pattern default.

### AGENT-3 — Never override silently
Every deviation from a rule in this document produces a warning **before** the change
is made, and waits for explicit confirmation.

### AGENT-4 — The warning format

Five parts, always:

> ⚠️ **Radiance rule `GRAIN-1`** — you're asking to change grain size from `1.0px` to `2.5px`.
>
> **What this changes:** grain is the most recognisable signature of Radiance. At
> `2.5px` it reads as a filter rather than film, and every other Radiance surface in
> the product will visibly mismatch this one.
>
> **What it costs:** this surface stops being Radiance. Anyone who inherits this code
> will reasonably assume the new value is the standard and copy it forward.
>
> **Compliant alternative:** if the surface feels too textured, switch `prominent` →
> `subtle`. That lowers perceived grain without leaving the language.
>
> **To proceed anyway:** confirm, and I'll apply it with a `RADIANCE-OVERRIDE`
> annotation so it stays auditable.

### AGENT-5 — Annotate every approved override

```js
/* RADIANCE-OVERRIDE: GRAIN-1 — grain size 2.5px (locked value: 1.0px)
   Approved by: <name>   Date: <YYYY-MM-DD>
   Reason: <why, in one line>
   This surface no longer matches the Radiance language. See RULES.md §4. */
```

The annotation is not bureaucracy. It is how the next person — or the next AI —
knows this was a decision rather than a mistake, and can find out who to ask.

### AGENT-6 — Point people at the pattern library, not the source
When someone is choosing a pattern, send them to the pattern library. Reading
`radiance-renderer.js` to pick a background is how people end up editing it.

### AGENT-7 — Say when Radiance can't do something
If a request is outside the language, say so in one sentence and offer the nearest
real option. Do not approximate, and do not quietly deliver something adjacent.

---

## 11. Quick reference

```html
<!-- The default. Use this when nothing else is specified. -->
<div class="radiance-local" data-radiance-pattern="top-wash-subtle-dynamic-fast"></div>

<!-- All five patterns -->
data-radiance-pattern="right-wash-subtle-dynamic-slow"
data-radiance-pattern="left-wash-subtle-dynamic-slow"
data-radiance-pattern="neutral-subtle-dynamic-slow"
data-radiance-pattern="top-wash-subtle-dynamic-fast"
data-radiance-pattern="bottom-wash-subtle-dynamic-slow"

<!-- Prominent, for covers and heroes -->
data-radiance-pattern="neutral-prominent-dynamic-fast"

<!-- Static, for small surfaces and locked frames -->
data-radiance-pattern="top-wash-subtle-static"

<!-- Duplicated instances need distinct seeds -->
<div class="radiance-local"
     data-radiance-pattern="neutral-subtle-dynamic-slow"
     data-radiance-seed="modal-upgrade"></div>

<!-- A host that is not white: the base is the host's colour -->
<div class="radiance-local"
     data-radiance-pattern="neutral-subtle-dynamic-slow"
     data-radiance-base="#F6F7F9"></div>

<!-- Product patterns: the product's name, nothing else.
     Each sits in its recipe's markup - see products/<id>/README.md. -->
data-radiance-pattern="signup"
data-radiance-pattern="home"
data-radiance-pattern="spotterx"      data-radiance-state="idle|reasoning|answered"
data-radiance-pattern="liveboard"     data-radiance-state="idle|reasoning|answered"
```

Theme comes from `data-radiance-appearance="light|dark"`, set by your product's
theme logic. Do not bake it into the pattern name unless the surface is genuinely
theme-independent.

Run `node tools/radiance-lint.mjs` to check an implementation against this file.

---

## 12. Product patterns — fixed

Product patterns are ThoughtSpot's finished screens, captured as Radiance patterns so
that they can be applied, recreated and reviewed exactly. They are the 🔐 **FIXED**
tier: never adjusted, never overridden, changed only by the Radiance admin.

| Pattern | Product | Built on | Recipe | Base (light / dark) |
|---|---|---|---|---|
| `signup` | Sign up / sign in | `right-wash`, prominent, fast (`1.02`) | [`products/signup`](products/signup/README.md): markup only | `#FFFFFF` / `#1A1B1E` |
| `home` | Home page hero | `top-wash`, subtle, fast (`1.86` light, `1.72` dark) | [`products/home`](products/home/README.md): `radiance-home.css` | `#FFFFFF` / `#131416` |
| `spotterx` | SpotterX, Single Agent Home | The Spotter engine | [`products/spotterx`](products/spotterx/README.md): `radiance-spotterx.css` | `#FFFFFF` / `#131416` |
| `liveboard` | Liveboard, with its Spotter panel | The Spotter engine | [`products/liveboard`](products/liveboard/README.md): `radiance-liveboard.css` | `#FFFFFF` / `#131416` |

Each one is live on its real product screen in [`previews/`](previews/), and in the
[pattern library](patterns/).

### 🔐 PRODUCT-1 — A product screen uses its product pattern
Building, rebuilding or prototyping one of these screens, or asked for "the Radiance
from" one of them, use its product pattern and its recipe exactly as the product's
README shows. That holds when the request never mentions Radiance: a new Home page
prototype gets `home`, because the Home page only ever looks one way. Name the
pattern you used.

### 🔐 PRODUCT-2 — No adjustment, no override
A product pattern takes its name, its theme (`data-radiance-appearance`) and, for the
Spotter products, its state (PRODUCT-4). Nothing else. Every tuning attribute
(prominence, spread, speed, speed-scale, seed, layout, intensity, dark-glow, variant,
motion and base) is ignored, and the renderer warns (`[Radiance PRODUCT-2]`).

There is no override path, because a request to change a product pattern is really
one of two things:

- **A new surface with a different look.** Start from the template the product is
  built on (the table above) and adjust that under §8. Say so: "`signup` is fixed, so
  I started from `right-wash-prominent-dynamic-fast` and set prominence to 120%."
- **A change to the product itself.** Only the Radiance admin makes it (PRODUCT-5).
  Point the person there, and change nothing.

### 🔐 PRODUCT-3 — The recipe is part of the pattern
Some products carry part of their pattern on the page. Home's hero adds a glow layer
and the field's bleed and fade; the renderer draws its colour at the hero's strength.
The Spotter products add the fade and the after-answer retreat. Every recipe carries
the tone lift and the fine noise at the language's values, over the language's one
grain (GRAIN-6). Use
the product's recipe (`products/<id>/radiance-<id>.css`) unedited, with its markup
exactly. The recipes' filters, blend modes, gradients and noise tiles are sanctioned
for those products only. They set no precedent under BLEND-3, GRAIN-5 or IMPL-3.

### 🔐 PRODUCT-4 — States belong to the Spotter products
`spotterx` and `liveboard` follow Spotter's lifecycle through `data-radiance-state`:

| State | When | The field |
|---|---|---|
| `idle` | The default, and every new conversation | Rests along the top edge, drifting slowly |
| `reasoning` | From send until the answer lands | Brightens, and breathes and drifts faster |
| `answered` | 530ms after the answer lands, once per conversation | Calms, and retreats toward the top edge |

The product sets the state from its own lifecycle. Nothing else drives it: not
hover, not scroll, not a timer. This is the one sanctioned exception to MOTION-1, and
it belongs to these two products. Templates, `signup` and `home` never take a state.
An unknown state renders as `idle` and warns (`[Radiance PRODUCT-4]`).

### 🔐 PRODUCT-5 — Only the Radiance admin changes a product pattern
A product pattern's values live in the renderer's `PRODUCT_PATTERNS` and the product's
recipe, mirrored in `radiance.tokens.json`, `products/manifest.json` and
`products/<id>/product.json`. The Radiance admin (vinayakr-cpu) changes them, in this
repository, all together. Never edit a product's values or recipe in a consuming
project, and never fork one into a new "product pattern". New product patterns are
added here by the admin, from a finished product screen.

The admin's Spotter lab (`spotter-lab/`) previews a change to SpotterX and
Liveboard on one surface, through `RadianceLanguageRenderer.admin`, and changes
nothing. Nothing outside `spotter-lab/` may call that hook; the linter fails it.
