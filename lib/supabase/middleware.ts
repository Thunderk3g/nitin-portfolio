import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin-allowlist";
import { missingAdminEnv } from "./env";
import { serverRealtimeOptions } from "./no-realtime";
import {
  readVerifiedUser,
  signVerifiedUser,
  VERIFIED_COOKIE_NAME,
  VERIFIED_SIG_HEADER,
  VERIFIED_USER_HEADER,
} from "./verified-header";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Short fingerprint of current sb-* auth cookies so sign-out invalidates immediately. */
function authCookieFingerprint(request: NextRequest): string {
  const sbCookies = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith("sb-"))
    .map((c) => `${c.name}=${c.value.slice(0, 24)}..${c.value.slice(-16)}`)
    .sort()
    .join("&");
  return sbCookies;
}

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
 *
 * Also forwards an HMAC-signed verification header on the internal request so
 * Server Components and Server Actions on the same request do not repeat the
 * cross-region HTTPS call to Supabase Auth.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";

  // Always strip any incoming internal verification headers from external callers.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(VERIFIED_USER_HEADER);
  requestHeaders.delete(VERIFIED_SIG_HEADER);

  // A deployment without the Supabase settings can't authenticate anyone. Send
  // everything to the login page, which lists what is missing, instead of
  // throwing (Vercel would answer MIDDLEWARE_INVOCATION_FAILED on every route).
  if (missingAdminEnv().length) {
    return isAdminPath && !isLogin
      ? redirectTo(request, "/admin/login", pathname)
      : NextResponse.next({ request: { headers: requestHeaders } });
  }

  let pendingCookies: { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }[] = [];
  let user: User | null = null;
  let fromCache = false;
  const fp = authCookieFingerprint(request);

  // Fast path: if there are no sb-* cookies at all, user is definitely signed out (0ms).
  if (fp) {
    const cachedCookie = request.cookies.get(VERIFIED_COOKIE_NAME)?.value;
    if (cachedCookie) {
      const sep = cachedCookie.lastIndexOf(".");
      if (sep > 0) {
        const cachedPayload = Buffer.from(cachedCookie.slice(0, sep), "base64url").toString("utf8");
        const cachedSig = cachedCookie.slice(sep + 1);
        const verified = await readVerifiedUser(cachedPayload, cachedSig, 120_000, fp);
        if (verified) {
          user = verified;
          fromCache = true;
        }
      }
    }

    if (!user) {
      try {
        const supabase = createServerClient(URL, KEY, {
          realtime: serverRealtimeOptions,
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              pendingCookies = cookiesToSet;
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
    }
  }

  // Authenticated is NOT enough — the user must be on the admin allowlist.
  const admin = isAdminEmail(user?.email);

  if (isAdminPath && !isLogin && !admin) return redirectTo(request, "/admin/login", pathname);
  if (isLogin && admin) return redirectTo(request, "/admin");

  let signedForCookie: { payload: string; signature: string } | null = null;
  if (user && admin) {
    try {
      signedForCookie = await signVerifiedUser(user, fp);
      requestHeaders.set(VERIFIED_USER_HEADER, signedForCookie.payload);
      requestHeaders.set(VERIFIED_SIG_HEADER, signedForCookie.signature);
    } catch {
      // Fallback to standard server check if Web Crypto fails.
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  if (signedForCookie && !fromCache) {
    const encoded = `${Buffer.from(signedForCookie.payload, "utf8").toString("base64url")}.${signedForCookie.signature}`;
    response.cookies.set(VERIFIED_COOKIE_NAME, encoded, {
      httpOnly: true,
      sameSite: "lax",
      path: "/admin",
      maxAge: 120,
    });
  } else if (!admin && request.cookies.has(VERIFIED_COOKIE_NAME)) {
    response.cookies.delete(VERIFIED_COOKIE_NAME);
  }

  return response;
}
