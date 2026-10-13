#!/usr/bin/env bash
# Generates public/status.html with repo + branch + fork + plan-file overview.
# Pure shell + gh + git. No LLM tokens. Re-run any time.
#
# Usage:  bash internal/scripts/status.sh         (also opens browser)
#         bash internal/scripts/status.sh --no-open
#         bash internal/scripts/status.sh --full    (maintainer: also refresh Forks and Census)
#
# A plain run takes a few seconds: the maintainer's Forks and Census tabs show the
# results saved by the last --full run (internal/cache/, gitignored). --full opens
# that quick page first, then calls GitHub for every fork, runs the prototype
# census, and rewrites the page; reload it to see the fresh numbers.

set -u
# Repo root, resolved via git so it stays correct no matter where this script
# lives (it moved into internal/scripts/ during the reorg — a hardcoded ../ broke
# it). Falls back to two-levels-up if git is unavailable.
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../.." && pwd))"
cd "$ROOT"

OUT="public/status.html"

# ── arguments ────────────────────────────────────────────────────────────
#   --no-open              write the page, don't open it
#   --first-run-defaults   print role, default title and site guess, then exit
#                          (/project-canvas reads these for its first-run questions)
#   --full (or --census)   maintainer only: refresh the Forks and Census tabs (slow)
NO_OPEN=false
FIRST_RUN_DEFAULTS=false
FULL=false
for arg in "$@"; do
  case "$arg" in
    --no-open) NO_OPEN=true ;;
    --full|--census|full|census) FULL=true ;;
    --first-run-defaults) FIRST_RUN_DEFAULTS=true; NO_OPEN=true ;;
  esac
done

# ── role detection ───────────────────────────────────────────────────────
# Maintainer = has a remote (named `galaxy`) pointing to mohammed-faris/radiantplay
# AND is the only one pushing to it. We approximate this by remote name + URL.
# Designer = any other RadiantPlay checkout. A designer's `upstream` remote (per
# /rp-sync-upstream convention) points at mohammed-faris/radiantplay; a fork
# without one still gets the designer canvas, which says how to connect.
# STATUS_ROLE=designer previews the designer canvas on the maintainer's checkout.
# Role comes before the settings, because the role decides which settings load.
IS_MAINTAINER=false
DESIGNER_UPSTREAM_REMOTE=""
galaxy_url=$(git remote get-url galaxy 2>/dev/null || echo "")
upstream_url=$(git remote get-url upstream 2>/dev/null || echo "")
if echo "$galaxy_url" | grep -q "mohammed-faris/radiantplay"; then
  IS_MAINTAINER=true
elif echo "$upstream_url" | grep -q "mohammed-faris/radiantplay"; then
  DESIGNER_UPSTREAM_REMOTE="upstream"
fi
case "${STATUS_ROLE:-}" in
  designer)   IS_MAINTAINER=false ;;
  maintainer) IS_MAINTAINER=true ;;
esac
CANVAS_ROLE="designer"
$IS_MAINTAINER && CANVAS_ROLE="maintainer"
# --full only means something on the maintainer canvas.
$IS_MAINTAINER || FULL=false

# ── config ───────────────────────────────────────────────────────────────
# Settings load in layers: the defaults in this script, then
# internal/status.config.sh (the maintainer's settings: identity, git host,
# baselines, branch purposes, Content groups and the Sites rows) for the
# maintainer only, then internal/status.local.sh if present. The local file is
# gitignored and holds a designer's own settings (title, Coolify URL), which
# /project-canvas writes on its first run. Both are sourced shell files, not
# JSON, so this script keeps needing nothing but shell, git and gh.
CONFIG="$ROOT/internal/status.config.sh"
LOCAL_CONFIG="$ROOT/internal/status.local.sh"
# shellcheck source=/dev/null
$IS_MAINTAINER && [ -f "$CONFIG" ] && . "$CONFIG"
# shellcheck source=/dev/null
[ -f "$LOCAL_CONFIG" ] && . "$LOCAL_CONFIG"

# Designer defaults: "<first name>'s RadiantPlay", from git config user.name.
# Only a value the settings left unset gets one, so STATUS_TITLE_EM="" in
# internal/status.local.sh stays empty.
if ! $IS_MAINTAINER; then
  first_name="$(git config user.name 2>/dev/null | awk '{print $1}')"
  # Built in a plain variable: an apostrophe inside a ${VAR-word} default trips bash 3.2.
  default_title="My Radiant"
  [ -n "$first_name" ] && default_title="${first_name}'s Radiant"
  STATUS_TITLE="${STATUS_TITLE-$default_title}"
  STATUS_TITLE_EM="${STATUS_TITLE_EM-Play}"
  STATUS_TAB_TITLE="${STATUS_TAB_TITLE:-${STATUS_TITLE}${STATUS_TITLE_EM} canvas}"
fi

if $IS_MAINTAINER; then
  STATUS_TITLE="${STATUS_TITLE:-Radiant}"
  STATUS_TITLE_EM="${STATUS_TITLE_EM:-Play}"
fi
STATUS_TAB_TITLE="${STATUS_TAB_TITLE:-Radiant Play canvas}"
STATUS_LOOK="${STATUS_LOOK:-studio}"
STATUS_SITE_TIMEOUT="${STATUS_SITE_TIMEOUT:-6}"
STATUS_INTERNAL_HOST_MATCH="${STATUS_INTERNAL_HOST_MATCH:-coolify.thoughtspot.com}"
STATUS_APP_BASE="${STATUS_APP_BASE:-http://localhost:4310}"
# Arrays are referenced with the ${ARR[@]+...} guard throughout: `set -u` plus
# bash 3.2, which is what macOS ships, errors on an unset array otherwise.
if [ -z "${STATUS_BASELINES+x}" ]; then STATUS_BASELINES=(main staging); fi
if [ -z "${STATUS_BRANCH_PURPOSE+x}" ]; then STATUS_BRANCH_PURPOSE=(); fi
if [ -z "${STATUS_DEPLOYS+x}" ]; then STATUS_DEPLOYS=(); fi

HOST="${STATUS_HOST:-galaxy.corp.thoughtspot.com}"
NOW="$(date '+%Y-%m-%d %H:%M')"
EPOCH_NOW="$(date +%s)"
GEN_START=$EPOCH_NOW

# ── data: branch purpose lookup ──────────────────────────────────────────
# Hovering a branch name in the Branches table shows what the branch is for.
branch_purpose() {
  local b="$1" row
  for row in ${STATUS_BRANCH_PURPOSE[@]+"${STATUS_BRANCH_PURPOSE[@]}"}; do
    case "$row" in
      "$b|"*) echo "${row#*|}"; return ;;
    esac
  done
}

# ── helpers ──────────────────────────────────────────────────────────────
# Shared page parts (style, look bootstrap, page script) for both canvases.
# shellcheck source=/dev/null
. "$ROOT/internal/scripts/status-page.sh"

# gh is only used for the maintainer's Forks tab, and the check costs about a
# second, so the designer canvas skips it.
have_gh_galaxy=false
# Only a --full run calls GitHub, so only it needs to know whether gh is signed in.
if $FULL && gh auth status --hostname "$HOST" >/dev/null 2>&1; then have_gh_galaxy=true; fi

esc() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

# Script-tag-safe escape: only break </script and <!-- so embedded markdown can
# live in <script type="text/markdown"> blocks without terminating early.
embed_esc() { sed -e 's|</script|<\\/script|g' -e 's|<!--|<\\!--|g'; }

EMBED_FILE=$(mktemp -t rp-status-embed)
trap 'rm -f "$EMBED_FILE"' EXIT

