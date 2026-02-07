#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

echo "Setting up dev environment..."

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed. Install Node.js (LTS) and re-run."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js (LTS) and re-run."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: expected Next.js app at $FRONTEND_DIR"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: expected backend app at $BACKEND_DIR"
  exit 1
fi

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

echo
echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo
echo "Installing backend dependencies..."
cd "$BACKEND_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  echo
  echo "Creating backend/.env from backend/.env.example..."
  cp .env.example .env
fi

echo
echo "Done."
echo
echo "Next:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"

