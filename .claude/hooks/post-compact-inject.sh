#!/bin/bash
# Post-Compact Convention Recovery Hook
#
# Injects the 5 critical Radiant conventions as a system reminder on every
# UserPromptSubmit. Cost: ~200 tokens per message. Ensures conventions
# survive compaction without requiring explicit re-reading of CLAUDE.md.
#
# Runs on UserPromptSubmit alongside liveboard-gate.sh.

cat <<'EOF'
RADIANT CONVENTIONS (always apply):
1. TOKENS ONLY — import colors/spacing/fonts from @tokens/. No hardcoded hex, rgb(), or magic px values.
2. RADIANT COMPONENTS — use Button not <button>, TextInput not <input>, Table not <table>, Select not <select>.
3. LAYOUT PRIMITIVES — Horizontal/Vertical/View not inline flex. Grid/RdGrid not inline grid. AppShell for full pages.
4. LOCAL COMPONENTS — prototype-specific in src/prototypes/<Name>/components/, never in src/components/.
5. SENTENCE CASE — all UI text. Imperative verbs for buttons (Create, Add, Delete, Save, Cancel).
EOF
exit 0
