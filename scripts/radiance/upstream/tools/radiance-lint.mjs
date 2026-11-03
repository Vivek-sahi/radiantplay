#!/usr/bin/env node
/**
 * Radiance language linter.
 *
 * Checks an implementation against RULES.md and radiance.tokens.json.
 * No dependencies. Exits 1 on errors so it drops into CI unchanged.
 *
 *   node tools/radiance-lint.mjs              # whole repo
 *   node tools/radiance-lint.mjs src/         # one directory
 *   node tools/radiance-lint.mjs --quiet      # errors only
 *
 * A `RADIANCE-OVERRIDE` comment within 6 lines above a finding marks it as an
 * acknowledged deviation (RULES.md AGENT-5) rather than a failure. Product
 * patterns have no override path (PRODUCT-2), so their findings never are.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");

const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const targets = args.filter((a) => !a.startsWith("--"));
const roots = (targets.length ? targets : ["."]).map((t) => path.resolve(process.cwd(), t));

const SKIP_DIRS = new Set([
    "node_modules", ".git", ".vercel", "dist", "build", "out",
    "coverage", ".next", ".nuxt", ".cache", "vendor"
]);
const EXTENSIONS = new Set([
    ".html", ".htm", ".css", ".scss", ".js", ".mjs", ".cjs",
    ".jsx", ".ts", ".tsx", ".vue", ".svelte"
]);

// ---------------------------------------------------------------- tokens

let tokens;
try {
    tokens = JSON.parse(fs.readFileSync(path.join(REPO, "radiance.tokens.json"), "utf8"));
} catch (error) {
    console.error(`Cannot read radiance.tokens.json: ${error.message}`);
    process.exit(2);
}

// The canonical renderer (renderer/radiance-renderer.js), as the tokens name it.
const CANONICAL_RENDERER = path.join(REPO, tokens.renderer?.path || path.join("renderer", "radiance-renderer.js"));

const allowedRgb = new Set();
const addRgb = (rgb) => allowedRgb.add(rgb.join(","));

for (const group of ["light", "lightVeil", "dark", "darkVeil"]) {
    for (const entry of Object.values(tokens.palette[group])) addRgb(entry.rgb);
}
// Base surfaces and the neutral/transparent stops the composition legitimately uses.
[[255, 255, 255], [26, 27, 30], [0, 0, 0]].forEach(addRgb);

// Product patterns (RULES.md section 12): fixed, admin-owned.
const PRODUCTS = tokens.products?.patterns || {};
const PRODUCT_NAMES = Object.keys(PRODUCTS);
const PRODUCT_LOCKED = (tokens.products?.lockedAttributes || []).map((a) => a.replace(/^data-radiance-/, ""));
const PRODUCT_STATES = tokens.products?.states?.values || [];
const STATE_ENGINES = tokens.products?.states?.engines || [];
// A product's locked base is part of its pattern, so it is a legitimate colour.
for (const product of Object.values(PRODUCTS)) {
    for (const hex of Object.values(product.base || {})) {
        const rgb = hexToRgb(hex);
        if (rgb) addRgb(rgb);
    }
}
// The canonical product recipes, by file name: part of the language, like the
// renderer. A copy elsewhere must stay byte-identical (PRODUCT-3, PRODUCT-5).
const RECIPES = new Map();
for (const [id, product] of Object.entries(PRODUCTS)) {
    if (product.css) RECIPES.set(path.basename(product.css), { id, file: path.join(REPO, product.css) });
}

const PATTERN_NAMES = Object.keys(tokens.patterns);
const CANONICAL_SPEEDS = new Set();
for (const p of Object.values(tokens.patterns)) {
    CANONICAL_SPEEDS.add(p.speeds.slow);
    CANONICAL_SPEEDS.add(p.speeds.fast);
}
const SPEED_MIN = tokens.ranges.speed.min;
const SPEED_MAX = tokens.ranges.speed.max;

// Percentage adjustments: attribute -> {min, max, rule}, straight from the tokens.
const ADJUSTMENTS = Object.entries(tokens.adjustments || {})
    .filter(([, spec]) => spec && spec.attribute && typeof spec.min === "number")
    .map(([name, spec]) => ({
        name,
        attribute: spec.attribute.replace(/^data-radiance-/, ""),
        min: spec.min,
        max: spec.max,
        rule: spec.rule
    }));

function parseAdjustment(raw) {
    const text = String(raw).trim();
    const value = Number(text.replace("%", "").trim());
    if (!Number.isFinite(value) || value <= 0) return null;
    if (text.includes("%") || value > 5) return value / 100;
    return value;
}

// ---------------------------------------------------------------- findings

const findings = [];
let scanned = 0;

function report(level, rule, file, line, message) {
    const relative = path.relative(REPO, file);
    const display = !relative || relative.startsWith("..") ? file : relative;
    findings.push({ level, rule, file: display, line, message });
}

function isAcknowledged(lines, index) {
    for (let i = Math.max(0, index - 6); i <= index; i += 1) {
        if (lines[i] && lines[i].includes("RADIANCE-OVERRIDE")) return true;
    }
    return false;
}

function add(level, rule, file, lines, index, message) {
    if (isAcknowledged(lines, index)) {
        report("ack", rule, file, index + 1, message);
        return;
    }
    report(level, rule, file, index + 1, message);
}

// ---------------------------------------------------------------- helpers

function hexToRgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function nearestPalette(rgb) {
    let best = null;
    let bestDistance = Infinity;
    for (const key of allowedRgb) {
        const other = key.split(",").map(Number);
        const d = Math.hypot(rgb[0] - other[0], rgb[1] - other[1], rgb[2] - other[2]);
        if (d < bestDistance) {
            bestDistance = d;
            best = other;
        }
    }
    return { rgb: best, distance: bestDistance };
}

function toHex(rgb) {
    return "#" + rgb.map((v) => v.toString(16).padStart(2, "0").toUpperCase()).join("");
}

// SURFACE-1: a base is an opaque colour - hex without alpha (or with ff), rgb(),
// or rgba()/hsla() at alpha 1. Named colours other than transparent pass.
function isOpaqueColour(raw) {
    const value = String(raw).trim().toLowerCase();
    if (!value || value === "transparent") return false;
    if (value.startsWith("#")) {
        const hex = value.slice(1);
        if (!/^[0-9a-f]+$/.test(hex) || ![3, 4, 6, 8].includes(hex.length)) return false;
        if (hex.length === 4) return hex[3] === "f";
        if (hex.length === 8) return hex.slice(6) === "ff";
        return true;
    }
    const alpha = value.match(/^(?:rgba?|hsla?)\([^)]*[,/]\s*([\d.]+%?)\s*\)$/);
    if (alpha && (value.startsWith("rgba") || value.startsWith("hsla") || value.includes("/"))) {
        const a = alpha[1].endsWith("%") ? Number(alpha[1].slice(0, -1)) / 100 : Number(alpha[1]);
        return a >= 1;
    }
    return true;
}

// Base declarations name the host's colour, not a Radiance colour (SURFACE-1),
// so COLOR-1 does not read them.
function stripBaseDeclarations(line) {
    return line
        .replace(/data-radiance-base\s*=\s*["'][^"']*["']/g, "")
        .replace(/--radiance-base\s*:\s*[^;"']+;?/g, "");
}

// ---------------------------------------------------------------- checks

// The body of `const NAME = { ... };` in the renderer, by brace matching.
function objectBlock(src, name) {
    const start = src.indexOf(`const ${name} = {`);
    if (start < 0) return null;
    let depth = 0;
    for (let i = src.indexOf("{", start); i < src.length; i += 1) {
        if (src[i] === "{") depth += 1;
        else if (src[i] === "}") {
            depth -= 1;
            if (depth === 0) return src.slice(start, i + 1);
        }
    }
    return null;
}

// One entry of an object block (`key: { ... }`), by brace matching.
function entryBlock(block, key) {
    const match = block.match(new RegExp(`\\b${key}:\\s*\\{`));
    if (!match) return null;
    let depth = 0;
    for (let i = match.index + match[0].length - 1; i < block.length; i += 1) {
        if (block[i] === "{") depth += 1;
        else if (block[i] === "}") {
            depth -= 1;
            if (depth === 0) return block.slice(match.index, i + 1);
        }
    }
    return null;
}

function checkProductsAgree(src) {
    const block = objectBlock(src, "PRODUCT_PATTERNS");
    if (!block) {
        if (PRODUCT_NAMES.length) {
            report("error", "PRODUCT-5", CANONICAL_RENDERER, 0,
                "radiance.tokens.json lists product patterns, but the renderer has no PRODUCT_PATTERNS.");
        }
        return;
    }
    const fail = (message) => report("error", "PRODUCT-5", CANONICAL_RENDERER, 0, message);
    for (const [id, spec] of Object.entries(PRODUCTS)) {
        const entry = entryBlock(block, id);
        if (!entry) {
            fail(`Product pattern "${id}" is in radiance.tokens.json but missing from the renderer's PRODUCT_PATTERNS.`);
            continue;
        }
        const field = (name) => (entry.match(new RegExp(`\\b${name}:\\s*"([^"]*)"`)) || [])[1];
        for (const name of ["engine", "layout", "intensity", "seed", "film"]) {
            if (spec[name] === undefined) continue;
            if (field(name) !== spec[name]) {
                fail(`Product "${id}" ${name}: renderer "${field(name)}", tokens "${spec[name]}".`);
            }
        }
        for (const theme of ["light", "dark"]) {
            const base = (entry.match(new RegExp(`base:\\s*\\{[^}]*${theme}:\\s*"([^"]+)"`)) || [])[1];
            if (!base || base.toLowerCase() !== String(spec.base?.[theme]).toLowerCase()) {
                fail(`Product "${id}" ${theme} base: renderer "${base}", tokens "${spec.base?.[theme]}".`);
            }
            if (spec.speed) {
                const speed = (entry.match(new RegExp(`speed:\\s*\\{[^}]*${theme}:\\s*([\\d.]+)`)) || [])[1];
                if (Number(speed) !== spec.speed[theme]) {
                    fail(`Product "${id}" ${theme} speed: renderer ${speed}, tokens ${spec.speed[theme]}.`);
                }
            }
            if (spec.fieldOpacity) {
                const opacity = (entry.match(new RegExp(`fieldOpacity:\\s*\\{[^}]*${theme}:\\s*([\\d.]+)`)) || [])[1];
                if (Number(opacity) !== spec.fieldOpacity[theme]) {
                    fail(`Product "${id}" ${theme} colour strength: renderer ${opacity}, tokens ${spec.fieldOpacity[theme]}.`);
                }
            }
        }
    }
    for (const match of block.matchAll(/^\s{8}([a-z]+):\s*\{/gm)) {
        if (!PRODUCTS[match[1]]) fail(`The renderer has product pattern "${match[1]}", which radiance.tokens.json does not list.`);
    }

    // The manifest and each product.json mirror the same values.
    let manifest = null;
    try {
        manifest = JSON.parse(fs.readFileSync(path.join(REPO, "products", "manifest.json"), "utf8"));
    } catch { /* no manifest: nothing to compare */ }
    const listed = new Set((manifest?.products || []).map((entry) => entry.id));
    for (const [id, spec] of Object.entries(PRODUCTS)) {
        if (manifest && !listed.has(id)) fail(`products/manifest.json does not list product pattern "${id}".`);
        const file = path.join(REPO, "products", id, "product.json");
        let product;
        try {
            product = JSON.parse(fs.readFileSync(file, "utf8"));
        } catch {
            fail(`products/${id}/product.json is missing or not valid JSON.`);
            continue;
        }
        if (product.engine !== spec.engine) fail(`products/${id}/product.json engine "${product.engine}" differs from the tokens ("${spec.engine}").`);
        for (const theme of ["light", "dark"]) {
            if (String(product.base?.[theme]).toLowerCase() !== String(spec.base?.[theme]).toLowerCase()) {
                fail(`products/${id}/product.json ${theme} base "${product.base?.[theme]}" differs from the tokens ("${spec.base?.[theme]}").`);
            }
        }
    }
}

