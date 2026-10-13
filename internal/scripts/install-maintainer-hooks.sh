#!/bin/bash
# install-maintainer-hooks.sh
#
# One-time setup for the main Radiant Play maintainer.
# 1. Symlinks the pre-push hook into .git/hooks/ so it runs on every push.
# 2. Gives origin two push URLs (GitHub and galaxy), so a plain `git push`
#    reaches both remotes. Fetching still comes from GitHub; `galaxy` stays
#    as its own remote for fetches.
#
# Usage: bash internal/scripts/install-maintainer-hooks.sh
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
echo "  bash internal/scripts/release.sh"

# ── Dual push: origin pushes to GitHub and galaxy ────────────────────────────
if git remote get-url galaxy >/dev/null 2>&1; then
  if git remote get-url --push --all origin | grep -q "galaxy.corp.thoughtspot.com"; then
    echo "✓ origin already pushes to GitHub and galaxy"
  else
    ORIGIN_URL="$(git remote get-url origin)"
    GALAXY_URL="$(git remote get-url galaxy)"
    # The first --add --push replaces the implicit push URL, so add origin's own URL back first.
    git remote set-url --add --push origin "$ORIGIN_URL"
    git remote set-url --add --push origin "$GALAXY_URL"
    echo "✓ origin now pushes to $ORIGIN_URL and $GALAXY_URL"
  fi
  echo "  A plain 'git push' reaches both remotes."
fi
