#!/bin/bash
# public-strip.sh — Radiant Play public-snapshot generator (v1)
#
# Produces a clean, leak-free snapshot of the repo suitable for publishing to
# github.com/thoughtspot/radiant-play.
#
# The script NEVER modifies the source tree. All transformations happen on a
# fresh copy in $OUTPUT (default: ./.public-export/).
#
# Mechanism:
#   1. git archive HEAD → tar → $OUTPUT     (gitignored files automatically excluded)
#   2. Omit tracked-but-internal files      (sentinel headers + explicit paths)
#   3. String replacements                  (mock emails, hrefs, designer names, etc.)
#   4. Stamp public version into platformVersion.ts
#   5. Swap .public.* files                 (versionHistory, highlights, CHANGELOG)
#   6. Build verification                   (npm ci + build:strict in output dir)
#   7. Final-gate grep with allowlist       (fails loudly on unallowed bad strings)
#   8. Strip report                         ($OUTPUT/.public-strip-report.md)
#
# Note: this script never modifies the source tree. "Omit" / "exclude" describe
# what doesn't make it into the throwaway $OUTPUT copy — the original files
# stay in place in the internal repo, untouched.
#
# Reads: scripts/public-strip-allowlist.txt  (path-glob:pattern exceptions)
#
# Usage:
#   bash scripts/public-strip.sh --public-version=1.0.0                 # dry-run default
#   bash scripts/public-strip.sh --public-version=1.0.0 --skip-build    # fast iteration
#   bash scripts/public-strip.sh --public-version=1.0.0 --output=/tmp/x # custom dir
#
# This script is dry-run only. A real push to github.com/thoughtspot/radiant-play
# happens via .github/workflows/publish-public.yml + the PUBLIC_REPO_DEPLOY_KEY
# secret, NOT from this script directly.

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ALLOWLIST="$SCRIPT_DIR/public-strip-allowlist.txt"

# Defaults
OUTPUT="$REPO_ROOT/.public-export"
PUBLIC_VERSION=""
SKIP_BUILD=false

# ─── Parse arguments ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --public-version=*)  PUBLIC_VERSION="${1#*=}"; shift;;
    --output=*)          OUTPUT="${1#*=}"; shift;;
    --skip-build)        SKIP_BUILD=true; shift;;
    -h|--help)
      sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown flag: $1" >&2; exit 1;;
  esac
done

if [[ -z "$PUBLIC_VERSION" ]]; then
  echo "ERROR: --public-version=<ver> is required (e.g. --public-version=1.0.0)" >&2
  exit 1
fi

