"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components (login form, sign-out, media uploads). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