function checkSourceIntegrity() {
    let src;
    try {
        src = fs.readFileSync(CANONICAL_RENDERER, "utf8");
    } catch {
        return; // linting a consuming repo, not this one
    }
    const lines = src.split("\n");

    const version = src.match(/RADIANCE_VERSION\s*=\s*"([^"]+)"/);
    if (tokens.renderer?.version && (!version || version[1] !== tokens.renderer.version)) {
        report("error", "IMPL-1", CANONICAL_RENDERER, 0,
            `Renderer version ${version ? version[1] : "(none)"} does not match radiance.tokens.json (${tokens.renderer.version}).`);
    }

    const saturation = src.match(/GRAIN_MASK_SATURATION\s*=\s*([\d.]+)/);
    if (saturation && tokens.grain.maskSaturation !== undefined && Number(saturation[1]) !== tokens.grain.maskSaturation) {
        report("error", "GRAIN-4", CANONICAL_RENDERER, 0,
            `Renderer grain mask saturation ${saturation[1]} does not match radiance.tokens.json (${tokens.grain.maskSaturation}).`);
    }

    const film = objectBlock(src, "FILM");
    if (film && tokens.film) {
        for (const theme of ["light", "dark"]) {
            const line = (film.match(new RegExp(`${theme}:\\s*\\{[^}]*\\}`)) || [])[0] || "";
            const num = (name) => {
                const m = line.match(new RegExp(`\\b${name}:\\s*([\\d.\\s*]+?)\\s*[,}]`));
                if (!m) return NaN;
                return m[1].split("*").reduce((product, part) => product * Number(part.trim()), 1);
            };
            const expect = tokens.film[theme];
            const pairs = [["grain", expect.grain], ["dither", expect.dither], ["overlay", expect.fineNoise],
                ["saturate", expect.saturate], ["contrast", expect.contrast]];
            for (const [name, value] of pairs) {
                if (Math.abs(num(name) - value) > 1e-6) {
                    report("error", "GRAIN-2", CANONICAL_RENDERER, 0,
                        `Renderer film ${theme}.${name} is ${num(name)}, radiance.tokens.json says ${value}.`);
                }
            }
        }
    }

    // GRAIN-6: one grain per theme. The renderer has one film (FILM); no
    // engine keeps a grain of its own.
    if (/const\s+SBG_GRAIN\s*=/.test(src)) {
        report("error", "GRAIN-6", CANONICAL_RENDERER, 0,
            "The renderer has a second grain (SBG_GRAIN). Every surface draws the language's one grain per theme (FILM).");
    }

    checkProductsAgree(src);

    const grain = src.match(/RADIANCE_FILM_GRAIN_SIZE\s*=\s*([\d.]+)/);
    if (grain && Number(grain[1]) !== tokens.grain.size) {
        report("error", "GRAIN-1", CANONICAL_RENDERER, 0,
            `Renderer grain size ${grain[1]} does not match radiance.tokens.json (${tokens.grain.size}). The renderer and tokens must agree.`);
    }

    const surface = src.match(/DARK_SURFACE\s*=\s*"([^"]+)"/);
    if (surface && surface[1].toLowerCase() !== tokens.surface.dark.toLowerCase()) {
        report("error", "SURFACE-1", CANONICAL_RENDERER, 0,
            `Renderer dark surface ${surface[1]} does not match radiance.tokens.json (${tokens.surface.dark}).`);
    }

    for (const [name, spec] of Object.entries(tokens.patterns)) {
        const re = new RegExp(`"${name}":\\s*\\{[^}]*slow:\\s*([\\d.]+),\\s*fast:\\s*([\\d.]+)`);
        const match = src.match(re);
        if (!match) {
            report("error", "PLACE-1", CANONICAL_RENDERER, 0,
                `Pattern "${name}" is in radiance.tokens.json but missing from the renderer's RADIANCE_PATTERNS.`);
            continue;
        }
        if (Number(match[1]) !== spec.speeds.slow || Number(match[2]) !== spec.speeds.fast) {
            report("error", "MOTION-6", CANONICAL_RENDERER, 0,
                `Pattern "${name}" speeds differ: renderer ${match[1]}/${match[2]}, tokens ${spec.speeds.slow}/${spec.speeds.fast}.`);
        }
    }

    const maxDpr = src.match(/MAX_DPR\s*=\s*([\d.]+)/);
    if (maxDpr && Number(maxDpr[1]) !== tokens.ranges.maxDpr) {
        report("error", "IMPL-4", CANONICAL_RENDERER, 0,
            `MAX_DPR is ${maxDpr[1]}, tokens say ${tokens.ranges.maxDpr}.`);
    }

    if (!/prefersReducedMotion/.test(src)) {
        report("error", "MOTION-7", CANONICAL_RENDERER, 0,
            "Renderer no longer honours prefers-reduced-motion.");
    }
    void lines;
}