if ! [[ "$PUBLIC_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.]+)?$ ]]; then
  echo "ERROR: --public-version must be SemVer (e.g. 1.0.0 or 1.0.0-rc.1)" >&2
  exit 1
fi

# ─── Banner ─────────────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────────────────────"
echo " Radiant Play public-strip (v1)"
echo "──────────────────────────────────────────────────────────────"
echo "  Source:         $REPO_ROOT"
echo "  Output:         $OUTPUT"
echo "  Public version: $PUBLIC_VERSION"
echo "  Skip build:     $SKIP_BUILD"
echo "──────────────────────────────────────────────────────────────"
echo ""

cd "$REPO_ROOT"

# ─── Step 1: Snapshot tracked files via git archive ─────────────────────────
echo "[1/8] Snapshotting tracked files to $OUTPUT..."
rm -rf "$OUTPUT"
mkdir -p "$OUTPUT"
git archive --format=tar HEAD | tar -x -C "$OUTPUT"
echo "      ✓ $(find "$OUTPUT" -type f | wc -l | tr -d ' ') files copied"
echo ""

# ─── Step 2: Omit tracked-but-internal files ───────────────────────────────
echo "[2/8] Omitting tracked-but-internal files from snapshot..."

# Files that must never leave the private repo (tracked today, will move under
# Shape C, omitted here regardless of their current location)
declare -a FILES_TO_OMIT=(
  # Pattern A — internal CLAUDE companion
  "CLAUDE.internal.md"

  # Front-door docs that are entirely Galaxy/ThoughtSpot-shaped
  "FORK-WORKFLOW.md"
  "Onepager.md"
  "CHANGES.md"

  # Top-level guide HTML — Galaxy-shaped, exported from Pages/Notion
  "radiantplay-guide.html"

  # Tracked HTML in public/ that ships in Vite builds
  "public/cursor-to-claude-setup.html"

  # Maintainer-only scripts
  "scripts/hooks/pre-push"
  "scripts/install-maintainer-hooks.sh"
  "scripts/status.sh"

  # The strip script and its allowlist (don't ship the export machinery)
  "scripts/public-strip.sh"
  "scripts/public-strip-allowlist.txt"
  "scripts/public-scrub-manifest.md"

  # Internal docs (active specs + roadmaps)
  "docs/spotter-roadmap.md"
  "docs/2026-05-07-spotter-answer-card.md"
  "docs/2026-05-07-spotter-viz-block-behaviour.md"
  "docs/2026-05-07-icon-sync-issues.md"

  # Internal collaboration docs (Galaxy-shaped)
  "docs/collaboration/forking-guide.md"
  "docs/collaboration/contributing-back.md"
  "docs/collaboration/cursor-to-claude-setup.md"
  "docs/collaboration/cursor-to-claude-setup.html"
  "docs/collaboration/cursor-to-claude-loom-script.md"

  # Internal cursor rules
  ".cursor/rules/product-knowledge.md"

  # Internal Claude commands and hooks
  ".claude/commands/sync-upstream.md"
  ".claude/hooks/liveboard-gate.sh"
)

for f in "${FILES_TO_OMIT[@]}"; do
  if [[ -f "$OUTPUT/$f" ]]; then
    rm -f "$OUTPUT/$f"
    echo "      ✗ $f"
  fi
done

# Glob removals — directories and patterned files
echo "      glob: notion-radiant-guidelines/ (11M of internal Notion exports)"
rm -rf "$OUTPUT/notion-radiant-guidelines"

echo "      glob: docs/archive/*"
rm -rf "$OUTPUT/docs/archive"

echo "      glob: .cursor/rules/spotter-*.md"
rm -f "$OUTPUT"/.cursor/rules/spotter-*.md

echo "      glob: .cursor/rules/liveboard-*.md"
rm -f "$OUTPUT"/.cursor/rules/liveboard-*.md

# Shape C internal tree (not present today, but be defensive for the future)
if [[ -d "$OUTPUT/internal" ]]; then
  echo "      glob: internal/"
  rm -rf "$OUTPUT/internal"
fi

echo ""

# ─── Step 3: Sentinel-marker sweep ──────────────────────────────────────────
# Omit from the snapshot any file containing the explicit sentinel comment.
# Use this for files we can't relocate (git hooks, future cursor rules, etc.)
echo "[3/8] Sweeping sentinel-headered files from snapshot..."
SENTINEL="INTERNAL: not for public release"
SENTINEL_COUNT=0
while IFS= read -r f; do
  if [[ -n "$f" ]]; then
    rm -f "$f"
    echo "      ✗ ${f#$OUTPUT/}"
    SENTINEL_COUNT=$((SENTINEL_COUNT + 1))
  fi
done < <(grep -rl --binary-files=without-match "$SENTINEL" "$OUTPUT" 2>/dev/null || true)
echo "      ✓ $SENTINEL_COUNT sentinel-headered files omitted"
echo ""

# ─── Step 4: String replacements ────────────────────────────────────────────
echo "[4/8] Applying string replacements..."

# Helper — sed in-place across files matching a glob, BSD/GNU-portable
replace_in() {
  local pattern="$1"     # find -name pattern (e.g. "*.ts")
  local find_str="$2"    # literal string to find
  local replace_str="$3" # literal string to replace
  find "$OUTPUT" -type f -name "$pattern" \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec sed -i.bak "s|$find_str|$replace_str|g" {} +
  find "$OUTPUT" -name "*.bak" -delete
}

# Single-file targeted replacement (path is relative to $OUTPUT)
replace_one() {
  local relpath="$1"
  local find_str="$2"
  local replace_str="$3"
  if [[ -f "$OUTPUT/$relpath" ]]; then
    sed -i.bak "s|$find_str|$replace_str|g" "$OUTPUT/$relpath"
    rm -f "$OUTPUT/$relpath.bak"
  fi
}

# (a) Mock emails — replace company domain in all source files
echo "      • @thoughtspot.com → @example.com (mock emails)"
replace_in "*.ts"  "@thoughtspot.com"  "@example.com"
replace_in "*.tsx" "@thoughtspot.com"  "@example.com"

# (b) Internal staging URLs
echo "      • champagne-master-aws.thoughtspotstaging.cloud → playground.example.com"
replace_in "*.tsx" "champagne-master-aws.thoughtspotstaging.cloud" "playground.example.com"

# (c) Fake SAML URLs
echo "      • identity.thoughtspot-*.okta.com → identity.example.okta.com"
replace_in "*.tsx" "identity.thoughtspot-2342342.okta.com" "identity.example.okta.com"

# (d) Designer names in user-facing mocks
echo "      • Simran Pandit → Sara Patel (mock designer names)"
replace_in "*.ts"  "Simran Pandit" "Sara Patel"
replace_in "*.tsx" "Simran Pandit" "Sara Patel"
replace_in "*.ts"  "simranpandit"  "sarapatel"
replace_in "*.tsx" "simranpandit"  "sarapatel"

echo "      • userName=\"Mohammed\" → userName=\"Alex\" (hardcoded shell name)"
replace_one "src/pages/SpotterShellPage/index.tsx"           'userName="Mohammed"' 'userName="Alex"'
replace_one "src/pages/SpotterShellPage/SpotterShellFullscreen.tsx" 'userName="Mohammed"' 'userName="Alex"'
replace_in  "*.tsx" "Welcome back, Mohammed" "Welcome back, Alex"

# (e) Royal Enfield tenant name (pending marketing confirmation; default swap)
echo "      • Royal Enfield → Acme Apparel (mock tenant)"
replace_in "*.ts"  "Royal Enfield" "Acme Apparel"
replace_in "*.tsx" "Royal Enfield" "Acme Apparel"

# (f) thoughtspot.com URL stubs
echo "      • thoughtspot.com/{usage,admin,memory} → /settings/*"
replace_in "*.tsx" "https://thoughtspot.com/usage"  "/settings/usage"
replace_in "*.tsx" "https://thoughtspot.com/admin"  "/settings/admin"
replace_in "*.tsx" "https://thoughtspot.com/memory" "/settings/memory"
replace_in "*.ts"  "https://thoughtspot.com"        "https://example.com"
replace_in "*.tsx" "https://thoughtspot.com"        "https://example.com"
replace_in "*.ts"  "https://www.thoughtspot.com"    "https://example.com"
replace_in "*.tsx" "https://www.thoughtspot.com"    "https://example.com"
replace_in "*.tsx" "docs.thoughtspot.com"           "docs.example.com"

# (g) Product label scrubs
echo "      • ThoughtSpot AI → Radiant AI (feature label)"
replace_in "*.ts"  "ThoughtSpot AI" "Radiant AI"
replace_in "*.tsx" "ThoughtSpot AI" "Radiant AI"

echo "      • Search in ThoughtSpot → Search (default placeholder)"
replace_one "src/components/GlobalHeader/GlobalHeader.tsx" "'Search in ThoughtSpot'" "'Search'"

echo "      • ThoughtSpot Design → Radiant Play (hero eyebrow)"
replace_one "src/pages/HomePage.tsx" "ThoughtSpot Design" "Radiant Play"

# Tracked HTML files in repo root (GETTING_STARTED.html, radiantplay-overview.html)
# carry "ThoughtSpot designer / Design System" framing — public-facing scrub.
echo "      • HTML pages: ThoughtSpot designer/Design System framing → Radiant Play"
replace_in "*.html" "ThoughtSpot · Radiant Design System" "Radiant Play · Radiant Design System"
replace_in "*.html" "ThoughtSpot Design System"           "Radiant Play Design System"
replace_in "*.html" "ThoughtSpot designers"               "Radiant Play designers"
replace_in "*.html" "ThoughtSpot conventions"             "Radiant Play conventions"
replace_in "*.html" "ThoughtSpot Design"                  "Radiant Play"

echo "      • creator: 'ThoughtSpot' → creator: 'Radiant Play'"
replace_in "*.ts" "creator: 'ThoughtSpot'" "creator: 'Radiant Play'"

# (h) CSS attribution rewrite — locked decision 2026-05-26
echo "      • CSS attribution: ThoughtSpot Radiant → Radiant Play (15 files)"
replace_in "*.css"        "Based on ThoughtSpot Radiant V2 design system" "Based on Radiant Play design system"
replace_in "*.css"        "Based on ThoughtSpot Radiant design system"    "Based on Radiant Play design system"
replace_in "*.module.css" "Based on ThoughtSpot Radiant V2 design system" "Based on Radiant Play design system"
replace_in "*.module.css" "Based on ThoughtSpot Radiant design system"    "Based on Radiant Play design system"

# (i) GitHub URL scrubs (mock data)
echo "      • github.com/simranpandit-thoughtspot → github.com/example-org"
replace_in "*.tsx" "https://github.com/simranpandit-thoughtspot" "https://github.com/example-org"

# TODO once decisions land:
#   - "Radiant" word policy in bad-string list (see scripts/public-strip-allowlist.txt)
#   - vercel.app policy: strip / keep radiantplay.vercel.app only
#   - ThoughtSpot Subscription Agreement, ThoughtSpot Subscription, etc. (NewUIAdmin2 long-form copy)
#   - ThoughtSpot provided (×6 in AISettingsPageContent.tsx)

echo ""

# ─── Step 5: Stamp public version ───────────────────────────────────────────
echo "[5/8] Stamping public version $PUBLIC_VERSION..."
if [[ -f "$OUTPUT/src/data/platformVersion.ts" ]]; then
  sed -i.bak "s|PLATFORM_VERSION = '[^']*'|PLATFORM_VERSION = '$PUBLIC_VERSION'|" \
    "$OUTPUT/src/data/platformVersion.ts"
  rm -f "$OUTPUT/src/data/platformVersion.ts.bak"
  echo "      ✓ src/data/platformVersion.ts → $PUBLIC_VERSION"
else
  echo "      ⚠ src/data/platformVersion.ts not found — skipping"
fi
echo ""

# ─── Step 6: Swap .public.* files into place ────────────────────────────────
echo "[6/8] Swapping .public.* files..."
PUBLIC_SWAPS=(
  "src/data/versionHistory.public.ts:src/data/versionHistory.ts"
  "src/data/highlights.public.ts:src/data/highlights.ts"
  "docs/CHANGELOG.public.md:docs/CHANGELOG.md"
)

PUBLIC_SWAP_MISSING=0
for swap in "${PUBLIC_SWAPS[@]}"; do
  src="${swap%%:*}"
  dst="${swap##*:}"
  if [[ -f "$OUTPUT/$src" ]]; then
    mv "$OUTPUT/$src" "$OUTPUT/$dst"
    echo "      ✓ $src → $dst"
  else
    echo "      ⚠ $src not found — public companion not yet seeded"
    PUBLIC_SWAP_MISSING=$((PUBLIC_SWAP_MISSING + 1))
  fi
done

if [[ "$PUBLIC_SWAP_MISSING" -gt 0 ]]; then
  echo ""
  echo "      NOTE: $PUBLIC_SWAP_MISSING public companion files missing."
  echo "            For a real publish these MUST be seeded. See plan doc step 9."
fi
echo ""

# ─── Step 7: Build verification ─────────────────────────────────────────────
if [[ "$SKIP_BUILD" == "false" ]]; then
  echo "[7/8] Building stripped tree..."
  (
    cd "$OUTPUT"
    if [[ -f package-lock.json ]]; then
      npm ci --silent
    else
      npm install --silent
    fi
    npm run build:strict
  )
  echo "      ✓ Build passed"
else
  echo "[7/8] Build verification skipped (--skip-build)"
fi
echo ""

# ─── Step 8: Final-gate grep with allowlist ─────────────────────────────────
echo "[8/8] Final-gate grep..."

# Bad-string list — fail-on-hit unless allowlisted
BAD_STRINGS=(
  "@thoughtspot.com"
  "galaxy.corp.thoughtspot.com"
  "thoughtspot.com"
  "thoughtspotstaging.cloud"
  "Royal Enfield"
  "Simran Pandit"
  "simranpandit"
  "champagne-master-aws"
  # Specific internal-framing phrases (not bare "ThoughtSpot" — that's gated
  # by the pending "Radiant policy" decision; these phrases are leak-shaped
  # under any reasonable policy)
  "ThoughtSpot designers"
  "ThoughtSpot Design System"
  "ThoughtSpot Design "
  "ThoughtSpot conventions"
)

# Read allowlist into an array
declare -a ALLOW_PATTERNS=()
if [[ -f "$ALLOWLIST" ]]; then
  while IFS= read -r line; do
    # Skip blanks and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    ALLOW_PATTERNS+=("$line")
  done < "$ALLOWLIST"
else
  echo "      ⚠ $ALLOWLIST not found — running without exceptions"
fi

# Check each bad string. For each hit, check against allowlist.
TOTAL_HITS=0
TOTAL_ALLOWED=0
TOTAL_BAD=0
declare -a UNALLOWED_HITS=()

for bad in "${BAD_STRINGS[@]}"; do
  while IFS=: read -r hit_file _; do
    [[ -z "$hit_file" ]] && continue
    rel="${hit_file#$OUTPUT/}"
    TOTAL_HITS=$((TOTAL_HITS + 1))

    # Allowlist match: path-glob:pattern format
    allowed=false
    for ap in "${ALLOW_PATTERNS[@]}"; do
      glob="${ap%%:*}"
      pat="${ap##*:}"
      # Match if path glob matches AND pattern is the bad string we hit
      # Support ** as any-path-segment by translating to glob match
      if [[ "$bad" == "$pat" ]] && [[ "$rel" == $glob || "$rel" == ${glob//\*\*/*} ]]; then
        allowed=true
        break
      fi
    done

    if $allowed; then
      TOTAL_ALLOWED=$((TOTAL_ALLOWED + 1))
    else
      TOTAL_BAD=$((TOTAL_BAD + 1))
      UNALLOWED_HITS+=("$bad → $rel")
    fi
  done < <(grep -rln --text --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist -F "$bad" "$OUTPUT" 2>/dev/null || true)
done

echo "      total hits:      $TOTAL_HITS"
echo "      allowlisted:     $TOTAL_ALLOWED"
echo "      unallowed:       $TOTAL_BAD"

if [[ "$TOTAL_BAD" -gt 0 ]]; then
  echo ""
  echo "──────────────────────────────────────────────────────────────"
  echo " FAIL — unallowed bad-string hits"
  echo "──────────────────────────────────────────────────────────────"
  for h in "${UNALLOWED_HITS[@]}"; do
    echo "  $h"
  done
  echo ""
  echo "Resolve by either:"
  echo "  (a) Adding a string-replacement to step 4 of $0"
  echo "  (b) Adding a path:pattern entry to $ALLOWLIST"
  echo ""
fi

# ─── Strip report ───────────────────────────────────────────────────────────
REPORT="$OUTPUT/.public-strip-report.md"
{
  echo "# Public-strip report"
  echo ""
  echo "- Source:         $REPO_ROOT"
  echo "- Source SHA:     $(git -C "$REPO_ROOT" rev-parse HEAD)"
  echo "- Public version: $PUBLIC_VERSION"
  echo "- Generated:      $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo ""
  echo "## Counts"
  echo ""
  echo "- Files in output:       $(find "$OUTPUT" -type f -not -name '.public-strip-report.md' | wc -l | tr -d ' ')"
  echo "- Sentinel files omitted:  $SENTINEL_COUNT"
  echo "- Bad-string hits:        $TOTAL_HITS"
  echo "- Allowlisted:            $TOTAL_ALLOWED"
  echo "- Unallowed (FAIL if >0): $TOTAL_BAD"
  echo "- Public companion misses: $PUBLIC_SWAP_MISSING"
  echo ""
  echo "## Verification checklist"
  echo ""
  echo "- [ ] CLAUDE.internal.md absent: $([[ -f "$OUTPUT/CLAUDE.internal.md" ]] && echo "✗ STILL PRESENT" || echo "✓")"
  echo "- [ ] scripts/public-strip.sh absent: $([[ -f "$OUTPUT/scripts/public-strip.sh" ]] && echo "✗ STILL PRESENT" || echo "✓")"
  echo "- [ ] .public.ts/.public.md absent: $(find "$OUTPUT" -name '*.public.ts' -o -name '*.public.md' | head -1 | grep -q . && echo "✗ STILL PRESENT" || echo "✓")"
  echo "- [ ] internal/ absent: $([[ -d "$OUTPUT/internal" ]] && echo "✗ STILL PRESENT" || echo "✓")"
  echo "- [ ] platformVersion stamped: $(grep -o "PLATFORM_VERSION = '[^']*'" "$OUTPUT/src/data/platformVersion.ts" 2>/dev/null || echo "✗ FILE MISSING")"
  echo "- [ ] README reads as public doc: (manual)"
  echo ""
  if [[ "$TOTAL_BAD" -gt 0 ]]; then
    echo "## Unallowed hits"
    echo ""
    for h in "${UNALLOWED_HITS[@]}"; do
      echo "- $h"
    done
  fi
} > "$REPORT"

echo ""
echo "──────────────────────────────────────────────────────────────"
if [[ "$TOTAL_BAD" -gt 0 ]]; then
  echo " STRIP FAILED — see $REPORT and unallowed hits above"
  echo "──────────────────────────────────────────────────────────────"
  exit 2
fi
echo " STRIP COMPLETE — clean snapshot at $OUTPUT"
echo " Report:        $REPORT"
echo " Next:          inspect $OUTPUT, then trigger publish workflow"
echo "──────────────────────────────────────────────────────────────"
