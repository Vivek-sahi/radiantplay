#!/usr/bin/env bash
#
# housekeeping-check.sh — universal checks (U1–U7) for the housekeeping reorg PRs.
# Reference: docs/2026-05-27-housekeeping-plan.md → "Test cases — universal checks".
#
# Default run executes U1, U2, U3, U7. The heavier / situational checks are opt-in
# so each PR only runs what its test-case list calls for.
#
# Usage:
#   bash scripts/housekeeping-check.sh                              # U1, U2, U3, U7
#   bash scripts/housekeeping-check.sh --dev                        # + U5 (dev server boots, serves 200)
#   bash scripts/housekeeping-check.sh --full-strip                 # + U4 (strip WITH build — PRs 5 & 7)
#   bash scripts/housekeeping-check.sh --moved-paths "a.md,b/"      # + U6 (stale-reference grep)
#   bash scripts/housekeeping-check.sh --quick                      # skip U2/U4 build (fast local loop)
#   bash scripts/housekeeping-check.sh --public-version 1.2.3       # override strip version (default 1.0.0)
#
# Per-PR shortcuts (from the plan's test-case headers):
#   PR 1: --dev --moved-paths "GETTING_STARTED.html,radiantplay-overview.html,radiantplay-guide.html,your-first-git-branch.md,BACKLOG.md"
#   PR 5: --dev --full-strip --moved-paths "<every moved doc path>"
#   PR 7: --full-strip
#
# Exit code: 0 = all run checks passed, 1 = one or more failed, 2 = bad usage.
#
set -uo pipefail

# ─── Locate repo root (script lives in scripts/) ────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ─── Defaults ───────────────────────────────────────────────────────────────
RUN_DEV=false
FULL_STRIP=false
QUICK=false
MOVED_PATHS=""
PUBLIC_VERSION="1.0.0"

# ─── Arg parse (supports both "--flag value" and "--flag=value") ────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)                RUN_DEV=true; shift ;;
    --full-strip)         FULL_STRIP=true; shift ;;
    --quick)              QUICK=true; shift ;;
    --moved-paths)        MOVED_PATHS="${2:-}"; shift 2 ;;
    --moved-paths=*)      MOVED_PATHS="${1#*=}"; shift ;;
    --public-version)     PUBLIC_VERSION="${2:-}"; shift 2 ;;
    --public-version=*)   PUBLIC_VERSION="${1#*=}"; shift ;;
    -h|--help)            grep '^#' "$0" | grep -v '^#!' | sed 's/^#\s\?//'; exit 0 ;;
    *)                    echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

# ─── Colors ─────────────────────────────────────────────────────────────────
c_green=$'\033[0;32m'; c_red=$'\033[0;31m'; c_yellow=$'\033[0;33m'
c_bold=$'\033[1m'; c_dim=$'\033[2m'; c_reset=$'\033[0m'

# ─── Result tracking ────────────────────────────────────────────────────────
declare -a RESULTS=()
FAILED=0
pass() { RESULTS+=("  ${c_green}✓${c_reset} $1"); }
fail() { RESULTS+=("  ${c_red}✗${c_reset} $1"); FAILED=$((FAILED + 1)); }
warn() { RESULTS+=("  ${c_yellow}!${c_reset} $1"); }

# Run a check function, record pass/fail by its exit code.
run_check() {
  local label="$1"; shift
  printf "\n%s▶ %s%s\n" "$c_bold" "$label" "$c_reset"
  if "$@"; then pass "$label"; else fail "$label"; fi
}

# ─── Dev server cleanup (best-effort, runs on any exit) ──────────────────────
DEV_PID=""
cleanup() {
  if [[ -n "${DEV_PID}" ]]; then
    kill "$DEV_PID" 2>/dev/null
    pkill -P "$DEV_PID" 2>/dev/null
  fi
}
trap cleanup EXIT INT TERM

# ─── U1: TypeScript clean ────────────────────────────────────────────────────
check_u1() { npm run typecheck; }

# ─── U2: Full build ──────────────────────────────────────────────────────────
check_u2() { npm run build:strict; }

# ─── U3: Strip dry-run ───────────────────────────────────────────────────────
check_u3() { bash scripts/public-strip.sh --public-version="$PUBLIC_VERSION" --skip-build; }

# ─── U4: Strip with build (heavier — PRs that change public surface) ─────────
check_u4() { bash scripts/public-strip.sh --public-version="$PUBLIC_VERSION"; }

