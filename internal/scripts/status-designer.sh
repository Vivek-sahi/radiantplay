#!/usr/bin/env bash
# The designer canvas. Sourced by internal/scripts/status.sh when the checkout is
# not the maintainer's (or STATUS_ROLE=designer), after the shared helpers and
# settings have loaded. It writes public/status.html about the designer's own
# work: their prototypes and how ready each one is, how far the fork is behind
# RadiantPlay, their branches, their Coolify site, and what to do next.
#
# Settings come from internal/status.local.sh (gitignored), which /project-canvas
# writes on its first run:
#   STATUS_TITLE, STATUS_TITLE_EM   the heading (default "<first name>'s RadiantPlay")
#   STATUS_SITE_URL                 the Coolify URL; "" means no site yet. Unset,
#                                   the canvas tries radiantplay-<first name>.
#
# Bash 3.2 habits, like status.sh: ${ARR[@]+...} guards, date -j, no mapfile or
# declare -A. Nothing here prompts or waits on the network without a timeout.

D_TMP="$(mktemp -d -t rp-canvas-designer)"
trap 'rm -f "$EMBED_FILE"; rm -rf "$D_TMP"' EXIT

# Fields in this file's tables are split on the unit separator, not a tab: tab
# is whitespace to read, so an empty field in the middle would shift the rest.
US="$(printf '\037')"

d_html() { printf '%s' "$1" | esc; }

# A card, as on the maintainer's Content tab: 1 kind, 2 title, 3 desc-html,
# 4 date, 5 chip, 6 open-attrs, 7 tag, 8 extra class.
d_card() {
  printf '<%s class="card%s"%s><div class="c-top"><div class="c-title">%s</div>%s</div><div class="c-desc">%s</div><div class="c-foot"><span class="type">%s</span><span class="mtime num">%s</span></div></%s>' \
    "$7" "${8:-}" "$6" "$2" "$5" "$3" "$1" "$4" "$7"
}
# Changelog prose to HTML: escape, then `code` spans.
d_prose() { printf '%s' "$1" | esc | sed 's/`\([^`]*\)`/<code>\1<\/code>/g'; }
plural() { [ "$1" = "1" ] && printf '%s' "$2" || printf '%s' "${3:-${2}s}"; }

# ── fork owner and site guess ────────────────────────────────────────────
# The fork's owner on the galaxy host, from origin only: other remotes can be a
# colleague's fork. "aditya-wadher" gives first name "aditya".
D_OWNER=""
u="$(git remote get-url origin 2>/dev/null || true)"
case "$u" in
  *"$HOST"*) echo "$u" | grep -q "mohammed-faris/radiantplay" || D_OWNER="$(echo "$u" | sed -n "s|.*${HOST}[:/]\([^/]*\)/.*|\1|p")" ;;
esac
D_OWNER_FIRST="$(echo "${D_OWNER%%-*}" | tr '[:upper:]' '[:lower:]')"
D_SITE_GUESS=""
[ -n "$D_OWNER_FIRST" ] && D_SITE_GUESS="https://radiantplay-${D_OWNER_FIRST}.design.coolify.thoughtspot.com"

# One request to <url>/playground: prints "<code> <no-cache yes|no>". The deep
# link is what /coolify-deploy checks for the Cache-Control header.
d_probe_site() {
  local url="${1%/}" hdr="$D_TMP/site-headers" code nc="no"
  code="$(curl -s -I -o "$hdr" -m "$STATUS_SITE_TIMEOUT" -w '%{http_code}' "${url}/playground" 2>/dev/null)"
  [ -z "$code" ] && code="000"
  grep -qi '^cache-control:.*no-cache' "$hdr" 2>/dev/null && nc="yes"
  echo "$code $nc"
}

if $FIRST_RUN_DEFAULTS; then
  # For /project-canvas: what it should offer as defaults in its two questions.
  site=""
  if [ -n "$D_SITE_GUESS" ]; then
    probe="$(d_probe_site "$D_SITE_GUESS")"
    [ "${probe%% *}" = "200" ] && site="$D_SITE_GUESS"
  fi
  echo "role=designer"
  echo "local=$([ -f "$LOCAL_CONFIG" ] && echo present || echo missing)"
  echo "title=${STATUS_TITLE}${STATUS_TITLE_EM}"
  echo "site=${site}"
  echo "site_guess=${D_SITE_GUESS}"
  exit 0
fi

# ── upstream: reach, fetch, version gap ──────────────────────────────────
# The upstream is the `upstream` remote. A preview on the maintainer's checkout
# has none, so it uses galaxy, which points at the same repo.
D_UP="$DESIGNER_UPSTREAM_REMOTE"
if [ -z "$D_UP" ] && echo "$galaxy_url" | grep -q "mohammed-faris/radiantplay"; then D_UP="galaxy"; fi

# A 3 second curl on the host before fetching: git fetch has no timeout and
# macOS has no timeout binary, so off Twingate a fetch could hang.
D_REACHABLE=false
D_FETCHED=false
if [ -n "$D_UP" ]; then
  reach="$(curl -s -o /dev/null -m 3 -w '%{http_code}' "https://${HOST}/" 2>/dev/null)"
  if [ -n "$reach" ] && [ "$reach" != "000" ]; then
    D_REACHABLE=true
    ssh_cmd="${GIT_SSH_COMMAND:-}"
    [ -z "$ssh_cmd" ] && [ -z "$(git config core.sshCommand 2>/dev/null)" ] && ssh_cmd="ssh -o BatchMode=yes -o ConnectTimeout=5"
    if GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="${ssh_cmd:-ssh}" git fetch --quiet "$D_UP" main >/dev/null 2>&1; then
      D_FETCHED=true
    fi
  fi
fi

# Compare main..upstream/main, as /sync-upstream does: a feature branch doesn't
# change how far the fork's main is behind.
D_BASE="HEAD"
git rev-parse --verify --quiet main >/dev/null 2>&1 && D_BASE="main"
D_UP_REF=""
[ -n "$D_UP" ] && git rev-parse --verify --quiet "${D_UP}/main" >/dev/null 2>&1 && D_UP_REF="${D_UP}/main"

