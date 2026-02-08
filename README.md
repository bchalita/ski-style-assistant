# Ski Style Assistant

Local-first ski outfit shopping assistant. This repo currently contains:

- **Frontend (the app you should run)**: a Vite + React UI in `src/` (runs fully locally by default).
- **Optional backend**: an Express + TypeScript API in `backend/` (uses OpenAI when configured).
- **Legacy/unused**: a `frontend/` Next.js project (not the correct frontend for this repo right now).

## Prerequisites

- Node.js (recommended: **20+**)
- npm (or pnpm/yarn/bun if you prefer)

## Run the app locally (recommended)

From the repo root:

```bash
npm install
npm run dev
```

Then open `http://localhost:8080`.

Note: the `frontend/` folder is **not** the app served on 8080.

## Optional: run the backend API (Express)

The backend is not required for the root app’s current “local pipeline”, but you can run it for the API endpoints (and OpenAI-powered request/ranking when configured).

```bash
cd backend
npm install
```

Create `backend/.env`:

```bash
OPENAI_API_KEY=your_key_here

# Optional
PORT=4000
REQUEST_AGENT_MODEL=gpt-4o-mini
```

Run the dev server:

```bash
npm run dev
```

Backend will start on `http://localhost:4000` (see `GET /health`).

For backend module/contract documentation, see `backend/src/README.md`.

## Production build (root app)

```bash
npm run build
npm run preview
```

## Troubleshooting

- **Port already in use**:
  - Root Vite app defaults to **8080** (configured in `vite.config.ts`).
  - Backend defaults to **4000** (set `PORT` in `backend/.env`).
- **Backend fails with missing OpenAI key**:
  - Ensure `OPENAI_API_KEY` is set in `backend/.env`.