# ─── U5: Dev server boots and serves 200 ─────────────────────────────────────
check_u5() {
  local log; log="$(mktemp)"
  npm run dev > "$log" 2>&1 &
  DEV_PID=$!

  # Wait for Vite to print its Local URL (up to 30s), or bail if the process dies.
  local url=""
  for _ in $(seq 1 30); do
    url="$(grep -oE 'http://localhost:[0-9]+/?' "$log" | head -1)"
    [[ -n "$url" ]] && break
    kill -0 "$DEV_PID" 2>/dev/null || break
    sleep 1
  done

  if [[ -z "$url" ]]; then
    echo "    ${c_red}dev server never printed a Local URL${c_reset}"
    echo "${c_dim}$(tail -5 "$log" | sed 's/^/      /')${c_reset}"
    kill "$DEV_PID" 2>/dev/null; DEV_PID=""; rm -f "$log"
    return 1
  fi

  local port="${url##*localhost:}"; port="${port%%/*}"
  local code; code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)"
  echo "    dev server responded ${code} at ${url}"

  # Cleanup: kill npm + children, then clear the port (macOS lsof).
  kill "$DEV_PID" 2>/dev/null; pkill -P "$DEV_PID" 2>/dev/null
  if command -v lsof >/dev/null 2>&1 && [[ -n "$port" ]]; then
    lsof -ti tcp:"$port" 2>/dev/null | xargs kill 2>/dev/null || true
  fi
  DEV_PID=""; rm -f "$log"

  [[ "$code" == "200" ]]
}

# ─── U6: Stale-reference grep (per moved/deleted path) ───────────────────────
check_u6() {
  local any_hits=0
  local IFS=','
  read -ra paths <<< "$MOVED_PATHS"
  for raw in "${paths[@]}"; do
    local p; p="$(echo "$raw" | xargs)"   # trim whitespace
    [[ -z "$p" ]] && continue
    local pat; pat="$(basename "$p")"     # match the name wherever it's referenced
    local hits
    hits="$(grep -rn --fixed-strings "$pat" \
      --include='*.ts' --include='*.tsx' --include='*.md' \
      --include='*.json' --include='*.sh' --include='*.html' \
      --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
      --exclude-dir=internal --exclude-dir=.public-export --exclude-dir=worktrees \
      --exclude='CHANGELOG.md' --exclude='status.html' \
      . 2>/dev/null)"
    if [[ -n "$hits" ]]; then
      echo "    ${c_red}refs to '${pat}' still present:${c_reset}"
      echo "$hits" | sed 's/^/      /'
      any_hits=1
    else
      echo "    ${c_green}✓${c_reset} no refs to '${pat}'"
    fi
  done
  [[ "$any_hits" -eq 0 ]]
}

# ─── U7: Working tree clean (post-commit) ────────────────────────────────────
check_u7() {
  local out; out="$(git status --porcelain)"
  if [[ -n "$out" ]]; then
    echo "    uncommitted / untracked changes:"
    echo "$out" | sed 's/^/      /'
    return 1
  fi
  return 0
}

# ─── Run sequence ─────────────────────────────────────────────────────────────
echo "${c_bold}housekeeping-check${c_reset} ${c_dim}(repo: ${REPO_ROOT})${c_reset}"
echo "${c_dim}strip version ${PUBLIC_VERSION} · dev=${RUN_DEV} · full-strip=${FULL_STRIP} · quick=${QUICK}${c_reset}"

run_check "U1 — TypeScript clean (npm run typecheck)" check_u1

if $QUICK; then
  warn "U2 — build skipped (--quick)"
else
  run_check "U2 — Full build (npm run build:strict)" check_u2
fi

run_check "U3 — Strip dry-run (--skip-build)" check_u3

if $FULL_STRIP; then
  if $QUICK; then
    warn "U4 — strip-with-build skipped (--quick)"
  else
    run_check "U4 — Strip with build (full)" check_u4
  fi
fi

if $RUN_DEV; then
  run_check "U5 — Dev server boots and serves 200" check_u5
fi

if [[ -n "$MOVED_PATHS" ]]; then
  run_check "U6 — Stale-reference grep" check_u6
fi

# U7 is informational: a dirty tree is expected when run before the final commit.
printf "\n%s▶ %s%s\n" "$c_bold" "U7 — Working tree clean (post-commit)" "$c_reset"
if check_u7; then
  pass "U7 — Working tree clean"
else
  warn "U7 — Working tree has changes (expected if you haven't committed yet)"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo
echo "${c_bold}── Summary ──${c_reset}"
for r in "${RESULTS[@]}"; do echo -e "$r"; done
echo
if [[ "$FAILED" -gt 0 ]]; then
  echo "${c_red}${c_bold}${FAILED} check(s) failed.${c_reset}"
  exit 1
fi
echo "${c_green}${c_bold}All run checks passed.${c_reset}"
exit 0