days_ago() {
  # input: ISO date. output: "Nd ago" or "today"
  local iso="$1"; [ -z "$iso" ] && { echo "—"; return; }
  local t; t=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$iso" +%s 2>/dev/null || echo "$EPOCH_NOW")
  local diff=$(( (EPOCH_NOW - t) / 86400 ))
  if [ "$diff" -le 0 ]; then echo "today"
  elif [ "$diff" -eq 1 ]; then echo "1d ago"
  else echo "${diff}d ago"; fi
}

# ── data: this repo ──────────────────────────────────────────────────────
CUR_BRANCH=$(git branch --show-current)
HEAD_SHA=$(git rev-parse --short HEAD)
HEAD_MSG=$(git log -1 --pretty=%s | esc)
HEAD_DATE=$(git log -1 --pretty=%ci)

ORIGIN_AHEAD_BEHIND=$(git rev-list --left-right --count "@{upstream}...HEAD" 2>/dev/null || echo "- -")
ORIGIN_BEHIND=$(echo "$ORIGIN_AHEAD_BEHIND" | awk '{print $1}')
ORIGIN_AHEAD=$(echo "$ORIGIN_AHEAD_BEHIND" | awk '{print $2}')
# A branch with no upstream has no counts, which used to render as "-- / +-".
if [ "$ORIGIN_BEHIND" = "-" ] || [ -z "$ORIGIN_BEHIND" ]; then
  ORIGIN_VS="no upstream"
else
  ORIGIN_VS="-${ORIGIN_BEHIND} / +${ORIGIN_AHEAD}"
fi

MOD_COUNT=$(git diff --name-only | wc -l | tr -d ' ')
STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
UNTRACKED_COUNT=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')
STASH_COUNT=$(git stash list 2>/dev/null | wc -l | tr -d ' ')

REMOTES=$(git remote -v | awk '{print $1" "$2}' | sort -u)

# Recent commits (15)
RECENT_COMMITS=$(git log -15 --pretty=format:'%h|%cr|%an|%s' | esc)

# Helper: ahead/behind of $1 vs $2 (a baseline ref). Outputs "-N/+M", "in sync", or "—".
diverge_vs() {
  local branch="$1" base="$2"
  if ! git rev-parse --verify --quiet "$base" >/dev/null 2>&1; then echo "—"; return; fi
  if [ "$branch" = "$base" ] || [ "refs/heads/$branch" = "refs/heads/$base" ]; then echo "—"; return; fi
  local counts behind ahead
  counts=$(git rev-list --left-right --count "${base}...${branch}" 2>/dev/null)
  if [ -z "$counts" ]; then echo "—"; return; fi
  behind=$(echo "$counts" | awk '{print $1}')
  ahead=$(echo "$counts" | awk '{print $2}')
  if [ "$behind" = "0" ] && [ "$ahead" = "0" ]; then echo "in sync"
  else echo "-${behind}/+${ahead}"; fi
}

# ── designer canvas ──────────────────────────────────────────────────────
# A designer gets a canvas about their own work, built in its own file so the
# maintainer canvas below stays as it is. It writes $OUT, opens it, and exits.
if ! $IS_MAINTAINER; then
  # shellcheck source=/dev/null
  . "$ROOT/internal/scripts/status-designer.sh"
  exit 0
fi
if $FIRST_RUN_DEFAULTS; then
  echo "role=maintainer"
  echo "local=$([ -f "$LOCAL_CONFIG" ] && echo present || echo missing)"
  exit 0
fi

# Determine which baselines exist on this checkout.
BASE_MAIN=""
BASE_STAGING=""
BASE_UPSTREAM=""
git rev-parse --verify --quiet main >/dev/null 2>&1 && BASE_MAIN="main"
git rev-parse --verify --quiet staging >/dev/null 2>&1 && BASE_STAGING="staging"
if [ -n "$DESIGNER_UPSTREAM_REMOTE" ]; then
  git rev-parse --verify --quiet "${DESIGNER_UPSTREAM_REMOTE}/main" >/dev/null 2>&1 && BASE_UPSTREAM="${DESIGNER_UPSTREAM_REMOTE}/main"
elif $IS_MAINTAINER; then
  git rev-parse --verify --quiet "galaxy/main" >/dev/null 2>&1 && BASE_UPSTREAM="galaxy/main"
fi

# All branches with: tracking, last commit subject + age, divergence vs main/staging/upstream.
BRANCH_ROWS=""
while IFS= read -r b; do
  [ -z "$b" ] && continue
  short=$(echo "$b" | sed 's|refs/heads/||')
  upstream=$(git for-each-ref --format='%(upstream:short)' "refs/heads/$short")
  vs_main=$([ -n "$BASE_MAIN" ] && diverge_vs "$short" "$BASE_MAIN" || echo "—")
  vs_staging=$([ -n "$BASE_STAGING" ] && diverge_vs "$short" "$BASE_STAGING" || echo "—")
  vs_upstream=$([ -n "$BASE_UPSTREAM" ] && diverge_vs "$short" "$BASE_UPSTREAM" || echo "—")
  last_subj=$(git log -1 --pretty=format:'%s' "$short" 2>/dev/null | esc)
  last_age=$(git log -1 --pretty=format:'%cr' "$short" 2>/dev/null)
  marker=""
  [ "$short" = "$CUR_BRANCH" ] && marker=" ← current"
  purpose="$(branch_purpose "$short" | esc)"
  bname="<code>${short}</code>"
  [ -n "$purpose" ] && bname="<code class='has-note' title=\"${purpose}\">${short}</code>"
  BRANCH_ROWS="${BRANCH_ROWS}<tr><td>${bname}${marker}</td><td>${vs_main}</td><td>${vs_staging}</td><td>${vs_upstream}</td><td>${last_age}<br><span class='file-list'>${last_subj}</span></td></tr>"
done < <(git for-each-ref --format='%(refname)' refs/heads/)

# Worktrees: path, branch, state (clean / N modified), ahead/behind vs main, locked/prunable.
WORKTREE_ROWS=""
WT_PATH=""
WT_BRANCH=""
WT_LOCKED=""
WT_PRUNABLE=""
emit_wt_row() {
  [ -z "$WT_PATH" ] && return
  local rel branch_label state divm flags
  rel=$(echo "$WT_PATH" | sed "s|^$HOME|~|")
  if [ -n "$WT_BRANCH" ]; then
    branch_label="<code>$(echo "$WT_BRANCH" | sed 's|refs/heads/||')</code>"
  else
    branch_label="<span class='file-list'>(detached)</span>"
  fi
  # Modified file count from this worktree (only if it is the current cwd worktree we can run git there cheaply).
  local modn
  modn=$(git -C "$WT_PATH" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [ -z "$modn" ] || [ "$modn" = "0" ]; then state="clean"
  else state="<strong>${modn} modified</strong>"; fi
  if [ -n "$WT_BRANCH" ] && [ -n "$BASE_MAIN" ]; then
    divm=$(diverge_vs "$(echo "$WT_BRANCH" | sed 's|refs/heads/||')" "$BASE_MAIN")
  else
    divm="—"
  fi
  flags=""
  [ -n "$WT_LOCKED" ] && flags="${flags} <span class='badge'>locked</span>"
  [ -n "$WT_PRUNABLE" ] && flags="${flags} <span class='badge'>prunable</span>"
  WORKTREE_ROWS="${WORKTREE_ROWS}<tr><td><code>${rel}</code>${flags}</td><td>${branch_label}</td><td>${state}</td><td>${divm}</td></tr>"
  WT_PATH=""; WT_BRANCH=""; WT_LOCKED=""; WT_PRUNABLE=""
}
while IFS= read -r line; do
  case "$line" in
    "worktree "*) emit_wt_row; WT_PATH="${line#worktree }" ;;
    "branch "*)   WT_BRANCH="${line#branch }" ;;
    "locked"*)    WT_LOCKED="1" ;;
    "prunable"*)  WT_PRUNABLE="1" ;;
    "")           emit_wt_row ;;
  esac
