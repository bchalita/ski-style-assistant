import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Protected</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              You are signed in as <span className="font-medium">{user.email}</span>.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
          >
            Home
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            This route is guarded by proxy + server-side checks.
          </p>

          <form action={signOut} className="mt-6">
            <button className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white">
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