ver_at() {
  git show "$1:src/data/platformVersion.ts" 2>/dev/null \
    | sed -n "s/.*PLATFORM_VERSION = '\([^']*\)'.*/\1/p" | head -1
}
D_MY_VER="$(ver_at "$D_BASE")"
D_UP_VER=""
D_COMMITS_BEHIND=0
D_RELEASES_BEHIND=0
D_VERY_BEHIND=false
D_RELEASE_ROWS=""
D_RELEASE_MORE=0
if [ -n "$D_UP_REF" ]; then
  D_UP_VER="$(ver_at "$D_UP_REF")"
  D_COMMITS_BEHIND="$(git rev-list --count "${D_BASE}..${D_UP_REF}" 2>/dev/null || echo 0)"
  # Upstream's changelog headings, newest first: version, date, first summary line.
  git show "${D_UP_REF}:docs/CHANGELOG.md" 2>/dev/null | awk '
    function flush() { if (v != "") print v "\037" d "\037" s; v = ""; d = ""; s = "" }
    /^## / {
      flush()
      h = substr($0, 4); v = h; sub(/[[:space:]].*/, "", v)
      d = ""; if (match(h, /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/)) d = substr(h, RSTART, RLENGTH)
      want = 1; next
    }
    want && /^[[:space:]]*$/ { next }
    want && /^#/ { want = 0; next }
    want {
      l = $0; sub(/^[-*][[:space:]]+/, "", l)
      # A long summary is cut at its last full sentence that fits.
      if (length(l) > 320) {
        c = substr(l, 1, 320); k = 0
        for (i = length(c); i > 1; i--) if (substr(c, i - 1, 2) == ". ") { k = i - 1; break }
        l = (k > 0) ? substr(c, 1, k) : c "..."
      }
      s = l; want = 0
    }
    END { flush() }
  ' > "$D_TMP/releases"
  # The releases above the fork's own version are the ones it is missing. No
  # version, or one upstream's changelog doesn't list, reads as very behind.
  # Counting starts at upstream's own version, so a heading written ahead of a
  # release doesn't count as one.
  found=false
  started=true
  [ -n "$D_UP_VER" ] && grep -q "^${D_UP_VER}${US}" "$D_TMP/releases" && started=false
  while IFS="$US" read -r v d s; do
    [ -z "$v" ] && continue
    [ "$v" = "$D_UP_VER" ] && started=true
    $started || continue
    if [ -n "$D_MY_VER" ] && [ "$v" = "$D_MY_VER" ]; then found=true; break; fi
    printf '%s\037%s\037%s\n' "$v" "$d" "$s" >> "$D_TMP/missing"
  done < "$D_TMP/releases"
  if ! $found; then D_VERY_BEHIND=true; fi
  [ -f "$D_TMP/missing" ] || : > "$D_TMP/missing"
  D_RELEASES_BEHIND="$(wc -l < "$D_TMP/missing" | tr -d ' ')"
  shown=0
  while IFS="$US" read -r v d s; do
    shown=$((shown+1))
    if [ "$shown" -gt 8 ]; then D_RELEASE_MORE=$((D_RELEASE_MORE+1)); continue; fi
    D_RELEASE_ROWS="${D_RELEASE_ROWS}<tr><td><code>$(d_html "$v")</code></td><td class='num'>$(d_html "$d")</td><td>$(d_prose "$s")</td></tr>"
  done < "$D_TMP/missing"
fi
# Light-only step: a fork whose main lacks it gets "run it once more" after a sync.
D_NEEDS_SECOND_SYNC=false
git cat-file -e "${D_BASE}:scripts/radiant-check/light-only.mjs" 2>/dev/null || D_NEEDS_SECOND_SYNC=true
# Behind means main lacks commits upstream/main has; the release count says how much.
D_BEHIND=false
[ -n "$D_UP_REF" ] && [ "$D_COMMITS_BEHIND" -gt 0 ] 2>/dev/null && D_BEHIND=true

D_BRANCH_VS_MAIN=""
if [ "$D_BASE" = "main" ] && [ -n "$CUR_BRANCH" ] && [ "$CUR_BRANCH" != "main" ]; then
  D_BRANCH_VS_MAIN="$(diverge_vs "$CUR_BRANCH" main)"
fi

# ── prototypes: one scan.mjs call ────────────────────────────────────────
# scan.mjs already parses registry-mine.ts by id, whether or not an entry has a
# section line, and gives theme, dark and Geist readiness, thumbnail, name and
# last change. Called once per run.
D_PROTO_ROWS=""
D_PROTO_N=0
D_MIGRATE_N=0
D_THUMB_NAMES=""
D_THUMB_FIRST_ID=""
D_THUMB_N=0
D_SCAN_OK=false
if command -v node >/dev/null 2>&1 && [ -f scripts/radiant-check/scan.mjs ] \
   && node scripts/radiant-check/scan.mjs --mine --json > "$D_TMP/scan.json" 2>/dev/null; then
  D_SCAN_OK=true
  node -e '
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const clean = (s) => String(s ?? "").replace(/[\x1f\t\n\r]+/g, " ");
    for (const [u, m] of Object.entries(j.meta || {})) {
      if (!("theme" in m)) continue;
      const r = (j.ready || {})[u] || {};
      console.log([u.replace(/^src\/prototypes\//, ""), m.name ?? "", m.lastChange ?? "", m.theme,
        r.dark ? "yes" : "no", r.geist ? "yes" : "no", m.thumb ?? "", (m.notReadyBecause || []).join("; ")].map(clean).join("\x1f"));
    }
  ' "$D_TMP/scan.json" > "$D_TMP/protos" 2>/dev/null || D_SCAN_OK=false
fi
yes_no_chip() { [ "$1" = "yes" ] && echo "<span class='chip live'>Yes</span>" || echo "<span class='chip wip'>No</span>"; }
if $D_SCAN_OK; then
  while IFS="$US" read -r id nm lc theme dark geist thumb why; do
    [ -z "$id" ] && continue
    D_PROTO_N=$((D_PROTO_N+1))
    [ -z "$nm" ] && nm="$id"
    if [ "$theme" = "light-only" ] || [ "$dark" != "yes" ] || [ "$geist" != "yes" ]; then
      D_MIGRATE_N=$((D_MIGRATE_N+1))
    fi
    # Thumbnail: none in the registry, stale (code newer than the screenshot,
    # the same rule as npm run thumbnails:check), or what the registry wires up.
    dir="src/prototypes/${id}"
    tstate="$thumb"
    if [ -f "${dir}/thumbnail.light.jpg" ]; then
      tt="$(git log -1 --format=%ct -- "${dir}/thumbnail.light.jpg" 2>/dev/null)"
      ct="$(git log -1 --format=%ct -- "$dir" ":(exclude)${dir}/thumbnail.*" 2>/dev/null)"
      [ -n "$tt" ] && [ -n "$ct" ] && [ "$ct" -gt "$tt" ] && tstate="stale"
    fi
    case "$tstate" in
      none)     tchip="<span class='chip down'>None</span>" ;;
      stale)    tchip="<span class='chip wip'>Stale</span>" ;;
      captured) tchip="<span class='chip live'>Captured</span>" ;;
      *)        tchip="<span class='chip flat'>$(d_html "$tstate")</span>" ;;
    esac
    if [ "$tstate" = "none" ] || [ "$tstate" = "stale" ]; then
      D_THUMB_N=$((D_THUMB_N+1))
      [ -z "$D_THUMB_FIRST_ID" ] && D_THUMB_FIRST_ID="$id"
      [ "$D_THUMB_N" -le 3 ] && D_THUMB_NAMES="${D_THUMB_NAMES}${D_THUMB_NAMES:+, }${nm}"
    fi
    if [ "$theme" = "global" ]; then tmchip="<span class='chip live'>Global</span>"
    else tmchip="<span class='chip wip'>Light only</span>"; fi
    dchip="$(yes_no_chip "$dark")"
    [ -n "$why" ] && dchip="<span title=\"$(d_html "$why")\">${dchip}</span>"
    link="${STATUS_APP_BASE}/playground/${id}"
    D_PROTO_ROWS="${D_PROTO_ROWS}<tr><td><strong>$(d_html "$nm")</strong><br><span class='file-list'>$(d_html "$id")</span></td><td class='num'>${lc:-—}</td><td>${tmchip}</td><td>${dchip}</td><td>$(yes_no_chip "$geist")</td><td>${tchip}</td><td><a href=\"${link}\" title=\"${link}\">Open</a></td></tr>"
  done < "$D_TMP/protos"