// A frozen file kept in this repository (the 1.0 renderer in renderer/v1/, and
// the pre-2.0 product files in compare/reference/) is history: it is sanctioned
// only while it is byte-identical to what was frozen, and nothing else is
// checked in it.
function checkFrozen(file, src) {
    const resolved = path.resolve(file);
    const frozen = (tokens.frozen || []).find((entry) => path.join(REPO, entry.path) === resolved);
    if (!frozen) return false;
    const digest = crypto.createHash("sha256").update(src).digest("hex");
    if (digest !== frozen.sha256) {
        report("error", "IMPL-1", file, 1,
            `The frozen copy of ${frozen.name} has been edited. It must stay byte-for-byte as it was frozen; changes belong in renderer/radiance-renderer.js and the product recipes.`);
    }
    return true;
}

function checkForkedRenderer(file, src) {
    const resolved = path.resolve(file);
    if (resolved === CANONICAL_RENDERER) return false;
    if (resolved === path.resolve(fileURLToPath(import.meta.url))) return false;
    const looksLikeRenderer = /class\s+RadianceSurface\s*\{/.test(src)
        && /RADIANCE_FILM_GRAIN_SIZE\s*=/.test(src);
    if (!looksLikeRenderer) return false;

    let message = "This is a copy of radiance-renderer.js. Import the canonical renderer instead (RULES.md IMPL-1).";
    try {
        const canonical = fs.readFileSync(CANONICAL_RENDERER, "utf8");
        message += src === canonical
            ? " The copy is currently identical — it will not stay that way."
            : " The copy has ALREADY DIVERGED from the canonical renderer.";
    } catch { /* canonical not present */ }

    report("error", "IMPL-1", file, 1, message);
    return true;
}

// A colour only matters when it is painted into a Radiance surface. Matching the
// bare word "radiance" also catches prose ("Radiance Pattern Library") and label
// colours, which are not part of the language.
// Deliberately narrow. Only `.radiance-local` hosts the canvas; other radiance-*
// selectors are the surrounding chrome, whose colours are not part of the language.
const PAINT_CONTEXT = /(radiance-local|data-radiance|RADIANCE_[A-Z_]|addColorStop|createRadialGradient|createLinearGradient)/;

// The blob-config shape is Radiance-specific wherever it appears.
const BLOB_COLOR = /\bcolor\s*:\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]/g;
const BLOB_CONTEXT = /(anchorX|anchorY|orbitX|orbitY|\bradius\b)/;