done < <(git worktree list --porcelain 2>/dev/null)
emit_wt_row

# Untracked files list (first 30)
UNTRACKED_LIST=$(git ls-files --others --exclude-standard | head -30 | esc)
MODIFIED_LIST=$(git diff --name-only | head -30 | esc)

# Prototype count
# PROTOTYPE_COUNT is derived from the two registries further down, once they
# have been parsed for the Content tab.

# Saved results for the slow tabs (maintainer): Forks and Census. A plain run
# only reads them; --full refreshes them. Anchor to the real repo root so they
# resolve no matter what cwd this runs from.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
CACHE_DIR="$REPO_ROOT/internal/cache"
FORKS_CACHE="$CACHE_DIR/canvas-forks.sh"
CENSUS_CACHE="$CACHE_DIR/prototype-census.html"
FULL_CMD="/rp-project-canvas full"
mkdir -p "$CACHE_DIR"

# timed CMD...: run CMD, killing it after NET_LIMIT seconds (network calls only).
NET_LIMIT="${NET_LIMIT:-20}"
timed() {
  "$@" & local pid=$!
  ( sleep "$NET_LIMIT"; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 & local watch=$!
  wait "$pid" 2>/dev/null; local rc=$?
  kill "$watch" 2>/dev/null; wait "$watch" 2>/dev/null
  return $rc
}

# --full: open the quick page now (a plain run of this script), then do the slow work:
# the census runs in the background while this script makes the Forks GitHub calls.
CENSUS_PID=""
if $FULL; then
  if $NO_OPEN; then bash "$ROOT/internal/scripts/status.sh" --no-open; else bash "$ROOT/internal/scripts/status.sh"; fi
  NO_OPEN=true
  if ! curl -s -o /dev/null -m 5 "https://$HOST/"; then
    echo "Full refresh skipped: $HOST isn't answering (on Twingate VPN?). Forks and Census keep their saved results."
    exit 0
  fi
  echo "Refreshing Forks and Census, under 10 minutes (GitHub calls and a git fetch per fork)..."
  (cd "$REPO_ROOT" && bash internal/scripts/prototype-census.sh > "$CACHE_DIR/census-run.log" 2>&1) &
  CENSUS_PID=$!
fi

# age_of EPOCH: "5 minutes ago", "2 days ago"
age_of() {
  local d=$(( EPOCH_NOW - $1 ))
  if [ "$d" -lt 3600 ]; then echo "$(( d / 60 )) minutes ago"
  elif [ "$d" -lt 86400 ]; then echo "$(( d / 3600 )) hours ago"
  else echo "$(( d / 86400 )) days ago"; fi
}
# The command box shown where a slow tab has nothing saved, or is a week old.
run_full_box() {
  echo "<div class='runbox'><p>$1</p><div class='runbox-cmd'><code>${FULL_CMD}</code><button class='pill copy-cmd' data-cmd='${FULL_CMD}'>Copy</button></div><p class='runbox-note'>Opens this page straight away, then refreshes Forks and Census in the background. It takes a few minutes: it calls GitHub and fetches every fork. Reload the page when it says it's done.</p></div>"
}


# Build size (last dist if exists)
BUILD_SIZE="—"
[ -d dist ] && BUILD_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')

# ── topology diagram ─────────────────────────────────────────────────────
build_diagram() {
  local W=70
  local hr; hr=$(printf '─%.0s' $(seq 1 $W))
  # A run of N box-drawing dashes. `tr ' ' '─'` cannot do this: tr works on
  # bytes, so it replaced each space with only the first byte of the 3-byte
  # character and left a run of invalid UTF-8 in the page.
  rule() { [ "${1:-0}" -gt 0 ] 2>/dev/null && printf '─%.0s' $(seq 1 "$1"); }

  remote_block() {
    local name="$1" url="$2"
    local refs="" sha when
    # The label is deliberately ASCII only, so ${#label} is an exact character
    # count and the top border lines up with the rows and the bottom border.
    local label; label="$(printf ' %-6s  %s ' "$name" "$url")"
    echo "┌─${label}$(rule $((W - 1 - ${#label})))┐"
    while IFS= read -r ref; do
      [ -z "$ref" ] && continue
      sha=$(git rev-parse --short "$ref" 2>/dev/null)
      when=$(git log -1 --pretty=format:'%cr' "$ref" 2>/dev/null)
      local short=${ref#refs/remotes/}
      printf '│  %-32s %-9s %-25s│\n' "$short" "$sha" "$when"
    done < <(git for-each-ref --format='%(refname)' "refs/remotes/$name/" | grep -E "/(main|staging)$")
    printf '└%s┘\n' "$hr"
  }

  echo
  echo "  UPSTREAM"
  remote_block "galaxy" "galaxy.corp.thoughtspot.com"
  echo "                                     │"
  echo "                                     ▼  push / pull"
  echo "  MIRROR"
  remote_block "origin" "github.com/faris-ts/radiantplay"
  echo "                                     │"
  echo "                                     ▼  fetch / pull"
  echo "  LOCAL · HEAD: ${CUR_BRANCH}"
  echo "┌${hr}┐"
  while IFS= read -r b; do
    [ -z "$b" ] && continue
    local short upstream ab marker
    short=$(echo "$b" | sed 's|refs/heads/||')
    upstream=$(git for-each-ref --format='%(upstream:short)' "refs/heads/$short")
    if [ -n "$upstream" ]; then
      counts=$(git rev-list --left-right --count "$upstream...$short" 2>/dev/null)
      if [ -n "$counts" ]; then
        behind=$(echo "$counts" | awk '{print $1}')
        ahead=$(echo "$counts" | awk '{print $2}')
        if [ "$behind" = "0" ] && [ "$ahead" = "0" ]; then ab="in sync"
        else ab="-${behind}/+${ahead}"; fi
      else ab="—"; fi
    else
      ab="(no upstream)"
    fi
    if [ "$short" = "$CUR_BRANCH" ]; then marker="●"; else marker="○"; fi
    local trk=""
    [ -n "$upstream" ] && trk="→ $upstream"
    printf '│  %s %-28s %-14s %-22s│\n' "$marker" "$short" "$ab" "$trk"
  done < <(git for-each-ref --format='%(refname)' refs/heads/)
  printf '└%s┘\n' "$hr"
}

DIAGRAM=$(build_diagram | esc)

# Last build time (mtime of dist)
LAST_BUILD="—"
[ -d dist ] && LAST_BUILD=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" dist 2>/dev/null)

# ── data: forks (maintainer only) ────────────────────────────────────────
FORK_ROWS=""
PROTOTYPE_LINES=""
ACTION_LINES=""
UPSTREAM_HEAD=""
FORKS_SAVED_AT=""
if $FULL && $have_gh_galaxy && $IS_MAINTAINER; then
  UPSTREAM_HEAD_JSON=$(timed gh api repos/mohammed-faris/radiantplay/commits/main --hostname "$HOST" --jq '{sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.committer.date}' 2>/dev/null)
  UPSTREAM_HEAD=$(echo "$UPSTREAM_HEAD_JSON" | esc)

  # Discover forks
  API_FORKS=$(timed gh api repos/mohammed-faris/radiantplay/forks --hostname "$HOST" --jq '.[].full_name' 2>/dev/null)
  KNOWN="suraj-boro/radiantplay umesh-indoriya/radiantplay vivek-sahi/radiantplay jason-knight/radiantplay irene-ren/radiantplay jayant-mishra/radiantplay simran-pandit/radiantplay aditya-wadher/radiantplay devanshi-behera/radiantplay akshay-mohankar/radiantplay komal-bains/radiantplay_komal abhinav-gupta/radiantplay yash-chauhan/radiantplay tarun-bhandari/radiantplay kshipra-sharma/radiantplay"
  ALL_FORKS=$(printf '%s\n' $API_FORKS $KNOWN | sort -u)

  # Collect rows into a tempfile keyed by pushed_at so we can sort newest-first.
  FORK_TMP=$(mktemp -t rp-fork-rows)
  for f in $ALL_FORKS; do
    owner=${f%%/*}
    pushed=$(timed gh api "repos/$f" --hostname "$HOST" --jq '.pushed_at' 2>/dev/null)
    cmp=$(timed gh api "repos/mohammed-faris/radiantplay/compare/main...$owner:main" --hostname "$HOST" --jq '{ahead: .ahead_by, behind: .behind_by}' 2>/dev/null)
    ahead=$(echo "$cmp" | sed -n 's/.*"ahead":\([0-9]*\).*/\1/p')
    behind=$(echo "$cmp" | sed -n 's/.*"behind":\([0-9]*\).*/\1/p')
    [ -z "$ahead" ] && ahead="?"
    [ -z "$behind" ] && behind="?"

    last_push=$(days_ago "$pushed")
    days_int=$(( (EPOCH_NOW - $(date -j -f "%Y-%m-%dT%H:%M:%SZ" "${pushed:-1970-01-01T00:00:00Z}" +%s 2>/dev/null || echo "$EPOCH_NOW")) / 86400 ))

    status="Up to date"; cls="ok"
    if [ "$ahead" = "?" ] || [ "$behind" = "?" ]; then
      status="Unreachable"; cls="warn"
    elif [ "$behind" = "0" ] && [ "$ahead" = "0" ]; then
      status="Up to date"; cls="ok"
    elif [ "$behind" = "0" ] && [ "$ahead" -gt 0 ]; then
      status="Active"; cls="ok"
    elif [ "$ahead" -gt 0 ]; then
      status="Behind"; cls="warn"
    elif [ "$days_int" -gt 30 ]; then
      status="Dormant"; cls="muted"
    else
      status="Stale"; cls="muted"
    fi

    # Sort key first; ISO 8601 sorts lexicographically by date. Unreachable forks sort to the bottom.
    sort_key="${pushed:-0000-00-00T00:00:00Z}"
    printf '%s\t<tr class='\''%s'\''><td><a href='\''https://%s/%s'\'' target='\''_blank'\''>%s</a></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>\n' \
      "$sort_key" "$cls" "$HOST" "$f" "$f" "$status" "$behind" "$ahead" "$last_push" >> "$FORK_TMP"

    if [ "$ahead" != "?" ] && [ "$ahead" -gt 0 ]; then
      msgs=$(timed gh api "repos/mohammed-faris/radiantplay/compare/main...$owner:main" --hostname "$HOST" --jq '.commits[].commit.message | split("\n")[0]' 2>/dev/null | grep -iE 'feat|prototype' | head -8 | esc)
      if [ -n "$msgs" ]; then
        PROTOTYPE_LINES="${PROTOTYPE_LINES}<div class='proto-block'><h4>${f}</h4><ul>"
        while IFS= read -r m; do
          PROTOTYPE_LINES="${PROTOTYPE_LINES}<li>${m}</li>"
        done <<< "$msgs"
        PROTOTYPE_LINES="${PROTOTYPE_LINES}</ul></div>"
      fi
      ACTION_LINES="${ACTION_LINES}<li><strong>${f}</strong> — ${behind} behind, ${ahead} ahead → suggest <code>/rp-sync-upstream</code></li>"
    fi
  done

  # Sort by pushed_at descending and strip the sort key.
  FORK_ROWS=$(sort -r "$FORK_TMP" | sed 's/^[^\t]*\t//' | tr -d '\n')
  rm -f "$FORK_TMP"
  # Save for the quick runs.
  FORKS_SAVED_AT="$EPOCH_NOW"
  { for v in UPSTREAM_HEAD FORK_ROWS PROTOTYPE_LINES ACTION_LINES FORKS_SAVED_AT; do printf '%s=%q\n' "$v" "${!v}"; done; } > "$FORKS_CACHE"
elif $IS_MAINTAINER && [ -f "$FORKS_CACHE" ]; then
  . "$FORKS_CACHE"
fi

# Census: wait for a --full run's background census, then read what's saved.
if [ -n "$CENSUS_PID" ]; then
  wait "$CENSUS_PID" || echo "Census didn't finish cleanly (see internal/cache/census-run.log); the Census tab keeps its last saved run."
  grep -E 'SKIP|skipped' "$CACHE_DIR/census-run.log" 2>/dev/null | head -5
fi
CENSUS_AGE=""; CENSUS_STALE=false
if [ -f "$CENSUS_CACHE" ]; then
  census_epoch=$(stat -f %m "$CENSUS_CACHE" 2>/dev/null || echo "$EPOCH_NOW")
  CENSUS_AGE=$(age_of "$census_epoch")
  [ $(( EPOCH_NOW - census_epoch )) -gt 604800 ] && CENSUS_STALE=true
  CENSUS_BLOCK=$(sed 's#run <code>/rp-prototype-census</code> to refresh (slow — fetches every fork)#refresh with <code>'"$FULL_CMD"'</code>#' "$CENSUS_CACHE")
  $CENSUS_STALE && CENSUS_BLOCK="$(run_full_box "This census is ${CENSUS_AGE}, more than a week old. Refresh it with:")${CENSUS_BLOCK}"
else
  CENSUS_BLOCK=$(run_full_box "No census yet. It counts the prototypes on every fork, by creator. Run:")
fi

# ── data: designer upstream sync state ───────────────────────────────────
DESIGNER_BEHIND="—"
DESIGNER_AHEAD="—"
DESIGNER_UPSTREAM_HEAD=""
DESIGNER_UPSTREAM_URL=""
if [ -n "$DESIGNER_UPSTREAM_REMOTE" ]; then
  DESIGNER_UPSTREAM_URL=$(git remote get-url "$DESIGNER_UPSTREAM_REMOTE" 2>/dev/null)
  # Best-effort fetch — silent, non-blocking on failure.
  git fetch --quiet "$DESIGNER_UPSTREAM_REMOTE" main 2>/dev/null || true
  counts=$(git rev-list --left-right --count "${DESIGNER_UPSTREAM_REMOTE}/main...HEAD" 2>/dev/null)
  if [ -n "$counts" ]; then
    DESIGNER_BEHIND=$(echo "$counts" | awk '{print $1}')
    DESIGNER_AHEAD=$(echo "$counts" | awk '{print $2}')
  fi
  DESIGNER_UPSTREAM_HEAD=$(git log -1 --pretty=format:'%h %cr | %s' "${DESIGNER_UPSTREAM_REMOTE}/main" 2>/dev/null | esc)
fi

# ── data: plan files, rules, docs (split into buckets) ───────────────────
# Embed a markdown file once, keyed by a path-derived id, and echo that id.
# Both the Docs and plans tables and the Content cards point at the same
# embedded copy, so a doc listed twice is still only carried once.
EMBEDDED_IDS=""
embed_doc() {
  local p="$1" id
  id=$(echo "$p" | sed 's/[^a-zA-Z0-9]/_/g')
  case " $EMBEDDED_IDS " in
    *" $id "*) echo "$id"; return ;;
  esac
  EMBEDDED_IDS="$EMBEDDED_IDS $id"
  {
    echo "<script type=\"text/markdown\" id=\"md-${id}\" data-path=\"${p}\">"
    embed_esc < "$p" 2>/dev/null
    echo "</script>"
  } >> "$EMBED_FILE"
  echo "$id"
}

# "local" when the file is gitignored or not yet committed. Both lists are read
# once here (two git calls), not per file: per-file git calls were most of a run.
NL=$'\n'
LOCAL_UNTRACKED="${NL}$(git ls-files --others --exclude-standard 2>/dev/null)${NL}"
LOCAL_IGNORED="${NL}$(git ls-files --others --ignored --exclude-standard --directory 2>/dev/null)${NL}"
LOCAL_IGNORED_DIRS=$(printf '%s' "$LOCAL_IGNORED" | grep '/$')
local_badge() {
  local p="$1" d ignored=false
  case "$LOCAL_IGNORED" in *"${NL}${p}${NL}"*) ignored=true ;; esac
  if ! $ignored; then
    while IFS= read -r d; do
      [ -n "$d" ] && case "$p" in "$d"*) ignored=true; break ;; esac
    done <<< "$LOCAL_IGNORED_DIRS"
  fi
  if $ignored; then
    echo " <span class='badge local' title='Gitignored, exists only on this machine'>local</span>"
  else
    case "$LOCAL_UNTRACKED" in *"${NL}${p}${NL}"*) echo " <span class='badge local' title='Untracked, not yet committed to git'>local</span>" ;; esac
  fi
}

