# Settings for internal/scripts/status.sh, the local project canvas.
#
# This is a sourced shell file rather than JSON on purpose: status.sh is pure
# shell plus git plus gh, and keeping the config in the same language means no
# parser and no extra dependency. Edit the values, re-run the script.
#
# A fork that has no copy of this file still works. Every value below falls back
# to the same default inside status.sh.

# ── Identity ─────────────────────────────────────────────────────────────
# The heading is drawn as STATUS_TITLE + STATUS_TITLE_EM, with the second half
# in the accent colour.
STATUS_TITLE="Radiant"
STATUS_TITLE_EM="Play"
STATUS_TAB_TITLE="Radiant Play canvas"

# The git host used for fork and upstream lookups through gh.
STATUS_HOST="galaxy.corp.thoughtspot.com"

# ── Look ─────────────────────────────────────────────────────────────────
# "studio" the house look for this page: rounded surfaces, sans labels, indigo
#          accent, soft peach wash. Borrowed from the agentspot Data Apps canvas.
# "ascii"  Modern ASCII: flat squares, mono labels, warm amber accent. The repo
#          canon for decks and microsites, kept here as the alternative.
# The toggle in the page header remembers a reader's own choice per browser.
# Changing the value here re-applies to every browser once, then their toggle
# wins again.
STATUS_LOOK="studio"

# ── Branches ─────────────────────────────────────────────────────────────
# Refs every branch is measured against, in the order the columns appear.
# A ref that does not exist locally renders as an em dash rather than failing.
STATUS_BASELINES=(main staging)

# One line per branch, shown when you hover its name in the Branches table.
# Format: "branch|what it is for"
STATUS_BRANCH_PURPOSE=(
  "main|Production. Shared library and samples, what other designers sync from"
  "staging|Shared preview and QA. The default deploy target"
  "faris|Maintainer working branch. Personal prototypes in registry-mine.ts, decks"
)

# ── Sites ────────────────────────────────────────────────────────────────
# Rows of the Sites tab. Format: "branch|platform|url"
# A URL on an internal host is only reachable on Twingate VPN, and reads as
# unreachable off it. That is the network, not a broken deploy.
STATUS_DEPLOYS=(
  "main|Vercel|https://radiantplay.vercel.app"
  "main|Coolify|https://radiantplay.design.coolify.thoughtspot.com"
  "staging|Vercel|https://staging-radiantplay.vercel.app"
  "staging|Coolify|https://radiantplay-staging.design.coolify.thoughtspot.com"
  "faris|Coolify|https://radiantplay-faris.design.coolify.thoughtspot.com"
)

# Seconds to wait for each site before calling it unreachable. All rows are
# checked at once, so this is roughly the worst-case cost of the whole tab.
STATUS_SITE_TIMEOUT=6

# Hosts treated as internal, for the VPN hint on an unreachable row.
STATUS_INTERNAL_HOST_MATCH="coolify.thoughtspot.com"
