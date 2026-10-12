#!/usr/bin/env bash
# Generates public/status.html with repo + branch + fork + plan-file overview.
# Pure shell + gh + git. No LLM tokens. Re-run any time.
#
# Usage:  bash internal/scripts/status.sh         (also opens browser)
#         bash internal/scripts/status.sh --no-open

set -u
# Repo root, resolved via git so it stays correct no matter where this script
# lives (it moved into internal/scripts/ during the reorg — a hardcoded ../ broke
# it). Falls back to two-levels-up if git is unavailable.
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || (cd "$(dirname "$0")/../.." && pwd))"
cd "$ROOT"

OUT="public/status.html"

# ── config ───────────────────────────────────────────────────────────────
# internal/status.config.sh holds every setting a fork would want to change:
# identity, git host, baselines, branch purposes and the Sites rows. It is a
# sourced shell file, not JSON, so this script keeps needing nothing but shell,
# git and gh. A fork without the file falls back to the defaults below.
CONFIG="$ROOT/internal/status.config.sh"
# shellcheck source=/dev/null
[ -f "$CONFIG" ] && . "$CONFIG"

STATUS_TITLE="${STATUS_TITLE:-Radiant}"
STATUS_TITLE_EM="${STATUS_TITLE_EM:-Play}"
STATUS_TAB_TITLE="${STATUS_TAB_TITLE:-Radiant Play canvas}"
STATUS_LOOK="${STATUS_LOOK:-ascii}"
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
have_gh_galaxy=false
if gh auth status --hostname "$HOST" >/dev/null 2>&1; then have_gh_galaxy=true; fi

# ── role detection ───────────────────────────────────────────────────────
# Maintainer = has a remote (named `galaxy`) pointing to mohammed-faris/radiantplay
# AND is the only one pushing to it. We approximate this by remote name + URL.
# Designer = has an `upstream` remote (per /rp-sync-upstream convention) pointing
# at mohammed-faris/radiantplay. They want to know how behind their fork is,
# not see the whole fork network.
IS_MAINTAINER=false
DESIGNER_UPSTREAM_REMOTE=""
galaxy_url=$(git remote get-url galaxy 2>/dev/null || echo "")
upstream_url=$(git remote get-url upstream 2>/dev/null || echo "")
if echo "$galaxy_url" | grep -q "mohammed-faris/radiantplay"; then
  IS_MAINTAINER=true
elif echo "$upstream_url" | grep -q "mohammed-faris/radiantplay"; then
  DESIGNER_UPSTREAM_REMOTE="upstream"
fi

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

# Prototype census cache (populated by internal/scripts/prototype-census.sh).
# Displayed cheaply here — never recomputed by this script.
# Anchor to the real repo root so it resolves no matter what cwd this runs from.
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
CENSUS_CACHE="$REPO_ROOT/internal/cache/prototype-census.html"
if [ -f "$CENSUS_CACHE" ]; then
  CENSUS_BLOCK=$(cat "$CENSUS_CACHE")
else
  CENSUS_BLOCK="<p class='empty'>No census yet. Run <code>/rp-prototype-census</code> (slow — fetches every fork) to count prototypes across all forks.</p>"