render_row() {
  local p="$1"
  local size mtime badge id
  size=$(wc -l < "$p" 2>/dev/null | tr -d ' ')
  mtime=$(stat -f "%Sm" -t "%Y-%m-%d" "$p" 2>/dev/null)
  badge="$(local_badge "$p")"
  id="$(embed_doc "$p")"
  echo "<tr><td><button class='md-link' data-target='md-${id}'>${p}</button>${badge}</td><td>${size} lines</td><td>${mtime}</td></tr>"
}

# Active plans: plans/, BACKLOG.md, anything matching *plan*.md outside .cursor/rules
ACTIVE_PLAN_ROWS=""
while IFS= read -r p; do
  [ -z "$p" ] && continue
  ACTIVE_PLAN_ROWS="${ACTIVE_PLAN_ROWS}$(render_row "$p")"
done < <(
  {
    [ -f BACKLOG.md ] && echo "BACKLOG.md"
    find plans -maxdepth 3 -name '*.md' 2>/dev/null
    find docs -maxdepth 3 -iname '*plan*.md' 2>/dev/null
    find docs -maxdepth 3 -iname '*roadmap*.md' 2>/dev/null
    find . -maxdepth 2 -name '*.plan.md' 2>/dev/null | sed 's|^\./||'
  } | sort -u
)

