import Link from "next/link";

import { signOut } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Underdogs</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Minimal Next.js + Supabase starter: sign in, sign out, and a protected
            route.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {user ? (
            <div className="grid gap-4">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/protected"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white"
                >
                  Go to protected page
                </Link>

                <form action={signOut}>
                  <button className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                You’re not signed in.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/protected"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                >
                  Try protected route
                </Link>
              </div>
              <p className="text-xs text-zinc-500">
                (You’ll be redirected to <span className="font-medium">/login</span>
                .)
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
