#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"

echo "Setting up dev environment..."

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed. Install Node.js (LTS) and re-run."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js (LTS) and re-run."
  exit 1
fi

if [ ! -d "$WEB_DIR" ]; then
  echo "Error: expected Next.js app at $WEB_DIR"
  exit 1
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

echo
echo "Installing web dependencies..."
cd "$WEB_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if [ ! -f .env.local ] && [ -f .env.example ]; then
  echo
  echo "Creating web/.env.local from web/.env.example..."
  cp .env.example .env.local
  echo "Note: fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
fi

echo
echo "Done."
echo
echo "Next:"
echo "  cd web"
echo "  npm run dev"

