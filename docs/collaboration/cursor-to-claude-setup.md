# Setting up Claude for Radiant Play

This guide gets you from nothing to a running prototype in the Claude desktop app. It takes about ten minutes, once.

---

## What you need

- **A Galaxy account.** Your ThoughtSpot login works. Make sure you can see the Radiant Play repo and that you have your own fork of it. The [forking guide](forking-guide.md) covers forking.
- **The Claude desktop app.** Download it from [claude.ai/download](https://claude.ai/download) (Mac and Windows) and sign in with your ThoughtSpot account.
- **Node.js 22 or newer** (20.19+ also works). If it's missing or too old, Claude will tell you when you first start the project; install the LTS version from [nodejs.org](https://nodejs.org).

You don't need an API key, and you don't need to install anything in the terminal.

---

## Step 1: Open the Code tab

Open the Claude app and click **Code** at the top. Start a new session and choose a folder to work in. `~/Documents` is fine; your copy of the project goes inside it.

## Step 2: Clone your fork

Paste your fork's URL into the chat and ask Claude to clone it:

```
Clone https://galaxy.corp.thoughtspot.com/YOUR-USERNAME/radiantplay.git here
```

Claude downloads the project into a `radiantplay` folder.

> If Galaxy asks you to sign in, run the clone in the app's terminal panel instead, so you can type your login:
> `git clone https://galaxy.corp.thoughtspot.com/YOUR-USERNAME/radiantplay.git`

## Step 3: Open the project

Start a new session and choose the `radiantplay` folder. From now on, always open this folder. Claude reads the project's `CLAUDE.md` when the session starts, so it already knows the Radiant components, tokens and conventions.

## Step 4: Start it up

Type this in the chat:

```
Start the dev server
```

The first time, Claude installs the project's packages too (about a minute). The app opens a preview pane that updates as Claude makes changes. Do this each time you come back to the project.

| URL | What's there |
|-----|--------------|
| `localhost:5173` | The Radiant DS browser: components and tokens |
| `localhost:5173/playground` | Your prototypes |

## Step 5: Build your first prototype

```
/rp-new-prototype SettingsPage
```

The name starts with a capital letter and has no spaces. Then describe what you want in the same chat, or drag in a screenshot and say "Recreate this using Radiant components". Claude builds it and checks it in the preview.

---

## Already have the project on your machine?

Skip the clone. Open your existing radiantplay folder in the Code tab (Step 3) and carry on; your fork, branches and prototypes stay as they are. If your fork is old, run `/rp-sync-upstream` first so you get the latest commands and rules. On a fork without `/rp-` commands, type `/sync-upstream`; the old name still works.

---

## Slash commands

Type `/rp-` in the chat to see them all.

| Command | What it does |
|---------|--------------|
| `/rp-new-prototype Name` | Scaffolds a prototype folder and adds it to the gallery |
| `/rp-radiant-check Name` | Health check: components, tokens, content and layout |
| `/rp-explore scope` | Steps outside Radiant to try a freeform direction |
| `/rp-migrate-prototype` | Moves your prototypes onto the Geist font and dark mode |
| `/rp-sync-upstream` | Previews the latest library changes, then pulls them into your fork. Asks before it merges |
| `/rp-coolify-deploy` | Gives your fork a live URL that redeploys on every push |
| `/rp-project-canvas` | A local overview of your prototypes, branches and sites |

No command for it? Just ask. "Capture a thumbnail for my prototype" or "Switch my prototype's AI to Sonnet" work too.

> **When to sync:** run `/rp-sync-upstream` at the start of any new prototype sprint. The preview shows you what's coming before anything changes.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Claude says Node.js or npm is missing | Install the LTS version from [nodejs.org](https://nodejs.org), then ask Claude to start the dev server again |
| The clone stops at a sign-in prompt | Run the clone in the app's terminal panel so you can type your Galaxy login |
| `/rp-` commands don't show up | Check the session is open on the `radiantplay` folder, not its parent. On an old fork, ask Claude to run `/sync-upstream` |
| The preview pane is blank | Ask Claude to check the dev server logs and fix what it finds |

---

## Prefer the terminal?

The same setup works with the `claude` command in a terminal. Follow the install steps at [claude.com/claude-code](https://claude.com/claude-code), sign in, then run `claude` inside your radiantplay folder. Slash commands work the same way.

---

*Questions? Reach out to Mohammed Faris.*
