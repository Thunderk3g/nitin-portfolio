import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { serverRealtimeOptions } from "./no-realtime";

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

/** Returns the authenticated user, or null. */
export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the user only if they are authenticated AND on the admin allowlist.
 * Use this (not getSessionUser) to gate every privileged admin action.
 */
export async function getAdminUser() {
  const user = await getSessionUser();
  return user && isAdminEmail(user.email) ? user : null;
}
