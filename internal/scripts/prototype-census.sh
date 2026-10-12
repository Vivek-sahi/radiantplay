#!/usr/bin/env bash
# prototype-census.sh — SLOW, opt-in. Counts every prototype across every fork.
#
# Auto-discovers forks from the galaxy GitHub Enterprise API (falling back to
# internal/scripts/forks.txt if the API is unreachable), plus the maintainer
# repo, counts prototypes (folders + registry entries by section, per creator,
# archived included), and writes a cache that /rp-project-canvas displays cheaply:
#
#   internal/cache/prototype-census.json   — machine-readable data
#   internal/cache/prototype-census.html   — fragment embedded by status.sh
#
# This is intentionally NOT run by /rp-project-canvas (it git-fetches ~16 repos and
# takes a while). Run it explicitly via /rp-prototype-census when you want fresh
# numbers. The dashboard shows the last cached run + a refresh hint.
#
# Usage:  bash internal/scripts/prototype-census.sh
set -u

ROOT="$(cd "$(dirname "$0")/.." && cd .. && pwd)"
cd "$ROOT"

HOST="galaxy.corp.thoughtspot.com"
FORKS_FILE="internal/scripts/forks.txt"
MAINTAINER="mohammed-faris/radiantplay"
CACHE_DIR="internal/cache"
NOW="$(date '+%Y-%m-%d %H:%M')"

mkdir -p "$CACHE_DIR"

