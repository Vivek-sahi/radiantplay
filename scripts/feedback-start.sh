#!/usr/bin/env bash
# Starts Vite dev server + feedback annotation server together.
# Usage: npm run feedback
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

# Ensure inbox file exists
mkdir -p "$ROOT/feedback"
touch "$ROOT/feedback/inbox.jsonl"

cleanup() {
  echo ""
  echo "[feedback] Stopping..."
  kill "$VITE_PID" "$FEEDBACK_PID" 2>/dev/null
  wait "$VITE_PID" "$FEEDBACK_PID" 2>/dev/null
}
trap cleanup INT TERM

# Copy collaboration doc (same as dev script)
cp "$ROOT/docs/collaboration/cursor-to-claude-setup.html" "$ROOT/public/cursor-to-claude-setup.html" 2>/dev/null || true

# Start feedback server
python3 "$ROOT/feedback/server.py" &
FEEDBACK_PID=$!

# Start Vite
cd "$ROOT" && npx vite &
VITE_PID=$!

echo "[feedback] Annotation server → http://localhost:3737"
echo "[feedback] Vite dev server  → http://localhost:5173"
echo "[feedback] Press Ctrl+C to stop both."

wait
