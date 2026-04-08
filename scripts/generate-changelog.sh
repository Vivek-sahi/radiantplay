#!/bin/bash
# generate-changelog.sh — Generate a CalVer changelog entry from git log
#
# Usage:
#   bash scripts/generate-changelog.sh              # since last tag
#   bash scripts/generate-changelog.sh 2026-03-31   # since specific date
#
# Versioning: YY.M.Ws — Year.Month.Week + sub-release letter
# Example: 26.4.1b = 2026, April, week 1, second release that week
#
# Output: Markdown changelog entry printed to stdout.
# Copy-paste into docs/CHANGELOG.md and src/pages/ChangelogPage.tsx.

set -euo pipefail

SINCE="${1:-$(git log --tags --simplify-by-decoration --pretty="format:%ad" --date=short -1 2>/dev/null || echo "2026-01-01")}"
TODAY=$(date +%Y-%m-%d)
YEAR=$(date +%y)
MONTH=$(date +%-m)
# Week of month: day / 7 + 1
WEEK=$(( ($(date +%-d) - 1) / 7 + 1 ))

echo "## Commits since $SINCE"
echo ""
echo "Suggested version: ${YEAR}.${MONTH}.${WEEK}a"
echo "Date: $TODAY"
echo ""
echo "---"
echo ""

# Group commits by conventional commit prefix
echo "### Added (feat:)"
git log --oneline --since="$SINCE" --format="- %s (%h, %ad)" --date=short --grep="^feat" --extended-regexp | head -20
echo ""

echo "### Fixed (fix:)"
git log --oneline --since="$SINCE" --format="- %s (%h, %ad)" --date=short --grep="^fix" --extended-regexp | head -20
echo ""

echo "### Changed (refactor: / chore:)"
git log --oneline --since="$SINCE" --format="- %s (%h, %ad)" --date=short --grep="^refactor\|^chore" --extended-regexp | head -20
echo ""

echo "### Docs (docs:)"
git log --oneline --since="$SINCE" --format="- %s (%h, %ad)" --date=short --grep="^docs" --extended-regexp | head -20
echo ""

echo "---"
echo ""
echo "### All commits (chronological)"
git log --oneline --since="$SINCE" --format="- [%h] %ad %s" --date=short | head -40
echo ""

echo "---"
echo "Total commits since $SINCE: $(git log --oneline --since="$SINCE" | wc -l | tr -d ' ')"
echo ""
echo "To use: copy the relevant items into docs/CHANGELOG.md under a new"
echo "version header, then add a matching entry to the CHANGELOG array in"
echo "src/pages/ChangelogPage.tsx"
