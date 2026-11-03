# Radiance (vendored)

Radiance is ThoughtSpot's AI identity language: an animated background layer on top of Radiant. Its source is the Radiance repo (github.com/vinayakr-cpu/radiance-language, private), owned by the Radiance admin. RadiantPlay ships a copy so designer forks can use it without access to that repo.

`manifest.json` records the source commit, the Radiance version and a sha256 for every vendored file:

| File | From the Radiance repo |
|---|---|
| `radiance-renderer.js` | `renderer/radiance-renderer.js`, the one renderer every surface uses |
| `radiance-home.css`, `radiance-spotterx.css`, `radiance-liveboard.css` | `products/<id>/radiance-<id>.css`, the fixed recipes for those product patterns (`signup` has none) |
| `scripts/radiance/upstream/` | `tools/radiance-lint.mjs`, `radiance.tokens.json` and `RULES.md`, so `npm run radiance:lint` works offline |

## Rules

- Never edit these files. Radiance forbids editing a copy of the renderer or a product recipe (RULES.md IMPL-1, PRODUCT-3, PRODUCT-5). `npm run radiance:check` (also part of `npm run build:strict`) fails if any file differs from the manifest.
- Forks get updates through `/rp-sync-upstream`. A sync always takes upstream's version of these files.
- Use them through `src/app-chrome/RadianceBackground/` (the `RadianceBackground` component). Guidance for Claude is in `.claude/skills/rp-radiance/SKILL.md`.

## Updating (maintainer only)

```bash
npm run radiance:update                        # clones the Radiance repo with gh (needs access)
npm run radiance:update -- --from <checkout>   # or copies from a local checkout
```

It copies the files, writes `manifest.json`, sets `VENDOR_VERSION` in `RadianceBackground.tsx` to the Radiance version plus the commit (for example `2.0.0-fe8c0cd`) so browser caches bust, and lints `src/`. Commit the result with a changelog line.

The Radiance lint reports this folder's renderer as a copy (IMPL-1) when pointed at it directly. That finding takes no `RADIANCE-OVERRIDE`, and an annotation would mean editing the file. The lint's own folder walk skips any `vendor/` folder, so `npm run radiance:lint` over `src/` or the whole repo never reads it, and the manifest check stands in for the byte-identity Radiance asks for.
