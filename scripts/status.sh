#!/usr/bin/env bash
# Generates public/status.html with repo + branch + fork + plan-file overview.
# Pure shell + gh + git. No LLM tokens. Re-run any time.
#
# Usage:  bash scripts/status.sh         (also opens browser)
#         bash scripts/status.sh --no-open

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="public/status.html"
HOST="galaxy.corp.thoughtspot.com"
NOW="$(date '+%Y-%m-%d %H:%M')"
EPOCH_NOW="$(date +%s)"
GEN_START=$EPOCH_NOW

# ── helpers ──────────────────────────────────────────────────────────────
have_gh_galaxy=false
if gh auth status --hostname "$HOST" >/dev/null 2>&1; then have_gh_galaxy=true; fi

# ── role detection ───────────────────────────────────────────────────────
# Maintainer = has a remote (named `galaxy`) pointing to mohammed-faris/radiantplay
# AND is the only one pushing to it. We approximate this by remote name + URL.
# Designer = has an `upstream` remote (per /sync-upstream convention) pointing
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
  BRANCH_ROWS="${BRANCH_ROWS}<tr><td><code>${short}</code>${marker}</td><td>${vs_main}</td><td>${vs_staging}</td><td>${vs_upstream}</td><td>${last_age}<br><span class='file-list'>${last_subj}</span></td></tr>"
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
PROTOTYPE_COUNT=$(ls -1 src/prototypes 2>/dev/null | wc -l | tr -d ' ')

# Build size (last dist if exists)
BUILD_SIZE="—"
[ -d dist ] && BUILD_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')

