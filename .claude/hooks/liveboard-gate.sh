#!/bin/bash
# Liveboard Requirements Gate Hook
#
# Detects when a user asks to create a new Liveboard/dashboard prototype
# and injects a system reminder for Claude to gather requirements first.
#
# Runs on UserPromptSubmit. Exits immediately (~5ms) for non-matching prompts.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/"prompt"[[:space:]]*:[[:space:]]*"//;s/"$//')

# Match: (create|build|new|scaffold|make) + (liveboard|dashboard)
if echo "$PROMPT" | grep -qiE '(create|build|new|scaffold|make|start).{0,30}(liveboard|dashboard)'; then
  cat <<'EOF'
LIVEBOARD REQUIREMENTS GATE: This looks like a new Liveboard/dashboard prototype request. Before loading canvas context or writing code, ask the user:

1. Mode — View-only (static dashboard) or edit mode (drag/resize)?
2. Interactions — Drag, resize, groups, inline editing, multi-select, SpotterViz?
3. Tile types — KPI, charts, notes, groups?
4. Data — Mock data or specific dataset?

Load only the canvas tiers that match their answers:
- View-only → liveboard-canvas-core.md only
- Edit mode → canvas-core + canvas-edit
- Full (groups/multi-select) → all 3 canvas tiers

Always also load liveboard-ia.md + liveboard-scaffolding.md.
EOF
  exit 0
fi

exit 0
