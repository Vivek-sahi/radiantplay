#!/bin/bash
# release.sh — Radiant Play release helper
#
# Run this before pushing to main. It:
#   1. Shows commits since last release
#   2. Suggests a CalVer version
#   3. Updates platformVersion.ts
#   4. Appends to docs/CHANGELOG.md
#   5. Prints paste-ready drafts for versionHistory.ts + ChangelogPage.tsx
#   6. Stages changed files ready for commit
#
# Usage: bash scripts/release.sh

set -euo pipefail

PLATFORM_FILE="src/data/platformVersion.ts"
CHANGELOG_MD="docs/CHANGELOG.md"

# ── 1. Determine previous version ────────────────────────────────────────────
CURRENT=$(grep "PLATFORM_VERSION" "$PLATFORM_FILE" | grep -o "'[^']*'" | tr -d "'")
echo ""
echo "Current version: $CURRENT"

# ── 2. Suggest next CalVer version ───────────────────────────────────────────
YEAR=$(date +%y)
MONTH=$(date +%-m)
WEEK=$(( ($(date +%-d) - 1) / 7 + 1 ))
SUGGESTED="${YEAR}.${MONTH}.${WEEK}a"
TODAY=$(date +%Y-%m-%d)

echo "Suggested next:  $SUGGESTED  (today: $TODAY)"
echo ""
read -rp "Version to release [press Enter for $SUGGESTED]: " INPUT_VERSION
VERSION="${INPUT_VERSION:-$SUGGESTED}"

# ── 3. Show git log since last change to platformVersion.ts ──────────────────
SINCE_COMMIT=$(git log --follow --format="%H" -- "$PLATFORM_FILE" | head -2 | tail -1)
echo ""
echo "─────────────────────────────────────────────────────"
echo "Commits since last release ($CURRENT):"
echo "─────────────────────────────────────────────────────"
if [ -n "$SINCE_COMMIT" ]; then
  git log --oneline "$SINCE_COMMIT"..HEAD
else
  git log --oneline -20
fi
echo "─────────────────────────────────────────────────────"
echo ""

# ── 4. Update platformVersion.ts ─────────────────────────────────────────────
sed -i.bak "s/PLATFORM_VERSION = '[^']*'/PLATFORM_VERSION = '$VERSION'/" "$PLATFORM_FILE"
rm -f "${PLATFORM_FILE}.bak"
echo "✓ Updated $PLATFORM_FILE → $VERSION"

# ── 5. Append to docs/CHANGELOG.md ───────────────────────────────────────────
COMMIT_LIST=$(git log --format="- %s" "${SINCE_COMMIT:+$SINCE_COMMIT..HEAD}" 2>/dev/null | head -20 || git log --oneline -10 --format="- %s")

CHANGELOG_ENTRY="
## $VERSION — $TODAY

$COMMIT_LIST
"

# Prepend after the first line (title) of CHANGELOG.md
if [ -f "$CHANGELOG_MD" ]; then
  FIRST_LINE=$(head -1 "$CHANGELOG_MD")
  REST=$(tail -n +2 "$CHANGELOG_MD")
  echo -e "$FIRST_LINE\n$CHANGELOG_ENTRY\n$REST" > "$CHANGELOG_MD"
  echo "✓ Prepended entry to $CHANGELOG_MD"
else
  echo "# Changelog$CHANGELOG_ENTRY" > "$CHANGELOG_MD"
  echo "✓ Created $CHANGELOG_MD"
fi

# ── 6. Stage files ────────────────────────────────────────────────────────────
git add "$PLATFORM_FILE" "$CHANGELOG_MD"
echo "✓ Staged $PLATFORM_FILE + $CHANGELOG_MD"

# ── 7. Print paste-ready drafts for the two manual files ─────────────────────
echo ""
echo "═════════════════════════════════════════════════════"
echo "MANUAL STEP — paste into src/data/versionHistory.ts"
echo "(add at the top of the versionHistory array)"
echo "═════════════════════════════════════════════════════"
echo "  {"
echo "    version: '$VERSION',"
echo "    date: '$TODAY',"
echo "    type: 'minor', // change to major/patch/figma-sync as needed"
echo "    changes: ["
echo "      // Add your change entries here, e.g.:"
git log --format="      // { type: 'added', component: '%s' }," "${SINCE_COMMIT:+$SINCE_COMMIT..HEAD}" 2>/dev/null | head -10
echo "    ],"
echo "  },"
echo ""
echo "═════════════════════════════════════════════════════"
echo "MANUAL STEP — paste into src/pages/ChangelogPage.tsx"
echo "(add at the top of the CHANGELOG array)"
echo "═════════════════════════════════════════════════════"
echo "  {"
echo "    version: '$VERSION',"
echo "    date: '$TODAY',"
echo "    title: 'Release $VERSION',"
echo "    changes: ["
echo "      // { category: 'added', description: '...' },"
echo "    ],"
echo "  },"
echo ""
echo "─────────────────────────────────────────────────────"
echo "When ready:"
echo "  git commit -m \"chore: release $VERSION\""
echo "  git push origin main"
echo "  git push galaxy main"
echo "─────────────────────────────────────────────────────"