# ── topology diagram ─────────────────────────────────────────────────────
build_diagram() {
  local W=70
  local hr; hr=$(printf '─%.0s' $(seq 1 $W))

  remote_block() {
    local name="$1" url="$2"
    local refs="" sha when
    echo "┌─ $(printf '%-3s' "$name") ──── $url $(printf '%*s' $((W - 12 - ${#name} - ${#url})) '' | tr ' ' '─')─┐"
    while IFS= read -r ref; do
      [ -z "$ref" ] && continue
      sha=$(git rev-parse --short "$ref" 2>/dev/null)
      when=$(git log -1 --pretty=format:'%cr' "$ref" 2>/dev/null)
      local short=${ref#refs/remotes/}
      printf '│  %-32s %-9s %-22s│\n' "$short" "$sha" "$when"
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
      ACTION_LINES="${ACTION_LINES}<li><strong>${f}</strong> — ${behind} behind, ${ahead} ahead → suggest <code>/sync-upstream</code></li>"
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
render_row() {
  local p="$1"
  local size mtime badge id
  size=$(wc -l < "$p" 2>/dev/null | tr -d ' ')
  mtime=$(stat -f "%Sm" -t "%Y-%m-%d" "$p" 2>/dev/null)
  badge=""
  if git check-ignore -q "$p" 2>/dev/null; then
    badge=" <span class='badge local' title='Gitignored — exists only on this machine'>local</span>"
  elif [ -n "$(git ls-files --others --exclude-standard "$p" 2>/dev/null)" ]; then
    badge=" <span class='badge local' title='Untracked — not yet committed to git'>local</span>"
  fi
  id=$(echo "$p" | sed 's/[^a-zA-Z0-9]/_/g')

  # Embed file content into a hidden script block keyed by id.
  {
    echo "<script type=\"text/markdown\" id=\"md-${id}\" data-path=\"${p}\">"
    embed_esc < "$p" 2>/dev/null
    echo "</script>"
  } >> "$EMBED_FILE"

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

# ── render HTML ──────────────────────────────────────────────────────────
mkdir -p public
cat > "$OUT" <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Radiant Play — status</title>
<style>
  :root {
    --cream-00: #faf7ee;
    --cream-10: #f5f1e8;
    --cream-20: #ede7d6;
    --cream-30: #e0d8c0;
    --ink-90: #0f172a;
    --ink-70: rgba(15,23,42,.72);
    --ink-55: rgba(15,23,42,.55);
    --ink-40: rgba(15,23,42,.40);
    --ink-25: rgba(15,23,42,.25);
    --amber: #92600a;
    --amber-deep: #78500a;
    --amber-bg: rgba(146,96,10,.08);
    --amber-border: rgba(146,96,10,.22);
    --green: #166534;
    --green-bg: rgba(22,101,52,.08);
    --green-border: rgba(22,101,52,.22);
    --red: #991b1b;
    --red-bg: rgba(153,27,27,.08);
    --red-border: rgba(153,27,27,.22);
    --blue: #1d4ed8;
    --blue-bg: rgba(29,78,216,.08);
    --blue-border: rgba(29,78,216,.22);
    --purple: #6d28d9;
    --sans: ui-sans-serif, -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
    --mono: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace;
  }
  html { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font: 15px/1.55 var(--sans);
    background: var(--cream-00); color: var(--ink-70);
    -webkit-font-smoothing: antialiased;
  }
  header {
    padding: 28px 36px 18px;
    border-bottom: 1px solid var(--amber-border);
  }
  header .label {
    font: 700 11.5px/1 var(--mono);
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--amber-deep);
    margin-bottom: 8px;
  }
  header h1 {
    margin: 0; font-family: var(--sans);
    font-size: 32px; font-weight: 800; letter-spacing: -.025em;
    color: var(--ink-90);
  }
  header h1 em { font-style: normal; color: var(--amber-deep); }
  header .meta { color: var(--ink-55); font: 13.5px/1.4 var(--sans); margin-top: 6px; }
  header .meta code { font-size: 12px; }
  nav.tabs {
    display: flex; gap: 0;
    padding: 0 36px;
    border-bottom: 1px solid var(--amber-border);
    background: var(--cream-10);
  }
  nav.tabs button {
    background: transparent; border: 0;
    padding: 14px 18px;
    font: 700 11.5px/1 var(--mono);
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-55);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  nav.tabs button:hover { color: var(--ink-90); }
  nav.tabs button.active { color: var(--amber-deep); border-bottom-color: var(--amber); }
  main { padding: 28px 36px 64px; max-width: 1280px; }
  section { display: none; }
  section.active { display: block; }
  h2 {
    font: 700 11.5px/1 var(--mono);
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--amber-deep);
    margin: 32px 0 10px;
    padding-bottom: 8px;
    background: linear-gradient(to right, var(--amber-border), transparent) bottom/100% 1px no-repeat;
  }
  h2:first-child { margin-top: 0; }
  p { margin: 6px 0 14px; }
  table { width: 100%; border-collapse: collapse; font: 13.5px/1.5 var(--sans); }
  th, td { text-align: left; padding: 9px 14px 9px 0; border-bottom: 1px solid var(--amber-border); vertical-align: top; color: var(--ink-70); }
  th {
    font: 700 10.5px/1 var(--mono);
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-55);
    padding-top: 6px; padding-bottom: 8px;
  }
  tr.ok td:nth-child(2) { color: var(--green); font-weight: 600; }
  tr.warn td:nth-child(2) { color: var(--amber-deep); font-weight: 600; }
  tr.muted td { color: var(--ink-40); }
  code {
    font: 500 13px/1.4 var(--mono);
    background: var(--amber-bg);
    color: var(--amber-deep);
    border: 1px solid var(--amber-border);
    padding: 1px 6px;
  }
  pre code, pre { background: transparent; border: 0; padding: 0; }
  a { color: var(--amber-deep); text-decoration: none; border-bottom: 1px solid var(--amber-border); }
  a:hover { border-bottom-color: var(--amber); }
  strong { color: var(--ink-90); font-weight: 700; }
  em { font-style: normal; color: var(--amber-deep); }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .stat {
    background: var(--cream-10);
    padding: 14px 16px;
    border: 1px solid var(--amber-border);
  }
  .stat .k {
    font: 700 10.5px/1 var(--mono);
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-55);
  }
  .stat .v {
    font: 800 18px/1.2 var(--mono);
    color: var(--ink-90);
    margin-top: 6px;
    letter-spacing: .02em;
  }
  .file-list {
    font: 13px/1.55 var(--mono);
    color: var(--ink-55);
    white-space: pre-wrap;
    margin: 4px 0 12px;
  }
  .diagram {
    font: 12.5px/1.55 var(--mono);
    color: var(--ink-70);
    background: var(--cream-10);
    border: 1px solid var(--amber-border);
    padding: 18px 22px;
    margin: 8px 0 18px;
    overflow-x: auto;
    white-space: pre;
  }
  details { margin: 8px 0; }
  details summary {
    cursor: pointer;
    font: 700 11.5px/1 var(--mono);
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--ink-70);
    padding: 6px 0;
  }
  details summary:hover { color: var(--ink-90); }
  .proto-block {
    background: var(--cream-10);
    padding: 14px 18px;
    margin: 10px 0;
    border: 1px solid var(--amber-border);
    border-left: 3px solid var(--amber);
  }
  .proto-block h4 {
    margin: 0 0 8px;
    font: 700 11.5px/1 var(--mono);
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--amber-deep);
  }
  .proto-block ul { margin: 0; padding-left: 20px; font: 13px/1.55 var(--sans); color: var(--ink-70); }
  .proto-block li::marker { color: var(--amber); }
  ul li::marker { color: var(--amber); }
  .empty { color: var(--ink-40); font-style: italic; padding: 8px 0; }
  footer {
    padding: 18px 36px;
    color: var(--ink-40);
    font: 11.5px/1.4 var(--mono);
    letter-spacing: .08em;
    border-top: 1px solid var(--amber-border);
    background: var(--cream-10);
  }
  .subtabs {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-bottom: 18px;
  }
  .sub-btn {
    background: transparent;
    border: 1px solid var(--amber-border);
    padding: 6px 14px;
    font: 700 10.5px/1 var(--mono);
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-55);
    cursor: pointer;
  }
  .sub-btn:hover { color: var(--ink-90); border-color: var(--amber); }
  .sub-btn.active { color: var(--amber-deep); background: var(--amber-bg); border-color: var(--amber); }
  .sub-section { display: block; margin-bottom: 36px; }
  .sub-section:last-child { margin-bottom: 0; }
  .sub-section.hidden { display: none; }
  .sub-section + .sub-section h2 { margin-top: 8px; }
  .md-link {
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--amber-deep);
    border-bottom: 1px solid var(--amber-border);
    font: inherit;
    cursor: pointer;
    text-align: left;
  }
  .md-link:hover { border-bottom-color: var(--amber); color: var(--ink-90); }
  .badge {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 6px;
    font: 700 9.5px/1.4 var(--mono);
    letter-spacing: .14em;
    text-transform: uppercase;
    border: 1px solid var(--amber-border);
    background: var(--amber-bg);
    color: var(--amber-deep);
    vertical-align: 2px;
  }
  .badge.local { background: var(--blue-bg); color: var(--blue); border-color: var(--blue-border); }
  .md-overlay {
    position: fixed; inset: 0;
    background: rgba(15,23,42,.55);
    display: none;
    z-index: 100;
    padding: 40px;
  }
  .md-overlay.open { display: flex; align-items: stretch; justify-content: center; }
  .md-modal {
    background: var(--cream-00);
    border: 1px solid var(--amber-border);
    width: 100%; max-width: 960px;
    max-height: 100%;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(15,23,42,.18);
  }
  .md-head {
    padding: 14px 20px;
    border-bottom: 1px solid var(--amber-border);
    background: var(--cream-10);
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px;
  }
  .md-head .path {
    font: 600 12.5px/1.3 var(--mono);
    color: var(--amber-deep);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .md-close {
    background: transparent; border: 1px solid var(--amber-border);
    padding: 4px 12px;
    font: 700 10.5px/1.4 var(--mono); letter-spacing: .14em; text-transform: uppercase;
    color: var(--amber-deep); cursor: pointer;
  }
  .md-close:hover { background: var(--amber-bg); }
  .md-body {
    padding: 24px 28px;
    overflow: auto;
    color: var(--ink-90);
    font: 14.5px/1.65 var(--sans);
  }
  .md-body h1, .md-body h2, .md-body h3 { color: var(--ink-90); font-weight: 700; letter-spacing: -.015em; margin: 18px 0 8px; }
  .md-body h1 { font-size: 22px; }
  .md-body h2 { font-size: 18px; }
  .md-body h3 { font-size: 15px; }
  .md-body code {
    font: 500 12.5px/1.4 var(--mono);
    background: var(--amber-bg); border: 1px solid var(--amber-border);
    color: var(--amber-deep); padding: 1px 6px;
  }
  .md-body pre {
    background: var(--cream-10); border: 1px solid var(--amber-border);
    padding: 12px 16px; overflow-x: auto;
    font: 12.5px/1.55 var(--mono);
  }
  .md-body pre code { background: transparent; border: 0; padding: 0; color: var(--ink-90); }
  .md-body table { font-size: 13.5px; margin: 10px 0; }
  .md-body ul, .md-body ol { padding-left: 22px; }
  .md-body blockquote { border-left: 3px solid var(--amber); margin: 10px 0; padding: 4px 14px; color: var(--ink-55); }
  .md-body a { color: var(--amber-deep); }
</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" onerror="window.markedFailed=true"></script>
</head>
<body>
<header>
  <div class="label">Section 0 · Local dashboard</div>
  <h1>Radiant<em>Play</em> — status</h1>
  <div class="meta">Generated ${NOW} · branch <code>${CUR_BRANCH}</code> · <strong>${MOD_COUNT}</strong> modified, <strong>${UNTRACKED_COUNT}</strong> untracked</div>
</header>
<nav class="tabs">
  <button class="tab-btn active" data-tab="overview">Overview</button>
  <button class="tab-btn" data-tab="branches">Branches</button>
  <button class="tab-btn" data-tab="forks">$( $IS_MAINTAINER && echo "Forks" || echo "Upstream" )</button>
  <button class="tab-btn" data-tab="docsplans">Docs and plans</button>
</nav>
<main>

<section id="overview" class="active">
  <h2>Topology</h2>
  <pre class="diagram">${DIAGRAM}</pre>

  <h2>Snapshot</h2>
  <div class="stat-grid">
    <div class="stat"><div class="k">Current branch</div><div class="v">${CUR_BRANCH}</div></div>
    <div class="stat"><div class="k">vs origin</div><div class="v">-${ORIGIN_BEHIND} / +${ORIGIN_AHEAD}</div></div>
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
  <p class="empty">Not authenticated to ${HOST}. Run <code>gh auth login --hostname ${HOST}</code> and re-run this script.</p>
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
  <p>If <strong>Behind</strong> is non-zero, run <code>/sync-upstream</code> to pull the latest changes.</p>
HTML
else
  cat >> "$OUT" <<HTML
  <h2>Upstream sync</h2>
  <p class="empty">No <code>upstream</code> remote configured. Run <code>/sync-upstream</code> to set one up — it adds <code>https://${HOST}/mohammed-faris/radiantplay.git</code> as <code>upstream</code> and fetches the latest changes.</p>
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
  Generated by <code>scripts/status.sh</code> · re-run any time · zero LLM tokens
</footer>

<div class="md-overlay" id="md-overlay" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="md-modal">
    <div class="md-head">
      <div class="path" id="md-path">—</div>
      <button class="md-close" id="md-close" aria-label="Close">Close (Esc)</button>
    </div>
    <div class="md-body" id="md-body">—</div>
  </div>
</div>

$(cat "$EMBED_FILE")

<script>
  // Tab switching.
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('section').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById(b.dataset.tab).classList.add('active');
    });
  });

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

  // Inline markdown viewer.
  const overlay = document.getElementById('md-overlay');
  const bodyEl = document.getElementById('md-body');
  const pathEl = document.getElementById('md-path');

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }

  function openMd(targetId) {
    const src = document.getElementById(targetId);
    if (!src) return;
    const raw = src.textContent.replace(/^\s*\n/, '');
    pathEl.textContent = src.dataset.path || '';
    if (window.marked && !window.markedFailed) {
      bodyEl.innerHTML = marked.parse(raw);
    } else {
      bodyEl.innerHTML = '<pre>' + escapeHtml(raw) + '</pre>';
    }
    bodyEl.scrollTop = 0;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeMd() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.md-link').forEach(b => {
    b.addEventListener('click', () => openMd(b.dataset.target));
  });
  document.getElementById('md-close').addEventListener('click', closeMd);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeMd(); });
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
