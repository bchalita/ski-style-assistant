# MBAn_Underdogs

Full-stack starter with **frontend/backend separated**:

- `frontend/`: Next.js (default `create-next-app` scaffold)
- `backend/`: Node/Express API (TypeScript)

## How to run (local)

Setup + install:

```bash
chmod +x ./scripts/dev_setup.sh
./scripts/dev_setup.sh
```

Start backend (port 4000 by default):

```bash
cd backend
npm run dev
```

Start frontend (port 3000 by default):

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Lovable mirror workflow

- Repo A (this repo) is the source of truth. `origin` always points here.
- Run `scripts/publish_to_lovable.sh` whenever you want Lovable to see the latest code.
- If you made edits in Lovable (Repo B), run `scripts/pull_from_lovable.sh` to bring changes back.