# Orchestrator & system rules: .cursor/rules/, CLAUDE.md, _orchestration*
RULE_ROWS=""
while IFS= read -r p; do
  [ -z "$p" ] && continue
  RULE_ROWS="${RULE_ROWS}$(render_row "$p")"
done < <(
  {
    [ -f CLAUDE.md ] && echo "CLAUDE.md"
    find .cursor/rules -maxdepth 2 -name '*.md' 2>/dev/null
    find .claude -maxdepth 2 -name '*.md' 2>/dev/null
  } | sort -u
)

# General docs: everything else under docs/ that isn't a plan
DOC_ROWS=""
while IFS= read -r p; do
  [ -z "$p" ] && continue
  case "$p" in
    *plan*|*Plan*|*PLAN*|*roadmap*|*Roadmap*) continue ;;
  esac
  DOC_ROWS="${DOC_ROWS}$(render_row "$p")"
done < <(
  {
    [ -f README.md ] && echo "README.md"
    find docs -maxdepth 3 -name '*.md' 2>/dev/null
  } | sort -u
)

# Articles
ARTICLE_ROWS=""
while IFS= read -r p; do
  [ -z "$p" ] && continue
  ARTICLE_ROWS="${ARTICLE_ROWS}$(render_row "$p")"
done < <(find articles -maxdepth 2 -name '*.md' 2>/dev/null | sort -u)

# Slash commands (handy reference)
COMMAND_ROWS=""
while IFS= read -r p; do
  [ -z "$p" ] && continue
  COMMAND_ROWS="${COMMAND_ROWS}$(render_row "$p")"
done < <(find .claude/commands -maxdepth 2 -name '*.md' 2>/dev/null | sort -u)

GEN_END=$(date +%s)
GEN_DUR=$((GEN_END - GEN_START))

# ── data: sites (deploy health) ──────────────────────────────────────────
# Every row in STATUS_DEPLOYS is checked at once rather than in sequence, so the
# whole tab costs about one timeout instead of one per row. Each background job
# writes a single line into a temp dir, then the lines are read back in the
# order the config declared them.
SITE_ROWS=""
SITES_UP=0
SITES_TOTAL=0
if [ -n "${STATUS_DEPLOYS+x}" ] && [ ${#STATUS_DEPLOYS[@]} -gt 0 ]; then
  SITE_TMP="$(mktemp -d)"
  i=0
  for row in ${STATUS_DEPLOYS[@]+"${STATUS_DEPLOYS[@]}"}; do
    i=$((i+1))
    (
      url="$(echo "$row" | cut -d'|' -f3)"
      # One request, both numbers: status code and total seconds.
      out=$(curl -sS -o /dev/null -L --max-time "$STATUS_SITE_TIMEOUT" \
              -w '%{http_code} %{time_total}' "$url" 2>/dev/null || echo "000 0")
      echo "$out" > "$SITE_TMP/$i"
    ) &
  done
  wait

  i=0
  for row in ${STATUS_DEPLOYS[@]+"${STATUS_DEPLOYS[@]}"}; do
    i=$((i+1))
    SITES_TOTAL=$((SITES_TOTAL+1))
    branch="$(echo "$row" | cut -d'|' -f1)"
    app="$(echo "$row" | cut -d'|' -f2)"
    url="$(echo "$row" | cut -d'|' -f3)"
    code="$(cut -d' ' -f1 "$SITE_TMP/$i" 2>/dev/null || echo 000)"
    secs="$(cut -d' ' -f2 "$SITE_TMP/$i" 2>/dev/null || echo 0)"
    ms="$(awk -v s="$secs" 'BEGIN{printf "%d", s*1000}' 2>/dev/null || echo 0)"

    case "$code" in
      200)
        SITES_UP=$((SITES_UP+1))
        health="<span class='chip live'>Up</span>"
        detail="${ms} ms"
        cls="ok" ;;
      401|403)
        # A password-gated deploy answers 401 through middleware.ts when
        # SITE_PASSWORD is set. The site is live; it just asked for the password.
        SITES_UP=$((SITES_UP+1))
        health="<span class='chip live'>Gated</span>"
        detail="Password gate, ${ms} ms"
        cls="ok" ;;
      000)
        health="<span class='chip flat'>Unreachable</span>"
        if echo "$url" | grep -q "$STATUS_INTERNAL_HOST_MATCH"; then
          detail="Internal host. Check Twingate VPN"
        else
          detail="No response in ${STATUS_SITE_TIMEOUT}s"
        fi
        cls="muted" ;;
      *)
        health="<span class='chip down'>HTTP ${code}</span>"
        detail="${ms} ms"
        cls="warn" ;;
    esac

    SITE_ROWS="${SITE_ROWS}<tr class='${cls}'><td><strong>${app}</strong></td><td><code>${branch}</code></td><td><a href='${url}' target='_blank' rel='noreferrer'>${url#https://}</a></td><td>${health}</td><td class='num'>${detail}</td></tr>"
  done
  rm -rf "$SITE_TMP"
fi

# ── data: content, grouped by project ────────────────────────────────────
# One tab that answers "what has this project made". A project's prototype, its
# pages and its plan docs sit together under one heading, because that is the
# unit someone actually thinks in. The kind is a badge on the card, not a tab.
#
# Groups come from STATUS_GROUPS in the config: first matching pattern wins,
# declared order is render order, and anything unmatched lands in Unfiled.
esc_html() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

