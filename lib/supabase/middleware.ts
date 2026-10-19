import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { missingAdminEnv } from "./env";
import { serverRealtimeOptions } from "./no-realtime";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function redirectTo(request: NextRequest, pathname: string, from?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (from) url.searchParams.set("redirect", from);
  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase auth session cookie on every request and guards the
 * admin area: unauthenticated requests to /admin/* (except the login page) are
 * redirected to /admin/login.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";

  // A deployment without the Supabase settings can't authenticate anyone. Send
  // everything to the login page, which lists what is missing, instead of
  // throwing (Vercel would answer MIDDLEWARE_INVOCATION_FAILED on every route).
  if (missingAdminEnv().length) {
    return isAdminPath && !isLogin
      ? redirectTo(request, "/admin/login", pathname)
      : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  let user: User | null = null;

  try {
    const supabase = createServerClient(URL, KEY, {
      realtime: serverRealtimeOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    // Fail closed: treat an auth outage as signed out rather than erroring.
    console.error("[middleware] Supabase session check failed:", err);
  }

  // Authenticated is NOT enough — the user must be on the admin allowlist.
  const admin = isAdminEmail(user?.email);

  if (isAdminPath && !isLogin && !admin) return redirectTo(request, "/admin/login", pathname);
  if (isLogin && admin) return redirectTo(request, "/admin");

  return response;
}
