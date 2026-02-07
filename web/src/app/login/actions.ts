"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signIn(formData: FormData) {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");
  const nextPathRaw = getString(formData, "next") || "/protected";
  const nextPath = nextPathRaw.startsWith("/") ? nextPathRaw : "/protected";

  if (!email || !password) {
    redirect("/login?message=Missing%20email%20or%20password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect(nextPath);
}

export async function signUp(formData: FormData) {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?message=Missing%20email%20or%20password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}

