#!/usr/bin/env bash
# Push a branch to origin and galaxy.
#
#   origin  -> GitHub copy
#   galaxy  -> what the Coolify apps deploy from
#
# Kept for older instructions. Once install-maintainer-hooks.sh has given
# origin both push URLs, a plain `git push` already reaches both remotes and
# this script is the same as `git push origin <branch>`.
#
# Usage: bash internal/scripts/push-faris.sh            # pushes faris
#        bash internal/scripts/push-faris.sh <branch>   # pushes another branch to both
#
# Plain pushes only. The pre-push hook refuses force-pushes and deletions of faris.
set -euo pipefail

branch="${1:-faris}"

if git remote get-url --push --all origin | grep -q "galaxy.corp.thoughtspot.com"; then
  echo "→ origin (GitHub + galaxy)/$branch"
  git push origin "$branch"
else
  echo "→ origin/$branch"
  git push origin "$branch"
  echo "→ galaxy/$branch"
  git push galaxy "$branch"
fi
echo "✓ $branch is on origin and galaxy"