UNFILED="Unfiled"

group_for() {
  local hay row name pats pat
  hay=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  for row in ${STATUS_GROUPS[@]+"${STATUS_GROUPS[@]}"}; do
    name="${row%%|*}"
    pats="${row#*|}"
    for pat in $pats; do
      case "$hay" in
        *"$pat"*) echo "$name"; return ;;
      esac
    done
  done
  echo "$UNFILED"
}

ITEM_FILE=$(mktemp)
# Each line: group <TAB> date <TAB> card HTML. Cards carry no tabs.
add_item() { printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$ITEM_FILE"; }

card() {
  # 1 kind, 2 title, 3 desc-html, 4 date, 5 chip, 6 open-attrs, 7 tag, 8 extra class
  # The extra class is its own argument on purpose: folding it into the attrs
  # emitted a second class attribute, which the parser drops, so doc cards
  # silently lost md-link and stopped being clickable.
  printf '<%s class="card%s"%s><div class="c-top"><div class="c-title">%s</div>%s</div><div class="c-desc">%s</div><div class="c-foot"><span class="type">%s</span><span class="mtime num">%s</span></div></%s>' \
    "$7" "${8:-}" "$6" "$2" "$5" "$3" "$1" "$4" "$7"
}

# Registry entries. Fields are read from the first quote to the last quote on
# the line, so a description containing a comma or a colon survives.
parse_registry() {
  # The single quote is passed in as q: an awk program lives inside single
  # quotes, so a literal quote cannot be written directly.
  awk -v q="'" '
    function val(l) {
      i = index(l, q); if (i == 0) return "";
      r = substr(l, i + 1); j = length(r);
      while (j > 0 && substr(r, j, 1) != q) j--;
      return substr(r, 1, j - 1);
    }
    /^[[:space:]]*id:/           { id = val($0) }
    /^[[:space:]]*name:/         { nm = val($0) }
    /^[[:space:]]*description:/  { ds = val($0) }
    /^[[:space:]]*lastModified:/ { lm = val($0) }
    /^[[:space:]]*section:/      { if (id != "") { print id "\t" nm "\t" ds "\t" lm "\t" val($0); id = "" } }
  ' "$1" 2>/dev/null
}

PROTO_MINE_N=0
PROTO_LIB_N=0
for reg in src/prototypes/registry-mine.ts src/prototypes/registry-core.ts; do
  [ -f "$reg" ] || continue
  while IFS=$'\t' read -r id nm ds lm sec; do
    [ -z "$id" ] && continue
    case "$reg" in
      *mine*) PROTO_MINE_N=$((PROTO_MINE_N+1)) ;;
      *)      PROTO_LIB_N=$((PROTO_LIB_N+1)) ;;
    esac
    case "$sec" in
      mine)     chip="<span class='chip wip'>Mine</span>" ;;
      sample)   chip="<span class='chip live'>Library</span>" ;;
      archived) chip="<span class='chip flat'>Archived</span>" ;;
      *)        chip="<span class='chip flat'>${sec}</span>" ;;
    esac
    add_item "$(group_for "$id $nm")" "${lm:-0000-00-00}" \
      "$(card 'prototype' "$(printf '%s' "$nm" | esc_html)" \
              "$(printf '%s' "$ds" | esc_html)" "${lm:-—}" "$chip" \
              " href=\"${STATUS_APP_BASE}/playground/${id}\" title=\"${STATUS_APP_BASE}/playground/${id}\"" 'a')"
  done < <(parse_registry "$reg")
done

# Standalone pages under public/. The dashboard is written into that folder, so
# a plain relative href opens each one straight from file://.
PAGE_COUNT=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  base="$(basename "$f")"
  [ "$base" = "status.html" ] && continue
  PAGE_COUNT=$((PAGE_COUNT+1))
  # The last commit date, so switching branches cannot fake freshness. An
  # uncommitted page falls back to its file date and still shows up.
  pdate="$(git log -1 --format=%ad --date=short -- "$f" 2>/dev/null)"
  pchip="<span class='chip flat'>Page</span>"
  if [ -z "$pdate" ]; then
    pdate="$(stat -f "%Sm" -t "%Y-%m-%d" "$f" 2>/dev/null)"
    pchip="<span class='chip wip'>Local</span>"
  fi
  # The title comes out of HTML, so it already carries entities. Decode them
  # first, otherwise esc_html escapes the ampersand a second time.
  title="$(grep -o '<title>[^<]*</title>' "$f" 2>/dev/null | head -1 \
    | sed -e 's/<title>//' -e 's|</title>||' \
          -e 's/&amp;/\&/g' -e 's/&lt;/</g' -e 's/&gt;/>/g' -e 's/&#39;/'"'"'/g' -e 's/&quot;/"/g')"
  [ -z "$title" ] && title="$base"
  pdesc="$(grep -o 'name="description" content="[^"]*"' "$f" 2>/dev/null | head -1 | sed -e 's/.*content="//' -e 's/"$//' | cut -c1-190)"
  [ -z "$pdesc" ] && pdesc="$base"
  add_item "$(group_for "$base $title")" "$pdate" \
    "$(card 'page' "$(printf '%s' "$title" | esc_html)" "$(printf '%s' "$pdesc" | esc_html)" \
            "$pdate" "$pchip" " href=\"./${base}\" title=\"public/${base}\"" 'a')"
done < <(find public -maxdepth 1 -name '*.html' 2>/dev/null | sort)

