import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /*
   * Only run on the admin area: refreshes the session and guards the routes.
   * Public portfolio pages skip the auth network call entirely.
   */
  matcher: ["/admin/:path*"],
};
