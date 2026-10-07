#!/usr/bin/env bash
# Installs the screenshot tools for gallery thumbnails, outside the project:
# Playwright and its Chromium (about 150 MB) in ~/.radiantplay-visual.
# package.json and the lockfile stay untouched. Visual snapshots use the same folder.
set -euo pipefail

DEPS="${VISUAL_DEPS:-$HOME/.radiantplay-visual}"
mkdir -p "$DEPS"
cd "$DEPS"
[ -f package.json ] || npm init -y > /dev/null
echo "Installing Playwright in $DEPS"
npm install --no-audit --no-fund playwright pixelmatch@6 pngjs@7
echo "Downloading Chromium (about 150 MB)"
npx playwright install chromium
date > "$DEPS/.thumbnails-enabled"
echo "Done. Capture thumbnails with: npm run thumbnails -- <PrototypeName>"
