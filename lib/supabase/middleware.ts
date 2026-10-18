import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { serverRealtimeOptions } from "./no-realtime";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Refreshes the Supabase auth session cookie on every request and guards the
 * admin area: unauthenticated requests to /admin/* (except the login page) are
 * redirected to /admin/login.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated is NOT enough — the user must be on the admin allowlist.
  const admin = isAdminEmail(user?.email);

  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";

  if (isAdminPath && !isLogin && !admin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && admin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
