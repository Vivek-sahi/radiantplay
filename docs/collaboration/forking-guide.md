# Forking Guide

How to fork and set up the Radiant Play for your own use.

## Overview

Each designer should work in their own fork of the repository. This allows:
- Independent experimentation without affecting others
- Easy syncing with upstream updates
- Optional contribution back to the main repository

## Step-by-Step Setup

### 1. Fork the Repository

1. Go to the galaxy repository at `https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay`
2. Click the **Fork** button in the top right
3. Select your account as the destination
4. Wait for the fork to complete

### 2. Clone Your Fork

```bash
# Clone your fork (replace YOUR-USERNAME)
git clone https://galaxy.corp.thoughtspot.com/YOUR-USERNAME/radiantplay.git

# Navigate to the project
cd radiantplay

# Add upstream remote for syncing
git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Open in Cursor

```bash
cursor .
```

## Working with Branches

### Create a Feature Branch

For each new prototype or feature, create a branch:

```bash
# Create and switch to new branch
git checkout -b prototype/my-feature-name

# Make your changes...

# Commit
git add .
git commit -m "Add my-feature prototype"

# Push to your fork
git push origin prototype/my-feature-name
```

### Branch Naming Convention

Use descriptive prefixes:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `prototype/` | New prototypes | `prototype/user-onboarding` |
| `feature/` | New components or features | `feature/avatar-component` |
| `fix/` | Bug fixes | `fix/button-hover-state` |
| `docs/` | Documentation changes | `docs/add-examples` |

## Syncing with Upstream

The easiest way is to use the `/sync-upstream` skill in Cursor — it handles fetching, merging, conflict resolution in `registry.ts`, build verification, and pushing automatically.

Just open Cursor in your repo and type:

```
/sync-upstream
```

### Manual sync (if needed)

```bash
# Fetch upstream changes
git fetch upstream

# Switch to your main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push updates to your fork
git push origin main
```

### Resolving Conflicts

The most common conflict is in `src/prototypes/registry.ts`. The `/sync-upstream` skill resolves this automatically — it keeps upstream entries first and preserves your prototype entries with `section: 'mine'`.

If you're resolving manually:

1. Git will show which files have conflicts
2. Open those files and look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Keep both sides — upstream entries first, your entries below
4. Stage the resolved files: `git add <filename>`
5. Complete the merge: `git commit`

## File Organization

### Your Prototype Files

Keep your prototypes organized:

```
src/prototypes/
├── _template/           # Don't modify - reference only
├── _examples/           # Don't modify - reference only
├── MyProject/           # Your prototype project
│   ├── index.tsx
│   ├── components/      # Project-specific components
│   └── README.md
└── AnotherProject/
    └── ...
```

### What to Commit

**DO commit:**
- Your prototype files in `src/prototypes/`
- New components you create
- Documentation updates

**DON'T commit:**
- Changes to core components (unless contributing back)
- `node_modules/`
- Build artifacts (`dist/`)
- Personal IDE settings

## Contributing Back

If you create something useful, consider contributing:

### 1. Create a Clean Branch

```bash
# Start from your updated main
git checkout main
git pull upstream main

# Create a contribution branch
git checkout -b contribution/my-feature
```

### 2. Make Your Changes

- Keep changes focused and minimal
- Follow existing code patterns
- Add documentation if needed

### 3. Push and Create PR

```bash
git push origin contribution/my-feature
```

Then create a Pull Request on galaxy from your fork to the upstream repository.

### PR Guidelines

- Clear title describing the change
- Description of what and why
- Screenshots if visual changes
- Reference any related issues

## Tips for Collaboration

### Keep Your Fork Clean

1. Don't commit directly to `main`
2. Use feature branches
3. Delete merged branches

### Regular Syncing

Sync with upstream at least weekly to avoid large merge conflicts.

### Communication

If multiple designers are working on related features, coordinate to avoid conflicts.

## Quick Reference

```bash
# Start fresh
git clone https://galaxy.corp.thoughtspot.com/YOUR-USERNAME/radiantplay.git
cd radiantplay
npm install
npm run dev

# New prototype branch
git checkout -b prototype/my-project
# ... make changes ...
git add .
git commit -m "Add my prototype"
git push origin prototype/my-project

# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```