// The bases a file declares (data-radiance-base, --radiance-base). A host's
// base colour is legitimate anywhere in that file, e.g. as the fallback shown
// before the canvas paints (SURFACE-1).
function declaredBases(lines) {
    const bases = new Set();
    const pattern = /(?:data-radiance-base\s*=\s*["']|--radiance-base\s*:\s*)(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;
    for (const line of lines) {
        for (const m of line.matchAll(pattern)) {
            const rgb = m[1].startsWith("#")
                ? hexToRgb(m[1])
                : (m[1].match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/) || []).slice(1, 4).map(Number);
            if (rgb && rgb.length === 3) bases.add(rgb.join(","));
        }
    }
    return bases;
}

function checkColors(file, lines) {
    let contextWindow = 0;
    const bases = declaredBases(lines);

    lines.forEach((line, index) => {
        if (PAINT_CONTEXT.test(line)) contextWindow = 5;
        else if (/[}]|<\/|^\s*$/.test(line)) contextWindow = 0;
        else if (contextWindow > 0) contextWindow -= 1;

        if (BLOB_CONTEXT.test(line)) {
            for (const m of line.matchAll(BLOB_COLOR)) {
                const rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
                if (allowedRgb.has(rgb.join(","))) continue;
                const near = nearestPalette(rgb);
                add("error", "COLOR-1", file, lines, index,
                    `Blob colour [${rgb.join(", ")}] (${toHex(rgb)}) is not a Radiance colour.`
                    + (near.distance < 40 ? ` Closest is ${toHex(near.rgb)} — looks hand-matched.` : ""));
            }
        }

        if (contextWindow === 0) return;
        if (/^\s*(\/\/|\*|<!--)/.test(line)) return;

        const candidates = [];
        const text = stripBaseDeclarations(line);
        for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) candidates.push({ raw: m[0], rgb: hexToRgb(m[0]) });
        for (const m of text.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
            candidates.push({ raw: m[0] + ")", rgb: [Number(m[1]), Number(m[2]), Number(m[3])] });
        }

        for (const c of candidates) {
            if (!c.rgb) continue;
            if (allowedRgb.has(c.rgb.join(",")) || bases.has(c.rgb.join(","))) continue;
            const near = nearestPalette(c.rgb);
            const detail = near.distance < 40
                ? ` It is very close to ${toHex(near.rgb)} — looks like a hand-matched approximation, which is exactly what COLOR-1 prevents.`
                : "";
            add("error", "COLOR-1", file, lines, index,
                `${c.raw} is not a Radiance colour.${detail} See radiance.tokens.json.`);
        }
    });
}

