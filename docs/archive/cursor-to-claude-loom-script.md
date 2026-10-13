# Loom Script — Moving from Cursor to Claude Code

**Video length target:** 5–7 minutes
**Audience:** Designers on the RadiantPlay team
**Tone:** Conversational, practical, no jargon

---

## Before you record

- Have your terminal open and Claude Code already installed (so you're not waiting on npm)
- Have [console.anthropic.com](https://console.anthropic.com) open in a browser tab
- Have the RadiantPlay folder open and ready to `cd` into
- Use a clean terminal with a large font size

---

## Script

---

### [00:00 – 00:30] Introduction

> "Hey everyone — quick video to walk you through moving our prototyping workflow from Cursor over to Claude Code. It's a one-time setup, takes about five minutes, and after that everything works the same way you're used to. I'll cover the five steps, and there's also a written guide in the repo if you want to refer back to it."

*[Show the five-step overview on screen — can be the setup guide doc or a simple slide]*

> "The five steps are: create your Claude account and API key, install Claude Code, configure your key, verify it's working, and then open the RadiantPlay folder. Let's go."

---

### [00:30 – 01:30] Step 1 — Create your account and API key

*[Switch to browser, show inbox]*

> "First, check your email — you should have an invite from Anthropic. Click the link and create your account. Once you're in, go to console.anthropic.com."

*[Navigate to console.anthropic.com → API Keys]*

> "In the left sidebar, click API Keys, then click Create Key. Give it a name — I'll call mine 'radiantplay-claude-code' — and hit Create."

*[Create the key]*

> "Here's the important part — copy this key right now, because it's only shown once. Paste it into Notes or 1Password. It starts with sk-ant. Don't share it, don't commit it to git."

---

### [01:30 – 02:30] Step 2 — Install Claude Code

*[Switch to terminal]*

> "Now open your terminal and run this command."

```
npm install -g @anthropic-ai/claude-code
```

> "This installs the claude command globally on your machine. It needs Node 18 or higher — you can check with node --version. If you're already using this repo, you almost certainly have the right version."

*[Wait for install to finish]*

> "Once that's done, you're installed."

---

### [02:30 – 03:30] Step 3 — Configure your API key

*[Stay in terminal]*

> "Now we need to tell Claude Code about your API key. Run this — replacing the value with your actual key."

```
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> "That sets it for this terminal session. To make it permanent so you don't have to do this every time, add it to your zshrc."

```
echo 'export ANTHROPIC_API_KEY=sk-ant-your-key-here' >> ~/.zshrc
source ~/.zshrc
```

> "Now every new terminal window will have it automatically."

---

### [03:30 – 04:30] Step 4 — Verify it's working + troubleshooting

*[Stay in terminal]*

> "Let's check everything is set up correctly."

```
claude --version
```

> "You should see a version number. Then run claude on its own to open an interactive session."

```
claude
```

> "Type hello and press Enter — Claude should respond. That means your key is working and you're connected."

*[Show the response]*

> "Type /exit to close the session. If you hit any issues — like 'command not found' or an auth error — there's a troubleshooting table in the written guide. The two most common ones are: the claude command isn't in your PATH, which you fix by checking your npm global bin location, and the API key not being exported correctly, which you can verify with echo $ANTHROPIC_API_KEY."

---

### [04:30 – 05:30] Step 5 — Open RadiantPlay and start building

*[Navigate to the radiantplay folder]*

> "Last step — navigate to your local RadiantPlay folder and run claude."

```
cd ~/code/radiantplay
claude
```

> "Claude Code is now running inside the project. It knows about the repo structure, the components, the tokens, everything. You work with it the same way you worked with Cursor's chat — just describe what you want to build."

*[Type /help to show the available commands]*

> "All the slash commands you used before still work — /new-prototype to scaffold a new prototype, /ship to push to staging, /radiant-check to run a compliance check, /sync-upstream to pull in the latest library updates. Just type them here instead of in the Cursor chat panel."

---

### [05:30 – 06:00] Wrap-up

> "That's the full setup. One-time process, five steps. From here your workflow is exactly the same — open your project folder, run claude, and start building prototypes with Radiant components."

> "The written guide is at docs/collaboration/cursor-to-claude-setup.md in the repo if you need to refer back to any of the commands. And if you run into anything, ping me on Slack."

*[End recording]*

---

## Editing notes

- Trim any long npm install waits
- Add chapter markers matching the five steps
- Captions recommended (terminal text can be hard to read)
- No background music needed — keep it clean and fast
