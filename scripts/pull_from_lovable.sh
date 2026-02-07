#!/usr/bin/env bash
set -euo pipefail

BRANCH="${BRANCH:-main}"

echo "Pulling from lovable/$BRANCH into local $BRANCH."
git rev-parse --git-dir >/dev/null

if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Local branch '$BRANCH' not found."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree has uncommitted changes. Commit or stash before merging."
  exit 1
fi

echo "Fetching lovable/$BRANCH..."
git fetch lovable "$BRANCH"

echo "Checking out $BRANCH..."
git checkout "$BRANCH"

echo "Merging lovable/$BRANCH into $BRANCH..."
git merge --no-ff --no-edit "lovable/$BRANCH"
echo "Done."