function checkAttributes(file, src, lines) {
    // Each tag or element carrying data-radiance-* attributes.
    for (const match of src.matchAll(/<[a-zA-Z][^>]*data-radiance-[^>]*>/g)) {
        const tag = match[0];
        const index = src.slice(0, match.index).split("\n").length - 1;
        const attr = (name) => {
            const m = tag.match(new RegExp(`data-radiance-${name}\\s*=\\s*["']([^"']*)["']`));
            return m ? m[1] : null;
        };

        const pattern = attr("pattern");
        const layout = attr("layout");
        const intensity = attr("intensity");
        const darkGlow = attr("dark-glow");
        const speed = attr("speed");
        const state = attr("state");
        const base = attr("base");
        const productId = pattern ? PRODUCT_NAMES.find((id) => id === pattern.trim().toLowerCase()) : null;

        if (productId) {
            // PRODUCT-2: a product pattern takes its name, theme and state, nothing else.
            const locked = PRODUCT_LOCKED.filter((name) => attr(name) !== null);
            if (locked.length) {
                report("error", "PRODUCT-2", file, index + 1,
                    `data-radiance-pattern="${productId}" is a fixed product pattern, so `
                    + `${locked.map((name) => `data-radiance-${name}`).join(", ")} ${locked.length === 1 ? "is" : "are"} ignored. `
                    + "Remove it. To customise, start from a template (RULES.md section 12).");
            }
            const engine = PRODUCTS[productId].engine;
            if (state !== null && !STATE_ENGINES.includes(engine)) {
                report("error", "PRODUCT-4", file, index + 1,
                    `data-radiance-state on "${productId}": only the Spotter product patterns take a state.`);
            } else if (state !== null && !PRODUCT_STATES.includes(state)) {
                report("error", "PRODUCT-4", file, index + 1,
                    `data-radiance-state="${state}" is not a state. Use ${PRODUCT_STATES.join(", ")}.`);
            }
            continue;
        }

        if (state !== null) {
            add("error", "PRODUCT-4", file, lines, index,
                "data-radiance-state on a template. States belong to the Spotter product patterns; templates never take one (MOTION-1).");
        }

        if (base !== null && !isOpaqueColour(base)) {
            add("error", "SURFACE-1", file, lines, index,
                `data-radiance-base="${base}" is not an opaque colour. The base is the host's own, opaque background colour.`);
        }

        if (pattern) {
            const placement = PATTERN_NAMES.find((n) => pattern.startsWith(n))
                || (/^(right|left|top|bottom|neutral|modal|developer)\b/.test(pattern) ? pattern : null);
            if (!placement) {
                add("error", "PLACE-1", file, lines, index,
                    `Unknown pattern "${pattern}". Templates: ${PATTERN_NAMES.join(", ")}. Product patterns: ${PRODUCT_NAMES.join(", ")}.`);
            }
        } else if (layout) {
            add("warn", "PLACE-2", file, lines, index,
                "Hand-assembled data-radiance-* attributes. Prefer a single data-radiance-pattern — it prevents intensity/dark-glow drift.");
        }

        if (layout && !PATTERN_NAMES.includes(layout)
            && !["right", "left", "top", "bottom", "home-corners", "modal-balanced", "developer-sides"].includes(layout)) {
            add("error", "PLACE-1", file, lines, index,
                `Unknown layout "${layout}". Valid: ${PATTERN_NAMES.join(", ")}.`);
        }

        if (intensity && darkGlow && intensity !== darkGlow) {
            add("error", "INT-3", file, lines, index,
                `data-radiance-dark-glow="${darkGlow}" does not match data-radiance-intensity="${intensity}". Dark mode silently renders a different falloff.`);
        }

        for (const adjust of ADJUSTMENTS) {
            const raw = attr(adjust.attribute);
            if (raw === null) continue;
            const scale = parseAdjustment(raw);
            if (scale === null) {
                add("error", adjust.rule, file, lines, index,
                    `data-radiance-${adjust.attribute}="${raw}" is not a valid percentage. Use a form like "120%".`);
                continue;
            }
            if (!String(raw).includes("%")) {
                add("warn", adjust.rule, file, lines, index,
                    `data-radiance-${adjust.attribute}="${raw}" works, but write it as "${Math.round(scale * 100)}%" — `
                    + "the percentage form is what the rules are written in and what a reviewer expects.");
            }
            if (scale < adjust.min || scale > adjust.max) {
                add("error", adjust.rule, file, lines, index,
                    `${adjust.name} at ${Math.round(scale * 100)}% is outside the Radiance range `
                    + `${Math.round(adjust.min * 100)}%-${Math.round(adjust.max * 100)}%. See RULES.md.`);
            }
        }

        if (speed !== null) {
            const value = Number(speed);
            if (!Number.isFinite(value)) {
                add("error", "MOTION-5", file, lines, index, `data-radiance-speed="${speed}" is not a number.`);
            } else if (value < SPEED_MIN || value > SPEED_MAX) {
                add("error", "MOTION-5", file, lines, index,
                    `Speed ${value} is outside the Radiance range ${SPEED_MIN.toFixed(1)}-${SPEED_MAX.toFixed(1)}.`);
            } else if (attr("speed-scale") !== null) {
                const scale = parseAdjustment(attr("speed-scale"));
                const effective = scale === null ? value : value * scale;
                if (effective < SPEED_MIN || effective > SPEED_MAX) {
                    add("error", "MOTION-5", file, lines, index,
                        `effective speed ${Math.round(effective * 1000) / 1000} `
                        + `(${value} x ${Math.round(scale * 100)}%) is outside the Radiance range `
                        + `${SPEED_MIN.toFixed(1)}-${SPEED_MAX.toFixed(1)}.`);
                }
            } else if (!CANONICAL_SPEEDS.has(value)) {
                add("warn", "MOTION-6", file, lines, index,
                    `Speed ${value} is not a canonical value. Use the pattern's slow or fast value, or record why this one differs.`);
            }
        }
    }
}

