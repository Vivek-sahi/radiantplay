#!/bin/bash
# Requirements Gate Hook (Liveboard, Data Model Editor, Spotter)
#
# Detects when a user asks to create a new Liveboard/dashboard, Data Model Editor
# or Spotter prototype and injects a system reminder for Claude to gather
# requirements first. The Liveboard gate is inlined; the other two point at their
# gate in .cursor/rules/_orchestration.md.
#
# Runs on UserPromptSubmit. Exits immediately (~5ms) for non-matching prompts.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | grep -o '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/"prompt"[[:space:]]*:[[:space:]]*"//;s/"$//')

# Match: (create|build|new|scaffold|make) + (liveboard|dashboard)
if echo "$PROMPT" | grep -qiE '(create|build|new|scaffold|make|start).{0,30}(liveboard|dashboard)'; then
  cat <<'EOT'
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
EOT
  exit 0
fi

# Match: (create|build|new|...) + data model editor / DME
if echo "$PROMPT" | grep -qiE '(create|build|new|scaffold|make|start).{0,30}(data[ -]?model[ -]?editor|\bdme\b)'; then
  echo "DATA MODEL EDITOR REQUIREMENTS GATE: This looks like a new Data Model Editor prototype. Before loading DME rules or writing code, read the Data Model Editor Requirements Gate in .cursor/rules/_orchestration.md and ask its questions (starting state, SpotterModel AI, dataset)."
  exit 0
fi

# Match: (create|build|new|...) + spotter
if echo "$PROMPT" | grep -qiE '(create|build|new|scaffold|make|start).{0,30}spotter'; then
  echo "SPOTTER REQUIREMENTS GATE: This looks like a new Spotter prototype. Before loading Spotter rules or writing code, read the Spotter Requirements Gate in .cursor/rules/_orchestration.md and ask its questions (mode, welcome state, data)."
  exit 0
fi

exit 0
