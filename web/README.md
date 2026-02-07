# Next.js + Supabase starter (Auth + Protected route)

This is a minimal full-stack app using:

- **Frontend**: Next.js (App Router)
- **Backend**: Next.js Server Actions + Proxy (Next.js 16)
- **Database/Auth/Storage**: Supabase
- **Deploy**: Vercel

It currently supports:

- Email/password **sign in**
- **Sign out**
- A **protected route** at `/protected` guarded by proxy + server-side checks

## Dependencies (versions)

Top-level packages currently installed (run `npm ls --depth=0` to verify):

- **next**: `16.1.6`
- **react**: `19.2.3`
- **react-dom**: `19.2.3`
- **@supabase/supabase-js**: `2.95.3`
- **@supabase/ssr**: `0.8.0`
- **typescript**: `5.9.3`
- **tailwindcss**: `4.1.18`
- **@tailwindcss/postcss**: `4.1.18`
- **eslint**: `9.39.2`
- **eslint-config-next**: `16.1.6`

Notes:

- `package.json` uses ranges for some devDependencies (e.g. `^4`, `^5`). The **exact** versions are pinned by `package-lock.json`.
- If you see “extraneous” packages in `npm ls`, it usually means something in your lockfile/install state is out of sync. Prefer `npm ci` for clean installs.

## Local dev

### 1) Create a Supabase project

In the Supabase dashboard:

- Create a new project
- Go to **Project Settings → API**
- Copy:
  - **Project URL**
  - **anon public** API key

### 2) Configure environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3) Install dependencies

From the `web/` directory:

```bash
npm ci
```

If you don’t have a lockfile yet (or you intentionally want to update deps), use:

```bash
npm install
```

Alternatively, from the repo root you can run:

```bash
./scripts/dev_setup.sh
```

### 3) Run the app

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Useful scripts

```bash
npm run lint
npm run build
npm run start
```

## Adding libraries

From the `web/` directory:

```bash
npm install <package>
```

For dev-only tools:

```bash
npm install -D <package>
```

## Vercel deployment

1. Import the repo into Vercel.
2. Set the **Root Directory** to `web`.
3. Add the same env vars in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Project structure (high level)

- `src/app/login`: login + signup UI + server actions
- `src/app/protected`: protected page
- `src/proxy.ts`: session refresh + route protection
- `src/utils/supabase/*`: Supabase client/server helpers