fi
D_SAMPLE_N=0
[ -f src/prototypes/registry-core.ts ] && D_SAMPLE_N="$(grep -cE "^[[:space:]]*id:[[:space:]]*'" src/prototypes/registry-core.ts 2>/dev/null)"
[ -z "$D_SAMPLE_N" ] && D_SAMPLE_N=0

# ── site ─────────────────────────────────────────────────────────────────
# STATUS_SITE_URL set (even to "") is the designer's answer. Unset, the canvas
# tries the usual name for this fork and only counts it when it answers.
D_SITE_URL=""
D_SITE_GUESSED=false
if [ -n "${STATUS_SITE_URL+x}" ]; then
  D_SITE_URL="$STATUS_SITE_URL"
elif [ -n "$D_SITE_GUESS" ]; then
  D_SITE_URL="$D_SITE_GUESS"; D_SITE_GUESSED=true
fi
# state: none | up | gated | unreachable | down
D_SITE_STATE="none"
D_SITE_CODE=""
D_SITE_NOCACHE="no"
if [ -n "$D_SITE_URL" ]; then
  probe="$(d_probe_site "$D_SITE_URL")"
  D_SITE_CODE="${probe%% *}"
  D_SITE_NOCACHE="${probe##* }"
  case "$D_SITE_CODE" in
    200)     D_SITE_STATE="up" ;;
    401|403) D_SITE_STATE="gated" ;;
    000)     D_SITE_STATE="unreachable" ;;
    *)       D_SITE_STATE="down" ;;
  esac
  # A guess that answers with an error is not this designer's site.
  if $D_SITE_GUESSED && [ "$D_SITE_STATE" = "down" ]; then D_SITE_STATE="none"; D_SITE_URL=""; fi
fi
D_SITE_INTERNAL=false
echo "$D_SITE_URL" | grep -q "$STATUS_INTERNAL_HOST_MATCH" && D_SITE_INTERNAL=true

# ── branches ─────────────────────────────────────────────────────────────
D_BRANCH_ROWS=""
D_BRANCH_N=0
D_UNCOMMITTED=$((MOD_COUNT + STAGED_COUNT + UNTRACKED_COUNT))
while IFS="$US" read -r short up track; do
  [ -z "$short" ] && continue
  D_BRANCH_N=$((D_BRANCH_N+1))
  if [ -z "$up" ]; then
    pushed="<span class='chip wip'>Local only</span>"
    unpushed="$(git rev-list --count "$short" --not --remotes 2>/dev/null || echo 0)"
  elif [ "$track" = "[gone]" ]; then
    pushed="<span class='chip down'>Remote branch deleted</span>"
    unpushed="$(git rev-list --count "$short" --not --remotes 2>/dev/null || echo 0)"
  else
    pushed="<span class='chip live'>Pushed</span> <span class='file-list'>$(d_html "$up")</span>"
    unpushed="$(git rev-list --count "${up}..${short}" 2>/dev/null || echo 0)"
  fi
  [ "$unpushed" = "0" ] && unpushed="<span class='file-list'>0</span>" || unpushed="<strong>${unpushed}</strong>"
  edits="—"; marker=""
  if [ "$short" = "$CUR_BRANCH" ]; then
    marker=" <span class='badge local'>current</span>"
    if [ "$D_UNCOMMITTED" -gt 0 ]; then edits="<strong>${D_UNCOMMITTED} $(plural "$D_UNCOMMITTED" file)</strong>"; else edits="None"; fi
  fi
  vs_main="—"; [ "$D_BASE" = "main" ] && vs_main="$(diverge_vs "$short" main)"
  vs_up="—"; [ -n "$D_UP_REF" ] && vs_up="$(diverge_vs "$short" "$D_UP_REF")"
  last_subj="$(git log -1 --pretty=format:'%s' "$short" 2>/dev/null | esc)"
  last_age="$(git log -1 --pretty=format:'%cr' "$short" 2>/dev/null)"
  D_BRANCH_ROWS="${D_BRANCH_ROWS}<tr><td><code>$(d_html "$short")</code>${marker}</td><td>${pushed}</td><td class='num'>${unpushed}</td><td>${edits}</td><td class='num'>${vs_main}</td><td class='num'>${vs_up}</td><td>${last_age}<br><span class='file-list'>${last_subj}</span></td></tr>"
