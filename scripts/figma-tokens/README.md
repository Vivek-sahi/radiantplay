# Figma token sync

Keeps Radiant Play's tokens in step with the Radiant 3.0 Figma design system (`1QlRveXx4wppvDXyPVWUTK`). Figma is the source of truth.

Plan and decisions: `docs/2026-10-06-figma-token-sync-plan.md`.

## Files

| File | What it is |
|---|---|
| `rules.json` | Figma-to-ours name mapping and the decisions likely to change. Edit here, then re-run the diff |
| `snapshot/raw/*.json` | Variables as exported from Figma through the MCP (compact, see below) |
| `snapshot/variables.json` | Assembled from `raw/` by `build-snapshot.mjs`. Every variable with its Figma id, collection, type, scopes, description and per-mode value; aliases resolved |
| `snapshot/styles.json` | Text and effect styles, pulled by `pull-styles.mjs` through the REST API |
| `snapshot/meta.json` | When the snapshot was last pulled, kept apart so refreshes don't churn the other files |
| `pull-styles.mjs` | REST pull of text and effect styles |
| `build-snapshot.mjs` | Builds `variables.json` from `raw/`, checks counts and aliases |
| `diff.mjs` | Compares the snapshot with `src/tokens/*` and `src/styles/tokens.css` |

The snapshot lives here, not in `src/`, so it can never end up in the app bundle.

## Check for drift

```bash
npm run figma-tokens:diff              # summary and details
npm run figma-tokens:diff -- --summary # summary only
```

The diff reports per area: match, differs, Figma only, ours only. It also compares the TypeScript tokens (through the `css-variables.ts` generator) with the hand-written `tokens.css`, and the dark block with the `prefers-color-scheme` block.

## Refresh the snapshot

Two sources, because Figma's REST API for variables needs an Enterprise plan.

### 1. Text and effect styles (REST)

Needs `FIGMA_TOKEN` in `.env.local` (a personal access token with read access to file content; the same one `npm run sync-icons` uses).

```bash
npm run figma-tokens:pull-styles
```

Typography weights are read from the layers on the Typography spec frame that use each style, because Geist is a variable font and the text styles themselves don't record 550.

### 2. Variables (Figma MCP)

Run these three read-only scripts with the Figma MCP `use_figma` tool on file `1QlRveXx4wppvDXyPVWUTK`, and save each result verbatim. The MCP caps a response at 20 KB, which is why the export is split and compact.

**`snapshot/raw/primitives.json`**

```js
const hex = c => { const h = x => Math.round(x*255).toString(16).padStart(2,'0'); return '#'+h(c.r)+h(c.g)+h(c.b)+(c.a!==undefined&&c.a<1?h(c.a):''); };
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'Primitive');
const rows = [];
for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  const raw = v.valuesByMode[col.modes[0].modeId];
  rows.push([v.name, v.id.replace('VariableID:',''), v.resolvedType[0], (raw && typeof raw==='object' && 'r' in raw) ? hex(raw) : raw, v.scopes.join('+'), v.description || '']);
}
rows.sort((a,b) => a[0] < b[0] ? -1 : 1);
return JSON.stringify(rows);
```

**`snapshot/raw/theme.json`**

```js
const hex = c => { const h = x => Math.round(x*255).toString(16).padStart(2,'0'); return '#'+h(c.r)+h(c.g)+h(c.b)+(c.a!==undefined&&c.a<1?h(c.a):''); };
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'Theme');
const rows = [];
for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  const r = [v.name, v.id.replace('VariableID:',''), v.resolvedType[0], v.scopes.join('+')];
  for (const m of col.modes) {
    const raw = v.valuesByMode[m.modeId];
    if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') r.push('@' + raw.id.replace('VariableID:',''));
    else r.push((raw && typeof raw==='object' && 'r' in raw) ? hex(raw) : raw);
  }
  rows.push(r);
}
rows.sort((a,b) => a[0] < b[0] ? -1 : 1);
return JSON.stringify({ modes: col.modes.map(m=>m.name), rows });
```

**`snapshot/raw/descriptions.json`**

```js
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find(c => c.name === 'Theme');
const out = {};
for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  const e = {};
  if (v.description) e.d = v.description;
  if (v.codeSyntax && Object.keys(v.codeSyntax).length) e.c = v.codeSyntax;
  if (Object.keys(e).length) out[v.id.replace('VariableID:','')] = e;
}
return JSON.stringify(out);
```

Then check the collection sizes Figma reports (`getLocalVariableCollectionsAsync()` → `variableIds.length`) and update `EXPECTED` in `build-snapshot.mjs` if they changed.

### 3. Assemble and compare

```bash
node scripts/figma-tokens/build-snapshot.mjs
npm run figma-tokens:diff
```

Update `snapshot/meta.json` with the date of the pull.

## Notes

- No Figma variable has a code name (`codeSyntax`) set yet. When Figma adds them, `descriptions.json` picks them up and they become the seed for the developer handoff map.
- Figma IDs are kept so a later refresh can tell a renamed variable from one that was removed and re-added.
