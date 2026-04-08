#!/bin/bash
# install-maintainer-hooks.sh
#
# One-time setup for the main Radiant Play maintainer.
# Symlinks the pre-push hook into .git/hooks/ so it runs on every push.
#
# Usage: bash scripts/install-maintainer-hooks.sh
# Run once after cloning. Safe to re-run.

set -euo pipefail

HOOKS_DIR="$(git rev-parse --git-dir)/hooks"
SOURCE="$(pwd)/scripts/hooks/pre-push"
TARGET="$HOOKS_DIR/pre-push"

if [ ! -f "$SOURCE" ]; then
  echo "Error: $SOURCE not found. Run from the repo root."
  exit 1
fi

chmod +x "$SOURCE"

if [ -L "$TARGET" ]; then
  echo "Hook already installed (symlink exists). Updating..."
  rm "$TARGET"
fi

ln -s "$SOURCE" "$TARGET"
echo "✓ pre-push hook installed: $TARGET → $SOURCE"
echo ""
echo "From now on, pushing to main will remind you to run:"
echo "  bash scripts/release.sh"