# Discover forks live from the galaxy GitHub Enterprise API, using the token git
# already has for the host. Prints one `owner/repo` per line; empty on failure.
discover_forks() {
  local token page=1 got
  token=$(printf "protocol=https\nhost=%s\n\n" "$HOST" | git credential fill 2>/dev/null \
          | awk -F= '/^password=/{print $2}')
  [ -z "$token" ] && return 1
  while :; do
    got=$(curl -s -H "Authorization: token $token" -H "Accept: application/vnd.github+json" \
      "https://$HOST/api/v3/repos/$MAINTAINER/forks?per_page=100&page=$page" 2>/dev/null \
      | python3 -c "import json,sys
try: d=json.load(sys.stdin)
except Exception: sys.exit(1)
[print(x['full_name']) for x in d]" 2>/dev/null)
    [ -z "$got" ] && break
    echo "$got"
    [ "$(echo "$got" | wc -l | tr -d ' ')" -lt 100 ] && break   # last page
    page=$((page + 1))
  done
}

# Build the target list: maintainer first, then the union of API-discovered forks
# and forks.txt (the file is now a fallback/supplement, not the source of truth).
LIST_TMP=$(mktemp -t rp-forklist)
trap 'rm -f "$LIST_TMP"' EXIT

DISCOVERED="$(discover_forks)"
if [ -n "$DISCOVERED" ]; then
  echo "$DISCOVERED" >> "$LIST_TMP"
  echo "Discovered $(echo "$DISCOVERED" | wc -l | tr -d ' ') forks via galaxy API."
else
  echo "API discovery unavailable — falling back to $FORKS_FILE."
fi
if [ -f "$FORKS_FILE" ]; then
  while IFS= read -r line; do
    line="${line%%#*}"; line="$(echo "$line" | tr -d '[:space:]')"
    [ -n "$line" ] && echo "$line" >> "$LIST_TMP"
  done < "$FORKS_FILE"
fi

TARGETS=("$MAINTAINER")
while IFS= read -r f; do
  [ "$f" = "$MAINTAINER" ] && continue    # maintainer handled as baseline
  TARGETS+=("$f")
done < <(sort -u "$LIST_TMP")

if [ "${#TARGETS[@]}" -le 1 ]; then
  echo "✗ no forks discovered and no $FORKS_FILE — nothing to count." >&2
  exit 1
fi

# Hand the resolved target list to the Python counter so it counts exactly what
# we fetched (not a stale re-read of forks.txt).
TARGETS_FILE=$(mktemp -t rp-targets)
printf '%s\n' "${TARGETS[@]}" > "$TARGETS_FILE"
trap 'rm -f "$LIST_TMP" "$TARGETS_FILE"' EXIT

sanitize() { echo "$1" | tr '/' '_'; }   # owner/repo -> owner_repo (ref-path safe)

# Clean any refs from a previous run so counts never double up.
git for-each-ref --format='%(refname)' refs/census/ 2>/dev/null | while IFS= read -r r; do
  git update-ref -d "$r" 2>/dev/null
done

echo "Fetching ${#TARGETS[@]} repos (this is the slow part)…"
REACHABLE=()
for t in "${TARGETS[@]}"; do
  url="https://$HOST/$t"
  key="$(sanitize "$t")"
  if git ls-remote --heads "$url" >/dev/null 2>&1 && [ -n "$(git ls-remote --heads "$url" 2>/dev/null)" ]; then
    git fetch --quiet "$url" "+refs/heads/*:refs/census/$key/*" 2>/dev/null \
      && { REACHABLE+=("$t"); echo "  ok   $t"; } \
      || echo "  FAIL $t (fetch error)"
  else
    echo "  --   $t (unreachable / no access)"
  fi
done

echo "Counting prototypes…"

RP_NOW="$NOW" RP_TARGETS_FILE="$TARGETS_FILE" RP_MAINTAINER="$MAINTAINER" \
RP_CACHE_DIR="$CACHE_DIR" RP_HOST="$HOST" python3 - <<'PY'
import subprocess, re, os, json, html
from collections import defaultdict

NOW          = os.environ["RP_NOW"]
TARGETS_FILE = os.environ["RP_TARGETS_FILE"]
MAINTAINER   = os.environ["RP_MAINTAINER"]
CACHE_DIR    = os.environ["RP_CACHE_DIR"]
HOST         = os.environ["RP_HOST"]

def sh(args): return subprocess.run(args, capture_output=True, text=True).stdout

def sanitize(t): return t.replace("/", "_")

# Exact target list bash resolved and fetched (maintainer first, then all forks).
targets = []
with open(TARGETS_FILE) as f:
    for ln in f:
        ln = ln.strip()
        if ln:
            targets.append(ln)

# Which targets actually have fetched refs?
all_refs = sh(["git", "for-each-ref", "--format=%(refname)", "refs/census/"]).splitlines()
present_keys = set()
refs_by_key = defaultdict(list)
for r in all_refs:
    rest = r[len("refs/census/"):]           # <key>/<branch...>
    key = rest.split("/", 1)[0]
    refs_by_key[key].append(r)
    present_keys.add(key)

ENTRY_RE = re.compile(r"id:\s*['\"]([^'\"]+)['\"]")
def field(chunk, name):
    m = re.search(name + r":\s*['\"]([^'\"]+)['\"]", chunk)
    return m.group(1) if m else None

def parse_registry(text):
    if not text: return []
    out = []
    idxs = [m.start() for m in ENTRY_RE.finditer(text)] + [len(text)]
    for i in range(len(idxs) - 1):
        chunk = text[idxs[i]:idxs[i+1]]
        pid = ENTRY_RE.search(chunk).group(1)
        if pid == "MyPrototype":              # doc example in the header comment
            continue
        out.append({
            "id": pid,
            "name": field(chunk, "name") or pid,
            "author": field(chunk, "author") or "unknown",
            "section": field(chunk, "section") or "mine",
        })
    return out

def folders_for(ref):
    names = set()
    for line in sh(["git", "ls-tree", ref, "src/prototypes/"]).splitlines():
        parts = line.split()
        if len(parts) >= 4 and parts[1] == "tree":
            n = parts[3].split("/")[-1]
            if not n.startswith("_") and n != "thumbnails":
                names.add(n)
    return names

maint_key = sanitize(MAINTAINER)
fork_data = {}                 # display name -> dict
global_entries = {}            # id -> {name,author,section,forks:set}
global_folders = set()
baseline_ids = set()

for t in targets:
    key = sanitize(t)
    display = t
    if key not in present_keys:
        fork_data[display] = {"reachable": False}
        continue
    refs = refs_by_key[key]
    entries = {}               # id -> entry (union across branches)
    folders = set()
    for ref in refs:
        for reg in ("src/prototypes/registry-core.ts", "src/prototypes/registry-mine.ts"):
            for e in parse_registry(sh(["git", "show", f"{ref}:{reg}"])):
                cur = entries.get(e["id"])
                if not cur:
                    entries[e["id"]] = dict(e)
                elif cur["author"] == "unknown" and e["author"] != "unknown":
                    cur["author"] = e["author"]
        folders |= folders_for(ref)
    sec = defaultdict(int)
    for e in entries.values(): sec[e["section"]] += 1
    fork_data[display] = {
        "reachable": True,
        "branches": len(refs),
        "registry_total": len(entries),
        "sample": sec.get("sample", 0),
        "mine": sec.get("mine", 0),
        "archived": sec.get("archived", 0),
        "folders": len(folders),
    }
    if t == MAINTAINER:
        baseline_ids = set(entries.keys())
    global_folders |= folders
    for pid, e in entries.items():
        g = global_entries.get(pid)
        if not g:
            global_entries[pid] = {"name": e["name"], "author": e["author"],
                                   "section": e["section"], "forks": {display}}
        else:
            g["forks"].add(display)
            if g["author"] in ("unknown", "Design Team") and e["author"] not in ("unknown", "Design Team"):
                g["author"] = e["author"]

# Per-fork originals = registry entries not present in the maintainer baseline.
for display, d in fork_data.items():
    if not d.get("reachable"): continue
    key = sanitize(display)
    ids = set()
    for ref in refs_by_key[key]:
        for reg in ("src/prototypes/registry-core.ts", "src/prototypes/registry-mine.ts"):
            for e in parse_registry(sh(["git", "show", f"{ref}:{reg}"])):
                ids.add(e["id"])
    d["originals"] = len(ids - baseline_ids) if display != MAINTAINER else len(ids)

# Totals
sec = defaultdict(int)
for e in global_entries.values(): sec[e["section"]] += 1
by_author = defaultdict(int)
for e in global_entries.values(): by_author[e["author"]] += 1
BASE_AUTHORS = {"Design Team"}
designer_total = sum(n for a, n in by_author.items() if a not in BASE_AUTHORS)

totals = {
    "generated": NOW,
    "folders_total": len(global_folders),
    "registry_total": len(global_entries),
    "sample": sec.get("sample", 0),
    "mine": sec.get("mine", 0),
    "archived": sec.get("archived", 0),
    "designer_originals": designer_total,
    "reachable_forks": sum(1 for d in fork_data.values() if d.get("reachable")),
    "total_targets": len(targets),
}

data = {
    "totals": totals,
    "by_creator": dict(sorted(by_author.items(), key=lambda kv: -kv[1])),
    "forks": fork_data,
}
with open(os.path.join(CACHE_DIR, "prototype-census.json"), "w") as f:
    json.dump(data, f, indent=2)

# ── HTML fragment (reuses status.sh CSS classes) ──────────────────────────
e = html.escape
rows_forks = ""
for display in targets:
    d = fork_data.get(display, {"reachable": False})
    url = f"https://{HOST}/{display}"
    if not d.get("reachable"):
        rows_forks += (f"<tr class='muted'><td><a href='{e(url)}' target='_blank'>{e(display)}</a></td>"
                       f"<td>unreachable</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>")
        continue
    rows_forks += (f"<tr><td><a href='{e(url)}' target='_blank'>{e(display)}</a></td>"
                   f"<td>{d['registry_total']}</td><td>{d['originals']}</td>"
                   f"<td>{d['archived']}</td><td>{d['folders']}</td><td>{d['branches']}</td></tr>")

rows_creators = ""
for a, n in sorted(by_author.items(), key=lambda kv: -kv[1]):
    tag = " <span class='badge'>base library</span>" if a in BASE_AUTHORS else ""
    rows_creators += f"<tr><td>{e(a)}{tag}</td><td>{n}</td></tr>"

frag = f"""<p class="file-list">Last run <strong>{e(NOW)}</strong> · {totals['reachable_forks']}/{totals['total_targets']} forks reachable · run <code>/rp-prototype-census</code> to refresh (slow — fetches every fork).</p>
<div class="stat-grid">
  <div class="stat"><div class="k">Prototype folders (all)</div><div class="v">{totals['folders_total']}</div></div>
  <div class="stat"><div class="k">Gallery-listed</div><div class="v">{totals['registry_total']}</div></div>
  <div class="stat"><div class="k">Archived</div><div class="v">{totals['archived']}</div></div>
  <div class="stat"><div class="k">Designer originals</div><div class="v">{totals['designer_originals']}</div></div>
</div>
<h2>Prototypes by fork</h2>
<table>
  <thead><tr><th>Fork</th><th>Listed</th><th>Originals</th><th>Archived</th><th>Folders</th><th>Branches</th></tr></thead>
  <tbody>{rows_forks}</tbody>
</table>
<h2>Prototypes by creator</h2>
<table>
  <thead><tr><th>Creator</th><th>Created</th></tr></thead>
  <tbody>{rows_creators}</tbody>
</table>
"""
with open(os.path.join(CACHE_DIR, "prototype-census.html"), "w") as f:
    f.write(frag)

print(f"\n✓ {totals['folders_total']} prototype folders · {totals['registry_total']} gallery-listed "
      f"({totals['archived']} archived) across {totals['reachable_forks']} forks")
print(f"  cache: {CACHE_DIR}/rp-prototype-census.json + .html")
PY

# Clean up fetched census refs so the working repo stays tidy.
git for-each-ref --format='%(refname)' refs/census/ 2>/dev/null | while IFS= read -r r; do
  git update-ref -d "$r" 2>/dev/null
done

echo "Done."
