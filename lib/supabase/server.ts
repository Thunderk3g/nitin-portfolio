import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { serverRealtimeOptions } from "./no-realtime";
import {
  readVerifiedUser,
  VERIFIED_SIG_HEADER,
  VERIFIED_USER_HEADER,
} from "./verified-header";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Supabase client for Server Components / Route Handlers / Server Actions. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, {
    realtime: serverRealtimeOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookie writes are handled by middleware.
        }
      },
    },
  });
}

/**
 * Returns the authenticated user, or null.
 * Deduplicated per-request via React.cache() AND reuses the HMAC-verified
 * user forwarded by middleware so Server Components & Server Actions do not
 * make a second/third HTTPS round-trip to Supabase Auth.
 */
export const getSessionUser = cache(async () => {
  try {
    const hdrs = await headers();
    const verified = await readVerifiedUser(
      hdrs.get(VERIFIED_USER_HEADER),
      hdrs.get(VERIFIED_SIG_HEADER),
      125_000,
    );
    if (verified) return verified;
  } catch {
    // Fall back to direct Supabase Auth check if headers() is unavailable.
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Returns the user only if they are authenticated AND on the admin allowlist.
 * Use this (not getSessionUser) to gate every privileged admin action.
 */
export async function getAdminUser() {
  const user = await getSessionUser();
  return user && isAdminEmail(user.email) ? user : null;
}
