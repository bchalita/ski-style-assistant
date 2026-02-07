# Next.js + Supabase starter (Auth + Protected route)

This is a minimal full-stack app using:

- **Frontend**: Next.js (App Router)
- **Backend**: Next.js Server Actions + Middleware
- **Database/Auth/Storage**: Supabase
- **Deploy**: Vercel

It currently supports:

- Email/password **sign in**
- **Sign out**
- A **protected route** at `/protected` guarded by middleware + server-side checks

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

### 3) Run the app

```bash
npm run dev
```

Then open `http://localhost:3000`.

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
