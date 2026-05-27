# Getting Started — A Designer's Guide to Git & This Project

Welcome! This guide is written for designers who have never used Git or code editors before. By the end, you'll understand what Git is, how branches work, and how to build prototypes in this project — all explained with diagrams.

---

## Table of Contents

1. [What is Git?](#1-what-is-git)
2. [Key Vocabulary](#2-key-vocabulary)
3. [How Git Works (The Filing Cabinet Analogy)](#3-how-git-works-the-filing-cabinet-analogy)
4. [What is a Branch?](#4-what-is-a-branch)
5. [When to Create a Branch](#5-when-to-create-a-branch)
6. [What is a Commit?](#6-what-is-a-commit)
7. [What is Merging?](#7-what-is-merging)
8. [What is a Pull Request?](#8-what-is-a-pull-request)
9. [The Full Picture](#9-the-full-picture)
10. [Project Setup](#10-project-setup)
11. [Your First Prototype — Step by Step](#11-your-first-prototype--step-by-step)
12. [Common Commands Cheat Sheet](#12-common-commands-cheat-sheet)
13. [FAQ — Things That Confuse Everyone](#13-faq--things-that-confuse-everyone)
14. [Project Reference](#14-project-reference)

---

## 1. What is Git?

Git is a **version control system** — think of it as an infinite undo history for your entire project. Every change you save (called a "commit") is recorded forever, so you can always go back to any previous version.

```
Without Git                          With Git
──────────                           ────────
  homepage_v1.fig                      One file: homepage.fig
  homepage_v2.fig                      + a timeline of every change:
  homepage_v2_final.fig
  homepage_v2_final_FINAL.fig            ┌─────────┐
  homepage_v2_USE_THIS_ONE.fig           │ Dec 5   │ Added hero section
                                         ├─────────┤
  (which one is the real one?)           │ Dec 6   │ Updated colors
                                         ├─────────┤
                                         │ Dec 7   │ Added footer
                                         ├─────────┤
                                         │ Dec 8   │ Swapped icon set
                                         └─────────┘
                                         (every version is recoverable)
```

**GitHub** is a website that stores your Git projects online so you can share and collaborate with others. Think of Git as the engine, GitHub as the garage where everyone parks.

---

## 2. Key Vocabulary

| Term | Plain English | Analogy |
|------|--------------|---------|
| **Repository (repo)** | The project folder tracked by Git | A shared Google Drive folder |
| **Clone** | Download a copy of the repo to your computer | Downloading a Drive folder to your desktop |
| **Branch** | A parallel version of the project | A separate copy of a Figma page to try ideas on |
| **Commit** | A saved snapshot of your changes | Pressing Cmd+S, but it also records *what* changed and *why* |
| **Push** | Upload your commits to GitHub | Syncing your local folder back to Drive |
| **Pull** | Download the latest changes from GitHub | Hitting "Refresh" on the Drive folder |
| **Merge** | Combine one branch's changes into another | Flattening a Figma variant branch back into the main file |
| **Pull Request (PR)** | A request to merge your branch — reviewed by others | Tagging someone in Figma: "Can you review my changes?" |
| **Fork** | Your personal copy of the entire repo | Duplicating a Figma file to your own drafts |
| **Conflict** | Two people changed the same line — Git needs you to pick one | Two designers moved the same layer differently |

---

## 3. How Git Works (The Filing Cabinet Analogy)

```
YOUR COMPUTER                                          GITHUB (cloud)
┌──────────────────────────────────────┐               ┌──────────────────┐
│                                      │               │                  │
│  ┌─────────────┐    ┌────────────┐   │    push →     │   Remote Repo    │
│  │  Working     │───▶│  Staging   │───┼──────────────▶│   (shared with   │
│  │  Directory   │    │  Area      │   │               │    everyone)     │
│  │             │    │            │   │    ← pull     │                  │
│  │ (your files │    │ (files you │   │◀──────────────│                  │
│  │  right now) │    │  picked to │   │               │                  │
│  │             │    │  save)     │   │               │                  │
│  └─────────────┘    └────────────┘   │               └──────────────────┘
│        │                  │          │
│        │  git add         │  git commit
│        │  (stage it)      │  (save it)
│                                      │
│  ┌───────────────────────────────┐   │
│  │  Local Repo (commit history) │   │
│  │  ○ ── ○ ── ○ ── ○ ── ○      │   │
│  └───────────────────────────────┘   │
└──────────────────────────────────────┘
```

**Three steps to save your work:**

| Step | What you do | What happens |
|------|-------------|--------------|
| 1. **Edit** | Change files in Cursor | Files are modified in your Working Directory |
| 2. **Stage** | `git add .` | You pick which changes to include |
| 3. **Commit** | `git commit -m "Added header"` | A permanent snapshot is saved locally |
| 4. **Push** | `git push` | Your snapshots are uploaded to GitHub |

---

## 4. What is a Branch?

A branch is a **parallel timeline** of the project. It lets you work on something without affecting the main version.

```
         main (the production-ready version)
         ─────○─────○─────○─────○─────○─────○──────
                          │                   ▲
                          │ create branch     │ merge back
                          ▼                   │
                          ○─────○─────○───────┘
                          add-chat-prototype

                     Your branch lives here.
                     You can experiment freely.
                     The main branch stays safe.
```

### Why branches exist

Imagine you and a colleague are both working on the same Figma file. Without branches, you'd constantly overwrite each other's work. Branches let you both work independently and combine later.

```
                         main
                   ───○───○───○────────────────○── (always stable)
                              │                ▲
                         ┌────┴────┐           │
                         ▼         ▼           │
                    ○──○──○   ○──○──○──○       │
                    sarah/     faris/           │
                    login-     dashboard        │
                    page       redesign    merge both
                                               │
             Two designers, two branches, ─────┘
             zero conflicts.
```

### The mental model

Think of it like Figma pages:

```
┌─────────────────────────────────┐
│  Figma File: "App Redesign"     │
│                                 │
│  📄 Main (delivered)            │  ← This is the "main" branch
│  📄 Sarah's explorations        │  ← This is Sarah's branch
│  📄 Faris's dashboard idea      │  ← This is Faris's branch
│                                 │
│  Each page is independent.      │
│  Changes on one don't affect    │
│  the others until you merge.    │
└─────────────────────────────────┘
```

---

## 5. When to Create a Branch

**Always.** Every new piece of work gets its own branch. Never work directly on `main`.

| Situation | Branch name example | Why |
|-----------|-------------------|-----|
| Building a new prototype | `add-search-prototype` | Keep main stable while you build |
| Fixing a bug | `fix-sidebar-overlap` | Isolate the fix so it can be reviewed |
| Updating an existing prototype | `update-dashboard-charts` | Don't break what already works |
| Experimenting with an idea | `experiment-dark-mode` | Safe space to try things |

### How to create a branch

**In the terminal (Cursor):**
```bash
git checkout -b add-my-prototype     # Create + switch to new branch
```

**In GitHub Desktop (GUI):**
```
Current Branch ▾  →  New Branch  →  Name it  →  Create Branch
```

```
Before:   You are on main
          ───○───○───○  ← main (you are here)

Command:  git checkout -b add-my-prototype

After:    A new branch is created, you are now on it
          ───○───○───○  ← main
                      \
                       ○  ← add-my-prototype (you are here)
```

---

## 6. What is a Commit?

A commit is a **snapshot** — a saved checkpoint of your project at a specific moment. Each commit has:

- A unique ID (like `a3f8b21`)
- A message describing what changed
- A timestamp
- The author's name

```
Timeline of commits on your branch:

  ○──────────○──────────○──────────○
  │          │          │          │
  "scaffold  "add chat  "style    "add send
   prototype" sidebar"  messages"  button"

  Each ○ is a commit.
  You can go back to any of them at any time.
```

### Writing good commit messages

| Bad | Good |
|-----|------|
| `update` | `add sidebar navigation to chat prototype` |
| `fix` | `fix send button not disabling when input is empty` |
| `changes` | `update chart colors to match Radiant tokens` |
| `asdf` | `scaffold MuseChat prototype with prompt bar` |

### How to commit

```bash
git add .                              # Stage all changed files
git commit -m "add chat sidebar"       # Save with a message
```

---

## 7. What is Merging?

Merging takes the changes from one branch and combines them into another.

```
BEFORE MERGE:

    main:              ○───○───○───○
                                    \
    add-chat:                        ○───○───○
                                     A   B   C
                              (your 3 commits)


AFTER MERGE:

    main:              ○───○───○───○───○───○───○
                                    \         /
    add-chat:                        ○───○───○
                                     A   B   C

    Your commits (A, B, C) are now part of main.
    The main branch has your changes.
    Your branch can be deleted — its work lives on in main.
```

### What about merge conflicts?

A conflict happens when two branches changed the **same line** in the **same file**. Git can't decide which version to keep, so it asks you.

```
Conflict example:

  main changed line 5 to:       background: blue;
  your branch changed line 5 to: background: red;

  Git shows you both:
  ┌──────────────────────────────────┐
  │ <<<<<<< main                     │
  │ background: blue;                │
  │ =======                          │
  │ background: red;                 │
  │ >>>>>>> add-chat                 │
  └──────────────────────────────────┘

  You pick which one to keep (or combine them),
  then save and commit.
```

Don't worry — conflicts are rare in this project because each prototype lives in its own folder.

---

## 8. What is a Pull Request?

A Pull Request (PR) is how your branch gets merged into `main`. Instead of merging directly, you **ask for a review** first.

```
THE PULL REQUEST FLOW:

  1. You push your branch to GitHub
     ┌──────────┐     push      ┌──────────┐
     │  Your    │──────────────▶│  GitHub   │
     │  laptop  │               │  (cloud)  │
     └──────────┘               └──────────┘

  2. You open a Pull Request on GitHub
     ┌─────────────────────────────────────┐
     │  Pull Request #12                    │
     │  "Add MuseChat prototype"            │
     │                                      │
     │  add-chat  →  main                   │
     │                                      │
     │  ✅ 3 commits  📁 5 files changed    │
     │                                      │
     │  Reviewer: @faris                    │
     │  Status: Awaiting review             │
     └─────────────────────────────────────┘

  3. Reviewer checks your code and approves

  4. You click "Merge" — your branch becomes part of main

  5. The Vercel site auto-deploys with your changes
     ┌──────────────────────────────────────┐
     │  radiantplay.vercel.app              │
     │  ✨ Now includes your prototype!     │
     └──────────────────────────────────────┘
```

---

## 9. The Full Picture

Here's the complete lifecycle of building a prototype in this project:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   1. CREATE BRANCH            2. BUILD PROTOTYPE                     │
│   ─────────────────           ──────────────────                     │
│   git checkout -b             Use Cursor AI to                       │
│   add-my-prototype            generate code from                     │
│        │                      Figma screenshots                      │
│        ▼                           │                                 │
│   ┌─────────┐                      ▼                                 │
│   │ Branch  │               ┌─────────────┐                         │
│   │ created │──────────────▶│ Edit & save │                         │
│   └─────────┘               │ (commit)    │                         │
│                              └──────┬──────┘                         │
│                                     │                                │
│   3. PUSH TO GITHUB           4. OPEN PULL REQUEST                   │
│   ─────────────────           ────────────────────                   │
│   git push -u origin          Go to GitHub and                       │
│   add-my-prototype            click "New Pull Request"               │
│        │                           │                                 │
│        ▼                           ▼                                 │
│   ┌─────────┐               ┌─────────────┐                         │
│   │ Branch  │──────────────▶│ PR reviewed │                         │
│   │ on GH   │               │ & merged    │                         │
│   └─────────┘               └──────┬──────┘                         │
│                                     │                                │
│                              5. AUTO DEPLOY                          │
│                              ──────────────                          │
│                              Vercel picks up                         │
│                              the merge and deploys                   │
│                                     │                                │
│                                     ▼                                │
│                              ┌─────────────┐                         │
│                              │ Live on      │                        │
│                              │ radiantplay  │                        │
│                              │ .vercel.app  │                        │
│                              └─────────────┘                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Project Setup

### Prerequisites

| Tool | Download | What it does |
|------|----------|-------------|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) | Runs JavaScript on your computer |
| **Cursor IDE** | [cursor.so](https://cursor.so) | Code editor with AI built in |
| **GitHub account** | [github.com](https://github.com) | Where the code lives online |
| **GitHub Desktop** *(optional)* | [desktop.github.com](https://desktop.github.com) | Visual Git interface (no terminal needed) |

### Installation

```bash
# 1. Fork the repo on GitHub (click the "Fork" button on the repo page)

# 2. Clone your fork to your computer
git clone https://github.com/YOUR-USERNAME/radiantplay.git

# 3. Open the folder
cd radiantplay

# 4. Install dependencies (downloads all the libraries the project needs)
npm install

# 5. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you should see the Radiant Play homepage.

```
What just happened:

  GitHub (cloud)                Your Computer
  ┌────────────────┐           ┌────────────────────────────┐
  │ radiantplay   │  clone →  │ radiantplay/              │
  │ (your fork)    │           │ ├── src/                   │
  │                │           │ │   ├── components/  (35+) │
  │                │           │ │   ├── prototypes/        │
  │                │           │ │   └── tokens/            │
  │                │           │ ├── .cursor/rules/ (AI)    │
  │                │           │ └── package.json           │
  └────────────────┘           └────────────────────────────┘
                                        │
                                   npm install
                                        │
                                   npm run dev
                                        │
                                        ▼
                               localhost:5173 🎉
```

---

## 11. Your First Prototype — Step by Step

### Step 1: Create a branch

```bash
git checkout -b add-my-first-prototype
```

### Step 2: Scaffold the prototype

```bash
npm run new-prototype MyFirstPrototype
```

This creates:

```
src/prototypes/MyFirstPrototype/
├── index.tsx        ← Your main component (start here)
├── components/      ← Local components for this prototype
└── README.md        ← Notes about your prototype
```

### Step 3: Open in Cursor and describe your UI

Open `src/prototypes/MyFirstPrototype/index.tsx` in Cursor. In the Chat panel (Cmd+L), describe what you want:

> "Create a settings page with a sidebar showing menu items (General, Notifications, Security) and a main area with a form that has text inputs for Name and Email, toggles for notification preferences, and a Save button at the bottom."

Or paste a Figma screenshot and say:

> "Recreate this design using Radiant components."

The AI will generate the code using the project's design system components.

### Step 4: Preview your work

Your dev server (`npm run dev`) updates automatically. Check [localhost:5173/playground](http://localhost:5173/playground) — your prototype appears in the gallery.

### Step 5: Save your progress (commit)

```bash
git add .
git commit -m "add settings page prototype with sidebar and form"
```

### Step 6: Push to GitHub

```bash
git push -u origin add-my-first-prototype
```

The `-u` flag is only needed the first time you push a new branch.

### Step 7: Open a Pull Request

1. Go to your fork on GitHub
2. You'll see a banner: "add-my-first-prototype had recent pushes"
3. Click **"Compare & pull request"**
4. Write a short description of what you built
5. Click **"Create pull request"**
6. Wait for review and approval
7. Click **"Merge pull request"**

```
YOUR JOURNEY:

  ┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐
  │ Create   │───▶│ Build in  │───▶│ Commit &   │───▶│ Open PR  │
  │ branch   │    │ Cursor    │    │ push       │    │ & merge  │
  └──────────┘    └───────────┘    └────────────┘    └──────────┘
       │               │                │                  │
  "checkout -b"   AI generates     "add, commit,     GitHub review
                  your code         push"             & deploy
```

---

## 12. Common Commands Cheat Sheet

### Everyday commands

| What you want to do | Terminal command | GitHub Desktop equivalent |
|---------------------|-----------------|---------------------------|
| **See what changed** | `git status` | Changes tab shows modified files |
| **Create a new branch** | `git checkout -b branch-name` | Branch → New Branch |
| **Switch branches** | `git checkout branch-name` | Branch dropdown → select branch |
| **Save changes** | `git add . && git commit -m "message"` | Write summary → Commit |
| **Upload to GitHub** | `git push` | Push origin button |
| **Get latest changes** | `git pull` | Fetch origin → Pull |
| **Start dev server** | `npm run dev` | (use terminal in Cursor) |
| **Create a prototype** | `npm run new-prototype Name` | (use terminal in Cursor) |

### If something goes wrong

| Problem | Solution |
|---------|----------|
| "I made changes on `main` by accident" | `git stash` then `git checkout -b my-branch` then `git stash pop` |
| "I want to undo my last commit" | `git reset --soft HEAD~1` (keeps your files, undoes the commit) |
| "I want to throw away all local changes" | `git checkout .` (careful — this deletes uncommitted changes) |
| "My branch is behind main" | `git checkout main` then `git pull` then `git checkout my-branch` then `git merge main` |
| "I have merge conflicts" | Open the file, look for `<<<<<<<`, pick the version you want, delete the markers, save, and commit |

### Setup & dev-server issues

| Problem | Solution |
|---------|----------|
| `npm install` fails | Make sure Node.js is installed: run `node --version` (need 18+) |
| `npm run dev` fails | Delete the `node_modules` folder, then run `npm install` again |
| Browser shows a blank page | Check the terminal for errors — usually a typo in code |
| AI doesn't know the components | Make sure you opened the `radiantplay` folder (not a parent) so Cursor loads `.cursor/rules/` |
| Port 5173 already in use | Close other dev servers, or the terminal will show an alternate port |
| Changes not showing in the browser | Make sure `npm run dev` is still running in the terminal |

---

## 13. FAQ — Things That Confuse Everyone

### "What's the difference between Git and GitHub?"

```
Git     = the tool on your computer that tracks changes (like Time Machine)
GitHub  = the website where your project is stored online (like iCloud)
```

### "Do I need to use the terminal?"

No — you can use **GitHub Desktop** for all Git operations (branch, commit, push, pull, merge). But learning a few terminal commands makes you faster. Cursor has a built-in terminal (Ctrl+` to open it).

### "What if I break something?"

That's what branches are for! Your `main` branch is protected. If your branch is a mess, you can always delete it and start over:

```bash
git checkout main                  # Go back to main
git branch -D my-broken-branch     # Delete the broken branch
git checkout -b my-fresh-start     # Start fresh
```

### "How often should I commit?"

Commit whenever you reach a small milestone. Think of it like saving a game:

```
  ○ "scaffold prototype"
  │
  ○ "add header and sidebar layout"
  │
  ○ "add form with validation"
  │
  ○ "style everything with Radiant tokens"
  │
  ○ "add loading state and error handling"

  5 commits = 5 save points you can return to.
  Better than 1 giant commit at the end.
```

### "What is `main` vs my branch?"

```
main          = The published, reviewed, stable version
                Everyone sees this. Deployed to radiantplay.vercel.app.

your branch   = Your personal workspace
                Only you see this until you open a PR.
                Break things freely — main is unaffected.
```

### "What does `origin` mean?"

`origin` is the nickname for your GitHub repo's URL. When you say `git push origin`, you're saying "upload to GitHub."

```
origin = https://github.com/your-username/radiantplay.git
         (just a shortcut so you don't type the full URL every time)
```

---

## 14. Project Reference

Quick reference for building prototypes — components, mock data, and examples to study.

### Tips for better AI results

| Tip | Example |
|-----|---------|
| **Name specific components** | "Use a `Modal` with a `SearchInput` and `Checkbox` list" |
| **Describe layout** | "Sidebar on the left, content area on the right" |
| **Describe interactions** | "Clicking the row opens a detail panel" |
| **Paste Figma screenshots** | Drop an image in the chat and say "Recreate this" |
| **Reference existing prototypes** | "Similar to the AdminGroups prototype" |
| **Use mock data** | "Use the mock user data for the table" |

### Available components

Radiant ships 70+ components across layout, inputs, feedback, overlays, data display, and navigation. Browse the full set with props and live previews:

- **Live registry:** `localhost:5173/radiant`
- **Full API reference:** `docs/component-api-reference.md`

Import from the components barrel:

```tsx
import { Button, Modal, TextInput, Toggle } from '../../components';
```

### Using mock data

Import realistic sample data for your prototypes:

```tsx
import { users, analytics, navigation, forms } from '../../mocks';
```

| Data | What's included |
|------|----------------|
| `users.profiles` | User objects with name, email, role |
| `users.groups` | User groups |
| `analytics.metrics` | KPI card data |
| `analytics.revenueByMonth` | Chart data |
| `navigation.sidebar` | Main nav items |
| `navigation.settingsSidebar` | Settings nav items |
| `forms.countries` | Country dropdown options |
| `forms.departments` | Department options |
| `forms.timeRanges` | Time period options |

### Example prototypes to study

| Prototype | Description | Location |
|-----------|-------------|----------|
| **AdminGroups** | Admin panel with table, wizard modal, sidebar | `src/prototypes/AdminGroups/` |
| **SpotterMemory** | Data table with toolbar and navigation | `src/prototypes/SpotterMemory/` |
| **SpotterModel** | Agent edit flow with onboarding and column editing | `src/prototypes/SpotterModel/` |
| **AdminLang** | CSV-based translation admin with upload and validation | `src/prototypes/AdminLang/` |
| **MiniSpotters** | Domain-specific Spotter instances with bounded context | `src/prototypes/MiniSpotters/` |
| **Liveboard Template** | Starter for Liveboard prototypes (AnswerTile + SpotterViz) | `src/prototypes/_liveboard-template/` |
| **Sales Dashboard** | Liveboard prototype with view/edit modes and SpotterViz panel | `src/prototypes/SalesDashboard/` |

---

## What's Next?

| Resource | What it covers |
|----------|---------------|
| [README.md](README.md) | Project overview, available components, tech stack |
| [FORK-WORKFLOW.md](FORK-WORKFLOW.md) | Detailed fork setup and collaboration workflow |
| `localhost:5173/radiant` | Browse all 35+ Radiant components live |
| `localhost:5173/playground` | See existing prototypes for inspiration |

---

*Built for ThoughtSpot designers who are new to code.* — Radiant Play