done < <(git for-each-ref --format='%(refname:short)%1f%(upstream:short)%1f%(upstream:track)' refs/heads/)

# ── guides: a fixed allow-list ───────────────────────────────────────────
d_embed() {
  local p="$1" id
  id="d_$(echo "$p" | sed 's/[^a-zA-Z0-9]/_/g')"
  {
    echo "<script type=\"text/markdown\" id=\"md-${id}\" data-path=\"${p}\">"
    embed_esc < "$p" 2>/dev/null
    echo "</script>"
  } >> "$EMBED_FILE"
  echo "$id"
}
D_GUIDE_CARDS=""
D_GUIDE_N=0
coolify_guide="$(ls docs/coolify/*deploy-guide-for-designers*.md 2>/dev/null | tail -1)"
if [ -n "$coolify_guide" ]; then
  gid="$(d_embed "$coolify_guide")"
  D_GUIDE_N=$((D_GUIDE_N+1))
  D_GUIDE_CARDS="${D_GUIDE_CARDS}$(d_card 'doc' 'Put your fork on Coolify' 'The step by step guide behind <code>/rp-coolify-deploy</code>: a live URL that redeploys on every push.' '' "<span class='chip flat'>Guide</span>" " role=\"button\" tabindex=\"0\" data-target=\"md-${gid}\" title=\"${coolify_guide}\"" 'div' ' md-link')"
fi
if [ -f public/cursor-to-claude-setup.html ]; then
  D_GUIDE_N=$((D_GUIDE_N+1))
  D_GUIDE_CARDS="${D_GUIDE_CARDS}$(d_card 'page' 'Set up Claude Code' 'Install Claude Code and get RadiantPlay running with it, step by step.' '' "<span class='chip flat'>Page</span>" ' href="./cursor-to-claude-setup.html" title="public/cursor-to-claude-setup.html"' 'a')"
fi
if [ -f public/how-it-works.html ]; then
  D_GUIDE_N=$((D_GUIDE_N+1))
  D_GUIDE_CARDS="${D_GUIDE_CARDS}$(d_card 'page' 'How RadiantPlay works' 'How your fork, RadiantPlay and the design system fit together.' '' "<span class='chip flat'>Page</span>" ' href="./how-it-works.html" title="public/how-it-works.html"' 'a')"
fi

# ── next steps: rules over the state above, at most four ─────────────────
D_STEPS=""
add_step() { D_STEPS="${D_STEPS}<li>$1</li>"; }
if [ -z "$D_UP" ]; then
  add_step "Connect to RadiantPlay so the canvas can tell you what's new. Run <code>/rp-sync-upstream</code> once."
elif $D_BEHIND; then
  s="You're behind RadiantPlay. Run <code>/rp-sync-upstream</code>"
  $D_NEEDS_SECOND_SYNC && s="${s}, then run it once more to pick up the new steps it brings"
  add_step "${s}."
fi
if [ "$D_MIGRATE_N" -gt 0 ]; then
  add_step "${D_MIGRATE_N} $(plural "$D_MIGRATE_N" "prototype isn't" "prototypes aren't") dark ready yet. Run <code>/rp-migrate-prototype</code>."
fi
if [ "$D_THUMB_N" -gt 0 ]; then
  more=""; [ "$D_THUMB_N" -gt 3 ] && more=" and $((D_THUMB_N - 3)) more"
  add_step "Ask Claude to update the thumbnail for $(d_html "$D_THUMB_NAMES")${more}. For the full compliance report first, run <code>/rp-radiant-check $(d_html "$D_THUMB_FIRST_ID")</code>."
fi
case "$D_SITE_STATE" in
  none) add_step "Put your fork online. Run <code>/rp-coolify-deploy</code>." ;;
  down) add_step "Your site answers HTTP ${D_SITE_CODE}. Run <code>/rp-coolify-deploy check</code>." ;;
  up)   [ "$D_SITE_NOCACHE" = "yes" ] || add_step "Your site doesn't send <code>no-cache</code> for pages, so people can see an old build after a deploy. Run <code>/rp-coolify-deploy check</code>." ;;
esac
D_STEP_N="$(printf '%s' "$D_STEPS" | grep -o '<li>' | wc -l | tr -d ' ')"
[ -z "$D_STEPS" ] && D_STEPS="<li>You're all set.</li>"

# ── Home cards: sync and site ────────────────────────────────────────────
if [ -z "$D_UP" ]; then
  D_SYNC_V="Not connected"; D_SYNC_DOT="down"
  D_SYNC_P="No <code>upstream</code> remote yet. Run <code>/rp-sync-upstream</code> once to connect to RadiantPlay."
elif [ -z "$D_UP_REF" ]; then
  D_SYNC_V="Not fetched yet"; D_SYNC_DOT="down"
  D_SYNC_P="Couldn't read <code>${D_UP}/main</code>. Connect to Twingate VPN and run the canvas again."
elif $D_BEHIND; then
  if $D_VERY_BEHIND; then D_SYNC_V="Very behind"
  elif [ "$D_RELEASES_BEHIND" -gt 0 ]; then D_SYNC_V="${D_RELEASES_BEHIND} $(plural "$D_RELEASES_BEHIND" release) behind"
  else D_SYNC_V="${D_COMMITS_BEHIND} $(plural "$D_COMMITS_BEHIND" commit) behind"; fi
  D_SYNC_DOT="warn"
  D_SYNC_P="You're on <code>${D_MY_VER:-an untracked version}</code>, RadiantPlay is on <code>${D_UP_VER:-?}</code>. See Updates for what's new."
else
  D_SYNC_V="Up to date"; D_SYNC_DOT=""
  D_SYNC_P="You're on <code>${D_MY_VER:-?}</code>, the latest RadiantPlay."
fi
if [ -n "$D_UP" ] && ! $D_FETCHED; then
  D_SYNC_P="${D_SYNC_P} Couldn't reach ${HOST}, so this is from your last fetch. Check Twingate VPN."
fi