# Project docs. A doc only reaches Content when it matches a configured group:
# an unmatched markdown file is repo machinery, not project work, and stays in
# Docs and plans only. Clicking one opens the same embedded copy.
DOC_ITEM_N=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$(basename "$f")" in CHANGELOG*.md) continue ;; esac
  g="$(group_for "$f")"
  [ "$g" = "$UNFILED" ] && continue
  DOC_ITEM_N=$((DOC_ITEM_N+1))
  ddate="$(git log -1 --format=%ad --date=short -- "$f" 2>/dev/null)"
  [ -z "$ddate" ] && ddate="$(stat -f "%Sm" -t "%Y-%m-%d" "$f" 2>/dev/null)"
  dtitle="$(grep -m1 '^# ' "$f" 2>/dev/null | sed 's/^# *//')"
  [ -z "$dtitle" ] && dtitle="$(basename "$f" .md)"
  # First real prose line: skip headings, the bold metadata block, lists,
  # tables, quotes and code fences.
  ddesc="$(awk '
    # Skip a YAML frontmatter block, otherwise its keys read as the summary.
    NR == 1 && /^---[[:space:]]*$/ { fm = 1; next }
    fm && /^---[[:space:]]*$/      { fm = 0; next }
    fm                             { next }
    /^[[:space:]]*$/               { next }
    /^#/                           { next }
    /^[*_>|`-]/                    { next }
    /^[[:space:]]*[0-9]+\./         { next }
    { print; exit }
  ' "$f" 2>/dev/null | sed -e 's/\*\*//g' -e 's/`//g' | cut -c1-190)"
  [ -z "$ddesc" ] && ddesc="$f"
  did="$(embed_doc "$f")"
  dchip="<span class='chip flat'>Doc</span>"
  case "$f" in *archive/*) dchip="<span class='chip flat'>Archived</span>" ;; esac
  [ -n "$(local_badge "$f")" ] && dchip="<span class='chip wip'>Local</span>"
  add_item "$g" "$ddate" \
    "$(card 'doc' "$(printf '%s' "$dtitle" | esc_html)" "$(printf '%s' "$ddesc" | esc_html)" \
            "$ddate" "$dchip" " role=\"button\" tabindex=\"0\" data-target=\"md-${did}\" title=\"${f}\"" 'div' ' md-link')"
done < <(find docs -maxdepth 2 -name '*.md' 2>/dev/null | sort)

# Render group by group, config order first, then Unfiled.
CONTENT_SECTIONS=""
render_group() {
  local g="$1" rows n
  rows="$(awk -F'\t' -v g="$g" '$1 == g { print $2 "\t" $3 }' "$ITEM_FILE" | sort -r | cut -f2-)"
  [ -z "$rows" ] && return
  n=$(awk -F'\t' -v g="$g" '$1 == g' "$ITEM_FILE" | wc -l | tr -d ' ')
  CONTENT_SECTIONS="${CONTENT_SECTIONS}<h2>$(printf '%s' "$g" | esc_html) <span class=\"n num\">${n}</span></h2><div class=\"cards\">${rows}</div>"
}
for row in ${STATUS_GROUPS[@]+"${STATUS_GROUPS[@]}"}; do
  render_group "${row%%|*}"
done
render_group "$UNFILED"
rm -f "$ITEM_FILE"

# Colour of the Sites pill in the toolbar.
if [ "$SITES_TOTAL" -eq 0 ]; then SITE_DOT="down"
elif [ "$SITES_UP" -eq "$SITES_TOTAL" ]; then SITE_DOT=""
elif [ "$SITES_UP" -eq 0 ]; then SITE_DOT="down"
else SITE_DOT="warn"; fi

PROTOTYPE_COUNT=$((PROTO_MINE_N + PROTO_LIB_N))
CONTENT_TOTAL=$((PROTOTYPE_COUNT + PAGE_COUNT + DOC_ITEM_N))
BRANCH_N=$(git for-each-ref --format='%(refname)' refs/heads/ 2>/dev/null | wc -l | tr -d ' ')

# ── render HTML ──────────────────────────────────────────────────────────
mkdir -p public
cat > "$OUT" <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${STATUS_TAB_TITLE}</title>
$(canvas_style)
<style>
  .runbox { border: 1px solid var(--border-strong); border-radius: var(--radius); background: var(--surface); padding: 18px 20px; margin: 4px 0 22px; max-width: 760px; }
  .runbox p { margin: 0; }
  .runbox-cmd { display: flex; align-items: center; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
  .runbox-cmd code { font-size: 14px; padding: 6px 10px; }
  .runbox-note { color: var(--text-3); font-size: 12.5px; }
</style>
</head>
<body>
<div class="wash"></div>
<div class="shell">
<header>
  <div class="label">Local project canvas</div>
  <h1>${STATUS_TITLE}<em>${STATUS_TITLE_EM}</em></h1>
  <div class="meta">Generated <span class="num">${NOW}</span> · branch <code>${CUR_BRANCH}</code> · <strong class="num">${MOD_COUNT}</strong> modified, <strong class="num">${UNTRACKED_COUNT}</strong> untracked</div>
</header>
<div class="toolbar">
  <nav class="tabs">
    <button class="tab-btn active" data-tab="overview">Overview</button>
    <button class="tab-btn" data-tab="content">Content<span class="n">${CONTENT_TOTAL}</span></button>
    <button class="tab-btn" data-tab="branches">Branches<span class="n">${BRANCH_N}</span></button>
    <button class="tab-btn" data-tab="sites">Sites<span class="n">${SITES_TOTAL}</span></button>
    <button class="tab-btn" data-tab="forks">$( $IS_MAINTAINER && echo "Forks" || echo "Upstream" )</button>
$( $IS_MAINTAINER && echo '    <button class="tab-btn" data-tab="census">Census</button>' )
    <button class="tab-btn" data-tab="docsplans">Docs and plans</button>
  </nav>
  <div class="tools">
    <button class="pill" id="site-pill" data-tab="sites" title="Jump to the Sites tab">
      <span class="dot ${SITE_DOT}"></span>Sites<span class="m">${SITES_UP}/${SITES_TOTAL} up</span>
    </button>
    <button class="pill" id="look-toggle" title="Switch between the Modern ASCII look and the Studio look">Look<span class="m" id="look-name">—</span></button>
    <button class="pill" id="mode-toggle" title="Switch between light and dark">Mode<span class="m" id="mode-name">—</span></button>
  </div>
</div>
<main>

<section id="overview" class="active">
  <h2>Topology</h2>
  <pre class="diagram">${DIAGRAM}</pre>

  <h2>Snapshot</h2>
  <div class="stat-grid">
    <div class="stat"><div class="k">Current branch</div><div class="v">${CUR_BRANCH}</div></div>
    <div class="stat"><div class="k">vs origin</div><div class="v">${ORIGIN_VS}</div></div>
    <div class="stat"><div class="k">Modified</div><div class="v">${MOD_COUNT}</div></div>
    <div class="stat"><div class="k">Staged</div><div class="v">${STAGED_COUNT}</div></div>
    <div class="stat"><div class="k">Untracked</div><div class="v">${UNTRACKED_COUNT}</div></div>
    <div class="stat"><div class="k">Stashes</div><div class="v">${STASH_COUNT}</div></div>
    <div class="stat"><div class="k">Prototypes</div><div class="v">${PROTOTYPE_COUNT}</div></div>
    <div class="stat"><div class="k">Last build</div><div class="v">${LAST_BUILD}</div></div>
    <div class="stat"><div class="k">Build size</div><div class="v">${BUILD_SIZE}</div></div>
  </div>

  <h2>HEAD</h2>
  <p><code>${HEAD_SHA}</code> ${HEAD_MSG}<br><span class="file-list">${HEAD_DATE}</span></p>

  <h2>Working tree</h2>
  <details ${MOD_COUNT:+open}><summary>Modified (${MOD_COUNT})</summary><pre class="file-list">${MODIFIED_LIST}</pre></details>
  <details><summary>Untracked (${UNTRACKED_COUNT})</summary><pre class="file-list">${UNTRACKED_LIST}</pre></details>

  <h2>Recent commits</h2>
  <table>
    <thead><tr><th>SHA</th><th>When</th><th>Author</th><th>Message</th></tr></thead>
    <tbody>
HTML

# Recent commits rows
while IFS='|' read -r sha when author msg; do
  [ -z "$sha" ] && continue
  cat >> "$OUT" <<ROW
      <tr><td><code>${sha}</code></td><td>${when}</td><td>${author}</td><td>${msg}</td></tr>
ROW
done <<< "$RECENT_COMMITS"

cat >> "$OUT" <<HTML
    </tbody>
  </table>

  <h2>Remotes</h2>
  <pre class="file-list">${REMOTES}</pre>
</section>

<section id="content">
  <p class="file-list">Grouped by project: ${PROTOTYPE_COUNT} prototypes, ${PAGE_COUNT} pages and ${DOC_ITEM_N} project docs. Newest first inside each group, dated by last commit. Groups come from <code>STATUS_GROUPS</code> in <code>internal/status.config.sh</code>; anything under Unfiled needs a pattern adding there.</p>
  ${CONTENT_SECTIONS:-<p class="empty">Nothing to show.</p>}
</section>

<section id="branches">
  <h2>Worktrees</h2>
  <p class="file-list">Each worktree is an independent checkout. Modified count, branch divergence vs <code>main</code>, and locked/prunable flags shown.</p>
  <table>
    <thead><tr><th>Path</th><th>Branch</th><th>State</th><th>vs main</th></tr></thead>
    <tbody>${WORKTREE_ROWS:-<tr><td colspan='4' class='empty'>No worktrees.</td></tr>}</tbody>
  </table>

  <h2>All local branches</h2>
  <p class="file-list">Divergence shown vs <code>main</code>, <code>staging</code>, and upstream${BASE_UPSTREAM:+ (<code>${BASE_UPSTREAM}</code>)}. <code>—</code> means baseline does not exist locally.</p>
  <table>
    <thead><tr><th>Branch</th><th>vs main</th><th>vs staging</th><th>vs upstream</th><th>Last commit</th></tr></thead>
    <tbody>${BRANCH_ROWS}</tbody>
  </table>
</section>

<section id="sites">
  <h2>Deploys</h2>
  <p class="file-list">Every row is from <code>internal/status.config.sh</code>, checked at once with a ${STATUS_SITE_TIMEOUT}s timeout. Up means the URL answered 200.</p>
  <table>
    <thead><tr><th>Platform</th><th>Branch</th><th>URL</th><th>Health</th><th>Detail</th></tr></thead>
    <tbody>${SITE_ROWS:-<tr><td colspan='5' class='empty'>No deploys configured. Add rows to STATUS_DEPLOYS in internal/status.config.sh.</td></tr>}</tbody>
  </table>
  <p class="file-list">A Coolify URL is internal and only answers on Twingate VPN. Unreachable off VPN is the network, not a broken deploy. Vercel deploys from <code>origin</code>; Coolify deploys from <code>galaxy</code>, so a push to only one remote updates only one column.</p>
</section>

<section id="forks">
HTML

if $IS_MAINTAINER; then
  cat >> "$OUT" <<HTML
HTML
  if [ -n "$FORKS_SAVED_AT" ]; then
    FORKS_STALE=""
    [ $(( EPOCH_NOW - FORKS_SAVED_AT )) -gt 604800 ] && FORKS_STALE=$(run_full_box "These fork numbers are more than a week old. Refresh them with:")
    cat >> "$OUT" <<HTML
  <p class="file-list">Saved $(age_of "$FORKS_SAVED_AT") · refresh with <code>${FULL_CMD}</code></p>
  ${FORKS_STALE}
  <h2>Upstream HEAD</h2>
  <pre class="file-list">${UPSTREAM_HEAD:-—}</pre>

  <h2>Forks</h2>
  <table>
    <thead><tr><th>Fork</th><th>Status</th><th>Behind</th><th>Ahead</th><th>Last push</th></tr></thead>
    <tbody>${FORK_ROWS}</tbody>
  </table>

  <h2>Action items</h2>
  <ul>${ACTION_LINES:-<li class='empty'>No forks need a sync nudge right now.</li>}</ul>

  <h2>Active prototype work</h2>
  ${PROTOTYPE_LINES:-<p class='empty'>No prototype commits detected on forks.</p>}
HTML
  elif $FULL && ! $have_gh_galaxy; then
    cat >> "$OUT" <<HTML
  <p class="empty">Not authenticated to ${HOST}. Run <code>gh auth login --hostname ${HOST}</code>, then <code>${FULL_CMD}</code> again for live ahead/behind numbers.</p>
HTML
  else
    cat >> "$OUT" <<HTML
  $(run_full_box "Fork numbers aren't loaded yet. Each fork's sync state, its last push and its prototype work come from GitHub, which is slow, so a plain run skips them. Run:")
HTML
  fi
elif [ -n "$DESIGNER_UPSTREAM_REMOTE" ]; then
  cat >> "$OUT" <<HTML
  <h2>Upstream sync</h2>
  <p>Tracking <code>${DESIGNER_UPSTREAM_REMOTE}/main</code> at <code>${DESIGNER_UPSTREAM_URL}</code>.</p>
  <div class="stat-grid">
    <div class="stat"><div class="k">Behind upstream</div><div class="v">${DESIGNER_BEHIND}</div></div>
    <div class="stat"><div class="k">Ahead of upstream</div><div class="v">${DESIGNER_AHEAD}</div></div>
  </div>
  <h2>Upstream HEAD</h2>
  <pre class="file-list">${DESIGNER_UPSTREAM_HEAD:-—}</pre>
  <p>If <strong>Behind</strong> is non-zero, run <code>/rp-sync-upstream</code> to pull the latest changes.</p>
HTML
else
  cat >> "$OUT" <<HTML
  <h2>Upstream sync</h2>
  <p class="empty">No <code>upstream</code> remote configured. Run <code>/rp-sync-upstream</code> to set one up — it adds <code>https://${HOST}/mohammed-faris/radiantplay.git</code> as <code>upstream</code> and fetches the latest changes.</p>
HTML
fi

cat >> "$OUT" <<HTML
</section>
HTML

if $IS_MAINTAINER; then
  cat >> "$OUT" <<HTML
<section id="census">
  <h2>Prototype census</h2>
  ${CENSUS_BLOCK}
</section>
HTML
fi

cat >> "$OUT" <<HTML

<section id="docsplans">
  <div class="subtabs">
    <button class="sub-btn active" data-sub="all">All</button>
    <button class="sub-btn" data-sub="plans">Plans</button>
    <button class="sub-btn" data-sub="rules">Rules</button>
    <button class="sub-btn" data-sub="commands">Slash commands</button>
    <button class="sub-btn" data-sub="docs">Docs</button>
    <button class="sub-btn" data-sub="articles">Articles</button>
  </div>

  <div class="sub-section" data-sub="plans">
    <h2>Active plans</h2>
    <p class="file-list">In-flight work: roadmaps, backlog, plan documents.</p>
    <table>
      <thead><tr><th>Path</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>${ACTIVE_PLAN_ROWS:-<tr><td colspan='3' class='empty'>No active plans found.</td></tr>}</tbody>
    </table>
  </div>

  <div class="sub-section" data-sub="rules">
    <h2>Orchestrator &amp; system rules</h2>
    <p class="file-list">Rules that govern how Claude works in this repo — design system, orchestration, prototype generation.</p>
    <table>
      <thead><tr><th>Path</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>${RULE_ROWS}</tbody>
    </table>
  </div>

  <div class="sub-section" data-sub="commands">
    <h2>Slash commands</h2>
    <table>
      <thead><tr><th>Path</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>${COMMAND_ROWS}</tbody>
    </table>
  </div>

  <div class="sub-section" data-sub="docs">
    <h2>General docs</h2>
    <p class="file-list">Reference material — guides, patterns, changelog.</p>
    <table>
      <thead><tr><th>Path</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>${DOC_ROWS}</tbody>
    </table>
  </div>

  <div class="sub-section" data-sub="articles">
    <h2>Articles</h2>
    <table>
      <thead><tr><th>Path</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>${ARTICLE_ROWS:-<tr><td colspan='3' class='empty'>No articles.</td></tr>}</tbody>
    </table>
  </div>
</section>

</main>
<footer>
  Generated by <code>internal/scripts/status.sh</code> · settings in <code>internal/status.config.sh</code> · re-run any time · zero LLM tokens
</footer>
</div>

<div id="docview">
  <div class="doc-topbar">
    <button class="backlink" id="doc-back">&larr; Canvas</button>
    <span class="pagelabel" id="doc-label">Doc</span>
  </div>
  <div class="doc-wrap">
    <p class="docmeta">Path <code id="doc-path">&mdash;</code></p>
    <div class="md" id="doc-body">&mdash;</div>
  </div>
</div>

$(cat "$EMBED_FILE")

$(canvas_script)
<script>
  // Copy buttons on the run boxes; falls back to selecting the command.
  document.querySelectorAll('.copy-cmd').forEach((b) => b.addEventListener('click', () => {
    const cmd = b.dataset.cmd, done = () => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(cmd).then(done, () => {});
    else { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); getSelection().removeAllRanges(); getSelection().addRange(r); }
  }));
</script>
</body>
</html>
HTML

echo "✓ Wrote $OUT"

# ── open browser ─────────────────────────────────────────────────────────
if ! $NO_OPEN; then
  if command -v open >/dev/null; then
    open "$OUT"
  fi
fi
