# Radiance (vendored)

Radiance is ThoughtSpot's AI product identity language: an animated background layer on top of Radiant.

These files are an interim copy taken from the published site on 2026-10-12, version 2.0.0:

| File | Source |
|---|---|
| `radiance-renderer.js` | https://radiance-language.vercel.app/renderer/radiance-renderer.js |
| `radiance-home.css` | https://radiance-language.vercel.app/products/home/radiance-home.css (the fixed recipe for the "home" product pattern) |

Replace them from the Radiance repo (github.com/vinayakr-cpu/radiance-language, see its RULES.md and AGENTS.md) once access lands.

Do not edit these files. Update by replacing them with a newer copy. The app loads them from `src/app-chrome/RadianceBackground/`, which only renders the markup the renderer expects, so swapping a file needs no code change beyond bumping `VENDOR_VERSION` in `RadianceBackground.tsx`, which busts browser caches.
