---
description: Switch the Claude model used by AI-capable prototypes in this project. Run this before testing (Haiku) or before a demo (Sonnet/Opus).
---

## Switch LLM model

Follow these steps in order.

---

### 1. Find AI-capable init files

Run:
```
grep -rn "model: 'claude-" src/prototypes/ --include="*.js"
```

**If no results:** exit with this message and stop:

> No AI model configuration found in this project's prototypes. This command only applies to prototypes that make Claude API calls — currently Data Model Editor (SpotterModel). If you've added a new AI-capable prototype, make sure its init file uses `model: 'claude-...'` inside the API call body.

---

### 2. Extract current model and agent name per file

For each file found, collect:

**Current model** — the value after `model: '` on that line (e.g. `claude-haiku-4-5-20251001`)

**Agent name** — read line 2 of the file. The exported function name encodes the agent:
- `initSpotterModelCreate` or `initSpotterModelEdit` → **SpotterModel**
- `initSpotterViz` → **SpotterViz**
- `initSpotter` → **Spotter**
- Anything else → use the parent folder name as fallback

**File role** — infer from the filename:
- `init-create.js` → Create mode
- `init-edit.js` → Edit mode
- Other → use filename as-is

---

### 3. Check for disabled agent panel

Run:
```
grep -rn "spotterModel: false\|agentEnabled: false\|spotterviz: false" src/prototypes/ --include="*.tsx" --include="*.ts" --include="*.js"
```

For each match, note the file. You will warn about these in step 4 if the disabled prototype overlaps with an AI-capable init file.

---

### 4. Present current state

Print a summary table in this format:

```
AI agents found in this project:

  Agent          Mode     Current model               File
  ─────────────────────────────────────────────────────────────────────────────
  SpotterModel   Create   claude-haiku-4-5-20251001   SpotterModelCreate/init-create.js
  SpotterModel   Edit     claude-haiku-4-5-20251001   SpotterModelEdit/init-edit.js
```

If any have a disabled panel (from step 3), add a ⚠ warning on that row:
```
  SpotterModel   Create   claude-haiku-4-5-20251001   SpotterModelCreate/init-create.js  ⚠ agent panel disabled
```
And below the table, explain:
> ⚠ One or more agents have their panel disabled via `spotterModel: false` (or equivalent). Switching the model for these will have no visible effect until the panel is re-enabled.

**If only one agent is found:** skip step 5 and apply the model change to that file directly.

**If multiple agents are found:** ask which to update in step 5.

---

### 5. Ask which agent(s) to update (only if multiple found)

Ask:

> Which agent would you like to update?
>
> 1. All agents (apply same model to all)
> 2. SpotterModel — Create mode only
> 3. SpotterModel — Edit mode only
> [add rows for any other agents found]

Wait for the answer before continuing.

---

### 6. Resolve API key and fetch available models live

**Step 6a — Resolve the API key**

Check in this order:

1. Shell environment: run `echo $ANTHROPIC_API_KEY` — if non-empty and not a placeholder, note it as `SHELL_KEY`.
2. `.env.local` file: run `grep "^ANTHROPIC_API_KEY=" .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'"` — if non-empty and does not contain `placeholder` or `your_api_key`, note it as `FILE_KEY`.

**Resolve which key to use and whether `.env.local` needs updating:**

| Situation | Key to use | Action |
|---|---|---|
| Both found | `FILE_KEY` | No file action needed |
| Shell only, no `.env.local` or placeholder | `SHELL_KEY` | Write `SHELL_KEY` to `.env.local` so the Vite proxy works |
| File only, no shell key | `FILE_KEY` | No file action needed |
| Neither found | — | Ask the designer (see below) |

When writing to `.env.local` from the shell key, run:
```
echo "ANTHROPIC_API_KEY=<SHELL_KEY>" > .env.local
```

Inform the designer when this happens:
> Your API key has been saved to `.env.local` so the prototype's AI calls will work.

**If no valid key found from either source — ask the designer directly:**

> I need your Anthropic API key to fetch the available models and to enable AI in this prototype.
> You can get one at console.anthropic.com if you don't have one yet.
>
> Paste your API key:

Wait for their input. Then:
- Write it to `.env.local`: run `echo "ANTHROPIC_API_KEY=<key>" > .env.local`
- Use it for the fetch in step 6b

Do NOT show a hardcoded model list under any circumstances. The list must always come from the live API using a confirmed valid key.

**Step 6b — Fetch live model list**

Using the resolved key, run:
```
curl -s "https://api.anthropic.com/v1/models" \
  -H "x-api-key: <resolved_key>" \
  -H "anthropic-version: 2023-06-01"
```

If the response contains `"error"` or the HTTP status is not 200, the key is invalid. Tell the designer:

> That key doesn't seem to be valid — the Anthropic API returned an error. Please check the key and try again by re-running `/switch-model`.

Then stop. Do not proceed with an invalid key.

**Step 6c — Parse and display the model table**

Sort models by `created_at` descending (newest first). For each model extract `id`, `display_name`, and `created_at` (date portion only, `YYYY-MM-DD`).

Annotate known model families with a usage hint:
- model id contains `haiku`  → `Fastest · cheapest`
- model id contains `sonnet` → `Balanced speed + quality`
- model id contains `opus`   → `Most capable · slowest`
- anything else              → (leave blank)

Display the table:

```
Available models (fetched live · sorted newest first):

  #    Model ID                       Display Name              Released     Best for
  ────────────────────────────────────────────────────────────────────────────────────────
  1    claude-opus-4-7                Claude Opus 4.7           2026-04-14   Most capable · slowest
  2    claude-sonnet-4-6              Claude Sonnet 4.6         2026-02-17   Balanced speed + quality
  3    claude-haiku-4-5-20251001      Claude Haiku 4.5          2025-10-15   Fastest · cheapest
  ...

Enter a number, or type a model ID directly:
```

Wait for the answer before continuing.

---

### 7. Apply the change

For each target file, replace the model string on the line matching `model: 'claude-`. Replace only the model ID value — leave all surrounding code untouched.

Example — if switching to Sonnet:
```
Before:   model: 'claude-haiku-4-5-20251001',
After:    model: 'claude-sonnet-4-6',
```

---

### 8. Confirm and remind

Print a confirmation:

```
Done. Updated:
  SpotterModel (Create)  →  claude-sonnet-4-6   SpotterModelCreate/init-create.js
  SpotterModel (Edit)    →  claude-sonnet-4-6   SpotterModelEdit/init-edit.js

Refresh your browser tab to apply — the init file runs on mount,
so a page reload is needed to pick up the new model.
```

If any files were skipped due to disabled panels, include:
```
Skipped (panel disabled):
  [file] — enable the agent panel first, then re-run /switch-model
```
