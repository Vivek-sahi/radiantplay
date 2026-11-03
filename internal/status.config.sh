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

# ── App base URL ─────────────────────────────────────────────────────────
# Prototype cards on the Content tab link to /playground/<id> on the dev
# server. The canvas is often opened as a file, where a root-relative path
# resolves against the filesystem, so the base is absolute. vite.config.ts
# pins this port with strictPort, so it does not drift.
STATUS_APP_BASE="http://localhost:4310"

# ── Content groups ───────────────────────────────────────────────────────
# The Content tab groups by project, so a project's prototype, its pages and
# its plan docs sit together under one heading.
#
# Format: "Group name|substring substring substring"
# Each substring is matched against the item's path or registry id, case
# insensitively. First group that matches wins, so declare narrow groups before
# broad ones. Anything unmatched lands under "Unfiled" at the bottom, which is
# untidy rather than invisible, and is the cue to add a pattern here.
#
# Groups render in the order below.
STATUS_GROUPS=(
  "Apps in ThoughtSpot|appsinthoughtspot appsints appsints_ apps-in-ts apps-spotter spot-agentspot dataapps data-apps"
  "Spotter|spottermemory spottercomponents minispotters spotter-roadmap spotter-answer spotter-viz spotter-chat spotter-ds spotter-prototype spotter-refresh"
  "Liveboard|liveboard-template stylingpanel salesperformance"
  "Data model|datamodeleditor datamodel"
  "Admin|admingroups adminlang newuiadmin"
  "Design system|design-system designsystem component-api component-patterns component-parity segmentedcontrol icon-sync ux-writing content-guidelines"
  "Talks and decks|talk socialpost moodboard"
  "Guides and onboarding|guide how-it-works landing overview collaboration cursor-to-claude prototyping-guide workflow-explorations forking contributing branching"
  "Deploy and ops|coolify muze-charts"
)

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
  "main|Coolify|https://radiantplay.design.coolify.thoughtspot.com"
  "staging|Coolify|https://radiantplay-staging.design.coolify.thoughtspot.com"
  "faris|Coolify|https://radiantplay-faris.design.coolify.thoughtspot.com"
)

# Seconds to wait for each site before calling it unreachable. All rows are
# checked at once, so this is roughly the worst-case cost of the whole tab.
STATUS_SITE_TIMEOUT=6

# Hosts treated as internal, for the VPN hint on an unreachable row.
STATUS_INTERNAL_HOST_MATCH="coolify.thoughtspot.com"
