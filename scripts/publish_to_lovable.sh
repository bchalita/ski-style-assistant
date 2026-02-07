#!/usr/bin/env bash
set -euo pipefail

BRANCH="${BRANCH:-main}"

echo "Publishing $BRANCH to lovable (force-sync)."
git rev-parse --git-dir >/dev/null

if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Local branch '$BRANCH' not found."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Warning: working tree has uncommitted changes."
fi

echo "Force pushing $BRANCH to lovable/$BRANCH..."
git push lovable "$BRANCH:$BRANCH" --force
echo "Done."