D_SITE_HREF=""
[ -n "$D_SITE_URL" ] && D_SITE_HREF="<a href='$(d_html "$D_SITE_URL")' target='_blank' rel='noreferrer'>$(d_html "${D_SITE_URL#https://}")</a>"
case "$D_SITE_STATE" in
  none)
    D_SITE_V="No site yet"; D_SITE_DOT="down"
    D_SITE_P="Run <code>/rp-coolify-deploy</code> when you want a live URL."
    D_SITE_CHIP="<span class='chip flat'>None</span>" ;;
  up)
    D_SITE_V="Up"; D_SITE_DOT=""
    D_SITE_CHIP="<span class='chip live'>Up</span>"
    if [ "$D_SITE_NOCACHE" = "yes" ]; then D_SITE_P="${D_SITE_HREF} answers and sends <code>no-cache</code> for pages."
    else D_SITE_P="${D_SITE_HREF} answers, but doesn't send <code>no-cache</code> for pages. Run <code>/rp-coolify-deploy check</code>."; D_SITE_DOT="warn"; fi ;;
  gated)
    D_SITE_V="Up, password gated"; D_SITE_DOT=""
    D_SITE_CHIP="<span class='chip live'>Gated</span>"
    D_SITE_P="${D_SITE_HREF} asks for a password, so the canvas can't check its caching." ;;
  unreachable)
    D_SITE_V="Unreachable"; D_SITE_DOT="down"
    D_SITE_CHIP="<span class='chip flat'>Unreachable</span>"
    if $D_SITE_INTERNAL; then D_SITE_P="${D_SITE_HREF} only answers on Twingate VPN. Connect and run the canvas again."
    else D_SITE_P="${D_SITE_HREF} didn't answer in ${STATUS_SITE_TIMEOUT}s."; fi ;;
  down)
    D_SITE_V="HTTP ${D_SITE_CODE}"; D_SITE_DOT="down"
    D_SITE_CHIP="<span class='chip down'>HTTP ${D_SITE_CODE}</span>"
    D_SITE_P="${D_SITE_HREF} answers with an error. Run <code>/rp-coolify-deploy check</code>." ;;
esac
$D_SITE_GUESSED && [ -n "$D_SITE_URL" ] && D_SITE_P="${D_SITE_P} Found by its usual name; set <code>STATUS_SITE_URL</code> in <code>internal/status.local.sh</code> to change it."

# ── render ───────────────────────────────────────────────────────────────
D_TITLE_HTML="$(d_html "$STATUS_TITLE")"
[ -n "$STATUS_TITLE_EM" ] && D_TITLE_HTML="${D_TITLE_HTML}<em>$(d_html "$STATUS_TITLE_EM")</em>"

if [ -z "$D_UP" ]; then
  D_UPDATES_BODY="<p class='empty'>No <code>upstream</code> remote yet. Run <code>/rp-sync-upstream</code> once to connect to RadiantPlay; it adds <code>https://${HOST}/mohammed-faris/radiantplay.git</code> as <code>upstream</code>.</p>"
elif [ -z "$D_UP_REF" ]; then
  D_UPDATES_BODY="<p class='empty'>Couldn't read <code>${D_UP}/main</code>. Connect to Twingate VPN and run the canvas again.</p>"
elif ! $D_BEHIND; then
  D_UPDATES_BODY="<h2>Up to date</h2><p>Your <code>${D_BASE}</code> has everything in RadiantPlay <code>${D_UP_VER:-?}</code>.</p>"
else
  if $D_VERY_BEHIND; then
    D_UPDATES_BODY="<h2>You're very behind</h2><p>Your fork predates the releases RadiantPlay lists, so here are the latest. Run <code>/rp-sync-upstream</code> to catch up.</p>"
  elif [ "$D_RELEASES_BEHIND" -gt 0 ]; then
    D_UPDATES_BODY="<h2>You're ${D_RELEASES_BEHIND} $(plural "$D_RELEASES_BEHIND" release) behind</h2><p>You're on <code>${D_MY_VER}</code>, RadiantPlay is on <code>${D_UP_VER:-?}</code>. Run <code>/rp-sync-upstream</code> to get them.</p>"
  else
    D_UPDATES_BODY="<h2>Same release, newer fixes</h2><p>You're on <code>${D_MY_VER}</code> like RadiantPlay, which has ${D_COMMITS_BEHIND} newer $(plural "$D_COMMITS_BEHIND" commit). Run <code>/rp-sync-upstream</code> to get them.</p>"
  fi
  $D_NEEDS_SECOND_SYNC && D_UPDATES_BODY="${D_UPDATES_BODY}<p>After the sync finishes, run <code>/rp-sync-upstream</code> once more. Your fork doesn't have the light-only step yet, and the second run picks it up.</p>"
  if [ -n "$D_RELEASE_ROWS" ]; then
    more=""; [ "$D_RELEASE_MORE" -gt 0 ] && more="<p class='file-list'>And ${D_RELEASE_MORE} older $(plural "$D_RELEASE_MORE" release).</p>"
    D_UPDATES_BODY="${D_UPDATES_BODY}<h2>What's new</h2><table><thead><tr><th>Release</th><th>Date</th><th>Summary</th></tr></thead><tbody>${D_RELEASE_ROWS}</tbody></table>${more}"
  fi
fi
D_UPDATES_BODY="${D_UPDATES_BODY}<div class='stat-grid'><div class='stat'><div class='k'>Your version</div><div class='v'>${D_MY_VER:-—}</div></div><div class='stat'><div class='k'>RadiantPlay</div><div class='v'>${D_UP_VER:-—}</div></div><div class='stat'><div class='k'>Commits behind</div><div class='v'>$([ -n "$D_UP_REF" ] && echo "$D_COMMITS_BEHIND" || echo —)</div></div></div>"
# A feature branch: how far it is from main, since the sync only updates main.
case "$D_BRANCH_VS_MAIN" in
  -*/+*)
    bb="${D_BRANCH_VS_MAIN%%/*}"; bb="${bb#-}"; ba="${D_BRANCH_VS_MAIN##*+}"
    D_UPDATES_BODY="${D_UPDATES_BODY}<p>You're on <code>$(d_html "$CUR_BRANCH")</code>, which is ${bb} $(plural "$bb" commit) behind and ${ba} ahead of your <code>main</code>. The sync updates <code>main</code>; merge <code>main</code> into your branch afterwards.</p>" ;;
  "in sync")
    D_UPDATES_BODY="${D_UPDATES_BODY}<p>You're on <code>$(d_html "$CUR_BRANCH")</code>, which matches your <code>main</code>. The sync updates <code>main</code>; merge <code>main</code> into your branch afterwards.</p>" ;;
