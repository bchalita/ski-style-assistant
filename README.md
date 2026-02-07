# MBAn_Underdogs

Simple full-stack web app (Next.js + Supabase Auth) lives in `web/`.

## How to run (local)

1. Create a Supabase project and enable **Email/Password** auth.
2. In Supabase **Project Settings → API**, copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Setup + install:

```bash
chmod +x ./scripts/dev_setup.sh
./scripts/dev_setup.sh
```

4. Put your Supabase values into `web/.env.local`, then start:

```bash
cd web
npm run dev
```

Open `http://localhost:3000`.

More details: `web/README.md`.

## Lovable mirror workflow

- Repo A (this repo) is the source of truth. `origin` always points here.
- Run `scripts/publish_to_lovable.sh` whenever you want Lovable to see the latest code.
- If you made edits in Lovable (Repo B), run `scripts/pull_from_lovable.sh` to bring changes back.