fi

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
if $have_gh_galaxy && $IS_MAINTAINER; then
  UPSTREAM_HEAD_JSON=$(gh api repos/mohammed-faris/radiantplay/commits/main --hostname "$HOST" --jq '{sha: .sha[:7], message: .commit.message | split("\n")[0], date: .commit.committer.date}' 2>/dev/null)
  UPSTREAM_HEAD=$(echo "$UPSTREAM_HEAD_JSON" | esc)

  # Discover forks
  API_FORKS=$(gh api repos/mohammed-faris/radiantplay/forks --hostname "$HOST" --jq '.[].full_name' 2>/dev/null)
  KNOWN="suraj-boro/radiantplay umesh-indoriya/radiantplay vivek-sahi/radiantplay jason-knight/radiantplay irene-ren/radiantplay jayant-mishra/radiantplay simran-pandit/radiantplay aditya-wadher/radiantplay devanshi-behera/radiantplay akshay-mohankar/radiantplay komal-bains/radiantplay_komal abhinav-gupta/radiantplay yash-chauhan/radiantplay tarun-bhandari/radiantplay kshipra-sharma/radiantplay"
  ALL_FORKS=$(printf '%s\n' $API_FORKS $KNOWN | sort -u)

  # Collect rows into a tempfile keyed by pushed_at so we can sort newest-first.
  FORK_TMP=$(mktemp -t rp-fork-rows)
  for f in $ALL_FORKS; do
    owner=${f%%/*}
    pushed=$(gh api "repos/$f" --hostname "$HOST" --jq '.pushed_at' 2>/dev/null)
    cmp=$(gh api "repos/mohammed-faris/radiantplay/compare/main...$owner:main" --hostname "$HOST" --jq '{ahead: .ahead_by, behind: .behind_by}' 2>/dev/null)
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
      msgs=$(gh api "repos/mohammed-faris/radiantplay/compare/main...$owner:main" --hostname "$HOST" --jq '.commits[].commit.message | split("\n")[0]' 2>/dev/null | grep -iE 'feat|prototype' | head -8 | esc)
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

# "local" when the file is gitignored or not yet committed.
local_badge() {
  local p="$1"
  if git check-ignore -q "$p" 2>/dev/null; then
    echo " <span class='badge local' title='Gitignored, exists only on this machine'>local</span>"
  elif [ -n "$(git ls-files --others --exclude-standard "$p" 2>/dev/null)" ]; then
    echo " <span class='badge local' title='Untracked, not yet committed to git'>local</span>"
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
<style>
  /* ─────────────────────────────────────────────────────────────────────
     Two looks, one token layer.

     "ascii"  Modern ASCII, the repo canon: flat squares, JetBrains-style mono
              labels, warm amber as the only accent, 1px visible borders.
     "studio" borrowed from the agentspot Data Apps canvas: rounded surfaces,
              sans labels, indigo links, a soft peach wash behind the header.

     Every component below reads the semantic tokens only, so the look toggle
     changes shape, label voice and accent, not just hue. Blocks are ordered
     base, ascii dark, studio light, studio dark; the combined selector is the
     most specific, so it wins for studio in dark.
     ───────────────────────────────────────────────────────────────────── */
  :root {
    --sans: ui-sans-serif, -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
    --mono: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace;

    /* Modern ASCII palette */
    --cream-00: #faf7ee; --cream-10: #f5f1e8; --cream-20: #ede7d6; --cream-30: #e0d8c0;
    --ink-90: #0f172a;
    --ink-70: rgba(15,23,42,.72); --ink-55: rgba(15,23,42,.55);
    --ink-40: rgba(15,23,42,.40); --ink-25: rgba(15,23,42,.25);

    /* Semantic hues, separate from the accent */
    --green: #166534; --green-bg: rgba(22,101,52,.09);
    --amber: #92600a; --amber-deep: #78500a;
    --amber-bg: rgba(146,96,10,.08); --amber-border: rgba(146,96,10,.22);
    --red: #991b1b; --red-bg: rgba(153,27,27,.08);
    --blue: #1d4ed8; --purple: #6d28d9;

    /* Surfaces and lines */
    --page-bg: var(--cream-00);
    --page-grad: none;
    --wash-op: 0;
    --surface: var(--cream-10);
    --surface-2: var(--cream-20);
    --hover: rgba(146,96,10,.05);
    --border: var(--amber-border);
    --border-strong: rgba(146,96,10,.40);
    --row-border: var(--amber-border);
    --th-bg: transparent;
    --code-bg: var(--amber-bg);

    /* Text */
    --text: var(--ink-90); --text-2: var(--ink-70);
    --text-3: var(--ink-55); --text-4: var(--ink-40);

    /* Accent and links */
    --accent: var(--amber-deep);
    --accent-bg: var(--amber-bg);
    --accent-border: var(--amber-border);
    --link: var(--amber-deep); --link-h: var(--amber);

    /* Chips */
    --chip-live-bg: var(--green-bg); --chip-live-tx: var(--green);
    --chip-wip-bg: var(--amber-bg);  --chip-wip-tx: var(--amber-deep);
    --chip-flat-bg: var(--cream-20); --chip-flat-tx: var(--ink-55);
    --chip-down-bg: var(--red-bg);   --chip-down-tx: var(--red);

    /* Shape: flat squares are signature 1 of the ASCII system */
    --radius: 0px; --radius-sm: 0px; --radius-pill: 0px;
    --shadow: none;

    /* Label voice: mono, uppercase, wide tracking */
    --label-font: var(--mono);
    --label-tr: uppercase;
    --label-ls: .14em;
    --label-w: 700;
    --label-size: 11.5px;
  }

  html[data-mode="dark"] {
    --cream-00: #0b1120; --cream-10: #111827; --cream-20: #1a2436; --cream-30: #283145;
    --ink-90: #f5f1e8;
    --ink-70: rgba(245,241,232,.78); --ink-55: rgba(245,241,232,.58);
    --ink-40: rgba(245,241,232,.40); --ink-25: rgba(245,241,232,.24);
    --green: #4ade80; --green-bg: rgba(74,222,128,.12);
    --amber: #e0a868; --amber-deep: #f2c089;
    --amber-bg: rgba(224,168,104,.10); --amber-border: rgba(224,168,104,.30);
    --red: #f87171; --red-bg: rgba(248,113,113,.12);
    --blue: #60a5fa; --purple: #c4b5fd;
    --hover: rgba(224,168,104,.07);
    --border-strong: rgba(224,168,104,.52);
    color-scheme: dark;
  }

  html[data-look="studio"] {
    --page-bg: #fafafa;
    --page-grad: linear-gradient(145deg, #fdf8f7 0%, #fafafa 45%, #f7f6fc 100%);
    --wash-op: 1;
    --surface: #ffffff;
    --surface-2: #f5f5f8;
    --hover: #f7f7f9;
    --border: #d9d9e0;
    --border-strong: #c2c2cc;
    --row-border: #efeff3;
    --th-bg: #f5f5f8;
    --code-bg: #f2f2f4;
    --text: #16161a; --text-2: #3a3a44; --text-3: #5e5e6a; --text-4: #8a8a95;
    --green: #15803d; --amber: #b45309; --amber-deep: #b45309; --red: #b91c1c;
    --accent: #5a62d8;
    --accent-bg: rgba(90,98,216,.07);
    --accent-border: rgba(90,98,216,.28);
    --link: #5a62d8; --link-h: #3f47c4;
    --chip-live-bg: #e8f6ed; --chip-live-tx: #15803d;
    --chip-wip-bg: #fdf0dd;  --chip-wip-tx: #b45309;
    --chip-flat-bg: #ededf1; --chip-flat-tx: #5f5f69;
    --chip-down-bg: #fdeaea; --chip-down-tx: #b91c1c;
    --radius: 10px; --radius-sm: 6px; --radius-pill: 999px;
    --shadow: 0 1px 2px rgba(28,28,32,.04);
    --label-font: var(--sans);
    --label-tr: uppercase;
    --label-ls: .06em;
    --label-w: 750;
    --label-size: 11px;
    color-scheme: light;
  }

  html[data-look="studio"][data-mode="dark"] {
    --page-bg: #111114;
    --page-grad: linear-gradient(145deg, #16141a 0%, #111114 45%, #121118 100%);
    --wash-op: .14;
    --surface: #1a1a1f;
    --surface-2: #1f1f25;
    --hover: #222228;
    --border: #2c2c34;
    --border-strong: #3d3d47;
    --row-border: #232329;
    --th-bg: #1f1f25;
    --code-bg: #26262d;
    --text: #f2f2f7; --text-2: #cdcdd7; --text-3: #a0a0ac; --text-4: #7c7c88;
    --green: #4ade80; --amber: #f0b45c; --amber-deep: #f0b45c; --red: #f87171;
    --accent: #8b93f8;
    --accent-bg: rgba(139,147,248,.12);
    --accent-border: rgba(139,147,248,.32);
    --link: #8b93f8; --link-h: #aab0fa;
    --chip-live-bg: rgba(74,222,128,.13); --chip-live-tx: #4ade80;
    --chip-wip-bg: rgba(240,180,92,.13);  --chip-wip-tx: #f0b45c;
    --chip-flat-bg: #26262d;              --chip-flat-tx: #a2a2ae;
    --chip-down-bg: rgba(248,113,113,.14);--chip-down-tx: #f87171;
    color-scheme: dark;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font: 15px/1.55 var(--sans);
    background: var(--page-bg);
    color: var(--text-2);
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  html[data-look="studio"] body { background: var(--page-grad) fixed, var(--page-bg); }

  /* Peach wash behind the header. Inert in the ASCII look, where --wash-op is 0. */
  .wash { position: fixed; inset: 0 0 auto 0; height: 340px; pointer-events: none; z-index: 0; overflow: hidden; }
  .wash::before {
    content: ""; position: absolute; inset: 0; opacity: var(--wash-op);
    background:
      radial-gradient(ellipse 60rem 24rem at 46% -2rem, rgba(249,196,163,.36) 0%, rgba(249,196,163,.15) 34%, transparent 78%),
      radial-gradient(ellipse 46rem 20rem at 64% .5rem, rgba(247,170,138,.18) 0%, transparent 74%);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 40%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 40%, transparent 100%);
  }
  .shell { position: relative; z-index: 1; }

  /* ── Header and toolbar ─────────────────────────────────────────────── */
  header { padding: 28px 36px 0; }
  header .label {
    font: var(--label-w) var(--label-size)/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--accent); margin-bottom: 8px;
  }
  header h1 {
    margin: 0; font-family: var(--sans);
    font-size: 30px; font-weight: 800; letter-spacing: -.025em;
    color: var(--text);
  }
  header h1 em { font-style: normal; color: var(--accent); }
  header .meta { color: var(--text-3); font: 13.5px/1.4 var(--sans); margin-top: 6px; }
  header .meta code { font-size: 12px; }
  header .meta .num { font-variant-numeric: tabular-nums; }

  .toolbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
    padding: 18px 36px 0; margin-bottom: 22px;
  }
  nav.tabs {
    display: inline-flex; gap: 3px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px); padding: 3px;
  }
  nav.tabs button {
    background: none; border: 0; font: inherit;
    font-size: 12.5px; line-height: 18px; font-weight: 600;
    color: var(--text-2); padding: 6px 14px;
    border-radius: var(--radius-sm); cursor: pointer;
  }
  nav.tabs button:hover { color: var(--text); background: var(--hover); }
  nav.tabs button.active {
    background: var(--page-bg); color: var(--text);
    outline: 1px solid var(--border-strong);
  }
  html[data-look="ascii"] nav.tabs button {
    font: var(--label-w) var(--label-size)/18px var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
  }
  html[data-look="ascii"] nav.tabs button.active { color: var(--accent); }
  nav.tabs button .n {
    color: var(--text-3); font-weight: 600; margin-left: 6px;
    font-size: 11px; font-variant-numeric: tabular-nums;
  }
  .tools { display: inline-flex; align-items: center; gap: 8px; }
  .pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 13px; border-radius: calc(var(--radius) - 1px);
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text); font-size: 12.5px; font-weight: 600;
    text-decoration: none; white-space: nowrap;
  }
  button.pill { font-family: var(--sans); cursor: pointer; }
  button.pill:hover { border-color: var(--border-strong); }
  .pill .m { color: var(--text-3); font-weight: 500; font-variant-numeric: tabular-nums; }
  .pill .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex: none; }
  .pill .dot.warn { background: var(--amber); }
  .pill .dot.down { background: var(--text-4); }

  main { padding: 0 36px 64px; max-width: 1400px; }
  section { display: none; }
  section.active { display: block; }

  h2 {
    font: var(--label-w) var(--label-size)/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--accent);
    margin: 32px 0 10px; padding-bottom: 8px;
    background: linear-gradient(to right, var(--border), transparent) bottom/100% 1px no-repeat;
  }
  html[data-look="studio"] h2 { color: var(--text); background: none; padding-bottom: 2px; }
  h2:first-child { margin-top: 0; }
  h2 .n { color: var(--text-3); font-weight: 600; margin-left: 7px; text-transform: none; letter-spacing: 0; }
  p { margin: 6px 0 14px; }

  /* ── Tables ─────────────────────────────────────────────────────────── */
  table {
    width: 100%; font: 13.5px/1.5 var(--sans);
    border-collapse: separate; border-spacing: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; margin-bottom: 18px;
  }
  html[data-look="ascii"] table { background: transparent; border: 0; }
  th, td {
    text-align: left; padding: 10px 12px;
    border-bottom: 1px solid var(--row-border);
    vertical-align: top; color: var(--text-2);
  }
  td strong { color: var(--text); }
  tr:last-child td { border-bottom: 0; }
  html[data-look="ascii"] tr:last-child td { border-bottom: 1px solid var(--row-border); }
  th {
    font: var(--label-w) 11px/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--text-2); background: var(--th-bg);
    padding-top: 8px; padding-bottom: 8px;
  }
  td.num, .num { font-variant-numeric: tabular-nums; }
  tr.ok td:nth-child(2) { color: var(--green); font-weight: 600; }
  tr.warn td:nth-child(2) { color: var(--amber); font-weight: 600; }
  tr.muted td { color: var(--text-4); }

  code {
    font: 500 13px/1.4 var(--mono);
    background: var(--code-bg); color: var(--accent);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-sm); padding: 1px 6px;
  }
  html[data-look="studio"] code { color: var(--text-2); border-color: transparent; }
  code.has-note { border-bottom-style: dotted; cursor: help; }
  pre code, pre { background: transparent; border: 0; padding: 0; }
  a { color: var(--link); text-decoration: none; border-bottom: 1px solid var(--accent-border); }
  a:hover { color: var(--link-h); border-bottom-color: var(--link-h); }
  strong { color: var(--text); font-weight: 700; }
  em { font-style: normal; color: var(--accent); }

  /* ── Chips ──────────────────────────────────────────────────────────── */
  .chip {
    display: inline-block; font: 700 10px/1.6 var(--sans);
    letter-spacing: .02em; padding: 2px 8px;
    border-radius: var(--radius-pill); white-space: nowrap;
  }
  html[data-look="ascii"] .chip { border: 1px solid currentColor; }
  .chip.live { background: var(--chip-live-bg); color: var(--chip-live-tx); }
  .chip.wip  { background: var(--chip-wip-bg);  color: var(--chip-wip-tx); }
  .chip.flat { background: var(--chip-flat-bg); color: var(--chip-flat-tx); }
  .chip.down { background: var(--chip-down-bg); color: var(--chip-down-tx); }

  .badge { font: 700 9.5px/1.6 var(--sans); letter-spacing: .06em; padding: 1px 6px;
    border-radius: var(--radius-pill); margin-left: 6px; white-space: nowrap; }
  .badge.local { background: var(--chip-wip-bg); color: var(--chip-wip-tx); }

  /* ── Cards (Content tab) ────────────────────────────────────────────── */
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; margin-bottom: 22px; }
  .card {
    display: flex; flex-direction: column; gap: 5px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 13px 15px;
    text-decoration: none; color: inherit; box-shadow: var(--shadow);
    transition: border-color .12s ease;
  }
  a.card { border-bottom: 1px solid var(--border); cursor: pointer; }
  .card.md-link { cursor: pointer; text-align: left; font: inherit; }
  a.card:hover, .card.md-link:hover { border-color: var(--border-strong); background: var(--hover); }
  a.card:focus-visible, .card.md-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  a.card .c-title, .card.md-link .c-title { text-decoration: none; }
  .card:hover { border-color: var(--border-strong); }
  .c-top { display: flex; align-items: center; gap: 9px; }
  .c-title { font-size: 14px; font-weight: 650; color: var(--text); flex: 1; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .c-desc { color: var(--text-2); font-size: 12.5px; line-height: 1.45; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .c-desc code { font-size: 11.5px; }
  .c-foot { display: flex; align-items: center; gap: 8px; margin-top: 2px;
    font-size: 11px; font-weight: 500; color: var(--text-3); }
  .type { font-weight: 700; letter-spacing: .04em; border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 0 5px; }
  .mtime { margin-left: auto; }

  /* ── Stats, details, misc ───────────────────────────────────────────── */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat { background: var(--surface); padding: 14px 16px; border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow); }
  .stat .k {
    font: var(--label-w) 11px/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--text-2);
  }
  .stat .v { font: 700 20px/1.2 var(--sans); color: var(--text); margin-top: 6px;
    font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
  .diagram { font: 500 12.5px/1.5 var(--mono); color: var(--text-2); background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px;
    overflow-x: auto; margin: 0 0 18px; }
  .file-list { font: 500 12.5px/1.6 var(--mono); color: var(--text-2); margin: 0; white-space: pre-wrap; word-break: break-word; }
  .empty { color: var(--text-4); font-style: italic; }
  details { margin-bottom: 10px; }
  details summary { cursor: pointer; color: var(--text-2); font-weight: 600; font-size: 13.5px;
    padding: 6px 0; list-style-position: outside; }
  details summary:hover { color: var(--text); }
  ul li::marker { color: var(--text-4); }
  .proto-block { margin-bottom: 16px; }
  .proto-block h4 { margin: 0 0 4px; font-size: 13.5px; color: var(--text); }
  .proto-block ul { margin: 0 0 10px; padding-left: 20px; }
  .proto-block li::marker { color: var(--text-4); }
  footer { padding: 18px 36px 40px; color: var(--text-4); font: 12.5px/1.5 var(--mono);
    border-top: 1px solid var(--border); margin: 0 36px; }

  .subtabs { display: inline-flex; gap: 3px; background: var(--surface);
    border: 1px solid var(--border); border-radius: calc(var(--radius) + 2px);
    padding: 3px; margin-bottom: 18px; }
  .sub-btn { background: none; border: 0; font: inherit; font-size: 12px; font-weight: 600;
    color: var(--text-3); padding: 5px 12px; border-radius: var(--radius-sm); cursor: pointer; }
  .sub-btn:hover { color: var(--text); background: var(--hover); }
  .sub-btn.active { background: var(--page-bg); color: var(--text); outline: 1px solid var(--border-strong); }
  .sub-section.hidden { display: none; }
  .sub-section + .sub-section h2 { margin-top: 32px; }
  .sub-section:last-child { margin-bottom: 0; }

  .md-link { background: none; border: 0; font: 500 13px/1.4 var(--mono); color: var(--link);
    cursor: pointer; padding: 0; text-align: left; border-bottom: 1px solid var(--accent-border); }
  .md-link:hover { color: var(--link-h); border-bottom-color: var(--link-h); }
  /* ── Doc reading view ───────────────────────────────────────────────────
     A markdown file opens as its own page rather than a modal, the way the
     agentspot canvas does it with apps-doc.html. The difference is that the
     content is already embedded in this file, so the reading view takes over
     the page instead of navigating. That keeps the whole canvas working from
     file:// with nothing served.
     ─────────────────────────────────────────────────────────────────────── */
  body.reading > .shell > header,
  body.reading > .shell > .toolbar,
  body.reading > .shell > main,
  body.reading > .shell > footer { display: none; }
  #docview { display: none; }
  body.reading #docview { display: block; }
  .doc-topbar {
    position: sticky; top: 0; z-index: 8;
    display: flex; align-items: center; gap: 14px;
    padding: 12px 24px; border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .backlink {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: var(--text-2); font: 600 12.5px var(--sans);
    padding: 5px 11px; cursor: pointer;
  }
  .backlink:hover { color: var(--text); border-color: var(--border-strong); }
  .pagelabel {
    font: var(--label-w) 11px/1 var(--label-font);
    letter-spacing: var(--label-ls); text-transform: var(--label-tr);
    color: var(--text-3);
  }
  .doc-wrap { max-width: 860px; margin: 0 auto; padding: 34px 24px 96px; }
  .docmeta { color: var(--text-3); font-size: 12px; margin: 0 0 26px;
    border-bottom: 1px solid var(--border); padding-bottom: 18px; }
  .md { font-size: 14.5px; line-height: 1.68; color: var(--text-2); }
  .md > :first-child { margin-top: 0; }
  .md h1, .md h2, .md h3, .md h4 { color: var(--text); font-family: var(--sans);
    background: none; text-transform: none; }
  .md h1 { font-size: 26px; font-weight: 700; letter-spacing: -.01em; margin: 34px 0 12px; }
  .md h2 { font-size: 19px; font-weight: 700; margin: 32px 0 10px; padding-bottom: 6px;
    border-bottom: 1px solid var(--border); letter-spacing: -.005em; }
  .md h3 { font-size: 15.5px; font-weight: 650; margin: 26px 0 8px; }
  .md h4 { font-size: 14px; font-weight: 650; margin: 20px 0 6px; color: var(--text-2); }
  .md p { margin: 0 0 15px; }
  .md ul, .md ol { padding-left: 22px; margin: 0 0 15px; }
  .md li { margin-bottom: 5px; }
  .md li::marker { color: var(--text-4); }
  .md a { color: var(--link); }
  .md code { background: var(--code-bg); border: 0; border-radius: var(--radius-sm);
    padding: 1.5px 5px; font: 500 12.5px var(--mono); color: var(--text); }
  .md pre { background: #16161a; color: #e6e6ea; border: 0;
    border-radius: var(--radius); padding: 14px 16px; overflow-x: auto; margin: 0 0 16px; }
  .md pre code { background: none; padding: 0; color: inherit; font-size: 12.5px; }
  .md blockquote { margin: 0 0 16px; padding: 8px 16px;
    border-left: 3px solid var(--border-strong); background: var(--surface);
    color: var(--text-2); }
  .md table { width: 100%; margin: 0 0 18px; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .md th, .md td { text-align: left; vertical-align: top; padding: 10px 13px;
    border-bottom: 1px solid var(--row-border); font-size: 13px; color: var(--text-2); }
  .md th { font: 650 11px/1.5 var(--sans); text-transform: uppercase;
    letter-spacing: .04em; color: var(--text-2); background: var(--th-bg); }
  .md tr:last-child td { border-bottom: 0; }
  .md hr { border: 0; border-top: 1px solid var(--border); margin: 26px 0; }
  .md img { max-width: 100%; }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  @media (max-width: 720px) {
    header, .toolbar, main { padding-left: 18px; padding-right: 18px; }
    footer { margin: 0 18px; padding-left: 0; padding-right: 0; }
    header h1 { font-size: 24px; }
  }
</style>
<script>
  // Runs before <body> so the chosen look and mode are on <html> at first paint.
  // The config default only applies until the reader picks their own.
  (function () {
    var DEFAULT_LOOK = '${STATUS_LOOK}';
    var look, mode, seenDefault;
    try { look = localStorage.getItem('rp-canvas-look'); } catch (e) { look = null; }
    try { mode = localStorage.getItem('rp-canvas-mode'); } catch (e) { mode = null; }
    try { seenDefault = localStorage.getItem('rp-canvas-look-default'); } catch (e) { seenDefault = null; }
    // A change to STATUS_LOOK in the config wins once, even in a browser that
    // has already toggled. After that the reader's own choice sticks again.
    if (seenDefault !== DEFAULT_LOOK) {
      look = DEFAULT_LOOK;
      try {
        localStorage.setItem('rp-canvas-look', look);
        localStorage.setItem('rp-canvas-look-default', DEFAULT_LOOK);
      } catch (e) {}
    }
    if (look !== 'ascii' && look !== 'studio') look = (DEFAULT_LOOK === 'studio') ? 'studio' : 'ascii';
    if (mode !== 'light' && mode !== 'dark') {
      mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-look', look);
    document.documentElement.setAttribute('data-mode', mode);
  })();
</script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" onerror="window.markedFailed=true"></script>
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
  <h2>Upstream HEAD</h2>
  <pre class="file-list">${UPSTREAM_HEAD:-—}</pre>

  <h2>Forks</h2>
HTML
  if $have_gh_galaxy; then
    cat >> "$OUT" <<HTML
  <table>
    <thead><tr><th>Fork</th><th>Status</th><th>Behind</th><th>Ahead</th><th>Last push</th></tr></thead>
    <tbody>${FORK_ROWS}</tbody>
  </table>

  <h2>Action items</h2>
  <ul>${ACTION_LINES:-<li class='empty'>No forks need a sync nudge right now.</li>}</ul>

  <h2>Active prototype work</h2>
  ${PROTOTYPE_LINES:-<p class='empty'>No prototype commits detected on forks.</p>}
HTML
  else
    cat >> "$OUT" <<HTML
  <p class="empty">Not authenticated to ${HOST}. Run <code>gh auth login --hostname ${HOST}</code> and re-run this script for live ahead/behind numbers.</p>
HTML
  fi
  # Census is git-based (not gh) — render it whether or not gh auth works.
  cat >> "$OUT" <<HTML
  <h2>Prototype census</h2>
  ${CENSUS_BLOCK}
HTML
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

<script>
  // Tab switching.
  function showTab(name) {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('main section').forEach(x => x.classList.remove('active'));
    const btn = document.querySelector('.tab-btn[data-tab="' + name + '"]');
    const sec = document.getElementById(name);
    if (btn) btn.classList.add('active');
    if (sec) sec.classList.add('active');
  }
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => showTab(b.dataset.tab));
  });
  const sitePill = document.getElementById('site-pill');
  if (sitePill) sitePill.addEventListener('click', () => showTab('sites'));

  // Look and mode toggles. Both persist per browser, so a re-run of the script
  // does not reset what the reader chose.
  const root = document.documentElement;
  const lookName = document.getElementById('look-name');
  const modeName = document.getElementById('mode-name');
  const LOOK_LABEL = { ascii: 'ASCII', studio: 'Studio' };
  function paintToggles() {
    if (lookName) lookName.textContent = LOOK_LABEL[root.getAttribute('data-look')] || 'ASCII';
    if (modeName) modeName.textContent = root.getAttribute('data-mode') === 'dark' ? 'Dark' : 'Light';
  }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  document.getElementById('look-toggle').addEventListener('click', () => {
    const next = root.getAttribute('data-look') === 'studio' ? 'ascii' : 'studio';
    root.setAttribute('data-look', next);
    store('rp-canvas-look', next);
    paintToggles();
  });
  document.getElementById('mode-toggle').addEventListener('click', () => {
    const next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-mode', next);
    store('rp-canvas-mode', next);
    paintToggles();
  });
  paintToggles();

  // Sub-tab filtering inside Docs and plans.
  document.querySelectorAll('.sub-btn').forEach(b => {
    b.addEventListener('click', () => {
      const filter = b.dataset.sub;
      document.querySelectorAll('.sub-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.sub-section').forEach(s => {
        s.classList.toggle('hidden', filter !== 'all' && s.dataset.sub !== filter);
      });
    });
  });

  // Markdown reading view. The file is already embedded in this page, so
  // opening a doc takes the page over rather than navigating, which is what
  // keeps the canvas working from file:// with nothing served.
  const docview = document.getElementById('docview');
  const bodyEl = document.getElementById('doc-body');
  const pathEl = document.getElementById('doc-path');
  const labelEl = document.getElementById('doc-label');

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }

  let returnScroll = 0;

  function openMd(targetId) {
    const src = document.getElementById(targetId);
    if (!src) return;
    const raw = src.textContent.replace(/^\s*\n/, '');
    const path = src.dataset.path || '';
    pathEl.textContent = path;
    labelEl.textContent = path.split('/').pop() || 'Doc';
    if (window.marked && !window.markedFailed) {
      bodyEl.innerHTML = marked.parse(raw);
    } else {
      bodyEl.innerHTML = '<pre>' + escapeHtml(raw) + '</pre>';
    }
    returnScroll = window.scrollY;
    document.body.classList.add('reading');
    window.scrollTo(0, 0);
    document.title = (path ? path.split('/').pop() + ' · ' : '') + BASE_TITLE;
  }
  function closeMd() {
    if (!document.body.classList.contains('reading')) return;
    document.body.classList.remove('reading');
    document.title = BASE_TITLE;
    window.scrollTo(0, returnScroll);
  }
  const BASE_TITLE = document.title;

  document.querySelectorAll('.md-link').forEach(b => {
    b.addEventListener('click', () => openMd(b.dataset.target));
    b.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMd(b.dataset.target); }
    });
  });
  document.getElementById('doc-back').addEventListener('click', closeMd);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMd(); });
</script>
</body>
</html>
HTML

echo "✓ Wrote $OUT"

# ── open browser ─────────────────────────────────────────────────────────
if [ "${1:-}" != "--no-open" ]; then
  if command -v open >/dev/null; then
    open "$OUT"
  fi
fi