esac
D_UPDATES_BODY="${D_UPDATES_BODY}<p class='file-list'>The full changelog is at <a href='${STATUS_APP_BASE}/radiant/changelog'>${STATUS_APP_BASE#http://}/radiant/changelog</a> while <code>npm run dev</code> is running.</p>"

if [ "$D_PROTO_N" -gt 0 ]; then
  D_PROTO_BODY="<table><thead><tr><th>Prototype</th><th>Last change</th><th>Theme</th><th>Dark ready</th><th>Geist ready</th><th>Thumbnail</th><th></th></tr></thead><tbody>${D_PROTO_ROWS}</tbody></table>"
elif $D_SCAN_OK; then
  D_PROTO_BODY="<p class='empty'>No prototypes in <code>src/prototypes/registry-mine.ts</code> yet. Run <code>/rp-new-prototype</code> to start one.</p>"
else
  D_PROTO_BODY="<p class='empty'>Couldn't read your prototypes: <code>node scripts/radiant-check/scan.mjs --mine --json</code> didn't run. Check that Node is installed, or run <code>/rp-sync-upstream</code> to get the scan.</p>"
fi
D_PROTO_BODY="${D_PROTO_BODY}<p class='file-list'>Theme Global means the prototype follows light and dark; Light only keeps it light. Open links go to the dev server, so run <code>npm run dev</code> first. Plus ${D_SAMPLE_N} sample prototypes from RadiantPlay in the <a href='${STATUS_APP_BASE}/'>gallery</a>.</p>"

# Home already says "Up to date" in the sync card, so the updates block only
# shows when there is something to act on.
D_UPDATES_BLOCK=""
if [ -z "$D_UP" ] || [ -z "$D_UP_REF" ] || $D_BEHIND; then
  D_UPDATES_BLOCK="<div class='updates'>${D_UPDATES_BODY}</div>"
fi
D_UPDATES_N=""
$D_BEHIND && [ "$D_RELEASES_BEHIND" -gt 0 ] && D_UPDATES_N="<span class='n'>${D_RELEASES_BEHIND}</span>"
D_STEP_COUNT_LABEL=""
[ "$D_STEP_N" -gt 0 ] && D_STEP_COUNT_LABEL="<span class='n num'>${D_STEP_N}</span>"
D_GUIDE_BODY="<p class='empty'>No guides in this checkout yet. Run <code>/rp-sync-upstream</code> to get them.</p>"
[ -n "$D_GUIDE_CARDS" ] && D_GUIDE_BODY="<div class='cards'>${D_GUIDE_CARDS}</div>"

D_SITE_NC_CELL="—"
if [ "$D_SITE_STATE" = "up" ]; then
  D_SITE_NC_CELL="<span class='chip wip'>No</span>"
  [ "$D_SITE_NOCACHE" = "yes" ] && D_SITE_NC_CELL="<span class='chip live'>Yes</span>"
fi
D_SITE_PILL_DOT="$D_SITE_DOT"
D_SITE_PILL_M="$D_SITE_V"

