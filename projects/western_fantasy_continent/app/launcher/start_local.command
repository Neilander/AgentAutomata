#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
PORT="${PORT:-3778}"
URL="http://localhost:${PORT}/workbench/"

if command -v node >/dev/null 2>&1; then
  NODE_EXE="$(command -v node)"
else
  echo "Node.js was not found. Install Node.js first, then run this launcher again."
  exit 1
fi

if command -v lsof >/dev/null 2>&1; then
  while IFS= read -r pid; do
    if [[ -n "$pid" ]]; then
      kill "$pid" 2>/dev/null || true
    fi
  done < <(lsof -ti "tcp:${PORT}" || true)
fi

cd "$REPO_ROOT"
if [[ "${OPEN_BROWSER:-1}" != "0" ]]; then
  (sleep 1 && open "$URL") &
fi

echo "Western Fantasy Continent local server: $URL"
echo "Press Ctrl+C in this window to stop the server."

PORT="$PORT" exec "$NODE_EXE" "projects/western_fantasy_continent/app/server/server.js"
