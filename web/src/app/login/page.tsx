import Link from "next/link";

import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { message, next } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Use your Supabase Auth email + password.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
            >
              Home
            </Link>
          </div>

          {message ? (
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {message}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            <form action={signIn} className="grid gap-3">
              <input type="hidden" name="next" value={next ?? ""} />

              <label className="grid gap-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-zinc-50/10"
                  placeholder="you@company.com"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-zinc-50/10"
                  placeholder="••••••••"
                />
              </label>

              <button className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white">
                Sign in
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-xs text-zinc-500">or</span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <form action={signUp} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-zinc-50/10"
                  placeholder="you@company.com"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-zinc-50/10"
                  placeholder="Create a password"
                />
              </label>

              <button className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900">
                Create account
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Protected content lives at{" "}
          <Link href="/protected" className="underline underline-offset-2">
            /protected
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

