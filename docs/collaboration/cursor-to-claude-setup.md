# Moving from Cursor to Claude Code — Setup Guide

This guide walks you through the five steps to get Claude Code running on your machine so you can continue prototyping in RadiantPlay exactly as before — just with Claude Code instead of Cursor.

---

## Before you begin — update your skills first

Your fork may have been created a while ago. The `.claude/commands/` folder may be outdated or missing skills. Run these four commands once before anything else.

**A — Add the upstream remote**
```bash
git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git
```
> If you see `error: remote upstream already exists`, skip to B.

**B — Fetch from upstream**
```bash
git fetch upstream
```

**C — Pull only the commands folder**
```bash
git checkout upstream/main -- .claude/commands/
```
This replaces only `.claude/commands/` with the latest version — your prototypes and all other files are untouched.

**D — Restart your Claude session**

Quit Claude and relaunch so the updated commands are picked up:
```bash
claude
```

---

## The five-step process

1. Create your Claude account and API key
2. Install Claude Code on your machine
3. Configure your API key
4. Verify Claude Code is working
5. Open the RadiantPlay folder and start building

---

## Step 1 — Create your Claude account and API key

1. Check your email for an invite from Anthropic (subject: *"You've been invited to Claude"* or similar). Click the link to create your account.
2. Once logged in, go to [console.anthropic.com](https://console.anthropic.com) and sign in.
3. In the left sidebar, click **API Keys**.
4. Click **+ Create Key**, give it a name (e.g. `radiantplay-claude-code`), and click **Create**.
5. **Copy the key immediately** — it is only shown once.
6. Paste it somewhere safe (Notes app, 1Password, etc.) before closing the dialog.

> The key starts with `sk-ant-...`. Keep it private — do not share it or commit it to git.

---

## Step 2 — Install Claude Code

Open your terminal and run:

```bash
npm install -g @anthropic-ai/claude-code
```

This installs the `claude` CLI globally. It requires Node.js 18 or later. To check your Node version:

```bash
node --version
```

If you see `v18.x.x` or higher, you're good. If not, install the latest LTS from [nodejs.org](https://nodejs.org).

---

## Step 3 — Configure your API key

Set your API key so Claude Code can authenticate. In your terminal:

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

To make this permanent (so you don't need to re-run it every session), add it to your shell config file. Run the appropriate command for your shell:

**zsh (default on Mac):**
```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.zshrc
source ~/.zshrc
```

**bash:**
```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.bash_profile
source ~/.bash_profile
```

Replace `sk-ant-your-key-here` with your actual key.

---

## Step 4 — Verify Claude Code is working

Run:

```bash
claude --version
```

You should see a version number printed. Then run:

```bash
claude
```

This opens an interactive session. Type `hello` and press Enter — Claude should respond. Type `/exit` to close.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `command not found: claude` | npm global bin is not in your PATH. Run `npm config get prefix` and add `<prefix>/bin` to your `PATH` in `.zshrc` / `.bash_profile`. |
| `AuthenticationError` or `401` | API key is wrong or not exported. Double-check the value with `echo $ANTHROPIC_API_KEY`. |
| `npm install` fails | Check Node version (`node --version`). Must be v18+. |
| `rate_limit_error` | API usage limit reached — contact Mohammed to check quota. |
| Session opens but no response | Check your internet connection. Claude Code requires outbound HTTPS. |

---

## Step 5 — Open RadiantPlay in Claude Code

Navigate to your local RadiantPlay folder and launch Claude Code:

```bash
cd ~/code/radiantplay
claude
```

Claude Code is now running inside the project. You can start prompting the same way you did in Cursor — ask it to build prototypes, modify components, or run commands.

### Useful first commands

```
/help          — see all available slash commands
/status        — check current branch and uncommitted changes
/new-prototype — scaffold a new prototype
/radiant-check — run a compliance health check on a prototype
/sync-upstream — pull latest changes from the upstream library
```

---

## Keeping your library current

New components, tokens, and rules are pushed to the upstream library regularly. Use these three commands to stay in sync.

### Step 1 — Preview and sync

```
/sync-upstream
```

Fetches upstream, shows you a preview of what's changed (new components, token changes, rule updates, files that overlap with your work), and tells you exactly what it will do on your current branch. Then it asks before merging.

When you say yes, it stashes any in-progress work, syncs `main` against upstream, resolves the `registry-core.ts` conflict automatically (your prototypes in `registry-mine.ts` are preserved), verifies the build, pushes `main` to your fork, forwards the changes into your feature branch, and restores your stashed work. You end up back on the branch you started on, with your WIP intact and the latest library available.

### Step 2 — Verify your fork is in sync

```
/fork-status
```

Reports sync status between origin (GitHub) and galaxy (ThoughtSpot) across all branches.

> **When to sync:** Run `/sync-upstream` at the start of any new prototype sprint. The preview shows you what's available before anything changes.

---

## Quick reference card

| Step | Command |
|------|---------|
| Install Claude Code | `npm install -g @anthropic-ai/claude-code` |
| Set API key (temporary) | `export ANTHROPIC_API_KEY=sk-ant-...` |
| Set API key (permanent) | Add export to `~/.zshrc` then `source ~/.zshrc` |
| Verify installation | `claude --version` |
| Open project | `cd ~/code/radiantplay && claude` |

---

## What changes vs Cursor

| Cursor | Claude Code |
|--------|-------------|
| GUI-based, opens in editor | Terminal-based, runs in your project folder |
| Inline code completions | Conversational — describe what you want |
| `.cursor/rules/` auto-loaded | Same rules still apply; Claude reads them on request |
| `/` commands in chat panel | `/` commands in the Claude Code terminal session |

The slash commands (`/new-prototype`, `/ship`, `/radiant-check`, etc.) work the same way — just type them in the Claude Code terminal instead of the Cursor chat panel.

---

*Questions? Reach out to Mohammed Faris.*