function checkBehaviour(file, lines) {
    lines.forEach((line, index) => {
        if (/radiance/i.test(line) && /(mousemove|pointermove|onScroll|"scroll"|'scroll'|mouseenter|onMouseMove)/.test(line)) {
            add("warn", "MOTION-1", file, lines, index,
                "Radiance may be bound to pointer or scroll input. Radiance motion is ambient and never responds to the user.");
        }
        if (/radiance/i.test(line) && /(linear-gradient|radial-gradient|conic-gradient)/.test(line)
            && !/radiance-surface|radiance-pyramid|pattern-|deck-|slide-/.test(line)) {
            add("warn", "IMPL-3", file, lines, index,
                "A gradient on a Radiance-named selector. If this imitates Radiance, use the renderer instead.");
        }
        const grain = line.match(/grain(?:Size|_size)?\s*[:=]\s*([\d.]+)/i);
        if (grain && Number(grain[1]) !== tokens.grain.size) {
            add("error", "GRAIN-1", file, lines, index,
                `Grain size ${grain[1]} — the locked value is ${tokens.grain.size}px.`);
        }
    });
}

function checkSeeds(file, src, lines) {
    const seen = new Map();
    for (const match of src.matchAll(/<[a-zA-Z][^>]*data-radiance-pattern\s*=\s*["']([^"']+)["'][^>]*>/g)) {
        const tag = match[0];
        const pattern = match[1];
        // A product pattern's seed is locked (PRODUCT-2).
        if (PRODUCT_NAMES.includes(pattern.trim().toLowerCase())) continue;
        const hasSeed = /data-radiance-seed/.test(tag);
        const index = src.slice(0, match.index).split("\n").length - 1;
        if (hasSeed) continue;
        const list = seen.get(pattern) || [];
        list.push(index);
        seen.set(pattern, list);
    }
    for (const [pattern, indices] of seen) {
        if (indices.length < 2) continue;
        add("warn", "IMPL-5", file, lines, indices[1],
            `"${pattern}" is used ${indices.length} times without data-radiance-seed. Identical seeds drift identically, which reads as a rendering bug.`);
    }
}