mkdir -p public
cat > "$OUT" <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>$(d_html "$STATUS_TAB_TITLE")</title>
$(canvas_style)
<script>document.documentElement.setAttribute('data-look', 'radiance');</script>
<style>
  /* Geist ships in every fork at public/fonts/geist/, next to this page, so it
     loads from file:// with no network. Variable, so the 760 headings are exact. */
  @font-face { font-family: "Geist"; src: url("./fonts/geist/Geist-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
  @font-face { font-family: "Geist Mono"; src: url("./fonts/geist/GeistMono-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
  /* Designer canvas: the Radiance look, from radiance-language.vercel.app/how-to-use.
     Radiance's layout in Geist (its own Aptos isn't on most Macs). White paper, near-black ink, heavy tight headings, hairline 20px cards,
     soft pill chips, black pill controls, a Radiance wash at the top. The site
     has no dark mode; the dark values below are this canvas's own match. */
  html[data-look="radiance"] {
    --sans: "Geist", "Helvetica Neue", Arial, sans-serif;
    --mono: "Geist Mono", "SF Mono", Menlo, Consolas, monospace;
    --page-bg: #ffffff; --page-grad: none; --wash-op: .55;
    --surface: #ffffff; --surface-2: #f7f8fb; --hover: #f7f8fb;
    --border: rgba(20,24,33,.09); --border-strong: rgba(20,24,33,.18); --row-border: rgba(20,24,33,.08);
    --th-bg: transparent; --code-bg: rgba(20,24,33,.055);
    --text: #141821; --text-2: #5f6878; --text-3: #8a92a1; --text-4: #a9afba;
    --green: #15803d; --amber: #b45309; --amber-deep: #b45309; --red: #b91c1c;
    --accent: #141821; --accent-bg: rgba(20,24,33,.06); --accent-border: rgba(20,24,33,.12);
    --link: #141821; --link-h: #2770ef;
    --chip-live-bg: #e8f6ed; --chip-live-tx: #15803d;
    --chip-wip-bg: #fdf0dd;  --chip-wip-tx: #b45309;
    --chip-flat-bg: rgba(20,24,33,.055); --chip-flat-tx: rgba(20,24,33,.72);
    --chip-down-bg: #fdeaea; --chip-down-tx: #b91c1c;
    --radius: 20px; --radius-sm: 9px; --radius-pill: 999px; --shadow: none;
    --label-font: var(--sans); --label-tr: uppercase; --label-ls: .1em; --label-w: 800; --label-size: 12px;
    --ink-btn: #141821; --ink-btn-tx: #ffffff; --ink-btn-h: #2a303b;
    color-scheme: light;
  }
  html[data-look="radiance"][data-mode="dark"] {
    --page-bg: #131416; --wash-op: .22;
    --surface: #15181d; --surface-2: #1b1f26; --hover: #1b1f26;
    --border: rgba(255,255,255,.09); --border-strong: rgba(255,255,255,.2); --row-border: rgba(255,255,255,.07);
    --code-bg: rgba(255,255,255,.07);
    --text: #eef0f4; --text-2: #a3aab6; --text-3: #7c8492; --text-4: #5d6470;
    --green: #4ade80; --amber: #f0b45c; --amber-deep: #f0b45c; --red: #f87171;
    --accent: #eef0f4; --accent-bg: rgba(255,255,255,.07); --accent-border: rgba(255,255,255,.16);
    --link: #eef0f4; --link-h: #71a1f4;
    --chip-live-bg: rgba(74,222,128,.13); --chip-live-tx: #4ade80;
    --chip-wip-bg: rgba(240,180,92,.13);  --chip-wip-tx: #f0b45c;
    --chip-flat-bg: rgba(255,255,255,.07); --chip-flat-tx: rgba(238,240,244,.78);
    --chip-down-bg: rgba(248,113,113,.14); --chip-down-tx: #f87171;
    --ink-btn: #eef0f4; --ink-btn-tx: #0f1115; --ink-btn-h: #ffffff;
    color-scheme: dark;
  }
  html[data-look="radiance"] body { background: var(--page-bg); color: var(--text-2); font-size: 15px; letter-spacing: -.01em; }

  /* The Radiance wash: Radiance's own "home" product pattern (top wash, subtle,
     fast), drawn by its renderer into .radiance-local. No hand-made gradient. */
  html[data-look="radiance"] .wash { height: 680px; position: absolute; }
  html[data-look="radiance"] .wash::before { content: none; }
  html[data-look="radiance"] .wash .radiance-home-stage { height: 420px; }

  /* Header: a big, heavy title. */
  html[data-look="radiance"] header { padding-top: clamp(40px, 6vw, 72px); }
  html[data-look="radiance"] header .label { color: var(--text-3); font: 800 12px/1.4 var(--sans); letter-spacing: .1em; margin-bottom: 14px; }
  html[data-look="radiance"] header h1 { font-size: clamp(36px, 4.4vw, 56px); font-weight: 760; line-height: 1.02; letter-spacing: -.035em; }
  html[data-look="radiance"] header h1 em { color: var(--text); }
  html[data-look="radiance"] header .meta { margin-top: 18px; font-size: 15px; color: var(--text-2); letter-spacing: -.015em; }

  /* Toolbar: pill tabs and pill controls. */
  html[data-look="radiance"] .toolbar { padding-top: 32px; margin-bottom: 36px; }
  html[data-look="radiance"] nav.tabs { background: var(--surface-2); border: 1px solid var(--border); border-radius: 999px; padding: 4px; }
  html[data-look="radiance"] nav.tabs button { border-radius: 999px; padding: 8px 18px; font-size: 14px; font-weight: 650; color: var(--text-2); }
  html[data-look="radiance"] nav.tabs button.active { background: var(--ink-btn); color: var(--ink-btn-tx); outline: 0; }
  html[data-look="radiance"] nav.tabs button.active .n { color: var(--ink-btn-tx); opacity: .7; }
  html[data-look="radiance"] .pill { border-radius: 999px; height: 36px; padding: 0 14px; font-size: 14px; font-weight: 650; background: transparent; border-color: var(--border); }
  html[data-look="radiance"] button.pill:hover { background: var(--accent-bg); border-color: var(--border); }

  html[data-look="radiance"] main { padding: 0 clamp(20px, 5vw, 48px) 96px; max-width: 1280px; margin: 0 auto; }
  html[data-look="radiance"] header, html[data-look="radiance"] .toolbar { max-width: 1280px; margin-left: auto; margin-right: auto; padding-left: clamp(20px, 5vw, 48px); padding-right: clamp(20px, 5vw, 48px); }

  /* Section headings: Radiance h3 weight, sentence case, no rule. */
  html[data-look="radiance"] h2 { font: 760 clamp(21px, 1.8vw, 26px)/1.12 var(--sans); letter-spacing: -.03em; text-transform: none; color: var(--text); background: none; margin: 56px 0 16px; padding: 0; }
  html[data-look="radiance"] h2:first-child { margin-top: 0; }
  html[data-look="radiance"] h2 .n { font-size: 13px; font-weight: 700; color: var(--text-3); letter-spacing: 0; vertical-align: middle; }
  html[data-look="radiance"] p { color: var(--text-2); line-height: 1.5; }

  /* Cards and tables: hairline, 20px radius, hover lifts. */
  html[data-look="radiance"] .card, html[data-look="radiance"] .stat { border-radius: 20px; border-color: var(--border); padding: 26px 28px; }
  html[data-look="radiance"] .card:hover { border-color: var(--border); background: var(--surface); box-shadow: none; }
  html[data-look="radiance"] a.card:hover, html[data-look="radiance"] .card.md-link:hover { border-color: var(--border-strong); background: var(--surface-2); }
  html[data-look="radiance"] .home .steps:hover { background: var(--surface-2); }
  html[data-look="radiance"] .c-title { font-size: 15px; font-weight: 740; letter-spacing: -.015em; }
  html[data-look="radiance"] .c-desc { font-size: 13px; color: var(--text-2); }
  html[data-look="radiance"] .stat .k { color: var(--text-3); font-size: 12px; }
  html[data-look="radiance"] .stat .v { font-weight: 760; font-size: 24px; letter-spacing: -.03em; }
  html[data-look="radiance"] table { border-radius: 20px; border-color: var(--border); }
  html[data-look="radiance"] th { color: var(--text-3); font: 800 11.5px/1 var(--sans); letter-spacing: .1em; padding: 16px 18px 12px; }
  html[data-look="radiance"] td { padding: 14px 18px; font-size: 14px; }
  html[data-look="radiance"] .chip { font: 600 12px/1 var(--sans); letter-spacing: -.005em; padding: 7px 11px; }
  html[data-look="radiance"] code { font: 500 12.5px/1.5 var(--mono); color: var(--text); background: var(--code-bg); border: 0; border-radius: 6px; padding: 1px 6px; }
  html[data-look="radiance"] a { color: var(--link); font-weight: 650; border-bottom: 0; text-decoration: underline; text-decoration-thickness: 1px; text-decoration-color: var(--border-strong); text-underline-offset: 5px; }
  html[data-look="radiance"] a:hover { color: var(--link); text-decoration-color: var(--link-h); }
  html[data-look="radiance"] a.card { text-decoration: none; font-weight: 400; color: inherit; border-bottom: 1px solid var(--border); }
  html[data-look="radiance"] .card.md-link { font-weight: 400; border: 1px solid var(--border); }
  html[data-look="radiance"] .cards { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  html[data-look="radiance"] .cards .c-foot { display: none; }
  html[data-look="radiance"] .c-desc { -webkit-line-clamp: 3; line-height: 1.5; }
  html[data-look="radiance"] .file-list { font: 400 14px/1.55 var(--sans); color: var(--text-2); }
  html[data-look="radiance"] footer { font: 13px/1.5 var(--sans); color: var(--text-3); border-top: 1px solid var(--row-border); max-width: calc(1280px - 2 * clamp(20px, 5vw, 48px)); margin: 0 auto; padding: 24px 0 48px; }
  @media (max-width: 1376px) { html[data-look="radiance"] footer { margin: 0 clamp(20px, 5vw, 48px); } }
  html[data-look="radiance"] .backlink { border-radius: 999px; }

  /* Home: next steps as a numbered list, then sync and site cards. */
  .home { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 8px; }
  @media (max-width: 720px) { .home { grid-template-columns: 1fr; } }
  .home .card { gap: 10px; }
  .home .k { font: 800 12px/1.4 var(--sans); letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); display: flex; align-items: center; gap: 8px; }
  .home .k .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex: none; }
  .home .k .dot.warn { background: var(--amber); }
  .home .k .dot.down { background: var(--text-4); }
  .home .v { font: 760 26px/1.12 var(--sans); color: var(--text); letter-spacing: -.03em; }
  .home p { margin: 0; font-size: 15px; line-height: 1.5; }
  .home .steps { grid-column: 1 / -1; background: var(--surface-2); }
  .home ol { margin: 4px 0 0; padding: 0; list-style: none; counter-reset: step; display: grid; gap: 14px; font-size: 15px; }
  .home ol li { counter-increment: step; position: relative; padding-left: 34px; color: var(--text); }
  .home ol li::before { content: counter(step, decimal-leading-zero); position: absolute; left: 0; top: .3em; color: var(--text-3); font: 800 12px/1 var(--sans); letter-spacing: .1em; }
  .updates { margin-top: 56px; }
</style>
</head>
<body>
<div class="wash" aria-hidden="true"><div class="radiance-home-stage"><div class="radiance-home"><div class="radiance-local" data-radiance-pattern="home" data-radiance-appearance="light"></div></div></div></div>
<div class="shell">
<header>
  <div class="label">Your project canvas</div>
  <h1>${D_TITLE_HTML}</h1>
  <div class="meta">Generated <span class="num">${NOW}</span> · branch <code>$(d_html "$CUR_BRANCH")</code> · <strong class="num">${MOD_COUNT}</strong> modified, <strong class="num">${UNTRACKED_COUNT}</strong> untracked</div>
</header>
<div class="toolbar">
  <nav class="tabs">
    <button class="tab-btn active" data-tab="home">Home${D_UPDATES_N}</button>
    <button class="tab-btn" data-tab="prototypes">My prototypes<span class="n">${D_PROTO_N}</span></button>
  </nav>
  <div class="tools">
    <button class="pill" id="mode-toggle" title="Switch between light and dark">Mode<span class="m" id="mode-name">—</span></button>
  </div>
</div>
<main>

<section id="home" class="active">
  <div class="home">
    <div class="card steps">
      <div class="k">Next steps ${D_STEP_COUNT_LABEL}</div>
      <ol>${D_STEPS}</ol>
    </div>
    <div class="card">
      <div class="k"><span class="dot ${D_SYNC_DOT}"></span>RadiantPlay sync</div>
      <div class="v">${D_SYNC_V}</div>
      <p>${D_SYNC_P}</p>
    </div>
    <div class="card">
      <div class="k"><span class="dot ${D_SITE_DOT}"></span>Your site</div>
      <div class="v">${D_SITE_V}</div>
      <p>${D_SITE_P}</p>
    </div>
  </div>
  ${D_UPDATES_BLOCK}
  <h2>Your branches <span class="n num">${D_BRANCH_N}</span></h2>
  <p class="file-list">Pushed means the branch tracks a remote branch. Unpushed counts commits no remote has yet. Divergence reads behind/ahead against your <code>main</code> and against RadiantPlay${D_UP_REF:+ (<code>${D_UP_REF}</code>)}; <code>—</code> means there's nothing to compare with.</p>
  <table>
    <thead><tr><th>Branch</th><th>Pushed</th><th>Unpushed</th><th>Uncommitted</th><th>vs main</th><th>vs RadiantPlay</th><th>Last commit</th></tr></thead>
    <tbody>${D_BRANCH_ROWS:-<tr><td colspan='7' class='empty'>No branches.</td></tr>}</tbody>
  </table>
  <h2>Guides</h2>
  ${D_GUIDE_BODY}
</section>

<section id="prototypes">
  <h2>My prototypes <span class="n num">${D_PROTO_N}</span></h2>
  ${D_PROTO_BODY}
  <h2>My site</h2>
  <table>
    <thead><tr><th>URL</th><th>Health</th><th>Pages served no-cache</th><th>Detail</th></tr></thead>
    <tbody><tr><td>${D_SITE_HREF:-<span class='empty'>None yet</span>}</td><td>${D_SITE_CHIP}</td><td>${D_SITE_NC_CELL}</td><td>${D_SITE_P}</td></tr></tbody>
  </table>
  <p class="file-list">The canvas checks <code>/playground</code> on your site with a ${STATUS_SITE_TIMEOUT}s timeout. Coolify sites only answer on Twingate VPN, so off VPN they read as unreachable; that's the network, not a broken deploy. Without <code>no-cache</code>, browsers keep an old build after a deploy; <code>/rp-coolify-deploy check</code> fixes it. Your site URL lives in <code>STATUS_SITE_URL</code> in <code>internal/status.local.sh</code>.</p>
</section>




</main>
<footer>
  Generated by <code>internal/scripts/status.sh</code> · your settings in <code>internal/status.local.sh</code> · re-run any time · zero LLM tokens
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
  // Radiance reads light or dark from data-radiance-appearance; keep it on the
  // canvas's Mode. The renderer and the Home recipe live in public/vendor/radiance/;
  // a fork without them just gets a plain page.
  (function () {
    var surface = document.querySelector('.radiance-local');
    if (!surface) return;
    function sync() { surface.dataset.radianceAppearance = document.documentElement.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'; }
    sync();
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
  })();
</script>
<link rel="stylesheet" href="./vendor/radiance/radiance-home.css">
<script src="./vendor/radiance/radiance-renderer.js" defer></script>
</body>
</html>
HTML

echo "✓ Wrote $OUT (designer canvas)"

if ! $NO_OPEN; then
  if command -v open >/dev/null; then
    open "$OUT"
  fi
fi
