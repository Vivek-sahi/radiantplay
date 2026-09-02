#!/usr/bin/env bash
# Push the maintainer working branch to both remotes in one step.
#
#   origin  -> GitHub copy
#   galaxy  -> what the personal Coolify app (radiantplay-faris) deploys from
#
# Usage: bash internal/scripts/push-faris.sh            # pushes faris
#        bash internal/scripts/push-faris.sh <branch>   # pushes another branch to both
#
# Plain pushes only. The pre-push hook refuses force-pushes and deletions of faris.
set -euo pipefail

branch="${1:-faris}"

echo "→ origin/$branch"
git push origin "$branch"
echo "→ galaxy/$branch"
git push galaxy "$branch"
echo "✓ $branch is on origin and galaxy"