// GRAIN-6 in a recipe: its only noise is the language's fine noise, at the
// film's tile size and strength for the theme (multiply in light, screen in dark).
function checkRecipeFilm(file, src) {
    for (const match of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const body = match[2];
        if (!/feTurbulence/.test(body)) continue;
        const line = src.slice(0, match.index).split("\n").length + 1;
        const tile = (body.match(/background-size:\s*(\d+)px/) || [])[1];
        const blend = (body.match(/mix-blend-mode:\s*([a-z-]+)/) || [])[1];
        const opacity = Number((body.match(/(?:^|[;\s])opacity:\s*([\d.]+)/) || [])[1]);
        const theme = blend === "screen" ? "dark" : "light";
        const expected = tokens.film?.[theme]?.fineNoise;
        if (tile && tokens.film?.fineNoiseTilePx && Number(tile) !== tokens.film.fineNoiseTilePx) {
            report("error", "GRAIN-6", file, line,
                `A ${tile}px noise tile. The language has one fine noise, ${tokens.film.fineNoiseTilePx}px; nothing adds another.`);
        }
        if (Number.isFinite(opacity) && expected !== undefined && Math.abs(opacity - expected) > 1e-6) {
            report("error", "GRAIN-6", file, line,
                `Fine noise at ${opacity}; the ${theme} film is ${expected}. Every surface uses the one film.`);
        }
    }
}

