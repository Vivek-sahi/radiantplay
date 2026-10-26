#!/bin/bash
# guidance-test — checks that Claude Code still finds the right rules (maintainer only)
#
# Runs each prompt in prompts.tsv through headless Claude Code in plan mode, in a
# throwaway worktree of your current checkout (committed and uncommitted changes,
# as a fork would see them: no local-only skills, no settings.local.json). Then
# scores which rule files each session read and whether it asked the gate
# questions. Nothing in your checkout changes.
#
# Run it after changing CLAUDE.md, .cursor/rules/, nested CLAUDE.md files or the
# hooks. One round of 10 prompts costs about $5 to $8 and takes ~10 minutes.
#
# Usage: bash internal/scripts/guidance-test/run.sh [runs per prompt, default 1] [parallel, default 4]
#        bash internal/scripts/guidance-test/run.sh --score <results dir>
#
# Plan mode saves each session's plan in ~/.claude/plans/; delete them when done.

set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)

if [ "${1:-}" = "--score" ]; then
  python3 "$HERE/score.py" "${2:?results dir}"
  exit $?
fi

RUNS=${1:-1}
JOBS=${2:-4}
ROOT=$(git rev-parse --show-toplevel)
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="${TMPDIR:-/tmp}/rp-guidance-test-$STAMP"
WT="$OUT/repo"
mkdir -p "$OUT/runs"

command -v claude >/dev/null || { echo "claude CLI not found"; exit 1; }

# Snapshot the working tree (tracked + untracked, minus local-only files) as a commit
# object, without touching your index or branch.
IDX=$(mktemp)
trap 'rm -f "$IDX"' EXIT
(
  cd "$ROOT"
  export GIT_INDEX_FILE="$IDX"
  git read-tree HEAD
  git add -A
  git rm -q --cached --ignore-unmatch .claude/settings.local.json >/dev/null
  TREE=$(git write-tree)
  SNAP=$(echo "guidance-test snapshot" | git commit-tree "$TREE" -p HEAD)
  git worktree add -q --detach "$WT" "$SNAP"
)

echo "Testing $(git -C "$WT" log -1 --format='%h') with $RUNS run(s) per prompt, $JOBS at a time"
echo "Results: $OUT/runs"

run_one() {
  local id=$1 rep=$2 prompt=$3
  (cd "$WT" && claude -p "$prompt" --permission-mode plan --max-turns 14 \
    --output-format stream-json --verbose \
    > "$OUT/runs/$id-r$rep.jsonl" 2> "$OUT/runs/$id-r$rep.err") || true
  echo "  done $id r$rep"
}
export -f run_one
export WT OUT

for r in $(seq 1 "$RUNS"); do
  while IFS=$'\t' read -r id prompt; do
    [ -z "$id" ] && continue
    printf '%s\0%s\0%s\0' "$id" "$r" "$prompt"
  done < "$HERE/prompts.tsv"
done | xargs -0 -n 3 -P "$JOBS" bash -c 'run_one "$@"' _

git -C "$ROOT" worktree remove --force "$WT"

echo ""
python3 "$HERE/score.py" "$OUT/runs"