// A product recipe (products/<id>/radiance-<id>.css) is part of its product
// pattern: the canonical file is the language's own, like the renderer, and a
// copy anywhere else must stay byte-identical (PRODUCT-3, PRODUCT-5).
function checkRecipe(file, src) {
    const recipe = RECIPES.get(path.basename(file));
    if (!recipe) return false;
    if (path.resolve(file) === recipe.file) {
        checkRecipeFilm(file, src);
        return true;
    }
    let canonical = null;
    try {
        canonical = fs.readFileSync(recipe.file, "utf8");
    } catch {
        return false; // the canonical recipe is not available here: lint it like any file
    }
    if (src !== canonical) {
        report("error", "PRODUCT-5", file, 1,
            `This copy of the "${recipe.id}" product recipe has diverged from ${path.relative(REPO, recipe.file)}. `
            + "Product recipes are used unedited; only the Radiance admin changes them, in the Radiance Language repository.");
    }
    return true;
}

// PRODUCT-5: RadianceLanguageRenderer.admin exists for the Radiance admin's
// Spotter lab (spotter-lab/ in this repository) and nothing else. It has no
// override path.
const ADMIN_DIR = path.join(REPO, "spotter-lab") + path.sep;
function checkAdminHook(file, lines) {
    if (path.resolve(file).startsWith(ADMIN_DIR)) return;
    lines.forEach((line, index) => {
        if (/RadianceLanguageRenderer\??\.admin\b|\b(tuneSpotter|resetSpotter|spotterDefaults)\s*\(/.test(line)) {
            report("error", "PRODUCT-5", file, index + 1,
                "RadianceLanguageRenderer.admin is for the Radiance admin's Spotter lab (spotter-lab/) only. "
                + "Product patterns take no tuning anywhere else (PRODUCT-2).");
        }
    });
}

// ---------------------------------------------------------------- walk

function walk(dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(full);
        } else if (EXTENSIONS.has(path.extname(entry.name))) {
            lintFile(full);
        }
    }
}

function lintFile(file) {
    let src;
    try {
        src = fs.readFileSync(file, "utf8");
    } catch {
        return;
    }
    if (src.length > 3_000_000) return;
    // The linter carries every rule pattern as a literal; skip it or it flags itself.
    if (path.resolve(file) === path.resolve(fileURLToPath(import.meta.url))) return;
    scanned += 1;

    if (checkFrozen(file, src)) return;
    if (checkForkedRenderer(file, src)) return;
    if (path.resolve(file) === CANONICAL_RENDERER) return;
    if (checkRecipe(file, src)) return;

    const lines = src.split("\n");
    checkAdminHook(file, lines);
    checkColors(file, lines);
    checkAttributes(file, src, lines);
    checkBehaviour(file, lines);
    checkSeeds(file, src, lines);
}

// ---------------------------------------------------------------- run

checkSourceIntegrity();
for (const root of roots) {
    const stat = fs.existsSync(root) ? fs.statSync(root) : null;
    if (!stat) {
        console.error(`No such path: ${root}`);
        process.exit(2);
    }
    if (stat.isDirectory()) walk(root);
    else lintFile(root);
}

const errors = findings.filter((f) => f.level === "error");
const warnings = findings.filter((f) => f.level === "warn");
const acknowledged = findings.filter((f) => f.level === "ack");

const LABEL = { error: "error", warn: " warn", ack: "  ack" };

function print(list) {
    const byFile = new Map();
    for (const f of list) {
        const arr = byFile.get(f.file) || [];
        arr.push(f);
        byFile.set(f.file, arr);
    }
    for (const [file, items] of byFile) {
        console.log(`\n${file}`);
        for (const f of items.sort((a, b) => a.line - b.line)) {
            console.log(`  ${LABEL[f.level]}  ${String(f.line).padStart(4)}  [${f.rule}]  ${f.message}`);
        }
    }
}

console.log(`Radiance lint — ${scanned} file${scanned === 1 ? "" : "s"} scanned against RULES.md`);

if (errors.length) print(errors);
if (warnings.length && !quiet) print(warnings);
if (acknowledged.length && !quiet) {
    console.log("\nAcknowledged overrides (RADIANCE-OVERRIDE annotated — informational):");
    print(acknowledged);
}

console.log(
    `\n${errors.length} error${errors.length === 1 ? "" : "s"}, `
    + `${warnings.length} warning${warnings.length === 1 ? "" : "s"}, `
    + `${acknowledged.length} acknowledged override${acknowledged.length === 1 ? "" : "s"}`
);

if (!errors.length && !warnings.length) console.log("Clean.");
if (errors.length) console.log("\nSee RULES.md for each rule, and §10 for the override protocol.");

process.exit(errors.length ? 1 : 0);
